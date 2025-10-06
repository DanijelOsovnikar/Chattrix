import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import {
  getUsersForSidebar,
  getUsersForAdmin,
  getUserProfile,
  updateUserRole,
  updateUser,
  deleteUser,
  reassignUserToShop,
} from "../controller/user.controller.js";
import { requireActiveShop, canManageUsers } from "../middleware/shopAuth.js";

const router = express.Router();

// Get users for sidebar - requires active shop
router.get("/", protectRoute, requireActiveShop, getUsersForSidebar);

// Get all users for admin management - permission check handled in controller
router.get("/admin", protectRoute, getUsersForAdmin);

// Get specific user profile
router.get("/:userId", protectRoute, getUserProfile);

// Update user role and permissions - requires user management rights
router.put("/:userId/role", protectRoute, canManageUsers, updateUserRole);

// Update user details - requires user management rights
router.patch("/:userId", protectRoute, canManageUsers, updateUser);

// Delete user - requires user management rights
router.delete("/:userId", protectRoute, canManageUsers, deleteUser);

// Reassign user to shop - super admin only
router.patch("/:userId/reassign-shop", protectRoute, reassignUserToShop);

export default router;
