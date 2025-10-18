import { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const NotificationSettings = () => {
  const { authUser } = useAuthContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  // Fetch all users with their notification preferences
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications/admin/all-preferences", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Update notification preferences for a user
  const updateUserPreferences = async (userId, preferences) => {
    try {
      setUpdating((prev) => ({ ...prev, [userId]: true }));

      const response = await fetch(`/api/notifications/preferences/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          notificationPreferences: preferences,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      const data = await response.json();

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId
            ? { ...user, notificationPreferences: data.notificationPreferences }
            : user
        )
      );

      toast.success(`Updated notification preferences for ${data.fullName}`);
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
    } finally {
      setUpdating((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Handle checkbox change
  const handlePreferenceChange = (userId, preferenceKey, value) => {
    const user = users.find((u) => u._id === userId);
    if (!user) return;

    const updatedPreferences = {
      ...user.notificationPreferences,
      [preferenceKey]: value,
    };

    updateUserPreferences(userId, updatedPreferences);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Filter users based on role
  const filteredUsers = users.filter((user) => {
    // Exclude warehousemen from notification settings
    if (user.role === "warehouseman") return false;

    // Super admin can see all users (except warehousemen)
    if (authUser.role === "super_admin") return true;
    // Admin can only see users from their shop (except warehousemen)
    if (authUser.role === "admin")
      return user.shopName === authUser.shopId?.name;
    return false;
  });

  return (
    <div className="space-y-4 sm:space-y-6 sm:p-6">
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body p-[1.5rem]">
          <h2 className="card-title text-xl sm:text-2xl text-primary mb-4">
            Notification Settings Management
          </h2>
          <p className="text-base-content/70 mb-4 sm:mb-6 text-sm sm:text-base">
            Manage notification preferences for all users in your{" "}
            {authUser.role === "super_admin" ? "organization" : "shop"}.
          </p>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className={`card bg-base-100 shadow-md ${
                  !user.isActive ? "opacity-60" : ""
                }`}
              >
                <div className="card-body p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div
                        className={`text-sm font-medium ${
                          user.isActive
                            ? "text-base-content"
                            : "text-base-content/50"
                        }`}
                      >
                        {user.fullName}
                        {!user.isActive && " (Inactive)"}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <div
                          className={`badge badge-sm ${
                            user.role === "super_admin"
                              ? "badge-secondary"
                              : user.role === "admin"
                              ? "badge-primary"
                              : user.role === "warehouseman"
                              ? "badge-accent"
                              : "badge-neutral"
                          }`}
                        >
                          {user.role}
                        </div>
                        {authUser.role === "super_admin" && (
                          <div className="badge badge-neutral badge-outline badge-sm">
                            {user.shopName || "No Shop"}
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className={`badge ${
                        user.isActive ? "badge-success" : "badge-error"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between pt-2 border-t border-base-300">
                      <label className="label-text text-sm">
                        Item Ready Notifications
                      </label>
                      <div className="flex items-center gap-2">
                        {updating[user._id] && (
                          <span className="loading loading-spinner loading-xs text-primary"></span>
                        )}
                        <input
                          type="checkbox"
                          className="toggle toggle-primary toggle-sm"
                          checked={
                            user.notificationPreferences?.itemReady !== false
                          }
                          onChange={(e) =>
                            handlePreferenceChange(
                              user._id,
                              "itemReady",
                              e.target.checked
                            )
                          }
                          disabled={
                            updating[user._id] ||
                            !user.isActive ||
                            (user.role === "warehouse" &&
                              authUser?.role !== "super_admin")
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th className="text-base-content/70">User</th>
                  <th className="text-base-content/70">Role</th>
                  {authUser.role === "super_admin" && (
                    <th className="text-base-content/70">Shop</th>
                  )}
                  <th className="text-center text-base-content/70">
                    Item Ready Notifications
                  </th>
                  <th className="text-center text-base-content/70">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover">
                    <td>
                      <div className="text-sm font-medium text-base-content">
                        {user.fullName}
                      </div>
                    </td>
                    <td>
                      <div
                        className={`badge badge-sm ${
                          user.role === "super_admin"
                            ? "badge-secondary"
                            : user.role === "admin"
                            ? "badge-primary"
                            : user.role === "warehouseman"
                            ? "badge-accent"
                            : "badge-neutral"
                        }`}
                      >
                        {user.role}
                      </div>
                    </td>
                    {authUser.role === "super_admin" && (
                      <td className="text-sm text-base-content/70">
                        {user.shopName || "No Shop"}
                      </td>
                    )}
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm"
                        checked={
                          user.notificationPreferences?.itemReady !== false
                        }
                        onChange={(e) =>
                          handlePreferenceChange(
                            user._id,
                            "itemReady",
                            e.target.checked
                          )
                        }
                        disabled={
                          updating[user._id] ||
                          !user.isActive ||
                          (user.role === "warehouse" &&
                            authUser?.role !== "super_admin")
                        }
                      />
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className={`badge ${
                            user.isActive ? "badge-success" : "badge-error"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </div>
                        {updating[user._id] && (
                          <span className="loading loading-spinner loading-xs text-primary"></span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-base-content/50 text-sm sm:text-base">
                No users found.
              </p>
            </div>
          )}

          <div className="mt-4 sm:mt-6">
            <div className="card bg-base-300 shadow-md">
              <div className="card-body p-4">
                <h3 className="card-title text-base sm:text-lg text-primary mb-3">
                  Settings Guide
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-base-content/70">
                  <div className="space-y-1">
                    <strong className="text-primary block">
                      Item Ready Notifications:
                    </strong>
                    <p>
                      Enable/disable all item ready notifications for the user
                    </p>
                  </div>
                  <div className="space-y-1">
                    <strong className="text-accent block">
                      Push Notifications:
                    </strong>
                    <p>
                      Mobile/browser push notifications when app is in
                      background
                    </p>
                  </div>
                  <div className="space-y-1">
                    <strong className="text-warning block">
                      Browser Notifications:
                    </strong>
                    <p>Browser popup notifications</p>
                  </div>
                  <div className="space-y-1">
                    <strong className="text-secondary block">
                      Toast Notifications:
                    </strong>
                    <p>In-app toast notifications</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
