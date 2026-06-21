import { DashboardPageSkeleton } from '@/lib/ui/DashboardSkeletons';

export default function UserLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <DashboardPageSkeleton tabCount={3} content="tickets" />
    </div>
  );
}
