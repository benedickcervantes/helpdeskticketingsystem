// @ts-nocheck
'use client';

import { useAuth } from '@/contexts/AuthContext';
import ManagementDashboard from '@/app/(dashboard)/management/_components/ManagementDashboard';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { DashboardPageSkeleton } from '@/lib/ui/DashboardSkeletons';

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
        router.push('/');
      } else if (userProfile?.role !== 'admin' && userProfile?.role !== 'manager') {
        router.push('/user');
      }
    }
  }, [currentUser, userProfile, loading, authLoading, mounted, router]);

  if (!mounted || loading || authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-app-gradient py-8">
        <DashboardPageSkeleton tabCount={6} content="executive" />
      </div>
    );
  }

  if (userProfile?.role !== 'admin' && userProfile?.role !== 'manager') {
    return null;
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-app-gradient py-8">
          <DashboardPageSkeleton tabCount={6} content="executive" />
        </div>
      }
    >
      <ManagementDashboard />
    </Suspense>
  );
}
