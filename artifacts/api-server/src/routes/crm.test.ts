import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  pool,
  db,
  crmLinksTable,
  usersTable,
  activityLogTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import crmRouter from "./crm";

// ---------------------------------------------------------------------------
// CRM export approve/push safety. The lifecycle is EXPORT-ONLY: nothing may be
// marked "pushed to Zoho" without the explicit PATCH push step. These tests are
// DB-backed integration tests exercising the real handlers in routes/crm.ts.
//
// The router runs behind an injected auth middleware that sets req.localUser to
// a real seeded user, so actorOf(req) resolves an id and the pushed-by stamp
// can be asserted. The error handler mirrors the real server (ZodError -> 400).
// ---------------------------------------------------------------------------

let server: import("node:http").Server;
let baseUrl = "";
let actorUserId = "";

// crm_links rows created by these tests, cleaned up afterwards.
const createdEntityIds: string[] = [];

function trackEntityId(id: string): string {
  createdEntityIds.push(id);
  return id;
}

before(async () => {
  const userRows = await db
    .insert(usersTable)
    .values({
      externalId: `crm-test-${randomUUID()}`,
      email: "crm-test@example.com",
      displayName: "CRM Test Actor",
      role: "admin",
    })
    .returning();
  actorUserId = userRows[0]!.id;

  const app: Express = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as unknown as { localUser: unknown }).localUser = {
      id: actorUserId,
      email: "crm-test@example.com",
      displayName: "CRM Test Actor",
      role: "admin",
    };
    next();
  });
  app.use(crmRouter);
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
  if (createdEntityIds.length) {
    await db
      .delete(crmLinksTable)
      .where(inArray(crmLinksTable.entityId, createdEntityIds));
    await db
      .delete(activityLogTable)
      .where(inArray(activityLogTable.entityId, createdEntityIds));
  }
  // Activity rows reference the crm_link id (not the entity id); clear anything
  // this actor wrote so the user row can be removed without FK trouble.
  await db
    .delete(activityLogTable)
    .where(eq(activityLogTable.actorUserId, actorUserId));
  if (actorUserId) {
    await db.delete(usersTable).where(eq(usersTable.id, actorUserId));
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end();
});

