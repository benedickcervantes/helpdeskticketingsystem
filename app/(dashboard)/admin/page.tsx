// @ts-nocheck
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from '@/app/(dashboard)/admin/_components/AdminDashboard';
import { DashboardPageSkeleton } from '@/lib/ui/DashboardSkeletons';

export default function AdminPage() {
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
      } else if (userProfile?.role !== 'admin') {
        router.push('/user');
      }
    }
  }, [currentUser, userProfile, loading, authLoading, mounted, router]);

  if (!mounted || loading || authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <DashboardPageSkeleton tabCount={4} content="mixed" />
      </div>
    );
  }

  if (userProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <DashboardPageSkeleton tabCount={4} content="mixed" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
          <DashboardPageSkeleton tabCount={4} content="mixed" />
        </div>
      }
    >
      <AdminDashboard />
    </Suspense>
  );
}
