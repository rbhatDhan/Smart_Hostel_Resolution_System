import express from "express";
import { createComplaint, 
  getMyComplaints, 
  getAllComplaints,
  updateComplaintStatus ,
  cancelComplaint,
   editComplaint   } from "../controllers/complaintController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";


const router = express.Router();

// Student creates complaint
router.post("/", protect, createComplaint);
// Get logged-in user's complaints
router.get("/my", protect, getMyComplaints);
// Warden/Admin: view all complaints
router.get("/", protect, authorizeRoles("warden", "admin"), getAllComplaints);
// Warden/Admin: update complaint status
router.put(
  "/:id",
  protect,
  authorizeRoles("warden", "admin"),
  updateComplaintStatus
);

// Student cancels complaint
router.put("/:id/cancel", protect, cancelComplaint);

// Student edits complaint (within 15 mins)
router.put("/:id/edit", protect, editComplaint);

export default router;