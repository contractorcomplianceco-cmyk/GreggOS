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
- `pages/*.tsx` — gregg-today (incl. Command Center tiles row), **welcome.tsx** (Welcome Center — gradient hero + embedded `/cockpit-walkthrough/` video iframe + onboarding steps; reached from the top sidebar button), clients, client-detail, processor, weekly-review, oversight, admin, audit-risk, the Phase-2 pages **expansion.tsx** and **relationships.tsx**, **communications.tsx** (Communication Draft Builder), the Command Center modules **travel-planner.tsx**, **expenses.tsx**, **training.tsx**, **feedback.tsx**, **prompt-library.tsx** (static), **motivation.tsx** ("Daily Motivation" — static; full message set + today's focus), **staff.tsx** (Staff Overview — read-only derived productivity/stuck/burnout signals with score bars + activity-window selector), the **Placement / Qualifier Network** page **placement.tsx**, the Tools & Resources pages **roseos.tsx** (RoseOS AI chat with mode selector + saved-session sidebar), **email-builder.tsx** (standalone AI email draft generator), **requests.tsx** (Requests Hub — exports `TYPE_LABEL`/`STATUS_LABEL`/`statusVariant` reused by my-requests), and the **My Executive Office** pages **my-requests.tsx** (personal requests filtered by requester), **executive-profile.tsx** (static), **my-account.tsx** (reads `/me`), **my-benefits.tsx** (static), **bonus-tracker.tsx**, **profit-sharing.tsx**, **success-plan.tsx** (90/180-day plan).
- `components/layout/SidebarLayout.tsx` — sidebar nav, organized into labeled section groups (Command Center, Clients & Accounts, Growth & Placement, Daily Work, My Executive Office, Tools & Resources, and an admin-only Administration group) + decision-boundary disclaimer. The header crest/wordmark sit on a navy→azure gradient band (dimension), a prominent **Welcome Center** button (`/welcome`) tops the nav, and it renders the global **MotivationPopup**.
- `components/MotivationPopup.tsx` + `lib/motivation.ts` — the global daily-motivation popup and its shared message set / time-of-day slot helper.

### Backend (`artifacts/api-server/src`)
- `routes/*.ts` — one router per resource: clients (incl. `POST /clients/:id/handoff`), callNotes, tasks, signals, escalations, expansion, relationships, scheduledEvents, contactLog, activity, auditLinks, viewState, admin, me, health, crm, reports, **communications** (Communication Draft Builder), the Command Center modules **travel**, **expenses**, **feedback**, **training**, **staff** (Staff Overview: `GET /staff-overview` derived metrics + `staff-profiles` CRUD), the Tools & Resources resources **roseChat** (RoseOS chat sessions/messages + AI generate), **email** (email-drafts + AI generate), **requests** (Requests Hub CRUD; `GET /requests` filters by type/status/requestedBy/clientId), and the My Executive Office / Placement resources **bonus** (bonus-entries), **profitShare** (profit-shares), **qualifiers**, **placements**, **successPlan** (success-plan-items). Registered in `routes/index.ts`.
- `lib/aiBoundary.ts` — shared AI helpers reused by RoseOS + Email Builder (and analogous to the communications guard): `aiConfigured()`, the OpenAI call wrapper, and `violatesBoundary()` decision-boundary screen that forces the deterministic template fallback on a trip.
- `lib/mappers.ts` — DB row → API shape (`toClient`, `toExpansion`, `toEvent`, `toRelationship`, `toExpansionOpportunity`, `toTravelPlan`, `toExpense` [cents→dollars], `toFeedback`, `toTrainingModule`, `toBonusEntry` [cents→dollars], `toProfitShare` [cents→dollars], `toQualifier`, `toPlacement`, `toSuccessPlanItem`, `toStaffProfile`, `toRoseSession`/`toRoseMessage`, `toEmailDraft`, `toRequest` [cents→dollars], …).
- `lib/priority.ts` — `priorityScore(value, stage, targetDate, warmth, riskScore, boost)` + stalled detection for the expansion pipeline.
- `lib/activity.ts` — `logActivity` (writes shared timeline entries; handoff, touch, etc.).
- `lib/owner.ts`, `lib/counters.ts`, `lib/http.ts`, `lib/logger.ts` — owner resolution, denormalized counters, request helpers, pino logger.
- `seed/seedDatabase.ts` — sample data (clients incl. Tara co-ownership; expansion milestones incl. stalled examples; scheduled visits/meals).

## Product

Screens: Gregg Today — the **GreggOS Command Center** dashboard (high-density control-room layout, light executive styling — white + baby-blue surfaces with navy accents, self-contained Tailwind classes not theme tokens): sticky header with risk-pulse indicator (green/yellow/red derived from critical clients + open escalations), global client search + functional filter chips, then fixed rows — Row 1 critical zone (Red Flags, Anomaly Detection, Client Health Map, Opportunity Radar), Row 2 executive action (Today's Executive Priorities, Escalation Stream, Nurturing Signal Feed, Risk Timeline horizontal log), Row 3 system intelligence (RingCentral Insight Feed full-width, Weekly Trend Analytics recharts area graph, Top Client Movement gainers/decliners), Row 4 Command Module tiles, and a data-heavy Client Nurturing Center table (engagement score bar, risk, opportunity type, next suggested action, intervention urgency; expandable rows). All panels are real/derived data — NO mocked streams; advisory only. Current Clients (search/filter + detail), Call Note Processor, Weekly Review, Oversight, Admin/Setup, Audit Risk (live portal), plus:

- **Expansion Pipeline** — portfolio-wide, auto-prioritized stage board (Identified→Live) with priority scoring, stalled flags, owner / stage / shared-with-Tara filters, and manual pin + priority boost; create/edit milestones. Each card has **Approve for CRM** (Zoho Deals) and **Close** (Won/Lost + actualValue, with optional CRM approve on Won) — the Won/Lost revenue lifecycle.
- **Relationships** — warmth/cadence radar (days since touch, next touch, cold flag, cadence) with shared-with-Tara filter and log-touch + plan-touch dialogs.
- **Reporting & CRM** (`/reporting`) — leadership KPI dashboard (expansion revenue incl. converted/win-rate/by-owner/Tara-shared; relationships; follow-through) with a 7/30/90-day window selector, plus the **CRM Export Center**: approve call notes (Notes), tasks (Tasks), and expansion deals (Deals) for Zoho, preview the export payload JSON, and mark records pushed (capture Zoho record id). EXPORT-ONLY — nothing pushes to Zoho automatically.

- **Command Center (GreggOS) modules** — net-new executive modules, all server-backed (contract-first), reachable from the sidebar and a Command Center quick-link tiles row on Gregg Today:
  - **Travel Planner** (`/travel`) — ROI-justified travel plans (location, reason, ROI rationale, status Proposed/Planned/Booked, date range, optional client link).
  - **Expenses** (`/expenses`) — relationship/travel/event spend tracking. Stored as integer cents (`amountCents`) server-side, exposed as dollars (`amount`) over the API; server rejects negative amounts (400).
  - **Training** (`/training`) — gamified executive training modules (tier, XP, completed state) with progress totals.
  - **Feedback** (`/feedback`) — internal feedback/idea log (type risk/opportunity/system, status open/reviewed/actioned/archived).
  - **Prompt Library** (`/prompt-library`) — STATIC reference list of reusable AI prompts (no backend).
  - **Daily Motivation** (`/motivation`) — STATIC executive motivation/focus content (no backend). The daily focus line is ALSO surfaced app-wide by a global **MotivationPopup** (rendered in `SidebarLayout`): a floating navy→azure card that rotates by time-of-day slot, is dismissible per slot (sessionStorage), and is suppressed on `/welcome` and `/motivation`.
- **Communication Drafts** (`/communications`) — the Gregg Communication Draft Builder. Pick a client + intent (follow-up / check-in / escalation-ack / expansion-outreach / renewal / other) + channel (email / text / call_script) + tone + optional instructions, then generate a client-facing draft from LIVE account context (recent call notes, open tasks, open escalations, warmth/cadence, active expansion). Uses the Replit-managed OpenAI integration with a DETERMINISTIC TEMPLATE FALLBACK; drafts are editable, copy-to-clipboard, saved per client, and carry a lifecycle status (draft/edited/used/discarded). Reachable from the sidebar or a per-client **Draft communication** button on client-detail (deep-links `?clientId=`). DRAFT-ONLY — there is no send path; nothing leaves the app.

- **Placement / Qualifier Network** (`/placement`) — licensed-qualifier intake/profiles (license type, state, trade, availability, status) plus a placement lifecycle tracker (interest → fit_review → internal_review → placed → renewal → replacement) capturing needs, timeline, budget, expectations, risk flags, next step, and missing info. DOCUMENTATION + ROUTING ONLY — no row approves a placement; actual placement requires leadership/legal review per the governance boundaries.

- **My Executive Office** — Gregg's personal executive cockpit, a labeled sidebar section:
  - **Executive Profile** (`/executive-profile`) — STATIC role/scope/decision-boundary reference (no backend).
  - **My Account** (`/my-account`) — reads `/me` (account identity/role); account/log-out only when optionally signed in.
  - **My Benefits** (`/my-benefits`) — STATIC benefits reference (no backend).
  - **Bonus Tracker** (`/bonus-tracker`) — bonus entries by category/title/status; amounts stored as integer cents server-side, exposed as dollars; server rejects negative amounts (400).
  - **Profit Sharing** (`/profit-sharing`) — PROJECTION / AWARENESS ONLY illustrative profit-participation figures (cents server-side → dollars) with strong "not an entitlement" disclaimers; nothing here creates a right to compensation.
  - **90 / 180-Day Success Plan** (`/success-plan`) — phased (first_90 / next_90 / etc.) success-plan items with measures/status for onboarding and ramp.

Client detail surfaces ownership overlap (co-owner, involvement state, touch cadence), an explicit **Hand off** action, a **Shared Activity Timeline**, and pin/boost on roadmap milestones.

Decision-boundary disclaimers throughout: the app drafts and organizes; it does not approve pricing/refunds/legal/compliance/qualifier decisions.

## Architecture decisions

- **Contract-first**: never hand-edit generated files in `lib/api-client-react`. Change `openapi.yaml` and rerun codegen. Use entity-shaped request body names to avoid TS2308 collisions. Do not change the OpenAPI `info.title` (controls generated filenames).
- **Auth (sign-in wall removed)**: Clerk is still wired (ClerkProvider + optional `/sign-in`/`/sign-up`), but the cockpit is OPEN — no login required. Frontend routes render directly (no `guarded`/`Show` gating). Server `requireAuth` no longer 401s on a missing Clerk session; it resolves a shared default user (`externalId="public-access"`, role admin) so all endpoints work unauthenticated. A real Clerk session still resolves to that user's own record. The sidebar account/log-out footer only renders when someone has optionally signed in. SECURITY: all client data + admin endpoints are now publicly reachable by anyone with the URL — re-add gating before any external exposure. First user becomes admin (seed users break that — see admin provisioning memory).
- **Priority scoring** lives server-side in `lib/priority.ts` so the pipeline ranks consistently; manual `pinned`/`priorityBoost` override the computed order. Stage/status movement resets the stalled clock (`lastMovementAt`).
- **CRM export lifecycle (export-only)**: `crm_links` (unique on `entityType`+`entityId`) tracks approve→push state. `POST /crm-links` is approval-only — it always sets `syncStatus="approved"` server-side and never accepts a caller-supplied status (so a record can't be marked pushed without the explicit push step); re-approve leaves an already-pushed link untouched. `PATCH /crm-links/:id` is the only path that sets `pushed`/`failed`, stamps `lastSyncedAt`/`lastPushedByUserId`, and logs `crm_push_status`. Per-entity Zoho payload builders + `DEFAULT_MODULE` map (call_note→Notes, expansion_milestone→Deals, task→Tasks) live in `routes/crm.ts`; `GET /crm-export` returns preview payloads. Activity log records `crm_approved` and `crm_push_status`.
- **Expansion Won/Lost revenue lifecycle**: `actualValue` is realized revenue (writable via PATCH only — not on create); `closedAt` is server-managed (stamped on Won/Lost, cleared on reopen) and is NOT a writable input field. PATCH logs `expansion_won`/`expansion_lost` distinctly from `expansion_value_changed`. Reports aggregate revenue by owner + Tara-shared in `routes/reports.ts` (`/reports/{relationships,expansion,activity}`, `windowDays` param on relationships/activity).
- **Communication Draft Builder (AI + template fallback, draft-only)**: `communication_drafts` table; `POST /communication-drafts/generate` gathers per-client context server-side and calls the Replit-managed OpenAI integration (server-only lib `@workspace/integrations-openai-ai-server`, model `gpt-5.4`, `max_completion_tokens`, NO `temperature`). Any missing AI env config or runtime error → deterministic `templateDraft` fallback (`source` field records `ai` vs `template`). A deterministic **decision-boundary guard** (`PROHIBITED_PATTERNS` in `routes/communications.ts`) screens AI output for pricing/refund/legal/compliance/qualifier-placement commitment language and forces the template fallback on a trip — the guarantee does not rely on the model honoring its prompt. `status` is restricted server-side + by OpenAPI enum to draft-lifecycle values (`draft`/`edited`/`used`/`discarded`) — there is NO `sent` status and no send path (`used` = Gregg copied it to send himself; PATCH auto-transitions `draft`→`edited` on content edits). PATCH logs `communication_draft_updated`; generate logs `communication_drafted`.
- **RoseOS + Email Builder (AI + template fallback, no-send)**: same AI pattern as the Communication Draft Builder, factored into `lib/aiBoundary.ts` (`aiConfigured()` + OpenAI wrapper + `violatesBoundary()` guard). RoseOS (`rose_chat_sessions`/`rose_chat_messages`) is a saved-session chat with modes (brainstorm/help_with_client/how_to/general); `help_with_client` pulls per-client context server-side. Email Builder (`email_drafts`) turns a short brief into an editable draft. Both record `source` (`ai` vs `template`), trip to the deterministic template on any AI error OR boundary violation, and have NO send path (drafts are copied out by the user).
- **Staff Overview (derived, advisory, Rose/Tony-excluded)**: `staff_profiles` only stores editable bits (title/capacity/focus); productivity/stuck/burnout are DERIVED at read time in `GET /staff-overview` from real tables (tasks, escalations, clients, expansion, activity) keyed by owner label. A defensive `isExcluded()` (case-insensitive, checks full label + first token) guarantees anyone named Rose or Tony never appears, regardless of owned work. Scores are advisory conversation aids, not performance ratings.
- **Requests Hub (tracking/routing only)**: `requests` table with a status lifecycle (submitted→in_review→approved/denied→fulfilled/cancelled); "approved" records that leadership signed off elsewhere — it does not authorize spend. `amountCents` server-side → dollars over the API (negative rejected 400). `GET /requests` enforces all four documented filters (type/status/requestedBy/clientId); My Requests filters by the requester label. `requestedByLabel` is stamped from the actor on create (never client-supplied).
- **Seed idempotency**: the seed clears `requests` + `staff_profiles` explicitly at the top of the transaction (they are NOT cascade-deleted by the `clients` delete), so reseeding does not accumulate duplicate staff/requests.
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
- Portability (off-Replit): `PORT`/`BASE_PATH` are still injected by Replit workflows, but the vite configs + api-server `index.ts` now fall back to defaults (cockpit 5173/`/`, walkthrough 5174, api 8080) so a plain clone runs without them. The cockpit vite dev server proxies `/api`→`API_PROXY_TARGET` (default `http://localhost:8080`) ONLY when `REPL_ID` is unset (on Replit the shared proxy handles `/api`). Root scripts `dev:api`/`dev:web`/`start:api`/`build:api`/`build:web`/`db:push`/`seed`, plus `README.md` + `.env.example`, document the GitHub→cloud-server path; production needs an nginx-style reverse proxy joining the static cockpit build and `/api` on one origin (no shared proxy off Replit). `.env` is gitignored.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript project references, OpenAPI/codegen, server routes, and DB migration details.
