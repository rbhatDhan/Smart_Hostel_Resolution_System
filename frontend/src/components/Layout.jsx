import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import RightPanel from "./RightPanel";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - Left Column */}
          <div className="lg:col-span-3">
            <div className="sticky top-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-[calc(100vh-3rem)] overflow-y-auto">
              <Sidebar />
            </div>
          </div>

          {/* Main Content - Center Column */}
          <div className="lg:col-span-6 space-y-6">
            <Navbar />
            <main className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              {children}
            </main>
          </div>

          {/* Right Panel - Right Column */}
          <div className="lg:col-span-3">
            <div className="sticky top-6">
              <RightPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;