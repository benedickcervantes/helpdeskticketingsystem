'use client';

import React, { useState } from 'react';
import { RefreshButton } from './ModernButtons';

// Modern Refresh Component with auto-refresh capabilities
export const ModernRefresh = ({ 
  onRefresh, 
  autoRefresh = false,
  autoRefreshInterval = 30000, // 30 seconds
  className = '',
  size = 'md',
  variant = 'ghost',
  showAutoRefreshIndicator = true
}) => {
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefreshActive, setAutoRefreshActive] = useState(autoRefresh);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshActive(!autoRefreshActive);
  };

  React.useEffect(() => {
    if (autoRefreshActive && autoRefreshInterval > 0) {
      const interval = setInterval(handleRefresh, autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefreshActive, autoRefreshInterval]);

  const formatLastRefresh = () => {
    const now = new Date();
    const diff = now - lastRefresh;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <RefreshButton
        onRefresh={handleRefresh}
        loading={loading}
        size={size}
        variant={variant}
        tooltip="Refresh data"
      />
      
      {showAutoRefreshIndicator && (
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <span>Last updated: {formatLastRefresh()}</span>
          
          {autoRefresh && (
            <button
              onClick={toggleAutoRefresh}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                autoRefreshActive ? 'bg-emerald-500' : 'bg-gray-500'
              }`}
              title={autoRefreshActive ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Page Refresh Component for full page reloads
export const PageRefresh = ({ 
  onRefresh,
  className = '',
  children = 'Refresh Page'
}) => {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className={`flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-emerald-500/30 text-gray-300 hover:text-emerald-400 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
      <span>{children}</span>
    </button>
  );
};

// Smart Refresh Component that detects data changes
export const SmartRefresh = ({ 
  onRefresh,
  dataHash,
  className = '',
  size = 'md',
  variant = 'ghost'
}) => {
  const [loading, setLoading] = useState(false);
  const [lastDataHash, setLastDataHash] = useState(dataHash);
  const [hasNewData, setHasNewData] = useState(false);

  React.useEffect(() => {
    if (dataHash && dataHash !== lastDataHash) {
      setHasNewData(true);
      setLastDataHash(dataHash);
      
      // Auto-hide the indicator after 5 seconds
      setTimeout(() => setHasNewData(false), 5000);
    }
  }, [dataHash, lastDataHash]);

  const handleRefresh = async () => {
    setLoading(true);
    setHasNewData(false);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <RefreshButton
        onRefresh={handleRefresh}
        loading={loading}
        size={size}
        variant={variant}
        tooltip="Refresh data"
      />
      
      {hasNewData && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
      )}
    </div>
  );
};
