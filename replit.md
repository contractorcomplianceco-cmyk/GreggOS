# Gregg + Landon Current Client Cockpit

An internal operational web app for Contractor Compliance Authority that helps Gregg and Landon manage current-client relationships: triaging priorities, processing raw call notes into reviewed CRM-ready drafts, tracking tasks/escalations/opportunities, and running a weekly review. Frontend-only with localStorage persistence for cockpit data; it also reads LIVE audit data from the external CCA Audit Risk Portal (read-only, direct browser fetch).

## Run & Operate

- `pnpm --filter @workspace/cockpit run dev` — run the cockpit web app (Vite)
- `pnpm --filter @workspace/cockpit run typecheck` — typecheck the cockpit app
- App runs via the `artifacts/cockpit: web` workflow; preview path is `/`

## Stack

- React + Vite (TypeScript), Tailwind + shadcn/ui components
- Routing: wouter (base = `import.meta.env.BASE_URL`)
- State: Zustand with `persist` middleware to localStorage (key `cockpit-storage`)
- No backend, no database, no API codegen — all data lives client-side

## Where things live

- `artifacts/cockpit/src/lib/types.ts` — data model (CurrentClient, CallNote, Task, OpportunitySignal, Escalation) and enums
- `artifacts/cockpit/src/lib/auditPortal.ts` — live audit portal client: types + React Query hooks (`useAudits`, `useAuditDetail`, `useAuditPortalHealth`), base-URL helper (localStorage override, key `cockpit-audit-portal-url`), and `levelColor`/`layerAFactors` helpers
- `artifacts/cockpit/src/pages/audit-risk.tsx` — live Audit Risk page (connection pill, audits list, detail: score summary, Layer A scoresheet, entity profile, findings, documents, monitoring)
- `artifacts/cockpit/src/lib/store.ts` — Zustand store, persistence, and the `saveProcessedNote` action
- `artifacts/cockpit/src/lib/seed.ts` — sample data (6 clients, 8 call notes, tasks/signals/escalations)
- `artifacts/cockpit/src/pages/*.tsx` — six screens: gregg-today, work-queue, clients, client-detail, processor, weekly-review, admin
- `artifacts/cockpit/src/components/layout/SidebarLayout.tsx` — sidebar nav + decision-boundary disclaimer

## Architecture decisions

- This is intentionally a no-backend product: api-server and mockup-sandbox artifacts exist in the monorepo but are NOT part of this app.
- Live audit data comes from the external CCA Audit Risk Portal (`https://audit-risk-model.replit.app`, endpoints `/api/audits`, `/api/audits/:id`, `/api/healthz`). The portal serves an OPEN, public CORS API (reflects any Origin), so the cockpit fetches it directly from the browser via React Query — no proxy/backend of our own. Read-only. Security note: those endpoints are public and unauthenticated at the portal; any cockpit user (and anyone hitting the portal) can read full audit payloads incl. EIN/financials. Locking that down would require auth on the portal itself, not a cockpit-side proxy.
- The cockpit client ↔ live audit linkage on client-detail is best-effort name matching (normalized clientName/companyName), since the two systems share no common ID. When matched, the Audit Status & Scoresheet card, the Audit KPI, and the overall-health "Audit compliance" factor all render LIVE portal data (via `useAudits` + `useAuditDetail`); a non-matching client falls back to seed audit data and shows no Live badge. The portal is risk-oriented (higher `layerANormalized` = worse), so audit health is `100 - layerANormalized`, not the score directly. Seed client c1 is named "ABC Construction LLC" to align with the portal's sample audit so the linkage is demonstrable.
- `saveProcessedNote` is the single source of truth for the Call Note Processor save flow: it upserts the call note and atomically regenerates the note's tasks/signals/escalations (matched by `sourceCallNoteId`) and recomputes the related client's `nextAction`, owner, due date, missing info, and counters.
- Each `nextActions` line in the processor becomes a separate task.
- Persist `version` is bumped when the seed shape changes so stale localStorage is replaced with the new seed.

## Product

Six screens: Gregg Today (priorities, escalations, filters), Landon Work Queue (call notes by routing status), Current Clients (search/filter list + detail), Call Note Processor (raw note in, CRM note / follow-up draft / task list / JSON out, all with copy buttons), Weekly Review, and Admin/Setup (reset + export data). The app separates raw RingCentral notes from reviewed summaries and shows decision-boundary disclaimers throughout (it drafts; it does not approve pricing/refunds/legal/compliance/qualifier decisions).

## User preferences

- Dense operational UI; no emojis.

## Gotchas

- Bump the persist `version` in `store.ts` whenever the seed/data shape changes, or existing users keep stale localStorage state.
- In-app navigation that uses `window.location.href` must prepend `import.meta.env.BASE_URL` (see work-queue Process Note button) so it respects the artifact base path.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
