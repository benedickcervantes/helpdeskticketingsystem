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
import { IntelligentLoadingManager, StageProgressIndicator, SkeletonChart, SkeletonCard } from "./LoadingComponents";

const AnalyticsOverview = ({ tickets, users, dateRange }) => {
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
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTickets = tickets.filter(ticket => {
        const ticketDate = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
        return ticketDate.toISOString().split('T')[0] === dateStr;
      });
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: dayTickets.length,
        open: dayTickets.filter(t => t.status === 'open').length,
        inProgress: dayTickets.filter(t => t.status === 'in-progress').length,
        resolved: dayTickets.filter(t => t.status === 'resolved').length
      });
    }
    
    return data;
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
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTickets = tickets.filter(ticket => {
        const ticketDate = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
        return ticketDate.toISOString().split('T')[0] === dateStr && ticket.status === 'resolved';
      });
      
      const avgResolutionTime = dayTickets.length > 0 ? 
        dayTickets.reduce((sum, ticket) => {
          const created = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
          const resolved = ticket.updatedAt?.toDate ? ticket.updatedAt.toDate() : new Date(ticket.updatedAt);
          return sum + ((resolved - created) / (1000 * 60 * 60));
        }, 0) / dayTickets.length : 0;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgResolutionTime: Math.round(avgResolutionTime)
      });
    }
    
    return data;
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
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-white">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-gray-200">
              {entry.dataKey}: <span style={{ color: entry.color }}>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-8">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Analytics Overview</h2>
          <p className="text-gray-400">Loading comprehensive data visualization and insights</p>
        </div>

        {/* Key Metrics Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
    <div className="space-y-6 md:space-y-8">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Analytics Overview</h2>
        <p className="text-gray-400">Comprehensive data visualization and insights</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold text-white mb-4">Daily Ticket Trends</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData.dailyTrends || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total Tickets" />
            <Line type="monotone" dataKey="open" stroke="#ef4444" strokeWidth={2} name="Open" />
            <Line type="monotone" dataKey="inProgress" stroke="#f59e0b" strokeWidth={2} name="In Progress" />
            <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status and Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Status Distribution - Pie Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-white mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.statusDistribution || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
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
        </div>

        {/* Priority Distribution - Donut Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-white mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.priorityDistribution || []}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={5}
                dataKey="value"
              >
                {(chartData.priorityDistribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Performance - Bar Chart */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold text-white mb-4">Department Performance</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData.departmentPerformance || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
            <XAxis dataKey="department" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="total" fill="#3b82f6" name="Total Tickets" />
            <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
            <Bar dataKey="open" fill="#ef4444" name="Open" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Resolution Time Trends - Area Chart */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold text-white mb-4">Average Resolution Time Trends</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData.resolutionTrends || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="avgResolutionTime" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Comparison and SLA Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Monthly Comparison */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-white mb-4">Monthly Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.monthlyComparison || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="tickets" fill="#3b82f6" name="Total Tickets" />
              <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SLA Performance */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-white mb-4">SLA Compliance</h3>
          <div className="space-y-3">
            {(chartData.slaData || []).map((sla, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-white">{sla.priority}</span>
                  <span className="text-xs text-gray-400 ml-2">({sla.target})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        sla.compliance >= 90 ? 'bg-emerald-500' :
                        sla.compliance >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${sla.compliance}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-white w-12 text-right">{sla.compliance}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Response Time Distribution */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold text-white mb-4">Response Time Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData.responseTimeDistribution || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
            <XAxis dataKey="range" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsOverview;