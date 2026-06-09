---
name: Dynamic seed dates in cockpit
description: How/why seed data dates must stay relative-to-today and coherent across structured fields and prose
---

# Dynamic seed dates (cockpit)

All demo/seed dates in `artifacts/cockpit/src/lib/seed.ts` are generated relative to today via the `iso(offsetDays)` helper so SLAs, schedules, invoices, and "X days ago" labels always look live.

**The trap:** dates are embedded in two places per call note — structured fields (`callDate`, `dueDate`, `createdAt`) AND inside prose template strings (`crmReadyNote`, `clientFollowUpDraft`, `taskList`, e.g. "Call with X on <date>. Due date: <date>."). Making only the structured fields dynamic leaves the prose frozen in the past, so headers and body text disagree (visible in the Call Note Processor when opening a seeded note, and anywhere prose is surfaced).

**Rule:** every date a note exposes must derive from one source of truth. Pattern used: a `noteDates` map (`{ nX: { call: iso(a), due: iso(b) } }`) defined before `seedNotes`; each note's `callDate`, prose template literals (backticks, not single quotes), and `createdAt`/`updatedAt` all reference `noteDates.nX.*`. Don't bake a computed date string in — it re-freezes and drifts again.

**Why:** baked/literal dates silently rot and create cross-screen incoherence that typecheck can't catch.

**How to apply:** when adding or editing seeded entities with dates, route them through `iso()`/`noteDates`; never introduce a literal `YYYY-MM-DD`. A quick `rg -c "20[0-9]{2}-" seed.ts` should return nothing.
