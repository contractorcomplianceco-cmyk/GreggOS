import { Router, type IRouter, type Request, type Response } from "express";
import { strParam } from "../lib/http";
import { db, profitShareProjectionsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import {
  CreateProfitShareBody,
  UpdateProfitShareBody,
} from "@workspace/api-zod";
import { toProfitShare } from "../lib/mappers";

const router: IRouter = Router();

router.get("/profit-shares", async (_req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(profitShareProjectionsTable)
    .orderBy(desc(profitShareProjectionsTable.createdAt));
  res.json(rows.map(toProfitShare));
});

router.post("/profit-shares", async (req: Request, res: Response) => {
  const body = CreateProfitShareBody.parse(req.body);
  const amount = body.projectedAmount ?? 0;
  if (amount < 0) {
    res.status(400).json({ error: "Projected amount cannot be negative" });
    return;
  }
  const inserted = await db
    .insert(profitShareProjectionsTable)
    .values({
      periodLabel: body.periodLabel,
      basis: body.basis,
      projectedAmountCents: Math.round(amount * 100),
      status: body.status ?? "illustrative",
      notes: body.notes ?? "",
    })
    .returning();
  res.status(201).json(toProfitShare(inserted[0]!));
});

router.patch("/profit-shares/:projectionId", async (req: Request, res: Response) => {
  const projectionId = strParam(req, "projectionId");
  const body = UpdateProfitShareBody.parse(req.body);
  if (body.projectedAmount !== undefined && body.projectedAmount < 0) {
    res.status(400).json({ error: "Projected amount cannot be negative" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (body.periodLabel !== undefined) updates["periodLabel"] = body.periodLabel;
  if (body.basis !== undefined) updates["basis"] = body.basis;
  if (body.projectedAmount !== undefined)
    updates["projectedAmountCents"] = Math.round(body.projectedAmount * 100);
  if (body.status !== undefined) updates["status"] = body.status;
  if (body.notes !== undefined) updates["notes"] = body.notes;

  const updated = await db
    .update(profitShareProjectionsTable)
    .set(updates)
    .where(eq(profitShareProjectionsTable.id, projectionId))
    .returning();
  const row = updated[0];
  if (!row) {
    res.status(404).json({ error: "Projection not found" });
    return;
  }
  res.json(toProfitShare(row));
});

export default router;
