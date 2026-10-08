import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import { Bell, TrendingUp, Clock, CheckCircle, Calendar, Activity, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
  });
  const [todayCount, setTodayCount] = useState(0);
  const [yesterdayCount, setYesterdayCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let res;

        if (user?.role === "student") {
          res = await api.get("/api/complaints/my");
        } else {
          res = await api.get("/api/complaints");
        }

        const complaints = res.data;
        const total = complaints.length;
        const pending = complaints.filter((c) => c.status === "pending").length;
        const resolved = complaints.filter((c) => c.status === "resolved").length;

        setStats({ total, pending, resolved });

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const todayStr = today.toDateString();
        const yesterdayStr = yesterday.toDateString();

        let todayC = 0;
        let yesterdayC = 0;

        complaints.forEach((c) => {
          const date = new Date(c.createdAt).toDateString();
          if (date === todayStr) todayC++;
          if (date === yesterdayStr) yesterdayC++;
        });

        setTodayCount(todayC);
        setYesterdayCount(yesterdayC);
      } catch (error) {
        console.error("Dashboard error:", error);
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await api.get("/api/notifications");
        setNotifications(res.data);
      } catch (err) {
        console.error("Notification error:", err);
      }
    };

    if (user) {
      fetchData();
      fetchNotifications();
    }

    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/api/notifications/read-all");
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Greeting */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {greeting}, {user?.name?.split(' ')[0] || 'User'}!
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Welcome back to Smart Hostel Dashboard
            </p>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800">Notifications</h4>
                  <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                    <button
                      onClick={() => setOpen(false)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => !n.isRead && markAsRead(n._id)}
                        className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${
                          n.isRead ? "bg-white" : "bg-blue-50/30 hover:bg-blue-50/50"
                        }`}
                      >
                        <p className={`text-sm ${n.isRead ? "text-gray-600" : "text-gray-800 font-medium"}`}>
                          {n.message}
                        </p>
                        <span className="text-xs text-gray-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard 
            title="Total Complaints"
            value={stats.total}
            icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
            gradient="from-blue-50 to-indigo-50"
            border="blue"
          />
          <StatsCard 
            title="Pending Complaints"
            value={stats.pending}
            icon={<Clock className="h-5 w-5 text-yellow-500" />}
            gradient="from-yellow-50 to-orange-50"
            border="yellow"
          />
          <StatsCard 
            title="Resolved Complaints"
            value={stats.resolved}
            icon={<CheckCircle className="h-5 w-5 text-green-500" />}
            gradient="from-green-50 to-emerald-50"
            border="green"
          />
        </div>

        {/* Today vs Yesterday Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-gray-800">Recent Activity</h3>
            </div>
            <div className="flex justify-around">
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-1">Today</p>
                <p className="text-3xl font-bold text-green-600">{todayCount}</p>
                <p className="text-xs text-gray-400 mt-1">complaints</p>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-1">Yesterday</p>
                <p className="text-3xl font-bold text-gray-700">{yesterdayCount}</p>
                <p className="text-xs text-gray-400 mt-1">complaints</p>
              </div>
            </div>
            {todayCount > yesterdayCount && yesterdayCount > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-green-600 text-center">
                  ↑ {((todayCount - yesterdayCount) / yesterdayCount * 100).toFixed(1)}% increase from yesterday
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Quick Summary</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{stats.total}</span> total complaints submitted
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-green-600">{stats.resolved}</span> resolved (
                {stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0}% completion rate)
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-yellow-600">{stats.pending}</span> pending attention
              </p>
            </div>
            {user?.role === "student" && stats.pending > 0 && (
              <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-xs text-yellow-700">
                  ⚡ You have {stats.pending} pending {stats.pending === 1 ? 'complaint' : 'complaints'}. Our team will address them soon.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Role-based Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {user?.role === "student" && (
              <>
                <button 
                  onClick={() => window.location.href = '/create-complaint'}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  + New Complaint
                </button>
                <button 
                  onClick={() => window.location.href = '/my-complaints'}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all"
                >
                  View My Complaints
                </button>
              </>
            )}
            {(user?.role === "warden" || user?.role === "admin") && (
              <>
                <button 
                  onClick={() => window.location.href = '/all-complaints'}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  View All Complaints
                </button>
                <button 
                  onClick={() => window.location.href = '/analytics'}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all"
                >
                  View Analytics
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon, gradient, border }) => {
  const borderColors = {
    blue: "border-blue-200",
    yellow: "border-yellow-200",
    green: "border-green-200",
  };

  const valueColors = {
    blue: "text-blue-600",
    yellow: "text-yellow-600",
    green: "text-green-600",
  };

  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl border ${borderColors[border]} shadow-sm p-6 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <div className="p-1.5 bg-white rounded-lg shadow-sm">
          {icon}
        </div>
      </div>
      <h2 className={`text-3xl font-bold ${valueColors[border]} mt-1`}>
        {value}
      </h2>
    </div>
  );
};

export default Dashboard;