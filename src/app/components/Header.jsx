'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import NotificationCenter from './NotificationCenter';

const Header = ({ onSidebarToggle }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Profile photo component
  const ProfilePhoto = ({ size = 'w-8 h-8', className = '' }) => {
    if (userProfile?.photoURL) {
      return (
        <img
          src={userProfile.photoURL}
          alt="Profile"
          className={`${size} rounded-lg object-cover ${className}`}
        />
      );
    }
    
    return (
      <div className={`${size} bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm ${className}`}>
        {userProfile?.name?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <>
      <header className="bg-gray-900/95 backdrop-blur-md shadow-xl border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-16">
            
            {/* Left side - Only show burger menu when sidebar is available */}
            <div className="flex items-center">
              {/* Burger menu - Only show when onSidebarToggle is provided (sidebar available) */}
              {currentUser && onSidebarToggle && (
                <button
                  onClick={onSidebarToggle}
                  className="lg:hidden p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200 group mr-2 sm:mr-3"
                  aria-label="Toggle sidebar"
                >
                  <div className="flex flex-col justify-center items-center w-5 h-5 sm:w-6 sm:h-6 space-y-0.5 sm:space-y-1">
                    <span className="block w-4 sm:w-5 h-0.5 bg-current transition-all duration-300 group-hover:bg-emerald-400 transform group-hover:rotate-45 group-hover:translate-y-1.5 sm:group-hover:translate-y-2"></span>
                    <span className="block w-4 sm:w-5 h-0.5 bg-current transition-all duration-300 group-hover:bg-emerald-400 group-hover:opacity-0"></span>
                    <span className="block w-4 sm:w-5 h-0.5 bg-current transition-all duration-300 group-hover:bg-emerald-400 transform group-hover:-rotate-45 group-hover:-translate-y-1.5 sm:group-hover:-translate-y-2"></span>
                  </div>
                </button>
              )}
              
              {/* Logo - Clean positioning without burger menu interference */}
              <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-lg sm:text-xl">F</span>
                </div>
                <div className="block">
                  <span className="text-base sm:text-lg lg:text-xl font-bold text-white">FCDC</span>
                  <p className="text-xs text-gray-400 -mt-0.5 hidden sm:block">Helpdesk Enterprise IT Support</p>
                </div>
              </Link>
            </div>

            {/* Right side - Different content based on authentication */}
            {currentUser ? (
              /* Authenticated users */
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Notification Bell */}
                <NotificationBell 
                  onClick={() => setShowNotifications(true)} 
                  isActive={showNotifications}
                />
                
                {/* User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-xl bg-gray-800/50 border border-gray-700/30 hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    <ProfilePhoto />
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-white truncate max-w-20 sm:max-w-24">
                        {userProfile?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-20 sm:max-w-24">
                        {userProfile?.role || 'User'}
                      </p>
                    </div>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-gray-700">
                        <div className="flex items-center space-x-3">
                          <ProfilePhoto size="w-10 h-10" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white truncate">
                              {userProfile?.name || currentUser.email}
                            </div>
                            <div className="text-sm text-gray-400 truncate">
                              {userProfile?.email || currentUser.email}
                            </div>
                            {userProfile?.department && (
                              <div className="text-xs text-gray-500 truncate">
                                {userProfile.department}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile Settings
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsProfileOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 713-3h4a3 3 0 713 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Non-authenticated users */
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-2 sm:space-x-3">
                  {/* Sign In Button */}
                  <Link 
                    href="/auth" 
                    className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-1 sm:space-x-2"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 713-3h7a3 3 0 713 3v1" />
                    </svg>
                    <span className="hidden sm:inline">Sign In</span>
                  </Link>
                  
                  {/* Register Button */}
                  <Link 
                    href="/auth?register=true" 
                    className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-1 sm:space-x-2"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span className="hidden sm:inline">Register</span>
                  </Link>
                </nav>

                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu for non-authenticated users */}
          {!currentUser && isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-700">
              <div className="flex flex-col space-y-3">
                <Link
                  href="/auth"
                  className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-base font-medium text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 713-3h7a3 3 0 713 3v1" />
                  </svg>
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/auth?register=true"
                  className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-base font-medium text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Register</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Click outside to close dropdowns */}
        {isProfileOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsProfileOpen(false)}
          />
        )}
      </header>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </>
  );
};

export default Header;
