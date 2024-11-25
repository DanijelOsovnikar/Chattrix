import User from "../models/user.model.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id.toString();
    let allUsers;

    if (
      loggedInUserId === "674303f38438fe8ab0a05c38" ||
      loggedInUserId === "67412f99c9e8d92cc7b7f7ed" ||
      loggedInUserId === "674498bf4bb9eaf2351c45b2" ||
      loggedInUserId === "67412fc1c9e8d92cc7b7f7f3" ||
      loggedInUserId === "67412fe4c9e8d92cc7b7f7fa"
    ) {
      allUsers = await User.find({ _id: { $ne: loggedInUserId } }).select(
        "-password"
      );
    } else {
      allUsers = await User.find({ _id: "67412fe4c9e8d92cc7b7f7fa" }).select(
        "-password"
      );
    }

    res.status(200).json(allUsers);
  } catch (error) {
    console.log("Error in getUsersForSidebar", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
