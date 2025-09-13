'use client';

import { ModernSpinner } from "./LoadingComponents";

import { useState, useEffect } from 'react';
import { db } from '../firebaseconfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { createAdminTicketCreatedNotification } from '../lib/notificationUtils';

const TicketForm = ({ onTicketCreated }) => {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'software'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const categories = [
    { value: 'hardware', label: 'Hardware', icon: '🖥️', description: 'Computer, printer, or other physical equipment' },
    { value: 'software', label: 'Software', icon: '💻', description: 'Applications, programs, or system software' },
    { value: 'network', label: 'Network', icon: '🌐', description: 'Internet, WiFi, or network connectivity issues' },
    { value: 'email', label: 'Email', icon: '📧', description: 'Email client, accounts, or messaging issues' },
    { value: 'security', label: 'Security', icon: '🔒', description: 'Password, access, or security concerns' },
    { value: 'other', label: 'Other', icon: '❓', description: 'Any other technical issue not listed above' }
  ];

  const priorities = [
    { 
      value: 'low', 
      label: 'Low Priority', 
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      description: 'Minor issues that can be addressed when convenient',
      icon: '🟢'
    },
    { 
      value: 'medium', 
      label: 'Medium Priority', 
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      description: 'Standard issues that need attention within business hours',
      icon: '🟡'
    },
    { 
      value: 'high', 
      label: 'High Priority', 
      color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      description: 'Important issues affecting productivity',
      icon: '🟠'
    },
    { 
      value: 'critical', 
      label: 'Critical Priority', 
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      description: 'Urgent issues requiring immediate attention',
      icon: '🔴'
    }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    // Wait for authentication to be ready
    if (authLoading) {
      setError('Authentication is still loading. Please wait and try again.');
      setLoading(false);
      return;
    }

    // Check if user is authenticated
    if (!currentUser) {
      setError('You must be logged in to create a ticket.');
      setLoading(false);
      return;
    }

    // Check if user profile is loaded
    if (!userProfile) {
      setError('User profile is not loaded. Please refresh the page and try again.');
      setLoading(false);
      return;
    }

    try {
      const ticketData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        category: formData.category,
        status: 'open',
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'tickets'), ticketData);
      
      // Create admin notification for new ticket
      try {
        await createAdminTicketCreatedNotification(
          { id: docRef.id, ...ticketData },
          { name: userProfile?.name, email: userProfile?.email }
        );
      } catch (notificationError) {
        console.error('Error creating admin notification:', notificationError);
        // Don't fail the ticket creation if notification fails
      }
      
      // Show success message
      setSuccess(true);
      
      // Reset form after a short delay
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          category: 'software'
        });
        setSuccess(false);
      }, 2000);

      // Notify parent component
      if (onTicketCreated) {
        onTicketCreated(docRef.id);
      }

    } catch (error) {
      console.error('Error creating ticket:', error);
      if (error.code === 'permission-denied') {
        setError('Permission denied. Please make sure you are logged in and try again.');
      } else {
        setError(`Failed to create ticket: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedPriority = priorities.find(p => p.value === formData.priority);
  const selectedCategory = categories.find(c => c.value === formData.category);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border-b border-gray-700/50 p-6 sm:p-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Create Support Ticket</h2>
              <p className="text-gray-400 mt-1">Submit a detailed request for IT assistance</p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title Section */}
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-300">
                Issue Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={100}
                className="w-full px-4 py-4 border border-gray-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 bg-gray-700/50 text-white placeholder-gray-400 transition-all duration-300 text-lg"
                placeholder="Brief, descriptive title of your issue"
              />
              <p className="text-xs text-gray-500">{formData.title.length}/100 characters</p>
            </div>

            {/* Description Section */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-300">
                Detailed Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                maxLength={1000}
                className="w-full px-4 py-4 border border-gray-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 bg-gray-700/50 text-white placeholder-gray-400 transition-all duration-300 resize-none"
                placeholder="Please provide detailed information about your issue, including:&#10;• What you were trying to do&#10;• What happened instead&#10;• Steps to reproduce the issue&#10;• Any error messages you received"
              />
              <p className="text-xs text-gray-500">{formData.description.length}/1000 characters</p>
            </div>

            {/* Priority and Category Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Priority Selection */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-300">
                  Priority Level *
                </label>
                <div className="space-y-3">
                  {priorities.map((priority) => (
                    <label
                      key={priority.value}
                      className={`block p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        formData.priority === priority.value
                          ? `${priority.color} border-current shadow-lg`
                          : 'bg-gray-700/30 border-gray-600/50 hover:border-gray-500/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={priority.value}
                        checked={formData.priority === priority.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{priority.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-white">{priority.label}</div>
                          <div className="text-sm text-gray-400 mt-1">{priority.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-300">
                  Category *
                </label>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <label
                      key={category.value}
                      className={`block p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        formData.category === category.value
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-lg'
                          : 'bg-gray-700/30 border-gray-600/50 hover:border-gray-500/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={category.value}
                        checked={formData.category === category.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-white">{category.label}</div>
                          <div className="text-sm text-gray-400 mt-1">{category.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Options Summary */}
            {(selectedPriority || selectedCategory) && (
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Selected Options</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedPriority && (
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{selectedPriority.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-white">Priority: {selectedPriority.label}</div>
                        <div className="text-xs text-gray-400">{selectedPriority.description}</div>
                      </div>
                    </div>
                  )}
                  {selectedCategory && (
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{selectedCategory.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-white">Category: {selectedCategory.label}</div>
                        <div className="text-xs text-gray-400">{selectedCategory.description}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-400 px-4 py-4 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-medium">Error</div>
                    <div className="text-sm mt-1">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-emerald-900/30 border border-emerald-700/50 text-emerald-400 px-4 py-4 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-medium">Ticket Created Successfully!</div>
                    <div className="text-sm mt-1">Your support ticket has been submitted and will be reviewed by our IT team.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading || authLoading || !currentUser || !userProfile}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl shadow-lg hover:from-emerald-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 relative overflow-hidden group min-w-[160px]"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Ticket
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TicketForm;
