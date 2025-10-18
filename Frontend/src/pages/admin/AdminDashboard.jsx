import { useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import useLogout from "../../context/hooks/useLogout";
import UserManagement from "../../components/admin/UserManagement";
import ShopManagement from "../../components/admin/ShopManagement";
import NotificationSettings from "../../components/admin/NotificationSettings";
import PasswordManagement from "../../components/admin/PasswordManagement";
import Sidebar from "../../components/Sidebar";
import MessageContainer from "../../components/Messages/MessageContainer";
import ThemeSelector from "../../components/ThemeSelector";
import AdminButton from "../../components/AdminButton";

const AdminDashboard = () => {
  const { authUser } = useAuthContext();
  const { logout } = useLogout();

  // Set default tab based on user role
  const getDefaultTab = () => {
    if (authUser.role === "super_admin") return "users";
    if (authUser.role === "admin") return "messages"; // Admin starts with messages
    return "users";
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());

  // Check if user is admin or super_admin
  if (!authUser || !["admin", "super_admin"].includes(authUser.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-300">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 w-full">
      {/* Header */}
      <div className="bg-base-200 shadow-lg rounded-t-lg">
        <div className="max-w-[120rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start sm:items-center pt-6 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-primary">
                Admin Dashboard
              </h1>
              <p className="text-primary">Welcome back, {authUser.fullName}</p>
              <div className="text-sm text-primary">
                {authUser.shopId?.name
                  ? `Shop: ${authUser.shopId.name}`
                  : "No Shop"}
              </div>
            </div>
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content bg-base-200 text-base-content rounded-lg top-px h-96 max-h-fit w-48 overflow-y-auto shadow-2xl z-10"
                style={{ transform: "translateZ(0)", willChange: "transform" }}
              >
                <li className="p-2 pb-0">
                  <AdminButton />
                </li>
                <li className="p-2 py-0">
                  <ThemeSelector />
                </li>
                <li className="p-2 pt-0">
                  <p className="text-sm mb-2">Settings:</p>
                  <button
                    onClick={logout}
                    className="theme-controller btn btn-sm btn-block btn-ghost hover:bg-accenttext-accent-content justify-start"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-base-200 border-b border-gray-700">
        <div className="max-w-[120rem] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-scroll">
            {/* Messages tab - only for admin, not super_admin */}
            {authUser.role === "admin" && (
              <button
                onClick={() => setActiveTab("messages")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "messages"
                    ? "border-primary text-primary"
                    : "border-transparent text-base-content hover:text-primary hover:border-primary"
                }`}
              >
                Messages
              </button>
            )}

            {/* User Management tab - for both admin and super_admin */}
            <button
              onClick={() => setActiveTab("users")}
              className={`py-4 px-1 border-b-2 font-medium text-nowrap text-sm ${
                activeTab === "users"
                  ? "border-primary text-primary"
                  : "border-transparent text-base-content hover:text-primary hover:border-primary"
              }`}
            >
              User Management
            </button>

            {/* Notification Settings tab - for both admin and super_admin */}
            <button
              onClick={() => setActiveTab("notifications")}
              className={`py-4 px-1 border-b-2 font-medium text-nowrap text-sm ${
                activeTab === "notifications"
                  ? "border-primary text-primary"
                  : "border-transparent text-base-content hover:text-primary hover:border-primary"
              }`}
            >
              Notification Settings
            </button>

            {/* Password Management tab - for admin, super_admin, and manager */}
            {["admin", "super_admin", "manager"].includes(authUser.role) && (
              <button
                onClick={() => setActiveTab("passwords")}
                className={`py-4 px-1 border-b-2 font-medium text-nowrap text-sm ${
                  activeTab === "passwords"
                    ? "border-primary text-primary"
                    : "border-transparent text-base-content hover:text-primary hover:border-primary"
                }`}
              >
                Password Management
              </button>
            )}

            {/* Shop Management tab - only for super_admin */}
            {authUser.role === "super_admin" && (
              <button
                onClick={() => setActiveTab("shops")}
                className={`py-4 px-1 border-b-2 font-medium text-nowrap text-sm ${
                  activeTab === "shops"
                    ? "border-primary text-primary"
                    : "border-transparent text-base-content hover:text-primary hover:border-primary"
                }`}
              >
                Shop Management
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[120rem] mx-auto px-4 lg:px-8 bg-base-100 mt-[1.3rem]">
        {activeTab === "messages" && authUser.role === "admin" && (
          <div className="flex h-[calc(100vh-200px)] homeWrapper rounded-lg overflow-hidden bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0">
            <Sidebar />
            <MessageContainer />
          </div>
        )}
        {activeTab === "users" && <UserManagement />}
        {activeTab === "notifications" && <NotificationSettings />}
        {activeTab === "passwords" && <PasswordManagement />}
        {activeTab === "shops" && authUser.role === "super_admin" && (
          <ShopManagement key={`shops-${activeTab}`} />
        )}
      </div>
    </div>
  );
};

AdminDashboard.propTypes = {};

export default AdminDashboard;
