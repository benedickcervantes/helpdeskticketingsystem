'use client';

import React from 'react';

// Modern Spinner Component
export const ModernSpinner = ({ size = 'md', color = 'emerald', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    emerald: 'border-emerald-500',
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    red: 'border-red-500',
    white: 'border-white'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className={`absolute inset-0 border-4 ${colorClasses[color]}/20 rounded-full`}></div>
      <div className={`absolute inset-0 border-4 border-transparent rounded-full border-t-${colorClasses[color].split('-')[1]}-500 animate-spin`}></div>
    </div>
  );
};

// Pulse Spinner with multiple rings
export const PulseSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full animate-ping"></div>
      <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
      <div className="absolute inset-0 border-2 border-emerald-500/70 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
      <div className="absolute inset-0 border-2 border-emerald-500 rounded-full animate-ping" style={{animationDelay: '0.6s'}}></div>
    </div>
  );
};

// Enhanced Skeleton Components
export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600 p-4 md:p-6 skeleton-shimmer ${className}`}>
    <div className="animate-pulse">
      <div className="h-4 bg-gray-600 rounded w-3/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-600 rounded w-full"></div>
        <div className="h-3 bg-gray-600 rounded w-5/6"></div>
        <div className="h-3 bg-gray-600 rounded w-4/6"></div>
      </div>
      <div className="mt-4 flex space-x-2">
        <div className="h-6 bg-gray-600 rounded-full w-16"></div>
        <div className="h-6 bg-gray-600 rounded-full w-20"></div>
      </div>
    </div>
  </div>
);

export const SkeletonChart = ({ height = 250, className = '' }) => (
  <div className={`bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600 p-4 md:p-6 skeleton-shimmer ${className}`}>
    <div className="animate-pulse">
      <div className="h-6 bg-gray-600 rounded w-1/3 mb-4"></div>
      <div className="relative" style={{ height: `${height}px` }}>
        <div className="absolute bottom-0 left-0 w-full h-full bg-gray-600/20 rounded"></div>
        <div className="absolute bottom-0 left-0 w-full h-3/4 bg-gray-600/30 rounded"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gray-600/40 rounded"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gray-600/50 rounded"></div>
      </div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, className = '' }) => (
  <div className={`bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600 p-4 md:p-6 skeleton-shimmer ${className}`}>
    <div className="animate-pulse">
      <div className="h-6 bg-gray-600 rounded w-1/4 mb-4"></div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex space-x-4 animate-fade-in-up" style={{animationDelay: `${i * 0.1}s`}}>
            <div className="h-4 bg-gray-600 rounded w-1/4"></div>
            <div className="h-4 bg-gray-600 rounded w-1/3"></div>
            <div className="h-4 bg-gray-600 rounded w-1/6"></div>
            <div className="h-4 bg-gray-600 rounded w-1/5"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Main Loading Screen with enhanced animations
export const MainLoadingScreen = ({ message = 'Loading...', showProgress = false, progress = 0 }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    <div className="text-center animate-fade-in-up">
      <div className="relative mb-8">
        <PulseSpinner size="xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-emerald-500 rounded-full animate-pulse-glow"></div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2 animate-slide-in-right">{message}</h2>
      <p className="text-gray-400 mb-6 animate-slide-in-right animate-stagger-1">Please wait while we prepare everything for you</p>
      
      {showProgress && (
        <div className="w-64 mx-auto animate-scale-in animate-stagger-2">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Loading</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      <div className="mt-8 flex justify-center space-x-1 animate-fade-in-up animate-stagger-3">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  </div>
);

// Enhanced Button Loading State
export const ButtonLoading = ({ loading, children, className = '' }) => (
  <button 
    disabled={loading}
    className={`relative overflow-hidden loading-transition ${className}`}
  >
    {loading && (
      <div className="absolute inset-0 bg-gray-600/50 flex items-center justify-center">
        <ModernSpinner size="sm" color="white" />
      </div>
    )}
    <span className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}>
      {children}
    </span>
  </button>
);

// Progressive Loading Container with staggered animations
export const ProgressiveLoader = ({ isLoading, children, skeleton, delay = 0 }) => {
  const [showContent, setShowContent] = React.useState(!isLoading);

  React.useEffect(() => {
    if (isLoading) {
      setShowContent(false);
      const timer = setTimeout(() => {
        setShowContent(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setShowContent(true);
    }
  }, [isLoading, delay]);

  if (isLoading && !showContent) {
    return skeleton || <SkeletonCard />;
  }

  return (
    <div className={`loading-transition ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
};

// Enhanced Loading Dots with better animation
export const LoadingDots = ({ className = '' }) => (
  <div className={`flex space-x-1 ${className}`}>
    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
  </div>
);

// Enhanced Chart Loading Skeleton with better animations
export const ChartSkeleton = ({ type = 'line', height = 250, className = '' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'pie':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="w-32 h-32 bg-gray-600 rounded-full animate-pulse-glow"></div>
          </div>
        );
      case 'bar':
        return (
          <div className="flex items-end justify-between h-full space-x-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div 
                key={i}
                className="bg-gray-600 rounded-t animate-fade-in-up"
                style={{ 
                  height: `${Math.random() * 80 + 20}%`,
                  width: '12%',
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
          </div>
        );
      default: // line
        return (
          <div className="relative h-full">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6b7280" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#6b7280" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#6b7280" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path
                d="M 0,150 Q 100,50 200,100 T 400,80"
                stroke="url(#gradient)"
                strokeWidth="3"
                fill="none"
                className="animate-pulse"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className={`bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600 p-4 md:p-6 skeleton-shimmer ${className}`}>
      <div className="animate-pulse">
        <div className="h-6 bg-gray-600 rounded w-1/3 mb-4"></div>
        <div style={{ height: `${height}px` }}>
          {renderSkeleton()}
        </div>
      </div>
    </div>
  );
};

// Shimmer Effect Component
export const ShimmerEffect = ({ className = '' }) => (
  <div className={`relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
  </div>
);

// Loading State Manager for complex components
export const LoadingStateManager = ({ 
  isLoading, 
  children, 
  skeleton, 
  delay = 0,
  showProgress = false,
  progress = 0 
}) => {
  const [showContent, setShowContent] = React.useState(!isLoading);

  React.useEffect(() => {
    if (isLoading) {
      setShowContent(false);
      const timer = setTimeout(() => {
        setShowContent(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setShowContent(true);
    }
  }, [isLoading, delay]);

  if (isLoading && !showContent) {
    return (
      <div className="animate-fade-in-up">
        {skeleton || <SkeletonCard />}
        {showProgress && (
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`loading-transition ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
};
