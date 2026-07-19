// @ts-nocheck
'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, apiFetch } from '@/lib/api/client';

const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SUCCESS_REDIRECT_MS = 1800;

const CategoryIcon = ({ type, className = 'w-5 h-5' }) => {
  const paths = {
    hardware:
      'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    software:
      'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    network:
      'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
    email:
      'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    security:
      'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    other:
      'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={paths[type] || paths.other} />
    </svg>
  );
};

const TicketForm = ({ onTicketCreated }) => {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'software',
  });
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState('');
  const [uploadWarning, setUploadWarning] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const categories = [
    { value: 'hardware', label: 'Hardware', description: 'Devices & equipment' },
    { value: 'software', label: 'Software', description: 'Apps & systems' },
    { value: 'network', label: 'Network', description: 'WiFi & connectivity' },
    { value: 'email', label: 'Email', description: 'Accounts & messaging' },
    { value: 'security', label: 'Security', description: 'Access & passwords' },
    { value: 'other', label: 'Other', description: 'Anything else' },
  ];

  const priorities = [
    {
      value: 'low',
      label: 'Low',
      hint: 'When convenient',
      active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50 ring-1 ring-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    {
      value: 'medium',
      label: 'Medium',
      hint: 'Within business hours',
      active: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/50 ring-1 ring-yellow-500/30',
      dot: 'bg-yellow-400',
    },
    {
      value: 'high',
      label: 'High',
      hint: 'Affecting productivity',
      active: 'bg-orange-500/15 text-orange-300 border-orange-500/50 ring-1 ring-orange-500/30',
      dot: 'bg-orange-400',
    },
    {
      value: 'critical',
      label: 'Critical',
      hint: 'Needs immediate help',
      active: 'bg-red-500/15 text-red-300 border-red-500/50 ring-1 ring-red-500/30',
      dot: 'bg-red-400',
    },
  ];

  const canSubmit = !authLoading && !!currentUser && !!userProfile;
  const titleNearLimit = formData.title.length >= 85;
  const descNearLimit = formData.description.length >= 900;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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

  const addAttachmentFiles = useCallback((selectedFiles) => {
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
  }, [attachmentFiles.length]);

  const handleAttachmentChange = (e) => {
    addAttachmentFiles(Array.from(e.target.files || []));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    addAttachmentFiles(Array.from(e.dataTransfer.files || []));
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

    if (authLoading) {
      setError('Authentication is still loading. Please wait and try again.');
      setLoading(false);
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to create a ticket.');
      setLoading(false);
      return;
    }

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

      // Keep success visible briefly, then reset and hand off to parent
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
        if (onTicketCreated && result?.id) {
          onTicketCreated(result);
        }
      }, SUCCESS_REDIRECT_MS);
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(`Failed to create ticket: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedPriority = priorities.find((p) => p.value === formData.priority);
  const selectedCategory = categories.find((c) => c.value === formData.category);

  return (
    <div className="max-w-3xl mx-auto animate-slide-up-fade">
      <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl shadow-emerald-950/20 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500" />

        {/* Header */}
        <div className="border-b border-gray-700/50 px-5 sm:px-7 py-5 sm:py-6">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Create Support Ticket
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Describe the issue — IT will pick it up shortly.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6 sm:space-y-7">
          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-200">
                Issue title <span className="text-emerald-400">*</span>
              </label>
              <span className={`text-xs tabular-nums ${titleNearLimit ? 'text-amber-400' : 'text-gray-500'}`}>
                {formData.title.length}/100
              </span>
            </div>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={100}
              disabled={loading || success}
              className="w-full px-4 py-3 sm:py-3.5 border border-gray-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 bg-gray-700/40 text-white placeholder-gray-500 transition-all duration-200 disabled:opacity-60"
              placeholder="e.g. Laptop won't turn on"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-200">
                Description <span className="text-emerald-400">*</span>
              </label>
              <span className={`text-xs tabular-nums ${descNearLimit ? 'text-amber-400' : 'text-gray-500'}`}>
                {formData.description.length}/1000
              </span>
            </div>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              maxLength={1000}
              disabled={loading || success}
              className="w-full px-4 py-3 sm:py-3.5 border border-gray-600/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 bg-gray-700/40 text-white placeholder-gray-500 transition-all duration-200 resize-y min-h-[120px] disabled:opacity-60"
              placeholder="Describe the issue, what you tried, and any error message."
            />
            <p className="text-xs text-gray-500">
              Add screenshots below if available — it helps IT resolve faster.
            </p>
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <label className="block text-sm font-semibold text-gray-200">
                Screenshots <span className="font-normal text-gray-500">(optional)</span>
              </label>
              <span className="text-xs text-gray-500">
                {attachmentFiles.length}/{MAX_ATTACHMENTS} · max 5MB each
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleAttachmentChange}
              className="hidden"
              disabled={loading || success}
            />

            {attachmentFiles.length < MAX_ATTACHMENTS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                disabled={loading || success}
                className={`w-full rounded-xl border-2 border-dashed transition-all duration-200 p-4 sm:p-5 group disabled:opacity-60 disabled:cursor-not-allowed ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/15 scale-[1.01]'
                    : 'border-gray-600/60 bg-gray-800/30 hover:bg-emerald-500/5 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {isDragging ? 'Drop images here' : 'Click to upload or drag & drop'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP, GIF</p>
                  </div>
                </div>
              </button>
            )}

            {attachmentPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {attachmentPreviews.map((preview, index) => (
                  <div
                    key={`${preview}-${index}`}
                    className="relative group rounded-xl overflow-hidden border border-gray-600/50 bg-gray-800/50 aspect-square"
                  >
                    <img
                      src={preview}
                      alt={`Attachment preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      disabled={loading || success}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-gray-900/85 hover:bg-red-600 text-white shadow-lg transition-colors disabled:opacity-50"
                      aria-label="Remove attachment"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                      <p className="text-[10px] sm:text-xs text-gray-200 truncate">
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

          {/* Priority — compact 2x2 / 4-col chips */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-200">
              Priority <span className="text-emerald-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {priorities.map((priority) => {
                const selected = formData.priority === priority.value;
                return (
                  <label
                    key={priority.value}
                    className={`relative flex flex-col items-start gap-1 rounded-xl border px-3 py-3 cursor-pointer transition-all duration-200 ${
                      selected
                        ? priority.active
                        : 'bg-gray-800/40 border-gray-600/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/40'
                    } ${loading || success ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={priority.value}
                      checked={selected}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${priority.dot}`} />
                      <span className="text-sm font-semibold text-white">{priority.label}</span>
                    </span>
                    <span className="text-[11px] text-gray-400 leading-snug">{priority.hint}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Category — compact icon grid */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-200">
              Category <span className="text-emerald-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {categories.map((category) => {
                const selected = formData.category === category.value;
                return (
                  <label
                    key={category.value}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 cursor-pointer transition-all duration-200 ${
                      selected
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/25'
                        : 'bg-gray-800/40 border-gray-600/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/40'
                    } ${loading || success ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.value}
                      checked={selected}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        selected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-700/60 text-gray-400'
                      }`}
                    >
                      <CategoryIcon type={category.value} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-white">{category.label}</span>
                      <span className="block text-[11px] text-gray-400 truncate">{category.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Inline selection chip (compact, not a full summary card) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-500">Submitting as</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-800 border border-gray-700 px-2.5 py-1 text-gray-200">
              <span className={`h-1.5 w-1.5 rounded-full ${selectedPriority?.dot}`} />
              {selectedPriority?.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-800 border border-gray-700 px-2.5 py-1 text-gray-200">
              <CategoryIcon type={selectedCategory?.value} className="w-3.5 h-3.5 text-emerald-400" />
              {selectedCategory?.label}
            </span>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-900/25 border border-red-700/40 text-red-300 px-4 py-3 rounded-xl flex items-start gap-3 animate-slide-up-fade">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-sm">Couldn&apos;t create ticket</p>
                <p className="text-sm text-red-300/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-emerald-900/25 border border-emerald-600/40 text-emerald-300 px-4 py-3.5 rounded-xl flex items-start gap-3 animate-slide-up-fade">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-sm">Ticket created successfully</p>
                <p className="text-sm text-emerald-300/90 mt-0.5">
                  {createdTicketNumber ? (
                    <>
                      <span className="font-semibold text-emerald-200">{createdTicketNumber}</span>
                      {' '}has been submitted. Taking you to your tickets…
                    </>
                  ) : (
                    'Your ticket has been submitted. Taking you to your tickets…'
                  )}
                </p>
              </div>
            </div>
          )}

          {uploadWarning && (
            <div className="bg-amber-900/25 border border-amber-700/40 text-amber-300 px-4 py-3 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm">{uploadWarning}</p>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2 space-y-2">
            {!canSubmit && (
              <p className="text-xs text-amber-400/90 text-center sm:text-left">
                {authLoading
                  ? 'Checking your session…'
                  : 'Sign in and wait for your profile to load before submitting.'}
              </p>
            )}
            <button
              type="submit"
              disabled={!canSubmit || success || loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm sm:text-base font-semibold px-5 py-3.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creating ticket…
                </>
              ) : success ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Ticket submitted
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketForm;
