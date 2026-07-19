// @ts-nocheck
'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { FpdcLogo } from '@/lib/ui/FpdcLogo';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useShell } from '@/contexts/ShellContext';
import NotificationCenter from '@/shell/notifications/NotificationCenter';
import { NavSkeletonStrip } from '@/lib/ui/DashboardSkeletons';

const SidebarNavLinks = ({ filteredNavigation, pathname, showCollapsed, onMobileClose }) => {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const isNavItemActive = (item) => {
    const basePath = item.href.split('?')[0];

    if (item.tab) {
      return pathname === basePath && currentTab === item.tab;
    }

    return pathname === item.href || (item.href !== '/' && pathname.startsWith(basePath));
  };

  return (
    <>
      {filteredNavigation.map((item) => {
        const isActive = isNavItemActive(item);

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onMobileClose}
            className={`
              flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
              ${showCollapsed ? 'justify-center' : ''}
              ${isActive
                ? 'bg-app-primary-soft text-app-primary border border-app-primary'
                : 'text-app-soft hover:text-app hover:bg-app-surface-2'
              }
            `}
            title={showCollapsed ? item.name : ''}
          >
            <div className={`
              flex items-center justify-center w-5 h-5 flex-shrink-0 transition-colors duration-200
              ${isActive ? 'text-app-primary' : 'text-app-muted group-hover:text-app'}
            `}>
              {item.icon}
            </div>

            {!showCollapsed && (
              <span className="ml-3 truncate">
                {item.name}
              </span>
            )}

            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-app-primary rounded-r-full" />
            )}

            {!isActive && (
              <div className="absolute inset-0 rounded-xl bg-app-primary-soft opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            )}
          </Link>
        );
      })}
    </>
  );
};

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const { isSidebarCollapsed, toggleSidebarCollapsed } = useShell();
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();

  const showCollapsed = isSidebarCollapsed && !isMobileOpen;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (onMobileClose) {
      onMobileClose();
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getNavigationItems = () => {
    const items = [];

    if (userProfile?.role === 'admin') {
      items.push(
        {
          name: 'Admin Dashboard',
          href: '/admin',
          tab: 'overview',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
          ),
          roles: ['admin']
        },
        {
          name: 'All Tickets',
          href: '/admin?tab=tickets',
          tab: 'tickets',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
          href: '/admin?tab=users',
          tab: 'users',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          ),
          roles: ['admin']
        },
        {
          name: 'Feedback Analytics',
          href: '/admin?tab=feedback',
          tab: 'feedback',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

    return items;
  };

  const navigationItems = getNavigationItems();
  const filteredNavigation = navigationItems.filter(item =>
    !currentUser || item.roles.includes(userProfile?.role || 'user')
  );

  if (!mounted) return null;

  return (
    <>
      <aside
        className={`
          fixed top-12 sm:top-14 left-0 bottom-0
          bg-app-header backdrop-blur-xl border-r border-app-subtle z-40
          flex flex-col sidebar-transition shadow-2xl
          transition-transform duration-300 ease-in-out
          ${showCollapsed ? 'w-16' : 'w-64 max-w-[85vw]'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        aria-label="Main navigation"
      >
        <div className={`flex items-center border-b border-app-subtle flex-shrink-0 ${showCollapsed ? 'justify-center p-3' : 'justify-between p-4'}`}>
          {!showCollapsed && (
            <Link href="/" className="flex items-center space-x-3 group min-w-0" onClick={onMobileClose}>
              <FpdcLogo
                size="sm"
                className="group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="text-lg font-bold text-app">FPDC</span>
                <p className="text-xs text-app-muted -mt-1 truncate">FPDC Enterprise IT</p>
              </div>
            </Link>
          )}

          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 rounded-lg text-app-muted hover:text-app hover:bg-app-surface-2 transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close navigation menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={toggleSidebarCollapsed}
            className={`hidden lg:flex p-2 rounded-lg text-app-muted hover:text-app hover:bg-app-surface-2 transition-colors duration-200 ${showCollapsed ? '' : 'ml-auto'}`}
            aria-label={showCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className={`w-5 h-5 transition-transform duration-200 ${showCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 min-h-0 px-3 py-4 space-y-2 overflow-y-auto sidebar-scroll">
          <Suspense fallback={<NavSkeletonStrip />}>
            <SidebarNavLinks
              filteredNavigation={filteredNavigation}
              pathname={pathname}
              showCollapsed={showCollapsed}
              onMobileClose={onMobileClose}
            />
          </Suspense>
        </nav>

        {currentUser && (
          <div className="p-3 border-t border-app-subtle flex-shrink-0">
            <Link
              href="/profile"
              onClick={onMobileClose}
              className={`
                flex items-center w-full p-3 mb-3 rounded-xl bg-app-surface-2/50 backdrop-blur-sm border border-app-subtle
                hover:bg-app-surface-3 transition-colors duration-200 text-app-soft hover:text-app
                ${showCollapsed ? 'justify-center' : 'space-x-3'}
              `}
              title={showCollapsed ? 'Profile Settings' : ''}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {!showCollapsed && <span className="truncate">Profile Settings</span>}
            </Link>

            <button
              onClick={handleLogout}
              className={`
                flex items-center w-full p-3 rounded-xl bg-red-500/10 border border-red-500/30
                hover:bg-red-500/20 transition-colors duration-200 text-red-400 hover:text-red-300
                ${showCollapsed ? 'justify-center' : 'space-x-3'}
              `}
              title={showCollapsed ? 'Sign Out' : ''}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!showCollapsed && <span className="truncate">Sign Out</span>}
            </button>
          </div>
        )}
      </aside>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default Sidebar;
