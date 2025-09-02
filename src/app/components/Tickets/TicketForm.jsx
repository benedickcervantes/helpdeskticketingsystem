// src/app/components/Tickets/TicketForm.jsx
"use client";

import { useState, useEffect } from 'react';
import { FiX, FiAlertTriangle, FiInfo, FiHardDrive, FiCpu, FiWifi, FiUser, FiLayers } from 'react-icons/fi';

const TicketForm = ({ onSubmit, initialData, isEditing, onCancel, onDelete, userRole }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'hardware'
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with initialData
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600', bgColor: 'bg-green-100' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { value: 'high', label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { value: 'critical', label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-100' }
  ];

  const categoryOptions = [
    { value: 'hardware', label: 'Hardware', icon: <FiHardDrive className="w-4 h-4" /> },
    { value: 'software', label: 'Software', icon: <FiCpu className="w-4 h-4" /> },
    { value: 'network', label: 'Network', icon: <FiWifi className="w-4 h-4" /> },
    { value: 'account', label: 'Account', icon: <FiUser className="w-4 h-4" /> },
    { value: 'other', label: 'Other', icon: <FiLayers className="w-4 h-4" /> }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden transition-all duration-300">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {isEditing ? 'Update Ticket' : 'Create New Ticket'}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } dark:bg-gray-700 dark:text-white`}
              placeholder="Enter a descriptive title"
              required
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <FiInfo className="mr-1" /> {errors.title}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } dark:bg-gray-700 dark:text-white`}
              placeholder="Provide detailed information about the issue"
              required
            ></textarea>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <FiInfo className="mr-1" /> {errors.description}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <div className="grid grid-cols-2 gap-2">
                {priorityOptions.map((option) => (
                  <div key={option.value} className="relative">
                    <input
                      type="radio"
                      name="priority"
                      id={`priority-${option.value}`}
                      value={option.value}
                      checked={formData.priority === option.value}
                      onChange={handleChange}
                      className="absolute opacity-0 h-0 w-0"
                    />
                    <label
                      htmlFor={`priority-${option.value}`}
                      className={`block p-3 text-center rounded-lg border cursor-pointer transition-all ${
                        formData.priority === option.value
                          ? `${option.bgColor} border-transparent ring-2 ring-blue-500`
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <span className={`font-medium ${formData.priority === option.value ? option.color : 'text-gray-700 dark:text-gray-300'}`}>
                        {option.label}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <div className="space-y-2">
                {categoryOptions.map((option) => (
                  <div key={option.value} className="relative">
                    <input
                      type="radio"
                      name="category"
                      id={`category-${option.value}`}
                      value={option.value}
                      checked={formData.category === option.value}
                      onChange={handleChange}
                      className="absolute opacity-0 h-0 w-0"
                    />
                    <label
                      htmlFor={`category-${option.value}`}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.category === option.value
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-transparent ring-2 ring-blue-500'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <span className="mr-2 text-gray-600 dark:text-gray-400">
                        {option.icon}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {option.label}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-4 sm:space-y-0 sm:space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
          {isEditing && onDelete && userRole === 'admin' && (
            <button
              type="button"
              onClick={onDelete}
              className="px-5 py-2.5 rounded-lg border border-red-300 dark:border-red-700 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center mb-4 sm:mb-0 sm:mr-auto"
            >
              <FiAlertTriangle className="mr-1.5" /> Delete Ticket
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-sm font-medium text-white transition-colors flex items-center justify-center focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{isEditing ? 'Update Ticket' : 'Create Ticket'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;