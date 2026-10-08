import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import MyComplaints from "./pages/MyComplaints";
import CreateComplaint from "./pages/CreateComplaint";
import AllComplaints from "./pages/AllComplaints";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Layout from "./components/Layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* 🔓 Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🔐 Protected routes */}
        <Route
          path="/"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/my-complaints"
          element={
            <Layout>
              <MyComplaints />
            </Layout>
          }
        />
        <Route
          path="/create-complaint"
          element={
            <Layout>
              <CreateComplaint />
            </Layout>
          }
        />
        <Route
          path="/all-complaints"
          element={
            <Layout>
              <AllComplaints />
            </Layout>
          }
        />
        <Route
          path="/analytics"
          element={
            <Layout>
              <Analytics />
            </Layout>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;