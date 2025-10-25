import "@testing-library/jest-dom";
import { vi, beforeEach } from "vitest";

// Mock fetch globally
globalThis.fetch = vi.fn();

// Setup default mocks that can be overridden in individual tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
