import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  getAvailableWarehouses,
  assignWarehousesToShop,
  getShopWithWarehouses,
  getAllShopsWithWarehouses,
  getAssignedWarehousesForShop,
} from "../controller/warehouse.controller.js";
import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";

describe("Warehouse Controller Tests", () => {
  let superAdmin, admin, employee, shop1, shop2, warehouse1, warehouse2, res;

  beforeEach(async () => {
    // Create test shops
    shop1 = await Shop.create({
      name: "Shop One",
      code: "S1",
      isActive: true,
    });

    shop2 = await Shop.create({
      name: "Shop Two",
      code: "S2",
      isActive: true,
    });

    // Create warehouse shops
    warehouse1 = await Shop.create({
      name: "Warehouse One",
      code: "W1",
      isActive: true,
    });

    warehouse2 = await Shop.create({
      name: "Warehouse Two",
      code: "W2",
      isActive: true,
    });

    // Create test users
    superAdmin = await User.create({
      fullName: "Super Admin",
      userName: "superadmin",
      email: "superadmin@example.com",
      password: "hashedpass",
      role: "super_admin",
      shopId: shop1._id,
      permissions: ["manage_shops", "view_all_users"],
    });

    admin = await User.create({
      fullName: "Shop Admin",
      userName: "shopadmin",
      email: "shopadmin@example.com",
      password: "hashedpass",
      role: "admin",
      shopId: shop1._id,
      permissions: ["manage_users", "admin_panel"],
    });

    employee = await User.create({
      fullName: "Employee",
      userName: "employee",
      email: "employee@example.com",
      password: "hashedpass",
      role: "employee",
      shopId: shop1._id,
    });

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("getAvailableWarehouses", () => {
    it("should return all active warehouses for super_admin", async () => {
      const req = {
        user: superAdmin,
      };

      await getAvailableWarehouses(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const warehouses = res.json.mock.calls[0][0];
      expect(warehouses.length).toBeGreaterThanOrEqual(2);
      expect(warehouses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Warehouse One" }),
          expect.objectContaining({ name: "Warehouse Two" }),
        ])
      );
    });

    it("should reject non-super_admin access", async () => {
      const req = {
        user: admin,
      };

      await getAvailableWarehouses(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Access denied. Super admin only.",
      });
    });

    it("should only return active warehouses", async () => {
      // Create inactive warehouse
      await Shop.create({
        name: "Inactive Warehouse",
        code: "IW1",
        isActive: false,
      });

      const req = {
        user: superAdmin,
      };

      await getAvailableWarehouses(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const warehouses = res.json.mock.calls[0][0];
      const inactiveWarehouse = warehouses.find(
        (w) => w.name === "Inactive Warehouse"
      );
      expect(inactiveWarehouse).toBeUndefined();
    });
  });

  describe("assignWarehousesToShop", () => {
    it("should allow super_admin to assign warehouses", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: shop1._id.toString() },
        body: {
          warehouseIds: [warehouse1._id.toString(), warehouse2._id.toString()],
        },
      };

      await assignWarehousesToShop(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Warehouses assigned successfully",
          shop: expect.objectContaining({
            name: "Shop One",
          }),
        })
      );

      // Verify assignment in database
      const updatedShop = await Shop.findById(shop1._id);
      expect(updatedShop.assignedWarehouses).toHaveLength(2);
      expect(updatedShop.assignedWarehouses.map((w) => w.toString())).toEqual(
        expect.arrayContaining([
          warehouse1._id.toString(),
          warehouse2._id.toString(),
        ])
      );
    });

    it("should reject non-super_admin access", async () => {
      const req = {
        user: admin,
        params: { shopId: shop1._id.toString() },
        body: {
          warehouseIds: [warehouse1._id.toString()],
        },
      };

      await assignWarehousesToShop(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Access denied. Super admin only.",
      });
    });

    it("should reject invalid shop ID", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: "507f1f77bcf86cd799439011" },
        body: {
          warehouseIds: [warehouse1._id.toString()],
        },
      };

      await assignWarehousesToShop(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Shop not found",
      });
    });

    it("should reject invalid warehouse IDs", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: shop1._id.toString() },
        body: {
          warehouseIds: ["507f1f77bcf86cd799439011"], // Valid ObjectId but doesn't exist
        },
      };

      await assignWarehousesToShop(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "One or more warehouse IDs are invalid",
      });
    });

    it("should reject non-array warehouseIds", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: shop1._id.toString() },
        body: {
          warehouseIds: "not-an-array",
        },
      };

      await assignWarehousesToShop(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Shop ID and warehouse IDs array are required",
      });
    });

    it("should handle empty warehouse assignment", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: shop1._id.toString() },
        body: {
          warehouseIds: [],
        },
      };

      await assignWarehousesToShop(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const updatedShop = await Shop.findById(shop1._id);
      expect(updatedShop.assignedWarehouses).toHaveLength(0);
    });

    it("should update existing warehouse assignments", async () => {
      // First assignment
      shop1.assignedWarehouses = [warehouse1._id];
      await shop1.save();

      // Update assignment
      const req = {
        user: superAdmin,
        params: { shopId: shop1._id.toString() },
        body: {
          warehouseIds: [warehouse2._id.toString()],
        },
      };

      await assignWarehousesToShop(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const updatedShop = await Shop.findById(shop1._id);
      expect(updatedShop.assignedWarehouses).toHaveLength(1);
      expect(updatedShop.assignedWarehouses[0].toString()).toBe(
        warehouse2._id.toString()
      );
    });
  });

  describe("getShopWithWarehouses", () => {
    beforeEach(async () => {
      // Assign warehouses to shop1
      shop1.assignedWarehouses = [warehouse1._id, warehouse2._id];
      await shop1.save();
    });

    it("should return shop with assigned warehouses for super_admin", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: shop1._id.toString() },
      };

      await getShopWithWarehouses(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Shop One",
          assignedWarehouses: expect.arrayContaining([
            expect.objectContaining({ name: "Warehouse One" }),
            expect.objectContaining({ name: "Warehouse Two" }),
          ]),
        })
      );
    });

    it("should reject non-super_admin access", async () => {
      const req = {
        user: admin,
        params: { shopId: shop1._id.toString() },
      };

      await getShopWithWarehouses(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Access denied. Super admin only.",
      });
    });

    it("should return 404 for non-existent shop", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: "507f1f77bcf86cd799439011" },
      };

      await getShopWithWarehouses(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Shop not found",
      });
    });
  });

  describe("getAllShopsWithWarehouses", () => {
    beforeEach(async () => {
      // Assign warehouses to shops
      shop1.assignedWarehouses = [warehouse1._id];
      await shop1.save();

      shop2.assignedWarehouses = [warehouse2._id];
      await shop2.save();
    });

    it("should return all shops with warehouses for super_admin", async () => {
      const req = {
        user: superAdmin,
      };

      await getAllShopsWithWarehouses(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const shops = res.json.mock.calls[0][0];
      expect(shops.length).toBeGreaterThanOrEqual(2);

      const shop1Result = shops.find((s) => s.name === "Shop One");
      const shop2Result = shops.find((s) => s.name === "Shop Two");

      expect(shop1Result).toBeDefined();
      expect(shop2Result).toBeDefined();
      expect(shop1Result.assignedWarehouses).toHaveLength(1);
      expect(shop2Result.assignedWarehouses).toHaveLength(1);
    });

    it("should reject non-super_admin access", async () => {
      const req = {
        user: admin,
      };

      await getAllShopsWithWarehouses(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Access denied. Super admin only.",
      });
    });

    it("should only return active shops", async () => {
      // Create inactive shop
      const inactiveShop = await Shop.create({
        name: "Inactive Shop",
        code: "IS1",
        isActive: false,
        assignedWarehouses: [warehouse1._id],
      });

      const req = {
        user: superAdmin,
      };

      await getAllShopsWithWarehouses(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const shops = res.json.mock.calls[0][0];
      const inactive = shops.find((s) => s.name === "Inactive Shop");
      expect(inactive).toBeUndefined();
    });
  });

  describe("getAssignedWarehousesForShop", () => {
    beforeEach(async () => {
      // Assign warehouses to shop1
      shop1.assignedWarehouses = [warehouse1._id, warehouse2._id];
      await shop1.save();
    });

    it("should return assigned warehouses for user's shop", async () => {
      const req = {
        user: employee,
      };

      await getAssignedWarehousesForShop(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const warehouses = res.json.mock.calls[0][0];
      expect(warehouses).toHaveLength(2);
      expect(warehouses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Warehouse One" }),
          expect.objectContaining({ name: "Warehouse Two" }),
        ])
      );
    });

    it("should return empty array if no warehouses assigned", async () => {
      const userInShop2 = await User.create({
        fullName: "Employee Shop 2",
        userName: "emp2",
        email: "emp2@example.com",
        password: "hashedpass",
        role: "employee",
        shopId: shop2._id,
      });

      const req = {
        user: userInShop2,
      };

      await getAssignedWarehousesForShop(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const warehouses = res.json.mock.calls[0][0];
      expect(warehouses).toEqual([]);
    });

    it("should handle user without shop assignment", async () => {
      const userWithoutShop = {
        ...employee.toObject(),
        shopId: null,
      };

      const req = {
        user: userWithoutShop,
      };

      await getAssignedWarehousesForShop(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not assigned to any shop",
      });
    });
  });

  describe("Cross-Shop Communication", () => {
    it("should allow communication only with assigned warehouses", async () => {
      // Assign only warehouse1 to shop1
      shop1.assignedWarehouses = [warehouse1._id];
      await shop1.save();

      const req = {
        user: employee,
      };

      await getAssignedWarehousesForShop(req, res);

      const warehouses = res.json.mock.calls[0][0];
      expect(warehouses).toHaveLength(1);
      expect(warehouses[0].name).toBe("Warehouse One");

      // Verify warehouse2 is not included
      const hasWarehouse2 = warehouses.some(
        (w) => w._id.toString() === warehouse2._id.toString()
      );
      expect(hasWarehouse2).toBe(false);
    });

    it("should support multiple warehouse assignments", async () => {
      // Create additional warehouses
      const warehouse3 = await Shop.create({
        name: "Warehouse Three",
        code: "W3",
        isActive: true,
      });

      const warehouse4 = await Shop.create({
        name: "Warehouse Four",
        code: "W4",
        isActive: true,
      });

      // Assign multiple warehouses
      shop1.assignedWarehouses = [
        warehouse1._id,
        warehouse2._id,
        warehouse3._id,
        warehouse4._id,
      ];
      await shop1.save();

      const req = {
        user: employee,
      };

      await getAssignedWarehousesForShop(req, res);

      const warehouses = res.json.mock.calls[0][0];
      expect(warehouses).toHaveLength(4);
    });

    it("should allow reassigning warehouses dynamically", async () => {
      // Initial assignment
      shop1.assignedWarehouses = [warehouse1._id];
      await shop1.save();

      // Reassign
      const req = {
        user: superAdmin,
        params: { shopId: shop1._id.toString() },
        body: {
          warehouseIds: [warehouse2._id.toString()],
        },
      };

      await assignWarehousesToShop(req, res);

      // Verify reassignment
      const updatedShop = await Shop.findById(shop1._id);
      expect(updatedShop.assignedWarehouses).toHaveLength(1);
      expect(updatedShop.assignedWarehouses[0].toString()).toBe(
        warehouse2._id.toString()
      );
    });
  });
});
