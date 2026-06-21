export function getReportPeriodLabel(dateRange: string | number = '30'): string {
  const days = parseInt(String(dateRange), 10);
  if (days === 365) return 'Last 12 months';
  if (days === 90) return 'Last 90 days';
  if (days === 7) return 'Last 7 days';
  return `Last ${days} days`;
}

export function buildFeedbackSummary(feedback: Array<{ rating?: number }> = []) {
  const total = feedback.length;
  if (total === 0) {
    return { totalFeedback: 0, averageRating: 0, satisfactionRate: 0 };
  }
  const averageRating = (
    feedback.reduce((sum, item) => sum + (item.rating || 0), 0) / total
  ).toFixed(1);
  const satisfactionRate = Math.round(
    (feedback.filter((item) => (item.rating || 0) >= 4).length / total) * 100,
  );
  return { totalFeedback: total, averageRating, satisfactionRate };
}
