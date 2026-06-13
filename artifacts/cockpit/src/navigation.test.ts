import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, "App.tsx"), "utf8");
const sidebarSource = readFileSync(
  join(here, "components/layout/SidebarLayout.tsx"),
  "utf8",
);

// Extract every `<Route path="...">` pattern registered in App.tsx, in order.
// The final `<Route component={NotFound} />` has no `path` and acts as the
// fallback that catches anything no other route matched.
function registeredRoutePaths(): string[] {
  const matches = appSource.matchAll(/<Route\s+path="([^"]+)"/g);
  return [...matches].map((m) => m[1]);
}

// Extract every sidebar nav `href` declared in SidebarLayout.tsx. The admin
// entry is rendered conditionally at runtime but is still present in source.
function sidebarHrefs(): string[] {
  const matches = sidebarSource.matchAll(/href:\s*"([^"]+)"/g);
  return [...matches].map((m) => m[1]);
}

// Minimal wouter-style matcher: does `pattern` match `path`? Supports literal
// segments, `:param` segments, and trailing `*` / `*?` wildcards. Enough to
// model the cockpit's route table for fallthrough checks.
function matchPattern(pattern: string, path: string): boolean {
  const pSeg = pattern.split("/").filter((s) => s.length);
  const lSeg = path.split("/").filter((s) => s.length);

  for (let i = 0; i < pSeg.length; i++) {
    const seg = pSeg[i];
    if (seg === "*" || seg === "*?") {
      return true; // wildcard consumes the rest
    }
    if (lSeg[i] === undefined) return false;
    if (seg.startsWith(":")) continue; // any single segment
    if (seg !== lSeg[i]) return false;
  }
  return pSeg.length === lSeg.length;
}

// Returns true when no registered route matches `path`, i.e. wouter's Switch
// would fall through to the unpathed NotFound route.
function fallsThroughToNotFound(path: string): boolean {
  return !registeredRoutePaths().some((pattern) =>
    matchPattern(pattern, path),
  );
}

describe("removed screens stay gone", () => {
  it("does not register a /work-queue route (falls through to not-found)", () => {
    assert.ok(
      fallsThroughToNotFound("/work-queue"),
      "/work-queue must not be a registered route so it renders the not-found fallback",
    );
  });

  it("has no lingering Work Queue references in App or sidebar source", () => {
    const combined = `${appSource}\n${sidebarSource}`;
    assert.doesNotMatch(
      combined,
      /work-?queue/i,
      "removed Work Queue screen must not be referenced in routes or navigation",
    );
  });
});

describe("sidebar navigation and routes stay consistent", () => {
  // Routes that intentionally have no sidebar link: auth flows, the client
  // detail (param) route reached from the clients list, and the fallback.
  const ROUTES_WITHOUT_SIDEBAR_LINK = new Set([
    "/sign-in/*?",
    "/sign-up/*?",
    "/clients/:id",
  ]);

  it("every sidebar nav entry maps to a registered route", () => {
    const routes = registeredRoutePaths();
    for (const href of sidebarHrefs()) {
      assert.ok(
        routes.includes(href),
        `sidebar links to ${href} but no <Route path="${href}"> is registered in App.tsx`,
      );
    }
  });

  it("every primary navigable route has a sidebar entry", () => {
    const hrefs = new Set(sidebarHrefs());
    for (const route of registeredRoutePaths()) {
      if (ROUTES_WITHOUT_SIDEBAR_LINK.has(route)) continue;
      assert.ok(
        hrefs.has(route),
        `route ${route} is registered but has no sidebar entry (add a nav link or document the exclusion)`,
      );
    }
  });
});
