import React from "react";

const StatusBadge = ({ status }) => {
  const normalized = String(status || "").toLowerCase();

  const statusConfig = {
    pending: {
      label: "Pending",
      color: "bg-yellow-100 text-yellow-700",
      dot: "bg-yellow-500",
    },
    "in progress": {
      label: "In Progress",
      color: "bg-blue-100 text-blue-700",
      dot: "bg-blue-500",
    },
    resolved: {
      label: "Resolved",
      color: "bg-green-100 text-green-700",
      dot: "bg-green-500",
    },
    delayed: {
      label: "Delayed",
      color: "bg-red-100 text-red-700",
      dot: "bg-red-500",
    },
    cancelled: {
      label: "Cancelled",
      color: "bg-gray-200 text-gray-700",
      dot: "bg-gray-500",
    },
  };

  const config = statusConfig[normalized] || statusConfig.pending;

  return (
    <span
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}
    >
      {/* Dot */}
      <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>

      {config.label}
    </span>
  );
};

export default StatusBadge;