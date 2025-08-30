// src/app/tickets/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import TicketList from '../components/Tickets/TicketList';
import TicketForm from '../components/Tickets/TicketForm';
import { mockTickets } from '../data/mockData';
import { getCurrentUser, logout } from '../utils/auth';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    
    // Check if we should show the form from URL params
    if (searchParams.get('new') === 'true') {
      setShowForm(true);
    }
    
    // Simulate loading tickets from API
    setTimeout(() => {
      // Filter tickets to show only user's tickets if they're not admin
      const userTickets = currentUser.role === 'admin' 
        ? mockTickets 
        : mockTickets.filter(ticket => ticket.createdBy === currentUser.name);
      
      setTickets(userTickets);
      setIsLoading(false);
    }, 500);
  }, [router, searchParams]);

  const handleCreateTicket = (ticketData) => {
    const newTicket = {
      id: Date.now(),
      ...ticketData,
      status: 'open',
      createdAt: new Date().toISOString(),
      createdBy: user.name,
      assignedTo: null,
      comments: []
    };
    
    setTickets([newTicket, ...tickets]);
    setShowForm(false);
    
    // Remove the 'new' parameter from URL
    router.replace('/tickets');
  };

  const handleUpdateTicket = (ticketData) => {
    const updatedTickets = tickets.map(ticket => 
      ticket.id === selectedTicket.id 
        ? { ...ticket, ...ticketData, updatedAt: new Date().toISOString() } 
        : ticket
    );
    
    setTickets(updatedTickets);
    setSelectedTicket(null);
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowForm(false);
  };

  const handleDeleteTicket = (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      setTickets(tickets.filter(ticket => ticket.id !== ticketId));
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(null);
      }
    }
  };

  // Filter tickets based on selected filter and search term
  const filteredTickets = tickets.filter(ticket => {
    const matchesFilter = filter === 'all' || ticket.status === filter;
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Layout user={user}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
              Support Tickets
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your support requests and track their status
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Ticket
            </button>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { status: 'all', label: 'Total Tickets', color: 'gray' },
            { status: 'open', label: 'Open Tickets', color: 'blue' },
            { status: 'in-progress', label: 'In Progress', color: 'yellow' },
            { status: 'resolved', label: 'Resolved', color: 'green' }
          ].map((stat) => {
            const count = stat.status === 'all' 
              ? tickets.length 
              : tickets.filter(t => t.status === stat.status).length;
            
            return (
              <div key={stat.status} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-md p-3 ${stat.color === 'gray' ? 'bg-gray-100 dark:bg-gray-900' : stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900' : stat.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-green-100 dark:bg-green-900'}`}>
                      <div className={`h-6 w-6 ${stat.color === 'gray' ? 'text-gray-600 dark:text-gray-400' : stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : stat.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                        {stat.status === 'all' && (
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        {stat.status === 'open' && (
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        {stat.status === 'in-progress' && (
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {stat.status === 'resolved' && (
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          {stat.label}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900 dark:text-white">
                          {count}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex space-x-2">
            {['all', 'open', 'in-progress', 'resolved'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === status
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'all' ? 'All' : status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search tickets..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : showForm ? (
          <TicketForm 
            onSubmit={handleCreateTicket} 
            isEditing={false}
            onCancel={() => {
              setShowForm(false);
              router.replace('/tickets');
            }}
          />
        ) : selectedTicket ? (
          <TicketForm 
            onSubmit={handleUpdateTicket} 
            initialData={selectedTicket}
            isEditing={true}
            onCancel={() => setSelectedTicket(null)}
            onDelete={() => handleDeleteTicket(selectedTicket.id)}
            userRole={user.role}
          />
        ) : (
          <TicketList 
            tickets={filteredTickets} 
            onTicketSelect={handleSelectTicket}
            userRole={user.role}
          />
        )}

        {/* Empty State */}
        {!isLoading && filteredTickets.length === 0 && !showForm && !selectedTicket && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tickets</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filter !== 'all' 
                ? 'No tickets match your search criteria. Try adjusting your filters.'
                : 'Get started by creating a new support ticket.'
              }
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Ticket
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}