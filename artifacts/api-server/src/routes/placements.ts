import { Router, type IRouter, type Request, type Response } from "express";
import { strParam } from "../lib/http";
import { db, placementsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { CreatePlacementBody, UpdatePlacementBody } from "@workspace/api-zod";
import { toPlacement } from "../lib/mappers";

const router: IRouter = Router();

router.get("/placements", async (req: Request, res: Response) => {
  const stage = (req.query["stage"] as string | undefined)?.trim();
  const status = (req.query["status"] as string | undefined)?.trim();

  const conditions = [];
  if (stage) conditions.push(eq(placementsTable.stage, stage));
  if (status) conditions.push(eq(placementsTable.status, status));

  const rows = await db
    .select()
    .from(placementsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(placementsTable.createdAt));
  res.json(rows.map(toPlacement));
});

router.post("/placements", async (req: Request, res: Response) => {
  const body = CreatePlacementBody.parse(req.body);
  const inserted = await db
    .insert(placementsTable)
    .values({
      clientId: body.clientId ?? null,
      qualifierId: body.qualifierId ?? null,
      title: body.title,
      licenseType: body.licenseType ?? "",
      state: body.state ?? "",
      tradeClassification: body.tradeClassification ?? "",
      stage: body.stage ?? "interest",
      status: body.status ?? "open",
      timeline: body.timeline ?? "",
      budget: body.budget ?? "",
      expectations: body.expectations ?? "",
      riskFlags: body.riskFlags ?? "",
      nextStep: body.nextStep ?? "",
      missingInfo: body.missingInfo ?? "",
      targetDate: body.targetDate ?? null,
    })
    .returning();
  res.status(201).json(toPlacement(inserted[0]!));
});

router.patch("/placements/:placementId", async (req: Request, res: Response) => {
  const placementId = strParam(req, "placementId");
  const body = UpdatePlacementBody.parse(req.body);

  const updates: Record<string, unknown> = {};
  if (body.clientId !== undefined) updates["clientId"] = body.clientId ?? null;
  if (body.qualifierId !== undefined)
    updates["qualifierId"] = body.qualifierId ?? null;
  if (body.title !== undefined) updates["title"] = body.title;
  if (body.licenseType !== undefined) updates["licenseType"] = body.licenseType;
  if (body.state !== undefined) updates["state"] = body.state;
  if (body.tradeClassification !== undefined)
    updates["tradeClassification"] = body.tradeClassification;
  if (body.stage !== undefined) updates["stage"] = body.stage;
  if (body.status !== undefined) updates["status"] = body.status;
  if (body.timeline !== undefined) updates["timeline"] = body.timeline;
  if (body.budget !== undefined) updates["budget"] = body.budget;
  if (body.expectations !== undefined) updates["expectations"] = body.expectations;
  if (body.riskFlags !== undefined) updates["riskFlags"] = body.riskFlags;
  if (body.nextStep !== undefined) updates["nextStep"] = body.nextStep;
  if (body.missingInfo !== undefined) updates["missingInfo"] = body.missingInfo;
  if (body.targetDate !== undefined) updates["targetDate"] = body.targetDate ?? null;

  const updated = await db
    .update(placementsTable)
    .set(updates)
    .where(eq(placementsTable.id, placementId))
    .returning();
  const row = updated[0];
  if (!row) {
    res.status(404).json({ error: "Placement not found" });
    return;
  }
  res.json(toPlacement(row));
});

export default router;
