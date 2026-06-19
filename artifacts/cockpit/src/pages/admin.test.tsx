import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router as WouterRouter } from "wouter";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

// admin.tsx gates the page on the current user's role via useGetCurrentUser().
// Hiding the sidebar link (covered by SidebarLayout.test.tsx) is not enough: a
// staff member could navigate straight to /admin. These tests prove the page
// itself refuses non-admins and never renders admin-only controls.
//
// The shared jsdom harness (src/test/setup.ts) stubs fetch as forever-pending,
// so the real generated query hooks would stay loading and never expose a role.
// Mock the generated client module directly with a controllable role.
let currentRole: string | undefined;
let meLoading = false;

vi.mock("@workspace/api-client-react", () => ({
  useGetCurrentUser: () => ({
    data:
      currentRole === undefined ? undefined : { id: "u1", role: currentRole },
    isLoading: meLoading,
  }),
  useListUsers: () => ({ data: undefined }),
  useUpdateUser: () => ({ mutateAsync: vi.fn(), isPending: false }),
  getListUsersQueryKey: () => ["users"],
  exportData: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number) {
      super("ApiError");
      this.status = status;
    }
  },
}));

vi.mock("@/lib/store", () => ({
  useStore: () => ({ resetData: vi.fn() }),
}));

import Admin from "@/pages/admin";

function mount(ui: ReactNode, location = "/admin") {
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

const ADMIN_ONLY_CONTROLS = [
  "User Management",
  "Data Management",
  "Export Data",
  "Reset Database",
];

describe("Admin page role boundary", () => {
  beforeEach(() => {
    currentRole = undefined;
    meLoading = false;
  });

  it("shows an access-denied state and no admin controls for a non-admin (staff) user", () => {
    currentRole = "coordinator";
    mount(<Admin />);

    expect(screen.getByText("Admin access required")).toBeTruthy();
    for (const control of ADMIN_ONLY_CONTROLS) {
      expect(screen.queryByText(control)).toBeNull();
    }
  });

  it("treats an unknown 'member' role as non-admin", () => {
    currentRole = "member";
    mount(<Admin />);

    expect(screen.getByText("Admin access required")).toBeTruthy();
    for (const control of ADMIN_ONLY_CONTROLS) {
      expect(screen.queryByText(control)).toBeNull();
    }
  });

  it("renders admin controls and no access-denied state for an admin user", () => {
    currentRole = "admin";
    mount(<Admin />);

    expect(screen.queryByText("Admin access required")).toBeNull();
    for (const control of ADMIN_ONLY_CONTROLS) {
      expect(screen.getAllByText(control).length).toBeGreaterThan(0);
    }
  });

  it("does not flash the access-denied state while the role is still loading", () => {
    currentRole = undefined;
    meLoading = true;
    mount(<Admin />);

    expect(screen.queryByText("Admin access required")).toBeNull();
  });
});
