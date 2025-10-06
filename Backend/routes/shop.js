import express from "express";
import {
  createShop,
  getShops,
  getShopById,
  updateShop,
  deleteShop,
  getShopStats,
} from "../controller/shop.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import {
  requireRole,
  requireShopAccess,
  validateShop,
} from "../middleware/shopAuth.js";

const router = express.Router();

// Create a new shop - only super_admin
router.post("/", protectRoute, requireRole("super_admin"), createShop);

// Get all shops - super_admin sees all, others see their own
router.get("/", protectRoute, getShops);

// Get specific shop by ID
router.get(
  "/:shopId",
  protectRoute,
  requireShopAccess,
  validateShop,
  getShopById
);

// Update shop - super_admin or shop admin
router.put(
  "/:shopId",
  protectRoute,
  requireShopAccess,
  validateShop,
  updateShop
);

// Patch shop (partial update) - super_admin or shop admin
router.patch(
  "/:shopId",
  protectRoute,
  requireShopAccess,
  validateShop,
  updateShop
);

// Delete shop - only super_admin
router.delete(
  "/:shopId",
  protectRoute,
  requireRole("super_admin"),
  validateShop,
  deleteShop
);

// Get shop statistics
router.get(
  "/:shopId/stats",
  protectRoute,
  requireShopAccess,
  validateShop,
  getShopStats
);

export default router;
