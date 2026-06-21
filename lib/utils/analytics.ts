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
  if (creator?.department) return creator.department;

  const createdBy = String(ticket.createdBy ?? '');
  if (!createdBy) return null;

  const user = users.find((entry) => matchUserToTicket(entry, createdBy));
  return user?.department ?? null;
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

export function filterTicketsByDateRange(
  tickets: Array<Record<string, unknown>>,
  dateRange: string | number,
) {
  const days = parseInt(String(dateRange), 10);
  if (!days || Number.isNaN(days)) return tickets;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return tickets.filter((ticket) => {
    const created = parseTicketDate(ticket.createdAt);
    return created ? created >= cutoff : false;
  });
}

function filterFeedbackByDateRangeInternal(
  feedback: Array<{ rating?: number; createdAt?: unknown }> = [],
  dateRange: string | number,
) {
  const days = parseInt(String(dateRange), 10);
  if (!days || Number.isNaN(days)) return feedback;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return feedback.filter((item) => {
    const itemDate = parseTicketDate(item.createdAt);
    return itemDate ? itemDate >= cutoff : false;
  });
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
    (t) => t.priority === 'critical',
  ).length;

  let customerSatisfaction = 0;
  if (scopedFeedback.length > 0) {
    const highRatings = scopedFeedback.filter((item) => (item.rating ?? 0) >= 4).length;
    customerSatisfaction = Math.round((highRatings / scopedFeedback.length) * 100);
  }

  return {
    totalTickets,
    resolutionRate,
    avgResolutionTime,
    criticalTickets,
    customerSatisfaction,
  };
}

export function computeHealthStatus(metrics: {
  resolutionRate?: number;
  avgResolutionTime?: number;
  criticalTickets?: number;
  customerSatisfaction?: number;
}) {
  let score = 0;

  if ((metrics.resolutionRate ?? 0) >= 90) score += 30;
  else if ((metrics.resolutionRate ?? 0) >= 75) score += 20;
  else if ((metrics.resolutionRate ?? 0) >= 60) score += 10;

  const avgTime = metrics.avgResolutionTime ?? 0;
  if (avgTime > 0 && avgTime <= 24) score += 25;
  else if (avgTime <= 48) score += 15;
  else if (avgTime <= 72) score += 5;

  if ((metrics.criticalTickets ?? 0) === 0) score += 20;
  else if ((metrics.criticalTickets ?? 0) <= 2) score += 10;

  if ((metrics.customerSatisfaction ?? 0) >= 90) score += 25;
  else if ((metrics.customerSatisfaction ?? 0) >= 75) score += 15;
  else if ((metrics.customerSatisfaction ?? 0) >= 60) score += 5;

  let status = 'Critical';
  if (score >= 85) status = 'Excellent';
  else if (score >= 70) status = 'Good';
  else if (score >= 50) status = 'Fair';

  return { status, score };
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
  const today = startOfLocalDay(new Date());
  const earliestDay = startOfLocalDay(earliestDate);
  const rangeStart = startOfLocalDay(new Date(today));
  const safeDays = Math.max(parseInt(String(dateRangeDays), 10) || 30, 1);
  rangeStart.setDate(rangeStart.getDate() - (safeDays - 1));
  return rangeStart < earliestDay ? earliestDay : rangeStart;
}

export function buildDailyTrendSeries<T extends Record<string, unknown>>(
  tickets: Array<Record<string, unknown>>,
  dateRangeDays: number,
  mapDay: (dayTickets: Array<Record<string, unknown>>, date: Date) => T,
): Array<{ date: string; dateLabel: string; dateKey: string } & T> {
  const start = getTrendStartDate(dateRangeDays);
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

export function buildManagementReportCharts(
  tickets: Array<Record<string, unknown>> = [],
  users: Array<{ id?: string; uid?: string; department?: string | null }> = [],
  dateRange: string | number = '30',
) {
  const scopedTickets = filterTicketsByDateRange(tickets, dateRange);
  const days = parseInt(String(dateRange), 10) || 30;
  const totalTickets = scopedTickets.length;

  const openTickets = scopedTickets.filter((ticket) =>
    isOpenStatus(String(ticket.status ?? '')),
  ).length;
  const inProgressTickets = scopedTickets.filter((ticket) =>
    isInProgressStatus(String(ticket.status ?? '')),
  ).length;
  const resolvedTickets = scopedTickets.filter((ticket) =>
    isCompletedStatus(String(ticket.status ?? '')),
  ).length;

  const priorityCounts = {
    critical: scopedTickets.filter(
      (ticket) => normalizeTicketPriority(String(ticket.priority ?? '')) === 'critical',
    ).length,
    high: scopedTickets.filter(
      (ticket) => normalizeTicketPriority(String(ticket.priority ?? '')) === 'high',
    ).length,
    medium: scopedTickets.filter(
      (ticket) => normalizeTicketPriority(String(ticket.priority ?? '')) === 'medium',
    ).length,
    low: scopedTickets.filter(
      (ticket) => normalizeTicketPriority(String(ticket.priority ?? '')) === 'low',
    ).length,
  };

  const departmentStats: Record<
    string,
    { total: number; resolved: number; open: number; inProgress: number }
  > = {};

  scopedTickets.forEach((ticket) => {
    const department = resolveTicketDepartment(ticket, users);
    if (!department) return;

    if (!departmentStats[department]) {
      departmentStats[department] = { total: 0, resolved: 0, open: 0, inProgress: 0 };
    }

    departmentStats[department].total += 1;
    if (isCompletedStatus(String(ticket.status ?? ''))) {
      departmentStats[department].resolved += 1;
    }
    if (isOpenStatus(String(ticket.status ?? ''))) {
      departmentStats[department].open += 1;
    }
    if (isInProgressStatus(String(ticket.status ?? ''))) {
      departmentStats[department].inProgress += 1;
    }
  });

  const dailyTrends = buildDailyTrendSeries(scopedTickets, days, (dayTickets) => ({
    total: dayTickets.length,
    resolved: dayTickets.filter((ticket) =>
      isCompletedStatus(String(ticket.status ?? '')),
    ).length,
  }));

  return {
    ticketVolume: [
      { name: 'Total', value: totalTickets },
      { name: 'Open', value: openTickets },
      { name: 'In Progress', value: inProgressTickets },
      { name: 'Resolved', value: resolvedTickets },
    ],
    statusDistribution: [
      { name: 'Open', value: openTickets },
      { name: 'In Progress', value: inProgressTickets },
      { name: 'Resolved', value: resolvedTickets },
    ],
    priorityDistribution: [
      { name: 'Critical', value: priorityCounts.critical },
      { name: 'High', value: priorityCounts.high },
      { name: 'Medium', value: priorityCounts.medium },
      { name: 'Low', value: priorityCounts.low },
    ],
    departmentPerformance: Object.entries(departmentStats)
      .map(([department, stats]) => ({
        department,
        total: stats.total,
        resolved: stats.resolved,
        open: stats.open,
        inProgress: stats.inProgress,
        resolutionRate:
          stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total),
    dailyTrends,
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
