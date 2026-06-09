---
name: Admin role JIT provisioning
description: How users get the admin role on first login, and why seeded users break the "first user = admin" rule.
---

# Admin role JIT provisioning (api-server)

On first authenticated request a user row is created in `usersTable`. Role is decided in `getOrCreateUser` (auth middleware):

- `admin` if the email is in the `ADMIN_EMAILS` env var, OR the users table is empty (literal first user).
- otherwise `coordinator`.

## Gotcha: seed data pre-empts the first real admin
**Symptom:** A real person signs up expecting admin, but lands as `coordinator` and sees no Admin/Setup section.
**Cause:** The DB seed inserts staff users (e.g. seed "Gregg"/"Landon"), so the users table is never empty when the first real human signs in — the `isFirstUser` branch never fires.
**Fixes:**
- Quick: `UPDATE users SET role='admin' WHERE email='<them>'` then have them **reload** the app.
- Durable: set `ADMIN_EMAILS` (comma-separated) so designated emails are provisioned admin regardless of seed/order. This also survives user-row recreation.

## Role changes require a frontend reload
The cockpit reads role via `useGetCurrentUser()` (/api/me) and React Query caches it. Sidebar Admin link and the Admin page gate both key off `me.role === "admin"`, so a DB role change only shows after the user refreshes.
