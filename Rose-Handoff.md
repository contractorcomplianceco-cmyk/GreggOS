# Rose's Architecture & Intent Handoff

> Handoff for Carmen's Cursor AI. This documents the layout, routes, components, and
> data wiring of the **GREGG OS** cockpit so the backend build can be completed and
> replicated without disturbing the finished UI. Read this top-to-bottom before touching code.

**Repo:** `contractorcomplianceco-cmyk/GreggOS` (pnpm monorepo)
**Primary app:** `artifacts/cockpit` — React 18 + Vite + TypeScript, Tailwind CSS + shadcn/ui, `wouter` routing, TanStack React Query, Clerk auth.
**Backend already exists:** `artifacts/api-server` (REST) + `lib/db` (Postgres/Drizzle) + `lib/api-client-react` (generated React Query hooks) + `lib/integrations-openai-ai-server` (AI call-note processing). **Most of the CRM is already wired to this live backend — do not rebuild it as mock.**

---

## 1. Project Overview & Core Intent

- **What this project does:** GREGG OS is an internal "cockpit" / operating system for **Contractor Compliance Authority (CCA)** — a client-relationship + operations hub for a compliance/placement firm, themed as a gold-and-black sportfishing brand ("Boats · Business · Tight Lines"). It centralizes the daily client picture, AI-assisted call-note processing, the expansion pipeline, relationship management, staff/ops workflows (requests, travel, expenses, bonuses), reporting, and a morale/relax area ("The Dock").
- **Target Audience / Core Flow:** Internal staff (owner **Gregg** + team, e.g. Landon, Tara). Core flow: a user lands on **Today's Catch** (`/`) to triage the day (clients, alerts, tide/status) → opens **Reel In Call Notes** (`/processor`) to paste a raw RingCentral call note and let AI turn it into a clean summary + tasks + CRM-ready note → works **The Net** (`/expansion`) pipeline and **Deckhands & Allies** (`/relationships`) → reviews the **Weekly Haul** (`/weekly-review`) and **Reporting** → decompresses in **The Dock** (`/the-dock`, incl. **Beer O'Clock** party mode). Auth is via Clerk but **optional** — the cockpit renders without an account.

---

## 2. Key Pages & Frontend Routes

Routing is defined in `artifacts/cockpit/src/App.tsx` (wouter `<Route>`s). All pages are wrapped in `SidebarLayout`. Full route list:

