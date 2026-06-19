---
name: GreggOS Command Center dashboard
description: Durable design constraints for the gregg-today.tsx executive dashboard redesign.
---

# GreggOS Command Center (gregg-today.tsx)

The dashboard is a high-density, Bloomberg/control-room style executive surface. Constraints worth keeping consistent:

- **Light executive styling (self-contained classes, not theme tokens).** The page now renders LIGHT (`bg-slate-50`, white panels, `border-blue-100`, navy headings/`text-slate-700/800`, muted `text-slate-500`, hover `bg-blue-50`) using explicit Tailwind classes rather than the app theme tokens. It was reskinned from a former dark-navy (`#0B1220`) layout to match a white + baby-blue + navy-accent direction. Keep status colors meaningful but tuned for light: red for alert/critical, amber/orange for warn, emerald-600 for healthy. Recharts gradients/axes use the brand blues. When editing, do NOT leave dark-on-light residue (`bg-white/5`, `text-slate-300`, `*-400` icons on white) — those go invisible/low-contrast on the light panels.

- **All panels are real/derived data — NO mocked streams.** Every metric is computed from real server-backed datasets (clients/tasks/escalations/signals/callNotes via `useStore()`, plus `useListRelationships`/`useListExpansionPipeline`/report hooks). When adding panels, derive from real data and label derived signals honestly.

**Why:** the spec explicitly forbids fake/placeholder data and the app is advisory-only (must never approve pricing/refunds/legal/compliance).

**How to apply:**
- Engagement score, risk pulse, anomaly detection, weekly-trend buckets, and "Top Client Movement" momentum are deterministic derivations — keep them that way.
- "Top Client Movement" is a cadence-vs-days snapshot (`touchCadenceDays - daysSinceTouch`), not a true period-over-period delta (no historical snapshots exist).
- Date bucketing uses a LOCAL date key (`localDateKey`) to match how source date strings are sliced; avoid `toISOString().slice(0,10)` (UTC) which skews counts near day boundaries.
- Escalation-cluster anomaly counts `openEscalations` grouped by client, not the denormalized `client.escalations` aggregate.
- Table rows that expand must wrap the row + detail in `<Fragment key={...}>` (a bare `<>` can't hold the key and breaks the babel/HMR parse).
