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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Support Hub</h1>
          <p className="mt-2 text-slate-600">Create, track, and manage IT support tickets for all users and employees</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Create Ticket
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tickets'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              All Tickets
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* My Tickets Stats */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Tickets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard
                  title="My Tickets"
                  value={myTicketsStats.total}
                  color="bg-emerald-100 text-emerald-600"
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
                  color="bg-emerald-100 text-emerald-600"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Tickets"
                  value={allTicketsStats.total}
                  color="bg-slate-100 text-slate-600"
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
                  color="bg-red-100 text-red-600"
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
                  color="bg-emerald-100 text-emerald-600"
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
                  color="bg-cyan-100 text-cyan-600"
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('create')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Create New Ticket</p>
                    <p className="text-sm text-slate-500">Report a new issue</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('tickets')}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">View All Tickets</p>
                    <p className="text-sm text-slate-500">See all tickets for transparency</p>
                  </div>
                </button>

                <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-cyan-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Help Center</p>
                    <p className="text-sm text-slate-500">Find answers</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <TicketForm onTicketCreated={handleTicketCreated} />
        )}

        {activeTab === 'tickets' && (
          <TicketList showAllTickets={true} />
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
