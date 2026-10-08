
// sla.js
// Utility functions for calculating live SLA information.

export const computeSlaStatus = (complaint) => {
  if (!complaint.slaDeadline) return "on-time";

  const deadline = new Date(complaint.slaDeadline);

  // Cancelled complaints are not counted as SLA breaches
  if (complaint.status === "cancelled") {
    return "on-time";
  }

  // For resolved complaints, check whether it was resolved
  // before or after the SLA deadline
  if (complaint.status === "resolved") {
    const resolvedAt = complaint.resolvedAt
      ? new Date(complaint.resolvedAt)
      : new Date();

    return resolvedAt <= deadline
      ? "on-time"
      : "delayed";
  }

  // Pending / in-progress complaints
  return new Date() <= deadline
    ? "on-time"
    : "delayed";
};


// Returns detailed SLA information for dashboards
export const getSlaDetails = (complaint) => {
  const slaStatus = computeSlaStatus(complaint);

  if (!complaint.slaDeadline) {
    return {
      slaStatus,
      isBreached: false,
      remainingMinutes: null,
      overdueMinutes: null,
      displayText: "No SLA deadline",
    };
  }

  const deadline = new Date(complaint.slaDeadline);

  // Cancelled complaint
  if (complaint.status === "cancelled") {
    return {
      slaStatus: "on-time",
      isBreached: false,
      remainingMinutes: null,
      overdueMinutes: null,
      displayText: "Cancelled",
    };
  }

  // Resolved complaint
  if (complaint.status === "resolved") {
    const resolvedAt = complaint.resolvedAt
      ? new Date(complaint.resolvedAt)
      : new Date();

    const difference =
      deadline.getTime() - resolvedAt.getTime();

    if (difference >= 0) {
      return {
        slaStatus: "on-time",
        isBreached: false,
        remainingMinutes: Math.floor(
          difference / (1000 * 60)
        ),
        overdueMinutes: 0,
        displayText: "Resolved within SLA",
      };
    }

    return {
      slaStatus: "delayed",
      isBreached: true,
      remainingMinutes: 0,
      overdueMinutes: Math.floor(
        Math.abs(difference) / (1000 * 60)
      ),
      displayText: "Resolved after SLA deadline",
    };
  }

  // Pending / In-progress complaint
  const now = new Date();

  const difference =
    deadline.getTime() - now.getTime();

  // Still within SLA
  if (difference >= 0) {
    return {
      slaStatus: "on-time",
      isBreached: false,
      remainingMinutes: Math.floor(
        difference / (1000 * 60)
      ),
      overdueMinutes: 0,
      displayText: "Within SLA",
    };
  }

  // SLA Breached
  return {
    slaStatus: "delayed",
    isBreached: true,
    remainingMinutes: 0,
    overdueMinutes: Math.floor(
      Math.abs(difference) / (1000 * 60)
    ),
    displayText: "SLA Breached",
  };
};


// Converts minutes into a readable format
export const formatDuration = (minutes) => {
  if (minutes === null || minutes === undefined) {
    return "";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours < 24) {
    return mins > 0
      ? `${hours}h ${mins}m`
      : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours > 0
    ? `${days}d ${remainingHours}h`
    : `${days}d`;
};

