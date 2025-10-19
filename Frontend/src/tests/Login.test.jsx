import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Login from "../pages/login/Login";
import { AuthContext } from "../context/AuthContext";

// Mock the useLogin hook
const mockLogin = vi.fn();
vi.mock("../context/hooks/useLogin", () => ({
  default: () => ({
    loading: false,
    login: mockLogin,
  }),
}));

// Mock AuthContext
const mockAuthContextValue = {
  authUser: null,
  setAuthUser: vi.fn(),
};

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  Navigate: ({ to }) => <div data-testid="navigate">{to}</div>,
}));

const LoginWrapper = ({ children, authUser = null }) => (
  <AuthContext.Provider
    value={{
      ...mockAuthContextValue,
      authUser,
    }}
  >
    {children}
  </AuthContext.Provider>
);

describe("Login Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form when user is not authenticated", () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("renders login form regardless of authentication state (routing handled by App)", () => {
    const authUser = { id: "1", userName: "testuser", role: "employee" };

    render(
      <LoginWrapper authUser={authUser}>
        <Login />
      </LoginWrapper>
    );

    // Login component just renders the form - routing is handled by App component
    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter username")).toBeInTheDocument();
  });

  it("handles form submission", async () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const usernameInput = screen.getByPlaceholderText("Enter username");
    const passwordInput = screen.getByPlaceholderText("Enter password");
    const submitButton = screen.getByRole("button", { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("testuser", "password123");
    });
  });

  it("calls login function with empty values when form is submitted", async () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const submitButton = screen.getByRole("button", { name: /login/i });
    fireEvent.click(submitButton);

    // The component always calls login - validation happens in useLogin hook
    expect(mockLogin).toHaveBeenCalledWith("", "");
  });
});
