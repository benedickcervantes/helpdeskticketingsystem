// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FcdcLogo } from '@/lib/ui/FcdcLogo';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NotificationCenter from '@/shell/notifications/NotificationCenter';

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();

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

  // Close mobile sidebar on route change
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
        fixed top-14 sm:top-16 left-0 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 z-50
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16 lg:w-16' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        shadow-2xl
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          {!isCollapsed && (
            <Link href="/" className="flex items-center space-x-3 group">
              <FcdcLogo
                size="sm"
                className="group-hover:shadow-xl group-hover:scale-105 transition-all duration-300"
              />
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
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onMobileClose}
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
            {/* Profile Settings Link */}
            <Link
              href="/profile"
              onClick={onMobileClose}
              className={`
                flex items-center w-full p-3 mb-3 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/30
                hover:bg-gray-700/50 transition-colors duration-200 text-gray-300 hover:text-white
                ${isCollapsed ? 'justify-center' : 'space-x-3'}
              `}
              title={isCollapsed ? 'Profile Settings' : ''}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {!isCollapsed && <span>Profile Settings</span>}
            </Link>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className={`
                flex items-center w-full p-3 rounded-xl bg-red-500/10 border border-red-500/30
                hover:bg-red-500/20 transition-colors duration-200 text-red-400 hover:text-red-300
                ${isCollapsed ? 'justify-center' : 'space-x-3'}
              `}
              title={isCollapsed ? 'Sign Out' : ''}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 713-3h4a3 3 0 713 3v1" />
              </svg>
              {!isCollapsed && <span>Sign Out</span>}
            </button>
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
