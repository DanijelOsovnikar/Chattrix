import { Server } from "socket.io";
import http from "http";
import express from "express";

import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";

const app = express();

const server = http.createServer(app);

// Dynamic CORS origin based on environment
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL || "https://your-production-domain.com"]
    : process.env.NODE_ENV === "staging"
    ? [
        process.env.FRONTEND_URL || "https://your-staging-domain.com",
        "http://localhost:5173",
        "http://localhost:5174",
      ]
    : ["http://localhost:5173", "http://localhost:5174"];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

const userSocketMap = {};

export const getReceiverSocketIds = (receiverId) => {
  return userSocketMap[receiverId] || [];
};

export const getUserSocketMap = () => {
  return userSocketMap;
};

io.on("connection", async (socket) => {
  // console.log("a user connected", socket.id);

  const userId = socket.handshake.query.userId;

  if (!userId) {
    // console.log("Connection rejected: No userId provided");
    socket.disconnect();
    return;
  }

  if (userId) {
    try {
      // Fetch the user and their shop information
      const user = await User.findById(userId).populate("shopId");

      if (!user) {
        // console.log("Connection rejected: User not found");
        socket.disconnect();
        return;
      }

      if (!user.shopId || !user.shopId.isActive) {
        // console.log("Connection rejected: Shop not active");
        socket.disconnect();
        return;
      }

      // console.log(
      //   `User ${user.fullName} from shop ${user.shopId.name} connected`
      // );

      // Join shop-specific room
      const shopRoom = `shop_${user.shopId._id}`;
      socket.join(shopRoom);
      // console.log(`User joined shop room: ${shopRoom}`);

      // Join user's group rooms within the shop
      if (user.groupMembers && user.groupMembers.length > 0) {
        user.groupMembers.forEach((groupId) => {
          const groupRoom = `shop_${user.shopId._id}_group_${groupId}`;
          socket.join(groupRoom);
          // console.log(`User joined group room: ${groupRoom}`);
        });
      }

      // Super admins join a special global room for cross-shop communication
      if (user.role === "super_admin") {
        socket.join("global_admins");
        // console.log("Super admin joined global admins room");

        // Optional: Super admins can join all shop rooms for monitoring
        const allShops = await Shop.find({ isActive: true });
        allShops.forEach((shop) => {
          socket.join(`shop_${shop._id}`);
        });
        // console.log("Super admin joined all shop rooms");
      }

      // Store socket mapping with shop info
      if (!userSocketMap[userId]) {
        userSocketMap[userId] = [];
      }
      userSocketMap[userId].push({
        socketId: socket.id,
        shopId: user.shopId._id,
      });

      // Emit online users to shop-specific room only
      const shopUsers = Object.entries(userSocketMap)
        .filter(([uid, sockets]) =>
          sockets.some(
            (s) => s.shopId.toString() === user.shopId._id.toString()
          )
        )
        .map(([uid]) => uid);

      io.to(shopRoom).emit("getOnlineUsers", shopUsers);
    } catch (error) {
      console.error("Error during socket connection:", error);
      socket.disconnect();
      return;
    }
  }

  // Handle joining specific rooms (for dynamic room joining)
  socket.on("joinRoom", ({ room }) => {
    socket.join(room);
    // console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  // Handle leaving specific rooms
  socket.on("leaveRoom", ({ room }) => {
    socket.leave(room);
    // console.log(`Socket ${socket.id} left room: ${room}`);
  });

  socket.on("disconnect", () => {
    // console.log("a user disconnected", socket.id);

    // Clean up user socket mapping
    for (const userId in userSocketMap) {
      userSocketMap[userId] = userSocketMap[userId].filter(
        (socketInfo) => socketInfo.socketId !== socket.id
      );

      if (userSocketMap[userId].length === 0) {
        delete userSocketMap[userId];
      }
    }

    // Emit updated online users to all shop rooms
    // This could be optimized to only emit to affected shops
    Object.values(userSocketMap).forEach((socketInfoArray) => {
      if (socketInfoArray.length > 0) {
        const shopId = socketInfoArray[0].shopId;
        const shopUsers = Object.entries(userSocketMap)
          .filter(([uid, sockets]) =>
            sockets.some((s) => s.shopId.toString() === shopId.toString())
          )
          .map(([uid]) => uid);

        io.to(`shop_${shopId}`).emit("getOnlineUsers", shopUsers);
      }
    });
  });
});

export { app, io, server };
