import Conversation from "../models/conversation.js";
import Message from "../models/message.js";

export const sendMessage = async (req, res) => {
  try {
    const { ean, productName, sava, toPack, sellerId } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id.toString();

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        messages: [],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      ean,
      productName,
      sava,
      toPack,
      sellerId,
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    //Socket.io func

    await Promise.all([conversation.save(), newMessage.save()]);

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller", error);
    res.status(500).json({ error: "Internal server error!" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id.toString();

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    }).populate("messages");

    if (!conversation) return res.status(200).json([]);

    const messages = conversation.messages;

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller", error);
    res.status(500).json({ error: "Internal server error!" });
  }
};
