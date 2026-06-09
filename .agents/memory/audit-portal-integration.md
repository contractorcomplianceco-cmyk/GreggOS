---
name: Cockpit live audit portal integration
description: How/why the cockpit reads live audit data from the external CCA Audit Risk Portal, and the constraints around it.
---

The cockpit (artifacts/cockpit) is otherwise a deliberate no-backend/localStorage app, but it reads LIVE audit data from an external app, the CCA Audit Risk Portal (`https://audit-risk-model.replit.app`).

**Why direct browser fetch (no proxy):** the portal serves an OPEN, public CORS API — it reflects any request Origin and sets `access-control-allow-credentials: true`. So the browser can fetch it directly with React Query; adding a cockpit-side backend proxy would contradict the no-backend design AND would not improve security, because the portal endpoints are themselves public/unauthenticated.

**Endpoints used:** `/api/healthz` (`{status:"ok"}`), `/api/audits` (summary list — has `layerANormalized`, `layerABand`, `overallScore`, `finalStatus`, `finalLevel`, `activeTriggerCount` etc.), `/api/audits/:id` (deep detail — `layerAScores`, `findings[]`, `documents[]`, entity profile; but NOT the band/score summary fields, so the detail page merges list-summary + detail). There is no OpenAPI spec; `/api`/`/api/risk` 404.

**Security caveat to remember:** anyone who can open the cockpit (and anyone who hits the portal) can read full audit payloads including EIN/financials. Real lock-down must happen on the portal (auth), not in the cockpit.

**Client linkage is best-effort name matching:** the two systems share no common ID. client-detail matches a live audit by normalized clientName/companyName (lowercase, strip `.`/`,`, collapse spaces). Portal demo clients (ABC Construction LLC, Northgate Mechanical, Summit Builders LLC) do NOT match the cockpit seed clients, so the "Live: <status>" badge is invisible until names line up.

**Base URL override:** `getPortalBaseUrl()`/`setPortalBaseUrl()` in `auditPortal.ts` allow a localStorage override (key `cockpit-audit-portal-url`); default is the portal URL above. Query keys include the base URL so switching it refetches.
