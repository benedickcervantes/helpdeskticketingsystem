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
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';

const AnalyticsOverview = ({ tickets, users, dateRange }) => {
  const [chartData, setChartData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tickets.length > 0) {
      generateChartData();
    }
  }, [tickets, dateRange]);

  const generateChartData = () => {
    setIsLoading(true);
    
    // Daily ticket trends
    const dailyData = generateDailyTrends();
    
    // Status distribution
    const statusData = generateStatusDistribution();
    
    // Priority distribution
    const priorityData = generatePriorityDistribution();
    
    // Department performance
    const departmentData = generateDepartmentData();
    
    // Resolution time trends
    const resolutionData = generateResolutionTrends();
    
    // Monthly comparison
    const monthlyData = generateMonthlyComparison();
    
    // SLA performance
    const slaData = generateSLAData();
    
    // Response time distribution
    const responseTimeData = generateResponseTimeDistribution();

    setChartData({
      dailyTrends: dailyData,
      statusDistribution: statusData,
      priorityDistribution: priorityData,
      departmentPerformance: departmentData,
      resolutionTrends: resolutionData,
      monthlyComparison: monthlyData,
      slaPerformance: slaData,
      responseTimeDistribution: responseTimeData
    });
    
    setIsLoading(false);
  };

  const generateDailyTrends = () => {
    const days = parseInt(dateRange);
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
    const statusCounts = {
      'Open': tickets.filter(t => t.status === 'open').length,
      'In Progress': tickets.filter(t => t.status === 'in-progress').length,
      'Resolved': tickets.filter(t => t.status === 'resolved').length
    };
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: status === 'Open' ? '#ef4444' : status === 'In Progress' ? '#f59e0b' : '#10b981'
    }));
  };

  const generatePriorityDistribution = () => {
    const priorityCounts = {
      'Critical': tickets.filter(t => t.priority === 'critical').length,
      'High': tickets.filter(t => t.priority === 'high').length,
      'Medium': tickets.filter(t => t.priority === 'medium').length,
      'Low': tickets.filter(t => t.priority === 'low').length
    };
    
    return Object.entries(priorityCounts).map(([priority, count]) => ({
      name: priority,
      value: count,
      color: priority === 'Critical' ? '#dc2626' : 
             priority === 'High' ? '#ea580c' : 
             priority === 'Medium' ? '#d97706' : '#16a34a'
    }));
  };

  const generateDepartmentData = () => {
    const departmentStats = {};
    
    tickets.forEach(ticket => {
      const user = users.find(u => u.uid === ticket.createdBy);
      if (user && user.department) {
        if (!departmentStats[user.department]) {
          departmentStats[user.department] = {
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

    return Object.entries(departmentStats).map(([dept, stats]) => ({
      department: dept,
      total: stats.total,
      resolved: stats.resolved,
      open: stats.open,
      inProgress: stats.inProgress,
      resolutionRate: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  };

  const generateResolutionTrends = () => {
    const days = parseInt(dateRange);
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
          return sum + ((resolved - created) / (1000 * 60 * 60)); // hours
        }, 0) / dayTickets.length : 0;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgResolutionTime: Math.round(avgResolutionTime),
        resolvedCount: dayTickets.length
      });
    }
    
    return data;
  };

  const generateMonthlyComparison = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonth = new Date().getMonth();
    
    return months.map((month, index) => {
      const monthTickets = tickets.filter(ticket => {
        const ticketDate = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
        return ticketDate.getMonth() === (currentMonth - 5 + index + 12) % 12;
      });
      
      return {
        month,
        tickets: monthTickets.length,
        resolved: monthTickets.filter(t => t.status === 'resolved').length,
        avgResolutionTime: monthTickets.length > 0 ? 
          Math.round(monthTickets.reduce((sum, ticket) => {
            const created = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
            const resolved = ticket.updatedAt?.toDate ? ticket.updatedAt.toDate() : new Date(ticket.updatedAt);
            return sum + ((resolved - created) / (1000 * 60 * 60));
          }, 0) / monthTickets.length) : 0
      };
    });
  };

  const generateSLAData = () => {
    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
    const slaCompliant = tickets.filter(ticket => {
      if (ticket.status !== 'resolved') return false;
      const created = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
      const resolved = ticket.updatedAt?.toDate ? ticket.updatedAt.toDate() : new Date(ticket.updatedAt);
      const hours = (resolved - created) / (1000 * 60 * 60);
      return hours <= 48; // 48-hour SLA
    }).length;
    
    return [
      { name: 'SLA Compliant', value: slaCompliant, color: '#10b981' },
      { name: 'SLA Breached', value: resolvedTickets - slaCompliant, color: '#ef4444' }
    ];
  };

  const generateResponseTimeDistribution = () => {
    const ranges = [
      { range: '0-4h', min: 0, max: 4, color: '#10b981' },
      { range: '4-24h', min: 4, max: 24, color: '#3b82f6' },
      { range: '1-3d', min: 24, max: 72, color: '#f59e0b' },
      { range: '3-7d', min: 72, max: 168, color: '#ef4444' },
      { range: '7d+', min: 168, max: Infinity, color: '#6b7280' }
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
        count,
        color: range.color
      };
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
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
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Analytics Overview</h2>
        <p className="text-gray-600">Real-time data visualization and performance metrics</p>
      </div>

      {/* Daily Trends - Line Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Daily Ticket Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.dailyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} name="Total Tickets" />
            <Line type="monotone" dataKey="open" stroke="#ef4444" strokeWidth={2} name="Open" />
            <Line type="monotone" dataKey="inProgress" stroke="#f59e0b" strokeWidth={2} name="In Progress" />
            <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status and Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution - Pie Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution - Donut Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.priorityDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.priorityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Performance - Bar Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Department Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.departmentPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="total" fill="#3b82f6" name="Total Tickets" />
            <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
            <Bar dataKey="open" fill="#ef4444" name="Open" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Resolution Time Trends - Area Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Average Resolution Time Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData.resolutionTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="avgResolutionTime" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Comparison and SLA Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Comparison - Bar Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Monthly Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="tickets" fill="#3b82f6" name="Total Tickets" />
              <Bar yAxisId="left" dataKey="resolved" fill="#10b981" name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SLA Performance - Radial Bar Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">SLA Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={chartData.slaPerformance}>
              <RadialBar dataKey="value" cornerRadius={10} fill="#10b981" />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              SLA Compliance: {Math.round((chartData.slaPerformance[0]?.value / (chartData.slaPerformance[0]?.value + chartData.slaPerformance[1]?.value)) * 100) || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Response Time Distribution - Horizontal Bar Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Response Time Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.responseTimeDistribution} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="range" type="category" width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Real-time Update Indicator */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3 animate-pulse"></div>
          <p className="text-emerald-800 font-medium">Real-time data updates every 30 seconds</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverview;
