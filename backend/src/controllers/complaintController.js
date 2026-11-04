import Complaint from "../models/Complaint.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { classifyAndAssessUrgency } from "../services/aiService.js";
import { notifyUser, notifyStaff } from "../services/notificationService.js";
import { computeSlaStatus, computeSlaHours, getSlaDetails } from "../utils/sla.js";
import { canTransition } from "../utils/complaintStatus.js";
import { STAFF_ROLES } from "../utils/constants.js";

const USER_FIELDS = "name email roomNumber phone";
const label = (c) => c.title || c.category;

// Adds live SLA info to a mongoose doc / plain object
const withSla = (doc) => {
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const sla = getSlaDetails(obj);
  obj.slaStatus = sla.slaStatus;
  obj.sla = sla;
  return obj;
};

const populateComplaint = (query) =>
  query
    .populate("studentId", USER_FIELDS)
    .populate("assignedTo", "name role")
    .populate("statusHistory.changedBy", "name role");

// Pagination is opt-in. Without ?page / ?limit a plain array is returned
// (backwards compatible with the existing screens).
const runList = async (filter, req, res) => {
  const q = req.validatedQuery || {};
  const { page, limit, status, category, priority, search } = q;

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: rx }, { description: rx }];
  }

  const paginated = page !== undefined || limit !== undefined;

  if (!paginated) {
    const complaints = await populateComplaint(Complaint.find(filter))
      .sort({ createdAt: -1 })
      .limit(1000);
    return complaints.map(withSla);
  }

  const p = page || 1;
  const l = limit || 20;
  const [complaints, total] = await Promise.all([
    populateComplaint(Complaint.find(filter))
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l),
    Complaint.countDocuments(filter),
  ]);

  return {
    data: complaints.map(withSla),
    page: p,
    limit: l,
    total,
    totalPages: Math.ceil(total / l),
  };
};

// ================= CREATE (students) =================
export const createComplaint = async (req, res) => {
  const { title, category, description, priority, duplicateOf } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) throw new AppError("User not found", 404);

  let finalPriority = priority || "medium";
  let isUrgent = false;
  const aiMeta = { analyzedAt: new Date() };

  // AI safety net - a failure here must never block the complaint
  try {
    const aiResult = await classifyAndAssessUrgency(description);
    if (aiResult) {
      aiMeta.suggestedCategory = aiResult.category;
      aiMeta.suggestedPriority = aiResult.priority;
      aiMeta.isUrgent = aiResult.isUrgent;
      aiMeta.urgencyReason = aiResult.reason;

      if (aiResult.isUrgent) {
        isUrgent = true;
        finalPriority = "urgent";
      }
    }
  } catch (aiError) {
    console.error("AI urgency check skipped:", aiError.message);
  }

  if (Array.isArray(duplicateOf) && duplicateOf.length > 0) {
    aiMeta.duplicateOf = duplicateOf;
  }

  const slaHours = computeSlaHours(category, isUrgent);
  const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

  const complaint = await Complaint.create({
    studentId: req.user.id,
    title,
    category,
    description,
    priority: finalPriority,
    slaDeadline,
    ai: aiMeta,
    statusHistory: [
      { status: "pending", changedBy: req.user.id, note: "Complaint created" },
    ],
  });

  // ---- notifications ----
  await notifyUser(req.user.id, {
    type: "complaint_created",
    complaintId: complaint._id,
    message: `Your complaint (${label(complaint)}) was submitted. Expected resolution within ${slaHours}h`,
  });

  await notifyStaff({
    type: isUrgent ? "urgent_complaint" : "complaint_created",
    complaintId: complaint._id,
    message: isUrgent
      ? `URGENT: "${label(complaint)}" from room ${user.roomNumber} was flagged safety-critical by AI`
      : `New ${category} complaint from room ${user.roomNumber}: "${label(complaint)}"`,
  });

  const populated = await populateComplaint(Complaint.findById(complaint._id));

  res.status(201).json({
    message: "Complaint created successfully",
    complaint: withSla(populated),
  });
};

// ================= LISTS =================
export const getMyComplaints = async (req, res) => {
  res.json(await runList({ studentId: req.user.id }, req, res));
};

