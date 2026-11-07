// Usage:
//   npm run seed         -> creates/updates the admin from ADMIN_* env vars
//   npm run seed:demo    -> also creates a demo warden and demo student
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../src/config/db.js";
import User from "../src/models/User.js";

const upsert = async ({ name, email, password, role, roomNumber }) => {
  const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 12);
  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    existing.role = role;
    existing.isActive = true;
    await existing.save();
    console.log(`updated  ${role.padEnd(8)} ${email} (password unchanged)`);
    return;
  }

  await User.create({ name, email, password: hash, role, ...(roomNumber && { roomNumber }) });
  console.log(`created  ${role.padEnd(8)} ${email}  password: ${password}`);
};

try {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set");
  await connectDB();

  await upsert({
    name: process.env.ADMIN_NAME || "Hostel Admin",
    email: process.env.ADMIN_EMAIL || "admin@example.com",
    password: process.env.ADMIN_PASSWORD || "ChangeMe123!",
    role: "admin",
  });

  if (process.argv.includes("--demo") || process.env.SEED_DEMO === "true") {
    await upsert({ name: "Demo Warden", email: "warden@example.com", password: "Warden@123", role: "warden" });
    await upsert({ name: "Demo Student", email: "student@example.com", password: "Student@123", role: "student", roomNumber: "A-101" });
  }
} catch (err) {
  console.error("Seed failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}
