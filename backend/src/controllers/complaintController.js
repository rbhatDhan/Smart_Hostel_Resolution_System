
import Complaint from "../models/Complaint.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

import {
  classifyAndAssessUrgency,
} from "../services/aiService.js";

import {
  computeSlaStatus,
  getSlaDetails,
} from "../utils/sla.js";


// ================= CREATE =================

export const createComplaint = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      priority,
      duplicateOf,
    } = req.body;


    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }


    // Default SLA
    let slaHours = 72;


    // Category-based SLA
    if (
      category === "Electrical" ||
      category === "Plumbing"
    ) {
      slaHours = 48;
    }


    let finalPriority =
      priority || "medium";


    const aiMeta = {
      analyzedAt: new Date(),
    };


    // ================= AI URGENCY CHECK =================

    try {
      const aiResult =
        await classifyAndAssessUrgency(
          description
        );

      if (aiResult) {
        aiMeta.suggestedCategory =
          aiResult.category;

        aiMeta.suggestedPriority =
          aiResult.priority;

        aiMeta.isUrgent =
          aiResult.isUrgent;

        aiMeta.urgencyReason =
          aiResult.reason;


        // Safety-critical issue
        if (aiResult.isUrgent) {
          finalPriority = "urgent";

          // Urgent complaints must be handled faster
          slaHours = Math.min(
            slaHours,
            6
          );
        }
      }
    } catch (aiError) {
      console.error(
        "AI urgency check skipped:",
        aiError.message
      );
    }


    // ================= DUPLICATE INFO =================

    if (
      Array.isArray(duplicateOf) &&
      duplicateOf.length > 0
    ) {
      aiMeta.duplicateOf =
        duplicateOf;
    }


    // ================= SLA DEADLINE =================

    const slaDeadline =
      new Date(
        Date.now() +
        slaHours *
        60 *
        60 *
        1000
      );


    // ================= CREATE COMPLAINT =================

    const complaint =
      await Complaint.create({

        studentId:
          req.user.id,

        title,

        category,

        description,

        priority:
          finalPriority,

        slaDeadline,

        ai:
          aiMeta,
      });


    const populatedComplaint =
      await Complaint.findById(
        complaint._id
      )
        .populate(
          "studentId",
          "name email roomNumber phone"
        );


    res.status(201).json({
      message:
        "Complaint created successfully",

      complaint:
        populatedComplaint,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message:
        "Server error",
    });
  }
};


// ================= MY COMPLAINTS =================

export const getMyComplaints =
  async (req, res) => {

    try {

      const complaints =
        await Complaint.find({

          studentId:
            req.user.id,

        })
          .populate(
            "studentId",
            "name email roomNumber phone"
          )
          .sort({
            createdAt:
              -1,
          });


      const withLiveSla =
        complaints.map((c) => {

          const obj =
            c.toObject();


          const slaDetails =
            getSlaDetails(obj);


          obj.slaStatus =
            slaDetails.slaStatus;

          obj.sla =
            slaDetails;


          return obj;

        });


      res.json(
        withLiveSla
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });

    }
  };


// ================= ALL COMPLAINTS =================

export const getAllComplaints =
  async (req, res) => {

    try {

      const complaints =
        await Complaint.find()
          .populate(
            "studentId",
            "name email roomNumber phone"
          )
          .sort({
            createdAt:
              -1,
          });


      const withLiveSla =
        complaints.map((c) => {

          const obj =
            c.toObject();


          const slaDetails =
            getSlaDetails(obj);


          obj.slaStatus =
            slaDetails.slaStatus;

          obj.sla =
            slaDetails;


          return obj;

        });


      // ================= SORT =================
      // SLA breached open complaints first

      withLiveSla.sort(
        (a, b) => {

          const aBreached =
            a.sla?.isBreached &&
            a.status !== "resolved" &&
            a.status !== "cancelled";

          const bBreached =
            b.sla?.isBreached &&
            b.status !== "resolved" &&
            b.status !== "cancelled";


          if (
            aBreached &&
            !bBreached
          ) {
            return -1;
          }


          if (
            !aBreached &&
            bBreached
          ) {
            return 1;
          }


          return (
            new Date(
              b.createdAt
            ) -
            new Date(
              a.createdAt
            )
          );

        }
      );


      res.json(
        withLiveSla
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });

    }
  };


// ================= UPDATE STATUS =================

export const updateComplaintStatus =
  async (req, res) => {

    try {

      const { status } =
        req.body;


      const complaint =
        await Complaint.findById(
          req.params.id
        );


      if (!complaint) {

        return res.status(404).json({
          message:
            "Not found",
        });

      }


      complaint.status =
        status;


      if (
        status === "resolved"
      ) {

        complaint.resolvedAt =
          new Date();

      }


      // Calculate final SLA status

      complaint.slaStatus =
        computeSlaStatus(
          complaint
        );


      await complaint.save();


      await Notification.create({

        userId:
          complaint.studentId,

        message:
          `Your complaint (${complaint.title || complaint.category}) is now ${status}`,

      });


      const slaDetails =
        getSlaDetails(
          complaint
        );


      const responseComplaint =
        complaint.toObject();


      responseComplaint.sla =
        slaDetails;


      res.json({

        message:
          "Updated",

        complaint:
          responseComplaint,

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });

    }
  };


// ================= CANCEL =================

export const cancelComplaint =
  async (req, res) => {

    try {

      const complaint =
        await Complaint.findById(
          req.params.id
        );


      if (!complaint) {

        return res.status(404).json({
          message:
            "Not found",
        });

      }


      if (
        complaint.status ===
        "resolved"
      ) {

        return res.status(400).json({

          message:
            "Cannot cancel resolved complaints",

        });

      }


      complaint.status =
        "cancelled";


      complaint.slaStatus =
        computeSlaStatus(
          complaint
        );


      await complaint.save();


      await Notification.create({

        userId:
          complaint.studentId,

        message:
          `Your complaint (${complaint.title || complaint.category}) has been cancelled`,

      });


      const responseComplaint =
        complaint.toObject();


      responseComplaint.sla =
        getSlaDetails(
          complaint
        );


      res.json({

        message:
          "Cancelled",

        complaint:
          responseComplaint,

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });

    }
  };


// ================= EDIT =================

export const editComplaint =
  async (req, res) => {

    try {

      const {
        title,
        category,
        description,
      } = req.body;


      const complaint =
        await Complaint.findById(
          req.params.id
        );


      if (!complaint) {

        return res.status(404).json({

          message:
            "Complaint not found",

        });

      }


      if (
        complaint.studentId.toString() !==
        req.user.id
      ) {

        return res.status(403).json({

          message:
            "Unauthorized",

        });

      }


      const createdTime =
        new Date(
          complaint.createdAt
        ).getTime();


      const currentTime =
        Date.now();


      const diffMinutes =
        (currentTime -
          createdTime) /
        (1000 * 60);


      if (
        diffMinutes > 15
      ) {

        return res.status(400).json({

          message:
            "Edit time expired (only within 15 minutes)",

        });

      }


      complaint.title =
        title ||
        complaint.title;

      complaint.category =
        category ||
        complaint.category;

      complaint.description =
        description ||
        complaint.description;


      await complaint.save();


      const populatedComplaint =
        await Complaint.findById(
          complaint._id
        )
          .populate(
            "studentId",
            "name email roomNumber phone"
          );


      const responseComplaint =
        populatedComplaint.toObject();


      responseComplaint.sla =
        getSlaDetails(
          responseComplaint
        );


      res.json({

        message:
          "Complaint updated successfully",

        complaint:
          responseComplaint,

      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });

    }
  };

