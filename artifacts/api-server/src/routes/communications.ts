import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  communicationDraftsTable,
  clientsTable,
  callNotesTable,
  tasksTable,
  escalationsTable,
  expansionMilestonesTable,
  type Client as DbClient,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import {
  GenerateCommunicationDraftBody,
  UpdateCommunicationDraftBody,
} from "@workspace/api-zod";
import { toCommunicationDraft } from "../lib/mappers";
import { logActivity } from "../lib/activity";
import { actorOf } from "../middlewares/auth";
import { strParam } from "../lib/http";

const router: IRouter = Router();

// Human-readable labels for the supported communication intents. Free-form
// intents fall back to the raw value.
const INTENT_LABELS: Record<string, string> = {
  follow_up: "Follow-up",
  check_in: "Relationship check-in",
  escalation_ack: "Escalation acknowledgment",
  expansion_outreach: "Expansion outreach",
  renewal: "Renewal outreach",
  other: "Communication",
};

interface DraftContext {
  client: DbClient;
  daysSinceContact: number | null;
  callNotes: Array<{ callDate: string; summary: string; concern: string }>;
  openTasks: Array<{ title: string; dueDate: string | null }>;
  openEscalations: Array<{ reason: string; decisionNeeded: string }>;
  expansion: Array<{ title: string; stage: string }>;
}

function daysBetween(from: string | null): number | null {
  if (!from) return null;
  const then = new Date(from).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

async function gatherContext(clientId: string): Promise<DraftContext | null> {
  const clientRows = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, clientId))
    .limit(1);
  const client = clientRows[0];
  if (!client) return null;

  const [noteRows, taskRows, escRows, expRows] = await Promise.all([
    db
      .select()
      .from(callNotesTable)
      .where(eq(callNotesTable.clientId, clientId))
      .orderBy(desc(callNotesTable.callDate))
      .limit(3),
    db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.clientId, clientId))
      .orderBy(desc(tasksTable.createdAt)),
    db
      .select()
      .from(escalationsTable)
      .where(eq(escalationsTable.clientId, clientId)),
    db
      .select()
      .from(expansionMilestonesTable)
      .where(eq(expansionMilestonesTable.clientId, clientId)),
  ]);

  const openStatuses = new Set(["Open", "In Progress", "Waiting"]);
  const openEscStatuses = new Set(["Open", "Under Review"]);

  return {
    client,
    daysSinceContact: daysBetween(client.lastMeaningfulContact),
    callNotes: noteRows.map((n) => ({
      callDate: n.callDate,
      summary: n.cleanSummary || n.rawRingCentralNote,
      concern: n.clientConcern,
    })),
    openTasks: taskRows
      .filter((t) => openStatuses.has(t.status))
      .map((t) => ({ title: t.title, dueDate: t.dueDate })),
    openEscalations: escRows
      .filter((e) => openEscStatuses.has(e.status))
      .map((e) => ({ reason: e.reason, decisionNeeded: e.decisionNeeded })),
    expansion: expRows
      .filter((m) => m.status !== "Won" && m.status !== "Lost")
      .map((m) => ({ title: m.title, stage: m.stage })),
  };
}

function intentLabel(intent: string): string {
  return INTENT_LABELS[intent] ?? intent;
}

// Draft-lifecycle statuses only. There is deliberately NO "sent" state —
// nothing is ever sent from this app. "used" means Gregg copied the draft to
// send it himself elsewhere; "discarded" means he abandoned it.
export const ALLOWED_STATUSES = new Set([
  "draft",
  "edited",
  "used",
  "discarded",
]);

