import { Router, type IRouter, type Request, type Response } from "express";
import { strParam } from "../lib/http";
import {
  db,
  clientsTable,
  callNotesTable,
  tasksTable,
  opportunitySignalsTable,
  escalationsTable,
  clientProcessesTable,
  clientRiskProfilesTable,
  clientAuditsTable,
  auditLinksTable,
  expansionMilestonesTable,
  invoicesTable,
  slasTable,
  scheduledEventsTable,
  contactLogTable,
} from "@workspace/db";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import {
  CreateClientBody,
  UpdateClientBody,
  HandoffClientBody,
} from "@workspace/api-zod";
import { countersForClients, countersForClient } from "../lib/counters";
import {
  toClient,
  toCallNote,
  toTask,
  toSignal,
  toEscalation,
  toProcess,
  toRiskProfile,
  toAudit,
  toAuditLink,
  toExpansion,
  toInvoice,
  toSla,
  toEvent,
  toContactLog,
} from "../lib/mappers";
import { resolveOwnerUserId } from "../lib/owner";
import { logActivity } from "../lib/activity";
import { actorOf } from "../middlewares/auth";

const router: IRouter = Router();

const dateOrNull = (v: string | undefined | null): string | null =>
  v && v.trim() ? v : null;

router.get("/clients", async (req: Request, res: Response) => {
  const search = (req.query["search"] as string | undefined)?.trim();
  const status = (req.query["status"] as string | undefined)?.trim();
  const owner = (req.query["owner"] as string | undefined)?.trim();

  const conditions = [];
  if (search) {
    const like = `%${search}%`;
    conditions.push(
      or(
        ilike(clientsTable.clientName, like),
        ilike(clientsTable.companyName, like),
        ilike(clientsTable.contactName, like),
      ),
    );
  }
  if (status) conditions.push(eq(clientsTable.clientStatus, status));
  if (owner) conditions.push(eq(clientsTable.nextOwnerLabel, owner));

  const rows = await db
    .select()
    .from(clientsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(clientsTable.createdAt));

  const counters = await countersForClients(rows.map((r) => r.id));
  res.json(rows.map((r) => toClient(r, counters.get(r.id)!)));
});

router.post("/clients", async (req: Request, res: Response) => {
  const body = CreateClientBody.parse(req.body);
  const ownerUserId = await resolveOwnerUserId(body.nextOwner);
  const inserted = await db
    .insert(clientsTable)
    .values({
      clientName: body.clientName,
      companyName: body.companyName ?? "",
      contactName: body.contactName ?? "",
      phone: body.phone ?? "",
      email: body.email ?? "",
      clientStatus: body.clientStatus ?? "Active",
      greggPriority: body.greggPriority ?? "Medium",
      riskLevel: body.riskLevel ?? "Low",
      lastMeaningfulContact: dateOrNull(body.lastMeaningfulContact),
      nextAction: body.nextAction ?? "",
      nextOwnerLabel: body.nextOwner ?? "",
      nextOwnerUserId: ownerUserId,
      dueDate: dateOrNull(body.dueDate),
      missingInformation: body.missingInformation ?? "None",
    })
    .returning();
  const row = inserted[0]!;
  const actor = actorOf(req);
  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "created",
    entityType: "client",
    entityId: row.id,
    clientId: row.id,
    summary: `Created client ${row.clientName}`,
  });
  res.status(201).json(toClient(row, await countersForClient(row.id)));
});

router.get("/clients/:clientId", async (req: Request, res: Response) => {
  const clientId = strParam(req, "clientId");
  const clientRows = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, clientId))
    .limit(1);
  const client = clientRows[0];
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const [
    callNotes,
    tasks,
    signals,
    escalations,
    processes,
    riskProfiles,
    audits,
    auditLinks,
    expansion,
    invoices,
    slas,
    events,
    contactLog,
    counters,
  ] = await Promise.all([
    db
      .select()
      .from(callNotesTable)
      .where(eq(callNotesTable.clientId, clientId))
      .orderBy(asc(callNotesTable.createdAt)),
    db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.clientId, clientId))
      .orderBy(asc(tasksTable.createdAt)),
    db
      .select()
      .from(opportunitySignalsTable)
      .where(eq(opportunitySignalsTable.clientId, clientId))
      .orderBy(asc(opportunitySignalsTable.createdAt)),
    db
      .select()
      .from(escalationsTable)
      .where(eq(escalationsTable.clientId, clientId))
      .orderBy(asc(escalationsTable.createdAt)),
    db
      .select()
      .from(clientProcessesTable)
      .where(eq(clientProcessesTable.clientId, clientId)),
    db
      .select()
      .from(clientRiskProfilesTable)
      .where(eq(clientRiskProfilesTable.clientId, clientId))
      .limit(1),
    db
      .select()
      .from(clientAuditsTable)
      .where(eq(clientAuditsTable.clientId, clientId))
      .limit(1),
    db
      .select()
      .from(auditLinksTable)
      .where(eq(auditLinksTable.clientId, clientId))
      .limit(1),
    db
      .select()
      .from(expansionMilestonesTable)
      .where(eq(expansionMilestonesTable.clientId, clientId)),
    db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.clientId, clientId)),
    db.select().from(slasTable).where(eq(slasTable.clientId, clientId)),
    db
      .select()
      .from(scheduledEventsTable)
      .where(eq(scheduledEventsTable.clientId, clientId)),
    db
      .select()
      .from(contactLogTable)
      .where(eq(contactLogTable.clientId, clientId)),
    countersForClient(clientId),
  ]);

  res.json({
    client: toClient(client, counters),
    callNotes: callNotes.map(toCallNote),
    tasks: tasks.map(toTask),
    signals: signals.map(toSignal),
    escalations: escalations.map(toEscalation),
    processes: processes.map(toProcess),
    riskProfile: riskProfiles[0] ? toRiskProfile(riskProfiles[0]) : null,
    audit: audits[0] ? toAudit(audits[0]) : null,
    auditLink: auditLinks[0] ? toAuditLink(auditLinks[0]) : null,
    expansion: expansion.map(toExpansion),
    invoices: invoices.map(toInvoice),
    slas: slas.map(toSla),
    events: events.map(toEvent),
    contactLog: contactLog.map(toContactLog),
  });
});

