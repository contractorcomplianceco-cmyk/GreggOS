import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router as WouterRouter } from "wouter";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

// Eagerly collect every top-level page module so a page that throws on mount
// (bad import, runtime crash) fails this smoke test instead of silently
// shipping a blank screen to users.
// Exclude *.test.tsx so colocated page tests (e.g. admin.test.tsx) are not
// treated as pages. Importing them here would execute their top-level
// vi.mock() calls, polluting this suite's module registry with partial mocks.
const pageModules = import.meta.glob<{ default: React.ComponentType }>(
  ["./pages/*.tsx", "!./pages/*.test.tsx"],
  { eager: true },
);

function makeWrapper(location: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return (
      <WouterRouter base="" ssrPath={location}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>{children}</TooltipProvider>
        </QueryClientProvider>
      </WouterRouter>
    );
  };
}

describe("cockpit pages render without crashing", () => {
  for (const [filePath, mod] of Object.entries(pageModules)) {
    const name = filePath.replace("./pages/", "").replace(".tsx", "");
    it(`${name} mounts without throwing`, () => {
      const Page = mod.default;
      expect(Page, `${filePath} must have a default export`).toBeTypeOf(
        "function",
      );
      const Wrapper = makeWrapper("/clients/c1");
      const { container } = render(
        <Wrapper>
          <Page />
        </Wrapper>,
      );
      expect(container).toBeTruthy();
    });
  }
});

describe("not-found fallback", () => {
  it("renders for an unknown path like /work-queue", async () => {
    const NotFound = (
      await import("@/pages/not-found")
    ).default;
    const Wrapper = makeWrapper("/work-queue");
    const { container } = render(
      <Wrapper>
        <NotFound />
      </Wrapper>,
    );
    expect(container.textContent ?? "").toMatch(/404|not found/i);
  });
});
