'use client';

import { SkeletonCard, LoadingDots } from "./LoadingComponents";

import { useState, useEffect } from 'react';
import { db } from '../firebaseconfig';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { createTicketResolutionNotification, createFeedbackRequestNotification } from '../lib/notificationUtils';
import { getTicketFeedbackStatus } from '../lib/notificationUtils';import FeedbackForm from './FeedbackForm';

const TicketList = ({ showAllTickets = false }) => {
  const { currentUser, userProfile } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [mounted, setMounted] = useState(false);
  const [userCache, setUserCache] = useState({});
  const [viewMode, setViewMode] = useState('auto'); // 'auto', 'table', 'cards'
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedTicketForFeedback, setSelectedTicketForFeedback] = useState(null);

  const statusColors = {
    open: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'in-progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };

  const priorityColors = {
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  // Function to fetch user data
  const fetchUserData = async (userId) => {
    if (userCache[userId]) {
      return userCache[userId];
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() };
        setUserCache(prev => ({ ...prev, [userId]: userData }));
        return userData;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    return null;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    let ticketsQuery;
    
    if (showAllTickets) {
      // Show all tickets for transparency
      ticketsQuery = query(
        collection(db, 'tickets'),
        orderBy(sortBy, 'desc')
      );
    } else {
      // Show only user's own tickets
      ticketsQuery = query(
        collection(db, 'tickets'),
        where('createdBy', '==', currentUser.uid),
        orderBy(sortBy, 'desc')
      );
    }

    const unsubscribe = onSnapshot(ticketsQuery, async (snapshot) => {
      const ticketsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const ticketData = { id: doc.id, ...doc.data() };
          
          // Fetch creator info if showing all tickets
          if (showAllTickets && ticketData.createdBy) {
            const creatorInfo = await fetchUserData(ticketData.createdBy);
            ticketData.creatorInfo = creatorInfo;
          }
          
          return ticketData;
        })
      );
      
      setTickets(ticketsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, showAllTickets, sortBy]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: newStatus,
        updatedAt: new Date()
      });

      // Create notification for ticket resolution
      if (newStatus === 'resolved') {
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
          await createTicketResolutionNotification(ticket.createdBy, ticketId, ticket.title);
        }
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleFeedbackClick = async (ticket) => {
    try {
      const feedbackStatus = await getTicketFeedbackStatus(ticket.id);
      if (!feedbackStatus.hasFeedback) {
        setSelectedTicketForFeedback({
          id: ticket.id,
          title: ticket.title
        });
        setShowFeedbackForm(true);
      } else {
        alert('Feedback has already been provided for this ticket.');
      }
    } catch (error) {
      console.error('Error checking feedback status:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  const TicketCard = ({ ticket }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-3 sm:p-4 hover:border-emerald-500/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-white truncate">{ticket.title}</h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-2">{ticket.description}</p>
        </div>
        <div className="flex flex-col items-end space-y-1 ml-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[ticket.status]}`}>
            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
          </span>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${priorityColors[ticket.priority]}`}>
            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mb-2 sm:mb-3">
        <div>
          <span className="text-gray-500">Category:</span>
          <span className="text-gray-300 ml-1">{ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}</span>
        </div>
        <div>
          <span className="text-gray-500">Created:</span>
          <span className="text-gray-300 ml-1">{formatDate(ticket.createdAt)}</span>
        </div>
      </div>

      {showAllTickets && (
        <div className="text-xs sm:text-sm mb-2 sm:mb-3">
          <span className="text-gray-500">Created by:</span>
          <span className="text-gray-300 ml-1">{ticket.creatorInfo?.name || 'Unknown User'}</span>
          {ticket.creatorInfo?.department && (
            <span className="text-gray-500 ml-2">({ticket.creatorInfo.department})</span>
          )}
        </div>
      )}

      {/* Admin Controls */}
      {userProfile?.role === 'admin' && (
        <div className="pt-2 sm:pt-3 border-t border-gray-600">
          <label className="block text-xs text-gray-400 mb-1">Update Status:</label>
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
            className="w-full text-xs sm:text-sm border border-gray-600 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-700 text-white transition-all duration-200"
          >
            <option value="open" className="bg-gray-800">Open</option>
            <option value="in-progress" className="bg-gray-800">In Progress</option>
            <option value="resolved" className="bg-gray-800">Resolved</option>
            <option value="closed" className="bg-gray-800">Closed</option>
          </select>
        </div>
      )}

      {/* User Feedback Button for Resolved Tickets */}
      {ticket.status === 'resolved' && ticket.createdBy === currentUser?.uid && (
        <div className="pt-2 sm:pt-3 border-t border-gray-600">
          <button
            onClick={() => handleFeedbackClick(ticket)}
            className="w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Provide Feedback</span>
          </button>
        </div>
      )}
    </div>
  );

  if (!mounted) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-3 sm:p-4 lg:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-700 rounded w-32 sm:w-48"></div>
          </div>
          <LoadingDots />
        </div>
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} className="p-3 sm:p-4" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-3 sm:p-4 lg:p-6">
        {/* Header with improved responsive design */}
        <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {showAllTickets ? 'All Tickets' : 'My Tickets'}
          </h2>
          
          {/* Controls with better responsive layout */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-4">

            {/* View Mode Toggle - Hidden on mobile, show on larger screens */}
            <div className="hidden lg:flex items-center space-x-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  viewMode === 'cards' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'
                }`}
                title="Card View"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'
                }`}
                title="Table View"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-700 text-white transition-all duration-200 text-xs sm:text-sm"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-700 text-white transition-all duration-200 text-xs sm:text-sm"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {filteredTickets.length === 0 ? (
          <div className="text-center py-6 sm:py-8 lg:py-12">
            <div className="text-gray-400 text-4xl sm:text-6xl mb-3 sm:mb-4">📋</div>
            <h3 className="text-base sm:text-lg font-medium text-white mb-2">No tickets found</h3>
            <p className="text-sm sm:text-base text-gray-400">
              {filter === 'all' ? 'No tickets have been created yet.' : `No tickets with status "${filter}".`}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet Card View - Always show on mobile and tablet */}
            <div className="block lg:hidden space-y-3 sm:space-y-4">
              {filteredTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>

            {/* Desktop Table View - Show on large screens */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    {showAllTickets && (
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Created By
                      </th>
                    )}
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                      <td className="px-3 sm:px-4 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-white truncate">
                            {ticket.title}
                          </div>
                          <div className="text-sm text-gray-400 truncate">
                            {ticket.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[ticket.status]}`}>
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${priorityColors[ticket.priority]}`}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                        {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                      </td>
                      {showAllTickets && (
                        <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                          <div className="max-w-xs">
                            <div className="text-sm font-medium text-white truncate">
                              {ticket.creatorInfo?.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-400 truncate">
                              {ticket.creatorInfo?.email || 'N/A'}
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {userProfile?.role === 'admin' && (
                            <select
                              value={ticket.status}
                              onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                              className="text-sm border border-gray-600 rounded-lg px-2 sm:px-3 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-700 text-white transition-all duration-200"
                            >
                              <option value="open" className="bg-gray-800">Open</option>
                              <option value="in-progress" className="bg-gray-800">In Progress</option>
                              <option value="resolved" className="bg-gray-800">Resolved</option>
                              <option value="closed" className="bg-gray-800">Closed</option>
                            </select>
                          )}
                          {ticket.status === 'resolved' && ticket.createdBy === currentUser?.uid && (
                            <button
                              onClick={() => handleFeedbackClick(ticket)}
                              className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded transition-colors"
                            >
                              Feedback
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Feedback Form */}
      <FeedbackForm
        isOpen={showFeedbackForm}
        onClose={() => {
          setShowFeedbackForm(false);
          setSelectedTicketForFeedback(null);
        }}
        ticketId={selectedTicketForFeedback?.id}
        ticketTitle={selectedTicketForFeedback?.title}
      />
    </>
  );
};

export default TicketList;