async function approve(body: Record<string, unknown>) {
  const res = await fetch(`${baseUrl}/crm-links`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res;
}

async function patch(linkId: string, body: Record<string, unknown>) {
  const res = await fetch(`${baseUrl}/crm-links/${linkId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res;
}

// ---------------------------------------------------------------------------
// 1. POST /crm-links is approval-only. A caller-supplied syncStatus must be
//    ignored: the created link is always "approved", never "pushed".
// ---------------------------------------------------------------------------
describe("POST /crm-links is approval-only", () => {
  it("always creates with syncStatus=approved, even from a clean body", async () => {
    const entityId = trackEntityId(randomUUID());
    const res = await approve({
      entityType: "call_note",
      entityId,
      crmModule: "Notes",
    });
    assert.equal(res.status, 200);
    const link = (await res.json()) as { syncStatus: string };
    assert.equal(link.syncStatus, "approved");
  });

  it("ignores a caller-supplied syncStatus=pushed (cannot self-mark synced)", async () => {
    const entityId = trackEntityId(randomUUID());
    const res = await approve({
      entityType: "call_note",
      entityId,
      crmModule: "Notes",
      // A malicious/buggy caller trying to short-circuit the push step:
      syncStatus: "pushed",
      crmRecordId: "zoho-should-not-stick",
      lastSyncedAt: new Date().toISOString(),
    });
    assert.equal(res.status, 200);
    const link = (await res.json()) as {
      syncStatus: string;
      crmRecordId: string | null;
      lastSyncedAt: string | null;
    };
    assert.equal(link.syncStatus, "approved");
    assert.equal(link.crmRecordId, null);
    assert.equal(link.lastSyncedAt, null);

    // Confirm at the storage layer, not just the response shape.
    const rows = await db
      .select()
      .from(crmLinksTable)
      .where(eq(crmLinksTable.entityId, entityId));
    assert.equal(rows[0]!.syncStatus, "approved");
    assert.equal(rows[0]!.crmRecordId, null);
    assert.equal(rows[0]!.lastSyncedAt, null);
  });
});

// ---------------------------------------------------------------------------
// 2. Re-approving an already-pushed link leaves its push state untouched, so a
//    pushed record can never be silently downgraded back to "approved".
// ---------------------------------------------------------------------------
describe("re-approving an already-pushed link is a no-op on push state", () => {
  it("keeps syncStatus=pushed and the captured Zoho id after re-approve", async () => {
    const entityId = trackEntityId(randomUUID());

    // Approve, then push (the only legitimate way to reach "pushed").
    const created = await approve({
      entityType: "task",
      entityId,
      crmModule: "Tasks",
    });
    const createdLink = (await created.json()) as { id: string };

    const pushed = await patch(createdLink.id, {
      syncStatus: "pushed",
      crmRecordId: "zoho-123",
    });
    assert.equal(pushed.status, 200);
    const pushedLink = (await pushed.json()) as {
      syncStatus: string;
      crmRecordId: string | null;
    };
    assert.equal(pushedLink.syncStatus, "pushed");
    assert.equal(pushedLink.crmRecordId, "zoho-123");

    // Re-approve the same (entityType, entityId).
    const reApproved = await approve({
      entityType: "task",
      entityId,
      crmModule: "Tasks",
    });
    assert.equal(reApproved.status, 200);
    const reApprovedLink = (await reApproved.json()) as {
      id: string;
      syncStatus: string;
      crmRecordId: string | null;
    };
    // Same row (idempotent upsert) with push state preserved.
    assert.equal(reApprovedLink.id, createdLink.id);
    assert.equal(reApprovedLink.syncStatus, "pushed");
    assert.equal(reApprovedLink.crmRecordId, "zoho-123");

    const rows = await db
      .select()
      .from(crmLinksTable)
      .where(eq(crmLinksTable.id, createdLink.id));
    assert.equal(rows[0]!.syncStatus, "pushed");
    assert.equal(rows[0]!.crmRecordId, "zoho-123");
  });
});

// ---------------------------------------------------------------------------
// 3. PATCH /crm-links/:id is the only path that can set pushed/failed, and on
//    a push it stamps lastSyncedAt and lastPushedByUserId.
// ---------------------------------------------------------------------------
describe("PATCH /crm-links/:id is the only push path", () => {
  it("marks pushed and stamps lastSyncedAt + lastPushedByUserId", async () => {
    const entityId = trackEntityId(randomUUID());
    const created = await approve({
      entityType: "expansion_milestone",
      entityId,
      crmModule: "Deals",
    });
    const createdLink = (await created.json()) as {
      id: string;
      syncStatus: string;
      lastSyncedAt: string | null;
    };
    // Pre-condition: a freshly approved link has no push stamps.
    assert.equal(createdLink.syncStatus, "approved");
    assert.equal(createdLink.lastSyncedAt, null);

    const res = await patch(createdLink.id, {
      syncStatus: "pushed",
      crmRecordId: "zoho-deal-9",
    });
    assert.equal(res.status, 200);
    const link = (await res.json()) as {
      syncStatus: string;
      crmRecordId: string | null;
      lastSyncedAt: string | null;
    };
    assert.equal(link.syncStatus, "pushed");
    assert.equal(link.crmRecordId, "zoho-deal-9");
    assert.notEqual(link.lastSyncedAt, null);

    // The pushed-by user is stamped server-side from the authed actor.
    const rows = await db
      .select()
      .from(crmLinksTable)
      .where(eq(crmLinksTable.id, createdLink.id));
    assert.equal(rows[0]!.lastPushedByUserId, actorUserId);
    assert.notEqual(rows[0]!.lastSyncedAt, null);
  });

  it("can record a sync failure via PATCH", async () => {
    const entityId = trackEntityId(randomUUID());
    const created = await approve({
      entityType: "call_note",
      entityId,
      crmModule: "Notes",
    });
    const createdLink = (await created.json()) as { id: string };

    const res = await patch(createdLink.id, {
      syncStatus: "failed",
      errorMessage: "Zoho rejected the payload",
    });
    assert.equal(res.status, 200);
    const link = (await res.json()) as {
      syncStatus: string;
      errorMessage: string;
    };
    assert.equal(link.syncStatus, "failed");
    assert.equal(link.errorMessage, "Zoho rejected the payload");
  });

  it("returns 404 when patching a link that does not exist", async () => {
    const res = await patch(randomUUID(), { syncStatus: "pushed" });
    assert.equal(res.status, 404);
  });
});
