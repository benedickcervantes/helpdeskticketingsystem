'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebaseconfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import TicketForm from './TicketForm';
import TicketList from './TicketList';

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [allTicketsStats, setAllTicketsStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });
  const [myTicketsStats, setMyTicketsStats] = useState({
    total: 0,
    resolved: 0
  });

  useEffect(() => {
    if (!currentUser) return;

    // Get all tickets for system-wide statistics
    const allTicketsQuery = query(collection(db, 'tickets'));
    const unsubscribeAllTickets = onSnapshot(allTicketsQuery, (snapshot) => {
      const tickets = snapshot.docs.map(doc => doc.data());
      
      setAllTicketsStats({
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in-progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length
      });
    });

    // Get user's own tickets for personal statistics
    const myTicketsQuery = query(
      collection(db, 'tickets'),
      where('createdBy', '==', currentUser.uid)
    );
    const unsubscribeMyTickets = onSnapshot(myTicketsQuery, (snapshot) => {
      const tickets = snapshot.docs.map(doc => doc.data());
      
      setMyTicketsStats({
        total: tickets.length,
        resolved: tickets.filter(t => t.status === 'resolved').length
      });
    });

    return () => {
      unsubscribeAllTickets();
      unsubscribeMyTickets();
    };
  }, [currentUser]);

  const StatCard = ({ title, value, color, icon, description }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 hover:border-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-2">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} backdrop-blur-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Title and Description - FINE-TUNED SPACING FROM HEADER */}
      <div className="pt-2 pb-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Support Hub</h1>
        <p className="mt-2 text-base sm:text-lg text-gray-400">Create, track, and manage IT support tickets for all users and employees</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-4">
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
            My Tickets
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-3 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'create'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
            }`}
          >
            Create Ticket
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-5 pb-4">
          {/* System Statistics */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">System Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                title="Total Tickets"
                value={allTicketsStats.total}
                color="bg-blue-500/20"
                icon={
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                description="All system tickets"
              />
              <StatCard
                title="Open Tickets"
                value={allTicketsStats.open}
                color="bg-red-500/20"
                icon={
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                }
                description="Awaiting response"
              />
              <StatCard
                title="In Progress"
                value={allTicketsStats.inProgress}
                color="bg-yellow-500/20"
                icon={
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                description="Being worked on"
              />
              <StatCard
                title="Resolved"
                value={allTicketsStats.resolved}
                color="bg-green-500/20"
                icon={
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                description="Completed tickets"
              />
            </div>
          </div>

          {/* My Tickets Statistics */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">My Tickets</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <StatCard
                title="My Total Tickets"
                value={myTicketsStats.total}
                color="bg-emerald-500/20"
                icon={
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                description="Tickets I created"
              />
              <StatCard
                title="My Resolved"
                value={myTicketsStats.resolved}
                color="bg-cyan-500/20"
                icon={
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                description="My completed tickets"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <button
                onClick={() => setActiveTab('create')}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">Create New Ticket</h3>
                    <p className="text-sm text-emerald-100">Submit a new support request</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('tickets')}
                className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-emerald-500/30 text-white p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors duration-300">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">View My Tickets</h3>
                    <p className="text-sm text-gray-400">Track your support requests</p>
                  </div>
                </div>
              </button>

              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg text-white">Help & Support</h3>
                    <p className="text-sm text-blue-100">Get assistance and guidance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="space-y-5 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">My Support Tickets</h2>
            <TicketList showUserTicketsOnly={true} />
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="space-y-5 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">Create New Support Ticket</h2>
            <TicketForm />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
