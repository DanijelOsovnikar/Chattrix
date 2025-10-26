import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";
import Message from "../models/message.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUser = req.user;
    const userShopId = loggedInUser.shopId;

    let query = {
      _id: { $ne: loggedInUser._id },
      isActive: true,
    };

    // Super admins can see users from all shops
    if (loggedInUser.role === "super_admin") {
      query.shopId = { $exists: true };
    }
    // Shop admins and managers see all users in their shop except themselves
    else if (["admin", "manager"].includes(loggedInUser.role)) {
      query.shopId = userShopId;
      // Optionally exclude super_admins if needed:
      query.role = { $nin: ["super_admin"] };
    }
    // Warehousemen can see only employees and cashiers in their shop (not other warehousemen)
    else if (loggedInUser.role === "warehouseman") {
      query.shopId = userShopId;
      query.role = { $in: ["employee", "cashier", "admin", "manager"] };
    }
    // Employees and cashiers can see only the warehouse user in their shop (not individual warehousemen)
    else if (
      loggedInUser.role === "employee" ||
      loggedInUser.role === "cashier"
    ) {
      query.shopId = userShopId;
      query.role = "warehouse";
    }
    // Default: same shop only
    else {
      query.shopId = userShopId;
    }

    const allUsers = await User.find(query)
      .populate("shopId", "name code")
      .select("-password -pushSubscription -__v")
      .sort({ fullName: 1 });

    // For warehousemen, also include external shops they've received requests from
    let externalShops = [];
    if (loggedInUser.role === "warehouseman") {
      // Find unique external shops that have sent requests to this warehouseman
      const externalRequests = await Message.find({
        receiverId: loggedInUser._id,
        isExternalRequest: true,
        targetWarehouseId: userShopId,
      })
        .populate("senderId", "shopId")
        .populate({
          path: "senderId",
          populate: {
            path: "shopId",
            select: "name code",
          },
        });

      // Extract unique external shops
      const shopMap = new Map();
      externalRequests.forEach((request) => {
        if (request.senderId && request.senderId.shopId) {
          const shop = request.senderId.shopId;
          if (!shopMap.has(shop._id.toString())) {
            shopMap.set(shop._id.toString(), {
              _id: `external_shop_${shop._id}`,
              fullName: shop.name,
              code: shop.code,
              isExternalShop: true,
              externalShopId: shop._id,
              userName: `external_${shop.code}`,
              shopId: shop, // Keep the shop info
            });
          }
        }
      });

      externalShops = Array.from(shopMap.values());
    }

    // Combine regular users and external shops
    const allConversations = [...allUsers, ...externalShops];

    res.status(200).json(allConversations);
  } catch (error) {
    // console.log("Error in getUsersForSidebar", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUsersForAdmin = async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { includeInactive, shopId, page = 1, limit = 10 } = req.query; // Get query parameters

    // console.log("getUsersForAdmin called with params:", {
    //   includeInactive,
    //   shopId,
    //   page,
    //   limit,
    // });

    let query = {};

    // Super admins can see all users from all shops
    if (loggedInUser.role === "super_admin") {
      // Super admin sees ALL users
      query.shopId = { $exists: true };

      // Add shop filter for super admin if provided
      if (shopId && shopId !== "") {
        query.shopId = shopId;
      }
    }
    // Regular admins can only see users in their own shop
    else if (loggedInUser.role === "admin") {
      query.shopId = loggedInUser.shopId;
    }
    // Only admins and super_admins should access this endpoint
    else {
      return res.status(403).json({
        error: `Insufficient permissions to access user management. Current role: ${loggedInUser.role}`,
      });
    }

    // Only filter by isActive if includeInactive is not set to 'true'
    if (includeInactive !== "true") {
      query.isActive = true;
    }

    // Calculate pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // console.log("Pagination params:", { pageNumber, limitNumber, skip });

    // Get total count for pagination info
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limitNumber);

    // console.log("Total users:", totalUsers, "Total pages:", totalPages);

    // Fetch paginated users
    const users = await User.find(query)
      .populate("shopId", "name code")
      .select("-password -pushSubscription -__v")
      .sort({ shopId: 1, fullName: 1 }) // Sort by shop, then by name
      .skip(skip)
      .limit(limitNumber);

    // console.log("Fetched users count:", users.length);

    // Return paginated response
    const response = {
      users,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalUsers,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
        limit: limitNumber,
      },
    };

    // console.log("Returning paginated response:", {
    //   usersCount: response.users.length,
    //   pagination: response.pagination,
    // });

    res.status(200).json(response);
  } catch (error) {
    // console.log("Error in getUsersForAdmin", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;

    // Users can view their own profile or profiles in their shop
    const canViewProfile =
      requestingUser.role === "super_admin" ||
      userId === requestingUser._id.toString() ||
      (await User.exists({
        _id: userId,
        shopId: requestingUser.shopId,
      }));

    if (!canViewProfile) {
      return res.status(403).json({ error: "Access denied" });
    }

    const user = await User.findById(userId)
      .populate("shopId", "name code")
      .select("-password -pushSubscription -__v");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUserProfile", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, permissions } = req.body;
    const requestingUser = req.user;

    // Only admins and super_admins can update roles
    if (!["admin", "super_admin"].includes(requestingUser.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Regular admins can only update users in their own shop
    if (
      requestingUser.role === "admin" &&
      targetUser.shopId.toString() !== requestingUser.shopId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Can only update users in your own shop" });
    }

    // Update user role and permissions
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role, permissions },
      { new: true, runValidators: true }
    )
      .populate("shopId", "name code")
      .select("-password -pushSubscription");

    res.status(200).json({
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateUserRole", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const requestingUser = req.user;

    // Only admins and super_admins can update other users
    if (
      !["admin", "super_admin"].includes(requestingUser.role) &&
      userId !== requestingUser._id.toString()
    ) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Regular admins can only update users in their own shop
    if (
      requestingUser.role === "admin" &&
      targetUser.shopId.toString() !== requestingUser.shopId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Can only update users in your own shop" });
    }

    // If role is being updated, automatically assign appropriate permissions
    if (updates.role) {
      const rolePermissions = {
        employee: ["send_messages"],
        warehouseman: [
          "receive_messages",
          "update_status",
          "view_employees",
          "send_messages",
        ],
        admin: [
          "send_messages",
          "admin_panel",
          "manage_users",
          "view_all_users",
        ],
        super_admin: [
          "send_messages",
          "admin_panel",
          "manage_users",
          "view_all_users",
          "manage_shops",
          "view_cross_shop",
        ],
      };

      updates.permissions = rolePermissions[updates.role] || ["send_messages"];
    }

    // Prevent password updates through this endpoint
    delete updates.password;
    delete updates._id;
    delete updates.shopId; // Shop changes should go through separate endpoint

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    })
      .populate("shopId", "name code")
      .select("-password -pushSubscription");

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateUser", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUser = req.user;

    // Only admins and super_admins can delete users
    if (!["admin", "super_admin"].includes(requestingUser.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    // Prevent self-deletion
    if (userId === requestingUser._id.toString()) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Regular admins can only delete users in their own shop
    if (
      requestingUser.role === "admin" &&
      targetUser.shopId.toString() !== requestingUser.shopId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Can only delete users in your own shop" });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteUser", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const reassignUserToShop = async (req, res) => {
  try {
    const { userId } = req.params;
    const { shopId } = req.body;
    const requestingUser = req.user;

    // Only super_admin can reassign users to different shops
    if (requestingUser.role !== "super_admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    // Validate shop exists and is active
    const targetShop = await Shop.findById(shopId);
    if (!targetShop) {
      return res.status(404).json({ error: "Target shop not found" });
    }

    if (!targetShop.isActive) {
      return res.status(400).json({ error: "Target shop is not active" });
    }

    // Find and update the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent reassigning super_admin users
    if (user.role === "super_admin") {
      return res
        .status(400)
        .json({ error: "Cannot reassign super admin users" });
    }

    // Prevent self-reassignment
    if (userId === requestingUser._id.toString()) {
      return res
        .status(400)
        .json({ error: "Cannot reassign your own account" });
    }

    // Update the user's shop
    user.shopId = shopId;
    await user.save();

    // Populate shop info for response
    await user.populate("shopId", "name code");

    res.status(200).json({
      message: `User reassigned to ${targetShop.name} successfully`,
      user: {
        _id: user._id,
        fullName: user.fullName,
        userName: user.userName,
        role: user.role,
        shopId: user.shopId,
      },
    });
  } catch (error) {
    console.error("Error in reassignUserToShop", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
