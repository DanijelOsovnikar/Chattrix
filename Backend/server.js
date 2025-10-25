import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: join(__dirname, "../.env") });

import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/message.js";
import usersRoutes from "./routes/users.js";
import subscribeRoutes from "./routes/subscribe.js";
import deleteRoutes from "./routes/deleteSubscription.js";
import shopRoutes from "./routes/shop.js";
import notificationSettingsRoutes from "./routes/notificationSettings.js";
import passwordRoutes from "./routes/password.js";
import warehouseRoutes from "./routes/warehouse.js";

import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";

const PORT = process.env.PORT || 3000;

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

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "staging"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser());

app.use("/api/deleteSubscription", deleteRoutes);
app.use("/api/subscribe", subscribeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/notifications", notificationSettingsRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/warehouses", warehouseRoutes);

app.use(express.static(join(__dirname, "../Frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "../Frontend", "dist", "index.html"));
});

server.listen(PORT, () => {
  connectToMongoDB();
  console.log(`Server is running on port ${PORT}`);
});
