import { useAuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { MdAdminPanelSettings } from "react-icons/md";

const AdminButton = () => {
  const { authUser } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Only show for admins and super_admins
  if (!authUser || !["admin", "super_admin"].includes(authUser.role)) {
    return null;
  }

  const isOnAdminPage = location.pathname === "/admin";

  const handleClick = () => {
    // Admin and super_admin always go to admin panel
    // No "back to chat" functionality since admin uses integrated messages
    if (!isOnAdminPage) {
      navigate("/admin"); // Go to admin dashboard
    }
  };

  return (
    <div className="mt-auto mb-2">
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isOnAdminPage
            ? "bg-neutral text-white cursor-default opacity-70"
            : "bg-primary text-white hover:bg-blue-700"
        }`}
        title="Admin Dashboard"
        disabled={isOnAdminPage}
      >
        <MdAdminPanelSettings className="w-5 h-5" />
        <span className="text-sm font-medium">
          {isOnAdminPage ? "Admin Panel" : "Admin Panel"}
        </span>
      </button>
    </div>
  );
};

export default AdminButton;