router.patch("/clients/:clientId", async (req: Request, res: Response) => {
  const clientId = strParam(req, "clientId");
  const body = UpdateClientBody.parse(req.body);

  const updates: Record<string, unknown> = {};
  if (body.clientName !== undefined) updates["clientName"] = body.clientName;
  if (body.companyName !== undefined) updates["companyName"] = body.companyName;
  if (body.contactName !== undefined) updates["contactName"] = body.contactName;
  if (body.phone !== undefined) updates["phone"] = body.phone;
  if (body.email !== undefined) updates["email"] = body.email;
  if (body.clientStatus !== undefined)
    updates["clientStatus"] = body.clientStatus;
  if (body.greggPriority !== undefined)
    updates["greggPriority"] = body.greggPriority;
  if (body.riskLevel !== undefined) updates["riskLevel"] = body.riskLevel;
  if (body.lastMeaningfulContact !== undefined)
    updates["lastMeaningfulContact"] = dateOrNull(body.lastMeaningfulContact);
  if (body.nextAction !== undefined) updates["nextAction"] = body.nextAction;
  if (body.nextOwner !== undefined) {
    updates["nextOwnerLabel"] = body.nextOwner;
    updates["nextOwnerUserId"] = await resolveOwnerUserId(body.nextOwner);
  }
  if (body.coOwner !== undefined) {
    updates["coOwnerLabel"] = body.coOwner;
    updates["coOwnerUserId"] = await resolveOwnerUserId(body.coOwner);
  }
  if (body.involvementState !== undefined)
    updates["involvementState"] = body.involvementState;
  if (body.touchCadenceDays !== undefined)
    updates["touchCadenceDays"] = body.touchCadenceDays;
  if (body.dueDate !== undefined) updates["dueDate"] = dateOrNull(body.dueDate);
  if (body.missingInformation !== undefined)
    updates["missingInformation"] = body.missingInformation;

  const updated = await db
    .update(clientsTable)
    .set(updates)
    .where(eq(clientsTable.id, clientId))
    .returning();
  const row = updated[0];
  if (!row) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  const actor = actorOf(req);
  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "updated",
    entityType: "client",
    entityId: row.id,
    clientId: row.id,
    summary: `Updated client ${row.clientName}`,
    changes: updates,
  });
  res.json(toClient(row, await countersForClient(row.id)));
});

router.post(
  "/clients/:clientId/handoff",
  async (req: Request, res: Response) => {
    const clientId = strParam(req, "clientId");
    const body = HandoffClientBody.parse(req.body);

    const existingRows = await db
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.id, clientId))
      .limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    const fromOwner = existing.nextOwnerLabel;
    const updates: Record<string, unknown> = {
      nextOwnerLabel: body.toOwner,
      nextOwnerUserId: await resolveOwnerUserId(body.toOwner),
    };
    if (body.involvementState !== undefined)
      updates["involvementState"] = body.involvementState;

    const updated = await db
      .update(clientsTable)
      .set(updates)
      .where(eq(clientsTable.id, clientId))
      .returning();
    const row = updated[0]!;

    const actor = actorOf(req);
    const note = body.note?.trim();
    const summary =
      `Handed off ${row.clientName}` +
      (fromOwner ? ` from ${fromOwner}` : "") +
      ` to ${body.toOwner}` +
      (note ? ` — ${note}` : "");
    await logActivity(db, {
      actorUserId: actor.id,
      actorLabel: actor.label,
      action: "handoff",
      entityType: "client",
      entityId: row.id,
      clientId: row.id,
      summary,
      changes: { fromOwner, toOwner: body.toOwner, ...updates },
    });
    res.json(toClient(row, await countersForClient(row.id)));
  },
);

export default router;
