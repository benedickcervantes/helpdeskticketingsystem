// @ts-nocheck
'use client';

import {
  computeExecutiveMetrics,
  computeHealthStatus,
} from '@/lib/utils/analytics';

const ExecutiveSummary = ({
  tickets = [],
  users = [],
  feedback = [],
  metrics = {},
  healthStatus,
  dateRange = '30',
  onDateRangeChange,
  onNavigateToTab,
}) => {
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const safeFeedback = Array.isArray(feedback) ? feedback : [];
  const computedMetrics = computeExecutiveMetrics(safeTickets, safeFeedback, dateRange);
  const safeMetrics = { ...computedMetrics, ...(metrics || {}) };
  const safeHealthStatus =
    healthStatus || computeHealthStatus(safeMetrics);

  const getBusinessInsights = () => {
    const insights = [];
    
    // Resolution rate insights
    if (safeMetrics.resolutionRate >= 90) {
      insights.push({
        type: 'positive',
        title: 'Excellent Resolution Performance',
        message: `Your IT support team is resolving ${safeMetrics.resolutionRate}% of requests successfully, exceeding industry standards.`
      });
    } else if (safeMetrics.resolutionRate < 70) {
      insights.push({
        type: 'negative',
        title: 'Resolution Rate Needs Improvement',
        message: `Current resolution rate of ${safeMetrics.resolutionRate}% is below acceptable standards. Consider additional training or resources.`
      });
    }

    // Response time insights
    if (safeMetrics.avgResolutionTime <= 24) {
      insights.push({
        type: 'positive',
        title: 'Fast Response Times',
        message: `Average resolution time of ${safeMetrics.avgResolutionTime} hours demonstrates efficient support operations.`
      });
    } else if (safeMetrics.avgResolutionTime > 72) {
      insights.push({
        type: 'negative',
        title: 'Slow Resolution Times',
        message: `Average resolution time of ${safeMetrics.avgResolutionTime} hours may impact employee productivity.`
      });
    }

    // Critical issues insights
    if (safeMetrics.criticalTickets > 0) {
      insights.push({
        type: 'urgent',
        title: 'Critical Issues Require Immediate Attention',
        message: `${safeMetrics.criticalTickets} critical support request${safeMetrics.criticalTickets > 1 ? 's' : ''} need immediate resolution to prevent business disruption.`
      });
    }

    // Volume insights
    if (safeMetrics.totalTickets > 100) {
      insights.push({
        type: 'info',
        title: 'High Support Volume',
        message: `${safeMetrics.totalTickets} support requests in the last ${dateRange} days indicate high system usage and potential need for additional resources.`
      });
    }

    // Customer satisfaction insights
    if (safeMetrics.customerSatisfaction >= 90) {
      insights.push({
        type: 'positive',
        title: 'Outstanding Customer Satisfaction',
        message: `Customer satisfaction rating of ${safeMetrics.customerSatisfaction}% demonstrates excellent service quality and user experience.`
      });
    } else if (safeMetrics.customerSatisfaction < 70) {
      insights.push({
        type: 'negative',
        title: 'Customer Satisfaction Needs Attention',
        message: `Customer satisfaction rating of ${safeMetrics.customerSatisfaction}% indicates areas for improvement in service delivery.`
      });
    }

    return insights;
  };

  const insights = getBusinessInsights();

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive':
        return (
          <svg className="w-5 h-5 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'negative':
        return (
          <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'urgent':
        return (
          <svg className="w-5 h-5 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive':
        return 'bg-app-surface-2 border-app-primary/40';
      case 'negative':
        return 'bg-app-surface-2 border-rose-500/40';
      case 'urgent':
        return 'bg-app-surface-2 border-orange-500/40';
      default:
        return 'bg-app-surface-2 border-sky-500/40';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8 min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-center sm:text-left px-1 min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-app mb-1 sm:mb-2">Executive Summary</h2>
          <p className="text-xs sm:text-sm text-app-muted">Comprehensive overview of IT support performance</p>
        </div>
        {onDateRangeChange ? (
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="w-full sm:w-auto shrink-0 px-3 py-2 app-field border rounded-lg text-sm focus:outline-none"
            aria-label="Date range"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        ) : null}
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="app-card rounded-xl border p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-app-muted">Total Requests</p>
              <p className="text-xl sm:text-2xl font-bold text-app mt-1">{safeMetrics.totalTickets || 0}</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-app-surface-3 text-sky-400 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="app-card rounded-xl border p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-app-muted">Resolution Rate</p>
              <p className="text-xl sm:text-2xl font-bold text-app mt-1">{safeMetrics.resolutionRate || 0}%</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-app-primary-soft text-app-primary flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="app-card rounded-xl border p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-app-muted">Avg Resolution Time</p>
              <p className="text-xl sm:text-2xl font-bold text-app mt-1">{safeMetrics.avgResolutionTime || 0}h</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-app-surface-3 text-amber-400 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="app-card rounded-xl border p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-app-muted">Customer Satisfaction</p>
              <p className="text-xl sm:text-2xl font-bold text-app mt-1">{safeMetrics.customerSatisfaction || 0}%</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-app-primary-soft text-app-primary flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Support Health Status */}
      <div className="app-card rounded-xl border p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-app mb-1 sm:mb-2">Support Health Status</h3>
            <p className="text-xs sm:text-sm text-app-muted">Overall system performance indicator</p>
          </div>
          <div className="sm:text-right flex-shrink-0">
            <div className={`inline-flex items-center px-3 py-1 rounded-lg border text-xs sm:text-sm font-medium ${
              safeHealthStatus.status === 'Excellent' ? 'bg-app-surface-2 text-app-primary border-app-primary/40' :
              safeHealthStatus.status === 'Good' ? 'bg-app-surface-2 text-sky-400 border-sky-500/40' :
              safeHealthStatus.status === 'Fair' ? 'bg-app-surface-2 text-amber-400 border-amber-500/40' :
              'bg-app-surface-2 text-rose-400 border-rose-500/40'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                safeHealthStatus.status === 'Excellent' ? 'bg-app-primary' :
                safeHealthStatus.status === 'Good' ? 'bg-sky-600' :
                safeHealthStatus.status === 'Fair' ? 'bg-amber-500' :
                'bg-rose-500'
              }`}></div>
              Support Health: {safeHealthStatus.status}
            </div>
            <p className="text-sm text-app-muted mt-1">Score: {safeHealthStatus.score}/100</p>
          </div>
        </div>
      </div>

      {/* Business Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-app">Business Insights & Recommendations</h3>
        {insights.length === 0 ? (
          <div className="app-card rounded-xl border p-6 text-center">
            <p className="text-app-muted">No specific insights available at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className={`rounded-xl border p-4 ${getInsightColor(insight.type)}`}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-app mb-1">{insight.title}</h4>
                    <p className="text-sm text-app-soft">{insight.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="app-card rounded-xl border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-app mb-3 sm:mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => onNavigateToTab?.('reports')}
            className="p-3 sm:p-4 bg-app-surface-2 hover:bg-app-surface-3 border border-app-primary/40 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-app-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div>
                <p className="font-medium text-app">Generate Report</p>
                <p className="text-sm text-app-muted">Create executive summary report</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab?.('analytics')}
            className="p-3 sm:p-4 bg-app-surface-2 hover:bg-app-surface-3 border border-sky-500/40 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-sky-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <div>
                <p className="font-medium text-app">View Analytics</p>
                <p className="text-sm text-app-muted">Detailed performance metrics</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab?.('feedback')}
            className="p-3 sm:p-4 bg-app-surface-2 hover:bg-app-surface-3 border border-amber-500/40 rounded-lg transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div>
                <p className="font-medium text-app">Feedback Reports</p>
                <p className="text-sm text-app-muted">User satisfaction insights</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
