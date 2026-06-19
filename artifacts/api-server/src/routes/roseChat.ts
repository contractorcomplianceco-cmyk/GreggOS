import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  roseChatSessionsTable,
  roseChatMessagesTable,
  clientsTable,
  tasksTable,
  escalationsTable,
  expansionMilestonesTable,
  type RoseChatMessage as DbRoseChatMessage,
  type Client as DbClient,
} from "@workspace/db";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  CreateRoseChatSessionBody,
  UpdateRoseChatSessionBody,
  SendRoseChatMessageBody,
} from "@workspace/api-zod";
import { toRoseSession, toRoseSessionDetail } from "../lib/mappers";
import { logActivity } from "../lib/activity";
import { actorOf } from "../middlewares/auth";
import { strParam } from "../lib/http";
import { aiConfigured, violatesBoundary } from "../lib/aiBoundary";

const router: IRouter = Router();

// Supported RoseOS conversation modes. Free-form values fall back to "general".
const MODE_LABELS: Record<string, string> = {
  brainstorm: "Brainstorm",
  help_with_client: "Help with a client",
  how_to: "How-to / guidance",
  general: "General",
};

function modeLabel(mode: string): string {
  return MODE_LABELS[mode] ?? "General";
}

function normalizeMode(mode: string): string {
  return MODE_LABELS[mode] ? mode : "general";
}

interface ClientContext {
  client: DbClient;
  openTasks: string[];
  openEscalations: string[];
  expansion: string[];
}

async function gatherClientContext(
  clientId: string,
): Promise<ClientContext | null> {
  const clientRows = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, clientId))
    .limit(1);
  const client = clientRows[0];
  if (!client) return null;

  const [taskRows, escRows, expRows] = await Promise.all([
    db.select().from(tasksTable).where(eq(tasksTable.clientId, clientId)),
    db
      .select()
      .from(escalationsTable)
      .where(eq(escalationsTable.clientId, clientId)),
    db
      .select()
      .from(expansionMilestonesTable)
      .where(eq(expansionMilestonesTable.clientId, clientId)),
  ]);

  const openTaskStatuses = new Set(["Open", "In Progress", "Waiting"]);
  const openEscStatuses = new Set(["Open", "Under Review"]);

  return {
    client,
    openTasks: taskRows
      .filter((t) => openTaskStatuses.has(t.status))
      .map((t) => t.title),
    openEscalations: escRows
      .filter((e) => openEscStatuses.has(e.status))
      .map((e) => e.reason),
    expansion: expRows
      .filter((m) => m.status !== "Won" && m.status !== "Lost")
      .map((m) => `${m.title} (${m.stage})`),
  };
}

function clientContextText(ctx: ClientContext): string {
  const c = ctx.client;
  const lines: string[] = [];
  lines.push(`Client: ${c.clientName}${c.companyName ? ` (${c.companyName})` : ""}`);
  lines.push(`Status: ${c.clientStatus}; Risk: ${c.riskLevel}`);
  if (c.nextAction) lines.push(`Planned next action: ${c.nextAction}`);
  if (c.missingInformation && c.missingInformation !== "None") {
    lines.push(`Outstanding info needed: ${c.missingInformation}`);
  }
  if (ctx.openTasks.length) {
    lines.push(`Open tasks: ${ctx.openTasks.join("; ")}`);
  }
  if (ctx.openEscalations.length) {
    lines.push(
      `Open escalations (leadership decisions — do NOT resolve): ${ctx.openEscalations.join("; ")}`,
    );
  }
  if (ctx.expansion.length) {
    lines.push(`Active expansion: ${ctx.expansion.join("; ")}`);
  }
  return lines.join("\n");
}

// Deterministic fallback reply. Always returns useful, safe, advisory text so
// the assistant works even with no AI configured or on any AI error.
function templateReply(
  mode: string,
  userText: string,
  ctx: ClientContext | null,
): string {
  const trimmed = userText.trim();
  const topic = trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
  const lines: string[] = [];

  switch (mode) {
    case "brainstorm":
      lines.push(
        `Here are a few angles to brainstorm on "${topic}":`,
        "",
        "1. What outcome would make this a clear win, and what's the smallest first step toward it?",
        "2. Who else should be involved, and what would they need from you to move?",
        "3. What's the main risk or unknown, and how could you de-risk it this week?",
      );
      break;
    case "help_with_client":
      lines.push(
        ctx
          ? `Working from what's on file for ${ctx.client.clientName}, here's how I'd approach "${topic}":`
          : `Here's how I'd approach "${topic}":`,
      );
      if (ctx) {
        lines.push("", clientContextText(ctx));
      }
      lines.push(
        "",
        "Suggested next steps:",
        "- Confirm the client's current priority in your own words before acting.",
        "- Tie any follow-up to a concrete owner and date.",
        "- Keep pricing, refunds, legal, compliance, and qualifier/placement decisions with leadership — surface them, don't commit.",
      );
      break;
    case "how_to":
      lines.push(
        `On "${topic}" — here's a practical walkthrough:`,
        "",
        "1. Clarify exactly what 'done' looks like.",
        "2. Identify which cockpit screen owns this (Clients, Tasks, Expansion, Relationships, Requests, etc.).",
        "3. Make the change there, then verify it shows up where you expect.",
        "",
        "If you tell me the specific screen, I can be more precise.",
      );
      break;
    default:
      lines.push(
        `Here's my read on "${topic}":`,
        "",
        "- Restate the goal in one sentence so we're aligned.",
        "- List the two or three things that actually move it forward.",
        "- Decide the single next action and who owns it.",
      );
  }

  lines.push(
    "",
    "(Advisory only — I help you think and draft; I don't approve pricing, refunds, legal, compliance, or qualifier/placement decisions.)",
  );
  return lines.join("\n");
}

