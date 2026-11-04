import React from "react";
import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
    <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-10 text-center max-w-md">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-xl mb-4">
        <SearchX className="h-7 w-7 text-blue-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800">Page not found</h1>
      <p className="text-gray-500 mt-2 text-sm">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Go home
      </Link>
    </div>
  </div>
);

export default NotFound;
