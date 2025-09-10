'use client';

import { SkeletonCard, SkeletonChart, LoadingDots } from "./LoadingComponents";

import { useState, useEffect } from 'react';
import { db } from '../firebaseconfig';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import AnalyticsOverview from './AnalyticsOverview';
import ExecutiveSummary from './ExecutiveSummary';
import PerformanceMetrics from './PerformanceMetrics';
import DepartmentAnalytics from './DepartmentAnalytics';
import TrendAnalysis from './TrendAnalysis';
import ReportGenerator from './ReportGenerator';
import ExecutiveFeedbackDashboard from './ExecutiveFeedbackDashboard';

const ManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
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

    // Fetch all feedback with real-time updates
    const feedbackQuery = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    const unsubscribeFeedback = onSnapshot(feedbackQuery, (snapshot) => {
      const feedbackData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFeedback(feedbackData);
    });

    setLoading(false);

    return () => {
      unsubscribeTickets();
      unsubscribeUsers();
      unsubscribeFeedback();
    };
  }, []);

  const getFilteredTickets = () => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - (parseInt(dateRange) * 24 * 60 * 60 * 1000));
    
    return tickets.filter(ticket => {
      if (!ticket || !ticket.createdAt) return false;
      const ticketDate = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
      return ticketDate >= daysAgo;
    });
  };

  const getFilteredFeedback = () => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - (parseInt(dateRange) * 24 * 60 * 60 * 1000));
    
    return feedback.filter(feedbackItem => {
      if (!feedbackItem || !feedbackItem.createdAt) return false;
      const feedbackDate = feedbackItem.createdAt?.toDate ? feedbackItem.createdAt.toDate() : new Date(feedbackItem.createdAt);
      return feedbackDate >= daysAgo;
    });
  };

  const filteredTickets = getFilteredTickets();
  const filteredFeedback = getFilteredFeedback();

  // Calculate comprehensive business metrics
  const getBusinessMetrics = () => {
    const totalTickets = filteredTickets.length;
    const openTickets = filteredTickets.filter(t => t && t.status === 'open').length;
    const inProgressTickets = filteredTickets.filter(t => t && t.status === 'in-progress').length;
    const resolvedTickets = filteredTickets.filter(t => t && t.status === 'resolved').length;
    const criticalTickets = filteredTickets.filter(t => t && t.priority === 'critical').length;
    const highPriorityTickets = filteredTickets.filter(t => t && t.priority === 'high').length;
    
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
    const resolvedTickets = filteredTickets.filter(t => t && t.status === 'resolved' && t.updatedAt);
    if (resolvedTickets.length === 0) return 0;
    
    const totalHours = resolvedTickets.reduce((sum, ticket) => {
      if (!ticket || !ticket.createdAt || !ticket.updatedAt) return sum;
      const created = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
      const resolved = ticket.updatedAt?.toDate ? ticket.updatedAt.toDate() : new Date(ticket.updatedAt);
      const hours = (resolved - created) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    
    return Math.round(totalHours / resolvedTickets.length);
  };

  const calculateCustomerSatisfaction = () => {
    // Use real feedback data instead of mock calculation
    if (filteredFeedback.length === 0) {
      // If no feedback data, return a neutral score
      return 0;
    }
    
    // Calculate average rating from feedback
    const totalRating = filteredFeedback.reduce((sum, item) => {
      return sum + (item.rating || 0);
    }, 0);
    
    const averageRating = totalRating / filteredFeedback.length;
    
    // Convert 1-5 star rating to percentage (1 star = 20%, 5 stars = 100%)
    const satisfactionPercentage = (averageRating / 5) * 100;
    
    return Math.round(satisfactionPercentage);
  };

  const metrics = getBusinessMetrics();

  // Calculate health status
  const getHealthStatus = () => {
    const { resolutionRate, avgResolutionTime, customerSatisfaction } = metrics;
    
    let status = 'Fair';
    let score = 0;
    
    // Calculate score based on metrics
    if (resolutionRate >= 90) score += 30;
    else if (resolutionRate >= 80) score += 20;
    else if (resolutionRate >= 70) score += 10;
    
    if (avgResolutionTime <= 24) score += 30;
    else if (avgResolutionTime <= 48) score += 20;
    else if (avgResolutionTime <= 72) score += 10;
    
    if (customerSatisfaction >= 90) score += 40;
    else if (customerSatisfaction >= 80) score += 30;
    else if (customerSatisfaction >= 70) score += 20;
    else if (customerSatisfaction >= 60) score += 10;
    
    // Determine status based on score
    if (score >= 80) status = 'Excellent';
    else if (score >= 60) status = 'Good';
    else if (score >= 40) status = 'Fair';
    else status = 'Poor';
    
    return { status, score };
  };

  const healthStatus = getHealthStatus();

  // Calculate department performance
  const getDepartmentMetrics = () => {
    const departments = {};
    
    users.forEach(user => {
      if (user && user.department && !departments[user.department]) {
        departments[user.department] = {
          name: user.department,
          totalUsers: 0,
          totalTickets: 0,
          resolved: 0,
          critical: 0,
          avgResolutionTime: 0
        };
      }
      
      if (user && user.department) {
        departments[user.department].totalUsers++;
      }
    });

    // Count tickets by department (simplified - in real app, you'd track which department handled each ticket)
    filteredTickets.forEach(ticket => {
      if (!ticket) return;
      const randomDept = Object.keys(departments)[Math.floor(Math.random() * Object.keys(departments).length)];
      if (randomDept) {
        departments[randomDept].totalTickets++;
        if (ticket.status === 'resolved') departments[randomDept].resolved++;
        if (ticket.priority === 'critical') departments[randomDept].critical++;
      }
    });

    // Calculate resolution rates
    Object.values(departments).forEach(dept => {
      dept.resolutionRate = dept.totalTickets > 0 ? Math.round((dept.resolved / dept.totalTickets) * 100) : 0;
    });

    return Object.values(departments);
  };

  const departmentMetrics = getDepartmentMetrics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} className="p-6" />
              ))}
            </div>
            <SkeletonChart className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Management Dashboard</h1>
              <p className="mt-2 text-gray-400">Executive insights and comprehensive analytics</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Tickets</p>
                <p className="text-3xl font-bold text-white mt-2">{metrics.totalTickets}</p>
                <p className="text-xs text-gray-500 mt-1">Last {dateRange} days</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Resolution Rate</p>
                <p className="text-3xl font-bold text-white mt-2">{metrics.resolutionRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Tickets resolved</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Avg Resolution Time</p>
                <p className="text-3xl font-bold text-white mt-2">{metrics.avgResolutionTime}h</p>
                <p className="text-xs text-gray-500 mt-1">Hours to resolve</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/20 text-yellow-400 backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Customer Satisfaction</p>
                <p className="text-3xl font-bold text-white mt-2">{metrics.customerSatisfaction}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredFeedback.length > 0 
                    ? `Based on ${filteredFeedback.length} feedback submissions` 
                    : 'No feedback data available'
                  }
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Department Performance Overview */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Department Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentMetrics.map((dept, index) => (
              <div key={index} className="bg-gray-700/30 rounded-lg border border-gray-600 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white">{dept.name}</h4>
                  <span className="text-sm text-gray-400">{dept.totalUsers} users</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Tickets:</span>
                    <span className="font-semibold text-white">{dept.totalTickets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Resolution Rate:</span>
                    <span className={`font-semibold ${
                      dept.resolutionRate >= 90 ? 'text-emerald-400' :
                      dept.resolutionRate >= 80 ? 'text-blue-400' :
                      dept.resolutionRate >= 70 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {dept.resolutionRate}%
                    </span>
                  </div>
                  {dept.critical > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-red-400">Critical Issues:</span>
                      <span className="font-semibold text-red-400">{dept.critical}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-700">
            {[
              { id: 'overview', name: 'Executive Summary' },
              { id: 'analytics', name: 'Analytics Overview' },
              { id: 'performance', name: 'Performance Metrics' },
              { id: 'departments', name: 'Department Analysis' },
              { id: 'trends', name: 'Trend Analysis' },
              { id: 'feedback', name: 'Feedback Reports' },
              { id: 'reports', name: 'Generate Reports' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
          {activeTab === 'overview' && (
            <ExecutiveSummary 
              tickets={filteredTickets}
              users={users}
              metrics={metrics}
              healthStatus={healthStatus}
              dateRange={dateRange}
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
              feedback={filteredFeedback}
              metrics={metrics}
              dateRange={dateRange}
            />
          )}
          
          {activeTab === 'departments' && (
            <DepartmentAnalytics 
              tickets={filteredTickets}
              users={users}
              departmentMetrics={departmentMetrics}
              dateRange={dateRange}
            />
          )}
          
          {activeTab === 'trends' && (
            <TrendAnalysis 
              tickets={filteredTickets}
              users={users}
              dateRange={dateRange}
            />
          )}
          
          {activeTab === 'feedback' && (
            <ExecutiveFeedbackDashboard />
          )}
          
          {activeTab === 'reports' && (
            <ReportGenerator 
              tickets={filteredTickets}
              users={users}
              metrics={metrics}
              dateRange={dateRange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;
