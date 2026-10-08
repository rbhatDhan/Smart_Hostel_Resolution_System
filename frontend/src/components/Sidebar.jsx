import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  List, 
  BarChart3, 
  Building2,
  User,
  LogOut,
  UserCircle  // ✅ ADD THIS IMPORT
} from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Wait until user loads
  if (!user) return null;

  // Normalize role
  const role = String(user?.role || user?.userType || "")
    .trim()
    .toLowerCase();

  // Admin access (warden + admin)
  const isAdmin = role === "warden" || role === "admin";

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="text-center mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Smart Hostel</h1>
        </div>
        <div className="inline-block px-2 py-0.5 bg-blue-50 rounded-full">
          <p className="text-xs text-blue-600 font-medium capitalize">{role}</p>
        </div>
      </div>

      {/* User Info */}
      <div className="mb-6 p-3 bg-blue-50/50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-800 font-medium text-sm truncate">
              {user?.name || "User"}
            </p>
            <p className="text-gray-500 text-xs truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4">
        {/* Main Menu */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
            Main Menu
          </p>
          <div className="space-y-1">
            <Link
              to="/"
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${isActive("/")
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </div>

        {/* Profile Link - For All Users */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
            Account
          </p>
          <div className="space-y-1">
            <Link
              to="/profile"
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${isActive("/profile")
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
            >
              <UserCircle className="h-4 w-4" />
              Profile Settings
            </Link>
          </div>
        </div>

        {/* Student Links */}
        {role === "student" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              Complaints
            </p>
            <div className="space-y-1">
              <Link
                to="/my-complaints"
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive("/my-complaints")
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <FileText className="h-4 w-4" />
                My Complaints
              </Link>

              <Link
                to="/create-complaint"
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive("/create-complaint")
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <PlusCircle className="h-4 w-4" />
                Create Complaint
              </Link>
            </div>
          </div>
        )}

        {/* Admin/Warden Links */}
        {isAdmin && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              Management
            </p>
            <div className="space-y-1">
              <Link
                to="/all-complaints"
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive("/all-complaints")
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <List className="h-4 w-4" />
                All Complaints
              </Link>

              <Link
                to="/analytics"
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive("/analytics")
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div className="pt-4 mt-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;