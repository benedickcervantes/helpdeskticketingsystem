// @ts-nocheck
﻿'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { checkFeedbackExists } from '@/lib/utils/notifications';

const FeedbackForm = ({ ticketId, ticketTitle, isOpen, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const [formData, setFormData] = useState({
    rating: '',
    suggestions: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [feedbackExists, setFeedbackExists] = useState(false);
  const [checkingFeedback, setCheckingFeedback] = useState(false);

  const handleChange = (e) => {
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
      checkFeedbackExists(ticketId)
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
  }, [isOpen, ticketId, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/api/v1/feedback', {
        ticketId,
        rating: parseInt(formData.rating, 10),
        suggestions: formData.suggestions,
      });

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
      setError(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Container - Responsive */}
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4 lg:p-6">
        <div className="bg-app-panel backdrop-blur-xl rounded-xl border border-app shadow-2xl w-full max-w-md sm:max-w-lg lg:max-w-xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header - Responsive */}
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-app">Feedback for IT Support</h2>
                <p className="text-sm sm:text-base text-app-muted mt-1">Help us improve our IT services</p>
                {ticketTitle && (
                  <p className="text-xs sm:text-sm text-app-primary mt-1 truncate">Ticket: {ticketTitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-lg text-app-muted hover:text-app hover:bg-app-surface-2/70 transition-colors ml-2 sm:ml-4 flex-shrink-0"
                aria-label="Close feedback form"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Loading State */}
            {checkingFeedback && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-app-surface-2/70 border border-app rounded-lg">
                <div className="flex items-center">
                  <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5 text-app-primary mr-2 sm:mr-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm sm:text-base text-app-soft">Checking feedback status...</span>
                </div>
              </div>
            )}
            
            {/* Feedback Already Submitted Message */}
            {feedbackExists && !checkingFeedback && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-app-primary-soft border border-app-primary/30 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-app-primary mr-2 sm:mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base text-app-primary font-semibold">Feedback Already Submitted</h3>
                    <p className="text-xs sm:text-sm text-app-primary mt-1">Thank you for your feedback! You have already provided feedback for this ticket.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success State */}
            {success ? (
              <div className="text-center py-6 sm:py-8">
                <div className="mx-auto mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-app-primary-soft text-app-primary">
                  <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-app mb-2">Thank you!</h3>
                <p className="text-sm sm:text-base text-app-muted">Your feedback has been submitted successfully.</p>
              </div>
            ) : (
              /* Form Content */
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" disabled={feedbackExists}>
                {/* Overall Rating - Responsive */}
                <div>
                  <label className="block text-sm sm:text-base font-medium text-app mb-2 sm:mb-3">
                    Overall Rating *
                  </label>
                  <div className="flex justify-center sm:justify-start space-x-2 sm:space-x-3">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => !feedbackExists && setFormData(prev => ({ ...prev, rating: rating.toString() }))}
                        className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg border-2 transition-all duration-200 text-sm sm:text-base font-medium ${
                          formData.rating === rating.toString()
                            ? 'border-app-primary bg-app-primary-soft text-app-primary scale-110'
                            : 'border-app text-app-muted hover:border-app hover:bg-app-surface-2/70'
                        }`}
                        disabled={feedbackExists}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm text-app-muted mt-2">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>

                {/* Suggestions for IT Support - Responsive */}
                <div>
                  <label className="block text-sm sm:text-base font-medium text-app mb-2 sm:mb-3">
                    Suggestions for IT Support Improvement
                  </label>
                  <textarea
                    name="suggestions"
                    value={formData.suggestions}
                    onChange={handleChange}
                    rows={4}
                    maxLength={500}
                    placeholder="How can we improve our IT services? Any suggestions for better support?"
                    className="app-field w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none resize-none transition-all duration-200 text-sm sm:text-base"
                    disabled={feedbackExists}
                  />
                  <p className="text-xs text-app-muted mt-1">{formData.suggestions.length}/500 characters</p>
                </div>

                {/* Error Message - Responsive */}
                {error && (
                  <div className="p-3 sm:p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs sm:text-sm text-red-400">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit Buttons - Responsive */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-app-muted hover:text-app transition-colors rounded-lg hover:bg-app-surface-2/70"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.rating || feedbackExists}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-app-primary hover:opacity-90 disabled:bg-app-surface-3 disabled:opacity-60 disabled:cursor-not-allowed text-app-on-primary rounded-lg transition-all duration-200 text-sm sm:text-base font-medium flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Feedback'
                    )}
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
