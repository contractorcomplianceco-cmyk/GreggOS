---
name: CCA brand palette
description: The color brand the cockpit app must stay within; what "no gold / stay on brand" means.
---

# CCA brand palette

Contractor Compliance Authority brand = deep navy + electric blue + silver/white. RED is reserved for true alerts/danger only (overdue, escalations, at-risk). NO gold/amber/orange/yellow anywhere.

**Why:** User explicitly rejected gold ("No gold, lets stay on brand") and supplied CCA logo/collateral that is strictly navy/blue/silver.

**How to apply:**
- Theme tokens live in `artifacts/cockpit/src/index.css`. Accent, sidebar-primary, sidebar-ring, and chart-2 must stay in the blue family (~hue 208-214), never hue ~30 (that was the original baked-in gold that made the sidebar title render orange).
- Categorical chart/status colors: blue `#1d6fd6`, teal `#0e9bb8`, slate/silver `#64748b`, green `#16a34a` (positive), red shades `#ef4444`/`#b91c1c`/`#dc2626` (risk/danger). Avoid any amber/orange hex.
- Sidebar header uses the CCA logo image via `@assets/CCA_horizontal_logo_with_transparent_background_*.png`, not text.
- attached_assets is NOT served as a URL — import logos through the Vite `@assets` alias.
