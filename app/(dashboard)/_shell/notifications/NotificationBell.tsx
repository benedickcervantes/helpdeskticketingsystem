// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchNotifications, subscribeNotifications } from '@/lib/utils/notifications';
import { isStaffRole } from '@/lib/utils/roles';

const NotificationBell = ({ onClick, isActive = false }) => {
  const { currentUser, userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const refreshCount = useCallback(async () => {
    if (!currentUser) return;
    try {
      const notifications = await fetchNotifications();
      const isStaff = isStaffRole(userProfile?.role);
      const count = notifications.filter((n) => {
        if (n.read) return false;
        return isStaff ? n.adminNotification : !n.adminNotification;
      }).length;
      setUnreadCount((prev) => {
        if (count > prev) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 1000);
        }
        return count;
      });
    } catch {
      /* ignore */
    }
  }, [currentUser, userProfile]);

  useEffect(() => {
    if (!currentUser) return;
    refreshCount();
    const unsub = subscribeNotifications(() => refreshCount());
    const interval = setInterval(refreshCount, 60000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [currentUser, refreshCount]);

  return (
    <button
      onClick={onClick}
      className={`relative group p-3 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 notification-bell ${
        isActive 
          ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 shadow-lg shadow-emerald-500/20' 
          : 'text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-gray-700/50 hover:to-gray-600/50'
      }`}
      title={`${isStaffRole(userProfile?.role) ? 'Staff ' : ''}Notifications`}
      aria-label={`${isStaffRole(userProfile?.role) ? 'Staff ' : ''}Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
    >
      {/* Notification Bell Icon */}
      <div className={`relative ${isAnimating ? 'animate-bounce' : ''}`}>
        <svg 
          className={`w-6 h-6 transition-all duration-300 ${
            unreadCount > 0 ? 'drop-shadow-lg' : ''
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-3.595-3.598A9.969 9.969 0 0118 9.5V7a6 6 0 10-12 0v2.5a9.969 9.969 0 001.595 3.902L5 17h5m5 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {/* Bell clapper animation */}
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-1 bg-current rounded-full animate-ping"></div>
          </div>
        )}
      </div>

      {/* Unread Count Badge */}
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 flex items-center justify-center">
          <span className={`
            min-w-[20px] h-5 px-1.5 
            bg-gradient-to-r from-red-500 to-pink-500 
            text-white text-xs font-bold rounded-full 
            shadow-lg shadow-red-500/30
            ring-2 ring-gray-800
            flex items-center justify-center
            transition-all duration-300
            ${isAnimating ? 'animate-pulse scale-110' : 'scale-100'}
          `}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </div>
      )}

      {/* Hover Effect Ring */}
      <div className="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-emerald-500/30 transition-all duration-300"></div>
      
      {/* Background Glow Effect */}
      {unreadCount > 0 && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      )}
    </button>
  );
};

export default NotificationBell;
