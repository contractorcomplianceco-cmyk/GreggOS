---
name: Cockpit mirrors generated API types
description: Keep the cockpit's hand-written type mirrors in sync with the contract after schema changes
---

The cockpit (`artifacts/cockpit/src/lib/types.ts`) keeps hand-written interfaces and enums that mirror the generated API shapes in `@workspace/api-client-react`; pages fetch via generated hooks then cast responses to these local types.

**Why:** pages predate the full-stack rewrite and read fields off the local types directly; casts give ergonomic access without importing generated types everywhere.

**How to apply:** in the contract-first flow (schema → push → openapi.yaml → codegen → server), also update the matching `lib/types.ts` interface/enum, or the casts silently go stale and the new field/value is invisible in the cockpit. Two recurring traps: (1) added fields don't appear because the cast type lacks them; (2) an enum value list (e.g. expansion stage taxonomy) drifts from the server's, so client-side `indexOf`/stage rendering breaks for valid values. Keep enum literal unions identical to what the server/seed emit.
