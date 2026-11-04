import "dotenv/config";
import http from "http";
import mongoose from "mongoose";

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { validateEnv } from "./src/config/env.js";
import { initSocket, closeSocket } from "./src/config/socket.js";
import { startSlaCron, stopSlaCron } from "./src/services/cronService.js";

validateEnv();

const PORT = process.env.PORT || 5000;

// Connect to DB first
await connectDB();

const server = http.createServer(app);
initSocket(server); // real-time notifications

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
  startSlaCron(); // SLA warning / breach monitor
});

// Graceful shutdown so in-flight requests finish and the DB closes cleanly
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down...`);
  stopSlaCron();
  closeSocket();
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (err) => console.error("Unhandled rejection:", err));
