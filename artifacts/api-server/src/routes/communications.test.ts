import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { pool } from "@workspace/db";
import { UpdateCommunicationDraftBody } from "@workspace/api-zod";
import communicationsRouter from "./communications";
import {
  violatesBoundary,
  templateDraft,
  resolveDraft,
  ALLOWED_STATUSES,
} from "./communications";

// A DraftContext stub good enough for templateDraft / contextSummary, which are
// the only consumers of ctx inside resolveDraft's fallback path.
function makeCtx() {
  return {
    client: {
      id: "client-1",
      clientName: "ABC Construction LLC",
      companyName: "ABC Construction",
      contactName: "Dana",
      clientStatus: "Active",
      riskLevel: "Low",
      lastMeaningfulContact: new Date().toISOString(),
      touchCadenceDays: 30,
      nextAction: "schedule the quarterly review",
      missingInformation: "None",
    },
    daysSinceContact: 2,
    callNotes: [],
    openTasks: [],
    openEscalations: [],
    expansion: [],
  } as unknown as Parameters<typeof templateDraft>[0];
}

// ---------------------------------------------------------------------------
// 1. violatesBoundary — one positive per prohibited category plus safe-text
//    negatives. This is the deterministic core of the AI safety guard.
// ---------------------------------------------------------------------------
describe("violatesBoundary — prohibited commitment language is flagged", () => {
  const prohibited: Array<[string, string]> = [
    ["refund (approve -> refund)", "Good news — we have approved your refund."],
    [
      "refund (refund -> issued)",
      "Your refund has been issued in full this morning.",
    ],
    [
      "pricing (lock in discount)",
      "I can lock in that discount on your rate for next year.",
    ],
    [
      "pricing (price -> guaranteed)",
      "The price is guaranteed not to change going forward.",
    ],
    [
      "compliance (compliance -> assured)",
      "You are fully compliant and assured there is no risk.",
    ],
    [
      "legal (legal -> in the clear)",
      "Legally you are guaranteed to be in the clear here.",
    ],
    [
      "qualifier/placement (placement -> approved)",
      "Your qualifier placement has been approved by our team.",
    ],
    [
      "qualifier/placement (confirmed -> qualifier)",
      "We confirmed the qualifier you need for the license.",
    ],
  ];

  for (const [name, text] of prohibited) {
    it(`flags ${name}`, () => {
      assert.equal(violatesBoundary(text), true);
    });
  }
});

describe("violatesBoundary — safe business language is allowed", () => {
  const safe: Array<[string, string]> = [
    [
      "generic check-in",
      "Hi Dana, just checking in to see how things are going on your end.",
    ],
    [
      "acknowledges a refund question without committing",
      "Thanks for raising the refund question — it is being reviewed and I will follow up.",
    ],
    [
      "mentions pricing without committing",
      "Happy to discuss pricing options on a call whenever works for you.",
    ],
    [
      "mentions compliance generally",
      "Our team is reviewing the compliance items and will share an update soon.",
    ],
    [
      "mentions placement without committing",
      "I will check on the status of your qualifier placement and circle back.",
    ],
    ["empty string", ""],
  ];

  for (const [name, text] of safe) {
    it(`allows ${name}`, () => {
      assert.equal(violatesBoundary(text), false);
    });
  }
});

// ---------------------------------------------------------------------------
// 2. resolveDraft — the AI-vs-template fallback decision. This is exactly the
//    value the generate handler persists as `source`, so verifying it here
//    verifies that a guard trip forces the persisted draft to the template.
// ---------------------------------------------------------------------------
describe("resolveDraft — guard trip forces the template fallback", () => {
  it("keeps safe AI output (source = ai)", () => {
    const ctx = makeCtx();
    const ai = {
      subject: "Quick check-in",
      body: "Hi Dana, just wanted to see how the project is progressing.",
    };
    const out = resolveDraft(ai, ctx, "check_in", "email");
    assert.equal(out.source, "ai");
    assert.equal(out.tripped, false);
    assert.deepEqual(out.result, ai);
  });

  it("falls back to the template when AI trips the guard (source = template)", () => {
    const ctx = makeCtx();
    const ai = {
      subject: "Refund",
      body: "We have approved your refund of the full amount.",
    };
    const out = resolveDraft(ai, ctx, "follow_up", "email");
    assert.equal(out.source, "template");
    assert.equal(out.tripped, true);
    // The persisted content is the safe template, not the prohibited AI text.
    assert.deepEqual(out.result, templateDraft(ctx, "follow_up", "email"));
    assert.equal(
      violatesBoundary(`${out.result.subject}\n${out.result.body}`),
      false,
    );
  });

  it("uses the template when there is no AI output (source = template)", () => {
    const ctx = makeCtx();
    const out = resolveDraft(null, ctx, "renewal", "email");
    assert.equal(out.source, "template");
    assert.equal(out.tripped, false);
  });
});

// ---------------------------------------------------------------------------
// 3. Status lifecycle guard — the allowed set and the zod schema that enforces
//    it (the schema rejection is what produces the HTTP 400, asserted below).
// ---------------------------------------------------------------------------
describe("status lifecycle guard", () => {
  it("ALLOWED_STATUSES is exactly the draft lifecycle (no send path)", () => {
    assert.deepEqual(
      [...ALLOWED_STATUSES].sort(),
      ["discarded", "draft", "edited", "used"],
    );
    assert.equal(ALLOWED_STATUSES.has("sent"), false);
    assert.equal(ALLOWED_STATUSES.has("archived"), false);
  });

  it("the request schema accepts every allowed status", () => {
    for (const status of ALLOWED_STATUSES) {
      assert.doesNotThrow(() =>
        UpdateCommunicationDraftBody.parse({ status }),
      );
    }
  });

  it("the request schema rejects statuses outside the lifecycle", () => {
    for (const status of ["sent", "archived", "approved", "deleted"]) {
      assert.throws(
        () => UpdateCommunicationDraftBody.parse({ status }),
        (err: unknown) =>
          !!err && typeof err === "object" && (err as { name?: string }).name === "ZodError",
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 4. End-to-end: PATCH with an out-of-lifecycle status is rejected with 400.
//    The router is mounted on a bare app whose error handler mirrors the real
//    server (ZodError -> 400). The invalid-status path never touches the DB
//    (zod throws first), so this runs without any database access.
// ---------------------------------------------------------------------------
describe("PATCH /communication-drafts/:id rejects invalid status with 400", () => {
  let server: import("node:http").Server;
  let baseUrl = "";

  before(async () => {
    const app: Express = express();
    app.use(express.json());
    app.use(communicationsRouter);
    app.use(
      (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
        const name =
          err && typeof err === "object" && "name" in err
            ? (err as { name?: string }).name
            : undefined;
        if (name === "ZodError") {
          res.status(400).json({ error: "Validation failed" });
          return;
        }
        res.status(500).json({ error: "Internal server error" });
      },
    );
    server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await pool.end();
  });

  for (const status of ["sent", "archived", "approved"]) {
    it(`rejects status "${status}" with 400`, async () => {
      const res = await fetch(`${baseUrl}/communication-drafts/draft-1`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      assert.equal(res.status, 400);
    });
  }
});
