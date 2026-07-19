import { DashboardPageSkeleton } from '@/lib/ui/DashboardSkeletons';

export default function ManagementLoading() {
  return (
    <div className="min-h-screen bg-app-gradient py-8">
      <DashboardPageSkeleton tabCount={7} content="charts" />
    </div>
  );
}
