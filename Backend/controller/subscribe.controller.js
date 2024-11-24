import User from "../models/user.model.js";

export const subscribe = async (req, res) => {
  const subscription = req.body;
  const { id: userId } = req.params;

  console.log(subscription.subscription.expirationTime);

  const user = await User.findByIdAndUpdate(userId, {
    pushSubscription: subscription.subscription,
  });

  res.status(201).json({ message: "Subscription saved!" });
};
