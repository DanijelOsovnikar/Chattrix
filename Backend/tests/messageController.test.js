import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  getOutgoingExternalRequests,
  updateExternalRequestStatus,
} from "../controller/message.controller.js";
import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";
import Message from "../models/message.js";

describe("Message Controller Functions", () => {
  let req, res, shop, user, manager;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("getOutgoingExternalRequests", () => {
    beforeEach(async () => {
      shop = await Shop.create({
        name: "Test Shop",
        code: "TS1",
      });

      manager = await User.create({
        fullName: "Test Manager",
        userName: "manager",
        email: "manager@test.com",
        password: "password",
        role: "manager",
        shopId: shop._id,
      });

      user = await User.create({
        fullName: "Test User",
        userName: "user",
        email: "user@test.com",
        password: "password",
        role: "employee",
        shopId: shop._id,
      });

      req = {
        user: manager,
      };
    });

    it("should return 403 for non-manager users", async () => {
      req.user.role = "employee";

      await getOutgoingExternalRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Only managers, admins, or super_admins can track outgoing requests",
      });
    });

    it("should return empty array when no external requests exist", async () => {
      await getOutgoingExternalRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should return external requests with direction markers", async () => {
      const warehouse = await Shop.create({
        name: "Warehouse",
        code: "WH1",
      });

      const warehouseUser = await User.create({
        fullName: "Warehouse User",
        userName: "warehouse",
        email: "warehouse@test.com",
        password: "password",
        role: "warehouseman",
        shopId: warehouse._id,
      });

      // Create outgoing request
      await Message.create({
        senderId: user._id,
        receiverId: warehouseUser._id,
        shopId: warehouse._id,
        isExternalRequest: true,
        orderNumber: "OUT-001",
      });

      // Create incoming request
      await Message.create({
        senderId: warehouseUser._id,
        receiverId: user._id,
        shopId: shop._id,
        isExternalRequest: true,
        orderNumber: "IN-001",
      });

      await getOutgoingExternalRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      const calls = res.json.mock.calls[0][0];
      expect(calls).toHaveLength(2);

      const outgoing = calls.find((msg) => msg.direction === "outgoing");
      const incoming = calls.find((msg) => msg.direction === "incoming");

      expect(outgoing).toBeDefined();
      expect(incoming).toBeDefined();
      expect(outgoing.orderNumber).toBe("OUT-001");
      expect(incoming.orderNumber).toBe("IN-001");
    });
  });

  describe("updateExternalRequestStatus", () => {
    let message, warehouseUser;

    beforeEach(async () => {
      const warehouse = await Shop.create({
        name: "Warehouse",
        code: "WH1",
      });

      warehouseUser = await User.create({
        fullName: "Warehouse User",
        userName: "warehouse",
        email: "warehouse@test.com",
        password: "password",
        role: "warehouseman",
        shopId: warehouse._id,
      });

      message = await Message.create({
        senderId: user._id,
        receiverId: warehouseUser._id,
        shopId: warehouse._id,
        isExternalRequest: true,
        externalStatus: "pending",
        statusHistory: [
          {
            status: "pending",
            updatedBy: user._id,
            updatedAt: new Date(),
            notes: "Initial request",
          },
        ],
      });

      req = {
        params: { messageId: message._id },
        body: { status: "sending", notes: "Items prepared" },
        user: warehouseUser,
      };
    });

    it("should update message status successfully", async () => {
      await updateExternalRequestStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const updatedMessage = await Message.findById(message._id);
      expect(updatedMessage.externalStatus).toBe("sending");
      expect(updatedMessage.statusHistory).toHaveLength(2);
    });

    it("should return 404 for non-existent message", async () => {
      req.params.messageId = "507f1f77bcf86cd799439011"; // Valid ObjectId but doesn't exist

      await updateExternalRequestStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Message not found",
      });
    });

    it("should validate status values", async () => {
      req.body.status = "invalid_status";

      await updateExternalRequestStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid status",
      });
    });
  });
});
