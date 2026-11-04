import mongoose from "mongoose";

export const NOTIFICATION_TYPES = [
  "info",
  "status_update",
  "complaint_created",
  "complaint_resolved",
  "complaint_cancelled",
  "urgent_complaint",
  "assignment",
  "sla_warning",
  "sla_breach",
];

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, default: "info" },
    complaintId: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
// Auto-delete notifications after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
