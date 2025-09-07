'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebaseconfig';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import AnalyticsOverview from './AnalyticsOverview';
import ExecutiveSummary from './ExecutiveSummary';
import PerformanceMetrics from './PerformanceMetrics';
import DepartmentAnalytics from './DepartmentAnalytics';
import TrendAnalysis from './TrendAnalysis';
import ReportGenerator from './ReportGenerator';

const ManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // Last 30 days
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Fetch all tickets with real-time updates
    const ticketsQuery = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTickets(ticketsData);
      setLastUpdate(new Date());
    });

    // Fetch all users with real-time updates
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    });

    setLoading(false);

    return () => {
      unsubscribeTickets();
      unsubscribeUsers();
    };
  }, []);

  // Auto-refresh indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getFilteredTickets = () => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - (parseInt(dateRange) * 24 * 60 * 60 * 1000));
    
    return tickets.filter(ticket => {
      const ticketDate = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
      return ticketDate >= daysAgo;
    });
  };

  const filteredTickets = getFilteredTickets();

  // Calculate comprehensive business metrics
  const getBusinessMetrics = () => {
    const totalTickets = filteredTickets.length;
    const openTickets = filteredTickets.filter(t => t.status === 'open').length;
    const inProgressTickets = filteredTickets.filter(t => t.status === 'in-progress').length;
    const resolvedTickets = filteredTickets.filter(t => t.status === 'resolved').length;
    const criticalTickets = filteredTickets.filter(t => t.priority === 'critical').length;
    const highPriorityTickets = filteredTickets.filter(t => t.priority === 'high').length;
    
    const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;
    const avgResolutionTime = calculateAvgResolutionTime();
    const customerSatisfaction = calculateCustomerSatisfaction();
    
    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      criticalTickets,
      highPriorityTickets,
      resolutionRate,
      avgResolutionTime,
      customerSatisfaction
    };
  };

  const calculateAvgResolutionTime = () => {
    const resolvedTickets = filteredTickets.filter(t => t.status === 'resolved' && t.updatedAt);
    if (resolvedTickets.length === 0) return 0;
    
    const totalHours = resolvedTickets.reduce((sum, ticket) => {
      const created = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
      const resolved = ticket.updatedAt?.toDate ? ticket.updatedAt.toDate() : new Date(ticket.updatedAt);
      const hours = (resolved - created) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    
    return Math.round(totalHours / resolvedTickets.length);
  };

  const calculateCustomerSatisfaction = () => {
    // Mock calculation - in real app, this would come from feedback data
    const resolvedTickets = filteredTickets.filter(t => t.status === 'resolved').length;
    const totalTickets = filteredTickets.length;
    if (totalTickets === 0) return 0;
    
    // Simulate satisfaction based on resolution rate and response time
    const baseScore = (resolvedTickets / totalTickets) * 100;
    const timeBonus = Math.max(0, 10 - (calculateAvgResolutionTime() / 24)); // Bonus for quick resolution
    return Math.min(100, Math.round(baseScore + timeBonus));
  };

  const getSupportHealthStatus = () => {
    const metrics = getBusinessMetrics();
    
    if (metrics.resolutionRate >= 90 && metrics.avgResolutionTime <= 24 && metrics.criticalTickets === 0) {
      return { status: 'Excellent', color: 'emerald', message: 'Support team is performing exceptionally well' };
    } else if (metrics.resolutionRate >= 80 && metrics.avgResolutionTime <= 48 && metrics.criticalTickets <= 2) {
      return { status: 'Good', color: 'blue', message: 'Support operations are running smoothly' };
    } else if (metrics.resolutionRate >= 70 && metrics.avgResolutionTime <= 72) {
      return { status: 'Fair', color: 'yellow', message: 'Some areas need attention but overall stable' };
    } else {
      return { status: 'Needs Attention', color: 'red', message: 'Immediate action required to improve support quality' };
    }
  };

  const getDepartmentPerformance = () => {
    const departmentStats = {};
    
    filteredTickets.forEach(ticket => {
      const user = users.find(u => u.uid === ticket.createdBy);
      if (user && user.department) {
        if (!departmentStats[user.department]) {
          departmentStats[user.department] = {
            total: 0,
            resolved: 0,
            open: 0,
            inProgress: 0,
            critical: 0
          };
        }
        
        departmentStats[user.department].total++;
        if (ticket.status === 'resolved') departmentStats[user.department].resolved++;
        if (ticket.status === 'open') departmentStats[user.department].open++;
        if (ticket.status === 'in-progress') departmentStats[user.department].inProgress++;
        if (ticket.priority === 'critical') departmentStats[user.department].critical++;
      }
    });

    return Object.entries(departmentStats).map(([dept, stats]) => ({
      department: dept,
      ...stats,
      resolutionRate: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0
    })).sort((a, b) => b.resolutionRate - a.resolutionRate);
  };

  const StatCard = ({ title, value, change, changeType, icon, color, subtitle, status }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mb-2">{subtitle}</p>}
          {status && (
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              status === 'Excellent' ? 'bg-emerald-100 text-emerald-800' :
              status === 'Good' ? 'bg-blue-100 text-blue-800' :
              status === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {status}
            </div>
          )}
          {change && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${
                changeType === 'increase' ? 'text-emerald-600' : 
                changeType === 'decrease' ? 'text-red-600' : 'text-slate-600'
              }`}>
                {changeType === 'increase' ? '↗' : changeType === 'decrease' ? '↘' : '→'} {change}
              </span>
              <span className="text-xs text-slate-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color} ml-4`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const HealthIndicator = ({ status, message }) => (
    <div className={`p-6 rounded-xl border-2 ${
      status.color === 'emerald' ? 'bg-emerald-50 border-emerald-200' :
      status.color === 'blue' ? 'bg-blue-50 border-blue-200' :
      status.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
      'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center">
        <div className={`w-4 h-4 rounded-full mr-3 ${
          status.color === 'emerald' ? 'bg-emerald-500' :
          status.color === 'blue' ? 'bg-blue-500' :
          status.color === 'yellow' ? 'bg-yellow-500' :
          'bg-red-500'
        }`}></div>
        <div>
          <h3 className={`text-lg font-bold ${
            status.color === 'emerald' ? 'text-emerald-800' :
            status.color === 'blue' ? 'text-blue-800' :
            status.color === 'yellow' ? 'text-yellow-800' :
            'text-red-800'
          }`}>
            Support Health: {status.status}
          </h3>
          <p className={`text-sm ${
            status.color === 'emerald' ? 'text-emerald-700' :
            status.color === 'blue' ? 'text-blue-700' :
            status.color === 'yellow' ? 'text-yellow-700' :
            'text-red-700'
          }`}>
            {status.message}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const metrics = getBusinessMetrics();
  const healthStatus = getSupportHealthStatus();
  const departmentPerformance = getDepartmentPerformance();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Executive Dashboard</h1>
              <p className="text-gray-600">Comprehensive IT Support Performance Overview</p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                <span>Live Data</span>
              </div>
              <p className="text-xs text-gray-400">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          {/* Date Range Selector */}
          <div className="mt-4">
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>

        {/* Support Health Status */}
        <div className="mb-8">
          <HealthIndicator status={healthStatus} />
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Support Requests"
            value={metrics.totalTickets}
            subtitle={`${dateRange} days`}
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            color="bg-emerald-500"
          />
          
          <StatCard
            title="Resolution Rate"
            value={`${metrics.resolutionRate}%`}
            subtitle="Successfully resolved"
            status={metrics.resolutionRate >= 90 ? 'Excellent' : metrics.resolutionRate >= 80 ? 'Good' : metrics.resolutionRate >= 70 ? 'Fair' : 'Needs Attention'}
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="bg-blue-500"
          />
          
          <StatCard
            title="Average Resolution Time"
            value={`${metrics.avgResolutionTime}h`}
            subtitle="Hours to resolve"
            status={metrics.avgResolutionTime <= 24 ? 'Excellent' : metrics.avgResolutionTime <= 48 ? 'Good' : metrics.avgResolutionTime <= 72 ? 'Fair' : 'Needs Attention'}
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="bg-cyan-500"
          />
          
          <StatCard
            title="Customer Satisfaction"
            value={`${metrics.customerSatisfaction}%`}
            subtitle="Overall satisfaction"
            status={metrics.customerSatisfaction >= 90 ? 'Excellent' : metrics.customerSatisfaction >= 80 ? 'Good' : metrics.customerSatisfaction >= 70 ? 'Fair' : 'Needs Attention'}
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
            color="bg-slate-500"
          />
        </div>

        {/* Critical Issues Alert */}
        {metrics.criticalTickets > 0 && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-red-800">Critical Issues Require Attention</h3>
                <p className="text-red-700">
                  {metrics.criticalTickets} critical support request{metrics.criticalTickets > 1 ? 's' : ''} need immediate resolution
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Department Performance */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Department Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departmentPerformance.map((dept) => (
              <div key={dept.department} className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{dept.department}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Total Requests:</span>
                    <span className="font-semibold">{dept.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Resolved:</span>
                    <span className="font-semibold text-emerald-600">{dept.resolved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Resolution Rate:</span>
                    <span className={`font-semibold ${
                      dept.resolutionRate >= 90 ? 'text-emerald-600' :
                      dept.resolutionRate >= 80 ? 'text-blue-600' :
                      dept.resolutionRate >= 70 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {dept.resolutionRate}%
                    </span>
                  </div>
                  {dept.critical > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-red-600">Critical Issues:</span>
                      <span className="font-semibold text-red-600">{dept.critical}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Executive Summary' },
              { id: 'analytics', name: 'Analytics Overview' },
              { id: 'performance', name: 'Performance Metrics' },
              { id: 'departments', name: 'Department Analysis' },
              { id: 'trends', name: 'Trend Analysis' },
              { id: 'reports', name: 'Generate Reports' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeTab === 'overview' && (
            <ExecutiveSummary 
              tickets={filteredTickets} 
              users={users} 
              metrics={metrics}
              healthStatus={healthStatus}
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsOverview 
              tickets={filteredTickets} 
              users={users} 
              dateRange={dateRange}
            />
          )}
          {activeTab === 'performance' && (
            <PerformanceMetrics 
              tickets={filteredTickets} 
              users={users} 
              metrics={metrics}
            />
          )}
          {activeTab === 'departments' && (
            <DepartmentAnalytics 
              tickets={filteredTickets} 
              users={users} 
              departmentPerformance={departmentPerformance}
            />
          )}
          {activeTab === 'trends' && (
            <TrendAnalysis 
              tickets={filteredTickets} 
              users={users} 
              dateRange={dateRange}
            />
          )}
          {activeTab === 'reports' && (
            <ReportGenerator 
              tickets={filteredTickets} 
              users={users} 
              metrics={metrics}
              healthStatus={healthStatus}
              departmentPerformance={departmentPerformance}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;
