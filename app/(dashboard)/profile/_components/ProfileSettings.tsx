'use client';

import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api, apiFetch, setTokens } from '@/lib/api/client';
import { getDashboardPath } from '@/lib/utils/roles';
import { ProfileFormSkeleton } from '@/lib/ui/DashboardSkeletons';
import type { UserProfile } from '@/types/user';

type FormErrors = Record<string, string>;

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  user: 'User',
};

const ProfileSettings = () => {
  const { currentUser, userProfile, setUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    phone: '',
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passwordSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || currentUser?.email || '',
        department: userProfile.department || '',
        phone: userProfile.phone || '',
      });
      setPhotoUrl(userProfile.photoURL || userProfile.photo_url || '');
    }
  }, [userProfile, currentUser]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      if (passwordSuccessTimerRef.current) clearTimeout(passwordSuccessTimerRef.current);
    };
  }, []);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showPasswordSuccess = (message: string) => {
    setPasswordSuccess(message);
    if (passwordSuccessTimerRef.current) clearTimeout(passwordSuccessTimerRef.current);
    passwordSuccessTimerRef.current = setTimeout(() => setPasswordSuccess(''), 3000);
  };

  const mergeProfile = (updated: Partial<UserProfile> | null | undefined, extras: Partial<UserProfile> = {}) => {
    const next: UserProfile = {
      ...(userProfile as UserProfile),
      ...(updated || {}),
      ...extras,
    };
    if (updated?.photo_url && !extras.photoURL) {
      next.photoURL = updated.photo_url;
    }
    setUserProfile(next);
    return next;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name] || passwordErrors.submit) {
      setPasswordErrors((prev) => ({ ...prev, [name]: '', submit: '' }));
    }
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, photo: 'Please select a valid image file' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'Image size must be less than 5MB' }));
      return;
    }

    setProfilePhoto(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(typeof event.target?.result === 'string' ? event.target.result : null);
    };
    reader.readAsDataURL(file);

    if (errors.photo) {
      setErrors((prev) => ({ ...prev, photo: '' }));
    }
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const user = await apiFetch<UserProfile>('/api/v1/users/me/photo', {
        method: 'POST',
        body: form,
      });
      return user?.photoURL || user?.photo_url || null;
    } finally {
      setUploading(false);
    }
  };

  const validateProfile = () => {
    const next: FormErrors = {};
    const name = formData.name.trim();
    if (!name) {
      next.name = 'Full name is required';
    } else if (name.length < 2) {
      next.name = 'Name must be at least 2 characters';
    } else if (name.length > 100) {
      next.name = 'Name must be 100 characters or less';
    }

    const phone = formData.phone.trim();
    if (phone && !/^[\d\s()+.-]{7,20}$/.test(phone)) {
      next.phone = 'Enter a valid phone number';
    }

    const department = formData.department.trim();
    if (department.length > 100) {
      next.department = 'Department must be 100 characters or less';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      let nextPhotoUrl = photoUrl;

      if (profilePhoto) {
        nextPhotoUrl = (await uploadPhoto(profilePhoto)) || '';
      }

      const updated = await api.patch<UserProfile>('/api/v1/users/me', {
        name: formData.name.trim(),
        department: formData.department.trim(),
        phone: formData.phone.trim(),
      });

      mergeProfile(updated, {
        name: updated?.name ?? formData.name.trim(),
        department: updated?.department ?? formData.department.trim(),
        phone: updated?.phone ?? formData.phone.trim(),
        photoURL: nextPhotoUrl || updated?.photoURL || updated?.photo_url || null,
      });
      setPhotoUrl(nextPhotoUrl);
      setProfilePhoto(null);
      setPhotoPreview(null);
      showSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({
        submit:
          error instanceof Error && error.message
            ? error.message
            : 'Failed to update profile. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = async () => {
    // Clear a pending local selection without hitting the API.
    if (profilePhoto || photoPreview) {
      setProfilePhoto(null);
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setErrors((prev) => ({ ...prev, photo: '' }));
      return;
    }

    if (!photoUrl) return;

    setRemovingPhoto(true);
    setErrors((prev) => ({ ...prev, photo: '' }));
    try {
      const updated = await api.delete<UserProfile>('/api/v1/users/me/photo');
      mergeProfile(updated, { photoURL: null, photo_url: null });
      setPhotoUrl('');
      showSuccess('Profile photo removed.');
    } catch (error) {
      console.error('Error removing photo:', error);
      setErrors({
        photo:
          error instanceof Error && error.message
            ? error.message
            : 'Failed to remove photo. Please try again.',
      });
    } finally {
      setRemovingPhoto(false);
    }
  };

  const validatePassword = () => {
    const next: FormErrors = {};
    if (!passwordForm.currentPassword) {
      next.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      next.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      next.newPassword = 'Password must be at least 6 characters';
    }
    if (!passwordForm.confirmPassword) {
      next.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }
    if (
      passwordForm.currentPassword &&
      passwordForm.newPassword &&
      passwordForm.currentPassword === passwordForm.newPassword
    ) {
      next.newPassword = 'New password must be different from your current password';
    }
    setPasswordErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setChangingPassword(true);
    setPasswordErrors({});
    setPasswordSuccess('');

    try {
      const result = await api.post<{
        success: boolean;
        message?: string;
        access_token?: string;
        refresh_token?: string;
      }>('/api/v1/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (result?.access_token && result?.refresh_token) {
        setTokens(result.access_token, result.refresh_token);
      }

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      showPasswordSuccess(result?.message || 'Password updated successfully.');
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordErrors({
        submit:
          error instanceof Error && error.message
            ? error.message
            : 'Failed to update password. Please try again.',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-3 sm:py-8">
        <ProfileFormSkeleton />
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[userProfile.role || ''] || userProfile.role || 'User';
  const hasPhoto = Boolean(photoUrl || photoPreview);
  const photoBusy = uploading || removingPhoto;

  const inputClass =
    'w-full min-w-0 max-w-full box-border px-3 sm:px-4 py-2.5 sm:py-3 text-base bg-gray-700/40 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all duration-200 disabled:opacity-60';

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-3 sm:py-8">
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 space-y-3 sm:space-y-5 pb-6">
        {/* Page header */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-gray-700/60 bg-gradient-to-br from-gray-800/70 to-gray-900/80 px-3.5 py-4 sm:px-6 sm:py-6">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-tight">
                  Profile Settings
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 leading-snug">
                  Photo, details, and password
                </p>
              </div>
            </div>
            <Link
              href={getDashboardPath(userProfile?.role)}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-600 bg-gray-800/60 hover:bg-gray-700/60 text-gray-200 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Profile form card */}
        <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl border border-gray-700/60 bg-gradient-to-br from-gray-800/60 to-gray-900/60 shadow-xl shadow-emerald-950/10">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/60 via-cyan-400/60 to-emerald-500/60" />

          <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-3 sm:space-y-5">
            {/* Photo */}
            <section className="group w-full min-w-0 rounded-xl border border-gray-700/70 bg-gray-800/40 p-3 sm:p-5">
              <div className="accent-hover-line bg-emerald-500" aria-hidden="true" />
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-white">Profile Photo</h2>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 min-w-0">
                <div className="relative mx-auto sm:mx-0 shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-gray-700 flex items-center justify-center shadow-lg shadow-emerald-950/20">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : photoUrl ? (
                      <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                        <span className="text-white text-xl sm:text-2xl font-bold">
                          {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  {photoBusy && (
                    <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2.5 sm:space-y-3 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoBusy || loading}
                      className="box-border h-10 w-full sm:w-auto inline-flex items-center justify-center px-4 rounded-xl border border-transparent bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold leading-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {hasPhoto ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {hasPhoto && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        disabled={photoBusy || loading}
                        className="box-border h-10 w-full sm:w-auto inline-flex items-center justify-center px-4 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-sm font-semibold leading-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {removingPhoto ? 'Removing…' : 'Remove'}
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 break-words">
                    JPG, PNG or GIF · max 5MB
                  </p>
                  {errors.photo && <p className="text-sm text-red-400 break-words">{errors.photo}</p>}
                </div>
              </div>
            </section>

            {/* Personal info */}
            <section className="group w-full min-w-0 rounded-xl border border-gray-700/70 bg-gray-800/40 p-3 sm:p-5">
              <div className="accent-hover-line bg-cyan-500" aria-hidden="true" />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-sm sm:text-base font-semibold text-white truncate">
                    Personal Information
                  </h2>
                </div>
                <span className="inline-flex items-center self-start px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {roleLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
                <div className="min-w-0">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Full Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    maxLength={100}
                    className={inputClass}
                    placeholder="Your full name"
                  />
                  {errors.name && <p className="text-sm text-red-400 mt-1 break-words">{errors.name}</p>}
                </div>

                <div className="min-w-0">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className={`${inputClass} text-gray-400 cursor-not-allowed`}
                  />
                  <p className="text-xs text-gray-500 mt-1">Ask an admin to change email.</p>
                </div>

                <div className="min-w-0">
                  <label htmlFor="department" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    maxLength={100}
                    className={inputClass}
                    placeholder="e.g. IT, Accounting"
                  />
                  {errors.department && (
                    <p className="text-sm text-red-400 mt-1 break-words">{errors.department}</p>
                  )}
                </div>

                <div className="min-w-0">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="e.g. +63 912 345 6789"
                  />
                  {errors.phone && <p className="text-sm text-red-400 mt-1 break-words">{errors.phone}</p>}
                </div>
              </div>
            </section>

            {successMessage && (
              <div className="rounded-xl border border-emerald-600/40 bg-emerald-900/25 px-4 py-3 text-sm text-emerald-300 animate-slide-up-fade">
                {successMessage}
              </div>
            )}

            {errors.submit && (
              <div className="rounded-xl border border-red-700/40 bg-red-900/25 px-4 py-3 text-sm text-red-300">
                {errors.submit}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loading || photoBusy}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Password card */}
        <form
          onSubmit={handlePasswordSubmit}
          className="group relative w-full min-w-0 overflow-hidden rounded-xl sm:rounded-2xl border border-gray-700/60 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-3 sm:p-6 space-y-3 sm:space-y-4 shadow-xl shadow-emerald-950/10"
        >
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500/50 via-orange-400/40 to-amber-500/50" />
          <div className="accent-hover-line bg-amber-500" aria-hidden="true" />

          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-semibold text-white">Change Password</h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 leading-snug">
                Other devices will be signed out after you update.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
            <div className="sm:col-span-2 min-w-0">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                className={inputClass}
                placeholder="Current password"
              />
              {passwordErrors.currentPassword && (
                <p className="text-sm text-red-400 mt-1 break-words">{passwordErrors.currentPassword}</p>
              )}
            </div>

            <div className="min-w-0">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                className={inputClass}
                placeholder="At least 6 characters"
              />
              {passwordErrors.newPassword && (
                <p className="text-sm text-red-400 mt-1 break-words">{passwordErrors.newPassword}</p>
              )}
            </div>

            <div className="min-w-0">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                className={inputClass}
                placeholder="Re-enter new password"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-red-400 mt-1 break-words">{passwordErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          {passwordSuccess && (
            <div className="rounded-xl border border-emerald-600/40 bg-emerald-900/25 px-4 py-3 text-sm text-emerald-300">
              {passwordSuccess}
            </div>
          )}

          {passwordErrors.submit && (
            <div className="rounded-xl border border-red-700/40 bg-red-900/25 px-4 py-3 text-sm text-red-300">
              {passwordErrors.submit}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={changingPassword}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-600 bg-gray-700/60 hover:bg-gray-600/60 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changingPassword ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating…
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
