---
name: CRM export lifecycle (export-only)
description: Why the crm_links approve/push split is enforced server-side and how the expansion Won/Lost revenue fields are governed.
---

# CRM export + expansion revenue lifecycle

The cockpit's CRM integration is **export-only** (Zoho-targeted): nothing pushes
automatically. The approve step and the push step are deliberately separated and
enforced on the server.

## crm_links approve vs push split
- `POST /crm-links` is **approval-only**: it forces `syncStatus="approved"`
  server-side and ignores any caller-supplied status. Re-approving an existing
  link must NOT overwrite its `syncStatus` (an already-pushed link stays pushed).
- `PATCH /crm-links/:id` is the **only** path that may set `pushed`/`failed`,
  stamp `lastSyncedAt`/`lastPushedByUserId`, and log `crm_push_status`.

**Why:** if the approve endpoint accepted `syncStatus`, a client could mark a
record `pushed` and skip the audited push step — breaking the human-reviewed,
fully-audit-logged guarantee. Keep these two transitions on separate endpoints.

**How to apply:** never re-add `syncStatus` to `CrmLinkInput` in `openapi.yaml`,
and don't let the upsert handler read it. Push-state changes go through PATCH.

## Expansion Won/Lost revenue fields
- `actualValue` = realized revenue, writable via PATCH only (not on create).
- `closedAt` is **server-managed**: stamped on Won/Lost, cleared on reopen. It is
  NOT a writable input field — keep it out of `ExpansionInput`/`ExpansionUpdate`.

**Why:** contract drift. The spec once exposed `closedAt` (and `actualValue` on
create) as writable while the server derived/ignored them — generated clients
were told fields were accepted that the server silently dropped. The contract
must match real server behavior.

**How to apply:** server-derived fields belong only in response schemas, never in
input schemas. After changing writable fields, rerun codegen so generated
types/zod match.
