'use client';

const MetricCard = ({ title, value, trend }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <div className="mt-2 flex items-baseline">
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
      {trend && (
        <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          {trend}
        </span>
      )}
    </div>
  </div>
);

const KeyMetrics = ({ data }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <MetricCard 
      title="Total Tickets" 
      value={data.totalTickets} 
      trend="↑ 12% (MoM)" 
    />
    <MetricCard 
      title="Open Tickets" 
      value={data.openTickets} 
      trend="↑ 5% (MoM)" 
    />
    <MetricCard 
      title="Avg. Resolution" 
      value={`${data.avgResolutionDays}d`} 
      trend="↓ 1.2d (MoM)" 
    />
    <MetricCard 
      title="SLA Compliance" 
      value={`${data.slaCompliance}%`} 
    />
  </div>
);

export default KeyMetrics;