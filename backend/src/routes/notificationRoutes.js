import express from "express";
import { getNotifications } from "../controllers/notificationController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Get notifications
router.get("/", protect, getNotifications);

export default router;