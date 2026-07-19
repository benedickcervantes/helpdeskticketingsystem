// @ts-nocheck
'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api/client';
import { compareTimestampsAsc, compareTimestampsDesc } from '@/lib/utils/dates';
import {
  StatsGridSkeleton,
  TicketListSkeleton,
  TitleBarSkeleton,
} from '@/lib/ui/DashboardSkeletons';

const StarRow = ({ rating, size = 'sm' }) => {
  const sizeClass = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClass} ${star <= rating ? 'text-amber-500' : 'text-app-muted/50'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const FeedbackAnalytics = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api
      .get('/api/v1/feedback')
      .then((data) => {
        setFeedback(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const processedFeedback = useMemo(() => {
    const filtered = feedback.filter((item) => {
      if (filter === 'high-rating' && item.rating < 4) return false;
      if (filter === 'low-rating' && item.rating > 2) return false;
      if (filter === 'medium-rating' && (item.rating < 3 || item.rating > 3)) return false;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.ticketTitle?.toLowerCase().includes(searchLower) ||
          item.ticketNumber?.toLowerCase().includes(searchLower) ||
          item.suggestions?.toLowerCase().includes(searchLower) ||
          item.userName?.toLowerCase().includes(searchLower) ||
          item.userEmail?.toLowerCase().includes(searchLower) ||
          item.rating?.toString().includes(searchLower)
        );
      }

      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return compareTimestampsDesc(b.createdAt, a.createdAt);
        case 'oldest':
          return compareTimestampsAsc(a.createdAt, b.createdAt);
        case 'rating-high':
          return b.rating - a.rating;
        case 'rating-low':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });
  }, [feedback, filter, sortBy, searchTerm]);

  const stats = useMemo(() => {
    const total = feedback.length;
    const highRating = feedback.filter((f) => f.rating >= 4).length;
    const lowRating = feedback.filter((f) => f.rating <= 2).length;
    const averageRating =
      total > 0
        ? (feedback.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1)
        : '0.0';
    const satisfaction =
      total > 0 ? Math.round((highRating / total) * 100) : 0;

    return { total, highRating, lowRating, averageRating, satisfaction };
  }, [feedback]);

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-app-primary';
    if (rating >= 3) return 'text-amber-700';
    return 'text-rose-600';
  };

  const getRatingBadgeClass = (rating) => {
    if (rating >= 4) return 'bg-app-primary-soft text-app-primary border-app-primary/30';
    if (rating >= 3) return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
    return 'bg-rose-500/15 text-rose-600 border-rose-500/30';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <TitleBarSkeleton />
        <StatsGridSkeleton count={4} />
        <TicketListSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-app flex items-center">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-app-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Feedback Analytics
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-56">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search tickets, users…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-8 pr-3 py-2 app-field border rounded-lg focus:outline-none text-sm"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="app-select px-3 py-2 pr-9 border rounded-lg focus:outline-none text-sm"
          >
            <option value="all">All Feedback</option>
            <option value="high-rating">High Rating (4-5)</option>
            <option value="medium-rating">Medium Rating (3)</option>
            <option value="low-rating">Low Rating (1-2)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="app-select px-3 py-2 pr-9 border rounded-lg focus:outline-none text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating-high">Highest Rating</option>
            <option value="rating-low">Lowest Rating</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="app-card rounded-xl border p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-app-muted">
              Total
            </span>
            <span className="p-1.5 rounded-lg bg-app-surface-2 text-app-muted">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-app">{stats.total}</div>
          <p className="text-[11px] text-app-muted mt-1">All submissions</p>
        </div>

        <div className="app-card rounded-xl border p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-app-muted">
              High rating
            </span>
            <span className="p-1.5 rounded-lg bg-app-primary-soft text-app-primary">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-app-primary">{stats.highRating}</div>
          <p className="text-[11px] text-app-muted mt-1">{stats.satisfaction}% satisfaction</p>
        </div>

        <div className="app-card rounded-xl border p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-app-muted">
              Low rating
            </span>
            <span className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v2a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600">{stats.lowRating}</div>
          <p className="text-[11px] text-app-muted mt-1">Needs attention</p>
        </div>

        <div className="app-card rounded-xl border p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-app-muted">
              Average
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-app">
            {stats.averageRating}
            <span className="text-sm font-semibold text-app-muted">/5</span>
          </div>
          <div className="mt-1.5">
            <StarRow rating={Math.round(Number(stats.averageRating))} />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-app-muted">
        <span>
          Showing {processedFeedback.length} of {feedback.length} feedback entries
        </span>
        {(filter !== 'all' || searchTerm || sortBy !== 'newest') && (
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              setSearchTerm('');
              setSortBy('newest');
            }}
            className="text-app-primary hover:opacity-80 transition-opacity font-medium self-start sm:self-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {processedFeedback.length === 0 ? (
        <div className="app-card rounded-xl border px-4 py-12 sm:py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-app-surface-2 text-app-muted">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-app mb-1">
            {searchTerm || filter !== 'all' ? 'No feedback found' : 'No feedback yet'}
          </h3>
          <p className="text-sm text-app-muted max-w-md mx-auto">
            {searchTerm || filter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Feedback will appear here once users start providing it.'}
          </p>
        </div>
      ) : (
        <>
          <div className="block lg:hidden space-y-3">
            {processedFeedback.map((item) => (
              <article
                key={item.id}
                className="app-card group relative overflow-hidden rounded-xl border p-4 transition-colors hover:bg-app-surface-2/40"
              >
                <div className="accent-hover-line bg-app-primary" aria-hidden="true" />
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    {item.ticketNumber && (
                      <span className="inline-block font-mono text-[11px] font-semibold text-app-primary mb-1">
                        {item.ticketNumber}
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-app line-clamp-2">{item.ticketTitle}</h3>
                    <p className="text-[11px] text-app-muted mt-1">
                      {item.userName || item.userEmail || 'Unknown user'} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border ${getRatingBadgeClass(item.rating)}`}
                  >
                    {item.rating}/5
                  </span>
                </div>
                <StarRow rating={item.rating} size="md" />
                {item.suggestions ? (
                  <div className="mt-3 pt-3 border-t border-app-subtle">
                    <p className="text-[11px] font-medium text-app-muted mb-1.5">Suggestions</p>
                    <p className="text-xs text-app-soft leading-relaxed line-clamp-3">
                      {item.suggestions}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-app-muted italic">No suggestions provided</p>
                )}
              </article>
            ))}
          </div>

          <div className="hidden lg:block overflow-x-auto rounded-xl border border-app bg-app-panel">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-app bg-app-surface-2/60 text-left text-[11px] uppercase tracking-wide text-app-muted">
                  <th className="px-3 py-2.5 font-semibold min-w-[220px]">Ticket</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap w-[160px]">Submitted by</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap w-[140px]">Rating</th>
                  <th className="px-3 py-2.5 font-semibold min-w-[220px]">Suggestions</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap w-[140px]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--app-border-subtle)]">
                {processedFeedback.map((item) => (
                  <tr key={item.id} className="hover:bg-app-surface-2/50 transition-colors">
                    <td className="px-3 py-2.5 align-middle max-w-[280px]">
                      {item.ticketNumber && (
                        <div className="font-mono text-[11px] font-semibold text-app-primary mb-0.5">
                          {item.ticketNumber}
                        </div>
                      )}
                      <p className="font-medium text-app truncate" title={item.ticketTitle}>
                        {item.ticketTitle || 'Untitled ticket'}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 align-middle max-w-[180px]">
                      <p className="text-[13px] text-app truncate" title={item.userName}>
                        {item.userName || '—'}
                      </p>
                      {item.userEmail && (
                        <p className="text-[11px] text-app-muted truncate" title={item.userEmail}>
                          {item.userEmail}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit items-center px-2 py-1 rounded-lg text-[11px] font-semibold border ${getRatingBadgeClass(item.rating)}`}
                        >
                          <span className={getRatingColor(item.rating)}>{item.rating}/5</span>
                        </span>
                        <StarRow rating={item.rating} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 align-middle max-w-[280px]">
                      <p
                        className={`text-[13px] line-clamp-2 ${item.suggestions ? 'text-app-soft' : 'text-app-muted italic'}`}
                        title={item.suggestions || undefined}
                      >
                        {item.suggestions || 'No suggestions provided'}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 align-middle whitespace-nowrap text-[11px] text-app-muted">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default FeedbackAnalytics;
