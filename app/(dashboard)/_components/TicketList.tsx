// @ts-nocheck
'use client';

import { SkeletonCard, LoadingDots } from '@/lib/ui/LoadingComponents';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { subscribeTicketEvents } from '@/lib/realtime/socketClient';
import { useAuth } from '@/contexts/AuthContext';
import { getTicketFeedbackStatus } from '@/lib/utils/notifications';
import FeedbackForm from '@/app/(dashboard)/_components/FeedbackForm';

// Fixed StatusDropdown Component with working absolute positioning
const STATUS_CONFIRM_MESSAGES = {
  'in-progress': {
    title: 'Move to In Progress?',
    message: 'This ticket will be marked as in progress. The requester will be notified of the status change.',
    confirmLabel: 'Move to In Progress',
    confirmClass: 'bg-yellow-600 hover:bg-yellow-700',
  },
  resolved: {
    title: 'Mark as Resolved?',
    message: 'This ticket will be marked as resolved. The requester may submit feedback after resolution.',
    confirmLabel: 'Mark Resolved',
    confirmClass: 'bg-emerald-600 hover:bg-emerald-700',
  },
};

const StatusDropdown = ({ currentStatus, ticketId, ticketTitle, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  const statusOptions = [
    { 
      value: 'open', 
      label: 'Open', 
      icon: '🔵'
    },
    { 
      value: 'in-progress', 
      label: 'In Progress', 
      icon: '🟡'
    },
    { 
      value: 'resolved', 
      label: 'Mark Resolved', 
      icon: '✅'
    },
  ];

  const handleStatusSelect = (newStatus) => {
    setIsOpen(false);
    if (newStatus !== currentStatus && STATUS_CONFIRM_MESSAGES[newStatus]) {
      setPendingStatus(newStatus);
      return;
    }
    onStatusChange(ticketId, newStatus);
  };

  const handleConfirmStatusChange = () => {
    if (!pendingStatus) return;
    onStatusChange(ticketId, pendingStatus);
    setPendingStatus(null);
  };

  const pendingConfirm = pendingStatus ? STATUS_CONFIRM_MESSAGES[pendingStatus] : null;

  const getCurrentStatusLabel = () => {
    const status = statusOptions.find(option => option.value === currentStatus);
    if (status) {
      return status.label;
    }
    // Handle the display for current status
    switch (currentStatus) {
      case 'open': return 'Open';
      case 'in-progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return 'Update Status';
    }
  };

  const getCurrentStatusIcon = () => {
    const status = statusOptions.find(option => option.value === currentStatus);
    return status ? status.icon : '📋';
  };

  const getCurrentStatusColors = () => {
    switch (currentStatus) {
      case 'open':
        return {
          bg: 'bg-gradient-to-r from-cyan-600 to-cyan-500',
          hover: 'hover:from-cyan-500 hover:to-cyan-400',
          border: 'border-cyan-500 hover:border-cyan-400',
          text: 'text-white'
        };
      case 'in-progress':
        return {
          bg: 'bg-gradient-to-r from-yellow-600 to-yellow-500',
          hover: 'hover:from-yellow-500 hover:to-yellow-400',
          border: 'border-yellow-500 hover:border-yellow-400',
          text: 'text-white'
        };
      case 'resolved':
        return {
          bg: 'bg-gradient-to-r from-emerald-600 to-emerald-500',
          hover: 'hover:from-emerald-500 hover:to-emerald-400',
          border: 'border-emerald-500 hover:border-emerald-400',
          text: 'text-white'
        };
      case 'closed':
        return {
          bg: 'bg-gradient-to-r from-gray-600 to-gray-500',
          hover: 'hover:from-gray-500 hover:to-gray-400',
          border: 'border-gray-500 hover:border-gray-400',
          text: 'text-white'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-600 to-blue-500',
          hover: 'hover:from-blue-500 hover:to-blue-400',
          border: 'border-blue-500 hover:border-blue-400',
          text: 'text-white'
        };
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.status-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
    <div className="relative status-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 sm:px-4 py-2 ${getCurrentStatusColors().bg} ${getCurrentStatusColors().hover} ${getCurrentStatusColors().text} rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-2 ${getCurrentStatusColors().border} shadow-md hover:shadow-lg`}
      >
        <span className="text-lg">{getCurrentStatusIcon()}</span>
        <span className="text-center">{getCurrentStatusLabel()}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-600 rounded-xl shadow-2xl z-50 overflow-hidden">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusSelect(option.value)}
              className={`w-full px-4 py-3 text-center text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                currentStatus === option.value 
                  ? 'bg-gray-700/50 cursor-not-allowed opacity-60 text-gray-400' 
                  : 'text-white hover:bg-gray-700/30 hover:scale-105'
              }`}
              disabled={currentStatus === option.value}
            >
              <span className="text-lg">{option.icon}</span>
              <span className="text-center font-semibold">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>

    {pendingConfirm && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border border-gray-700/50 w-full max-w-md shadow-2xl">
          <div className="p-5 sm:p-6 border-b border-gray-700/50">
            <h3 className="text-lg font-semibold text-white">{pendingConfirm.title}</h3>
            {ticketTitle && (
              <p className="text-sm text-emerald-400 mt-1 truncate">&quot;{ticketTitle}&quot;</p>
            )}
          </div>
          <div className="p-5 sm:p-6">
            <p className="text-sm text-gray-300 leading-relaxed">{pendingConfirm.message}</p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 p-5 sm:p-6 pt-0">
            <button
              type="button"
              onClick={() => setPendingStatus(null)}
              className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmStatusChange}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-medium transition-colors ${pendingConfirm.confirmClass}`}
            >
              {pendingConfirm.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
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
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [assigningTicketId, setAssigningTicketId] = useState(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

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

  const renderStars = (rating) =>
    [1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-600'}>
        ★
      </span>
    ));

  const FeedbackRatingBadge = ({ ticket, showSubmitter = false }) => {
    if (!ticket?.feedback?.rating) return null;

    const submitter = ticket.feedback.submittedBy;

    return (
      <span className="px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        <span className="flex items-center">{renderStars(ticket.feedback.rating)}</span>
        <span>{ticket.feedback.rating}/5</span>
        {showSubmitter && submitter && (
          <span className="text-yellow-300/80 truncate max-w-[120px]">
            · {submitter.name || submitter.email}
          </span>
        )}
      </span>
    );
  };

  const FeedbackRatingPanel = ({ ticket }) => {
    if (!ticket?.feedback?.rating) return null;

    const submitter = ticket.feedback.submittedBy;

    return (
      <div className="bg-yellow-500/10 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-yellow-500/30">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h4 className="text-base sm:text-lg font-semibold text-white">User Feedback</h4>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 text-lg">
            {renderStars(ticket.feedback.rating)}
            <span className="text-white font-semibold">{ticket.feedback.rating}/5</span>
          </div>
          {submitter && (
            <span className="text-sm text-yellow-200/80">
              Rated by {submitter.name || submitter.email}
            </span>
          )}
          {ticket.feedback.createdAt && (
            <span className="text-sm text-gray-400">
              {formatDate(ticket.feedback.createdAt)}
            </span>
          )}
        </div>
      </div>
    );
  };

  const normalizeTicket = (ticket) => ({
    ...ticket,
    createdAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
    updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt) : new Date(),
    creatorInfo: ticket.creator || null,
    assignedInfo: ticket.assignee || null,
  });

  const sortTickets = useCallback((ticketsData) => {
    return [...ticketsData].sort((a, b) => {
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'updatedAt') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      } else if (sortBy === 'status') {
        const statusOrder = { open: 3, 'in-progress': 2, resolved: 1, closed: 0 };
        return (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0);
      }
      return 0;
    });
  }, [sortBy]);

  const loadTickets = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await api.get('/api/v1/tickets');
      let ticketsData = (Array.isArray(data) ? data : []).map(normalizeTicket);
      if (showUserTicketsOnly || (!showAllTickets && !adminMode)) {
        ticketsData = ticketsData.filter((t) => t.createdBy === currentUser.uid);
      }
      setTickets(sortTickets(ticketsData));
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, showAllTickets, showUserTicketsOnly, adminMode, sortTickets]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!adminMode || !currentUser) return;
    api.get('/api/v1/users/admin')
      .then((data) => {
        const staff = (Array.isArray(data) ? data : []).filter(
          (u) => u.isActive !== false && ['admin', 'manager'].includes(u.role),
        );
        setAssignableUsers(staff);
      })
      .catch((err) => console.error('Error loading assignable users:', err));
  }, [adminMode, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    loadTickets();
    const unsub = subscribeTicketEvents(
      (ticket) => {
        if (!ticket?.id) return;
        setTickets((prev) => {
          const normalized = normalizeTicket(ticket);
          if (showUserTicketsOnly && normalized.createdBy !== currentUser.uid) {
            return prev;
          }
          const idx = prev.findIndex((t) => t.id === normalized.id);
          const next = idx >= 0
            ? prev.map((t, i) => (i === idx ? normalized : t))
            : [normalized, ...prev];
          return sortTickets(next);
        });
      },
      (ticket) => {
        if (!ticket?.id) return;
        setTickets((prev) => {
          const normalized = normalizeTicket(ticket);
          const idx = prev.findIndex((t) => t.id === normalized.id);
          if (idx < 0) return prev;
          const next = [...prev];
          next[idx] = normalized;
          return sortTickets(next);
        });
      },
    );
    return unsub;
  }, [currentUser, loadTickets, showUserTicketsOnly, sortTickets]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await api.patch(`/api/v1/tickets/${ticketId}/status`, { status: newStatus });
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleAssignTicket = async (ticketId, assignedToId) => {
    setAssigningTicketId(ticketId);
    try {
      await api.patch(`/api/v1/tickets/${ticketId}/assign`, {
        assignedToId: assignedToId || null,
      });
    } catch (error) {
      console.error('Error assigning ticket:', error);
    } finally {
      setAssigningTicketId(null);
    }
  };
  
  const handleFeedbackRequest = (ticket) => {
    setSelectedTicketForFeedback(ticket);
    setShowFeedbackForm(true);
  };

  const handleCloseFeedbackForm = () => {
    setShowFeedbackForm(false);
    setSelectedTicketForFeedback(null);
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
      const matchesTicketNumber = ticket.ticketNumber?.toLowerCase().includes(searchLower);
      
      if (!matchesTitle && !matchesDescription && !matchesCreator && !matchesAssigned && !matchesTicketNumber) return false;
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
            placeholder={adminMode ? "Search by ticket number, title, description, creator, or assignee..." : "Search by ticket number, title, description, or creator..."}
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
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full sm:w-auto bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                className="w-full sm:w-auto bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="all">All Assignments</option>
                <option value="unassigned">Unassigned</option>
                <option value="assigned">Assigned</option>
                {assignableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            )}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
            className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 sm:p-6 hover:border-emerald-500/30 transition-all duration-300"
          >
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 flex-1">
                    {ticket.ticketNumber && (
                      <span className="self-start px-2 py-1 rounded-lg text-xs font-mono font-semibold border bg-cyan-500/10 text-cyan-300 border-cyan-500/30 whitespace-nowrap">
                        {ticket.ticketNumber}
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-white truncate">{ticket.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 ${statusColors[ticket.status]}`}>
                      {getStatusIcon(ticket.status)}
                      <span className="capitalize">{ticket.status}</span>
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 ${priorityColors[ticket.priority]}`}>
                      {getPriorityIcon(ticket.priority)}
                      <span className="capitalize">{ticket.priority}</span>
                    </span>
                    {showAllTickets && ticket.assignedInfo && (
                      <span className="px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {ticket.assignedInfo.name || ticket.assignedInfo.email}
                      </span>
                    )}
                    {(showAllTickets || adminMode) && (
                      <FeedbackRatingBadge ticket={ticket} showSubmitter={showAllTickets && ticket.createdBy !== currentUser?.uid} />
                    )}
                    {!showAllTickets && !adminMode && ticket.feedback?.rating && (
                      <FeedbackRatingBadge ticket={ticket} />
                    )}
                    {ticket.attachments?.length > 0 && (
                      <span className="px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 bg-purple-500/20 text-purple-300 border-purple-500/30">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {ticket.attachments.length} photo{ticket.attachments.length > 1 ? 's' : ''}
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

              {/* Updated Action Buttons Section - StatusDropdown replaces individual buttons */}
              <div className="flex flex-col sm:flex-row gap-2 xl:flex-col xl:min-w-[200px]">
                {adminMode && ticket.status !== 'closed' && (
                  <select
                    value={ticket.assignedTo || ''}
                    onChange={(e) => handleAssignTicket(ticket.id, e.target.value || null)}
                    disabled={assigningTicketId === ticket.id}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                  >
                    <option value="">Unassigned</option>
                    {assignableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                )}

                {/* Status Dropdown - only show for admin mode */}
                {adminMode && ticket.status !== 'closed' && (
                  <StatusDropdown
                    currentStatus={ticket.status}
                    ticketId={ticket.id}
                    ticketTitle={ticket.title}
                    onStatusChange={handleStatusChange}
                  />
                )}
                
                {/* Request Feedback button - only show for non-admin mode when status is resolved */}
                {!adminMode && ticket.status === 'resolved' && ticket.createdBy === currentUser?.uid && !ticket.feedbackSubmitted && (
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

      {/* Enhanced Ticket Details Modal - FIXED RESPONSIVENESS */}
      {showTicketDetails && selectedTicketDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-30 flex items-center justify-center p-1 sm:p-2 md:p-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg sm:rounded-2xl border border-gray-700/50 w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden shadow-2xl mx-1 sm:mx-2">
            {/* Modal Header - RESPONSIVE */}
            <div className="bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border-b border-gray-700/50 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white truncate">Ticket Details</h2>
                    <p className="text-xs sm:text-sm text-cyan-300 font-mono font-semibold">
                      {selectedTicketDetails.ticketNumber || `#${selectedTicketDetails.id}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTicketDetails(false);
                    setSelectedTicketDetails(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-1.5 sm:p-2 hover:bg-gray-800/50 rounded-lg flex-shrink-0"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Content - RESPONSIVE */}
            <div className="p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[calc(98vh-80px)] sm:max-h-[calc(95vh-120px)]">
              <div className="space-y-4 sm:space-y-6">
                {/* Ticket Header - RESPONSIVE */}
                <div className="bg-gray-800/30 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-gray-700/50">
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white leading-tight break-words">{selectedTicketDetails.title}</h3>
                    
                    {/* Status and Priority Badges - RESPONSIVE */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3">
                      <span className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border flex items-center gap-1.5 sm:gap-2 ${statusColors[selectedTicketDetails.status]}`}>
                        {getStatusIcon(selectedTicketDetails.status)}
                        <span className="capitalize">{selectedTicketDetails.status}</span>
                      </span>
                      <span className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border flex items-center gap-1.5 sm:gap-2 ${priorityColors[selectedTicketDetails.priority]}`}>
                        {getPriorityIcon(selectedTicketDetails.priority)}
                        <span className="capitalize">{selectedTicketDetails.priority}</span>
                      </span>
                      {(adminMode || showAllTickets) && selectedTicketDetails.assignedInfo && (
                        <span className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border flex items-center gap-1.5 sm:gap-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="hidden sm:inline">Assigned to: </span>
                          <span className="truncate max-w-[120px] sm:max-w-none">{selectedTicketDetails.assignedInfo.name || selectedTicketDetails.assignedInfo.email}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Content Grid - RESPONSIVE */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {/* Description - Takes 2 columns on large screens */}
                  <div className="lg:col-span-2 bg-gray-800/30 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h4 className="text-base sm:text-lg font-semibold text-white">Description</h4>
                    </div>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed whitespace-pre-wrap break-words">{selectedTicketDetails.description}</p>

                    {selectedTicketDetails.attachments?.length > 0 && (
                      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-700/50">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <h4 className="text-sm sm:text-base font-semibold text-white">
                            Attachments ({selectedTicketDetails.attachments.length})
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {selectedTicketDetails.attachments.map((attachment) => (
                            <button
                              key={attachment.id}
                              type="button"
                              onClick={() => setLightboxImage(attachment)}
                              className="group relative rounded-lg overflow-hidden border border-gray-600/50 bg-gray-900/50 aspect-square hover:border-purple-500/50 transition-colors"
                            >
                              {attachment.url ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.fileName || 'Ticket attachment'}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs px-2 text-center">
                                  Image unavailable
                                </div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1">
                                <p className="text-xs text-gray-200 truncate">
                                  {attachment.fileName || 'Screenshot'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ticket Information - Takes 1 column on large screens */}
                  <div className="bg-gray-800/30 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-base sm:text-lg font-semibold text-white">Information</h4>
                    </div>
                    <div className="space-y-2.5 sm:space-y-3">
                      <div>
                        <span className="text-gray-400 text-xs sm:text-sm block">Ticket Number</span>
                        <span className="text-cyan-300 font-mono text-sm sm:text-base font-semibold bg-gray-700/50 px-2 py-1 rounded inline-block">
                          {selectedTicketDetails.ticketNumber || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs sm:text-sm block">Internal ID</span>
                        <span className="text-gray-400 font-mono text-[10px] sm:text-xs bg-gray-700/30 px-2 py-1 rounded break-all">{selectedTicketDetails.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs sm:text-sm block">Created</span>
                        <span className="text-white text-sm sm:text-base">{formatDate(selectedTicketDetails.createdAt)}</span>
                      </div>
                      {selectedTicketDetails.updatedAt && (
                        <div>
                          <span className="text-gray-400 text-xs sm:text-sm block">Last Updated</span>
                          <span className="text-white text-sm sm:text-base">{formatDate(selectedTicketDetails.updatedAt)}</span>
                        </div>
                      )}
                      {showAllTickets && selectedTicketDetails.creatorInfo && (
                        <div>
                          <span className="text-gray-400 text-xs sm:text-sm block">Created by</span>
                          <span className="text-white text-sm sm:text-base break-words">{selectedTicketDetails.creatorInfo.name || selectedTicketDetails.creatorInfo.email}</span>
                        </div>
                      )}
                      {adminMode && selectedTicketDetails.status !== 'closed' && (
                        <div>
                          <span className="text-gray-400 text-xs sm:text-sm block mb-1">Assign to</span>
                          <select
                            value={selectedTicketDetails.assignedTo || ''}
                            onChange={(e) => {
                              const value = e.target.value || null;
                              handleAssignTicket(selectedTicketDetails.id, value);
                              setSelectedTicketDetails((prev) => {
                                if (!prev) return prev;
                                const assignee = assignableUsers.find((u) => u.id === value) || null;
                                return {
                                  ...prev,
                                  assignedTo: value,
                                  assignedInfo: assignee
                                    ? { id: assignee.id, name: assignee.name, email: assignee.email }
                                    : null,
                                };
                              });
                            }}
                            disabled={assigningTicketId === selectedTicketDetails.id}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                          >
                            <option value="">Unassigned</option>
                            {assignableUsers.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name || user.email}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Information - RESPONSIVE */}
                {(selectedTicketDetails.category || selectedTicketDetails.department || selectedTicketDetails.tags) && (
                  <div className="bg-gray-800/30 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-gray-700/50">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <h4 className="text-base sm:text-lg font-semibold text-white">Additional Details</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {selectedTicketDetails.category && (
                        <div className="bg-gray-700/30 rounded-lg p-2.5 sm:p-3">
                          <span className="text-gray-400 text-xs sm:text-sm block mb-1">Category</span>
                          <span className="text-white font-medium text-sm sm:text-base break-words">{selectedTicketDetails.category}</span>
                        </div>
                      )}
                      {selectedTicketDetails.department && (
                        <div className="bg-gray-700/30 rounded-lg p-2.5 sm:p-3">
                          <span className="text-gray-400 text-xs sm:text-sm block mb-1">Department</span>
                          <span className="text-white font-medium text-sm sm:text-base break-words">{selectedTicketDetails.department}</span>
                        </div>
                      )}
                      {selectedTicketDetails.tags && selectedTicketDetails.tags.length > 0 && (
                        <div className="sm:col-span-2 lg:col-span-3">
                          <span className="text-gray-400 text-xs sm:text-sm block mb-2">Tags</span>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {selectedTicketDetails.tags.map((tag, index) => (
                              <span key={index} className="px-2 sm:px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs sm:text-sm border border-emerald-500/30">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <FeedbackRatingPanel ticket={selectedTicketDetails} />

                {/* Actions - RESPONSIVE */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-3 sm:pt-4 border-t border-gray-700/50">
                  {/* Request Feedback button - only show for non-admin mode when status is resolved */}
                  {!adminMode && selectedTicketDetails.status === 'resolved' && selectedTicketDetails.createdBy === currentUser?.uid && !selectedTicketDetails.feedbackSubmitted && (
                    <button
                      onClick={() => {
                        setShowTicketDetails(false);
                        setSelectedTicketDetails(null);
                        handleFeedbackRequest(selectedTicketDetails);
                      }}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="hidden sm:inline">Request Feedback</span>
                      <span className="sm:hidden">Feedback</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowTicketDetails(false);
                      setSelectedTicketDetails(null);
                    }}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {lightboxImage?.url && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white transition-colors"
            aria-label="Close image preview"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            className="max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.fileName || 'Ticket attachment'}
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
            />
            {lightboxImage.fileName && (
              <p className="mt-3 text-sm text-gray-300 text-center break-all px-4">
                {lightboxImage.fileName}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Feedback Form */}
      <FeedbackForm
        ticketId={selectedTicketForFeedback?.id}
        ticketTitle={selectedTicketForFeedback?.title}
        isOpen={showFeedbackForm}
        onClose={handleCloseFeedbackForm}
      />
    </div>
  );
};

export default TicketList;
