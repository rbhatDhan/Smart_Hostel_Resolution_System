import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Plus, 
  MapPin, 
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Activity,
  User
} from "lucide-react";

const RightPanel = () => {
  const [stats, setStats] = useState({ total: 0 });
  const [todayCount, setTodayCount] = useState(0);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      let res;

      if (user?.role === "student") {
        res = await api.get("/api/complaints/my");
      } else {
        res = await api.get("/api/complaints");
      }

      const complaints = res.data;

      setStats({ total: complaints.length });

      const today = new Date().toDateString();
      const todayData = complaints.filter(
        (c) => new Date(c.createdAt).toDateString() === today
      );

      setTodayCount(todayData.length);
      setLatest(complaints[0] || null);

    } catch (err) {
      console.error("Right panel error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [location.state?.refresh, user]);

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'in-progress': return 'text-blue-600 bg-blue-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-gray-500 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-4">
      {/* Welcome Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{getGreeting()}</p>
            <p className="text-sm font-semibold text-gray-800">
              {user?.name?.split(' ')[0] || "User"}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          {user?.role === "student" ? "Student" : "Staff"} Account
        </p>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-blue-100">Total Complaints</p>
          <TrendingUp className="h-4 w-4 text-blue-200" />
        </div>
        <h2 className="text-3xl font-bold">
          {loading ? "..." : stats.total}
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1 text-xs text-blue-200">
            <Calendar className="h-3 w-3" />
            <span>Today</span>
          </div>
          <span className="text-lg font-semibold text-white">
            +{loading ? "..." : todayCount}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => window.location.href = user?.role === "student" ? "/create-complaint" : "/all-complaints"}
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="p-1.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <Plus className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-xs text-gray-600">
              {user?.role === "student" ? "Add" : "View All"}
            </span>
          </button>
          
          <button 
            onClick={() => window.location.href = user?.role === "student" ? "/my-complaints" : "/analytics"}
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="p-1.5 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
              <MapPin className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-xs text-gray-600">Track</span>
          </button>
          
          <button 
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="p-1.5 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-xs text-gray-600">Resolve</span>
          </button>
        </div>
      </div>

      {/* Latest Complaint */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Latest Complaint
          </p>
          {latest && (
            <ChevronRight className="h-3 w-3 text-gray-400" />
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : latest ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">
                {latest.category || "N/A"}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(latest.status)}`}>
                {latest.status || "Pending"}
              </span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">
              {latest.description || "No description"}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-400">
                {latest.createdAt ? new Date(latest.createdAt).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-400">No complaints yet</p>
          </div>
        )}
      </div>

      {/* Activity Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4 text-blue-600" />
          <p className="text-xs font-semibold text-gray-700">Activity Summary</p>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Completion Rate</span>
            <span className="font-medium text-gray-700">
              {stats.total > 0 ? `${((stats.total - todayCount) / stats.total * 100).toFixed(0)}%` : "0%"}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: stats.total > 0 ? `${((stats.total - todayCount) / stats.total * 100)}%` : "0%" }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {todayCount > 0 
              ? `${todayCount} new complaint${todayCount > 1 ? 's' : ''} today`
              : "No new complaints today"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;