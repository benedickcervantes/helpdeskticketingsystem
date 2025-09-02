// src/app/components/Layout/Sidebar.jsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { logout } from '../../utils/auth';
import {
  FiHome,
  FiPlusCircle,
  FiSettings,
  FiLogOut,
  FiX,
  FiChevronRight,
  FiUser,
  FiHelpCircle,
  FiBarChart2,
  FiBell,
  FiMessageSquare,
  FiCalendar,
  FiUsers,
  FiFileText,
  FiPieChart
} from 'react-icons/fi';

const Sidebar = ({ sidebarOpen, setSidebarOpen, user }) => {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/tickets', 
      icon: <FiHome size={20} />,
      badge: user?.unreadNotifications > 0 ? user.unreadNotifications : null
    },
    { 
      name: 'New Ticket', 
      href: '/tickets?new=true', 
      icon: <FiPlusCircle size={20} /> 
    },
    { 
      name: 'Tickets', 
      href: '/tickets/list', 
      icon: <FiFileText size={20} />,
      submenu: [
        { name: 'All Tickets', href: '/tickets' },
        { name: 'My Tickets', href: '/tickets/me' },
        { name: 'Open Tickets', href: '/tickets/open' },
        { name: 'Resolved', href: '/tickets/resolved' }
      ]
    },
    { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: <FiBarChart2 size={20} /> 
    },
    { 
      name: 'Calendar', 
      href: '/calendar', 
      icon: <FiCalendar size={20} /> 
    },
    { 
      name: 'Team', 
      href: '/team', 
      icon: <FiUsers size={20} /> 
    },
    ...(user?.role === 'admin' ? [
      { 
        name: 'Admin', 
        href: '/admin', 
        icon: <FiSettings size={20} />,
        submenu: [
          { name: 'Users', href: '/admin/users' },
          { name: 'Settings', href: '/admin/settings' },
          { name: 'Reports', href: '/admin/reports' }
        ]
      }
    ] : []),
  ];

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
  };

  const isActive = (href) => {
    if (href === '/tickets' && pathname === '/') return true;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const toggleSubmenu = (itemName) => {
    setActiveSubmenu(activeSubmenu === itemName ? null : itemName);
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-900 bg-opacity-50 lg:bg-opacity-0 lg:pointer-events-none lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 transform transition-all duration-300 ease-in-out 
          lg:static lg:inset-0 lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          ${isHovered ? 'lg:w-72' : 'lg:w-20'}
          group/sidebar
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600">
          <div className="flex items-center min-w-0">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <span className="text-blue-600 font-bold text-lg">F</span>
            </div>
            <span className={`text-white font-semibold truncate transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'lg:opacity-0'
            }`}>
              Federal Pioneer
            </span>
          </div>
          <button
            className="text-white lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX size={20} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="mt-8 px-4 space-y-1">
          {navigation.map((item) => {
            const hasSubmenu = item.submenu;
            const isItemActive = isActive(item.href) || (hasSubmenu && item.submenu.some(sub => isActive(sub.href)));
            
            return (
              <div key={item.name}>
                <Link
                  href={hasSubmenu ? '#' : item.href}
                  onClick={(e) => {
                    if (hasSubmenu) {
                      e.preventDefault();
                      toggleSubmenu(item.name);
                    } else {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${isItemActive 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <div className="relative">
                    {item.icon}
                    {item.badge && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`ml-3 transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'lg:opacity-0'
                  }`}>
                    {item.name}
                  </span>
                  {hasSubmenu && (
                    <FiChevronRight 
                      size={16} 
                      className={`ml-auto transition-transform duration-200 ${
                        activeSubmenu === item.name ? 'rotate-90' : ''
                      } ${isHovered ? 'opacity-100' : 'lg:opacity-0'}`} 
                    />
                  )}
                </Link>

                {/* Submenu */}
                {hasSubmenu && activeSubmenu === item.name && (
                  <div className="ml-8 mt-1 space-y-1 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-200
                          ${isActive(subItem.href)
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                          }
                        `}
                      >
                        <span className={`transition-opacity duration-300 ${
                          isHovered ? 'opacity-100' : 'lg:opacity-0'
                        }`}>
                          {subItem.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Help Section */}
        <div className="px-4 mt-8">
          <Link
            href="/help"
            className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors duration-200"
          >
            <FiHelpCircle size={20} />
            <span className={`ml-3 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'lg:opacity-0'
            }`}>
              Help & Support
            </span>
          </Link>
        </div>
        
        {/* User Section */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center min-w-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3 flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className={`min-w-0 transition-opacity duration-300 ${
                isHovered ? 'opacity-100' : 'lg:opacity-0'
              }`}>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role || 'User'}
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
          >
            <FiLogOut size={16} className="flex-shrink-0" />
            <span className={`ml-2 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'lg:opacity-0'
            }`}>
              Sign out
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;