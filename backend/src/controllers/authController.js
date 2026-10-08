import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ================= REGISTER =================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, roomNumber } = req.body; // ✅ ADD roomNumber

    // 🔥 GMAIL VALIDATION
    if (!email.endsWith("@gmail.com")) {
      return res.status(400).json({
        message: "Only Gmail addresses are allowed",
      });
    }

    // 🔥 PASSWORD VALIDATION
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // ✅ ROOM NUMBER VALIDATION
    if (!roomNumber) {
      return res.status(400).json({
        message: "Room number is required",
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 🔐 HASH PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with room number
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      roomNumber, // ✅ ADD roomNumber
    });

    // 🔥 REMOVE PASSWORD FROM RESPONSE
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      roomNumber: user.roomNumber, // ✅ ADD roomNumber to response
    };

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN =================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔥 GMAIL VALIDATION
    if (!email.endsWith("@gmail.com")) {
      return res.status(400).json({
        message: "Only Gmail addresses are allowed",
      });
    }

    // Check user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🔐 TOKEN
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 🔥 REMOVE PASSWORD FROM RESPONSE
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      roomNumber: user.roomNumber, // ✅ ADD roomNumber to response
    };

    res.json({
      message: "Login successful",
      token,
      user: userResponse,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ ADD GET PROFILE CONTROLLER
export const getProfile = async (req, res) => {
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
};

// ✅ ADD UPDATE PROFILE CONTROLLER (Optional - for editing room number)
export const updateProfile = async (req, res) => {
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
};