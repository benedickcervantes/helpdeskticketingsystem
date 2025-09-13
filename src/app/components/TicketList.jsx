'use client';

import { SkeletonCard, LoadingDots } from "./LoadingComponents";

import { useState, useEffect } from 'react';
import { db } from '../firebaseconfig';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { createTicketResolutionNotification, createFeedbackRequestNotification } from '../lib/notificationUtils';
import { getTicketFeedbackStatus } from '../lib/notificationUtils';
import FeedbackForm from './FeedbackForm';

const TicketList = ({ showAllTickets = false, showUserTicketsOnly = false, adminMode = false }) => {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState(null);

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
      ticketsQuery = query(collection(db, 'tickets'));
    } else if (showUserTicketsOnly) {
      ticketsQuery = query(
        collection(db, 'tickets'),
        where('createdBy', '==', currentUser.uid)
      );
    } else {
      ticketsQuery = query(
        collection(db, 'tickets'),
        where('createdBy', '==', currentUser.uid)
      );
    }

    const unsubscribe = onSnapshot(ticketsQuery, async (snapshot) => {
      const ticketsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const ticketData = { id: doc.id, ...doc.data() };
          
          if (showAllTickets && ticketData.createdBy) {
            const creatorInfo = await fetchUserData(ticketData.createdBy);
            ticketData.creatorInfo = creatorInfo;
          }
          
          if (ticketData.assignedTo) {
            const assignedInfo = await fetchUserData(ticketData.assignedTo);
            ticketData.assignedInfo = assignedInfo;
          }
          
          return ticketData;
        })
      );
      
      const sortedTickets = ticketsData.sort((a, b) => {
        if (sortBy === 'createdAt') {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bTime - aTime;
        } else if (sortBy === 'updatedAt') {
          const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt);
          const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt);
          return bTime - aTime;
        } else if (sortBy === 'priority') {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        } else if (sortBy === 'status') {
          const statusOrder = { open: 3, 'in-progress': 2, resolved: 1, closed: 0 };
          return (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0);
        }
        return 0;
      });
      
      setTickets(sortedTickets);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, showAllTickets, showUserTicketsOnly, sortBy]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: newStatus,
        updatedAt: new Date()
      });

      if (newStatus === 'resolved') {
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
          await createTicketResolutionNotification(ticket);
        }
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleFeedbackRequest = (ticket) => {
    setSelectedTicketForFeedback(ticket);
    setShowFeedbackForm(true);
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      // Save feedback to database
      const feedbackRef = doc(collection(db, "feedback"));
      await setDoc(feedbackRef, {
        ticketId: selectedTicketForFeedback.id,
        ticketTitle: selectedTicketForFeedback.title,
        createdBy: currentUser.uid,
        createdAt: new Date(),
        ...feedbackData
      });
      
      setShowFeedbackForm(false);
      setSelectedTicketForFeedback(null);
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  const handleViewDetails = (ticket) => {
    setSelectedTicketDetails(ticket);
    setShowTicketDetails(true);
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter !== 'all' && ticket.status !== filter) return false;
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
    
    if (adminMode && assignedToFilter !== 'all') {
      if (assignedToFilter === 'unassigned' && ticket.assignedTo) return false;
      if (assignedToFilter === 'assigned' && !ticket.assignedTo) return false;
      if (assignedToFilter !== 'unassigned' && assignedToFilter !== 'assigned' && ticket.assignedTo !== assignedToFilter) return false;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesTitle = ticket.title?.toLowerCase().includes(searchLower);
      const matchesDescription = ticket.description?.toLowerCase().includes(searchLower);
      const matchesCreator = ticket.creatorInfo?.name?.toLowerCase().includes(searchLower) || 
                           ticket.creatorInfo?.email?.toLowerCase().includes(searchLower);
      const matchesAssigned = ticket.assignedInfo?.name?.toLowerCase().includes(searchLower) || 
                             ticket.assignedInfo?.email?.toLowerCase().includes(searchLower);
      
      if (!matchesTitle && !matchesDescription && !matchesCreator && !matchesAssigned) return false;
    }
    
    return true;
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'in-progress':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'resolved':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'closed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10h14" />
          </svg>
        );
      case 'low':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l5 5m0 0l5-5m-5 5V6" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (filteredTickets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No tickets found</h3>
        <p className="text-gray-400">
          {searchTerm ? 'No tickets match your search criteria.' : 
           showAllTickets ? 'No tickets have been created yet.' : 'You haven\'t created any tickets yet.'}
        </p>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Clear Search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={adminMode ? "Search tickets by title, description, creator, or assignee..." : "Search tickets by title, description, or creator..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
              }`}
            >
              All ({tickets.length})
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'open'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
              }`}
            >
              Open ({tickets.filter(t => t.status === 'open').length})
            </button>
            <button
              onClick={() => setFilter('in-progress')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'in-progress'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
              }`}
            >
              In Progress ({tickets.filter(t => t.status === 'in-progress').length})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'resolved'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
              }`}
            >
              Resolved ({tickets.filter(t => t.status === 'resolved').length})
            </button>
          </div>

          {/* Priority Filter, Assignment Filter (admin), and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {adminMode && (
              <select
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
                className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="all">All Assignments</option>
                <option value="unassigned">Unassigned</option>
                <option value="assigned">Assigned</option>
              </select>
            )}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Updated Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>

            <div className="flex bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 transition-colors ${
                  viewMode === 'cards' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'
                }`}
                title="Card View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 transition-colors ${
                  viewMode === 'table' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'
                }`}
                title="Table View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V6a2 2 0 012-2h14a2 2 0 012 2v16a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-gray-400">
          Showing {filteredTickets.length} of {tickets.length} tickets
          {searchTerm && ` matching "${searchTerm}"`}
          {priorityFilter !== 'all' && ` with ${priorityFilter} priority`}
          {adminMode && assignedToFilter !== 'all' && ` (${assignedToFilter})`}
        </div>
      </div>

      {/* Responsive Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6 hover:border-emerald-500/30 transition-all duration-300"
          >
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white truncate">{ticket.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 ${statusColors[ticket.status]}`}>
                      {getStatusIcon(ticket.status)}
                      <span className="capitalize">{ticket.status}</span>
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 ${priorityColors[ticket.priority]}`}>
                      {getPriorityIcon(ticket.priority)}
                      <span className="capitalize">{ticket.priority}</span>
                    </span>
                    {adminMode && ticket.assignedInfo && (
                      <span className="px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {ticket.assignedInfo.name || ticket.assignedInfo.email}
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-400 mb-3 line-clamp-2 text-sm sm:text-base">{ticket.description}</p>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                  <span>Created: {formatDate(ticket.createdAt)}</span>
                  {ticket.updatedAt && (
                    <span>Updated: {formatDate(ticket.updatedAt)}</span>
                  )}
                  {showAllTickets && ticket.creatorInfo && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {ticket.creatorInfo.name || ticket.creatorInfo.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 xl:flex-col xl:min-w-[200px]">
                {adminMode && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                  <button
                    onClick={() => handleStatusChange(ticket.id, 'resolved')}
                    className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    Mark Resolved
                  </button>
                )}
                
                {ticket.status === 'resolved' && (
                  <button
                    onClick={() => handleFeedbackRequest(ticket)}
                    className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    Request Feedback
                  </button>
                )}
                
                <button
                  onClick={() => handleViewDetails(ticket)}
                  className="px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Ticket Details Modal */}
      {showTicketDetails && selectedTicketDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border-b border-gray-700/50 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Ticket Details</h2>
                    <p className="text-sm text-gray-400">#{selectedTicketDetails.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTicketDetails(false);
                    setSelectedTicketDetails(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800/50 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              <div className="space-y-6">
                {/* Ticket Header */}
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50">
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">{selectedTicketDetails.title}</h3>
                    
                    {/* Status and Priority Badges */}
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      <span className={`px-3 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 ${statusColors[selectedTicketDetails.status]}`}>
                        {getStatusIcon(selectedTicketDetails.status)}
                        <span className="capitalize">{selectedTicketDetails.status}</span>
                      </span>
                      <span className={`px-3 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 ${priorityColors[selectedTicketDetails.priority]}`}>
                        {getPriorityIcon(selectedTicketDetails.priority)}
                        <span className="capitalize">{selectedTicketDetails.priority}</span>
                      </span>
                      {adminMode && selectedTicketDetails.assignedInfo && (
                        <span className="px-3 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Assigned to: {selectedTicketDetails.assignedInfo.name || selectedTicketDetails.assignedInfo.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Description - Takes 2 columns on large screens */}
                  <div className="lg:col-span-2 bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h4 className="text-lg font-semibold text-white">Description</h4>
                    </div>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedTicketDetails.description}</p>
                  </div>

                  {/* Ticket Information - Takes 1 column on large screens */}
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-lg font-semibold text-white">Information</h4>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-400 text-sm block">Ticket ID</span>
                        <span className="text-white font-mono text-sm bg-gray-700/50 px-2 py-1 rounded">{selectedTicketDetails.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm block">Created</span>
                        <span className="text-white">{formatDate(selectedTicketDetails.createdAt)}</span>
                      </div>
                      {selectedTicketDetails.updatedAt && (
                        <div>
                          <span className="text-gray-400 text-sm block">Last Updated</span>
                          <span className="text-white">{formatDate(selectedTicketDetails.updatedAt)}</span>
                        </div>
                      )}
                      {showAllTickets && selectedTicketDetails.creatorInfo && (
                        <div>
                          <span className="text-gray-400 text-sm block">Created by</span>
                          <span className="text-white">{selectedTicketDetails.creatorInfo.name || selectedTicketDetails.creatorInfo.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {(selectedTicketDetails.category || selectedTicketDetails.department || selectedTicketDetails.tags) && (
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <h4 className="text-lg font-semibold text-white">Additional Details</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedTicketDetails.category && (
                        <div className="bg-gray-700/30 rounded-lg p-3">
                          <span className="text-gray-400 text-sm block mb-1">Category</span>
                          <span className="text-white font-medium">{selectedTicketDetails.category}</span>
                        </div>
                      )}
                      {selectedTicketDetails.department && (
                        <div className="bg-gray-700/30 rounded-lg p-3">
                          <span className="text-gray-400 text-sm block mb-1">Department</span>
                          <span className="text-white font-medium">{selectedTicketDetails.department}</span>
                        </div>
                      )}
                      {selectedTicketDetails.tags && selectedTicketDetails.tags.length > 0 && (
                        <div className="sm:col-span-2 lg:col-span-3">
                          <span className="text-gray-400 text-sm block mb-2">Tags</span>
                          <div className="flex flex-wrap gap-2">
                            {selectedTicketDetails.tags.map((tag, index) => (
                              <span key={index} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm border border-emerald-500/30">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-700/50">
                  {selectedTicketDetails.status === 'resolved' && (
                    <button
                      onClick={() => {
                        setShowTicketDetails(false);
                        setSelectedTicketDetails(null);
                        handleFeedbackRequest(selectedTicketDetails);
                      }}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Request Feedback
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowTicketDetails(false);
                      setSelectedTicketDetails(null);
                    }}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Form Modal */}
      {showFeedbackForm && selectedTicketForFeedback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Request Feedback</h2>
                <button
                  onClick={() => {
                    setShowFeedbackForm(false);
                    setSelectedTicketForFeedback(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <FeedbackForm
                ticket={selectedTicketForFeedback}
                onSubmit={handleFeedbackSubmit}
                onCancel={() => {
                  setShowFeedbackForm(false);
                  setSelectedTicketForFeedback(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketList;
