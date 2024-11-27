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
    messages: {
      type: [ProductListSchema],
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
    web: {
      type: String,
    },
    savaGodine: {
      type: String,
    },
    gigaId: {
      type: Number,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
