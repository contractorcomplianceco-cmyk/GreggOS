import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router as WouterRouter } from "wouter";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

// SidebarLayout reads the current user's role via useGetCurrentUser() to decide
// whether to show the admin-only "Admin / Setup" link. The shared jsdom harness
// (src/test/setup.ts) stubs fetch as forever-pending, so the real query would
// stay in its loading state and never expose a role. Mock the generated hook
// directly with a controllable role so we can assert the conditional nav.
let currentRole: string | undefined;

vi.mock("@workspace/api-client-react", () => ({
  useGetCurrentUser: () => ({
    data: currentRole === undefined ? undefined : { role: currentRole },
  }),
}));

import { SidebarLayout } from "@/components/layout/SidebarLayout";

function mount(ui: ReactNode, location = "/") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <WouterRouter base="" ssrPath={location}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{ui}</TooltipProvider>
      </QueryClientProvider>
    </WouterRouter>,
  );
}

const STANDARD_NAV_ITEMS = [
  "Gregg Today",
  "Current Clients",
  "Expansion Pipeline",
  "Call Note Processor",
];

describe("SidebarLayout role-gated navigation", () => {
  beforeEach(() => {
    currentRole = undefined;
  });

  it("shows the Admin / Setup link for an admin user", () => {
    currentRole = "admin";
    mount(
      <SidebarLayout>
        <div>content</div>
      </SidebarLayout>,
    );

    expect(screen.getAllByText("Admin / Setup").length).toBeGreaterThan(0);
    for (const item of STANDARD_NAV_ITEMS) {
      expect(screen.getAllByText(item).length).toBeGreaterThan(0);
    }
  });

  it("hides the Admin / Setup link for a non-admin (staff) user", () => {
    currentRole = "member";
    mount(
      <SidebarLayout>
        <div>content</div>
      </SidebarLayout>,
    );

    expect(screen.queryByText("Admin / Setup")).toBeNull();
    for (const item of STANDARD_NAV_ITEMS) {
      expect(screen.getAllByText(item).length).toBeGreaterThan(0);
    }
  });

  it("hides the Admin / Setup link when the user role is unknown", () => {
    currentRole = undefined;
    mount(
      <SidebarLayout>
        <div>content</div>
      </SidebarLayout>,
    );

    expect(screen.queryByText("Admin / Setup")).toBeNull();
    for (const item of STANDARD_NAV_ITEMS) {
      expect(screen.getAllByText(item).length).toBeGreaterThan(0);
    }
  });
});
