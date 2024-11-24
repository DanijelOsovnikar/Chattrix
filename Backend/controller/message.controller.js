import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import User from "../models/user.model.js";
import webPush from "web-push";

// export const sendMessage = async (req, res) => {
//   try {
//     const { ean, productName, sava, toPack, sellerId, rez, buyer, opened } =
//       req.body;
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id.toString();

//     // Get Socket.IO instance
//     const io = req.io;

//     // Find receiver's group
//     const receiver = await User.findById(receiverId);
//     if (!receiver) {
//       return res.status(404).json({ message: "Receiver not found" });
//     }

//     // Fetch group members (including the receiver)
//     const groupMembers = await User.find({
//       _id: { $in: [...receiver.groupMembers, receiver._id] },
//     });

//     // Check for no members in the group
//     if (groupMembers.length === 0) {
//       return res.status(400).json({ message: "No members in the group" });
//     }

//     // Create a single message for the group
//     const newMessage = new Message({
//       senderId,
//       receiverId: receiver._id, // Group is treated as the receiver
//       ean,
//       productName,
//       sava,
//       toPack,
//       sellerId,
//       rez,
//       buyer,
//       opened,
//     });

//     // Save the message to the database
//     await newMessage.save();

//     // Save the message in conversations for all members
//     for (const member of groupMembers) {
//       let conversation = await Conversation.findOne({
//         participants: { $all: [senderId, member._id] },
//       });

//       if (!conversation) {
//         conversation = await Conversation.create({
//           participants: [senderId, member._id],
//           messages: [],
//         });
//       }

//       conversation.messages.push(newMessage._id);
//       await conversation.save();
//     }

//     const publicVapidKey =
//       "BEvmu6KRMuMBPD7xWEYeTQvOfw-TNTns8R0xifdmq1Y89gJql2-W_17TvHGU6HnusR4SlQqvMgbY8d--FUHvc4w";
//     const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

//     const settings = {
//       web: {
//         vapidDetails: {
//           subject: "mailto: <danijel.osovnikar@gmail.com>",
//           publicKey: publicVapidKey,
//           privateKey: privateVapidKey,
//         },
//         gcmAPIKey: "gcmkey",
//         TTL: 2419200,
//         contentEncoding: "aes128gcm",
//         headers: {},
//       },
//       isAlwaysUseFCM: false,
//     };

//     const push = new PushNotifications(settings);

//     const payload = { title: "Notification from Knock" };

//     push.send(subscription, payload, (err, result) => {
//       if (err) {
//         console.log(err);
//       } else {
//         console.log(result);
//       }
//     });

//     // Emit the message to all group members using a Socket.IO room
//     const groupRoom = `group_${receiver._id}`;
//     io.to(groupRoom).emit("newMessage", newMessage);

//     res
//       .status(200)
//       .json({ messageCLG: "Message sent to group", message: newMessage });
//   } catch (error) {
//     console.error("Error in sendMessage controller", error);
//     res.status(500).json({ error: "Internal server error!" });
//   }
// };

export const sendMessage = async (req, res) => {
  try {
    const {
      ean,
      productName,
      sava,
      toPack,
      sellerId,
      rez,
      buyer,
      opened,
      web,
      savaGodine,
    } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id.toString();

    // Get Socket.IO instance
    const io = req.io;

    // Find receiver's group
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Fetch group members (including the receiver)
    const groupMembers = await User.find({
      _id: { $in: [...receiver.groupMembers, receiver._id] },
    });

    // Check for no members in the group
    if (groupMembers.length === 0) {
      return res.status(400).json({ message: "No members in the group" });
    }

    // Create a single message for the group
    const newMessage = new Message({
      senderId,
      receiverId: receiver._id, // Group is treated as the receiver
      ean,
      productName,
      sava,
      toPack,
      sellerId,
      rez,
      buyer,
      opened,
      web,
      savaGodine,
    });

    // Save the message to the database
    await newMessage.save();

    // Save the message in conversations for all members
    for (const member of groupMembers) {
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, member._id] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, member._id],
          messages: [],
        });
      }

      conversation.messages.push(newMessage._id);
      await conversation.save();

      // Check if the member has a push subscription
      if (member.pushSubscription) {
        const subscription = member.pushSubscription;

        if (subscription.keys.p256dh !== undefined) {
          webPush.setVapidDetails(
            "mailto:danijel.osovnikar@gmail.com",
            process.env.PUBLIC_VAPID_KEY,
            process.env.PRIVATE_VAPID_KEY
          );

          const payload = JSON.stringify({
            title: `From ${sellerId}`,
            body: newMessage.productName, // Customize this to your needs
            icon: "path_to_icon_or_image", // Optional icon
          });

          // Send push notification
          try {
            const result = await webPush.sendNotification(
              subscription,
              payload
            );
            console.log("Push notification sent:", result);
          } catch (err) {
            console.error("Push notification error:", err);
          }
        }
      }
    }

    // Emit the message to all group members using a Socket.IO room
    const groupRoom = "group_67412fe4c9e8d92cc7b7f7fa";
    io.to(groupRoom).emit("newMessage", newMessage);

    res
      .status(200)
      .json({ message: "Message sent to group", message: newMessage });
  } catch (error) {
    console.error("Error in sendMessage controller", error);
    res.status(500).json({ error: "Internal server error!" });
  }
};

export const checkedMessage = async (req, res) => {
  try {
    const { messId: messageId } = req.params;

    let message = await Message.findOneAndUpdate(
      { _id: messageId },
      { opened: true }
    );

    res.status(201).json(message);
  } catch (error) {
    console.log(error);
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