| Route | Page component | Purpose / key interactions |
|---|---|---|
| `/` | `gregg-today.tsx` | **Today's Catch** dashboard. Hero KPIs (Tangled Lines, Storm Warnings, Catch List, Lines to Tend), account search + filter chips (All/Critical/High Risk/Overdue/Has Escalation/Opportunity), "On the Radar" alert cards, live tide/status widget. **Live data.** |
| `/welcome` | `welcome.tsx` | **Welcome Aboard** onboarding. Two narrated videos (`/welcome-video.mp4`, `/walkthrough-video.mp4`), branded badge hero, step-by-step "Chart your course" cards. Mostly static/marketing. |
| `/processor` | `processor.tsx` | **Reel In Call Notes.** Paste raw call note → AI processing → editable clean summary, next actions, CRM note, follow-up draft. **Live data + AI backend.** |
| `/oversight` | `oversight.tsx` | Portfolio oversight / client status + risk overview. **Live data.** |
| `/expansion` | `expansion.tsx` | **The Net (Pipeline)** — expansion opportunities auto-ranked by value/stage/warmth/risk; add/pin/boost opportunities. **Live data.** |
| `/relationships` | `relationships.tsx` | **Deckhands & Allies** — relationship/CRM warmth tracking. **Live data.** |
| `/reporting` | `reporting.tsx` | Reporting & analytics (heaviest read page, ~11 query hooks). **Live data.** |
| `/communications` | `communications.tsx` | Comms composer (intent/channel/tone options). **Live data + AI.** |
| `/roseos` | `roseos.tsx` | RoseOS assistant surface. **Live data.** |
| `/email-builder` | `email-builder.tsx` | Email drafting (tone presets). **Live data + AI.** |
| `/staff` | `staff.tsx` | Staff overview / windows. **Live data.** |
| `/requests` | `requests.tsx` | Requests hub (type/status/priority). **Live data.** |
| `/my-requests` | `my-requests.tsx` | Current user's requests. **Live data.** |
| `/travel` | `travel-planner.tsx` | Travel planning (status/reason/owner). **Live data.** |
| `/expenses` | `expenses.tsx` | Expense tracking (category/owner). **Live data.** |
| `/training` | `training.tsx` | Training / XP levels. **Live data.** |
| `/prompt-library` | `prompt-library.tsx` | Reusable AI prompt library. **Live data.** |
| `/motivation` | `motivation.tsx` | Motivation messages. **Static content** (`src/lib/motivation.ts`), time-slot based. |
| `/the-dock` | `the-dock.tsx` | **The Dock** relax room + **Beer O'Clock** mode (cinematic entrance, neon marlin, poster wall, cold-one counter, Spotify station picker, catch log). **Client-side only (localStorage).** |
| `/captains-bridge` | `captains-bridge.tsx` | Captain's Bridge overview. **Client-side (localStorage).** |
| `/feedback` | `feedback.tsx` | Feedback center (type/status). **Live data.** |
| `/placement` | `placement.tsx` | **Fishing Grounds (Qualifiers)** placement network (stages/statuses/availability). **Live data.** |
| `/bonus-tracker` | `bonus-tracker.tsx` | Bonus tracking (category/status). **Live data.** |
| `/profit-sharing` | `profit-sharing.tsx` | Profit-sharing tracking. **Live data.** |
| `/success-plan` | `success-plan.tsx` | Success plan phases. **Live data.** |
| `/my-account` | `my-account.tsx` | User account settings. **Live data.** |
| `/my-benefits` | `my-benefits.tsx` | Benefits overview. **Live data.** |
| `/executive-profile` | `executive-profile.tsx` | Executive profile. **Live data.** |
| `/clients` | `clients.tsx` | Client list. **Live data.** |
| `/clients/:id` | `client-detail.tsx` | Single client detail (dynamic `:id` param). **Live data.** |
| `/audit-risk` | `audit-risk.tsx` | Audit/risk view (`src/lib/auditPortal.ts`). **Live data.** |
| `/weekly-review` | `weekly-review.tsx` | **Weekly Haul** review. **Live data.** |
| `/admin` | `admin.tsx` | Admin tools (incl. seed reset). **Live data.** |
| `/sign-in/*`, `/sign-up/*` | Clerk `<SignIn>`/`<SignUp>` | Auth pages (optional login). |
| `*` (fallback) | `not-found.tsx` | 404. |

---

## 3. Component & State Breakdown

### 3a. Already wired to the LIVE backend (do NOT replace with mock)
The core CRM data is **not mock** — it flows through generated hooks in `@workspace/api-client-react`, aggregated by the `useStore()` facade in **`artifacts/cockpit/src/lib/store.ts`**. Backing store: Postgres via `artifacts/api-server` + `lib/db`.

- **Central data facade:** `useStore()` in `src/lib/store.ts`.
- **Live entities & their hooks:** Clients (`useListClients`/`useCreateClient`/`useUpdateClient`), Call Notes (`useListCallNotes`/`useCreateCallNote`/`useUpdateCallNote`/`useProcessCallNote`), Tasks (`useListTasks`/`useCreateTask`/`useUpdateTask`), Opportunity Signals (`useListSignals`/`useUpdateSignal`), Escalations (`useListEscalations`/`useUpdateEscalation`), CRM Links (`useUpsertCrmLink`/`useUpdateCrmLink`), and `useResetToSeed`.
- **Types:** `src/lib/types.ts` (`CurrentClient`, `CallNote`, `Task`, `OpportunitySignal`, `Escalation`, enums like `CallType`, `Priority`, `RiskLevel`, `SignalType`, `EscalationReason`).
- **AI processing:** the "Reel In Call Notes" flow (`/processor`) calls `useProcessCallNote` → `lib/integrations-openai-ai-server`. Carmen's job here is to ensure the AI server env/keys are configured, **not** to replace the UI.
- **Interactive components needing a live connection verified:** account search/filter on `/`, alert/escalation cards, the `/expansion` pipeline add/pin/boost controls, all add/edit forms across `/requests`, `/my-requests`, `/travel`, `/expenses`, `/bonus-tracker`, `/profit-sharing`, `/feedback`, `/placement`, and the `/reporting` charts.

### 3b. Config/enum constants (NOT record data — leave as-is)
Many pages declare `const` option arrays. These are **UI enums/dropdown options, not mock records** — Carmen should keep them:
- e.g. `CATEGORIES`, `STATUSES`, `OWNERS = ["Gregg","Landon","Tara"]`, `PRIORITIES`, `TONES`, `INTENTS`, `CHANNELS`, `PLACEMENT_STAGES`, `QUALIFIER_AVAILABILITY`, `LEVELS` (training XP), `PHASES` (success plan), `EMPTY_FORM` initializers. Owners/team names may later be sourced from a staff table, but the arrays themselves are safe UI config.

