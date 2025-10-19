import express from "express";
import {
  sendMessage,
  getMessages,
  checkedMessage,
  uncheckMessage,
  updateMessageStatus,
  updateExternalRequestStatus,
  getOutgoingExternalRequests,
} from "../controller/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/tracking/outgoing", protectRoute, getOutgoingExternalRequests);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/:id/:messId", protectRoute, checkedMessage);
router.post("/uncheck/:id/:messId", protectRoute, uncheckMessage);
router.patch("/:messageId/status", protectRoute, updateMessageStatus);
router.patch(
  "/:messageId/external-status",
  protectRoute,
  updateExternalRequestStatus
);

export default router;
