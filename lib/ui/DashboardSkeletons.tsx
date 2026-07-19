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
    {/* Search + filters */}
    <div className="space-y-3">
      <div className="h-11 w-full rounded-lg bg-gray-700/40 border border-gray-700/50 skeleton-shimmer" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-20 shrink-0 rounded-lg bg-gray-700/40 border border-gray-700/40 skeleton-shimmer" />
        ))}
      </div>
    </div>
    {/* Ticket cards */}
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="relative overflow-hidden rounded-xl border border-gray-700/60 bg-gray-800/40 p-4 sm:p-5"
      >
        <div className="h-0.5 w-8 rounded-full mb-3 bg-emerald-500/40" />
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-28 bg-cyan-500/15 rounded-lg" />
          <div className="h-5 w-3/4 bg-gray-700/50 rounded" />
          <div className="h-4 w-full bg-gray-700/40 rounded" />
          <div className="h-4 w-2/3 bg-gray-700/30 rounded" />
          <div className="flex gap-2 pt-1">
            <div className="h-6 w-16 rounded-lg bg-gray-700/40" />
            <div className="h-6 w-16 rounded-lg bg-gray-700/40" />
          </div>
        </div>
      </div>
    ))}
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
        return <TicketFormSkeleton />;
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
  <div className={`w-full max-w-3xl mx-auto px-3 sm:px-6 space-y-3 sm:space-y-5 overflow-x-hidden ${className}`}>
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-gray-700/60 bg-gray-800/50 px-3.5 py-4 sm:px-5 sm:py-5">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500/40" />
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gray-700/60 skeleton-shimmer shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <div className="h-5 sm:h-6 w-36 sm:w-40 bg-gray-700/60 rounded-lg skeleton-shimmer" />
          <div className="h-3 sm:h-4 w-40 sm:w-56 max-w-full bg-gray-700/40 rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
    <div className="rounded-xl sm:rounded-2xl border border-gray-700/60 bg-gray-800/40 p-3 sm:p-5 space-y-3 sm:space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gray-700/50 skeleton-shimmer shrink-0" />
        <div className="space-y-2 w-full sm:flex-1 min-w-0">
          <div className="h-10 w-full sm:w-32 bg-gray-700/50 rounded-xl skeleton-shimmer" />
          <div className="h-3 w-40 max-w-full bg-gray-700/40 rounded skeleton-shimmer" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 min-w-0">
            <div className="h-4 w-24 bg-gray-700/50 rounded skeleton-shimmer" />
            <div className="h-11 w-full bg-gray-700/40 rounded-xl skeleton-shimmer" />
          </div>
        ))}
      </div>
      <div className="h-11 w-full sm:w-36 sm:ml-auto bg-emerald-600/30 rounded-xl skeleton-shimmer" />
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

/** Matches Create Support Ticket form layout */
export const TicketFormSkeleton = ({ className = '' }) => (
  <div className={`max-w-3xl mx-auto ${className}`}>
    <div className="relative overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/60 to-gray-900/60">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/40 via-cyan-400/40 to-emerald-500/40" />

      {/* Header */}
      <div className="border-b border-gray-700/50 px-5 sm:px-7 py-5 sm:py-6">
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-700/60 skeleton-shimmer" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-6 w-48 sm:w-64 bg-gray-700/60 rounded-lg skeleton-shimmer" />
            <div className="h-4 w-56 sm:w-72 bg-gray-700/40 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6 sm:space-y-7 animate-pulse">
        {/* Title field */}
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-700/50 rounded skeleton-shimmer" />
          <div className="h-12 w-full bg-gray-700/40 rounded-xl skeleton-shimmer" />
        </div>

        {/* Description field */}
        <div className="space-y-2">
          <div className="h-4 w-28 bg-gray-700/50 rounded skeleton-shimmer" />
          <div className="h-32 w-full bg-gray-700/40 rounded-xl skeleton-shimmer" />
        </div>

        {/* Attachments */}
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-700/50 rounded skeleton-shimmer" />
          <div className="h-24 w-full rounded-xl border-2 border-dashed border-gray-600/50 bg-gray-800/30 skeleton-shimmer" />
        </div>

        {/* Priority chips */}
        <div className="space-y-3">
          <div className="h-4 w-20 bg-gray-700/50 rounded skeleton-shimmer" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-700/40 border border-gray-600/40 skeleton-shimmer" />
            ))}
          </div>
        </div>

        {/* Category chips */}
        <div className="space-y-3">
          <div className="h-4 w-24 bg-gray-700/50 rounded skeleton-shimmer" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-700/40 border border-gray-600/40 skeleton-shimmer" />
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <div className="h-12 w-full rounded-xl bg-emerald-600/30 skeleton-shimmer" />
        </div>
      </div>
    </div>
  </div>
);

export const ExecutiveFeedbackSkeleton = ({ className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    <StatsGridSkeleton count={4} />
    <ChartGridSkeleton />
  </div>
);
