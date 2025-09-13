'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import PopupMenu from './PopupMenu';

const AppLayout = ({ children }) => {
  const { currentUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPopupMenuOpen, setIsPopupMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const togglePopupMenu = () => {
    setIsPopupMenuOpen(!isPopupMenuOpen);
  };

  const closePopupMenu = () => {
    setIsPopupMenuOpen(false);
  };

  // Check if sidebar should be disabled for current path
  const shouldShowSidebar = () => {
    if (!currentUser) return false;
    
    // Show sidebar for admin and management pages
    return pathname === '/admin' || pathname === '/management' || pathname === '/profile';
  };

  // Check if popup menu should be available (only on landing page for authenticated users)
  const shouldShowPopupMenu = () => {
    if (!currentUser) return false;
    
    // Only show popup menu on landing page (home page)
    // Disable on dashboard pages: /user, /admin, /management
    return pathname === '/';
  };

  if (!mounted) return null;

  // For non-authenticated users - simple layout with header
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header />
        <main className="pt-16 pb-6">
          {children}
        </main>
      </div>
    );
  }

  // For authenticated users - layout with header and conditional sidebar
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header - Popup menu only available on landing page */}
      <Header 
        onSidebarToggle={shouldShowPopupMenu() ? togglePopupMenu : null} 
        isSidebarOpen={isPopupMenuOpen}
      />
      
      <div className="flex">
        {/* Sidebar - Only show for specific pages */}
        {shouldShowSidebar() && (
          <Sidebar 
            isMobileOpen={isSidebarOpen} 
            onMobileClose={() => setIsSidebarOpen(false)} 
          />
        )}
        
        {/* Main Content - FINE-TUNED SPACING FROM HEADER AND BOTTOM */}
        <main className={`flex-1 transition-all duration-300 ease-in-out pt-14 pb-6 ${
          shouldShowSidebar() ? 'lg:ml-64 ml-0' : 'ml-0'
        }`}>
          {children}
        </main>
      </div>

      {/* Mobile overlay when sidebar is open (only for pages with sidebar) */}
      {shouldShowSidebar() && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Popup Menu Overlay - Only available on landing page */}
      {shouldShowPopupMenu() && (
        <PopupMenu 
          isOpen={isPopupMenuOpen} 
          onClose={closePopupMenu} 
        />
      )}
    </div>
  );
};

export default AppLayout;
