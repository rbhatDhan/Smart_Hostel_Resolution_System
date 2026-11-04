import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";

const ROUNDS = () => Number(process.env.BCRYPT_ROUNDS) || 12;

// Used to keep login timing constant when the email does not exist
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    algorithm: "HS256",
  });

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  roomNumber: user.roomNumber,
  phone: user.phone,
});

// ================= REGISTER (students only) =================
export const registerUser = async (req, res) => {
  const { name, email, password, roomNumber } = req.body;

  if (await User.exists({ email })) {
    throw new AppError("User already exists", 409);
  }

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, ROUNDS()),
    roomNumber,
    role: "student", // always - role can only be elevated by an admin
  });

  res.status(201).json({
    message: "User registered successfully",
    token: signToken(user),
    user: publicUser(user),
  });
};

// ================= LOGIN =================
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  const isMatch = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

  if (!user || !isMatch) throw new AppError("Invalid credentials", 401);
  if (user.isActive === false) throw new AppError("This account has been deactivated", 403);

  res.json({
    message: "Login successful",
    token: signToken(user),
    user: publicUser(user),
  });
};

// ================= PROFILE =================
export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) throw new AppError("User not found", 404);
  res.json(user);
};

export const updateProfile = async (req, res) => {
  const { name, roomNumber, phone } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) throw new AppError("User not found", 404);

  if (name) user.name = name;
  if (roomNumber) user.roomNumber = roomNumber;
  if (phone !== undefined) user.phone = phone;
  await user.save();

  const updated = await User.findById(req.user.id).select("-password");
  res.json({ message: "Profile updated successfully", user: updated });
};

// ================= CHANGE PASSWORD =================
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) throw new AppError("User not found", 404);

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw new AppError("Current password is incorrect", 400);
  }

  user.password = await bcrypt.hash(newPassword, ROUNDS());
  await user.save();

  res.json({ message: "Password changed successfully" });
};

// ================= ADMIN: USER MANAGEMENT =================
export const listUsers = async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
};

// Create a warden / admin (or student) account
export const adminCreateUser = async (req, res) => {
  const { name, email, password, role, roomNumber, phone } = req.body;

  if (await User.exists({ email })) throw new AppError("User already exists", 409);

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, ROUNDS()),
    role,
    ...(roomNumber && { roomNumber }),
    ...(phone && { phone }),
  });

  res.status(201).json({ message: "User created", user: publicUser(user) });
};

// Change role / activate / deactivate
export const adminUpdateUser = async (req, res) => {
  const { role, isActive } = req.body;

  if (req.params.id === req.user.id) {
    throw new AppError("You cannot change your own role or status", 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("User not found", 404);

  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  await user.save();

  res.json({ message: "User updated", user: publicUser(user) });
};
