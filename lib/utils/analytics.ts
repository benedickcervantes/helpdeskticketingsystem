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

export function isResolvedStatus(status?: string): boolean {
  return status === 'resolved' || status === 'closed';
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

export function computeExecutiveMetrics(
  tickets: Array<Record<string, unknown>> = [],
  feedback: Array<{ rating?: number }> = [],
  dateRange: string | number = '30',
) {
  const scopedTickets = filterTicketsByDateRange(tickets, dateRange);
  const totalTickets = scopedTickets.length;
  const resolvedTickets = scopedTickets.filter((t) =>
    isResolvedStatus(String(t.status ?? '')),
  );

  const resolutionTimes = resolvedTickets
    .map((ticket) =>
      getTicketHours(ticket.createdAt, ticket.resolvedAt || ticket.updatedAt),
    )
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
  if (feedback.length > 0) {
    const highRatings = feedback.filter((item) => (item.rating ?? 0) >= 4).length;
    customerSatisfaction = Math.round((highRatings / feedback.length) * 100);
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
