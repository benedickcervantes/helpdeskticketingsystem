import { DashboardPageSkeleton } from '@/lib/ui/DashboardSkeletons';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-app-gradient py-8">
      <DashboardPageSkeleton tabCount={4} content="mixed" />
    </div>
  );
}
