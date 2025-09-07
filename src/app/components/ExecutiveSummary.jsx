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
        message: `${metrics.totalTickets} support requests indicate high IT support demand. Consider proactive measures.`
      });
    }

    return insights;
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (metrics.resolutionRate < 80) {
      recommendations.push({
        priority: 'High',
        action: 'Improve Resolution Rate',
        description: 'Implement additional training programs and knowledge base updates to increase resolution success rate.',
        impact: 'Will improve employee satisfaction and reduce repeat requests.'
      });
    }

    if (metrics.avgResolutionTime > 48) {
      recommendations.push({
        priority: 'High',
        action: 'Reduce Resolution Time',
        description: 'Streamline support processes and implement automation tools to reduce average resolution time.',
        impact: 'Will minimize productivity loss and improve user experience.'
      });
    }

    if (metrics.criticalTickets > 0) {
      recommendations.push({
        priority: 'Critical',
        action: 'Address Critical Issues',
        description: 'Immediately assign senior technicians to resolve critical support requests.',
        impact: 'Will prevent business disruption and maintain operational continuity.'
      });
    }

    if (metrics.customerSatisfaction < 80) {
      recommendations.push({
        priority: 'Medium',
        action: 'Improve Customer Satisfaction',
        description: 'Implement feedback collection system and regular satisfaction surveys.',
        impact: 'Will help identify areas for improvement and measure support quality.'
      });
    }

    return recommendations;
  };

  const insights = getBusinessInsights();
  const recommendations = getRecommendations();

  return (
    <div className="space-y-8">
      {/* Executive Overview */}
      <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl p-6 border border-emerald-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Support Health Status</h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              healthStatus.color === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
              healthStatus.color === 'blue' ? 'bg-blue-100 text-blue-800' :
              healthStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {healthStatus.status}
            </div>
            <p className="text-sm text-gray-600 mt-2">{healthStatus.message}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Key Metrics</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Total Requests:</span>
                <span className="font-semibold">{metrics.totalTickets}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Resolution Rate:</span>
                <span className="font-semibold text-emerald-600">{metrics.resolutionRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg. Resolution Time:</span>
                <span className="font-semibold">{metrics.avgResolutionTime}h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Insights */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight, index) => (
            <div key={index} className={`p-6 rounded-xl border-l-4 ${
              insight.type === 'positive' ? 'bg-emerald-50 border-emerald-400' :
              insight.type === 'negative' ? 'bg-red-50 border-red-400' :
              insight.type === 'urgent' ? 'bg-orange-50 border-orange-400' :
              'bg-blue-50 border-blue-400'
            }`}>
              <div className="flex items-start">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                  insight.type === 'positive' ? 'bg-emerald-100' :
                  insight.type === 'negative' ? 'bg-red-100' :
                  insight.type === 'urgent' ? 'bg-orange-100' :
                  'bg-blue-100'
                }`}>
                  {insight.type === 'positive' && (
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {insight.type === 'negative' && (
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {insight.type === 'urgent' && (
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                  {insight.type === 'info' && (
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    insight.type === 'positive' ? 'text-emerald-800' :
                    insight.type === 'negative' ? 'text-red-800' :
                    insight.type === 'urgent' ? 'text-orange-800' :
                    'text-blue-800'
                  }`}>
                    {insight.title}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    insight.type === 'positive' ? 'text-emerald-700' :
                    insight.type === 'negative' ? 'text-red-700' :
                    insight.type === 'urgent' ? 'text-orange-700' :
                    'text-blue-700'
                  }`}>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Strategic Recommendations</h2>
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-3 ${
                      rec.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rec.priority} Priority
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">{rec.action}</h3>
                  </div>
                  <p className="text-gray-600 mb-3">{rec.description}</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Business Impact:</span> {rec.impact}
                    </p>
                  </div>
                </div>
                <div className="ml-4">
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors text-left">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-emerald-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <h3 className="font-semibold text-emerald-800">Generate Report</h3>
                <p className="text-sm text-emerald-600">Create executive summary report</p>
              </div>
            </div>
          </button>
          
          <button className="p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors text-left">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-800">Schedule Review</h3>
                <p className="text-sm text-blue-600">Set up regular performance reviews</p>
              </div>
            </div>
          </button>
          
          <button className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl hover:bg-cyan-100 transition-colors text-left">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-cyan-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div>
                <h3 className="font-semibold text-cyan-800">Export Data</h3>
                <p className="text-sm text-cyan-600">Download performance data</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
