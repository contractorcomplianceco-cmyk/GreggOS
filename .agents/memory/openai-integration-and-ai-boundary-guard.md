---
name: OpenAI integration + AI decision-boundary guard
description: How the cockpit uses the Replit-managed OpenAI integration server-side and the deterministic-fallback/boundary-guard pattern for AI-generated client content.
---

# Replit-managed OpenAI integration (server-only) + AI boundary guard

## Integration wiring
- AI runs ONLY on the api-server. We copied the server lib `lib/integrations-openai-ai-server` (`@workspace/integrations-openai-ai-server`) — NOT the react/audio variants, and NOT the conversations/messages schema that the blueprint ships.
- Provisioned via `setupReplitAIIntegrations`, which sets `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY`. The exported `openai` client THROWS at construction if those env vars are missing — always import it lazily inside a try/catch so a missing-config case degrades gracefully.
- Model used: `gpt-5.4` with `max_completion_tokens`; do NOT pass `temperature` (the gpt-5 family rejects non-default temperature).

## Deterministic fallback is mandatory for AI features here
**Why:** this is an internal ops tool with a hard product rule — it drafts/organizes only and must NEVER approve pricing/refunds/legal/compliance/qualifier-placement decisions, and has no send path. AI availability and AI obedience can't be assumed.

**How to apply:** every AI generation path must (1) fall back to a deterministic template on missing env OR any runtime/API error, recording which path ran in a `source` field (`ai` vs `template`); and (2) pass AI output through a deterministic post-generation guard (regex/classifier) BEFORE persisting/returning. A guard trip discards the AI output and forces the safe template — the guarantee must not rely on the model honoring its system prompt.
- Corollary: any "status"/lifecycle field on draft-only content must be constrained (OpenAPI enum + server validation) to non-sending states so the "no send path" boundary can't be bypassed via the data contract. Match the status vocabulary to the authoritative task/product spec, not a self-invented one — a stricter-but-wrong enum is still a contract mismatch.

## Testing the full generate path (end-to-end, persisted)
- The api-server test script runs the node:test runner with `--experimental-test-module-mocks` (Node 24). That flag lets `mock.module("@workspace/integrations-openai-ai-server", { namedExports: { openai: {...} } })` intercept the handler's lazy `await import(...)`, so you can force the AI to return prohibited content and assert the PERSISTED row falls back to `source="template"` with a guard-safe body.
- Tests hit the real Postgres (`DATABASE_URL` is set in this env) — insert a throwaway client, assert against the DB row, then delete it. Close the shared `pool` exactly once in a single root-level `after` hook, never per-suite, or an earlier suite's teardown closes it under a later DB-backed suite.
- A bare express test app has NO `req.log` (pino-http isn't mounted). The generate handler calls `req.log.warn` on a guard trip, so inject a no-op logger middleware before the router or the request 500s.
