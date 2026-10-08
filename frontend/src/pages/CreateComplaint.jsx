
import React, { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

import {
  AlertCircle,
  Home,
  FileText,
  Send,
  Wifi,
  Wrench,
  Droplets,
  Sparkles,
  Zap,
  User,
  Building2,
  Loader,
  ShieldAlert,
  X,
} from "lucide-react";

const CreateComplaint = () => {
  const [form, setForm] = useState({
    title: "",
    category: "",
    priority: "",
    description: "",
  });

  const [userRoom, setUserRoom] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  // ==========================================
  // 🤖 AI STATES
  // ==========================================

  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiError, setAiError] = useState("");
  const [lastAnalyzedDescription, setLastAnalyzedDescription] = useState("");

  // Track whether the user manually changed the title
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);

  // Prevent stale AI responses from overwriting newer data
  const analysisTimeoutRef = useRef(null);

  // ==========================================
  // 🤖 DUPLICATE DETECTION STATES
  // ==========================================

  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // ==========================================
  // FETCH USER PROFILE
  // ==========================================

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get("/api/auth/profile");

        setUserRoom(response.data.roomNumber || "Not assigned");
        setUserName(response.data.name || user?.name || "");
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserRoom("Not assigned");
      } finally {
        setFetchingUser(false);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // ==========================================
  // HANDLE FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // User manually edited title
    if (name === "title") {
      setTitleManuallyEdited(true);
    }

    // Description changed
    if (name === "description") {
      setAiSuggestion(null);
      setAiError("");

      // If the previous title was AI-generated,
      // allow AI to generate a new title
      if (!titleManuallyEdited) {
        setForm((prev) => ({
          ...prev,
          title: "",
        }));
      }
    }
  };

  // ==========================================
  // 🤖 AI ANALYZE COMPLAINT
  // ==========================================

  const handleAiAnalyze = async (descriptionToAnalyze) => {
    const description =
      descriptionToAnalyze || form.description.trim();

    if (description.length < 10) {
      return;
    }

    if (aiAnalyzing) {
      return;
    }

    setAiError("");
    setAiAnalyzing(true);

    try {
      const res = await api.post(
        "/api/ai/analyze-complaint",
        {
          description,
        }
      );

      // Ignore response if description has changed
      setForm((prev) => {
        if (prev.description.trim() !== description) {
          return prev;
        }

        return {
          ...prev,

          // Update AI title unless user manually edited it
          title: titleManuallyEdited
            ? prev.title
            : res.data.title || prev.title,

          // AI updates category
          category:
            res.data.category || prev.category,

          // AI updates priority
          priority: res.data.isUrgent
            ? "urgent"
            : res.data.priority || prev.priority,
        };
      });

      // Only update AI suggestion if description is still same
      if (form.description.trim() === description) {
        setAiSuggestion(res.data);
        setLastAnalyzedDescription(description);
      }
    } catch (error) {
      console.error("AI analysis failed:", error);

      setAiError(
        error.response?.data?.message ||
          "AI analysis is unavailable. Please fill the fields manually."
      );
    } finally {
      setAiAnalyzing(false);
    }
  };

  // ==========================================
  // 🤖 AUTOMATIC AI ANALYSIS
  // ==========================================

  useEffect(() => {
    const description = form.description.trim();

    if (description.length < 10) {
      return;
    }

    if (description === lastAnalyzedDescription) {
      return;
    }

    // Clear previous timer
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    // Analyze after user stops typing for 2 seconds
    analysisTimeoutRef.current = setTimeout(() => {
      handleAiAnalyze(description);
    }, 2000);

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [form.description, lastAnalyzedDescription]);

  // ==========================================
  // SUBMIT FORM
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setAiError("");

    let dupes = [];

    try {
      setCheckingDuplicates(true);

      const dupRes = await api.post(
        "/api/ai/check-duplicates",
        {
          description: form.description,
          category: form.category,
        }
      );

      dupes = dupRes.data?.duplicates || [];
    } catch (error) {
      console.warn(
        "Duplicate check unavailable:",
        error.message
      );
    } finally {
      setCheckingDuplicates(false);
    }

    if (dupes.length > 0) {
      setDuplicates(dupes);
      setShowDuplicateModal(true);
      setLoading(false);
      return;
    }

    await submitComplaint([]);
  };

  // ==========================================
  // CREATE COMPLAINT
  // ==========================================

  const submitComplaint = async (duplicateOf) => {
    setLoading(true);

    try {
      await api.post("/api/complaints", {
        title: form.title,
        category: form.category,
        description: form.description,
        priority: form.priority,
        duplicateOf,
      });

      alert("Complaint submitted successfully ✅");

      // Reset form
      setForm({
        title: "",
        category: "",
        priority: "",
        description: "",
      });

      // Reset AI
      setAiSuggestion(null);
      setAiError("");
      setLastAnalyzedDescription("");
      setTitleManuallyEdited(false);

      navigate("/my-complaints");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Error submitting complaint"
      );
    } finally {
      setLoading(false);
      setShowDuplicateModal(false);
    }
  };

  // ==========================================
  // CATEGORY ICON
  // ==========================================

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Electrical":
        return <Zap className="h-4 w-4" />;

      case "Plumbing":
        return <Droplets className="h-4 w-4" />;

      case "WiFi":
        return <Wifi className="h-4 w-4" />;

      case "Cleaning":
        return <Sparkles className="h-4 w-4" />;

      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  // ==========================================
  // LOADING PROFILE
  // ==========================================

  if (fetchingUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />

            <p className="text-gray-500">
              Loading your information...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[80vh] py-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

            <div className="p-8">

              {/* HEADER */}

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800">
                    Create Complaint
                  </h2>
                </div>

                <p className="text-gray-500 text-sm ml-11">
                  Describe your issue and AI will automatically suggest
                  a title, category and priority.
                </p>
              </div>

              {/* USER INFO */}

              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      Submitting complaint as
                    </p>

                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="font-semibold text-gray-800">
                        {userName}
                      </span>

                      <span className="text-gray-400">
                        •
                      </span>

                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-gray-500" />

                        <span className="text-sm text-gray-700">
                          <span className="font-medium">
                            Room {userRoom}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >

                {/* TITLE */}

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Title
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="AI will suggest a title automatically"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    required
                  />

                  {aiSuggestion?.title && (
                    <p className="text-xs text-indigo-500 mt-1">
                      ✨ AI suggested: {aiSuggestion.title}
                    </p>
                  )}
                </div>

                {/* CATEGORY + PRIORITY */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* CATEGORY */}

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Category
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none bg-white cursor-pointer"
                        required
                      >
                        <option value="">
                          Select category
                        </option>

                        <option value="Electrical">
                          ⚡ Electrical
                        </option>

                        <option value="Plumbing">
                          💧 Plumbing
                        </option>

                        <option value="Furniture">
                          🪑 Furniture
                        </option>

                        <option value="Washroom">
                          🚿 Washroom
                        </option>

                        <option value="WiFi">
                          📡 WiFi
                        </option>

                        <option value="Cleaning">
                          ✨ Cleaning
                        </option>

                        <option value="Security">
                          🛡️ Security
                        </option>

                        <option value="Other">
                          🔧 Other
                        </option>
                      </select>

                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        {form.category &&
                          getCategoryIcon(form.category)}
                      </div>
                    </div>
                  </div>

                  {/* PRIORITY */}

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Priority
                      <span className="text-red-500">*</span>
                    </label>

                    <select
                      name="priority"
                      value={form.priority}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white cursor-pointer"
                      required
                    >
                      <option value="">
                        Select priority
                      </option>

                      <option value="low">
                        🟢 Low
                      </option>

                      <option value="medium">
                        🟡 Medium
                      </option>

                      <option value="high">
                        🟠 High
                      </option>

                      <option value="urgent">
                        🔴 Urgent
                      </option>
                    </select>
                  </div>
                </div>

                {/* DESCRIPTION */}

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Description
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                    <textarea
                      name="description"
                      rows="5"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Describe your issue in detail..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none"
                      required
                    />
                  </div>

                  {/* AI LOADING */}

                  {aiAnalyzing && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg">
                      <Loader className="h-4 w-4 animate-spin" />

                      <span>
                        🤖 AI is analyzing your complaint...
                      </span>
                    </div>
                  )}

                  {/* AI WAITING */}

                  {!aiAnalyzing &&
                    form.description.trim().length >= 10 &&
                    !aiSuggestion && (
                      <p className="mt-2 text-xs text-gray-400">
                        🤖 AI automatically analyzes your complaint
                        to suggest title, category and priority.
                      </p>
                    )}

                  {/* AI ERROR */}

                  {aiError && (
                    <p className="text-xs text-red-500 mt-2">
                      {aiError}
                    </p>
                  )}

                  {/* AI RESULT */}

                  {aiSuggestion && (
                    <div
                      className={`mt-3 p-4 rounded-xl border text-sm ${
                        aiSuggestion.isUrgent
                          ? "bg-red-50 border-red-200"
                          : "bg-indigo-50 border-indigo-100"
                      }`}
                    >
                      <div className="flex items-start gap-3">

                        {aiSuggestion.isUrgent ? (
                          <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Sparkles className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                        )}

                        <div>
                          <p className="font-semibold text-gray-800">
                            🤖 AI Analysis
                          </p>

                          <p className="text-gray-600 mt-2">
                            <strong>Title:</strong>{" "}
                            {aiSuggestion.title}
                          </p>

                          <p className="text-gray-600 mt-1">
                            <strong>Category:</strong>{" "}
                            {aiSuggestion.category}
                          </p>

                          <p className="text-gray-600 mt-1">
                            <strong>Priority:</strong>{" "}
                            {aiSuggestion.isUrgent
                              ? "Urgent"
                              : aiSuggestion.priority}
                          </p>

                          {aiSuggestion.isUrgent && (
                            <p className="text-red-700 font-medium mt-2">
                              ⚠️ Safety-critical issue detected
                            </p>
                          )}

                          {aiSuggestion.reason && (
                            <p className="text-gray-500 text-xs mt-2">
                              {aiSuggestion.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ROOM INFO */}

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Home className="h-3 w-3" />

                    Complaint will be registered for

                    <strong className="text-gray-700">
                      Room {userRoom}
                    </strong>
                  </p>
                </div>

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    checkingDuplicates ||
                    userRoom === "Not assigned"
                  }
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {checkingDuplicates ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Checking for similar complaints...
                    </>
                  ) : loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Complaint
                    </>
                  )}
                </button>

                <p className="text-center text-gray-400 text-xs">
                  🤖 AI suggestions can be manually edited before submission.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* DUPLICATE MODAL */}

      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">

            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-800">
                ⚠️ Similar complaints found
              </h3>

              <button
                type="button"
                onClick={() =>
                  setShowDuplicateModal(false)
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Our AI found {duplicates.length} open complaint
              {duplicates.length > 1 ? "s" : ""} that may
              describe the same issue.
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto mb-5">
              {duplicates.map((d) => (
                <div
                  key={d.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm"
                >
                  <p className="text-gray-700">
                    {d.description}
                  </p>

                  <p className="text-xs text-gray-400 mt-1.5">
                    Room {d.roomNumber}

                    {" • "}

                    <span className="capitalize">
                      {d.status}
                    </span>

                    {" • "}

                    {d.confidence}% match
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowDuplicateModal(false)
                }
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  submitComplaint(
                    duplicates.map((d) => d.id)
                  )
                }
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CreateComplaint;

