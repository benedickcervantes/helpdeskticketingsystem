'use client';

import React from 'react';
import { ModernSpinner, MorphingSpinner, PulseSpinner } from './LoadingComponents';

// Modern Loading Overlay Component
export const LoadingOverlay = ({ 
  isVisible = false,
  message = 'Loading...',
  variant = 'spinner',
  size = 'lg',
  className = '',
  children
}) => {
  if (!isVisible) return null;

  const renderSpinner = () => {
    switch (variant) {
      case 'morphing':
        return <MorphingSpinner size={size} />;
      case 'pulse':
        return <PulseSpinner size={size} />;
      default:
        return <ModernSpinner size={size} color="emerald" />;
    }
  };

  return (
    <div className={`fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300 ${className}`}>
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mb-4">
            {renderSpinner()}
          </div>
          <p className="text-white text-lg font-medium">{message}</p>
          {children}
        </div>
      </div>
    </div>
  );
};

// Page Loading Overlay with progress
export const PageLoadingOverlay = ({ 
  isVisible = false,
  progress = 0,
  message = 'Loading page...',
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-gray-900/90 backdrop-blur-sm transition-opacity duration-300 ${className}`}>
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6">
            <MorphingSpinner size="xl" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">{message}</h2>
          
          {progress > 0 && (
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
              </div>
            </div>
          )}
          
          <p className="text-gray-400 text-sm">
            {progress > 0 ? `${Math.round(progress)}% complete` : 'Please wait...'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Modal Loading Overlay
export const ModalLoadingOverlay = ({ 
  isVisible = false,
  message = 'Processing...',
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 z-10 bg-gray-900/50 backdrop-blur-sm rounded-xl transition-opacity duration-300 ${className}`}>
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <ModernSpinner size="lg" color="emerald" variant="dots" />
          <p className="text-white text-sm mt-3">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Inline Loading Component
export const InlineLoading = ({ 
  message = 'Loading...',
  variant = 'spinner',
  size = 'md',
  className = ''
}) => {
  const renderSpinner = () => {
    switch (variant) {
      case 'morphing':
        return <MorphingSpinner size={size} />;
      case 'pulse':
        return <PulseSpinner size={size} />;
      case 'dots':
        return <ModernSpinner size={size} color="emerald" variant="dots" />;
      default:
        return <ModernSpinner size={size} color="emerald" />;
    }
  };

  return (
    <div className={`flex items-center justify-center space-x-3 py-8 ${className}`}>
      {renderSpinner()}
      <span className="text-gray-400 text-sm">{message}</span>
    </div>
  );
};

// Skeleton Loading Component
export const SkeletonLoading = ({ 
  type = 'card',
  count = 1,
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600 p-6 skeleton-shimmer">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-600 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-600 rounded w-full"></div>
                <div className="h-3 bg-gray-600 rounded w-5/6"></div>
                <div className="h-3 bg-gray-600 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600 p-6 skeleton-shimmer">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-600 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex space-x-4">
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
      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-600 p-4 skeleton-shimmer">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-600 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600 p-6 skeleton-shimmer">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-600 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-600 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-600 rounded w-5/6"></div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={count > 1 ? 'mb-4' : ''}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

// Progress Loading Component
export const ProgressLoading = ({ 
  progress = 0,
  message = 'Loading...',
  showPercentage = true,
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">{message}</span>
        {showPercentage && (
          <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
        )}
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
  );
};
