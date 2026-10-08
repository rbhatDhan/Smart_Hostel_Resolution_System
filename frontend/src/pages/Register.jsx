import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Building2, User, Mail, Home, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    roomNumber: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
  };

  const checkPasswordStrength = (password) => {
    if (password.length === 0) return "";
    if (password.length < 6) return "weak";
    if (password.length >= 8 && /[!@#$%^&*]/.test(password)) return "strong";
    if (password.length >= 6) return "medium";
    return "weak";
  };

  const getPasswordStrengthColor = () => {
    switch(passwordStrength) {
      case "weak": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "strong": return "text-green-500";
      default: return "text-gray-400";
    }
  };

  const getPasswordStrengthText = () => {
    switch(passwordStrength) {
      case "weak": return "Weak";
      case "medium": return "Medium";
      case "strong": return "Strong";
      default: return "";
    }
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(formData.email)) {
      setError("Only Gmail addresses are allowed");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.roomNumber) {
      setError("Room number is required");
      return;
    }

    if (!formData.name) {
      setError("Full name is required");
      return;
    }

    setLoading(true);

    const { confirmPassword, ...userData } = {
      ...formData,
      role: "student",
    };

    const result = await register(userData);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-blue-100/50 overflow-hidden">
          {/* Decorative top bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl mb-4">
                <Building2 className="h-7 w-7 text-blue-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-800">
                Create Account
              </h1>
              
              <p className="text-gray-500 text-sm mt-1">
                Join Smart Hostel and get started
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="student@gmail.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <p className="text-gray-400 text-xs mt-1 ml-1">
                  Only Gmail addresses are allowed
                </p>
              </div>

              {/* Room Number */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Room Number <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="e.g., A-101 or 204"
                    value={formData.roomNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        roomNumber: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handlePasswordChange}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            passwordStrength === "weak" ? "w-1/3 bg-red-500" :
                            passwordStrength === "medium" ? "w-2/3 bg-yellow-500" :
                            passwordStrength === "strong" ? "w-full bg-green-500" : "w-0"
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${getPasswordStrengthColor()}`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      Minimum 6 characters
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password match indicator */}
                {formData.confirmPassword && formData.password && (
                  <div className="mt-2">
                    <p className={`text-xs flex items-center gap-1 ${
                      formData.password === formData.confirmPassword 
                        ? "text-green-600" 
                        : "text-red-500"
                    }`}>
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Passwords match
                        </>
                      ) : (
                        "Passwords do not match"
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm shadow-blue-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  "Sign Up"
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-400 text-xs mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Register;