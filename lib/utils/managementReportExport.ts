import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import { formatExecutiveDuration } from '@/lib/utils/analytics';

export { getReportPeriodLabel, buildFeedbackSummary } from '@/lib/utils/managementReportUtils';

export const REPORT_BRAND = {
  emerald: [16, 185, 129] as const,
  emeraldDark: [5, 150, 105] as const,
  slate900: [15, 23, 42] as const,
  slate700: [51, 65, 85] as const,
  slate500: [100, 116, 139] as const,
  slate200: [226, 232, 240] as const,
  slate50: [248, 250, 252] as const,
  white: [255, 255, 255] as const,
};

export const ORGANIZATION = 'FPDC IT Helpdesk';

export type ManagementReport = {
  title: string;
  subtitle?: string;
  date: string;
  period: string;
  reportType?: string;
  summary?: {
    totalRequests?: number;
    resolutionRate?: number;
    avgResolutionTime?: number;
    avgResolutionLabel?: string;
    customerSatisfaction?: number;
    criticalIssues?: number;
    finishedCount?: number;
    openCount?: number;
    inProgressCount?: number;
    stillOpenCount?: number;
    feedbackCount?: number;
  };
  chartKpis?: {
    newRequests?: number;
    stillOpen?: number;
    finished?: number;
    urgent?: number;
  };
  feedbackSummary?: {
    totalFeedback?: number;
    averageRating?: number | string;
    satisfactionRate?: number | string;
    improvementRate?: number | string;
    highRatings?: number;
    lowRatings?: number;
    ratingDistribution?: Record<string | number, number>;
    ratingBreakdown?: Array<{
      star: number;
      count: number;
      percent: string;
    }>;
    recentComments?: Array<{
      rating: number;
      userName: string;
      comment: string;
      date: string;
      ticketTitle?: string;
      hasComment?: boolean;
    }>;
  };
  healthStatus?: string;
  healthScore?: number;
  healthHeadline?: string;
  healthSummary?: string;
  serviceQuality?: {
    score?: number;
    verdict?: string;
    verdictTone?: string;
    verdictSummary?: string;
    resolutionRate?: number;
    stillOpen?: number;
    overdueOpen?: number;
    agingOpen?: number;
    targets?: Array<{
      title: string;
      display: string;
      value?: number;
      target?: number;
      targetLabel?: string;
      hint?: string;
      tone?: string;
      higherIsBetter?: boolean;
    }>;
    feedbackMetrics?: {
      totalFeedback?: number;
      averageRating?: number;
      satisfactionRate?: number;
      highRatings?: number;
      lowRatings?: number;
    };
  };
  teamAnalytics?: {
    allTeams?: number;
    activeTeams?: number;
    needingHelp?: number;
    totalOpen?: number;
    totalOverdue?: number;
    teams?: Array<{
      department: string;
      totalTickets: number;
      resolvedTickets: number;
      stillOpen: number;
      overdueOpen: number;
      resolutionRate: number;
      avgResolutionTime: number;
      healthLabel: string;
    }>;
    needsHelp?: Array<{
      department: string;
      stillOpen: number;
      overdueOpen: number;
      resolutionRate?: number;
    }>;
    healthiest?: Array<{
      department: string;
      resolutionRate: number;
      totalTickets: number;
    }>;
  };
  charts?: {
    ticketVolume?: Array<{ name: string; value: number }>;
    statusDistribution?: Array<{ name: string; value: number }>;
    priorityDistribution?: Array<{ name: string; value: number }>;
    dailyTrends?: Array<{
      date?: string;
      total?: number;
      resolved?: number;
      newRequests?: number;
      waiting?: number;
      beingFixed?: number;
      done?: number;
    }>;
    departmentPerformance?: Array<{
      department: string;
      total: number;
      resolved: number;
      done?: number;
      open?: number;
      resolutionRate: number;
    }>;
    speedDistribution?: Array<{ name: string; value: number }>;
    monthlyComparison?: Array<{ month: string; filed: number; finished: number }>;
    weeklyFixTimes?: Array<{
      week: string;
      weekLabel: string;
      avgDays: number | null;
      avgHours: number;
      count: number;
      fill: string;
    }>;
    fixTimeSummary?: {
      typical: number | null;
      fastest: number | null;
      slowest: number | null;
      count: number;
    };
    chartKpis?: {
      newRequests: number;
      stillOpen: number;
      finished: number;
      urgent: number;
    };
  };
  keyFindings?: string[];
  recommendations?: string[];
};

const CHART_COLORS = ['#059669', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const DAILY_TREND_SERIES = [
  { key: 'newRequests', label: 'New', color: '#3b82f6' },
  { key: 'waiting', label: 'Waiting', color: '#ef4444' },
  { key: 'beingFixed', label: 'Being fixed', color: '#f59e0b' },
  { key: 'done', label: 'Done', color: '#10b981' },
] as const;

function drawChartFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  title: string,
) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, canvas.width, 56);
  ctx.fillStyle = '#059669';
  ctx.fillRect(0, 56, canvas.width, 3);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(title, 28, 36);
}

export function createReportChart(
  data: Array<{ name?: string; value?: number; department?: string; total?: number; date?: string }> | undefined,
  type: 'bar' | 'pie' | 'line',
  title: string,
  colors: string[] = CHART_COLORS,
): string {
  const safeData = (data || [])
    .map((item) => ({
      name: item.name || item.department || item.date || 'Unknown',
      value: Number(item.value ?? item.total ?? 0),
    }))
    .filter((item) => item.value >= 0);

  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  drawChartFrame(ctx, canvas, title);

  if (safeData.length === 0) {
    ctx.fillStyle = '#64748B';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No data available for this chart', canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  }

  if (type === 'bar') {
    const chartLeft = 70;
    const chartTop = 90;
    const chartWidth = canvas.width - 120;
    const chartHeight = 300;
    const barWidth = Math.min(72, chartWidth / safeData.length - 24);
    const gap = (chartWidth - barWidth * safeData.length) / (safeData.length + 1);
    const maxValue = Math.max(...safeData.map((d) => d.value), 1);

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const y = chartTop + chartHeight - (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartLeft + chartWidth, y);
      ctx.stroke();
    }

    safeData.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = chartLeft + gap + index * (barWidth + gap);
      const y = chartTop + chartHeight - barHeight;

      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(String(item.value), x + barWidth / 2, y - 8);

      ctx.fillStyle = '#475569';
      ctx.font = '12px Arial';
      const label =
        item.name.length > 12 ? `${item.name.slice(0, 11)}…` : item.name;
      ctx.fillText(label, x + barWidth / 2, chartTop + chartHeight + 22);
    });
  } else if (type === 'line') {
    const chartLeft = 70;
    const chartTop = 90;
    const chartWidth = canvas.width - 120;
    const chartHeight = 300;
    const maxValue = Math.max(...safeData.map((d) => d.value), 1);
    const pointGap = safeData.length > 1 ? chartWidth / (safeData.length - 1) : chartWidth;

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const y = chartTop + chartHeight - (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartLeft + chartWidth, y);
      ctx.stroke();
    }

    ctx.strokeStyle = colors[0] || '#059669';
    ctx.lineWidth = 3;
    ctx.beginPath();
    safeData.forEach((item, index) => {
      const x = chartLeft + index * pointGap;
      const y = chartTop + chartHeight - (item.value / maxValue) * chartHeight;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    safeData.forEach((item, index) => {
      const x = chartLeft + index * pointGap;
      const y = chartTop + chartHeight - (item.value / maxValue) * chartHeight;
      ctx.fillStyle = colors[0] || '#059669';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();

      if (safeData.length <= 14 || index % Math.ceil(safeData.length / 10) === 0) {
        ctx.fillStyle = '#475569';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        const label =
          item.name.length > 8 ? `${item.name.slice(0, 7)}…` : item.name;
        ctx.fillText(label, x, chartTop + chartHeight + 20);
      }
    });
  } else {
    const centerX = canvas.width / 2;
    const centerY = 250;
    const radius = 110;
    let currentAngle = -Math.PI / 2;
    const total = safeData.reduce((sum, item) => sum + item.value, 0);

    safeData.forEach((item, index) => {
      const sliceAngle = total > 0 ? (item.value / total) * 2 * Math.PI : 0;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      currentAngle += sliceAngle;
    });

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 42, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(String(total), centerX, centerY + 6);

    let legendY = 96;
    safeData.forEach((item, index) => {
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(canvas.width - 250, legendY, 14, 14);
      ctx.fillStyle = '#334155';
      ctx.font = '13px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${item.name}: ${item.value}`, canvas.width - 228, legendY + 12);
      legendY += 24;
    });
  }

  return canvas.toDataURL('image/png');
}

