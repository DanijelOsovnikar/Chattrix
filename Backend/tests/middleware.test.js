import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import protectRoute from "../middleware/protectRoute.js";
import {
  requireShopAccess,
  requirePermission,
  requireRole,
  validateShop,
  canManageUsers,
  requireActiveShop,
} from "../middleware/shopAuth.js";
import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";

describe("Middleware Tests", () => {
  let shop1, shop2, superAdmin, admin, employee, res, next;

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

    // Create test users
    superAdmin = await User.create({
      fullName: "Super Admin",
      userName: "superadmin",
      email: "superadmin@test.com",
      password: "hashedpass",
      role: "super_admin",
      shopId: shop1._id,
      permissions: ["manage_shops", "view_all_users"],
      isActive: true,
    });

    admin = await User.create({
      fullName: "Admin",
      userName: "admin",
      email: "admin@test.com",
      password: "hashedpass",
      role: "admin",
      shopId: shop1._id,
      permissions: ["manage_users", "admin_panel"],
      isActive: true,
    });

    employee = await User.create({
      fullName: "Employee",
      userName: "employee",
      email: "employee@test.com",
      password: "hashedpass",
      role: "employee",
      shopId: shop1._id,
      permissions: ["send_messages"],
      isActive: true,
    });

    // Mock response and next function
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe("protectRoute", () => {
    it("should call next() with valid token", async () => {
      const token = jwt.sign({ id: employee._id }, process.env.JWT_SECRET);
      const req = {
        cookies: { jwt: token },
      };

      await protectRoute(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(employee._id.toString());
      expect(req.user.password).toBeUndefined();
    });

    it("should return 401 when no token provided", async () => {
      const req = { cookies: {} };

      await protectRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Unauthorized - No Token Provided",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 with invalid token", async () => {
      const req = {
        cookies: { jwt: "invalid-token" },
      };

      await protectRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 404 when user not found", async () => {
      const nonExistentId = "507f1f77bcf86cd799439011";
      const token = jwt.sign({ id: nonExistentId }, process.env.JWT_SECRET);
      const req = {
        cookies: { jwt: token },
      };

      await protectRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should not include password in user object", async () => {
      const token = jwt.sign({ id: employee._id }, process.env.JWT_SECRET);
      const req = {
        cookies: { jwt: token },
      };

      await protectRoute(req, res, next);

      expect(req.user.password).toBeUndefined();
    });
  });

  describe("requireShopAccess", () => {
    it("should allow super_admin access to any shop", async () => {
      const req = {
        user: superAdmin,
        params: { shopId: shop2._id.toString() },
      };

      await requireShopAccess(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should allow user access to own shop", async () => {
      const req = {
        user: admin,
        params: { shopId: shop1._id.toString() },
      };

      await requireShopAccess(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.shopId).toBe(shop1._id.toString());
    });

    it("should deny access to different shop", async () => {
      const req = {
        user: admin,
        params: { shopId: shop2._id.toString() },
      };

      await requireShopAccess(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Access denied to this shop",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should use user's shop when no target shop specified", async () => {
      const req = {
        user: admin,
        params: {},
        body: {},
      };

      await requireShopAccess(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.shopId).toBeDefined();
      expect(req.shopId.toString()).toBe(admin.shopId.toString());
    });

    it("should check shopId from body if not in params", async () => {
      const req = {
        user: admin,
        params: {},
        body: { shopId: shop1._id.toString() },
      };

      await requireShopAccess(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("requirePermission", () => {
    it("should allow super_admin regardless of permissions", () => {
      const middleware = requirePermission("any_permission");
      const req = { user: superAdmin };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should allow user with required permission", () => {
      const middleware = requirePermission("manage_users");
      const req = { user: admin };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should deny user without required permission", () => {
      const middleware = requirePermission("manage_shops");
      const req = { user: employee };

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Permission 'manage_shops' required",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle user with no permissions array", () => {
      const middleware = requirePermission("any_permission");
      const userWithoutPermissions = {
        ...employee.toObject(),
        permissions: undefined,
      };
      const req = { user: userWithoutPermissions };

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireRole", () => {
    it("should allow user with required role (single)", () => {
      const middleware = requireRole("admin");
      const req = { user: admin };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should allow user with required role (array)", () => {
      const middleware = requireRole(["admin", "manager"]);
      const req = { user: admin };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should deny user without required role", () => {
      const middleware = requireRole(["admin", "super_admin"]);
      const req = { user: employee };

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Role 'admin or super_admin' required",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle single role as string", () => {
      const middleware = requireRole("employee");
      const req = { user: employee };

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("validateShop", () => {
    it("should validate shop from params", async () => {
      const req = {
        user: admin,
        params: { shopId: shop1._id.toString() },
        body: {},
      };

      await validateShop(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.shop).toBeDefined();
      expect(req.shop._id.toString()).toBe(shop1._id.toString());
    });

    it("should validate shop from body", async () => {
      const req = {
        user: admin,
        params: {},
        body: { shopId: shop1._id.toString() },
      };

      await validateShop(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.shop).toBeDefined();
    });

    it("should use user's shop if not specified", async () => {
      const req = {
        user: admin,
        params: {},
        body: {},
      };

      await validateShop(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.shop).toBeDefined();
    });

    it("should return 404 for non-existent shop", async () => {
      const req = {
        user: admin,
        params: { shopId: "507f1f77bcf86cd799439011" },
        body: {},
      };

      await validateShop(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Shop not found" });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 403 for inactive shop", async () => {
      const inactiveShop = await Shop.create({
        name: "Inactive Shop",
        code: "IS1",
        isActive: false,
      });

      const req = {
        user: admin,
        params: { shopId: inactiveShop._id.toString() },
        body: {},
      };

      await validateShop(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Shop is not active" });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("canManageUsers", () => {
    it("should allow super_admin to manage any user", async () => {
      const req = {
        user: superAdmin,
        params: { userId: employee._id.toString() },
      };

      await canManageUsers(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should allow admin to manage users in own shop", async () => {
      const req = {
        user: admin,
        params: { userId: employee._id.toString() },
      };

      await canManageUsers(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should deny employee from managing users", async () => {
      const req = {
        user: employee,
        params: { userId: admin._id.toString() },
      };

      await canManageUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Insufficient role to manage users",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should deny admin from managing users in different shop", async () => {
      const shop2User = await User.create({
        fullName: "Shop 2 User",
        userName: "shop2user",
        email: "shop2@test.com",
        password: "hashedpass",
        role: "employee",
        shopId: shop2._id,
        isActive: true,
      });

      const req = {
        user: admin,
        params: { userId: shop2User._id.toString() },
      };

      await canManageUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Can only manage users in your own shop",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should prevent admin from managing super_admin", async () => {
      const req = {
        user: admin,
        params: { userId: superAdmin._id.toString() },
      };

      await canManageUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Cannot manage super admin users",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 404 for non-existent target user", async () => {
      const req = {
        user: admin,
        params: { userId: "507f1f77bcf86cd799439011" },
      };

      await canManageUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Target user not found",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should work without targetUserId", async () => {
      const req = {
        user: {
          ...admin.toObject(),
          shopId: admin.shopId,
          role: admin.role,
        },
        params: {},
        body: {},
      };

      await canManageUsers(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("requireActiveShop", () => {
    it("should allow access with active shop", async () => {
      const req = { user: admin };

      await requireActiveShop(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.shop).toBeDefined();
      expect(req.user.shop._id.toString()).toBe(shop1._id.toString());
    });

    it("should deny access with inactive shop", async () => {
      const inactiveShop = await Shop.create({
        name: "Inactive Shop",
        code: "IS1",
        isActive: false,
      });

      const inactiveShopUser = await User.create({
        fullName: "Inactive Shop User",
        userName: "inactiveuser",
        email: "inactive@test.com",
        password: "hashedpass",
        role: "employee",
        shopId: inactiveShop._id,
        isActive: true,
      });

      const req = { user: inactiveShopUser };

      await requireActiveShop(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Your shop is not active. Please contact administrator.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should deny access when shop not found", async () => {
      const userWithoutShop = {
        ...employee.toObject(),
        shopId: "507f1f77bcf86cd799439011",
      };

      const req = { user: userWithoutShop };

      await requireActiveShop(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
