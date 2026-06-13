import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Mock Clerk so SidebarLayout (useUser/useClerk) renders without a ClerkProvider.
vi.mock("@clerk/react", () => ({
  useUser: () => ({ user: null, isLoaded: true, isSignedIn: false }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

// Keep every React Query fetch pending so pages render their loading state
// rather than hitting the network or flipping into an error branch.
vi.stubGlobal("fetch", () => new Promise<Response>(() => {}));

// jsdom lacks these browser APIs that some components/charts rely on at mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);

if (!window.matchMedia) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

afterEach(() => {
  cleanup();
});
