import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

// Change password - role-based permissions
export const changePassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const requesterId = req.user._id.toString();
    const requesterRole = req.user.role;

    // Validate input
    if (!userId || !newPassword) {
      return res
        .status(400)
        .json({ error: "User ID and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // Find the target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Role-based permission check
    const canChangePassword = checkPasswordChangePermission(
      requesterRole,
      targetUser.role,
      requesterId,
      userId
    );

    if (!canChangePassword) {
      return res.status(403).json({
        error: "You don't have permission to change this user's password",
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    res.status(200).json({
      message: "Password updated successfully",
      changedFor: targetUser.fullName,
    });
  } catch (error) {
    console.log("Error in changePassword controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function to check password change permissions
function checkPasswordChangePermission(
  requesterRole,
  targetRole,
  requesterId,
  targetId
) {
  // Super admin can change passwords for themselves, admins, and managers only
  if (requesterRole === "super_admin") {
    // Can change own password
    if (requesterId === targetId) {
      return true;
    }
    // Can change admin and manager passwords only
    if (targetRole === "admin" || targetRole === "manager") {
      return true;
    }
    return false;
  }

  // Admin can change their own password and employees/warehousemen/cashiers/managers passwords
  if (requesterRole === "admin") {
    // Can change own password
    if (requesterId === targetId) {
      return true;
    }
    // Can change employee, warehouseman, cashier, and manager passwords
    if (
      targetRole === "employee" ||
      targetRole === "warehouseman" ||
      targetRole === "cashier" ||
      targetRole === "manager"
    ) {
      return true;
    }
    return false;
  }

  // Manager can only change their own password
  if (requesterRole === "manager") {
    return requesterId === targetId;
  }

  // Employees, cashiers, and warehousemen cannot change passwords (including their own)
  if (
    requesterRole === "employee" ||
    requesterRole === "warehouseman" ||
    requesterRole === "cashier"
  ) {
    return false;
  }

  return false;
}

// Get users that current user can change passwords for
export const getUsersForPasswordChange = async (req, res) => {
  try {
    const requesterId = req.user._id.toString();
    const requesterRole = req.user.role;
    const requesterShopId = req.user.shopId;

    let users = [];

    if (requesterRole === "super_admin") {
      // Super admin can change passwords for themselves, admins, and managers only
      users = await User.find({
        $or: [
          { _id: requesterId }, // Their own account
          { role: "admin" }, // All admins
          { role: "manager" }, // All managers
        ],
      })
        .select("_id fullName role shopId")
        .populate("shopId", "name");
      console.log("Super admin - found users:", users.length); // Debug log
    } else if (requesterRole === "admin") {
      // Admin can change passwords for themselves, employees, warehousemen, cashiers, and managers in their shop
      users = await User.find({
        $or: [
          { _id: requesterId }, // Their own account
          {
            shopId: requesterShopId,
            role: { $in: ["employee", "warehouseman", "cashier", "manager"] },
          },
        ],
      })
        .select("_id fullName role shopId")
        .populate("shopId", "name");
      console.log("Admin - found users:", users.length); // Debug log
    } else if (requesterRole === "manager") {
      // Manager can only change their own password
      users = await User.find({ _id: requesterId })
        .select("_id fullName role shopId")
        .populate("shopId", "name");
      console.log("Manager - found users:", users.length); // Debug log
    }
    // Employees and warehousemen get empty array (no permissions)

    console.log("Final users to return:", users); // Debug log
    res.status(200).json(users);
  } catch (error) {
    console.log("Error in getUsersForPasswordChange controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
