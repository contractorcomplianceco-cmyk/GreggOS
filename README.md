# Gregg + Landon Current Client Cockpit

Internal operational web app for Contractor Compliance Authority. It helps manage
current-client relationships: triaging priorities, processing call notes into
CRM-ready drafts, tracking tasks/escalations/opportunities, an expansion
pipeline, relationship warmth/cadence, a weekly review, RoseOS AI chat, an Email
Builder, a Staff Overview, and a Requests Hub. It also reads live, read-only
audit data from an external CCA Audit Risk Portal.

The app is advisory: it drafts and organizes, it does not approve pricing,
refunds, legal/compliance, or qualifier-placement decisions.

---

## Stack

| Aspect | Value |
| --- | --- |
| Repo layout | pnpm monorepo (`artifacts/*` apps, `lib/*` shared libraries) |
| Package manager | **pnpm** (enforced; npm/yarn are blocked by a preinstall guard) |
| Node version | **Node 20+** (developed on Node 24) |
| Frontend | React 19 + Vite 7, TypeScript, Tailwind v4, shadcn/ui, wouter |
| Backend | Express 5 (TypeScript, built with esbuild) |
| Database | PostgreSQL via Drizzle ORM (`pg`) |
| API contract | OpenAPI → Orval codegen → React Query hooks (`lib/api-client-react`) |
| Auth | Clerk (optional; app runs open without it) |
| AI | OpenAI-compatible endpoint (optional; deterministic template fallback) |

### Apps (`artifacts/`)
- **`cockpit`** — the main web UI (served at `/`).
- **`api-server`** — the Express API (served at `/api`).
- **`cockpit-walkthrough`** — a small marketing/onboarding video app embedded by the cockpit (served at `/cockpit-walkthrough/`). Optional.
- **`mockup-sandbox`** — a Replit-only component preview tool. **Not needed in production.**

---

## Quick start (local)

Requires Node 20+, pnpm 9+, and a reachable PostgreSQL instance.

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env        # then edit .env — at minimum set DATABASE_URL

# 3. Create the database schema, then load sample data
pnpm db:push                # pushes the Drizzle schema to DATABASE_URL
pnpm seed                   # loads sample clients/tasks/staff/requests (optional)

# 4. Run the two services (separate terminals)
pnpm dev:api                # API server on http://localhost:8080
pnpm dev:web                # cockpit on http://localhost:5173
```

Open <http://localhost:5173>. The cockpit dev server proxies `/api` to the API
server automatically (override the target with `API_PROXY_TARGET`).

> The exact commands requested for migration:
> - **install:** `pnpm install`
> - **dev:** `pnpm dev:api` and `pnpm dev:web` (two processes)
> - **build:** `pnpm build:api && pnpm build:web`
> - **production start (API):** `pnpm start:api` (serve the built `cockpit` statically — see below)

---

## Environment variables

See [`.env.example`](./.env.example) for the full list. Summary:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string. The only hard requirement to boot. |
| `PORT` | No | API server port (default `8080`). |
| `NODE_ENV` | No | `development` / `production`. |
| `BASE_PATH` | No | Path the cockpit is served under (default `/`). |
| `API_PROXY_TARGET` | No (dev) | Where the cockpit dev server proxies `/api` (default `http://localhost:8080`). |
| `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | No | Enable real Clerk auth. Without them the app runs open. |
| `ALLOWED_EMAILS` / `ADMIN_EMAILS` | No | Email allowlist / admin grant for Clerk provisioning. |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` / `AI_INTEGRATIONS_OPENAI_API_KEY` | No | Enable live AI; otherwise template fallbacks are used. |

On Replit, `PORT` / `BASE_PATH` are injected by workflows. Off Replit they fall
back to the defaults above, so a fresh clone runs without extra configuration
beyond `DATABASE_URL`.

---

## Build & run in production

There is no shared proxy outside Replit. In production you run the API as a
Node process and serve the cockpit as static files, with a reverse proxy (e.g.
nginx) joining them on one origin so the cockpit's same-origin `/api` calls (and
auth cookies) work.

```bash
# Build both apps
pnpm build:api          # -> artifacts/api-server/dist/index.mjs
pnpm build:web          # -> artifacts/cockpit/dist/public (static assets)

# Run the API (set env in your process manager / shell)
NODE_ENV=production PORT=8080 DATABASE_URL=... pnpm start:api
```

Serve `artifacts/cockpit/dist/public` with any static file server, and proxy
`/api` to the API server. Example nginx:

```nginx
server {
  listen 80;
  server_name your.domain;

  # Cockpit static build (SPA)
  root /srv/cockpit/dist/public;
  index index.html;
  location / {
    try_files $uri /index.html;
  }

  # API server
  location /api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Run the API under a process manager (systemd, pm2, etc.) for restarts/logging.

---

## Database

- Schema is defined with Drizzle in `lib/db/src/schema/*`.
- `pnpm db:push` applies the current schema to `DATABASE_URL` (no SQL migration
  files are used; `drizzle-kit push` diffs and syncs).
- `pnpm seed` resets the database to sample data (idempotent).

---

## Useful commands

| Command | Description |
| --- | --- |
| `pnpm install` | Install all workspace dependencies. |
| `pnpm dev:api` / `pnpm dev:web` | Run API / cockpit in development. |
| `pnpm build` | Typecheck everything, then build all apps. |
| `pnpm build:api` / `pnpm build:web` | Build a single app. |
| `pnpm start:api` | Run the built API server. |
| `pnpm db:push` | Push the Drizzle schema to the database. |
| `pnpm seed` | Reset the database to sample data. |
| `pnpm typecheck` | Full monorepo typecheck. |
| `pnpm --filter @workspace/cockpit test` | Run the cockpit test suite. |
| `pnpm --filter @workspace/api-server test` | Run the API server test suite. |

---

## Known limitations / deferred for migration

- **Reverse proxy required in production.** The cockpit calls `/api` same-origin;
  outside Replit you must front the static build + API with nginx (or equivalent).
- **Open by default.** The sign-in wall is removed; without Clerk keys the app is
  reachable by anyone with the URL and resolves a shared admin user. Re-enable
  Clerk and re-add route gating before any external exposure.
- **AI features are optional.** Without `AI_INTEGRATIONS_OPENAI_*`, RoseOS, the
  Email Builder, and the Communication Draft Builder use deterministic templates.
  No real API key is included or required to run.
- **External audit portal** (`https://audit-risk-model.replit.app`) is a separate,
  public, read-only service fetched directly from the browser. It is unaffected by
  this migration and can be repointed in `artifacts/cockpit/src/lib/auditPortal.ts`.
- **`mockup-sandbox`** is a Replit-only dev tool and is not part of the deployable
  product.
- **No data store conversion was done.** The app already uses PostgreSQL; no
  Replit-specific storage migration is pending.

---

## Replit notes

This project was developed on Replit. The Replit-specific files (`.replit`,
`.replit-artifact/`, `@replit/vite-plugin-*`) are harmless off Replit — the Vite
plugins are only loaded when `REPL_ID` is set. They can stay in the repo or be
removed later; nothing outside Replit depends on them.
