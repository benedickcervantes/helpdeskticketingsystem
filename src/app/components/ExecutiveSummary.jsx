'use client';

const ExecutiveSummary = ({ tickets, users, metrics, healthStatus }) => {
  const getBusinessInsights = () => {
    const insights = [];
    
    // Resolution rate insights
    if (metrics.resolutionRate >= 90) {
      insights.push({
        type: 'positive',
        title: 'Excellent Resolution Performance',
        message: `Your IT support team is resolving ${metrics.resolutionRate}% of requests successfully, exceeding industry standards.`
      });
    } else if (metrics.resolutionRate < 70) {
      insights.push({
        type: 'negative',
        title: 'Resolution Rate Needs Improvement',
        message: `Current resolution rate of ${metrics.resolutionRate}% is below acceptable standards. Consider additional training or resources.`
      });
    }

    // Response time insights
    if (metrics.avgResolutionTime <= 24) {
      insights.push({
        type: 'positive',
        title: 'Fast Response Times',
        message: `Average resolution time of ${metrics.avgResolutionTime} hours demonstrates efficient support operations.`
      });
    } else if (metrics.avgResolutionTime > 72) {
      insights.push({
        type: 'negative',
        title: 'Slow Resolution Times',
        message: `Average resolution time of ${metrics.avgResolutionTime} hours may impact employee productivity.`
      });
    }

    // Critical issues insights
    if (metrics.criticalTickets > 0) {
      insights.push({
        type: 'urgent',
        title: 'Critical Issues Require Immediate Attention',
        message: `${metrics.criticalTickets} critical support request${metrics.criticalTickets > 1 ? 's' : ''} need immediate resolution to prevent business disruption.`
      });
    }

    // Volume insights
    if (metrics.totalTickets > 100) {
      insights.push({
        type: 'info',
        title: 'High Support Volume',
        message: `Processing ${metrics.totalTickets} support requests indicates high system usage and potential need for capacity planning.`
      });
    }

    return insights;
  };

  const getRecommendations = () => {
    const recommendations = [];

    // Resolution rate recommendations
    if (metrics.resolutionRate < 80) {
      recommendations.push({
        priority: 'High',
        action: 'Improve Resolution Rate',
        description: 'Implement additional training programs and process improvements to increase first-call resolution.',
        impact: 'Reduced support costs and improved employee satisfaction'
      });
    }

    // Response time recommendations
    if (metrics.avgResolutionTime > 48) {
      recommendations.push({
        priority: 'Critical',
        action: 'Optimize Response Times',
        description: 'Review and streamline support processes to reduce average resolution time.',
        impact: 'Improved productivity and reduced business disruption'
      });
    }

    // Critical issues recommendations
    if (metrics.criticalTickets > 0) {
      recommendations.push({
        priority: 'Critical',
        action: 'Address Critical Issues',
        description: 'Immediately resolve all critical support requests to prevent business impact.',
        impact: 'Prevents potential business disruption and maintains service quality'
      });
    }

    // Capacity planning recommendations
    if (metrics.totalTickets > 150) {
      recommendations.push({
        priority: 'High',
        action: 'Capacity Planning',
        description: 'Consider expanding support team or implementing self-service options.',
        impact: 'Better resource allocation and improved service levels'
      });
    }

    return recommendations;
  };

  const insights = getBusinessInsights();
  const recommendations = getRecommendations();

  return (
    <div className="space-y-8">
      {/* Executive Overview */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl p-6 md:p-8 border border-emerald-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Executive Summary</h1>
            <p className="text-gray-400">IT Support Performance Overview</p>
          </div>
          <div className="mt-4 lg:mt-0">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              healthStatus.status === 'Excellent' ? 'bg-emerald-500/20 text-emerald-400' :
              healthStatus.status === 'Good' ? 'bg-blue-500/20 text-blue-400' :
              healthStatus.status === 'Fair' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                healthStatus.status === 'Excellent' ? 'bg-emerald-400' :
                healthStatus.status === 'Good' ? 'bg-blue-400' :
                healthStatus.status === 'Fair' ? 'bg-yellow-400' :
                'bg-red-400'
              }`}></div>
              Support Health: {healthStatus.status}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Total Requests</span>
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white">{metrics.totalTickets}</p>
            <p className="text-xs text-gray-500 mt-1">Support requests</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Resolution Rate</span>
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white">{metrics.resolutionRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Successfully resolved</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Avg Resolution Time</span>
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white">{metrics.avgResolutionTime}h</p>
            <p className="text-xs text-gray-500 mt-1">Hours to resolve</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Customer Satisfaction</span>
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white">{metrics.customerSatisfaction}%</p>
            <p className="text-xs text-gray-500 mt-1">Overall satisfaction</p>
          </div>
        </div>
      </div>

      {/* Business Insights */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Business Insights</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {insights.map((insight, index) => (
            <div key={index} className={`p-4 md:p-6 rounded-xl border transition-all duration-300 ${
              insight.type === 'positive' ? 'bg-emerald-500/10 border-emerald-500/30' :
              insight.type === 'negative' ? 'bg-red-500/10 border-red-500/30' :
              insight.type === 'urgent' ? 'bg-orange-500/10 border-orange-500/30' :
              'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex items-start">
                <div className={`p-2 rounded-lg mr-3 flex-shrink-0 ${
                  insight.type === 'positive' ? 'bg-emerald-500/20' :
                  insight.type === 'negative' ? 'bg-red-500/20' :
                  insight.type === 'urgent' ? 'bg-orange-500/20' :
                  'bg-blue-500/20'
                }`}>
                  {insight.type === 'positive' && (
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {insight.type === 'negative' && (
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                  {insight.type === 'urgent' && (
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {insight.type === 'info' && (
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm md:text-base font-semibold mb-2 ${
                    insight.type === 'positive' ? 'text-emerald-300' :
                    insight.type === 'negative' ? 'text-red-300' :
                    insight.type === 'urgent' ? 'text-orange-300' :
                    'text-blue-300'
                  }`}>
                    {insight.title}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                    {insight.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Recommendations */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Strategic Recommendations</h2>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 md:p-6 hover:border-emerald-500/30 transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 sm:mb-0 sm:mr-3 ${
                      rec.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                      rec.priority === 'High' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {rec.priority} Priority
                    </span>
                    <h3 className="text-base md:text-lg font-semibold text-white">{rec.action}</h3>
                  </div>
                  <p className="text-sm md:text-base text-gray-400 mb-3">{rec.description}</p>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs md:text-sm text-gray-300">
                      <span className="font-medium text-white">Business Impact:</span> {rec.impact}
                    </p>
                  </div>
                </div>
                <div className="mt-4 lg:mt-0 lg:ml-4 flex-shrink-0">
                  <button className="w-full lg:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl hover:from-emerald-700 hover:to-cyan-700 transition-all duration-300 text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition-all duration-300 text-left group">
            <div className="flex items-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 mr-3 group-hover:text-emerald-300 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-emerald-300 group-hover:text-emerald-200 transition-colors">Generate Report</h3>
                <p className="text-xs md:text-sm text-emerald-400 group-hover:text-emerald-300 transition-colors">Create executive summary report</p>
              </div>
            </div>
          </button>
          
          <button className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-all duration-300 text-left group">
            <div className="flex items-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-400 mr-3 group-hover:text-blue-300 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-blue-300 group-hover:text-blue-200 transition-colors">Schedule Review</h3>
                <p className="text-xs md:text-sm text-blue-400 group-hover:text-blue-300 transition-colors">Set up regular performance reviews</p>
              </div>
            </div>
          </button>
          
          <button className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/20 transition-all duration-300 text-left group sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-cyan-400 mr-3 group-hover:text-cyan-300 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-cyan-300 group-hover:text-cyan-200 transition-colors">Export Data</h3>
                <p className="text-xs md:text-sm text-cyan-400 group-hover:text-cyan-300 transition-colors">Download performance data</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;