import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  staffProfilesTable,
  clientsTable,
  tasksTable,
  escalationsTable,
  expansionMilestonesTable,
  activityLogTable,
} from "@workspace/db";
import { eq, gte } from "drizzle-orm";
import {
  CreateStaffProfileBody,
  UpdateStaffProfileBody,
} from "@workspace/api-zod";
import { toStaffProfile } from "../lib/mappers";
import { actorOf } from "../middlewares/auth";
import { strParam } from "../lib/http";
import { cadenceStateFor, daysSince, isStalled } from "../lib/priority";

const router: IRouter = Router();

// People who must never appear in the Staff Overview, per product requirement.
// Matched case-insensitively against the first name / full owner label.
const EXCLUDED_NAMES = new Set(["rose", "tony"]);

function isExcluded(name: string): boolean {
  const lower = name.trim().toLowerCase();
  if (!lower) return true;
  if (EXCLUDED_NAMES.has(lower)) return true;
  const first = lower.split(/\s+/)[0] ?? "";
  return EXCLUDED_NAMES.has(first);
}

const DONE_STATUSES = new Set(["done", "completed", "closed", "complete"]);
const isDone = (status: string): boolean =>
  DONE_STATUSES.has(status.trim().toLowerCase());

const OPEN_ESC_STATUSES = new Set(["open", "under review"]);

const windowDaysOf = (req: Request, fallback = 14): number => {
  const raw = Number(req.query["windowDays"]);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
};

interface StaffAccumulator {
  name: string;
  title: string;
  focusArea: string;
  weeklyCapacityHours: number;
  active: boolean;
  clientsOwned: number;
  openTasks: number;
  overdueTasks: number;
  completedTasks: number;
  openEscalations: number;
  touchesDue: number;
  stalledExpansions: number;
  recentActivity: number;
}

function blankAcc(name: string): StaffAccumulator {
  return {
    name,
    title: "",
    focusArea: "",
    weeklyCapacityHours: 40,
    active: true,
    clientsOwned: 0,
    openTasks: 0,
    overdueTasks: 0,
    completedTasks: 0,
    openEscalations: 0,
    touchesDue: 0,
    stalledExpansions: 0,
    recentActivity: 0,
  };
}

router.get("/staff-overview", async (req: Request, res: Response) => {
  const windowDays = windowDaysOf(req);
  const windowStartTs = new Date(Date.now() - windowDays * 86_400_000);
  const today = new Date().toISOString().slice(0, 10);

  const [profiles, clients, tasks, escalations, expansion, activity] =
    await Promise.all([
      db.select().from(staffProfilesTable),
      db.select().from(clientsTable),
      db.select().from(tasksTable),
      db.select().from(escalationsTable),
      db.select().from(expansionMilestonesTable),
      db
        .select()
        .from(activityLogTable)
        .where(gte(activityLogTable.createdAt, windowStartTs)),
    ]);

  const accs = new Map<string, StaffAccumulator>();
  // Case-insensitive label → canonical key resolution so "Gregg" and "gregg"
  // fold together.
  const keyOf = (label: string): string => label.trim().toLowerCase();

  const ensure = (rawName: string): StaffAccumulator | null => {
    const name = rawName.trim();
    if (!name || isExcluded(name)) return null;
    const key = keyOf(name);
    let acc = accs.get(key);
    if (!acc) {
      acc = blankAcc(name);
      accs.set(key, acc);
    }
    return acc;
  };

  // Seed from editable profiles first (they carry the title/capacity/focus and
  // ensure a person shows up even with zero current load).
  for (const p of profiles) {
    if (!p.active) continue;
    const acc = ensure(p.name);
    if (!acc) continue;
    acc.title = p.title;
    acc.focusArea = p.focusArea;
    acc.weeklyCapacityHours = p.weeklyCapacityHours;
    acc.active = p.active;
  }

  for (const c of clients) {
    const acc = ensure(c.nextOwnerLabel);
    if (!acc) continue;
    acc.clientsOwned += 1;
    const last = c.lastMeaningfulContact ?? null;
    const cadence = cadenceStateFor(daysSince(last), c.touchCadenceDays);
    if (cadence === "Overdue") acc.touchesDue += 1;
  }

  for (const t of tasks) {
    const acc = ensure(t.ownerLabel);
    if (!acc) continue;
    if (isDone(t.status)) {
      acc.completedTasks += 1;
    } else {
      acc.openTasks += 1;
      if (t.dueDate && t.dueDate < today) acc.overdueTasks += 1;
    }
  }

  for (const e of escalations) {
    const acc = ensure(e.routedToLabel);
    if (!acc) continue;
    if (OPEN_ESC_STATUSES.has(e.status.trim().toLowerCase())) {
      acc.openEscalations += 1;
    }
  }

  for (const m of expansion) {
    const acc = ensure(m.ownerLabel);
    if (!acc) continue;
    const daysSinceMovement = daysSince(m.lastMovementAt.toISOString());
    if (isStalled(m.status, m.stage, daysSinceMovement)) {
      acc.stalledExpansions += 1;
    }
  }

  for (const a of activity) {
    const acc = ensure(a.actorLabel);
    if (!acc) continue;
    acc.recentActivity += 1;
  }

  const staff = [...accs.values()].map((a) => {
    // Productivity: completed work + active load, dampened by capacity. Higher
    // is more productive. All derived, advisory only.
    const completionBase = a.completedTasks * 6 + a.recentActivity * 2;
    const activeLoad = a.openTasks * 2 + a.clientsOwned * 3;
    const productivityScore = Math.min(
      100,
      Math.round(completionBase + Math.min(40, activeLoad)),
    );

    // Stuck: things that aren't moving — overdue tasks, open escalations,
    // stalled expansion, touches past cadence.
    const stuckScore = Math.min(
      100,
      Math.round(
        a.overdueTasks * 14 +
          a.openEscalations * 16 +
          a.stalledExpansions * 18 +
          a.touchesDue * 6,
      ),
    );

    // Burnout: heavy open load relative to weekly capacity, plus the friction of
    // overdue/escalation pressure with little recent throughput.
    const capacity = a.weeklyCapacityHours > 0 ? a.weeklyCapacityHours : 40;
    const loadUnits = a.openTasks + a.clientsOwned + a.openEscalations * 2;
    const loadRatio = loadUnits / (capacity / 8); // ~1 unit per booked hour-block
    const lowThroughput = a.recentActivity === 0 && a.openTasks > 0 ? 12 : 0;
    const burnoutScore = Math.min(
      100,
      Math.round(loadRatio * 22 + a.overdueTasks * 6 + lowThroughput),
    );

    let status = "Steady";
    if (burnoutScore >= 70 || stuckScore >= 70) status = "At risk";
    else if (burnoutScore >= 45 || stuckScore >= 45) status = "Watch";
    else if (productivityScore >= 60 && stuckScore < 25) status = "Thriving";

    const signals: string[] = [];
    if (a.overdueTasks > 0)
      signals.push(`${a.overdueTasks} overdue task(s)`);
    if (a.openEscalations > 0)
      signals.push(`${a.openEscalations} open escalation(s)`);
    if (a.stalledExpansions > 0)
      signals.push(`${a.stalledExpansions} stalled expansion(s)`);
    if (a.touchesDue > 0)
      signals.push(`${a.touchesDue} relationship touch(es) overdue`);
    if (a.recentActivity === 0 && (a.openTasks > 0 || a.clientsOwned > 0))
      signals.push("No logged activity in window");
    if (burnoutScore >= 70)
      signals.push("Open load is high relative to capacity");
    if (signals.length === 0) signals.push("No blocking signals");

    return {
      name: a.name,
      title: a.title,
      focusArea: a.focusArea,
      weeklyCapacityHours: a.weeklyCapacityHours,
      active: a.active,
      clientsOwned: a.clientsOwned,
      openTasks: a.openTasks,
      overdueTasks: a.overdueTasks,
      completedTasks: a.completedTasks,
      openEscalations: a.openEscalations,
      touchesDue: a.touchesDue,
      stalledExpansions: a.stalledExpansions,
      recentActivity: a.recentActivity,
      productivityScore,
      stuckScore,
      burnoutScore,
      status,
      signals,
    };
  });

  // Most-pressured first so the overview surfaces who needs help.
  staff.sort((x, y) => y.stuckScore + y.burnoutScore - (x.stuckScore + x.burnoutScore));

  res.json({
    windowDays,
    generatedAt: new Date().toISOString(),
    staff,
  });
});

