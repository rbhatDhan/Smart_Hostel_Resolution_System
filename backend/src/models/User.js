import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "warden", "admin"],
      default: "student",
    },
    roomNumber: { type: String, required: true, default: "Not Assigned" },
    phone: { type: String, default: "" },
    // Deactivated users cannot log in and their existing tokens stop working
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);

export default User;
