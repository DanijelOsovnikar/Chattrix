import express from "express";
import {
  sendMessage,
  getMessages,
  checkedMessage,
} from "../controller/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/:id/:messId", protectRoute, checkedMessage);

export default router;
