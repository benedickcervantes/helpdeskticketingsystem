'use client';

import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const TopBar = () => {
  const { currentUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Admin Dashboard';
    if (pathname === '/management') return 'Management Dashboard';
    if (pathname === '/user') return 'User';
    if (pathname === '/auth') return 'Authentication';
    return 'FCDC';
  };

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Home', href: '/' }];
    
    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const name = segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ name, href });
    });
    
    return breadcrumbs;
  };

  if (!mounted) return null;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-white">{getPageTitle()}</h1>
            <nav className="flex items-center space-x-2 text-sm hidden">
              {getBreadcrumbs().map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  {index > 0 && (
                    <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <span className={index === getBreadcrumbs().length - 1 ? 'text-white' : 'text-gray-400'}>
                    {crumb.name}
                  </span>
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
