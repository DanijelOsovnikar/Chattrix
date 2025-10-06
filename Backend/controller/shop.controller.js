import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const createShop = async (req, res) => {
  try {
    // Only super_admin can create shops
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const { name, code, address, contactInfo, settings } = req.body;

    // Check if shop with same code already exists
    const existingShop = await Shop.findOne({
      $or: [{ code: code.toUpperCase() }, { name }],
    });

    if (existingShop) {
      return res
        .status(400)
        .json({ error: "Shop with this code or name already exists" });
    }

    // Create the shop first
    const newShop = new Shop({
      name,
      code: code.toUpperCase(),
      address,
      contactInfo,
      settings,
    });

    const savedShop = await newShop.save();

    // Automatically create an admin user for the shop
    let adminUserName = `manager_${code.toLowerCase()}`;
    const adminPassword = "admin123";

    // Check if username already exists
    const existingUser = await User.findOne({ userName: adminUserName });
    if (existingUser) {
      // If username exists, append shop ID to make it unique
      adminUserName = `manager_${code.toLowerCase()}_${savedShop._id
        .toString()
        .slice(-4)}`;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const adminUser = new User({
      fullName: `${name} Manager`,
      userName: adminUserName,
      password: hashedPassword,
      shopId: savedShop._id,
      role: "admin",
      permissions: [
        "view_all_users",
        "manage_users",
        "send_messages",
        "receive_messages",
        "update_status",
        "view_employees",
        "admin_panel",
      ],
      isActive: true,
    });

    try {
      await adminUser.save();

      // Also create a warehouse user for the shop
      let warehouseUserName = `warehouse_${code.toLowerCase()}`;
      const warehousePassword = "warehouse123";

      // Check if username already exists
      const existingWarehouseUser = await User.findOne({
        userName: warehouseUserName,
      });
      if (existingWarehouseUser) {
        // If username exists, append shop ID to make it unique
        warehouseUserName = `warehouse_${code.toLowerCase()}_${savedShop._id
          .toString()
          .slice(-4)}`;
      }

      // Hash the warehouse password
      const warehouseHashedPassword = await bcrypt.hash(
        warehousePassword,
        salt
      );

      // Create warehouse user
      const warehouseUser = new User({
        fullName: `${name} Warehouse`,
        userName: warehouseUserName,
        password: warehouseHashedPassword,
        shopId: savedShop._id,
        role: "warehouse",
        permissions: ["send_messages", "receive_messages"],
        isActive: true,
      });

      await warehouseUser.save();

      res.status(201).json({
        message: "Shop created successfully with admin and warehouse users",
        shop: savedShop,
        adminUser: {
          fullName: adminUser.fullName,
          userName: adminUser.userName,
          role: adminUser.role,
          defaultPassword: adminPassword,
        },
        warehouseUser: {
          fullName: warehouseUser.fullName,
          userName: warehouseUser.userName,
          role: warehouseUser.role,
          defaultPassword: warehousePassword,
        },
      });
    } catch (userError) {
      // If admin or warehouse user creation fails, delete the shop to maintain consistency
      await Shop.findByIdAndDelete(savedShop._id);
      console.error(
        "Error creating users for shop, shop rolled back:",
        userError
      );
      return res.status(500).json({
        error: "Failed to create users for shop. Shop creation cancelled.",
      });
    }
  } catch (error) {
    console.error("Error in createShop controller", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getShops = async (req, res) => {
  try {
    let query = {};

    // Regular users can only see their own shop
    if (req.user.role !== "super_admin") {
      query._id = req.user.shopId;
    }

    const shops = await Shop.find(query)
      .populate("adminUsers", "fullName userName role")
      .select("-__v");

    // Add user count for each shop
    const shopsWithUserCount = await Promise.all(
      shops.map(async (shop) => {
        const userCount = await User.countDocuments({ shopId: shop._id });
        return {
          ...shop.toObject(),
          userCount,
        };
      })
    );

    res.status(200).json(shopsWithUserCount);
  } catch (error) {
    console.error("Error in getShops controller", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getShopById = async (req, res) => {
  try {
    const { shopId } = req.params;

    // Users can only view their own shop unless they're super_admin
    if (
      req.user.role !== "super_admin" &&
      req.user.shopId.toString() !== shopId
    ) {
      return res.status(403).json({ error: "Access denied to this shop" });
    }

    const shop = await Shop.findById(shopId)
      .populate("adminUsers", "fullName userName role")
      .select("-__v");

    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    res.status(200).json(shop);
  } catch (error) {
    console.error("Error in getShopById controller", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    const updates = req.body;

    // Only super_admin or shop admin can update shop
    const canUpdate =
      req.user.role === "super_admin" ||
      (req.user.role === "admin" && req.user.shopId.toString() === shopId);

    if (!canUpdate) {
      return res
        .status(403)
        .json({ error: "Insufficient permissions to update this shop" });
    }

    const shop = await Shop.findByIdAndUpdate(shopId, updates, {
      new: true,
      runValidators: true,
    }).populate("adminUsers", "fullName userName role");

    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    res.status(200).json({
      message: "Shop updated successfully",
      shop,
    });
  } catch (error) {
    console.error("Error in updateShop controller", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteShop = async (req, res) => {
  try {
    const { shopId } = req.params;

    // Only super_admin can delete shops
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    // Check if shop has users
    const userCount = await User.countDocuments({ shopId });
    if (userCount > 0) {
      return res.status(400).json({
        error:
          "Cannot delete shop with existing users. Please transfer or delete users first.",
      });
    }

    const shop = await Shop.findByIdAndDelete(shopId);

    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    res.status(200).json({ message: "Shop deleted successfully" });
  } catch (error) {
    console.error("Error in deleteShop controller", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getShopStats = async (req, res) => {
  try {
    const { shopId } = req.params;

    // Users can only view their own shop stats unless they're super_admin
    if (
      req.user.role !== "super_admin" &&
      req.user.shopId.toString() !== shopId
    ) {
      return res.status(403).json({ error: "Access denied to this shop" });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    // Get user count and breakdown by role
    const userStats = await User.aggregate([
      { $match: { shopId: shop._id } },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalUsers = await User.countDocuments({ shopId: shop._id });

    res.status(200).json({
      shop: {
        name: shop.name,
        code: shop.code,
      },
      stats: {
        totalUsers,
        usersByRole: userStats,
      },
    });
  } catch (error) {
    console.error("Error in getShopStats controller", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
