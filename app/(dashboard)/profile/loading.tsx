import { ProfileFormSkeleton } from '@/lib/ui/DashboardSkeletons';

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-app-gradient py-8">
      <ProfileFormSkeleton />
    </div>
  );
}
