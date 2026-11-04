import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import cronRoutes from "./routes/cronRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { getAllowedOrigins } from "./config/env.js";
import AppError from "./utils/AppError.js";

const app = express();

// Render / Railway / Vercel put a proxy in front - needed for correct client IPs
app.set("trust proxy", 1);

app.use(helmet());

const allowed = getAllowedOrigins();
app.use(
  cors({
    origin: (origin, cb) => {
      // no Origin header = curl / server-to-server / same-origin
      if (!origin || allowed.includes(origin)) return cb(null, true);
      cb(new AppError("Not allowed by CORS", 403));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));

const limiterOptions = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
};

// general API limiter
app.use(
  "/api",
  rateLimit({
    ...limiterOptions,
    windowMs: 15 * 60 * 1000,
    limit: 600,
    message: { message: "Too many requests, please try again later" },
  })
);

// brute-force protection on credentials endpoints
const authLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { message: "Too many attempts, please try again in 15 minutes" },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/cron", cronRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Liveness / readiness probe (used by Render, Docker, uptime monitors)
app.get("/health", (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? "ok" : "degraded",
    db: dbUp ? "connected" : "disconnected",
    uptime: Math.round(process.uptime()),
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
