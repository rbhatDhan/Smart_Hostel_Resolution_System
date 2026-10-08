import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  User, 
  Mail, 
  Home, 
  Phone, 
  Save, 
  Camera,
  Loader,
  CheckCircle,
  XCircle,
  Building2
} from "lucide-react";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roomNumber: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/api/auth/profile");
        const profile = response.data;
        setFormData({
          name: profile.name || "",
          email: profile.email || "",
          roomNumber: profile.roomNumber || "",
          phone: profile.phone || "",
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile data");
      } finally {
        setFetching(false);
      }
    };
    
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.put("/api/auth/profile", formData);
      setSuccess("Profile updated successfully!");
      
      // Update user in context and localStorage
      const updatedUser = { ...user, ...formData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Profile Settings</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your personal information</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Profile Picture Section */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Profile Picture</h3>
                <p className="text-xs text-gray-500">Upload from gallery</p>
              </div>
              <button 
                type="button"
                className="ml-auto p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Camera className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              {/* Room Number */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Room Number
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder="e.g., A-101"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
              
              <Link
                to="/change-password"
                className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
              >
                Change Password
              </Link>
            </div>
          </form>
        </div>

        {/* Account Info */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold text-gray-700 text-sm">Account Information</h3>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Role: <span className="font-medium capitalize">{user?.role}</span></p>
            
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;