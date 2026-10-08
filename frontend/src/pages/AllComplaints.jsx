import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Flag,
  User,
  Calendar,
  Image as ImageIcon,
  Inbox,
  Home,
  Phone  // ✅ ADD Phone icon
} from "lucide-react";

const AllComplaints = () => {
  const [filter, setFilter] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch complaints
  useEffect(() => {
    const fetchComplaints = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate("/login");
        return;
      }
      
      try {
        setLoading(true);
        const res = await api.get("/api/complaints");
        console.log("Fetched complaints:", res.data);
        setComplaints(res.data.reverse());
      } catch (error) {
        console.error("Error fetching complaints:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [navigate]);

  // Show loading if user is not yet loaded
  if (!user && loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-3">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/api/complaints/${id}`, {
        status: newStatus,
      });

      setComplaints((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, status: newStatus } : c
        )
      );
    } catch (error) {
      alert("Update failed");
    }
  };

  const filtered = filter
    ? complaints.filter(
        (c) => c.status?.toLowerCase() === filter.toLowerCase()
      )
    : complaints;

  const getStatusInfo = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock };
      case 'in-progress':
        return { color: 'text-blue-600', bg: 'bg-blue-50', icon: AlertCircle };
      case 'resolved':
        return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
      case 'cancelled':
        return { color: 'text-gray-500', bg: 'bg-gray-50', icon: Clock };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', icon: Clock };
    }
  };

  const getPriorityInfo = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return { color: 'text-red-600', bg: 'bg-red-50' };
      case 'medium':
        return { color: 'text-orange-600', bg: 'bg-orange-50' };
      case 'low':
        return { color: 'text-green-600', bg: 'bg-green-50' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">All Complaints</h2>
            <p className="text-gray-500 text-sm mt-1">Track and manage student complaints</p>
          </div>
          
          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white cursor-pointer"
              value={filter}
            >
              <option value="">All Complaints</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-3">Loading complaints...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No complaints found</p>
            <p className="text-gray-400 text-sm mt-1">
              {filter ? "Try changing your filter" : "Complaints will appear here"}
            </p>
          </div>
        ) : (
          /* Complaint List */
          <div className="space-y-4">
            {filtered.map((c) => {
              const StatusIcon = getStatusInfo(c.status).icon;
              const statusInfo = getStatusInfo(c.status);
              const priorityInfo = getPriorityInfo(c.priority);
              
              return (
                <div
                  key={c._id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Header - Clickable area */}
                  <div
                    onClick={() => toggleExpand(c._id)}
                    className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left section */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800">
                            {c.category}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityInfo.bg} ${priorityInfo.color}`}>
                            <Flag className="h-3 w-3 inline mr-1" />
                            {c.priority || 'Medium'} priority
                          </span>
                          {c.ai?.isUrgent && (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200"
                              title={c.ai?.urgencyReason}
                            >
                              ✨ AI flagged: safety-critical
                            </span>
                          )}
                          {c.ai?.duplicateOf?.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200">
                              ✨ Possible duplicate
                            </span>
                          )}
                        </div>
                        
                        {/* ✅ ADDED Phone number here */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {c.studentId?.name || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />  {/* ✅ Phone icon */}
                            {c.studentId?.phone || 'No phone'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Home className="h-3.5 w-3.5" />
                            Room {c.studentId?.roomNumber || 'Not Assigned'}
                          </span>
                        </div>
                      </div>

                      {/* Right section */}
                      <div className="flex items-center gap-3">
                        {/* Status badge */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span className="text-sm font-medium capitalize">{c.status}</span>
                        </div>

                        {/* Status dropdown for non-students */}
                        {user?.role !== "student" && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <select
                              value={c.status}
                              disabled={c.status === "resolved" || c.status === "cancelled"}
                              onChange={(e) => handleStatusChange(c._id, e.target.value)}
                              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </div>
                        )}

                        {/* Expand/collapse icon */}
                        <div className="text-gray-400">
                          {expandedId === c._id ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedId === c._id && (
                    <div className="border-t border-gray-100 bg-gray-50/30 p-5">
                      <div className="space-y-3">
                        {/* Contact Info Section - Added in expanded view */}
                        <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-gray-100">
                          <div>
                            <p className="text-xs text-gray-400">Student Name</p>
                            <p className="text-sm font-medium text-gray-800">{c.studentId?.name || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Phone Number</p>
                            <p className="text-sm font-medium text-gray-800">{c.studentId?.phone || 'No phone'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Room Number</p>
                            <p className="text-sm font-medium text-gray-800">{c.studentId?.roomNumber || 'Not Assigned'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Email</p>
                            <p className="text-sm font-medium text-gray-800 truncate">{c.studentId?.email || 'No email'}</p>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {c.description}
                          </p>
                        </div>

                        {/* Image */}
                        {c.imageUrl && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                              <ImageIcon className="h-3.5 w-3.5" />
                              Attachment
                            </h4>
                            <img
                              src={c.imageUrl}
                              alt="complaint"
                              className="rounded-lg max-h-64 w-auto object-cover border border-gray-200"
                            />
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="pt-2 text-xs text-gray-400 flex items-center gap-4 flex-wrap">
                          <span>Complaint ID: {c._id}</span>
                          <span>•</span>
                          <span>Submitted: {new Date(c.createdAt).toLocaleString()}</span>
                          {c.resolvedAt && (
                            <>
                              <span>•</span>
                              <span>Resolved: {new Date(c.resolvedAt).toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AllComplaints;