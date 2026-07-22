// @ts-nocheck
'use client';
import { useSearchParams } from 'next/navigation';
import { ModernSpinner } from '@/lib/ui/LoadingComponents';
import { FpdcLogo } from '@/lib/ui/FpdcLogo';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import {
  disconnectPublicSocket,
  subscribeDepartmentEvents,
  subscribeDesignationEvents,
} from '@/lib/realtime/socketClient';
import OptionPickerModal from '@/lib/ui/OptionPickerModal';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [resetToken, setResetToken] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    designation: '',
    department: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [designationPickerOpen, setDesignationPickerOpen] = useState(false);
  const [departmentPickerOpen, setDepartmentPickerOpen] = useState(false);
  
  const { signin, signup, authLoading, currentUser, userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect if authenticated (keep global loader visible during navigation)
  useEffect(() => {
    if (currentUser && userProfile) {
      const userRole = userProfile.role || 'user';
      if (userRole === 'admin') {
        router.push('/admin');
      } else if (userRole === 'manager') {
        router.push('/management');
      } else {
        router.push('/user');
      }
    }
  }, [currentUser, userProfile, router]);

  // Check for register query parameter
  useEffect(() => {
    const registerParam = searchParams.get('register');
    if (registerParam === 'true') {
      setIsLogin(false);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const toNames = (data) =>
      (Array.isArray(data) ? data : [])
        .map((d) => (typeof d === 'string' ? d : d?.name))
        .filter(Boolean);

    const applyDepartments = (data) => {
      if (!cancelled) setDepartments(toNames(data));
    };
    const applyDesignations = (data) => {
      if (!cancelled) setDesignations(toNames(data));
    };

    api
      .get('/api/v1/departments')
      .then(applyDepartments)
      .catch(() => {
        if (!cancelled) setDepartments([]);
      });

    api
      .get('/api/v1/designations')
      .then(applyDesignations)
      .catch(() => {
        if (!cancelled) setDesignations([]);
      });

    const unsubscribeDepartments = subscribeDepartmentEvents(
      (items) => applyDepartments(items),
      { publicOnly: true },
    );
    const unsubscribeDesignations = subscribeDesignationEvents(
      (items) => applyDesignations(items),
      { publicOnly: true },
    );

    return () => {
      cancelled = true;
      unsubscribeDepartments();
      unsubscribeDesignations();
      disconnectPublicSocket();
    };
  }, []);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
    setSuccessMessage('');
  };

  const getErrorMessage = (error) => {
    const rawMessage = String(error?.message || '');
    const lowerMessage = rawMessage.toLowerCase();

    if (
      error?.status === 429 ||
      error?.code === 'auth/too-many-requests' ||
      lowerMessage.includes('throttlerexception') ||
      lowerMessage.includes('too many requests') ||
      lowerMessage.includes('too many attempts') ||
      lowerMessage.includes('rate limit')
    ) {
      if (lowerMessage.includes('please wait')) {
        return rawMessage;
      }
      return 'You have made too many attempts. Please wait about a minute, then try again.';
    }

    if (error.code === 'auth/user-not-found') {
      return 'No account found with this email address.';
    } else if (error.code === 'auth/wrong-password') {
      return 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/invalid-credential') {
      return 'Invalid email or password. Please check your credentials and try again.';
    } else if (error.code === 'auth/email-already-in-use') {
      return 'An account with this email already exists.';
    } else if (error.code === 'auth/weak-password') {
      return 'Password should be at least 6 characters long.';
    } else if (error.code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    } else if (rawMessage) {
      return rawMessage;
    }
    return 'An error occurred. Please try again.';
  };

  const resetForgotFlow = () => {
    setIsForgotPassword(false);
    setForgotStep(1);
    setResetToken('');
    setVerifiedEmail('');
    setVerifiedName('');
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: '',
    }));
    setError('');
    setSuccessMessage('');
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const result = await api.post('/api/v1/auth/forgot-password/verify', {
        email: formData.email.trim(),
      });
      setResetToken(result.resetToken);
      setVerifiedEmail(result.email);
      setVerifiedName(result.name);
      setForgotStep(2);
      setSuccessMessage(`Email verified. Hello, ${result.name}! Set your new password below.`);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/v1/auth/forgot-password/reset', {
        resetToken,
        password: formData.password,
      });
      setSuccessMessage('Password updated successfully! You can now sign in with your new password.');
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
      setTimeout(() => {
        resetForgotFlow();
        setIsLogin(true);
      }, 2500);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        await signin(formData.email, formData.password);
        // Don't redirect here - let useEffect handle it
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (!formData.department) {
          setError('Please select a department');
          setLoading(false);
          return;
        }
        
        await signup(
          formData.email,
          formData.password,
          formData.name,
          'user',
          formData.department,
          formData.designation,
        );
        
        setSuccessMessage('Account created successfully! Redirecting to your dashboard...');
        
        // Clear form data
        setFormData({
          email: '',
          password: '',
          name: '',
          designation: '',
          department: '',
          confirmPassword: ''
        });
        
        // Redirect will be handled by useEffect
      }
    } catch (error) {
      const friendlyMessage = getErrorMessage(error);
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const pickerDisabled = loading || authLoading;
  const triggerClass =
    'w-full min-w-0 max-w-full min-h-[48px] pl-10 pr-10 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-700/50 backdrop-blur-sm text-left text-white appearance-none input-field disabled:opacity-50';

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full min-w-0 space-y-6">
        {/* Form card */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 sm:p-8 shadow-2xl min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="text-center">
          <FpdcLogo size="xl" className="mx-auto shadow-2xl" priority />
          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-white">
            {isForgotPassword
              ? forgotStep === 1
                ? 'Forgot Password'
                : 'Set New Password'
              : isLogin
                ? 'Welcome Back'
                : 'Create Account'}
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            {isForgotPassword
              ? forgotStep === 1
                ? 'Enter your registered email to verify your account'
                : `Create a new password for ${verifiedEmail}`
              : isLogin
                ? 'Sign in to your FPDC account'
                : 'Join thousands of IT professionals'}
          </p>
        </div>

        {/* Form */}
        <form
          className="mt-6 space-y-6"
          onSubmit={
            isForgotPassword
              ? forgotStep === 1
                ? handleVerifyEmail
                : handleResetPassword
              : handleSubmit
          }
        >
          <div className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative input-icon-container">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 input-icon">
                      <span className="text-gray-400 text-lg font-bold">👨‍💼</span>
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required={!isLogin}
                      className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-700/50 backdrop-blur-sm text-white placeholder-gray-400 input-field"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={loading || authLoading}
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label htmlFor="designation" className="block text-sm font-semibold text-gray-300 mb-2">
                    Designation
                  </label>
                  <div className="relative input-icon-container min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 input-icon">
                      <span className="text-gray-400 text-lg font-bold">🪪</span>
                    </div>
                    <button
                      type="button"
                      id="designation"
                      disabled={pickerDisabled}
                      onClick={() => setDesignationPickerOpen(true)}
                      className={triggerClass}
                      title={formData.designation || undefined}
                      aria-haspopup="dialog"
                      aria-expanded={designationPickerOpen}
                    >
                      <span
                        className={`block min-w-0 truncate ${
                          formData.designation ? 'text-white' : 'text-gray-400'
                        }`}
                      >
                        {formData.designation || 'Select your designation'}
                      </span>
                    </button>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10 input-icon">
                      <span className="text-gray-400 text-sm">▼</span>
                    </div>
                  </div>
                </div>
                
                <div className="min-w-0">
                  <label htmlFor="department" className="block text-sm font-semibold text-gray-300 mb-2">
                    Department
                  </label>
                  <div className="relative input-icon-container min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 input-icon">
                      <span className="text-gray-400 text-lg font-bold">🏢</span>
                    </div>
                    <button
                      type="button"
                      id="department"
                      disabled={pickerDisabled}
                      onClick={() => setDepartmentPickerOpen(true)}
                      className={triggerClass}
                      title={formData.department || undefined}
                      aria-haspopup="dialog"
                      aria-expanded={departmentPickerOpen}
                    >
                      <span
                        className={`block min-w-0 truncate ${
                          formData.department ? 'text-white' : 'text-gray-400'
                        }`}
                      >
                        {formData.department || 'Select your department'}
                      </span>
                    </button>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10 input-icon">
                      <span className="text-gray-400 text-sm">▼</span>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative input-icon-container">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 input-icon">
                  <span className="text-gray-400 text-lg font-bold">📧</span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  readOnly={isForgotPassword && forgotStep === 2}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-700/50 backdrop-blur-sm text-white placeholder-gray-400 input-field ${isForgotPassword && forgotStep === 2 ? 'opacity-70 cursor-not-allowed' : ''}`}
                  placeholder="Enter email address"
                  value={isForgotPassword && forgotStep === 2 ? verifiedEmail : formData.email}
                  onChange={handleChange}
                  disabled={loading || authLoading || (isForgotPassword && forgotStep === 2)}
                />
              </div>
            </div>

            {isForgotPassword && forgotStep === 2 && verifiedName && (
              <div className="bg-emerald-900/20 border border-emerald-700/40 text-emerald-300 px-4 py-3 rounded-xl text-sm">
                Account verified: <span className="font-semibold text-white">{verifiedName}</span>
              </div>
            )}
            
            {(!isForgotPassword || forgotStep === 2) && (
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
                {isForgotPassword ? 'New Password' : 'Password'}
              </label>
              <div className="relative input-icon-container">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 input-icon">
                  <div className="relative group">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-all duration-300 transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100"></div>
                  </div>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isForgotPassword ? 'new-password' : 'current-password'}
                  required={!isForgotPassword || forgotStep === 2}
                  className="w-full pl-10 pr-14 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-700/50 backdrop-blur-sm text-white placeholder-gray-400 input-field"
                  placeholder={isForgotPassword ? 'Enter new password' : 'Enter password'}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading || authLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center z-10 text-gray-400 hover:text-emerald-400 transition-all duration-300 group"
                  disabled={loading || authLoading}
                >
                  <div className="relative">
                    {showPassword ? (
                      <svg className="w-5 h-5 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>                      
                    ) : (
                      <svg className="w-5 h-5 transform transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100"></div>
                  </div>
                </button>
              </div>
            </div>
            )}
            
            {(!isLogin && !isForgotPassword) || (isForgotPassword && forgotStep === 2) ? (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative input-icon-container">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 input-icon">
                    <div className="relative group">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-all duration-300 transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100"></div>
                    </div>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required={!isLogin || (isForgotPassword && forgotStep === 2)}
                    className="w-full pl-10 pr-14 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-700/50 backdrop-blur-sm text-white placeholder-gray-400 input-field"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading || authLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center z-10 text-gray-400 hover:text-emerald-400 transition-all duration-300 group"
                    disabled={loading || authLoading}
                  >
                    <div className="relative">
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 transform transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100"></div>
                    </div>
                  </button>
                </div>
              </div>
            ) : null}

            {isLogin && !isForgotPassword && (
              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setForgotStep(1);
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
                  disabled={loading || authLoading}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-xl text-sm">
                <div className="flex">
                  <span className="text-red-400 mr-2 flex-shrink-0">⚠️</span>
                  {error}
                </div>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-400 px-4 py-3 rounded-xl text-sm">
                <div className="flex">
                  <span className="text-emerald-400 mr-2 flex-shrink-0">✅</span>
                  {successMessage}
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || authLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
            >
              {loading || authLoading ? (
                <div className="flex items-center">
                  <ModernSpinner size="sm" color="white" />
                  <span className="ml-2">
                    {isForgotPassword
                      ? forgotStep === 1
                        ? 'Verifying...'
                        : 'Updating Password...'
                      : isLogin
                        ? 'Signing In...'
                        : 'Creating Account...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="mr-2">
                    {isForgotPassword
                      ? forgotStep === 1
                        ? '✉️'
                        : '🔒'
                      : isLogin
                        ? '🔑'
                        : '👨‍💼'}
                  </span>
                  {isForgotPassword
                    ? forgotStep === 1
                      ? 'Verify Email'
                      : 'Update Password'
                    : isLogin
                      ? 'Sign In'
                      : 'Create Account'}
                </div>
              )}
            </button>
          </div>

          {/* Toggle between login and signup */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              {isForgotPassword ? (
                <>
                  Remember your password?
                  <button
                    type="button"
                    onClick={() => {
                      resetForgotFlow();
                      setIsLogin(true);
                      router.replace('/auth');
                    }}
                    className="ml-2 font-medium text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
                  >
                    Back to Sign in
                  </button>
                </>
              ) : (
                <>
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                      setSuccessMessage('');
                      const next = !isLogin;
                      router.replace(next ? '/auth' : '/auth?register=true');
                    }}
                    className="ml-2 font-medium text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </>
              )}
            </p>
          </div>
        </form>
        </div>
      </div>

      <OptionPickerModal
        open={designationPickerOpen}
        title="Select designation"
        options={designations}
        selected={formData.designation}
        searchPlaceholder="Search designations…"
        emptyMessage="No designations match your search."
        allowClear
        clearLabel="Clear designation"
        onClose={() => setDesignationPickerOpen(false)}
        onSelect={(value) => {
          setFormData((prev) => ({ ...prev, designation: value }));
          if (error) setError('');
        }}
      />

      <OptionPickerModal
        open={departmentPickerOpen}
        title="Select department"
        options={departments}
        selected={formData.department}
        searchPlaceholder="Search departments…"
        emptyMessage="No departments match your search."
        onClose={() => setDepartmentPickerOpen(false)}
        onSelect={(value) => {
          setFormData((prev) => ({ ...prev, department: value }));
          if (error) setError('');
        }}
      />
    </div>
  );
};

export default AuthForm;
