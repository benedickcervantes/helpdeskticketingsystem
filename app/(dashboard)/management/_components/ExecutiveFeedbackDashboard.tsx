// @ts-nocheck
'use client';

import { useMemo, useState } from 'react';
import {
  filterFeedbackByDateRange,
  formatFeedbackDateTime,
  getFeedbackUserLabel,
} from '@/lib/utils/feedbackReportUtils';

const ExecutiveFeedbackDashboard = ({ feedback = [], dateRange = '30', onDateRangeChange }) => {
  const [exportLoading, setExportLoading] = useState(null);

  const filteredFeedback = useMemo(
    () =>
      [...filterFeedbackByDateRange(feedback, dateRange)].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      ),
    [feedback, dateRange],
  );

  const calculateMetrics = () => {
    const totalFeedback = filteredFeedback.length;
    const averageRating =
      totalFeedback > 0
        ? (
            filteredFeedback.reduce((sum, item) => sum + (item.rating || 0), 0) /
            totalFeedback
          ).toFixed(1)
        : 0;

    const highRatings = filteredFeedback.filter((item) => item.rating >= 4).length;
    const lowRatings = filteredFeedback.filter((item) => item.rating <= 2).length;

    const satisfactionRate =
      totalFeedback > 0 ? ((highRatings / totalFeedback) * 100).toFixed(1) : 0;
    const improvementRate =
      totalFeedback > 0 ? ((lowRatings / totalFeedback) * 100).toFixed(1) : 0;

    return {
      totalFeedback,
      averageRating,
      satisfactionRate,
      improvementRate,
      highRatings,
      lowRatings,
    };
  };

  const metrics = calculateMetrics();

  const ratingDistribution = useMemo(() => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredFeedback.forEach((item) => {
      if (item.rating >= 1 && item.rating <= 5) {
        distribution[item.rating] += 1;
      }
    });
    return distribution;
  }, [filteredFeedback]);

  const handleExport = async (format) => {
    if (filteredFeedback.length === 0) return;

    setExportLoading(format);
    try {
      const meta = {
        dateRange,
        totalFeedback: metrics.totalFeedback,
        averageRating: metrics.averageRating,
        satisfactionRate: metrics.satisfactionRate,
        improvementRate: metrics.improvementRate,
      };

      if (format === 'excel') {
        const { downloadFeedbackExcel } = await import('@/lib/utils/feedbackReport');
        await downloadFeedbackExcel(filteredFeedback, meta);
      } else if (format === 'pdf') {
        const { downloadFeedbackPdf } = await import('@/lib/utils/feedbackReport');
        downloadFeedbackPdf(filteredFeedback, meta);
      }
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
    } finally {
      setExportLoading(null);
    }
  };

  const StatCard = ({ title, value, subtitle, color, icon }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 hover:border-emerald-500/30 transition-all duration-300">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl ${color} backdrop-blur-sm flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const FeedbackStars = ({ rating }) => (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 flex-shrink-0 ${
            star <= rating ? 'text-yellow-400' : 'text-gray-600'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  const FeedbackCard = ({ item }) => (
    <div className="bg-gray-700/30 rounded-lg border border-gray-600 p-3 sm:p-4 min-w-0 overflow-hidden">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 mb-2 min-w-0">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-white break-words [overflow-wrap:anywhere]">
            {item.ticketTitle || 'Untitled Ticket'}
          </h4>
          <p className="text-xs text-emerald-300/90 mt-1 break-words [overflow-wrap:anywhere]">
            {getFeedbackUserLabel(item)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatFeedbackDateTime(item.createdAt)}
          </p>
        </div>
        <FeedbackStars rating={item.rating || 0} />
      </div>
      {item.suggestions ? (
        <p className="text-sm text-gray-300 bg-gray-800/50 p-2 sm:p-3 rounded break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
          {item.suggestions}
        </p>
      ) : (
        <p className="text-xs text-gray-500 italic">No written feedback provided.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-8 min-w-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="truncate">Executive Feedback Report</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            User feedback with submitter name, date, and export options
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange?.(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            aria-label="Date range"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>

          <button
            type="button"
            onClick={() => handleExport('excel')}
            disabled={!!exportLoading || filteredFeedback.length === 0}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
          >
            {exportLoading === 'excel' ? 'Exporting...' : 'Export Excel'}
          </button>

          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={!!exportLoading || filteredFeedback.length === 0}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
          >
            {exportLoading === 'pdf' ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          title="Total Feedback"
          value={metrics.totalFeedback}
          subtitle={`Last ${dateRange} days`}
          color="bg-blue-500/20 text-blue-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />

        <StatCard
          title="Average Rating"
          value={metrics.averageRating}
          subtitle="Out of 5 stars"
          color="bg-yellow-500/20 text-yellow-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />

        <StatCard
          title="Satisfaction Rate"
          value={`${metrics.satisfactionRate}%`}
          subtitle="High ratings (4-5 stars)"
          color="bg-emerald-500/20 text-emerald-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Improvement Areas"
          value={`${metrics.improvementRate}%`}
          subtitle="Low ratings (1-2 stars)"
          color="bg-red-500/20 text-red-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
        />
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Rating Distribution</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating];
            const percentage =
              filteredFeedback.length > 0 ? (count / filteredFeedback.length) * 100 : 0;
            const color =
              rating >= 4 ? 'bg-emerald-500' : rating >= 3 ? 'bg-yellow-500' : 'bg-red-500';

            return (
              <div key={rating} className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-7 sm:w-8 flex-shrink-0 text-sm font-medium text-gray-300">
                  {rating}★
                </div>
                <div className="flex-1 min-w-0 bg-gray-700 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex-shrink-0 text-xs sm:text-sm text-gray-400 text-right whitespace-nowrap">
                  {count} ({percentage.toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 min-w-0 overflow-hidden">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
          Feedback Submissions
        </h3>

        {filteredFeedback.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <h4 className="text-lg font-medium text-white mb-2">No feedback in this date range</h4>
            <p className="text-gray-400">Submitted feedback will show the user name and submission date here.</p>
          </div>
        ) : (
          <>
            <div className="xl:hidden space-y-3 sm:space-y-4">
              {filteredFeedback.map((item) => (
                <FeedbackCard key={item.id} item={item} />
              ))}
            </div>

            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full table-fixed divide-y divide-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="w-[18%] px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date Submitted
                    </th>
                    <th className="w-[22%] px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="w-[22%] px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="w-[10%] px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="w-[28%] px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Feedback
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                  {filteredFeedback.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-700/30 transition-colors duration-200 align-top">
                      <td className="px-4 py-4 text-sm text-gray-300">
                        {formatFeedbackDateTime(item.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-white break-words [overflow-wrap:anywhere]">
                        <p>{item.userName || 'Unknown user'}</p>
                        {item.userEmail ? (
                          <p className="text-xs text-gray-400 mt-1 break-words [overflow-wrap:anywhere]">
                            {item.userEmail}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-300 break-words [overflow-wrap:anywhere]">
                        {item.ticketTitle || 'Untitled Ticket'}
                      </td>
                      <td className="px-4 py-4 text-sm text-yellow-400">
                        {item.rating ?? '—'} / 5
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-300 break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
                        {item.suggestions || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExecutiveFeedbackDashboard;
