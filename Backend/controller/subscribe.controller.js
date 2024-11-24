import User from "../models/user.model.js";

export const subscribe = async (req, res) => {
  const subscription = req.body;
  const { id: userId } = req.params;

  const user = await User.findByIdAndUpdate(userId, {
    pushSubscription: subscription,
  });

  console.log(user);

  res.status(201).json({ message: "Subscription saved!" });
};
