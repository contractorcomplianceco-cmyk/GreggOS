import {
  db,
  tasksTable,
  opportunitySignalsTable,
  escalationsTable,
  callNotesTable,
} from "@workspace/db";
import { and, eq, inArray, ne, notInArray, sql } from "drizzle-orm";
import { emptyCounters, type ClientCounters } from "./mappers";

export async function countersForClients(
  clientIds: string[],
): Promise<Map<string, ClientCounters>> {
  const map = new Map<string, ClientCounters>();
  for (const id of clientIds) map.set(id, { ...emptyCounters });
  if (clientIds.length === 0) return map;

  const tasks = await db
    .select({
      clientId: tasksTable.clientId,
      c: sql<number>`count(*)::int`,
    })
    .from(tasksTable)
    .where(
      and(
        inArray(tasksTable.clientId, clientIds),
        notInArray(tasksTable.status, ["Completed", "Canceled"]),
      ),
    )
    .groupBy(tasksTable.clientId);
  for (const r of tasks) {
    const e = map.get(r.clientId);
    if (e) e.openTasks = r.c;
  }

  const signals = await db
    .select({
      clientId: opportunitySignalsTable.clientId,
      c: sql<number>`count(*)::int`,
    })
    .from(opportunitySignalsTable)
    .where(
      and(
        inArray(opportunitySignalsTable.clientId, clientIds),
        eq(opportunitySignalsTable.status, "Open"),
      ),
    )
    .groupBy(opportunitySignalsTable.clientId);
  for (const r of signals) {
    const e = map.get(r.clientId);
    if (e) e.opportunitySignals = r.c;
  }

  const escs = await db
    .select({
      clientId: escalationsTable.clientId,
      c: sql<number>`count(*)::int`,
    })
    .from(escalationsTable)
    .where(
      and(
        inArray(escalationsTable.clientId, clientIds),
        ne(escalationsTable.status, "Resolved"),
      ),
    )
    .groupBy(escalationsTable.clientId);
  for (const r of escs) {
    const e = map.get(r.clientId);
    if (e) e.escalations = r.c;
  }

  const notes = await db
    .select({
      clientId: callNotesTable.clientId,
      c: sql<number>`count(*)::int`,
    })
    .from(callNotesTable)
    .where(inArray(callNotesTable.clientId, clientIds))
    .groupBy(callNotesTable.clientId);
  for (const r of notes) {
    const e = map.get(r.clientId);
    if (e) e.callNotes = r.c;
  }

  return map;
}

export async function countersForClient(
  clientId: string,
): Promise<ClientCounters> {
  const m = await countersForClients([clientId]);
  return m.get(clientId) ?? { ...emptyCounters };
}
