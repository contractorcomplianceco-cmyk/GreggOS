---
name: Cockpit dual test runners
description: How tests are split between node:test and vitest in artifacts/cockpit, and what render smoke tests need to mount pages.
---

The cockpit artifact runs **two** test runners, split by file extension:

- `*.test.ts` → `node --import tsx --test` (structural/source-parsing tests, no DOM). Example: `navigation.test.ts`.
- `*.test.tsx` → `vitest run` (jsdom + @testing-library/react render tests). Config in `vitest.config.ts` (`include: ["src/**/*.test.tsx"]`), setup in `src/test/setup.ts`.

`pnpm test` runs both (`node ... && vitest run`); `pnpm test:render` runs only vitest.

**Why:** `navigation.test.ts` only parses source and can't catch a page that throws on mount. Render smoke tests (`src/pages.smoke.test.tsx`) import every `pages/*.tsx` via `import.meta.glob` and assert each mounts.

**How to mount a cockpit page in a render test** (these are the things that otherwise crash jsdom):
- Mock `@clerk/react` (`useUser`/`useClerk`) — SidebarLayout calls them and there's no ClerkProvider.
- Wrap in `QueryClientProvider` (retry:false) + wouter `Router` + `TooltipProvider`.
- Stub `fetch` to a never-resolving promise so React Query stays in loading state (no network, no error branch).
- Polyfill `ResizeObserver` (recharts), `IntersectionObserver`, `matchMedia` (use-mobile), `Element.prototype.scrollIntoView`.
- jsdom emits a benign recharts "width(0)/height(0)" stderr warning — not a failure.

tsconfig excludes `**/*.test.ts` but NOT `.test.tsx`, so render tests + `vitest.config.ts` are type-checked by `pnpm typecheck`.
