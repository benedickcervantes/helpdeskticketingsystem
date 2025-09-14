'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAdminNotifications, getUserNotifications, markNotificationAsRead } from '../lib/notificationUtils';
import FeedbackForm from './FeedbackForm';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [clickedNotification, setClickedNotification] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [notificationCenterVisible, setNotificationCenterVisible] = useState(true);

  useEffect(() => {
    if (!currentUser || !isOpen) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Check if user is admin - FIXED: Use userProfile.role instead of currentUser.role
    const isAdmin = userProfile?.role === 'admin';
    
    const unsubscribe = isAdmin 
      ? getAdminNotifications((snapshot) => {
          const notificationsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Sort by creation date (newest first)
          notificationsData.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return bTime - aTime;
          });
          
          setNotifications(notificationsData);
          setLoading(false);
        })
      : getUserNotifications(currentUser.uid, (snapshot) => {
          const notificationsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Sort by creation date (newest first)
          notificationsData.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return bTime - aTime;
          });
          
          setNotifications(notificationsData);
          setLoading(false);
        });

    return () => unsubscribe();
  }, [currentUser, userProfile, isOpen]);

  // Filter notifications based on selected filter
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
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Add smooth transition effect
    setIsTransitioning(true);
    setClickedNotification(notification.id);

    // Mark as read if unread
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    // If it's a feedback requested notification, transition to feedback form
    if (notification.type === 'feedback_requested' && notification.ticketId) {
      // Start the transition animation
      setNotificationCenterVisible(false);
      
      // After animation completes, show feedback form
      setTimeout(() => {
        setSelectedTicket({
          id: notification.ticketId,
          title: notification.ticketTitle || 'Feedback Request'
        });
        setShowFeedbackForm(true);
        setIsTransitioning(false);
        setClickedNotification(null);
      }, 400); // 400ms for smooth transition
    } else {
      // For other notifications, just mark as read
      setTimeout(() => {
        setIsTransitioning(false);
        setClickedNotification(null);
      }, 150);
    }
  };

  const handleCloseFeedbackForm = () => {
    setShowFeedbackForm(false);
    setSelectedTicket(null);
    // Reset notification center visibility when feedback form closes
    setNotificationCenterVisible(true);
  };

  const handleCloseNotificationCenter = () => {
    // Reset all states when closing
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
      const diffInSeconds = Math.floor((now - date) / 1000);
      
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Notification Center with smooth transition */}
        <div className={`bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg lg:max-w-2xl max-h-[90vh] flex flex-col transition-all duration-500 ease-in-out ${
          notificationCenterVisible 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-white">
              {userProfile?.role === 'admin' ? 'Admin Notifications' : 'Your Notifications'}
            </h2>
            <button
              onClick={handleCloseNotificationCenter}
              className="p-1 sm:p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
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
              <div className="flex items-center justify-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-emerald-500"></div>
              </div>
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
                    : userProfile?.role === 'admin' 
                    ? 'You\'ll receive notifications when users create tickets or submit feedback.'
                    : 'You\'ll receive notifications when your tickets are updated or resolved.'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 sm:p-4 hover:bg-gray-700/50 transition-all duration-300 cursor-pointer relative overflow-hidden ${
                      !notification.read ? 'bg-gray-700/30' : ''
                    } ${
                      clickedNotification === notification.id 
                        ? 'bg-purple-500/20 scale-[0.98] shadow-lg' 
                        : ''
                    } ${
                      notification.type === 'feedback_requested' 
                        ? 'hover:bg-purple-500/10 hover:border-l-4 hover:border-purple-400' 
                        : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Smooth click effect overlay */}
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
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-400">
                <span>
                  {notifications.filter(n => !n.read).length} unread notifications
                </span>
                <span>
                  {notifications.length} total notifications
                </span>
              </div>
            </div>
          )}
        </div>

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
      </div>
    </>
  );
};

export default NotificationCenter;
