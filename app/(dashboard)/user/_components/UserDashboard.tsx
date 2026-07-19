// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/client';
import { subscribeTicketEvents } from '@/lib/realtime/socketClient';
import {
  StatsGridSkeleton,
  TicketListSkeleton,
  TicketFormSkeleton,
} from '@/lib/ui/DashboardSkeletons';

const TicketForm = dynamic(
  () => import('@/app/(dashboard)/_components/TicketForm'),
  {
    ssr: false,
    loading: () => <TicketFormSkeleton />,
  },
);
const TicketList = dynamic(
  () => import('@/app/(dashboard)/_components/TicketList'),
  {
    ssr: false,
    loading: () => <TicketListSkeleton />,
  },
);

const UserDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const ticketParam = searchParams.get('ticket');
  const openKey = searchParams.get('open');
  const focusConversation = searchParams.get('focus') === 'conversation';
  const [activeTab, setActiveTab] = useState('overview');
  const [ticketFilter, setTicketFilter] = useState('all'); // 'all' or 'my'
  const [allTicketsStats, setAllTicketsStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });
  const [myTicketsStats, setMyTicketsStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const goToTickets = (filter = 'all') => {
    setTicketFilter(filter);
    setActiveTab('tickets');
  };

  useEffect(() => {
    if (tabParam === 'tickets') {
      setActiveTab('tickets');
    } else if (tabParam === 'create') {
      setActiveTab('create');
    } else if (!tabParam) {
      setActiveTab('overview');
    }
  }, [tabParam]);

  useEffect(() => {
    if (ticketParam) {
      setActiveTab('tickets');
      setTicketFilter('all');
    }
  }, [ticketParam]);

  const displayTab = activeTab;

  // Handle ticket creation and redirect to all tickets
  const handleTicketCreated = (ticket) => {
    setActiveTab("tickets");
    setTicketFilter("all");
    console.log("Ticket created successfully:", ticket?.ticketNumber || ticket?.id);
  };
  const loadStats = useCallback(async () => {
    if (!currentUser) return;
    try {
      const tickets = await api.get('/api/v1/tickets') || [];
      const myId = currentUser.uid;
      setAllTicketsStats({
        total: tickets.length,
        open: tickets.filter((t) => t.status === 'open').length,
        inProgress: tickets.filter((t) => t.status === 'in-progress').length,
        resolved: tickets.filter((t) => t.status === 'resolved').length,
      });
      const mine = tickets.filter((t) => t.createdBy === myId);
      setMyTicketsStats({
        total: mine.length,
        open: mine.filter((t) => t.status === 'open').length,
        inProgress: mine.filter((t) => t.status === 'in-progress').length,
        resolved: mine.filter((t) => t.status === 'resolved').length,
      });
    } catch (err) {
      console.error('Failed to load user dashboard stats', err);
    } finally {
      setStatsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadStats();
    const unsub = subscribeTicketEvents(() => loadStats(), () => loadStats());
    return () => unsub();
  }, [loadStats]);

  const firstName = userProfile?.name?.split(' ')[0] || 'there';
  const profilePhotoURL = userProfile?.photoURL || userProfile?.photo_url || null;
  const myActive = myTicketsStats.open + myTicketsStats.inProgress;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
      {/* Page Title and Description - FINE-TUNED SPACING FROM HEADER */}
      <div className="pt-4 sm:pt-6 pb-4 sm:pb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-app">Support Hub</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-app-muted">
          Create tickets, track progress, and follow up with IT support
        </p>
      </div>

      {/* Enhanced Navigation Tabs - matched to Admin */}
      <div className="mb-6 sm:mb-8">
        <nav className="flex space-x-1 sm:space-x-2 lg:space-x-4 xl:space-x-8 border-b border-app overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap transition-all duration-200 ${
              displayTab === 'overview'
                ? 'border-app-primary text-app-primary bg-app-primary-soft'
                : 'border-transparent text-app-muted hover:text-app-soft hover:border-app hover:bg-app-surface-2/40'
            }`}
          >
            <span className="flex items-center space-x-1 sm:space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span className="hidden sm:inline">Overview</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap transition-all duration-200 ${
              displayTab === 'tickets'
                ? 'border-app-primary text-app-primary bg-app-primary-soft'
                : 'border-transparent text-app-muted hover:text-app-soft hover:border-app hover:bg-app-surface-2/40'
            }`}
          >
            <span className="flex items-center space-x-1 sm:space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">All Tickets</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap transition-all duration-200 ${
              displayTab === 'create'
                ? 'border-app-primary text-app-primary bg-app-primary-soft'
                : 'border-transparent text-app-muted hover:text-app-soft hover:border-app hover:bg-app-surface-2/40'
            }`}
          >
            <span className="flex items-center space-x-1 sm:space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Create Ticket</span>
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {displayTab === 'overview' && (
        <div className="space-y-6 pb-6">
          {statsLoading ? (
            <div className="space-y-6">
              <StatsGridSkeleton count={4} />
              <StatsGridSkeleton count={2} />
            </div>
          ) : (
            <>
              {/* Welcome + primary actions */}
              <section className="relative overflow-hidden rounded-2xl border border-app-subtle bg-app-panel px-5 py-5 sm:px-7 sm:py-6">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-app-primary" />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3.5 min-w-0">
                    {profilePhotoURL ? (
                      <img
                        src={profilePhotoURL}
                        alt={userProfile?.name || 'Profile'}
                        className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-xl object-cover border border-app-primary shadow-lg"
                      />
                    ) : (
                      <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-app-primary font-semibold text-lg border border-app-primary shadow-lg">
                        {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-app-primary font-medium">Welcome back</p>
                      <h2 className="text-xl sm:text-2xl font-bold text-app mt-0.5 truncate">
                        Hi, {firstName}
                      </h2>
                      <p className="text-sm text-app-muted mt-1.5">
                        {myActive > 0
                          ? `You have ${myActive} active ticket${myActive === 1 ? '' : 's'} right now.`
                          : myTicketsStats.total > 0
                            ? 'All your tickets are resolved. Nice work.'
                            : 'Need IT help? Create a ticket and we will take it from there.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('create')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-app-primary text-sm font-semibold px-4 py-2.5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Ticket
                    </button>
                    <button
                      type="button"
                      onClick={() => goToTickets('my')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-app bg-app-surface-2 hover:bg-app-surface-3 hover:border-app-primary text-app-soft text-sm font-medium px-4 py-2.5 transition-colors"
                    >
                      <svg className="w-4 h-4 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View my tickets
                    </button>
                  </div>
                </div>
              </section>

              {/* My ticket status */}
              <section>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-app">My tickets</h3>
                  <button
                    type="button"
                    onClick={() => goToTickets('my')}
                    className="text-xs sm:text-sm text-app-primary hover:opacity-80 font-medium transition-colors"
                  >
                    See all
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      label: 'Total',
                      value: myTicketsStats.total,
                      accent: 'text-app',
                      bar: 'bg-blue-500',
                      iconBg: 'bg-blue-500/20',
                      iconColor: 'text-blue-400',
                      hint: 'Created by you',
                      icon: (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ),
                    },
                    {
                      label: 'Open',
                      value: myTicketsStats.open,
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
                      value: myTicketsStats.inProgress,
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
                      value: myTicketsStats.resolved,
                      accent: 'text-app-primary',
                      bar: 'bg-app-primary',
                      iconBg: 'bg-app-primary-soft',
                      iconColor: 'text-app-primary',
                      hint: 'My completed tickets',
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
                      onClick={() => goToTickets('my')}
                      className="group text-left rounded-xl border border-app-subtle bg-app-surface-2 hover:border-app-primary px-4 py-3.5 sm:p-4 transition-colors duration-200 [@media(hover:hover)]:hover:-translate-y-0.5"
                    >
                      <div className={`accent-hover-line ${stat.bar}`} aria-hidden="true" />
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-app-muted font-medium">{stat.label}</p>
                          <p className={`text-2xl sm:text-3xl font-bold mt-1.5 tabular-nums ${stat.accent}`}>
                            {stat.value}
                          </p>
                          <p className="text-[11px] text-app-muted mt-1">{stat.hint}</p>
                        </div>
                        <div className={`p-2.5 sm:p-3 rounded-xl ${stat.iconBg} ${stat.iconColor} [@media(hover:hover)]:group-hover:scale-105 transition-transform`}>
                          {stat.icon}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* System snapshot */}
              <section>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-app">System Overview</h3>
                  <button
                    type="button"
                    onClick={() => goToTickets('all')}
                    className="text-xs sm:text-sm text-app-muted hover:text-app-primary font-medium transition-colors"
                  >
                    Browse all
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      label: 'All tickets',
                      value: allTicketsStats.total,
                      color: 'text-app',
                      bar: 'bg-cyan-500',
                      iconBg: 'bg-cyan-500/20',
                      iconColor: 'text-cyan-400',
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      ),
                    },
                    {
                      label: 'Open',
                      value: allTicketsStats.open,
                      color: 'text-rose-300',
                      bar: 'bg-rose-500',
                      iconBg: 'bg-rose-500/20',
                      iconColor: 'text-rose-400',
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      ),
                    },
                    {
                      label: 'In progress',
                      value: allTicketsStats.inProgress,
                      color: 'text-amber-300',
                      bar: 'bg-amber-500',
                      iconBg: 'bg-amber-500/20',
                      iconColor: 'text-amber-400',
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                    },
                    {
                      label: 'Resolved',
                      value: allTicketsStats.resolved,
                      color: 'text-app-primary',
                      bar: 'bg-app-primary',
                      iconBg: 'bg-app-primary-soft',
                      iconColor: 'text-app-primary',
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => goToTickets('all')}
                      className="group flex flex-col rounded-xl border border-app-subtle bg-app-surface-2 hover:border-app-primary px-3.5 py-3.5 transition-colors duration-200 text-left"
                    >
                      <div className={`accent-hover-line ${item.bar}`} aria-hidden="true" />
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${item.iconBg} ${item.iconColor} [@media(hover:hover)]:group-hover:scale-105 transition-transform`}>
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs text-app-muted">{item.label}</span>
                          <span className={`block text-xl font-bold tabular-nums ${item.color}`}>{item.value}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Empty state nudge */}
              {myTicketsStats.total === 0 && (
                <section className="rounded-xl border border-dashed border-app bg-app-surface-2 px-5 py-8 text-center">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-app-primary-soft text-app-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-app">No tickets yet</h3>
                  <p className="text-sm text-app-muted mt-1 max-w-md mx-auto">
                    When something breaks or you need IT help, submit a ticket and track it here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-app-primary text-sm font-semibold px-4 py-2.5 transition-colors"
                  >
                    Create your first ticket
                  </button>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {displayTab === 'tickets' && (
        <div className="space-y-5 pb-4">
          <div className="relative overflow-hidden rounded-2xl border border-app-subtle bg-app-panel px-4 py-4 sm:px-5 sm:py-5">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-app-primary" />
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-primary-soft text-app-primary border border-app-primary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-app">Support Tickets</h2>
                  <p className="text-sm text-app-muted mt-0.5">
                    Track and follow up on support requests
                  </p>
                </div>
              </div>
              <div className="inline-flex rounded-xl border border-app-subtle bg-app-surface-2 p-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTicketFilter('all')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    ticketFilter === 'all'
                      ? 'bg-app-primary-soft text-app-primary'
                      : 'text-app-muted hover:text-app'
                  }`}
                >
                  All ({allTicketsStats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter('my')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    ticketFilter === 'my'
                      ? 'bg-app-primary-soft text-app-primary'
                      : 'text-app-muted hover:text-app'
                  }`}
                >
                  My ({myTicketsStats.total})
                </button>
              </div>
            </div>
          </div>

          <TicketList 
            showAllTickets={ticketFilter === 'all'} 
            showUserTicketsOnly={ticketFilter === 'my'}
            openTicketId={ticketParam}
            openKey={openKey}
            focusConversation={focusConversation}
          />
        </div>
      )}

      {displayTab === 'create' && (
        <div className="pb-4">
          <Suspense fallback={<TicketFormSkeleton />}>
            <TicketForm onTicketCreated={handleTicketCreated} />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
