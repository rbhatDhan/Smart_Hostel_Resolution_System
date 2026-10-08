
import Complaint from "../models/Complaint.js";

import {
  classifyAndAssessUrgency,
  findDuplicateComplaints,
  generateInsightsSummary,
} from "../services/aiService.js";


// ==========================================
// FEATURE 1:
// AI TITLE + CATEGORY + PRIORITY + URGENCY
// ==========================================
//
// POST /api/ai/analyze-complaint
//
// Any logged-in user can send a complaint
// description.
//
// AI automatically generates:
// - Title
// - Category
// - Priority
// - Urgency status
// - Reason
//

export const analyzeComplaint = async (req, res) => {

  try {

    const { description } = req.body;


    // Validate description

    if (
      !description ||
      description.trim().length < 5
    ) {

      return res.status(400).json({
        message:
          "Description is too short to analyze",
      });

    }


    // ======================================
    // CALL AI SERVICE
    // ======================================

    const result =
      await classifyAndAssessUrgency(
        description.trim()
      );


    // AI unavailable or invalid response

    if (!result) {

      return res.status(502).json({
        message:
          "AI analysis unavailable, please fill in manually",
      });

    }


    // ======================================
    // RETURN AI RESULT
    // ======================================

    res.json({

      title: result.title,

      category: result.category,

      priority: result.priority,

      isUrgent: result.isUrgent,

      reason: result.reason,

    });


  } catch (error) {

    console.error(
      "AI analyze error:",
      error.message
    );

    res.status(500).json({

      message:
        "AI analysis failed, please fill in manually",

    });

  }

};


// ==========================================
// FEATURE 2:
// AI DUPLICATE DETECTION
// ==========================================
//
// POST /api/ai/check-duplicates
//
// Checks a new complaint against recent
// open complaints in the same category.
//

export const checkDuplicates = async (
  req,
  res
) => {

  try {

    const {
      description,
      category,
    } = req.body;


    // Description too short

    if (
      !description ||
      description.trim().length < 5
    ) {

      return res.json({
        duplicates: [],
      });

    }


    // ======================================
    // FIND RECENT OPEN COMPLAINTS
    // ======================================

    const since =
      new Date(
        Date.now() -
        14 * 24 * 60 * 60 * 1000
      );


    const query = {

      status: {
        $in: [
          "pending",
          "in-progress",
        ],
      },

      createdAt: {
        $gte: since,
      },

    };


    // Only compare complaints
    // from the same category

    if (category) {

      query.category = category;

    }


    const candidates =
      await Complaint.find(query)
        .populate(
          "studentId",
          "roomNumber"
        )
        .sort({
          createdAt: -1,
        })
        .limit(15);


    // ======================================
    // PREPARE SAFE DATA FOR AI
    // ======================================

    const candidateData =
      candidates.map((c) => ({

        id:
          c._id.toString(),

        description:
          c.description,

        roomNumber:
          c.studentId?.roomNumber ||
          "Unknown",

        status:
          c.status,

        createdAt:
          c.createdAt,

      }));


    // ======================================
    // CALL AI DUPLICATE DETECTION
    // ======================================

    const matches =
      await findDuplicateComplaints(
        description.trim(),
        candidateData
      );


    // ======================================
    // ADD COMPLAINT DETAILS TO AI MATCHES
    // ======================================

    const enriched =
      matches
        .map((match) => {

          const complaint =
            candidateData.find(
              (candidate) =>
                candidate.id ===
                match.id
            );


          if (!complaint) {
            return null;
          }


          return {

            ...complaint,

            confidence:
              match.confidence,

            reason:
              match.reason,

          };

        })
        .filter(Boolean);


    // Return duplicates

    res.json({

      duplicates:
        enriched,

    });


  } catch (error) {

    console.error(
      "Duplicate check error:",
      error.message
    );


    // Important:
    // AI duplicate detection should
    // NEVER stop a student from
    // submitting a complaint.

    res.json({

      duplicates: [],

    });

  }

};


// ==========================================
// FEATURE 4:
// AI ANALYTICS SUMMARY
// ==========================================
//
// GET /api/ai/summary?days=30
//
// Aggregates complaint statistics and
// sends only aggregated data to AI.
//

export const getAiSummary = async (
  req,
  res
) => {

  try {

    const days =
      parseInt(
        req.query.days,
        10
      ) || 30;


    const since =
      new Date(
        Date.now() -
        days *
          24 *
          60 *
          60 *
          1000
      );


    // ======================================
    // GET COMPLAINTS
    // ======================================

    const complaints =
      await Complaint.find({

        createdAt: {
          $gte: since,
        },

      });


    // ======================================
    // BASIC STATISTICS
    // ======================================

    const total =
      complaints.length;


    const resolved =
      complaints.filter(
        (c) =>
          c.status === "resolved"
      ).length;


    const pending =
      complaints.filter(
        (c) =>
          c.status === "pending"
      ).length;


    const inProgress =
      complaints.filter(
        (c) =>
          c.status === "in-progress"
      ).length;


    const cancelled =
      complaints.filter(
        (c) =>
          c.status === "cancelled"
      ).length;


    // ======================================
    // CATEGORY STATISTICS
    // ======================================

    const byCategory = {};


    complaints.forEach((c) => {

      byCategory[c.category] =
        (
          byCategory[c.category] ||
          0
        ) + 1;

    });


    // ======================================
    // AVERAGE RESOLUTION TIME
    // ======================================

    const resolvedWithTime =
      complaints.filter(
        (c) =>
          c.status === "resolved" &&
          c.resolvedAt
      );


    const avgResolutionHours =
      resolvedWithTime.length

        ? (

            resolvedWithTime.reduce(
              (sum, c) =>

                sum +

                (
                  new Date(
                    c.resolvedAt
                  ) -

                  new Date(
                    c.createdAt
                  )
                ),

              0
            ) /

            resolvedWithTime.length /

            (
              1000 *
              60 *
              60
            )

          ).toFixed(1)

        : null;


    // ======================================
    // SLA BREACHES
    // ======================================

    const slaBreaches =
      complaints.filter((c) => {

        if (!c.slaDeadline) {
          return false;
        }


        const compareDate =
          c.status === "resolved"

            ? c.resolvedAt

            : new Date();


        return (
          compareDate &&

          new Date(
            compareDate
          ) >

          new Date(
            c.slaDeadline
          )
        );

      }).length;


    // ======================================
    // URGENT COMPLAINTS
    // ======================================

    const urgentCount =
      complaints.filter(
        (c) =>
          c.ai?.isUrgent
      ).length;


    // ======================================
    // FINAL STATISTICS OBJECT
    // ======================================

    const stats = {

      periodDays:
        days,

      total,

      resolved,

      pending,

      inProgress,

      cancelled,

      byCategory,

      avgResolutionHours,

      slaBreaches,

      urgentCount,

    };


    // ======================================
    // GENERATE AI SUMMARY
    // ======================================

    let summary =
      null;


    try {

      if (total > 0) {

        summary =
          await generateInsightsSummary(
            stats
          );

      }

    } catch (aiError) {

      console.error(
        "AI summary generation failed:",
        aiError.message
      );

    }


    // ======================================
    // RETURN RESULT
    // ======================================

    res.json({

      stats,

      summary,

    });


  } catch (error) {

    console.error(
      "AI summary error:",
      error.message
    );


    res.status(500).json({

      message:
        "Failed to generate summary",

    });

  }

};

