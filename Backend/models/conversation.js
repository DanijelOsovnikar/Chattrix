import mongoose from "mongoose";

const convrsationSchema = new mongoose.Schema(
  {
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    messages: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Message",
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for better performance
convrsationSchema.index({ participants: 1 });
convrsationSchema.index({ shopId: 1 });
convrsationSchema.index({ shopId: 1, participants: 1 });

const Conversation = mongoose.model("Conversation", convrsationSchema);

export default Conversation;
