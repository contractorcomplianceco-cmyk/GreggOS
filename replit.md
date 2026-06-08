# Gregg + Landon Current Client Cockpit

An internal operational web app for Contractor Compliance Authority that helps Gregg and Landon manage current-client relationships: triaging priorities, processing raw call notes into reviewed CRM-ready drafts, tracking tasks/escalations/opportunities, and running a weekly review. Frontend-only with localStorage persistence — no backend or live integrations.

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
- `artifacts/cockpit/src/lib/store.ts` — Zustand store, persistence, and the `saveProcessedNote` action
- `artifacts/cockpit/src/lib/seed.ts` — sample data (6 clients, 8 call notes, tasks/signals/escalations)
- `artifacts/cockpit/src/pages/*.tsx` — six screens: gregg-today, work-queue, clients, client-detail, processor, weekly-review, admin
- `artifacts/cockpit/src/components/layout/SidebarLayout.tsx` — sidebar nav + decision-boundary disclaimer

## Architecture decisions

- This is intentionally a no-backend product: api-server and mockup-sandbox artifacts exist in the monorepo but are NOT part of this app.
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
