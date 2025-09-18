'use client';

import React, { useState, useEffect } from 'react';

// Responsive Wrapper Component
export const ResponsiveWrapper = ({ 
  children, 
  className = '',
  breakpoint = 'md'
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640); // sm breakpoint
      setIsTablet(width >= 640 && width < 1024); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const responsiveClasses = {
    mobile: isMobile ? 'mobile-optimized' : '',
    tablet: isTablet ? 'tablet-optimized' : '',
    desktop: !isMobile && !isTablet ? 'desktop-optimized' : ''
  };

  return (
    <div className={`responsive-wrapper ${responsiveClasses.mobile} ${responsiveClasses.tablet} ${responsiveClasses.desktop} ${className}`}>
      {children}
    </div>
  );
};

// Mobile-First Container
export const MobileFirstContainer = ({ 
  children, 
  className = '',
  maxWidth = '7xl'
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClasses[maxWidth]} ${className}`}>
      {children}
    </div>
  );
};

// Responsive Grid Component
export const ResponsiveGrid = ({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = ''
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const gridCols = {
    mobile: `grid-cols-${cols.mobile}`,
    tablet: `sm:grid-cols-${cols.tablet}`,
    desktop: `lg:grid-cols-${cols.desktop}`
  };

  return (
    <div className={`grid ${gridCols.mobile} ${gridCols.tablet} ${gridCols.desktop} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

// Responsive Text Component
export const ResponsiveText = ({ 
  children, 
  variant = 'body',
  className = ''
}) => {
  const variants = {
    h1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold',
    h2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold',
    h3: 'text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold',
    h4: 'text-base sm:text-lg md:text-xl lg:text-2xl font-semibold',
    body: 'text-sm sm:text-base md:text-lg',
    small: 'text-xs sm:text-sm md:text-base',
    caption: 'text-xs sm:text-sm'
  };

  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

// Touch-Friendly Component
export const TouchFriendly = ({ 
  children, 
  minSize = 44,
  className = ''
}) => {
  return (
    <div 
      className={`touch-friendly ${className}`}
      style={{ minHeight: `${minSize}px`, minWidth: `${minSize}px` }}
    >
      {children}
    </div>
  );
};

// Responsive Spacing Component
export const ResponsiveSpacing = ({ 
  children, 
  padding = { mobile: 'sm', tablet: 'md', desktop: 'lg' },
  margin = { mobile: 'sm', tablet: 'md', desktop: 'lg' },
  className = ''
}) => {
  const spacingClasses = {
    sm: 'p-2 m-2',
    md: 'p-4 m-4',
    lg: 'p-6 m-6',
    xl: 'p-8 m-8'
  };

  const mobileClasses = spacingClasses[padding.mobile] || spacingClasses.md;
  const tabletClasses = `sm:${spacingClasses[padding.tablet] || spacingClasses.md}`;
  const desktopClasses = `lg:${spacingClasses[padding.desktop] || spacingClasses.lg}`;

  return (
    <div className={`${mobileClasses} ${tabletClasses} ${desktopClasses} ${className}`}>
      {children}
    </div>
  );
};

// Responsive Visibility Component
export const ResponsiveVisibility = ({ 
  children, 
  show = { mobile: true, tablet: true, desktop: true },
  className = ''
}) => {
  const visibilityClasses = {
    mobile: show.mobile ? 'block' : 'hidden',
    tablet: show.tablet ? 'sm:block' : 'sm:hidden',
    desktop: show.desktop ? 'lg:block' : 'lg:hidden'
  };

  return (
    <div className={`${visibilityClasses.mobile} ${visibilityClasses.tablet} ${visibilityClasses.desktop} ${className}`}>
      {children}
    </div>
  );
};

// Responsive Image Component
export const ResponsiveImage = ({ 
  src, 
  alt, 
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
}) => {
  return (
    <img
      src={src}
      alt={alt}
      className={`w-full h-auto ${className}`}
      sizes={sizes}
      loading="lazy"
    />
  );
};

// Responsive Card Component
export const ResponsiveCard = ({ 
  children, 
  className = '',
  padding = { mobile: 'sm', tablet: 'md', desktop: 'lg' },
  hover = true
}) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-4 sm:p-6 lg:p-8'
  };

  const hoverClass = hover ? 'card-hover' : '';

  return (
    <div className={`glass-card rounded-xl ${paddingClasses[padding.mobile]} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};
