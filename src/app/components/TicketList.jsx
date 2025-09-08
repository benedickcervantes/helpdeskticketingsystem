'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebaseconfig';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const TicketList = ({ showAllTickets = false }) => {
  const { currentUser, userProfile } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [mounted, setMounted] = useState(false);
  const [userCache, setUserCache] = useState({});
  const [viewMode, setViewMode] = useState('auto'); // 'auto', 'table', 'cards'

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
    if (!mounted || !currentUser) return;

    let q;
    
    // For transparency: show all tickets for all users
    if (showAllTickets) {
      // Get all tickets - use simple orderBy without where clause
      q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    } else {
      // Fallback: Users can only see their own tickets - use where clause only
      q = query(
        collection(db, 'tickets'),
        where('createdBy', '==', currentUser?.uid)
      );
    }

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch user data for each ticket
      const ticketsWithUsers = await Promise.all(
        ticketsData.map(async (ticket) => {
          const userData = await fetchUserData(ticket.createdBy);
          return {
            ...ticket,
            creatorInfo: userData
          };
        })
      );
      
      // Sort client-side to avoid composite index requirement
      ticketsWithUsers.sort((a, b) => {
        if (sortBy === 'createdAt') {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return bTime - aTime; // Descending order
        } else if (sortBy === 'priority') {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        } else if (sortBy === 'status') {
          return a.status.localeCompare(b.status);
        }
        return 0;
      });
      
      setTickets(ticketsWithUsers);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tickets:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [mounted, currentUser, showAllTickets, sortBy, userCache]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
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

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  // Mobile Card Component
  const TicketCard = ({ ticket }) => (
    <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600 p-4 hover:border-emerald-500/30 transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate mb-1">
            {ticket.title}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2 mb-2">
            {ticket.description}
          </p>
        </div>
        <div className="flex flex-col items-end space-y-2 ml-3">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[ticket.status]}`}>
            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
          </span>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${priorityColors[ticket.priority]}`}>
            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
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
        <div className="text-sm mb-3">
          <span className="text-gray-500">Created by:</span>
          <span className="text-gray-300 ml-1">{ticket.creatorInfo?.name || 'Unknown User'}</span>
          {ticket.creatorInfo?.department && (
            <span className="text-gray-500 ml-2">({ticket.creatorInfo.department})</span>
          )}
        </div>
      )}

      {userProfile?.role === 'admin' && (
        <div className="pt-3 border-t border-gray-600">
          <label className="block text-xs text-gray-400 mb-1">Update Status:</label>
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
            className="w-full text-sm border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-700 text-white transition-all duration-200"
          >
            <option value="open" className="bg-gray-800">Open</option>
            <option value="in-progress" className="bg-gray-800">In Progress</option>
            <option value="resolved" className="bg-gray-800">Resolved</option>
            <option value="closed" className="bg-gray-800">Closed</option>
          </select>
        </div>
      )}
    </div>
  );

  if (!mounted) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
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
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
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

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 space-y-4 lg:space-y-0">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center">
          <svg className="w-5 h-5 md:w-6 md:h-6 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {showAllTickets ? 'All Tickets' : 'My Tickets'}
        </h2>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* View Mode Toggle - Hidden on mobile, show on larger screens */}
          <div className="hidden lg:flex items-center space-x-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'cards' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'
              }`}
              title="Card View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'
              }`}
              title="Table View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-700 text-white transition-all duration-200 text-sm"
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
            className="px-3 py-2 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-700 text-white transition-all duration-200 text-sm"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-white mb-2">No tickets found</h3>
          <p className="text-gray-400">
            {filter === 'all' ? 'No tickets have been created yet.' : `No tickets with status "${filter}".`}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile/Tablet Card View */}
          <div className="block lg:hidden space-y-4">
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  {showAllTickets && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created By
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  {userProfile?.role === 'admin' && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                    <td className="px-4 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-white truncate">
                          {ticket.title}
                        </div>
                        <div className="text-sm text-gray-400 truncate">
                          {ticket.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[ticket.status]}`}>
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${priorityColors[ticket.priority]}`}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                      {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                    </td>
                    {showAllTickets && (
                      <td className="px-4 py-4 whitespace-nowrap">
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
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(ticket.createdAt)}
                    </td>
                    {userProfile?.role === 'admin' && (
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <select
                          value={ticket.status}
                          onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                          className="text-sm border border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-700 text-white transition-all duration-200"
                        >
                          <option value="open" className="bg-gray-800">Open</option>
                          <option value="in-progress" className="bg-gray-800">In Progress</option>
                          <option value="resolved" className="bg-gray-800">Resolved</option>
                          <option value="closed" className="bg-gray-800">Closed</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Large Desktop Enhanced Table View (when viewMode is 'table') */}
          {viewMode === 'table' && (
            <div className="hidden xl:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    {showAllTickets && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Created By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Department
                        </th>
                      </>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    {userProfile?.role === 'admin' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="max-w-sm">
                          <div className="text-sm font-medium text-white">
                            {ticket.title}
                          </div>
                          <div className="text-sm text-gray-400 truncate">
                            {ticket.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[ticket.status]}`}>
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${priorityColors[ticket.priority]}`}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                      </td>
                      {showAllTickets && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-white">
                                {ticket.creatorInfo?.name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-400">
                                {ticket.creatorInfo?.email || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-700 text-gray-300">
                              {ticket.creatorInfo?.department || 'N/A'}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(ticket.createdAt)}
                      </td>
                      {userProfile?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                            className="text-sm border border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-700 text-white transition-all duration-200"
                          >
                            <option value="open" className="bg-gray-800">Open</option>
                            <option value="in-progress" className="bg-gray-800">In Progress</option>
                            <option value="resolved" className="bg-gray-800">Resolved</option>
                            <option value="closed" className="bg-gray-800">Closed</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Large Desktop Card View (when viewMode is 'cards') */}
          {viewMode === 'cards' && (
            <div className="hidden xl:grid xl:grid-cols-2 2xl:grid-cols-3 gap-6">
              {filteredTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TicketList;