'use client';

import React from 'react';
import { ModernSpinner } from './LoadingComponents';

// Modern Button Component with multiple variants and states
export const ModernButton = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Loading...',
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  fullWidth = false,
  ...props 
}) => {
  const baseClasses = "relative overflow-hidden font-medium rounded-xl transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none btn-modern";
  
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
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl focus:ring-green-500 hover:-translate-y-0.5',
    warning: 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl focus:ring-yellow-500 hover:-translate-y-0.5',
    info: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500 hover:-translate-y-0.5'
  };

  const isDisabled = disabled || loading;
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
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

// Icon Button Component
export const IconButton = ({ 
  icon, 
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  tooltip,
  ...props 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14'
  };

  const variantClasses = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-emerald-500/30 text-gray-300 hover:text-white',
    ghost: 'bg-transparent hover:bg-gray-700/50 text-gray-400 hover:text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
  };

  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
      className={`${sizeClasses[size]} rounded-full transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 ${variantClasses[variant]} ${className}`}
      title={tooltip}
      {...props}
    >
      {loading ? (
        <ModernSpinner size="sm" color="white" variant="spinner" />
      ) : (
        icon
      )}
    </button>
  );
};

// Floating Action Button
export const FloatingActionButton = ({ 
  icon, 
  onClick,
  position = 'bottom-right',
  size = 'lg',
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16'
  };

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-2xl hover:shadow-3xl',
    secondary: 'bg-gray-800/90 hover:bg-gray-700/90 border border-gray-700 text-white shadow-2xl hover:shadow-3xl',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-3xl'
  };

  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
      className={`${sizeClasses[size]} ${positionClasses[position]} rounded-full transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 hover:scale-105 z-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <ModernSpinner size="sm" color="white" variant="spinner" />
      ) : (
        icon
      )}
    </button>
  );
};

// Button Group Component
export const ButtonGroup = ({ 
  children, 
  orientation = 'horizontal',
  className = '',
  ...props 
}) => {
  const orientationClasses = {
    horizontal: 'flex flex-row',
    vertical: 'flex flex-col'
  };

  return (
    <div className={`${orientationClasses[orientation]} ${className}`} {...props}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            className: `${child.props.className || ''} ${
              orientation === 'horizontal' 
                ? index === 0 
                  ? 'rounded-r-none' 
                  : index === React.Children.count(children) - 1 
                    ? 'rounded-l-none' 
                    : 'rounded-none'
                : index === 0 
                  ? 'rounded-b-none' 
                  : index === React.Children.count(children) - 1 
                    ? 'rounded-t-none' 
                    : 'rounded-none'
            }`
          });
        }
        return child;
      })}
    </div>
  );
};

// Toggle Button Component
export const ToggleButton = ({ 
  active = false,
  children,
  activeIcon,
  inactiveIcon,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  ...props 
}) => {
  const baseClasses = "relative overflow-hidden font-medium rounded-xl transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 btn-modern";
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  const variantClasses = {
    primary: active 
      ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg' 
      : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50',
    secondary: active 
      ? 'bg-blue-600 text-white shadow-lg' 
      : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700/50'
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      <div className="flex items-center justify-center">
        {active ? activeIcon : inactiveIcon}
        {children && <span className="ml-2">{children}</span>}
      </div>
    </button>
  );
};

// Loading Button with Progress
export const LoadingButton = ({ 
  children,
  loading = false,
  progress = 0,
  loadingText = 'Loading...',
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  ...props 
}) => {
  const baseClasses = "relative overflow-hidden font-medium rounded-xl transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 btn-modern";
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl focus:ring-emerald-500 hover:-translate-y-0.5',
    secondary: 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-emerald-500/30 text-white shadow-lg hover:shadow-xl focus:ring-gray-500 hover:-translate-y-0.5'
  };

  return (
    <button
      disabled={loading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <ModernSpinner size="sm" color="white" variant="dots" />
          </div>
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
              <div 
                className="h-full bg-white/40 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </>
      )}
      
      <div className={`flex items-center justify-center ${loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}`}>
        {loading ? loadingText : children}
      </div>
    </button>
  );
};

// Refresh Button Component
export const RefreshButton = ({ 
  onRefresh, 
  loading = false, 
  className = '',
  size = 'md',
  variant = 'ghost',
  tooltip = 'Refresh'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl',
    ghost: 'bg-transparent hover:bg-gray-700/50 text-gray-400 hover:text-emerald-400',
    secondary: 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-emerald-500/30 text-gray-300 hover:text-white'
  };

  return (
    <button
      onClick={onRefresh}
      disabled={loading}
      className={`${sizeClasses[size]} rounded-full transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 ${variantClasses[variant]} ${className}`}
      title={tooltip}
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
