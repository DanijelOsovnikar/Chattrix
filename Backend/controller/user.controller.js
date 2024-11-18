import User from "../models/user.model.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id.toString();
    let allUsers;

    if (loggedInUserId === "673aa2e7057cb592aa796c96") {
      allUsers = await User.find({ _id: { $ne: loggedInUserId } }).select(
        "-password"
      );
    } else {
      allUsers = await User.find({ _id: "673aa2e7057cb592aa796c96" }).select(
        "-password"
      );
    }

    res.status(200).json(allUsers);
  } catch (error) {
    console.log("Error in getUsersForSidebar", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