async function aiReply(
  mode: string,
  history: DbRoseChatMessage[],
  ctx: ClientContext | null,
  log: Request["log"],
): Promise<string | null> {
  if (!aiConfigured()) return null;
  try {
    const { openai } = await import("@workspace/integrations-openai-ai-server");
    const system = [
      "You are RoseOS, an internal executive assistant for Gregg, an account manager at Contractor Compliance Authority (a contractor compliance services firm).",
      `Current mode: ${modeLabel(mode)}.`,
      "Be concise, practical, and operationally useful. Help Gregg think, plan, brainstorm, and learn how to use his cockpit.",
      "STRICT BOUNDARIES: You are advisory only. NEVER approve, promise, or decide anything about pricing, refunds, legal matters, compliance opinions, or qualifier/placement approvals. Surface those as items for leadership review instead of committing to an outcome.",
      "Do not invent client facts beyond any context provided.",
    ].join(" ");

    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [{ role: "system", content: system }];
    if (ctx) {
      messages.push({
        role: "system",
        content: `CLIENT CONTEXT:\n${clientContextText(ctx)}`,
      });
    }
    for (const m of history) {
      if (m.role === "user" || m.role === "assistant") {
        messages.push({ role: m.role, content: m.content });
      }
    }

    const completion = await openai.chat.completions.create(
      {
        model: "gpt-5.4",
        max_completion_tokens: 8192,
        messages,
      },
      { timeout: 30000, maxRetries: 0 },
    );
    const text = completion.choices[0]?.message?.content?.trim();
    return text || null;
  } catch (err) {
    log.warn({ err }, "RoseOS AI reply failed; falling back to template");
    return null;
  }
}

// Generate an assistant reply, screening AI output through the boundary guard.
// A trip discards the AI text and uses the safe template instead.
function resolveReply(
  ai: string | null,
  mode: string,
  userText: string,
  ctx: ClientContext | null,
): { content: string; source: "ai" | "template"; tripped: boolean } {
  let kept = ai;
  let tripped = false;
  if (kept && violatesBoundary(kept)) {
    kept = null;
    tripped = true;
  }
  const content = kept ?? templateReply(mode, userText, ctx);
  return { content, source: kept ? "ai" : "template", tripped };
}

function titleFrom(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "New conversation";
  return t.length > 60 ? `${t.slice(0, 57)}...` : t;
}

router.get("/rose-chat-sessions", async (req: Request, res: Response) => {
  const mode = (req.query["mode"] as string | undefined)?.trim();
  const clientId = (req.query["clientId"] as string | undefined)?.trim();
  const conditions = [];
  if (mode) conditions.push(eq(roseChatSessionsTable.mode, mode));
  if (clientId) conditions.push(eq(roseChatSessionsTable.clientId, clientId));

  const rows = await db
    .select()
    .from(roseChatSessionsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(roseChatSessionsTable.updatedAt));
  res.json(rows.map(toRoseSession));
});

router.post("/rose-chat-sessions", async (req: Request, res: Response) => {
  const body = CreateRoseChatSessionBody.parse(req.body);
  const mode = normalizeMode(body.mode.trim());
  const clientId = body.clientId ?? null;
  const firstMessage = (body.message ?? "").trim();
  const actor = actorOf(req);

  const title = body.title?.trim()
    ? body.title.trim()
    : firstMessage
      ? titleFrom(firstMessage)
      : "New conversation";

  const insertedSession = await db
    .insert(roseChatSessionsTable)
    .values({
      title,
      mode,
      clientId,
      createdByUserId: actor.id,
      createdByLabel: actor.label,
    })
    .returning();
  const session = insertedSession[0]!;

  if (firstMessage) {
    await db.insert(roseChatMessagesTable).values({
      sessionId: session.id,
      role: "user",
      content: firstMessage,
      source: "",
    });
    const ctx = clientId ? await gatherClientContext(clientId) : null;
    const history = await db
      .select()
      .from(roseChatMessagesTable)
      .where(eq(roseChatMessagesTable.sessionId, session.id))
      .orderBy(asc(roseChatMessagesTable.createdAt));
    const ai = await aiReply(mode, history, ctx, req.log);
    const { content, source, tripped } = resolveReply(
      ai,
      mode,
      firstMessage,
      ctx,
    );
    if (tripped) {
      req.log.warn(
        { sessionId: session.id },
        "RoseOS reply tripped decision-boundary guard; using template",
      );
    }
    await db.insert(roseChatMessagesTable).values({
      sessionId: session.id,
      role: "assistant",
      content,
      source,
    });
  }

  await logActivity(db, {
    actorUserId: actor.id,
    actorLabel: actor.label,
    action: "rose_session_started",
    entityType: "rose_chat_session",
    entityId: session.id,
    clientId,
    summary: `Started RoseOS session (${modeLabel(mode)})`,
    changes: { mode },
  });

  const messages = await db
    .select()
    .from(roseChatMessagesTable)
    .where(eq(roseChatMessagesTable.sessionId, session.id))
    .orderBy(asc(roseChatMessagesTable.createdAt));
  res.status(201).json(toRoseSessionDetail(session, messages));
});

