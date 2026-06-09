import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  crmLinksTable,
  clientsTable,
  callNotesTable,
  tasksTable,
  expansionMilestonesTable,
  contactLogTable,
  activityLogTable,
} from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { UpsertCrmLinkBody, UpdateCrmLinkBody } from "@workspace/api-zod";
import type { CrmExportPayload } from "@workspace/api-zod";
import { toCrmLink } from "../lib/mappers";
import { logActivity } from "../lib/activity";
import { actorOf } from "../middlewares/auth";
import { strParam } from "../lib/http";

const router: IRouter = Router();

// Default Zoho module per source entity (kept here so export + approve agree).
const DEFAULT_MODULE: Record<string, string> = {
  call_note: "Notes",
  expansion_milestone: "Deals",
  task: "Tasks",
  contact_log: "Notes",
  handoff: "Notes",
};

router.get("/crm-links", async (req: Request, res: Response) => {
  const entityType = (req.query["entityType"] as string | undefined)?.trim();
  const clientId = (req.query["clientId"] as string | undefined)?.trim();
  const syncStatus = (req.query["syncStatus"] as string | undefined)?.trim();
  const crmModule = (req.query["crmModule"] as string | undefined)?.trim();

  const conditions = [];
  if (entityType) conditions.push(eq(crmLinksTable.entityType, entityType));
  if (clientId) conditions.push(eq(crmLinksTable.clientId, clientId));
  if (syncStatus) conditions.push(eq(crmLinksTable.syncStatus, syncStatus));
  if (crmModule) conditions.push(eq(crmLinksTable.crmModule, crmModule));

  const rows = await db
    .select()
    .from(crmLinksTable)
    .where(conditions.length ? and(...conditions) : undefined);

  res.json(rows.map(toCrmLink));
});

// "Approve for CRM" — idempotent upsert keyed on (entityType, entityId).
router.post("/crm-links", async (req: Request, res: Response) => {
  const body = UpsertCrmLinkBody.parse(req.body);
  const crmModule =
    body.crmModule || DEFAULT_MODULE[body.entityType] || "Notes";

  // Approval-only endpoint: it never sets push state. The pushed/failed
  // transitions (and their audit semantics) belong to PATCH /crm-links/:id.
  // On re-approve of an existing link we leave syncStatus untouched so an
  // already-pushed record cannot be silently downgraded back to "approved".
  const inserted = await db
    .insert(crmLinksTable)
    .values({
      entityType: body.entityType,
      entityId: body.entityId,
      clientId: body.clientId ?? null,
      crmModule,
      syncStatus: "approved",
    })
    .onConflictDoUpdate({
      target: [crmLinksTable.entityType, crmLinksTable.entityId],
      set: {
        clientId: body.clientId ?? null,
        crmModule,
        updatedAt: new Date(),
      },
    })
    .returning();
  const row = inserted[0]!;

  const actor = actorOf(req);
  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "crm_approved",
    entityType: "crm_link",
    entityId: row.id,
    clientId: row.clientId,
    summary: `Approved ${row.entityType} for CRM (${row.crmModule})`,
    changes: { entityType: row.entityType, entityId: row.entityId },
  });

  res.json(toCrmLink(row));
});

// "Mark pushed to CRM" (capture Zoho id) or record a sync failure.
router.patch("/crm-links/:linkId", async (req: Request, res: Response) => {
  const linkId = strParam(req, "linkId");
  const body = UpdateCrmLinkBody.parse(req.body);

  const existingRows = await db
    .select()
    .from(crmLinksTable)
    .where(eq(crmLinksTable.id, linkId))
    .limit(1);
  const existing = existingRows[0];
  if (!existing) {
    res.status(404).json({ error: "CRM link not found" });
    return;
  }

  const actor = actorOf(req);
  const updates: Record<string, unknown> = {};
  if (body.crmRecordId !== undefined) updates["crmRecordId"] = body.crmRecordId;
  if (body.errorMessage !== undefined)
    updates["errorMessage"] = body.errorMessage;
  if (body.syncStatus !== undefined) {
    updates["syncStatus"] = body.syncStatus;
    if (body.syncStatus === "pushed") {
      updates["lastSyncedAt"] = new Date();
      updates["lastPushedByUserId"] = actor.id ?? null;
      updates["errorMessage"] = "";
    }
  }

  const updated = await db
    .update(crmLinksTable)
    .set(updates)
    .where(eq(crmLinksTable.id, linkId))
    .returning();
  const row = updated[0]!;

  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "crm_push_status",
    entityType: "crm_link",
    entityId: row.id,
    clientId: row.clientId,
    summary: `CRM status for ${row.entityType} -> ${row.syncStatus}${
      row.crmRecordId ? ` (${row.crmRecordId})` : ""
    }`,
    changes: updates,
  });

  res.json(toCrmLink(row));
});

interface ExportBuild {
  recordTitle: string;
  fields: Record<string, unknown>;
}

