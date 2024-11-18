import mongoose from "mongoose";

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
    ean: {
      type: Number,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    sava: {
      type: Boolean,
      required: true,
    },
    toPack: {
      type: Boolean,
      required: true,
    },
    rez: {
      type: Boolean,
      required: true,
    },
    sellerId: {
      type: String,
      required: true,
    },
    buyer: {
      type: String,
      required: true,
    },
    opened: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
