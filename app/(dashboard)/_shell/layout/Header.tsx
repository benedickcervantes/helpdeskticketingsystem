// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FcdcLogo } from '@/lib/ui/FcdcLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useShellOptional } from '@/contexts/ShellContext';
import { getDashboardPath, isOnDashboardPage } from '@/lib/utils/roles';
import NotificationBell from '@/shell/notifications/NotificationBell';
import NotificationCenter from '@/shell/notifications/NotificationCenter';

const Header = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const pathname = usePathname();
  const shell = useShellOptional();
  const [mounted, setMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle notification center close
  const handleNotificationCenterClose = () => {
    setShowNotifications(false);
  };

  // Handle notification bell click
  const handleNotificationBellClick = () => {
    setShowNotifications(true);
  };

  if (!mounted) {
    return null;
  }

  const dashboardPath = getDashboardPath(userProfile?.role);
  const showDashboardButton = !isOnDashboardPage(pathname, userProfile?.role);

  const ProfilePhoto = () => {
    const photoURL = userProfile?.photoURL || userProfile?.photo_url;

    if (photoURL) {
      return (
        <img
          src={photoURL}
          alt="Profile"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-gray-700/50"
        />
      );
    }

    return (
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm sm:text-base border-2 border-gray-700/50">
        {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
      </div>
    );
  };

  return (
    <>
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-12 sm:h-14">
            {/* Left side - Menu toggle + Logo */}
            <div className="flex items-center flex-1 min-w-0">
              {shell?.showSidebarToggle && (
                <button
                  onClick={shell.toggleSidebar}
                  className="lg:hidden flex items-center justify-center p-2 mr-1 sm:mr-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200 min-h-[44px] min-w-[44px]"
                  aria-label="Open navigation menu"
                  aria-expanded={shell.isSidebarOpen}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              {shell?.showPopupToggle && (
                <button
                  onClick={shell.togglePopupMenu}
                  className="lg:hidden flex items-center justify-center p-2 mr-1 sm:mr-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200 min-h-[44px] min-w-[44px]"
                  aria-label="Open menu"
                  aria-expanded={shell.isPopupMenuOpen}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              {/* Logo - Updated to match footer */}
              <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
                <FcdcLogo
                  size="md"
                  className="group-hover:scale-105 transition-transform duration-200"
                  priority
                />
                <div className="block min-w-0">
                  <h1 className="text-sm sm:text-base md:text-lg font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                    FCDC
                  </h1>
                  <p className="hidden lg:block text-[10px] leading-tight text-gray-400 group-hover:text-gray-300 transition-colors duration-200 truncate">
                    Helpdesk Enterprise IT Support
                  </p>
                </div>
              </Link>
            </div>

            {/* Right side - Different content based on authentication */}
            {currentUser ? (
              /* Authenticated users */
              <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
                {showDashboardButton && (
                  <Link
                    href={dashboardPath}
                    className="hidden sm:inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                )}

                {/* Notification Bell */}
                <NotificationBell 
                  onClick={handleNotificationBellClick} 
                  isActive={showNotifications}
                />
                
                {/* User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-1.5 sm:space-x-2 p-1 rounded-xl bg-gray-800/50 border border-gray-700/30 hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    <ProfilePhoto />
                    <div className="hidden sm:block text-left min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-white truncate max-w-20 lg:max-w-28 leading-tight">
                        {userProfile?.name || 'User'}
                      </p>
                    </div>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50">
                      <div className="p-3 sm:p-4 border-b border-gray-700">
                        <div className="flex items-center space-x-3">
                          <ProfilePhoto />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {userProfile?.name || 'User'}
                            </p>
                            <p className="hidden sm:block text-xs sm:text-sm text-gray-400 truncate">
                              {userProfile?.email || 'user@example.com'}
                            </p>
                            <p className="text-xs text-emerald-400 font-medium">
                              {userProfile?.department || 'Department'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="py-1">
                        {showDashboardButton && (
                          <Link
                            href={dashboardPath}
                            className="flex items-center px-3 sm:px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors duration-200 sm:hidden"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            </svg>
                            Dashboard
                          </Link>
                        )}
                        <Link
                          href="/profile"
                          className="flex items-center px-3 sm:px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors duration-200"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile Settings
                        </Link>
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            logout();
                          }}
                          className="flex items-center w-full px-3 sm:px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors duration-200"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
                <Link
                  href="/auth"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth?register=true"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={handleNotificationCenterClose} 
      />
    </>
  );
};

export default Header;
