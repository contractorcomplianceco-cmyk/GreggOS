---
name: CCA brand palette
description: The color brand the cockpit app must stay within; what "no gold / stay on brand" means.
---

# CCA brand palette

Contractor Compliance Authority brand = deep navy + electric blue + silver/white. Brand ACCENTS must never be gold/amber. Yellow/amber IS allowed as a functional, semantic color (caution/warning/draft states) — e.g. Draft Mode badge, "drafts only" disclaimer, At Risk KPI, Medium risk in a green→amber→red ramp. Just don't use it as a theme/brand accent. Red stays for true danger (overdue, escalations).

**Why:** User rejected gold as a brand accent ("No gold, lets stay on brand") but later clarified "yellow is fine if it's not in the branding" — i.e. functional caution yellow is OK, only the brand palette must stay navy/blue/silver.

**How to apply:**
- Theme tokens live in `artifacts/cockpit/src/index.css`. Accent, sidebar-primary, sidebar-ring, and chart-2 must stay in the blue family (~hue 208-214), never hue ~30 (that was the original baked-in gold that made the sidebar title render orange).
- Categorical chart/status colors: blue `#1d6fd6`, teal `#0e9bb8`, slate/silver `#64748b`, green `#16a34a` (positive), red shades `#ef4444`/`#b91c1c`/`#dc2626` (danger). Amber `#d97706` is fine for caution/Medium-risk semantics, not as a brand accent.
- Sidebar header uses the CCA logo image via `@assets/CCA_horizontal_logo_with_transparent_background_*.png`, not text.
- attached_assets is NOT served as a URL — import logos through the Vite `@assets` alias.
