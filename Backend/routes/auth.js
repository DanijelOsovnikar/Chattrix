import express from "express";
import {
  singup,
  login,
  logout,
  createUser,
} from "../controller/auth.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/signup", singup);

router.post("/login", login);

router.post("/logout", logout);

// Admin-only user creation endpoint (doesn't auto-login the new user)
router.post("/create-user", protectRoute, createUser);

export default router;
