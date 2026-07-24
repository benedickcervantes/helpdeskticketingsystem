import {
  getDateRangeEnd,
  getDateRangeStart,
  parseTicketDate,
} from '@/lib/utils/analytics';

export type FeedbackItem = {
  id?: string;
  ticketTitle?: string;
  ticketId?: string;
  userName?: string;
  userEmail?: string;
  userId?: string;
  rating?: number;
  suggestions?: string | null;
  createdAt?: unknown;
};

export function parseFeedbackDate(value: unknown): Date | null {
  return parseTicketDate(value);
}

export function formatFeedbackDateTime(value: unknown): string {
  const date = parseFeedbackDate(value);
  if (!date) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatFeedbackDate(value: unknown): string {
  const date = parseFeedbackDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getFeedbackUserLabel(item: FeedbackItem): string {
  if (item.userName && item.userEmail) {
    return `${item.userName} (${item.userEmail})`;
  }
  return item.userName || item.userEmail || 'Unknown user';
}

export function filterFeedbackByDateRange(
  feedback: FeedbackItem[],
  dateRange: string | number,
): FeedbackItem[] {
  const days = parseInt(String(dateRange), 10);
  if (!days || Number.isNaN(days)) return feedback;

  const start = getDateRangeStart(days);
  const end = getDateRangeEnd();

  return feedback.filter((item) => {
    const itemDate = parseFeedbackDate(item.createdAt);
    return itemDate ? itemDate >= start && itemDate <= end : false;
  });
}

export function getFeedbackReportPeriodLabel(dateRange?: string | number): string {
  const days = parseInt(String(dateRange || '30'), 10);
  if (days === 365) return 'Last year';
  if (days === 90) return 'Last 90 days';
  if (days === 30) return 'Last 30 days';
  if (days === 7) return 'Last 7 days';
  return `Last ${days} days`;
}

export type FeedbackReportMeta = {
  dateRange?: string | number;
  totalFeedback?: number;
  averageRating?: number | string;
  satisfactionRate?: number | string;
  improvementRate?: number | string;
};
