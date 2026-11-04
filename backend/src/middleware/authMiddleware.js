import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

// Verifies the JWT *and* re-loads the user, so that a deactivated / deleted
// user or a role change takes effect immediately instead of when the token expires.
const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Not authorized, no token", 401);
  }

  const token = header.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    throw new AppError("Not authorized, token failed", 401);
  }

  const user = await User.findById(decoded.id).select("name role isActive");

  if (!user || user.isActive === false) {
    throw new AppError("Not authorized, account unavailable", 401);
  }

  // role comes from the database, never from the token payload
  req.user = { id: user._id.toString(), role: user.role, name: user.name };
  next();
};

export default protect;
