import express from "express";
import { getShopAnalytics } from "../controller/analytics.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/shops", protectRoute, getShopAnalytics);

export default router;
