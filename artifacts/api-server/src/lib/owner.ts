import { db, usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

export async function resolveOwnerUserId(
  label: string | null | undefined,
): Promise<string | null> {
  const trimmed = (label ?? "").trim();
  if (!trimmed) return null;
  const rows = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(sql`lower(${usersTable.displayName}) = lower(${trimmed})`)
    .limit(1);
  return rows[0]?.id ?? null;
}
