'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import UserDashboard from '../components/UserDashboard';
import { ModernSpinner } from '../components/LoadingComponents';

export default function UserPage() {
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
      } else if (userProfile?.role === 'admin') {
        router.push('/admin');
      } else if (userProfile?.role === 'manager') {
        router.push('/management');
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
          <p className="mt-4 text-gray-300 font-medium">Loading your dashboard...</p>
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

  return <UserDashboard />;
}
