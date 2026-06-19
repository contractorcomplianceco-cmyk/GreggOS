import { Router, type IRouter, type Request, type Response } from "express";
import { db, emailDraftsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import {
  GenerateEmailDraftBody,
  UpdateEmailDraftBody,
} from "@workspace/api-zod";
import { toEmailDraft } from "../lib/mappers";
import { logActivity } from "../lib/activity";
import { actorOf } from "../middlewares/auth";
import { strParam } from "../lib/http";
import { aiConfigured, violatesBoundary } from "../lib/aiBoundary";

const router: IRouter = Router();

// Draft-lifecycle statuses only. There is deliberately NO "sent" state —
// nothing is ever sent from this app. "used" means Gregg copied the draft to
// send it himself; "discarded" means he abandoned it.
export const ALLOWED_EMAIL_STATUSES = new Set([
  "draft",
  "edited",
  "used",
  "discarded",
]);

interface EmailInputs {
  purpose: string;
  audience: string;
  tone: string;
  keyPoints: string;
}

// Deterministic fallback used whenever AI is unavailable or errors, or when AI
// output trips the decision-boundary guard.
function templateEmail(inputs: EmailInputs): {
  subject: string;
  body: string;
} {
  const greeting = inputs.audience.trim()
    ? `Hi ${inputs.audience.trim()},`
    : "Hello,";
  const purpose = inputs.purpose.trim() || "follow up on our recent discussion";
  const subject = purpose.length > 70 ? `${purpose.slice(0, 67)}...` : purpose;

  const bodyLines = [greeting, "", `I'm reaching out to ${purpose}.`];

  const points = inputs.keyPoints
    .split(/\r?\n/)
    .map((p) => p.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean);
  if (points.length) {
    bodyLines.push("", "A few key points:");
    for (const p of points) bodyLines.push(`- ${p}`);
  }

  bodyLines.push(
    "",
    "Please let me know if you have any questions or would like to discuss further.",
    "",
    "Best regards,",
    "Gregg",
  );

  return {
    subject: subject.charAt(0).toUpperCase() + subject.slice(1),
    body: bodyLines.join("\n"),
  };
}

async function aiEmail(
  inputs: EmailInputs,
  log: Request["log"],
): Promise<{ subject: string; body: string } | null> {
  if (!aiConfigured()) return null;
  try {
    const { openai } = await import("@workspace/integrations-openai-ai-server");
    const system = [
      "You draft professional emails for Gregg, an account manager at Contractor Compliance Authority (a contractor compliance services firm).",
      "Write a clear, warm, concise email based ONLY on the provided inputs.",
      "STRICT BOUNDARIES: This is a DRAFT for Gregg to review and send himself. Do NOT promise, approve, or decide anything about pricing, refunds, legal matters, compliance opinions, or qualifier/placement approvals. Acknowledge such items generally and say they are being reviewed — never commit to an outcome.",
      "Do not invent facts not present in the inputs.",
      "Output format: first line 'Subject: <subject>', then a blank line, then the email body.",
    ].join(" ");
    const user = [
      `Purpose: ${inputs.purpose}`,
      inputs.audience ? `Audience / recipient: ${inputs.audience}` : "",
      inputs.tone ? `Tone: ${inputs.tone}` : "",
      inputs.keyPoints ? `Key points to include:\n${inputs.keyPoints}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await openai.chat.completions.create(
      {
        model: "gpt-5.4",
        max_completion_tokens: 8192,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
      { timeout: 30000, maxRetries: 0 },
    );
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return null;
    const match = text.match(/^subject:\s*(.+?)\s*\n([\s\S]*)$/i);
    if (match && match[1]) {
      return { subject: match[1].trim(), body: (match[2] ?? "").trim() };
    }
    return { subject: inputs.purpose.slice(0, 70) || "Email draft", body: text };
  } catch (err) {
    log.warn({ err }, "AI email generation failed; falling back to template");
    return null;
  }
}

function resolveEmail(
  ai: { subject: string; body: string } | null,
  inputs: EmailInputs,
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
  const result = kept ?? templateEmail(inputs);
  return { result, source: kept ? "ai" : "template", tripped };
}

router.get("/email-drafts", async (req: Request, res: Response) => {
  const status = (req.query["status"] as string | undefined)?.trim();
  const rows = await db
    .select()
    .from(emailDraftsTable)
    .where(status ? eq(emailDraftsTable.status, status) : undefined)
    .orderBy(desc(emailDraftsTable.createdAt));
  res.json(rows.map(toEmailDraft));
});

router.post("/email-drafts/generate", async (req: Request, res: Response) => {
  const body = GenerateEmailDraftBody.parse(req.body);
  const inputs: EmailInputs = {
    purpose: body.purpose.trim(),
    audience: (body.audience ?? "").trim(),
    tone: (body.tone ?? "").trim(),
    keyPoints: (body.keyPoints ?? "").trim(),
  };

  const ai = await aiEmail(inputs, req.log);
  const { result, source, tripped } = resolveEmail(ai, inputs);
  if (tripped) {
    req.log.warn(
      {},
      "AI email tripped decision-boundary guard; using template fallback",
    );
  }

  const actor = actorOf(req);
  const inserted = await db
    .insert(emailDraftsTable)
    .values({
      purpose: inputs.purpose,
      audience: inputs.audience,
      tone: inputs.tone,
      keyPoints: inputs.keyPoints,
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
    action: "email_drafted",
    entityType: "email_draft",
    entityId: row.id,
    summary: `Drafted email (${source === "ai" ? "AI" : "template"})`,
    changes: { source },
  });

  res.status(201).json(toEmailDraft(row));
});

router.get("/email-drafts/:draftId", async (req: Request, res: Response) => {
  const draftId = strParam(req, "draftId");
  const rows = await db
    .select()
    .from(emailDraftsTable)
    .where(eq(emailDraftsTable.id, draftId))
    .limit(1);
  if (!rows[0]) {
    res.status(404).json({ error: "Email draft not found" });
    return;
  }
  res.json(toEmailDraft(rows[0]));
});

router.patch("/email-drafts/:draftId", async (req: Request, res: Response) => {
  const draftId = strParam(req, "draftId");
  const body = UpdateEmailDraftBody.parse(req.body);
  if (body.status !== undefined && !ALLOWED_EMAIL_STATUSES.has(body.status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  const existingRows = await db
    .select()
    .from(emailDraftsTable)
    .where(eq(emailDraftsTable.id, draftId))
    .limit(1);
  const existing = existingRows[0];
  if (!existing) {
    res.status(404).json({ error: "Email draft not found" });
    return;
  }

  const updates: Record<string, unknown> = {};
  for (const key of [
    "subject",
    "body",
    "purpose",
    "audience",
    "tone",
    "keyPoints",
    "status",
  ] as const) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const editsContent =
    updates["subject"] !== undefined || updates["body"] !== undefined;
  if (
    editsContent &&
    updates["status"] === undefined &&
    existing.status === "draft"
  ) {
    updates["status"] = "edited";
  }

  if (Object.keys(updates).length === 0) {
    res.json(toEmailDraft(existing));
    return;
  }

  const updated = await db
    .update(emailDraftsTable)
    .set(updates)
    .where(eq(emailDraftsTable.id, draftId))
    .returning();
  res.json(toEmailDraft(updated[0]!));
});

router.delete("/email-drafts/:draftId", async (req: Request, res: Response) => {
  const draftId = strParam(req, "draftId");
  const deleted = await db
    .delete(emailDraftsTable)
    .where(eq(emailDraftsTable.id, draftId))
    .returning();
  if (!deleted[0]) {
    res.status(404).json({ error: "Email draft not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;
