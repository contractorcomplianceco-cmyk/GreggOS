import { Router, type IRouter, type Request, type Response } from "express";
import { strParam } from "../lib/http";
import { db, successPlanItemsTable } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import {
  CreateSuccessPlanItemBody,
  UpdateSuccessPlanItemBody,
} from "@workspace/api-zod";
import { toSuccessPlanItem } from "../lib/mappers";

const router: IRouter = Router();

router.get("/success-plan-items", async (req: Request, res: Response) => {
  const phase = (req.query["phase"] as string | undefined)?.trim();

  const conditions = [];
  if (phase) conditions.push(eq(successPlanItemsTable.phase, phase));

  const rows = await db
    .select()
    .from(successPlanItemsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(successPlanItemsTable.sortOrder));
  res.json(rows.map(toSuccessPlanItem));
});

router.post("/success-plan-items", async (req: Request, res: Response) => {
  const body = CreateSuccessPlanItemBody.parse(req.body);
  const inserted = await db
    .insert(successPlanItemsTable)
    .values({
      phase: body.phase,
      title: body.title,
      description: body.description ?? "",
      notes: body.notes ?? "",
      sortOrder: body.sortOrder ?? 0,
    })
    .returning();
  res.status(201).json(toSuccessPlanItem(inserted[0]!));
});

router.patch("/success-plan-items/:itemId", async (req: Request, res: Response) => {
  const itemId = strParam(req, "itemId");
  const body = UpdateSuccessPlanItemBody.parse(req.body);

  const updates: Record<string, unknown> = {};
  if (body.phase !== undefined) updates["phase"] = body.phase;
  if (body.title !== undefined) updates["title"] = body.title;
  if (body.description !== undefined) updates["description"] = body.description;
  if (body.notes !== undefined) updates["notes"] = body.notes;
  if (body.sortOrder !== undefined) updates["sortOrder"] = body.sortOrder;
  if (body.completed !== undefined) {
    updates["completed"] = body.completed;
    updates["completedAt"] = body.completed ? new Date() : null;
  }

  const updated = await db
    .update(successPlanItemsTable)
    .set(updates)
    .where(eq(successPlanItemsTable.id, itemId))
    .returning();
  const row = updated[0];
  if (!row) {
    res.status(404).json({ error: "Success plan item not found" });
    return;
  }
  res.json(toSuccessPlanItem(row));
});

export default router;
