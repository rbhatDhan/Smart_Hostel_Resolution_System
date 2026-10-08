import React from "react";

const SummaryCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = "indigo",
}) => {
  const colors = {
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      ring: "ring-indigo-100",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      ring: "ring-emerald-100",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      ring: "ring-amber-100",
    },
    rose: {
      bg: "bg-rose-50",
      text: "text-rose-600",
      ring: "ring-rose-100",
    },
  };

  const c = colors[color];

  return (
    <div className="relative p-5 rounded-2xl bg-white/70 backdrop-blur-md shadow-md hover:shadow-xl transition duration-300 hover:-translate-y-1">

      {/* subtle gradient border */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/40 pointer-events-none"></div>

      {/* top section */}
      <div className="flex items-center justify-between mb-4">

        {/* icon */}
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.bg} ${c.text} ring-1 ${c.ring}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>

        {/* trend */}
        {trend !== undefined && (
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              trend > 0
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* title */}
      <p className="text-gray-500 text-sm">{title}</p>

      {/* value */}
      <p className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">
        {value}
      </p>
    </div>
  );
};

export default SummaryCard;