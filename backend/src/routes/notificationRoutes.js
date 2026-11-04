import express from "express";
import mongoose from "mongoose";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";
import protect from "../middleware/authMiddleware.js";
import AppError from "../utils/AppError.js";

const router = express.Router();

router.param("id", (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new AppError("Invalid id", 400))
);

router.get("/", protect, getNotifications);
router.put("/read-all", protect, markAllAsRead); // must be before /:id/read
router.put("/:id/read", protect, markAsRead);

export default router;
