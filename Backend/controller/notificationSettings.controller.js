import User from "../models/user.model.js";

// Get user notification preferences
export const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    // Only super_admin and admin can view other users' preferences
    if (
      userId !== req.user._id.toString() &&
      !["super_admin", "admin"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to view these preferences" });
    }

    const user = await User.findById(userId).select(
      "notificationPreferences fullName"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      userId: user._id,
      fullName: user.fullName,
      notificationPreferences: user.notificationPreferences || {
        itemReady: false,
        pushNotifications: true,
        browserNotifications: true,
        toastNotifications: true,
      },
    });
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update user notification preferences
export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { notificationPreferences } = req.body;

    // Only super_admin and admin can update other users' preferences
    if (
      userId !== req.user._id.toString() &&
      !["super_admin", "admin"].includes(req.user.role)
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to update these preferences" });
    }

    // Validate notification preferences structure
    const validKeys = [
      "itemReady",
      "pushNotifications",
      "browserNotifications",
      "toastNotifications",
    ];
    const filteredPreferences = {};

    for (const key of validKeys) {
      if (notificationPreferences.hasOwnProperty(key)) {
        filteredPreferences[key] = Boolean(notificationPreferences[key]);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { notificationPreferences: filteredPreferences } },
      { new: true, runValidators: true }
    ).select("notificationPreferences fullName");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Notification preferences updated successfully",
      userId: updatedUser._id,
      fullName: updatedUser.fullName,
      notificationPreferences: updatedUser.notificationPreferences,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all users with their notification preferences (admin only)
export const getAllUsersNotificationPreferences = async (req, res) => {
  try {
    // Only super_admin and admin can view all users
    if (!["super_admin", "admin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Not authorized to view all user preferences" });
    }

    let query = {};

    // If admin (not super_admin), only show users from their shop
    if (req.user.role === "admin") {
      query = { shopId: req.user.shopId };
    }

    const users = await User.find(query)
      .select("fullName role notificationPreferences isActive")
      .populate("shopId", "name")
      .sort({ fullName: 1 });

    const usersWithPreferences = users.map((user) => ({
      _id: user._id,
      fullName: user.fullName,
      role: user.role,
      shopName: user.shopId?.name,
      isActive: user.isActive,
      notificationPreferences: user.notificationPreferences || {
        itemReady: false,
        pushNotifications: true,
        browserNotifications: true,
        toastNotifications: true,
      },
    }));

    res.status(200).json(usersWithPreferences);
  } catch (error) {
    console.error("Error getting all users notification preferences:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
