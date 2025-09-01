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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome back, {user?.name}. Last login: {new Date(user?.lastLogin).toLocaleString()}
            </p>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Content */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'analytics' ? (
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