'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

const PopupMenu = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const popupRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
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

  if (!mounted || !isOpen || !currentUser) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        ref={backdropRef}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300 ease-out"
        onClick={onClose}
      />
      
      {/* Popup Menu */}
      <div 
        ref={popupRef}
        className="fixed top-16 left-4 right-4 bg-gray-900/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 z-[9999] transform transition-all duration-300 ease-out overflow-hidden max-h-[calc(100vh-5rem)]"
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl"></div>
        
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <ProfilePhoto size="w-12 h-12" />
              <div>
                <h3 className="text-lg font-bold text-white">
                  {userProfile?.name || 'User'}
                </h3>
                <p className="text-sm text-gray-400">
                  {userProfile?.role || 'User'} • {userProfile?.department || 'IT Department'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Menu */}
          <div className="space-y-2">
            <Link
              href="/user"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-cyan-500/10 hover:text-white transition-all duration-200 group"
              onClick={onClose}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors duration-200">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
              </div>
              <div>
                <span className="font-medium">Dashboard</span>
                <p className="text-xs text-gray-500">View your tickets and activity</p>
              </div>
            </Link>

            <Link
              href="/profile"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-cyan-500/10 hover:text-white transition-all duration-200 group"
              onClick={onClose}
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors duration-200">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <span className="font-medium">Profile Settings</span>
                <p className="text-xs text-gray-500">Manage your account</p>
              </div>
            </Link>

            {userProfile?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-cyan-500/10 hover:text-white transition-all duration-200 group"
                onClick={onClose}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors duration-200">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <span className="font-medium">Admin Panel</span>
                  <p className="text-xs text-gray-500">System administration</p>
                </div>
              </Link>
            )}

            {userProfile?.role === 'management' && (
              <Link
                href="/management"
                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-cyan-500/10 hover:text-white transition-all duration-200 group"
                onClick={onClose}
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors duration-200">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <span className="font-medium">Management</span>
                  <p className="text-xs text-gray-500">Team and analytics</p>
                </div>
              </Link>
            )}
          </div>

          {/* Logout Button */}
          <div className="mt-6 pt-4 border-t border-gray-700/50">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10 hover:text-red-300 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors duration-200">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 713-3h4a3 3 0 713 3v1" />
                </svg>
              </div>
              <div>
                <span className="font-medium">Sign Out</span>
                <p className="text-xs text-gray-500">End your session</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PopupMenu;
