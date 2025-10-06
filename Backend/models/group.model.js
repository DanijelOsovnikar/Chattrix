import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isGlobal: {
      type: Boolean,
      default: false, // For cross-shop groups
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for better performance
GroupSchema.index({ shopId: 1 });
GroupSchema.index({ shopId: 1, isActive: 1 });

const Group = mongoose.model("Group", GroupSchema);

export default Group;
