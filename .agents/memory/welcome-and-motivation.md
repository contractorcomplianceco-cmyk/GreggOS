---
name: Welcome Center + global motivation popup
description: How the cockpit embeds the walkthrough video and surfaces motivation app-wide, plus the route/sidebar consistency test that gates new routes.
---

# Welcome Center & cross-artifact walkthrough embed
- The walkthrough video is a SEPARATE artifact (`cockpit-walkthrough`, a video artifact at previewPath `/cockpit-walkthrough/`). The cockpit embeds it via an `<iframe src="/cockpit-walkthrough/">` — an ABSOLUTE path that works because the cockpit serves at root `/` and the shared proxy routes most-specific-first. Do NOT prepend `import.meta.env.BASE_URL` for cross-artifact iframes; that base belongs to the cockpit, not the walkthrough.
- **Why:** the two are independent services behind one proxy; the walkthrough has its own base path. If its dev workflow is down the iframe is blank — restart `artifacts/cockpit-walkthrough` before screenshotting.

# Motivation is global, not just a page
- Motivation is surfaced by a `MotivationPopup` rendered once in `SidebarLayout`, so it shows on every layout-backed page (suppressed on `/welcome` and `/motivation`). It rotates by time-of-day slot and dismisses per-slot via `sessionStorage`, so it reappears later in the day with a new message. Shared messages/slot logic live in `lib/motivation.ts` (imported by both the popup and the Daily Motivation page) — keep them DRY there.

# Route/sidebar consistency test gate
- `src/navigation.test.ts` (node:test, source-regex based) asserts every registered `<Route path>` in `App.tsx` has a matching sidebar href OR is in `ROUTES_WITHOUT_SIDEBAR_LINK`. It scans `SidebarLayout.tsx` for internal hrefs in BOTH forms: nav-item objects (`href: "/x"`) and JSX link attributes (`href="/x"`, e.g. the top Welcome Center button).
- **Why:** adding a new route will FAIL this test until you either add a sidebar link (object or JSX form) or document the exclusion. **How to apply:** when you add a `<Route>`, add a nav entry/button link or extend the exclusion set in the same change.
