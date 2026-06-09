# Gregg + Landon Current Client Cockpit

An internal operational web app for Contractor Compliance Authority that helps Gregg and Landon manage current-client relationships: triaging priorities, processing raw call notes into reviewed CRM-ready drafts, tracking tasks/escalations/opportunities, monitoring an expansion pipeline, tending relationship warmth/cadence, and running a weekly review. It also reads LIVE audit data from the external CCA Audit Risk Portal (read-only, direct browser fetch).

## Architecture (full-stack, contract-first)

This is a pnpm monorepo. The cockpit is a full-stack app:

- **DB**: Drizzle ORM on the Replit Postgres (`DATABASE_URL`). Schema in `lib/db/src/schema/*`.
- **API**: Express server (`artifacts/api-server`) behind Clerk auth, same-origin cookies.
- **Contract**: OpenAPI spec (`lib/api-spec/openapi.yaml`) → Orval codegen → React Query hooks + Zod-ish types in `lib/api-client-react` (`@workspace/api-client-react`).
- **Frontend**: React + Vite (TypeScript), Tailwind + shadcn/ui, routing via wouter (base = `import.meta.env.BASE_URL`).

The flow is contract-first: change the schema → push → edit `openapi.yaml` → run codegen → implement server routes → consume generated hooks in the cockpit.

## Run & Operate

- `pnpm --filter @workspace/cockpit run dev` — cockpit web app (Vite); preview path `/`
- `pnpm --filter @workspace/api-server run dev` — API server; preview path `/api`
- `pnpm --filter @workspace/api-server run seed` — reset DB to seed data (builds then runs `dist/seed/run.mjs`)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client from `openapi.yaml`
- `pnpm run typecheck` — canonical full typecheck (libs then leaf artifacts)
- Admin reset is also available at `POST /api/admin/reset` (auth required).

## Where things live

### Frontend (`artifacts/cockpit/src`)
- `lib/types.ts` — local data model mirrors (CurrentClient, CallNote, Task, OpportunitySignal, Escalation, ExpansionMilestone, ScheduledEvent, ContactLogEntry, …) and enums. Cockpit pages cast generated responses to these.
- `lib/store.ts` — `useStore()` is a thin wrapper over the generated React Query hooks (server-backed) plus the `saveProcessedNote` flow. NOT a Zustand/localStorage store anymore.
- `lib/auditPortal.ts` — live audit portal client (types + React Query hooks `useAudits`/`useAuditDetail`/`useAuditPortalHealth`, base-URL helper, `levelColor`/`layerAFactors`).
- `pages/*.tsx` — gregg-today, work-queue, clients, client-detail, processor, weekly-review, oversight, admin, audit-risk, and the Phase-2 pages **expansion.tsx** and **relationships.tsx**.
- `components/layout/SidebarLayout.tsx` — sidebar nav (incl. Expansion Pipeline + Relationships) + decision-boundary disclaimer.

### Backend (`artifacts/api-server/src`)
- `routes/*.ts` — one router per resource: clients (incl. `POST /clients/:id/handoff`), callNotes, tasks, signals, escalations, expansion, relationships, scheduledEvents, contactLog, activity, auditLinks, viewState, admin, me, health. Registered in `routes/index.ts`.
- `lib/mappers.ts` — DB row → API shape (`toClient`, `toExpansion`, `toEvent`, `toRelationship`, `toExpansionOpportunity`, …).
- `lib/priority.ts` — `priorityScore(value, stage, targetDate, warmth, riskScore, boost)` + stalled detection for the expansion pipeline.
- `lib/activity.ts` — `logActivity` (writes shared timeline entries; handoff, touch, etc.).
- `lib/owner.ts`, `lib/counters.ts`, `lib/http.ts`, `lib/logger.ts` — owner resolution, denormalized counters, request helpers, pino logger.
- `seed/seedDatabase.ts` — sample data (clients incl. Tara co-ownership; expansion milestones incl. stalled examples; scheduled visits/meals).

## Product

Screens: Gregg Today (priorities, escalations, filters, + a relationship lane: touches due / visits this week / going cold / top expansion), Landon Work Queue, Current Clients (search/filter + detail), Call Note Processor, Weekly Review, Oversight, Admin/Setup, Audit Risk (live portal), plus:

- **Expansion Pipeline** — portfolio-wide, auto-prioritized stage board (Identified→Live) with priority scoring, stalled flags, owner / stage / shared-with-Tara filters, and manual pin + priority boost; create/edit milestones.
- **Relationships** — warmth/cadence radar (days since touch, next touch, cold flag, cadence) with shared-with-Tara filter and log-touch + plan-touch dialogs.

Client detail surfaces ownership overlap (co-owner, involvement state, touch cadence), an explicit **Hand off** action, a **Shared Activity Timeline**, and pin/boost on roadmap milestones.

Decision-boundary disclaimers throughout: the app drafts and organizes; it does not approve pricing/refunds/legal/compliance/qualifier decisions.

## Architecture decisions

- **Contract-first**: never hand-edit generated files in `lib/api-client-react`. Change `openapi.yaml` and rerun codegen. Use entity-shaped request body names to avoid TS2308 collisions. Do not change the OpenAPI `info.title` (controls generated filenames).
- **Auth**: Clerk, same-origin cookies. Unauthenticated API requests return 401. First user becomes admin (seed users break that — see admin provisioning memory).
- **Priority scoring** lives server-side in `lib/priority.ts` so the pipeline ranks consistently; manual `pinned`/`priorityBoost` override the computed order. Stage/status movement resets the stalled clock (`lastMovementAt`).
- **Overlap model**: clients carry `coOwner`/`involvementState`/`touchCadenceDays`; handoffs are explicit events that update ownership/involvement and log to the shared activity timeline.
- **Live audit data** comes from the external CCA Audit Risk Portal (`https://audit-risk-model.replit.app`, `/api/audits`, `/api/audits/:id`, `/api/healthz`). The portal serves an OPEN public CORS API, so the cockpit fetches it directly from the browser — no proxy of our own. Read-only. Security note: those portal endpoints are public/unauthenticated (EIN/financials exposed); locking down would require auth on the portal itself.
- Cockpit client ↔ live audit linkage on client-detail is best-effort name matching (no shared ID). When matched, the Audit card/KPI and the overall-health "Audit compliance" factor render LIVE data; otherwise it falls back to seed audit data and shows no Live badge. The portal is risk-oriented (higher `layerANormalized` = worse), so audit health is `100 - layerANormalized`. Seed client c1 ("ABC Construction LLC") aligns with the portal's sample audit.

## User preferences

- Dense operational UI; no emojis.

## Gotchas

- After any schema change: push, then update `openapi.yaml`, run codegen, then implement. Run `pnpm run typecheck:libs` before leaf-artifact typechecks if you touch `lib/*`.
- The cockpit mirrors generated types in `lib/types.ts` and casts API responses to them; when you add fields to a schema, add them to the matching `lib/types.ts` interface too or the casts go stale.
- In-app navigation using `window.location.href` must prepend `import.meta.env.BASE_URL` so it respects the artifact base path.
- Verify artifacts with `pnpm --filter @workspace/<slug> run typecheck`, not `build` (build needs workflow-provided `PORT`/`BASE_PATH`).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript project references, OpenAPI/codegen, server routes, and DB migration details.
