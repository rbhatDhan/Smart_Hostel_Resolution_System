import express from "express";
import mongoose from "mongoose";
import {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  cancelComplaint,
  editComplaint,
} from "../controllers/complaintController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import AppError from "../utils/AppError.js";
import {
  createComplaintSchema,
  editComplaintSchema,
  updateStatusSchema,
  assignSchema,
  listQuerySchema,
} from "../schemas/complaintSchemas.js";

const router = express.Router();

router.param("id", (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new AppError("Invalid id", 400))
);

// ---- Student ----
router.post("/", protect, authorizeRoles("student"), validate(createComplaintSchema), createComplaint);
router.get("/my", protect, validate(listQuerySchema, "query"), getMyComplaints);
router.put("/:id/cancel", protect, authorizeRoles("student"), cancelComplaint);
router.put("/:id/edit", protect, authorizeRoles("student"), validate(editComplaintSchema), editComplaint);

// ---- Warden / Admin ----
router.get("/", protect, authorizeRoles("warden", "admin"), validate(listQuerySchema, "query"), getAllComplaints);
router.put("/:id/assign", protect, authorizeRoles("warden", "admin"), validate(assignSchema), assignComplaint);
router.put("/:id", protect, authorizeRoles("warden", "admin"), validate(updateStatusSchema), updateComplaintStatus);

// ---- Single complaint (owner or staff - checked in controller) ----
router.get("/:id", protect, getComplaintById);

export default router;
