'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebaseconfig';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

const ExecutiveFeedbackDashboard = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // Last 30 days
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feedbackData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFeedback(feedbackData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate metrics
  const calculateMetrics = () => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - (parseInt(dateRange) * 24 * 60 * 60 * 1000));
    
    const recentFeedback = feedback.filter(item => {
      const itemDate = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt || 0);
      return itemDate >= daysAgo;
    });

    const totalFeedback = recentFeedback.length;
    const averageRating = totalFeedback > 0 
      ? (recentFeedback.reduce((sum, item) => sum + (item.rating || 0), 0) / totalFeedback).toFixed(1)
      : 0;
    
    const highRatings = recentFeedback.filter(item => item.rating >= 4).length;
    const lowRatings = recentFeedback.filter(item => item.rating <= 2).length;
    
    const satisfactionRate = totalFeedback > 0 ? ((highRatings / totalFeedback) * 100).toFixed(1) : 0;
    const improvementRate = totalFeedback > 0 ? ((lowRatings / totalFeedback) * 100).toFixed(1) : 0;

    return {
      totalFeedback,
      averageRating,
      satisfactionRate,
      improvementRate,
      highRatings,
      lowRatings
    };
  };

  const metrics = calculateMetrics();

  const getRatingDistribution = () => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedback.forEach(item => {
      if (item.rating >= 1 && item.rating <= 5) {
        distribution[item.rating]++;
      }
    });
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();

  const exportToCSV = () => {
    setExportLoading(true);
    try {
      const csvContent = [
        ['Date', 'Ticket Title', 'Rating', 'Suggestions'],
        ...feedback.map(item => [
          item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'N/A',
          item.ticketTitle || 'N/A',
          item.rating || 'N/A',
          item.suggestions || 'N/A'
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, color, icon }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 hover:border-emerald-500/30 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color} backdrop-blur-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <svg className="w-6 h-6 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Executive Feedback Report
          </h2>
          <p className="text-gray-400 mt-1">Comprehensive user feedback analytics and insights</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
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
          
          <button
            onClick={exportToCSV}
            disabled={exportLoading || feedback.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{exportLoading ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Feedback"
          value={metrics.totalFeedback}
          subtitle={`Last ${dateRange} days`}
          color="bg-blue-500/20 text-blue-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />
        
        <StatCard
          title="Average Rating"
          value={metrics.averageRating}
          subtitle="Out of 5 stars"
          color="bg-yellow-500/20 text-yellow-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
        
        <StatCard
          title="Satisfaction Rate"
          value={`${metrics.satisfactionRate}%`}
          subtitle="High ratings (4-5 stars)"
          color="bg-emerald-500/20 text-emerald-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <StatCard
          title="Improvement Areas"
          value={`${metrics.improvementRate}%`}
          subtitle="Low ratings (1-2 stars)"
          color="bg-red-500/20 text-red-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
        />
      </div>

      {/* Rating Distribution Chart */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Rating Distribution</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating];
            const percentage = feedback.length > 0 ? (count / feedback.length) * 100 : 0;
            const color = rating >= 4 ? 'bg-emerald-500' : rating >= 3 ? 'bg-yellow-500' : 'bg-red-500';
            
            return (
              <div key={rating} className="flex items-center space-x-3">
                <div className="w-8 text-sm font-medium text-gray-300">
                  {rating}★
                </div>
                <div className="flex-1 bg-gray-700 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="w-12 text-sm text-gray-400 text-right">
                  {count} ({percentage.toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Feedback */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Feedback</h3>
        {feedback.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <h4 className="text-lg font-medium text-white mb-2">No feedback data</h4>
            <p className="text-gray-400">Feedback will appear here once users start providing it.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.slice(0, 10).map((item) => (
              <div key={item.id} className="bg-gray-700/30 rounded-lg border border-gray-600 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white">{item.ticketTitle}</h4>
                    <p className="text-xs text-gray-400">
                      {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${
                          star <= item.rating ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                {item.suggestions && (
                  <p className="text-sm text-gray-300 bg-gray-800/50 p-2 rounded">
                    {item.suggestions}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveFeedbackDashboard;
