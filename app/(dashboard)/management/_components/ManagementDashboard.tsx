// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { SkeletonCard, SkeletonChart } from '@/lib/ui/LoadingComponents';
import { api } from '@/lib/api/client';
import { subscribeTicketEvents } from '@/lib/realtime/socketClient';
import { useAuth } from '@/contexts/AuthContext';
import AnalyticsOverview from '@/app/(dashboard)/management/_components/AnalyticsOverview';
import ExecutiveSummary from '@/app/(dashboard)/management/_components/ExecutiveSummary';
import PerformanceMetrics from '@/app/(dashboard)/management/_components/PerformanceMetrics';
import DepartmentAnalytics from '@/app/(dashboard)/management/_components/DepartmentAnalytics';
import TrendAnalysis from '@/app/(dashboard)/management/_components/TrendAnalysis';
import ReportGenerator from '@/app/(dashboard)/management/_components/ReportGenerator';
import ExecutiveFeedbackDashboard from '@/app/(dashboard)/management/_components/ExecutiveFeedbackDashboard';

const ManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // Last 30 days
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { userProfile } = useAuth();

  const loadData = useCallback(async () => {
    try {
      const [ticketsData, feedbackData] = await Promise.all([
        api.get('/api/v1/tickets'),
        api.get('/api/v1/feedback'),
      ]);
      let usersData = [];
      if (userProfile?.role === 'admin') {
        try {
          usersData = (await api.get('/api/v1/users/admin')) || [];
        } catch {
          usersData = [];
        }
      }
      const sortByDate = (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      setTickets([...(ticketsData || [])].sort(sortByDate));
      setUsers(usersData);
      setFeedback([...(feedbackData || [])].sort(sortByDate));
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to load management dashboard', err);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    loadData();
    const unsub = subscribeTicketEvents(() => loadData(), () => loadData());
    return () => unsub();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-8">
          <div className="space-y-6">
            <SkeletonCard />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkeletonChart />
              <SkeletonChart />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        {/* Page Title and Description */}
        <div className="pt-4 sm:pt-6 pb-4 sm:pb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white">Management Dashboard</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base lg:text-lg text-gray-400">Comprehensive analytics and insights for executive decision making</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 sm:mb-8">
          <nav className="flex space-x-1 sm:space-x-2 lg:space-x-4 xl:space-x-8 border-b border-gray-700 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap ${
                activeTab === 'performance'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap ${
                activeTab === 'departments'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
              }`}
            >
              Departments
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap ${
                activeTab === 'trends'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
              }`}
            >
              Trends
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap ${
                activeTab === 'feedback'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
              }`}
            >
              Feedback
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8 pb-8">
            <ExecutiveSummary 
              tickets={tickets} 
              users={users} 
              feedback={feedback}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            <AnalyticsOverview 
              tickets={tickets} 
              users={users} 
              feedback={feedback}
              dateRange={dateRange}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8 pb-8">
            <AnalyticsOverview 
              tickets={tickets} 
              users={users} 
              feedback={feedback}
              dateRange={dateRange}
            />
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-8 pb-8">
            <PerformanceMetrics 
              tickets={tickets} 
              users={users} 
              feedback={feedback}
              dateRange={dateRange}
            />
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="space-y-8 pb-8">
            <DepartmentAnalytics 
              tickets={tickets} 
              users={users} 
              feedback={feedback}
              dateRange={dateRange}
            />
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-8 pb-8">
            <TrendAnalysis 
              tickets={tickets} 
              users={users} 
              feedback={feedback}
              dateRange={dateRange}
            />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-8 pb-8">
            <ReportGenerator 
              tickets={tickets} 
              users={users} 
              feedback={feedback}
              dateRange={dateRange}
            />
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-8 pb-8">
            <ExecutiveFeedbackDashboard 
              tickets={tickets} 
              users={users} 
              feedback={feedback}
              dateRange={dateRange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagementDashboard;
