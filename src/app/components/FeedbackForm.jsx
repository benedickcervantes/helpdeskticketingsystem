'use client';
import { useState, useEffect } from 'react';
import { db } from '../firebaseconfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { checkFeedbackExists, markFeedbackAsSubmitted } from '../lib/notificationUtils';
const FeedbackForm = ({ ticketId, ticketTitle, isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    rating: '',
    suggestions: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [feedbackExists, setFeedbackExists] = useState(false);
  const [checkingFeedback, setCheckingFeedback] = useState(false);  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  // Check if feedback already exists when component opens
  useEffect(() => {
    if (isOpen && ticketId && currentUser) {
      setCheckingFeedback(true);
      checkFeedbackExists(ticketId, currentUser.uid)
        .then(exists => {
          setFeedbackExists(exists);
          setCheckingFeedback(false);
        })
        .catch(error => {
          console.error('Error checking feedback:', error);
          setCheckingFeedback(false);
        });
    } else {
      setFeedbackExists(false);
    }
  }, [isOpen, ticketId, currentUser]);  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const feedbackData = {
        ticketId,
        ticketTitle,
        userId: currentUser.uid,
        rating: parseInt(formData.rating),
        suggestions: formData.suggestions,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'feedback'), feedbackData);
      
      // Mark feedback as submitted in the ticket
      await markFeedbackAsSubmitted(ticketId, currentUser.uid);
      setFeedbackExists(true);      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          rating: '',
          suggestions: ''
        });
      }, 2000);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Feedback for IT Support</h2>
                <p className="text-gray-400 mt-1">Help us improve our IT services</p>
                {ticketTitle && (
                  <p className="text-sm text-emerald-400 mt-1">Ticket: {ticketTitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Feedback Already Submitted Message */}
            {feedbackExists && (
              <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-emerald-400 font-semibold">Feedback Already Submitted</h3>
                    <p className="text-emerald-300 text-sm mt-1">Thank you for your feedback! You have already provided feedback for this ticket.</p>
                  </div>
                </div>
              </div>
            )}
            {success ? (
              <div className="text-center py-8">
                <div className="text-emerald-400 text-6xl mb-4">✅</div>
                <h3 className="text-lg font-semibold text-white mb-2">Thank you!</h3>
                <p className="text-gray-400">Your feedback has been submitted successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" disabled={feedbackExists}>
                {/* Overall Rating */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Overall Rating *
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => !feedbackExists && setFormData(prev => ({ ...prev, rating: rating.toString() }))}
                        className={`w-10 h-10 rounded-lg border-2 transition-colors ${
                          formData.rating === rating.toString()
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                            : 'border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>

                {/* Suggestions for IT Support */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Suggestions for IT Support Improvement
                  </label>
                  <textarea
                    name="suggestions"
                    value={formData.suggestions}
                    onChange={handleChange}
                    rows={4}
                    placeholder="How can we improve our IT services? Any suggestions for better support?"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" disabled={feedbackExists}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.rating || feedbackExists}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {loading ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
