import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Edit, 
  Trash2, 
  Clock, 
  Home, 
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Loader,
  RefreshCw,
  User
} from "lucide-react";

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRoom, setUserRoom] = useState("");
  const location = useLocation();
  const { user } = useAuth();

  // Edit modal state
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [formData, setFormData] = useState({
    category: "",
    description: "",
  });

  // Fetch user profile to get room number
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get("/api/auth/profile");
        setUserRoom(response.data.roomNumber || "Not assigned");
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserRoom("Not assigned");
      }
    };
    
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Fetch complaints
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/complaints/my");
      setComplaints(res.data);
    } catch (error) {
      console.error("Error fetching complaints", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [location]);

  // Cancel complaint
  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this complaint?")) return;
    
    try {
      await api.put(`/api/complaints/${id}/cancel`);
      setComplaints((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, status: "cancelled" } : c
        )
      );
    } catch (error) {
      alert(error.response?.data?.message || "Cancel failed");
    }
  };

  // Open edit modal
  const handleEditClick = (complaint) => {
    setEditingComplaint(complaint);
    setFormData({
      category: complaint.category,
      description: complaint.description,
    });
  };

  // Handle edit submit
  const handleEditSubmit = async () => {
    try {
      const res = await api.put(
        `/api/complaints/${editingComplaint._id}/edit`,
        formData
      );

      setComplaints((prev) =>
        prev.map((c) =>
          c._id === editingComplaint._id ? res.data.complaint : c
        )
      );

      setEditingComplaint(null);
    } catch (error) {
      alert(error.response?.data?.message || "Edit failed");
    }
  };

  // Check 15 min window
  const canEdit = (createdAt) => {
    const diff = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
    return diff <= 15;
  };

  // Check if complaint can be cancelled (not resolved or cancelled)
  const canCancel = (status) => {
    return status !== "resolved" && status !== "cancelled";
  };

  // Get status styling
  const getStatusInfo = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock, label: 'Pending' };
      case 'in-progress':
        return { color: 'text-blue-600', bg: 'bg-blue-50', icon: RefreshCw, label: 'In Progress' };
      case 'resolved':
        return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle, label: 'Resolved' };
      case 'cancelled':
        return { color: 'text-gray-500', bg: 'bg-gray-50', icon: XCircle, label: 'Cancelled' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', icon: AlertCircle, label: status };
    }
  };

  // Get time remaining for edit
  const getTimeRemaining = (createdAt) => {
    const elapsed = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
    const remaining = 15 - elapsed;
    if (remaining <= 0) return null;
    return `${Math.floor(remaining)} min remaining`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Complaints</h2>
          <p className="text-gray-500 text-sm mt-1">Track and manage your submitted complaints</p>
        </div>

        {/* User Info Banner - Shows room from profile */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Complaints registered for</p>
              <div className="flex items-center gap-2 mt-1">
                <Home className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-800">
                  Room {userRoom}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Loading your complaints...</p>
            </div>
          </div>
        ) : complaints.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No complaints found</p>
            <p className="text-gray-400 text-sm mt-1">
              Submit your first complaint to get started
            </p>
          </div>
        ) : (
          /* Complaint List */
          <div className="space-y-4">
            {complaints.map((complaint) => {
              const StatusIcon = getStatusInfo(complaint.status).icon;
              const statusInfo = getStatusInfo(complaint.status);
              const timeRemaining = canEdit(complaint.createdAt) && complaint.status === "pending" 
                ? getTimeRemaining(complaint.createdAt) 
                : null;
              const isEditable = canEdit(complaint.createdAt) && complaint.status === "pending";
              const isCancellable = canCancel(complaint.status);
              
              return (
                <div
                  key={complaint._id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Left Section - Complaint Info */}
                      <div className="flex-1 space-y-2">
                        {/* Category and Status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800">
                            {complaint.category}
                          </h3>
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            <span>{statusInfo.label}</span>
                          </div>
                        </div>
                        
                        {/* Date only - Room removed since it's shown in banner */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Priority: {complaint.priority || 'Medium'}
                          </span>
                        </div>

                        {/* Description Preview */}
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {complaint.description}
                        </p>

                        {/* Edit Time Remaining */}
                        {timeRemaining && (
                          <p className="text-xs text-blue-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeRemaining} to edit
                          </p>
                        )}
                      </div>

                      {/* Right Section - Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(complaint)}
                          disabled={!isEditable}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                            isEditable
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                          title={!isEditable ? "Can only edit within 15 minutes of submission" : "Edit complaint"}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          onClick={() => handleCancel(complaint._id)}
                          disabled={!isCancellable}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                            isCancellable
                              ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                          title={!isCancellable ? "Cannot cancel resolved or already cancelled complaints" : "Cancel complaint"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal - Removed room number field */}
      {editingComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Edit Complaint</h3>
              <p className="text-blue-100 text-sm mt-1">Update your complaint details</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Room Number Display (Read-only) */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Room Number
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={userRoom}
                    disabled
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Room number cannot be changed</p>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white cursor-pointer"
                >
                  <option value="">Select category</option>
                  <option value="Electrical">⚡ Electrical</option>
                  <option value="Plumbing">💧 Plumbing</option>
                  <option value="WiFi">📡 WiFi</option>
                  <option value="Cleaning">✨ Cleaning</option>
                  <option value="Other">🔧 Other</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Description
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    placeholder="Describe your issue in detail..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows="4"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/30 flex justify-end gap-3">
              <button
                onClick={() => setEditingComplaint(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyComplaints;