import { db, activityLogTable } from "@workspace/db";

type Exec = typeof db;

export interface ActivityInput {
  actorUserId?: string | null;
  actorLabel: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  clientId?: string | null;
  summary?: string;
  changes?: Record<string, unknown> | null;
}

export async function logActivity(
  exec: Exec,
  input: ActivityInput,
): Promise<void> {
  await exec.insert(activityLogTable).values({
    actorUserId: input.actorUserId ?? null,
    actorLabel: input.actorLabel,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    clientId: input.clientId ?? null,
    summary: input.summary ?? "",
    changes: input.changes ?? null,
  });
}
