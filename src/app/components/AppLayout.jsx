'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

const AppLayout = ({ children }) => {
  const { currentUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Check if sidebar should be disabled for current path
  const shouldShowSidebar = () => {
    if (!currentUser) return false;
    
    // Disable sidebar for user dashboard
    if (pathname === '/user') return false;
    
    // Show sidebar for admin and management pages
    return pathname === '/admin' || pathname === '/management' || pathname === '/profile';
  };

  if (!mounted) return null;

  // For non-authenticated users - simple layout with header
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header />
        <main className="pt-16">
          {children}
        </main>
      </div>
    );
  }

  // For authenticated users - layout with header and conditional sidebar
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header - Always visible with conditional sidebar toggle */}
      <Header onSidebarToggle={shouldShowSidebar() ? toggleSidebar : null} />
      
      <div className="flex">
        {/* Sidebar - Only show for specific pages */}
        {shouldShowSidebar() && (
          <Sidebar 
            isMobileOpen={isSidebarOpen} 
            onMobileClose={() => setIsSidebarOpen(false)} 
          />
        )}
        
        {/* Main Content - Clean spacing from header */}
        <main className={`flex-1 transition-all duration-300 ease-in-out pt-16 ${
          shouldShowSidebar() ? 'lg:ml-64 ml-0' : 'ml-0'
        }`}>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay when sidebar is open */}
      {shouldShowSidebar() && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AppLayout;
