// @ts-nocheck
'use client';

import { SkeletonChart, LoadingDots } from '@/lib/ui/LoadingComponents';

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
  ReferenceLine
} from 'recharts';

const TrendAnalysis = ({ tickets, users, feedback = [], dateRange }) => {
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
      <div className="space-y-8">
        <div className="flex items-center justify-between mb-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4"></div>
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
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Trend Analysis</h2>
        <p className="text-gray-400">Historical patterns and predictive insights</p>
      </div>

      {/* Metric Selection */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-700 rounded-lg p-1">
          {[
            { id: 'volume', name: 'Volume Trends' },
            { id: 'resolution', name: 'Resolution Trends' },
            { id: 'satisfaction', name: 'Satisfaction Trends' },
            { id: 'performance', name: 'Performance Trends' }
          ].map((metric) => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedMetric === metric.id
                  ? 'bg-gray-600 text-emerald-400 shadow-sm'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {metric.name}
            </button>
          ))}
        </div>
      </div>

      {/* Volume Trends - Composed Chart */}
      {selectedMetric === 'volume' && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 min-h-[250px] sm:min-h-[300px]">
          <h3 className="text-xl font-bold text-white mb-4">Ticket Volume Trends</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={trendData.volumeTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis yAxisId="left" stroke="#9CA3AF" />
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="daily" fill="#3b82f6" name="Daily Tickets" />
              <Line yAxisId="right" type="monotone" dataKey="weeklyAvg" stroke="#10b981" strokeWidth={3} name="7-Day Average" />
              <Line yAxisId="right" type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} name="Critical" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Resolution Trends - Area Chart */}
      {selectedMetric === 'resolution' && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 min-h-[250px] sm:min-h-[300px]">
          <h3 className="text-xl font-bold text-white mb-4">Resolution Performance Trends</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={trendData.resolutionTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis yAxisId="left" stroke="#9CA3AF" />
              <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="avgResolutionTime" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Avg Resolution Time (h)" />
              <Line yAxisId="right" type="monotone" dataKey="resolutionRate" stroke="#10b981" strokeWidth={3} name="Resolution Rate (%)" />
              <ReferenceLine yAxisId="right" y={90} stroke="#f59e0b" strokeDasharray="5 5" label="Target: 90%" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Satisfaction Trends - Scatter Chart */}
      {selectedMetric === 'satisfaction' && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 min-h-[250px] sm:min-h-[300px]">
          <h3 className="text-xl font-bold text-white mb-4">Customer Satisfaction vs Response Time</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={trendData.satisfactionTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis dataKey="responseTime" name="Response Time (h)" stroke="#9CA3AF" />
              <YAxis dataKey="satisfaction" name="Satisfaction (%)" stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Scatter dataKey="satisfaction" fill="#10b981" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Performance Trends - Multi-line Chart */}
      {selectedMetric === 'performance' && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 min-h-[250px] sm:min-h-[300px]">
          <h3 className="text-xl font-bold text-white mb-4">Performance Metrics Trends</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendData.performanceTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="slaCompliance" stroke="#10b981" strokeWidth={3} name="SLA Compliance (%)" />
              <Line type="monotone" dataKey="firstCallResolution" stroke="#3b82f6" strokeWidth={2} name="First Call Resolution (%)" />
              <Line type="monotone" dataKey="customerSatisfaction" stroke="#f59e0b" strokeWidth={2} name="Customer Satisfaction (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Department Trends */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 min-h-[250px] sm:min-h-[300px]">
        <h3 className="text-xl font-bold text-white mb-4">Department Volume Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={trendData.departmentTrends.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {trendData.departmentTrends.departments.map((dept, index) => (
              <Line 
                key={dept}
                type="monotone" 
                dataKey={dept} 
                stroke={`hsl(${index * 60}, 70%, 50%)`} 
                strokeWidth={2} 
                name={dept}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Seasonal Trends */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 min-h-[250px] sm:min-h-[300px]">
        <h3 className="text-xl font-bold text-white mb-4">Seasonal Patterns</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={trendData.seasonalTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis yAxisId="left" stroke="#9CA3AF" />
            <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="tickets" fill="#3b82f6" name="Total Tickets" />
            <Bar yAxisId="left" dataKey="resolved" fill="#10b981" name="Resolved" />
            <Line yAxisId="right" type="monotone" dataKey="resolutionRate" stroke="#f59e0b" strokeWidth={3} name="Resolution Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 min-h-[250px] sm:min-h-[300px]">
        <h3 className="text-xl font-bold text-white mb-4">7-Day Forecast</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData.forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={3} name="Predicted Volume" strokeDasharray="5 5" />
            <Line type="monotone" dataKey="confidence" stroke="#6b7280" strokeWidth={2} name="Confidence Level (%)" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 bg-purple-500/10 rounded-lg">
          <p className="text-sm text-purple-400">
            <strong>Forecast Note:</strong> Predictions are based on recent trends and may vary based on business conditions.
          </p>
        </div>
      </div>

      {/* Real-time Update Indicator */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3 animate-pulse"></div>
          <p className="text-emerald-400 font-medium">Trend analysis updates in real-time with new data</p>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;