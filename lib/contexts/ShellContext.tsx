// @ts-nocheck
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ShellContextValue {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  showSidebarToggle: boolean;
  isPopupMenuOpen: boolean;
  togglePopupMenu: () => void;
  closePopupMenu: () => void;
  showPopupToggle: boolean;
}

const ShellContext = createContext<ShellContextValue | undefined>(undefined);

export function ShellProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPopupMenuOpen, setIsPopupMenuOpen] = useState(false);

  const showSidebarToggle =
    !!currentUser && (pathname === '/admin' || pathname === '/management');

  const showPopupToggle = false;

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const togglePopupMenu = useCallback(() => {
    setIsPopupMenuOpen((prev) => !prev);
  }, []);

  const closePopupMenu = useCallback(() => {
    setIsPopupMenuOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isSidebarOpen,
      toggleSidebar,
      closeSidebar,
      isSidebarCollapsed,
      toggleSidebarCollapsed,
      showSidebarToggle,
      isPopupMenuOpen,
      togglePopupMenu,
      closePopupMenu,
      showPopupToggle,
    }),
    [
      isSidebarOpen,
      toggleSidebar,
      closeSidebar,
      isSidebarCollapsed,
      toggleSidebarCollapsed,
      showSidebarToggle,
      isPopupMenuOpen,
      togglePopupMenu,
      closePopupMenu,
      showPopupToggle,
    ],
  );

  return (
    <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
  );
}

export function useShell(): ShellContextValue {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error('useShell must be used within a ShellProvider');
  }
  return context;
}

export function useShellOptional(): ShellContextValue | undefined {
  return useContext(ShellContext);
}
