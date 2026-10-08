import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// ================= AUTH =================
router.post("/register", registerUser);
router.post("/login", loginUser);

// ================= PROFILE =================
// ✅ UPDATED - Return full user data including roomNumber
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ ADD - Update profile (optional, for editing room number)
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, roomNumber, phone } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (roomNumber) user.roomNumber = roomNumber;
    if (phone) user.phone = phone;

    await user.save();

    const updatedUser = await User.findById(req.user.id).select("-password");
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= ROLE CHECK =================

// Admin only
router.get(
  "/admin",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({ message: "Welcome Admin" });
  }
);

// Warden only
router.get(
  "/warden",
  protect,
  authorizeRoles("warden"),
  (req, res) => {
    res.json({ message: "Welcome Warden" });
  }
);

// Admin + Warden (shared access)
router.get(
  "/staff",
  protect,
  authorizeRoles("admin", "warden"),
  (req, res) => {
    res.json({ message: "Welcome Staff" });
  }
);

// ================= ADMIN FEATURE =================

// Get all users (Admin only)
router.get(
  "/users",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ================= CHANGE PASSWORD =================
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Import bcrypt at the top of your file
    const bcrypt = await import('bcryptjs');
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Check new password length
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;