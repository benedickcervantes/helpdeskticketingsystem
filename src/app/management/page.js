'use client';

import { useAuth } from '../contexts/AuthContext';
import ManagementDashboard from '../components/ManagementDashboard';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ModernSpinner } from '../components/LoadingComponents';

export default function ManagementPage() {
  const { currentUser, userProfile, loading, authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !authLoading && mounted) {
      if (!currentUser) {
        router.push('/auth');
      } else if (userProfile?.role !== 'admin' && userProfile?.role !== 'manager') {
        router.push('/user');
      }
    }
  }, [currentUser, userProfile, loading, authLoading, mounted, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <ModernSpinner size="xl" color="emerald" />
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <ModernSpinner size="xl" color="emerald" />
          <p className="mt-4 text-gray-300 font-medium">Loading management dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <ModernSpinner size="xl" color="emerald" />
          <p className="mt-4 text-gray-300 font-medium">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (userProfile?.role !== 'admin' && userProfile?.role !== 'manager') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <ModernSpinner size="xl" color="emerald" />
          <p className="mt-4 text-gray-300 font-medium">Redirecting to user dashboard...</p>
        </div>
      </div>
    );
  }

  return <ManagementDashboard />;
}
