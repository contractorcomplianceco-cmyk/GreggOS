import { Router, type IRouter, type Request, type Response } from "express";
import { db, opportunitySignalsTable } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import { UpdateSignalBody } from "@workspace/api-zod";
import { toSignal } from "../lib/mappers";
import { resolveOwnerUserId } from "../lib/owner";
import { logActivity } from "../lib/activity";
import { actorOf } from "../middlewares/auth";
import { strParam } from "../lib/http";

const router: IRouter = Router();

router.get("/opportunity-signals", async (req: Request, res: Response) => {
  const clientId = (req.query["clientId"] as string | undefined)?.trim();
  const status = (req.query["status"] as string | undefined)?.trim();

  const conditions = [];
  if (clientId) conditions.push(eq(opportunitySignalsTable.clientId, clientId));
  if (status) conditions.push(eq(opportunitySignalsTable.status, status));

  const rows = await db
    .select()
    .from(opportunitySignalsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(opportunitySignalsTable.createdAt));
  res.json(rows.map(toSignal));
});

router.patch(
  "/opportunity-signals/:signalId",
  async (req: Request, res: Response) => {
    const signalId = strParam(req, "signalId");
    const body = UpdateSignalBody.parse(req.body);
    const updates: Record<string, unknown> = {};
    if (body.type !== undefined) updates["type"] = body.type;
    if (body.description !== undefined)
      updates["description"] = body.description;
    if (body.status !== undefined) updates["status"] = body.status;
    if (body.routedTo !== undefined) {
      updates["routedToLabel"] = body.routedTo;
      updates["routedToUserId"] = await resolveOwnerUserId(body.routedTo);
    }
    const updated = await db
      .update(opportunitySignalsTable)
      .set(updates)
      .where(eq(opportunitySignalsTable.id, signalId))
      .returning();
    if (!updated[0]) {
      res.status(404).json({ error: "Signal not found" });
      return;
    }
    const actor = actorOf(req);
    await logActivity(db, {
      actorUserId: actor.id,
      actorLabel: actor.label,
      action: "updated",
      entityType: "opportunity_signal",
      entityId: signalId,
      clientId: updated[0].clientId,
      summary: "Updated opportunity signal",
      changes: updates,
    });
    res.json(toSignal(updated[0]));
  },
);

export default router;
