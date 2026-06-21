// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { IntelligentLoadingManager, StageProgressIndicator, SkeletonChart, SkeletonCard } from '@/lib/ui/LoadingComponents';
import {
  ANALYTICS_EARLIEST_DATE,
  buildDailyTrendSeries,
  buildResolutionTrendSeries,
  formatResolutionTime,
  getTicketHours,
} from '@/lib/utils/analytics';

const AnalyticsOverview = ({ tickets, users, dateRange, onDateRangeChange }) => {
  const [chartData, setChartData] = useState({
    dailyTrends: [],
    statusDistribution: [],
    priorityDistribution: [],
    departmentPerformance: [],
    resolutionTrends: [],
    monthlyComparison: [],
    slaData: [],
    responseTimeDistribution: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (tickets && tickets.length > 0) {
      generateChartData();
    } else {
      setIsLoading(false);
    }
  }, [tickets, dateRange]);

  const generateChartData = () => {
    setIsLoading(true);
    
    const dailyTrends = generateDailyTrends();
    const statusDistribution = generateStatusDistribution();
    const priorityDistribution = generatePriorityDistribution();
    const departmentPerformance = generateDepartmentData();
    const resolutionTrends = generateResolutionTrends();
    const monthlyComparison = generateMonthlyComparison();
    const slaData = generateSLAData();
    const responseTimeDistribution = generateResponseTimeDistribution();

    setChartData({
      dailyTrends,
      statusDistribution,
      priorityDistribution,
      departmentPerformance,
      resolutionTrends,
      monthlyComparison,
      slaData,
      responseTimeDistribution
    });
    
    setIsLoading(false);
  };

  const generateDailyTrends = () => {
    if (!tickets || tickets.length === 0) return [];

    const days = parseInt(dateRange) || 30;
    return buildDailyTrendSeries(tickets, days, (dayTickets) => ({
      total: dayTickets.length,
      open: dayTickets.filter((t) => t.status === 'open').length,
      inProgress: dayTickets.filter((t) => t.status === 'in-progress').length,
      resolved: dayTickets.filter((t) => t.status === 'resolved').length,
    }));
  };

  const generateStatusDistribution = () => {
    if (!tickets || tickets.length === 0) return [];
    
    const statusCounts = {
      open: tickets.filter(t => t.status === 'open').length,
      'in-progress': tickets.filter(t => t.status === 'in-progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length
    };

    return [
      { name: 'Open', value: statusCounts.open, color: '#ef4444' },
      { name: 'In Progress', value: statusCounts['in-progress'], color: '#f59e0b' },
      { name: 'Resolved', value: statusCounts.resolved, color: '#10b981' }
    ];
  };

  const generatePriorityDistribution = () => {
    if (!tickets || tickets.length === 0) return [];
    
    const priorityCounts = {
      critical: tickets.filter(t => t.priority === 'critical').length,
      high: tickets.filter(t => t.priority === 'high').length,
      medium: tickets.filter(t => t.priority === 'medium').length,
      low: tickets.filter(t => t.priority === 'low').length
    };

    return [
      { name: 'Critical', value: priorityCounts.critical, color: '#dc2626' },
      { name: 'High', value: priorityCounts.high, color: '#ea580c' },
      { name: 'Medium', value: priorityCounts.medium, color: '#d97706' },
      { name: 'Low', value: priorityCounts.low, color: '#16a34a' }
    ];
  };

  const generateDepartmentData = () => {
    if (!tickets || tickets.length === 0 || !users) return [];
    
    const departmentStats = {};
    
    tickets.forEach(ticket => {
      const user = users.find(u => u.uid === ticket.createdBy);
      if (user && user.department) {
        if (!departmentStats[user.department]) {
          departmentStats[user.department] = {
            department: user.department,
            total: 0,
            resolved: 0,
            open: 0,
            inProgress: 0
          };
        }
        
        departmentStats[user.department].total++;
        if (ticket.status === 'resolved') departmentStats[user.department].resolved++;
        if (ticket.status === 'open') departmentStats[user.department].open++;
        if (ticket.status === 'in-progress') departmentStats[user.department].inProgress++;
      }
    });

    return Object.values(departmentStats).sort((a, b) => b.total - a.total);
  };

  const generateResolutionTrends = () => {
    if (!tickets || tickets.length === 0) return [];

    const days = parseInt(dateRange) || 30;
    return buildResolutionTrendSeries(tickets, days);
  };

  const generateMonthlyComparison = () => {
    if (!tickets || tickets.length === 0) return [];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthTickets = tickets.filter(ticket => {
        const ticketDate = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
        return ticketDate.getMonth() === index && ticketDate.getFullYear() === currentYear;
      });
      
      return {
        month,
        tickets: monthTickets.length,
        resolved: monthTickets.filter(t => t.status === 'resolved').length
      };
    });
  };

  const generateSLAData = () => {
    if (!tickets || tickets.length === 0) return [];
    
    const slaTargets = {
      critical: 2, // 2 hours
      high: 8,     // 8 hours
      medium: 24,  // 24 hours
      low: 72      // 72 hours
    };

    return Object.entries(slaTargets).map(([priority, target]) => {
      const priorityTickets = tickets.filter(t => t.priority === priority && t.status === 'resolved');
      const compliantTickets = priorityTickets.filter(ticket => {
        const created = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
        const resolved = ticket.updatedAt?.toDate ? ticket.updatedAt.toDate() : new Date(ticket.updatedAt);
        const hours = (resolved - created) / (1000 * 60 * 60);
        return hours <= target;
      });

      return {
        priority: priority.charAt(0).toUpperCase() + priority.slice(1),
        target: `${target}h`,
        compliance: priorityTickets.length > 0 ? Math.round((compliantTickets.length / priorityTickets.length) * 100) : 0,
        total: priorityTickets.length
      };
    });
  };

  const generateResponseTimeDistribution = () => {
    if (!tickets || tickets.length === 0) return [];
    
    const ranges = [
      { range: '0-1h', min: 0, max: 1 },
      { range: '1-4h', min: 1, max: 4 },
      { range: '4-8h', min: 4, max: 8 },
      { range: '8-24h', min: 8, max: 24 },
      { range: '24h+', min: 24, max: Infinity }
    ];

    return ranges.map(range => {
      const count = tickets.filter(ticket => {
        if (ticket.status !== 'resolved') return false;
        const created = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
        const resolved = ticket.updatedAt?.toDate ? ticket.updatedAt.toDate() : new Date(ticket.updatedAt);
        const hours = (resolved - created) / (1000 * 60 * 60);
        return hours >= range.min && hours < range.max;
      }).length;

      return {
        range: range.range,
        count
      };
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const point = payload[0]?.payload;
      return (
        <div className="bg-gray-800 border border-gray-700 p-2 sm:p-3 rounded-lg shadow-lg max-w-[200px] sm:max-w-none">
          <p className="font-semibold text-white text-xs sm:text-sm">{point?.dateLabel || label}</p>
          {payload.map((entry, index) => {
            const value =
              entry.dataKey === 'avgResolutionTime'
                ? formatResolutionTime(entry.value)
                : entry.value;
            const labelText =
              entry.dataKey === 'avgResolutionTime'
                ? 'Avg resolution time'
                : entry.name || entry.dataKey;
            return (
              <p key={index} className="text-gray-200 text-xs sm:text-sm">
                {labelText}: <span style={{ color: entry.color }}>{value}</span>
              </p>
            );
          })}
          {point?.completedCount > 0 ? (
            <p className="text-gray-400 text-xs mt-1">
              {point.completedCount} completed ticket{point.completedCount === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
      );
    }
    return null;
  };

  const resolutionYAxisTick = (value) => {
    if (value == null || Number.isNaN(value)) return '';
    return value < 1 ? `${Math.round(value * 60)}m` : `${value}h`;
  };

  const axisTick = { fontSize: 10 };
  const chartHeight = 250;
  const legendProps = { wrapperStyle: { fontSize: '11px', paddingTop: '8px' } };

  const dailyTrendLines = [
    { dataKey: 'total', label: 'Total Tickets', mobileLabel: 'Total', color: '#3b82f6' },
    { dataKey: 'open', label: 'Open', mobileLabel: 'Open', color: '#ef4444' },
    { dataKey: 'inProgress', label: 'In Progress', mobileLabel: 'In Prog.', color: '#f59e0b' },
    { dataKey: 'resolved', label: 'Resolved', mobileLabel: 'Resolved', color: '#10b981' },
  ];

  const departmentBars = [
    { dataKey: 'open', label: 'Open', mobileLabel: 'Open', color: '#ef4444' },
    { dataKey: 'inProgress', label: 'In Progress', mobileLabel: 'In Prog.', color: '#f59e0b' },
    { dataKey: 'resolved', label: 'Resolved', mobileLabel: 'Resolved', color: '#10b981' },
    { dataKey: 'total', label: 'Total Tickets', mobileLabel: 'Total', color: '#3b82f6' },
  ];

  const DepartmentYAxisTick = ({ x, y, payload }) => {
    const departmentName = payload?.payload?.department;
    const raw = typeof departmentName === 'string'
      ? departmentName
      : typeof payload?.value === 'string'
        ? payload.value
        : '';
    const name = String(raw || '').trim();

    if (!name) {
      return null;
    }

    const midpoint = Math.ceil(name.length / 2);
    const breakIdx = name.lastIndexOf(' ', midpoint);
    const splitAt = breakIdx > 0 ? breakIdx : midpoint;
    const line1 = name.slice(0, splitAt).trim();
    const line2 = name.slice(splitAt).trim();

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={line2 ? -2 : 4} textAnchor="end" fill="#9CA3AF" fontSize={9}>
          {line1}
        </text>
        {line2 ? (
          <text x={0} y={0} dy={10} textAnchor="end" fill="#9CA3AF" fontSize={9}>
            {line2}
          </text>
        ) : null}
      </g>
    );
  };

  const DepartmentPerformanceCards = ({ departments = [] }) => {
    const maxValue = Math.max(...departments.map((d) => d.total || 0), 1);

    return (
      <div className="space-y-3">
        {departments.map((dept) => (
          <div
            key={dept.department}
            className="bg-gray-700/30 rounded-lg border border-gray-600/40 p-3 min-w-0"
          >
            <p className="text-xs sm:text-sm font-medium text-white mb-2 break-words [overflow-wrap:anywhere]">
              {dept.department}
            </p>
            <div className="space-y-2">
              {departmentBars.slice(0, 3).map((bar) => (
                <div key={bar.dataKey}>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: bar.color }}
                      />
                      {bar.mobileLabel}
                    </span>
                    <span>{dept[bar.dataKey] || 0}</span>
                  </div>
                  <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${((dept[bar.dataKey] || 0) / maxValue) * 100}%`,
                        backgroundColor: bar.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              Total: {dept.total || 0} tickets
            </p>
          </div>
        ))}
      </div>
    );
  };

  const getDailyTrendAxisConfig = (pointCount = 0, mobile = false) => {
    if (pointCount <= 1) {
      return { angle: 0, textAnchor: 'middle', height: 24, interval: 0 };
    }
    if (mobile || pointCount <= 10) {
      const interval = pointCount <= 6 ? 0 : Math.max(1, Math.ceil(pointCount / 5) - 1);
      return { angle: 0, textAnchor: 'middle', height: 28, interval };
    }
    return {
      angle: -25,
      textAnchor: 'end',
      height: 48,
      interval: Math.max(1, Math.floor(pointCount / 8)),
    };
  };

  const ChartWrapper = ({ children, minWidth, height = chartHeight, fit = false }) => {
    if (fit || !minWidth) {
      return (
        <div className="w-full min-w-0" style={{ height }}>
          {children}
        </div>
      );
    }

    return (
      <div className="w-full max-w-full overflow-x-auto overflow-y-hidden scrollbar-hide touch-pan-x">
        <div style={{ height, minWidth, width: minWidth }}>
          {children}
        </div>
      </div>
    );
  };

  const TrendLineLegend = ({ lines = [] }) => (
    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
      {lines.map((line) => (
        <div key={line.dataKey} className="flex items-center gap-2 min-w-0 px-2 py-1.5 rounded-lg bg-gray-700/30">
          <span
            className="w-4 h-1 rounded-full flex-shrink-0"
            style={{ backgroundColor: line.color }}
          />
          <span className="text-xs text-gray-300 truncate">
            <span className="sm:hidden">{line.mobileLabel}</span>
            <span className="hidden sm:inline">{line.label}</span>
          </span>
        </div>
      ))}
    </div>
  );

  const DistributionSummary = ({ items = [], gridClassName = 'grid-cols-1 sm:grid-cols-3' }) => {
    const total = items.reduce((sum, item) => sum + (item.value || 0), 0);

    return (
      <div className={`mt-3 grid gap-2 ${gridClassName}`}>
        {items.map((entry) => {
          const percent = total > 0 ? Math.round((entry.value / total) * 100) : 0;

          return (
            <div
              key={entry.name}
              className="flex items-start gap-2 min-w-0 p-2 sm:p-2.5 rounded-lg bg-gray-700/30 border border-gray-600/40"
            >
              <span
                className="w-3 h-3 mt-0.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-white break-words [overflow-wrap:anywhere]">
                  {entry.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {entry.value} ({percent}%)
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-8">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Analytics Overview</h2>
          <p className="text-gray-400">Loading comprehensive data visualization and insights</p>
        </div>

        {/* Key Metrics Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-3 bg-gray-600 rounded w-20"></div>
                  <div className="w-5 h-5 bg-gray-600 rounded"></div>
                </div>
                <div className="h-8 bg-gray-600 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Daily Trends Chart Skeleton */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-600 rounded w-48 mb-4"></div>
            <div className="h-64 bg-gray-600/20 rounded"></div>
          </div>
        </div>

        {/* Status and Priority Distribution Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-600 rounded w-40 mb-4"></div>
              <div className="flex items-center justify-center h-64">
                <div className="w-32 h-32 bg-gray-600 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-600 rounded w-44 mb-4"></div>
              <div className="flex items-center justify-center h-64">
                <div className="w-32 h-32 bg-gray-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Department Performance Skeleton */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-600 rounded w-52 mb-4"></div>
            <div className="h-64 bg-gray-600/20 rounded"></div>
          </div>
        </div>

        {/* Resolution Time Trends Skeleton */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-600 rounded w-56 mb-4"></div>
            <div className="h-64 bg-gray-600/20 rounded"></div>
          </div>
        </div>

        {/* Monthly Comparison and SLA Performance Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-600 rounded w-44 mb-4"></div>
              <div className="h-64 bg-gray-600/20 rounded"></div>
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-600 rounded w-36 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="h-4 bg-gray-600 rounded w-20"></div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-600 rounded-full h-2"></div>
                      <div className="h-4 bg-gray-600 rounded w-8"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Response Time Distribution Skeleton */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-600 rounded w-60 mb-4"></div>
            <div className="h-64 bg-gray-600/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4 sm:space-y-8 min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-8 px-1">
        <div className="text-center sm:text-left min-w-0">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">Analytics Overview</h2>
          <p className="text-xs sm:text-sm text-gray-400">Comprehensive data visualization and insights</p>
        </div>
        {onDateRangeChange ? (
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="w-full sm:w-auto shrink-0 px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Date range"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        ) : null}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm font-medium text-gray-400">Total Tickets</span>
            <svg className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">{tickets?.length || 0}</p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm font-medium text-gray-400">Resolved</span>
            <svg className="w-4 h-4 md:w-5 md:h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">
            {tickets?.filter(t => t.status === 'resolved').length || 0}
          </p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm font-medium text-gray-400">Open</span>
            <svg className="w-4 h-4 md:w-5 md:h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">
            {tickets?.filter(t => t.status === 'open').length || 0}
          </p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm font-medium text-gray-400">Critical</span>
            <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">
            {tickets?.filter(t => t.priority === 'critical').length || 0}
          </p>
        </div>
      </div>

      {/* Daily Trends - Line Chart */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-3 sm:p-4 md:p-6 min-w-0">
        <div className="mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white">Daily Ticket Trends</h3>
          <p className="text-xs text-gray-500 mt-1 break-words">
            Showing data from {ANALYTICS_EARLIEST_DATE.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        {(() => {
          const dailyTrends = chartData.dailyTrends || [];
          const axisConfig = getDailyTrendAxisConfig(dailyTrends.length, isMobile);
          const trendHeight = 220;

          return (
            <>
              <ChartWrapper fit height={trendHeight + axisConfig.height}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyTrends}
                    margin={{
                      top: 8,
                      right: 4,
                      left: -12,
                      bottom: axisConfig.height,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      tick={{ ...axisTick, fill: '#9CA3AF' }}
                      minTickGap={8}
                      {...axisConfig}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      tick={axisTick}
                      width={24}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      labelFormatter={(_label, payload) =>
                        payload?.[0]?.payload?.dateLabel || _label
                      }
                    />
                    {dailyTrendLines.map((line) => (
                      <Line
                        key={line.dataKey}
                        type="monotone"
                        dataKey={line.dataKey}
                        stroke={line.color}
                        strokeWidth={2}
                        name={line.label}
                        dot={dailyTrends.length <= 10}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </ChartWrapper>
              <TrendLineLegend lines={dailyTrendLines} />
            </>
          );
        })()}
      </div>

      {/* Status and Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Status Distribution - Pie Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-3 sm:p-4 md:p-6 min-w-0 overflow-hidden">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4">Status Distribution</h3>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={chartData.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius="70%"
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(chartData.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
          <DistributionSummary items={chartData.statusDistribution || []} />
        </div>

        {/* Priority Distribution - Donut Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-3 sm:p-4 md:p-6 min-w-0 overflow-hidden">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4">Priority Distribution</h3>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={chartData.priorityDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius="45%"
                  outerRadius="70%"
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(chartData.priorityDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartWrapper>
          <DistributionSummary
            items={chartData.priorityDistribution || []}
            gridClassName="grid-cols-2 sm:grid-cols-4"
          />
        </div>
      </div>

      {/* Department Performance */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-3 sm:p-4 md:p-6 min-w-0">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4">Department Performance</h3>
        {(() => {
          const departments = chartData.departmentPerformance || [];

          if (departments.length === 0) {
            return <p className="text-sm text-gray-400">No department data available.</p>;
          }

          if (isMobile) {
            return <DepartmentPerformanceCards departments={departments} />;
          }

          const deptChartHeight = Math.max(240, departments.length * 58 + 48);

          return (
            <>
              <ChartWrapper fit height={deptChartHeight}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={departments}
                    margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
                    barCategoryGap="20%"
                    barGap={4}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" horizontal={false} />
                    <XAxis type="number" stroke="#9CA3AF" tick={axisTick} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="department"
                      stroke="#9CA3AF"
                      width={148}
                      tick={<DepartmentYAxisTick />}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      labelFormatter={(label) => label}
                    />
                    <Bar dataKey="open" fill="#ef4444" name="Open" barSize={8} />
                    <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" barSize={8} />
                    <Bar dataKey="resolved" fill="#10b981" name="Resolved" barSize={8} />
                    <Bar dataKey="total" fill="#3b82f6" name="Total Tickets" barSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartWrapper>
              <TrendLineLegend lines={departmentBars} />
            </>
          );
        })()}
      </div>

      {/* Resolution Time Trends - Area Chart */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-3 sm:p-4 md:p-6 min-w-0">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 sm:mb-2">Average Resolution Time Trends</h3>
        <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
          Average hours from ticket creation to completion, grouped by the day each ticket was completed (Resolved or Closed).
        </p>
        {(() => {
          const trends = chartData.resolutionTrends || [];
          const hasCompletedData = trends.some((day) => day.completedCount > 0);

          if (!hasCompletedData) {
            return (
              <p className="text-sm text-gray-400 py-8 text-center">
                No completed tickets in this date range yet. Data appears once tickets are marked Resolved or Closed.
              </p>
            );
          }

          return (
            <ChartWrapper>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                  <XAxis dataKey="date" stroke="#9CA3AF" tick={axisTick} interval="preserveStartEnd" />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ ...axisTick }}
                    width={36}
                    tickFormatter={resolutionYAxisTick}
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="avgResolutionTime"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                    name="Avg Resolution Time"
                    connectNulls={false}
                    dot={{ r: 3, fill: '#10b981' }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>
          );
        })()}
      </div>

      {/* Monthly Comparison and SLA Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Monthly Comparison */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-3 sm:p-4 md:p-6 min-w-0">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4">Monthly Comparison</h3>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.monthlyComparison || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                <XAxis dataKey="month" stroke="#9CA3AF" tick={axisTick} />
                <YAxis stroke="#9CA3AF" tick={axisTick} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Legend {...legendProps} />
                <Bar dataKey="tickets" fill="#3b82f6" name="Total" />
                <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

        {/* SLA Performance */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-3 sm:p-4 md:p-6 min-w-0">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4">SLA Compliance</h3>
          <div className="space-y-2 sm:space-y-3">
            {(chartData.slaData || []).map((sla, index) => (
              <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-700/30 rounded-lg">
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-white">{sla.priority}</span>
                  <span className="text-xs text-gray-400 ml-1 sm:ml-2">({sla.target})</span>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <div className="flex-1 sm:w-16 min-w-[60px] bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        sla.compliance >= 90 ? 'bg-emerald-500' :
                        sla.compliance >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${sla.compliance}%` }}
                    ></div>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-white w-10 sm:w-12 text-right">{sla.compliance}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Response Time Distribution */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-3 sm:p-4 md:p-6 min-w-0">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4">Response Time Distribution</h3>
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.responseTimeDistribution || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis dataKey="range" stroke="#9CA3AF" tick={axisTick} />
              <YAxis stroke="#9CA3AF" tick={axisTick} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>
    </div>
  );
};

export default AnalyticsOverview;