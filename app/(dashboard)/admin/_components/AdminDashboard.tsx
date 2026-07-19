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
  {
    ssr: false,
    loading: () => <TicketListSkeleton />,
  },
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
  const { currentUser, userProfile } = useAuth();
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
        total: tickets?.length || 0,
        open: (tickets || []).filter((t) => t.status === 'open').length,
        inProgress: (tickets || []).filter((t) => t.status === 'in-progress').length,
        resolved: (tickets || []).filter((t) => t.status === 'resolved').length,
        critical: (tickets || []).filter((t) => t.priority === 'critical').length,
        users: usersData?.length || 0,
        feedback: feedbackData?.length || 0,
      });
      setUnreadNotifications(
        (notificationsData || []).filter(
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

  const firstName = userProfile?.name?.split(' ')[0] || 'Admin';
  const profilePhotoURL = userProfile?.photoURL || userProfile?.photo_url || null;
  const activeTickets = stats.open + stats.inProgress;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
      <div className="pt-4 sm:pt-6 pb-4 sm:pb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-400">
          Manage tickets, users, and system settings
        </p>
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
        <div className="space-y-6 pb-6">
          {loading ? (
            <div className="space-y-6">
              <StatsGridSkeleton count={4} />
              <StatsGridSkeleton count={3} />
            </div>
          ) : (
            <>
              {/* Welcome + primary actions */}
              <section className="relative overflow-hidden rounded-2xl border border-gray-700/60 bg-gradient-to-br from-gray-800/70 to-gray-900/80 px-5 py-5 sm:px-7 sm:py-6">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500" />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5 min-w-0">
                    {profilePhotoURL ? (
                      <img
                        src={profilePhotoURL}
                        alt={userProfile?.name || 'Admin'}
                        className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-xl object-cover border border-emerald-500/30 shadow-lg shadow-emerald-950/30"
                      />
                    ) : (
                      <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-white font-semibold text-lg border border-emerald-500/30 shadow-lg shadow-emerald-950/30">
                        {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-emerald-400/90 font-medium">Admin console</p>
                      <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5 truncate">
                        Hi, {firstName}
                      </h2>
                      <p className="text-sm text-gray-400 mt-1.5">
                        {activeTickets > 0
                          ? `${activeTickets} active ticket${activeTickets === 1 ? '' : 's'} across the system.`
                          : stats.total > 0
                            ? 'No active tickets right now — queue is clear.'
                            : 'No tickets yet. Waiting for the first support request.'}
                        {unreadNotifications > 0 && (
                          <span className="text-emerald-400/90">
                            {' '}· {unreadNotifications} unread notification{unreadNotifications === 1 ? '' : 's'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('tickets')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Manage Tickets
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('users')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-600 bg-gray-800/60 hover:bg-gray-700/60 hover:border-gray-500 text-gray-200 text-sm font-medium px-4 py-2.5 transition-colors"
                    >
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      Users
                    </button>
                  </div>
                </div>
              </section>

              {/* Ticket Overview */}
              <section>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Ticket Overview</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tickets')}
                    className="text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    See all
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      label: 'Total',
                      value: stats.total,
                      accent: 'text-white',
                      bar: 'bg-blue-500',
                      iconBg: 'bg-blue-500/20',
                      iconColor: 'text-blue-400',
                      hint: 'All system tickets',
                      icon: (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ),
                    },
                    {
                      label: 'Open',
                      value: stats.open,
                      accent: 'text-rose-300',
                      bar: 'bg-rose-500',
                      iconBg: 'bg-rose-500/20',
                      iconColor: 'text-rose-400',
                      hint: 'Awaiting response',
                      icon: (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      ),
                    },
                    {
                      label: 'In progress',
                      value: stats.inProgress,
                      accent: 'text-amber-300',
                      bar: 'bg-amber-500',
                      iconBg: 'bg-amber-500/20',
                      iconColor: 'text-amber-400',
                      hint: 'Being worked on',
                      icon: (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                    },
                    {
                      label: 'Resolved',
                      value: stats.resolved,
                      accent: 'text-emerald-300',
                      bar: 'bg-emerald-400',
                      iconBg: 'bg-emerald-500/20',
                      iconColor: 'text-emerald-400',
                      hint: 'Completed tickets',
                      icon: (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                    },
                  ].map((stat) => (
                    <button
                      key={stat.label}
                      type="button"
                      onClick={() => setActiveTab('tickets')}
                      className="group text-left rounded-xl border border-gray-700/70 bg-gray-800/40 hover:bg-gray-800/70 hover:border-emerald-500/30 px-4 py-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <div className={`accent-hover-line ${stat.bar}`} aria-hidden="true" />
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                          <p className={`text-2xl sm:text-3xl font-bold mt-1.5 tabular-nums ${stat.accent}`}>
                            {stat.value}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1">{stat.hint}</p>
                        </div>
                        <div className={`p-2.5 sm:p-3 rounded-xl ${stat.iconBg} ${stat.iconColor} group-hover:scale-105 transition-transform`}>
                          {stat.icon}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* System Metrics */}
              <section>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-white">System Metrics</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Critical',
                      value: stats.critical,
                      accent: 'text-purple-300',
                      bar: 'bg-purple-500',
                      iconBg: 'bg-purple-500/20',
                      iconColor: 'text-purple-400',
                      hint: 'High-priority tickets',
                      tab: 'tickets',
                      icon: (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      ),
                    },
                    {
                      label: 'Total Users',
                      value: stats.users,
                      accent: 'text-cyan-300',
                      bar: 'bg-cyan-500',
                      iconBg: 'bg-cyan-500/20',
                      iconColor: 'text-cyan-400',
                      hint: 'Registered accounts',
                      tab: 'users',
                      icon: (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      ),
                    },
                    {
                      label: 'Feedback',
                      value: stats.feedback,
                      accent: 'text-indigo-300',
                      bar: 'bg-indigo-500',
                      iconBg: 'bg-indigo-500/20',
                      iconColor: 'text-indigo-400',
                      hint: 'User feedback received',
                      tab: 'feedback',
                      icon: (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      ),
                    },
                  ].map((stat) => (
                    <button
                      key={stat.label}
                      type="button"
                      onClick={() => setActiveTab(stat.tab)}
                      className="group text-left rounded-xl border border-gray-700/70 bg-gray-800/40 hover:bg-gray-800/70 hover:border-emerald-500/30 px-4 py-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <div className={`accent-hover-line ${stat.bar}`} aria-hidden="true" />
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                          <p className={`text-2xl sm:text-3xl font-bold mt-1.5 tabular-nums ${stat.accent}`}>
                            {stat.value}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1">{stat.hint}</p>
                        </div>
                        <div className={`p-2.5 sm:p-3 rounded-xl ${stat.iconBg} ${stat.iconColor} group-hover:scale-105 transition-transform`}>
                          {stat.icon}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {displayTab === 'tickets' && (
        <div className="space-y-5 pb-4">
          <div className="relative overflow-hidden rounded-2xl border border-gray-700/60 bg-gradient-to-br from-gray-800/50 to-gray-900/60 px-4 py-4 sm:px-5 sm:py-5">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-white">All Support Tickets</h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Manage, assign, and resolve support requests
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-xs sm:text-sm font-medium text-rose-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  {stats.open} Open
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs sm:text-sm font-medium text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {stats.inProgress} In Progress
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/15 px-3 py-1.5 text-xs sm:text-sm font-medium text-purple-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  {stats.critical} Critical
                </span>
              </div>
            </div>
          </div>

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
