'use client';

import React from 'react';

// Enhanced Modern Spinner Component with multiple variants
export const ModernSpinner = ({ size = 'md', color = 'emerald', variant = 'spinner', className = '' }) => {
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
    white: 'border-white',
    cyan: 'border-cyan-500'
  };

  if (variant === 'dots') {
    return (
      <div className={`flex space-x-1 ${sizeClasses[size]} ${className}`}>
        <div className={`w-2 h-2 bg-${colorClasses[color].split('-')[1]}-500 rounded-full animate-bounce`}></div>
        <div className={`w-2 h-2 bg-${colorClasses[color].split('-')[1]}-500 rounded-full animate-bounce`} style={{animationDelay: '0.1s'}}></div>
        <div className={`w-2 h-2 bg-${colorClasses[color].split('-')[1]}-500 rounded-full animate-bounce`} style={{animationDelay: '0.2s'}}></div>
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className={`flex space-x-1 items-end ${sizeClasses[size]} ${className}`}>
        <div className={`w-1 bg-${colorClasses[color].split('-')[1]}-500 rounded-full animate-pulse`} style={{height: '60%', animationDelay: '0s'}}></div>
        <div className={`w-1 bg-${colorClasses[color].split('-')[1]}-500 rounded-full animate-pulse`} style={{height: '80%', animationDelay: '0.1s'}}></div>
        <div className={`w-1 bg-${colorClasses[color].split('-')[1]}-500 rounded-full animate-pulse`} style={{height: '100%', animationDelay: '0.2s'}}></div>
        <div className={`w-1 bg-${colorClasses[color].split('-')[1]}-500 rounded-full animate-pulse`} style={{height: '70%', animationDelay: '0.3s'}}></div>
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className={`absolute inset-0 border-4 ${colorClasses[color]}/20 rounded-full`}></div>
      <div className={`absolute inset-0 border-4 border-transparent rounded-full border-t-${colorClasses[color].split('-')[1]}-500 animate-spin`}></div>
    </div>
  );
};

// Enhanced Pulse Spinner with multiple rings and glow effect
export const PulseSpinner = ({ size = 'md', className = '', glow = true }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {glow && (
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-sm animate-pulse-glow"></div>
      )}
      <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full animate-ping"></div>
      <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
      <div className="absolute inset-0 border-2 border-emerald-500/70 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
      <div className="absolute inset-0 border-2 border-emerald-500 rounded-full animate-ping" style={{animationDelay: '0.6s'}}></div>
    </div>
  );
};

// New: Morphing Spinner - transitions between different shapes
export const MorphingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className="absolute inset-0 animate-morphing-spinner">
        <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full opacity-80"></div>
      </div>
    </div>
  );
};

// Enhanced Skeleton Components with better animations
export const SkeletonCard = ({ className = '', animated = true }) => (
  <div className={`bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600 p-4 md:p-6 ${animated ? 'skeleton-shimmer' : ''} ${className}`}>
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

export const SkeletonChart = ({ height = 250, className = '', type = 'line' }) => {
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

// Enhanced Main Loading Screen with better animations
export const MainLoadingScreen = ({ message = 'Loading...', showProgress = false, progress = 0, variant = 'pulse' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
    {/* Animated background particles */}
    <div className="absolute inset-0">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-emerald-500/20 rounded-full animate-float-up"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`
          }}
        ></div>
      ))}
    </div>
    
    <div className="text-center animate-fade-in-up relative z-10">
      <div className="relative mb-8">
        {variant === 'morphing' ? (
          <MorphingSpinner size="xl" />
        ) : (
          <PulseSpinner size="xl" />
        )}
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
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
            </div>
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

// Enhanced Button Loading State with multiple variants
export const ButtonLoading = ({ 
  loading, 
  children, 
  className = '', 
  variant = 'overlay',
  loadingText = 'Loading...',
  spinnerVariant = 'spinner'
}) => {
  if (variant === 'replace') {
    return (
      <button 
        disabled={loading}
        className={`relative overflow-hidden loading-transition ${className}`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <ModernSpinner size="sm" color="white" variant={spinnerVariant} />
            <span className="ml-2">{loadingText}</span>
          </div>
        ) : (
          children
        )}
      </button>
    );
  }

  return (
    <button 
      disabled={loading}
      className={`relative overflow-hidden loading-transition ${className}`}
    >
      {loading && (
        <div className="absolute inset-0 bg-gray-600/50 backdrop-blur-sm flex items-center justify-center">
          <ModernSpinner size="sm" color="white" variant={spinnerVariant} />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}>
        {children}
      </span>
    </button>
  );
};

// New: Smart Button Component with built-in loading states
export const SmartButton = ({ 
  children, 
  loading = false, 
  loadingText = 'Loading...',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon,
  iconPosition = 'left',
  ...props 
}) => {
  const baseClasses = "relative overflow-hidden font-medium rounded-xl transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
    xl: 'px-8 py-5 text-xl'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl focus:ring-emerald-500 hover:-translate-y-0.5',
    secondary: 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-emerald-500/30 text-white shadow-lg hover:shadow-xl focus:ring-gray-500 hover:-translate-y-0.5',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl focus:ring-red-500 hover:-translate-y-0.5',
    ghost: 'bg-transparent hover:bg-gray-700/50 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white focus:ring-gray-500',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl focus:ring-green-500 hover:-translate-y-0.5'
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <ModernSpinner size="sm" color="white" variant="dots" />
        </div>
      )}
      
      <div className={`flex items-center justify-center ${loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}`}>
        {icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        {loading ? loadingText : children}
        {icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </div>
    </button>
  );
};

// Progressive Loading Container with staggered animations
export const ProgressiveLoader = ({ isLoading, children, skeleton, delay = 0, animation = 'fade' }) => {
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

  const animationClasses = {
    fade: showContent ? 'opacity-100' : 'opacity-0',
    slide: showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
    scale: showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
  };

  return (
    <div className={`loading-transition ${animationClasses[animation]}`}>
      {children}
    </div>
  );
};

// Enhanced Loading Dots with better animation
export const LoadingDots = ({ className = '', color = 'emerald' }) => (
  <div className={`flex space-x-1 ${className}`}>
    <div className={`w-2 h-2 bg-${color}-500 rounded-full animate-bounce`}></div>
    <div className={`w-2 h-2 bg-${color}-500 rounded-full animate-bounce`} style={{animationDelay: '0.1s'}}></div>
    <div className={`w-2 h-2 bg-${color}-500 rounded-full animate-bounce`} style={{animationDelay: '0.2s'}}></div>
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
  progress = 0,
  animation = 'fade'
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
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const animationClasses = {
    fade: showContent ? 'opacity-100' : 'opacity-0',
    slide: showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
    scale: showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
  };

  return (
    <div className={`loading-transition ${animationClasses[animation]}`}>
      {children}
    </div>
  );
};

// New: Page Transition Loader
export const PageTransitionLoader = ({ isVisible, children }) => (
  <div className={`fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <MorphingSpinner size="xl" />
        <p className="mt-4 text-white text-lg">Loading...</p>
      </div>
    </div>
  </div>
);

// New: Refresh Button Component
export const RefreshButton = ({ 
  onRefresh, 
  loading = false, 
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <button
      onClick={onRefresh}
      disabled={loading}
      className={`${sizeClasses[size]} rounded-full bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-emerald-500/30 text-gray-400 hover:text-emerald-400 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <ModernSpinner size="sm" color="emerald" variant="spinner" />
      ) : (
        <svg 
          className={`w-5 h-5 transition-transform duration-300 ${loading ? 'animate-spin' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
    </button>
  );
};
