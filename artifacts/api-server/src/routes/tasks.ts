import { Router, type IRouter, type Request, type Response } from "express";
import { db, tasksTable } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import { CreateTaskBody, UpdateTaskBody } from "@workspace/api-zod";
import { toTask } from "../lib/mappers";
import { resolveOwnerUserId } from "../lib/owner";
import { logActivity } from "../lib/activity";
import { actorOf } from "../middlewares/auth";
import { strParam } from "../lib/http";

const router: IRouter = Router();

const dateOrNull = (v: string | undefined | null): string | null =>
  v && v.trim() ? v : null;

router.get("/tasks", async (req: Request, res: Response) => {
  const clientId = (req.query["clientId"] as string | undefined)?.trim();
  const owner = (req.query["owner"] as string | undefined)?.trim();
  const status = (req.query["status"] as string | undefined)?.trim();

  const conditions = [];
  if (clientId) conditions.push(eq(tasksTable.clientId, clientId));
  if (owner) conditions.push(eq(tasksTable.ownerLabel, owner));
  if (status) conditions.push(eq(tasksTable.status, status));

  const rows = await db
    .select()
    .from(tasksTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(tasksTable.createdAt));
  res.json(rows.map(toTask));
});

router.post("/tasks", async (req: Request, res: Response) => {
  const body = CreateTaskBody.parse(req.body);
  const actor = actorOf(req);
  const ownerUserId = await resolveOwnerUserId(body.owner);
  const inserted = await db
    .insert(tasksTable)
    .values({
      clientId: body.clientId,
      title: body.title,
      ownerLabel: body.owner ?? "",
      ownerUserId,
      dueDate: dateOrNull(body.dueDate),
      priority: body.priority ?? "Medium",
      status: body.status ?? "Open",
      escalationFlag: body.escalationFlag ?? false,
      notes: body.notes ?? "",
      createdByUserId: actor.id,
    })
    .returning();
  const row = inserted[0]!;
  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "created",
    entityType: "task",
    entityId: row.id,
    clientId: row.clientId,
    summary: `Created task: ${row.title}`,
  });
  res.status(201).json(toTask(row));
});

router.patch("/tasks/:taskId", async (req: Request, res: Response) => {
  const taskId = strParam(req, "taskId");
  const body = UpdateTaskBody.parse(req.body);
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates["title"] = body.title;
  if (body.owner !== undefined) {
    updates["ownerLabel"] = body.owner;
    updates["ownerUserId"] = await resolveOwnerUserId(body.owner);
  }
  if (body.dueDate !== undefined) updates["dueDate"] = dateOrNull(body.dueDate);
  if (body.priority !== undefined) updates["priority"] = body.priority;
  if (body.status !== undefined) updates["status"] = body.status;
  if (body.escalationFlag !== undefined)
    updates["escalationFlag"] = body.escalationFlag;
  if (body.notes !== undefined) updates["notes"] = body.notes;

  const updated = await db
    .update(tasksTable)
    .set(updates)
    .where(eq(tasksTable.id, taskId))
    .returning();
  if (!updated[0]) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const actor = actorOf(req);
  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "updated",
    entityType: "task",
    entityId: taskId,
    clientId: updated[0].clientId,
    summary: `Updated task: ${updated[0].title}`,
    changes: updates,
  });
  res.json(toTask(updated[0]));
});

export default router;
