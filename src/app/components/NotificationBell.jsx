'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUnreadNotificationCount, getUnreadAdminNotificationCount } from '../lib/notificationUtils';

const NotificationBell = ({ onClick, isActive = false }) => {
  const { currentUser, userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Determine if user is admin
    const isAdmin = userProfile?.role === 'admin';
    
    // Subscribe to appropriate notifications
    const unsubscribe = isAdmin 
      ? getUnreadAdminNotificationCount((snapshot) => {
          const newCount = snapshot.docs.length;
          
          // Trigger animation if count increased
          if (newCount > unreadCount) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 1000);
          }
          
          setUnreadCount(newCount);
        })
      : getUnreadNotificationCount(currentUser.uid, (snapshot) => {
          const newCount = snapshot.docs.length;
          
          // Trigger animation if count increased
          if (newCount > unreadCount) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 1000);
          }
          
          setUnreadCount(newCount);
        });

    return () => unsubscribe();
  }, [currentUser, userProfile, unreadCount]);

  return (
    <button
      onClick={onClick}
      className={`relative group p-3 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 notification-bell ${
        isActive 
          ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 shadow-lg shadow-emerald-500/20' 
          : 'text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-gray-700/50 hover:to-gray-600/50'
      }`}
      title={`${userProfile?.role === 'admin' ? 'Admin ' : ''}Notifications`}
      aria-label={`${userProfile?.role === 'admin' ? 'Admin ' : ''}Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
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
