---
name: Cockpit data conventions
description: Non-obvious sentinel/value conventions in the Gregg + Landon cockpit data model
---

# Cockpit data conventions

- **`audit.overallScore === 0` means "not yet audited", not a real 0% score.** The Audit Score KPI and the audit detail card both render `0` as "—". Any derived metric (e.g. the overall client health blend on client-detail.tsx) must treat `0` as missing/excluded, not as a worst-possible score.
  **Why:** seeds use 0 for Not Started / Scheduled audits; counting it as a literal score would wrongly tank derived health.
  **How to apply:** gate audit inclusion on `audit.overallScore > 0` whenever aggregating.

- **Overall Client Health gauge** (client-detail.tsx) is a weighted blend (risk 30 inverted, audit 25, SLA 15, tasks 10, AR 10, escalations 10) with weights renormalized when risk/audit/SLA absent. Requires at least one of risk/audit/SLA as "signal" or it renders N/A — operational factors (tasks/AR/escalations) default to 100 when empty and would otherwise inflate a data-less client to a perfect score.
