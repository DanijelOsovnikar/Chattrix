import { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { BsBuilding, BsGear, BsCheck, BsX } from "react-icons/bs";

const WarehouseManagement = () => {
  const { authUser } = useAuthContext();
  const [shops, setShops] = useState([]);
  const [availableWarehouses, setAvailableWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedWarehouses, setSelectedWarehouses] = useState([]);

  // Fetch all shops with their assigned warehouses
  const fetchShopsWithWarehouses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/warehouses/shops", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch shops");
      }

      const data = await response.json();
      setShops(data);
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast.error("Failed to fetch shops");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all available warehouses
  const fetchAvailableWarehouses = async () => {
    try {
      const response = await fetch("/api/warehouses/available", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch warehouses");
      }

      const data = await response.json();
      setAvailableWarehouses(data);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      toast.error("Failed to fetch available warehouses");
    }
  };

  // Assign warehouses to a shop
  const assignWarehouses = async (shopId, warehouseIds) => {
    try {
      setUpdating((prev) => ({ ...prev, [shopId]: true }));

      const response = await fetch(`/api/warehouses/shops/${shopId}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ warehouseIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign warehouses");
      }

      const data = await response.json();
      toast.success(data.message);

      // Refresh the shops list
      await fetchShopsWithWarehouses();

      // Close the modal
      setSelectedShop(null);
      setSelectedWarehouses([]);
    } catch (error) {
      console.error("Error assigning warehouses:", error);
      toast.error("Failed to assign warehouses");
    } finally {
      setUpdating((prev) => ({ ...prev, [shopId]: false }));
    }
  };

  // Handle opening the assignment modal
  const openAssignmentModal = (shop) => {
    setSelectedShop(shop);
    setSelectedWarehouses(shop.assignedWarehouses?.map((w) => w._id) || []);
  };

  // Handle warehouse selection
  const toggleWarehouseSelection = (warehouseId) => {
    setSelectedWarehouses((prev) =>
      prev.includes(warehouseId)
        ? prev.filter((id) => id !== warehouseId)
        : [...prev, warehouseId]
    );
  };

  // Handle saving warehouse assignments
  const handleSaveAssignments = () => {
    if (selectedShop) {
      assignWarehouses(selectedShop._id, selectedWarehouses);
    }
  };

  useEffect(() => {
    fetchShopsWithWarehouses();
    fetchAvailableWarehouses();
  }, []);

  // Check if user is super admin
  if (authUser?.role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <BsBuilding className="text-6xl text-base-content/30 mb-4" />
        <h3 className="text-xl font-semibold text-base-content mb-2">
          Access Denied
        </h3>
        <p className="text-base-content/70">
          Only super administrators can manage warehouse assignments.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <BsBuilding />
            Warehouse Management
          </h2>
          <p className="text-base-content/70 mt-1">
            Assign warehouses to shops for cross-shop communication
          </p>
        </div>
      </div>

      {/* Shops List */}
      <div className="grid gap-4">
        {shops.map((shop) => (
          <div key={shop._id} className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="card-title text-lg">
                    {shop.name} ({shop.code})
                  </h3>
                  <p className="text-base-content/70 text-sm">{shop.address}</p>

                  {/* Assigned Warehouses */}
                  <div className="mt-3">
                    <p className="text-sm font-medium text-base-content/80 mb-2">
                      Assigned Warehouses:
                    </p>
                    {shop.assignedWarehouses?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {shop.assignedWarehouses.map((warehouse) => (
                          <div
                            key={warehouse._id}
                            className="badge badge-primary gap-1"
                          >
                            <BsBuilding className="w-3 h-3" />
                            {warehouse.name} ({warehouse.code})
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base-content/50 text-sm italic">
                        No warehouses assigned
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => openAssignmentModal(shop)}
                  className="btn btn-primary btn-sm"
                  disabled={updating[shop._id]}
                >
                  {updating[shop._id] ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      <BsGear />
                      Manage
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assignment Modal */}
      {selectedShop && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              Assign Warehouses to {selectedShop.name}
            </h3>

            <p className="text-base-content/70 mb-4">
              Select which warehouses {selectedShop.name} can communicate with:
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableWarehouses
                .filter((warehouse) => warehouse._id !== selectedShop._id) // Exclude self
                .map((warehouse) => (
                  <label
                    key={warehouse._id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-base-300 hover:bg-base-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={selectedWarehouses.includes(warehouse._id)}
                      onChange={() => toggleWarehouseSelection(warehouse._id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {warehouse.name} ({warehouse.code})
                      </div>
                      {warehouse.address && (
                        <div className="text-sm text-base-content/70">
                          {warehouse.address}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
            </div>

            <div className="modal-action">
              <button
                onClick={() => {
                  setSelectedShop(null);
                  setSelectedWarehouses([]);
                }}
                className="btn btn-ghost"
              >
                <BsX />
                Cancel
              </button>
              <button
                onClick={handleSaveAssignments}
                className="btn btn-primary"
                disabled={updating[selectedShop._id]}
              >
                {updating[selectedShop._id] ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <BsCheck />
                    Save Assignments
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseManagement;
