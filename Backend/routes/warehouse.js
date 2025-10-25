import express from "express";
import {
  getAvailableWarehouses,
  assignWarehousesToShop,
  getShopWithWarehouses,
  getAllShopsWithWarehouses,
  getAssignedWarehousesForShop,
} from "../controller/warehouse.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

// Get all available warehouses (super admin only)
router.get("/available", protectRoute, getAvailableWarehouses);

// Get all shops with their assigned warehouses (super admin only)
router.get("/shops", protectRoute, getAllShopsWithWarehouses);

// Get specific shop with its assigned warehouses (super admin only)
router.get("/shops/:shopId", protectRoute, getShopWithWarehouses);

// Assign warehouses to a shop (super admin only)
router.put("/shops/:shopId/assign", protectRoute, assignWarehousesToShop);

// Get warehouses assigned to current user's shop (for employees to see available targets)
router.get("/my-shop/assigned", protectRoute, getAssignedWarehousesForShop);

export default router;
