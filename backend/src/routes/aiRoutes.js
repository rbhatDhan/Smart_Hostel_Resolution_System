import express from "express";
import { analyzeComplaint, checkDuplicates, getAiSummary } from "../controllers/aiController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Student (or any logged-in user): auto-classify a complaint while typing
router.post("/analyze-complaint", protect, analyzeComplaint);

// Student (or any logged-in user): check for similar/duplicate open complaints
router.post("/check-duplicates", protect, checkDuplicates);

// Warden/Admin only: AI-generated analytics summary
router.get("/summary", protect, authorizeRoles("warden", "admin"), getAiSummary);

export default router;
