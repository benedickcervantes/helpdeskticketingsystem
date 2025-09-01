// src/app/admin/page.jsx
"use client";

import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import StatsDashboard from '../components/Admin/StatsDashboard';
import UserManagement from '../components/Admin/UserManagement';
import AdminPanel from '../components/Admin/AdminPanel';
import ExecutiveDashboard from '../components/Analytics/ExecutiveDashboard';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { mockTickets, mockUsers } from '../data/mockData';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setTickets(mockTickets);
      setUsers(mockUsers);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Calculate stats for the dashboard
  const stats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    inProgressTickets: tickets.filter(t => t.status === 'in-progress').length,
    resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
    totalUsers: users.length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    supportUsers: users.filter(u => u.role === 'support').length,
    regularUsers: users.filter(u => u.role === 'user').length,
  };

  // Handler functions
  const handleDeleteUser = (userId) => {
    if (window.confirm('Delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const handleUpdateUserRole = (userId, newRole) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };

  const handleDeleteTicket = (ticketId) => {
    if (window.confirm('Delete this ticket?')) {
      setTickets(tickets.filter(ticket => ticket.id !== ticketId));
    }
  };

  const handleUpdateTicketStatus = (ticketId, newStatus) => {
    setTickets(tickets.map(ticket => 
      ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
    ));
  };

  const tabs = ['dashboard', 'analytics', 'users', 'tickets', 'settings'];

  return (
    <ProtectedRoute requireAdmin={true}>
      <Layout user={user}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Enhanced Header */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Dashboard
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Last login: {new Date(user?.lastLogin).toLocaleString()}
                </span>
                <span className="hidden sm:inline-block text-gray-400">•</span>
                <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {user?.role.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Quick Action
              </button>
            </div>
          </div>

          {/* Enhanced Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-1.5 ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {tab === 'dashboard' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  )}
                  {tab === 'analytics' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Responsive Content Area */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            ) : (
              <div className="p-5">
                {activeTab === 'analytics' ? (
                  <ExecutiveDashboard tickets={tickets} />
                ) : activeTab === 'dashboard' ? (
                  <StatsDashboard stats={stats} tickets={tickets.slice(0, 5)} />
                ) : activeTab === 'users' ? (
                  <UserManagement 
                    users={users} 
                    onDeleteUser={handleDeleteUser} 
                    onUpdateUserRole={handleUpdateUserRole} 
                  />
                ) : activeTab === 'tickets' ? (
                  <AdminPanel 
                    tickets={tickets} 
                    onDeleteTicket={handleDeleteTicket}
                    onUpdateTicketStatus={handleUpdateTicketStatus}
                  />
                ) : (
                  <SettingsTab />
                )}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

// Settings Tab Component
function SettingsTab() {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            System Name
          </label>
          <input
            type="text"
            defaultValue="Federal Pioneer Helpdesk"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Support Email
          </label>
          <input
            type="email"
            defaultValue="support@fedpioneer.com"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}