import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  callNotesTable,
  tasksTable,
  opportunitySignalsTable,
  escalationsTable,
  clientsTable,
} from "@workspace/db";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { strParam } from "../lib/http";
import {
  CreateCallNoteBody,
  UpdateCallNoteBody,
  ProcessCallNoteBody,
} from "@workspace/api-zod";
import { toCallNote } from "../lib/mappers";
import { resolveOwnerUserId } from "../lib/owner";
import { logActivity } from "../lib/activity";
import { actorOf } from "../middlewares/auth";

const router: IRouter = Router();

const dateOrNull = (v: string | undefined | null): string | null =>
  v && v.trim() ? v : null;

router.get("/call-notes", async (req: Request, res: Response) => {
  const clientId = (req.query["clientId"] as string | undefined)?.trim();
  const status = (req.query["status"] as string | undefined)?.trim();
  const search = (req.query["search"] as string | undefined)?.trim();

  const conditions = [];
  if (clientId) conditions.push(eq(callNotesTable.clientId, clientId));
  if (status) conditions.push(eq(callNotesTable.routingStatus, status));
  if (search) {
    const like = `%${search}%`;
    conditions.push(
      or(
        ilike(callNotesTable.rawRingCentralNote, like),
        ilike(callNotesTable.cleanSummary, like),
        ilike(callNotesTable.clientConcern, like),
      ),
    );
  }

  const rows = await db
    .select()
    .from(callNotesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(callNotesTable.createdAt));
  res.json(rows.map(toCallNote));
});

router.post("/call-notes", async (req: Request, res: Response) => {
  const body = CreateCallNoteBody.parse(req.body);
  const actor = actorOf(req);
  const inserted = await db
    .insert(callNotesTable)
    .values({
      clientId: body.clientId,
      callDate: body.callDate,
      caller: body.caller ?? "",
      callType: body.callType,
      rawRingCentralNote: body.rawRingCentralNote ?? "",
      cleanSummary: body.cleanSummary ?? "",
      clientConcern: body.clientConcern ?? "",
      commitmentsMade: body.commitmentsMade ?? "",
      missingInformation: body.missingInformation ?? "",
      nextActions: body.nextActions ?? "",
      opportunitySignals: body.opportunitySignals ?? "",
      escalationFlags: body.escalationFlags ?? "",
      routingStatus: body.routingStatus,
      crmReadyNote: body.crmReadyNote ?? "",
      clientFollowUpDraft: body.clientFollowUpDraft ?? "",
      taskList: body.taskList ?? "",
      createdByUserId: actor.id,
    })
    .returning();
  const row = inserted[0]!;
  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "created",
    entityType: "call_note",
    entityId: row.id,
    clientId: row.clientId,
    summary: "Created call note",
  });
  res.status(201).json(toCallNote(row));
});

