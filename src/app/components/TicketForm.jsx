'use client';

import { ModernSpinner } from "./LoadingComponents";

import { useState, useEffect } from 'react';
import { db } from '../firebaseconfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

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

  const categories = [
    { value: 'hardware', label: 'Hardware' },
    { value: 'software', label: 'Software' },
    { value: 'network', label: 'Network' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-emerald-500/20 text-emerald-400' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400' },
    { value: 'high', label: 'High', color: 'bg-orange-500/20 text-orange-400' },
    { value: 'critical', label: 'Critical', color: 'bg-red-500/20 text-red-400' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        status: 'open',
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'tickets'), ticketData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'software'
      });

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

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <svg className="w-6 h-6 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Create New Ticket
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Ticket Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400 transition-all duration-200"
            placeholder="Brief description of the issue"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-3 border border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400 transition-all duration-200"
            placeholder="Detailed description of the issue, steps to reproduce, etc."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-2">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-700 text-white transition-all duration-200"
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value} className="bg-gray-800 text-white">
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-700 text-white transition-all duration-200"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value} className="bg-gray-800 text-white">
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-xl text-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || authLoading || !currentUser || !userProfile}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl shadow-lg hover:from-emerald-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 relative overflow-hidden group"
          >
            <span className="relative z-10">
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Ticket
                </div>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;