/** Multi-line chart matching Charts tab “Daily request activity” */
export function createMultiSeriesLineChart(
  data: Array<Record<string, unknown>> | undefined,
  series: Array<{ key: string; label: string; color: string }>,
  title: string,
  xKey = 'date',
): string {
  const rows = Array.isArray(data) ? data : [];
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  drawChartFrame(ctx, canvas, title);

  if (rows.length === 0) {
    ctx.fillStyle = '#64748B';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No data available for this chart', canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  }

  const chartLeft = 70;
  const chartTop = 100;
  const chartWidth = canvas.width - 140;
  const chartHeight = 280;
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => series.map((s) => Number(row[s.key] ?? 0))),
  );
  const pointGap = rows.length > 1 ? chartWidth / (rows.length - 1) : chartWidth;

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = chartTop + chartHeight - (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartLeft + chartWidth, y);
    ctx.stroke();
  }

  series.forEach((s) => {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.key === 'newRequests' ? 3 : 2;
    ctx.beginPath();
    rows.forEach((row, index) => {
      const x = chartLeft + index * pointGap;
      const y =
        chartTop + chartHeight - (Number(row[s.key] ?? 0) / maxValue) * chartHeight;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    if (rows.length <= 14) {
      rows.forEach((row, index) => {
        const x = chartLeft + index * pointGap;
        const y =
          chartTop + chartHeight - (Number(row[s.key] ?? 0) / maxValue) * chartHeight;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  });

  rows.forEach((row, index) => {
    if (rows.length > 14 && index % Math.ceil(rows.length / 10) !== 0) return;
    const x = chartLeft + index * pointGap;
    const label = String(row[xKey] ?? '');
    ctx.fillStyle = '#475569';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      label.length > 8 ? `${label.slice(0, 7)}…` : label,
      x,
      chartTop + chartHeight + 20,
    );
  });

  series.forEach((s, index) => {
    const x = 70 + index * 160;
    ctx.fillStyle = s.color;
    ctx.fillRect(x, 68, 12, 12);
    ctx.fillStyle = '#334155';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(s.label, x + 18, 78);
  });

  return canvas.toDataURL('image/png');
}

/** Stacked horizontal bars matching Charts tab department view (Done + Still open) */
export function createDepartmentStackedChart(
  departments:
    | Array<{
        department: string;
        total: number;
        done?: number;
        resolved?: number;
        open?: number;
      }>
    | undefined,
  title: string,
): string {
  const rows = (departments || []).slice(0, 8);
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = Math.max(420, 90 + rows.length * 48);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  drawChartFrame(ctx, canvas, title);

  if (rows.length === 0) {
    ctx.fillStyle = '#64748B';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No data available for this chart', canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  }

  const maxTotal = Math.max(...rows.map((r) => r.total), 1);
  const labelWidth = 210;
  const barLeft = 40 + labelWidth;
  const barWidth = canvas.width - barLeft - 80;
  const rowHeight = 40;

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(barLeft, 68, 12, 12);
  ctx.fillStyle = '#334155';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Still open', barLeft + 18, 78);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(barLeft + 110, 68, 12, 12);
  ctx.fillStyle = '#334155';
  ctx.fillText('Done', barLeft + 128, 78);

  rows.forEach((row, index) => {
    const y = 100 + index * rowHeight;
    const done = Number(row.done ?? row.resolved ?? 0);
    const open = Number(row.open ?? Math.max(row.total - done, 0));
    const openW = (open / maxTotal) * barWidth;
    const doneW = (done / maxTotal) * barWidth;

    ctx.fillStyle = '#0F172A';
    ctx.font = '13px Arial';
    ctx.textAlign = 'right';
    const name =
      row.department.length > 24
        ? `${row.department.slice(0, 23)}…`
        : row.department;
    ctx.fillText(name, barLeft - 12, y + 16);

    // Match Charts tab stack: Still open then Done
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(barLeft, y, openW, 22);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(barLeft + openW, y, doneW, 22);

    ctx.fillStyle = '#334155';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(
      `${row.total} · ${open} open · ${done} done`,
      barLeft + openW + doneW + 8,
      y + 16,
    );
  });

  return canvas.toDataURL('image/png');
}

/** Colored weekly avg bars matching Charts → “How long do fixes usually take?” */
export function createWeeklyFixTimeChart(
  weeks:
    | Array<{
        week: string;
        avgDays: number | null;
        fill: string;
        count?: number;
      }>
    | undefined,
  title: string,
  summary?: {
    typical: number | null;
    fastest: number | null;
    slowest: number | null;
    count: number;
  },
): string {
  const rows = Array.isArray(weeks) ? weeks : [];
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 520;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  drawChartFrame(ctx, canvas, title);

  if (rows.length === 0) {
    ctx.fillStyle = '#64748B';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No finished tickets in this period yet', canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  }

  if (summary) {
    const cards = [
      { label: 'Typical', value: formatExecutiveDuration(summary.typical) },
      { label: 'Fastest', value: formatExecutiveDuration(summary.fastest) },
      { label: 'Slowest', value: formatExecutiveDuration(summary.slowest) },
    ];
    const cardW = 180;
    cards.forEach((card, i) => {
      const x = 70 + i * (cardW + 16);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(x, 70, cardW, 48);
      ctx.strokeStyle = '#E2E8F0';
      ctx.strokeRect(x, 70, cardW, 48);
      ctx.fillStyle = '#64748B';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(card.label, x + cardW / 2, 88);
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(card.value, x + cardW / 2, 108);
    });
  }

  const chartLeft = 70;
  const chartTop = 140;
  const chartWidth = canvas.width - 120;
  const chartHeight = 280;
  const maxValue = Math.max(1, ...rows.map((r) => Number(r.avgDays ?? 0)));
  const barWidth = Math.min(56, chartWidth / rows.length - 16);
  const gap = (chartWidth - barWidth * rows.length) / (rows.length + 1);

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = chartTop + chartHeight - (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartLeft + chartWidth, y);
    ctx.stroke();
  }

  rows.forEach((row, index) => {
    const value = Number(row.avgDays ?? 0);
    const barH = (value / maxValue) * chartHeight;
    const x = chartLeft + gap + index * (barWidth + gap);
    ctx.fillStyle = row.fill || '#10b981';
    ctx.fillRect(x, chartTop + chartHeight - barH, barWidth, barH);
    ctx.fillStyle = '#475569';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(row.week, x + barWidth / 2, chartTop + chartHeight + 18);
  });

  if (summary) {
    ctx.fillStyle = '#64748B';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Based on ${summary.count} finished request${summary.count === 1 ? '' : 's'} in this period`,
      chartLeft,
      canvas.height - 24,
    );
  }

  return canvas.toDataURL('image/png');
}

/** Grouped bars for “This year by month” (Filed vs Finished) */
export function createMonthlyGroupedBarChart(
  data: Array<{ month: string; filed: number; finished: number }> | undefined,
  title: string,
): string {
  const rows = Array.isArray(data) ? data : [];
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  drawChartFrame(ctx, canvas, title);

  if (rows.length === 0 || !rows.some((r) => r.filed > 0)) {
    ctx.fillStyle = '#64748B';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No monthly data yet', canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  }

  const chartLeft = 70;
  const chartTop = 100;
  const chartWidth = canvas.width - 120;
  const chartHeight = 300;
  const groupWidth = chartWidth / rows.length;
  const barWidth = Math.min(18, groupWidth / 2 - 6);
  const maxValue = Math.max(1, ...rows.flatMap((r) => [r.filed, r.finished]));

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = chartTop + chartHeight - (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartLeft + chartWidth, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(chartLeft, 68, 12, 12);
  ctx.fillStyle = '#334155';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Filed', chartLeft + 18, 78);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(chartLeft + 90, 68, 12, 12);
  ctx.fillStyle = '#334155';
  ctx.fillText('Finished', chartLeft + 108, 78);

  rows.forEach((row, index) => {
    const groupX = chartLeft + index * groupWidth + groupWidth / 2;
    const filedH = (row.filed / maxValue) * chartHeight;
    const finishedH = (row.finished / maxValue) * chartHeight;

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(groupX - barWidth - 2, chartTop + chartHeight - filedH, barWidth, filedH);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(groupX + 2, chartTop + chartHeight - finishedH, barWidth, finishedH);

    ctx.fillStyle = '#475569';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(row.month, groupX, chartTop + chartHeight + 18);
  });

  return canvas.toDataURL('image/png');
}

function buildChartImages(report: ManagementReport) {
  if (!report.charts) return [];

  const statusColors = ['#ef4444', '#f59e0b', '#10b981'];
  const priorityColors = ['#dc2626', '#ea580c', '#d97706', '#16a34a'];

  return [
    ...(report.charts.dailyTrends?.length
      ? [
          {
            title: 'Daily request activity',
            image: createMultiSeriesLineChart(
              report.charts.dailyTrends as Array<Record<string, unknown>>,
              [...DAILY_TREND_SERIES],
              'Daily request activity',
            ),
          },
        ]
      : []),
    {
      title: 'Where requests stand',
      image: createReportChart(
        report.charts.statusDistribution || report.charts.ticketVolume,
        'bar',
        'Where requests stand',
        statusColors,
      ),
    },
    {
      title: 'How urgent are they?',
      image: createReportChart(
        (report.charts.priorityDistribution || []).filter((item) => item.value > 0),
        'pie',
        'How urgent are they?',
        priorityColors,
      ),
    },
    {
      title: 'Requests by department',
      image: createDepartmentStackedChart(
        report.charts.departmentPerformance,
        'Requests by department',
      ),
    },
    ...(report.charts.weeklyFixTimes?.length
      ? [
          {
            title: 'How long do fixes usually take?',
            image: createWeeklyFixTimeChart(
              report.charts.weeklyFixTimes,
              'How long do fixes usually take?',
              report.charts.fixTimeSummary,
            ),
          },
        ]
      : []),
    ...(report.charts.speedDistribution?.some((item) => item.value > 0)
      ? [
          {
            title: 'How fast were tickets finished?',
            image: createReportChart(
              report.charts.speedDistribution,
              'bar',
              'How fast were tickets finished?',
              ['#3b82f6'],
            ),
          },
        ]
      : []),
    ...(report.charts.monthlyComparison?.some((m) => m.filed > 0)
      ? [
          {
            title: 'This year by month',
            image: createMonthlyGroupedBarChart(
              report.charts.monthlyComparison,
              'This year by month',
            ),
          },
        ]
      : []),
  ].filter((chart) => chart.image);
}

async function resolveChartImages(report: ManagementReport) {
  // Accuracy-first: prefer live Recharts snapshots; only fall back if capture fails
  try {
    const { captureDashboardStyleCharts } = await import(
      '@/lib/utils/managementReportChartCapture'
    );
    const captured = await captureDashboardStyleCharts(report.charts);
    if (captured.length > 0) return captured;
    console.warn('Chart capture returned empty set; using canvas fallback');
  } catch (error) {
    console.warn('Recharts capture failed, using canvas fallback charts', error);
  }
  return buildChartImages(report);
}

function fileStamp(title: string) {
  const safeTitle = title.replace(/\s+/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${safeTitle}_${timestamp}`;
}

export async function exportManagementReportPdf(report: ManagementReport) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const setFill = (rgb: readonly [number, number, number]) => pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setDraw = (rgb: readonly [number, number, number]) => pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const setText = (rgb: readonly [number, number, number]) => pdf.setTextColor(rgb[0], rgb[1], rgb[2]);

  const drawFooter = (page: number, totalPages: number) => {
    pdf.setPage(page);
    setDraw(REPORT_BRAND.slate200);
    pdf.setLineWidth(0.2);
    pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    setText(REPORT_BRAND.slate500);
    pdf.text(ORGANIZATION, margin, pageHeight - 8);
    pdf.text(`${report.reportType || 'Management Report'} · Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 8, {
      align: 'right',
    });
  };

  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - 22) {
      pdf.addPage();
      setFill(REPORT_BRAND.emerald);
      pdf.rect(0, 0, pageWidth, 3, 'F');
      y = margin;
    }
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    setText(REPORT_BRAND.slate900);
    pdf.text(title, margin, y);
    y += 3;
    setFill(REPORT_BRAND.emerald);
    pdf.rect(margin, y, 42, 1.2, 'F');
    y += 8;
  };

  const drawBulletList = (items: string[] = []) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    setText(REPORT_BRAND.slate700);
    items.forEach((item, index) => {
      const lines = pdf.splitTextToSize(`${index + 1}. ${item}`, contentWidth - 8);
      ensureSpace(lines.length * 5 + 2);
      pdf.text(lines, margin + 2, y);
      y += lines.length * 5 + 2;
    });
  };

  // Cover
  setFill(REPORT_BRAND.slate900);
  pdf.rect(0, 0, pageWidth, 58, 'F');
  setFill(REPORT_BRAND.emerald);
  pdf.rect(0, 58, pageWidth, 2.5, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  setText(REPORT_BRAND.white);
  pdf.text(report.title, margin, 24);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  setText(REPORT_BRAND.slate200);
  pdf.text(report.subtitle || ORGANIZATION, margin, 33);
  pdf.text(report.period, margin, 40);
  pdf.text(`Generated ${report.date}`, margin, 47);

  y = 68;
  const summary = report.summary || {};
  const typicalFix =
    summary.avgResolutionLabel ||
    formatExecutiveDuration(summary.avgResolutionTime) ||
    '—';
  const totalReq = summary.totalRequests ?? 0;
  const finished = summary.finishedCount ?? 0;
  const openWaiting = summary.openCount ?? 0;
  const inProgress =
    summary.inProgressCount ??
    Math.max((summary.stillOpenCount ?? 0) - openWaiting, 0);
  const feedbackCount = summary.feedbackCount ?? report.feedbackSummary?.totalFeedback ?? 0;
  const satisfactionValue =
    feedbackCount > 0
      ? `${report.feedbackSummary?.satisfactionRate ?? summary.customerSatisfaction ?? 0}%`
      : '—';
  const completionPct = summary.resolutionRate ?? 0;

  // —— At a Glance (matches Executive Dashboard tab) ——
  drawSectionTitle('At a Glance');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  setText(REPORT_BRAND.slate500);
  pdf.text(`IT support performance summary · ${report.period}`, margin, y);
  y += 8;

  // Service health panel
  const healthStatus = report.healthStatus || 'Unknown';
  const healthTone =
    healthStatus === 'Excellent'
      ? {
          fill: [236, 253, 245] as const,
          border: REPORT_BRAND.emerald,
          badge: REPORT_BRAND.emeraldDark,
          bar: REPORT_BRAND.emerald,
        }
      : healthStatus === 'Good'
        ? {
            fill: [240, 249, 255] as const,
            border: [14, 165, 233] as const,
            badge: [3, 105, 161] as const,
            bar: [14, 165, 233] as const,
          }
        : healthStatus === 'Fair'
          ? {
              fill: [255, 251, 235] as const,
              border: [245, 158, 11] as const,
              badge: [180, 83, 9] as const,
              bar: [245, 158, 11] as const,
            }
          : {
              fill: [255, 241, 242] as const,
              border: [244, 63, 94] as const,
              badge: [190, 18, 60] as const,
              bar: [244, 63, 94] as const,
            };

  const healthPanelH = 42;
  ensureSpace(healthPanelH + 8);
  setFill(healthTone.fill);
  pdf.roundedRect(margin, y, contentWidth, healthPanelH, 3, 3, 'F');
  setDraw(healthTone.border);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin, y, contentWidth, healthPanelH, 3, 3, 'S');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  setText(REPORT_BRAND.slate500);
  pdf.text('SERVICE HEALTH', margin + 4, y + 6);

  // Headline badge
  const headline = report.healthHeadline || healthStatus;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  const badgeW = Math.min(pdf.getTextWidth(headline) + 8, contentWidth * 0.55);
  setFill(healthTone.badge);
  pdf.roundedRect(margin + 4, y + 9, badgeW, 7, 1.5, 1.5, 'F');
  setText(REPORT_BRAND.white);
  pdf.text(headline, margin + 8, y + 14);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  setText(REPORT_BRAND.slate700);
  pdf.text(
    `${healthStatus}${report.healthScore != null ? ` · ${report.healthScore}/100` : ''}`,
    margin + 4 + badgeW + 4,
    y + 14,
  );

  if (report.healthSummary) {
    pdf.setFontSize(8);
    setText(REPORT_BRAND.slate700);
    const summaryLines = pdf.splitTextToSize(report.healthSummary, contentWidth - 50);
    pdf.text(summaryLines.slice(0, 2), margin + 4, y + 22);
  }

  // Completion rate on the right
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  setText(REPORT_BRAND.slate900);
  pdf.text(`${completionPct}%`, pageWidth - margin - 4, y + 18, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  setText(REPORT_BRAND.slate500);
  pdf.text('Completion rate', pageWidth - margin - 4, y + 24, { align: 'right' });

  // Progress bar
  const barX = margin + 4;
  const barW = contentWidth - 8;
  const barY = y + healthPanelH - 7;
  setFill(REPORT_BRAND.slate200);
  pdf.roundedRect(barX, barY, barW, 2.5, 1, 1, 'F');
  setFill(healthTone.bar);
  pdf.roundedRect(
    barX,
    barY,
    Math.max(1, (Math.min(100, completionPct) / 100) * barW),
    2.5,
    1,
    1,
    'F',
  );
  y += healthPanelH + 8;

  // Four KPI cards — same labels as At a Glance
  const glanceCards = [
    {
      label: 'REQUEST VOLUME',
      value: String(totalReq),
      hint: 'Submitted in period',
    },
    {
      label: 'COMPLETION RATE',
      value: `${completionPct}%`,
      hint: `${finished} of ${totalReq} completed`,
    },
    {
      label: 'AVG. RESOLUTION',
      value: typicalFix,
      hint: 'Time to complete',
    },
    {
      label: 'SATISFACTION',
      value: satisfactionValue,
      hint:
        feedbackCount > 0
          ? `${feedbackCount} rating${feedbackCount === 1 ? '' : 's'}`
          : 'No ratings yet',
    },
  ];
  const cardWidth = (contentWidth - 9) / 4;
  const cardH = 28;
  ensureSpace(cardH + 10);
  glanceCards.forEach((card, index) => {
    const x = margin + index * (cardWidth + 3);
    setFill(REPORT_BRAND.slate50);
    pdf.roundedRect(x, y, cardWidth, cardH, 2.5, 2.5, 'F');
    setDraw(REPORT_BRAND.slate200);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, y, cardWidth, cardH, 2.5, 2.5, 'S');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    setText(REPORT_BRAND.slate500);
    pdf.text(card.label, x + 3, y + 6);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(card.value.length > 14 ? 9 : 14);
    setText(REPORT_BRAND.slate900);
    const valueLines = pdf.splitTextToSize(card.value, cardWidth - 6);
    pdf.text(valueLines, x + 3, y + 15);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    setText(REPORT_BRAND.slate500);
    const hintLines = pdf.splitTextToSize(card.hint, cardWidth - 6);
    pdf.text(hintLines, x + 3, y + 23);
  });
  y += cardH + 8;

  // Request status strip
  if (totalReq > 0) {
    const openPct = Math.round((openWaiting / totalReq) * 100);
    const workPct = Math.round((inProgress / totalReq) * 100);
    const donePctBar = Math.max(0, 100 - openPct - workPct);
    const statusH = 32;
    ensureSpace(statusH + 6);
    setFill(REPORT_BRAND.white);
    pdf.roundedRect(margin, y, contentWidth, statusH, 2.5, 2.5, 'F');
    setDraw(REPORT_BRAND.slate200);
    pdf.roundedRect(margin, y, contentWidth, statusH, 2.5, 2.5, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    setText(REPORT_BRAND.slate900);
    pdf.text('Request status', margin + 4, y + 7);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    setText(REPORT_BRAND.slate500);
    pdf.text(
      `Open · In progress · Completed · ${totalReq} total`,
      margin + 42,
      y + 7,
    );

    const trackX = margin + 4;
    const trackW = contentWidth - 8;
    const trackY = y + 11;
    let cursorX = trackX;
    const segments = [
      { pct: openPct, count: openWaiting, color: [244, 63, 94] as const, label: 'Open' },
      { pct: workPct, count: inProgress, color: [245, 158, 11] as const, label: 'In progress' },
      {
        pct: donePctBar,
        count: finished,
        color: REPORT_BRAND.emerald,
        label: 'Completed',
      },
    ];
    segments.forEach((seg) => {
      if (seg.pct <= 0) return;
      const w = (seg.pct / 100) * trackW;
      setFill(seg.color);
      pdf.rect(cursorX, trackY, w, 4, 'F');
      cursorX += w;
    });

    // Counts under bar
    const colW = contentWidth / 3;
    segments.forEach((seg, i) => {
      const cx = margin + i * colW + 4;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      setText(seg.color);
      pdf.text(String(seg.count), cx, y + 23);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      setText(REPORT_BRAND.slate500);
      pdf.text(seg.label, cx + pdf.getTextWidth(String(seg.count)) + 3, y + 23);
    });
    y += statusH + 8;
  }

  // Charts KPI strip (same as Charts tab)
  const chartKpis = report.chartKpis || report.charts?.chartKpis;
  if (chartKpis) {
    drawSectionTitle('Charts Snapshot');
    const kpiCards = [
      { label: 'New requests', value: String(chartKpis.newRequests ?? 0) },
      { label: 'Still open', value: String(chartKpis.stillOpen ?? 0) },
      { label: 'Finished', value: String(chartKpis.finished ?? 0) },
      { label: 'Urgent (H+C)', value: String(chartKpis.urgent ?? 0) },
    ];
    kpiCards.forEach((card, index) => {
      const x = margin + index * (cardWidth + 3);
      setFill(REPORT_BRAND.slate50);
      pdf.roundedRect(x, y, cardWidth, 18, 2, 2, 'F');
      setDraw(REPORT_BRAND.slate200);
      pdf.roundedRect(x, y, cardWidth, 18, 2, 2, 'S');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      setText(REPORT_BRAND.slate500);
      pdf.text(card.label, x + 3, y + 6);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      setText(REPORT_BRAND.slate900);
      pdf.text(card.value, x + 3, y + 14);
    });
    y += 24;
  }

  if (report.serviceQuality) {
    // Dedicated page — match Service Quality tab layout
    pdf.addPage();
    setFill(REPORT_BRAND.emerald);
    pdf.rect(0, 0, pageWidth, 3, 'F');
    y = margin;

    const sq = report.serviceQuality;
    drawSectionTitle('Service Quality');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    setText(REPORT_BRAND.slate500);
    pdf.text(
      `Quality targets & risks · ${report.period} — volume charts live under Charts`,
      margin,
      y,
    );
    y += 8;

    const tone = sq.verdictTone || 'warning';
    const verdictColors =
      tone === 'excellent'
        ? {
            fill: [236, 253, 245] as const,
            border: REPORT_BRAND.emerald,
            badge: REPORT_BRAND.emeraldDark,
          }
        : tone === 'good'
          ? {
              fill: [240, 249, 255] as const,
              border: [14, 165, 233] as const,
              badge: [3, 105, 161] as const,
            }
          : tone === 'warning'
            ? {
                fill: [255, 251, 235] as const,
                border: [245, 158, 11] as const,
                badge: [180, 83, 9] as const,
              }
            : {
                fill: [255, 241, 242] as const,
                border: [244, 63, 94] as const,
                badge: [190, 18, 60] as const,
              };

    // Verdict panel
    const verdictH = 28;
    ensureSpace(verdictH + 6);
    setFill(verdictColors.fill);
    pdf.roundedRect(margin, y, contentWidth, verdictH, 3, 3, 'F');
    setDraw(verdictColors.border);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(margin, y, contentWidth, verdictH, 3, 3, 'S');

    const verdictText = sq.verdict || '—';
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    const vBadgeW = Math.min(pdf.getTextWidth(verdictText) + 8, 55);
    setFill(verdictColors.badge);
    pdf.roundedRect(margin + 4, y + 5, vBadgeW, 7, 1.5, 1.5, 'F');
    setText(REPORT_BRAND.white);
    pdf.text(verdictText, margin + 8, y + 10);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    setText(REPORT_BRAND.slate700);
    pdf.text(`Score ${sq.score ?? 0}/100`, margin + 4 + vBadgeW + 4, y + 10);

    if (sq.verdictSummary) {
      const vLines = pdf.splitTextToSize(sq.verdictSummary, contentWidth - 48);
      pdf.text(vLines.slice(0, 2), margin + 4, y + 18);
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    setText(REPORT_BRAND.slate900);
    pdf.text(`${sq.resolutionRate ?? 0}%`, pageWidth - margin - 4, y + 14, {
      align: 'right',
    });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    setText(REPORT_BRAND.slate500);
    pdf.text('completion rate', pageWidth - margin - 4, y + 20, {
      align: 'right',
    });
    y += verdictH + 8;

    // Quality targets — stacked rows (title, then badge+hint, then bar)
    const targets = sq.targets || [];
    const toneLabel: Record<string, string> = {
      excellent: 'Excellent',
      good: 'Good',
      warning: 'Needs work',
      critical: 'At risk',
    };
    const headerH = 15;
    const rowH = 22;
    const targetPanelH = headerH + targets.length * rowH + 4;
    ensureSpace(Math.min(targetPanelH + 4, pageHeight - 40));
    setFill(REPORT_BRAND.white);
    pdf.roundedRect(margin, y, contentWidth, targetPanelH, 2.5, 2.5, 'F');
    setDraw(REPORT_BRAND.slate200);
    pdf.roundedRect(margin, y, contentWidth, targetPanelH, 2.5, 2.5, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    setText(REPORT_BRAND.slate900);
    pdf.text('Quality targets', margin + 4, y + 5.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    setText(REPORT_BRAND.slate500);
    pdf.text(
      'Are we hitting the goals executives care about?',
      margin + 4,
      y + 11,
    );

    let ty = y + headerH;
    const leftX = margin + 4;
    const rightX = pageWidth - margin - 4;
    const barW = contentWidth - 8;

    targets.forEach((target) => {
      const tTone = target.tone || 'warning';
      const barColor =
        tTone === 'excellent' || tTone === 'good'
          ? REPORT_BRAND.emerald
          : tTone === 'warning'
            ? ([245, 158, 11] as const)
            : ([244, 63, 94] as const);
      const badgeColor =
        tTone === 'excellent' || tTone === 'good'
          ? REPORT_BRAND.emeraldDark
          : tTone === 'warning'
            ? ([180, 83, 9] as const)
            : ([190, 18, 60] as const);

      let progress = 0;
      const val = Number(target.value ?? 0);
      const tgt = Number(target.target ?? 0);
      if (target.higherIsBetter === false) {
        progress =
          val > 0 && tgt > 0 ? Math.min(100, Math.round((tgt / val) * 100)) : 0;
      } else if (tgt > 0) {
        progress = Math.min(100, Math.round((val / tgt) * 100));
      }

      // Sanitize unicode dashes (jsPDF can garble them)
      const title = String(target.title || '')
        .replace(/[–—]/g, '-')
        .trim();
      const hint = String(target.hint || '')
        .replace(/[–—]/g, '-')
        .trim();
      const display = String(target.display || '')
        .replace(/[–—]/g, '-')
        .trim();
      const targetLbl = String(target.targetLabel || '-')
        .replace(/[–—]/g, '-')
        .trim();
      const label = toneLabel[tTone] || tTone;

      // Line 1: title (left) + value (right) — full width, no badge here
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      setText(REPORT_BRAND.slate900);
      const titleMax = contentWidth * 0.62;
      const titleLines = pdf.splitTextToSize(title, titleMax);
      pdf.text(titleLines[0] || '', leftX, ty + 4);

      pdf.setFontSize(11);
      pdf.text(display, rightX, ty + 4, { align: 'right' });

      // Line 2: tone badge + hint (left) + target (right) — below title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      const lbW = Math.min(pdf.getTextWidth(label) + 5, 28);
      const badgeTop = ty + 6.5;
      setFill(badgeColor);
      pdf.roundedRect(leftX, badgeTop, lbW, 4.5, 1, 1, 'F');
      setText(REPORT_BRAND.white);
      pdf.text(label, leftX + 2.5, badgeTop + 3.2);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      setText(REPORT_BRAND.slate500);
      const hintX = leftX + lbW + 3;
      const hintMax = Math.max(20, rightX - hintX - 32);
      const hintLines = pdf.splitTextToSize(hint, hintMax);
      pdf.text(hintLines[0] || '', hintX, badgeTop + 3.2);
      pdf.text(`Target ${targetLbl}`, rightX, badgeTop + 3.2, {
        align: 'right',
      });

      // Progress bar — below badge row
      const barY = ty + 13.5;
      setFill(REPORT_BRAND.slate200);
      pdf.roundedRect(leftX, barY, barW, 3.5, 1.2, 1.2, 'F');
      if (progress > 0) {
        setFill(barColor);
        pdf.roundedRect(
          leftX,
          barY,
          Math.max(2.5, (progress / 100) * barW),
          3.5,
          1.2,
          1.2,
          'F',
        );
      }

      ty += rowH;
    });
    y += targetPanelH + 8;

    // Service risks
    const riskH = 46;
    ensureSpace(riskH + 4);
    setFill(REPORT_BRAND.white);
    pdf.roundedRect(margin, y, contentWidth, riskH, 2.5, 2.5, 'F');
    setDraw(REPORT_BRAND.slate200);
    pdf.roundedRect(margin, y, contentWidth, riskH, 2.5, 2.5, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    setText(REPORT_BRAND.slate900);
    pdf.text('Service risks', margin + 4, y + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    setText(REPORT_BRAND.slate500);
    pdf.text('Aging work that can hurt service quality', margin + 4, y + 11);

    const riskCards = [
      {
        value: String(sq.stillOpen ?? 0),
        label: 'Still open',
        color: [217, 119, 6] as const,
      },
      {
        value: String(sq.agingOpen ?? 0),
        label: 'Open 1-2 weeks',
        color: [234, 88, 12] as const,
      },
      {
        value: String(sq.overdueOpen ?? 0),
        label: 'Open 2 weeks+',
        color: [225, 29, 72] as const,
      },
    ];
    const riskW = (contentWidth - 16) / 3;
    riskCards.forEach((card, i) => {
      const rx = margin + 4 + i * (riskW + 4);
      setFill(REPORT_BRAND.slate50);
      pdf.roundedRect(rx, y + 14, riskW, 16, 2, 2, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      setText(card.color);
      pdf.text(card.value, rx + riskW / 2, y + 22, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      setText(REPORT_BRAND.slate500);
      pdf.text(card.label, rx + riskW / 2, y + 27, { align: 'center' });
    });

    pdf.setFontSize(7.5);
    if ((sq.overdueOpen ?? 0) > 0) {
      setText([225, 29, 72] as const);
      const riskNote = `${sq.overdueOpen} request${(sq.overdueOpen ?? 0) > 1 ? 's have' : ' has'} been waiting 2 weeks or more - prioritize these to protect service quality.`;
      const noteLines = pdf.splitTextToSize(riskNote, contentWidth - 8);
      pdf.text(noteLines.slice(0, 2), margin + 4, y + 36);
    } else {
      setText(REPORT_BRAND.emeraldDark);
      pdf.text('No requests are overdue past 2 weeks right now.', margin + 4, y + 36);
    }
    y += riskH + 8;

    // What users are saying
    const fbM = sq.feedbackMetrics;
    if (fbM && (fbM.totalFeedback ?? 0) > 0) {
      const sayH = 40;
      ensureSpace(sayH + 4);
      setFill(REPORT_BRAND.white);
      pdf.roundedRect(margin, y, contentWidth, sayH, 2.5, 2.5, 'F');
      setDraw(REPORT_BRAND.slate200);
      pdf.roundedRect(margin, y, contentWidth, sayH, 2.5, 2.5, 'S');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      setText(REPORT_BRAND.slate900);
      pdf.text('What users are saying', margin + 4, y + 6);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      setText(REPORT_BRAND.slate500);
      pdf.text(
        `Based on ${fbM.totalFeedback} feedback rating${(fbM.totalFeedback ?? 0) > 1 ? 's' : ''}`,
        margin + 4,
        y + 11,
      );

      const sayCards = [
        {
          value: `${fbM.satisfactionRate ?? 0}%`,
          label: 'Happy with support',
          color: REPORT_BRAND.emeraldDark,
        },
        {
          value: String(fbM.highRatings ?? 0),
          label: 'Positive (4-5 stars)',
          color: REPORT_BRAND.emeraldDark,
        },
        {
          value: String(fbM.lowRatings ?? 0),
          label: 'Needs improvement (1-2)',
          color: [225, 29, 72] as const,
        },
      ];
      sayCards.forEach((card, i) => {
        const sx = margin + 4 + i * (riskW + 4);
        setFill(REPORT_BRAND.slate50);
        pdf.roundedRect(sx, y + 15, riskW, 20, 2, 2, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        setText(card.color);
        pdf.text(card.value, sx + riskW / 2, y + 24, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        setText(REPORT_BRAND.slate500);
        pdf.text(card.label, sx + riskW / 2, y + 30, { align: 'center' });
      });
      y += sayH + 6;
    }
  }

  drawSectionTitle('Executive Summary');
  // Matches At a Glance KPIs only (volume, finish rate, fix time, satisfaction)
  drawBulletList([
    `Total support requests: ${summary.totalRequests ?? 0}`,
    `Finish rate: ${summary.resolutionRate ?? 0}% (${summary.finishedCount ?? 0} finished)`,
    `Typical fix time: ${typicalFix}`,
    report.feedbackSummary && (report.feedbackSummary.totalFeedback ?? 0) > 0
      ? `Happy users: ${report.feedbackSummary.satisfactionRate ?? 0}% (avg ${report.feedbackSummary.averageRating ?? 0}/5 from ${report.feedbackSummary.totalFeedback} ratings)`
      : 'Customer satisfaction: no ratings in this period',
  ]);

  if (report.feedbackSummary && (report.feedbackSummary.totalFeedback ?? 0) >= 0) {
    // Own page so layout can match Feedback tab (KPIs + bar chart)
    pdf.addPage();
    setFill(REPORT_BRAND.emerald);
    pdf.rect(0, 0, pageWidth, 3, 'F');
    y = margin;

    drawSectionTitle('User Feedback');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    setText(REPORT_BRAND.slate500);
    pdf.text(
      `How satisfied users are with IT support · ${report.period}`,
      margin,
      y,
    );
    y += 10;

    const fb = report.feedbackSummary;
    const totalFb = fb.totalFeedback ?? 0;

    // KPI cards — same 4 metrics + subtitles as Feedback tab
    const fbCards = [
      {
        label: 'Ratings received',
        value: String(totalFb),
        hint: report.period,
        valueRgb: REPORT_BRAND.slate900,
      },
      {
        label: 'Average score',
        value: String(fb.averageRating ?? 0),
        hint: 'Out of 5 stars',
        valueRgb: [217, 119, 6] as const, // amber
      },
      {
        label: 'Happy users',
        value: `${fb.satisfactionRate ?? 0}%`,
        hint: 'Gave 4-5 stars',
        valueRgb: REPORT_BRAND.emeraldDark,
      },
      {
        label: 'Needs improvement',
        value: `${fb.improvementRate ?? 0}%`,
        hint: 'Gave 1-2 stars',
        valueRgb: [225, 29, 72] as const, // rose
      },
    ];
    const fbCardW = (contentWidth - 9) / 4;
    const fbCardH = 28;
    fbCards.forEach((card, index) => {
      const x = margin + index * (fbCardW + 3);
      setFill(REPORT_BRAND.slate50);
      pdf.roundedRect(x, y, fbCardW, fbCardH, 2.5, 2.5, 'F');
      setDraw(REPORT_BRAND.slate200);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(x, y, fbCardW, fbCardH, 2.5, 2.5, 'S');

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      setText(REPORT_BRAND.slate500);
      pdf.text(card.label, x + 3.5, y + 7);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      setText(card.valueRgb);
      pdf.text(card.value, x + 3.5, y + 17);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      setText(REPORT_BRAND.slate500);
      const hintLines = pdf.splitTextToSize(card.hint, fbCardW - 6);
      pdf.text(hintLines, x + 3.5, y + 23);
    });
    y += fbCardH + 10;

    if (totalFb > 0) {
      const breakdown =
        fb.ratingBreakdown ||
        [5, 4, 3, 2, 1].map((star) => {
          const count =
            fb.ratingDistribution?.[star] ??
            fb.ratingDistribution?.[String(star)] ??
            0;
          return {
            star,
            count: Number(count),
            percent: ((Number(count) / totalFb) * 100).toFixed(1),
          };
        });

      // Star ratings breakdown panel (bars like Feedback tab)
      const panelH = 8 + breakdown.length * 11 + 6;
      ensureSpace(panelH + 8);
      setFill(REPORT_BRAND.white);
      pdf.roundedRect(margin, y, contentWidth, panelH, 2.5, 2.5, 'F');
      setDraw(REPORT_BRAND.slate200);
      pdf.roundedRect(margin, y, contentWidth, panelH, 2.5, 2.5, 'S');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      setText(REPORT_BRAND.slate900);
      pdf.text('Star ratings breakdown', margin + 4, y + 7);
      let barY = y + 12;

      const labelW = 10;
      const valueW = 28;
      const trackX = margin + 4 + labelW;
      const trackW = contentWidth - 8 - labelW - valueW;

      breakdown.forEach((row) => {
        const pct = Number(row.percent) || 0;
        const fillW = Math.max(pct > 0 ? 2 : 0, (pct / 100) * trackW);
        const barColor =
          row.star >= 4
            ? REPORT_BRAND.emerald
            : row.star === 3
              ? ([245, 158, 11] as const)
              : ([244, 63, 94] as const);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        setText(REPORT_BRAND.slate700);
        pdf.text(String(row.star), margin + 4, barY + 4);

        // Track
        setFill(REPORT_BRAND.slate200);
        pdf.roundedRect(trackX, barY, trackW, 5.5, 1.5, 1.5, 'F');
        // Fill
        if (fillW > 0) {
          setFill(barColor);
          pdf.roundedRect(trackX, barY, fillW, 5.5, 1.5, 1.5, 'F');
        }

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        setText(REPORT_BRAND.slate700);
        pdf.text(
          `${row.count} (${row.percent}%)`,
          trackX + trackW + 3,
          barY + 4,
        );
        barY += 11;
      });
      y += panelH + 8;
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      setText(REPORT_BRAND.slate500);
      pdf.text('No feedback in this date range.', margin, y);
      y += 10;
    }
  }

  const teamRows =
    report.teamAnalytics?.teams?.length
      ? report.teamAnalytics.teams
      : (report.charts?.departmentPerformance || []).map((dept) => ({
          department: dept.department,
          totalTickets: dept.total,
          resolvedTickets: dept.done ?? dept.resolved,
          stillOpen:
            dept.open ?? Math.max(dept.total - (dept.done ?? dept.resolved), 0),
          overdueOpen: 0,
          resolutionRate: dept.resolutionRate,
          avgResolutionTime: 0,
          healthLabel: '',
        }));

  if (teamRows.length) {
    drawSectionTitle(
      report.teamAnalytics?.teams?.length
        ? 'By Team — Full Roster'
        : 'Department Snapshot',
    );
    if (report.teamAnalytics) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      setText(REPORT_BRAND.slate700);
      pdf.text(
        `${report.teamAnalytics.allTeams ?? 0} teams · ${report.teamAnalytics.activeTeams ?? 0} with activity · ${report.teamAnalytics.needingHelp ?? 0} needing help · ${report.teamAnalytics.totalOverdue ?? 0} open 2 weeks+`,
        margin,
        y,
      );
      y += 8;
    }

    const colWidths = report.teamAnalytics?.teams?.length
      ? [46, 16, 16, 16, 18, 18]
      : [58, 22, 22, 24];
    const headers = report.teamAnalytics?.teams?.length
      ? ['Department', 'Req', 'Done', 'Open', '2w+', 'Finish %']
      : ['Department', 'Requests', 'Done', 'Still open'];
    let x = margin;
    headers.forEach((header, index) => {
      setFill(REPORT_BRAND.emerald);
      pdf.rect(x, y - 5, colWidths[index], 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      setText(REPORT_BRAND.white);
      pdf.text(header, x + 1.5, y);
      x += colWidths[index];
    });
    y += 8;

    teamRows.forEach((dept, rowIndex) => {
      ensureSpace(8);
      if (rowIndex % 2 === 0) {
        setFill(REPORT_BRAND.slate50);
        pdf.rect(margin, y - 4, contentWidth, 7, 'F');
      }
      x = margin;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      setText(REPORT_BRAND.slate700);
      const values = report.teamAnalytics?.teams?.length
        ? [
            dept.department,
            String(dept.totalTickets),
            String(dept.resolvedTickets),
            String(dept.stillOpen),
            String(dept.overdueOpen),
            `${dept.resolutionRate}%`,
          ]
        : [
            dept.department,
            String(dept.totalTickets),
            String(dept.resolvedTickets),
            String(dept.stillOpen),
          ];
      values.forEach((value, index) => {
        const lines = pdf.splitTextToSize(value, colWidths[index] - 2);
        pdf.text(lines, x + 1.5, y);
        x += colWidths[index];
      });
      y += 7;
    });
    y += 4;

    if (report.teamAnalytics?.needsHelp?.length) {
      ensureSpace(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      setText(REPORT_BRAND.slate900);
      pdf.text('Needs help (top 5)', margin, y);
      y += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      setText(REPORT_BRAND.slate700);
      report.teamAnalytics.needsHelp.forEach((team, index) => {
        ensureSpace(6);
        pdf.text(
          `${index + 1}. ${team.department} — ${team.stillOpen} open · ${team.overdueOpen} overdue 2w+`,
          margin + 2,
          y,
        );
        y += 5;
      });
      y += 2;
    }

    if (report.teamAnalytics?.healthiest?.length) {
      ensureSpace(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      setText(REPORT_BRAND.slate900);
      pdf.text('Healthiest teams', margin, y);
      y += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      setText(REPORT_BRAND.slate700);
      report.teamAnalytics.healthiest.forEach((team, index) => {
        ensureSpace(6);
        pdf.text(
          `${index + 1}. ${team.department} — ${team.resolutionRate}% finish · ${team.totalTickets} requests`,
          margin + 2,
          y,
        );
        y += 5;
      });
      y += 2;
    }
  }

  const chartImages = await resolveChartImages(report);
  if (chartImages.length) {
    pdf.addPage();
    setFill(REPORT_BRAND.emerald);
    pdf.rect(0, 0, pageWidth, 3, 'F');
    y = margin;
    drawSectionTitle('Analytics Visualizations');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    setText(REPORT_BRAND.slate500);
    pdf.text(`Period: ${report.period} · Charts match Executive Dashboard`, margin, y);
    y += 6;
    chartImages.forEach((chart) => {
      const imgHeight = 78;
      ensureSpace(imgHeight + 12);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      setText(REPORT_BRAND.slate900);
      pdf.text(chart.title, margin, y);
      y += 4;
      pdf.addImage(chart.image, 'PNG', margin, y, contentWidth, imgHeight);
      y += imgHeight + 8;
    });
  }

  if (report.keyFindings?.length) {
    ensureSpace(20);
    drawSectionTitle('Key Findings');
    drawBulletList(report.keyFindings);
  }

  if (report.recommendations?.length) {
    ensureSpace(20);
    drawSectionTitle('Recommendations');
    drawBulletList(report.recommendations);
  }

  const totalPages = pdf.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    drawFooter(page, totalPages);
  }

  pdf.save(`${fileStamp(report.title)}.pdf`);
}

export async function exportManagementReportPptx(report: ManagementReport) {
  const pptx = new PptxGenJS();
  pptx.author = ORGANIZATION;
  pptx.company = ORGANIZATION;
  pptx.title = report.title;
  pptx.subject = 'Management Dashboard Report';
  pptx.layout = 'LAYOUT_16x9';

  const addHeaderBar = (slide: PptxGenJS.Slide, title: string) => {
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.55,
      fill: { color: '0F172A' },
      line: { color: '0F172A' },
    });
    slide.addShape('rect', {
      x: 0,
      y: 0.55,
      w: '100%',
      h: 0.05,
      fill: { color: '059669' },
      line: { color: '059669' },
    });
    slide.addText(title, {
      x: 0.4,
      y: 0.12,
      w: 9,
      h: 0.35,
      fontSize: 18,
      bold: true,
      color: 'FFFFFF',
    });
  };

  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: '0F172A' };
  titleSlide.addShape('rect', {
    x: 0,
    y: 5.1,
    w: '100%',
    h: 0.08,
    fill: { color: '059669' },
  });
  titleSlide.addText(report.title, {
    x: 0.6,
    y: 1.5,
    w: 8.8,
    h: 1,
    fontSize: 30,
    bold: true,
    color: 'FFFFFF',
  });
  titleSlide.addText(report.subtitle || ORGANIZATION, {
    x: 0.6,
    y: 2.45,
    w: 8.8,
    h: 0.4,
    fontSize: 16,
    color: 'CBD5E1',
  });
  titleSlide.addText(`${report.period} · Generated ${report.date}`, {
    x: 0.6,
    y: 3.0,
    w: 8.8,
    h: 0.35,
    fontSize: 13,
    color: '94A3B8',
  });

  const summarySlide = pptx.addSlide();
  summarySlide.background = { color: 'F8FAFC' };
  addHeaderBar(summarySlide, 'At a Glance');

  const summary = report.summary || {};
  const typicalFix =
    summary.avgResolutionLabel ||
    formatExecutiveDuration(summary.avgResolutionTime) ||
    '—';
  const totalReq = summary.totalRequests ?? 0;
  const finished = summary.finishedCount ?? 0;
  const openWaiting = summary.openCount ?? 0;
  const inProgress =
    summary.inProgressCount ??
    Math.max((summary.stillOpenCount ?? 0) - openWaiting, 0);
  const feedbackCount =
    summary.feedbackCount ?? report.feedbackSummary?.totalFeedback ?? 0;
  const completionPct = summary.resolutionRate ?? 0;
  const satisfactionValue =
    feedbackCount > 0
      ? `${report.feedbackSummary?.satisfactionRate ?? summary.customerSatisfaction ?? 0}%`
      : '—';

  const healthStatus = report.healthStatus || 'Unknown';
  const healthFill =
    healthStatus === 'Excellent'
      ? 'ECFDF5'
      : healthStatus === 'Good'
        ? 'F0F9FF'
        : healthStatus === 'Fair'
          ? 'FFFBEB'
          : 'FFF1F2';
  const healthBadge =
    healthStatus === 'Excellent'
      ? '059669'
      : healthStatus === 'Good'
        ? '0369A1'
        : healthStatus === 'Fair'
          ? 'B45309'
          : 'BE123C';

  summarySlide.addShape('roundRect', {
    x: 0.4,
    y: 0.75,
    w: 9.2,
    h: 1.35,
    fill: { color: healthFill },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.1,
  });
  summarySlide.addText('SERVICE HEALTH', {
    x: 0.55,
    y: 0.85,
    w: 6.5,
    h: 0.22,
    fontSize: 10,
    color: '64748B',
  });
  summarySlide.addShape('roundRect', {
    x: 0.55,
    y: 1.1,
    w: 3.6,
    h: 0.32,
    fill: { color: healthBadge },
    line: { color: healthBadge },
    rectRadius: 0.06,
  });
  summarySlide.addText(report.healthHeadline || healthStatus, {
    x: 0.65,
    y: 1.12,
    w: 3.4,
    h: 0.28,
    fontSize: 12,
    bold: true,
    color: 'FFFFFF',
  });
  summarySlide.addText(
    `${healthStatus}${report.healthScore != null ? ` · ${report.healthScore}/100` : ''}`,
    {
      x: 4.3,
      y: 1.14,
      w: 2.5,
      h: 0.28,
      fontSize: 12,
      color: '334155',
    },
  );
  summarySlide.addText(report.healthSummary || '', {
    x: 0.55,
    y: 1.5,
    w: 6.5,
    h: 0.4,
    fontSize: 12,
    color: '334155',
  });
  summarySlide.addText(`${completionPct}%`, {
    x: 7.4,
    y: 1.05,
    w: 2.0,
    h: 0.45,
    fontSize: 28,
    bold: true,
    color: '0F172A',
    align: 'right',
  });
  summarySlide.addText('Completion rate', {
    x: 7.4,
    y: 1.5,
    w: 2.0,
    h: 0.25,
    fontSize: 11,
    color: '64748B',
    align: 'right',
  });

  const glanceKpis = [
    {
      label: 'REQUEST VOLUME',
      value: String(totalReq),
      hint: 'Submitted in period',
    },
    {
      label: 'COMPLETION RATE',
      value: `${completionPct}%`,
      hint: `${finished} of ${totalReq} completed`,
    },
    {
      label: 'AVG. RESOLUTION',
      value: typicalFix,
      hint: 'Time to complete',
    },
    {
      label: 'SATISFACTION',
      value: satisfactionValue,
      hint:
        feedbackCount > 0
          ? `${feedbackCount} rating${feedbackCount === 1 ? '' : 's'}`
          : 'No ratings yet',
    },
  ];
  glanceKpis.forEach((card, index) => {
    const x = 0.4 + index * 2.4;
    summarySlide.addShape('roundRect', {
      x,
      y: 2.3,
      w: 2.25,
      h: 1.35,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.1,
    });
    summarySlide.addText(card.label, {
      x: x + 0.12,
      y: 2.4,
      w: 2.0,
      h: 0.22,
      fontSize: 10,
      color: '64748B',
    });
    summarySlide.addText(card.value, {
      x: x + 0.12,
      y: 2.7,
      w: 2.0,
      h: 0.45,
      fontSize: card.value.length > 14 ? 14 : 22,
      bold: true,
      color: '0F172A',
    });
    summarySlide.addText(card.hint, {
      x: x + 0.12,
      y: 3.25,
      w: 2.0,
      h: 0.25,
      fontSize: 11,
      color: '94A3B8',
    });
  });

  // Request status
  summarySlide.addShape('roundRect', {
    x: 0.4,
    y: 3.85,
    w: 9.2,
    h: 1.25,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 1 },
    rectRadius: 0.1,
  });
  summarySlide.addText('Request status', {
    x: 0.55,
    y: 3.95,
    w: 3,
    h: 0.25,
    fontSize: 13,
    bold: true,
    color: '0F172A',
  });
  summarySlide.addText(
    `Open · In progress · Completed · ${totalReq} total`,
    {
      x: 3.5,
      y: 3.97,
      w: 5.8,
      h: 0.25,
      fontSize: 11,
      color: '64748B',
    },
  );

  if (totalReq > 0) {
    const openPct = (openWaiting / totalReq) * 100;
    const workPct = (inProgress / totalReq) * 100;
    const donePct = Math.max(0, 100 - openPct - workPct);
    let bx = 0.55;
    const barW = 9.0;
    const segs = [
      { pct: openPct, color: 'F43F5E', count: openWaiting, label: 'Open' },
      { pct: workPct, color: 'F59E0B', count: inProgress, label: 'In progress' },
      { pct: donePct, color: '10B981', count: finished, label: 'Completed' },
    ];
    segs.forEach((seg) => {
      if (seg.pct <= 0) return;
      const w = (seg.pct / 100) * barW;
      summarySlide.addShape('rect', {
        x: bx,
        y: 4.3,
        w,
        h: 0.18,
        fill: { color: seg.color },
        line: { color: seg.color },
      });
      bx += w;
    });
    segs.forEach((seg, i) => {
      const x = 0.55 + i * 3.0;
      summarySlide.addText(String(seg.count), {
        x,
        y: 4.55,
        w: 0.6,
        h: 0.3,
        fontSize: 16,
        bold: true,
        color: seg.color,
      });
      summarySlide.addText(seg.label, {
        x: x + 0.65,
        y: 4.6,
        w: 2.0,
        h: 0.25,
        fontSize: 12,
        color: '64748B',
      });
    });
  }

  if (report.serviceQuality) {
    const sq = report.serviceQuality;
    const toneLabel: Record<string, string> = {
      excellent: 'Excellent',
      good: 'Good',
      warning: 'Needs work',
      critical: 'At risk',
    };
    const tone = sq.verdictTone || 'warning';
    const verdictFill =
      tone === 'excellent'
        ? 'ECFDF5'
        : tone === 'good'
          ? 'F0F9FF'
          : tone === 'warning'
            ? 'FFFBEB'
            : 'FFF1F2';
    const verdictBadge =
      tone === 'excellent'
        ? '059669'
        : tone === 'good'
          ? '0369A1'
          : tone === 'warning'
            ? 'B45309'
            : 'BE123C';

    // Slide 1 — verdict + quality targets
    const sqSlide = pptx.addSlide();
    sqSlide.background = { color: 'F8FAFC' };
    addHeaderBar(sqSlide, 'Service Quality');
    sqSlide.addText(
      `Quality targets & risks · ${report.period}`,
      {
        x: 0.55,
        y: 0.7,
        w: 9,
        h: 0.25,
        fontSize: 12,
        color: '64748B',
      },
    );

    sqSlide.addShape('roundRect', {
      x: 0.4,
      y: 1.0,
      w: 9.2,
      h: 1.0,
      fill: { color: verdictFill },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.1,
    });
    sqSlide.addShape('roundRect', {
      x: 0.55,
      y: 1.12,
      w: 2.2,
      h: 0.3,
      fill: { color: verdictBadge },
      line: { color: verdictBadge },
      rectRadius: 0.06,
    });
    sqSlide.addText(sq.verdict || '—', {
      x: 0.6,
      y: 1.14,
      w: 2.1,
      h: 0.26,
      fontSize: 12,
      bold: true,
      color: 'FFFFFF',
    });
    sqSlide.addText(`Score ${sq.score ?? 0}/100`, {
      x: 2.9,
      y: 1.15,
      w: 2.5,
      h: 0.26,
      fontSize: 12,
      color: '334155',
    });
    sqSlide.addText(sq.verdictSummary || '', {
      x: 0.55,
      y: 1.5,
      w: 6.5,
      h: 0.35,
      fontSize: 12,
      color: '334155',
    });
    sqSlide.addText(`${sq.resolutionRate ?? 0}%`, {
      x: 7.4,
      y: 1.15,
      w: 2.0,
      h: 0.4,
      fontSize: 26,
      bold: true,
      color: '0F172A',
      align: 'right',
    });
    sqSlide.addText('completion rate', {
      x: 7.4,
      y: 1.55,
      w: 2.0,
      h: 0.25,
      fontSize: 11,
      color: '64748B',
      align: 'right',
    });

    sqSlide.addText('Quality targets', {
      x: 0.55,
      y: 2.1,
      w: 4,
      h: 0.24,
      fontSize: 14,
      bold: true,
      color: '0F172A',
    });
    sqSlide.addText('Are we hitting the goals executives care about?', {
      x: 0.55,
      y: 2.32,
      w: 8,
      h: 0.2,
      fontSize: 11,
      color: '64748B',
    });

    (sq.targets || []).forEach((target, index) => {
      const rowY = 2.55 + index * 0.62;
      const tTone = target.tone || 'warning';
      const barColor =
        tTone === 'excellent' || tTone === 'good'
          ? '10B981'
          : tTone === 'warning'
            ? 'F59E0B'
            : 'F43F5E';
      const badgeColor =
        tTone === 'excellent' || tTone === 'good'
          ? '059669'
          : tTone === 'warning'
            ? 'B45309'
            : 'BE123C';
      let progress = 0;
      const val = Number(target.value ?? 0);
      const tgt = Number(target.target ?? 0);
      if (target.higherIsBetter === false) {
        progress = val > 0 && tgt > 0 ? Math.min(100, Math.round((tgt / val) * 100)) : 0;
      } else if (tgt > 0) {
        progress = Math.min(100, Math.round((val / tgt) * 100));
      }

      const title = String(target.title || '').replace(/[–—]/g, '-');
      const hint = String(target.hint || '').replace(/[–—]/g, '-');
      const display = String(target.display || '').replace(/[–—]/g, '-');
      const targetLbl = String(target.targetLabel || '-').replace(/[–—]/g, '-');
      const label = toneLabel[tTone] || tTone;

      sqSlide.addText(title, {
        x: 0.55,
        y: rowY,
        w: 5.5,
        h: 0.2,
        fontSize: 12,
        bold: true,
        color: '0F172A',
      });
      sqSlide.addText(display, {
        x: 7.0,
        y: rowY,
        w: 2.4,
        h: 0.2,
        fontSize: 13,
        bold: true,
        color: '0F172A',
        align: 'right',
      });
      sqSlide.addShape('roundRect', {
        x: 0.55,
        y: rowY + 0.22,
        w: 1.15,
        h: 0.2,
        fill: { color: badgeColor },
        line: { color: badgeColor },
        rectRadius: 0.04,
      });
      sqSlide.addText(label, {
        x: 0.58,
        y: rowY + 0.22,
        w: 1.1,
        h: 0.2,
        fontSize: 9,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        valign: 'middle',
      });
      sqSlide.addText(hint, {
        x: 1.8,
        y: rowY + 0.22,
        w: 5.0,
        h: 0.2,
        fontSize: 10,
        color: '64748B',
      });
      sqSlide.addText(`Target ${targetLbl}`, {
        x: 7.0,
        y: rowY + 0.22,
        w: 2.4,
        h: 0.2,
        fontSize: 10,
        color: '64748B',
        align: 'right',
      });
      sqSlide.addShape('roundRect', {
        x: 0.55,
        y: rowY + 0.46,
        w: 8.9,
        h: 0.12,
        fill: { color: 'E2E8F0' },
        line: { color: 'E2E8F0' },
        rectRadius: 0.05,
      });
      if (progress > 0) {
        sqSlide.addShape('roundRect', {
          x: 0.55,
          y: rowY + 0.46,
          w: Math.max(0.1, (progress / 100) * 8.9),
          h: 0.12,
          fill: { color: barColor },
          line: { color: barColor },
          rectRadius: 0.05,
        });
      }
    });

    // Slide 2 — risks + what users are saying
    const riskSlide = pptx.addSlide();
    riskSlide.background = { color: 'F8FAFC' };
    addHeaderBar(riskSlide, 'Service Risks & Feedback');

    riskSlide.addText('Service risks', {
      x: 0.55,
      y: 0.8,
      w: 9,
      h: 0.3,
      fontSize: 16,
      bold: true,
      color: '0F172A',
    });
    riskSlide.addText('Aging work that can hurt service quality', {
      x: 0.55,
      y: 1.1,
      w: 9,
      h: 0.25,
      fontSize: 12,
      color: '64748B',
    });

    const riskCards = [
      { value: String(sq.stillOpen ?? 0), label: 'Still open', color: 'D97706' },
      { value: String(sq.agingOpen ?? 0), label: 'Open 1-2 weeks', color: 'EA580C' },
      { value: String(sq.overdueOpen ?? 0), label: 'Open 2 weeks+', color: 'E11D48' },
    ];
    riskCards.forEach((card, i) => {
      const x = 0.45 + i * 3.15;
      riskSlide.addShape('roundRect', {
        x,
        y: 1.5,
        w: 3.0,
        h: 1.3,
        fill: { color: 'FFFFFF' },
        line: { color: 'E2E8F0', width: 1 },
        rectRadius: 0.1,
      });
      riskSlide.addText(card.value, {
        x: x + 0.15,
        y: 1.7,
        w: 2.7,
        h: 0.55,
        fontSize: 32,
        bold: true,
        color: card.color,
        align: 'center',
      });
      riskSlide.addText(card.label, {
        x: x + 0.15,
        y: 2.3,
        w: 2.7,
        h: 0.3,
        fontSize: 13,
        color: '64748B',
        align: 'center',
      });
    });

    riskSlide.addText(
      (sq.overdueOpen ?? 0) > 0
        ? `${sq.overdueOpen} request${(sq.overdueOpen ?? 0) > 1 ? 's have' : ' has'} been waiting 2 weeks or more — prioritize these to protect service quality.`
        : 'No requests are overdue past 2 weeks right now.',
      {
        x: 0.55,
        y: 3.0,
        w: 9,
        h: 0.35,
        fontSize: 13,
        color: (sq.overdueOpen ?? 0) > 0 ? 'E11D48' : '059669',
      },
    );

    const fbM = sq.feedbackMetrics;
    if (fbM && (fbM.totalFeedback ?? 0) > 0) {
      riskSlide.addText('What users are saying', {
        x: 0.55,
        y: 3.5,
        w: 9,
        h: 0.28,
        fontSize: 16,
        bold: true,
        color: '0F172A',
      });
      riskSlide.addText(
        `Based on ${fbM.totalFeedback} feedback rating${(fbM.totalFeedback ?? 0) > 1 ? 's' : ''}`,
        {
          x: 0.55,
          y: 3.8,
          w: 9,
          h: 0.25,
          fontSize: 12,
          color: '64748B',
        },
      );
      const sayCards = [
        {
          value: `${fbM.satisfactionRate ?? 0}%`,
          label: 'Happy with support',
          color: '059669',
        },
        {
          value: String(fbM.highRatings ?? 0),
          label: 'Positive (4-5 stars)',
          color: '059669',
        },
        {
          value: String(fbM.lowRatings ?? 0),
          label: 'Needs improvement (1-2)',
          color: 'E11D48',
        },
      ];
      sayCards.forEach((card, i) => {
        const x = 0.45 + i * 3.15;
        riskSlide.addShape('roundRect', {
          x,
          y: 4.15,
          w: 3.0,
          h: 1.0,
          fill: { color: 'FFFFFF' },
          line: { color: 'E2E8F0', width: 1 },
          rectRadius: 0.1,
        });
        riskSlide.addText(card.value, {
          x: x + 0.15,
          y: 4.25,
          w: 2.7,
          h: 0.4,
          fontSize: 24,
          bold: true,
          color: card.color,
          align: 'center',
        });
        riskSlide.addText(card.label, {
          x: x + 0.15,
          y: 4.7,
          w: 2.7,
          h: 0.28,
          fontSize: 12,
          color: '64748B',
          align: 'center',
        });
      });
    }
  }

  if (report.feedbackSummary && (report.feedbackSummary.totalFeedback ?? 0) > 0) {
    const fb = report.feedbackSummary;
    const totalFb = fb.totalFeedback ?? 0;

    // Slide 1 — KPIs + star bars (matches Feedback tab)
    const fbSlide = pptx.addSlide();
    fbSlide.background = { color: 'F8FAFC' };
    addHeaderBar(fbSlide, 'User Feedback');
    fbSlide.addText(`How satisfied users are with IT support · ${report.period}`, {
      x: 0.55,
      y: 0.72,
      w: 9,
      h: 0.28,
      fontSize: 12,
      color: '64748B',
    });

    const fbKpis = [
      {
        label: 'Ratings received',
        value: String(totalFb),
        hint: report.period,
        color: '0F172A',
      },
      {
        label: 'Average score',
        value: String(fb.averageRating ?? 0),
        hint: 'Out of 5 stars',
        color: 'D97706',
      },
      {
        label: 'Happy users',
        value: `${fb.satisfactionRate ?? 0}%`,
        hint: 'Gave 4-5 stars',
        color: '059669',
      },
      {
        label: 'Needs improvement',
        value: `${fb.improvementRate ?? 0}%`,
        hint: 'Gave 1-2 stars',
        color: 'E11D48',
      },
    ];
    fbKpis.forEach((card, index) => {
      const x = 0.4 + index * 2.4;
      fbSlide.addShape('roundRect', {
        x,
        y: 1.1,
        w: 2.25,
        h: 1.35,
        fill: { color: 'FFFFFF' },
        line: { color: 'E2E8F0', width: 1 },
        rectRadius: 0.1,
      });
      fbSlide.addText(card.label, {
        x: x + 0.12,
        y: 1.2,
        w: 2.0,
        h: 0.25,
        fontSize: 11,
        color: '64748B',
      });
      fbSlide.addText(card.value, {
        x: x + 0.12,
        y: 1.5,
        w: 2.0,
        h: 0.45,
        fontSize: 26,
        bold: true,
        color: card.color,
      });
      fbSlide.addText(card.hint, {
        x: x + 0.12,
        y: 2.05,
        w: 2.0,
        h: 0.25,
        fontSize: 11,
        color: '94A3B8',
      });
    });

    const breakdown =
      fb.ratingBreakdown ||
      [5, 4, 3, 2, 1].map((star) => {
        const count =
          fb.ratingDistribution?.[star] ??
          fb.ratingDistribution?.[String(star)] ??
          0;
        return {
          star,
          count: Number(count),
          percent: totalFb > 0 ? ((Number(count) / totalFb) * 100).toFixed(1) : '0.0',
        };
      });

    fbSlide.addShape('roundRect', {
      x: 0.4,
      y: 2.65,
      w: 9.2,
      h: 2.55,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.1,
    });
    fbSlide.addText('Star ratings breakdown', {
      x: 0.6,
      y: 2.78,
      w: 8.8,
      h: 0.3,
      fontSize: 14,
      bold: true,
      color: '0F172A',
    });

    breakdown.forEach((row, index) => {
      const rowY = 3.2 + index * 0.38;
      const pct = Number(row.percent) || 0;
      const barColor = row.star >= 4 ? '10B981' : row.star === 3 ? 'F59E0B' : 'F43F5E';
      fbSlide.addText(String(row.star), {
        x: 0.65,
        y: rowY,
        w: 0.35,
        h: 0.28,
        fontSize: 13,
        bold: true,
        color: '334155',
      });
      fbSlide.addShape('roundRect', {
        x: 1.1,
        y: rowY + 0.05,
        w: 6.6,
        h: 0.2,
        fill: { color: 'E2E8F0' },
        line: { color: 'E2E8F0' },
        rectRadius: 0.08,
      });
      if (pct > 0) {
        fbSlide.addShape('roundRect', {
          x: 1.1,
          y: rowY + 0.05,
          w: Math.max(0.12, (pct / 100) * 6.6),
          h: 0.2,
          fill: { color: barColor },
          line: { color: barColor },
          rectRadius: 0.08,
        });
      }
      fbSlide.addText(`${row.count} (${row.percent}%)`, {
        x: 7.85,
        y: rowY,
        w: 1.5,
        h: 0.28,
        fontSize: 12,
        color: '475569',
        align: 'right',
      });
    });
  }

  const chartImages = await resolveChartImages(report);
  chartImages.forEach((chart) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'F8FAFC' };
    addHeaderBar(slide, chart.title);
    slide.addImage({
      data: chart.image,
      x: 0.45,
      y: 0.75,
      w: 9.1,
      h: 4.5,
    });
  });

  const teamRows =
    report.teamAnalytics?.teams?.length
      ? report.teamAnalytics.teams
      : (report.charts?.departmentPerformance || []).map((dept) => ({
          department: dept.department,
          totalTickets: dept.total,
          resolvedTickets: dept.done ?? dept.resolved,
          stillOpen:
            dept.open ?? Math.max(dept.total - (dept.done ?? dept.resolved), 0),
          overdueOpen: 0,
          resolutionRate: dept.resolutionRate,
        }));

  if (teamRows.length) {
    const deptSlide = pptx.addSlide();
    deptSlide.background = { color: 'F8FAFC' };
    addHeaderBar(
      deptSlide,
      report.teamAnalytics?.teams?.length
        ? 'By Team — Full Roster'
        : 'Department Snapshot',
    );

    if (report.teamAnalytics) {
      deptSlide.addText(
        `${report.teamAnalytics.allTeams ?? 0} teams · ${report.teamAnalytics.activeTeams ?? 0} active · ${report.teamAnalytics.needingHelp ?? 0} needing help · ${report.teamAnalytics.totalOverdue ?? 0} open 2 weeks+`,
        {
          x: 0.55,
          y: 0.75,
          w: 9,
          h: 0.3,
          fontSize: 12,
          color: '475569',
        },
      );
    }

    const useFull = Boolean(report.teamAnalytics?.teams?.length);
    const rows = [
      useFull
        ? [
            { text: 'Department', options: { bold: true, color: 'FFFFFF', fill: { color: '059669' } } },
            { text: 'Req', options: { bold: true, color: 'FFFFFF', fill: { color: '059669' } } },
            { text: 'Done', options: { bold: true, color: 'FFFFFF', fill: { color: '059669' } } },
            { text: 'Open', options: { bold: true, color: 'FFFFFF', fill: { color: '059669' } } },
            { text: '2w+', options: { bold: true, color: 'FFFFFF', fill: { color: '059669' } } },
            { text: 'Finish %', options: { bold: true, color: 'FFFFFF', fill: { color: '059669' } } },
          ]
        : [
            { text: 'Department', options: { bold: true, color: 'FFFFFF', fill: { color: '059669' } } },
            { text: 'Requests', options: { bold: true, color: 'FFFFFF', fill: { color: '059669' } } },
            { text: 'Done', options: { bold: true, color: 'FFFFFF', fill: { color: '059669' } } },
            { text: 'Still open', options: { bold: true, color: 'FFFFFF', fill: { color: '059669' } } },
          ],
      ...teamRows.map((dept) =>
        useFull
          ? [
              { text: dept.department },
              { text: String(dept.totalTickets) },
              { text: String(dept.resolvedTickets) },
              { text: String(dept.stillOpen) },
              { text: String(dept.overdueOpen) },
              { text: `${dept.resolutionRate}%` },
            ]
          : [
              { text: dept.department },
              { text: String(dept.totalTickets) },
              { text: String(dept.resolvedTickets) },
              { text: String(dept.stillOpen) },
            ],
      ),
    ];

    deptSlide.addTable(rows, {
      x: 0.4,
      y: report.teamAnalytics ? 1.15 : 1.0,
      w: 9.2,
      fontSize: 10,
      border: { type: 'solid', color: 'E2E8F0', pt: 1 },
      fill: { color: 'FFFFFF' },
    });
  }

  if (
    report.teamAnalytics?.needsHelp?.length ||
    report.teamAnalytics?.healthiest?.length
  ) {
    const focusSlide = pptx.addSlide();
    focusSlide.background = { color: 'F8FAFC' };
    addHeaderBar(focusSlide, 'Team Focus');
    focusSlide.addText('Needs help', {
      x: 0.55,
      y: 0.85,
      w: 4.3,
      h: 0.35,
      fontSize: 16,
      bold: true,
      color: '0F172A',
    });
    (report.teamAnalytics?.needsHelp || []).forEach((team, index) => {
      focusSlide.addText(
        `${index + 1}. ${team.department} — ${team.stillOpen} open · ${team.overdueOpen} overdue`,
        {
          x: 0.55,
          y: 1.3 + index * 0.4,
          w: 4.3,
          h: 0.35,
          fontSize: 12,
          color: '334155',
        },
      );
    });
    focusSlide.addText('Healthiest', {
      x: 5.2,
      y: 0.85,
      w: 4.3,
      h: 0.35,
      fontSize: 16,
      bold: true,
      color: '0F172A',
    });
    (report.teamAnalytics?.healthiest || []).forEach((team, index) => {
      focusSlide.addText(
        `${index + 1}. ${team.department} — ${team.resolutionRate}% · ${team.totalTickets} req`,
        {
          x: 5.2,
          y: 1.3 + index * 0.4,
          w: 4.3,
          h: 0.35,
          fontSize: 12,
          color: '334155',
        },
      );
    });
  }

  if (report.keyFindings?.length) {
    const findingsSlide = pptx.addSlide();
    findingsSlide.background = { color: 'F8FAFC' };
    addHeaderBar(findingsSlide, 'Key Findings');
    report.keyFindings.forEach((finding, index) => {
      findingsSlide.addText(`${index + 1}. ${finding}`, {
        x: 0.65,
        y: 1.0 + index * 0.45,
        w: 8.8,
        h: 0.4,
        fontSize: 13,
        color: '334155',
      });
    });
  }

  if (report.recommendations?.length) {
    const recSlide = pptx.addSlide();
    recSlide.background = { color: 'F8FAFC' };
    addHeaderBar(recSlide, 'Recommendations');
    report.recommendations.forEach((rec, index) => {
      recSlide.addText(`${index + 1}. ${rec}`, {
        x: 0.65,
        y: 1.0 + index * 0.45,
        w: 8.8,
        h: 0.4,
        fontSize: 13,
        color: '334155',
      });
    });
  }

  const closingSlide = pptx.addSlide();
  closingSlide.background = { color: '0F172A' };
  closingSlide.addText('Thank you', {
    x: 0.6,
    y: 2.2,
    w: 8.8,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
  });
  closingSlide.addText(ORGANIZATION, {
    x: 0.6,
    y: 3.0,
    w: 8.8,
    h: 0.35,
    fontSize: 14,
    color: '94A3B8',
    align: 'center',
  });

  await pptx.writeFile({ fileName: `${fileStamp(report.title)}.pptx` });
}
