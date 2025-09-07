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

  const statusColors = {
    open: 'bg-cyan-100 text-cyan-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-slate-100 text-slate-800'
  };

  const priorityColors = {
    low: 'bg-emerald-100 text-emerald-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
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

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  if (!mounted) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {showAllTickets ? 'All Tickets' : 'My Tickets'}
        </h2>
        
        <div className="flex space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
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
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
          <p className="text-slate-500">
            {filter === 'all' ? 'No tickets have been created yet.' : `No tickets with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                {userProfile?.role === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.title}
                      </div>
                      <div className="text-sm text-slate-500 truncate max-w-xs">
                        {ticket.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[ticket.status]}`}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[ticket.priority]}`}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.creatorInfo?.name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-slate-500">
                        {ticket.creatorInfo?.email || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
                      {ticket.creatorInfo?.department || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {formatDate(ticket.createdAt)}
                  </td>
                  {userProfile?.role === 'admin' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TicketList;
