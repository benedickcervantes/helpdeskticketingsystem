'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebaseconfig';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import TicketList from './TicketList';
import UserManagement from './UserManagement';
import FeedbackAnalytics from './FeedbackAnalytics';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
    users: 0,
    feedback: 0
  });
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    // Listen to tickets for stats
    const ticketsQuery = query(collection(db, 'tickets'));
    const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
      const tickets = snapshot.docs.map(doc => doc.data());
      
      setStats(prev => ({
        ...prev,
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in-progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        critical: tickets.filter(t => t.priority === 'critical').length
      }));
    });

    // Listen to users
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setStats(prev => ({ ...prev, users: usersData.length }));
    });

    // Listen to feedback
    const feedbackQuery = query(collection(db, 'feedback'));
    const unsubscribeFeedback = onSnapshot(feedbackQuery, (snapshot) => {
      const feedbackData = snapshot.docs.map(doc => doc.data());
      setStats(prev => ({ ...prev, feedback: feedbackData.length }));
    });

    // Listen to admin notifications
    if (currentUser) {
      const adminNotificationsQuery = query(
        collection(db, 'notifications'),
        where('adminNotification', '==', true)
      );
      const unsubscribeNotifications = onSnapshot(adminNotificationsQuery, (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notificationsData);
        setUnreadNotifications(notificationsData.filter(n => !n.read).length);
      });

      return () => {
        unsubscribeTickets();
        unsubscribeUsers();
        unsubscribeFeedback();
        unsubscribeNotifications();
      };
    }

    return () => {
      unsubscribeTickets();
      unsubscribeUsers();
      unsubscribeFeedback();
    };
  }, [currentUser]);

  const StatCard = ({ title, value, color, icon, trend, trendValue }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 hover:border-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-xs ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trend === 'up' ? 'M7 17l9.2-9.2M17 17V7H7' : 'M17 7l-9.2 9.2M7 7v10h10'} />
              </svg>
              {trendValue}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} backdrop-blur-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
      {/* Page Title and Description - Enhanced Responsive Design */}
      <div className="pt-4 sm:pt-6 pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white">Admin Dashboard</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg text-gray-400">Manage tickets, users, and system settings</p>
          </div>
          
          {/* Admin Notification Badge */}
          {unreadNotifications > 0 && (
            <div className="flex items-center space-x-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-3 py-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.595-3.598A9.969 9.969 0 0118 9.5V7a6 6 0 10-12 0v2.5a9.969 9.969 0 001.595 3.902L5 17h5m5 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-sm font-medium text-emerald-400">{unreadNotifications} new notifications</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Navigation Tabs - Mobile Optimized */}
      <div className="mb-6 sm:mb-8">
        <nav className="flex space-x-1 sm:space-x-2 lg:space-x-4 xl:space-x-8 border-b border-gray-700 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap transition-all duration-200 ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500 hover:bg-gray-800/30'
            }`}
          >
            <span className="flex items-center space-x-1 sm:space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span className="hidden sm:inline">Overview</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap transition-all duration-200 ${
              activeTab === 'tickets'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500 hover:bg-gray-800/30'
            }`}
          >
            <span className="flex items-center space-x-1 sm:space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">All Tickets</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap transition-all duration-200 ${
              activeTab === 'users'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500 hover:bg-gray-800/30'
            }`}
          >
            <span className="flex items-center space-x-1 sm:space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span className="hidden sm:inline">User Management</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap transition-all duration-200 ${
              activeTab === 'feedback'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500 hover:bg-gray-800/30'
            }`}
          >
            <span className="flex items-center space-x-1 sm:space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden sm:inline">Feedback Analytics</span>
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-8">
          {/* Enhanced Statistics Cards - Mobile Responsive */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">System Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3 sm:gap-4 lg:gap-6">
              <StatCard
                title="Total Tickets"
                value={stats.total}
                color="bg-blue-500/20"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
              <StatCard
                title="Open Tickets"
                value={stats.open}
                color="bg-red-500/20"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                }
              />
              <StatCard
                title="In Progress"
                value={stats.inProgress}
                color="bg-yellow-500/20"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Resolved"
                value={stats.resolved}
                color="bg-green-500/20"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Critical"
                value={stats.critical}
                color="bg-purple-500/20"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                }
              />
              <StatCard
                title="Total Users"
                value={stats.users}
                color="bg-cyan-500/20"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Feedback"
                value={stats.feedback}
                color="bg-indigo-500/20"
                icon={
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Enhanced Quick Actions - Mobile Responsive */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <button
                onClick={() => setActiveTab('tickets')}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white p-4 sm:p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-300">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm sm:text-lg">Manage Tickets</h3>
                    <p className="text-xs sm:text-sm text-emerald-100">View and manage all tickets</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-emerald-500/30 text-white p-4 sm:p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors duration-300">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm sm:text-lg">User Management</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Manage user accounts and roles</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('feedback')}
                className="bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white p-4 sm:p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-300">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm sm:text-lg text-white">Feedback Analytics</h3>
                    <p className="text-xs sm:text-sm text-indigo-100">View feedback insights</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-8">
          {/* Enhanced Admin Ticket Management Header */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">All Support Tickets</h2>
              <p className="text-xs sm:text-sm text-gray-400">Comprehensive ticket management with advanced filtering and search</p>
            </div>
            
            {/* Admin-specific quick stats - Mobile Responsive */}
            <div className="flex flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm">
              <div className="bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">
                {stats.open} Open
              </div>
              <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">
                {stats.inProgress} In Progress
              </div>
              <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30">
                {stats.critical} Critical
              </div>
            </div>
          </div>

          {/* Enhanced TicketList with admin privileges */}
          <TicketList 
            showAllTickets={true} 
            showUserTicketsOnly={false}
            adminMode={true}
          />
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-8">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">User Management</h2>
            <UserManagement users={users} />
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-8">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Feedback Analytics</h2>
            <FeedbackAnalytics />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
