import { Router, type IRouter, type Request, type Response } from "express";
import { strParam } from "../lib/http";
import { db, travelPlansTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { CreateTravelPlanBody, UpdateTravelPlanBody } from "@workspace/api-zod";
import { toTravelPlan } from "../lib/mappers";

const router: IRouter = Router();

const dateOrNull = (v: string | undefined | null): string | null =>
  v && v.trim() ? v : null;

router.get("/travel-plans", async (req: Request, res: Response) => {
  const clientId = (req.query["clientId"] as string | undefined)?.trim();
  const status = (req.query["status"] as string | undefined)?.trim();

  const conditions = [];
  if (clientId) conditions.push(eq(travelPlansTable.clientId, clientId));
  if (status) conditions.push(eq(travelPlansTable.status, status));

  const rows = await db
    .select()
    .from(travelPlansTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(travelPlansTable.createdAt));
  res.json(rows.map(toTravelPlan));
});

router.post("/travel-plans", async (req: Request, res: Response) => {
  const body = CreateTravelPlanBody.parse(req.body);
  const inserted = await db
    .insert(travelPlansTable)
    .values({
      clientId: body.clientId ?? null,
      location: body.location,
      reason: body.reason ?? "",
      roiReason: body.roiReason ?? "",
      status: body.status ?? "Proposed",
      startDate: dateOrNull(body.startDate),
      endDate: dateOrNull(body.endDate),
      notes: body.notes ?? "",
      ownerLabel: body.owner ?? "Gregg",
    })
    .returning();
  res.status(201).json(toTravelPlan(inserted[0]!));
});

router.patch("/travel-plans/:planId", async (req: Request, res: Response) => {
  const planId = strParam(req, "planId");
  const body = UpdateTravelPlanBody.parse(req.body);

  const updates: Record<string, unknown> = {};
  if (body.clientId !== undefined) updates["clientId"] = body.clientId ?? null;
  if (body.location !== undefined) updates["location"] = body.location;
  if (body.reason !== undefined) updates["reason"] = body.reason;
  if (body.roiReason !== undefined) updates["roiReason"] = body.roiReason;
  if (body.status !== undefined) updates["status"] = body.status;
  if (body.startDate !== undefined)
    updates["startDate"] = dateOrNull(body.startDate);
  if (body.endDate !== undefined) updates["endDate"] = dateOrNull(body.endDate);
  if (body.notes !== undefined) updates["notes"] = body.notes;
  if (body.owner !== undefined) updates["ownerLabel"] = body.owner;

  const updated = await db
    .update(travelPlansTable)
    .set(updates)
    .where(eq(travelPlansTable.id, planId))
    .returning();
  const row = updated[0];
  if (!row) {
    res.status(404).json({ error: "Travel plan not found" });
    return;
  }
  res.json(toTravelPlan(row));
});

router.delete("/travel-plans/:planId", async (req: Request, res: Response) => {
  const planId = strParam(req, "planId");
  const deleted = await db
    .delete(travelPlansTable)
    .where(eq(travelPlansTable.id, planId))
    .returning();
  if (!deleted[0]) {
    res.status(404).json({ error: "Travel plan not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;
