import { Router, type IRouter, type Request, type Response } from "express";
import { db, escalationsTable } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import { UpdateEscalationBody } from "@workspace/api-zod";
import { toEscalation } from "../lib/mappers";
import { resolveOwnerUserId } from "../lib/owner";
import { logActivity } from "../lib/activity";
import { actorOf } from "../middlewares/auth";
import { strParam } from "../lib/http";

const router: IRouter = Router();

const dateOrNull = (v: string | undefined | null): string | null =>
  v && v.trim() ? v : null;

router.get("/escalations", async (req: Request, res: Response) => {
  const clientId = (req.query["clientId"] as string | undefined)?.trim();
  const status = (req.query["status"] as string | undefined)?.trim();

  const conditions = [];
  if (clientId) conditions.push(eq(escalationsTable.clientId, clientId));
  if (status) conditions.push(eq(escalationsTable.status, status));

  const rows = await db
    .select()
    .from(escalationsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(escalationsTable.createdAt));
  res.json(rows.map(toEscalation));
});

router.patch(
  "/escalations/:escalationId",
  async (req: Request, res: Response) => {
    const escalationId = strParam(req, "escalationId");
    const body = UpdateEscalationBody.parse(req.body);
    const updates: Record<string, unknown> = {};
    if (body.reason !== undefined) updates["reason"] = body.reason;
    if (body.riskLevel !== undefined) updates["riskLevel"] = body.riskLevel;
    if (body.routedTo !== undefined) {
      updates["routedToLabel"] = body.routedTo;
      updates["routedToUserId"] = await resolveOwnerUserId(body.routedTo);
    }
    if (body.decisionNeeded !== undefined)
      updates["decisionNeeded"] = body.decisionNeeded;
    if (body.deadline !== undefined)
      updates["deadline"] = dateOrNull(body.deadline);
    if (body.status !== undefined) updates["status"] = body.status;

    const updated = await db
      .update(escalationsTable)
      .set(updates)
      .where(eq(escalationsTable.id, escalationId))
      .returning();
    if (!updated[0]) {
      res.status(404).json({ error: "Escalation not found" });
      return;
    }
    const actor = actorOf(req);
    await logActivity(db, {
      actorUserId: actor.id,
      actorLabel: actor.label,
      action: "updated",
      entityType: "escalation",
      entityId: escalationId,
      clientId: updated[0].clientId,
      summary: "Updated escalation",
      changes: updates,
    });
    res.json(toEscalation(updated[0]));
  },
);

export default router;
