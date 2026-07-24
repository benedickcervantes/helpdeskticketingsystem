// @ts-nocheck
'use client';

import {
  computeExecutiveMetrics,
  computeHealthStatus,
  formatExecutiveDuration,
  getDateRangeLabel,
  getDateRangeSpanLabel,
} from '@/lib/utils/analytics';
import DateRangeSelect from './DateRangeSelect';

const ExecutiveSummary = ({
  tickets = [],
  feedback = [],
  metrics = {},
  healthStatus,
  dateRange = '30',
  onDateRangeChange,
  onNavigateToTab,
}) => {
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const safeFeedback = Array.isArray(feedback) ? feedback : [];
  const computedMetrics = computeExecutiveMetrics(safeTickets, safeFeedback, dateRange);
  const safeMetrics = { ...computedMetrics, ...(metrics || {}) };
  const safeHealthStatus = healthStatus || computeHealthStatus(safeMetrics);
  const periodLabel = getDateRangeLabel(dateRange).toLowerCase();
  const periodSpan = getDateRangeSpanLabel(dateRange);

  const total = safeMetrics.totalTickets || 0;
  const done = safeMetrics.resolvedCount || 0;
  const waiting = safeMetrics.openCount || 0;
  const working = safeMetrics.inProgressCount || 0;
  const stillOpen = safeMetrics.stillOpenCount || waiting + working;
  const donePct = total > 0 ? Math.round((done / total) * 100) : 0;
  const waitingPct = total > 0 ? Math.round((waiting / total) * 100) : 0;
  const workingPct = total > 0 ? Math.round((working / total) * 100) : 0;

  const healthTone =
    safeHealthStatus.status === 'Excellent'
      ? {
          panel: 'border-app-primary/35 bg-app-primary-soft/30',
          badge: 'bg-app-primary text-white',
          bar: 'bg-app-primary',
        }
      : safeHealthStatus.status === 'Good'
        ? {
            panel: 'border-sky-500/35 bg-sky-500/10',
            badge: 'bg-sky-700 text-white',
            bar: 'bg-sky-500',
          }
        : safeHealthStatus.status === 'Fair'
          ? {
              panel: 'border-amber-500/35 bg-amber-500/10',
              badge: 'bg-amber-700 text-white',
              bar: 'bg-amber-500',
            }
          : {
              panel: 'border-rose-500/35 bg-rose-500/10',
              badge: 'bg-rose-700 text-white',
              bar: 'bg-rose-500',
            };

  const getHighlights = () => {
    const items = [];

    if ((safeMetrics.urgentOpenTickets || 0) > 0) {
      items.push({
        tone: 'urgent',
        title: `${safeMetrics.urgentOpenTickets} high-priority request${safeMetrics.urgentOpenTickets > 1 ? 's' : ''} remain open`,
        message: 'Critical and high-priority items should be addressed first to limit business impact.',
      });
    }

    if ((safeMetrics.resolutionRate || 0) >= 85) {
      items.push({
        tone: 'positive',
        title: `Completion rate at ${safeMetrics.resolutionRate}%`,
        message: 'Support is closing the majority of requests within the selected period.',
      });
    } else if ((safeMetrics.resolutionRate || 0) < 70 && total > 0) {
      items.push({
        tone: 'negative',
        title: `Completion rate at ${safeMetrics.resolutionRate}%`,
        message: 'Open volume is elevated relative to completions. Review capacity and backlog.',
      });
    }

    if ((safeMetrics.avgResolutionTime || 0) > 0 && safeMetrics.avgResolutionTime <= 48) {
      items.push({
        tone: 'positive',
        title: `Average resolution: ${formatExecutiveDuration(safeMetrics.avgResolutionTime)}`,
        message: 'Turnaround time is within an acceptable service window.',
      });
    } else if ((safeMetrics.avgResolutionTime || 0) > 72) {
      items.push({
        tone: 'negative',
        title: `Average resolution: ${formatExecutiveDuration(safeMetrics.avgResolutionTime)}`,
        message: 'Extended resolution times may affect employee productivity.',
      });
    }

    if ((safeMetrics.feedbackCount || 0) > 0) {
      if ((safeMetrics.customerSatisfaction || 0) >= 80) {
        items.push({
          tone: 'positive',
          title: `Satisfaction at ${safeMetrics.customerSatisfaction}%`,
          message: 'Based on ratings of 4–5 stars in the selected period.',
        });
      } else if ((safeMetrics.customerSatisfaction || 0) < 70) {
        items.push({
          tone: 'negative',
          title: `Satisfaction at ${safeMetrics.customerSatisfaction}%`,
          message: 'Review recent feedback for recurring service issues.',
        });
      }
    }

    if (stillOpen > 0 && items.length < 3) {
      items.push({
        tone: 'info',
        title: `${stillOpen} request${stillOpen > 1 ? 's' : ''} still open`,
        message: `${waiting} awaiting action · ${working} in progress`,
      });
    }

    return items.slice(0, 4);
  };

  const highlights = getHighlights();

  const highlightStyles = {
    positive: 'border-emerald-500/30 bg-app-surface-2',
    negative: 'border-rose-500/30 bg-app-surface-2',
    urgent: 'border-orange-500/35 bg-app-surface-2',
    info: 'border-sky-500/30 bg-app-surface-2',
  };

  const highlightAccent = {
    positive: 'bg-emerald-500',
    negative: 'bg-rose-500',
    urgent: 'bg-orange-500',
    info: 'bg-sky-500',
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-center sm:text-left px-1 min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-app mb-1">At a Glance</h2>
          <p className="text-xs sm:text-sm text-app-muted">
            IT support performance summary · {periodLabel}
            <span className="text-app-muted/80"> · {periodSpan}</span>
          </p>
        </div>
        {onDateRangeChange ? (
          <DateRangeSelect value={dateRange} onChange={onDateRangeChange} />
        ) : null}
      </div>

      {/* Executive verdict */}
      <div className={`rounded-xl border p-4 sm:p-6 ${healthTone.panel}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-app-muted mb-2">
              Service health
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-semibold ${healthTone.badge}`}
              >
                {safeHealthStatus.headline}
              </span>
              <span className="text-xs sm:text-sm text-app-muted">
                {safeHealthStatus.status} · {safeHealthStatus.score}/100
              </span>
            </div>
            <p className="text-sm sm:text-base text-app max-w-2xl leading-relaxed">
              {safeHealthStatus.summary}
            </p>
          </div>
          <div className="sm:text-right flex-shrink-0 sm:pl-4 sm:border-l sm:border-app/30">
            <p className="text-3xl sm:text-4xl font-bold text-app tabular-nums tracking-tight">
              {donePct}%
            </p>
            <p className="text-xs sm:text-sm text-app-muted mt-1">Completion rate</p>
          </div>
        </div>
        <div className="mt-5 h-1.5 w-full rounded-full bg-app-surface-2/80 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${healthTone.bar}`}
            style={{ width: `${Math.min(100, donePct)}%` }}
          />
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="app-card rounded-xl border p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-wide text-app-muted">Request volume</p>
          <p className="text-2xl sm:text-3xl font-bold text-app mt-2 tabular-nums tracking-tight">
            {total}
          </p>
          <p className="text-xs text-app-muted mt-2">Submitted in period</p>
        </div>

        <div className="app-card rounded-xl border p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-wide text-app-muted">Completion rate</p>
          <p className="text-2xl sm:text-3xl font-bold text-app mt-2 tabular-nums tracking-tight">
            {safeMetrics.resolutionRate || 0}%
          </p>
          <p className="text-xs text-app-muted mt-2">
            {done} of {total} completed
          </p>
        </div>

        <div className="app-card rounded-xl border p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-wide text-app-muted">Avg. resolution</p>
          <p className="text-xl sm:text-2xl font-bold text-app mt-2 leading-tight tracking-tight">
            {formatExecutiveDuration(safeMetrics.avgResolutionTime)}
          </p>
          <p className="text-xs text-app-muted mt-2">Time to complete</p>
        </div>

        <div className="app-card rounded-xl border p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-wide text-app-muted">Satisfaction</p>
          <p className="text-2xl sm:text-3xl font-bold text-app mt-2 tabular-nums tracking-tight">
            {(safeMetrics.feedbackCount || 0) > 0
              ? `${safeMetrics.customerSatisfaction || 0}%`
              : '—'}
          </p>
          <p className="text-xs text-app-muted mt-2">
            {(safeMetrics.feedbackCount || 0) > 0
              ? `${safeMetrics.feedbackCount} rating${safeMetrics.feedbackCount > 1 ? 's' : ''}`
              : 'No ratings yet'}
          </p>
        </div>
      </div>

      {/* Compact status strip — one view only, no pie/chart duplicate */}
      <div className="app-card rounded-xl border p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-app">Request status</h3>
            <p className="text-xs text-app-muted mt-0.5">
              Open · In progress · Completed · {total} total
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab?.('analytics')}
            className="text-xs font-medium text-app-primary hover:underline self-start sm:self-auto"
          >
            View charts →
          </button>
        </div>

        {total === 0 ? (
          <p className="text-sm text-app-muted py-4 text-center">No requests in this period.</p>
        ) : (
          <>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-app-surface-3 mb-4">
              {waitingPct > 0 && (
                <div className="bg-rose-500 h-full" style={{ width: `${waitingPct}%` }} />
              )}
              {workingPct > 0 && (
                <div className="bg-amber-500 h-full" style={{ width: `${workingPct}%` }} />
              )}
              {donePct > 0 && (
                <div className="bg-emerald-500 h-full" style={{ width: `${donePct}%` }} />
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center sm:text-left">
                <p className="text-xl sm:text-2xl font-bold text-rose-600 tabular-nums">{waiting}</p>
                <p className="text-xs text-app-muted mt-0.5">Open</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xl sm:text-2xl font-bold text-amber-600 tabular-nums">{working}</p>
                <p className="text-xs text-app-muted mt-0.5">In progress</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xl sm:text-2xl font-bold text-emerald-600 tabular-nums">{done}</p>
                <p className="text-xs text-app-muted mt-0.5">Completed</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Key insights */}
      <div className="space-y-3">
        <h3 className="text-sm sm:text-base font-semibold text-app px-1">Key insights</h3>
        {highlights.length === 0 ? (
          <div className="app-card rounded-xl border p-5 text-center">
            <p className="text-sm text-app-muted">No material issues flagged for this period.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highlights.map((item, index) => (
              <div
                key={index}
                className={`rounded-xl border p-4 flex gap-3 ${highlightStyles[item.tone] || highlightStyles.info}`}
              >
                <span
                  className={`w-1 rounded-full flex-shrink-0 ${highlightAccent[item.tone] || highlightAccent.info}`}
                />
                <div className="min-w-0">
                  <h4 className="font-semibold text-app text-sm">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-app-soft mt-1 leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="app-card rounded-xl border p-4 sm:p-5">
        <h3 className="text-sm sm:text-base font-semibold text-app mb-3">Continue</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onNavigateToTab?.('analytics')}
            className="p-3 sm:p-4 bg-app-surface-3 hover:bg-app-surface-2 border border-app rounded-lg transition-colors text-left"
          >
            <p className="font-medium text-app text-sm">Charts</p>
            <p className="text-xs text-app-muted mt-0.5">Volume, trends, and priority mix</p>
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab?.('performance')}
            className="p-3 sm:p-4 bg-app-surface-3 hover:bg-app-surface-2 border border-app rounded-lg transition-colors text-left"
          >
            <p className="font-medium text-app text-sm">Service Quality</p>
            <p className="text-xs text-app-muted mt-0.5">Targets, risks, and satisfaction</p>
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab?.('reports')}
            className="p-3 sm:p-4 bg-app-surface-3 hover:bg-app-surface-2 border border-app rounded-lg transition-colors text-left"
          >
            <p className="font-medium text-app text-sm">Reports</p>
            <p className="text-xs text-app-muted mt-0.5">Export PDF or PowerPoint</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
