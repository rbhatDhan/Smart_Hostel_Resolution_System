import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import api, { API_URL } from "../services/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};

// One shared source of truth for notifications:
//  - initial load via REST
//  - live updates pushed over Socket.IO
//  - a slow poll as a safety net if the socket is blocked (corporate proxies etc.)
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/api/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Notification error:", err);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    fetchNotifications();

    const token = localStorage.getItem("token");
    const socket = io(API_URL || undefined, { auth: { token }, transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("notification", (n) => {
      setNotifications((prev) => (prev.some((p) => p._id === n._id) ? prev : [n, ...prev]));
    });

    // safety-net poll (60s) - the socket does the real work
    const interval = setInterval(fetchNotifications, 60000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user?._id, fetchNotifications]); // eslint-disable-line react-hooks/exhaustive-deps

  const markAsRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    try {
      await api.put(`/api/notifications/${id}/read`);
    } catch (err) {
      console.error("Error marking notification as read:", err);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.put("/api/notifications/read-all");
    } catch (err) {
      console.error("Error marking all as read:", err);
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, connected, markAsRead, markAllAsRead, refresh: fetchNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
