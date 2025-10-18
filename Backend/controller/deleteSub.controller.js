import User from "../models/user.model.js";

export const deleteSub = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    // Only allow users to delete their own subscription, or admins to delete any subscription
    if (
      id !== requestingUser._id.toString() &&
      !["admin", "super_admin"].includes(requestingUser.role)
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this subscription" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Clear the push subscription
    user.pushSubscription = {};
    await user.save();

    // console.log("delete user push notification", user);

    res
      .status(200)
      .json({ message: "Push notifications disabled successfully!" });
  } catch (error) {
    console.error("Error deleting push subscription:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
