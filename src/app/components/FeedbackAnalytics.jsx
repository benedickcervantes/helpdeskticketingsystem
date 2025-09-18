'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebaseconfig';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

const FeedbackAnalytics = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('auto'); // auto, cards, list
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feedbackData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFeedback(feedbackData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Advanced filtering and sorting with memoization for performance
  const processedFeedback = useMemo(() => {
    let filtered = feedback.filter(item => {
      // Filter by rating
      if (filter === 'high-rating' && item.rating < 4) return false;
      if (filter === 'low-rating' && item.rating > 2) return false;
      if (filter === 'medium-rating' && (item.rating < 3 || item.rating > 3)) return false;
      
      // Search functionality
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.ticketTitle?.toLowerCase().includes(searchLower) ||
          item.suggestions?.toLowerCase().includes(searchLower) ||
          item.rating?.toString().includes(searchLower)
        );
      }
      
      return true;
    });

    // Sort feedback
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt) - 
                 new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt);
        case 'oldest':
          return new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt) - 
                 new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt);
        case 'rating-high':
          return b.rating - a.rating;
        case 'rating-low':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });
  }, [feedback, filter, sortBy, searchTerm]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = feedback.length;
    const highRating = feedback.filter(f => f.rating >= 4).length;
    const lowRating = feedback.filter(f => f.rating <= 2).length;
    const averageRating = total > 0 ? (feedback.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1) : 0;
    
    return { total, highRating, lowRating, averageRating };
  }, [feedback]);

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-emerald-400';
    if (rating >= 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRatingBgColor = (rating) => {
    if (rating >= 4) return 'bg-emerald-500/20 border-emerald-500/30';
    if (rating >= 3) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Enhanced Loading Component
  const LoadingSkeleton = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-gray-700 rounded w-48 sm:w-64"></div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="animate-pulse h-10 bg-gray-700 rounded w-full sm:w-48"></div>
          <div className="animate-pulse h-10 bg-gray-700 rounded w-full sm:w-32"></div>
        </div>
      </div>
      
      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-gray-700/30 rounded-lg p-3 sm:p-4">
            <div className="h-4 bg-gray-600 rounded w-16 mb-2"></div>
            <div className="h-6 bg-gray-600 rounded w-12"></div>
          </div>
        ))}
      </div>
      
      {/* Cards Skeleton */}
      <div className="space-y-3 sm:space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-600 rounded w-16"></div>
            </div>
            <div className="h-3 bg-gray-600 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-600 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  );

  // Statistics Cards Component
  const StatsCards = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
      <div className="bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-gray-600">
        <div className="text-xs sm:text-sm text-gray-400 mb-1">Total Feedback</div>
        <div className="text-lg sm:text-xl font-bold text-white">{stats.total}</div>
      </div>
      <div className="bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-gray-600">
        <div className="text-xs sm:text-sm text-gray-400 mb-1">High Rating</div>
        <div className="text-lg sm:text-xl font-bold text-emerald-400">{stats.highRating}</div>
      </div>
      <div className="bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-gray-600">
        <div className="text-xs sm:text-sm text-gray-400 mb-1">Low Rating</div>
        <div className="text-lg sm:text-xl font-bold text-red-400">{stats.lowRating}</div>
      </div>
      <div className="bg-gray-700/30 rounded-lg p-3 sm:p-4 border border-gray-600">
        <div className="text-xs sm:text-sm text-gray-400 mb-1">Avg Rating</div>
        <div className="text-lg sm:text-xl font-bold text-cyan-400">{stats.averageRating}/5</div>
      </div>
    </div>
  );

  // Enhanced Mobile Card Component
  const FeedbackCard = ({ item }) => (
    <div className="bg-gray-700/30 rounded-xl border border-gray-600 p-3 sm:p-4 lg:p-6 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-1 sm:mb-2 line-clamp-2">
            {item.ticketTitle}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400">
            {formatDate(item.createdAt)}
          </p>
        </div>
        
        {/* Rating Section */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-shrink-0">
          <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${getRatingColor(item.rating)}`}>
            {item.rating}/5
          </div>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${
                  star <= item.rating ? 'text-yellow-400' : 'text-gray-600'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      </div>

      {/* Suggestions Section */}
      {item.suggestions && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-600">
          <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3 font-medium">
            💡 Suggestions for IT Support Improvement
          </p>
          <div className="bg-gray-800/50 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-3">
              {item.suggestions}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Desktop Table Row Component
  const TableRow = ({ item }) => (
    <tr className="hover:bg-gray-700/20 transition-colors duration-200">
      <td className="px-3 sm:px-4 py-3 sm:py-4">
        <div className="min-w-0">
          <div className="text-sm sm:text-base font-medium text-white truncate">
            {item.ticketTitle}
          </div>
          <div className="text-xs sm:text-sm text-gray-400">
            {formatDate(item.createdAt)}
          </div>
        </div>
      </td>
      <td className="px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center gap-2">
          <span className={`text-sm sm:text-base font-bold ${getRatingColor(item.rating)}`}>
            {item.rating}/5
          </span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-3 h-3 sm:w-4 sm:h-4 ${
                  star <= item.rating ? 'text-yellow-400' : 'text-gray-600'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      </td>
      <td className="px-3 sm:px-4 py-3 sm:py-4">
        <div className="max-w-xs">
          <p className="text-xs sm:text-sm text-gray-300 line-clamp-2">
            {item.suggestions || 'No suggestions provided'}
          </p>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      {/* Enhanced Header with Advanced Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="flex items-center">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Feedback Analytics
          </h2>
        </div>
        
        {/* Advanced Controls */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-8 sm:pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
            />
          </div>

          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
          >
            <option value="all">All Feedback</option>
            <option value="high-rating">High Rating (4-5)</option>
            <option value="medium-rating">Medium Rating (3)</option>
            <option value="low-rating">Low Rating (1-2)</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating-high">Highest Rating</option>
            <option value="rating-low">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <StatsCards />

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="text-xs sm:text-sm text-gray-400">
          Showing {processedFeedback.length} of {feedback.length} feedback entries
        </div>
        {(filter !== 'all' || searchTerm || sortBy !== 'newest') && (
          <button
            onClick={() => {
              setFilter('all');
              setSearchTerm('');
              setSortBy('newest');
            }}
            className="text-emerald-400 hover:text-emerald-300 transition-colors text-xs sm:text-sm"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Content */}
      {processedFeedback.length === 0 ? (
        <div className="text-center py-8 sm:py-12 lg:py-16">
          <div className="text-gray-400 text-4xl sm:text-6xl lg:text-8xl mb-4 sm:mb-6">📊</div>
          <h3 className="text-base sm:text-lg lg:text-xl font-medium text-white mb-2 sm:mb-3">
            {searchTerm || filter !== 'all' ? 'No feedback found' : 'No feedback yet'}
          </h3>
          <p className="text-sm sm:text-base text-gray-400 max-w-md mx-auto">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'Feedback will appear here once users start providing it.'
            }
          </p>
        </div>
      ) : (
        <>
          {/* Mobile/Tablet Card View */}
          <div className="block xl:hidden space-y-3 sm:space-y-4">
            {processedFeedback.map((item) => (
              <FeedbackCard key={item.id} item={item} />
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden xl:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ticket & Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Suggestions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                {processedFeedback.map((item) => (
                  <TableRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default FeedbackAnalytics;
