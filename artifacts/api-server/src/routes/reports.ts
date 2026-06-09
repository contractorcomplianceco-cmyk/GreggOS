import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  clientsTable,
  contactLogTable,
  scheduledEventsTable,
  expansionMilestonesTable,
  tasksTable,
  activityLogTable,
} from "@workspace/db";
import { and, eq, gte, max, sql } from "drizzle-orm";
import {
  cadenceStateFor,
  daysSince,
  isStalled,
  warmthFor,
  type Warmth,
} from "../lib/priority";
import type {
  RelationshipReport,
  ExpansionReport,
  ActivityReport,
} from "@workspace/api-zod";

const router: IRouter = Router();

const isTara = (label: string): boolean =>
  label.trim().toLowerCase() === "tara";

const windowDaysOf = (req: Request, fallback = 30): number => {
  const raw = Number(req.query["windowDays"]);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
};

const windowStartString = (days: number): string =>
  new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

const DONE_STATUSES = new Set(["done", "completed", "closed", "complete"]);
const isDone = (status: string): boolean =>
  DONE_STATUSES.has(status.trim().toLowerCase());

router.get(
  "/reports/relationships",
  async (req: Request, res: Response) => {
    const windowDays = windowDaysOf(req);
    const windowStart = windowStartString(windowDays);

    const [clients, touchRows, eventRows] = await Promise.all([
      db.select().from(clientsTable),
      db
        .select({
          clientId: contactLogTable.clientId,
          lastDate: max(contactLogTable.date),
        })
        .from(contactLogTable)
        .groupBy(contactLogTable.clientId),
      db
        .select()
        .from(scheduledEventsTable)
        .where(gte(scheduledEventsTable.date, windowStart)),
    ]);

    const lastTouchByClient = new Map<string, string | null>();
    for (const t of touchRows) lastTouchByClient.set(t.clientId, t.lastDate);

    let visitsCompleted = 0;
    let mealsCompleted = 0;
    for (const e of eventRows) {
      if (!isDone(e.status)) continue;
      const type = e.type.trim().toLowerCase();
      if (type.includes("visit")) visitsCompleted += 1;
      else if (type.includes("meal")) mealsCompleted += 1;
    }

    const warmthCounts = new Map<string, number>();
    const ownerAgg = new Map<
      string,
      { clients: number; touchesDue: number; goingCold: number }
    >();

    let touchesDue = 0;
    let goingCold = 0;
    let onCadence = 0;
    let taraSharedAccounts = 0;

    for (const c of clients) {
      const lastTouch =
        lastTouchByClient.get(c.id) ?? c.lastMeaningfulContact ?? null;
      const daysSinceTouch = daysSince(lastTouch);
      const warmth: Warmth = warmthFor(daysSinceTouch, c.touchCadenceDays);
      const cadence = cadenceStateFor(daysSinceTouch, c.touchCadenceDays);

      warmthCounts.set(warmth, (warmthCounts.get(warmth) ?? 0) + 1);

      const due = cadence === "Overdue";
      // "Going cold" = slipping past cadence (Cooling or Cold), the actionable set.
      const cold = warmth === "Cooling" || warmth === "Cold";
      if (due) touchesDue += 1;
      else onCadence += 1;
      if (cold) goingCold += 1;

      const shared = isTara(c.coOwnerLabel) || isTara(c.nextOwnerLabel);
      if (shared) taraSharedAccounts += 1;

      const ownerKey = c.nextOwnerLabel || "Unassigned";
      const agg = ownerAgg.get(ownerKey) ?? {
        clients: 0,
        touchesDue: 0,
        goingCold: 0,
      };
      agg.clients += 1;
      if (due) agg.touchesDue += 1;
      if (cold) agg.goingCold += 1;
      ownerAgg.set(ownerKey, agg);
    }

    const totalClients = clients.length;
    const cadenceAdherencePct =
      totalClients > 0 ? Math.round((onCadence / totalClients) * 1000) / 10 : 0;

    const report: RelationshipReport = {
      windowDays,
      totalClients,
      touchesDue,
      goingCold,
      visitsCompleted,
      mealsCompleted,
      cadenceAdherencePct,
      taraSharedAccounts,
      byWarmth: [...warmthCounts.entries()].map(([warmth, count]) => ({
        warmth,
        count,
      })),
      byOwner: [...ownerAgg.entries()].map(([owner, v]) => ({
        owner,
        clients: v.clients,
        touchesDue: v.touchesDue,
        goingCold: v.goingCold,
      })),
    };

    res.json(report);
  },
);

