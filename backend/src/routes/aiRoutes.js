import express from "express";
import rateLimit from "express-rate-limit";
import { analyzeComplaint, checkDuplicates, getAiSummary } from "../controllers/aiController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// AI calls cost quota - limit per user (falls back to IP before auth resolves)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  validate: { keyGeneratorIpFallback: false },
  message: { message: "Too many AI requests, please slow down" },
});

// Student (or any logged-in user): auto-classify a complaint while typing
router.post("/analyze-complaint", protect, aiLimiter, analyzeComplaint);

// Student (or any logged-in user): check for similar/duplicate open complaints
router.post("/check-duplicates", protect, aiLimiter, checkDuplicates);

// Warden/Admin only: AI-generated analytics summary
router.get("/summary", protect, authorizeRoles("warden", "admin"), aiLimiter, getAiSummary);

export default router;
