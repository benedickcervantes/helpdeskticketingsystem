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

// =====================================================================
// ENHANCED LOADING SYSTEM IMPROVEMENTS - ADDED BY CLAUDE
// =====================================================================

// New: Intelligent Loading Manager with Context Awareness
export const IntelligentLoadingManager = ({ 
  isLoading, 
  loadingType = 'default',
  context = 'general',
  children, 
  timeout = 30000,
  retryFunction = null,
  className = ''
}) => {
  const [loadingState, setLoadingState] = React.useState('loading');
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [showRetry, setShowRetry] = React.useState(false);

  // Context-aware loading messages
  const getContextualMessage = () => {
    const messages = {
      authentication: {
        loading: 'Verifying your credentials...',
        slow: 'Still authenticating, please wait...',
        timeout: 'Authentication is taking longer than expected'
      },
      tickets: {
        loading: 'Loading your tickets...',
        slow: 'Fetching ticket data, please wait...',
        timeout: 'Having trouble loading tickets'
      },
      analytics: {
        loading: 'Generating analytics...',
        slow: 'Processing data, this may take a moment...',
        timeout: 'Analytics generation is taking longer than expected'
      },
      saving: {
        loading: 'Saving your changes...',
        slow: 'Still saving, please don\'t close this window...',
        timeout: 'Save operation is taking longer than expected'
      },
      default: {
        loading: 'Loading...',
        slow: 'This is taking longer than usual...',
        timeout: 'Operation is taking longer than expected'
      }
    };

    const contextMessages = messages[context] || messages.default;
    
    if (elapsedTime > 10000) return contextMessages.timeout;
    if (elapsedTime > 5000) return contextMessages.slow;
    return contextMessages.loading;
  };

  React.useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0);
      setLoadingState('loading');
      setShowRetry(false);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1000);
    }, 1000);

    const timeoutTimer = setTimeout(() => {
      setLoadingState('timeout');
      setShowRetry(true);
    }, timeout);

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutTimer);
    };
  }, [isLoading, timeout]);

  if (!isLoading) {
    return (
      <div className={`transition-all duration-300 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`min-h-[200px] flex items-center justify-center ${className}`}>
      <div className="text-center max-w-md mx-auto p-6">
        {/* Advanced Spinner with Context */}
        <div className="relative mb-6">
          {loadingType === 'advanced' ? (
            <div className="relative">
              <MorphingSpinner size="xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-xs text-emerald-400 font-mono">
                  {Math.floor(elapsedTime / 1000)}s
                </div>
              </div>
            </div>
          ) : (
            <PulseSpinner size="lg" glow={true} />
          )}
        </div>

        {/* Context-aware messaging */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">
            {getContextualMessage()}
          </h3>
          
          {elapsedTime > 3000 && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span>Processing... ({Math.floor(elapsedTime / 1000)}s)</span>
            </div>
          )}

          {/* Progress estimation */}
          {elapsedTime > 2000 && (
            <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-1.5 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${Math.min((elapsedTime / timeout) * 100, 90)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
              </div>
            </div>
          )}
        </div>

        {/* Retry option for timeouts */}
        {showRetry && retryFunction && (
          <div className="mt-6 space-y-3">
            <p className="text-yellow-400 text-sm">
              This is taking longer than expected
            </p>
            <button
              onClick={retryFunction}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors duration-200 text-sm"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// New: Advanced Progress Indicator with Stages
export const StageProgressIndicator = ({ 
  stages, 
  currentStage = 0, 
  isLoading = true,
  showPercentage = true 
}) => {
  const progress = ((currentStage + 1) / stages.length) * 100;

  return (
    <div className="w-full max-w-md mx-auto p-4">
      {/* Stage Progress Bar */}
      <div className="relative mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">
            {isLoading ? stages[currentStage]?.name || 'Processing...' : 'Complete'}
          </span>
          {showPercentage && (
            <span className="text-sm text-emerald-400 font-mono">
              {Math.round(progress)}%
            </span>
          )}
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
          </div>
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="flex justify-between">
        {stages.map((stage, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                index <= currentStage 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-gray-700 text-gray-400'
              } ${index === currentStage && isLoading ? 'animate-pulse-glow' : ''}`}
            >
              {index < currentStage ? '✓' : index + 1}
            </div>
            <span className={`text-xs mt-1 text-center ${
              index <= currentStage ? 'text-emerald-400' : 'text-gray-500'
            }`}>
              {stage.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// New: Smart Loading Overlay with Blur Effect
export const SmartLoadingOverlay = ({ 
  isVisible, 
  message = 'Loading...', 
  allowCancel = false,
  onCancel = null,
  blur = true 
}) => {
  const [showCancelOption, setShowCancelOption] = React.useState(false);

  React.useEffect(() => {
    if (isVisible && allowCancel) {
      const timer = setTimeout(() => setShowCancelOption(true), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowCancelOption(false);
    }
  }, [isVisible, allowCancel]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 ${blur ? 'backdrop-blur-sm' : ''} transition-all duration-300`}>
      <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl p-8 max-w-md mx-4 text-center">
        <div className="mb-6">
          <MorphingSpinner size="xl" />
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2">{message}</h3>
        <p className="text-gray-400 text-sm mb-6">
          Please wait while we process your request
        </p>

        <div className="flex justify-center space-x-1 mb-6">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>

        {showCancelOption && onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

// New: Performance-Optimized List Loading
export const OptimizedListLoader = ({ 
  itemCount = 5, 
  itemHeight = 60, 
  showGradient = true,
  className = '' 
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <div
          key={index}
          className="relative overflow-hidden bg-gray-800/50 border border-gray-700 rounded-lg"
          style={{ height: `${itemHeight}px` }}
        >
          <div className="animate-pulse p-4 h-full flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-600 rounded w-1/2"></div>
            </div>
            <div className="w-20 h-6 bg-gray-600 rounded"></div>
          </div>
          
          {showGradient && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"></div>
          )}
        </div>
      ))}
    </div>
  );
};

// New: Micro Loading States for Buttons and Icons
export const MicroLoader = ({ 
  type = 'spinner', 
  size = 'sm', 
  color = 'emerald',
  className = '' 
}) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (type === 'dots') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        <div className={`w-1 h-1 bg-${color}-500 rounded-full animate-bounce`}></div>
        <div className={`w-1 h-1 bg-${color}-500 rounded-full animate-bounce`} style={{animationDelay: '0.1s'}}></div>
        <div className={`w-1 h-1 bg-${color}-500 rounded-full animate-bounce`} style={{animationDelay: '0.2s'}}></div>
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div className={`${sizes[size]} bg-${color}-500 rounded-full animate-pulse ${className}`}></div>
    );
  }

  return (
    <div className={`${sizes[size]} ${className}`}>
      <div className={`w-full h-full border-2 border-transparent rounded-full border-t-${color}-500 animate-spin`}></div>
    </div>
  );
};

// New: Enhanced Success/Error State Transitions
export const StateTransitionLoader = ({ 
  state = 'loading', // 'loading', 'success', 'error'
  children,
  loadingComponent = null,
  successMessage = 'Success!',
  errorMessage = 'Something went wrong',
  autoHideSuccess = 3000,
  onRetry = null,
  className = ''
}) => {
  const [displayState, setDisplayState] = React.useState(state);

  React.useEffect(() => {
    if (state === 'success' && autoHideSuccess) {
      const timer = setTimeout(() => {
        setDisplayState('idle');
      }, autoHideSuccess);
      return () => clearTimeout(timer);
    }
    setDisplayState(state);
  }, [state, autoHideSuccess]);

  if (displayState === 'loading') {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        {loadingComponent || <ModernSpinner size="lg" color="emerald" />}
      </div>
    );
  }

  if (displayState === 'success') {
    return (
      <div className={`flex items-center justify-center p-8 text-center ${className}`}>
        <div className="animate-scale-bounce">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-400 font-medium">{successMessage}</p>
        </div>
      </div>
    );
  }

  if (displayState === 'error') {
    return (
      <div className={`flex items-center justify-center p-8 text-center ${className}`}>
        <div className="animate-scale-bounce">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-red-400 font-medium mb-4">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};

// New: Accessibility-Enhanced Loading Screen Reader
export const AccessibleLoader = ({ 
  isLoading, 
  children, 
  loadingMessage = 'Loading content',
  completedMessage = 'Content loaded',
  showVisualLoader = true 
}) => {
  const [announced, setAnnounced] = React.useState(false);

  React.useEffect(() => {
    if (isLoading) {
      setAnnounced(false);
    } else if (!announced) {
      // Announce completion to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = completedMessage;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
      
      setAnnounced(true);
    }
  }, [isLoading, announced, completedMessage]);

  if (isLoading) {
    return (
      <div 
        role="status" 
        aria-live="polite" 
        aria-label={loadingMessage}
        className="min-h-[200px] flex items-center justify-center"
      >
        {showVisualLoader && (
          <div className="text-center">
            <ModernSpinner size="lg" color="emerald" />
            <p className="mt-4 text-gray-400 sr-only">{loadingMessage}</p>
          </div>
        )}
        <span className="sr-only">{loadingMessage}</span>
      </div>
    );
  }

  return (
    <div role="main" aria-label="Main content">
      {children}
    </div>
  );
};

// =====================================================================
// NEW MODERN LOADING SCREEN DESIGNS - ADDED BY CLAUDE
// =====================================================================

// New: Futuristic Loading Screen with Animated Background
export const FuturisticLoadingScreen = ({ 
  message = 'Loading...', 
  showProgress = false, 
  progress = 0,
  variant = 'cyber',
  className = '' 
}) => {
  const variants = {
    cyber: {
      bg: 'from-blue-900 via-purple-900 to-indigo-900',
      accent: 'cyan',
      pattern: 'cyber-grid'
    },
    neon: {
      bg: 'from-green-900 via-emerald-900 to-teal-900',
      accent: 'emerald',
      pattern: 'neon-waves'
    },
    matrix: {
      bg: 'from-black via-gray-900 to-green-900',
      accent: 'green',
      pattern: 'matrix-rain'
    },
    space: {
      bg: 'from-indigo-900 via-purple-900 to-pink-900',
      accent: 'purple',
      pattern: 'stars'
    }
  };

  const currentVariant = variants[variant] || variants.cyber;

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${currentVariant.bg} relative overflow-hidden ${className}`}>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        {currentVariant.pattern === 'cyber-grid' && (
          <div className="cyber-grid-pattern"></div>
        )}
        {currentVariant.pattern === 'neon-waves' && (
          <div className="neon-waves-pattern"></div>
        )}
        {currentVariant.pattern === 'matrix-rain' && (
          <div className="matrix-rain-pattern"></div>
        )}
        {currentVariant.pattern === 'stars' && (
          <div className="stars-pattern"></div>
        )}
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 bg-${currentVariant.accent}-400 rounded-full animate-float-particle`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>

      <div className="text-center relative z-10 max-w-md mx-auto px-6">
        {/* Main Loading Animation */}
        <div className="relative mb-8">
          <div className={`futuristic-loader-${variant}`}>
            <div className="loader-core"></div>
            <div className="loader-ring-1"></div>
            <div className="loader-ring-2"></div>
            <div className="loader-ring-3"></div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-white mb-4 animate-text-glow">
          {message}
        </h2>
        <p className="text-gray-300 mb-8 text-lg">
          Please wait while we prepare everything for you
        </p>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-full max-w-sm mx-auto mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span>Loading</span>
              <span className="font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                <div 
                  className={`bg-gradient-to-r from-${currentVariant.accent}-500 to-${currentVariant.accent}-300 h-3 rounded-full transition-all duration-500 ease-out relative`}
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                </div>
              </div>
              <div className={`absolute inset-0 bg-${currentVariant.accent}-500/20 rounded-full animate-pulse`}></div>
            </div>
          </div>
        )}

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 bg-${currentVariant.accent}-500 rounded-full animate-bounce`}
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// New: Minimalist Loading Screen with Clean Design
export const MinimalistLoadingScreen = ({ 
  message = 'Loading...', 
  showProgress = false, 
  progress = 0,
  theme = 'light',
  className = '' 
}) => {
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-gray-900' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subtextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const accentClass = isDark ? 'border-emerald-500' : 'border-blue-500';

  return (
    <div className={`min-h-screen flex items-center justify-center ${bgClass} ${className}`}>
      <div className="text-center max-w-sm mx-auto px-6">
        {/* Minimalist Spinner */}
        <div className="relative mb-8">
          <div className={`w-16 h-16 border-4 border-gray-200 ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-full`}>
            <div className={`w-16 h-16 border-4 border-transparent ${accentClass} rounded-full animate-spin`}></div>
          </div>
        </div>

        {/* Message */}
        <h2 className={`text-2xl font-semibold ${textClass} mb-3`}>
          {message}
        </h2>
        <p className={`${subtextClass} mb-8`}>
          This will only take a moment
        </p>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-full mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className={subtextClass}>Progress</span>
              <span className={`${textClass} font-mono`}>{Math.round(progress)}%</span>
            </div>
            <div className={`w-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
              <div 
                className={`h-2 rounded-full transition-all duration-500 ease-out ${
                  isDark 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-400'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Simple Loading Indicator */}
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full animate-pulse ${
                isDark ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
              style={{ animationDelay: `${i * 0.3}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// New: Glassmorphism Loading Screen
export const GlassmorphismLoadingScreen = ({ 
  message = 'Loading...', 
  showProgress = false, 
  progress = 0,
  className = '' 
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 relative overflow-hidden ${className}`}>
      {/* Background Blobs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Glass Card */}
      <div className="relative z-10 backdrop-blur-lg bg-white/20 dark:bg-white/10 rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl p-12 max-w-md mx-auto">
        {/* Glass Spinner */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-white/60 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent border-r-white/40 rounded-full animate-spin-reverse"></div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-white dark:text-white mb-4 text-center">
          {message}
        </h2>
        <p className="text-white/80 dark:text-white/80 mb-8 text-center text-lg">
          Please wait while we process your request
        </p>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-full mb-8">
            <div className="flex justify-between text-sm text-white/70 mb-3">
              <span>Loading</span>
              <span className="font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="relative">
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                <div 
                  className="bg-gradient-to-r from-white/60 to-white/40 h-3 rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Glass Dots */}
        <div className="flex justify-center space-x-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-white/60 rounded-full animate-bounce backdrop-blur-sm"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// New: Animated Logo Loading Screen
export const LogoLoadingScreen = ({ 
  message = 'Loading...', 
  showProgress = false, 
  progress = 0,
  logo = 'FCDC',
  className = '' 
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden ${className}`}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-cyan-500/10 animate-gradient-shift"></div>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-500/30 rounded-full animate-float-up"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>

      <div className="text-center relative z-10 max-w-md mx-auto px-6">
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className="logo-container">
            <div className="logo-text animate-logo-glow">
              {logo}
            </div>
            <div className="logo-ring-1"></div>
            <div className="logo-ring-2"></div>
            <div className="logo-ring-3"></div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-4 animate-fade-in-up">
          {message}
        </h2>
        <p className="text-gray-400 mb-8 animate-fade-in-up animation-delay-200">
          Initializing your workspace
        </p>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-full max-w-sm mx-auto mb-8 animate-fade-in-up animation-delay-400">
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span>Loading</span>
              <span className="font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Animation */}
        <div className="flex justify-center space-x-2 animate-fade-in-up animation-delay-600">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

// New: Card-Based Loading Screen
export const CardLoadingScreen = ({ 
  message = 'Loading...', 
  showProgress = false, 
  progress = 0,
  cards = 3,
  className = '' 
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid-pattern"></div>
      </div>

      <div className="text-center relative z-10 max-w-4xl mx-auto px-6">
        {/* Loading Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              className="loading-card animate-card-float"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <div className="card-content">
                <div className="card-icon">
                  <div className="icon-spinner"></div>
                </div>
                <div className="card-text">
                  <div className="text-line-1"></div>
                  <div className="text-line-2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Message */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-4 animate-text-reveal">
            {message}
          </h2>
          <p className="text-gray-400 text-lg animate-text-reveal animation-delay-300">
            Preparing your dashboard
          </p>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-full max-w-md mx-auto mb-8 animate-fade-in-up animation-delay-600">
            <div className="flex justify-between text-sm text-gray-400 mb-3">
              <span>Progress</span>
              <span className="font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex justify-center items-center space-x-4 animate-fade-in-up animation-delay-800">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-gray-400 text-sm">Initializing components</span>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse animation-delay-200"></div>
        </div>
      </div>
    </div>
  );
};
