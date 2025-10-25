import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  getUsersForSidebar,
  getUsersForAdmin,
  getUserProfile,
  updateUserRole,
  updateUser,
  deleteUser,
  reassignUserToShop,
} from "../controller/user.controller.js";
import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";
import Message from "../models/message.js";

describe("User Controller Tests", () => {
  let shop1,
    shop2,
    warehouse,
    superAdmin,
    admin,
    manager,
    employee,
    warehouseman,
    res;

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

    warehouse = await Shop.create({
      name: "Warehouse",
      code: "W1",
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
      fullName: "Shop Admin",
      userName: "shopadmin",
      email: "shopadmin@test.com",
      password: "hashedpass",
      role: "admin",
      shopId: shop1._id,
      permissions: ["manage_users", "admin_panel"],
      isActive: true,
    });

    manager = await User.create({
      fullName: "Manager",
      userName: "manager",
      email: "manager@test.com",
      password: "hashedpass",
      role: "manager",
      shopId: shop1._id,
      permissions: ["view_all_users"],
      isActive: true,
    });

    employee = await User.create({
      fullName: "Employee",
      userName: "employee",
      email: "employee@test.com",
      password: "hashedpass",
      role: "employee",
      shopId: shop1._id,
      isActive: true,
    });

    warehouseman = await User.create({
      fullName: "Warehouseman",
      userName: "warehouseman",
      email: "warehouseman@test.com",
      password: "hashedpass",
      role: "warehouseman",
      shopId: warehouse._id,
      isActive: true,
    });

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("getUsersForSidebar", () => {
    it("should return users for employee (only warehouse role)", async () => {
      const warehouseUser = await User.create({
        fullName: "Warehouse User",
        userName: "warehouse",
        email: "warehouse@test.com",
        password: "hashedpass",
        role: "warehouse",
        shopId: shop1._id,
        isActive: true,
      });

      const req = { user: employee };
      await getUsersForSidebar(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const users = res.json.mock.calls[0][0];
      expect(users).toHaveLength(1);
      expect(users[0].role).toBe("warehouse");
    });

    it("should return all shop users for admin", async () => {
      const req = { user: admin };
      await getUsersForSidebar(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const users = res.json.mock.calls[0][0];
      // Should see superAdmin, manager, employee (not themselves)
      expect(users.length).toBeGreaterThanOrEqual(2);

      // Should not include themselves
      const includesSelf = users.some(
        (u) => u._id.toString() === admin._id.toString()
      );
      expect(includesSelf).toBe(false);
    });

    it("should return users from all shops for super_admin", async () => {
      const shop2User = await User.create({
        fullName: "Shop 2 User",
        userName: "shop2user",
        email: "shop2@test.com",
        password: "hashedpass",
        role: "employee",
        shopId: shop2._id,
        isActive: true,
      });

      const req = { user: superAdmin };
      await getUsersForSidebar(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const users = res.json.mock.calls[0][0];

      // Should include users from multiple shops
      const shop1Users = users.filter(
        (u) => u.shopId && u.shopId._id.toString() === shop1._id.toString()
      );
      const shop2Users = users.filter(
        (u) => u.shopId && u.shopId._id.toString() === shop2._id.toString()
      );

      expect(shop1Users.length).toBeGreaterThan(0);
      expect(shop2Users.length).toBeGreaterThan(0);
    });

    it("should return employees for warehouseman", async () => {
      const warehouseEmployee = await User.create({
        fullName: "Warehouse Employee",
        userName: "warehouseemp",
        email: "warehouseemp@test.com",
        password: "hashedpass",
        role: "employee",
        shopId: warehouse._id,
        isActive: true,
      });

      const req = { user: warehouseman };
      await getUsersForSidebar(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const users = res.json.mock.calls[0][0];

      // Should only see employees, admins, managers (not other warehousemen)
      users.forEach((user) => {
        expect(["employee", "admin", "manager"]).toContain(user.role);
      });
    });

    it("should include external shops for warehouseman with external requests", async () => {
      const externalEmployee = await User.create({
        fullName: "External Employee",
        userName: "externalemp",
        email: "external@test.com",
        password: "hashedpass",
        role: "employee",
        shopId: shop1._id,
        isActive: true,
      });

      // Create external request
      await Message.create({
        senderId: externalEmployee._id,
        receiverId: warehouseman._id,
        shopId: warehouse._id,
        isExternalRequest: true,
        targetWarehouseId: warehouse._id,
        messages: [{ ean: 123, naziv: "Test", qty: 1 }],
      });

      const req = { user: warehouseman };
      await getUsersForSidebar(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0];

      // Should include external shop
      const externalShop = results.find((r) => r.isExternalShop);
      expect(externalShop).toBeDefined();
      expect(externalShop.fullName).toBe("Shop One");
    });

    it("should not return inactive users", async () => {
      await User.create({
        fullName: "Inactive User",
        userName: "inactive",
        email: "inactive@test.com",
        password: "hashedpass",
        role: "employee",
        shopId: shop1._id,
        isActive: false,
      });

      const req = { user: admin };
      await getUsersForSidebar(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const users = res.json.mock.calls[0][0];

      const inactiveUser = users.find((u) => u.userName === "inactive");
      expect(inactiveUser).toBeUndefined();
    });
  });

  describe("getUsersForAdmin", () => {
    it("should return paginated users for admin", async () => {
      const req = {
        user: admin,
        query: { page: "1", limit: "10" },
      };

      await getUsersForAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];

      expect(response).toHaveProperty("users");
      expect(response).toHaveProperty("pagination");
      expect(response.pagination).toHaveProperty("currentPage", 1);
      expect(response.pagination).toHaveProperty("totalPages");
      expect(response.pagination).toHaveProperty("totalUsers");
    });

    it("should allow super_admin to filter by shop", async () => {
      const req = {
        user: superAdmin,
        query: { shopId: shop1._id.toString(), page: "1", limit: "10" },
      };

      await getUsersForAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];

      response.users.forEach((user) => {
        expect(user.shopId._id.toString()).toBe(shop1._id.toString());
      });
    });

    it("should include inactive users when requested", async () => {
      await User.create({
        fullName: "Inactive User",
        userName: "inactive2",
        email: "inactive2@test.com",
        password: "hashedpass",
        role: "employee",
        shopId: shop1._id,
        isActive: false,
      });

      const req = {
        user: admin,
        query: { includeInactive: "true", page: "1", limit: "10" },
      };

      await getUsersForAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];

      const inactiveUser = response.users.find(
        (u) => u.userName === "inactive2"
      );
      expect(inactiveUser).toBeDefined();
    });

    it("should reject non-admin access", async () => {
      const req = {
        user: employee,
        query: { page: "1", limit: "10" },
      };

      await getUsersForAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Insufficient permissions"),
        })
      );
    });

    it("should restrict admin to own shop only", async () => {
      const shop2Admin = await User.create({
        fullName: "Shop 2 Admin",
        userName: "shop2admin",
        email: "shop2admin@test.com",
        password: "hashedpass",
        role: "admin",
        shopId: shop2._id,
        isActive: true,
      });

      const req = {
        user: admin,
        query: { page: "1", limit: "10" },
      };

      await getUsersForAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];

      // Should not see shop2Admin
      const shop2User = response.users.find(
        (u) => u._id.toString() === shop2Admin._id.toString()
      );
      expect(shop2User).toBeUndefined();
    });
  });

  describe("getUserProfile", () => {
    it("should allow user to view own profile", async () => {
      const req = {
        user: employee,
        params: { userId: employee._id.toString() },
      };

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const user = res.json.mock.calls[0][0];
      expect(user._id.toString()).toBe(employee._id.toString());
      expect(user.password).toBeUndefined();
    });

    it("should allow super_admin to view any profile", async () => {
      const req = {
        user: superAdmin,
        params: { userId: employee._id.toString() },
      };

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const user = res.json.mock.calls[0][0];
      expect(user._id.toString()).toBe(employee._id.toString());
    });

    it("should allow viewing profiles within same shop", async () => {
      const req = {
        user: admin,
        params: { userId: employee._id.toString() },
      };

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should reject viewing profiles from different shops", async () => {
      const shop2User = await User.create({
        fullName: "Shop 2 User",
        userName: "shop2user",
        email: "shop2user@test.com",
        password: "hashedpass",
        role: "employee",
        shopId: shop2._id,
        isActive: true,
      });

      const req = {
        user: admin,
        params: { userId: shop2User._id.toString() },
      };

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Access denied" });
    });

    it("should return 404 for non-existent user", async () => {
      const req = {
        user: superAdmin,
        params: { userId: "507f1f77bcf86cd799439011" },
      };

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });
  });

  describe("updateUserRole", () => {
    it("should allow admin to update user role", async () => {
      const req = {
        user: admin,
        params: { userId: employee._id.toString() },
        body: {
          role: "manager",
          permissions: ["view_all_users"],
        },
      };

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "User role updated successfully",
          user: expect.objectContaining({
            role: "manager",
          }),
        })
      );

      const updatedUser = await User.findById(employee._id);
      expect(updatedUser.role).toBe("manager");
    });

    it("should allow super_admin to update any user role", async () => {
      const shop2User = await User.create({
        fullName: "Shop 2 User",
        userName: "shop2user",
        email: "shop2user@test.com",
        password: "hashedpass",
        role: "employee",
        shopId: shop2._id,
        isActive: true,
      });

      const req = {
        user: superAdmin,
        params: { userId: shop2User._id.toString() },
        body: {
          role: "admin",
          permissions: ["manage_users", "admin_panel"],
        },
      };

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const updatedUser = await User.findById(shop2User._id);
      expect(updatedUser.role).toBe("admin");
    });

    it("should reject non-admin from updating roles", async () => {
      const req = {
        user: employee,
        params: { userId: manager._id.toString() },
        body: { role: "admin" },
      };

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Insufficient permissions",
      });
    });

    it("should reject admin from updating users in different shops", async () => {
      const shop2User = await User.create({
        fullName: "Shop 2 User",
        userName: "shop2user",
        email: "shop2user@test.com",
        password: "hashedpass",
        role: "employee",
        shopId: shop2._id,
        isActive: true,
      });

      const req = {
        user: admin,
        params: { userId: shop2User._id.toString() },
        body: { role: "manager" },
      };

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Can only update users in your own shop",
      });
    });

    it("should return 404 for non-existent user", async () => {
      const req = {
        user: admin,
        params: { userId: "507f1f77bcf86cd799439011" },
        body: { role: "manager" },
      };

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });
  });

  describe("updateUser", () => {
    it("should allow user to update own profile", async () => {
      const req = {
        user: employee,
        params: { userId: employee._id.toString() },
        body: { fullName: "Updated Employee Name" },
      };

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const updatedUser = await User.findById(employee._id);
      expect(updatedUser.fullName).toBe("Updated Employee Name");
    });

    it("should automatically set permissions when role changes", async () => {
      const req = {
        user: admin,
        params: { userId: employee._id.toString() },
        body: { role: "warehouseman" },
      };

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const updatedUser = await User.findById(employee._id);
      expect(updatedUser.role).toBe("warehouseman");
      expect(updatedUser.permissions).toEqual(
        expect.arrayContaining([
          "receive_messages",
          "update_status",
          "view_employees",
          "send_messages",
        ])
      );
    });

    it("should prevent password updates through this endpoint", async () => {
      const req = {
        user: employee,
        params: { userId: employee._id.toString() },
        body: { password: "newpassword123" },
      };

      const originalPassword = employee.password;
      await updateUser(req, res);

      const updatedUser = await User.findById(employee._id);
      expect(updatedUser.password).toBe(originalPassword);
    });

    it("should prevent shopId changes", async () => {
      const req = {
        user: employee,
        params: { userId: employee._id.toString() },
        body: { shopId: shop2._id.toString() },
      };

      await updateUser(req, res);

      const updatedUser = await User.findById(employee._id);
      expect(updatedUser.shopId.toString()).toBe(shop1._id.toString());
    });

    it("should reject non-admin updating other users", async () => {
      const req = {
        user: employee,
        params: { userId: manager._id.toString() },
        body: { fullName: "Hacked" },
      };

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Insufficient permissions",
      });
    });
  });

  describe("deleteUser", () => {
    it("should allow admin to delete user in own shop", async () => {
      const req = {
        user: admin,
        params: { userId: employee._id.toString() },
      };

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User deleted successfully",
      });

      const deletedUser = await User.findById(employee._id);
      expect(deletedUser).toBeNull();
    });

    it("should allow super_admin to delete any user", async () => {
      const shop2User = await User.create({
        fullName: "Shop 2 User",
        userName: "shop2user",
        email: "shop2user@test.com",
        password: "hashedpass",
        role: "employee",
        shopId: shop2._id,
        isActive: true,
      });

      const req = {
        user: superAdmin,
        params: { userId: shop2User._id.toString() },
      };

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const deletedUser = await User.findById(shop2User._id);
      expect(deletedUser).toBeNull();
    });

    it("should prevent self-deletion", async () => {
      const req = {
        user: admin,
        params: { userId: admin._id.toString() },
      };

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Cannot delete your own account",
      });
    });

    it("should reject non-admin from deleting users", async () => {
      const req = {
        user: employee,
        params: { userId: manager._id.toString() },
      };

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Insufficient permissions",
      });
    });

    it("should reject admin from deleting users in different shops", async () => {
      const shop2User = await User.create({
        fullName: "Shop 2 User",
        userName: "shop2user",
        email: "shop2user@test.com",
        password: "hashedpass",
        role: "employee",
        shopId: shop2._id,
        isActive: true,
      });

      const req = {
        user: admin,
        params: { userId: shop2User._id.toString() },
      };

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Can only delete users in your own shop",
      });
    });
  });

  describe("reassignUserToShop", () => {
    it("should allow super_admin to reassign user to different shop", async () => {
      const req = {
        user: superAdmin,
        params: { userId: employee._id.toString() },
        body: { shopId: shop2._id.toString() },
      };

      await reassignUserToShop(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("reassigned to Shop Two"),
        })
      );

      const reassignedUser = await User.findById(employee._id);
      expect(reassignedUser.shopId.toString()).toBe(shop2._id.toString());
    });

    it("should reject non-super_admin from reassigning users", async () => {
      const req = {
        user: admin,
        params: { userId: employee._id.toString() },
        body: { shopId: shop2._id.toString() },
      };

      await reassignUserToShop(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Insufficient permissions",
      });
    });

    it("should reject reassignment to inactive shop", async () => {
      const inactiveShop = await Shop.create({
        name: "Inactive Shop",
        code: "IS1",
        isActive: false,
      });

      const req = {
        user: superAdmin,
        params: { userId: employee._id.toString() },
        body: { shopId: inactiveShop._id.toString() },
      };

      await reassignUserToShop(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Target shop is not active",
      });
    });

    it("should reject reassignment of super_admin users", async () => {
      const anotherSuperAdmin = await User.create({
        fullName: "Another Super Admin",
        userName: "superadmin2",
        email: "superadmin2@test.com",
        password: "hashedpass",
        role: "super_admin",
        shopId: shop1._id,
        isActive: true,
      });

      const req = {
        user: superAdmin,
        params: { userId: anotherSuperAdmin._id.toString() },
        body: { shopId: shop2._id.toString() },
      };

      await reassignUserToShop(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Cannot reassign super admin users",
      });
    });

    it("should return 404 for non-existent shop", async () => {
      const req = {
        user: superAdmin,
        params: { userId: employee._id.toString() },
        body: { shopId: "507f1f77bcf86cd799439011" },
      };

      await reassignUserToShop(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Target shop not found",
      });
    });

    it("should return 404 for non-existent user", async () => {
      const req = {
        user: superAdmin,
        params: { userId: "507f1f77bcf86cd799439011" },
        body: { shopId: shop2._id.toString() },
      };

      await reassignUserToShop(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "User not found",
      });
    });
  });
});
