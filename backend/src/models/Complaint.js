
import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Complaint title
    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Electrical",
        "Plumbing",
        "Furniture",
        "Washroom",
        "WiFi",
        "Cleaning",
        "Security",
        "Other",
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    imageUrl: {
      type: String,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["pending", "in-progress", "resolved", "cancelled"],
      default: "pending",
    },

    resolutionNote: {
      type: String,
    },

    resolvedAt: {
      type: Date,
    },

    // SLA deadline calculated when complaint is created
    slaDeadline: {
      type: Date,
    },

    // Final SLA status
    slaStatus: {
      type: String,
      enum: ["on-time", "delayed"],
      default: "on-time",
    },

    // Staff member working on this complaint
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Audit trail of every status change
    statusHistory: [
      {
        _id: false,
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: { type: String },
        at: { type: Date, default: Date.now },
      },
    ],

    // Flags used by the SLA monitor so each alert is sent only once
    slaWarningNotified: { type: Boolean, default: false },
    slaBreachNotified: { type: Boolean, default: false },

    // AI metadata
    ai: {
      suggestedCategory: {
        type: String,
      },

      suggestedPriority: {
        type: String,
      },

      isUrgent: {
        type: Boolean,
        default: false,
      },

      urgencyReason: {
        type: String,
      },

      duplicateOf: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Complaint",
        },
      ],

      analyzedAt: {
        type: Date,
      },
    },
  },

  {
    timestamps: true,
  }
);


complaintSchema.index({ studentId: 1, createdAt: -1 });
complaintSchema.index({ status: 1, slaDeadline: 1 });
complaintSchema.index({ createdAt: -1 });

// Virtual field to get room number from populated user
complaintSchema.virtual("roomNumber").get(function () {
  return this.studentId?.roomNumber || "Not Assigned";
});


complaintSchema.set("toJSON", {
  virtuals: true,
});


complaintSchema.set("toObject", {
  virtuals: true,
});


const Complaint = mongoose.model(
  "Complaint",
  complaintSchema
);

export default Complaint;

