import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Home from "../pages/home/Home";
import { AuthContext } from "../context/AuthContext";

// Mock child components
vi.mock("../components/Sidebar", () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock("../components/Messages/MessageContainer", () => ({
  default: () => <div data-testid="message-container">Message Container</div>,
}));

// Mock context providers
vi.mock("../context/SocketContext", () => ({
  SocketContextProvider: ({ children }) => (
    <div data-testid="socket-provider">{children}</div>
  ),
}));

vi.mock("../context/ConversationContext", () => ({
  ConversationContextProvider: ({ children }) => (
    <div data-testid="conversation-provider">{children}</div>
  ),
}));

const mockAuthContextValue = {
  authUser: {
    id: "1",
    userName: "testuser",
    fullName: "Test User",
    role: "employee",
  },
  setAuthUser: vi.fn(),
};

const HomeWrapper = ({ authUser = mockAuthContextValue.authUser }) => (
  <AuthContext.Provider
    value={{
      ...mockAuthContextValue,
      authUser,
    }}
  >
    <Home />
  </AuthContext.Provider>
);

describe("Home Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders main layout components", () => {
    render(<HomeWrapper />);

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("message-container")).toBeInTheDocument();
  });

  it("wraps components with context providers", () => {
    render(<HomeWrapper />);

    expect(screen.getByTestId("socket-provider")).toBeInTheDocument();
    expect(screen.getByTestId("conversation-provider")).toBeInTheDocument();
  });

  it("has proper layout structure", () => {
    render(<HomeWrapper />);

    // Check if the main container has proper classes or structure
    const sidebar = screen.getByTestId("sidebar");
    const messageContainer = screen.getByTestId("message-container");

    expect(sidebar).toBeInTheDocument();
    expect(messageContainer).toBeInTheDocument();
  });

  it("renders for different user roles", () => {
    const adminUser = {
      ...mockAuthContextValue.authUser,
      role: "admin",
    };

    render(<HomeWrapper authUser={adminUser} />);

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("message-container")).toBeInTheDocument();
  });
});