### 3c. Genuinely client-side / localStorage state (backend optional — replace ONLY if going multi-user)
These persist to the browser via `localStorage` (helper `read()`/`write()` in `the-dock.tsx`). If Carmen wants these shared/persistent across devices, migrate them to the backend; otherwise they work as-is:
- **The Dock (`/the-dock`)** keys: `greggos.catchlog.v1`, `greggos.dockfeed.v1`, `greggos.beercount.v1` (Beer O'Clock cold-one counter), `greggos.dreamboard.v1`, `greggos.bucketlist.v1`.
- **Captain's Bridge (`/captains-bridge`)**: localStorage-backed.
- **Sonar sound settings** (`src/lib/sonar.ts`): `greggos.sonar.enabled.v1`, `greggos.sonar.volume.v1`.
- **Motivation (`/motivation`)**: static content in `src/lib/motivation.ts` (`MOTIVATION_MESSAGES`), time-slot selected — no backend needed unless messages should be editable.

### 3d. Auth
Clerk provider is configured in `App.tsx` (`VITE_CLERK_PUBLISHABLE_KEY`, optional `VITE_CLERK_PROXY_URL`). Sign-in is **optional** by design. Do not gate the whole app behind auth unless explicitly asked.

---

## 4. UI Safeguards for Carmen

**Do Not Touch — this is finished, hand-tuned brand UI. Leave completely untouched:**

1. **The GREGG brand theme & tokens** — `src/index.css` `:root`/`.dark` CSS variables (gold/sunset/chrome palette), the body background wash, fonts (Cabinet Grotesk / General Sans via Fontshare in `index.html`). Do not restyle to a generic theme.
2. **The Dock / Beer O'Clock experience** (`src/pages/the-dock.tsx` + its CSS) — the cinematic "enter the private bar" reveal, the interactive **neon marlin** sign, poster wall, cold-one counter, and all associated animations. Custom CSS classes/keyframes in `index.css` that must stay intact:
   - `.beer-neon`, `.beer-cheers`, `.beer-bubble-rise`, `.beer-card-stack`
   - `.bar-reveal`, `.bar-scene-img` (+ `@keyframes bar-scene-lights`), `.bar-neon-sign` (+ `bar-neon-on`), `.bar-letterbox-top/-bottom`, `.bar-enter-pulse`
   - `.marlin-neon-on`, `.marlin-neon-buzz`, `.marlin-neon-ignite`, `.marlin-neon-off`
   - The `NeonMarlin` inline SVG component in `the-dock.tsx`.
3. **The animated seasonal hero** — `DashboardHero` + `src/seasonal-hero.css` + `scripts/seasonal-hero/update.mjs` (weekday cron writes the palette). Custom classes: `.hero-wave-1/2/3`, `.hero-caustics`, `.hero-photo`, `.hero-fish`, `.hero-fish-2`, `.hero-boat`, `.hero-chip-fish*`, `.coastal-waves`, and the `[data-ambient="day|evening|night|beer"]` variants. **Do not "fix" the auto-generated `seasonal-hero.css`** — it is regenerated by the cron and must stay in the gold/sunset family.
4. **Branding assets & media** (in `artifacts/cockpit/public/`) — `gregg-badge.png`, `favicon.*`, `logo.svg`, the welcome/walkthrough videos (`welcome-video.mp4`, `walkthrough-video.mp4`) and their posters, the GREGG poster art (`gregg-poster-*.jpg`, `gregg-pinup-*.jpg`), bar art (`gregg-bar-interior.jpg`, `gregg-cold-beer.jpg`), and audio (`bar-ambience.mp3`, `neon-buzz.mp3`). Do not regenerate or replace.
5. **The Sonar audio system** (`src/lib/sonar.ts`) — Web Audio API cues tied to alert-card animations. Leave the audio synthesis logic intact.
6. **Sidebar shell** (`src/components/layout/SidebarLayout.tsx`) — the gold nameplate, circular badge logo, and nav structure. Backend work should not alter this chrome.

**Safe to work on:** wiring/verifying live API connections for the entities in §3a, configuring the AI server + Clerk env vars, and (optionally) migrating the §3c localStorage features to the backend if multi-device persistence is required. When editing a page, change **data/logic only** — keep JSX structure and `className`s.

---

_Generated as the final architecture handoff. Frontend build + this file are committed to `main`._
