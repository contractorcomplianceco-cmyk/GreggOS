import { Router, type IRouter, type Request, type Response } from "express";
import { strParam } from "../lib/http";
import { db, bonusEntriesTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { CreateBonusEntryBody, UpdateBonusEntryBody } from "@workspace/api-zod";
import { toBonusEntry } from "../lib/mappers";
import { actorOf } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/bonus-entries", async (req: Request, res: Response) => {
  const category = (req.query["category"] as string | undefined)?.trim();
  const status = (req.query["status"] as string | undefined)?.trim();

  const conditions = [];
  if (category) conditions.push(eq(bonusEntriesTable.category, category));
  if (status) conditions.push(eq(bonusEntriesTable.status, status));

  const rows = await db
    .select()
    .from(bonusEntriesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(bonusEntriesTable.createdAt));
  res.json(rows.map(toBonusEntry));
});

router.post("/bonus-entries", async (req: Request, res: Response) => {
  const body = CreateBonusEntryBody.parse(req.body);
  if (body.amount < 0) {
    res.status(400).json({ error: "Amount cannot be negative" });
    return;
  }
  const actor = actorOf(req);
  const inserted = await db
    .insert(bonusEntriesTable)
    .values({
      category: body.category,
      title: body.title,
      clientId: body.clientId ?? null,
      amountCents: Math.round(body.amount * 100),
      status: body.status ?? "eligible",
      periodLabel: body.periodLabel ?? "",
      documentation: body.documentation ?? "",
      notes: body.notes ?? "",
      occurredOn: body.occurredOn ?? null,
      createdByUserId: actor.id,
      createdByLabel: actor.label,
    })
    .returning();
  res.status(201).json(toBonusEntry(inserted[0]!));
});

router.patch("/bonus-entries/:bonusEntryId", async (req: Request, res: Response) => {
  const bonusEntryId = strParam(req, "bonusEntryId");
  const body = UpdateBonusEntryBody.parse(req.body);
  if (body.amount !== undefined && body.amount < 0) {
    res.status(400).json({ error: "Amount cannot be negative" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (body.category !== undefined) updates["category"] = body.category;
  if (body.title !== undefined) updates["title"] = body.title;
  if (body.clientId !== undefined) updates["clientId"] = body.clientId ?? null;
  if (body.amount !== undefined) updates["amountCents"] = Math.round(body.amount * 100);
  if (body.status !== undefined) updates["status"] = body.status;
  if (body.periodLabel !== undefined) updates["periodLabel"] = body.periodLabel;
  if (body.documentation !== undefined) updates["documentation"] = body.documentation;
  if (body.notes !== undefined) updates["notes"] = body.notes;
  if (body.occurredOn !== undefined) updates["occurredOn"] = body.occurredOn ?? null;

  const updated = await db
    .update(bonusEntriesTable)
    .set(updates)
    .where(eq(bonusEntriesTable.id, bonusEntryId))
    .returning();
  const row = updated[0];
  if (!row) {
    res.status(404).json({ error: "Bonus entry not found" });
    return;
  }
  res.json(toBonusEntry(row));
});

export default router;
