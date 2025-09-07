'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ManagementDashboard from '../components/ManagementDashboard';

export default function ManagementPage() {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      // Only allow admin users to access management dashboard
      if (userProfile?.role !== 'admin') {
        router.push('/user');
      }
    } else if (!loading && !currentUser) {
      router.push('/auth');
    }
  }, [currentUser, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading Management Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || userProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-slate-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <ManagementDashboard />;
}
