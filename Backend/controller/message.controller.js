import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import User from "../models/user.model.js";
import webPush from "web-push";
import { getUserSocketMap } from "../socket/socket.js";

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

// Handle warehouse message distribution to all warehousemen
export const sendMessage = async (req, res) => {
  try {
    const {
      messages,
      sava,
      sellerId,
      senderUsername,
      buyer,
      buyerName,
      opened,
      savaGodine,
    } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id.toString();
    const senderShopId = req.user.shopId;

    // Get Socket.IO instance
    const io = req.io;

    //Find sender gigaId
    let senderGigaId;

    // Handle case where message is sent on behalf of another user
    if (senderId === "674153445f75cb5dff31fcff") {
      senderGigaId = await User.findOne({
        fullName: sellerId,
        shopId: senderShopId, // Ensure we find user in same shop
      });
    } else {
      senderGigaId = await User.findById(senderId);
    }

    if (!senderGigaId) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // Find receiver first to check if it's a warehouse user
    const receiver = await User.findById(receiverId).populate("shopId");
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // console.log(
    //   `🎯 Message from ${req.user.role}(${req.user.fullName}) to ${receiver.role}(${receiver.fullName})`
    // );

    // Check if this is a message to warehouse user (should be forwarded to warehousemen)
    if (
      receiver.role === "warehouse" &&
      ["employee", "admin", "manager"].includes(req.user.role)
    ) {
      // console.log(
      //   `🏭 WAREHOUSE REQUEST DETECTED - Forwarding to warehousemen...`
      // );
      // Create message for the warehouse user first
      const warehouseMessage = new Message({
        senderId,
        receiverId: receiver._id,
        shopId: receiver.shopId._id,
        messages,
        sava,
        sellerId,
        senderUsername,
        buyer,
        buyerName,
        opened,
        savaGodine,
        gigaId: senderGigaId.gigaId,
      });

      await warehouseMessage.save();

      // Create conversation with warehouse user
      let warehouseConversation = await Conversation.findOne({
        participants: { $all: [senderId, receiver._id] },
        shopId: receiver.shopId._id,
      });

      if (!warehouseConversation) {
        warehouseConversation = await Conversation.create({
          participants: [senderId, receiver._id],
          shopId: receiver.shopId._id,
          messages: [],
        });
      }

      warehouseConversation.messages.push(warehouseMessage._id);
      await warehouseConversation.save();

      // Forward to all warehousemen in the same shop
      const warehousemen = await User.find({
        shopId: receiver.shopId._id,
        role: "warehouseman",
        isActive: true,
      });

      // console.log(
      //   `📦 Forwarding warehouse request to ${warehousemen.length} warehousemen in shop ${receiver.shopId.name}`
      // );

      if (warehousemen.length === 0) {
        // console.log(
        //   `⚠️ No active warehousemen found in shop ${receiver.shopId.name}`
        // );
      }

      // Create forwarded messages for each warehouseman
      for (const warehouseman of warehousemen) {
        // console.log(
        //   `📤 Creating forwarded message for warehouseman: ${
        //     warehouseman.fullName || warehouseman._id
        //   }`
        // );
        const forwardedMessage = new Message({
          senderId,
          receiverId: warehouseman._id,
          shopId: receiver.shopId._id,
          messages,
          sava,
          sellerId,
          senderUsername,
          buyer,
          buyerName,
          opened,
          savaGodine,
          gigaId: senderGigaId.gigaId,
          status: "pending", // Mark as warehouse request
        });

        await forwardedMessage.save();

        // Create or update conversation with warehouseman
        let conversation = await Conversation.findOne({
          participants: { $all: [senderId, warehouseman._id] },
          shopId: receiver.shopId._id,
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [senderId, warehouseman._id],
            shopId: receiver.shopId._id,
            messages: [],
          });
        }

        conversation.messages.push(forwardedMessage._id);
        await conversation.save();

        // Populate the forwarded message before emitting
        const populatedForwardedMessage = await Message.findById(
          forwardedMessage._id
        )
          .populate("senderId", "fullName shopId")
          .populate("receiverId", "fullName shopId");

        // Emit socket event to warehouseman (ALWAYS emit - no preference check for warehouse requests)
        const userSocketMap = getUserSocketMap();
        const warehousemanSockets = userSocketMap[warehouseman._id];
        if (warehousemanSockets && warehousemanSockets.length > 0) {
          warehousemanSockets.forEach((socketInfo) => {
            // console.log(
            //   `🚀 Emitting warehouse request to ${
            //     warehouseman.fullName || warehouseman._id
            //   } on socket: ${socketInfo.socketId}`
            // );
            io.to(socketInfo.socketId).emit(
              "newMessage",
              populatedForwardedMessage
            );
          });
        } else {
          // console.log(
          //   `❌ No socket found for warehouseman: ${
          //     warehouseman.fullName || warehouseman._id
          //   }`
          // );
        }

        // Send push notification to warehouseman (ALWAYS send - no preference check for warehouse requests)
        if (warehouseman.pushSubscription) {
          webPush.setVapidDetails(
            "mailto:danijel.osovnikar@gmail.com",
            process.env.PUBLIC_VAPID_KEY,
            process.env.PRIVATE_VAPID_KEY
          );

          const payload = JSON.stringify({
            title: `New warehouse request from ${req.user.fullName}`,
            body:
              messages?.length > 0
                ? `${messages.length} items requested`
                : "New warehouse request",
            icon: "/react.svg",
            badge: "/react.svg",
          });

          try {
            await webPush.sendNotification(
              warehouseman.pushSubscription,
              payload
            );
            // console.log(
            //   `✅ Warehouse notification sent to ${
            //     warehouseman.fullName || warehouseman._id
            //   }`
            // );
          } catch (pushError) {
            console.error("❌ Warehouse push notification failed:", pushError);
          }
        } else {
          // console.log(
          //   `⚠️ No push subscription for warehouseman: ${
          //     warehouseman.fullName || warehouseman._id
          //   }`
          // );
        }
      }

      // Return the warehouse message to the frontend
      const populatedMessage = await Message.findById(warehouseMessage._id)
        .populate("senderId", "fullName shopId")
        .populate("receiverId", "fullName shopId");

      // Emit socket event to warehouse user (for employees viewing warehouse conversation)
      const userSocketMap = getUserSocketMap();
      const warehouseSockets = userSocketMap[receiver._id];
      if (warehouseSockets && warehouseSockets.length > 0) {
        warehouseSockets.forEach((socketInfo) => {
          io.to(socketInfo.socketId).emit("newMessage", populatedMessage);
        });
      }

      return res.status(201).json({ message: populatedMessage });
    }

    // Check shop permissions
    const senderShop = await User.findById(senderId).populate("shopId");
    const canSendCrossShop =
      senderShop.shopId._id.toString() === receiver.shopId._id.toString() ||
      receiver.shopId.settings?.allowCrossShopCommunication ||
      req.user.role === "super_admin";

    if (!canSendCrossShop) {
      return res.status(403).json({
        message: "Cross-shop communication not allowed",
      });
    }

    // Fetch group members (including the receiver)
    const groupMembers = await User.find({
      _id: { $in: [...receiver.groupMembers, receiver._id] },
      shopId: receiver.shopId._id, // Ensure group members are from same shop
      isActive: true,
    });

    // Check for no members in the group
    if (groupMembers.length === 0) {
      return res.status(400).json({ message: "No members in the group" });
    }

    // Create a single message for the group
    const newMessage = new Message({
      senderId,
      receiverId: receiver._id,
      shopId: receiver.shopId._id, // Use receiver's shop for the message
      messages,
      sava,
      sellerId,
      senderUsername,
      buyer,
      buyerName,
      opened,
      savaGodine,
      gigaId: senderGigaId.gigaId,
    });

    // console.log(newMessage);
    // Save the message to the database
    await newMessage.save();

    // Save the message in conversations for all members
    for (const member of groupMembers) {
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, member._id] },
        shopId: receiver.shopId._id,
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, member._id],
          shopId: receiver.shopId._id,
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
            title: `Ean: ${newMessage.messages[0].ean}`,
            body: newMessage.messages[0].naziv,
            icon: "path_to_icon_or_image",
            senderId: newMessage.senderId.toString(),
            senderName: req.user.fullName,
          });

          // Send push notification
          try {
            const result = await webPush.sendNotification(
              subscription,
              payload
            );
            // console.log("Push notification sent:", result);
          } catch (err) {
            console.error("Push notification error:", err);
          }
        }
      }
    }

    // Emit the message to shop-specific room
    const groupRoom = `shop_${receiver.shopId._id}_group_${receiver._id}`;
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
      { opened: true },
      { new: true }
    ).populate("senderId", "fullName pushSubscription notificationPreferences");

    // Send notification to the employee who sent the request
    if (message && message.senderId) {
      // console.log("🔔 Sending item ready notification for message:", messageId);
      // console.log("📧 Sender ID:", message.senderId._id);
      // console.log(
      //   "⚙️ Notification preferences:",
      //   message.senderId.notificationPreferences
      // );

      // Check if user wants to receive item ready notifications
      const wantsItemReadyNotifications =
        message.senderId.notificationPreferences?.itemReady !== false;

      if (!wantsItemReadyNotifications) {
        // console.log(
        //   "🔕 User has disabled item ready notifications, skipping..."
        // );
        res.status(201).json(message);
        return;
      }

      // Get Socket.IO instance
      const io = req.io;

      // Send real-time notification via socket (if toast notifications enabled)
      const wantsToastNotifications =
        message.senderId.notificationPreferences?.toastNotifications !== false;

      if (wantsToastNotifications) {
        const userSocketMap = getUserSocketMap();
        // console.log("🌐 Current user socket map:", Object.keys(userSocketMap));

        const senderSockets = userSocketMap[message.senderId._id];
        // console.log("📱 Sender sockets:", senderSockets);

        if (senderSockets && senderSockets.length > 0) {
          senderSockets.forEach((socketInfo) => {
            // console.log(
            //   "🚀 Emitting itemReady to socket:",
            //   socketInfo.socketId
            // );
            io.to(socketInfo.socketId).emit("itemReady", {
              messageId: message._id,
              status: "ready",
              message:
                "Your item(s) are ready and will be delivered to the cashier",
              timestamp: new Date(),
            });
          });
        } else {
          // console.log(
          //   "❌ No sockets found for sender ID:",
          //   message.senderId._id
          // );
        }
      } else {
        // console.log(
        //   "🔕 User has disabled toast notifications, skipping socket emission..."
        // );
      }

      // Send push notification
      const wantsPushNotifications =
        message.senderId.notificationPreferences?.pushNotifications !== false;

      if (message.senderId.pushSubscription && wantsPushNotifications) {
        webPush.setVapidDetails(
          "mailto:danijel.osovnikar@gmail.com",
          process.env.PUBLIC_VAPID_KEY,
          process.env.PRIVATE_VAPID_KEY
        );

        const payload = JSON.stringify({
          title: "Items Ready for Pickup",
          body: "Your item(s) are ready and will be delivered to the cashier",
          icon: "/react.svg",
          badge: "/react.svg",
        });

        try {
          await webPush.sendNotification(
            message.senderId.pushSubscription,
            payload
          );
          // console.log("Push notification sent for checked message");
        } catch (pushError) {
          console.error("Push notification failed:", pushError);
        }
      } else {
        // console.log("🔕 Push notifications disabled or no subscription");
      }
    }

    // Real-time sync: Notify all warehousemen in the same shop about the checkbox change
    const io = req.io;
    const warehousemen = await User.find({
      shopId: req.user.shopId,
      role: "warehouseman",
      isActive: true,
      _id: { $ne: req.user._id }, // Exclude the current user who made the change
    });

    const userSocketMap = getUserSocketMap();

    warehousemen.forEach((warehouseman) => {
      const warehousemanSockets = userSocketMap[warehouseman._id];
      if (warehousemanSockets && warehousemanSockets.length > 0) {
        warehousemanSockets.forEach((socketInfo) => {
          io.to(socketInfo.socketId).emit("messageStatusSync", {
            messageId: message._id,
            opened: true,
            updatedBy: req.user.fullName,
            timestamp: new Date(),
          });
        });
      }
    });

    res.status(201).json(message);
  } catch (error) {
    // console.log("Error in checkedMessage controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const uncheckMessage = async (req, res) => {
  try {
    const { messId: messageId } = req.params;

    let message = await Message.findOneAndUpdate(
      { _id: messageId },
      { opened: false },
      { new: true }
    ).populate("senderId", "fullName pushSubscription notificationPreferences");

    // Send notification to the employee who sent the request
    if (message && message.senderId) {
      // console.log(
      //   "🔔 Sending item not ready notification for message:",
      //   messageId
      // );

      // Check if user wants to receive item ready notifications
      const wantsItemReadyNotifications =
        message.senderId.notificationPreferences?.itemReady !== false;

      if (!wantsItemReadyNotifications) {
        // console.log(
        //   "🔕 User has disabled item ready notifications, skipping..."
        // );
        res.status(201).json(message);
        return;
      }

      // Get Socket.IO instance
      const io = req.io;

      // Send real-time notification via socket (if toast notifications enabled)
      const wantsToastNotifications =
        message.senderId.notificationPreferences?.toastNotifications !== false;

      if (wantsToastNotifications) {
        const userSocketMap = getUserSocketMap();
        const senderSockets = userSocketMap[message.senderId._id];
        if (senderSockets && senderSockets.length > 0) {
          senderSockets.forEach((socketInfo) => {
            io.to(socketInfo.socketId).emit("itemNotReady", {
              messageId: message._id,
              status: "not_ready",
              message: "Your item(s) status has been updated to not ready",
              timestamp: new Date(),
            });
          });
        }
      } else {
        // console.log(
        //   "🔕 User has disabled toast notifications, skipping socket emission..."
        // );
      }

      // Send push notification
      const wantsPushNotifications =
        message.senderId.notificationPreferences?.pushNotifications !== false;

      if (message.senderId.pushSubscription && wantsPushNotifications) {
        webPush.setVapidDetails(
          "mailto:danijel.osovnikar@gmail.com",
          process.env.PUBLIC_VAPID_KEY,
          process.env.PRIVATE_VAPID_KEY
        );

        const payload = JSON.stringify({
          title: "Item Status Updated",
          body: "Your item(s) status has been updated to not ready",
          icon: "/react.svg",
          badge: "/react.svg",
        });

        try {
          await webPush.sendNotification(
            message.senderId.pushSubscription,
            payload
          );
          // console.log("Push notification sent for unchecked message");
        } catch (pushError) {
          console.error("Push notification failed:", pushError);
        }
      } else {
        // console.log("🔕 Push notifications disabled or no subscription");
      }
    }

    // Real-time sync: Notify all warehousemen in the same shop about the checkbox change
    const io = req.io;
    const warehousemen = await User.find({
      shopId: req.user.shopId,
      role: "warehouseman",
      isActive: true,
      _id: { $ne: req.user._id }, // Exclude the current user who made the change
    });

    const userSocketMap = getUserSocketMap();

    warehousemen.forEach((warehouseman) => {
      const warehousemanSockets = userSocketMap[warehouseman._id];
      if (warehousemanSockets && warehousemanSockets.length > 0) {
        warehousemanSockets.forEach((socketInfo) => {
          io.to(socketInfo.socketId).emit("messageStatusSync", {
            messageId: message._id,
            opened: false,
            updatedBy: req.user.fullName,
            timestamp: new Date(),
          });
        });
      }
    });

    res.status(201).json(message);
  } catch (error) {
    // console.log("Error in uncheckMessage controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id.toString();

    // Validate that both users exist and check shop permissions
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(userToChatId),
    ]);

    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if users can communicate (same shop or cross-shop allowed)
    const canCommunicate =
      sender.shopId.toString() === receiver.shopId.toString() ||
      req.user.role === "super_admin";

    if (!canCommunicate) {
      return res
        .status(403)
        .json({ error: "Cross-shop communication not allowed" });
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
      shopId: receiver.shopId, // Ensure conversation is in correct shop context
    }).populate({
      path: "messages",
      populate: {
        path: "senderId receiverId",
        select: "fullName shopId",
      },
    });

    if (!conversation) return res.status(200).json([]);

    const messages = conversation.messages;

    res.status(200).json(messages);
  } catch (error) {
    // console.log("Error in getMessages controller", error);
    res.status(500).json({ error: "Internal server error!" });
  }
};