// Deterministic decision-boundary guard. AI output is screened for language
// that would imply approving/committing to a pricing, refund, legal,
// compliance, or qualifier/placement decision — things this app must NEVER do.
// A trip discards the AI draft and forces the safe template fallback, so the
// guarantee does not rely on the model honoring its system prompt.
const PROHIBITED_PATTERNS: RegExp[] = [
  /\b(approv\w+|grant\w+|issu\w+|process\w+|authoriz\w+|guarant\w+)\b[^.?!\n]{0,40}\brefund/i,
  /\brefund\b[^.?!\n]{0,40}\b(approv\w+|grant\w+|issu\w+|guarant\w+|authoriz\w+)/i,
  /\b(approv\w+|guarant\w+|lock\w*|waiv\w+|authoriz\w+)\b[^.?!\n]{0,40}\b(price|pricing|discount|rate|fee|cost)/i,
  /\b(price|pricing|discount|rate|fee|cost)\b[^.?!\n]{0,40}\b(approved|guaranteed|waived|locked in|authorized)/i,
  /\b(legal\w*|complian\w+)\b[^.?!\n]{0,40}\b(guarant\w+|assur\w+|approv\w+|certif\w+|no risk|in the clear)/i,
  /\b(qualifier|placement)\b[^.?!\n]{0,40}\b(approv\w+|guarant\w+|confirm\w+|secur\w+)/i,
  /\b(approv\w+|guarant\w+|confirm\w+|secur\w+)\b[^.?!\n]{0,40}\b(qualifier|placement)/i,
];

export function violatesBoundary(text: string): boolean {
  return PROHIBITED_PATTERNS.some((re) => re.test(text));
}

// Decides whether to keep the AI draft or fall back to the safe template.
// If the AI output trips the decision-boundary guard it is discarded and the
// template is used instead, so the safety guarantee never depends on the model
// honoring its prompt. `tripped` is true only when usable AI output was
// rejected by the guard (so callers can log it).
export function resolveDraft(
  ai: { subject: string; body: string } | null,
  ctx: DraftContext,
  intent: string,
  channel: string,
): {
  result: { subject: string; body: string };
  source: "ai" | "template";
  tripped: boolean;
} {
  let kept = ai;
  let tripped = false;
  if (kept && violatesBoundary(`${kept.subject}\n${kept.body}`)) {
    kept = null;
    tripped = true;
  }
  const result = kept ?? templateDraft(ctx, intent, channel);
  return { result, source: kept ? "ai" : "template", tripped };
}

function contextSummary(ctx: DraftContext): string {
  const c = ctx.client;
  const lines: string[] = [];
  lines.push(`Client: ${c.clientName}${c.companyName ? ` (${c.companyName})` : ""}`);
  if (c.contactName) lines.push(`Primary contact: ${c.contactName}`);
  lines.push(`Status: ${c.clientStatus}; Risk: ${c.riskLevel}`);
  if (ctx.daysSinceContact !== null) {
    lines.push(
      `Last meaningful contact: ${ctx.daysSinceContact} day(s) ago (target cadence every ${c.touchCadenceDays} days)`,
    );
  }
  if (c.nextAction) lines.push(`Planned next action: ${c.nextAction}`);
  if (c.missingInformation && c.missingInformation !== "None") {
    lines.push(`Outstanding information needed: ${c.missingInformation}`);
  }
  if (ctx.callNotes.length) {
    lines.push("Recent calls:");
    for (const n of ctx.callNotes) {
      lines.push(
        `  - ${n.callDate}: ${n.summary}${n.concern && n.concern !== "None" ? ` (concern: ${n.concern})` : ""}`,
      );
    }
  }
  if (ctx.openTasks.length) {
    lines.push("Open tasks:");
    for (const t of ctx.openTasks) {
      lines.push(`  - ${t.title}${t.dueDate ? ` (due ${t.dueDate})` : ""}`);
    }
  }
  if (ctx.openEscalations.length) {
    lines.push("Open escalations (leadership decisions — do NOT resolve in the message):");
    for (const e of ctx.openEscalations) {
      lines.push(`  - ${e.reason}: ${e.decisionNeeded}`);
    }
  }
  if (ctx.expansion.length) {
    lines.push("Active expansion opportunities:");
    for (const m of ctx.expansion) {
      lines.push(`  - ${m.title} (${m.stage})`);
    }
  }
  return lines.join("\n");
}

