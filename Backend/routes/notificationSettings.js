import express from "express";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getAllUsersNotificationPreferences,
} from "../controller/notificationSettings.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

// Get current user's notification preferences
router.get("/preferences", protectRoute, getNotificationPreferences);

// Get specific user's notification preferences (admin only)
router.get("/preferences/:userId", protectRoute, getNotificationPreferences);

// Update current user's notification preferences
router.put("/preferences", protectRoute, updateNotificationPreferences);

// Update specific user's notification preferences (admin only)
router.put("/preferences/:userId", protectRoute, updateNotificationPreferences);

// Get all users' notification preferences (admin only)
router.get(
  "/admin/all-preferences",
  protectRoute,
  getAllUsersNotificationPreferences
);

export default router;
