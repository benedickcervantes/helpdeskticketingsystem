// @ts-nocheck
'use client';

import { useAuth } from '@/contexts/AuthContext';
import ManagementDashboard from '@/app/(dashboard)/management/_components/ManagementDashboard';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ModernSpinner } from '@/lib/ui/LoadingComponents';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <ModernSpinner size="xl" color="emerald" />
      </div>
    );
  }

  if (userProfile?.role !== 'admin' && userProfile?.role !== 'manager') {
    return null;
  }

  return <ManagementDashboard />;
}
