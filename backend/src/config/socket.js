import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getAllowedOrigins } from "./env.js";

let io = null;

// Real-time push channel. Every authenticated user joins a private room
// "user:<id>"; the server emits "notification" events into that room.
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: getAllowedOrigins(), credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Not authorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
      const user = await User.findById(decoded.id).select("isActive");
      if (!user || user.isActive === false) return next(new Error("Not authorized"));

      socket.data.userId = decoded.id;
      next();
    } catch {
      next(new Error("Not authorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
  });

  return io;
};

// No-op when sockets are not initialised (tests, serverless cron invocation)
export const emitToUser = (userId, event, payload) => {
  if (io) io.to(`user:${userId}`).emit(event, payload);
};

export const closeSocket = () => io?.close();
