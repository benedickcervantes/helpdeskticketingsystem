// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api/client';
import { subscribeTicketEvents } from '@/lib/realtime/socketClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  DashboardPageSkeleton,
  StatsGridSkeleton,
  ChartGridSkeleton,
  ExecutiveFeedbackSkeleton,
} from '@/lib/ui/DashboardSkeletons';

const ExecutiveSummary = dynamic(
  () => import('@/app/(dashboard)/management/_components/ExecutiveSummary'),
  { loading: () => <StatsGridSkeleton count={4} /> },
);
const AnalyticsOverview = dynamic(
  () => import('@/app/(dashboard)/management/_components/AnalyticsOverview'),
  { loading: () => <ChartGridSkeleton /> },
);
const PerformanceMetrics = dynamic(
  () => import('@/app/(dashboard)/management/_components/PerformanceMetrics'),
  { loading: () => <StatsGridSkeleton count={4} /> },
);
const DepartmentAnalytics = dynamic(
  () => import('@/app/(dashboard)/management/_components/DepartmentAnalytics'),
  { loading: () => <StatsGridSkeleton count={4} /> },
);
const TrendAnalysis = dynamic(
  () => import('@/app/(dashboard)/management/_components/TrendAnalysis'),
  { loading: () => <ChartGridSkeleton /> },
);
const ReportGenerator = dynamic(
  () => import('@/app/(dashboard)/management/_components/ReportGenerator'),
  { loading: () => <DashboardPageSkeleton showTabs={false} content="form" /> },
);
const ExecutiveFeedbackDashboard = dynamic(
  () => import('@/app/(dashboard)/management/_components/ExecutiveFeedbackDashboard'),
  { loading: () => <ExecutiveFeedbackSkeleton /> },
);

const TicketList = dynamic(
  () => import('@/app/(dashboard)/_components/TicketList'),
  { ssr: false },
);

const TABS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  },
  {
    id: 'departments',
    label: 'Departments',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    id: 'trends',
    label: 'Trends',
    icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    id: 'feedback',
    label: 'Feedback',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
];

const ManagementDashboard = () => {
  const searchParams = useSearchParams();
  const ticketParam = searchParams.get('ticket');
  const openKey = searchParams.get('open');
  const focusConversation = searchParams.get('focus') === 'conversation';
  const [activeTab, setActiveTab] = useState('overview');
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // Last 30 days
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [modalTicketSession, setModalTicketSession] = useState(null);

  const { userProfile } = useAuth();

  useEffect(() => {
    if (!ticketParam) return;
    setModalTicketSession({
      ticketId: ticketParam,
      openKey,
      focusConversation,
    });
  }, [ticketParam, openKey, focusConversation]);

  const loadData = useCallback(async () => {
    try {
      const [ticketsData, feedbackData] = await Promise.all([
        api.get('/api/v1/tickets'),
        api.get('/api/v1/feedback'),
      ]);
      let usersData = [];
      if (userProfile?.role === 'admin' || userProfile?.role === 'manager') {
        try {
          usersData = (await api.get('/api/v1/users/admin')) || [];
        } catch {
          usersData = [];
        }
      }
      const sortByDate = (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      setTickets([...(ticketsData || [])].sort(sortByDate));
      setUsers(usersData);
      setFeedback([...(feedbackData || [])].sort(sortByDate));
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to load management dashboard', err);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    loadData();
    const unsub = subscribeTicketEvents(() => loadData(), () => loadData());
    return () => unsub();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-app-gradient py-8">
        <DashboardPageSkeleton tabCount={7} content="charts" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="w-full max-w-7xl mx-auto min-w-0 px-2 sm:px-4 lg:px-6 xl:px-8 overflow-x-hidden">
        {/* Page Title and Description */}
        <div className="pt-3 sm:pt-6 pb-3 sm:pb-6">
          <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-app leading-tight">Management Dashboard</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base text-app-muted">Comprehensive analytics and insights for executive decision making</p>
        </div>

        {/* Mobile tab selector (iPhone SE and small phones) */}
        <div className="sm:hidden mb-4">
          <label htmlFor="management-tab-select" className="sr-only">Select dashboard section</label>
          <select
            id="management-tab-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full px-3 py-2.5 app-field border rounded-lg text-sm focus:outline-none"
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>{tab.label}</option>
            ))}
          </select>
        </div>

        {/* Navigation Tabs — equal-width, scrollable on tablet */}
        <div className="hidden sm:block mb-6 sm:mb-8 min-w-0">
          <div className="min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
            <nav
              className="flex w-max min-w-full flex-nowrap items-stretch border-b border-app"
              aria-label="Management sections"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-label={tab.label}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 basis-0 items-center justify-center min-w-[6.75rem] sm:min-w-[7.5rem] xl:min-w-0 px-2 sm:px-3 py-2.5 sm:py-3 border-b-2 font-medium text-sm xl:text-base whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-app-primary text-app-primary bg-app-primary-soft'
                      : 'border-transparent text-app-muted hover:text-app-soft hover:border-app hover:bg-app-surface-2/40'
                  }`}
                >
                  <span className="flex items-center gap-1.5 xl:gap-2">
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                    </svg>
                    <span>{tab.label}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-8 pb-4 sm:pb-8">
            <ExecutiveSummary
              tickets={tickets}
              users={users}
              feedback={feedback}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onNavigateToTab={setActiveTab}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4 sm:space-y-8 pb-4 sm:pb-8">
            <AnalyticsOverview
              tickets={tickets}
              users={users}
              feedback={feedback}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-4 sm:space-y-8 pb-4 sm:pb-8">
            <PerformanceMetrics 
              tickets={tickets} 
              users={users} 
              feedback={feedback}
              dateRange={dateRange}
            />
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="space-y-4 sm:space-y-8 pb-4 sm:pb-8">
            <DepartmentAnalytics 
              tickets={tickets} 
              users={users} 
              feedback={feedback}
              dateRange={dateRange}
            />
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-4 sm:space-y-8 pb-4 sm:pb-8">
            <TrendAnalysis 
              tickets={tickets} 
              users={users} 
              feedback={feedback}
              dateRange={dateRange}
            />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4 sm:space-y-8 pb-4 sm:pb-8">
            <ReportGenerator 
              tickets={tickets} 
              users={users} 
              feedback={feedback}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-4 sm:space-y-8 pb-4 sm:pb-8">
            <ExecutiveFeedbackDashboard
              tickets={tickets}
              users={users}
              feedback={feedback}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        )}
      </div>

      {modalTicketSession && (
        <TicketList
          showAllTickets
          openTicketId={modalTicketSession.ticketId}
          openKey={modalTicketSession.openKey}
          focusConversation={modalTicketSession.focusConversation}
          modalOnly
          onTicketModalClose={() => setModalTicketSession(null)}
        />
      )}
    </div>
  );
};

export default ManagementDashboard;
