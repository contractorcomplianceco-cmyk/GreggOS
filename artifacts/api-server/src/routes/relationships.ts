import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  clientsTable,
  contactLogTable,
  scheduledEventsTable,
  expansionMilestonesTable,
} from "@workspace/db";
import { and, asc, eq, gte, max, sql } from "drizzle-orm";
import {
  cadenceStateFor,
  daysSince,
  warmthFor,
  type Warmth,
} from "../lib/priority";

const router: IRouter = Router();

const isTara = (label: string): boolean =>
  label.trim().toLowerCase() === "tara";

const todayString = (): string => new Date().toISOString().slice(0, 10);

router.get("/relationships", async (req: Request, res: Response) => {
  const owner = (req.query["owner"] as string | undefined)?.trim();
  const warmthFilter = (req.query["warmth"] as string | undefined)?.trim();
  const sharedRaw = (req.query["sharedWithTara"] as string | undefined)?.trim();
  const sharedWithTaraFilter =
    sharedRaw === "true" ? true : sharedRaw === "false" ? false : undefined;

  const conditions = [];
  if (owner) conditions.push(eq(clientsTable.nextOwnerLabel, owner));

  const clients = await db
    .select()
    .from(clientsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(clientsTable.clientName));

  const today = todayString();

  const [touchRows, eventRows, expansionRows] = await Promise.all([
    db
      .select({
        clientId: contactLogTable.clientId,
        lastDate: max(contactLogTable.date),
      })
      .from(contactLogTable)
      .groupBy(contactLogTable.clientId),
    db
      .select()
      .from(scheduledEventsTable)
      .where(gte(scheduledEventsTable.date, today))
      .orderBy(asc(scheduledEventsTable.date)),
    db
      .select({
        clientId: expansionMilestonesTable.clientId,
        c: sql<number>`count(*)::int`,
      })
      .from(expansionMilestonesTable)
      .where(eq(expansionMilestonesTable.status, "Open"))
      .groupBy(expansionMilestonesTable.clientId),
  ]);

  const lastTouchByClient = new Map<string, string | null>();
  for (const t of touchRows) lastTouchByClient.set(t.clientId, t.lastDate);

  const nextEventByClient = new Map<
    string,
    { date: string; title: string }
  >();
  for (const e of eventRows) {
    if (nextEventByClient.has(e.clientId)) continue; // rows already date-sorted
    nextEventByClient.set(e.clientId, {
      date: e.date ?? "",
      title: e.title,
    });
  }

  const openExpansionByClient = new Map<string, number>();
  for (const x of expansionRows)
    openExpansionByClient.set(x.clientId, x.c);

  const summaries = clients.map((c) => {
    const lastTouch =
      lastTouchByClient.get(c.id) ?? c.lastMeaningfulContact ?? null;
    const daysSinceTouch = daysSince(lastTouch);
    const warmth: Warmth = warmthFor(daysSinceTouch, c.touchCadenceDays);
    const nextEvent = nextEventByClient.get(c.id);
    return {
      clientId: c.id,
      clientName: c.clientName,
      companyName: c.companyName,
      owner: c.nextOwnerLabel,
      coOwner: c.coOwnerLabel,
      involvementState: c.involvementState,
      clientStatus: c.clientStatus,
      riskLevel: c.riskLevel,
      greggPriority: c.greggPriority,
      lastMeaningfulContact: c.lastMeaningfulContact ?? "",
      lastTouchDate: lastTouch ?? "",
      daysSinceTouch,
      touchCadenceDays: c.touchCadenceDays,
      warmth,
      cadenceState: cadenceStateFor(daysSinceTouch, c.touchCadenceDays),
      nextEventDate: nextEvent?.date ?? "",
      nextEventTitle: nextEvent?.title ?? "",
      openExpansionCount: openExpansionByClient.get(c.id) ?? 0,
    };
  });

  const filtered = summaries.filter((s) => {
    if (warmthFilter && s.warmth !== warmthFilter) return false;
    if (sharedWithTaraFilter !== undefined) {
      const shared = isTara(s.coOwner) || isTara(s.owner);
      if (shared !== sharedWithTaraFilter) return false;
    }
    return true;
  });

  res.json(filtered);
});

export default router;
