---
name: GreggOS Command Center dashboard
description: Durable design constraints for the gregg-today.tsx executive dashboard redesign.
---

# GreggOS Command Center (gregg-today.tsx)

The dashboard is a high-density, Bloomberg/control-room style executive surface. Constraints worth keeping consistent:

- **Self-contained dark styling.** The page renders dark (`bg-[#0B1220]`, panels `#0e1729`, borders `#1c2942`) using explicit Tailwind arbitrary colors, NOT the app theme tokens — the rest of the cockpit runs in light mode. Don't swap to theme tokens unless the whole app goes dark. Accent = sky-400/sky-500; alert = red-500 with glow (`shadow-[0_0_14px_rgba(...)]`); amber/emerald for warn/healthy.

- **All panels are real/derived data — NO mocked streams.** Every metric is computed from real server-backed datasets (clients/tasks/escalations/signals/callNotes via `useStore()`, plus `useListRelationships`/`useListExpansionPipeline`/report hooks). When adding panels, derive from real data and label derived signals honestly.

**Why:** the spec explicitly forbids fake/placeholder data and the app is advisory-only (must never approve pricing/refunds/legal/compliance).

**How to apply:**
- Engagement score, risk pulse, anomaly detection, weekly-trend buckets, and "Top Client Movement" momentum are deterministic derivations — keep them that way.
- "Top Client Movement" is a cadence-vs-days snapshot (`touchCadenceDays - daysSinceTouch`), not a true period-over-period delta (no historical snapshots exist).
- Date bucketing uses a LOCAL date key (`localDateKey`) to match how source date strings are sliced; avoid `toISOString().slice(0,10)` (UTC) which skews counts near day boundaries.
- Escalation-cluster anomaly counts `openEscalations` grouped by client, not the denormalized `client.escalations` aggregate.
- Table rows that expand must wrap the row + detail in `<Fragment key={...}>` (a bare `<>` can't hold the key and breaks the babel/HMR parse).
