import { Router, type IRouter, type Request, type Response } from "express";
import { strParam } from "../lib/http";
import { db, qualifiersTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { CreateQualifierBody, UpdateQualifierBody } from "@workspace/api-zod";
import { toQualifier } from "../lib/mappers";

const router: IRouter = Router();

router.get("/qualifiers", async (req: Request, res: Response) => {
  const status = (req.query["status"] as string | undefined)?.trim();
  const availability = (req.query["availability"] as string | undefined)?.trim();

  const conditions = [];
  if (status) conditions.push(eq(qualifiersTable.status, status));
  if (availability) conditions.push(eq(qualifiersTable.availability, availability));

  const rows = await db
    .select()
    .from(qualifiersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(qualifiersTable.createdAt));
  res.json(rows.map(toQualifier));
});

router.post("/qualifiers", async (req: Request, res: Response) => {
  const body = CreateQualifierBody.parse(req.body);
  const inserted = await db
    .insert(qualifiersTable)
    .values({
      name: body.name,
      licenseType: body.licenseType ?? "",
      state: body.state ?? "",
      tradeClassification: body.tradeClassification ?? "",
      availability: body.availability ?? "available",
      status: body.status ?? "prospect",
      contact: body.contact ?? "",
      notes: body.notes ?? "",
    })
    .returning();
  res.status(201).json(toQualifier(inserted[0]!));
});

router.patch("/qualifiers/:qualifierId", async (req: Request, res: Response) => {
  const qualifierId = strParam(req, "qualifierId");
  const body = UpdateQualifierBody.parse(req.body);

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates["name"] = body.name;
  if (body.licenseType !== undefined) updates["licenseType"] = body.licenseType;
  if (body.state !== undefined) updates["state"] = body.state;
  if (body.tradeClassification !== undefined)
    updates["tradeClassification"] = body.tradeClassification;
  if (body.availability !== undefined) updates["availability"] = body.availability;
  if (body.status !== undefined) updates["status"] = body.status;
  if (body.contact !== undefined) updates["contact"] = body.contact;
  if (body.notes !== undefined) updates["notes"] = body.notes;

  const updated = await db
    .update(qualifiersTable)
    .set(updates)
    .where(eq(qualifiersTable.id, qualifierId))
    .returning();
  const row = updated[0];
  if (!row) {
    res.status(404).json({ error: "Qualifier not found" });
    return;
  }
  res.json(toQualifier(row));
});

export default router;
