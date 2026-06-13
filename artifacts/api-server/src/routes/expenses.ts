import { Router, type IRouter, type Request, type Response } from "express";
import { strParam } from "../lib/http";
import { db, expensesTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { CreateExpenseBody, UpdateExpenseBody } from "@workspace/api-zod";
import { toExpense } from "../lib/mappers";

const router: IRouter = Router();

const dateOrNull = (v: string | undefined | null): string | null =>
  v && v.trim() ? v : null;

const toCents = (dollars: number): number => Math.round(dollars * 100);

router.get("/expenses", async (req: Request, res: Response) => {
  const clientId = (req.query["clientId"] as string | undefined)?.trim();
  const category = (req.query["category"] as string | undefined)?.trim();

  const conditions = [];
  if (clientId) conditions.push(eq(expensesTable.clientId, clientId));
  if (category) conditions.push(eq(expensesTable.category, category));

  const rows = await db
    .select()
    .from(expensesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(expensesTable.spentOn));
  res.json(rows.map(toExpense));
});

router.post("/expenses", async (req: Request, res: Response) => {
  const body = CreateExpenseBody.parse(req.body);
  if (body.amount < 0) {
    res.status(400).json({ error: "Amount must be non-negative" });
    return;
  }
  const inserted = await db
    .insert(expensesTable)
    .values({
      category: body.category,
      description: body.description ?? "",
      amountCents: toCents(body.amount),
      clientId: body.clientId ?? null,
      spentOn: dateOrNull(body.spentOn),
      notes: body.notes ?? "",
      ownerLabel: body.owner ?? "Gregg",
    })
    .returning();
  res.status(201).json(toExpense(inserted[0]!));
});

router.patch("/expenses/:expenseId", async (req: Request, res: Response) => {
  const expenseId = strParam(req, "expenseId");
  const body = UpdateExpenseBody.parse(req.body);
  if (body.amount !== undefined && body.amount < 0) {
    res.status(400).json({ error: "Amount must be non-negative" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (body.category !== undefined) updates["category"] = body.category;
  if (body.description !== undefined) updates["description"] = body.description;
  if (body.amount !== undefined) updates["amountCents"] = toCents(body.amount);
  if (body.clientId !== undefined) updates["clientId"] = body.clientId ?? null;
  if (body.spentOn !== undefined) updates["spentOn"] = dateOrNull(body.spentOn);
  if (body.notes !== undefined) updates["notes"] = body.notes;
  if (body.owner !== undefined) updates["ownerLabel"] = body.owner;

  const updated = await db
    .update(expensesTable)
    .set(updates)
    .where(eq(expensesTable.id, expenseId))
    .returning();
  const row = updated[0];
  if (!row) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  res.json(toExpense(row));
});

router.delete("/expenses/:expenseId", async (req: Request, res: Response) => {
  const expenseId = strParam(req, "expenseId");
  const deleted = await db
    .delete(expensesTable)
    .where(eq(expensesTable.id, expenseId))
    .returning();
  if (!deleted[0]) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;
