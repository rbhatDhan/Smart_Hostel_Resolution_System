import Notification from "../models/Notification.js";
import AppError from "../utils/AppError.js";

export const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(notifications);
};

export const markAsRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id }, // only your own
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new AppError("Notification not found", 404);
  res.json(notification);
};

export const markAllAsRead = async (req, res) => {
  const result = await Notification.updateMany(
    { userId: req.user.id, isRead: false },
    { isRead: true }
  );
  res.json({ message: "All notifications marked as read", modified: result.modifiedCount });
};
