import { Server } from "socket.io";
import http from "http";
import express from "express";

import User from "../models/user.model.js";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
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

io.on("connection", async (socket) => {
  console.log("a user connected", socket.id);

  const userId = socket.handshake.query.userId;

  if (userId) {
    // Fetch the user and their groups
    const user = await User.findById(userId);
    socket.join("group_67412fe4c9e8d92cc7b7f7fa");
  }

  if (!userId) {
    console.log("Connection rejected: No userId provided");
    socket.disconnect();
    return;
  }

  if (!userSocketMap[userId]) {
    userSocketMap[userId] = [];
  }
  userSocketMap[userId].push(socket.id);

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("a user disconnected", socket.id);

    if (userSocketMap[userId]) {
      userSocketMap[userId] = userSocketMap[userId].filter(
        (id) => id !== socket.id
      );

      if (userSocketMap[userId].length === 0) {
        delete userSocketMap[userId];
      }
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server };
