// src/app/tickets/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import TicketList from '../components/Tickets/TicketList';
import TicketForm from '../components/Tickets/TicketForm';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { fetchTickets, createTicket, updateTicket, deleteTicket } from '../utils/firestore';

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const router = useRouter();
  const searchParams = useSearchParams();

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const fetchedTickets = await fetchTickets(user?.email, user?.role === 'admin');
        setTickets(fetchedTickets);
      } catch (error) {
        console.error('Failed to load tickets:', error);
        showNotification('Failed to load tickets', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadTickets();
      if (searchParams.get('new') === 'true') {
        setShowForm(true);
      }
    }
  }, [user, searchParams]);

  const handleCreateTicket = async (ticketData) => {
    try {
      const newTicket = {
        ...ticketData,
        status: 'open',
        createdAt: new Date().toISOString(),
        createdBy: user.email,
        assignedTo: null,
        comments: []
      };
      const createdTicket = await createTicket(newTicket);
      setTickets([createdTicket, ...tickets]);
      setShowForm(false);
      router.replace('/tickets');
      showNotification('Ticket created successfully');
    } catch (error) {
      console.error('Failed to create ticket:', error);
      showNotification('Failed to create ticket', 'error');
    }
  };

  const handleUpdateTicket = async (updates) => {
    try {
      await updateTicket(selectedTicket.id, updates);
      setTickets(tickets.map(t => 
        t.id === selectedTicket.id ? { ...t, ...updates } : t
      ));
      setSelectedTicket(null);
      showNotification('Ticket updated successfully');
    } catch (error) {
      console.error('Failed to update ticket:', error);
      showNotification('Failed to update ticket', 'error');
    }
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowForm(false);
  };

  const handleDeleteTicket = async (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        await deleteTicket(ticketId);
        setTickets(tickets.filter(t => t.id !== ticketId));
        if (selectedTicket?.id === ticketId) setSelectedTicket(null);
        showNotification('Ticket deleted successfully');
      } catch (error) {
        console.error('Failed to delete ticket:', error);
        showNotification('Failed to delete ticket', 'error');
      }
    }
  };

  // Filter tickets based on selected filter and search term
  const filteredTickets = tickets.filter(ticket => {
    const matchesFilter = filter === 'all' || ticket.status === filter;
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ticket.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <ProtectedRoute>
      <Layout user={user}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Notification */}
          {notification.show && (
            <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 ${
              notification.type === 'error' 
                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            }`}>
              {notification.message}
            </div>
          )}

          {/* Header */}
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Support Tickets
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage your support requests and track their status
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Ticket
              </button>
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 px-5 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[
              { status: 'all', label: 'Total Tickets', color: 'gray', icon: '📋' },
              { status: 'open', label: 'Open Tickets', color: 'blue', icon: '⚠️' },
              { status: 'in-progress', label: 'In Progress', color: 'yellow', icon: '🔄' },
              { status: 'resolved', label: 'Resolved', color: 'green', icon: '✅' }
            ].map((stat) => {
              const count = stat.status === 'all' 
                ? tickets.length 
                : tickets.filter(t => t.status === stat.status).length;
              
              return (
                <div key={stat.status} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-xl p-3 ${
                      stat.color === 'gray' ? 'bg-gray-100 dark:bg-gray-900' : 
                      stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900' : 
                      stat.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900' : 
                      'bg-green-100 dark:bg-green-900'
                    }`}>
                      <span className="text-2xl">{stat.icon}</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          {stat.label}
                        </dt>
                        <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                          {count}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters and Search */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {['all', 'open', 'in-progress', 'resolved'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      filter === status
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {status === 'all' ? 'All Tickets' : status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
              
              <div className="relative max-w-md w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search tickets by title or description..."
                  className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : showForm ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <TicketForm 
                onSubmit={handleCreateTicket} 
                isEditing={false}
                onCancel={() => {
                  setShowForm(false);
                  router.replace('/tickets');
                }}
              />
            </div>
          ) : selectedTicket ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <TicketForm 
                onSubmit={handleUpdateTicket} 
                initialData={selectedTicket}
                isEditing={true}
                onCancel={() => setSelectedTicket(null)}
                onDelete={() => handleDeleteTicket(selectedTicket.id)}
                userRole={user?.role}
              />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <TicketList 
                tickets={filteredTickets} 
                onTicketSelect={handleSelectTicket}
                userRole={user?.role}
              />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredTickets.length === 0 && !showForm && !selectedTicket && (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="mx-auto w-24 h-24 mb-4 text-gray-400 dark:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm || filter !== 'all' ? 'No matching tickets' : 'No tickets yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                  : 'Get started by creating your first support ticket.'
                }
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Ticket
              </button>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}