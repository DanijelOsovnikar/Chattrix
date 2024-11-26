import User from "../models/user.model.js";

export const deleteSub = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  user.pushSubscription = {};

  await user.save();

  console.log("delete user push notification", user);

  res.status(200).json({ message: "Notifikacije iskljucene!" });
};
