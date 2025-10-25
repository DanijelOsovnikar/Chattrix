import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Sidebar from "../components/Sidebar";
import { AuthContext } from "../context/AuthContext";

// Mock components
vi.mock("../components/Conversations", () => ({
  default: () => <div data-testid="conversations">Conversations</div>,
}));

vi.mock("../components/LogoutButton", () => ({
  default: () => <button data-testid="logout-button">Logout</button>,
}));

vi.mock("../components/AdminButton", () => ({
  default: () => <button data-testid="admin-button">Admin</button>,
}));

vi.mock("../components/NotificationsButton", () => ({
  default: () => (
    <button data-testid="notifications-button">Notifications</button>
  ),
}));

vi.mock("../components/ThemeSelector", () => ({
  default: () => <div data-testid="theme-selector">Theme Selector</div>,
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

const SidebarWrapper = ({ authUser = mockAuthContextValue.authUser }) => (
  <AuthContext.Provider
    value={{
      ...mockAuthContextValue,
      authUser,
    }}
  >
    <Sidebar />
  </AuthContext.Provider>
);

describe("Sidebar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders sidebar with conversations", () => {
    const SidebarWrapper = () => (
      <AuthContext.Provider value={mockAuthContextValue}>
        <Sidebar />
      </AuthContext.Provider>
    );

    render(<SidebarWrapper />);

    // Sidebar only renders Conversations component
    expect(screen.getByTestId("conversations")).toBeInTheDocument();
  });

  it("renders the same content regardless of user role", () => {
    const adminUser = { ...mockAuthContextValue.authUser, role: "admin" };
    const SidebarWrapper = () => (
      <AuthContext.Provider
        value={{ ...mockAuthContextValue, authUser: adminUser }}
      >
        <Sidebar />
      </AuthContext.Provider>
    );

    render(<SidebarWrapper />);

    // Sidebar doesn't render admin buttons - that's handled in other components
    expect(screen.getByTestId("conversations")).toBeInTheDocument();
  });

  it("renders conversations for super admin users", () => {
    const superAdminUser = {
      ...mockAuthContextValue.authUser,
      role: "super_admin",
    };
    const SidebarWrapper = () => (
      <AuthContext.Provider
        value={{ ...mockAuthContextValue, authUser: superAdminUser }}
      >
        <Sidebar />
      </AuthContext.Provider>
    );

    render(<SidebarWrapper />);

    expect(screen.getByTestId("conversations")).toBeInTheDocument();
  });

  it("does not show admin button for regular employees", () => {
    render(<SidebarWrapper />);

    expect(screen.queryByTestId("admin-button")).not.toBeInTheDocument();
  });

  it("has proper component structure", () => {
    const SidebarWrapper = () => (
      <AuthContext.Provider value={mockAuthContextValue}>
        <Sidebar />
      </AuthContext.Provider>
    );

    render(<SidebarWrapper />);

    // Sidebar has the correct CSS classes and structure
    const sidebar =
      screen.getByTestId("conversations").parentElement.parentElement;
    expect(sidebar).toHaveClass("sidebar");
  });
});
