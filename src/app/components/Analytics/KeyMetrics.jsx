'use client';
import { useState, useEffect } from 'react';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiAlertCircle, 
  FiClock, 
  FiCheckCircle,
  FiHelpCircle,
  FiBarChart2
} from 'react-icons/fi';

const MetricCard = ({ title, value, trend, icon, tooltip }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  const isPositiveTrend = trend && trend.includes('↑');
  const trendValue = trend ? trend.split(' ')[0] : null;
  const trendText = trend ? trend.split(' ')[1] : null;

  // Define colors based on metric type
  const getColors = () => {
    switch(title) {
      case 'Total Tickets':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          iconBg: 'bg-blue-100 dark:bg-blue-800/40',
          iconColor: 'text-blue-600 dark:text-blue-400',
          trendColor: isPositiveTrend ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        };
      case 'Open Tickets':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          iconBg: 'bg-amber-100 dark:bg-amber-800/40',
          iconColor: 'text-amber-600 dark:text-amber-400',
          trendColor: isPositiveTrend ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
        };
      case 'Avg. Resolution':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          iconBg: 'bg-purple-100 dark:bg-purple-800/40',
          iconColor: 'text-purple-600 dark:text-purple-400',
          trendColor: isPositiveTrend ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
        };
      case 'SLA Compliance':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          iconBg: 'bg-green-100 dark:bg-green-800/40',
          iconColor: 'text-green-600 dark:text-green-400',
          trendColor: isPositiveTrend ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          iconBg: 'bg-gray-100 dark:bg-gray-700',
          iconColor: 'text-gray-600 dark:text-gray-400',
          trendColor: isPositiveTrend ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        };
    }
  };

  const colors = getColors();

  return (
    <div 
      className={`${colors.bg} p-5 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02]`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${colors.iconBg} ${colors.iconColor}`}>
          {icon}
        </div>
        {tooltip && (
          <div className="relative">
            <FiHelpCircle className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" size={16} />
            {isHovered && (
              <div className="absolute right-0 top-6 w-48 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg z-10">
                {tooltip}
                <div className="absolute -top-1 right-2 w-3 h-3 bg-gray-900 dark:bg-gray-700 transform rotate-45"></div>
              </div>
            )}
          </div>
        )}
      </div>

      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
      
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        
        {trend && (
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-xs`}>
            {isPositiveTrend ? (
              <FiTrendingUp className="mr-1" size={12} />
            ) : (
              <FiTrendingDown className="mr-1" size={12} />
            )}
            <span className={colors.trendColor}>
              {trendValue} <span className="text-gray-500 dark:text-gray-400">{trendText}</span>
            </span>
          </div>
        )}
      </div>

      {/* Mini progress bar for SLA Compliance */}
      {title === 'SLA Compliance' && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-green-500 h-1.5 rounded-full" 
              style={{ width: `${value}` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>0%</span>
            <span>Target: 95%</span>
            <span>100%</span>
          </div>
        </div>
      )}
    </div>
  );
};

const KeyMetrics = ({ data }) => {
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const metrics = [
    {
      title: "Total Tickets",
      value: data.totalTickets,
      trend: timeRange === 'month' ? "↑ 12% (MoM)" : "↑ 8% (QoQ)",
      icon: <FiBarChart2 size={20} />,
      tooltip: "Total number of tickets created in the selected time period"
    },
    {
      title: "Open Tickets",
      value: data.openTickets,
      trend: timeRange === 'month' ? "↑ 5% (MoM)" : "↑ 3% (QoQ)",
      icon: <FiAlertCircle size={20} />,
      tooltip: "Currently open tickets that need resolution"
    },
    {
      title: "Avg. Resolution",
      value: `${data.avgResolutionDays}d`,
      trend: timeRange === 'month' ? "↓ 1.2d (MoM)" : "↓ 2.5d (QoQ)",
      icon: <FiClock size={20} />,
      tooltip: "Average time taken to resolve tickets in days"
    },
    {
      title: "SLA Compliance",
      value: `${data.slaCompliance}%`,
      trend: timeRange === 'month' ? "↑ 4% (MoM)" : "↑ 7% (QoQ)",
      icon: <FiCheckCircle size={20} />,
      tooltip: "Percentage of tickets resolved within Service Level Agreement time"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {metrics.map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance Metrics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Key support metrics and trends</p>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {['week', 'month', 'quarter'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            trend={metric.trend}
            icon={metric.icon}
            tooltip={metric.tooltip}
          />
        ))}
      </div>
    </div>
  );
};

export default KeyMetrics;