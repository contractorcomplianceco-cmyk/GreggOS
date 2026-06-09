import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  clientsTable,
  callNotesTable,
  tasksTable,
  opportunitySignalsTable,
  escalationsTable,
  usersTable,
  type User as DbUser,
} from "@workspace/db";
import { asc, eq, and } from "drizzle-orm";
import { ImportDataBody, UpdateUserBody } from "@workspace/api-zod";
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

function toUser(row: DbUser) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    active: row.active,
  };
}

router.get("/admin/users", async (_req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(usersTable)
    .orderBy(asc(usersTable.createdAt));
  res.json(rows.map(toUser));
});

router.patch("/admin/users/:userId", async (req: Request, res: Response) => {
  const body = UpdateUserBody.parse(req.body);
  const userId = req.params["userId"] as string;
  const actor = actorOf(req);

  const updates: Partial<DbUser> = {};
  if (body.role !== undefined) updates.role = body.role;
  if (body.active !== undefined) updates.active = body.active;

  type TxOutcome =
    | { status: 404 }
    | { status: 409 }
    | { status: 200; user: DbUser };

  // Run the last-active-admin invariant and the update atomically. We lock the
  // full active-admin set with SELECT ... FOR UPDATE in a deterministic order
  // so concurrent demotions/deactivations serialize instead of both passing a
  // stale count check and leaving zero active admins.
  const outcome = await db.transaction(async (tx): Promise<TxOutcome> => {
    const activeAdmins = await tx
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(and(eq(usersTable.role, "admin"), eq(usersTable.active, true)))
      .orderBy(asc(usersTable.id))
      .for("update");

    const targetRows = await tx
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    const target = targetRows[0];
    if (!target) return { status: 404 };

    const targetIsActiveAdmin = target.role === "admin" && target.active;
    const removingActiveAdmin =
      targetIsActiveAdmin &&
      ((body.role !== undefined && body.role !== "admin") ||
        body.active === false);
    if (removingActiveAdmin) {
      const otherActiveAdmins = activeAdmins.filter((a) => a.id !== userId);
      if (otherActiveAdmins.length === 0) return { status: 409 };
    }

    const updated = await tx
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, userId))
      .returning();
    return { status: 200, user: updated[0]! };
  });

  if (outcome.status === 404) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (outcome.status === 409) {
    res.status(409).json({ error: "Cannot remove the last active admin" });
    return;
  }

  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "updated",
    entityType: "user",
    entityId: userId,
    summary: `Updated ${outcome.user.email}: ${JSON.stringify(updates)}`,
  });

  res.json(toUser(outcome.user));
});

export default router;
