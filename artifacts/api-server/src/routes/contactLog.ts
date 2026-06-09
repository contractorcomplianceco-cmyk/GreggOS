import { Router, type IRouter, type Request, type Response } from "express";
import { db, contactLogTable, clientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateContactLogEntryBody } from "@workspace/api-zod";
import { toContactLog } from "../lib/mappers";
import { logActivity } from "../lib/activity";
import { actorOf } from "../middlewares/auth";

const router: IRouter = Router();

const todayString = (): string => new Date().toISOString().slice(0, 10);

router.post("/contact-log", async (req: Request, res: Response) => {
  const body = CreateContactLogEntryBody.parse(req.body);
  const date = body.date && body.date.trim() ? body.date : todayString();

  const inserted = await db
    .insert(contactLogTable)
    .values({
      clientId: body.clientId,
      date,
      channel: body.channel,
      internalPerson: body.internalPerson ?? "",
      direction: body.direction ?? "",
      summary: body.summary ?? "",
    })
    .returning();
  const row = inserted[0]!;

  // A logged touch is a meaningful contact: keep the client warmth fresh.
  await db
    .update(clientsTable)
    .set({ lastMeaningfulContact: date })
    .where(eq(clientsTable.id, body.clientId));

  const actor = actorOf(req);
  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "logged",
    entityType: "contact",
    entityId: row.id,
    clientId: row.clientId,
    summary: `Logged ${row.channel} touch`,
  });
  res.status(201).json(toContactLog(row));
});

export default router;
