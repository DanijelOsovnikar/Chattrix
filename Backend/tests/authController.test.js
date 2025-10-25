import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import bcrypt from "bcryptjs";
import {
  login,
  logout,
  singup,
  createUser,
} from "../controller/auth.controller.js";
import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";
import genTokenAndSetCookies from "../utils/genToken.js";

// Mock genToken utility
jest.unstable_mockModule("../utils/genToken.js", () => ({
  default: jest.fn(),
}));

describe("Auth Controller Tests", () => {
  let shop, adminShop, res;

  beforeEach(async () => {
    // Create test shops
    shop = await Shop.create({
      name: "Test Shop",
      code: "TS1",
      isActive: true,
    });

    adminShop = await Shop.create({
      name: "Admin Shop",
      code: "AS1",
      isActive: true,
    });

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
  });

  describe("login", () => {
    it("should login user with correct credentials", async () => {
      const password = "testpass123";
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        fullName: "Test User",
        userName: "testuser",
        email: "test@example.com",
        password: hashedPassword,
        role: "employee",
        shopId: shop._id,
        isActive: true,
      });

      const req = {
        body: {
          userName: "testuser",
          password: password,
        },
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: user._id,
          fullName: "Test User",
          userName: "testuser",
          role: "employee",
        })
      );
    });

    it("should reject login with incorrect password", async () => {
      const hashedPassword = await bcrypt.hash("correctpass", 10);

      await User.create({
        fullName: "Test User",
        userName: "testuser",
        email: "test@example.com",
        password: hashedPassword,
        role: "employee",
        shopId: shop._id,
      });

      const req = {
        body: {
          userName: "testuser",
          password: "wrongpass",
        },
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid username or password!",
      });
    });

    it("should reject login for non-existent user", async () => {
      const req = {
        body: {
          userName: "nonexistent",
          password: "anypass",
        },
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid username or password!",
      });
    });

    it("should reject login for inactive shop", async () => {
      const inactiveShop = await Shop.create({
        name: "Inactive Shop",
        code: "IS1",
        isActive: false,
      });

      const password = "testpass123";
      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        fullName: "Test User",
        userName: "inactiveuser",
        email: "inactive@example.com",
        password: hashedPassword,
        role: "employee",
        shopId: inactiveShop._id,
      });

      const req = {
        body: {
          userName: "inactiveuser",
          password: password,
        },
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Your shop is not active. Please contact administrator.",
      });
    });

    it("should reject login for inactive user", async () => {
      const password = "testpass123";
      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        fullName: "Inactive User",
        userName: "inactiveuser",
        email: "inactive@example.com",
        password: hashedPassword,
        role: "employee",
        shopId: shop._id,
        isActive: false,
      });

      const req = {
        body: {
          userName: "inactiveuser",
          password: password,
        },
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Your account is not active. Please contact administrator.",
      });
    });
  });

  describe("logout", () => {
    it("should logout user successfully", async () => {
      const req = {};

      await logout(req, res);

      expect(res.cookie).toHaveBeenCalledWith("jwt", "", { maxAge: 0 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Logged out successfully!",
      });
    });
  });

  describe("singup", () => {
    it("should create new user with valid data", async () => {
      const req = {
        body: {
          fullName: "New User",
          userName: "newuser",
          password: "password123",
          confirmPassword: "password123",
          shopId: shop._id.toString(),
          role: "employee",
        },
      };

      await singup(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "New User",
          userName: "newuser",
          role: "employee",
        })
      );

      const user = await User.findOne({ userName: "newuser" });
      expect(user).toBeTruthy();
      expect(user.shopId.toString()).toBe(shop._id.toString());
    });

    it("should reject signup with mismatched passwords", async () => {
      const req = {
        body: {
          fullName: "New User",
          userName: "newuser",
          password: "password123",
          confirmPassword: "differentpass",
          shopId: shop._id.toString(),
        },
      };

      await singup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Passwords don't match!",
      });
    });

    it("should reject signup with existing username", async () => {
      await User.create({
        fullName: "Existing User",
        userName: "existinguser",
        email: "existing@example.com",
        password: "hashedpass",
        role: "employee",
        shopId: shop._id,
      });

      const req = {
        body: {
          fullName: "New User",
          userName: "existinguser",
          password: "password123",
          confirmPassword: "password123",
          shopId: shop._id.toString(),
        },
      };

      await singup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Username already exists!",
      });
    });

    it("should reject signup with invalid shop", async () => {
      const req = {
        body: {
          fullName: "New User",
          userName: "newuser",
          password: "password123",
          confirmPassword: "password123",
          shopId: "507f1f77bcf86cd799439011", // Valid ObjectId but doesn't exist
        },
      };

      await singup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid shop ID",
      });
    });

    it("should reject signup with inactive shop", async () => {
      const inactiveShop = await Shop.create({
        name: "Inactive Shop",
        code: "IS2",
        isActive: false,
      });

      const req = {
        body: {
          fullName: "New User",
          userName: "newuser",
          password: "password123",
          confirmPassword: "password123",
          shopId: inactiveShop._id.toString(),
        },
      };

      await singup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Shop is not active",
      });
    });
  });

  describe("createUser", () => {
    it("should allow admin to create user in their shop", async () => {
      const admin = await User.create({
        fullName: "Admin User",
        userName: "admin",
        email: "admin@example.com",
        password: "hashedpass",
        role: "admin",
        shopId: shop._id,
        permissions: ["manage_users", "admin_panel"],
      });

      const req = {
        user: admin,
        body: {
          fullName: "Created User",
          userName: "createduser",
          password: "password123",
          confirmPassword: "password123",
          role: "employee",
        },
      };

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Created User",
          userName: "createduser",
          role: "employee",
          message: "User created successfully",
        })
      );

      const user = await User.findOne({ userName: "createduser" });
      expect(user.shopId.toString()).toBe(shop._id.toString());
    });

    it("should allow super_admin to create user in any shop", async () => {
      const superAdmin = await User.create({
        fullName: "Super Admin",
        userName: "superadmin",
        email: "superadmin@example.com",
        password: "hashedpass",
        role: "super_admin",
        shopId: adminShop._id,
        permissions: ["manage_users", "admin_panel", "manage_shops"],
      });

      const req = {
        user: superAdmin,
        body: {
          fullName: "Created User",
          userName: "createduser",
          password: "password123",
          confirmPassword: "password123",
          shopId: shop._id.toString(),
          role: "employee",
        },
      };

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const user = await User.findOne({ userName: "createduser" });
      expect(user.shopId.toString()).toBe(shop._id.toString());
    });

    it("should reject createUser for non-admin users", async () => {
      const employee = await User.create({
        fullName: "Employee User",
        userName: "employee",
        email: "employee@example.com",
        password: "hashedpass",
        role: "employee",
        shopId: shop._id,
      });

      const req = {
        user: employee,
        body: {
          fullName: "Created User",
          userName: "createduser",
          password: "password123",
          confirmPassword: "password123",
        },
      };

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Insufficient permissions to create users",
      });
    });

    it("should reject admin creating user in different shop", async () => {
      const admin = await User.create({
        fullName: "Admin User",
        userName: "admin",
        email: "admin@example.com",
        password: "hashedpass",
        role: "admin",
        shopId: adminShop._id,
        permissions: ["manage_users", "admin_panel"],
      });

      const req = {
        user: admin,
        body: {
          fullName: "Created User",
          userName: "createduser",
          password: "password123",
          confirmPassword: "password123",
          shopId: shop._id.toString(),
          role: "employee",
        },
      };

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Can only create users in your own shop",
      });
    });

    it("should reject createUser with mismatched passwords", async () => {
      const admin = await User.create({
        fullName: "Admin User",
        userName: "admin",
        email: "admin@example.com",
        password: "hashedpass",
        role: "admin",
        shopId: shop._id,
        permissions: ["manage_users", "admin_panel"],
      });

      const req = {
        user: admin,
        body: {
          fullName: "Created User",
          userName: "createduser",
          password: "password123",
          confirmPassword: "differentpass",
        },
      };

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Passwords don't match!",
      });
    });

    it("should reject createUser with existing username", async () => {
      const admin = await User.create({
        fullName: "Admin User",
        userName: "admin",
        email: "admin@example.com",
        password: "hashedpass",
        role: "admin",
        shopId: shop._id,
        permissions: ["manage_users", "admin_panel"],
      });

      await User.create({
        fullName: "Existing User",
        userName: "existinguser",
        email: "existing@example.com",
        password: "hashedpass",
        role: "employee",
        shopId: shop._id,
      });

      const req = {
        user: admin,
        body: {
          fullName: "Created User",
          userName: "existinguser",
          password: "password123",
          confirmPassword: "password123",
        },
      };

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Username already exists!",
      });
    });

    it("should set correct permissions based on role", async () => {
      const admin = await User.create({
        fullName: "Admin User",
        userName: "admin",
        email: "admin@example.com",
        password: "hashedpass",
        role: "admin",
        shopId: shop._id,
        permissions: ["manage_users", "admin_panel"],
      });

      const req = {
        user: admin,
        body: {
          fullName: "Warehouse User",
          userName: "warehouseuser",
          password: "password123",
          confirmPassword: "password123",
          role: "warehouseman",
        },
      };

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const user = await User.findOne({ userName: "warehouseuser" });
      expect(user.permissions).toEqual(
        expect.arrayContaining([
          "receive_messages",
          "update_status",
          "view_employees",
          "send_messages",
        ])
      );
    });
  });
});