// Update message status - only for warehousemen
export const updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    // Only warehousemen can update message status
    if (req.user.role !== "warehouseman") {
      return res.status(403).json({
        error: "Only warehousemen can update message status",
      });
    }

    // Validate status
    const validStatuses = ["pending", "in_progress", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be: pending, in_progress, or completed",
      });
    }

    // Find and update the message
    const message = await Message.findOne({
      _id: messageId,
      receiverId: userId, // Warehouseman can only update messages sent to them
      shopId: req.user.shopId, // Ensure message is in warehouseman's shop
    });

    if (!message) {
      return res.status(404).json({
        error: "Message not found or you don't have permission to update it",
      });
    }

    // Update message status and assign warehouseman
    message.status = status;
    message.warehousemanId = userId;
    await message.save();

    // Get Socket.IO instance and notify the original sender
    const io = req.io;
    const senderSocketId = global.userSocketMap?.[message.senderId];

    if (senderSocketId) {
      io.to(senderSocketId).emit("statusUpdate", {
        messageId: message._id,
        status: status,
        warehousemanName: req.user.fullName,
        timestamp: new Date(),
      });
    }

    // Send push notification to original sender if status is completed
    if (status === "completed") {
      const sender = await User.findById(message.senderId);
      if (sender?.pushSubscription) {
        const payload = JSON.stringify({
          title: "Order Completed",
          body: `Your warehouse request has been completed by ${req.user.fullName}`,
          icon: "/react.svg",
          badge: "/react.svg",
        });

        try {
          await webPush.sendNotification(sender.pushSubscription, payload);
        } catch (pushError) {
          console.error("Push notification failed:", pushError);
        }
      }
    }

    res.status(200).json({
      message: "Status updated successfully",
      messageId: message._id,
      status: message.status,
      warehousemanName: req.user.fullName,
    });
  } catch (error) {
    console.error("Error in updateMessageStatus:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
