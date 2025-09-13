'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import NotificationCenter from './NotificationCenter';

const Header = ({ onSidebarToggle, isSidebarOpen = false }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPopupMenu, setShowPopupMenu] = useState(false);
  
  // Refs for popup menu
  const popupRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle popup menu toggle
  const handlePopupToggle = () => {
    if (onSidebarToggle) {
      setShowPopupMenu(!showPopupMenu);
      onSidebarToggle();
    }
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPopupMenu && popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopupMenu(false);
        if (onSidebarToggle) {
          onSidebarToggle();
        }
      }
    };

    if (showPopupMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [showPopupMenu, onSidebarToggle]);

  // Sync with external sidebar state
  useEffect(() => {
    setShowPopupMenu(isSidebarOpen);
  }, [isSidebarOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setShowPopupMenu(false);
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
            
            {/* Left side - Burger menu for authenticated users */}
            <div className="flex items-center">
              {/* Enhanced Burger menu */}
              {currentUser && onSidebarToggle && (
                <button
                  onClick={handlePopupToggle}
                  className="lg:hidden p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-300 group mr-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:scale-105 active:scale-95 relative overflow-hidden"
                  aria-label="Toggle popup menu"
                >
                  {/* Subtle background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-cyan-500/0 group-hover:from-emerald-500/10 group-hover:to-cyan-500/10 transition-all duration-300 rounded-xl"></div>
                  
                  <div className="relative w-6 h-6 flex flex-col justify-center items-center">
                    {/* Top line */}
                    <span 
                      className={`absolute w-5 h-0.5 bg-current transition-all duration-300 ease-out transform origin-center ${
                        showPopupMenu 
                          ? 'rotate-45 translate-y-0 bg-emerald-400' 
                          : '-translate-y-1.5 group-hover:bg-emerald-400'
                      }`}
                    ></span>
                    {/* Middle line */}
                    <span 
                      className={`absolute w-5 h-0.5 bg-current transition-all duration-300 ease-out origin-center ${
                        showPopupMenu 
                          ? 'opacity-0 scale-x-0' 
                          : 'opacity-100 scale-x-100 group-hover:bg-emerald-400'
                      }`}
                    ></span>
                    {/* Bottom line */}
                    <span 
                      className={`absolute w-5 h-0.5 bg-current transition-all duration-300 ease-out transform origin-center ${
                        showPopupMenu 
                          ? '-rotate-45 translate-y-0 bg-emerald-400' 
                          : 'translate-y-1.5 group-hover:bg-emerald-400'
                      }`}
                    ></span>
                  </div>
                </button>
              )}
              
              {/* Logo */}
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
                    <div className="absolute right-0 mt-2 w-64 bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 py-3 z-50 transform transition-all duration-300 ease-out">
                      <div className="px-5 py-4 border-b border-gray-700/50 relative">
                        <div className="flex items-center space-x-3">
                          <ProfilePhoto size="w-12 h-12" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white truncate text-base">
                              {userProfile?.name || currentUser.email}
                            </div>
                            <div className="text-sm text-gray-400 truncate">
                              {userProfile?.email || currentUser.email}
                            </div>
                            {userProfile?.department && (
                              <div className="text-xs text-emerald-400 truncate font-medium">
                                {userProfile.department}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="py-2 relative">
                        <Link
                          href="/profile"
                          className="flex items-center px-5 py-3 text-sm text-gray-300 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-cyan-500/10 hover:text-white transition-all duration-200 group"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mr-3 group-hover:bg-emerald-500/20 transition-colors duration-200">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="font-medium">Profile Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsProfileOpen(false);
                          }}
                          className="flex items-center w-full px-5 py-3 text-sm text-red-400 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10 hover:text-red-300 transition-all duration-200 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mr-3 group-hover:bg-red-500/20 transition-colors duration-200">
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 713-3h4a3 3 0 713 3v1" />
                            </svg>
                          </div>
                          <span className="font-medium">Sign Out</span>
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
                  <Link 
                    href="/auth" 
                    className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-1 sm:space-x-2"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 713-3h7a3 3 0 713 3v1" />
                    </svg>
                    <span className="hidden sm:inline">Sign In</span>
                  </Link>
                  
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
                    className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:scale-105 active:scale-95 relative overflow-hidden"
                    aria-label="Toggle mobile menu"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-cyan-500/0 group-hover:from-emerald-500/10 group-hover:to-cyan-500/10 transition-all duration-300 rounded-xl"></div>
                    
                    <div className="relative w-6 h-6 flex flex-col justify-center items-center">
                      <span 
                        className={`absolute w-5 h-0.5 bg-current transition-all duration-300 ease-out transform origin-center ${
                          isMobileMenuOpen 
                            ? 'rotate-45 translate-y-0 bg-emerald-400' 
                            : '-translate-y-1.5 group-hover:bg-emerald-400'
                        }`}
                      ></span>
                      <span 
                        className={`absolute w-5 h-0.5 bg-current transition-all duration-300 ease-out origin-center ${
                          isMobileMenuOpen 
                            ? 'opacity-0 scale-x-0' 
                            : 'opacity-100 scale-x-100 group-hover:bg-emerald-400'
                        }`}
                      ></span>
                      <span 
                        className={`absolute w-5 h-0.5 bg-current transition-all duration-300 ease-out transform origin-center ${
                          isMobileMenuOpen 
                            ? '-rotate-45 translate-y-0 bg-emerald-400' 
                            : 'translate-y-1.5 group-hover:bg-emerald-400'
                        }`}
                      ></span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu for non-authenticated users */}
          {!currentUser && isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-700/50 bg-gray-900/95 backdrop-blur-xl transform transition-all duration-300 ease-out overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5"></div>
              
              <div className="flex flex-col space-y-4 p-6 relative">
                <Link
                  href="/auth"
                  className="flex items-center justify-center space-x-3 px-8 py-5 rounded-2xl text-lg font-bold text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 group relative overflow-hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-all duration-300 group-hover:scale-110">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 713-3h7a3 3 0 713 3v1" />
                    </svg>
                  </div>
                  <span className="relative z-10">Sign In to FCDC</span>
                  
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                
                <Link
                  href="/auth?register=true"
                  className="flex items-center justify-center space-x-3 px-8 py-5 rounded-2xl text-lg font-bold text-white bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border-2 border-gray-600 hover:border-emerald-500 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 group relative overflow-hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-all duration-300 group-hover:scale-110">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <span className="relative z-10">Create Account</span>
                  
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-400">
                    Join thousands of IT professionals using FCDC
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Click outside to close profile dropdown */}
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
