import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";

// Middleware to check if user has access to a specific shop
export const requireShopAccess = async (req, res, next) => {
  try {
    const userShopId = req.user.shopId;
    const targetShopId = req.params.shopId || req.body.shopId;

    // Super admins have access to all shops
    if (req.user.role === "super_admin") {
      return next();
    }

    // If no target shop specified, use user's own shop
    if (!targetShopId) {
      req.shopId = userShopId;
      return next();
    }

    // Check if user has access to the target shop
    if (userShopId.toString() !== targetShopId.toString()) {
      return res.status(403).json({ error: "Access denied to this shop" });
    }

    req.shopId = targetShopId;
    next();
  } catch (error) {
    console.error("Error in requireShopAccess middleware", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Middleware to check specific permissions
export const requirePermission = (permission) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    const userRole = req.user.role;

    // Super admins have all permissions
    if (userRole === "super_admin") {
      return next();
    }

    // Check if user has the required permission
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: `Permission '${permission}' required`,
      });
    }

    next();
  };
};

// Middleware to check role-based access
export const requireRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    // Ensure roles is an array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Role '${allowedRoles.join(" or ")}' required`,
      });
    }

    next();
  };
};

// Middleware to validate shop exists and is active
export const validateShop = async (req, res, next) => {
  try {
    const shopId = req.params.shopId || req.body.shopId || req.user.shopId;

    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    if (!shop.isActive) {
      return res.status(403).json({ error: "Shop is not active" });
    }

    req.shop = shop;
    next();
  } catch (error) {
    console.error("Error in validateShop middleware", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Middleware to check if user can manage other users in shop
export const canManageUsers = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.body.userId;
    const requestingUser = req.user;

    // Super admins can manage all users
    if (requestingUser.role === "super_admin") {
      return next();
    }

    // Admins and managers can manage users in their shop
    if (!["admin", "manager"].includes(requestingUser.role)) {
      return res.status(403).json({
        error: "Insufficient role to manage users",
      });
    }

    // If targeting a specific user, ensure they're in the same shop
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);

      if (!targetUser) {
        return res.status(404).json({ error: "Target user not found" });
      }

      if (targetUser.shopId.toString() !== requestingUser.shopId.toString()) {
        return res.status(403).json({
          error: "Can only manage users in your own shop",
        });
      }

      // Prevent regular admins from managing super_admins
      if (
        targetUser.role === "super_admin" &&
        requestingUser.role !== "super_admin"
      ) {
        return res.status(403).json({
          error: "Cannot manage super admin users",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Error in canManageUsers middleware", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Middleware to ensure user belongs to active shop
export const requireActiveShop = async (req, res, next) => {
  try {
    const userShopId = req.user.shopId;

    const shop = await Shop.findById(userShopId);

    if (!shop || !shop.isActive) {
      return res.status(403).json({
        error: "Your shop is not active. Please contact administrator.",
      });
    }

    req.user.shop = shop; // Attach shop info to user
    next();
  } catch (error) {
    console.error("Error in requireActiveShop middleware", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
