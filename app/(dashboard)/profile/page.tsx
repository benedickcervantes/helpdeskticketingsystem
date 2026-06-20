// @ts-nocheck
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProfileSettings from '@/app/(dashboard)/profile/_components/ProfileSettings';
import { ModernSpinner } from '@/lib/ui/LoadingComponents';

export default function ProfilePage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/auth');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <ModernSpinner size="xl" color="emerald" />
      </div>
    );
  }

  return <ProfileSettings />;
}
