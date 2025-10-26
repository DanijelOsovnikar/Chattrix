import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";
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
      // External request fields
      isExternalRequest,
      targetWarehouseId,
      orderNumber,
      orderDate,
      externalStatus,
      externalAction,
    } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id.toString();
    const senderShopId = req.user.shopId;

    // Get Socket.IO instance
    const io = req.io;

    // Handle external warehouse conversation IDs (employees sending to external warehouses)
    if (
      receiverId.startsWith("external_") &&
      !receiverId.startsWith("external_shop_")
    ) {
      const targetWarehouseId = receiverId.replace("external_", "");

      // Automatically set this as an external request
      return await handleExternalWarehouseRequest(req, res, {
        messages,
        sava,
        sellerId,
        senderUsername,
        buyer,
        buyerName,
        opened,
        savaGodine,
        targetWarehouseId,
        orderNumber:
          orderNumber ||
          `EXT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        orderDate: orderDate || new Date().toISOString(),
        externalStatus: externalStatus || "pending",
        externalAction: externalAction || "send",
        senderId,
        senderShopId,
        io,
      });
    }

    // Handle external shop conversation IDs (warehousemen sending messages back to external shops)
    if (receiverId.startsWith("external_shop_")) {
      const externalShopId = receiverId.replace("external_shop_", "");

      // Only warehousemen can send messages to external shops
      if (req.user.role !== "warehouseman") {
        return res.status(403).json({
          error: "Only warehousemen can send messages to external shops",
        });
      }

      // Find employees and cashiers in the external shop to send the message to
      const externalEmployees = await User.find({
        shopId: externalShopId,
        role: { $in: ["employee", "cashier", "admin", "manager"] },
        isActive: true,
      });

      if (externalEmployees.length === 0) {
        return res
          .status(404)
          .json({
            error: "No active employees/cashiers found in external shop",
          });
      }

      // Send message to all employees in the external shop
      const createdMessages = [];
      const sender = await User.findById(senderId);

      for (const employee of externalEmployees) {
        const responseMessage = new Message({
          senderId,
          receiverId: employee._id,
          shopId: employee.shopId,
          messages,
          sava,
          sellerId,
          senderUsername,
          buyer,
          buyerName,
          opened,
          savaGodine,
          gigaId: sender.gigaId,
          isExternalRequest: false, // This is a response, not a new external request
        });

        await responseMessage.save();
        createdMessages.push(responseMessage);

        // Send real-time notification to employee
        const userSocketMap = getUserSocketMap();
        const employeeSocketId = userSocketMap[employee._id.toString()];

        if (employeeSocketId) {
          io.to(employeeSocketId).emit("newMessage", {
            ...responseMessage.toObject(),
            senderId: {
              _id: sender._id,
              fullName: sender.fullName,
              userName: sender.userName,
            },
            receiverId: {
              _id: employee._id,
              fullName: employee.fullName,
              userName: employee.userName,
            },
          });
        }

        // Create or update conversation with the employee
        let conversation = await Conversation.findOne({
          participants: { $all: [senderId, employee._id] },
          shopId: employee.shopId,
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [senderId, employee._id],
            shopId: employee.shopId,
            messages: [],
          });
        }

        conversation.messages.push(responseMessage._id);
        await conversation.save();
      }

      return res.status(201).json({
        message: "Message sent to external shop successfully",
        sentTo: externalEmployees.length,
        messageIds: createdMessages.map((msg) => msg._id),
      });
    }

    // Handle external warehouse requests
    if (isExternalRequest && targetWarehouseId) {
      return await handleExternalWarehouseRequest(req, res, {
        messages,
        sava,
        sellerId,
        senderUsername,
        buyer,
        buyerName,
        opened,
        savaGodine,
        targetWarehouseId,
        orderNumber,
        orderDate,
        externalStatus,
        senderId,
        senderShopId,
        io,
      });
    }

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
      ["employee", "cashier", "admin", "manager"].includes(req.user.role)
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

      // Emit socket event to SENDER (employee) so they see their own message immediately
      const senderSockets = userSocketMap[senderId];
      if (senderSockets && senderSockets.length > 0) {
        senderSockets.forEach((socketInfo) => {
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

    // Check if message exists
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

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

    // Check if message exists
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

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

    // Handle tracking outgoing requests (for managers)
    if (userToChatId === "tracking_outgoing_requests") {
      return getOutgoingExternalRequests(req, res);
    }

    // Handle external warehouse conversations (employees sending to warehouses)
    if (
      userToChatId.startsWith("external_") &&
      !userToChatId.startsWith("external_shop_")
    ) {
      const targetWarehouseId = userToChatId.replace("external_", "");

      // Validate that the user's shop has access to this warehouse
      const userShop = await Shop.findById(req.user.shopId);
      const targetWarehouse = await Shop.findById(targetWarehouseId);

      if (!targetWarehouse) {
        return res.status(404).json({ error: "Target warehouse not found" });
      }

      // Check if this warehouse is assigned to the user's shop or if user is super_admin
      const isAssigned =
        userShop.assignedWarehouses &&
        userShop.assignedWarehouses.some(
          (warehouseId) => warehouseId.toString() === targetWarehouseId
        );

      if (!isAssigned && req.user.role !== "super_admin") {
        return res
          .status(403)
          .json({ error: "Access to this warehouse not allowed" });
      }

      // Find external messages between this user and the target warehouse
      const messages = await Message.find({
        $or: [
          {
            senderId: senderId,
            isExternalRequest: true,
            targetWarehouseId: targetWarehouseId,
          },
          {
            receiverId: senderId,
            isExternalRequest: true,
            targetWarehouseId: targetWarehouseId,
          },
        ],
      })
        .populate("senderId receiverId", "fullName shopId")
        .sort({ createdAt: 1 });

      return res.status(200).json(messages);
    }

    // Handle external shop conversations (warehousemen viewing messages from external shops)
    if (userToChatId.startsWith("external_shop_")) {
      const externalShopId = userToChatId.replace("external_shop_", "");

      // Only warehousemen can view external shop conversations
      if (req.user.role !== "warehouseman") {
        return res.status(403).json({
          error: "Only warehousemen can view external shop conversations",
        });
      }

      // Find all external messages from this shop to this warehouseman
      const messages = await Message.find({
        receiverId: senderId,
        isExternalRequest: true,
        targetWarehouseId: req.user.shopId,
      })
        .populate({
          path: "senderId",
          match: { shopId: externalShopId },
          select: "fullName shopId userName",
        })
        .populate("receiverId", "fullName shopId")
        .sort({ createdAt: 1 });

      // Filter out messages where sender doesn't match the shop
      const filteredMessages = messages.filter((msg) => msg.senderId);

      return res.status(200).json(filteredMessages);
    }

    // Handle regular internal conversations
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
    console.log("Error in getMessages controller", error);
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

// Handle external warehouse requests (cross-shop communication)
// Update external request status
export const updateExternalRequestStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status, notes } = req.body;
    const warehousemanId = req.user._id;

    // Validate status
    const validStatuses = ["pending", "sending", "keeping", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Find the external request message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (!message.isExternalRequest) {
      return res.status(400).json({ error: "This is not an external request" });
    }

    // Verify warehouseman has permission (same shop as target warehouse)
    if (req.user.shopId.toString() !== message.shopId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update the message status
    message.externalStatus = status;
    message.lastUpdateDate = new Date();

    // Add to status history
    message.statusHistory.push({
      status,
      updatedBy: warehousemanId,
      updatedAt: new Date(),
      notes: notes || `Status updated to ${status}`,
    });

    await message.save();

    // Populate the message for sending via socket
    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "fullName userName shopId")
      .populate("receiverId", "fullName userName");

    // Send real-time update to the original sender (employee who made the request)
    const io = req.io;
    const userSocketMap = getUserSocketMap();
    const senderSockets = userSocketMap[message.senderId._id.toString()];

    if (senderSockets && senderSockets.length > 0) {
      senderSockets.forEach((socketInfo) => {
        io.to(socketInfo.socketId).emit("externalStatusUpdate", {
          messageId: message._id,
          externalStatus: status,
          lastUpdateDate: message.lastUpdateDate,
          statusHistory: message.statusHistory,
          updatedMessage: populatedMessage,
        });
      });
      console.log(
        `✅ Status update sent to sender on ${senderSockets.length} device(s)`
      );
    }

    // Also send update to warehouseman who made the update (for their other devices)
    const warehousemanSockets = userSocketMap[warehousemanId.toString()];
    if (warehousemanSockets && warehousemanSockets.length > 0) {
      warehousemanSockets.forEach((socketInfo) => {
        io.to(socketInfo.socketId).emit("externalStatusUpdate", {
          messageId: message._id,
          externalStatus: status,
          lastUpdateDate: message.lastUpdateDate,
          statusHistory: message.statusHistory,
          updatedMessage: populatedMessage,
        });
      });
      console.log(
        `✅ Status update sent to warehouseman on ${warehousemanSockets.length} device(s)`
      );
    }

    res.status(200).json({
      message: "External request status updated successfully",
      status,
      updatedBy: req.user.fullName,
      updatedMessage: populatedMessage,
    });
  } catch (error) {
    console.error("Error updating external request status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update nalog field for external requests
export const updateExternalRequestNalog = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { nalog } = req.body;
    const warehousemanId = req.user._id;

    // Find the external request message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (!message.isExternalRequest) {
      return res.status(400).json({ error: "This is not an external request" });
    }

    // Verify warehouseman has permission (same shop as target warehouse)
    if (req.user.shopId.toString() !== message.shopId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Only warehousemen can update nalog
    if (req.user.role !== "warehouseman") {
      return res.status(403).json({
        error: "Only warehousemen can update nalog",
      });
    }

    // Update the nalog field
    message.nalog = nalog;
    message.lastUpdateDate = new Date();

    await message.save();

    // Populate the message for sending via socket
    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "fullName userName shopId")
      .populate("receiverId", "fullName userName");

    // Send real-time update to everyone involved
    const io = req.io;
    const userSocketMap = getUserSocketMap();

    // Send to original sender (employee who made the request)
    const senderSockets = userSocketMap[message.senderId._id.toString()];
    if (senderSockets && senderSockets.length > 0) {
      senderSockets.forEach((socketInfo) => {
        io.to(socketInfo.socketId).emit("nalogUpdate", {
          messageId: message._id,
          nalog: message.nalog,
          lastUpdateDate: message.lastUpdateDate,
          updatedMessage: populatedMessage,
        });
      });
      console.log(
        `✅ Nalog update sent to sender on ${senderSockets.length} device(s)`
      );
    }

    // Send to warehouseman who made the update (for their other devices)
    const warehousemanSockets = userSocketMap[warehousemanId.toString()];
    if (warehousemanSockets && warehousemanSockets.length > 0) {
      warehousemanSockets.forEach((socketInfo) => {
        io.to(socketInfo.socketId).emit("nalogUpdate", {
          messageId: message._id,
          nalog: message.nalog,
          lastUpdateDate: message.lastUpdateDate,
          updatedMessage: populatedMessage,
        });
      });
      console.log(
        `✅ Nalog update sent to warehouseman on ${warehousemanSockets.length} device(s)`
      );
    }

    res.status(200).json({
      message: "Nalog updated successfully",
      nalog: message.nalog,
      updatedBy: req.user.fullName,
      updatedMessage: populatedMessage,
    });
  } catch (error) {
    console.error("Error updating nalog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get outgoing external requests for managers to track
export const getOutgoingExternalRequests = async (req, res) => {
  try {
    // Only managers, admins, cashiers, and super_admins can access this endpoint
    if (
      req.user.role !== "manager" &&
      req.user.role !== "admin" &&
      req.user.role !== "cashier" &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        error:
          "Only managers, admins, cashiers, or super_admins can track outgoing requests",
      });
    }

    const managerShopId = req.user.shopId;

    // Find all users from this shop
    const shopUsers = await User.find({ shopId: managerShopId }).distinct(
      "_id"
    );

    // Find all external requests SENT FROM this shop (outgoing)
    const outgoingRequests = await Message.find({
      isExternalRequest: true,
      senderId: { $in: shopUsers },
    })
      .populate("senderId", "fullName userName role shopId")
      .populate("receiverId", "fullName userName shopId")
      .sort({ createdAt: -1 });

    // Find all external requests RECEIVED BY this shop (incoming)
    const incomingRequests = await Message.find({
      isExternalRequest: true,
      receiverId: { $in: shopUsers },
    })
      .populate("senderId", "fullName userName role shopId")
      .populate("receiverId", "fullName userName shopId")
      .sort({ createdAt: -1 });

    console.log("� Found outgoing requests:", outgoingRequests.length);
    console.log("� Found incoming requests:", incomingRequests.length);

    // Combine and mark request direction
    const allRequests = [
      ...outgoingRequests.map((req) => ({
        ...req.toObject(),
        direction: "outgoing",
      })),
      ...incomingRequests.map((req) => ({
        ...req.toObject(),
        direction: "incoming",
      })),
    ];

    // Sort by creation date (newest first)
    allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(allRequests);
  } catch (error) {
    console.error("Error in getOutgoingExternalRequests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const handleExternalWarehouseRequest = async (req, res, params) => {
  try {
    console.log("🚀 handleExternalWarehouseRequest called with params:", {
      targetWarehouseId: params.targetWarehouseId,
      senderId: params.senderId,
      senderShopId: params.senderShopId,
      messages: params.messages,
    });

    const {
      messages,
      sava,
      sellerId,
      senderUsername,
      buyer,
      buyerName,
      opened,
      savaGodine,
      targetWarehouseId,
      orderNumber,
      orderDate,
      externalStatus,
      externalAction,
      senderId,
      senderShopId,
      io,
    } = params;

    // Verify the target warehouse exists and sender's shop has permission
    const senderShop = await Shop.findById(senderShopId).populate(
      "assignedWarehouses"
    );
    const targetWarehouse = await Shop.findById(targetWarehouseId);

    if (!targetWarehouse) {
      return res.status(404).json({ error: "Target warehouse not found" });
    }

    if (!senderShop) {
      return res.status(404).json({ error: "Sender shop not found" });
    }

    // Check if sender's shop has permission to communicate with target warehouse
    const hasPermission = senderShop.assignedWarehouses.some(
      (warehouse) => warehouse._id.toString() === targetWarehouseId
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: "Your shop is not authorized to communicate with this warehouse",
      });
    }

    // Find warehousemen in the target warehouse
    const warehousemen = await User.find({
      shopId: targetWarehouseId,
      role: "warehouseman",
      isActive: true,
    });

    if (warehousemen.length === 0) {
      return res.status(404).json({
        error: "No active warehousemen found in target warehouse",
      });
    }

    // Get sender info
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ error: "Sender not found" });
    }

    // Generate a unique order number if not provided
    const finalOrderNumber =
      orderNumber ||
      `EXT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get userSocketMap once before loops
    const userSocketMap = getUserSocketMap();

    // Create external request message for each warehouseman
    const createdMessages = [];

    for (const warehouseman of warehousemen) {
      const externalMessage = new Message({
        senderId,
        receiverId: warehouseman._id,
        shopId: targetWarehouseId, // Message belongs to target warehouse's shop context
        messages,
        sava,
        sellerId,
        senderUsername,
        buyer,
        buyerName,
        opened,
        savaGodine,
        gigaId: sender.gigaId,
        // External request specific fields
        isExternalRequest: true,
        targetWarehouseId,
        senderShopName: senderShop.name, // Save shop name in the message
        orderNumber: finalOrderNumber,
        orderDate: new Date(orderDate),
        externalStatus: externalStatus || "pending",
        externalAction: externalAction || "send",
        lastUpdateDate: new Date(),
        statusHistory: [
          {
            status: externalStatus || "pending",
            updatedBy: senderId,
            updatedAt: new Date(),
            notes: `External request from ${senderShop.name} to ${targetWarehouse.name}`,
          },
        ],
      });

      await externalMessage.save();
      createdMessages.push(externalMessage);

      // Create or update conversation with the warehouseman
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, warehouseman._id] },
        shopId: targetWarehouseId,
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, warehouseman._id],
          shopId: targetWarehouseId,
          messages: [],
        });
      }

      conversation.messages.push(externalMessage._id);
      await conversation.save();

      // Send real-time notification to warehouseman (to ALL their connected devices)
      const warehousemanSockets = userSocketMap[warehouseman._id.toString()];

      if (warehousemanSockets && warehousemanSockets.length > 0) {
        const populatedMessage = {
          ...externalMessage.toObject(),
          senderId: {
            _id: sender._id,
            fullName: sender.fullName,
            userName: sender.userName,
            shopId: senderShop._id,
            shopName: senderShop.name,
          },
          receiverId: {
            _id: warehouseman._id,
            fullName: warehouseman.fullName,
            userName: warehouseman.userName,
          },
          senderShopName: senderShop.name, // Add shop name to message
        };

        warehousemanSockets.forEach((socketInfo) => {
          io.to(socketInfo.socketId).emit("newMessage", populatedMessage);
        });

        console.log(
          `✅ External request socket notification sent to ${warehouseman.fullName} on ${warehousemanSockets.length} device(s)`
        );
      } else {
        console.log(
          `⚠️ No active sockets for warehouseman: ${warehouseman.fullName}`
        );
      }

      // Send push notification to warehouseman (ALWAYS send for external requests)
      if (warehouseman.pushSubscription) {
        try {
          webPush.setVapidDetails(
            "mailto:danijel.osovnikar@gmail.com",
            process.env.PUBLIC_VAPID_KEY,
            process.env.PRIVATE_VAPID_KEY
          );

          const pushPayload = {
            title: `New External Request - ${senderShop.name}`,
            body: `Order #${finalOrderNumber} from ${sender.fullName}`,
            icon: "/icon-192x192.png",
            badge: "/badge-72x72.png",
            data: {
              messageId: externalMessage._id,
              senderId: sender._id,
              senderName: sender.fullName,
              orderNumber: finalOrderNumber,
              fromShop: senderShop.name,
              type: "external_request",
            },
          };

          await webPush.sendNotification(
            warehouseman.pushSubscription,
            JSON.stringify(pushPayload)
          );

          console.log(
            `✅ External request push notification sent to ${warehouseman.fullName} at ${targetWarehouse.name}`
          );
        } catch (pushError) {
          console.error(
            "❌ External request push notification failed:",
            pushError
          );
        }
      } else {
        console.log(
          `⚠️ No push subscription for warehouseman: ${warehouseman.fullName}`
        );
      }
    }

    // Send real-time notification to the SENDER (employee) so they see their own message
    const senderSockets = userSocketMap[sender._id.toString()];
    if (senderSockets && senderSockets.length > 0) {
      // Send the first created message back to the sender
      // (All messages have same content, just different receivers)
      const messageForSender = {
        ...createdMessages[0].toObject(),
        senderId: {
          _id: sender._id,
          fullName: sender.fullName,
          userName: sender.userName,
          shopId: senderShop._id,
          shopName: senderShop.name,
        },
        receiverId: {
          _id: targetWarehouseId,
          fullName: targetWarehouse.name,
          userName: targetWarehouse.name,
        },
        senderShopName: senderShop.name,
      };

      senderSockets.forEach((socketInfo) => {
        io.to(socketInfo.socketId).emit("newMessage", messageForSender);
      });

      console.log(
        `✅ External request echoed back to sender ${sender.fullName} on ${senderSockets.length} device(s)`
      );
    }

    res.status(201).json({
      message: "External warehouse request sent successfully",
      orderNumber: finalOrderNumber,
      targetWarehouse: targetWarehouse.name,
      sentTo: warehousemen.length,
      messageIds: createdMessages.map((msg) => msg._id),
      sentMessage: createdMessages[0], // Return the message so frontend can add it
    });
  } catch (error) {
    console.error("Error in handleExternalWarehouseRequest:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
