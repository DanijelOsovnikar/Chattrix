import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  createShop,
  getShops,
  getShopById,
  updateShop,
  deleteShop,
  getShopStats,
} from "../controller/shop.controller.js";
import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";

describe("Shop Controller Tests", () => {
  let superAdmin, admin, employee, shop1, shop2, res;

  beforeEach(async () => {
    // Create test shops
    shop1 = await Shop.create({
      name: "Shop One",
      code: "S1",
      isActive: true,
      address: "123 Main St",
    });

    shop2 = await Shop.create({
      name: "Shop Two",
      code: "S2",
      isActive: true,
      address: "456 Oak Ave",
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

  describe("createShop", () => {
    it("should allow super_admin to create shop", async () => {
      const req = {
        user: superAdmin,
        body: {
          name: "New Shop",
          code: "NS1",
          address: "789 Pine St",
          contactInfo: {
            email: "newshop@example.com",
            phone: "123-456-7890",
          },
        },
      };

      await createShop(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Shop created successfully with admin and warehouse users",
          shop: expect.objectContaining({
            name: "New Shop",
            code: "NS1",
          }),
          adminUser: expect.any(Object),
          warehouseUser: expect.any(Object),
        })
      );

      // Verify shop was created
      const shop = await Shop.findOne({ code: "NS1" });
      expect(shop).toBeTruthy();

      // Verify admin and warehouse users were created
      const adminUser = await User.findOne({ userName: "manager_ns1" });
      const warehouseUser = await User.findOne({ userName: "warehouse_ns1" });
      expect(adminUser).toBeTruthy();
      expect(warehouseUser).toBeTruthy();
      expect(adminUser.role).toBe("admin");
      expect(warehouseUser.role).toBe("warehouse");
    });

    it("should reject shop creation for non-super_admin", async () => {
      const req = {
        user: admin,
        body: {
          name: "New Shop",
          code: "NS1",
        },
      };

      await createShop(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Insufficient permissions",
      });
    });

    it("should reject duplicate shop code", async () => {
      const req = {
        user: superAdmin,
        body: {
          name: "Duplicate Shop",
          code: "S1", // Already exists
        },
      };

      await createShop(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Shop with this code or name already exists",
      });
    });

    it("should reject duplicate shop name", async () => {
      const req = {
        user: superAdmin,
        body: {
          name: "Shop One", // Already exists
          code: "NS1",
        },
      };

      await createShop(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Shop with this code or name already exists",
      });
    });

    it("should convert shop code to uppercase", async () => {
      const req = {
        user: superAdmin,
        body: {
          name: "New Shop",
          code: "ns1", // lowercase
        },
      };

      await createShop(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const shop = await Shop.findOne({ code: "NS1" });
      expect(shop.code).toBe("NS1");
    });
  });

  describe("getShops", () => {
    it("should return all shops for super_admin", async () => {
      const req = {
        user: superAdmin,
      };

      await getShops(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: "Shop One" }),
          expect.objectContaining({ name: "Shop Two" }),
        ])
      );
    });

    it("should return only own shop for non-super_admin", async () => {
      const req = {
        user: admin,
      };

      await getShops(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const shops = res.json.mock.calls[0][0];
      expect(shops).toHaveLength(1);
      expect(shops[0].name).toBe("Shop One");
    });

    it("should include user count for each shop", async () => {
      const req = {
        user: superAdmin,
      };

      await getShops(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const shops = res.json.mock.calls[0][0];
      expect(shops[0]).toHaveProperty("userCount");
      expect(typeof shops[0].userCount).toBe("number");
    });
  });

  describe("getShopById", () => {
    it("should allow super_admin to view any shop", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: shop2._id.toString() },
      };

      await getShopById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Shop Two",
          code: "S2",
        })
      );
    });

    it("should allow user to view own shop", async () => {
      const req = {
        user: admin,
        params: { shopId: shop1._id.toString() },
      };

      await getShopById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Shop One",
        })
      );
    });

    it("should reject user viewing other shop", async () => {
      const req = {
        user: admin,
        params: { shopId: shop2._id.toString() },
      };

      await getShopById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Access denied to this shop",
      });
    });

    it("should return 404 for non-existent shop", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: "507f1f77bcf86cd799439011" },
      };

      await getShopById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Shop not found",
      });
    });
  });

  describe("updateShop", () => {
    it("should allow super_admin to update any shop", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: shop2._id.toString() },
        body: {
          name: "Updated Shop Two",
          address: "999 Updated St",
        },
      };

      await updateShop(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Shop updated successfully",
          shop: expect.objectContaining({
            name: "Updated Shop Two",
            address: "999 Updated St",
          }),
        })
      );
    });

    it("should allow shop admin to update own shop", async () => {
      const req = {
        user: admin,
        params: { shopId: shop1._id.toString() },
        body: {
          address: "Updated Address",
        },
      };

      await updateShop(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const updatedShop = await Shop.findById(shop1._id);
      expect(updatedShop.address).toBe("Updated Address");
    });

    it("should reject admin updating other shop", async () => {
      const req = {
        user: admin,
        params: { shopId: shop2._id.toString() },
        body: {
          name: "Hacked Shop",
        },
      };

      await updateShop(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Insufficient permissions to update this shop",
      });
    });

    it("should reject employee updating shop", async () => {
      const req = {
        user: employee,
        params: { shopId: shop1._id.toString() },
        body: {
          name: "Hacked Shop",
        },
      };

      await updateShop(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Insufficient permissions to update this shop",
      });
    });

    it("should return 404 for non-existent shop", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: "507f1f77bcf86cd799439011" },
        body: { name: "Updated" },
      };

      await updateShop(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Shop not found",
      });
    });
  });

  describe("deleteShop", () => {
    it("should allow super_admin to delete empty shop", async () => {
      const emptyShop = await Shop.create({
        name: "Empty Shop",
        code: "ES1",
      });

      const req = {
        user: superAdmin,
        params: { shopId: emptyShop._id.toString() },
      };

      await deleteShop(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Shop deleted successfully",
      });

      const deletedShop = await Shop.findById(emptyShop._id);
      expect(deletedShop).toBeNull();
    });

    it("should reject deleting shop with users", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: shop1._id.toString() },
      };

      await deleteShop(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Cannot delete shop with existing users. Please transfer or delete users first.",
      });
    });

    it("should reject non-super_admin from deleting shop", async () => {
      const emptyShop = await Shop.create({
        name: "Empty Shop",
        code: "ES1",
      });

      const req = {
        user: admin,
        params: { shopId: emptyShop._id.toString() },
      };

      await deleteShop(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Insufficient permissions",
      });
    });

    it("should return 404 for non-existent shop", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: "507f1f77bcf86cd799439011" },
      };

      await deleteShop(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Shop not found",
      });
    });
  });

  describe("getShopStats", () => {
    it("should return shop statistics for super_admin", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: shop1._id.toString() },
      };

      await getShopStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          shop: expect.objectContaining({
            name: "Shop One",
            code: "S1",
          }),
          stats: expect.objectContaining({
            totalUsers: expect.any(Number),
            usersByRole: expect.any(Array),
          }),
        })
      );
    });

    it("should return shop statistics for own shop admin", async () => {
      const req = {
        user: admin,
        params: { shopId: shop1._id.toString() },
      };

      await getShopStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const stats = res.json.mock.calls[0][0];
      expect(stats.stats.totalUsers).toBeGreaterThan(0);
    });

    it("should reject non-admin viewing other shop stats", async () => {
      const req = {
        user: admin,
        params: { shopId: shop2._id.toString() },
      };

      await getShopStats(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Access denied to this shop",
      });
    });

    it("should return correct user role breakdown", async () => {
      // Add more users with different roles
      await User.create({
        fullName: "Manager",
        userName: "manager1",
        email: "manager@example.com",
        password: "hashedpass",
        role: "manager",
        shopId: shop1._id,
      });

      await User.create({
        fullName: "Warehouseman",
        userName: "warehouse1",
        email: "warehouse@example.com",
        password: "hashedpass",
        role: "warehouseman",
        shopId: shop1._id,
      });

      const req = {
        user: superAdmin,
        params: { shopId: shop1._id.toString() },
      };

      await getShopStats(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const stats = res.json.mock.calls[0][0];
      expect(stats.stats.usersByRole).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ _id: "admin" }),
          expect.objectContaining({ _id: "employee" }),
          expect.objectContaining({ _id: "manager" }),
          expect.objectContaining({ _id: "warehouseman" }),
        ])
      );
    });

    it("should return 404 for non-existent shop", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: "507f1f77bcf86cd799439011" },
      };

      await getShopStats(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Shop not found",
      });
    });
  });
});