router.get("/reports/expansion", async (_req: Request, res: Response) => {
  const rows = await db
    .select({ m: expansionMilestonesTable, client: clientsTable })
    .from(expansionMilestonesTable)
    .innerJoin(
      clientsTable,
      eq(expansionMilestonesTable.clientId, clientsTable.id),
    );

  let openCount = 0;
  let wonCount = 0;
  let lostCount = 0;
  let stalledCount = 0;
  let pipelineValue = 0;
  let convertedRevenue = 0;
  let taraSharedOpenCount = 0;
  let taraSharedPipelineValue = 0;
  let taraSharedConvertedRevenue = 0;

  const stageAgg = new Map<string, { count: number; value: number }>();
  const ownerAgg = new Map<
    string,
    {
      openCount: number;
      pipelineValue: number;
      wonCount: number;
      convertedRevenue: number;
    }
  >();

  for (const { m, client } of rows) {
    const status = m.status.trim().toLowerCase();
    const shared =
      isTara(client.coOwnerLabel) ||
      isTara(client.nextOwnerLabel) ||
      isTara(m.ownerLabel);
    const ownerKey = m.ownerLabel || "Unassigned";
    const agg = ownerAgg.get(ownerKey) ?? {
      openCount: 0,
      pipelineValue: 0,
      wonCount: 0,
      convertedRevenue: 0,
    };

    if (status === "open") {
      openCount += 1;
      pipelineValue += m.potentialValue;
      agg.openCount += 1;
      agg.pipelineValue += m.potentialValue;

      const stg = stageAgg.get(m.stage) ?? { count: 0, value: 0 };
      stg.count += 1;
      stg.value += m.potentialValue;
      stageAgg.set(m.stage, stg);

      const daysSinceMovement = daysSince(m.lastMovementAt.toISOString());
      if (isStalled(m.status, m.stage, daysSinceMovement)) stalledCount += 1;

      if (shared) {
        taraSharedOpenCount += 1;
        taraSharedPipelineValue += m.potentialValue;
      }
    } else if (status === "won") {
      wonCount += 1;
      convertedRevenue += m.actualValue;
      agg.wonCount += 1;
      agg.convertedRevenue += m.actualValue;
      if (shared) taraSharedConvertedRevenue += m.actualValue;
    } else if (status === "lost") {
      lostCount += 1;
    }

    ownerAgg.set(ownerKey, agg);
  }

  const closed = wonCount + lostCount;
  const winRatePct = closed > 0 ? Math.round((wonCount / closed) * 1000) / 10 : 0;

  const report: ExpansionReport = {
    openCount,
    wonCount,
    lostCount,
    stalledCount,
    pipelineValue,
    convertedRevenue,
    winRatePct,
    taraSharedOpenCount,
    taraSharedPipelineValue,
    taraSharedConvertedRevenue,
    byStage: [...stageAgg.entries()].map(([stage, v]) => ({
      stage,
      count: v.count,
      value: v.value,
    })),
    byOwner: [...ownerAgg.entries()].map(([owner, v]) => ({
      owner,
      openCount: v.openCount,
      pipelineValue: v.pipelineValue,
      wonCount: v.wonCount,
      convertedRevenue: v.convertedRevenue,
    })),
  };

  res.json(report);
});

router.get("/reports/activity", async (req: Request, res: Response) => {
  const windowDays = windowDaysOf(req);
  const windowStart = windowStartString(windowDays);
  const windowStartTs = new Date(Date.now() - windowDays * 86_400_000);
  const today = new Date().toISOString().slice(0, 10);

  const [taskRows, touchCountRows, handoffCountRows] = await Promise.all([
    db.select().from(tasksTable),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(contactLogTable)
      .where(gte(contactLogTable.date, windowStart)),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(activityLogTable)
      .where(
        and(
          eq(activityLogTable.action, "handoff"),
          gte(activityLogTable.createdAt, windowStartTs),
        ),
      ),
  ]);

  let openTasks = 0;
  let completedTasks = 0;
  let overdueTasks = 0;
  for (const t of taskRows) {
    if (isDone(t.status)) {
      completedTasks += 1;
    } else {
      openTasks += 1;
      if (t.dueDate && t.dueDate < today) overdueTasks += 1;
    }
  }

  const totalResolved = openTasks + completedTasks;
  const followUpCompletionPct =
    totalResolved > 0
      ? Math.round((completedTasks / totalResolved) * 1000) / 10
      : 0;

  const report: ActivityReport = {
    windowDays,
    openTasks,
    completedTasks,
    overdueTasks,
    followUpCompletionPct,
    touchesLogged: touchCountRows[0]?.c ?? 0,
    handoffs: handoffCountRows[0]?.c ?? 0,
  };

  res.json(report);
});

export default router;
