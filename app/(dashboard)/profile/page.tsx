'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProfileSettings from '@/app/(dashboard)/profile/_components/ProfileSettings';
import { ProfileFormSkeleton } from '@/lib/ui/DashboardSkeletons';

export default function ProfilePage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-app-gradient py-3 sm:py-8">
        <ProfileFormSkeleton />
      </div>
    );
  }

  return <ProfileSettings />;
}