router.get("/staff-profiles", async (_req: Request, res: Response) => {
  const rows = await db.select().from(staffProfilesTable);
  res.json(rows.map(toStaffProfile));
});

router.post("/staff-profiles", async (req: Request, res: Response) => {
  const body = CreateStaffProfileBody.parse(req.body);
  const inserted = await db
    .insert(staffProfilesTable)
    .values({
      name: body.name,
      title: body.title ?? "",
      focusArea: body.focusArea ?? "",
      weeklyCapacityHours: body.weeklyCapacityHours ?? 40,
      active: body.active ?? true,
      notes: body.notes ?? "",
    })
    .returning();
  res.status(201).json(toStaffProfile(inserted[0]!));
});

router.patch("/staff-profiles/:profileId", async (req: Request, res: Response) => {
  const profileId = strParam(req, "profileId");
  const body = UpdateStaffProfileBody.parse(req.body);
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates["name"] = body.name;
  if (body.title !== undefined) updates["title"] = body.title;
  if (body.focusArea !== undefined) updates["focusArea"] = body.focusArea;
  if (body.weeklyCapacityHours !== undefined)
    updates["weeklyCapacityHours"] = body.weeklyCapacityHours;
  if (body.active !== undefined) updates["active"] = body.active;
  if (body.notes !== undefined) updates["notes"] = body.notes;

  if (Object.keys(updates).length === 0) {
    const rows = await db
      .select()
      .from(staffProfilesTable)
      .where(eq(staffProfilesTable.id, profileId))
      .limit(1);
    if (!rows[0]) {
      res.status(404).json({ error: "Staff profile not found" });
      return;
    }
    res.json(toStaffProfile(rows[0]));
    return;
  }

  const updated = await db
    .update(staffProfilesTable)
    .set(updates)
    .where(eq(staffProfilesTable.id, profileId))
    .returning();
  if (!updated[0]) {
    res.status(404).json({ error: "Staff profile not found" });
    return;
  }
  res.json(toStaffProfile(updated[0]));
});

router.delete(
  "/staff-profiles/:profileId",
  async (req: Request, res: Response) => {
    const profileId = strParam(req, "profileId");
    const deleted = await db
      .delete(staffProfilesTable)
      .where(eq(staffProfilesTable.id, profileId))
      .returning();
    if (!deleted[0]) {
      res.status(404).json({ error: "Staff profile not found" });
      return;
    }
    res.json({ ok: true });
  },
);

export default router;
