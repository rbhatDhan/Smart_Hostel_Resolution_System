import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Users, 
  UserCheck, 
  UserCog, 
  Calendar, 
  BarChart3,
  Activity,
  Shield 
} from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
  });

  const [usersCount, setUsersCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [wardenCount, setWardenCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);

  const [todayCount, setTodayCount] = useState(0);
  const [yesterdayCount, setYesterdayCount] = useState(0);

  const [resolutionRate, setResolutionRate] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/api/complaints");
        const complaints = res.data;

        const total = complaints.length;
        const pending = complaints.filter((c) => c.status === "pending").length;
        const resolved = complaints.filter((c) => c.status === "resolved").length;

        setStats({ total, pending, resolved });

        const rate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;
        setResolutionRate(rate);

        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        let todayC = 0;
        let yesterdayC = 0;

        complaints.forEach((c) => {
          const date = new Date(c.createdAt).toDateString();
          if (date === today) todayC++;
          if (date === yesterday) yesterdayC++;
        });

        setTodayCount(todayC);
        setYesterdayCount(yesterdayC);

        const usersRes = await api.get("/api/auth/users");
        const users = usersRes.data;

        setUsersCount(users.length);

        const students = users.filter(u => u.role === "student").length;
        const wardens = users.filter(u => u.role === "warden").length;
        const admins = users.filter(u => u.role === "admin").length;

        setStudentCount(students);
        setWardenCount(wardens);
        setAdminCount(admins);

      } catch (error) {
        console.error("Admin Dashboard error:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-2">
          <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Monitor and manage hostel complaints system</p>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard 
            title="Total Complaints" 
            value={stats.total} 
            icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
            color="blue"
          />
          <StatsCard 
            title="Pending" 
            value={stats.pending} 
            icon={<Clock className="h-5 w-5 text-yellow-500" />}
            color="yellow"
          />
          <StatsCard 
            title="Resolved" 
            value={stats.resolved} 
            icon={<CheckCircle className="h-5 w-5 text-green-500" />}
            color="green"
          />
          <StatsCard 
            title="Total Users" 
            value={usersCount} 
            icon={<Users className="h-5 w-5 text-indigo-500" />}
            color="indigo"
          />
        </div>

        {/* Role Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RoleCard 
            title="Students" 
            value={studentCount} 
            icon={<UserCheck className="h-5 w-5 text-blue-500" />}
            gradient="from-blue-50 to-indigo-50"
            border="blue"
          />
          <RoleCard 
            title="Wardens" 
            value={wardenCount} 
            icon={<Shield className="h-5 w-5 text-purple-500" />}
            gradient="from-purple-50 to-pink-50"
            border="purple"
          />
          <RoleCard 
            title="Admins" 
            value={adminCount} 
            icon={<UserCog className="h-5 w-5 text-gray-500" />}
            gradient="from-gray-50 to-gray-100"
            border="gray"
          />
        </div>

        {/* Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InsightCard 
            title="Resolution Rate" 
            value={`${resolutionRate}%`}
            icon={<BarChart3 className="h-5 w-5 text-blue-500" />}
            trend={resolutionRate > 50 ? "up" : "down"}
          />
          <InsightCard 
            title="Today's Complaints" 
            value={todayCount}
            icon={<Calendar className="h-5 w-5 text-green-500" />}
            subtitle="New complaints today"
          />
          <InsightCard 
            title="Yesterday's Complaints" 
            value={yesterdayCount}
            icon={<Activity className="h-5 w-5 text-orange-500" />}
            subtitle="Previous day"
          />
        </div>

        {/* System Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">System Overview</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Monitor complaints, user roles, and resolution efficiency. 
                Helps admin track system performance in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: "from-blue-50 to-blue-100/50",
    yellow: "from-yellow-50 to-yellow-100/50",
    green: "from-green-50 to-green-100/50",
    indigo: "from-indigo-50 to-indigo-100/50"
  };

  const valueColors = {
    blue: "text-blue-600",
    yellow: "text-yellow-600",
    green: "text-green-600",
    indigo: "text-indigo-600"
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl border border-${color}-100 shadow-sm p-6 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <div className="p-1.5 bg-white rounded-lg shadow-sm">
          {icon}
        </div>
      </div>
      <h2 className={`text-3xl font-bold ${valueColors[color]} mt-1`}>
        {value}
      </h2>
    </div>
  );
};

// Role Card Component
const RoleCard = ({ title, value, icon, gradient, border }) => {
  const borderColors = {
    blue: "border-blue-200",
    purple: "border-purple-200",
    gray: "border-gray-200"
  };

  const valueColors = {
    blue: "text-blue-600",
    purple: "text-purple-600",
    gray: "text-gray-700"
  };

  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl border ${borderColors[border]} shadow-sm p-6 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <h2 className={`text-3xl font-bold ${valueColors[border]} mt-1`}>
            {value}
          </h2>
        </div>
        <div className="p-2 bg-white rounded-xl shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
};

// Insight Card Component
const InsightCard = ({ title, value, icon, trend, subtitle }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <div className="p-1.5 bg-gray-50 rounded-lg">
          {icon}
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-800">
        {value}
      </h2>
      {subtitle && (
        <p className="text-gray-400 text-xs mt-2">{subtitle}</p>
      )}
      {trend && (
        <div className="mt-2">
          <span className={`text-xs font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
            {trend === "up" ? "↑ Good progress" : "↓ Needs attention"}
          </span>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;