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
  const [isClicking, setIsClicking] = useState(false);

  const handleClick = () => {
    setIsClicking(true);
    window.setTimeout(() => setIsClicking(false), 700);
    onClick?.();
  };

  const refreshCount = useCallback(async () => {
    if (!currentUser) return;
    try {
      const notifications = await fetchNotifications();
      const isStaff = isStaffRole(userProfile?.role);
      const count = notifications.filter((n) => {
        if (n.read) return false;
        if (isStaff) {
          return n.adminNotification || n.userId === currentUser.uid;
        }
        return !n.adminNotification;
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
    return () => {
      unsub();
    };
  }, [currentUser, refreshCount]);

  return (
    <button
      onClick={handleClick}
      className={`relative group p-3 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-90 focus:outline-none focus:ring-2 focus:ring-app-primary/50 notification-bell ${
        isActive || isClicking
          ? 'bg-app-primary-soft text-app-primary shadow-lg'
          : 'text-app-muted hover:text-app hover:bg-app-surface-2'
      }`}
      title={`${isStaffRole(userProfile?.role) ? 'Staff ' : ''}Notifications`}
      aria-label={`${isStaffRole(userProfile?.role) ? 'Staff ' : ''}Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
    >
      {/* Click ripple */}
      {isClicking && (
        <span className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden">
          <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-app-primary/40 animate-ripple" />
        </span>
      )}

      {/* Notification Bell Icon — modern outline */}
      <div className={`relative origin-top ${isAnimating || isClicking ? 'animate-bell-ring' : ''}`}>
        <svg
          className={`w-6 h-6 transition-all duration-300 ${
            unreadCount > 0 ? 'drop-shadow-sm' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
          />
        </svg>

        {/* Unread Count Badge — anchored to the bell icon */}
        {unreadCount > 0 && (
          <span
            className={`
              absolute -top-1.5 -right-1.5
              min-w-[1.125rem] h-[1.125rem] px-1
              bg-rose-500 text-white
              text-[10px] font-semibold tabular-nums leading-none
              rounded-full ring-2 ring-[var(--app-header-bg)]
              flex items-center justify-center
              transition-all duration-300
              ${isActive ? 'opacity-90' : 'opacity-100'}
              ${isAnimating ? 'scale-110' : 'scale-100'}
            `}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* Hover Effect Ring */}
      <div className={`absolute inset-0 rounded-xl ring-2 transition-all duration-300 ${
        isClicking ? 'ring-app-primary/50' : 'ring-transparent group-hover:ring-app-primary/30'
      }`} />
      
      {/* Background Glow Effect */}
      {(unreadCount > 0 || isClicking) && (
        <div className={`absolute inset-0 rounded-xl bg-app-primary-soft transition-opacity duration-300 ${
          isClicking ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`} />
      )}
    </button>
  );
};

export default NotificationBell;
