import Complaint from "../models/Complaint.js";
import { notifyUser, notifyStaff } from "./notificationService.js";
import { OPEN_STATUSES } from "../utils/constants.js";

const label = (c) => c.title || c.category;

// Scans open complaints and
//   1. warns staff shortly before the SLA deadline
//   2. escalates (student + all staff) once the deadline has passed
// Each alert is sent exactly once: the complaint is atomically "claimed" via a
// flag, so overlapping runs or multiple server instances cannot double-notify.
export const runSlaCheck = async (now = new Date()) => {
  const warningMinutes = Number(process.env.SLA_WARNING_MINUTES) || 120;
  const warnUntil = new Date(now.getTime() + warningMinutes * 60 * 1000);

  let breached = 0;
  let warned = 0;

  // ---- 1. breaches ----
  const overdue = await Complaint.find({
    status: { $in: OPEN_STATUSES },
    slaDeadline: { $lte: now },
    slaBreachNotified: { $ne: true },
  }).select("_id");

  for (const { _id } of overdue) {
    const c = await Complaint.findOneAndUpdate(
      { _id, status: { $in: OPEN_STATUSES }, slaBreachNotified: { $ne: true } },
      { $set: { slaBreachNotified: true, slaStatus: "delayed" } },
      { new: true }
    );
    if (!c) continue; // someone else claimed it / it was resolved meanwhile

    breached++;
    await notifyUser(c.studentId, {
      type: "sla_breach",
      complaintId: c._id,
      message: `Your complaint (${label(c)}) has passed its SLA deadline and was escalated to the wardens`,
    });
    await notifyStaff({
      type: "sla_breach",
      complaintId: c._id,
      message: `SLA BREACHED: "${label(c)}" (${c.category}, ${c.priority}) is overdue`,
    });
  }

  // ---- 2. upcoming breaches ----
  const dueSoon = await Complaint.find({
    status: { $in: OPEN_STATUSES },
    slaDeadline: { $gt: now, $lte: warnUntil },
    slaWarningNotified: { $ne: true },
    slaBreachNotified: { $ne: true },
  }).select("_id");

  for (const { _id } of dueSoon) {
    const c = await Complaint.findOneAndUpdate(
      { _id, status: { $in: OPEN_STATUSES }, slaWarningNotified: { $ne: true } },
      { $set: { slaWarningNotified: true } },
      { new: true }
    );
    if (!c) continue;

    warned++;
    const mins = Math.max(1, Math.round((c.slaDeadline - now) / 60000));
    await notifyStaff({
      type: "sla_warning",
      complaintId: c._id,
      message: `SLA warning: "${label(c)}" (${c.category}, ${c.priority}) is due in about ${mins} min`,
    });
  }

  return { checkedAt: now.toISOString(), breached, warned };
};
