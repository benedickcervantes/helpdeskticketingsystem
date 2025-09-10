'use client';

const ExecutiveSummary = ({ tickets = [], users = [], metrics = {}, healthStatus = { status: 'Fair', score: 0 }, dateRange = '30' }) => {
  // Add safety checks for all parameters
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const safeMetrics = metrics || {};
  const safeHealthStatus = healthStatus || { status: 'Fair', score: 0 };

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
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'negative':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'urgent':
        return (
          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'negative':
        return 'bg-red-500/10 border-red-500/30';
      case 'urgent':
        return 'bg-orange-500/10 border-orange-500/30';
      default:
        return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-8">
      {/* Executive Summary Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Executive Summary</h2>
        <p className="text-gray-400">Comprehensive overview of IT support performance</p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-700/30 rounded-xl border border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Requests</p>
              <p className="text-2xl font-bold text-white mt-1">{safeMetrics.totalTickets || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-700/30 rounded-xl border border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Resolution Rate</p>
              <p className="text-2xl font-bold text-white mt-1">{safeMetrics.resolutionRate || 0}%</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-700/30 rounded-xl border border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Avg Resolution Time</p>
              <p className="text-2xl font-bold text-white mt-1">{safeMetrics.avgResolutionTime || 0}h</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/20 text-yellow-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-700/30 rounded-xl border border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Customer Satisfaction</p>
              <p className="text-2xl font-bold text-white mt-1">{safeMetrics.customerSatisfaction || 0}%</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Support Health Status */}
      <div className="bg-gray-700/30 rounded-xl border border-gray-600 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Support Health Status</h3>
            <p className="text-gray-400">Overall system performance indicator</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              safeHealthStatus.status === 'Excellent' ? 'bg-emerald-500/20 text-emerald-400' :
              safeHealthStatus.status === 'Good' ? 'bg-blue-500/20 text-blue-400' :
              safeHealthStatus.status === 'Fair' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                safeHealthStatus.status === 'Excellent' ? 'bg-emerald-400' :
                safeHealthStatus.status === 'Good' ? 'bg-blue-400' :
                safeHealthStatus.status === 'Fair' ? 'bg-yellow-400' :
                'bg-red-400'
              }`}></div>
              Support Health: {safeHealthStatus.status}
            </div>
            <p className="text-sm text-gray-400 mt-1">Score: {safeHealthStatus.score}/100</p>
          </div>
        </div>
      </div>

      {/* Business Insights */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Business Insights & Recommendations</h3>
        {insights.length === 0 ? (
          <div className="bg-gray-700/30 rounded-xl border border-gray-600 p-6 text-center">
            <p className="text-gray-400">No specific insights available at this time.</p>
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
                    <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-300">{insight.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-700/30 rounded-xl border border-gray-600 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg transition-colors text-left">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div>
                <p className="font-medium text-white">Generate Report</p>
                <p className="text-sm text-gray-400">Create executive summary report</p>
              </div>
            </div>
          </button>

          <button className="p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-colors text-left">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <div>
                <p className="font-medium text-white">View Analytics</p>
                <p className="text-sm text-gray-400">Detailed performance metrics</p>
              </div>
            </div>
          </button>

          <button className="p-4 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors text-left">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div>
                <p className="font-medium text-white">Feedback Reports</p>
                <p className="text-sm text-gray-400">User satisfaction insights</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
