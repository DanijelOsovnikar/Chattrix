import bcrypt from "bcryptjs";
import genTokenAndSetCookies from "../utils/genToken.js";

import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";

export const createUser = async (req, res) => {
  try {
    const {
      fullName,
      userName,
      password,
      confirmPassword,
      groupMembers,
      shopId,
      role = "employee",
    } = req.body;

    // Only admins and super_admins can create users
    const requestingUser = req.user;
    if (!["admin", "super_admin"].includes(requestingUser.role)) {
      return res
        .status(403)
        .json({ error: "Insufficient permissions to create users" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords don't match!" });
    }

    const existingUser = await User.findOne({ userName });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists!" });
    }

    // Determine target shop
    let targetShopId = shopId;

    // If no shopId provided and not super_admin, use requesting user's shop
    if (!targetShopId) {
      if (requestingUser.role === "super_admin") {
        const defaultShop = await Shop.findOne({ isActive: true });
        if (!defaultShop) {
          return res
            .status(400)
            .json({ error: "No active shop available. Shop ID is required." });
        }
        targetShopId = defaultShop._id;
      } else {
        // Regular admins create users in their own shop
        targetShopId = requestingUser.shopId;
      }
    }

    // Validate shop exists and is active
    const shop = await Shop.findById(targetShopId);
    if (!shop) {
      return res.status(400).json({ error: "Invalid shop ID" });
    }
    if (!shop.isActive) {
      return res.status(400).json({ error: "Shop is not active" });
    }

    // Regular admins can only create users in their own shop
    if (
      requestingUser.role === "admin" &&
      targetShopId.toString() !== requestingUser.shopId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Can only create users in your own shop" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Set permissions based on role
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

    const newUser = new User({
      fullName,
      userName,
      password: hashedPassword,
      shopId: targetShopId,
      role,
      groupMembers,
      permissions: rolePermissions[role] || ["send_messages"],
    });

    if (newUser) {
      // DON'T call genTokenAndSetCookies - this is the key fix!
      await newUser.save();

      // Populate shop info for response
      await newUser.populate("shopId", "name code");

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        userName: newUser.userName,
        shopId: newUser.shopId,
        role: newUser.role,
        permissions: newUser.permissions,
        message: "User created successfully",
      });
    } else {
      res.status(400).json({ error: "Invalid user data!" });
    }
  } catch (error) {
    // console.log("Error in createUser controller ", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const singup = async (req, res) => {
  try {
    const {
      fullName,
      userName,
      password,
      confirmPassword,
      groupMembers,
      shopId,
      role = "employee",
    } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords don't match!" });
    }

    const user = await User.findOne({ userName });

    if (user) {
      return res.status(400).json({ error: "Username already exists!" });
    }

    // Validate shop exists and is active
    let targetShopId = shopId;

    // If no shopId provided, try to use a default shop or require it
    if (!targetShopId) {
      // For development, you might want to create a default shop
      // In production, shopId should be required
      const defaultShop = await Shop.findOne({ isActive: true });
      if (!defaultShop) {
        return res
          .status(400)
          .json({ error: "No active shop available. Shop ID is required." });
      }
      targetShopId = defaultShop._id;
    }

    const shop = await Shop.findById(targetShopId);
    if (!shop) {
      return res.status(400).json({ error: "Invalid shop ID" });
    }

    if (!shop.isActive) {
      return res.status(400).json({ error: "Shop is not active" });
    }

    // Check if requesting user has permission to create users in this shop
    // (This would typically be called by an admin user, but for signup it might be open)

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      userName,
      password: hashedPassword,
      shopId: targetShopId,
      role,
      groupMembers,
      permissions:
        role === "admin"
          ? ["view_all_users", "manage_users", "send_messages", "admin_panel"]
          : ["send_messages"],
    });

    if (newUser) {
      genTokenAndSetCookies(newUser._id, res);
      await newUser.save();

      // Populate shop info for response
      await newUser.populate("shopId", "name code");

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        userName: newUser.userName,
        shopId: newUser.shopId,
        role: newUser.role,
      });
    } else {
      res.status(400).json({ error: "Invalid user data!" });
    }
  } catch (error) {
    // console.log("Error in signup controller ", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { userName, password } = req.body;

    const user = await User.findOne({ userName }).populate(
      "shopId",
      "name code isActive"
    );
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );

    if (!user || !isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid username or password!" });
    }

    // Check if user's shop is active
    if (!user.shopId || !user.shopId.isActive) {
      return res.status(403).json({
        error: "Your shop is not active. Please contact administrator.",
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: "Your account is not active. Please contact administrator.",
      });
    }

    genTokenAndSetCookies(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      userName: user.userName,
      shopId: user.shopId,
      role: user.role,
      permissions: user.permissions,
    });
  } catch (error) {
    // console.log("Error in login controller ", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 0,
    });
    res.status(200).json({
      message: "Logged out successfully!",
    });
  } catch (error) {
    // console.log("Error in logout controller ", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
