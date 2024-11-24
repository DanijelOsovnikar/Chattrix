import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minLenght: 6,
    },
    groupMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pushSubscription: {
      endpoint: { type: String },
      expirationTime: { type: Date, default: null },
      keys: {
        p256dh: { type: String },
        auth: { type: String },
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
