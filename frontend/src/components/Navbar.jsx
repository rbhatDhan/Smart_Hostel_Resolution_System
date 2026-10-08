import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-4 mb-4 flex justify-between shadow">
      <h2 className="font-semibold">Dashboard</h2>

      <div className="flex gap-4 items-center">
        <span className="cursor-pointer">🔔</span>

        {/* 👇 clickable user */}
        <span
          onClick={handleLogout}
          className="cursor-pointer text-sm font-medium hover:text-red-500"
        >
          Logout
        </span>
      </div>
    </div>
  );
};

export default Navbar;