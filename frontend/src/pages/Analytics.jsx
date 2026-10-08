import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

// 🔥 Chart imports
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

import { Pie, Bar } from "react-chartjs-2";

// 🔥 Date picker imports
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// 🔥 Register chart components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const Analytics = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
  });
  const [categoryData, setCategoryData] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Date range state
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);

  // ✨ AI Insights state
  const [aiSummary, setAiSummary] = useState(null);
  const [aiStats, setAiStats] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const generateAiSummary = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await api.get("/api/ai/summary?days=30");
      setAiSummary(res.data.summary);
      setAiStats(res.data.stats);
    } catch (error) {
      setAiError(
        error.response?.data?.message || "Couldn't generate an AI summary right now. Try again shortly."
      );
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/api/complaints");
        setAllComplaints(res.data);
        setFilteredComplaints(res.data);
      } catch (error) {
        console.error("Analytics error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Filter complaints when date range changes
  useEffect(() => {
    if (allComplaints.length > 0) {
      filterComplaintsByDate();
    }
  }, [startDate, endDate, allComplaints]);

  const filterComplaintsByDate = () => {
    setIsFiltering(true);
    
    let filtered = [...allComplaints];
    
    if (startDate && endDate) {
      // Set time to beginning and end of days for accurate filtering
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filtered = allComplaints.filter(complaint => {
        const complaintDate = new Date(complaint.createdAt);
        return complaintDate >= start && complaintDate <= end;
      });
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      filtered = allComplaints.filter(complaint => {
        const complaintDate = new Date(complaint.createdAt);
        return complaintDate >= start;
      });
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filtered = allComplaints.filter(complaint => {
        const complaintDate = new Date(complaint.createdAt);
        return complaintDate <= end;
      });
    }
    
    setFilteredComplaints(filtered);
    updateStatsAndCharts(filtered);
    setIsFiltering(false);
  };

  const updateStatsAndCharts = (complaints) => {
    // Update stats
    const total = complaints.length;
    const resolved = complaints.filter(
      (c) => c.status === "resolved"
    ).length;
    const pending = complaints.filter(
      (c) => c.status === "pending"
    ).length;

    setStats({ total, resolved, pending });

    // Update category data
    const categoryMap = {};
    complaints.forEach((c) => {
      const category = c.category || "Other";
      categoryMap[category] =
        (categoryMap[category] || 0) + 1;
    });

    setCategoryData(categoryMap);
  };

  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const getDateRangeText = () => {
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    } else if (startDate) {
      return `From ${startDate.toLocaleDateString()}`;
    } else if (endDate) {
      return `Until ${endDate.toLocaleDateString()}`;
    }
    return "All time";
  };

  // 🔥 PIE DATA
  const pieData = {
    labels: ["Resolved", "Pending"],
    datasets: [
      {
        data: [stats.resolved, stats.pending],
        backgroundColor: ["#22c55e", "#eab308"],
        borderWidth: 0,
      },
    ],
  };

  // 🔥 BAR DATA
  const barData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        label: "Number of Complaints",
        data: Object.values(categoryData),
        backgroundColor: "#3b82f6",
        borderRadius: 8,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
    ],
  };

  // 🔥 CHART OPTIONS
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12,
          },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 12,
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 12,
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb',
          drawBorder: false,
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
          },
        },
      },
    },
  };

  const getCompletionRate = () => {
    if (stats.total === 0) return 0;
    return ((stats.resolved / stats.total) * 100).toFixed(1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Track complaint trends and system performance</p>
        </div>

        {/* ✨ AI Insights Panel */}
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 rounded-xl border border-indigo-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">AI Insights</h3>
                <p className="text-gray-500 text-xs mt-1">
                  Ask Claude to read the last 30 days of complaints and summarize what's going on
                </p>
              </div>
            </div>
            <button
              onClick={generateAiSummary}
              disabled={aiLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              {aiLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>✨ {aiSummary ? "Regenerate Summary" : "Generate AI Summary"}</>
              )}
            </button>
          </div>

          {aiError && <p className="text-sm text-red-500 mt-4">{aiError}</p>}

          {aiSummary && (
            <div className="mt-4 pt-4 border-t border-indigo-100">
              <p className="text-gray-700 text-sm leading-relaxed">{aiSummary}</p>
              {aiStats && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs font-medium text-gray-600 bg-white px-2.5 py-1 rounded-lg border border-gray-100">
                    {aiStats.total} complaints in {aiStats.periodDays} days
                  </span>
                  {aiStats.avgResolutionHours && (
                    <span className="text-xs font-medium text-gray-600 bg-white px-2.5 py-1 rounded-lg border border-gray-100">
                      Avg resolution: {aiStats.avgResolutionHours}h
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${
                    aiStats.slaBreaches > 0
                      ? "text-red-600 bg-red-50 border-red-100"
                      : "text-green-600 bg-green-50 border-green-100"
                  }`}>
                    {aiStats.slaBreaches} SLA breach{aiStats.slaBreaches !== 1 ? "es" : ""}
                  </span>
                  {aiStats.urgentCount > 0 && (
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                      {aiStats.urgentCount} AI-flagged urgent
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Date Range Filter</h3>
              <p className="text-gray-500 text-xs">Filter complaints by submission date</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <label className="block text-xs text-gray-500 mb-1">From Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="Select start date"
                  className="w-full sm:w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  dateFormat="MM/dd/yyyy"
                  isClearable
                />
              </div>
              
              <div className="relative">
                <label className="block text-xs text-gray-500 mb-1">To Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  placeholderText="Select end date"
                  className="w-full sm:w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  dateFormat="MM/dd/yyyy"
                  isClearable
                />
              </div>
              
              {(startDate || endDate) && (
                <button
                  onClick={clearDateFilter}
                  className="mt-5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
          
          {/* Active filter indicator */}
          {(startDate || endDate) && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                  Active Filter: {getDateRangeText()}
                </span>
                <span className="text-xs text-gray-500">
                  ({filteredComplaints.length} complaints found)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard 
            title="Total Complaints"
            value={loading || isFiltering ? "..." : stats.total}
            icon="📊"
            gradient="from-blue-50 to-indigo-50"
            border="blue"
          />
          <StatsCard 
            title="Resolved Complaints"
            value={loading || isFiltering ? "..." : stats.resolved}
            icon="✅"
            gradient="from-green-50 to-emerald-50"
            border="green"
            subtitle={`${getCompletionRate()}% completion rate`}
          />
          <StatsCard 
            title="Pending Complaints"
            value={loading || isFiltering ? "..." : stats.pending}
            icon="⏳"
            gradient="from-yellow-50 to-orange-50"
            border="yellow"
            subtitle="Awaiting resolution"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-800">Status Distribution</h3>
                <p className="text-gray-500 text-xs mt-1">Resolved vs Pending complaints</p>
              </div>
              <div className="px-2 py-1 bg-green-50 rounded-lg">
                <span className="text-xs font-medium text-green-600">
                  {startDate || endDate ? "Filtered Data" : "Live Data"}
                </span>
              </div>
            </div>

            <div className="h-80">
              {loading || isFiltering ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm mt-3">
                      {isFiltering ? "Filtering data..." : "Loading analytics..."}
                    </p>
                  </div>
                </div>
              ) : stats.total === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-400">No data available</p>
                    <p className="text-gray-400 text-sm">
                      {startDate || endDate 
                        ? "No complaints found in selected date range"
                        : "Submit complaints to see analytics"}
                    </p>
                  </div>
                </div>
              ) : (
                <Pie data={pieData} options={pieOptions} />
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-800">Category Analysis</h3>
                <p className="text-gray-500 text-xs mt-1">Complaints by category</p>
              </div>
              <div className="px-2 py-1 bg-blue-50 rounded-lg">
                <span className="text-xs font-medium text-blue-600">Distribution</span>
              </div>
            </div>

            <div className="h-80">
              {loading || isFiltering ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm mt-3">
                      {isFiltering ? "Filtering data..." : "Loading analytics..."}
                    </p>
                  </div>
                </div>
              ) : Object.keys(categoryData).length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-400">No category data available</p>
                    <p className="text-gray-400 text-sm">
                      {startDate || endDate 
                        ? "No complaints found in selected date range"
                        : "Complaints will appear here"}
                    </p>
                  </div>
                </div>
              ) : (
                <Bar data={barData} options={barOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Insights Section */}
        {!loading && !isFiltering && stats.total > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <span className="text-xl">💡</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-1">Key Insights</h4>
                <p className="text-gray-600 text-sm">
                  {stats.resolved === stats.total 
                    ? "🎉 All complaints have been resolved! Great job!"
                    : stats.pending > stats.resolved
                    ? `⚠️ ${stats.pending} complaints are pending resolution. Focus on clearing the backlog.`
                    : `📈 ${getCompletionRate()}% resolution rate. Keep up the good work!`}
                </p>
                {(startDate || endDate) && (
                  <p className="text-gray-500 text-xs mt-2">
                    * Analysis based on {getDateRangeText()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon, gradient, border, subtitle }) => {
  const borderColors = {
    blue: "border-blue-200",
    green: "border-green-200",
    yellow: "border-yellow-200",
  };

  const valueColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
  };

  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl border ${borderColors[border]} shadow-sm p-6 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <div className="text-2xl">{icon}</div>
      </div>
      <h2 className={`text-3xl font-bold ${valueColors[border]} mt-1`}>
        {value}
      </h2>
      {subtitle && (
        <p className="text-gray-500 text-xs mt-2">{subtitle}</p>
      )}
    </div>
  );
};

export default Analytics;