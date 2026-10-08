import React from "react";

const ComplaintCard = ({ title, room, status }) => {
  const getColor = () => {
    if (status === "Resolved") return "text-green-500";
    if (status === "Pending") return "text-yellow-500";
    if (status === "Delayed") return "text-red-500";
    return "text-blue-500";
  };

  return (
    <div className="card hover-card p-4 flex justify-between items-center">

      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500">{room}</p>
      </div>

      <span className={`font-semibold ${getColor()}`}>
        {status}
      </span>

    </div>
  );
};

export default ComplaintCard;