// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api/client';
import { subscribeTicketEvents, subscribeNotificationEvents } from '@/lib/realtime/socketClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  StatsGridSkeleton,
  TicketListSkeleton,
  TablePanelSkeleton,
  ChartGridSkeleton,
} from '@/lib/ui/DashboardSkeletons';

const TicketList = dynamic(
  () => import('@/app/(dashboard)/_components/TicketList'),
  { loading: () => <TicketListSkeleton /> },
);
const UserManagement = dynamic(
  () => import('@/app/(dashboard)/admin/_components/UserManagement'),
  { loading: () => <TablePanelSkeleton rows={6} /> },
);
const FeedbackAnalytics = dynamic(
  () => import('@/app/(dashboard)/admin/_components/FeedbackAnalytics'),
  { loading: () => <ChartGridSkeleton /> },
);

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const ticketParam = searchParams.get('ticket');
  const openKey = searchParams.get('open');
  const focusConversation = searchParams.get('focus') === 'conversation';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validTabs = ['overview', 'tickets', 'users', 'feedback'];
    if (ticketParam) {
      setActiveTab('tickets');
    } else if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (!tabParam) {
      setActiveTab('overview');
    }
  }, [tabParam, ticketParam]);

  const displayTab = activeTab;

  const loadDashboardData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [tickets, usersData, feedbackData, notificationsData] = await Promise.all([
        api.get('/api/v1/tickets'),
        api.get('/api/v1/users/admin'),
        api.get('/api/v1/feedback'),
        api.get('/api/v1/notifications'),
      ]);
      setStats({
        total: tickets.length,
        open: tickets.filter((t) => t.status === 'open').length,
        inProgress: tickets.filter((t) => t.status === 'in-progress').length,
        resolved: tickets.filter((t) => t.status === 'resolved').length,
        critical: tickets.filter((t) => t.priority === 'critical').length,
        users: usersData.length,
        feedback: feedbackData.length,
      });
      setUsers(usersData);
      setNotifications(notificationsData);
      setUnreadNotifications(
        notificationsData.filter(
          (n) =>
            !n.read &&
            (n.adminNotification || n.userId === currentUser.uid),
        ).length,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (!message.toLowerCase().includes('session expired')) {
        console.error('Failed to load admin dashboard', err);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadDashboardData();
    const unsubTickets = subscribeTicketEvents(() => loadDashboardData(), () => loadDashboardData());
    const unsubNotifications = subscribeNotificationEvents(() => loadDashboardData());
    return () => {
      unsubTickets();
      unsubNotifications();
    };
  }, [loadDashboardData]);

  const StatCard = ({ title, value, color, icon, description }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 hover:border-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} backdrop-blur-sm flex-shrink-0`}>
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
        <nav className="flex space-x-1 sm:space-x-2 lg:space-x-4 xl:space-x-8 border-b border-gray-700 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap transition-all duration-200 ${
              displayTab === 'overview'
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
              displayTab === 'tickets'
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
              displayTab === 'users'
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
              displayTab === 'feedback'
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
      {displayTab === 'overview' && (
        <div className="space-y-5 pb-4">
          {loading ? (
            <div className="space-y-6">
              <StatsGridSkeleton count={4} />
              <StatsGridSkeleton count={3} />
            </div>
          ) : (
            <>
          {/* Ticket Overview — matches User Dashboard layout */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">Ticket Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                title="Total Tickets"
                value={stats.total}
                color="bg-blue-500/20"
                description="All system tickets"
                icon={
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
              <StatCard
                title="Open Tickets"
                value={stats.open}
                color="bg-red-500/20"
                description="Awaiting response"
                icon={
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                }
              />
              <StatCard
                title="In Progress"
                value={stats.inProgress}
                color="bg-yellow-500/20"
                description="Being worked on"
                icon={
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Resolved"
                value={stats.resolved}
                color="bg-green-500/20"
                description="Completed tickets"
                icon={
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Admin-specific metrics */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">System Metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <StatCard
                title="Critical"
                value={stats.critical}
                color="bg-purple-500/20"
                description="High-priority tickets"
                icon={
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                }
              />
              <StatCard
                title="Total Users"
                value={stats.users}
                color="bg-cyan-500/20"
                description="Registered accounts"
                icon={
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Feedback"
                value={stats.feedback}
                color="bg-indigo-500/20"
                description="User feedback received"
                icon={
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <button
                onClick={() => setActiveTab('tickets')}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Manage Tickets</h3>
                    <p className="text-sm text-emerald-100">View and manage all tickets</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-emerald-500/30 text-white p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors duration-300">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">User Management</h3>
                    <p className="text-sm text-gray-400">Manage user accounts and roles</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('feedback')}
                className="bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg text-white">Feedback Analytics</h3>
                    <p className="text-sm text-indigo-100">View feedback insights</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {displayTab === 'tickets' && (
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
            openTicketId={ticketParam}
            openKey={openKey}
            focusConversation={focusConversation}
          />
        </div>
      )}

      {displayTab === 'users' && (
        <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-8">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">User Management</h2>
            <UserManagement />
          </div>
        </div>
      )}

      {displayTab === 'feedback' && (
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
