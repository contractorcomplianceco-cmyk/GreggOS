import { Router, type IRouter, type Request, type Response } from "express";
import { strParam } from "../lib/http";
import { db, feedbackTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { CreateFeedbackBody, UpdateFeedbackBody } from "@workspace/api-zod";
import { toFeedback } from "../lib/mappers";
import { actorOf } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/feedback", async (req: Request, res: Response) => {
  const type = (req.query["type"] as string | undefined)?.trim();
  const status = (req.query["status"] as string | undefined)?.trim();

  const conditions = [];
  if (type) conditions.push(eq(feedbackTable.type, type));
  if (status) conditions.push(eq(feedbackTable.status, status));

  const rows = await db
    .select()
    .from(feedbackTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(feedbackTable.createdAt));
  res.json(rows.map(toFeedback));
});

router.post("/feedback", async (req: Request, res: Response) => {
  const body = CreateFeedbackBody.parse(req.body);
  const actor = actorOf(req);
  const inserted = await db
    .insert(feedbackTable)
    .values({
      type: body.type,
      title: body.title ?? "",
      body: body.body,
      clientId: body.clientId ?? null,
      status: "open",
      submittedByUserId: actor.id,
      submittedByLabel: actor.label,
    })
    .returning();
  res.status(201).json(toFeedback(inserted[0]!));
});

router.patch("/feedback/:feedbackId", async (req: Request, res: Response) => {
  const feedbackId = strParam(req, "feedbackId");
  const body = UpdateFeedbackBody.parse(req.body);

  const updates: Record<string, unknown> = {};
  if (body.type !== undefined) updates["type"] = body.type;
  if (body.title !== undefined) updates["title"] = body.title;
  if (body.body !== undefined) updates["body"] = body.body;
  if (body.clientId !== undefined) updates["clientId"] = body.clientId ?? null;
  if (body.status !== undefined) updates["status"] = body.status;

  const updated = await db
    .update(feedbackTable)
    .set(updates)
    .where(eq(feedbackTable.id, feedbackId))
    .returning();
  const row = updated[0];
  if (!row) {
    res.status(404).json({ error: "Feedback not found" });
    return;
  }
  res.json(toFeedback(row));
});

export default router;
