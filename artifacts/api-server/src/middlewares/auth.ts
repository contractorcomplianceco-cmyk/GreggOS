import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { db, usersTable, type User } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export interface AuthedRequest extends Request {
  localUser?: User;
}

function parseEmails(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function getOrCreateUser(externalId: string): Promise<User | null> {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.externalId, externalId))
    .limit(1);
  if (existing[0]) return existing[0];

  const clerkUser = await clerkClient.users.getUser(externalId);
  const email = (
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    ""
  ).toLowerCase();
  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    email ||
    "User";

  const allow = parseEmails(process.env["ALLOWED_EMAILS"]);
  if (allow.length > 0 && email && !allow.includes(email)) {
    return null;
  }

  const adminEmails = parseEmails(process.env["ADMIN_EMAILS"]);
  const countRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(usersTable);
  const isFirstUser = (countRows[0]?.c ?? 0) === 0;
  const role =
    adminEmails.includes(email) || isFirstUser ? "admin" : "coordinator";

  const inserted = await db
    .insert(usersTable)
    .values({ externalId, email, displayName, role })
    .onConflictDoNothing({ target: usersTable.externalId })
    .returning();
  if (inserted[0]) return inserted[0];

  const again = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.externalId, externalId))
    .limit(1);
  return again[0] ?? null;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const externalId = auth?.userId;
  if (!externalId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await getOrCreateUser(externalId);
    if (!user || !user.active) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    (req as AuthedRequest).localUser = user;
    next();
  } catch (err) {
    req.log.error({ err }, "auth provisioning failed");
    res.status(500).json({ error: "Auth error" });
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const user = (req as AuthedRequest).localUser;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  next();
}

export function actorOf(req: Request): { id: string | null; label: string } {
  const user = (req as AuthedRequest).localUser;
  if (!user) return { id: null, label: "Unknown" };
  return { id: user.id, label: user.displayName || user.email || "Unknown" };
}
