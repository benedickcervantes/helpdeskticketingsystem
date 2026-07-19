// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePathname } from 'next/navigation';
import { ShellProvider, useShell } from '@/contexts/ShellContext';
import Sidebar from '@/shell/layout/Sidebar';
import Header from '@/shell/layout/Header';
import PopupMenu from '@/shell/layout/PopupMenu';

function AppShellContent({ children }) {
  const { currentUser } = useAuth();
  const { shellStyle } = useTheme();
  const pathname = usePathname();
  const {
    isSidebarOpen,
    closeSidebar,
    isSidebarCollapsed,
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

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        closeSidebar();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [closeSidebar]);

  const sidebarMainOffset = shouldShowSidebar
    ? isSidebarCollapsed
      ? 'lg:ml-16'
      : 'lg:ml-64'
    : 'ml-0';

  if (!currentUser || isLandingPage) {
    return (
      <div className="min-h-screen bg-app-gradient text-app app-shell" style={shellStyle}>
        <Header />
        <main className="pt-0 lg:pt-14 pb-6 overflow-x-clip">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-gradient text-app app-shell" style={shellStyle}>
      <Header />

      <div className="flex pt-0 lg:pt-14 min-h-[calc(100vh-3rem)] sm:min-h-[calc(100vh-3.5rem)]">
        {shouldShowSidebar && (
          <Sidebar
            isMobileOpen={isSidebarOpen}
            onMobileClose={closeSidebar}
          />
        )}

        <main
          className={`flex-1 min-w-0 pb-6 overflow-x-clip transition-all duration-300 ease-in-out ${sidebarMainOffset}`}
        >
          {children}
        </main>
      </div>

      {shouldShowSidebar && isSidebarOpen && (
        <div
          className="fixed inset-0 top-12 sm:top-14 bg-black/60 z-30 lg:hidden"
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
