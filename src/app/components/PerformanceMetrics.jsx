'use client';

const PerformanceMetrics = ({ tickets = [], feedback = [], metrics = {}, dateRange = '30' }) => {
  // Calculate performance metrics using real data
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(t => t && t.status === 'resolved').length;
  const openTickets = tickets.filter(t => t && t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t && t.status === 'in-progress').length;
  
  // Calculate real feedback metrics
  const calculateFeedbackMetrics = () => {
    if (feedback.length === 0) {
      return {
        averageRating: 0,
        totalFeedback: 0,
        highRatings: 0,
        lowRatings: 0,
        satisfactionRate: 0
      };
    }

    const totalRating = feedback.reduce((sum, item) => sum + (item.rating || 0), 0);
    const averageRating = totalRating / feedback.length;
    const highRatings = feedback.filter(item => item.rating >= 4).length;
    const lowRatings = feedback.filter(item => item.rating <= 2).length;
    const satisfactionRate = (highRatings / feedback.length) * 100;

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalFeedback: feedback.length,
      highRatings,
      lowRatings,
      satisfactionRate: Math.round(satisfactionRate)
    };
  };

  const feedbackMetrics = calculateFeedbackMetrics();

  // Calculate SLA compliance (mock for now - would need actual SLA data)
  const calculateSLACompliance = () => {
    const resolvedTicketsWithTime = tickets.filter(t => t && t.status === 'resolved' && t.createdAt && t.updatedAt);
    if (resolvedTicketsWithTime.length === 0) return 0;

    const slaCompliantTickets = resolvedTicketsWithTime.filter(ticket => {
      const created = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
      const resolved = ticket.updatedAt?.toDate ? ticket.updatedAt.toDate() : new Date(ticket.updatedAt);
      const hours = (resolved - created) / (1000 * 60 * 60);
      return hours <= 24; // 24-hour SLA
    });

    return Math.round((slaCompliantTickets.length / resolvedTicketsWithTime.length) * 100);
  };

  const performanceData = {
    slaCompliance: calculateSLACompliance(),
    firstContactResolution: 78, // Mock data - would need actual FCR tracking
    customerSatisfaction: feedbackMetrics.averageRating,
    escalationRate: 12, // Mock data - would need actual escalation tracking
    avgResolutionTime: metrics.avgResolutionTime || 0,
    avgResponseTime: 1.8, // Mock data - would need actual response time tracking
    ticketVolume: totalTickets,
    resolutionRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0
  };

  const MetricCard = ({ title, value, target, status, icon, color, subtitle }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 hover:border-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} backdrop-blur-sm`}>
          {icon}
        </div>
        <div className="text-right">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            status === 'excellent' ? 'bg-emerald-500/20 text-emerald-400' :
            status === 'good' ? 'bg-blue-500/20 text-blue-400' :
            status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {status === 'excellent' ? 'Excellent' :
             status === 'good' ? 'Good' :
             status === 'warning' ? 'Warning' : 'Critical'}
          </span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {target && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Target: {target}</span>
              <span>{Math.round((value / target) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div 
                className={`h-1 rounded-full ${
                  (value / target) >= 1 ? 'bg-emerald-500' :
                  (value / target) >= 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, (value / target) * 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const getStatus = (value, thresholds) => {
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.warning) return 'warning';
    return 'critical';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Performance Metrics</h2>
        <p className="text-gray-400">Real-time performance indicators and KPIs</p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="SLA Compliance"
          value={`${performanceData.slaCompliance}%`}
          target={95}
          status={getStatus(performanceData.slaCompliance, { excellent: 95, good: 85, warning: 75 })}
          color="bg-blue-500/20 text-blue-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          subtitle="24-hour resolution target"
        />

        <MetricCard
          title="Resolution Rate"
          value={`${performanceData.resolutionRate}%`}
          target={90}
          status={getStatus(performanceData.resolutionRate, { excellent: 90, good: 80, warning: 70 })}
          color="bg-emerald-500/20 text-emerald-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          subtitle="Tickets successfully resolved"
        />

        <MetricCard
          title="Avg Resolution Time"
          value={`${performanceData.avgResolutionTime}h`}
          target={24}
          status={getStatus(24 - performanceData.avgResolutionTime, { excellent: 12, good: 6, warning: 0 })}
          color="bg-yellow-500/20 text-yellow-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          subtitle="Hours to resolve tickets"
        />

        <MetricCard
          title="Customer Satisfaction"
          value={feedbackMetrics.totalFeedback > 0 ? `${feedbackMetrics.averageRating}/5` : 'N/A'}
          target={4.5}
          status={feedbackMetrics.totalFeedback > 0 ? 
            getStatus(feedbackMetrics.averageRating, { excellent: 4.5, good: 4.0, warning: 3.5 }) : 
            'warning'
          }
          color="bg-purple-500/20 text-purple-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          subtitle={feedbackMetrics.totalFeedback > 0 ? 
            `Based on ${feedbackMetrics.totalFeedback} feedback submissions` : 
            'No feedback data available'
          }
        />
      </div>

      {/* Feedback Analysis Section */}
      {feedbackMetrics.totalFeedback > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Customer Feedback Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-2">{feedbackMetrics.satisfactionRate}%</div>
              <div className="text-sm text-gray-400">Satisfaction Rate</div>
              <div className="text-xs text-gray-500 mt-1">High ratings (4-5 stars)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{feedbackMetrics.highRatings}</div>
              <div className="text-sm text-gray-400">Positive Reviews</div>
              <div className="text-xs text-gray-500 mt-1">4-5 star ratings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400 mb-2">{feedbackMetrics.lowRatings}</div>
              <div className="text-sm text-gray-400">Areas for Improvement</div>
              <div className="text-xs text-gray-500 mt-1">1-2 star ratings</div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Status Distribution */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Ticket Status Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-2">{openTickets}</div>
            <div className="text-sm text-gray-400">Open Tickets</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalTickets > 0 ? Math.round((openTickets / totalTickets) * 100) : 0}% of total
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">{inProgressTickets}</div>
            <div className="text-sm text-gray-400">In Progress</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalTickets > 0 ? Math.round((inProgressTickets / totalTickets) * 100) : 0}% of total
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-2">{resolvedTickets}</div>
            <div className="text-sm text-gray-400">Resolved</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0}% of total
            </div>
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Summary</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">Total Tickets Processed</p>
                <p className="text-sm text-gray-400">Last {dateRange} days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{totalTickets}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">SLA Compliance</p>
                <p className="text-sm text-gray-400">24-hour resolution target</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{performanceData.slaCompliance}%</p>
            </div>
          </div>

          {feedbackMetrics.totalFeedback > 0 && (
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-white">Customer Satisfaction</p>
                  <p className="text-sm text-gray-400">Based on user feedback</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{feedbackMetrics.averageRating}/5</p>
                <p className="text-sm text-gray-400">{feedbackMetrics.satisfactionRate}% satisfied</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