export const getAllComplaints = async (req, res) => {
  const result = await runList({}, req, res);

  // SLA-breached open complaints first (plain-array mode only)
  if (Array.isArray(result)) {
    const isOpenBreach = (c) =>
      c.sla?.isBreached && c.status !== "resolved" && c.status !== "cancelled";

    result.sort((a, b) => {
      const ab = isOpenBreach(a);
      const bb = isOpenBreach(b);
      if (ab !== bb) return ab ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  res.json(result);
};

// ================= SINGLE =================
export const getComplaintById = async (req, res) => {
  const complaint = await populateComplaint(Complaint.findById(req.params.id));
  if (!complaint) throw new AppError("Complaint not found", 404);

  const isOwner = complaint.studentId?._id?.toString() === req.user.id;
  if (!isOwner && !STAFF_ROLES.includes(req.user.role)) {
    throw new AppError("Access denied", 403);
  }

  res.json(withSla(complaint));
};

// ================= UPDATE STATUS (staff) =================
export const updateComplaintStatus = async (req, res) => {
  const { status, note } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError("Complaint not found", 404);

  if (complaint.status === status) {
    throw new AppError(`Complaint is already ${status}`, 400);
  }
  if (!canTransition(complaint.status, status)) {
    throw new AppError(`Cannot change status from "${complaint.status}" to "${status}"`, 400);
  }

  complaint.status = status;

  if (status === "resolved") {
    complaint.resolvedAt = new Date();
    if (note) complaint.resolutionNote = note;
  } else {
    complaint.resolvedAt = undefined; // re-opened
  }

  // first staff member to start work owns the complaint
  if (status === "in-progress" && !complaint.assignedTo) {
    complaint.assignedTo = req.user.id;
  }

  complaint.statusHistory.push({ status, changedBy: req.user.id, note });
  complaint.slaStatus = computeSlaStatus(complaint);
  await complaint.save();

  await notifyUser(complaint.studentId, {
    type: status === "resolved" ? "complaint_resolved" : "status_update",
    complaintId: complaint._id,
    message:
      status === "resolved"
        ? `Your complaint (${label(complaint)}) has been resolved${note ? `: ${note}` : ""}`
        : `Your complaint (${label(complaint)}) is now ${status}`,
  });

  const populated = await populateComplaint(Complaint.findById(complaint._id));
  res.json({ message: "Updated", complaint: withSla(populated) });
};

// ================= ASSIGN (staff) =================
export const assignComplaint = async (req, res) => {
  const assignee = await User.findById(req.body.assigneeId).select("name role isActive");
  if (!assignee || assignee.isActive === false || !STAFF_ROLES.includes(assignee.role)) {
    throw new AppError("Assignee must be an active warden or admin", 400);
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError("Complaint not found", 404);
  if (["resolved", "cancelled"].includes(complaint.status)) {
    throw new AppError(`Cannot assign a ${complaint.status} complaint`, 400);
  }

  complaint.assignedTo = assignee._id;
  await complaint.save();

  if (assignee._id.toString() !== req.user.id) {
    await notifyUser(assignee._id, {
      type: "assignment",
      complaintId: complaint._id,
      message: `${req.user.name} assigned you the complaint "${label(complaint)}"`,
    });
  }

  const populated = await populateComplaint(Complaint.findById(complaint._id));
  res.json({ message: "Assigned", complaint: withSla(populated) });
};

// ================= CANCEL (owner only) =================
export const cancelComplaint = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError("Complaint not found", 404);

  // ownership check - students can only cancel their own complaints
  if (complaint.studentId.toString() !== req.user.id) {
    throw new AppError("You can only cancel your own complaints", 403);
  }
  if (complaint.status === "resolved") {
    throw new AppError("Cannot cancel resolved complaints", 400);
  }
  if (complaint.status === "cancelled") {
    throw new AppError("Complaint is already cancelled", 400);
  }

  complaint.status = "cancelled";
  complaint.statusHistory.push({
    status: "cancelled",
    changedBy: req.user.id,
    note: "Cancelled by student",
  });
  complaint.slaStatus = computeSlaStatus(complaint);
  await complaint.save();

  await notifyUser(complaint.studentId, {
    type: "complaint_cancelled",
    complaintId: complaint._id,
    message: `Your complaint (${label(complaint)}) has been cancelled`,
  });

  const populated = await populateComplaint(Complaint.findById(complaint._id));
  res.json({ message: "Cancelled", complaint: withSla(populated) });
};

// ================= EDIT (owner, within 15 min, still pending) =================
export const editComplaint = async (req, res) => {
  const { title, category, description } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError("Complaint not found", 404);

  if (complaint.studentId.toString() !== req.user.id) {
    throw new AppError("Unauthorized", 403);
  }
  if (complaint.status !== "pending") {
    throw new AppError("Only pending complaints can be edited", 400);
  }

  const diffMinutes = (Date.now() - new Date(complaint.createdAt).getTime()) / 60000;
  if (diffMinutes > 15) {
    throw new AppError("Edit time expired (only within 15 minutes)", 400);
  }

  if (title) complaint.title = title;
  if (category) complaint.category = category;
  if (description) complaint.description = description;
  await complaint.save();

  const populated = await populateComplaint(Complaint.findById(complaint._id));
  res.json({ message: "Complaint updated successfully", complaint: withSla(populated) });
};
