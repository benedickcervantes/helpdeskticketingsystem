// @ts-nocheck
'use client';

import { SkeletonChart, LoadingDots } from '@/lib/ui/LoadingComponents';
import { useTheme } from '@/lib/contexts/ThemeContext';

import { useState, useEffect } from 'react';
import {
  getTicketHours,
  isResolvedStatus,
  matchUserToTicket,
  parseTicketDate,
} from '@/lib/utils/analytics';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';

const TrendAnalysis = ({ tickets, users, feedback = [], dateRange }) => {
  const { theme } = useTheme();
  const chartAxis = theme === 'light' ? '#5b6b7f' : '#9CA3AF';
  const chartGrid = theme === 'light' ? '#c5ceda' : '#4B5563';
  const [trendData, setTrendData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('volume');

  useEffect(() => {
    if (tickets.length > 0) {
      generateTrendData();
    } else {
      setIsLoading(false);
    }
  }, [tickets, feedback, dateRange]);

  const getTicketDateStr = (ticket) => {
    const ticketDate = parseTicketDate(ticket.createdAt);
    return ticketDate ? ticketDate.toISOString().split('T')[0] : null;
  };

  const getFeedbackDateStr = (item) => {
    const date = parseTicketDate(item.createdAt);
    return date ? date.toISOString().split('T')[0] : null;
  };

  const generateTrendData = () => {
    setIsLoading(true);
    
    const volumeTrends = generateVolumeTrends();
    const resolutionTrends = generateResolutionTrends();
    const satisfactionTrends = generateSatisfactionTrends();
    const departmentTrends = generateDepartmentTrends();
    const seasonalTrends = generateSeasonalTrends();
    const performanceTrends = generatePerformanceTrends();
    const forecastData = generateForecastData();

    setTrendData({
      volumeTrends,
      resolutionTrends,
      satisfactionTrends,
      departmentTrends,
      seasonalTrends,
      performanceTrends,
      forecastData
    });
    
    setIsLoading(false);
  };

  const generateVolumeTrends = () => {
    const days = parseInt(dateRange);
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTickets = tickets.filter(ticket => getTicketDateStr(ticket) === dateStr);
      
      // Calculate moving averages
      const previousDays = Math.max(0, i - 6);
      const weekTickets = tickets.filter(ticket => {
        const ticketDate = parseTicketDate(ticket.createdAt);
        if (!ticketDate) return false;
        const ticketDay = Math.floor((new Date() - ticketDate) / (1000 * 60 * 60 * 24));
        return ticketDay >= previousDays && ticketDay <= i;
      });
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        daily: dayTickets.length,
        weeklyAvg: Math.round(weekTickets.length / 7),
        critical: dayTickets.filter(t => t.priority === 'critical').length,
        high: dayTickets.filter(t => t.priority === 'high').length
      });
    }
    
    return data;
  };

  const generateResolutionTrends = () => {
    const days = parseInt(dateRange);
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTickets = tickets.filter(ticket => {
        return getTicketDateStr(ticket) === dateStr && isResolvedStatus(ticket.status);
      });
      
      const avgResolutionTime = dayTickets.length > 0 ? 
        dayTickets.reduce((sum, ticket) => {
          return sum + (getTicketHours(ticket.createdAt, ticket.resolvedAt || ticket.updatedAt) || 0);
        }, 0) / dayTickets.length : 0;
      
      const createdThatDay = tickets.filter(t => getTicketDateStr(t) === dateStr).length;
      const resolutionRate = createdThatDay > 0 ? 
        (dayTickets.length / createdThatDay) * 100 : 0;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgResolutionTime: Math.round(avgResolutionTime),
        resolutionRate: Math.round(resolutionRate),
        resolvedCount: dayTickets.length
      });
    }
    
    return data;
  };

  const generateSatisfactionTrends = () => {
    const days = parseInt(dateRange);
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTickets = tickets.filter(ticket => {
        return getTicketDateStr(ticket) === dateStr && isResolvedStatus(ticket.status);
      });
      
      const avgResolutionTime = dayTickets.length > 0 ? 
        dayTickets.reduce((sum, ticket) => {
          return sum + (getTicketHours(ticket.createdAt, ticket.resolvedAt || ticket.updatedAt) || 0);
        }, 0) / dayTickets.length : 0;
      
      const dayFeedback = feedback.filter(item => getFeedbackDateStr(item) === dateStr);
      const satisfaction = dayFeedback.length > 0
        ? Math.round((dayFeedback.filter(item => item.rating >= 4).length / dayFeedback.length) * 100)
        : Math.max(60, Math.min(100, 100 - (avgResolutionTime / 24) * 10));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        satisfaction: Math.round(satisfaction),
        responseTime: Math.round(avgResolutionTime),
        ticketVolume: dayTickets.length
      });
    }
    
    return data;
  };

  const generateDepartmentTrends = () => {
    const departments = [...new Set(users.map(u => u.department).filter(Boolean))];
    const days = parseInt(dateRange);
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = { date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
      
      departments.forEach(dept => {
        const deptTickets = tickets.filter(ticket => {
          const user = users.find(u => matchUserToTicket(u, ticket.createdBy));
          return user?.department === dept && getTicketDateStr(ticket) === dateStr;
        });
        
        dayData[dept] = deptTickets.length;
      });
      
      data.push(dayData);
    }
    
    return { data, departments };
  };

  const generateSeasonalTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthTickets = tickets.filter(ticket => {
        const ticketDate = parseTicketDate(ticket.createdAt);
        return ticketDate?.getMonth() === index && ticketDate?.getFullYear() === currentYear;
      });
      
      const resolvedTickets = monthTickets.filter(t => isResolvedStatus(t.status));
      const avgResolutionTime = resolvedTickets.length > 0 ? 
        resolvedTickets.reduce((sum, ticket) => {
          return sum + (getTicketHours(ticket.createdAt, ticket.resolvedAt || ticket.updatedAt) || 0);
        }, 0) / resolvedTickets.length : 0;
      
      return {
        month,
        tickets: monthTickets.length,
        resolved: resolvedTickets.length,
        avgResolutionTime: Math.round(avgResolutionTime),
        resolutionRate: monthTickets.length > 0 ? Math.round((resolvedTickets.length / monthTickets.length) * 100) : 0
      };
    });
  };

  const generatePerformanceTrends = () => {
    const days = parseInt(dateRange);
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTickets = tickets.filter(ticket => getTicketDateStr(ticket) === dateStr);
      
      const resolvedTickets = dayTickets.filter(t => isResolvedStatus(t.status));
      const slaCompliant = resolvedTickets.filter(ticket => {
        const hours = getTicketHours(ticket.createdAt, ticket.resolvedAt || ticket.updatedAt);
        return hours !== null && hours <= 48;
      });

      const dayFeedback = feedback.filter(item => getFeedbackDateStr(item) === dateStr);
      const customerSatisfaction = dayFeedback.length > 0
        ? Math.round((dayFeedback.filter(item => item.rating >= 4).length / dayFeedback.length) * 100)
        : 0;

      const firstCallResolution = resolvedTickets.length > 0
        ? Math.round(
            (resolvedTickets.filter(ticket => {
              const hours = getTicketHours(ticket.createdAt, ticket.resolvedAt || ticket.updatedAt);
              return hours !== null && hours <= 8;
            }).length / resolvedTickets.length) * 100,
          )
        : 0;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        slaCompliance: resolvedTickets.length > 0 ? Math.round((slaCompliant.length / resolvedTickets.length) * 100) : 0,
        firstCallResolution,
        customerSatisfaction
      });
    }
    
    return data;
  };

  const generateForecastData = () => {
    const days = parseInt(dateRange);
    const recentTickets = tickets.filter((ticket) => {
      const ticketDate = parseTicketDate(ticket.createdAt);
      if (!ticketDate) return false;
      const ticketDay = Math.floor((Date.now() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
      return ticketDay >= 0 && ticketDay < 7;
    });
    const recentAvg = recentTickets.length / 7;
    const confidence = Math.min(95, Math.max(65, 60 + Math.min(tickets.length, 35)));
    const forecast = [];
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        forecast: Math.round(recentAvg),
        confidence
      });
    }
    
    return forecast;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-app-panel border border-app p-2 sm:p-3 rounded-lg shadow-lg max-w-[200px] sm:max-w-none">
          <p className="font-semibold text-app text-xs sm:text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-app-soft text-xs sm:text-sm">
              {entry.dataKey}: <span style={{ color: entry.color }}>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const axisTick = { fontSize: 10, fill: chartAxis };
  const chartHeight = 250;
  const legendProps = { wrapperStyle: { fontSize: '11px', paddingTop: '8px', color: chartAxis } };

  const ChartWrapper = ({ children }) => (
    <div className="w-full min-h-[250px] overflow-x-auto">
      <div className="w-full" style={{ height: chartHeight, minWidth: 260 }}>
        {children}
      </div>
    </div>
  );

  const METRICS = [
    { id: 'volume', name: 'Volume', fullName: 'Volume Trends' },
    { id: 'resolution', name: 'Resolution', fullName: 'Resolution Trends' },
    { id: 'satisfaction', name: 'Satisfaction', fullName: 'Satisfaction Trends' },
    { id: 'performance', name: 'Performance', fullName: 'Performance Trends' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-6">
          <div className="animate-pulse">
            <div className="h-8 bg-app-surface-2 rounded w-1/4"></div>
          </div>
          <LoadingDots />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonChart key={i} height={320} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4 sm:space-y-8 min-w-0">
      <div className="text-center mb-4 sm:mb-8 px-1">
        <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-app mb-1 sm:mb-2">Trend Analysis</h2>
        <p className="text-xs sm:text-sm text-app-muted">Historical patterns and predictive insights</p>
      </div>

      {/* Metric Selection */}
      <div className="mb-4 sm:mb-8">
        {/* Mobile: dropdown */}
        <div className="sm:hidden">
          <label htmlFor="trend-metric-select" className="sr-only">Select trend metric</label>
          <select
            id="trend-metric-select"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="w-full px-3 py-2.5 app-field border rounded-lg text-sm focus:outline-none"
          >
            {METRICS.map((metric) => (
              <option key={metric.id} value={metric.id}>{metric.fullName}</option>
            ))}
          </select>
        </div>
        {/* Tablet+ */}
        <div className="hidden sm:flex justify-center overflow-x-auto scrollbar-hide">
          <div className="bg-app-surface-2 rounded-lg p-1 flex flex-nowrap">
            {METRICS.map((metric) => (
              <button
                key={metric.id}
                onClick={() => setSelectedMetric(metric.id)}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  selectedMetric === metric.id
                    ? 'bg-app-primary-soft text-app-primary shadow-sm'
                    : 'text-app-muted hover:text-app-soft'
                }`}
              >
                <span className="sm:hidden">{metric.name}</span>
                <span className="hidden sm:inline">{metric.fullName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Volume Trends - Composed Chart */}
      {selectedMetric === 'volume' && (
        <div className="app-card rounded-xl border p-3 sm:p-4 md:p-6 min-w-0">
          <h3 className="text-base sm:text-xl font-bold text-app mb-3 sm:mb-4">Ticket Volume Trends</h3>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData.volumeTrends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="date" stroke={chartAxis} tick={axisTick} interval="preserveStartEnd" />
                <YAxis yAxisId="left" stroke={chartAxis} tick={axisTick} width={30} />
                <YAxis yAxisId="right" orientation="right" stroke={chartAxis} tick={axisTick} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Legend {...legendProps} />
                <Bar yAxisId="left" dataKey="daily" fill="#3b82f6" name="Daily Tickets" />
                <Line yAxisId="right" type="monotone" dataKey="weeklyAvg" stroke="#10b981" strokeWidth={2} name="7-Day Average" />
                <Line yAxisId="right" type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} name="Critical" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      )}

      {selectedMetric === 'resolution' && (
        <div className="app-card rounded-xl border p-3 sm:p-4 md:p-6 min-w-0">
          <h3 className="text-base sm:text-xl font-bold text-app mb-3 sm:mb-4">Resolution Performance Trends</h3>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData.resolutionTrends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="date" stroke={chartAxis} tick={axisTick} interval="preserveStartEnd" />
                <YAxis yAxisId="left" stroke={chartAxis} tick={axisTick} width={35} />
                <YAxis yAxisId="right" orientation="right" stroke={chartAxis} tick={axisTick} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Legend {...legendProps} />
                <Area yAxisId="left" type="monotone" dataKey="avgResolutionTime" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Avg Resolution Time (h)" />
                <Line yAxisId="right" type="monotone" dataKey="resolutionRate" stroke="#10b981" strokeWidth={2} name="Resolution Rate (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      )}

      {selectedMetric === 'satisfaction' && (
        <div className="app-card rounded-xl border p-3 sm:p-4 md:p-6 min-w-0">
          <h3 className="text-base sm:text-xl font-bold text-app mb-3 sm:mb-4">Customer Satisfaction vs Response Time</h3>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={trendData.satisfactionTrends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="responseTime" name="Response Time (h)" stroke={chartAxis} tick={axisTick} />
                <YAxis dataKey="satisfaction" name="Satisfaction (%)" stroke={chartAxis} tick={axisTick} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter dataKey="satisfaction" fill="#10b981" />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      )}

      {selectedMetric === 'performance' && (
        <div className="app-card rounded-xl border p-3 sm:p-4 md:p-6 min-w-0">
          <h3 className="text-base sm:text-xl font-bold text-app mb-3 sm:mb-4">Performance Metrics Trends</h3>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData.performanceTrends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="date" stroke={chartAxis} tick={axisTick} interval="preserveStartEnd" />
                <YAxis stroke={chartAxis} tick={axisTick} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Legend {...legendProps} />
                <Line type="monotone" dataKey="slaCompliance" stroke="#10b981" strokeWidth={2} name="SLA Compliance (%)" />
                <Line type="monotone" dataKey="firstCallResolution" stroke="#3b82f6" strokeWidth={2} name="First Call Resolution (%)" />
                <Line type="monotone" dataKey="customerSatisfaction" stroke="#f59e0b" strokeWidth={2} name="Customer Satisfaction (%)" />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      )}

      {/* Department Trends */}
      <div className="app-card rounded-xl border p-3 sm:p-4 md:p-6 min-w-0">
        <h3 className="text-base sm:text-xl font-bold text-app mb-3 sm:mb-4">Department Volume Trends</h3>
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData.departmentTrends?.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="date" stroke={chartAxis} tick={axisTick} interval="preserveStartEnd" />
              <YAxis stroke={chartAxis} tick={axisTick} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Legend {...legendProps} />
              {(trendData.departmentTrends?.departments || []).map((dept, index) => (
                <Line 
                  key={dept}
                  type="monotone" 
                  dataKey={dept} 
                  stroke={`hsl(${index * 60}, 70%, 50%)`} 
                  strokeWidth={2} 
                  name={dept}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Seasonal Trends */}
      <div className="app-card rounded-xl border p-3 sm:p-4 md:p-6 min-w-0">
        <h3 className="text-base sm:text-xl font-bold text-app mb-3 sm:mb-4">Seasonal Patterns</h3>
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData.seasonalTrends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="month" stroke={chartAxis} tick={axisTick} />
              <YAxis yAxisId="left" stroke={chartAxis} tick={axisTick} width={35} />
              <YAxis yAxisId="right" orientation="right" stroke={chartAxis} tick={axisTick} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Legend {...legendProps} />
              <Bar yAxisId="left" dataKey="tickets" fill="#3b82f6" name="Total Tickets" />
              <Bar yAxisId="left" dataKey="resolved" fill="#10b981" name="Resolved" />
              <Line yAxisId="right" type="monotone" dataKey="resolutionRate" stroke="#f59e0b" strokeWidth={2} name="Resolution Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Forecast */}
      <div className="app-card rounded-xl border p-3 sm:p-4 md:p-6 min-w-0">
        <h3 className="text-base sm:text-xl font-bold text-app mb-3 sm:mb-4">7-Day Forecast</h3>
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData.forecastData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="date" stroke={chartAxis} tick={axisTick} interval="preserveStartEnd" />
              <YAxis stroke={chartAxis} tick={axisTick} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Legend {...legendProps} />
              <Line type="monotone" dataKey="forecast" stroke="#059669" strokeWidth={2} name="Predicted Volume" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="confidence" stroke="#6b7280" strokeWidth={2} name="Confidence Level (%)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-app-primary-soft border border-app-primary/25 rounded-lg">
          <p className="text-xs sm:text-sm text-app-primary">
            <strong>Forecast Note:</strong> Predictions are based on recent trends and may vary based on business conditions.
          </p>
        </div>
      </div>

      {/* Real-time Update Indicator */}
      <div className="bg-app-primary-soft border border-app-primary/30 rounded-xl p-3 sm:p-4">
        <div className="flex items-center">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-app-primary rounded-full mr-2 sm:mr-3 animate-pulse flex-shrink-0"></div>
          <p className="text-xs sm:text-sm text-app-primary font-medium">Trend analysis updates in real-time with new data</p>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;