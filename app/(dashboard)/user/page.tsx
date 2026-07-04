// @ts-nocheck
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import UserDashboard from '@/app/(dashboard)/user/_components/UserDashboard';
import { DashboardPageSkeleton } from '@/lib/ui/DashboardSkeletons';

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
        router.push('/');
      } else if (userProfile?.role === 'admin') {
        router.push('/admin');
      } else if (userProfile?.role === 'manager') {
        router.push('/management');
      }
    }
  }, [currentUser, userProfile, loading, authLoading, mounted, router]);

  if (!mounted || loading || authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <DashboardPageSkeleton tabCount={3} content="tickets" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
          <DashboardPageSkeleton tabCount={3} content="tickets" />
        </div>
      }
    >
      <UserDashboard />
    </Suspense>
  );
}
