import express from "express";
import {
  changePassword,
  getUsersForPasswordChange,
} from "../controller/password.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

// Change password (role-based permissions)
router.post("/change", protectRoute, changePassword);

// Get users that current user can change passwords for
router.get("/users", protectRoute, getUsersForPasswordChange);

export default router;
