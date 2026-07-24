export function parseTicketDate(value: unknown): Date | null {
  if (!value) return null;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getTicketHours(start: unknown, end: unknown): number | null {
  const startDate = parseTicketDate(start);
  const endDate = parseTicketDate(end);
  if (!startDate || !endDate) return null;
  const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  return hours >= 0 ? hours : null;
}

export function formatResolutionTime(hours: number | null | undefined): string {
  if (hours == null || Number.isNaN(hours) || hours <= 0) return '—';
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return minutes < 1 ? '<1 min' : `${minutes} min`;
  }
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded}h`;
}

export function normalizeTicketStatus(status?: string): string {
  return String(status ?? '').trim().toLowerCase();
}

export function isCompletedStatus(status?: string): boolean {
  const normalized = normalizeTicketStatus(status);
  return normalized === 'resolved' || normalized === 'closed';
}

export function isOpenStatus(status?: string): boolean {
  return normalizeTicketStatus(status) === 'open';
}

export function isInProgressStatus(status?: string): boolean {
  return normalizeTicketStatus(status) === 'in-progress';
}

export function normalizeTicketPriority(priority?: string): string {
  return String(priority ?? '').trim().toLowerCase();
}

export function resolveTicketDepartment(
  ticket: Record<string, unknown>,
  users: Array<{ id?: string; uid?: string; department?: string | null }> = [],
): string | null {
  const creator = ticket.creator as { department?: string | null } | null | undefined;
  const fromCreator = String(creator?.department ?? '').trim();
  if (fromCreator) return fromCreator;

  const createdBy = String(
    ticket.createdBy ?? ticket.created_by_id ?? '',
  ).trim();
  if (!createdBy) return null;

  const user = users.find((entry) => matchUserToTicket(entry, createdBy));
  const fromUser = String(user?.department ?? '').trim();
  return fromUser || null;
}

/** @deprecated Use isCompletedStatus — completed tickets are resolved or closed */
export function isResolvedStatus(status?: string): boolean {
  return isCompletedStatus(status);
}

export function getTicketCompletedAt(
  ticket: Record<string, unknown>,
): Date | null {
  if (!isCompletedStatus(String(ticket.status ?? ''))) return null;
  return (
    parseTicketDate(ticket.resolvedAt) ?? parseTicketDate(ticket.updatedAt)
  );
}

export function matchUserToTicket(
  user: { id?: string; uid?: string },
  createdBy?: string,
): boolean {
  if (!createdBy) return false;
  return user.uid === createdBy || user.id === createdBy;
}

/** Preset periods used across the Executive Dashboard */
export const DATE_RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days', shortLabel: '7 days' },
  { value: '30', label: 'Last 30 days', shortLabel: '30 days' },
  { value: '90', label: 'Last 90 days', shortLabel: '90 days' },
  { value: '365', label: 'Last year', shortLabel: '1 year' },
] as const;

export type DateRangeValue = (typeof DATE_RANGE_OPTIONS)[number]['value'];

export function parseDateRangeDays(dateRange: string | number): number {
  const days = parseInt(String(dateRange), 10);
  return !days || Number.isNaN(days) ? 30 : days;
}

/**
 * Inclusive calendar-day window: "Last 7 days" = today + previous 6 days,
 * starting at local midnight. Matches chart series (`getTrendStartDate`).
 */
export function getDateRangeStart(dateRange: string | number): Date {
  const days = parseDateRangeDays(dateRange);
  const start = startOfLocalDay(new Date());
  start.setDate(start.getDate() - (days - 1));
  return start;
}

export function getDateRangeEnd(): Date {
  const end = startOfLocalDay(new Date());
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getDateRangeLabel(dateRange: string | number): string {
  const key = String(dateRange);
  const match = DATE_RANGE_OPTIONS.find((opt) => opt.value === key);
  if (match) return match.label;
  return `Last ${parseDateRangeDays(dateRange)} days`;
}

export function getDateRangeSpanLabel(dateRange: string | number): string {
  const start = getDateRangeStart(dateRange);
  const end = startOfLocalDay(new Date());
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (toLocalDateKey(start) === toLocalDateKey(end)) return fmt(end);
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = sameYear
    ? fmt(start)
    : start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
  const endLabel = sameYear
    ? fmt(end)
    : end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
  return `${startLabel} – ${endLabel}`;
}

export function filterTicketsByDateRange(
  tickets: Array<Record<string, unknown>>,
  dateRange: string | number,
) {
  const days = parseInt(String(dateRange), 10);
  if (!days || Number.isNaN(days)) return tickets;

  const start = getDateRangeStart(days);
  const end = getDateRangeEnd();

  return tickets.filter((ticket) => {
    const created = parseTicketDate(ticket.createdAt);
    return created ? created >= start && created <= end : false;
  });
}

function filterFeedbackByDateRangeInternal(
  feedback: Array<{ rating?: number; createdAt?: unknown }> = [],
  dateRange: string | number,
) {
  const days = parseInt(String(dateRange), 10);
  if (!days || Number.isNaN(days)) return feedback;

  const start = getDateRangeStart(days);
  const end = getDateRangeEnd();

  return feedback.filter((item) => {
    const itemDate = parseTicketDate(item.createdAt);
    // Match Feedback tab: undated items are excluded
    return itemDate ? itemDate >= start && itemDate <= end : false;
  });
}

/** Same date window as Feedback tab / report feedback summary */
export function filterFeedbackForDateRange<
  T extends { rating?: number; createdAt?: unknown },
>(feedback: T[] = [], dateRange: string | number = '30'): T[] {
  return filterFeedbackByDateRangeInternal(feedback, dateRange) as T[];
}

export function formatExecutiveDuration(hours: number | null | undefined): string {
  if (hours == null || Number.isNaN(hours) || hours <= 0) return '—';
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return minutes < 1 ? 'under 1 minute' : `about ${minutes} minutes`;
  }
  if (hours < 24) {
    const rounded = Math.round(hours * 10) / 10;
    return rounded === 1 ? 'about 1 hour' : `about ${rounded} hours`;
  }
  const days = Math.round((hours / 24) * 10) / 10;
  return days === 1 ? 'about 1 day' : `about ${days} days`;
}

export function computeExecutiveMetrics(
  tickets: Array<Record<string, unknown>> = [],
  feedback: Array<{ rating?: number; createdAt?: unknown }> = [],
  dateRange: string | number = '30',
) {
  const scopedTickets = filterTicketsByDateRange(tickets, dateRange);
  const scopedFeedback = filterFeedbackByDateRangeInternal(feedback, dateRange);
  const totalTickets = scopedTickets.length;
  const resolvedTickets = scopedTickets.filter((t) =>
    isCompletedStatus(String(t.status ?? '')),
  );
  const openTickets = scopedTickets.filter((t) =>
    isOpenStatus(String(t.status ?? '')),
  );
  const inProgressTickets = scopedTickets.filter((t) =>
    isInProgressStatus(String(t.status ?? '')),
  );

  const resolutionTimes = resolvedTickets
    .map((ticket) => {
      const completedAt = getTicketCompletedAt(ticket);
      return completedAt
        ? getTicketHours(ticket.createdAt, completedAt)
        : null;
    })
    .filter((hours): hours is number => hours !== null);

  const avgResolutionTime =
    resolutionTimes.length > 0
      ? Math.round(
          (resolutionTimes.reduce((sum, hours) => sum + hours, 0) /
            resolutionTimes.length) *
            10,
        ) / 10
      : 0;

  const resolutionRate =
    totalTickets > 0
      ? Math.round((resolvedTickets.length / totalTickets) * 100)
      : 0;

  const criticalTickets = scopedTickets.filter(
    (t) => normalizeTicketPriority(String(t.priority ?? '')) === 'critical',
  );
  const urgentOpenTickets = scopedTickets.filter((t) => {
    const priority = normalizeTicketPriority(String(t.priority ?? ''));
    return (
      (priority === 'critical' || priority === 'high') &&
      !isCompletedStatus(String(t.status ?? ''))
    );
  }).length;

  let customerSatisfaction = 0;
  if (scopedFeedback.length > 0) {
    const highRatings = scopedFeedback.filter(
      (item) => Number(item.rating ?? 0) >= 4,
    ).length;
    // 1 decimal — same as Feedback tab “Happy users”
    customerSatisfaction =
      Math.round((highRatings / scopedFeedback.length) * 1000) / 10;
  }

  return {
    totalTickets,
    resolvedCount: resolvedTickets.length,
    openCount: openTickets.length,
    inProgressCount: inProgressTickets.length,
    stillOpenCount: openTickets.length + inProgressTickets.length,
    resolutionRate,
    avgResolutionTime,
    criticalTickets: criticalTickets.length,
    urgentOpenTickets,
    customerSatisfaction,
    feedbackCount: scopedFeedback.length,
  };
}

export function computeHealthStatus(metrics: {
  resolutionRate?: number;
  avgResolutionTime?: number;
  criticalTickets?: number;
  customerSatisfaction?: number;
  urgentOpenTickets?: number;
}) {
  let score = 0;

  if ((metrics.resolutionRate ?? 0) >= 90) score += 30;
  else if ((metrics.resolutionRate ?? 0) >= 75) score += 20;
  else if ((metrics.resolutionRate ?? 0) >= 60) score += 10;

  const avgTime = metrics.avgResolutionTime ?? 0;
  if (avgTime > 0 && avgTime <= 24) score += 25;
  else if (avgTime <= 48) score += 15;
  else if (avgTime <= 72) score += 5;

  const urgentOpen = metrics.urgentOpenTickets ?? metrics.criticalTickets ?? 0;
  if (urgentOpen === 0) score += 20;
  else if (urgentOpen <= 2) score += 10;

  if ((metrics.customerSatisfaction ?? 0) >= 90) score += 25;
  else if ((metrics.customerSatisfaction ?? 0) >= 75) score += 15;
  else if ((metrics.customerSatisfaction ?? 0) >= 60) score += 5;

  let status = 'Critical';
  let headline = 'Needs immediate attention';
  let summary =
    'Support is behind on key targets. Review open requests and prioritize urgent items.';

  if (score >= 85) {
    status = 'Excellent';
    headline = 'Everything looks healthy';
    summary =
      'Requests are being completed on time and users are generally satisfied.';
  } else if (score >= 70) {
    status = 'Good';
    headline = 'Support is on track';
    summary =
      'Most requests are handled well. A few areas may still need attention.';
  } else if (score >= 50) {
    status = 'Fair';
    headline = 'Mixed performance';
    summary =
      'Some targets are being met, but completion speed or satisfaction could improve.';
  }

  return { status, score, headline, summary };
}

/** Earliest date shown on management dashboard trend charts */
export const ANALYTICS_EARLIEST_DATE = new Date(2026, 5, 1);

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfLocalDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getTrendStartDate(
  dateRangeDays: number,
  earliestDate: Date = ANALYTICS_EARLIEST_DATE,
): Date {
  const rangeStart = getDateRangeStart(dateRangeDays);
  const earliestDay = startOfLocalDay(earliestDate);
  return rangeStart < earliestDay ? earliestDay : rangeStart;
}

export function buildDailyTrendSeries<T extends Record<string, unknown>>(
  tickets: Array<Record<string, unknown>>,
  dateRangeDays: number,
  mapDay: (dayTickets: Array<Record<string, unknown>>, date: Date) => T,
  options: { clampToEarliest?: boolean } = {},
): Array<{ date: string; dateLabel: string; dateKey: string } & T> {
  const { clampToEarliest = true } = options;
  const start = clampToEarliest
    ? getTrendStartDate(dateRangeDays)
    : getDateRangeStart(dateRangeDays);
  const end = startOfLocalDay(new Date());
  const data: Array<{ date: string; dateLabel: string; dateKey: string } & T> = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const dateKey = toLocalDateKey(cursor);
    const dayTickets = tickets.filter((ticket) => {
      const ticketDate = parseTicketDate(ticket.createdAt);
      return ticketDate ? toLocalDateKey(ticketDate) === dateKey : false;
    });

    data.push({
      date: `${cursor.getMonth() + 1}/${cursor.getDate()}`,
      dateLabel: cursor.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      dateKey,
      ...mapDay(dayTickets, cursor),
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return data;
}

export const FIX_DURATION_COLORS = {
  green: '#10b981',
  amber: '#f59e0b',
  orange: '#f97316',
  red: '#f43f5e',
  muted: '#9CA3AF',
} as const;

/** green = 1–2 days, amber = 3–6 days, orange = 7–13 days, red = 2 weeks+ */
export function fixDurationFill(days: number | null | undefined): string {
  if (days == null || Number.isNaN(days)) return FIX_DURATION_COLORS.muted;
  if (days < 3) return FIX_DURATION_COLORS.green;
  if (days <= 6) return FIX_DURATION_COLORS.amber;
  if (days >= 14) return FIX_DURATION_COLORS.red;
  return FIX_DURATION_COLORS.orange;
}

export function hoursToDays(hours: number | null | undefined): number | null {
  if (hours == null || Number.isNaN(hours)) return null;
  return Math.round((hours / 24) * 10) / 10;
}

export function buildWeeklyFixTimes(
  tickets: Array<Record<string, unknown>> = [],
): Array<{
  week: string;
  weekLabel: string;
  avgDays: number | null;
  avgHours: number;
  count: number;
  fill: string;
}> {
  const buckets = new Map<
    string,
    { weekStart: Date; totalHours: number; count: number }
  >();

  tickets.forEach((ticket) => {
    if (!isCompletedStatus(String(ticket.status ?? ''))) return;
    const completedAt = getTicketCompletedAt(ticket);
    if (!completedAt) return;
    const hours = getTicketHours(ticket.createdAt, completedAt);
    if (hours === null) return;

    const day = startOfLocalDay(completedAt);
    const weekStart = new Date(day);
    const dayOfWeek = weekStart.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + diffToMonday);

    const key = toLocalDateKey(weekStart);
    if (!buckets.has(key)) {
      buckets.set(key, { weekStart, totalHours: 0, count: 0 });
    }
    const bucket = buckets.get(key)!;
    bucket.totalHours += hours;
    bucket.count += 1;
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
    .map((bucket) => {
      const avgHours = bucket.totalHours / bucket.count;
      const avgDays = hoursToDays(avgHours);
      const weekEnd = new Date(bucket.weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const label = bucket.weekStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return {
        week: label,
        weekLabel: `${bucket.weekStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })} – ${weekEnd.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}`,
        avgDays,
        avgHours: Math.round(avgHours * 10) / 10,
        count: bucket.count,
        fill: fixDurationFill(avgDays),
      };
    });
}

export function buildFixTimeSummary(
  tickets: Array<Record<string, unknown>> = [],
): {
  typical: number | null;
  fastest: number | null;
  slowest: number | null;
  count: number;
} {
  const hoursList: number[] = [];
  tickets.forEach((ticket) => {
    if (!isCompletedStatus(String(ticket.status ?? ''))) return;
    const completedAt = getTicketCompletedAt(ticket);
    if (!completedAt) return;
    const hours = getTicketHours(ticket.createdAt, completedAt);
    if (hours !== null) hoursList.push(hours);
  });
  if (hoursList.length === 0) {
    return { typical: null, fastest: null, slowest: null, count: 0 };
  }
  const avg = hoursList.reduce((sum, h) => sum + h, 0) / hoursList.length;
  return {
    typical: avg,
    fastest: Math.min(...hoursList),
    slowest: Math.max(...hoursList),
    count: hoursList.length,
  };
}

/** Same KPI strip as Charts tab */
export function buildChartsKpis(tickets: Array<Record<string, unknown>> = []) {
  const newRequests = tickets.length;
  const waiting = tickets.filter((t) =>
    isOpenStatus(String(t.status ?? '')),
  ).length;
  const working = tickets.filter((t) =>
    isInProgressStatus(String(t.status ?? '')),
  ).length;
  const finished = tickets.filter((t) =>
    isCompletedStatus(String(t.status ?? '')),
  ).length;
  const urgent = tickets.filter((t) => {
    const p = normalizeTicketPriority(String(t.priority ?? ''));
    return p === 'critical' || p === 'high';
  }).length;
  return {
    newRequests,
    stillOpen: waiting + working,
    finished,
    urgent,
  };
}

function serviceQualityTone(
  value: number,
  excellent: number,
  good: number,
  warning: number,
): 'excellent' | 'good' | 'warning' | 'critical' {
  if (value >= excellent) return 'excellent';
  if (value >= good) return 'good';
  if (value >= warning) return 'warning';
  return 'critical';
}

/** Same score / targets / verdict as Service Quality tab */
export function buildServiceQualitySnapshot(
  tickets: Array<Record<string, unknown>> = [],
  feedback: Array<{ rating?: number; createdAt?: unknown }> = [],
  dateRange: string | number = '30',
) {
  const scopedTickets = filterTicketsByDateRange(tickets, dateRange);
  const scopedFeedback = filterFeedbackByDateRangeInternal(feedback, dateRange);

  const totalTickets = scopedTickets.length;
  const resolvedTicketList = scopedTickets.filter((t) =>
    isCompletedStatus(String(t.status ?? '')),
  );
  const resolvedTickets = resolvedTicketList.length;
  const stillOpen = scopedTickets.filter(
    (t) =>
      isOpenStatus(String(t.status ?? '')) ||
      isInProgressStatus(String(t.status ?? '')),
  ).length;

  const resolutionTimes = resolvedTicketList
    .map((ticket) => {
      const completedAt = getTicketCompletedAt(ticket);
      return completedAt
        ? getTicketHours(ticket.createdAt, completedAt)
        : getTicketHours(ticket.createdAt, ticket.resolvedAt || ticket.updatedAt);
    })
    .filter((hours): hours is number => hours !== null);

  const avgResolutionTime =
    resolutionTimes.length > 0
      ? Math.round(
          (resolutionTimes.reduce((sum, h) => sum + h, 0) /
            resolutionTimes.length) *
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
    if (isCompletedStatus(String(t.status ?? ''))) return;
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
    const highRatings = scopedFeedback.filter(
      (item) => (item.rating || 0) >= 4,
    ).length;
    const lowRatings = scopedFeedback.filter(
      (item) => (item.rating || 0) <= 2,
    ).length;
    feedbackMetrics = {
      averageRating: Math.round(averageRating * 10) / 10,
      totalFeedback: scopedFeedback.length,
      highRatings,
      lowRatings,
      // Keep 1 decimal to match Feedback tab “Happy users”
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
    score += Math.min(
      25,
      Math.round((feedbackMetrics.satisfactionRate / 100) * 25),
    );
  } else {
    score += 10;
  }
  if (overdueOpen > 0) {
    score = Math.max(0, score - Math.min(20, overdueOpen * 2));
  }

  let verdict = 'At risk';
  let verdictTone: 'excellent' | 'good' | 'warning' | 'critical' = 'critical';
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
      targetLabel: '80%',
      hint: 'Share of completed requests finished quickly',
      tone: serviceQualityTone(fixedWithin2Days, 80, 60, 40),
      higherIsBetter: true,
    },
    {
      title: 'Completion rate',
      value: resolutionRate,
      display: `${resolutionRate}%`,
      target: 90,
      targetLabel: '90%',
      hint: `${resolvedTickets} of ${totalTickets} finished`,
      tone: serviceQualityTone(resolutionRate, 90, 80, 70),
      higherIsBetter: true,
    },
    {
      title: 'Typical fix time',
      value: avgResolutionTime,
      display: formatExecutiveDuration(avgResolutionTime),
      target: 48,
      targetLabel: `≤ ${formatExecutiveDuration(48)}`,
      hint: 'Goal: finish within about 1–2 days',
      tone:
        avgResolutionTime <= 0
          ? ('warning' as const)
          : avgResolutionTime / 24 < 3
            ? ('excellent' as const)
            : avgResolutionTime / 24 <= 6
              ? ('good' as const)
              : avgResolutionTime / 24 < 14
                ? ('warning' as const)
                : ('critical' as const),
      higherIsBetter: false,
    },
    {
      title: 'User satisfaction',
      value:
        feedbackMetrics.totalFeedback > 0 ? feedbackMetrics.averageRating : 0,
      display:
        feedbackMetrics.totalFeedback > 0
          ? `${feedbackMetrics.averageRating}/5`
          : '—',
      target: 4,
      targetLabel: '4/5',
      hint:
        feedbackMetrics.totalFeedback > 0
          ? `${feedbackMetrics.satisfactionRate}% gave 4–5 stars`
          : 'No feedback yet',
      tone:
        feedbackMetrics.totalFeedback > 0
          ? serviceQualityTone(feedbackMetrics.averageRating, 4.5, 4.0, 3.5)
          : ('warning' as const),
      higherIsBetter: true,
    },
  ];

  return {
    totalTickets,
    stillOpen,
    resolutionRate,
    avgResolutionTime,
    feedbackMetrics,
    overdueOpen,
    agingOpen,
    score,
    verdict,
    verdictTone,
    verdictSummary,
    targets,
    periodDays: parseDateRangeDays(dateRange),
  };
}

export type TeamAnalyticsRow = {
  department: string;
  totalTickets: number;
  resolvedTickets: number;
  openTickets: number;
  inProgressTickets: number;
  stillOpen: number;
  overdueOpen: number;
  resolutionRate: number;
  avgResolutionTime: number;
  health: 'idle' | 'excellent' | 'good' | 'warning' | 'critical';
  healthLabel: string;
};

function teamHealth(
  rate: number,
  hasTickets: boolean,
): { health: TeamAnalyticsRow['health']; healthLabel: string } {
  if (!hasTickets) return { health: 'idle', healthLabel: 'No activity' };
  if (rate >= 80) return { health: 'excellent', healthLabel: 'Healthy' };
  if (rate >= 60) return { health: 'good', healthLabel: 'OK' };
  if (rate >= 40) return { health: 'warning', healthLabel: 'Needs help' };
  return { health: 'critical', healthLabel: 'At risk' };
}

/** Same By Team roster / overdue / needs-help / healthiest as DepartmentAnalytics */
export function buildTeamAnalyticsReport(
  tickets: Array<Record<string, unknown>> = [],
  users: Array<{
    id?: string;
    uid?: string;
    department?: string | null;
    isActive?: boolean;
  }> = [],
  dateRange: string | number = '30',
  departmentNames: string[] = [],
) {
  const scopedTickets = filterTicketsByDateRange(tickets, dateRange);
  const now = Date.now();
  const safeUsers = Array.isArray(users) ? users : [];

  type MutableRow = {
    totalTickets: number;
    resolvedTickets: number;
    openTickets: number;
    inProgressTickets: number;
    stillOpen: number;
    overdueOpen: number;
    resolutionHours: number[];
  };

  const stats: Record<string, MutableRow> = {};
  const ensure = (name: string) => {
    if (!stats[name]) {
      stats[name] = {
        totalTickets: 0,
        resolvedTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        stillOpen: 0,
        overdueOpen: 0,
        resolutionHours: [],
      };
    }
    return stats[name];
  };

  departmentNames.forEach((name) => {
    const trimmed = String(name || '').trim();
    if (trimmed) ensure(trimmed);
  });

  const canonicalByLower: Record<string, string> = {};
  Object.keys(stats).forEach((name) => {
    canonicalByLower[name.toLowerCase()] = name;
  });

  const resolveCanonical = (raw: string | null | undefined) => {
    if (!raw) return null;
    const trimmed = String(raw).trim();
    if (!trimmed) return null;
    const existing = canonicalByLower[trimmed.toLowerCase()];
    if (existing) return existing;
    canonicalByLower[trimmed.toLowerCase()] = trimmed;
    ensure(trimmed);
    return trimmed;
  };

  scopedTickets.forEach((ticket) => {
    let deptName = resolveTicketDepartment(ticket, safeUsers);
    if (!deptName) {
      const creator = safeUsers.find((user) =>
        matchUserToTicket(user, String(ticket.createdBy ?? ticket.created_by_id ?? '')),
      );
      deptName = creator?.department || null;
    }
    // Match Charts / At a Glance: never drop tickets — bucket unknowns as Unassigned
    const dept = resolveCanonical(deptName) || resolveCanonical('Unassigned');
    if (!dept) return;

    const row = ensure(dept);
    row.totalTickets += 1;

    if (isCompletedStatus(String(ticket.status ?? ''))) {
      row.resolvedTickets += 1;
      const hours = getTicketHours(
        ticket.createdAt,
        ticket.resolvedAt || ticket.updatedAt,
      );
      if (hours !== null) row.resolutionHours.push(hours);
    } else {
      row.stillOpen += 1;
      if (isOpenStatus(String(ticket.status ?? ''))) row.openTickets += 1;
      if (isInProgressStatus(String(ticket.status ?? ''))) {
        row.inProgressTickets += 1;
      }
      const created = parseTicketDate(ticket.createdAt);
      if (created) {
        const daysOpen = (now - created.getTime()) / (1000 * 60 * 60 * 24);
        if (daysOpen >= 14) row.overdueOpen += 1;
      }
    }
  });

  const ordered: TeamAnalyticsRow[] = [];
  const seen = new Set<string>();
  const pushRow = (name: string, row: MutableRow) => {
    const resolutionRate =
      row.totalTickets > 0
        ? Math.round((row.resolvedTickets / row.totalTickets) * 100)
        : 0;
    const avgResolutionTime =
      row.resolutionHours.length > 0
        ? Math.round(
            (row.resolutionHours.reduce((sum, h) => sum + h, 0) /
              row.resolutionHours.length) *
              10,
          ) / 10
        : 0;
    const { health, healthLabel } = teamHealth(
      resolutionRate,
      row.totalTickets > 0,
    );
    ordered.push({
      department: name,
      totalTickets: row.totalTickets,
      resolvedTickets: row.resolvedTickets,
      openTickets: row.openTickets,
      inProgressTickets: row.inProgressTickets,
      stillOpen: row.stillOpen,
      overdueOpen: row.overdueOpen,
      resolutionRate,
      avgResolutionTime,
      health,
      healthLabel,
    });
  };

  departmentNames.forEach((name) => {
    const key = name.toLowerCase();
    if (seen.has(key) || !stats[name]) return;
    seen.add(key);
    pushRow(name, stats[name]);
  });

  Object.entries(stats)
    .sort(
      (a, b) =>
        b[1].stillOpen - a[1].stillOpen ||
        b[1].totalTickets - a[1].totalTickets ||
        a[0].localeCompare(b[0]),
    )
    .forEach(([name, row]) => {
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      pushRow(name, row);
    });

  const withActivity = ordered.filter((s) => s.totalTickets > 0);
  const needingHelp = withActivity.filter(
    (s) => s.stillOpen > 0 || s.resolutionRate < 60,
  );
  const needsHelp = [...ordered]
    .filter((s) => s.stillOpen > 0)
    .sort(
      (a, b) =>
        b.overdueOpen - a.overdueOpen || b.stillOpen - a.stillOpen,
    )
    .slice(0, 5);
  const healthiest = [...ordered]
    .filter((s) => s.totalTickets >= 2)
    .sort((a, b) => b.resolutionRate - a.resolutionRate)
    .slice(0, 3);

  return {
    allTeams: ordered.length,
    activeTeams: withActivity.length,
    needingHelp: needingHelp.length,
    totalOpen: withActivity.reduce((sum, s) => sum + s.stillOpen, 0),
    totalOverdue: withActivity.reduce((sum, s) => sum + s.overdueOpen, 0),
    teams: ordered,
    needsHelp,
    healthiest,
  };
}

export function buildManagementReportCharts(
  tickets: Array<Record<string, unknown>> = [],
  users: Array<{ id?: string; uid?: string; department?: string | null }> = [],
  dateRange: string | number = '30',
) {
  const scopedTickets = filterTicketsByDateRange(tickets, dateRange);
  const days = parseDateRangeDays(dateRange);

  const waiting = scopedTickets.filter((ticket) =>
    isOpenStatus(String(ticket.status ?? '')),
  ).length;
  const beingFixed = scopedTickets.filter((ticket) =>
    isInProgressStatus(String(ticket.status ?? '')),
  ).length;
  const done = scopedTickets.filter((ticket) =>
    isCompletedStatus(String(ticket.status ?? '')),
  ).length;

  // Match Charts tab: unknown priority counts as Medium
  const priorityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  scopedTickets.forEach((ticket) => {
    const p = normalizeTicketPriority(String(ticket.priority ?? ''));
    if (p === 'critical' || p === 'high' || p === 'medium' || p === 'low') {
      priorityCounts[p] += 1;
    } else {
      priorityCounts.medium += 1;
    }
  });

  const departmentStats: Record<
    string,
    { total: number; done: number; open: number }
  > = {};

  scopedTickets.forEach((ticket) => {
    const department =
      resolveTicketDepartment(ticket, users)?.trim() || 'Unassigned';
    if (!departmentStats[department]) {
      departmentStats[department] = { total: 0, done: 0, open: 0 };
    }
    departmentStats[department].total += 1;
    if (isCompletedStatus(String(ticket.status ?? ''))) {
      departmentStats[department].done += 1;
    } else {
      departmentStats[department].open += 1;
    }
  });

  // Same window + series as Charts → “Daily request activity”
  const dailyTrends = buildDailyTrendSeries(scopedTickets, days, (dayTickets) => ({
    newRequests: dayTickets.length,
    waiting: dayTickets.filter((t) => isOpenStatus(String(t.status ?? ''))).length,
    beingFixed: dayTickets.filter((t) =>
      isInProgressStatus(String(t.status ?? '')),
    ).length,
    done: dayTickets.filter((t) => isCompletedStatus(String(t.status ?? ''))).length,
    // Keep legacy keys for older export consumers
    total: dayTickets.length,
    resolved: dayTickets.filter((t) =>
      isCompletedStatus(String(t.status ?? '')),
    ).length,
  }));

  // Same as Charts → Requests by department (volume first, top 8)
  const departmentPerformance = Object.entries(departmentStats)
    .map(([department, stats]) => ({
      department,
      total: stats.total,
      resolved: stats.done,
      done: stats.done,
      open: stats.open,
      inProgress: 0,
      stillOpen: stats.open,
      resolutionRate:
        stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total || a.department.localeCompare(b.department))
    .slice(0, 8);

  const speedRanges = [
    { range: 'Under 1h', min: 0, max: 1 },
    { range: '1–4h', min: 1, max: 4 },
    { range: '4–8h', min: 4, max: 8 },
    { range: '8–24h', min: 8, max: 24 },
    { range: '1–3 days', min: 24, max: 72 },
    { range: 'Over 3 days', min: 72, max: Infinity },
  ];
  const speedDistribution = speedRanges.map((range) => ({
    name: range.range,
    value: scopedTickets.filter((ticket) => {
      if (!isCompletedStatus(String(ticket.status ?? ''))) return false;
      const completedAt = getTicketCompletedAt(ticket);
      const hours = completedAt
        ? getTicketHours(ticket.createdAt, completedAt)
        : null;
      return hours !== null && hours >= range.min && hours < range.max;
    }).length,
  }));

  // Same as Charts tab “This year by month” — full calendar year, not date-range scoped
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const monthlyComparison = monthLabels.map((month, index) => {
    const monthTickets = tickets.filter((ticket) => {
      const ticketDate = parseTicketDate(ticket.createdAt);
      return (
        !!ticketDate &&
        ticketDate.getMonth() === index &&
        ticketDate.getFullYear() === currentYear
      );
    });
    return {
      month,
      filed: monthTickets.length,
      finished: monthTickets.filter((t) =>
        isCompletedStatus(String(t.status ?? '')),
      ).length,
    };
  });

  return {
    totalTickets: scopedTickets.length,
    chartKpis: buildChartsKpis(scopedTickets),
    weeklyFixTimes: buildWeeklyFixTimes(scopedTickets),
    fixTimeSummary: buildFixTimeSummary(scopedTickets),
    // Charts tab labels: Waiting / Being fixed / Done
    ticketVolume: [
      { name: 'Waiting', value: waiting },
      { name: 'Being fixed', value: beingFixed },
      { name: 'Done', value: done },
    ],
    statusDistribution: [
      { name: 'Waiting', value: waiting },
      { name: 'Being fixed', value: beingFixed },
      { name: 'Done', value: done },
    ],
    priorityDistribution: [
      { name: 'Critical', value: priorityCounts.critical },
      { name: 'High', value: priorityCounts.high },
      { name: 'Medium', value: priorityCounts.medium },
      { name: 'Low', value: priorityCounts.low },
    ],
    departmentPerformance,
    dailyTrends,
    speedDistribution,
    monthlyComparison,
  };
}

/** Daily average resolution time for completed tickets, grouped by completion date */
export function buildResolutionTrendSeries(
  tickets: Array<Record<string, unknown>>,
  dateRangeDays: number,
): Array<{
  date: string;
  dateLabel: string;
  dateKey: string;
  avgResolutionTime: number | null;
  completedCount: number;
}> {
  const start = getTrendStartDate(dateRangeDays);
  const end = startOfLocalDay(new Date());
  const data: Array<{
    date: string;
    dateLabel: string;
    dateKey: string;
    avgResolutionTime: number | null;
    completedCount: number;
  }> = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const dateKey = toLocalDateKey(cursor);
    const completedDayTickets = tickets.filter((ticket) => {
      const completedDate = getTicketCompletedAt(ticket);
      return completedDate ? toLocalDateKey(completedDate) === dateKey : false;
    });

    const avgResolutionTime =
      completedDayTickets.length > 0
        ? completedDayTickets.reduce((sum, ticket) => {
            const completedAt = getTicketCompletedAt(ticket);
            return (
              sum +
              (completedAt
                ? (getTicketHours(ticket.createdAt, completedAt) ?? 0)
                : 0)
            );
          }, 0) / completedDayTickets.length
        : 0;

    data.push({
      date: `${cursor.getMonth() + 1}/${cursor.getDate()}`,
      dateLabel: cursor.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      dateKey,
      avgResolutionTime:
        completedDayTickets.length > 0
          ? Math.round(avgResolutionTime * 100) / 100
          : null,
      completedCount: completedDayTickets.length,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return data;
}
