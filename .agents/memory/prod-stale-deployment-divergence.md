---
name: Prod stale/divergent published build
description: Diagnosing "works in dev but 403/broken in production" — the published build can lag current source.
---

# Production failures current code can't reproduce → stale/divergent published build

When production shows behavior the **current source cannot produce**, suspect a stale/divergent
published build before changing code.

**Canonical signature:** a *per-route* auth split in prod (some `/api/*` routes 200/304, others 403)
for the **same authenticated session, same instant**. With our middleware (`requireAuth` returns 403
only on `!user || !user.active`, applied uniformly; `requireAdmin` only on the admin router), current
code can only 403 *all* protected routes or *none* — never a feature-subset split. A subset split means
the deployed binary gates those routes differently than current source.

**Why:** Replit Publish deploys the **workspace snapshot at publish time**, not git HEAD. So the live
app can run code that was never committed / has since changed. Git history (`git log -S requireAdmin`)
will not reveal it.

**How to apply (diagnosis order):**
1. Pull deployment logs — confirm the failing endpoint's status + responseTime. A fast (~20ms) 403 = auth-layer rejection, never reached the handler/AI.
2. Query the **production** DB (read-only): confirm the affected tables exist (rules out missing schema → that would be 500, not 403) and check the real user's `role`/`active`.
3. `rg` the **current** source for any role/admin gate on the failing routes. If current source has no gate but prod 403s a non-admin (coordinator) on exactly those routes → deployed build is divergent.
4. Fix = **republish** from the current workspace. If 403 persists post-republish, inspect deployment path routing for those specific `/api/*` paths.

**Adjacent gotcha — dev tests default to admin:** dev DB's "first user = admin" means ad-hoc
authenticated dev checks run as an **admin**, which masks role-gated behavior. To validate what a
**coordinator** sees (the real end-user role in this project), test as a coordinator, not just the
first/admin user.
