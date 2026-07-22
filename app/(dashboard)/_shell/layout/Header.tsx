// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FpdcLogo } from '@/lib/ui/FpdcLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useShellOptional } from '@/contexts/ShellContext';
import { getDashboardPath, isOnDashboardPage } from '@/lib/utils/roles';
import NotificationBell from '@/shell/notifications/NotificationBell';
import NotificationCenter from '@/shell/notifications/NotificationCenter';
import ThemeMenu from '@/shell/theme/ThemeMenu';

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
  const isLandingPage = pathname === '/';
  const showThemeMenu = !!currentUser && !isLandingPage;

  const ProfilePhoto = () => {
    const photoURL = userProfile?.photoURL || userProfile?.photo_url;

    if (photoURL) {
      return (
        <img
          src={photoURL}
          alt="Profile"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-app-subtle"
        />
      );
    }

    return (
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-app-primary flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-app-subtle">
        {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
      </div>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-app-subtle bg-app-header lg:fixed lg:left-0 lg:right-0">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between gap-2 h-12 sm:h-14 min-w-0">
            {/* Left side - Menu toggle + Logo */}
            <div className="flex items-center flex-1 min-w-0 overflow-hidden">
              {shell?.showSidebarToggle && (
                <button
                  onClick={shell.toggleSidebar}
                  className="lg:hidden flex items-center justify-center mr-1.5 sm:mr-2 h-10 w-10 rounded-xl border border-transparent text-app-muted hover:text-app hover:bg-app-surface-2 hover:border-app-subtle transition-colors duration-200"
                  aria-label={shell.isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
                  aria-expanded={shell.isSidebarOpen}
                >
                  {shell.isSidebarOpen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              )}
              {shell?.showPopupToggle && (
                <button
                  onClick={shell.togglePopupMenu}
                  className="lg:hidden flex items-center justify-center p-2 mr-1 sm:mr-2 rounded-lg text-app-muted hover:text-app hover:bg-app-surface-2 transition-colors duration-200 min-h-[44px] min-w-[44px]"
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
                <FpdcLogo
                  size="md"
                  className="group-hover:scale-105 transition-transform duration-200"
                  priority
                />
                <div className="block min-w-0">
                  <h1 className="text-sm sm:text-base md:text-lg font-bold leading-tight text-app">
                    FPDC
                  </h1>
                  <p className="hidden lg:block text-[10px] leading-tight text-app-muted group-hover:text-app-soft transition-colors duration-200 truncate">
                    Helpdesk Enterprise IT Support
                  </p>
                </div>
              </Link>
            </div>

            {/* Right side - Different content based on authentication */}
            {currentUser ? (
              /* Authenticated users */
              <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
                {showDashboardButton && (
                  <Link
                    href={dashboardPath}
                    className="hidden xl:inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-app-primary text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                )}

                {showThemeMenu && <ThemeMenu />}

                {/* Notification Bell */}
                <NotificationBell 
                  onClick={handleNotificationBellClick} 
                  isActive={showNotifications}
                />
                
                {/* User Profile Dropdown */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-xl bg-app-surface-2/50 border border-app-subtle hover:bg-app-surface-3 transition-colors duration-200"
                  >
                    <ProfilePhoto />
                    <div className="hidden xl:block text-left min-w-0">
                      <p className="text-sm font-medium text-app truncate max-w-[7.5rem] leading-tight">
                        {userProfile?.name || 'User'}
                      </p>
                    </div>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-app-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.25rem)] sm:w-64 bg-app-surface border border-app rounded-xl shadow-xl z-50">
                      <div className="px-3 py-2.5 border-b border-app">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex-shrink-0">
                            <ProfilePhoto />
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-sm font-medium text-app truncate leading-tight">
                              {userProfile?.name || 'User'}
                            </p>
                            <p
                              className="mt-0.5 text-xs text-app-primary font-medium leading-snug break-words [overflow-wrap:anywhere] line-clamp-2"
                              title={userProfile?.designation || undefined}
                            >
                              {userProfile?.designation || 'No designation'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="py-1">
                        {showDashboardButton && (
                          <Link
                            href={dashboardPath}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-app-soft hover:bg-app-surface-2 hover:text-app transition-colors duration-200 sm:hidden"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            </svg>
                            Dashboard
                          </Link>
                        )}
                        <Link
                          href="/profile"
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-app-soft hover:bg-app-surface-2 hover:text-app transition-colors duration-200"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile Settings
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            logout();
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-app-soft hover:bg-app-surface-2 hover:text-app transition-colors duration-200"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              /* Non-authenticated users — no theme customizer on public landing */
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link
                  href="/auth"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-app-soft hover:text-app transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth?register=true"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm"
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
