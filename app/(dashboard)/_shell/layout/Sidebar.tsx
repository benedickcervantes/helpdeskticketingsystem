// @ts-nocheck
'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FpdcLogo } from '@/lib/ui/FpdcLogo';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useShell } from '@/contexts/ShellContext';
import NotificationCenter from '@/shell/notifications/NotificationCenter';
import { NavSkeletonStrip } from '@/lib/ui/DashboardSkeletons';

const roleLabel = (role) => {
  if (role === 'admin') return 'Administrator';
  if (role === 'manager') return 'Executive';
  return 'User';
};

const roleBadgeClass = (role) => {
  if (role === 'admin') return 'bg-app-primary-soft text-app-primary border-app-primary/30';
  if (role === 'manager') return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
  return 'bg-app-surface-2 text-app-soft border-app';
};

const SidebarNavLinks = ({
  sections,
  pathname,
  showCollapsed,
  onMobileClose,
}) => {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const isNavItemActive = (item) => {
    const basePath = item.href.split('?')[0];

    // Admin dashboard tabs: sync strictly with ?tab= (default overview).
    if (item.tab && basePath === '/admin') {
      return pathname === '/admin' && currentTab === item.tab;
    }

    if (item.tab) {
      return pathname === basePath && currentTab === item.tab;
    }

    // Exact path match for non-tab routes (e.g. /management).
    return pathname === basePath;
  };

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section.id}>
          {!showCollapsed && section.label && (
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-app-muted">
              {section.label}
            </p>
          )}
          {showCollapsed && section.label && (
            <div className="mx-auto mb-2 h-px w-6 bg-app-subtle" aria-hidden="true" />
          )}

          <div className={`space-y-1 ${showCollapsed ? 'px-0' : ''}`}>
            {section.items.map((item) => {
              const isActive = isNavItemActive(item);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onMobileClose}
                  className={`
                    group relative flex items-center rounded-xl text-sm font-medium
                    transition-colors duration-200
                    ${showCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-2.5 py-2.5'}
                    ${isActive
                      ? 'bg-app-primary-soft text-app-primary'
                      : 'text-app-soft hover:bg-app-surface-2 hover:text-app'
                    }
                  `}
                  title={showCollapsed ? item.name : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-app-primary"
                      aria-hidden="true"
                    />
                  )}

                  <span
                    className={`
                      flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors duration-200
                      ${isActive
                        ? 'bg-app-primary text-app-on-primary shadow-sm'
                        : 'bg-app-surface-2 text-app-muted group-hover:text-app group-hover:bg-app-surface-3'
                      }
                    `}
                  >
                    {item.icon}
                  </span>

                  {!showCollapsed && (
                    <span className="min-w-0 flex-1 truncate leading-tight">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
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

  const navSections = useMemo(() => {
    const role = userProfile?.role || 'user';

    if (role === 'admin') {
      return [
        {
          id: 'workspace',
          label: 'Workspace',
          items: [
            {
              name: 'Overview',
              href: '/admin?tab=overview',
              tab: 'overview',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
              ),
            },
            {
              name: 'All Tickets',
              href: '/admin?tab=tickets',
              tab: 'tickets',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
            },
            {
              name: 'User Management',
              href: '/admin?tab=users',
              tab: 'users',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              ),
            },
            {
              name: 'Departments',
              href: '/admin?tab=departments',
              tab: 'departments',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ),
            },
            {
              name: 'Designations',
              href: '/admin?tab=designations',
              tab: 'designations',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              ),
            },
          ],
        },
        {
          id: 'insights',
          label: 'Insights',
          items: [
            {
              name: 'Executive Dashboard',
              href: '/management',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              ),
            },
            {
              name: 'Feedback Analytics',
              href: '/admin?tab=feedback',
              tab: 'feedback',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
            },
            {
              name: 'Admin Logs',
              href: '/admin?tab=logs',
              tab: 'logs',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              ),
            },
          ],
        },
      ];
    }

    if (role === 'manager') {
      return [
        {
          id: 'management',
          label: 'Management',
          items: [
            {
              name: 'Management Dashboard',
              href: '/management',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
            },
          ],
        },
      ];
    }

    return [
      {
        id: 'user',
        label: 'Workspace',
        items: [
          {
            name: 'User Dashboard',
            href: '/user',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
            ),
          },
        ],
      },
    ];
  }, [userProfile?.role]);

  if (!mounted) return null;

  const displayName = userProfile?.name || currentUser?.email || 'User';
  const photoURL = userProfile?.photoURL || userProfile?.photo_url;
  const role = userProfile?.role || 'user';

  return (
    <>
      <aside
        className={`
          fixed top-12 sm:top-14 left-0 bottom-0 z-40
          flex flex-col bg-app-header/95 backdrop-blur-xl
          border-r border-app-subtle shadow-2xl
          sidebar-transition
          transition-transform duration-300 ease-out
          ${showCollapsed ? 'w-[4.5rem]' : 'w-72 max-w-[88vw]'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        aria-label="Main navigation"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-app-primary" aria-hidden="true" />

        {/* Header */}
        <div
          className={`
            flex flex-shrink-0 items-center border-b border-app-subtle
            ${showCollapsed ? 'justify-center px-2 py-3' : 'justify-between gap-2 px-4 py-3.5'}
          `}
        >
          {!showCollapsed ? (
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                className="flex min-w-0 items-center gap-3 group"
                onClick={onMobileClose}
              >
                <FpdcLogo
                  size="sm"
                  className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold tracking-tight text-app">FPDC Helpdesk</p>
                  <p className="truncate text-[11px] text-app-muted">Enterprise IT Support</p>
                </div>
              </Link>
            </div>
          ) : (
            <Link
              href="/"
              className="flex items-center justify-center rounded-xl p-1 transition-transform duration-200 hover:scale-105"
              onClick={onMobileClose}
              title="FPDC Helpdesk"
            >
              <FpdcLogo size="sm" />
            </Link>
          )}

          <div className={`flex items-center gap-1 ${showCollapsed ? 'hidden' : ''}`}>
            <button
              type="button"
              onClick={onMobileClose}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl text-app-muted transition-colors hover:bg-app-surface-2 hover:text-app"
              aria-label="Close navigation menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl text-app-muted transition-colors hover:bg-app-surface-2 hover:text-app"
              aria-label="Collapse sidebar"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {showCollapsed && (
          <div className="hidden lg:flex justify-center px-2 pt-3">
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-app-muted transition-colors hover:bg-app-surface-2 hover:text-app"
              aria-label="Expand sidebar"
            >
              <svg className="h-4 w-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-2.5 py-4">
          <Suspense fallback={<NavSkeletonStrip />}>
            <SidebarNavLinks
              sections={navSections}
              pathname={pathname}
              showCollapsed={showCollapsed}
              onMobileClose={onMobileClose}
            />
          </Suspense>
        </nav>

        {/* Footer account */}
        {currentUser && (
          <div className={`flex-shrink-0 border-t border-app-subtle ${showCollapsed ? 'p-2' : 'p-3'}`}>
            {!showCollapsed ? (
              <div className="mb-3 rounded-xl border border-app-subtle bg-app-surface-2/50 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt={displayName}
                      className="h-9 w-9 flex-shrink-0 rounded-full object-cover border border-app-subtle"
                    />
                  ) : (
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-app-primary text-sm font-semibold text-app-on-primary">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-app">{displayName}</p>
                    <span
                      className={`mt-1 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${roleBadgeClass(role)}`}
                    >
                      {roleLabel(role)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-2 flex justify-center" title={displayName}>
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName}
                    className="h-9 w-9 rounded-full object-cover border border-app-subtle"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-app-primary text-sm font-semibold text-app-on-primary">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}

            <div className={`grid gap-1.5 ${showCollapsed ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <Link
                href="/profile"
                onClick={onMobileClose}
                className={`
                  flex items-center justify-center rounded-xl border border-app-subtle bg-app-surface-2/40
                  text-app-soft transition-colors hover:border-app-primary/40 hover:bg-app-surface-2 hover:text-app
                  ${showCollapsed ? 'h-10 w-full' : 'gap-2 px-3 py-2.5 text-xs font-medium'}
                `}
                title="Profile"
              >
                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {!showCollapsed && <span>Profile</span>}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className={`
                  flex items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10
                  text-rose-500 transition-colors hover:bg-rose-500/20 hover:text-rose-400
                  ${showCollapsed ? 'h-10 w-full' : 'gap-2 px-3 py-2.5 text-xs font-medium'}
                `}
                title="Sign out"
              >
                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {!showCollapsed && <span>Sign out</span>}
              </button>
            </div>
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
