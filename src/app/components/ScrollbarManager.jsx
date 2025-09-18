'use client';

import { useEffect } from 'react';

// Custom hook to manage scrollbars based on screen size
export const useScrollbarManager = (hideOnDesktop = true) => {
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      
      if (hideOnDesktop && isDesktop) {
        // Hide scrollbars on desktop
        document.documentElement.style.setProperty('--scrollbar-width', '0px');
        document.body.classList.add('hide-scrollbar-desktop');
      } else {
        // Show scrollbars on mobile/tablet
        document.documentElement.style.setProperty('--scrollbar-width', '8px');
        document.body.classList.remove('hide-scrollbar-desktop');
      }
    };

    // Initial call
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      // Cleanup
      document.documentElement.style.removeProperty('--scrollbar-width');
      document.body.classList.remove('hide-scrollbar-desktop');
    };
  }, [hideOnDesktop]);
};

// Component wrapper for scrollbar management
export const ScrollbarManager = ({ children, hideOnDesktop = true }) => {
  useScrollbarManager(hideOnDesktop);
  
  return (
    <div className={`scrollbar-manager ${hideOnDesktop ? 'hide-scrollbar-desktop' : ''}`}>
      {children}
    </div>
  );
};
