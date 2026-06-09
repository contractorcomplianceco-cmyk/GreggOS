import { Router, type IRouter, type Request, type Response } from "express";
import { strParam } from "../lib/http";
import {
  db,
  clientsTable,
  expansionMilestonesTable,
  contactLogTable,
} from "@workspace/db";
import { and, eq, max } from "drizzle-orm";
import {
  CreateExpansionMilestoneBody,
  UpdateExpansionMilestoneBody,
} from "@workspace/api-zod";
import { toExpansion } from "../lib/mappers";
import { resolveOwnerUserId } from "../lib/owner";
import { logActivity } from "../lib/activity";
import { actorOf } from "../middlewares/auth";
import {
  daysSince,
  isStalled,
  priorityScore,
  warmthFor,
} from "../lib/priority";

const router: IRouter = Router();

const dateOrNull = (v: string | undefined | null): string | null =>
  v && v.trim() ? v : null;

const isTara = (label: string): boolean =>
  label.trim().toLowerCase() === "tara";

router.get("/expansion-pipeline", async (req: Request, res: Response) => {
  const owner = (req.query["owner"] as string | undefined)?.trim();
  const stage = (req.query["stage"] as string | undefined)?.trim();
  const sharedRaw = (req.query["sharedWithTara"] as string | undefined)?.trim();
  const sharedWithTaraFilter =
    sharedRaw === "true" ? true : sharedRaw === "false" ? false : undefined;

  // The pipeline is a board of active opportunities; closed/won/lost milestones
  // drop off it (and out of scoring) once their status moves away from "Open".
  const conditions = [eq(expansionMilestonesTable.status, "Open")];
  if (owner) conditions.push(eq(expansionMilestonesTable.ownerLabel, owner));
  if (stage) conditions.push(eq(expansionMilestonesTable.stage, stage));

  const rows = await db
    .select({
      milestone: expansionMilestonesTable,
      client: clientsTable,
    })
    .from(expansionMilestonesTable)
    .innerJoin(
      clientsTable,
      eq(expansionMilestonesTable.clientId, clientsTable.id),
    )
    .where(conditions.length ? and(...conditions) : undefined);

  // Last meaningful touch per client (max contact-log date) to derive warmth.
  const touchRows = await db
    .select({
      clientId: contactLogTable.clientId,
      lastDate: max(contactLogTable.date),
    })
    .from(contactLogTable)
    .groupBy(contactLogTable.clientId);
  const lastTouchByClient = new Map<string, string | null>();
  for (const t of touchRows) lastTouchByClient.set(t.clientId, t.lastDate);

  const opportunities = rows
    .map(({ milestone, client }) => {
      const sharedWithTara =
        isTara(client.coOwnerLabel) ||
        isTara(client.nextOwnerLabel) ||
        isTara(milestone.ownerLabel);
      const lastTouch =
        lastTouchByClient.get(client.id) ?? client.lastMeaningfulContact;
      const daysSinceTouch = daysSince(lastTouch);
      const warmth = warmthFor(daysSinceTouch, client.touchCadenceDays);
      const daysSinceMovement = daysSince(milestone.lastMovementAt.toISOString());
      return {
        milestone: toExpansion(milestone),
        clientName: client.clientName,
        companyName: client.companyName,
        riskLevel: client.riskLevel,
        priorityScore: priorityScore({
          potentialValue: milestone.potentialValue,
          stage: milestone.stage,
          targetDate: milestone.targetDate,
          riskLevel: client.riskLevel,
          warmth,
          priorityBoost: milestone.priorityBoost,
        }),
        stalled: isStalled(
          milestone.status,
          milestone.stage,
          daysSinceMovement,
        ),
        daysSinceMovement: daysSinceMovement ?? 0,
        sharedWithTara,
      };
    })
    .filter((o) =>
      sharedWithTaraFilter === undefined
        ? true
        : o.sharedWithTara === sharedWithTaraFilter,
    )
    .sort((a, b) => {
      // Pinned milestones float to the top, then by composite priority.
      if (a.milestone.pinned !== b.milestone.pinned)
        return a.milestone.pinned ? -1 : 1;
      return b.priorityScore - a.priorityScore;
    });

  res.json(opportunities);
});

router.post("/expansion-milestones", async (req: Request, res: Response) => {
  const body = CreateExpansionMilestoneBody.parse(req.body);
  const ownerUserId = await resolveOwnerUserId(body.owner);
  const inserted = await db
    .insert(expansionMilestonesTable)
    .values({
      clientId: body.clientId,
      title: body.title,
      stage: body.stage,
      status: body.status ?? "Open",
      potentialValue: body.potentialValue ?? 0,
      targetDate: dateOrNull(body.targetDate),
      description: body.description ?? "",
      ownerLabel: body.owner ?? "",
      ownerUserId,
      pinned: body.pinned ?? false,
      priorityBoost: body.priorityBoost ?? 0,
    })
    .returning();
  const row = inserted[0]!;
  const actor = actorOf(req);
  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "created",
    entityType: "expansion",
    entityId: row.id,
    clientId: row.clientId,
    summary: `Opened expansion opportunity ${row.title}`,
  });
  res.status(201).json(toExpansion(row));
});

router.patch(
  "/expansion-milestones/:milestoneId",
  async (req: Request, res: Response) => {
    const milestoneId = strParam(req, "milestoneId");
    const body = UpdateExpansionMilestoneBody.parse(req.body);

    const existingRows = await db
      .select()
      .from(expansionMilestonesTable)
      .where(eq(expansionMilestonesTable.id, milestoneId))
      .limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: "Expansion milestone not found" });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates["title"] = body.title;
    if (body.stage !== undefined) updates["stage"] = body.stage;
    if (body.status !== undefined) updates["status"] = body.status;
    if (body.potentialValue !== undefined)
      updates["potentialValue"] = body.potentialValue;
    if (body.targetDate !== undefined)
      updates["targetDate"] = dateOrNull(body.targetDate);
    if (body.description !== undefined)
      updates["description"] = body.description;
    if (body.owner !== undefined) {
      updates["ownerLabel"] = body.owner;
      updates["ownerUserId"] = await resolveOwnerUserId(body.owner);
    }
    if (body.pinned !== undefined) updates["pinned"] = body.pinned;
    if (body.priorityBoost !== undefined)
      updates["priorityBoost"] = body.priorityBoost;

    // Stage or status movement resets the "stalled" clock.
    if (
      (body.stage !== undefined && body.stage !== existing.stage) ||
      (body.status !== undefined && body.status !== existing.status)
    ) {
      updates["lastMovementAt"] = new Date();
    }

    const updated = await db
      .update(expansionMilestonesTable)
      .set(updates)
      .where(eq(expansionMilestonesTable.id, milestoneId))
      .returning();
    const row = updated[0]!;
    const actor = actorOf(req);
    await logActivity(db, {
      actorUserId: actor.id,
      actorLabel: actor.label,
      action: "updated",
      entityType: "expansion",
      entityId: row.id,
      clientId: row.clientId,
      summary: `Updated expansion opportunity ${row.title}`,
      changes: updates,
    });
    res.json(toExpansion(row));
  },
);

export default router;
