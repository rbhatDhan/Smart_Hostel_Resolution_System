import express from "express";
import crypto from "crypto";
import { runSlaCheck } from "../services/slaService.js";
import AppError from "../utils/AppError.js";

const router = express.Router();

const safeEqual = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// Secured HTTP trigger for the SLA monitor. Use it when the server cannot run a
// scheduler itself (Vercel serverless, sleeping free-tier hosts):
//   - Vercel Cron sends  "Authorization: Bearer <CRON_SECRET>"  automatically
//   - GitHub Actions / cron-job.org can send the same header
const cronAuth = (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new AppError("Cron endpoint is disabled (CRON_SECRET not set)", 503);

  const provided = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!provided || !safeEqual(provided, secret)) throw new AppError("Unauthorized", 401);
  next();
};

const handler = async (req, res) => res.json(await runSlaCheck());

router.get("/sla", cronAuth, handler);
router.post("/sla", cronAuth, handler);

export default router;
