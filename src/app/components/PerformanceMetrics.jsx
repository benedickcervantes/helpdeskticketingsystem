'use client';

const PerformanceMetrics = ({ tickets, users }) => {
  // Calculate performance metrics
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in-progress').length;
  
  // Simulated performance data
  const performanceData = {
    slaCompliance: 94,
    firstContactResolution: 78,
    customerSatisfaction: 4.6,
    escalationRate: 12,
    avgResolutionTime: 4.2,
    avgResponseTime: 1.8,
    ticketVolume: 156,
    resolutionRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0
  };

  const MetricCard = ({ title, value, target, status, icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
        <div className="text-right">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            status === 'excellent' ? 'bg-emerald-100 text-emerald-800' :
            status === 'good' ? 'bg-cyan-100 text-cyan-800' :
            status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status === 'excellent' ? 'Excellent' :
             status === 'good' ? 'Good' :
             status === 'warning' ? 'Warning' : 'Critical'}
          </span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {target && <p className="text-xs text-slate-500 mt-1">Target: {target}</p>}
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, target, color }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-slate-500">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        ></div>
      </div>
      {target && (
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-slate-500">Target: {target}%</span>
          <span className={`text-xs font-medium ${
            value >= target ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {value >= target ? '✓ Met' : '✗ Below target'}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Metrics</h2>
        <p className="text-slate-600 mb-8">Key performance indicators and service level agreements</p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="SLA Compliance"
          value={`${performanceData.slaCompliance}%`}
          target="95%"
          status="good"
          color="bg-emerald-100 text-emerald-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="First Contact Resolution"
          value={`${performanceData.firstContactResolution}%`}
          target="80%"
          status="good"
          color="bg-cyan-100 text-cyan-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <MetricCard
          title="Customer Satisfaction"
          value={`${performanceData.customerSatisfaction}/5`}
          target="4.5/5"
          status="excellent"
          color="bg-yellow-100 text-yellow-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
        <MetricCard
          title="Escalation Rate"
          value={`${performanceData.escalationRate}%`}
          target="<15%"
          status="good"
          color="bg-slate-100 text-slate-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          }
        />
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
          <div className="space-y-6">
            <ProgressBar
              label="Resolution Rate"
              value={performanceData.resolutionRate}
              target={85}
              color="bg-emerald-500"
            />
            <ProgressBar
              label="SLA Compliance"
              value={performanceData.slaCompliance}
              target={95}
              color="bg-cyan-500"
            />
            <ProgressBar
              label="First Contact Resolution"
              value={performanceData.firstContactResolution}
              target={80}
              color="bg-yellow-500"
            />
            <ProgressBar
              label="Customer Satisfaction"
              value={performanceData.customerSatisfaction * 20} // Convert to percentage
              target={90}
              color="bg-emerald-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Metrics</h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Resolution Time</span>
              <span className="text-lg font-semibold text-gray-900">{performanceData.avgResolutionTime}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Response Time</span>
              <span className="text-lg font-semibold text-gray-900">{performanceData.avgResponseTime}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Peak Resolution Time</span>
              <span className="text-lg font-semibold text-gray-900">6.8h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Minimum Resolution Time</span>
              <span className="text-lg font-semibold text-gray-900">0.5h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service Level Agreements */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Level Agreements</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Response Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Resolution Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Current Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    Critical
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15 minutes</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 hours</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12 min / 1.8h</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    ✓ Met
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                    High
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 hour</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8 hours</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">45 min / 6.2h</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    ✓ Met
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Medium
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4 hours</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">24 hours</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3.2h / 18h</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    ✓ Met
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    Low
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">24 hours</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">72 hours</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">18h / 48h</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    ✓ Met
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
