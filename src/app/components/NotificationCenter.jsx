'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserNotifications, markNotificationAsRead, NOTIFICATION_TYPES } from '../lib/notificationUtils';
import { db } from '../firebaseconfig';
import { getTicketFeedbackStatus } from '../lib/notificationUtils';import { doc, getDoc } from 'firebase/firestore';
import FeedbackForm from './FeedbackForm';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedTicketForFeedback, setSelectedTicketForFeedback] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const containerRef = useRef(null);
  const [feedbackStatus, setFeedbackStatus] = useState({});
  
  useEffect(() => {
    if (!currentUser || !isOpen) return;

    const unsubscribe = getUserNotifications(currentUser.uid, (snapshot) => {
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
  }, [currentUser, isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifications.map(n => markNotificationAsRead(n.id)));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    // If it's a feedback request notification, open feedback form
    if (notification.type === NOTIFICATION_TYPES.FEEDBACK_REQUESTED) {
      try {
        const ticketDoc = await getDoc(doc(db, 'tickets', notification.ticketId));
        if (ticketDoc.exists()) {
          const ticketData = ticketDoc.data();
          setSelectedTicketForFeedback({
            id: notification.ticketId,
            title: ticketData.title
          });
          setShowFeedbackForm(true);
        }
      } catch (error) {
        console.error('Error fetching ticket details:', error);
      }
    }
  };

  const getNotificationIcon = (type) => {
    const iconClasses = "w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 transition-all duration-300";
    
    switch (type) {
      case NOTIFICATION_TYPES.TICKET_RESOLVED:
        return (
          <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors duration-300">
            <svg className={`${iconClasses} text-emerald-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case NOTIFICATION_TYPES.FEEDBACK_REQUESTED:
        return (
          <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors duration-300">
            <svg className={`${iconClasses} text-cyan-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-1.5 sm:p-2 rounded-lg bg-gray-500/20 group-hover:bg-gray-500/30 transition-colors duration-300">
            <svg className={`${iconClasses} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInMinutes = (now - date) / (1000 * 60);
      const diffInHours = diffInMinutes / 60;
      const diffInDays = diffInHours / 24;
      
      if (diffInMinutes < 1) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${Math.floor(diffInMinutes)}m ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else if (diffInDays < 7) {
        return `${Math.floor(diffInDays)}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Don't render if notification center is not open
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Notification Panel - Better responsive sizing */}
      <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-full max-w-sm sm:w-80 md:w-96 lg:w-[24rem] xl:w-[28rem] z-50">
        <div 
          ref={containerRef}
          className="h-full bg-gray-900/95 backdrop-blur-xl border-l border-gray-700/50 shadow-2xl transform transition-transform duration-300 ease-out"
        >
          <div className="flex flex-col h-full">
            {/* Header - Compact and responsive */}
            <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/20">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.595-3.598A9.969 9.969 0 0118 9.5V7a6 6 0 10-12 0v2.5a9.969 9.969 0 001.595 3.902L5 17h5m5 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Notifications</h2>
                    <p className="text-xs sm:text-sm text-gray-400">
                      {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  aria-label="Close notifications"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Filter Tabs - More compact */}
              <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg">
                {[
                  { id: 'all', label: 'All', count: notifications.length },
                  { id: 'unread', label: 'Unread', count: unreadCount },
                  { id: 'read', label: 'Read', count: notifications.length - unreadCount }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                      filter === tab.id
                        ? 'bg-emerald-500/20 text-emerald-400 shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.charAt(0)}</span>
                    {tab.count > 0 && (
                      <span className={`ml-1 text-xs px-1 sm:px-1.5 py-0.5 rounded-full ${
                        filter === tab.id ? 'bg-emerald-500/30' : 'bg-gray-600/50'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Actions */}
              {unreadCount > 0 && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 transition-colors duration-200 font-medium"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>

            {/* Content - Optimized for mobile */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {loading ? (
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex space-x-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-700 rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-3 sm:h-4 bg-gray-700 rounded w-3/4"></div>
                            <div className="h-2 sm:h-3 bg-gray-700 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-white mb-2">
                      {filter === 'unread' ? 'No unread notifications' : 
                       filter === 'read' ? 'No read notifications' : 
                       'No notifications'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {filter === 'all' ? "You're all caught up!" : 
                       filter === 'unread' ? 'All notifications have been read' :
                       'No read notifications to show'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 sm:p-4 lg:p-6 space-y-3">
                  {filteredNotifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`group relative p-3 sm:p-4 rounded-xl border transition-all duration-300 cursor-pointer transform hover:scale-[1.01] notification-item-mobile ${
                        notification.read 
                          ? 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50' 
                          : 'bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/30 hover:from-emerald-500/20 hover:to-cyan-500/20 shadow-lg hover:shadow-emerald-500/10'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1 sm:mb-2">
                            <h4 className={`text-xs sm:text-sm font-semibold ${
                              notification.read ? 'text-gray-300' : 'text-white'
                            }`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatDate(notification.createdAt)}
                              </span>
                              {!notification.read && (
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                          </div>
                          
                          <p className={`text-xs sm:text-sm mb-2 sm:mb-3 ${
                            notification.read ? 'text-gray-400' : 'text-gray-300'
                          }`}>
                            {notification.message}
                          </p>
                          
                          {/* Notification Type Specific Content */}
                          {notification.type === NOTIFICATION_TYPES.TICKET_RESOLVED && (
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full ${ 
                                notification.priority === 'critical' ? 'bg-red-500/20 text-red-400' : 
                                notification.priority === 'high' ? 'bg-orange-500/20 text-orange-400' : 
                                notification.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                                'bg-emerald-500/20 text-emerald-400' 
                              }`}>
                                {notification.priority?.charAt(0).toUpperCase() + notification.priority?.slice(1)} Priority
                              </span>
                              <span className="inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full bg-gray-600/50 text-gray-300">
                                {notification.category?.charAt(0).toUpperCase() + notification.category?.slice(1)}
                              </span>
                              {notification.autoResolved && (
                                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span className="hidden sm:inline">Auto-Resolved</span>
                                  <span className="sm:hidden">Auto</span>
                                </span>
                              )}
                            </div>
                          )}
                          
                          {notification.type === NOTIFICATION_TYPES.FEEDBACK_REQUESTED && (
                            <div className="mt-1 sm:mt-2">
                              <span className="inline-flex items-center px-2 sm:px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30">
                                <svg className="w-2 h-2 sm:w-3 sm:h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                </svg>
                                <span className="hidden sm:inline">Click to provide feedback</span>
                                <span className="sm:hidden">Feedback</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Form */}
      <FeedbackForm
        isOpen={showFeedbackForm}
        onClose={() => {
          setShowFeedbackForm(false);
          setSelectedTicketForFeedback(null);
        }}
        ticketId={selectedTicketForFeedback?.id}
        ticketTitle={selectedTicketForFeedback?.title}
      />
    </>
  );
};

export default NotificationCenter;
