import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  clientsTable,
  callNotesTable,
  tasksTable,
  opportunitySignalsTable,
  escalationsTable,
} from "@workspace/db";
import { asc } from "drizzle-orm";
import { ImportDataBody } from "@workspace/api-zod";
import {
  toClient,
  toCallNote,
  toTask,
  toSignal,
  toEscalation,
} from "../lib/mappers";
import { countersForClients } from "../lib/counters";
import { resolveOwnerUserId } from "../lib/owner";
import { logActivity } from "../lib/activity";
import { actorOf, requireAdmin } from "../middlewares/auth";
import { seedDatabase } from "../seed/seedDatabase";

const router: IRouter = Router();

const dateOrNull = (v: string | undefined | null): string | null =>
  v && v.trim() ? v : null;

router.use(requireAdmin);

router.get("/admin/export", async (_req: Request, res: Response) => {
  const [clients, callNotes, tasks, signals, escalations] = await Promise.all([
    db.select().from(clientsTable).orderBy(asc(clientsTable.createdAt)),
    db.select().from(callNotesTable).orderBy(asc(callNotesTable.createdAt)),
    db.select().from(tasksTable).orderBy(asc(tasksTable.createdAt)),
    db
      .select()
      .from(opportunitySignalsTable)
      .orderBy(asc(opportunitySignalsTable.createdAt)),
    db
      .select()
      .from(escalationsTable)
      .orderBy(asc(escalationsTable.createdAt)),
  ]);
  const counters = await countersForClients(clients.map((c) => c.id));
  res.json({
    clients: clients.map((c) => toClient(c, counters.get(c.id)!)),
    callNotes: callNotes.map(toCallNote),
    tasks: tasks.map(toTask),
    signals: signals.map(toSignal),
    escalations: escalations.map(toEscalation),
  });
});

router.post("/admin/reset", async (req: Request, res: Response) => {
  await seedDatabase();
  const actor = actorOf(req);
  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "reset",
    entityType: "system",
    summary: "Reset data to seed",
  });
  res.json({ ok: true, message: "Database reset to seed data" });
});

router.post("/admin/import", async (req: Request, res: Response) => {
  const body = ImportDataBody.parse(req.body);
  const actor = actorOf(req);
  let count = 0;
  for (const c of body.clients) {
    const ownerUserId = await resolveOwnerUserId(c.nextOwner);
    await db.insert(clientsTable).values({
      clientName: c.clientName,
      companyName: c.companyName ?? "",
      contactName: c.contactName ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      clientStatus: c.clientStatus ?? "Active",
      greggPriority: c.greggPriority ?? "Medium",
      riskLevel: c.riskLevel ?? "Low",
      lastMeaningfulContact: dateOrNull(c.lastMeaningfulContact),
      nextAction: c.nextAction ?? "",
      nextOwnerLabel: c.nextOwner ?? "",
      nextOwnerUserId: ownerUserId,
      dueDate: dateOrNull(c.dueDate),
      missingInformation: c.missingInformation ?? "None",
    });
    count += 1;
  }
  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "imported",
    entityType: "system",
    summary: `Imported ${count} clients`,
  });
  res.json({ ok: true, message: `Imported ${count} clients` });
});

export default router;
