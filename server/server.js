import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/MessageRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Socket.IO setup
export const io = new Server(server, {
  cors: {
    origin: "*", // For dev only — change in prod
    methods: ["GET", "POST"],
  },
  pingTimeout: 20000,
  pingInterval: 25000,
});

// ✅ Online user map
export const userSocketMap = {}; // { userId: socketId }

// ✅ Socket.IO connection logic
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (!userId) {
    console.warn("⚠️ Socket connected without userId");
    return socket.disconnect(); // Immediately reject
  }

  console.log(`✅ Socket connected: ${userId}`);
  userSocketMap[userId] = socket.id;

  // Notify all users about who is online
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${userId}`);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// ✅ Express middleware
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// ✅ REST API routes
app.use("/api/status", (req, res) => res.send("Server is running"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: "Something went wrong" });
});

// ✅ Connect MongoDB and start server
await connectDB();
console.log("✅ MongoDB connected successfully");
// if (process.env.NODE_ENV !== "production") {
//   const PORT = process.env.PORT || 5000;
//   server.listen(PORT, () => {
//     console.log("✅ MongoDB connected successfully");
//     console.log(`🚀 Server is running on port: ${PORT}`);
//   });
// }

export default server; // server for vercel
