'use client';
import { useState, useEffect } from 'react';
import TicketTrends from './TicketTrends';
import StatusDistribution from './StatusDistribution';
import ResolutionTime from './ResolutionTime';
import DepartmentMetrics from './DepartmentMetrics';
import KeyMetrics from './KeyMetrics';
import ExportButton from './ExportButton';
import Card from '../UI/Card';
import { 
  FiFilter, 
  FiCalendar, 
  FiRefreshCw, 
  FiChevronDown,
  FiGrid,
  FiBarChart2,
  FiPieChart,
  FiClock,
  FiUsers
} from 'react-icons/fi';

const ExecutiveDashboard = ({ tickets }) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [activeView, setActiveView] = useState('overview');

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Process data for metrics
  const analyticsData = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    avgResolutionDays: calculateAvgResolution(tickets),
    slaCompliance: calculateSLACompliance(tickets)
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const timeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '6m', label: 'Last 6 months' },
    { value: '1y', label: 'Last year' }
  ];

  const viewOptions = [
    { id: 'overview', label: 'Overview', icon: <FiGrid size={16} /> },
    { id: 'analytics', label: 'Analytics', icon: <FiBarChart2 size={16} /> },
    { id: 'performance', label: 'Performance', icon: <FiPieChart size={16} /> }
  ];

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 h-96"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Executive Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Comprehensive overview of ticket system performance and metrics
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <ExportButton />
            
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FiRefreshCw className={`${isRefreshing ? 'animate-spin' : ''}`} size={16} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* View Selector */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit mb-6">
          {viewOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveView(option.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                activeView === option.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              {timeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>

          <div className="relative">
            <select className="pl-10 pr-8 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
              <option>All Departments</option>
              <option>Support</option>
              <option>Sales</option>
              <option>Technical</option>
            </select>
            <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>

          <div className="relative">
            <select className="pl-10 pr-8 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
              <option>All Statuses</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Closed</option>
            </select>
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <KeyMetrics data={analyticsData} />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <Card 
          title="Ticket Volume Trends" 
          icon={<FiBarChart2 size={18} className="text-blue-500" />}
          className="h-full"
        >
          <TicketTrends tickets={tickets} timeRange={timeRange} />
        </Card>
        
        <Card 
          title="Status Distribution" 
          icon={<FiPieChart size={18} className="text-green-500" />}
          className="h-full"
        >
          <StatusDistribution tickets={tickets} />
        </Card>
        
        <Card 
          title="Resolution Time Analytics" 
          icon={<FiClock size={18} className="text-purple-500" />}
          className="h-full"
        >
          <ResolutionTime tickets={tickets} />
        </Card>
        
        <Card 
          title="Department Performance" 
          icon={<FiUsers size={18} className="text-amber-500" />}
          className="h-full"
        >
          <DepartmentMetrics tickets={tickets} />
        </Card>
      </div>

      {/* Summary Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Key Insights</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2"></div>
                <span>Ticket volume has increased by 12% compared to last month</span>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2"></div>
                <span>Average resolution time improved by 1.2 days</span>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 mr-2"></div>
                <span>Open tickets require attention - increased by 5%</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Recommendations</h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 mr-2"></div>
                <span>Consider allocating more resources to reduce open ticket backlog</span>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 mr-2"></div>
                <span>Review SLA compliance for high-priority tickets</span>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-1.5 mr-2"></div>
                <span>Implement additional training for complex ticket types</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function calculateAvgResolution(tickets) {
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
  if (resolvedTickets.length === 0) return 0;
  
  const totalHours = resolvedTickets.reduce((sum, ticket) => {
    const created = new Date(ticket.createdAt);
    const resolved = new Date(ticket.resolvedAt || ticket.updatedAt);
    const hours = Math.abs(resolved - created) / 36e5;
    return sum + hours;
  }, 0);
  
  return (totalHours / resolvedTickets.length / 24).toFixed(1);
}

function calculateSLACompliance(tickets) {
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
  if (resolvedTickets.length === 0) return 0;
  
  // Simple mock calculation - in real app, this would check against actual SLA rules
  const compliantTickets = resolvedTickets.filter(ticket => {
    const created = new Date(ticket.createdAt);
    const resolved = new Date(ticket.resolvedAt || ticket.updatedAt);
    const hours = Math.abs(resolved - created) / 36e5;
    return hours <= 72; // 3-day SLA
  });
  
  return Math.round((compliantTickets.length / resolvedTickets.length) * 100);
}

export default ExecutiveDashboard;