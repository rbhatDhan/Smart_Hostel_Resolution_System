import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

const normalize = (user) => ({
  ...user,
  role: String(user?.role || "").toLowerCase(),
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Restore the session on app start, then re-validate it with the server so
  // a changed role / deactivated account is picked up immediately.
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    try {
      setUser(normalize(JSON.parse(savedUser)));
    } catch {
      localStorage.clear();
      setLoading(false);
      return;
    }

    api
      .get("/api/auth/profile")
      .then((res) => {
        if (cancelled) return;
        const fresh = normalize(res.data);
        localStorage.setItem("user", JSON.stringify(fresh));
        setUser(fresh);
      })
      .catch(() => {
        // 401 is handled by the api interceptor; on network errors keep the cached user
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = (token, userData) => {
    const normalized = normalize(userData);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(normalized));
    setUser(normalized);
    return normalized;
  };

  // 🔐 LOGIN
  const login = async (email, password) => {
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      return { success: true, user: persist(data.token, data.user) };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  // 📝 REGISTER (the server returns a token, so the user is signed in immediately)
  const register = async (userData) => {
    try {
      const { data } = await api.post("/api/auth/register", userData);
      return { success: true, user: persist(data.token, data.user) };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  // 🚪 LOGOUT
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const hasRole = (...roles) => !!user && roles.includes(user.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        hasRole,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
