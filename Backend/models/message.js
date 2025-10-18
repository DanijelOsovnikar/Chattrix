import mongoose from "mongoose";

const ProductListSchema = new mongoose.Schema({
  ean: {
    type: Number,
  },
  naziv: {
    type: String,
  },
  qty: {
    type: Number,
    default: 1,
  },
  pack: {
    type: Boolean,
    default: false,
  },
  web: {
    type: String,
    default: "",
  },
  rez: {
    type: Boolean,
    default: false,
  },
});

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    messages: {
      type: [ProductListSchema],
    },
    sava: {
      type: Boolean,
    },
    sellerId: {
      type: String,
    },
    senderUsername: {
      type: String,
    },
    buyer: {
      type: String,
    },
    buyerName: {
      type: String,
    },
    opened: {
      type: Boolean,
    },
    savaGodine: {
      type: String,
    },
    gigaId: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    warehousemanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
messageSchema.index({ shopId: 1 });
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ shopId: 1, receiverId: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
