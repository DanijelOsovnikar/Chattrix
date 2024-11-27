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
    },
    toPack: {
      type: Boolean,
    },
    rez: {
      type: Boolean,
    },
    sellerId: {
      type: String,
    },
    buyer: {
      type: String,
    },
    opened: {
      type: Boolean,
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
