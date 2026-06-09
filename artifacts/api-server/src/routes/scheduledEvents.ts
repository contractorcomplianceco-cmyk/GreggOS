import { Router, type IRouter, type Request, type Response } from "express";
import { strParam } from "../lib/http";
import { db, scheduledEventsTable } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import {
  CreateScheduledEventBody,
  UpdateScheduledEventBody,
} from "@workspace/api-zod";
import { toEvent } from "../lib/mappers";
import { logActivity } from "../lib/activity";
import { actorOf } from "../middlewares/auth";

const router: IRouter = Router();

const dateOrNull = (v: string | undefined | null): string | null =>
  v && v.trim() ? v : null;

router.get("/scheduled-events", async (req: Request, res: Response) => {
  const clientId = (req.query["clientId"] as string | undefined)?.trim();
  const owner = (req.query["owner"] as string | undefined)?.trim();

  const conditions = [];
  if (clientId) conditions.push(eq(scheduledEventsTable.clientId, clientId));
  if (owner) conditions.push(eq(scheduledEventsTable.ownerLabel, owner));

  const rows = await db
    .select()
    .from(scheduledEventsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(scheduledEventsTable.date));
  res.json(rows.map(toEvent));
});

router.post("/scheduled-events", async (req: Request, res: Response) => {
  const body = CreateScheduledEventBody.parse(req.body);
  const inserted = await db
    .insert(scheduledEventsTable)
    .values({
      clientId: body.clientId,
      title: body.title,
      type: body.type,
      date: dateOrNull(body.date),
      time: dateOrNull(body.time),
      attendees: body.attendees ?? "",
      withClient: body.withClient ?? false,
      status: body.status ?? "Planned",
      ownerLabel: body.owner ?? "",
    })
    .returning();
  const row = inserted[0]!;
  const actor = actorOf(req);
  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "created",
    entityType: "event",
    entityId: row.id,
    clientId: row.clientId,
    summary: `Scheduled ${row.type}: ${row.title}`,
  });
  res.status(201).json(toEvent(row));
});

router.patch(
  "/scheduled-events/:eventId",
  async (req: Request, res: Response) => {
    const eventId = strParam(req, "eventId");
    const body = UpdateScheduledEventBody.parse(req.body);

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates["title"] = body.title;
    if (body.type !== undefined) updates["type"] = body.type;
    if (body.date !== undefined) updates["date"] = dateOrNull(body.date);
    if (body.time !== undefined) updates["time"] = dateOrNull(body.time);
    if (body.attendees !== undefined) updates["attendees"] = body.attendees;
    if (body.withClient !== undefined) updates["withClient"] = body.withClient;
    if (body.status !== undefined) updates["status"] = body.status;
    if (body.owner !== undefined) updates["ownerLabel"] = body.owner;

    const updated = await db
      .update(scheduledEventsTable)
      .set(updates)
      .where(eq(scheduledEventsTable.id, eventId))
      .returning();
    const row = updated[0];
    if (!row) {
      res.status(404).json({ error: "Scheduled event not found" });
      return;
    }
    const actor = actorOf(req);
    await logActivity(db, {
      actorUserId: actor.id,
      actorLabel: actor.label,
      action: "updated",
      entityType: "event",
      entityId: row.id,
      clientId: row.clientId,
      summary: `Updated ${row.type}: ${row.title}`,
      changes: updates,
    });
    res.json(toEvent(row));
  },
);

export default router;
