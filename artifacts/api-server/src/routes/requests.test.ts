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
  requestsTable,
  clientsTable,
  usersTable,
  activityLogTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import requestsRouter from "./requests";

// ---------------------------------------------------------------------------
// Requests Hub list filtering. The OpenAPI contract documents four list
// filters on GET /requests (type, status, requestedBy, clientId); these
// DB-backed integration tests assert each one is actually enforced by the
// handler so server behavior matches the generated client contract.
//
// The router runs behind an injected auth middleware so actorOf(req) resolves a
// real seeded user (requestedByLabel is stamped from that actor on create).
// ---------------------------------------------------------------------------

let server: import("node:http").Server;
let baseUrl = "";
let actorUserId = "";
let clientAId = "";
let clientBId = "";

const createdRequestIds: string[] = [];

before(async () => {
  const userRows = await db
    .insert(usersTable)
    .values({
      externalId: `requests-test-${randomUUID()}`,
      email: "requests-test@example.com",
      displayName: "Requests Test Actor",
      role: "admin",
    })
    .returning();
  actorUserId = userRows[0]!.id;

  const clientRows = await db
    .insert(clientsTable)
    .values([
      {
        clientName: `ReqTest Client A ${randomUUID()}`,
        clientStatus: "Active",
        greggPriority: "Medium",
        riskLevel: "Low",
      },
      {
        clientName: `ReqTest Client B ${randomUUID()}`,
        clientStatus: "Active",
        greggPriority: "Medium",
        riskLevel: "Low",
      },
    ])
    .returning();
  clientAId = clientRows[0]!.id;
  clientBId = clientRows[1]!.id;

  const app: Express = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as unknown as { localUser: unknown }).localUser = {
      id: actorUserId,
      email: "requests-test@example.com",
      displayName: "Requests Test Actor",
      role: "admin",
    };
    next();
  });
  app.use(requestsRouter);
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

  // Seed a small spread of requests covering the filterable dimensions.
  const seeded = await db
    .insert(requestsTable)
    .values([
      {
        type: "purchase",
        title: "Filter test — purchase / submitted / client A",
        status: "submitted",
        priority: "Medium",
        clientId: clientAId,
        requestedByUserId: actorUserId,
        requestedByLabel: "Requests Test Actor",
      },
      {
        type: "travel",
        title: "Filter test — travel / approved / client B",
        status: "approved",
        priority: "High",
        clientId: clientBId,
        requestedByUserId: actorUserId,
        requestedByLabel: "Requests Test Actor",
      },
      {
        type: "equipment",
        title: "Filter test — equipment / submitted / no client / other requester",
        status: "submitted",
        priority: "Low",
        clientId: null,
        requestedByUserId: null,
        requestedByLabel: "Someone Else",
      },
    ])
    .returning();
  for (const r of seeded) createdRequestIds.push(r.id);
});

after(async () => {
  if (createdRequestIds.length) {
    await db
      .delete(activityLogTable)
      .where(inArray(activityLogTable.entityId, createdRequestIds));
    await db
      .delete(requestsTable)
      .where(inArray(requestsTable.id, createdRequestIds));
  }
  await db
    .delete(activityLogTable)
    .where(eq(activityLogTable.actorUserId, actorUserId));
  if (clientAId)
    await db.delete(clientsTable).where(eq(clientsTable.id, clientAId));
  if (clientBId)
    await db.delete(clientsTable).where(eq(clientsTable.id, clientBId));
  if (actorUserId)
    await db.delete(usersTable).where(eq(usersTable.id, actorUserId));
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end();
});

interface ReqRow {
  id: string;
  type: string;
  status: string;
  requestedByLabel: string;
  clientId: string | null;
}

async function list(query = ""): Promise<ReqRow[]> {
  const res = await fetch(`${baseUrl}/requests${query}`);
  assert.equal(res.status, 200);
  const all = (await res.json()) as ReqRow[];
  // Scope assertions to only the rows this test created.
  return all.filter((r) => createdRequestIds.includes(r.id));
}

describe("GET /requests honors every documented list filter", () => {
  it("filters by type", async () => {
    const rows = await list("?type=travel");
    assert.equal(rows.length, 1);
    assert.ok(rows.every((r) => r.type === "travel"));
  });

  it("filters by status", async () => {
    const rows = await list("?status=submitted");
    assert.equal(rows.length, 2);
    assert.ok(rows.every((r) => r.status === "submitted"));
  });

  it("filters by requestedBy", async () => {
    const rows = await list(`?requestedBy=${encodeURIComponent("Someone Else")}`);
    assert.equal(rows.length, 1);
    assert.ok(rows.every((r) => r.requestedByLabel === "Someone Else"));
  });

  it("filters by clientId", async () => {
    const rows = await list(`?clientId=${clientAId}`);
    assert.equal(rows.length, 1);
    assert.ok(rows.every((r) => r.clientId === clientAId));
  });

  it("returns nothing for a clientId with no requests", async () => {
    const rows = await list(`?clientId=${randomUUID()}`);
    assert.equal(rows.length, 0);
  });

  it("combines filters (status + clientId)", async () => {
    const rows = await list(`?status=approved&clientId=${clientBId}`);
    assert.equal(rows.length, 1);
    assert.ok(
      rows.every((r) => r.status === "approved" && r.clientId === clientBId),
    );
  });
});
