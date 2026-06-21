import { ProfileFormSkeleton } from '@/lib/ui/DashboardSkeletons';

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <ProfileFormSkeleton />
    </div>
  );
}
