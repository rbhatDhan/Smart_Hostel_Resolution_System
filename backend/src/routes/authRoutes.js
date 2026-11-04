import express from "express";
import mongoose from "mongoose";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  listUsers,
  adminCreateUser,
  adminUpdateUser,
} from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import AppError from "../utils/AppError.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema,
} from "../schemas/authSchemas.js";

const router = express.Router();

router.param("id", (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new AppError("Invalid id", 400))
);

// ---- public ----
router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);

// ---- any authenticated user ----
router.get("/profile", protect, getProfile);
router.put("/profile", protect, validate(updateProfileSchema), updateProfile);
router.put("/change-password", protect, validate(changePasswordSchema), changePassword);

// ---- admin only ----
router.get("/users", protect, authorizeRoles("admin"), listUsers);
router.post("/users", protect, authorizeRoles("admin"), validate(adminCreateUserSchema), adminCreateUser);
router.patch("/users/:id", protect, authorizeRoles("admin"), validate(adminUpdateUserSchema), adminUpdateUser);

export default router;
