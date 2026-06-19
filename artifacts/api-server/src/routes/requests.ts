import { Router, type IRouter, type Request, type Response } from "express";
import { db, requestsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { CreateRequestBody, UpdateRequestBody } from "@workspace/api-zod";
import { toRequest } from "../lib/mappers";
import { logActivity } from "../lib/activity";
import { actorOf } from "../middlewares/auth";
import { strParam } from "../lib/http";

const router: IRouter = Router();

// Tracking + routing only — moving a request to "approved" records that
// leadership signed off elsewhere; it does not itself authorize spend.
const ALLOWED_STATUSES = new Set([
  "submitted",
  "in_review",
  "approved",
  "denied",
  "fulfilled",
  "cancelled",
]);

const dateOrNull = (v: string | undefined | null): string | null =>
  v && v.trim() ? v : null;

const toCents = (dollars: number): number => Math.round(dollars * 100);

router.get("/requests", async (req: Request, res: Response) => {
  const type = (req.query["type"] as string | undefined)?.trim();
  const status = (req.query["status"] as string | undefined)?.trim();
  const requestedBy = (req.query["requestedBy"] as string | undefined)?.trim();
  const clientId = (req.query["clientId"] as string | undefined)?.trim();

  const conditions = [];
  if (type) conditions.push(eq(requestsTable.type, type));
  if (status) conditions.push(eq(requestsTable.status, status));
  if (requestedBy)
    conditions.push(eq(requestsTable.requestedByLabel, requestedBy));
  if (clientId) conditions.push(eq(requestsTable.clientId, clientId));

  const rows = await db
    .select()
    .from(requestsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(requestsTable.createdAt));
  res.json(rows.map(toRequest));
});

router.post("/requests", async (req: Request, res: Response) => {
  const body = CreateRequestBody.parse(req.body);
  if (body.amount !== undefined && body.amount !== null && body.amount < 0) {
    res.status(400).json({ error: "Amount must be non-negative" });
    return;
  }
  const actor = actorOf(req);
  const inserted = await db
    .insert(requestsTable)
    .values({
      type: body.type?.trim() || "other",
      title: body.title,
      description: body.description ?? "",
      status: "submitted",
      priority: body.priority?.trim() || "Medium",
      amountCents:
        body.amount !== undefined && body.amount !== null
          ? toCents(body.amount)
          : null,
      clientId: body.clientId ?? null,
      neededBy: dateOrNull(body.neededBy),
      requestedByUserId: actor.id,
      requestedByLabel: actor.label,
      assignedToLabel: body.assignedToLabel ?? "",
    })
    .returning();
  const row = inserted[0]!;

  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "request_created",
    entityType: "request",
    entityId: row.id,
    clientId: row.clientId,
    summary: `Submitted ${row.type} request: ${row.title}`,
    changes: { type: row.type, priority: row.priority },
  });

  res.status(201).json(toRequest(row));
});

router.get("/requests/:requestId", async (req: Request, res: Response) => {
  const requestId = strParam(req, "requestId");
  const rows = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.id, requestId))
    .limit(1);
  if (!rows[0]) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  res.json(toRequest(rows[0]));
});

router.patch("/requests/:requestId", async (req: Request, res: Response) => {
  const requestId = strParam(req, "requestId");
  const body = UpdateRequestBody.parse(req.body);
  if (body.amount !== undefined && body.amount !== null && body.amount < 0) {
    res.status(400).json({ error: "Amount must be non-negative" });
    return;
  }
  if (body.status !== undefined && !ALLOWED_STATUSES.has(body.status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const existingRows = await db
    .select()
    .from(requestsTable)
    .where(eq(requestsTable.id, requestId))
    .limit(1);
  const existing = existingRows[0];
  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (body.type !== undefined) updates["type"] = body.type;
  if (body.title !== undefined) updates["title"] = body.title;
  if (body.description !== undefined) updates["description"] = body.description;
  if (body.status !== undefined) updates["status"] = body.status;
  if (body.priority !== undefined) updates["priority"] = body.priority;
  if (body.amount !== undefined)
    updates["amountCents"] = body.amount === null ? null : toCents(body.amount);
  if (body.clientId !== undefined) updates["clientId"] = body.clientId ?? null;
  if (body.neededBy !== undefined)
    updates["neededBy"] = dateOrNull(body.neededBy);
  if (body.assignedToLabel !== undefined)
    updates["assignedToLabel"] = body.assignedToLabel;
  if (body.resolutionNotes !== undefined)
    updates["resolutionNotes"] = body.resolutionNotes;

  if (Object.keys(updates).length === 0) {
    res.json(toRequest(existing));
    return;
  }

  const updated = await db
    .update(requestsTable)
    .set(updates)
    .where(eq(requestsTable.id, requestId))
    .returning();
  const row = updated[0]!;

  const actor = actorOf(req);
  const statusChanged =
    body.status !== undefined && body.status !== existing.status;
  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: statusChanged ? "request_status_changed" : "request_updated",
    entityType: "request",
    entityId: row.id,
    clientId: row.clientId,
    summary: statusChanged
      ? `Request "${row.title}" moved to ${row.status}`
      : `Updated request "${row.title}"`,
    changes: updates,
  });

  res.json(toRequest(row));
});

router.delete("/requests/:requestId", async (req: Request, res: Response) => {
  const requestId = strParam(req, "requestId");
  const deleted = await db
    .delete(requestsTable)
    .where(eq(requestsTable.id, requestId))
    .returning();
  if (!deleted[0]) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  const actor = actorOf(req);
  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "request_deleted",
    entityType: "request",
    entityId: requestId,
    summary: `Deleted request "${deleted[0].title}"`,
  });
  res.json({ ok: true });
});

export default router;
