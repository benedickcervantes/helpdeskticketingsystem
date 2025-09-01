"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User is not authenticated, redirect to login
        router.push('/login');
      } else if (requireAdmin && !isAdmin) {
        // User is authenticated but not admin, redirect to tickets page
        router.push('/tickets');
      }
    }
  }, [user, loading, isAdmin, requireAdmin, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, don't render children
  if (!user) {
    return null;
  }

  // If admin is required but user is not admin, don't render children
  if (requireAdmin && !isAdmin) {
    return null;
  }

  // User is authenticated and has proper permissions
  return children;
} 