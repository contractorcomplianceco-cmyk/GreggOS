---
name: Live audit portal integration (cockpit)
description: How client-detail consumes the external CCA Audit Risk Portal and its risk-vs-compliance gotcha
---

# Live audit portal integration

The cockpit links clients to the external CCA Audit Risk Portal by **best-effort name match only** (no shared ID): normalized `clientName`/`companyName` vs the portal audit's `clientName`. The portal often holds very few audits (at times only one, "ABC Construction LLC"), so a cockpit client must be named to match or no live data shows.

**Risk vs compliance inversion (critical):** the portal is risk-oriented — higher `layerANormalized` = WORSE. Any "health"/"compliance" surface (higher = better) must use `100 - layerANormalized`, never the score directly. Mixing the two scales silently inverts meaning.

`overallScore` from the portal is a decimal risk figure (e.g. 36.8), NOT a 0-100 compliance %; don't render it with the seed's green-good `scoreColor`.

When matched, the client-detail Audit card / Audit KPI / overall-health "Audit compliance" factor all render live data via `useAudits` + `useAuditDetail`; unmatched falls back to seed audit. `useAuditDetail(id)` is gated on `id != null`.

**Why:** the user asked to "link audit information to real audit information" and the only way to make the linkage visible was aligning a seed client's name to the portal's sample entity; the inversion bug is easy to reintroduce because seed audits use a higher-is-better compliance %.
