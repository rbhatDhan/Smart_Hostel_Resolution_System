import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Load user from localStorage on app start
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        // 🔥 NORMALIZE ROLE (VERY IMPORTANT)
        const normalizedUser = {
          ...parsedUser,
          role: parsedUser.role || parsedUser.userType,
        };

        setUser(normalizedUser);
      } catch (error) {
        console.error("Error parsing user:", error);
        localStorage.clear();
      }
    }

    setLoading(false);
  }, []);

  // 🔐 LOGIN
  const login = async (email, password) => {
    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      // 🔥 NORMALIZE ROLE
      const normalizedUser = {
        ...user,
        role: user.role || user.userType,
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      setUser(normalizedUser);

      return { success: true, user: normalizedUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  // 📝 REGISTER
  const register = async (userData) => {
    try {
      const response = await api.post("/api/auth/register", userData);

      const { token, user } = response.data;

      // 🔥 NORMALIZE ROLE
      const normalizedUser = {
        ...user,
        role: user.role || user.userType,
      };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      setUser(normalizedUser);

      return { success: true, user: normalizedUser };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  // 🚪 LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};