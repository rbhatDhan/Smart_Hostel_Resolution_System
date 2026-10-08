import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import MyComplaints from "./pages/MyComplaints";
import CreateComplaint from "./pages/CreateComplaint";
import AllComplaints from "./pages/AllComplaints";
import Analytics from "./pages/Analytics";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";           // ✅ ADD THIS
import ChangePassword from "./pages/changePassword"; // ✅ ADD THIS

import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/my-complaints" element={<MyComplaints />} />
        <Route path="/create-complaint" element={<CreateComplaint />} />
        <Route path="/all-complaints" element={<AllComplaints />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* ✅ Profile routes - ADD THESE */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/change-password" element={<ChangePassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;