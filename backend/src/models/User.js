import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "warden", "admin"],
      default: "student",
    },
    roomNumber: {  // ✅ ADD THIS FIELD
      type: String,
      required: true,
      default: "Not Assigned",
    },
    phone: {  // Optional: Add phone field too
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;