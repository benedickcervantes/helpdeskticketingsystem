// @ts-nocheck
'use client';

import { useMemo } from 'react';
import {
  filterTicketsByDateRange,
  formatExecutiveDuration,
  getDateRangeLabel,
  getDateRangeSpanLabel,
  getTicketHours,
  isCompletedStatus,
  isInProgressStatus,
  isOpenStatus,
  parseTicketDate,
} from '@/lib/utils/analytics';
import { filterFeedbackByDateRange } from '@/lib/utils/feedbackReportUtils';
import DateRangeSelect from './DateRangeSelect';

const toneLabel = {
  excellent: 'Excellent',
  good: 'Good',
  warning: 'Needs work',
  critical: 'At risk',
};

const toneClass = {
  excellent: 'bg-app-primary-soft text-app-primary border-app-primary/30',
  good: 'bg-sky-500/15 text-sky-700 border-sky-500/30',
  warning: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  critical: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
};

const getTone = (value, excellent, good, warning) => {
  if (value >= excellent) return 'excellent';
  if (value >= good) return 'good';
  if (value >= warning) return 'warning';
  return 'critical';
};

const PerformanceMetrics = ({
  tickets = [],
  feedback = [],
  dateRange = '30',
  onDateRangeChange,
}) => {
  const periodLabel = getDateRangeLabel(dateRange).toLowerCase();
  const periodSpan = getDateRangeSpanLabel(dateRange);

  const data = useMemo(() => {
    const scopedTickets = filterTicketsByDateRange(
      Array.isArray(tickets) ? tickets : [],
      dateRange,
    );
    const scopedFeedback = filterFeedbackByDateRange(
      Array.isArray(feedback) ? feedback : [],
      dateRange,
    );

    const totalTickets = scopedTickets.length;
    const resolvedTicketList = scopedTickets.filter((t) =>
      isCompletedStatus(String(t?.status ?? '')),
    );
    const resolvedTickets = resolvedTicketList.length;
    const stillOpen = scopedTickets.filter(
      (t) =>
        isOpenStatus(String(t?.status ?? '')) ||
        isInProgressStatus(String(t?.status ?? '')),
    ).length;

    const resolutionTimes = resolvedTicketList
      .map((ticket) =>
        getTicketHours(ticket.createdAt, ticket.resolvedAt || ticket.updatedAt),
      )
      .filter((hours) => hours !== null);

    const avgResolutionTime =
      resolutionTimes.length > 0
        ? Math.round(
            (resolutionTimes.reduce((sum, h) => sum + h, 0) / resolutionTimes.length) *
              10,
          ) / 10
        : 0;

    const resolutionRate =
      totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

    const fixedWithin2Days =
      resolutionTimes.length === 0
        ? 0
        : Math.round(
            (resolutionTimes.filter((h) => h / 24 < 3).length /
              resolutionTimes.length) *
              100,
          );

    const now = Date.now();
    let overdueOpen = 0;
    let agingOpen = 0;
    scopedTickets.forEach((t) => {
      if (isCompletedStatus(String(t?.status ?? ''))) return;
      const created = parseTicketDate(t.createdAt);
      if (!created) return;
      const daysOpen = (now - created.getTime()) / (1000 * 60 * 60 * 24);
      if (daysOpen >= 14) overdueOpen += 1;
      else if (daysOpen >= 7) agingOpen += 1;
    });

    let feedbackMetrics = {
      averageRating: 0,
      totalFeedback: 0,
      highRatings: 0,
      lowRatings: 0,
      satisfactionRate: 0,
    };
    if (scopedFeedback.length > 0) {
      const totalRating = scopedFeedback.reduce(
        (sum, item) => sum + (item.rating || 0),
        0,
      );
      const averageRating = totalRating / scopedFeedback.length;
      const highRatings = scopedFeedback.filter((item) => item.rating >= 4).length;
      const lowRatings = scopedFeedback.filter((item) => item.rating <= 2).length;
      feedbackMetrics = {
        averageRating: Math.round(averageRating * 10) / 10,
        totalFeedback: scopedFeedback.length,
        highRatings,
        lowRatings,
        satisfactionRate:
          Math.round((highRatings / scopedFeedback.length) * 1000) / 10,
      };
    }

    let score = 0;
    score += Math.min(30, Math.round((resolutionRate / 100) * 30));
    score += Math.min(25, Math.round((fixedWithin2Days / 100) * 25));
    if (avgResolutionTime > 0 && avgResolutionTime / 24 < 3) score += 20;
    else if (avgResolutionTime / 24 <= 6) score += 12;
    else if (avgResolutionTime / 24 < 14) score += 5;
    if (feedbackMetrics.totalFeedback > 0) {
      score += Math.min(25, Math.round((feedbackMetrics.satisfactionRate / 100) * 25));
    } else {
      score += 10;
    }
    if (overdueOpen > 0) score = Math.max(0, score - Math.min(20, overdueOpen * 2));

    let verdict = 'At risk';
    let verdictTone = 'critical';
    let verdictSummary =
      'Support is behind on completion or speed. Review overdue requests first.';
    if (score >= 85) {
      verdict = 'Strong service';
      verdictTone = 'excellent';
      verdictSummary =
        'Most requests are finished quickly and users are generally satisfied.';
    } else if (score >= 70) {
      verdict = 'On track';
      verdictTone = 'good';
      verdictSummary =
        'Service is solid overall. A few quality targets can still be improved.';
    } else if (score >= 50) {
      verdict = 'Mixed results';
      verdictTone = 'warning';
      verdictSummary =
        'Some targets are met, but speed or satisfaction needs attention.';
    }

    const targets = [
      {
        title: 'Finished in 1–2 days',
        value: fixedWithin2Days,
        display: `${fixedWithin2Days}%`,
        target: 80,
        unit: '%',
        hint: 'Share of completed requests finished quickly',
        tone: getTone(fixedWithin2Days, 80, 60, 40),
        higherIsBetter: true,
      },
      {
        title: 'Completion rate',
        value: resolutionRate,
        display: `${resolutionRate}%`,
        target: 90,
        unit: '%',
        hint: `${resolvedTickets} of ${totalTickets} finished`,
        tone: getTone(resolutionRate, 90, 80, 70),
        higherIsBetter: true,
      },
      {
        title: 'Typical fix time',
        value: avgResolutionTime,
        display: formatExecutiveDuration(avgResolutionTime),
        // Target: within 2 days (48h). Progress = how close we are (capped).
        target: 48,
        unit: 'h',
        hint: 'Goal: finish within about 1–2 days',
        tone:
          avgResolutionTime <= 0
            ? 'warning'
            : avgResolutionTime / 24 < 3
              ? 'excellent'
              : avgResolutionTime / 24 <= 6
                ? 'good'
                : avgResolutionTime / 24 < 14
                  ? 'warning'
                  : 'critical',
        higherIsBetter: false,
      },
      {
        title: 'User satisfaction',
        value: feedbackMetrics.totalFeedback > 0 ? feedbackMetrics.averageRating : 0,
        display:
          feedbackMetrics.totalFeedback > 0
            ? `${feedbackMetrics.averageRating}/5`
            : '—',
        target: 4,
        unit: '/5',
        hint:
          feedbackMetrics.totalFeedback > 0
            ? `${feedbackMetrics.satisfactionRate}% gave 4–5 stars`
            : 'No feedback yet',
        tone:
          feedbackMetrics.totalFeedback > 0
            ? getTone(feedbackMetrics.averageRating, 4.5, 4.0, 3.5)
            : 'warning',
        higherIsBetter: true,
        disabled: feedbackMetrics.totalFeedback === 0,
      },
    ];

    return {
      totalTickets,
      stillOpen,
      resolutionRate,
      feedbackMetrics,
      overdueOpen,
      agingOpen,
      score,
      verdict,
      verdictTone,
      verdictSummary,
      targets,
    };
  }, [tickets, feedback, dateRange]);

  const progressPct = (item) => {
    if (item.disabled) return 0;
    if (!item.higherIsBetter) {
      // Lower time is better: full bar when at/under target
      if (item.value <= 0) return 0;
      return Math.min(100, Math.round((item.target / item.value) * 100));
    }
    if (item.target <= 0) return 0;
    return Math.min(100, Math.round((item.value / item.target) * 100));
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between px-1">
        <div className="text-center sm:text-left min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-app mb-1">Service Quality</h2>
          <p className="text-xs sm:text-sm text-app-muted">
            Quality targets & risks for the {periodLabel}
            <span className="text-app-muted/80"> · {periodSpan}</span>
            {' '}— volume charts live under Charts
          </p>
        </div>
        {onDateRangeChange ? (
          <DateRangeSelect value={dateRange} onChange={onDateRangeChange} />
        ) : null}
      </div>

      {/* Overall verdict */}
      <div
        className={`rounded-xl border p-4 sm:p-5 ${
          data.verdictTone === 'excellent'
            ? 'border-app-primary/40 bg-app-primary-soft/40'
            : data.verdictTone === 'good'
              ? 'border-sky-500/40 bg-sky-500/10'
              : data.verdictTone === 'warning'
                ? 'border-amber-500/40 bg-amber-500/10'
                : 'border-rose-500/40 bg-rose-500/10'
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg border ${toneClass[data.verdictTone]}`}
              >
                {data.verdict}
              </span>
              <span className="text-xs text-app-muted">Score {data.score}/100</span>
            </div>
            <p className="text-sm sm:text-base text-app max-w-2xl">{data.verdictSummary}</p>
          </div>
          <div className="sm:text-right flex-shrink-0">
            <p className="text-3xl font-bold text-app tabular-nums">{data.resolutionRate}%</p>
            <p className="text-xs text-app-muted mt-0.5">completion rate</p>
          </div>
        </div>
      </div>

      {/* Targets vs actual — unique to Service Quality */}
      <div className="app-card rounded-xl border p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold text-app mb-1">
          Quality targets
        </h3>
        <p className="text-xs text-app-muted mb-4">
          Are we hitting the goals executives care about?
        </p>
        <div className="space-y-4">
          {data.targets.map((item) => {
            const pct = progressPct(item);
            return (
              <div key={item.title}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-1.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-app">{item.title}</p>
                      <span
                        className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-lg border ${toneClass[item.tone]}`}
                      >
                        {toneLabel[item.tone]}
                      </span>
                    </div>
                    <p className="text-[11px] text-app-muted mt-0.5">{item.hint}</p>
                  </div>
                  <div className="sm:text-right flex-shrink-0">
                    <p className="text-lg font-bold text-app tabular-nums">{item.display}</p>
                    <p className="text-[11px] text-app-muted">
                      {item.disabled
                        ? 'No data yet'
                        : item.higherIsBetter
                          ? `Target ${item.target}${item.unit === '/5' ? '' : item.unit}${item.unit === '/5' ? '/5' : ''}`
                          : `Target ≤ ${formatExecutiveDuration(item.target)}`}
                    </p>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-app-surface-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.tone === 'excellent' || item.tone === 'good'
                        ? 'bg-emerald-500'
                        : item.tone === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                    }`}
                    style={{ width: `${item.disabled ? 0 : pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risks — not shown as charts on Charts tab */}
      <div className="app-card rounded-xl border p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold text-app mb-1">
          Service risks
        </h3>
        <p className="text-xs text-app-muted mb-4">
          Aging work that can hurt service quality
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-app/30 bg-app-surface-2/50 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600 tabular-nums">{data.stillOpen}</p>
            <p className="text-xs text-app-muted mt-1">Still open</p>
          </div>
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-center">
            <p className="text-2xl font-bold text-orange-600 tabular-nums">{data.agingOpen}</p>
            <p className="text-xs text-app-muted mt-1">Open 1–2 weeks</p>
          </div>
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-center">
            <p className="text-2xl font-bold text-rose-600 tabular-nums">{data.overdueOpen}</p>
            <p className="text-xs text-app-muted mt-1">Open 2 weeks+</p>
          </div>
        </div>
        {data.overdueOpen > 0 ? (
          <p className="text-xs text-rose-600 mt-3">
            {data.overdueOpen} request{data.overdueOpen > 1 ? 's have' : ' has'} been waiting
            2 weeks or more — prioritize these to protect service quality.
          </p>
        ) : (
          <p className="text-xs text-emerald-600 mt-3">
            No requests are overdue past 2 weeks right now.
          </p>
        )}
      </div>

      {data.feedbackMetrics.totalFeedback > 0 && (
        <div className="app-card rounded-xl border p-4 sm:p-5">
          <h3 className="text-base sm:text-lg font-semibold text-app mb-1">
            What users are saying
          </h3>
          <p className="text-xs text-app-muted mb-4">
            Based on {data.feedbackMetrics.totalFeedback} feedback rating
            {data.feedbackMetrics.totalFeedback > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-app/30 bg-app-surface-2/50 p-4 text-center sm:text-left">
              <p className="text-3xl font-bold text-app-primary tabular-nums">
                {data.feedbackMetrics.satisfactionRate}%
              </p>
              <p className="text-sm text-app-muted mt-1">Happy with support</p>
            </div>
            <div className="rounded-lg border border-app/30 bg-app-surface-2/50 p-4 text-center sm:text-left">
              <p className="text-3xl font-bold text-emerald-600 tabular-nums">
                {data.feedbackMetrics.highRatings}
              </p>
              <p className="text-sm text-app-muted mt-1">Positive (4–5 stars)</p>
            </div>
            <div className="rounded-lg border border-app/30 bg-app-surface-2/50 p-4 text-center sm:text-left">
              <p className="text-3xl font-bold text-rose-600 tabular-nums">
                {data.feedbackMetrics.lowRatings}
              </p>
              <p className="text-sm text-app-muted mt-1">Needs improvement (1–2)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMetrics;