router.get("/rose-chat-sessions/:sessionId", async (req: Request, res: Response) => {
  const sessionId = strParam(req, "sessionId");
  const rows = await db
    .select()
    .from(roseChatSessionsTable)
    .where(eq(roseChatSessionsTable.id, sessionId))
    .limit(1);
  const session = rows[0];
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const messages = await db
    .select()
    .from(roseChatMessagesTable)
    .where(eq(roseChatMessagesTable.sessionId, sessionId))
    .orderBy(asc(roseChatMessagesTable.createdAt));
  res.json(toRoseSessionDetail(session, messages));
});

router.patch(
  "/rose-chat-sessions/:sessionId",
  async (req: Request, res: Response) => {
    const sessionId = strParam(req, "sessionId");
    const body = UpdateRoseChatSessionBody.parse(req.body);
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates["title"] = body.title;
    if (body.mode !== undefined) updates["mode"] = normalizeMode(body.mode);
    if (body.clientId !== undefined) updates["clientId"] = body.clientId ?? null;

    if (Object.keys(updates).length === 0) {
      const rows = await db
        .select()
        .from(roseChatSessionsTable)
        .where(eq(roseChatSessionsTable.id, sessionId))
        .limit(1);
      if (!rows[0]) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      res.json(toRoseSession(rows[0]));
      return;
    }

    const updated = await db
      .update(roseChatSessionsTable)
      .set(updates)
      .where(eq(roseChatSessionsTable.id, sessionId))
      .returning();
    if (!updated[0]) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(toRoseSession(updated[0]));
  },
);

router.delete(
  "/rose-chat-sessions/:sessionId",
  async (req: Request, res: Response) => {
    const sessionId = strParam(req, "sessionId");
    const deleted = await db
      .delete(roseChatSessionsTable)
      .where(eq(roseChatSessionsTable.id, sessionId))
      .returning();
    if (!deleted[0]) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json({ ok: true });
  },
);

router.post(
  "/rose-chat-sessions/:sessionId/messages",
  async (req: Request, res: Response) => {
    const sessionId = strParam(req, "sessionId");
    const body = SendRoseChatMessageBody.parse(req.body);
    const userText = body.content.trim();
    if (!userText) {
      res.status(400).json({ error: "Message content is required" });
      return;
    }

    const sessionRows = await db
      .select()
      .from(roseChatSessionsTable)
      .where(eq(roseChatSessionsTable.id, sessionId))
      .limit(1);
    const session = sessionRows[0];
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    await db.insert(roseChatMessagesTable).values({
      sessionId,
      role: "user",
      content: userText,
      source: "",
    });

    const ctx = session.clientId
      ? await gatherClientContext(session.clientId)
      : null;
    const history = await db
      .select()
      .from(roseChatMessagesTable)
      .where(eq(roseChatMessagesTable.sessionId, sessionId))
      .orderBy(asc(roseChatMessagesTable.createdAt));

    const ai = await aiReply(session.mode, history, ctx, req.log);
    const { content, source, tripped } = resolveReply(
      ai,
      session.mode,
      userText,
      ctx,
    );
    if (tripped) {
      req.log.warn(
        { sessionId },
        "RoseOS reply tripped decision-boundary guard; using template",
      );
    }

    await db.insert(roseChatMessagesTable).values({
      sessionId,
      role: "assistant",
      content,
      source,
    });

    // Keep the session ordered to the top and freshen its title if it was a
    // default placeholder.
    const sessionUpdates: Record<string, unknown> = { updatedAt: new Date() };
    if (
      session.title === "New conversation" &&
      history.filter((m) => m.role === "user").length === 1
    ) {
      sessionUpdates["title"] = titleFrom(userText);
    }
    await db
      .update(roseChatSessionsTable)
      .set(sessionUpdates)
      .where(eq(roseChatSessionsTable.id, sessionId));

    const finalSessionRows = await db
      .select()
      .from(roseChatSessionsTable)
      .where(eq(roseChatSessionsTable.id, sessionId))
      .limit(1);
    const messages = await db
      .select()
      .from(roseChatMessagesTable)
      .where(eq(roseChatMessagesTable.sessionId, sessionId))
      .orderBy(asc(roseChatMessagesTable.createdAt));
    res
      .status(201)
      .json(toRoseSessionDetail(finalSessionRows[0] ?? session, messages));
  },
);

export default router;
