import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { emitToUser } from "../config/socket.js";
import { STAFF_ROLES } from "../utils/constants.js";

// Persist notifications and push them in real time. Notification problems must
// never break the business operation that triggered them, so errors are logged only.
export const notifyUsers = async (userIds, { message, type = "info", complaintId }) => {
  try {
    const unique = [...new Set(userIds.map(String))];
    if (!unique.length) return [];

    const docs = await Notification.insertMany(
      unique.map((userId) => ({ userId, message, type, complaintId }))
    );

    docs.forEach((d) => emitToUser(d.userId, "notification", d.toObject()));
    return docs;
  } catch (err) {
    console.error("Notification failed:", err.message);
    return [];
  }
};

export const notifyUser = (userId, payload) => notifyUsers([userId], payload);

export const getStaffIds = async ({ excludeUserId } = {}) => {
  const staff = await User.find({
    role: { $in: STAFF_ROLES },
    isActive: { $ne: false },
  }).select("_id");
  return staff.map((u) => u._id.toString()).filter((id) => id !== String(excludeUserId));
};

export const notifyStaff = async (payload, options) => {
  try {
    const ids = await getStaffIds(options);
    return notifyUsers(ids, payload);
  } catch (err) {
    console.error("Notify staff failed:", err.message);
    return [];
  }
};