// Deterministic fallback used whenever AI is unavailable or errors. Always
// returns a usable, clearly business-appropriate draft.
export function templateDraft(
  ctx: DraftContext,
  intent: string,
  channel: string,
): { subject: string; body: string } {
  const c = ctx.client;
  const greeting = c.contactName ? `Hi ${c.contactName},` : "Hello,";
  const label = intentLabel(intent);
  const nextAction = c.nextAction || "the next steps we discussed";
  const missing =
    c.missingInformation && c.missingInformation !== "None"
      ? c.missingInformation
      : "";

  let opening: string;
  switch (intent) {
    case "check_in":
      opening = `I wanted to check in and see how things are going on your end.`;
      break;
    case "escalation_ack":
      opening = `Thank you for flagging your recent concern. I want you to know it has my attention and we are reviewing it carefully.`;
      break;
    case "expansion_outreach":
      opening = `I've been thinking about where we can add more value for ${c.companyName || "your team"}, and I'd like to talk through a few options with you.`;
      break;
    case "renewal":
      opening = `As we approach your renewal, I wanted to reach out to make sure everything is set up the way you need it.`;
      break;
    default:
      opening = `Thank you for the time on our recent conversation.`;
  }

  const bodyLines = [greeting, "", opening];
  bodyLines.push("", `Our next step is to ${nextAction}.`);
  if (missing) {
    bodyLines.push(
      "",
      `When you have a moment, could you send over the following so we can keep moving: ${missing}.`,
    );
  }
  bodyLines.push(
    "",
    `Please let me know if you have any questions — I'm glad to help.`,
    "",
    "Best regards,",
    "Gregg",
  );

  const subject =
    channel === "call_script"
      ? `Call script — ${label} — ${c.clientName}`
      : `${label} — ${c.clientName}`;

  return { subject, body: bodyLines.join("\n") };
}

