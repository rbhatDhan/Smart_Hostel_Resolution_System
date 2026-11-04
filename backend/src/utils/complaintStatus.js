// Allowed status transitions for staff. "cancelled" is student-only (own complaint)
// and is handled by a dedicated endpoint.
export const ALLOWED_TRANSITIONS = {
  pending: ["in-progress", "resolved"],
  "in-progress": ["pending", "resolved"],
  resolved: ["in-progress"], // re-open
  cancelled: [],
};

export const canTransition = (from, to) =>
  (ALLOWED_TRANSITIONS[from] || []).includes(to);
