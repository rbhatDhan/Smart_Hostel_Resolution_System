import AppError from "../utils/AppError.js";

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) throw new AppError("Not authorized", 401);
  if (!roles.includes(req.user.role)) {
    throw new AppError("Access denied: insufficient permissions", 403);
  }
  next();
};

export default authorizeRoles;
