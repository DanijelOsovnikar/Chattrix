import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";

// Get all warehouses that can be assigned to shops
export const getAvailableWarehouses = async (req, res) => {
  try {
    // Only super admins can manage warehouse assignments
    if (req.user.role !== "super_admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Super admin only." });
    }

    const warehouses = await Shop.find({ isActive: true })
      .select("_id name code address")
      .sort({ name: 1 });

    res.status(200).json(warehouses);
  } catch (error) {
    console.error("Error fetching available warehouses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Assign warehouses to a shop
export const assignWarehousesToShop = async (req, res) => {
  try {
    // Only super admins can manage warehouse assignments
    if (req.user.role !== "super_admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Super admin only." });
    }

    const { shopId } = req.params;
    const { warehouseIds } = req.body;

    if (!shopId || !Array.isArray(warehouseIds)) {
      return res.status(400).json({
        error: "Shop ID and warehouse IDs array are required",
      });
    }

    // Verify the shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    // Verify all warehouse IDs exist
    const warehouses = await Shop.find({
      _id: { $in: warehouseIds },
      isActive: true,
    });

    if (warehouses.length !== warehouseIds.length) {
      return res.status(400).json({
        error: "One or more warehouse IDs are invalid",
      });
    }

    // Update the shop's assigned warehouses
    shop.assignedWarehouses = warehouseIds;
    await shop.save();

    // Return updated shop with populated warehouse info
    const updatedShop = await Shop.findById(shopId)
      .populate("assignedWarehouses", "name code address")
      .select("name code assignedWarehouses");

    res.status(200).json({
      message: "Warehouses assigned successfully",
      shop: updatedShop,
    });
  } catch (error) {
    console.error("Error assigning warehouses to shop:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get shop with its assigned warehouses
export const getShopWithWarehouses = async (req, res) => {
  try {
    // Only super admins can view warehouse assignments
    if (req.user.role !== "super_admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Super admin only." });
    }

    const { shopId } = req.params;

    const shop = await Shop.findById(shopId)
      .populate("assignedWarehouses", "name code address")
      .select("name code address assignedWarehouses settings");

    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    res.status(200).json(shop);
  } catch (error) {
    console.error("Error fetching shop with warehouses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all shops with their assigned warehouses (for management overview)
export const getAllShopsWithWarehouses = async (req, res) => {
  try {
    // Only super admins can view all warehouse assignments
    if (req.user.role !== "super_admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Super admin only." });
    }

    const shops = await Shop.find({ isActive: true })
      .populate("assignedWarehouses", "name code address")
      .select("name code address assignedWarehouses settings")
      .sort({ name: 1 });

    res.status(200).json(shops);
  } catch (error) {
    console.error("Error fetching all shops with warehouses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get warehouses available for a specific shop to communicate with
export const getAssignedWarehousesForShop = async (req, res) => {
  try {
    const userShopId = req.user.shopId;

    if (!userShopId) {
      return res.status(400).json({ error: "User not assigned to any shop" });
    }

    const shop = await Shop.findById(userShopId)
      .populate("assignedWarehouses", "name code address")
      .select("assignedWarehouses");

    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    res.status(200).json(shop.assignedWarehouses || []);
  } catch (error) {
    console.error("Error fetching assigned warehouses for shop:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
