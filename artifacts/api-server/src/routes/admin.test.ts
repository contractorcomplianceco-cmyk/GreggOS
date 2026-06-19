import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import adminRouter from "./admin";

// ---------------------------------------------------------------------------
// Server-side admin role boundary. Hiding the sidebar link and the cockpit page
// (see admin.test.tsx) only guards the UI; the API must independently refuse
// non-admins so a staff member can't hit /admin endpoints directly.
//
// admin.ts applies requireAdmin to every route (router.use(requireAdmin)). The
// guard runs off req.localUser and rejects with 403 BEFORE any handler touches
// the DB, so these tests exercise the real router with an injected user and need
// no database. We only assert the rejection paths here; the happy path is
// DB-backed and covered by the cockpit/admin integration behaviour.
// ---------------------------------------------------------------------------

let server: import("node:http").Server;
let baseUrl = "";
let injectedUser: { role: string } | null = null;

// One representative endpoint per HTTP verb the admin router exposes.
const ADMIN_ENDPOINTS: ReadonlyArray<{ method: string; path: string }> = [
  { method: "GET", path: "/admin/export" },
  { method: "GET", path: "/admin/users" },
  { method: "POST", path: "/admin/reset" },
  { method: "POST", path: "/admin/import" },
  { method: "PATCH", path: "/admin/users/some-user-id" },
];

before(async () => {
  const app: Express = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (injectedUser) {
      (req as unknown as { localUser: unknown }).localUser = injectedUser;
    }
    next();
  });
  app.use(adminRouter);

  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

async function call(method: string, path: string) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify({}),
  });
}

describe("admin router role boundary", () => {
  beforeEach(() => {
    injectedUser = null;
  });

  it("rejects a non-admin (coordinator) on every admin endpoint with 403", async () => {
    injectedUser = { role: "coordinator" };
    for (const { method, path } of ADMIN_ENDPOINTS) {
      const res = await call(method, path);
      assert.equal(res.status, 403, `${method} ${path} should be 403`);
      const body = (await res.json()) as { error?: string };
      assert.equal(body.error, "Admin only");
    }
  });

  it("rejects a request with no authenticated user with 403", async () => {
    injectedUser = null;
    for (const { method, path } of ADMIN_ENDPOINTS) {
      const res = await call(method, path);
      assert.equal(res.status, 403, `${method} ${path} should be 403`);
    }
  });

  it("lets an admin past the role guard (not a 403)", async () => {
    injectedUser = { role: "admin" };
    // The guard passes for admins; downstream handlers hit the DB and may fail
    // in this DB-less harness, but the one thing we assert is that the request
    // is NOT rejected by requireAdmin.
    const res = await call("GET", "/admin/export");
    assert.notEqual(res.status, 403);
  });
});
