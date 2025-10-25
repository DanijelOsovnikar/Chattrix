import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useLogin from "../context/hooks/useLogin";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

// Mock toast
vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock fetch
globalThis.fetch = vi.fn();

const mockAuthContextValue = {
  authUser: null,
  setAuthUser: vi.fn(),
};

const wrapper = ({ children }) => (
  <AuthContext.Provider value={mockAuthContextValue}>
    {children}
  </AuthContext.Provider>
);

describe("useLogin Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch.mockClear();
  });

  it("should login successfully", async () => {
    const mockUser = {
      id: "1",
      userName: "testuser",
      fullName: "Test User",
      role: "employee",
    };

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    const { result } = renderHook(() => useLogin(), { wrapper });

    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.login({
        userName: "testuser",
        password: "password123",
      });
    });

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName: "testuser",
        password: "password123",
      }),
    });

    expect(mockAuthContextValue.setAuthUser).toHaveBeenCalledWith(mockUser);
    expect(toast.success).toHaveBeenCalledWith("Login successful");
  });

  it("should handle login error", async () => {
    const errorMessage = "Invalid credentials";

    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    });

    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.login({
        userName: "testuser",
        password: "wrongpassword",
      });
    });

    expect(toast.error).toHaveBeenCalledWith(errorMessage);
    expect(mockAuthContextValue.setAuthUser).not.toHaveBeenCalled();
  });

  it("should handle network error", async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.login({
        userName: "testuser",
        password: "password123",
      });
    });

    expect(toast.error).toHaveBeenCalledWith("Network error");
  });

  it("should set loading state correctly", async () => {
    globalThis.fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true, json: () => ({}) }), 100)
        )
    );

    const { result } = renderHook(() => useLogin(), { wrapper });

    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.login({
        userName: "testuser",
        password: "password123",
      });
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle missing input data", async () => {
    const { result } = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await result.current.login({
        userName: "",
        password: "",
      });
    });

    expect(toast.error).toHaveBeenCalledWith("Please fill in all fields!");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