async function buildExport(
  entityType: string,
  entityId: string,
): Promise<ExportBuild | null> {
  switch (entityType) {
    case "call_note": {
      const rows = await db
        .select({ note: callNotesTable, client: clientsTable })
        .from(callNotesTable)
        .innerJoin(clientsTable, eq(callNotesTable.clientId, clientsTable.id))
        .where(eq(callNotesTable.id, entityId))
        .limit(1);
      const r = rows[0];
      if (!r) return null;
      const title = `Call note — ${r.client.clientName} (${r.note.callDate})`;
      return {
        recordTitle: title,
        fields: {
          Note_Title: title,
          Note_Content:
            r.note.crmReadyNote || r.note.cleanSummary || r.note.clientConcern,
          Parent_Client: r.client.clientName,
          Call_Type: r.note.callType,
          Call_Date: r.note.callDate,
        },
      };
    }
    case "expansion_milestone": {
      const rows = await db
        .select({ m: expansionMilestonesTable, client: clientsTable })
        .from(expansionMilestonesTable)
        .innerJoin(
          clientsTable,
          eq(expansionMilestonesTable.clientId, clientsTable.id),
        )
        .where(eq(expansionMilestonesTable.id, entityId))
        .limit(1);
      const r = rows[0];
      if (!r) return null;
      const amount =
        r.m.status === "Won" ? r.m.actualValue : r.m.potentialValue;
      return {
        recordTitle: r.m.title,
        fields: {
          Deal_Name: r.m.title,
          Account_Name: r.client.clientName,
          Stage: r.m.stage,
          Status: r.m.status,
          Amount: amount,
          Closing_Date: r.m.targetDate,
          Description: r.m.description,
          Owner: r.m.ownerLabel,
        },
      };
    }
    case "task": {
      const rows = await db
        .select({ t: tasksTable, client: clientsTable })
        .from(tasksTable)
        .innerJoin(clientsTable, eq(tasksTable.clientId, clientsTable.id))
        .where(eq(tasksTable.id, entityId))
        .limit(1);
      const r = rows[0];
      if (!r) return null;
      return {
        recordTitle: r.t.title,
        fields: {
          Subject: r.t.title,
          Account_Name: r.client.clientName,
          Status: r.t.status,
          Priority: r.t.priority,
          Due_Date: r.t.dueDate,
          Description: r.t.notes,
          Owner: r.t.ownerLabel,
        },
      };
    }
    case "contact_log": {
      const rows = await db
        .select({ c: contactLogTable, client: clientsTable })
        .from(contactLogTable)
        .innerJoin(clientsTable, eq(contactLogTable.clientId, clientsTable.id))
        .where(eq(contactLogTable.id, entityId))
        .limit(1);
      const r = rows[0];
      if (!r) return null;
      const title = `${r.c.channel} touch — ${r.client.clientName}`;
      return {
        recordTitle: title,
        fields: {
          Note_Title: title,
          Note_Content: r.c.summary,
          Parent_Client: r.client.clientName,
          Channel: r.c.channel,
          Direction: r.c.direction,
          Date: r.c.date,
        },
      };
    }
    case "handoff": {
      const rows = await db
        .select()
        .from(activityLogTable)
        .where(eq(activityLogTable.id, entityId))
        .limit(1);
      const r = rows[0];
      if (!r) return null;
      const title = `Handoff — ${r.summary}`;
      return {
        recordTitle: title,
        fields: {
          Note_Title: title,
          Note_Content: r.summary,
          Actor: r.actorLabel,
        },
      };
    }
    default:
      return null;
  }
}

// CRM-ready export payloads (export-only; nothing is pushed automatically).
router.get("/crm-export", async (req: Request, res: Response) => {
  const entityType = (req.query["entityType"] as string | undefined)?.trim();
  const entityId = (req.query["entityId"] as string | undefined)?.trim();
  const syncStatus = (req.query["syncStatus"] as string | undefined)?.trim();

  const conditions = [];
  if (entityType) conditions.push(eq(crmLinksTable.entityType, entityType));
  if (entityId) conditions.push(eq(crmLinksTable.entityId, entityId));
  if (syncStatus) conditions.push(eq(crmLinksTable.syncStatus, syncStatus));

  const links = await db
    .select()
    .from(crmLinksTable)
    .where(conditions.length ? and(...conditions) : undefined);

  const payloads: CrmExportPayload[] = [];
  for (const link of links) {
    const built = await buildExport(link.entityType, link.entityId);
    if (!built) continue;
    payloads.push({
      entityType: link.entityType,
      entityId: link.entityId,
      clientId: link.clientId ?? null,
      crmModule: link.crmModule,
      recordTitle: built.recordTitle,
      syncStatus: link.syncStatus,
      crmRecordId: link.crmRecordId ?? null,
      fields: built.fields,
    });
  }

  res.json(payloads);
});

export default router;
