---
name: Cockpit shared layout primitives
description: Reusable PageHeader/StatCard shells for themed cockpit pages and the Tailwind purge rule for accent classes
---

# Cockpit shared layout primitives

The cockpit's themed management pages share two layout components in
`artifacts/cockpit/src/components/layout/`: `PageHeader` (tag → title → subtitle →
right-aligned action; wraps on narrow widths) and `StatCard` (accent-bar KPI card).
Reuse these for new themed pages instead of re-pasting the header/KPI markup.

**Why:** the header + accent-bar KPI markup was copy-pasted across many pages and drifted
(some headers wrapped, some didn't; action placement varied). The spec is "primary action
aligned right," so all themed pages standardize on `PageHeader`.

**How to apply:**
- New themed page → use `PageHeader` + `StatCard`, don't hand-roll the markup.
- `StatCard` accent is a key (`primary`/`accent`/`destructive`/`border`) into a literal
  `ACCENTS` map, NOT an interpolated `bg-${x}`. This is deliberate: Tailwind purges classes
  it can't see as literal strings, so any new accent color must be added as a literal entry
  in that map or it will vanish from the build.
- `SidebarLayout` is the responsive shell: desktop fixed sidebar + mobile `Sheet` drawer
  (triggered from a `md:hidden` sticky top header). Nav content lives in one `SidebarContent`
  used by both; mobile nav links must close the drawer via the `onNavigate` callback.
- Bespoke cards that need a different value size or a sub-hint (e.g. expenses "Top Category")
  are intentionally left as raw `Card`, not forced into `StatCard`.
