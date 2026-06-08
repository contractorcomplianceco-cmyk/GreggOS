---
name: Zustand store self-reference collapses types to any
description: Why referencing the store singleton inside its own creator breaks TS inference, and the fix
---

When a Zustand store action needs to read current state, do NOT call the store
singleton (e.g. `useStore.getState()`) from inside the `create(...)` initializer.

**Why:** Referencing the exported store variable inside its own creator creates a
circular type dependency. TypeScript breaks the cycle by inferring the whole store
as `any`, which silently propagates: every component doing `const {x} = useStore()`
then gets `any`, producing a flood of TS7006 "implicitly has an any type" errors in
unrelated files (callbacks like `.filter(e => ...)` lose their param types). The
initial typecheck can pass and only break once an action body references the
singleton.

**How to apply:** Use the `get` parameter from the creator signature instead:
`create<State>()(persist((set, get) => ({ ... get().someSlice ... })))`. If a wave of
TS7006 errors appears across many files that all consume the store, suspect a
self-reference inside the creator, not the consumer files.
