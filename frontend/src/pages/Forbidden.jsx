import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const Forbidden = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
    <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-10 text-center max-w-md">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-xl mb-4">
        <ShieldAlert className="h-7 w-7 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800">Access denied</h1>
      <p className="text-gray-500 mt-2 text-sm">
        Your account does not have permission to view this page.
      </p>
      <Link
        to="/"
        className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  </div>
);

export default Forbidden;
