// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api/client';
import { subscribeTicketEvents, subscribeDepartmentEvents } from '@/lib/realtime/socketClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  ExecutiveGlanceSkeleton,
  ExecutiveChartsSkeleton,
  ExecutiveServiceQualitySkeleton,
  ExecutiveByTeamSkeleton,
  ExecutiveReportsSkeleton,
  ExecutiveFeedbackSkeleton,
  getExecutiveTabSkeleton,
} from '@/lib/ui/DashboardSkeletons';

const TAB_IMPORTS = {
  overview: () => import('@/app/(dashboard)/management/_components/ExecutiveSummary'),
  analytics: () => import('@/app/(dashboard)/management/_components/AnalyticsOverview'),
  performance: () => import('@/app/(dashboard)/management/_components/PerformanceMetrics'),
  departments: () => import('@/app/(dashboard)/management/_components/DepartmentAnalytics'),
  reports: () => import('@/app/(dashboard)/management/_components/ReportGenerator'),
  feedback: () =>
    import('@/app/(dashboard)/management/_components/ExecutiveFeedbackDashboard'),
};

const ExecutiveSummary = dynamic(TAB_IMPORTS.overview, {
  ssr: false,
  loading: () => <ExecutiveGlanceSkeleton />,
});
const AnalyticsOverview = dynamic(TAB_IMPORTS.analytics, {
  ssr: false,
  loading: () => <ExecutiveChartsSkeleton />,
});
const PerformanceMetrics = dynamic(TAB_IMPORTS.performance, {
  ssr: false,
  loading: () => <ExecutiveServiceQualitySkeleton />,
});
const DepartmentAnalytics = dynamic(TAB_IMPORTS.departments, {
  ssr: false,
  loading: () => <ExecutiveByTeamSkeleton />,
});
const ReportGenerator = dynamic(TAB_IMPORTS.reports, {
  ssr: false,
  loading: () => <ExecutiveReportsSkeleton />,
});
const ExecutiveFeedbackDashboard = dynamic(TAB_IMPORTS.feedback, {
  ssr: false,
  loading: () => <ExecutiveFeedbackSkeleton />,
});

const TicketList = dynamic(
  () => import('@/app/(dashboard)/_components/TicketList'),
  { ssr: false },
);

const TABS = [
  {
    id: 'overview',
    label: 'At a Glance',
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
  },
  {
    id: 'analytics',
    label: 'Charts',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    id: 'performance',
    label: 'Service Quality',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  },
  {
    id: 'departments',
    label: 'By Team',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
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
  const [modalTicketSession, setModalTicketSession] = useState(null);
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(['overview']));

  const { userProfile } = useAuth();

  useEffect(() => {
    if (!ticketParam) return;
    setModalTicketSession({
      ticketId: ticketParam,
      openKey,
      focusConversation,
    });
  }, [ticketParam, openKey, focusConversation]);

  const selectTab = useCallback((tabId) => {
    setActiveTab(tabId);
    setVisitedTabs((prev) => {
      if (prev.has(tabId)) return prev;
      const next = new Set(prev);
      next.add(tabId);
      return next;
    });
  }, []);

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
    } catch (err) {
      console.error('Failed to load management dashboard', err);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    loadData();
    const unsubTickets = subscribeTicketEvents(() => loadData(), () => loadData());
    // When departments are renamed/added/removed, refresh users so By Team stays in sync
    const unsubDepartments = subscribeDepartmentEvents(() => loadData());
    return () => {
      unsubTickets();
      unsubDepartments();
    };
  }, [loadData]);

  // Prefetch remaining tab chunks after first data load so tab switches feel instant
  useEffect(() => {
    if (loading) return undefined;

    const prefetch = () => {
      Object.entries(TAB_IMPORTS).forEach(([id, load]) => {
        if (id === activeTab) return;
        void load();
      });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(prefetch, { timeout: 2000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = setTimeout(prefetch, 400);
    return () => clearTimeout(timer);
  }, [loading, activeTab]);

  const sharedProps = {
    tickets,
    users,
    feedback,
    dateRange,
    onDateRangeChange: setDateRange,
  };

  const renderTabContent = () => {
    if (loading) {
      return getExecutiveTabSkeleton(activeTab);
    }

    // Keep visited tabs mounted (hidden) so switching back is instant
    return (
      <>
        {visitedTabs.has('overview') && (
          <div
            className={activeTab === 'overview' ? 'space-y-4 sm:space-y-8 pb-4 sm:pb-8' : 'hidden'}
            aria-hidden={activeTab !== 'overview'}
          >
            <ExecutiveSummary {...sharedProps} onNavigateToTab={selectTab} />
          </div>
        )}
        {visitedTabs.has('analytics') && (
          <div
            className={activeTab === 'analytics' ? 'space-y-4 sm:space-y-8 pb-4 sm:pb-8' : 'hidden'}
            aria-hidden={activeTab !== 'analytics'}
          >
            <AnalyticsOverview {...sharedProps} />
          </div>
        )}
        {visitedTabs.has('performance') && (
          <div
            className={
              activeTab === 'performance' ? 'space-y-4 sm:space-y-8 pb-4 sm:pb-8' : 'hidden'
            }
            aria-hidden={activeTab !== 'performance'}
          >
            <PerformanceMetrics {...sharedProps} />
          </div>
        )}
        {visitedTabs.has('departments') && (
          <div
            className={
              activeTab === 'departments' ? 'space-y-4 sm:space-y-8 pb-4 sm:pb-8' : 'hidden'
            }
            aria-hidden={activeTab !== 'departments'}
          >
            <DepartmentAnalytics {...sharedProps} />
          </div>
        )}
        {visitedTabs.has('reports') && (
          <div
            className={activeTab === 'reports' ? 'space-y-4 sm:space-y-8 pb-4 sm:pb-8' : 'hidden'}
            aria-hidden={activeTab !== 'reports'}
          >
            <ReportGenerator {...sharedProps} />
          </div>
        )}
        {visitedTabs.has('feedback') && (
          <div
            className={activeTab === 'feedback' ? 'space-y-4 sm:space-y-8 pb-4 sm:pb-8' : 'hidden'}
            aria-hidden={activeTab !== 'feedback'}
          >
            <ExecutiveFeedbackDashboard {...sharedProps} />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="w-full max-w-7xl mx-auto min-w-0 px-2 sm:px-4 lg:px-6 xl:px-8 overflow-x-hidden">
        {/* Page Title and Description — always visible (shell-first) */}
        <div className="pt-3 sm:pt-6 pb-3 sm:pb-6">
          <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-app leading-tight">
            Executive Dashboard
          </h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base text-app-muted">
            Clear view of IT support status — no technical jargon required
          </p>
        </div>

        {/* Mobile tab selector */}
        <div className="sm:hidden mb-4">
          <label htmlFor="management-tab-select" className="sr-only">
            Select dashboard section
          </label>
          <select
            id="management-tab-select"
            value={activeTab}
            onChange={(e) => selectTab(e.target.value)}
            className="w-full px-3 py-2.5 app-field border rounded-lg text-sm focus:outline-none"
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Tabs */}
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
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  onClick={() => selectTab(tab.id)}
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={tab.icon}
                      />
                    </svg>
                    <span>{tab.label}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab content or matching skeleton while data loads */}
        {renderTabContent()}
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
