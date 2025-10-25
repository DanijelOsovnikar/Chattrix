import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useSendMessage from "../context/hooks/useSendMessage";
import useConversation from "../store/useConversation";
import toast from "react-hot-toast";

// Mock dependencies
vi.mock("../store/useConversation");
vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
  },
}));

// Mock fetch
globalThis.fetch = vi.fn();

describe("useSendMessage Hook", () => {
  const mockSetMessages = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch.mockClear();

    useConversation.mockReturnValue({
      messages: [],
      setMessages: mockSetMessages,
      selectedConversation: {
        _id: "conv123",
        participants: [
          { _id: "user1", fullName: "User One" },
          { _id: "user2", fullName: "User Two" },
        ],
      },
    });
  });

  it("should send regular message successfully", async () => {
    const mockResponse = {
      _id: "msg123",
      message: "Hello there",
      senderId: "user1",
      receiverId: "user2",
      createdAt: new Date().toISOString(),
    };

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useSendMessage());

    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.sendMessage("Hello there");
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/messages/send/conv123",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: "Hello there",
        }),
      }
    );

    expect(mockSetMessages).toHaveBeenCalledWith([mockResponse]);
  });

  it("should send external request successfully", async () => {
    const mockExternalRequest = {
      _id: "ext123",
      isExternalRequest: true,
      orderNumber: "EXT-001",
      buyer: "Test Buyer",
      messages: [{ ean: "123456", naziv: "Product", qty: 1 }],
    };

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockExternalRequest,
    });

    const { result } = renderHook(() => useSendMessage());

    await act(async () => {
      await result.current.sendExternalRequest({
        receiverId: "user2",
        targetWarehouseId: "warehouse123",
        buyer: "Test Buyer",
        messages: [{ ean: "123456", naziv: "Product", qty: 1 }],
      });
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/messages/send-external",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          receiverId: "user2",
          targetWarehouseId: "warehouse123",
          buyer: "Test Buyer",
          messages: [{ ean: "123456", naziv: "Product", qty: 1 }],
        }),
      }
    );
  });

  it("should handle send message error", async () => {
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Failed to send message" }),
    });

    const { result } = renderHook(() => useSendMessage());

    await act(async () => {
      await result.current.sendMessage("Hello there");
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to send message");
  });

  it("should handle network error", async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useSendMessage());

    await act(async () => {
      await result.current.sendMessage("Hello there");
    });

    expect(toast.error).toHaveBeenCalledWith("Network error");
  });

  it("should not send empty message", async () => {
    const { result } = renderHook(() => useSendMessage());

    await act(async () => {
      await result.current.sendMessage("");
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("should not send when no conversation selected", async () => {
    useConversation.mockReturnValue({
      messages: [],
      setMessages: mockSetMessages,
      selectedConversation: null,
    });

    const { result } = renderHook(() => useSendMessage());

    await act(async () => {
      await result.current.sendMessage("Hello there");
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
