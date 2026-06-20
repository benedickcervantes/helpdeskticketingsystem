// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { ShellProvider, useShell } from '@/contexts/ShellContext';
import Sidebar from '@/shell/layout/Sidebar';
import Header from '@/shell/layout/Header';
import PopupMenu from '@/shell/layout/PopupMenu';

function AppShellContent({ children }) {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  const {
    isSidebarOpen,
    closeSidebar,
    showSidebarToggle,
    isPopupMenuOpen,
    closePopupMenu,
    showPopupToggle,
  } = useShell();

  const isLandingPage = pathname === '/';
  const shouldShowSidebar =
    !!currentUser &&
    !isLandingPage &&
    (pathname === '/admin' || pathname === '/management');

  if (!currentUser || isLandingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-x-hidden">
        <Header />
        <main className="pt-14 sm:pt-16 pb-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-x-hidden">
      <Header />

      <div className="flex">
        {shouldShowSidebar && (
          <Sidebar
            isMobileOpen={isSidebarOpen}
            onMobileClose={closeSidebar}
          />
        )}

        <main
          className={`flex-1 min-w-0 transition-all duration-300 ease-in-out pt-14 sm:pt-16 pb-6 ${
            shouldShowSidebar ? 'lg:ml-64 ml-0' : 'ml-0'
          }`}
        >
          {children}
        </main>
      </div>

      {shouldShowSidebar && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {showPopupToggle && (
        <PopupMenu isOpen={isPopupMenuOpen} onClose={closePopupMenu} />
      )}
    </div>
  );
}

const AppShell = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ShellProvider>
      <AppShellContent>{children}</AppShellContent>
    </ShellProvider>
  );
};

export default AppShell;
