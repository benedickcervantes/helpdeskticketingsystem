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

  const handleTicketCreated = (ticketId) => {
    setActiveTab('tickets');
    // You could add a toast notification here
  };

  const StatCard = ({ title, value, color, icon, subtitle }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 hover:border-emerald-500/30 transition-all duration-300">
      <div className="flex items-center">
        <div className={`p-3 rounded-xl ${color} backdrop-blur-sm flex-shrink-0`}>
          {icon}
        </div>
        <div className="ml-4 min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-400 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-semibold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Title and Description - NO SPACING FROM HEADER */}
      <div className="py-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Support Hub</h1>
        <p className="mt-2 text-base sm:text-lg text-gray-400">Create, track, and manage IT support tickets for all users and employees</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 sm:mb-8">
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
            onClick={() => setActiveTab('create')}
            className={`py-3 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'create'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
            }`}
          >
            Create Ticket
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
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6 sm:space-y-8 lg:space-y-10">
          {/* My Tickets Stats */}
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3 flex-shrink-0"></span>
              My Tickets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <StatCard
                title="My Tickets"
                value={myTicketsStats.total}
                color="bg-emerald-500/20 text-emerald-400"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                subtitle="Tickets I created"
              />
              <StatCard
                title="My Resolved Tickets"
                value={myTicketsStats.resolved}
                color="bg-emerald-500/20 text-emerald-400"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                subtitle="My resolved tickets"
              />
            </div>
          </div>

          {/* System Overview - Employee Statistics */}
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center">
              <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 flex-shrink-0"></span>
              Employee Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              <StatCard
                title="Total Tickets"
                value={allTicketsStats.total}
                color="bg-gray-700/50 text-gray-400"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                subtitle="All employee tickets"
              />
              <StatCard
                title="Active Tickets"
                value={allTicketsStats.open + allTicketsStats.inProgress}
                color="bg-red-500/20 text-red-400"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                subtitle="Open + In Progress"
              />
              <StatCard
                title="Completed Tickets"
                value={allTicketsStats.resolved}
                color="bg-emerald-500/20 text-emerald-400"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                subtitle="All resolved tickets"
              />
              <StatCard
                title="In Progress"
                value={allTicketsStats.inProgress}
                color="bg-cyan-500/20 text-cyan-400"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
                subtitle="Tickets being worked on"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 lg:p-8">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3 flex-shrink-0"></span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <button
                onClick={() => setActiveTab('create')}
                className="flex items-center p-4 sm:p-6 border border-gray-700 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all duration-300 group"
              >
                <div className="p-3 bg-emerald-500/20 rounded-lg mr-4 group-hover:bg-emerald-500/30 transition-colors flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="font-medium text-white text-base sm:text-lg">Create New Ticket</p>
                  <p className="text-sm sm:text-base text-gray-400">Report a new issue</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('tickets')}
                className="flex items-center p-4 sm:p-6 border border-gray-700 rounded-xl hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all duration-300 group"
              >
                <div className="p-3 bg-emerald-500/20 rounded-lg mr-4 group-hover:bg-emerald-500/30 transition-colors flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="font-medium text-white text-base sm:text-lg">View All Tickets</p>
                  <p className="text-sm sm:text-base text-gray-400">See all tickets for transparency</p>
                </div>
              </button>

              <button className="flex items-center p-4 sm:p-6 border border-gray-700 rounded-xl hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all duration-300 group">
                <div className="p-3 bg-cyan-500/20 rounded-lg mr-4 group-hover:bg-cyan-500/30 transition-colors flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="font-medium text-white text-base sm:text-lg">Help Center</p>
                  <p className="text-sm sm:text-base text-gray-400">Find answers</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="w-full">
          <TicketForm onTicketCreated={handleTicketCreated} />
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="w-full">
          <TicketList showAllTickets={true} />
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