async function aiDraft(
  ctx: DraftContext,
  intent: string,
  channel: string,
  tone: string,
  instructions: string,
  log: Request["log"],
): Promise<{ subject: string; body: string } | null> {
  if (
    !process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"] ||
    !process.env["AI_INTEGRATIONS_OPENAI_API_KEY"]
  ) {
    return null;
  }
  try {
    const { openai } = await import("@workspace/integrations-openai-ai-server");
    const channelWord =
      channel === "text"
        ? "a short SMS/text message"
        : channel === "call_script"
          ? "a phone call script with talking points"
          : "an email";
    const system = [
      "You are an assistant that drafts client-facing communications for Gregg, an account manager at Contractor Compliance Authority (a contractor compliance services firm).",
      "Write a professional, warm, concise message based ONLY on the provided context.",
      "STRICT BOUNDARIES: This is a DRAFT for Gregg to review and send himself. Do NOT promise, approve, or decide anything about pricing, refunds, legal matters, compliance opinions, or qualifier/placement approvals. If the context mentions such an item, acknowledge it generally and say it is being reviewed — never commit to an outcome.",
      "Do not invent facts not present in the context. Do not fabricate dates, numbers, or commitments.",
      `Output format: first line 'Subject: <subject>' (omit Subject line for a text message), then a blank line, then the message body.`,
    ].join(" ");
    const user = [
      `Draft ${channelWord} for the intent: ${intentLabel(intent)}.`,
      tone ? `Tone: ${tone}.` : "",
      instructions ? `Additional instructions from Gregg: ${instructions}` : "",
      "",
      "CLIENT CONTEXT:",
      contextSummary(ctx),
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return null;

    const match = text.match(/^subject:\s*(.+?)\s*\n([\s\S]*)$/i);
    if (match && match[1]) {
      return { subject: match[1].trim(), body: (match[2] ?? "").trim() };
    }
    const fallbackSubject =
      channel === "call_script"
        ? `Call script — ${intentLabel(intent)} — ${ctx.client.clientName}`
        : `${intentLabel(intent)} — ${ctx.client.clientName}`;
    return { subject: fallbackSubject, body: text };
  } catch (err) {
    log.warn(
      { err, clientId: ctx.client.id },
      "AI draft generation failed; falling back to template",
    );
    return null;
  }
}

router.get("/communication-drafts", async (req: Request, res: Response) => {
  const clientId = (req.query["clientId"] as string | undefined)?.trim();
  const status = (req.query["status"] as string | undefined)?.trim();

  const conditions = [];
  if (clientId) conditions.push(eq(communicationDraftsTable.clientId, clientId));
  if (status) conditions.push(eq(communicationDraftsTable.status, status));

  const rows = await db
    .select()
    .from(communicationDraftsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(communicationDraftsTable.createdAt));
  res.json(rows.map(toCommunicationDraft));
});

router.post(
  "/communication-drafts/generate",
  async (req: Request, res: Response) => {
    const body = GenerateCommunicationDraftBody.parse(req.body);
    const ctx = await gatherContext(body.clientId);
    if (!ctx) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    const intent = body.intent.trim() || "other";
    const channel = (body.channel ?? "email").trim() || "email";
    const tone = (body.tone ?? "").trim();
    const instructions = (body.instructions ?? "").trim();

    const ai = await aiDraft(ctx, intent, channel, tone, instructions, req.log);
    const { result, source, tripped } = resolveDraft(ai, ctx, intent, channel);
    if (tripped) {
      req.log.warn(
        { clientId: body.clientId },
        "AI draft tripped decision-boundary guard; using template fallback",
      );
    }

    const actor = actorOf(req);
    const inserted = await db
      .insert(communicationDraftsTable)
      .values({
        clientId: body.clientId,
        intent,
        channel,
        tone,
        instructions,
        subject: result.subject,
        body: result.body,
        source,
        status: "draft",
        createdByUserId: actor.id,
        createdByLabel: actor.label,
      })
      .returning();
    const row = inserted[0]!;

    await logActivity(db, {
      actorUserId: actor.id,
      actorLabel: actor.label,
      action: "communication_drafted",
      entityType: "communication_draft",
      entityId: row.id,
      clientId: row.clientId,
      summary: `Drafted ${intentLabel(intent)} (${source === "ai" ? "AI" : "template"})`,
      changes: { intent, channel, source },
    });

    res.status(201).json(toCommunicationDraft(row));
  },
);

router.get(
  "/communication-drafts/:draftId",
  async (req: Request, res: Response) => {
    const draftId = strParam(req, "draftId");
    const rows = await db
      .select()
      .from(communicationDraftsTable)
      .where(eq(communicationDraftsTable.id, draftId))
      .limit(1);
    if (!rows[0]) {
      res.status(404).json({ error: "Draft not found" });
      return;
    }
    res.json(toCommunicationDraft(rows[0]));
  },
);

router.patch(
  "/communication-drafts/:draftId",
  async (req: Request, res: Response) => {
    const draftId = strParam(req, "draftId");
    const body = UpdateCommunicationDraftBody.parse(req.body);
    if (body.status !== undefined && !ALLOWED_STATUSES.has(body.status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const existingRows = await db
      .select()
      .from(communicationDraftsTable)
      .where(eq(communicationDraftsTable.id, draftId))
      .limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: "Draft not found" });
      return;
    }

    const updates: Record<string, unknown> = {};
    for (const key of [
      "subject",
      "body",
      "intent",
      "channel",
      "tone",
      "status",
    ] as const) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    // Editing the content of a fresh draft moves it to "edited" so the
    // lifecycle stays meaningful, unless the caller set status explicitly.
    const editsContent =
      updates.subject !== undefined || updates.body !== undefined;
    if (editsContent && updates.status === undefined && existing.status === "draft") {
      updates.status = "edited";
    }

    if (Object.keys(updates).length === 0) {
      res.json(toCommunicationDraft(existing));
      return;
    }

    const updated = await db
      .update(communicationDraftsTable)
      .set(updates)
      .where(eq(communicationDraftsTable.id, draftId))
      .returning();
    if (!updated[0]) {
      res.status(404).json({ error: "Draft not found" });
      return;
    }
    const actor = actorOf(req);
    await logActivity(db, {
      actorUserId: actor.id,
      actorLabel: actor.label,
      action: "communication_draft_updated",
      entityType: "communication_draft",
      entityId: draftId,
      clientId: updated[0].clientId,
      summary: "Updated communication draft",
      changes: updates,
    });
    res.json(toCommunicationDraft(updated[0]));
  },
);

router.delete(
  "/communication-drafts/:draftId",
  async (req: Request, res: Response) => {
    const draftId = strParam(req, "draftId");
    const deleted = await db
      .delete(communicationDraftsTable)
      .where(eq(communicationDraftsTable.id, draftId))
      .returning();
    if (!deleted[0]) {
      res.status(404).json({ error: "Draft not found" });
      return;
    }
    const actor = actorOf(req);
    await logActivity(db, {
      actorUserId: actor.id,
      actorLabel: actor.label,
      action: "communication_draft_deleted",
      entityType: "communication_draft",
      entityId: draftId,
      clientId: deleted[0].clientId,
      summary: "Deleted communication draft",
    });
    res.json({ ok: true });
  },
);

export default router;