router.post("/call-notes/process", async (req: Request, res: Response) => {
  const body = ProcessCallNoteBody.parse(req.body);
  const actor = actorOf(req);

  const ownerLabel = (body.owner ?? "").trim() || "Gregg";
  const ownerUserId = await resolveOwnerUserId(ownerLabel);
  const greggUserId = await resolveOwnerUserId("Gregg");

  const note = await db.transaction(async (tx) => {
    const existing = body.id
      ? (
          await tx
            .select()
            .from(callNotesTable)
            .where(eq(callNotesTable.id, body.id))
            .limit(1)
        )[0]
      : undefined;

    const noteValues = {
      clientId: body.clientId,
      callDate: body.callDate,
      caller: body.caller ?? "",
      callType: body.callType,
      rawRingCentralNote: body.rawRingCentralNote ?? "",
      cleanSummary: body.cleanSummary ?? "",
      clientConcern: body.clientConcern ?? "",
      commitmentsMade: body.commitmentsMade ?? "",
      missingInformation: body.missingInformation ?? "",
      nextActions: body.nextActions ?? "",
      opportunitySignals: body.opportunitySignals ?? "",
      escalationFlags: body.escalationFlags ?? "",
      routingStatus: body.routingStatus,
      crmReadyNote: body.crmReadyNote ?? "",
      clientFollowUpDraft: body.clientFollowUpDraft ?? "",
      taskList: body.taskList ?? "",
      createdByUserId: actor.id,
    };

    let saved;
    if (existing) {
      const upd = await tx
        .update(callNotesTable)
        .set(noteValues)
        .where(eq(callNotesTable.id, existing.id))
        .returning();
      saved = upd[0]!;
    } else {
      const ins = await tx
        .insert(callNotesTable)
        .values(noteValues)
        .returning();
      saved = ins[0]!;
    }
    const noteId = saved.id;

    await tx.delete(tasksTable).where(eq(tasksTable.sourceCallNoteId, noteId));
    await tx
      .delete(opportunitySignalsTable)
      .where(eq(opportunitySignalsTable.sourceCallNoteId, noteId));
    await tx
      .delete(escalationsTable)
      .where(eq(escalationsTable.sourceCallNoteId, noteId));

    const opp = (body.opportunitySignals ?? "").trim();
    const esc = (body.escalationFlags ?? "").trim();
    const hasOpportunity = !!opp && opp !== "None";
    const hasEscalation = !!esc && esc !== "None";
    const dueDate = dateOrNull(body.dueDate);
    const priority = body.priority || "Medium";

    const actionItems = (body.nextActions ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (actionItems.length > 0) {
      await tx.insert(tasksTable).values(
        actionItems.map((title) => ({
          clientId: body.clientId,
          sourceCallNoteId: noteId,
          title,
          ownerLabel,
          ownerUserId,
          dueDate,
          priority,
          status: "Open",
          escalationFlag: hasEscalation,
          notes: "",
          createdByUserId: actor.id,
        })),
      );
    }

    if (hasOpportunity) {
      await tx.insert(opportunitySignalsTable).values({
        clientId: body.clientId,
        sourceCallNoteId: noteId,
        type: body.signalType || "Expansion",
        description: opp,
        status: "Open",
        routedToLabel: ownerLabel,
        routedToUserId: ownerUserId,
        createdByUserId: actor.id,
      });
    }

    if (hasEscalation) {
      await tx.insert(escalationsTable).values({
        clientId: body.clientId,
        sourceCallNoteId: noteId,
        reason: body.escalationReason || "Other leadership review",
        riskLevel: body.riskLevel || "Medium",
        routedToLabel: "Gregg",
        routedToUserId: greggUserId,
        decisionNeeded: esc,
        deadline: dueDate,
        status: "Open",
        createdByUserId: actor.id,
      });
    }

    const clientUpdates: Record<string, unknown> = {
      nextOwnerLabel: ownerLabel,
      nextOwnerUserId: ownerUserId,
      missingInformation: body.missingInformation || "None",
      lastMeaningfulContact: body.callDate,
    };
    if (actionItems[0]) clientUpdates["nextAction"] = actionItems[0];
    if (dueDate) clientUpdates["dueDate"] = dueDate;
    await tx
      .update(clientsTable)
      .set(clientUpdates)
      .where(eq(clientsTable.id, body.clientId));

    await logActivity(tx as unknown as typeof db, {
      actorUserId: actor.id,
      actorLabel: actor.label,
      action: existing ? "processed" : "processed",
      entityType: "call_note",
      entityId: noteId,
      clientId: body.clientId,
      summary: "Processed call note",
    });

    return saved;
  });

  res.json({ note: toCallNote(note), clientId: note.clientId });
});

router.get("/call-notes/:noteId", async (req: Request, res: Response) => {
  const noteId = strParam(req, "noteId");
  const rows = await db
    .select()
    .from(callNotesTable)
    .where(eq(callNotesTable.id, noteId))
    .limit(1);
  if (!rows[0]) {
    res.status(404).json({ error: "Call note not found" });
    return;
  }
  res.json(toCallNote(rows[0]));
});

router.patch("/call-notes/:noteId", async (req: Request, res: Response) => {
  const noteId = strParam(req, "noteId");
  const body = UpdateCallNoteBody.parse(req.body);
  const updates: Record<string, unknown> = {};
  for (const key of [
    "callDate",
    "caller",
    "callType",
    "rawRingCentralNote",
    "cleanSummary",
    "clientConcern",
    "commitmentsMade",
    "missingInformation",
    "nextActions",
    "opportunitySignals",
    "escalationFlags",
    "routingStatus",
    "crmReadyNote",
    "clientFollowUpDraft",
    "taskList",
  ] as const) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  const updated = await db
    .update(callNotesTable)
    .set(updates)
    .where(eq(callNotesTable.id, noteId))
    .returning();
  if (!updated[0]) {
    res.status(404).json({ error: "Call note not found" });
    return;
  }
  const actor = actorOf(req);
  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "updated",
    entityType: "call_note",
    entityId: noteId,
    clientId: updated[0].clientId,
    summary: "Updated call note",
    changes: updates,
  });
  res.json(toCallNote(updated[0]));
});

export default router;
