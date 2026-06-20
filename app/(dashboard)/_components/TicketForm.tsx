// @ts-nocheck
'use client';

import { useState, useRef } from 'react';
import { SmartButton } from '@/lib/ui/LoadingComponents';
import { useAuth } from '@/contexts/AuthContext';
import { api, apiFetch } from '@/lib/api/client';

const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const TicketForm = ({ onTicketCreated }) => {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'software'
  });
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState('');
  const [uploadWarning, setUploadWarning] = useState('');

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
    setUploadWarning('');
  };

  const resetAttachments = () => {
    attachmentPreviews.forEach((preview) => {
      if (preview?.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    });
    setAttachmentFiles([]);
    setAttachmentPreviews([]);
    setAttachmentError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttachmentChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    setAttachmentError('');
    setError('');
    setUploadWarning('');

    const availableSlots = MAX_ATTACHMENTS - attachmentFiles.length;
    if (availableSlots <= 0) {
      setAttachmentError(`You can attach up to ${MAX_ATTACHMENTS} images only.`);
      return;
    }

    const filesToAdd = selectedFiles.slice(0, availableSlots);
    const validFiles = [];
    const validPreviews = [];

    for (const file of filesToAdd) {
      if (!file.type.startsWith('image/')) {
        setAttachmentError('Please select valid image files only (PNG, JPG, WEBP, GIF).');
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setAttachmentError('Each image must be less than 5MB.');
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    if (selectedFiles.length > availableSlots) {
      setAttachmentError(`Only ${MAX_ATTACHMENTS} images are allowed per ticket.`);
    }

    if (validFiles.length) {
      setAttachmentFiles((prev) => [...prev, ...validFiles]);
      setAttachmentPreviews((prev) => [...prev, ...validPreviews]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
    setAttachmentPreviews((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed?.startsWith('blob:')) {
        URL.revokeObjectURL(removed);
      }
      return next;
    });
    setAttachmentError('');
  };

  const uploadAttachments = async (ticketId) => {
    if (!attachmentFiles.length) return;

    const form = new FormData();
    attachmentFiles.forEach((file) => {
      form.append('files', file);
    });

    await apiFetch(`/api/v1/tickets/${ticketId}/attachments`, {
      method: 'POST',
      body: form,
    });
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
      const result = await api.post('/api/v1/tickets', {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        category: formData.category,
      });

      if (attachmentFiles.length && result?.id) {
        try {
          await uploadAttachments(result.id);
        } catch (uploadError) {
          console.error('Error uploading attachments:', uploadError);
          setUploadWarning(
            'Ticket was created, but some screenshots failed to upload. You can try again from ticket details later.',
          );
        }
      }

      setSuccess(true);
      setCreatedTicketNumber(result?.ticketNumber || '');

      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          category: 'software',
        });
        resetAttachments();
        setSuccess(false);
        setCreatedTicketNumber('');
        setUploadWarning('');
      }, 2000);

      if (onTicketCreated && result?.id) {
        onTicketCreated(result);
      }

    } catch (error) {
      console.error('Error creating ticket:', error);
      {
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

            {/* Attachment Section */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <label className="block text-sm font-semibold text-gray-300">
                  Attach Screenshot (Optional)
                </label>
                <span className="text-xs text-emerald-400/80">
                  Helps IT identify your issue faster
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAttachmentChange}
                className="hidden"
              />

              {attachmentFiles.length < MAX_ATTACHMENTS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-400/60 transition-all duration-300 p-5 sm:p-6 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                      <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-medium text-white">
                        Tap to add photo or screenshot
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        PNG, JPG, WEBP, GIF · up to {MAX_ATTACHMENTS} images · 5MB each
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {attachmentPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {attachmentPreviews.map((preview, index) => (
                    <div key={`${preview}-${index}`} className="relative group rounded-xl overflow-hidden border border-gray-600/50 bg-gray-800/50 aspect-square">
                      <img
                        src={preview}
                        alt={`Attachment preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/90 hover:bg-red-500 text-white shadow-lg transition-colors"
                        aria-label="Remove attachment"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1">
                        <p className="text-xs text-gray-200 truncate">
                          {attachmentFiles[index]?.name || `Image ${index + 1}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {attachmentError && (
                <p className="text-sm text-red-400 flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {attachmentError}
                </p>
              )}
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
                    <div className="text-sm mt-1">
                      {createdTicketNumber
                        ? <>Your ticket <span className="font-semibold text-emerald-300">{createdTicketNumber}</span> has been submitted and will be reviewed by our IT team.</>
                        : 'Your support ticket has been submitted and will be reviewed by our IT team.'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {uploadWarning && (
              <div className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 px-4 py-4 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm">{uploadWarning}</div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <SmartButton
                type="submit"
                disabled={authLoading || !currentUser || !userProfile}
                loading={loading}
                loadingText="Creating Ticket..."
                variant="primary"
                size="lg"
                className="px-8 py-4 min-w-[160px]"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>}
                iconPosition="left"
              >
                Create Ticket
              </SmartButton>            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TicketForm;
