'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import NotificationCenter from './NotificationCenter';

const Sidebar = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const profileMenuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    // Auto-collapse on smaller screens
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isProfileOpen]);

  // Close profile menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
        setShowNotifications(false);
      }
    };

    if (isProfileOpen || showNotifications) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileOpen, showNotifications]);

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
        {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
      </div>
    );
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const items = [];

    // Add role-specific dashboard
    if (userProfile?.role === 'admin') {
      items.push(
        {
          name: 'Admin Dashboard',
          href: '/admin',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
          ),
          roles: ['admin']
        },
        {
          name: 'Executive Dashboard',
          href: '/management',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ),
          roles: ['admin']
        },
        {
          name: 'User Management',
          href: '/admin',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          ),
          roles: ['admin']
        }
      );
    } else if (userProfile?.role === 'manager') {
      items.push(
        {
          name: 'Management Dashboard',
          href: '/management',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          roles: ['manager']
        }
      );
    } else {
      items.push(
        {
          name: 'User Dashboard',
          href: '/user',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
          ),
          roles: ['user']
        }
      );
    }

    // Add common items for all users
    items.push(
      {
        name: 'Tickets',
        href: '/user',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        roles: ['user', 'admin', 'manager']
      }
    );

    return items;
  };

  const navigationItems = getNavigationItems();
  const filteredNavigation = navigationItems.filter(item => 
    !currentUser || item.roles.includes(userProfile?.role || 'user')
  );

  if (!mounted) return null;

  return (
    <>
      <div className={`
        fixed top-0 left-0 h-full bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 z-50
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        shadow-2xl
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          {!isCollapsed && (
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <div>
                <span className="text-lg font-bold text-white">FCDC</span>
                <p className="text-xs text-gray-400 -mt-1">FCDC Enterprise IT</p>
              </div>
            </Link>
          )}
          
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors duration-200"
          >
            <svg className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 text-emerald-400 border border-emerald-500/30' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }
                `}
                title={isCollapsed ? item.name : ''}
              >
                <div className={`
                  flex items-center justify-center w-5 h-5 transition-colors duration-200
                  ${isActive ? 'text-emerald-400' : 'text-gray-400 group-hover:text-white'}
                `}>
                  {item.icon}
                </div>
                
                {!isCollapsed && (
                  <span className="ml-3 transition-opacity duration-200">
                    {item.name}
                  </span>
                )}

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-r-full" />
                )}

                {/* Hover effect */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        {currentUser && (
          <div className="p-3 border-t border-gray-700/50">
            {/* Notification Bell */}
            <div className="mb-3">
              <NotificationBell 
                onClick={() => setShowNotifications(true)} 
                isActive={showNotifications}
                className={isCollapsed ? 'w-full justify-center' : ''}
              />
            </div>

            {/* Profile Section */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`
                  flex items-center w-full p-3 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/30
                  hover:bg-gray-700/50 transition-colors duration-200
                  ${isCollapsed ? 'justify-center' : 'space-x-3'}
                `}
              >
                <ProfilePhoto />
                
                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-white truncate">
                        {userProfile?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {userProfile?.role || 'User'}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && !isCollapsed && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-2 z-50 animate-in slide-in-from-bottom-2 duration-200">
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

              {/* Collapsed Sign Out Button */}
              {isCollapsed && (
                <button
                  onClick={handleLogout}
                  className="w-full mt-2 p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-200"
                  title="Sign Out"
                >
                  <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 713-3h4a3 3 0 713 3v1" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sign In Button for non-authenticated users */}
        {!currentUser && (
          <div className="p-3 border-t border-gray-700/50">
            <Link
              href="/auth"
              className={`
                flex items-center justify-center w-full px-3 py-2.5 rounded-xl text-sm font-medium
                bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700
                text-white transition-all duration-200 shadow-lg hover:shadow-xl
                ${isCollapsed ? 'px-2' : ''}
              `}
              title={isCollapsed ? 'Sign In' : ''}
            >
              {!isCollapsed && (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 713-3h7a3 3 0 713 3v1" />
                </svg>
              )}
              {!isCollapsed && 'Sign In'}
            </Link>
          </div>
        )}
      </div>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </>
  );
};

export default Sidebar;
