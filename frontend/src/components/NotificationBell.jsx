import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, CheckCircle, XCircle, AlertCircle, AlertTriangle, Clock, UserCheck, FilePlus, X,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'complaint_resolved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'complaint_cancelled':
      return <XCircle className="h-4 w-4 text-gray-400" />;
    case 'status_update':
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    case 'complaint_created':
      return <FilePlus className="h-4 w-4 text-indigo-500" />;
    case 'urgent_complaint':
    case 'sla_breach':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'sla_warning':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'assignment':
      return <UserCheck className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-400" />;
  }
};

const NotificationBell = () => {
  const { notifications, unreadCount, connected, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-600 hover:text-gray-800 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full text-[10px] text-white flex items-center justify-center font-medium shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  Notifications
                  <span
                    title={connected ? 'Live updates on' : 'Live updates offline (refreshing every minute)'}
                    className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`}
                  />
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No notifications</p>
                <p className="text-gray-300 text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => !notif.isRead && markAsRead(notif._id)}
                    className={`p-4 transition-all duration-200 cursor-pointer ${
                      !notif.isRead
                        ? 'bg-blue-50/30 hover:bg-blue-50 border-l-4 border-l-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.isRead ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                          {notif.message}
                        </p>
                        <span className="text-xs text-gray-400 mt-1.5 block">
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
