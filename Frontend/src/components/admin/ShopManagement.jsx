import { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ShopManagement = () => {
  const { authUser } = useAuthContext();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    address: "",
    contactInfo: {
      phone: "",
      email: "",
    },
    settings: {
      allowCrossShopCommunication: false,
      maxUsers: 100,
      timezone: "Europe/Belgrade",
    },
    isActive: true,
  });

  useEffect(() => {
    if (authUser.role === "super_admin") {
      fetchShops();
    }
  }, [authUser.role]);

  const fetchShops = async () => {
    try {
      setLoading(true);
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
      console.error("Error fetching shops:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      address: "",
      contactInfo: {
        phone: "",
        email: "",
      },
      settings: {
        allowCrossShopCommunication: false,
        maxUsers: 100,
        timezone: "Europe/Belgrade",
      },
      isActive: true,
    });
    setShowCreateForm(false);
    setEditingShop(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingShop ? `/api/shops/${editingShop._id}` : "/api/shops";
      const method = editingShop ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          `Shop ${editingShop ? "updated" : "created"} successfully!`
        );
        resetForm();
        fetchShops();
      } else {
        throw new Error(
          data.error || `Failed to ${editingShop ? "update" : "create"} shop`
        );
      }
    } catch (error) {
      toast.error(error.message);
      console.error("Error:", error);
    }
  };

  const handleEditShop = (shop) => {
    setFormData({
      name: shop.name,
      code: shop.code,
      description: shop.description || "",
      address: shop.address || "",
      contactInfo: {
        phone: shop.contactInfo?.phone || "",
        email: shop.contactInfo?.email || "",
      },
      settings: {
        allowCrossShopCommunication:
          shop.settings?.allowCrossShopCommunication || false,
        maxUsers: shop.settings?.maxUsers || 100,
        timezone: shop.settings?.timezone || "Europe/Belgrade",
      },
      isActive: shop.isActive,
    });
    setEditingShop(shop);
    setShowCreateForm(true);
  };

  const handleDeleteShop = async (shop) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${shop.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/shops/${shop._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Shop deleted successfully!");
        fetchShops(); // Refresh the list
      } else {
        throw new Error(data.error || "Failed to delete shop");
      }
    } catch (error) {
      toast.error(error.message);
      console.error("Error deleting shop:", error);
    }
  };

  // Only super_admin can access this component
  if (authUser.role !== "super_admin") {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-primary">
          Shop Management
        </h2>
        <button
          onClick={() => {
            if (showCreateForm || editingShop) {
              resetForm();
            } else {
              setShowCreateForm(true);
            }
          }}
          className="btn btn-primary btn-sm sm:btn-md"
        >
          {showCreateForm || editingShop ? "Cancel" : "Create New Shop"}
        </button>
      </div>

      {/* Create/Edit Shop Form */}
      {showCreateForm && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body p-[1.5rem]">
            <h3 className="card-title text-lg sm:text-xl text-primary mb-4">
              {editingShop ? "Edit Shop" : "Create New Shop"}
            </h3>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Shop Name *</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="Enter shop name"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Shop Code *</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  disabled={editingShop}
                  className={`input input-bordered w-full ${
                    editingShop ? "input-disabled" : ""
                  }`}
                  placeholder="Enter unique shop code"
                  required
                />
                {editingShop && (
                  <label className="label">
                    <span className="label-text-alt opacity-70">
                      Shop code cannot be changed after creation
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="textarea textarea-bordered w-full"
                  placeholder="Enter shop description"
                  rows={2}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Address</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="Enter shop address"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Phone</span>
                </label>
                <input
                  type="tel"
                  value={formData.contactInfo.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: {
                        ...formData.contactInfo,
                        phone: e.target.value,
                      },
                    })
                  }
                  className="input input-bordered w-full"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: {
                        ...formData.contactInfo,
                        email: e.target.value,
                      },
                    })
                  }
                  className="input input-bordered w-full"
                  placeholder="Enter email address"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Max Users</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.settings.maxUsers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        maxUsers: parseInt(e.target.value) || 100,
                      },
                    })
                  }
                  className="input input-bordered w-full"
                  placeholder="Maximum number of users"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Timezone</span>
                </label>
                <select
                  value={formData.settings.timezone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        timezone: e.target.value,
                      },
                    })
                  }
                  className="select select-bordered w-full"
                >
                  <option value="Europe/Belgrade">Europe/Belgrade</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">
                    America/Los_Angeles
                  </option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Australia/Sydney">Australia/Sydney</option>
                </select>
              </div>

              <div className="form-control sm:col-span-2">
                <label className="label">
                  <span className="label-text">Settings</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">
                        Cross-shop Communication
                      </span>
                      <input
                        type="checkbox"
                        checked={formData.settings.allowCrossShopCommunication}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            settings: {
                              ...formData.settings,
                              allowCrossShopCommunication: e.target.checked,
                            },
                          })
                        }
                        className="toggle toggle-primary"
                      />
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">Shop Active</span>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                        className="toggle toggle-primary"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="btn btn-ghost order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary order-1 sm:order-2"
                >
                  {editingShop ? "Update Shop" : "Create Shop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shops List */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-0">
          <h3 className="card-title text-lg sm:text-xl text-primary mb-4">
            All Shops
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg opacity-70">No shops found</p>
              <p className="text-sm opacity-50 mt-1">
                Create your first shop using the form above
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {shops.map((shop) => (
                  <div
                    key={shop._id}
                    className={`card bg-base-200 shadow-md ${
                      !shop.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-base-content">
                            {shop.name}
                            {!shop.isActive && " (Inactive)"}
                          </div>
                          <div className="text-sm opacity-70 mb-2">
                            Code: {shop.code}
                          </div>
                          {shop.description && (
                            <div className="text-sm opacity-60 mb-2">
                              {shop.description}
                            </div>
                          )}
                        </div>
                        <div className="dropdown dropdown-end">
                          <label tabIndex={0} className="btn btn-ghost btn-xs">
                            <span className="text-lg">⋮</span>
                          </label>
                          <ul
                            tabIndex={0}
                            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                          >
                            <li>
                              <button
                                onClick={() => handleEditShop(shop)}
                                className="text-primary"
                              >
                                Edit Shop
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => handleDeleteShop(shop)}
                                className="text-error"
                              >
                                Delete Shop
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span
                          className={`badge badge-sm ${
                            shop.isActive ? "badge-success" : "badge-error"
                          }`}
                        >
                          {shop.isActive ? "Active" : "Inactive"}
                        </span>
                        {shop.settings?.allowCrossShopCommunication && (
                          <span className="badge badge-info badge-sm">
                            Cross-shop
                          </span>
                        )}
                        <span className="badge badge-neutral badge-outline badge-sm">
                          {shop.settings?.timezone || "UTC"}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="opacity-70">Users:</span>
                          <span>
                            {shop.userCount || 0} /{" "}
                            {shop.settings?.maxUsers || 100}
                          </span>
                        </div>
                        {shop.address && (
                          <div className="flex justify-between">
                            <span className="opacity-70">Address:</span>
                            <span className="text-right">{shop.address}</span>
                          </div>
                        )}
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
                      <th>Shop Name</th>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Users</th>
                      <th>Settings</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shops.map((shop) => (
                      <tr
                        key={shop._id}
                        className={!shop.isActive ? "opacity-60" : ""}
                      >
                        <td>
                          <div>
                            <div className="font-semibold">{shop.name}</div>
                            {shop.description && (
                              <div className="text-sm opacity-70">
                                {shop.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-outline badge-sm">
                            {shop.code}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge badge-sm ${
                              shop.isActive ? "badge-success" : "badge-error"
                            }`}
                          >
                            {shop.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm">
                            {shop.userCount || 0} /{" "}
                            {shop.settings?.maxUsers || 100}
                          </span>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {shop.settings?.allowCrossShopCommunication && (
                              <span className="badge badge-info badge-xs">
                                Cross-shop
                              </span>
                            )}
                            <span className="badge badge-neutral badge-outline badge-xs">
                              {shop.settings?.timezone || "UTC"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditShop(shop)}
                              className="btn btn-primary btn-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteShop(shop)}
                              className="btn btn-error btn-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopManagement;
