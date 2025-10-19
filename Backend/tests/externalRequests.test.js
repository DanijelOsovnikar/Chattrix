import { describe, it, expect, beforeEach } from "@jest/globals";
import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";
import Message from "../models/message.js";

describe("External Request Models", () => {
  let shop, warehouse, managerUser, employeeUser;

  beforeEach(async () => {
    // Create test shop and warehouse
    shop = await Shop.create({
      name: "Test Shop G12",
      code: "G12",
      assignedWarehouses: [],
    });

    warehouse = await Shop.create({
      name: "Test Warehouse G62",
      code: "G62",
      assignedWarehouses: [],
    });

    // Create test users
    managerUser = await User.create({
      fullName: "Test Manager",
      userName: "manager",
      email: "manager@test.com",
      password: "password123",
      role: "manager",
      shopId: shop._id,
      isActive: true,
    });

    employeeUser = await User.create({
      fullName: "Test Employee",
      userName: "employee",
      email: "employee@test.com",
      password: "password123",
      role: "employee",
      shopId: shop._id,
      isActive: true,
    });
  });

  it("should create external request message", async () => {
    const externalMessage = await Message.create({
      senderId: employeeUser._id,
      receiverId: managerUser._id,
      shopId: shop._id,
      messages: [{ ean: "123456", naziv: "Test Product", qty: 1 }],
      isExternalRequest: true,
      orderNumber: "EXT-TEST-001",
      orderDate: new Date(),
      externalStatus: "pending",
    });

    expect(externalMessage.isExternalRequest).toBe(true);
    expect(externalMessage.orderNumber).toBe("EXT-TEST-001");
    expect(externalMessage.externalStatus).toBe("pending");
  });

  it("should create shop with assigned warehouses", async () => {
    shop.assignedWarehouses = [warehouse._id];
    await shop.save();

    const updatedShop = await Shop.findById(shop._id);
    expect(updatedShop.assignedWarehouses).toHaveLength(1);
    expect(updatedShop.assignedWarehouses[0].toString()).toBe(
      warehouse._id.toString()
    );
  });

  it("should create users with different roles", async () => {
    expect(managerUser.role).toBe("manager");
    expect(employeeUser.role).toBe("employee");
    expect(managerUser.shopId.toString()).toBe(shop._id.toString());
  });
});
