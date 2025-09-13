'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebaseconfig';
import { collection, query, onSnapshot } from 'firebase/firestore';
import TicketList from './TicketList';
import AutoResolutionManager from './AutoResolutionManager';
import UserManagement from './UserManagement';
import FeedbackAnalytics from './FeedbackAnalytics';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Listen to tickets for stats - use simple query without orderBy
    const ticketsQuery = query(collection(db, 'tickets'));
    const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
      const tickets = snapshot.docs.map(doc => doc.data());
      
      setStats({
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in-progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        critical: tickets.filter(t => t.priority === 'critical').length
      });
    });

    // Listen to users
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    });

    return () => {
      unsubscribeTickets();
      unsubscribeUsers();
    };
  }, []);

  const StatCard = ({ title, value, color, icon }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 hover:border-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color} backdrop-blur-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Title and Description - PROPER SPACING FROM HEADER */}
      <div className="pt-6 pb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Admin Dashboard</h1>
        <p className="mt-2 text-base sm:text-lg text-gray-400">Manage tickets, users, and system settings</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-1 sm:space-x-2 lg:space-x-8 border-b border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-3 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'tickets'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
            }`}
          >
            All Tickets
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('auto-resolution')}
            className={`py-3 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'auto-resolution'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
            }`}
          >
            Auto Resolution
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`py-3 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'feedback'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
            }`}
          >
            Feedback Analytics
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8 pb-8">
          {/* Statistics Cards */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-6">System Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              <StatCard
                title="Total Tickets"
                value={stats.total}
                color="bg-blue-500/20"
                icon={
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
              <StatCard
                title="Open Tickets"
                value={stats.open}
                color="bg-red-500/20"
                icon={
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                }
              />
              <StatCard
                title="In Progress"
                value={stats.inProgress}
                color="bg-yellow-500/20"
                icon={
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Resolved"
                value={stats.resolved}
                color="bg-green-500/20"
                icon={
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Critical"
                value={stats.critical}
                color="bg-purple-500/20"
                icon={
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <button
                onClick={() => setActiveTab('tickets')}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Manage Tickets</h3>
                    <p className="text-sm text-emerald-100">View and manage all tickets</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-emerald-500/30 text-white p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors duration-300">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">User Management</h3>
                    <p className="text-sm text-gray-400">Manage user accounts and roles</p>
                  </div>
                </div>
              </button>

              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg text-white">System Analytics</h3>
                    <p className="text-sm text-blue-100">View system performance metrics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="space-y-6 pb-8">
          {/* Admin Ticket Management Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">All Support Tickets</h2>
              <p className="text-sm text-gray-400">Comprehensive ticket management with advanced filtering and search</p>
            </div>
            
            {/* Admin-specific quick stats */}
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              <div className="bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">
                {stats.open} Open
              </div>
              <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">
                {stats.inProgress} In Progress
              </div>
              <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30">
                {stats.critical} Critical
              </div>
            </div>
          </div>

          {/* Enhanced TicketList with admin privileges */}
          <TicketList 
            showAllTickets={true} 
            showUserTicketsOnly={false}
            adminMode={true}
          />
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-8 pb-8">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-6">User Management</h2>
            <UserManagement users={users} />
          </div>
        </div>
      )}

      {activeTab === 'auto-resolution' && (
        <div className="space-y-8 pb-8">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-6">Auto Resolution Manager</h2>
            <AutoResolutionManager />
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-8 pb-8">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-6">Feedback Analytics</h2>
            <FeedbackAnalytics />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
