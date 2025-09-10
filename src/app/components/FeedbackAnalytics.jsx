'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebaseconfig';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

const FeedbackAnalytics = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  const filteredFeedback = feedback.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'high-rating') return item.rating >= 4;
    if (filter === 'low-rating') return item.rating <= 2;
    return true;
  });

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-emerald-400';
    if (rating >= 3) return 'text-yellow-400';
    return 'text-red-400';
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
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <svg className="w-6 h-6 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Feedback Analytics
        </h2>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="all">All Feedback</option>
          <option value="high-rating">High Rating (4-5)</option>
          <option value="low-rating">Low Rating (1-2)</option>
        </select>
      </div>

      {filteredFeedback.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-white mb-2">No feedback yet</h3>
          <p className="text-gray-400">Feedback will appear here once users start providing it.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map((item) => (
            <div key={item.id} className="bg-gray-700/30 rounded-lg border border-gray-600 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {item.ticketTitle}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Submitted on {formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`text-2xl font-bold ${getRatingColor(item.rating)}`}>
                    {item.rating}/5
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
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

              {item.suggestions && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Suggestions for IT Support Improvement</p>
                  <p className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg">
                    {item.suggestions}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackAnalytics;
