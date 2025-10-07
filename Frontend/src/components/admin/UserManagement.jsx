import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const UserManagement = () => {
  const { authUser } = useAuthContext();

  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]); // Add shops state for super admin
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInactive, setShowInactive] = useState(false); // New state for showing inactive users
  const [selectedShopFilter, setSelectedShopFilter] = useState(""); // New state for shop filter
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalUsers: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10,
  });
  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
    password: "",
    confirmPassword: "",
    role: "employee",
    shopId: "", // Add shopId field for super admin
    permissions: ["send_messages"], // Will be updated based on role
    isActive: true,
  });

  // Separate fetchUsers function that can be called from other functions
  const fetchUsers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);

        // Build query parameters
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        });

        if (showInactive) {
          params.append("includeInactive", "true");
        }

        if (selectedShopFilter) {
          params.append("shopId", selectedShopFilter);
        }

        const url = `/api/users/admin?${params.toString()}`;

        const res = await fetch(url, {
          credentials: "include",
        });

        const data = await res.json();

        if (res.ok) {
          setUsers(data.users || data); // Handle both old and new response formats
          if (data.pagination) {
            setPagination(data.pagination);
          }
        } else {
          throw new Error(data.error || "Failed to fetch users");
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    },
    [showInactive, selectedShopFilter, pagination.limit] // Added pagination.limit back
  );

  // Fetch users on component mount and when filters change
  useEffect(() => {
    fetchUsers(1); // Always start from page 1 when filters change
  }, [fetchUsers]);

  // Fetch shops for super admin
  const fetchShops = useCallback(async () => {
    if (authUser.role !== "super_admin") return;

    try {
      const res = await fetch("/api/shops", {
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setShops(data);
      } else {
        throw new Error(data.error || "Failed to fetch shops");
      }
    } catch (error) {
      toast.error(error.message);
      console.error("Error fetching shops:", error);
    }
  }, [authUser.role]);

  // Fetch shops when component mounts (for super admin)
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Define role-based permissions (same as backend)
  const getRolePermissions = (role) => {
    const rolePermissions = {
      employee: ["send_messages"],
      warehouseman: [
        "receive_messages",
        "update_status",
        "view_employees",
        "send_messages",
      ],
      admin: ["send_messages", "admin_panel", "manage_users", "view_all_users"],
      super_admin: [
        "send_messages",
        "admin_panel",
        "manage_users",
        "view_all_users",
        "manage_shops",
        "view_cross_shop",
      ],
    };

    return rolePermissions[role] || ["send_messages"];
  };

  // Initialize form data with correct permissions when component mounts
  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      permissions: getRolePermissions(prevData.role),
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.fullName ||
      !formData.userName ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      const res = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("User created successfully!");
        const defaultRole = "employee";
        setFormData({
          fullName: "",
          userName: "",
          password: "",
          confirmPassword: "",
          role: defaultRole,
          shopId: "", // Reset shopId field
          permissions: getRolePermissions(defaultRole),
          isActive: true,
        });
        setShowCreateForm(false);
        fetchUsers(pagination.currentPage); // Refresh user list
      } else {
        throw new Error(data.error || "Failed to create user");
      }
    } catch (error) {
      toast.error(error.message);
      console.error("Error creating user:", error);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (
      !window.confirm(`Are you sure you want to delete user "${userName}"?`)
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("User deleted successfully!");
        fetchUsers(pagination.currentPage); // Refresh user list
      } else {
        throw new Error(data.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error(error.message);
      console.error("Error deleting user:", error);
    }
  };

  const handleShopReassignment = async (userId, userName, newShopId) => {
    if (!newShopId) {
      toast.error("Please select a shop");
      return;
    }

    const selectedShop = shops.find((shop) => shop._id === newShopId);
    if (
      !window.confirm(
        `Are you sure you want to reassign "${userName}" to "${selectedShop?.name}"?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}/reassign-shop`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ shopId: newShopId }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`User reassigned to ${selectedShop?.name} successfully!`);
        fetchUsers(pagination.currentPage); // Refresh user list
      } else {
        throw new Error(data.error || "Failed to reassign user");
      }
    } catch (error) {
      toast.error(error.message);
      console.error("Error reassigning user:", error);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          `User ${!currentStatus ? "activated" : "deactivated"} successfully!`
        );
        fetchUsers(pagination.currentPage); // Refresh user list
      } else {
        throw new Error(data.error || "Failed to update user");
      }
    } catch (error) {
      toast.error(error.message);
      console.error("Error updating user:", error);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (newRole === "super_admin" && authUser.role !== "super_admin") {
      toast.error("Only super admins can create super admin users");
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("User role updated successfully!");
        fetchUsers(pagination.currentPage); // Refresh user list
      } else {
        throw new Error(data.error || "Failed to update user role");
      }
    } catch (error) {
      toast.error(error.message);
      console.error("Error updating user role:", error);
    }
  };

  // Handle page size change
  const handlePageSizeChange = useCallback((newLimit) => {
    setPagination((prev) => ({
      ...prev,
      limit: newLimit,
      currentPage: 1,
    }));
    // Don't call fetchUsers here, let useEffect handle it
  }, []);

  const availableRoles =
    authUser.role === "super_admin"
      ? ["employee", "warehouseman", "admin", "super_admin"]
      : ["employee", "warehouseman"];

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header with Create Button and Show Inactive Toggle */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-primary">
          User Management
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Shop filter - Only for Super Admin */}
          {authUser.role === "super_admin" && (
            <select
              value={selectedShopFilter}
              onChange={(e) => setSelectedShopFilter(e.target.value)}
              className="select select-bordered select-sm bg-base-200 text-base-content w-full max-w-[10rem]"
            >
              <option value="">All shops</option>
              {shops.map((shop) => (
                <option key={shop._id} value={shop._id}>
                  {shop.name} ({shop.code})
                </option>
              ))}
            </select>
          )}

          {/* Toggle for showing inactive users */}
          <label className="label cursor-pointer gap-2">
            <span className="label-text text-sm">Show inactive users</span>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="toggle toggle-primary toggle-sm"
            />
          </label>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary btn-sm sm:btn-md"
          >
            {showCreateForm ? "Cancel" : "Create New User"}
          </button>
        </div>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-lg sm:text-xl text-primary mb-4">
              Create New Employee
            </h3>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Full Name *</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Username *</span>
                </label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) =>
                    setFormData({ ...formData, userName: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password *</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="Enter password"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Confirm Password *</span>
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="input input-bordered w-full"
                  placeholder="Confirm password"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Role</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    const newPermissions = getRolePermissions(newRole);
                    setFormData({
                      ...formData,
                      role: newRole,
                      permissions: newPermissions,
                    });
                  }}
                  className="select select-bordered w-full"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() +
                        role.slice(1).replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              {/* Shop Selection - Only for Super Admin */}
              {authUser.role === "super_admin" && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Shop Assignment</span>
                  </label>
                  <select
                    value={formData.shopId}
                    onChange={(e) =>
                      setFormData({ ...formData, shopId: e.target.value })
                    }
                    className="select select-bordered w-full"
                    required
                  >
                    <option value="">Select a shop...</option>
                    {shops.map((shop) => (
                      <option key={shop._id} value={shop._id}>
                        {shop.name} ({shop.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-ghost order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary order-1 sm:order-2"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-lg sm:text-xl text-primary mb-4">
            All Users
          </h3>

          {loading ? (
            <>
              {/* Desktop skeleton */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      {authUser.role === "super_admin" && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Shop
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {/* Skeleton rows */}
                    {[...Array(5)].map((_, index) => (
                      <tr key={index} className="animate-pulse">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded w-20"></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-6 bg-gray-700 rounded w-20"></div>
                        </td>
                        {authUser.role === "super_admin" && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="h-4 bg-gray-700 rounded w-24 mb-1"></div>
                              <div className="h-3 bg-gray-700 rounded w-16"></div>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-6 bg-gray-700 rounded-full w-16"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="h-4 bg-gray-700 rounded w-12 ml-auto"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile skeleton */}
              <div className="sm:hidden space-y-4 p-4">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-gray-700 rounded-lg p-4 animate-pulse"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-600 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-600 rounded w-20"></div>
                      </div>
                      <div className="h-6 bg-gray-600 rounded-full w-16"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-600 rounded w-20"></div>
                      <div className="h-3 bg-gray-600 rounded w-40"></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      {authUser.role === "super_admin" && <th>Shop</th>}
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user._id}
                        className={`hover ${
                          !user.isActive ? "opacity-60" : ""
                        }`}
                      >
                        <td>
                          <div>
                            <div
                              className={`font-semibold ${
                                user.isActive
                                  ? "text-base-content"
                                  : "opacity-60"
                              }`}
                            >
                              {user.fullName}
                              {!user.isActive}
                            </div>
                            <div className="text-sm opacity-70">
                              @{user.userName}
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user._id, e.target.value)
                            }
                            className="select select-bordered select-xs w-full max-w-xs"
                            disabled={
                              user._id === authUser._id ||
                              (user.role === "warehouse" &&
                                authUser?.role !== "super_admin")
                            }
                          >
                            {availableRoles.map((role) => (
                              <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() +
                                  role.slice(1).replace("_", " ")}
                              </option>
                            ))}
                          </select>
                        </td>
                        {authUser.role === "super_admin" && (
                          <td>
                            <div className="text-sm">
                              {user.shopId?.name || "No shop assigned"}
                            </div>
                            <div className="text-xs opacity-70">
                              {user.shopId?.code || "N/A"}
                            </div>
                          </td>
                        )}
                        <td>
                          <button
                            onClick={() =>
                              handleToggleActive(user._id, user.isActive)
                            }
                            disabled={
                              user._id === authUser._id ||
                              (user.role === "warehouse" &&
                                authUser?.role !== "super_admin")
                            }
                            className={`badge badge-sm ${
                              user.isActive ? "badge-success" : "badge-error"
                            } ${
                              user._id === authUser._id ||
                              (user.role === "warehouse" &&
                                authUser?.role !== "super_admin")
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer hover:opacity-80"
                            }`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            {/* Shop Reassignment - Only for Super Admin */}
                            {authUser.role === "super_admin" && (
                              <select
                                className="select select-bordered select-xs w-32"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleShopReassignment(
                                      user._id,
                                      user.userName,
                                      e.target.value
                                    );
                                    e.target.value = ""; // Reset selection
                                  }
                                }}
                              >
                                <option value="">Reassign to...</option>
                                {shops
                                  .filter(
                                    (shop) => shop._id !== user.shopId?._id
                                  ) // Don't show current shop
                                  .map((shop) => (
                                    <option key={shop._id} value={shop._id}>
                                      {shop.name} ({shop.code})
                                    </option>
                                  ))}
                              </select>
                            )}

                            {user._id !== authUser._id &&
                              (user.role !== "warehouse" ||
                                authUser?.role === "super_admin") && (
                                <button
                                  onClick={() =>
                                    handleDeleteUser(user._id, user.userName)
                                  }
                                  className="btn btn-error btn-xs"
                                >
                                  Delete
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              {/* Mobile Card Layout */}
              <div className="sm:hidden space-y-4">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className={`card bg-base-200 ${
                      !user.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div
                            className={`font-semibold ${
                              user.isActive ? "text-base-content" : "opacity-70"
                            }`}
                          >
                            {user.fullName}
                            {!user.isActive && " (Inactive)"}
                          </div>
                          <div className="text-sm opacity-70">
                            @{user.userName}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleToggleActive(user._id, user.isActive)
                          }
                          disabled={
                            user._id === authUser._id ||
                            (user.role === "warehouse" &&
                              authUser?.role !== "super_admin")
                          }
                          className={`badge badge-sm ${
                            user.isActive ? "badge-success" : "badge-error"
                          } ${
                            user._id === authUser._id ||
                            (user.role === "warehouse" &&
                              authUser?.role !== "super_admin")
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer hover:opacity-80"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="label-text text-sm opacity-70">
                            Role:
                          </label>
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user._id, e.target.value)
                            }
                            className="select select-bordered select-xs"
                            disabled={
                              user._id === authUser._id ||
                              (user.role === "warehouse" &&
                                authUser?.role !== "super_admin")
                            }
                          >
                            {availableRoles.map((role) => (
                              <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() +
                                  role.slice(1).replace("_", " ")}
                              </option>
                            ))}
                          </select>
                        </div>

                        {authUser.role === "super_admin" && (
                          <div>
                            <label className="label-text text-sm opacity-70 block mb-1">
                              Shop:
                            </label>
                            <div className="text-sm">
                              {user.shopId?.name || "No shop assigned"}{" "}
                              <span className="text-xs opacity-70">
                                ({user.shopId?.code || "N/A"})
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-base-300">
                          {authUser.role === "super_admin" && (
                            <div>
                              <label className="label-text text-sm opacity-70 block mb-1">
                                Reassign to Shop:
                              </label>
                              <select
                                className="select select-bordered select-sm w-full"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleShopReassignment(
                                      user._id,
                                      user.userName,
                                      e.target.value
                                    );
                                    e.target.value = "";
                                  }
                                }}
                              >
                                <option value="">Select shop...</option>
                                {shops
                                  .filter(
                                    (shop) => shop._id !== user.shopId?._id
                                  )
                                  .map((shop) => (
                                    <option key={shop._id} value={shop._id}>
                                      {shop.name} ({shop.code})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}

                          {user._id !== authUser._id &&
                            (user.role !== "warehouse" ||
                              authUser?.role === "super_admin") && (
                              <button
                                onClick={() =>
                                  handleDeleteUser(user._id, user.userName)
                                }
                                className="btn btn-error btn-sm"
                              >
                                Delete User
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="card bg-base-100 shadow-xl mt-4">
        <div className="card-body">
          {!loading && pagination.totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-700">
              <div className="flex-1 flex justify-between sm:hidden">
                {/* Mobile pagination */}
                <button
                  onClick={() => fetchUsers(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md ${
                    pagination.hasPrevPage
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchUsers(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md ${
                    pagination.hasNextPage
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {/* Page size selector */}
                  <div className="flex items-center gap-2 text-white text-sm">
                    <label htmlFor="pageSize">Page size</label>
                    <select
                      id="pageSize"
                      value={pagination.limit}
                      onChange={(e) => {
                        const newLimit = parseInt(e.target.value);
                        handlePageSizeChange(newLimit);
                      }}
                      className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <p className="text-sm text-gray-400">
                    Page{" "}
                    <span className="font-medium">
                      {pagination.currentPage}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{pagination.totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {/* Previous button */}
                    <button
                      onClick={() => fetchUsers(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 text-sm font-medium ${
                        pagination.hasPrevPage
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-800 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <span className="sr-only">Previous</span>←
                    </button>

                    {/* Page numbers */}
                    {(() => {
                      const pages = [];
                      const showPages = 5;
                      let startPage = Math.max(
                        1,
                        pagination.currentPage - Math.floor(showPages / 2)
                      );
                      let endPage = Math.min(
                        pagination.totalPages,
                        startPage + showPages - 1
                      );

                      if (endPage - startPage < showPages - 1) {
                        startPage = Math.max(1, endPage - showPages + 1);
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => fetchUsers(i)}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium ${
                              i === pagination.currentPage
                                ? "z-10 bg-blue-600 border-blue-500 text-white"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      return pages;
                    })()}

                    {/* Next button */}
                    <button
                      onClick={() => fetchUsers(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 text-sm font-medium ${
                        pagination.hasNextPage
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-800 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <span className="sr-only">Next</span>→
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
