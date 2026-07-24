// @ts-nocheck
'use client';
import { useState, useEffect, useRef } from 'react';
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
  const profileRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isProfileOpen) return;

    const handlePointerDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsProfileOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileOpen]);

  const isLandingPage = pathname === '/';
  const dashboardPath = getDashboardPath(userProfile?.role);
  const showDashboardButton = !!currentUser && !isOnDashboardPage(pathname, userProfile?.role);
  const showThemeMenu = !!currentUser && !isLandingPage;

  const ProfilePhoto = () => {
    const photoURL = userProfile?.photoURL || userProfile?.photo_url;

    if (photoURL) {
      return (
        <img
          src={photoURL}
          alt=""
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-app-subtle"
        />
      );
    }

    return (
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-app-primary flex items-center justify-center font-semibold text-sm border border-app-subtle text-white">
        {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
      </div>
    );
  };

  if (!mounted) {
    return (
      <header
        className={`z-50 border-b border-app-subtle ${
          pathname === '/'
            ? 'fixed top-0 left-0 right-0 bg-gray-950 border-gray-800'
            : 'sticky top-0 bg-app-header lg:fixed lg:left-0 lg:right-0'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-12 sm:h-14">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-app-surface-3 skeleton-shimmer" />
              <div className="space-y-1.5 hidden sm:block">
                <div className="h-3.5 w-16 rounded bg-app-surface-3 skeleton-shimmer" />
                <div className="h-2.5 w-24 rounded bg-app-surface-3/70 skeleton-shimmer" />
              </div>
            </div>
            <div className="h-8 w-24 rounded-lg bg-app-surface-3 skeleton-shimmer" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header
        className={`z-50 border-b border-app-subtle ${
          isLandingPage
            ? 'fixed top-0 left-0 right-0 bg-gray-950 border-gray-800'
            : 'sticky top-0 bg-app-header lg:fixed lg:left-0 lg:right-0'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between gap-2 h-12 sm:h-14 min-w-0">
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

              <Link
                href="/"
                className="flex items-center gap-2 sm:gap-2.5 group min-w-0"
                aria-label="FPDC IT Helpdesk home"
              >
                <FpdcLogo
                  size="md"
                  className="group-hover:scale-[1.03] transition-transform duration-200"
                  priority
                />
                <div className="block min-w-0">
                  <p className="text-sm sm:text-base font-bold leading-tight text-app truncate">
                    FPDC
                  </p>
                  <p className="hidden sm:block text-[11px] leading-tight text-app-muted group-hover:text-app-soft transition-colors truncate">
                    IT Helpdesk
                  </p>
                </div>
              </Link>
            </div>

            {currentUser ? (
              <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
                {showDashboardButton && (
                  <Link
                    href={dashboardPath}
                    className="hidden lg:inline-flex items-center px-3.5 py-2 bg-app-primary hover:opacity-90 text-sm font-medium rounded-lg transition-opacity duration-200 text-white"
                  >
                    Dashboard
                  </Link>
                )}

                {showThemeMenu && <ThemeMenu />}

                <NotificationBell
                  onClick={() => setShowNotifications(true)}
                  isActive={showNotifications}
                />

                <div className="relative flex-shrink-0" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((open) => !open)}
                    className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-xl bg-app-surface-2/50 border border-app-subtle hover:bg-app-surface-3 transition-colors duration-200"
                    aria-expanded={isProfileOpen}
                    aria-haspopup="menu"
                  >
                    <ProfilePhoto />
                    <div className="hidden xl:block text-left min-w-0">
                      <p className="text-sm font-medium text-app truncate max-w-[7.5rem] leading-tight">
                        {userProfile?.name || 'User'}
                      </p>
                    </div>
                    <svg
                      className={`w-3.5 h-3.5 text-app-muted flex-shrink-0 transition-transform duration-200 ${
                        isProfileOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isProfileOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.25rem)] sm:w-64 bg-app-surface border border-app rounded-xl shadow-xl z-50 overflow-hidden"
                    >
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
                            role="menuitem"
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-app-soft hover:bg-app-surface-2 hover:text-app transition-colors duration-200 lg:hidden"
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
                          role="menuitem"
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
                          role="menuitem"
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
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <Link
                  href="/auth"
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-app-soft hover:text-app transition-colors duration-200 rounded-lg hover:bg-app-surface-2/60 min-h-9 inline-flex items-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth?register=true"
                  className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 min-h-9 inline-flex items-center"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default Header;
