// @ts-nocheck
'use client';
import { useSearchParams } from 'next/navigation';
import { ModernSpinner } from '@/lib/ui/LoadingComponents';
import { FpdcLogo } from '@/lib/ui/FpdcLogo';
import Link from 'next/link';

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
import { getPasswordError, PASSWORD_RULE_MESSAGE } from '@/lib/validation/password';

const FieldIcon = ({ children }) => (
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 text-gray-400">
    {children}
  </div>
);

const inputClass =
  'w-full min-h-11 pl-10 pr-4 py-2.5 sm:py-3 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/80 focus:border-emerald-500/50 transition-colors duration-200 bg-gray-900/70 text-white placeholder-gray-500 text-sm sm:text-base disabled:opacity-50';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [registerStep, setRegisterStep] = useState(1);
  const [registerOtp, setRegisterOtp] = useState('');
  const [registerExpiresMinutes, setRegisterExpiresMinutes] = useState(15);
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotExpiresMinutes, setForgotExpiresMinutes] = useState(15);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resetToken, setResetToken] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    designation: '',
    department: '',
    confirmPassword: '',
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

  const {
    signin,
    requestRegisterOtp,
    resendRegisterOtp,
    verifyRegisterOtp,
    authLoading,
    currentUser,
    userProfile,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

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

  useEffect(() => {
    const registerParam = searchParams.get('register');
    if (registerParam === 'true') {
      setIsLogin(false);
      setRegisterStep(1);
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
      { publicOnly: true }
    );
    const unsubscribeDesignations = subscribeDesignationEvents(
      (items) => applyDesignations(items),
      { publicOnly: true }
    );

    return () => {
      cancelled = true;
      unsubscribeDepartments();
      unsubscribeDesignations();
      disconnectPublicSocket();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      return PASSWORD_RULE_MESSAGE;
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
    setForgotOtp('');
    setResetToken('');
    setVerifiedEmail('');
    setVerifiedName('');
    setResendCooldown(0);
    setFormData((prev) => ({
      ...prev,
      password: '',
      confirmPassword: '',
    }));
    setError('');
    setSuccessMessage('');
  };

  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const result = await api.post('/api/v1/auth/forgot-password/send-otp', {
        email: formData.email.trim(),
      });
      setVerifiedEmail(result.email);
      setVerifiedName(result.name || '');
      setForgotExpiresMinutes(result.expiresInMinutes || 15);
      setForgotOtp('');
      setForgotStep(2);
      setResendCooldown(60);
      setSuccessMessage('Verification code sent. Check your email inbox.');
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendForgotOtp = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const result = await api.post('/api/v1/auth/forgot-password/resend-otp', {
        email: verifiedEmail || formData.email.trim(),
      });
      setForgotExpiresMinutes(result.expiresInMinutes || 15);
      setForgotOtp('');
      setResendCooldown(60);
      setSuccessMessage('A new verification code was sent to your email.');
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyForgotOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const otp = forgotOtp.trim();
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit verification code from your email.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.post('/api/v1/auth/forgot-password/verify-otp', {
        email: verifiedEmail || formData.email.trim(),
        otp,
      });
      setResetToken(result.resetToken);
      setVerifiedEmail(result.email);
      setVerifiedName(result.name);
      setForgotStep(3);
      setSuccessMessage(`Code verified. Hello, ${result.name}! Set your new password below.`);
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
    const passwordError = getPasswordError(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/v1/auth/forgot-password/reset', {
        resetToken,
        password: formData.password,
      });
      setSuccessMessage('Password updated successfully! You can now sign in with your new password.');
      setFormData((prev) => ({
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
      } else if (registerStep === 2) {
        const otp = registerOtp.trim();
        if (!/^\d{6}$/.test(otp)) {
          setError('Enter the 6-digit verification code from your email.');
          setLoading(false);
          return;
        }
        const verifiedEmail = formData.email.trim();
        const result = await verifyRegisterOtp(verifiedEmail, otp);
        setRegisterOtp('');
        setRegisterStep(1);
        setIsForgotPassword(false);
        setIsLogin(true);
        setFormData({
          email: verifiedEmail,
          password: '',
          name: '',
          designation: '',
          department: '',
          confirmPassword: '',
        });
        setSuccessMessage('Account created — sign in to continue');
        router.replace('/auth');
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        const passwordError = getPasswordError(formData.password);
        if (passwordError) {
          setError(passwordError);
          setLoading(false);
          return;
        }
        if (!formData.department) {
          setError('Please select a department');
          setLoading(false);
          return;
        }

        const result = await requestRegisterOtp({
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name.trim(),
          department: formData.department,
          designation: formData.designation,
        });

        setRegisterExpiresMinutes(result.expiresInMinutes || 15);
        setRegisterStep(2);
        setRegisterOtp('');
        setResendCooldown(60);
        setSuccessMessage(
          result.message ||
            `Verification code sent to ${formData.email.trim()}. Check your inbox.`,
        );
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendRegisterOtp = async () => {
    if (resendCooldown > 0 || loading || authLoading) return;
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const result = await resendRegisterOtp(formData.email.trim());
      setRegisterExpiresMinutes(result.expiresInMinutes || 15);
      setResendCooldown(60);
      setSuccessMessage(result.message || 'A new verification code was sent.');
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (loginMode) => {
    setIsLogin(loginMode);
    setIsForgotPassword(false);
    setForgotStep(1);
    setRegisterStep(1);
    setRegisterOtp('');
    setResendCooldown(0);
    setError('');
    setSuccessMessage('');
    router.replace(loginMode ? '/auth' : '/auth?register=true');
  };

  const pickerDisabled = loading || authLoading;
  const triggerClass = `${inputClass} pr-10 text-left appearance-none`;

  const title = isForgotPassword
    ? forgotStep === 1
      ? 'Forgot password'
      : forgotStep === 2
        ? 'Check your email'
        : 'Set new password'
    : isLogin
      ? 'Sign in'
      : registerStep === 2
        ? 'Check your email'
        : 'Create account';

  const subtitle = isForgotPassword
    ? forgotStep === 1
      ? 'Enter your registered email to receive a verification code'
      : forgotStep === 2
        ? `Enter the 6-digit code we sent to ${verifiedEmail || formData.email}.`
        : `Create a new password for ${verifiedEmail}`
    : isLogin
      ? 'Access the FPDC IT Helpdesk'
      : registerStep === 2
        ? `Enter the 6-digit code we sent to ${formData.email}.`
        : 'Create your FPDC IT Helpdesk account';

  const submitLabel = isForgotPassword
    ? forgotStep === 1
      ? 'Send code'
      : forgotStep === 2
        ? 'Verify code'
        : 'Update password'
    : isLogin
      ? 'Sign in'
      : registerStep === 2
        ? 'Verify code'
        : 'Continue';

  const loadingLabel = isForgotPassword
    ? forgotStep === 1
      ? 'Sending code...'
      : forgotStep === 2
        ? 'Verifying...'
        : 'Updating password...'
    : isLogin
      ? 'Signing in...'
      : registerStep === 2
        ? 'Verifying...'
        : 'Sending code...';

  return (
    <div className="min-h-screen flex flex-col justify-center py-8 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto min-w-0">
        <div className="mb-4 sm:mb-5">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 min-h-10 rounded-xl border border-gray-800 bg-gray-900/60 px-3 sm:px-3.5 text-sm text-gray-300 hover:border-emerald-500/40 hover:bg-gray-900 hover:text-white transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gray-950 border border-gray-800 text-gray-400 group-hover:border-emerald-500/30 group-hover:text-emerald-400 transition-colors duration-200">
              <svg
                className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            <span className="font-medium">Back to home</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-5 sm:p-8 shadow-2xl shadow-black/30 min-w-0 overflow-x-hidden">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <FpdcLogo size="lg" className="shrink-0" priority />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium tracking-wide uppercase text-emerald-400/90 truncate">
                Federal Pioneer Development Corp.
              </p>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">IT Helpdesk</h1>
            </div>
          </div>

          {/* Mode tabs — sliding pill */}
          {!isForgotPassword && !( !isLogin && registerStep === 2) && (
            <div
              className="relative flex p-1 mb-5 sm:mb-6 rounded-xl bg-gray-950/80 border border-gray-800"
              role="tablist"
              aria-label="Authentication mode"
            >
              <span
                aria-hidden
                className={`pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-emerald-600 shadow-md shadow-emerald-900/30 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
                  isLogin ? 'translate-x-0' : 'translate-x-full'
                }`}
              />
              <button
                type="button"
                role="tab"
                aria-selected={isLogin}
                onClick={() => switchMode(true)}
                disabled={loading || authLoading}
                className={`relative z-10 flex-1 min-h-10 rounded-lg text-sm font-semibold transition-colors duration-300 ${
                  isLogin ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isLogin}
                onClick={() => switchMode(false)}
                disabled={loading || authLoading}
                className={`relative z-10 flex-1 min-h-10 rounded-lg text-sm font-semibold transition-colors duration-300 ${
                  !isLogin ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Register
              </button>
            </div>
          )}

          <div
            key={
              isForgotPassword
                ? `forgot-${forgotStep}`
                : isLogin
                  ? 'login'
                  : `register-${registerStep}`
            }
            className="auth-mode-panel"
          >
            <div className="mb-5">
              <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
              <p className="mt-1 text-sm text-gray-400 break-words">{subtitle}</p>
            </div>

          <form
            className="space-y-4"
            onSubmit={
              isForgotPassword
                ? forgotStep === 1
                  ? handleSendForgotOtp
                  : forgotStep === 2
                    ? handleVerifyForgotOtp
                    : handleResetPassword
                : handleSubmit
            }
          >
            {!isLogin && !isForgotPassword && registerStep === 1 && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Full name
                  </label>
                  <div className="relative">
                    <FieldIcon>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </FieldIcon>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required={!isLogin}
                      className={inputClass}
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={loading || authLoading}
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="designation"
                    className="block text-sm font-medium text-gray-300 mb-1.5"
                  >
                    Designation
                  </label>
                  <div className="relative min-w-0">
                    <FieldIcon>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0"
                        />
                      </svg>
                    </FieldIcon>
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
                          formData.designation ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {formData.designation || 'Select your designation'}
                      </span>
                    </button>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="department"
                    className="block text-sm font-medium text-gray-300 mb-1.5"
                  >
                    Department
                  </label>
                  <div className="relative min-w-0">
                    <FieldIcon>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </FieldIcon>
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
                          formData.department ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {formData.department || 'Select your department'}
                      </span>
                    </button>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!(!isLogin && !isForgotPassword && registerStep === 2) &&
              !(isForgotPassword && forgotStep === 2) && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <FieldIcon>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </FieldIcon>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  readOnly={isForgotPassword && forgotStep === 3}
                  className={`${inputClass} ${
                    isForgotPassword && forgotStep === 3 ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  placeholder="Enter email address"
                  value={isForgotPassword && forgotStep === 3 ? verifiedEmail : formData.email}
                  onChange={handleChange}
                  disabled={loading || authLoading || (isForgotPassword && forgotStep === 3)}
                />
              </div>
            </div>
            )}

            {!isLogin && !isForgotPassword && registerStep === 2 && (
              <div>
                <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-100/90">
                  <p className="leading-relaxed break-all">
                    Code sent to <span className="font-semibold text-white">{formData.email}</span>
                  </p>
                </div>
                <label htmlFor="registerOtp" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Verification code
                </label>
                <div className="relative">
                  <FieldIcon>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 11c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm6 0c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zM9 17h6"
                      />
                    </svg>
                  </FieldIcon>
                  <input
                    id="registerOtp"
                    name="registerOtp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    className={`${inputClass} tracking-[0.35em] font-semibold`}
                    placeholder="000000"
                    value={registerOtp}
                    onChange={(e) => {
                      const next = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setRegisterOtp(next);
                    }}
                    disabled={loading || authLoading}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Code expires in {registerExpiresMinutes} minutes. Check spam if you do not see it.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                  <button
                    type="button"
                    onClick={handleResendRegisterOtp}
                    disabled={loading || authLoading || resendCooldown > 0}
                    className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep(1);
                      setRegisterOtp('');
                      setError('');
                      setSuccessMessage('');
                    }}
                    disabled={loading || authLoading}
                    className="font-medium text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    Edit registration details
                  </button>
                </div>
              </div>
            )}

            {isForgotPassword && forgotStep === 2 && (
              <div>
                <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-100/90">
                  <p className="leading-relaxed break-all">
                    Code sent to{' '}
                    <span className="font-semibold text-white">{verifiedEmail || formData.email}</span>
                  </p>
                </div>
                <label htmlFor="forgotOtp" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Verification code
                </label>
                <div className="relative">
                  <FieldIcon>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 11c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm6 0c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zM9 17h6"
                      />
                    </svg>
                  </FieldIcon>
                  <input
                    id="forgotOtp"
                    name="forgotOtp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    className={`${inputClass} tracking-[0.35em] font-semibold`}
                    placeholder="000000"
                    value={forgotOtp}
                    onChange={(e) => {
                      const next = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setForgotOtp(next);
                    }}
                    disabled={loading || authLoading}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Code expires in {forgotExpiresMinutes} minutes. Check spam if you do not see it.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                  <button
                    type="button"
                    onClick={handleResendForgotOtp}
                    disabled={loading || authLoading || resendCooldown > 0}
                    className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotOtp('');
                      setError('');
                      setSuccessMessage('');
                    }}
                    disabled={loading || authLoading}
                    className="font-medium text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            )}

            {isForgotPassword && forgotStep === 3 && verifiedName && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-200">
                Account verified:{' '}
                <span className="font-semibold text-white">{verifiedName}</span>
              </div>
            )}

            {(!isForgotPassword || forgotStep === 3) &&
              !( !isLogin && !isForgotPassword && registerStep === 2) && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-1.5"
                >
                  {isForgotPassword ? 'New password' : 'Password'}
                </label>
                <div className="relative">
                  <FieldIcon>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </FieldIcon>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isForgotPassword ? 'new-password' : 'current-password'}
                    required={!isForgotPassword || forgotStep === 3}
                    className={`${inputClass} pr-12`}
                    placeholder={isForgotPassword ? 'Enter new password' : 'Enter password'}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading || authLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-emerald-400 transition-colors min-w-10 justify-center"
                    disabled={loading || authLoading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {((!isLogin && !isForgotPassword && registerStep === 1) ||
                  (isForgotPassword && forgotStep === 3)) && (
                  <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                    {PASSWORD_RULE_MESSAGE}
                  </p>
                )}
              </div>
            )}

            {((!isLogin && !isForgotPassword && registerStep === 1) ||
              (isForgotPassword && forgotStep === 3)) ? (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-300 mb-1.5"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <FieldIcon>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </FieldIcon>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required={!isLogin || (isForgotPassword && forgotStep === 3)}
                    className={`${inputClass} pr-12`}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading || authLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-emerald-400 transition-colors min-w-10 justify-center"
                    disabled={loading || authLoading}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {isLogin && !isForgotPassword && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setForgotStep(1);
                    setForgotOtp('');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  disabled={loading || authLoading}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {isForgotPassword && forgotStep === 1 && (
              <p className="text-xs text-gray-500 leading-relaxed -mt-1">
                We&apos;ll email a 6-digit code to verify it&apos;s you before you can set a new password.
              </p>
            )}

            {!isLogin && !isForgotPassword && registerStep === 1 && (
              <p className="text-xs text-gray-500 leading-relaxed -mt-1">
                We&apos;ll email a 6-digit code to verify your address before your account is created.
              </p>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-200"
              >
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || authLoading}
              className="w-full min-h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm sm:text-base font-semibold shadow-lg shadow-emerald-900/25 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || authLoading ? (
                <>
                  <ModernSpinner size="sm" color="white" />
                  <span>{loadingLabel}</span>
                </>
              ) : (
                <>
                  <span>{submitLabel}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </>
              )}
            </button>

            <div className="pt-1 text-center text-sm text-gray-400">
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
                    className="ml-1.5 font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Back to sign in
                  </button>
                </>
              ) : !isLogin && registerStep === 2 ? (
                <span>Didn&apos;t get the email? Check spam or resend the code.</span>
              ) : (
                <>
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  <button
                    type="button"
                    onClick={() => switchMode(!isLogin)}
                    className="ml-1.5 font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {isLogin ? 'Register' : 'Sign in'}
                  </button>
                </>
              )}
            </div>
          </form>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-gray-500">
          FPDC IT Helpdesk — internal support access only
        </p>
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
        tone="auth"
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
        tone="auth"
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
