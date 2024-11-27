import express from "express";
import {
  sendMessage,
  getMessages,
  checkedMessage,
  uncheckMessage,
} from "../controller/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/:id/:messId", protectRoute, checkedMessage);
router.post("/uncheck/:id/:messId", protectRoute, uncheckMessage);

export default router;
