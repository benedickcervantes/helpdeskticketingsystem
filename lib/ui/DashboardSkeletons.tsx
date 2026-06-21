// @ts-nocheck
'use client';

import {
  SkeletonCard,
  SkeletonChart,
  SkeletonTable,
} from '@/lib/ui/LoadingComponents';

export const StatsGridSkeleton = ({ count = 4, className = '' }) => {
  const gridClass =
    count >= 6
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`${gridClass} gap-4 sm:gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export const ChartGridSkeleton = ({ className = '' }) => (
  <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 ${className}`}>
    <SkeletonChart height={320} />
    <SkeletonChart height={320} />
  </div>
);

export const TicketListSkeleton = ({ className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </div>
);

export const TablePanelSkeleton = ({ rows = 6, className = '' }) => (
  <SkeletonTable rows={rows} className={className} />
);

export const TabStripSkeleton = ({ tabCount = 4, className = '' }) => (
  <div className={`flex space-x-2 sm:space-x-4 border-b border-gray-700 pb-3 mb-6 ${className}`}>
    {Array.from({ length: tabCount }).map((_, i) => (
      <div
        key={i}
        className="h-8 sm:h-10 w-16 sm:w-24 bg-gray-700/50 rounded-lg skeleton-shimmer"
      />
    ))}
  </div>
);

export const TitleBarSkeleton = ({ className = '' }) => (
  <div className={`pt-4 sm:pt-6 pb-4 sm:pb-6 ${className}`}>
    <div className="h-8 sm:h-10 w-48 sm:w-72 bg-gray-700/50 rounded-lg skeleton-shimmer mb-2" />
    <div className="h-4 sm:h-5 w-64 sm:w-96 bg-gray-700/50 rounded skeleton-shimmer" />
  </div>
);

export const DashboardPageSkeleton = ({
  showTabs = true,
  tabCount = 4,
  content = 'stats',
  className = '',
}) => {
  const renderContent = () => {
    switch (content) {
      case 'charts':
        return <ChartGridSkeleton />;
      case 'table':
        return <TablePanelSkeleton />;
      case 'tickets':
        return <TicketListSkeleton />;
      case 'form':
        return (
          <div className="max-w-2xl space-y-4">
            <SkeletonCard />
            <SkeletonCard className="h-48" />
          </div>
        );
      case 'mixed':
        return (
          <div className="space-y-6">
            <StatsGridSkeleton count={4} />
            <ChartGridSkeleton />
          </div>
        );
      case 'stats':
      default:
        return <StatsGridSkeleton count={4} />;
    }
  };

  return (
    <div className={`w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 ${className}`}>
      <TitleBarSkeleton />
      {showTabs && <TabStripSkeleton tabCount={tabCount} />}
      {renderContent()}
    </div>
  );
};

export const ProfileFormSkeleton = ({ className = '' }) => (
  <div className={`w-full max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 space-y-6 ${className}`}>
    <TitleBarSkeleton />
    <div className="flex flex-col sm:flex-row gap-6 items-start">
      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-700/50 rounded-full skeleton-shimmer flex-shrink-0" />
      <div className="flex-1 w-full space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-gray-700/50 rounded skeleton-shimmer" />
            <div className="h-10 w-full bg-gray-700/50 rounded-lg skeleton-shimmer" />
          </div>
        ))}
        <div className="h-10 w-32 bg-gray-700/50 rounded-lg skeleton-shimmer mt-4" />
      </div>
    </div>
  </div>
);

export const NavSkeletonStrip = ({ className = '' }) => (
  <div className={`space-y-2 p-2 ${className}`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-10 w-full bg-gray-700/50 rounded-lg skeleton-shimmer" />
    ))}
  </div>
);

export const NotificationListSkeleton = ({ count = 5, className = '' }) => (
  <div className={`space-y-3 p-3 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex gap-3 p-3 rounded-lg bg-gray-700/30 skeleton-shimmer">
        <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gray-600 rounded" />
          <div className="h-3 w-1/2 bg-gray-600 rounded" />
        </div>
      </div>
    ))}
  </div>
);

export const TechNewsSkeleton = ({ count = 3, className = '' }) => (
  <div className={`flex gap-4 overflow-hidden ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex-shrink-0 w-72 sm:w-80">
        <SkeletonCard />
      </div>
    ))}
  </div>
);

export const CompactFormSkeleton = ({ className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <SkeletonCard />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

export const ExecutiveFeedbackSkeleton = ({ className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    <StatsGridSkeleton count={4} />
    <ChartGridSkeleton />
  </div>
);
