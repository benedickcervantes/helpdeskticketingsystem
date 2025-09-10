'use client';
import { useSearchParams } from 'next/navigation';
import { ModernSpinner } from "./LoadingComponents";

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    department: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { signin, signup, authLoading, currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect if already authenticated
  useEffect(() => {
    if (currentUser && !authLoading) {
      const userRole = currentUser.role || 'user';
      if (userRole === 'admin') {
        router.push('/admin');
      } else if (userRole === 'manager') {
        router.push('/management');
      } else {
        router.push('/user');
      }
    }
  }, [currentUser, authLoading, router]);

  // Check for register query parameter
  useEffect(() => {
    const registerParam = searchParams.get('register');
    if (registerParam === 'true') {
      setIsLogin(false);
    }
  }, [searchParams]);

  const departments = [
    "CRG (Customer Relation Group)",
    "TG (Takeout Group)",
    "Billing and Collection Group",
    "Treasury Group",
    "Finance and Tax Group",
    "Disbursement Group",
    "RSD (Real Estate Services Department)",
    "Engineering Department",
    "Sales and Marketing Group",
    "Leasing Group"
  ];
  const handleChange = (e) => {
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
    } else if (error.code === 'auth/too-many-requests') {
      return 'Too many failed attempts. Please try again later.';
    } else if (error.message) {
      return error.message;
    }
    return 'An error occurred. Please try again.';
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
        
        await signup(formData.email, formData.password, formData.name, 'user', formData.department);
        
        setSuccessMessage('Account created successfully! Redirecting to your dashboard...');
        
        // Clear form data
        setFormData({
          email: '',
          password: '',
          name: '',
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

  // Show loading screen if authentication is in progress
  if (authLoading && currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <ModernSpinner size="xl" color="emerald" />
          <p className="mt-4 text-gray-300 font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {isLogin ? 'Sign in to your FCDC account' : 'Join thousands of IT professionals'}
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
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
                
                <div>
                  <label htmlFor="department" className="block text-sm font-semibold text-gray-300 mb-2">
                    Department
                  </label>
                  <div className="relative input-icon-container">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 input-icon">
                      <span className="text-gray-400 text-lg font-bold">🏢</span>
                    </div>
                    <select
                      id="department"
                      name="department"
                      required={!isLogin}
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-700/50 backdrop-blur-sm text-white appearance-none input-field"
                      disabled={loading || authLoading}
                    >
                      <option value="" className="text-gray-400">Select your department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept} className="text-white bg-gray-800">
                          {dept}
                        </option>
                      ))}
                    </select>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-700/50 backdrop-blur-sm text-white placeholder-gray-400 input-field"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading || authLoading}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
                Password
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
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-14 py-3 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-gray-700/50 backdrop-blur-sm text-white placeholder-gray-400 input-field"
                  placeholder="Enter password"
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
            
            {!isLogin && (
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
                    required={!isLogin}
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
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="mr-2">
                    {isLogin ? '🔑' : '👨‍💼'}
                  </span>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </div>
              )}
            </button>
          </div>

          {/* Toggle between login and signup */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccessMessage('');
                }}
                className="ml-2 font-medium text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
