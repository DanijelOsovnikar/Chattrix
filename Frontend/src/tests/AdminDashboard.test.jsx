import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminDashboard from "../pages/admin/AdminDashboard";
import { AuthContext } from "../context/AuthContext";

// Mock child components
vi.mock("../components/admin/UserManagement", () => ({
  default: () => <div data-testid="user-management">User Management</div>,
}));

vi.mock("../components/admin/ShopManagement", () => ({
  default: () => <div data-testid="shop-management">Shop Management</div>,
}));

vi.mock("../components/admin/NotificationSettings", () => ({
  default: () => (
    <div data-testid="notification-settings">Notification Settings</div>
  ),
}));

const mockAuthContextValue = {
  authUser: {
    id: "1",
    userName: "admin",
    fullName: "Admin User",
    role: "admin",
  },
  setAuthUser: vi.fn(),
};

const AdminDashboardWrapper = ({
  authUser = mockAuthContextValue.authUser,
}) => (
  <AuthContext.Provider
    value={{
      ...mockAuthContextValue,
      authUser,
    }}
  >
    <AdminDashboard />
  </AuthContext.Provider>
);

describe("AdminDashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders admin dashboard title", () => {
    render(<AdminDashboardWrapper />);

    expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
  });

  it("renders user management section", () => {
    render(<AdminDashboardWrapper />);

    expect(screen.getByTestId("user-management")).toBeInTheDocument();
  });

  it("renders shop management section", () => {
    render(<AdminDashboardWrapper />);

    expect(screen.getByTestId("shop-management")).toBeInTheDocument();
  });

  it("renders notification settings section", () => {
    render(<AdminDashboardWrapper />);

    expect(screen.getByTestId("notification-settings")).toBeInTheDocument();
  });

  it("shows admin user information", () => {
    render(<AdminDashboardWrapper />);

    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });

  it("handles super admin role", () => {
    const superAdminUser = {
      ...mockAuthContextValue.authUser,
      role: "super_admin",
    };

    render(<AdminDashboardWrapper authUser={superAdminUser} />);

    expect(screen.getByTestId("user-management")).toBeInTheDocument();
    expect(screen.getByTestId("shop-management")).toBeInTheDocument();
  });

  it("has proper navigation structure", () => {
    render(<AdminDashboardWrapper />);

    // Check for tabs or navigation elements
    expect(screen.getByText(/users/i)).toBeInTheDocument();
    expect(screen.getByText(/shops/i)).toBeInTheDocument();
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });
});
