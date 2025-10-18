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
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    role: {
      type: String,
      enum: [
        "admin",
        "manager",
        "employee",
        "warehouseman",
        "warehouse",
        "super_admin",
      ],
      default: "employee",
    },
    permissions: [
      {
        type: String,
        enum: [
          "view_all_users",
          "manage_users",
          "send_messages",
          "receive_messages",
          "update_status",
          "view_employees",
          "admin_panel",
          "manage_shops",
          "view_cross_shop",
        ],
      },
    ],
    groupMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pushSubscription: {
      endpoint: { type: String },
      expirationTime: { type: Date, default: null },
      keys: {
        p256dh: { type: String },
        auth: { type: String },
      },
    },
    gigaId: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notificationPreferences: {
      itemReady: {
        type: Boolean,
        default: false,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
      browserNotifications: {
        type: Boolean,
        default: true,
      },
      toastNotifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
userSchema.index({ shopId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ userName: 1 });
userSchema.index({ shopId: 1, role: 1 });

const User = mongoose.model("User", userSchema);

export default User;
