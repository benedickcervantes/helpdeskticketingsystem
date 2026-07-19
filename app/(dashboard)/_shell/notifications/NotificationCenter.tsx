// @ts-nocheck
'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminNotifications, getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/utils/notifications';
import { isStaffRole } from '@/lib/utils/roles';
import {
  buildTicketDashboardUrl,
  isTicketLinkNotification,
} from '@/lib/utils/ticketNavigation';
import FeedbackForm from '@/app/(dashboard)/_components/FeedbackForm';
import { NotificationListSkeleton } from '@/lib/ui/DashboardSkeletons';

function notificationTime(value: unknown): number {
  if (!value) return 0;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  return new Date(String(value)).getTime();
}

const NotificationCenter = ({ isOpen, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [clickedNotification, setClickedNotification] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [notificationCenterVisible, setNotificationCenterVisible] = useState(true);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Enter / exit animation for the modal shell
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
      return () => cancelAnimationFrame(frame);
    }

    setIsVisible(false);
    const timer = window.setTimeout(() => {
      setIsRendered(false);
      setNotificationCenterVisible(true);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseNotificationCenter();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!currentUser || !isOpen) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const isStaff = isStaffRole(userProfile?.role);
    
    const sortByNewest = (items) =>
      [...items].sort(
        (a, b) => notificationTime(b.createdAt) - notificationTime(a.createdAt),
      );

    const unsubscribe = isStaff
      ? getAdminNotifications((notificationsData) => {
          setNotifications(sortByNewest(notificationsData));
          setLoading(false);
        })
      : getUserNotifications(currentUser.uid, (notificationsData) => {
          setNotifications(sortByNewest(notificationsData));
          setLoading(false);
        });

    return () => unsubscribe();
  }, [currentUser, userProfile, isOpen]);

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'read':
        return notification.read;
      case 'all':
      default:
        return true;
    }
  });

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setClickedNotification(notification.id);

    if (!notification.read) {
      void handleMarkAsRead(notification.id);
    }

    if (notification.type === 'feedback_requested' && notification.ticketId) {
      setNotificationCenterVisible(false);
      handleCloseNotificationCenter();
      setSelectedTicket({
        id: notification.ticketId,
        title: notification.ticketTitle || 'Feedback Request',
      });
      setShowFeedbackForm(true);
      setIsTransitioning(false);
      setClickedNotification(null);
      return;
    }

    if (isTicketLinkNotification(notification.type, notification.ticketId)) {
      const url = buildTicketDashboardUrl(
        userProfile?.role,
        notification.ticketId,
        {
          focusConversation: notification.type === 'ticket_message',
          openKey: Date.now(),
        },
      );

      handleCloseNotificationCenter();
      router.push(url);
      setIsTransitioning(false);
      setClickedNotification(null);
      return;
    }

    setIsTransitioning(false);
    setClickedNotification(null);
  };

  const handleCloseFeedbackForm = () => {
    setShowFeedbackForm(false);
    setSelectedTicket(null);
    setNotificationCenterVisible(true);
  };

  const handleCloseNotificationCenter = () => {
    setShowFeedbackForm(false);
    setSelectedTicket(null);
    setNotificationCenterVisible(true);
    setIsTransitioning(false);
    setClickedNotification(null);
    onClose();
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    } catch (error) {
      return 'Just now';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_ticket_created':
        return (
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'feedback_submitted':
        return (
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'ticket_resolved':
        return (
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'ticket_status_changed':
        return (
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'feedback_requested':
        return (
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case 'ticket_message':
        return (
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case 'ticket_assigned':
        return (
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gray-500/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.595-3.598A9.969 9.969 0 0118 9.5V7a6 6 0 10-12 0v2.5a9.969 9.969 0 001.595 3.902L5 17h5m5 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  if (!isRendered && !showFeedbackForm) return null;

  return (
    <>
      {isRendered && (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 transition-all duration-300 ease-out ${
          isVisible ? 'bg-gray-900/80 backdrop-blur-sm' : 'bg-gray-900/0 backdrop-blur-none'
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseNotificationCenter();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isStaffRole(userProfile?.role) ? 'Staff Notifications' : 'Your Notifications'}
          className={`relative bg-gray-800/95 border border-gray-700/80 rounded-2xl shadow-2xl shadow-emerald-950/40 w-full max-w-md sm:max-w-lg lg:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300 ease-out ${
            isVisible && notificationCenterVisible
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4'
          }`}
        >
          {/* Top accent */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500" />

          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700/80 bg-gradient-to-b from-gray-800 to-gray-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.595-3.598A9.969 9.969 0 0118 9.5V7a6 6 0 10-12 0v2.5a9.969 9.969 0 001.595 3.902L5 17h5m5 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-white truncate">
                {isStaffRole(userProfile?.role) ? 'Staff Notifications' : 'Your Notifications'}
              </h2>
            </div>
            <button
              onClick={handleCloseNotificationCenter}
              className="p-1 sm:p-2 text-gray-400 hover:text-white transition-all duration-200 rounded-lg hover:bg-gray-700 hover:rotate-90"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                filter === 'all'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-400/10'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                filter === 'unread'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-400/10'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Unread ({notifications.filter(n => !n.read).length})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                filter === 'read'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-400/10'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Read ({notifications.filter(n => n.read).length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <NotificationListSkeleton count={5} />
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-4">
                <div className="text-gray-400 text-4xl sm:text-6xl mb-3 sm:mb-4">
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.595-3.598A9.969 9.969 0 0118 9.5V7a6 6 0 10-12 0v2.5a9.969 9.969 0 001.595 3.902L5 17h5m5 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-white mb-2">
                  No {filter === 'all' ? '' : filter} notifications
                </h3>
                <p className="text-sm text-gray-400">
                  {filter === 'unread' 
                    ? 'All caught up! No unread notifications.'
                    : filter === 'read'
                    ? 'No read notifications yet.'
                    : isStaffRole(userProfile?.role)
                    ? 'You\'ll receive notifications when users create tickets or submit feedback.'
                    : 'You\'ll receive notifications when your tickets are updated or resolved.'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700/80">
                {filteredNotifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    style={{
                      animationDelay: isVisible ? `${Math.min(index, 8) * 35}ms` : '0ms',
                      animationFillMode: 'both',
                    }}
                    className={`p-3 sm:p-4 hover:bg-gray-700/50 transition-all duration-300 cursor-pointer relative overflow-hidden animate-slide-up-fade ${
                      !notification.read ? 'bg-gray-700/30' : ''
                    } ${
                      clickedNotification === notification.id 
                        ? 'bg-purple-500/20 scale-[0.98] shadow-lg' 
                        : ''
                    } ${
                      notification.type === 'feedback_requested' 
                        ? 'hover:bg-purple-500/10 hover:border-l-4 hover:border-purple-400' 
                        : isTicketLinkNotification(notification.type, notification.ticketId)
                        ? 'hover:bg-cyan-500/10 hover:border-l-4 hover:border-cyan-400'
                        : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {clickedNotification === notification.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent animate-pulse"></div>
                    )}
                    
                    <div className="flex items-start space-x-3 relative z-10">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm sm:text-base font-medium text-white truncate">
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-300 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.type === 'feedback_requested' && (
                          <div className="mt-2 flex items-center space-x-2">
                            <p className="text-xs sm:text-sm text-purple-400 font-medium">
                              Click to provide feedback
                            </p>
                            <svg className="w-4 h-4 text-purple-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                        )}
                        {notification.type === 'ticket_message' && notification.ticketId && (
                          <div className="mt-2 flex items-center space-x-2">
                            <p className="text-xs sm:text-sm text-cyan-400 font-medium">
                              Click to view conversation
                            </p>
                            <svg className="w-4 h-4 text-cyan-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                        )}
                        {notification.type === 'ticket_assigned' && notification.ticketId && (
                          <div className="mt-2 flex items-center space-x-2">
                            <p className="text-xs sm:text-sm text-blue-400 font-medium">
                              Click to view assigned ticket
                            </p>
                            <svg className="w-4 h-4 text-blue-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                        )}
                        {notification.type !== 'feedback_requested' &&
                          notification.type !== 'ticket_message' &&
                          notification.type !== 'ticket_assigned' &&
                          isTicketLinkNotification(notification.type, notification.ticketId) && (
                          <div className="mt-2 flex items-center space-x-2">
                            <p className="text-xs sm:text-sm text-emerald-400 font-medium">
                              Click to view ticket
                            </p>
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                        )}
                        {notification.priority && (
                          <div className="mt-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                              notification.priority === 'critical' 
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : notification.priority === 'high'
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : notification.priority === 'medium'
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                            }`}>
                              {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 sm:p-4 border-t border-gray-700">
              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm text-gray-400">
                <span>
                  {notifications.filter(n => !n.read).length} unread · {notifications.length} total
                </span>
                {notifications.some((n) => !n.read) && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-3 py-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg font-medium transition-colors whitespace-nowrap"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Feedback Form Modal with smooth transition */}
      {showFeedbackForm && selectedTicket && (
        <div className={`fixed inset-0 z-[60] transition-all duration-500 ease-in-out ${
          showFeedbackForm
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95'
        }`}>
          <FeedbackForm
            ticketId={selectedTicket.id}
            ticketTitle={selectedTicket.title}
            isOpen={showFeedbackForm}
            onClose={handleCloseFeedbackForm}
          />
        </div>
      )}
    </>
  );
};

export default NotificationCenter;
