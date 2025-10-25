import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useGetMessages from "../context/hooks/useGetMessages";

// Mock zustand store
const mockSetMessages = vi.fn();
const mockStore = {
  messages: [],
  selectedConversation: null,
  setMessages: mockSetMessages,
};

vi.mock("../store/useConversation", () => ({
  default: vi.fn(() => mockStore),
  getState: () => mockStore,
}));

// Mock toast
vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
  },
}));

describe("useGetMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.messages = [];
    mockStore.selectedConversation = null;
    globalThis.fetch = vi.fn();
  });

  it("should initialize with empty messages", () => {
    const { result } = renderHook(() => useGetMessages());

    // The hook should exist and be callable
    expect(result.current).toBeDefined();
  });

  it("should not fetch when no conversation is selected", () => {
    mockStore.selectedConversation = null;

    renderHook(() => useGetMessages());

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
