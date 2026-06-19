---
name: Cockpit seed idempotency
description: Which tables the seed must explicitly clear because they are not FK-cascaded by the clients delete.
---

# Cockpit seed idempotency

`seedDatabase()` clears state at the top of the transaction by deleting `activity_log` and `clients`. The `clients` delete cascades to most child tables (tasks, escalations, signals, expansion, etc.) via their `client_id` FKs, so those are wiped for free.

**Rule:** any new table that is NOT cascade-deleted by the `clients` delete must be explicitly deleted at the top of the seed, or reseeding accumulates duplicates / leaves stale rows.

**Why:** tables whose `client_id` is `onDelete: "set null"` (or that have no `client_id` at all) survive the `clients` delete. `requests` (client_id set-null) and `staff_profiles` (no client FK) accumulated duplicate staff and left an orphan "Standing desk" request across reseeds until they were added to the explicit-delete list.

**How to apply:** when adding a seeded table, check its FK to `clients`. If it has no `client_id`, or its `client_id` uses `set null`, add `await tx.delete(<table>)` near the existing `activity_log`/`clients` deletes at the start of the transaction.
