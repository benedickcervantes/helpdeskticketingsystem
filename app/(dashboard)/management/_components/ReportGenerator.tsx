// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api/client';
import { subscribeDepartmentEvents } from '@/lib/realtime/socketClient';
import {
  buildManagementReportCharts,
  buildServiceQualitySnapshot,
  buildTeamAnalyticsReport,
  computeExecutiveMetrics,
  computeHealthStatus,
  formatExecutiveDuration,
  getDateRangeSpanLabel,
} from '@/lib/utils/analytics';
import { filterFeedbackByDateRange } from '@/lib/utils/feedbackReportUtils';
import {
  buildFeedbackSummary,
  buildDataDrivenInsights,
  getReportPeriodLabel,
} from '@/lib/utils/managementReportUtils';
import DateRangeSelect from './DateRangeSelect';

const toDepartmentNames = (data) => {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => (typeof item === 'string' ? item : item?.name))
    .map((name) => String(name || '').trim())
    .filter(Boolean);
};

const REPORT_TYPES = [
  {
    id: 'dashboard',
    name: 'Full overview',
    description: 'Complete snapshot across all sections',
  },
  {
    id: 'executive',
    name: 'At a Glance',
    description: 'Short summary for executives',
  },
  {
    id: 'analytics',
    name: 'Charts & volume',
    description: 'Volume, status, and distribution',
  },
  {
    id: 'operational',
    name: 'Service quality',
    description: 'Targets, finish rate, and speed',
  },
  {
    id: 'departmental',
    name: 'By Team',
    description: 'Department-by-department breakdown',
  },
];

const FORMAT_OPTIONS = [
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Printable document with charts',
  },
  {
    id: 'powerpoint',
    name: 'PowerPoint',
    description: 'Slides ready for meetings',
  },
];

const ICON_PATHS = {
  dashboard:
    'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
  executive:
    'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
  analytics:
    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  operational: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  departmental:
    'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  pdf: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  powerpoint:
    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
};

const ReportIcon = ({ id, className = '' }) => (
  <span
    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-app-primary-soft text-app-primary ${className}`}
  >
    <svg className="h-4.5 w-4.5 h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={ICON_PATHS[id] || ICON_PATHS.dashboard}
      />
    </svg>
  </span>
);

const ReportGenerator = ({
  tickets = [],
  users = [],
  feedback = [],
  dateRange = '30',
  onDateRangeChange,
}) => {
  const [departmentNames, setDepartmentNames] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const apply = (data) => {
      if (cancelled) return;
      const names = toDepartmentNames(data);
      const seen = new Set();
      const unique = [];
      names.forEach((name) => {
        const key = name.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        unique.push(name);
      });
      setDepartmentNames(unique);
    };

    api
      .get('/api/v1/departments')
      .then(apply)
      .catch(() => {
        if (!cancelled) setDepartmentNames([]);
      });

    const unsub = subscribeDepartmentEvents((items) => apply(items));
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const metrics = useMemo(
    () => computeExecutiveMetrics(tickets, feedback, dateRange),
    [tickets, feedback, dateRange],
  );
  const healthStatus = useMemo(() => computeHealthStatus(metrics), [metrics]);
  const filteredFeedback = useMemo(
    () => filterFeedbackByDateRange(feedback, dateRange),
    [feedback, dateRange],
  );
  const feedbackSummary = useMemo(
    () => buildFeedbackSummary(filteredFeedback),
    [filteredFeedback],
  );
  const serviceQuality = useMemo(
    () => buildServiceQualitySnapshot(tickets, feedback, dateRange),
    [tickets, feedback, dateRange],
  );
  const teamAnalytics = useMemo(
    () => buildTeamAnalyticsReport(tickets, users, dateRange, departmentNames),
    [tickets, users, dateRange, departmentNames],
  );
  const reportPeriod = useMemo(() => getReportPeriodLabel(dateRange), [dateRange]);
  const periodSpan = useMemo(() => getDateRangeSpanLabel(dateRange), [dateRange]);
  const typicalFix = useMemo(
    () => formatExecutiveDuration(metrics?.avgResolutionTime),
    [metrics?.avgResolutionTime],
  );
  const chartData = useMemo(
    () => buildManagementReportCharts(tickets, users, dateRange),
    [tickets, users, dateRange],
  );

  const [selectedReportType, setSelectedReportType] = useState('dashboard');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const selectedTypeMeta =
    REPORT_TYPES.find((t) => t.id === selectedReportType) || REPORT_TYPES[0];
  const selectedFormatMeta =
    FORMAT_OPTIONS.find((f) => f.id === selectedFormat) || FORMAT_OPTIONS[0];

  const urgentOpen = metrics?.urgentOpenTickets || 0;
  const finishedCount = metrics?.resolvedCount || 0;
  const openCount = metrics?.openCount || 0;
  const topByFinishRate = [...(teamAnalytics.teams || [])]
    .filter((d) => (d.totalTickets || 0) > 0)
    .sort(
      (a, b) =>
        (b.resolutionRate || 0) - (a.resolutionRate || 0) ||
        (b.totalTickets || 0) - (a.totalTickets || 0),
    )[0] ||
    [...(chartData.departmentPerformance || [])]
      .filter((d) => (d.total || 0) > 0)
      .sort(
        (a, b) =>
          (b.resolutionRate || 0) - (a.resolutionRate || 0) ||
          (b.total || 0) - (a.total || 0),
      )[0];
  const topByVolume =
    [...(teamAnalytics.teams || [])]
      .sort((a, b) => b.totalTickets - a.totalTickets)[0] ||
    chartData.departmentPerformance?.[0];
  // Normalize for findings that expect .department / .resolutionRate / .total
  const topByFinishRateNorm = topByFinishRate
    ? {
        department: topByFinishRate.department,
        resolutionRate: topByFinishRate.resolutionRate,
        total: topByFinishRate.totalTickets ?? topByFinishRate.total,
      }
    : null;
  const topByVolumeNorm = topByVolume
    ? {
        department: topByVolume.department,
        total: topByVolume.totalTickets ?? topByVolume.total,
      }
    : null;

  const weakestByRate = [...(teamAnalytics.teams || [])]
    .filter((d) => (d.totalTickets || 0) >= 2)
    .sort(
      (a, b) =>
        (a.resolutionRate || 0) - (b.resolutionRate || 0) ||
        (b.totalTickets || 0) - (a.totalTickets || 0),
    )[0];

  const insightBase = () => ({
    periodLabel: reportPeriod,
    periodSpan,
    totalTickets: metrics?.totalTickets || 0,
    finishedCount,
    openCount,
    stillOpenCount: metrics?.stillOpenCount || 0,
    resolutionRate: metrics?.resolutionRate || 0,
    avgResolutionHours: metrics?.avgResolutionTime || 0,
    typicalFixLabel: typicalFix,
    urgentOpen,
    customerSatisfaction:
      (feedbackSummary?.totalFeedback || 0) > 0
        ? Number(feedbackSummary.satisfactionRate)
        : metrics?.customerSatisfaction || 0,
    health: {
      status: healthStatus?.status,
      score: healthStatus?.score,
      headline: healthStatus?.headline,
      summary: healthStatus?.summary,
    },
    feedback: feedbackSummary,
    serviceQuality: {
      score: serviceQuality.score,
      verdict: serviceQuality.verdict,
      verdictTone: serviceQuality.verdictTone,
      verdictSummary: serviceQuality.verdictSummary,
      resolutionRate: serviceQuality.resolutionRate,
      stillOpen: serviceQuality.stillOpen,
      overdueOpen: serviceQuality.overdueOpen,
      agingOpen: serviceQuality.agingOpen,
      targets: serviceQuality.targets,
      feedbackMetrics: serviceQuality.feedbackMetrics,
    },
    team: {
      allTeams: teamAnalytics.allTeams,
      activeTeams: teamAnalytics.activeTeams,
      needingHelp: teamAnalytics.needingHelp,
      totalOpen: teamAnalytics.totalOpen,
      totalOverdue: teamAnalytics.totalOverdue,
      needsHelp: teamAnalytics.needsHelp,
      healthiest: teamAnalytics.healthiest,
      weakestByRate: weakestByRate
        ? {
            department: weakestByRate.department,
            resolutionRate: weakestByRate.resolutionRate,
            totalTickets: weakestByRate.totalTickets,
          }
        : null,
    },
    topByFinish: topByFinishRateNorm,
    topByVolume: topByVolumeNorm,
    chartKpis: chartData.chartKpis,
    priority: {
      critical: chartData.priorityDistribution?.[0]?.value || 0,
      high: chartData.priorityDistribution?.[1]?.value || 0,
      medium: chartData.priorityDistribution?.[2]?.value || 0,
      low: chartData.priorityDistribution?.[3]?.value || 0,
    },
    fixTimeSummary: chartData.fixTimeSummary,
    weeklyFixTimes: chartData.weeklyFixTimes,
    dailyTrends: chartData.dailyTrends,
  });

  const satisfactionDisplay =
    (feedbackSummary?.totalFeedback || 0) > 0
      ? Number(feedbackSummary.satisfactionRate)
      : 0;

  const buildReportBase = (overrides = {}) => ({
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    period: reportPeriod,
    periodSpan,
    summary: {
      totalRequests: metrics?.totalTickets || 0,
      resolutionRate: metrics?.resolutionRate || 0,
      avgResolutionTime: metrics?.avgResolutionTime || 0,
      avgResolutionLabel: typicalFix,
      // Same “Happy users” % as Feedback tab
      customerSatisfaction: satisfactionDisplay || metrics?.customerSatisfaction || 0,
      criticalIssues: urgentOpen,
      finishedCount,
      openCount,
      inProgressCount: metrics?.inProgressCount || 0,
      stillOpenCount: metrics?.stillOpenCount || 0,
      feedbackCount: feedbackSummary?.totalFeedback || metrics?.feedbackCount || 0,
    },
    chartKpis: chartData.chartKpis,
    feedbackSummary,
    healthStatus: healthStatus?.status || 'Unknown',
    healthScore: healthStatus?.score || 0,
    healthHeadline: healthStatus?.headline || '',
    healthSummary: healthStatus?.summary || '',
    serviceQuality: {
      score: serviceQuality.score,
      verdict: serviceQuality.verdict,
      verdictTone: serviceQuality.verdictTone,
      verdictSummary: serviceQuality.verdictSummary,
      resolutionRate: serviceQuality.resolutionRate,
      stillOpen: serviceQuality.stillOpen,
      overdueOpen: serviceQuality.overdueOpen,
      agingOpen: serviceQuality.agingOpen,
      targets: serviceQuality.targets,
      feedbackMetrics: serviceQuality.feedbackMetrics,
    },
    teamAnalytics,
    charts: chartData,
    ...overrides,
  });

  const generateDashboardOverviewReport = () => {
    const insights = buildDataDrivenInsights({
      ...insightBase(),
      reportKind: 'dashboard',
    });
    return buildReportBase({
      title: 'IT Support Full Overview',
      subtitle: `Complete performance snapshot · ${periodSpan}`,
      reportType: 'dashboard',
      keyFindings: insights.keyFindings,
      recommendations: insights.recommendations,
    });
  };

  const generateExecutiveReport = () => {
    const insights = buildDataDrivenInsights({
      ...insightBase(),
      reportKind: 'executive',
    });
    return buildReportBase({
      title: 'IT Support At a Glance',
      subtitle: `Executive snapshot · ${periodSpan}`,
      reportType: 'executive',
      keyFindings: insights.keyFindings,
      recommendations: insights.recommendations,
    });
  };

  const generateAnalyticsReport = () => {
    const insights = buildDataDrivenInsights({
      ...insightBase(),
      reportKind: 'analytics',
    });
    return buildReportBase({
      title: 'IT Support Charts & Volume',
      subtitle: `Volume and distribution · ${periodSpan}`,
      reportType: 'analytics',
      keyFindings: insights.keyFindings,
      recommendations: insights.recommendations,
    });
  };

  const generatePerformanceReport = () => {
    const insights = buildDataDrivenInsights({
      ...insightBase(),
      reportKind: 'operational',
    });
    return buildReportBase({
      title: 'IT Support Service Quality',
      subtitle: `Quality targets and risks · ${periodSpan}`,
      reportType: 'operational',
      keyFindings: insights.keyFindings,
      recommendations: insights.recommendations,
    });
  };

  const generateDepartmentalReport = () => {
    const insights = buildDataDrivenInsights({
      ...insightBase(),
      reportKind: 'departmental',
    });
    return buildReportBase({
      title: 'IT Support By Team',
      subtitle: `Department comparison · ${periodSpan}`,
      reportType: 'departmental',
      keyFindings: insights.keyFindings,
      recommendations: insights.recommendations,
    });
  };

  const buildSelectedReport = () => {
    switch (selectedReportType) {
      case 'executive':
        return generateExecutiveReport();
      case 'analytics':
        return generateAnalyticsReport();
      case 'operational':
        return generatePerformanceReport();
      case 'departmental':
        return generateDepartmentalReport();
      case 'dashboard':
      default:
        return generateDashboardOverviewReport();
    }
  };

  const healthTone =
    healthStatus?.status === 'Excellent'
      ? 'bg-app-primary-soft text-app-primary border-app-primary/30'
      : healthStatus?.status === 'Good'
        ? 'bg-sky-500/15 text-sky-700 border-sky-500/30'
        : healthStatus?.status === 'Fair'
          ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
          : 'bg-rose-500/15 text-rose-500 border-rose-500/30';

  const previewReport = useMemo(
    () => buildSelectedReport(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      selectedReportType,
      metrics,
      healthStatus,
      feedbackSummary,
      serviceQuality,
      teamAnalytics,
      reportPeriod,
      periodSpan,
      typicalFix,
      chartData,
    ],
  );

  const previewCharts = [
    {
      label: 'Charts KPI strip',
      detail: chartData.chartKpis
        ? `New ${chartData.chartKpis.newRequests} · Open ${chartData.chartKpis.stillOpen} · Finished ${chartData.chartKpis.finished} · Urgent ${chartData.chartKpis.urgent}`
        : '—',
    },
    {
      label: 'Daily request activity',
      detail: `${chartData.dailyTrends?.length || 0} days · New / Waiting / Being fixed / Done`,
    },
    {
      label: 'Where requests stand',
      detail:
        chartData.statusDistribution
          ?.map((s) => `${s.name}: ${s.value}`)
          .join(' · ') || '—',
    },
    {
      label: 'How urgent are they?',
      detail: `${chartData.priorityDistribution?.[0]?.value || 0} critical · ${chartData.priorityDistribution?.[1]?.value || 0} high`,
    },
    {
      label: 'Requests by department',
      detail: `Top ${chartData.departmentPerformance?.length || 0} teams by volume`,
    },
    {
      label: 'How long do fixes usually take?',
      detail: chartData.weeklyFixTimes?.length
        ? `${chartData.weeklyFixTimes.length} weeks · Typical ${formatExecutiveDuration(chartData.fixTimeSummary?.typical)}`
        : 'No finished tickets yet',
    },
    {
      label: 'How fast were tickets finished?',
      detail:
        chartData.speedDistribution
          ?.filter((s) => s.value > 0)
          .map((s) => `${s.name}: ${s.value}`)
          .join(' · ') || 'No completed fixes yet',
    },
    {
      label: 'This year by month',
      detail: chartData.monthlyComparison?.some((m) => m.filed > 0)
        ? `${new Date().getFullYear()} · Filed vs Finished`
        : 'No monthly data yet',
    },
    {
      label: 'Service quality + By Team',
      detail: `${serviceQuality.verdict} · ${teamAnalytics.allTeams} teams · ${teamAnalytics.totalOverdue} overdue 2w+`,
    },
    {
      label: 'Feedback detail',
      detail:
        (feedbackSummary?.totalFeedback || 0) > 0
          ? `${feedbackSummary.totalFeedback} ratings · avg ${feedbackSummary.averageRating}/5 · happy ${feedbackSummary.satisfactionRate}% · needs improvement ${feedbackSummary.improvementRate}%`
          : 'No feedback in this period',
    },
  ];

  const previewMetrics = [
    {
      label: 'Total requests',
      value: metrics?.totalTickets || 0,
      accent: 'text-app',
      bar: 'bg-sky-500',
    },
    {
      label: 'Finish rate',
      value: `${metrics?.resolutionRate || 0}%`,
      accent: 'text-app-primary',
      bar: 'bg-app-primary',
    },
    {
      label: 'Typical fix time',
      value: typicalFix,
      accent: 'text-amber-600',
      bar: 'bg-amber-500',
    },
    {
      label: 'Happy users',
      value:
        (feedbackSummary?.totalFeedback || 0) > 0
          ? `${feedbackSummary.satisfactionRate}%`
          : '—',
      accent: 'text-app-primary',
      bar: 'bg-app-primary',
    },
  ];

  const downloadLabel =
    selectedFormat === 'powerpoint' ? 'Download PowerPoint' : 'Download PDF';

  const generateReport = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const report = buildSelectedReport();
      setGenerationProgress(15);
      // Allow UI to paint progress before heavy chart capture work
      await new Promise((r) => setTimeout(r, 80));

      setGenerationProgress(35);
      if (selectedFormat === 'pdf') {
        setGenerationProgress(55);
        const { exportManagementReportPdf } = await import(
          '@/lib/utils/managementReportExport'
        );
        await exportManagementReportPdf(report);
      } else if (selectedFormat === 'powerpoint') {
        setGenerationProgress(55);
        const { exportManagementReportPptx } = await import(
          '@/lib/utils/managementReportExport'
        );
        await exportManagementReportPptx(report);
      }

      setGenerationProgress(100);
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 900);
    } catch (error) {
      console.error('Error generating report:', error);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 w-full max-w-full">
      {/* Header — matches other Executive Dashboard tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between px-1 min-w-0">
        <div className="min-w-0 text-center sm:text-left">
          <h2 className="text-lg sm:text-2xl font-bold text-app mb-1">Reports</h2>
          <p className="text-xs sm:text-sm text-app-muted">
            Download a PDF or PowerPoint for leadership reviews
            <span className="text-app-muted/80"> · {periodSpan}</span>
          </p>
        </div>
        {onDateRangeChange ? (
          <DateRangeSelect value={dateRange} onChange={onDateRangeChange} />
        ) : null}
      </div>

      {/* Step 1 — Choose report */}
      <div className="app-card rounded-xl border p-4 sm:p-5">
        <div className="mb-3 sm:mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
            Step 1
          </p>
          <h3 className="text-base sm:text-lg font-semibold text-app">Choose report</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3">
          {REPORT_TYPES.map((type) => {
            const active = selectedReportType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedReportType(type.id)}
                className={`relative flex items-start gap-3 rounded-xl border p-3 sm:p-3.5 text-left transition-all ${
                  active
                    ? 'border-app-primary bg-app-primary-soft ring-1 ring-app-primary/25'
                    : 'border-app bg-app-surface-2/50 hover:border-app-primary/40 hover:bg-app-surface-2'
                }`}
              >
                <ReportIcon id={type.id} />
                <span className="min-w-0 flex-1 pr-5">
                  <span
                    className={`block text-sm font-semibold ${active ? 'text-app-primary' : 'text-app'}`}
                  >
                    {type.name}
                  </span>
                  <span className="block text-xs text-app-muted mt-0.5 leading-snug">
                    {type.description}
                  </span>
                </span>
                {active ? (
                  <span className="absolute top-3 right-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-app-primary text-app-on-primary">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2 — Choose format */}
      <div className="app-card rounded-xl border p-4 sm:p-5">
        <div className="mb-3 sm:mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
            Step 2
          </p>
          <h3 className="text-base sm:text-lg font-semibold text-app">Choose format</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {FORMAT_OPTIONS.map((format) => {
            const active = selectedFormat === format.id;
            return (
              <button
                key={format.id}
                type="button"
                onClick={() => setSelectedFormat(format.id)}
                className={`relative flex items-start gap-3 rounded-xl border p-3.5 sm:p-4 text-left transition-all ${
                  active
                    ? 'border-app-primary bg-app-primary-soft ring-1 ring-app-primary/25'
                    : 'border-app bg-app-surface-2/50 hover:border-app-primary/40 hover:bg-app-surface-2'
                }`}
              >
                <ReportIcon id={format.id} />
                <span className="min-w-0 flex-1 pr-5">
                  <span
                    className={`block text-sm font-semibold ${active ? 'text-app-primary' : 'text-app'}`}
                  >
                    {format.name}
                  </span>
                  <span className="block text-xs text-app-muted mt-0.5">
                    {format.description}
                  </span>
                </span>
                {active ? (
                  <span className="absolute top-3 right-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-app-primary text-app-on-primary">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3 — Preview & download */}
      <div className="app-card relative overflow-hidden rounded-xl border">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-app-primary" />
        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-app-muted mb-1">
                Step 3 · Preview
              </p>
              <h3 className="text-base sm:text-xl font-bold text-app leading-snug">
                {previewReport?.title || selectedTypeMeta.name}
              </h3>
              <p className="text-sm text-app-muted mt-1">
                {previewReport?.subtitle || selectedTypeMeta.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="inline-flex items-center rounded-lg border border-app bg-app-surface-2/70 px-2.5 py-1 text-xs font-medium text-app-soft">
                {reportPeriod}
              </span>
              <span className="inline-flex items-center rounded-lg border border-app bg-app-surface-2/70 px-2.5 py-1 text-xs font-medium text-app-soft">
                {periodSpan}
              </span>
              <span className="inline-flex items-center rounded-lg border border-app bg-app-surface-2/70 px-2.5 py-1 text-xs font-medium text-app-soft">
                {selectedFormatMeta.name}
              </span>
              <span
                className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${healthTone}`}
              >
                {healthStatus?.headline || healthStatus?.status || 'Unknown'} ·{' '}
                {healthStatus?.score || 0}/100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {previewMetrics.map((metric) => (
              <div
                key={metric.label}
                className="relative overflow-hidden rounded-xl border border-app/40 bg-app-surface-2/60 p-3 sm:p-4"
              >
                <div className={`absolute inset-x-0 top-0 h-0.5 ${metric.bar}`} />
                <p className="text-[11px] sm:text-xs font-medium text-app-muted">{metric.label}</p>
                <p className={`mt-1 text-lg sm:text-2xl font-bold tabular-nums leading-tight ${metric.accent}`}>
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-xl border border-app/40 bg-app-surface-2/40 p-3.5 sm:p-4">
              <h4 className="font-semibold text-app mb-3 text-sm sm:text-base">What’s included</h4>
              <ul className="space-y-2">
                {previewCharts.map((chart) => (
                  <li
                    key={chart.label}
                    className="flex items-start gap-2.5 rounded-lg border border-app/30 bg-app-panel/50 px-3 py-2.5"
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-app-primary-soft text-app-primary">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-app">{chart.label}</p>
                      <p className="text-xs text-app-muted truncate">{chart.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-app/40 bg-app-surface-2/40 p-3.5 sm:p-4">
              <h4 className="font-semibold text-app mb-3 text-sm sm:text-base">Key findings</h4>
              <ul className="space-y-2">
                {(previewReport?.keyFindings || []).slice(0, 4).map((finding, index) => (
                  <li
                    key={`${index}-${finding.slice(0, 24)}`}
                    className="flex items-start gap-2.5 rounded-lg border border-app/30 bg-app-panel/50 px-3 py-2.5"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-app-surface-3 text-[11px] font-semibold text-app-soft">
                      {index + 1}
                    </span>
                    <p className="text-sm text-app-soft leading-relaxed">{finding}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-app-muted">
                <span className="inline-flex items-center rounded-md border border-app/30 bg-app-panel/50 px-2 py-1">
                  {feedbackSummary?.totalFeedback || 0} feedback responses
                </span>
                <span className="inline-flex items-center rounded-md border border-app/30 bg-app-panel/50 px-2 py-1">
                  {(previewReport?.recommendations || []).length} recommendations
                </span>
              </div>
            </div>
          </div>

          <div className="pt-1 space-y-3">
            <button
              type="button"
              onClick={generateReport}
              disabled={isGenerating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-app-primary text-app-on-primary font-semibold text-sm sm:text-base shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  Rendering accurate charts… {generationProgress}%
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  {downloadLabel}
                </>
              )}
            </button>

            {isGenerating ? (
              <div className="w-full bg-app-surface-2 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-app-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            ) : (
              <p className="text-xs text-app-muted">
                Exports {selectedTypeMeta.name.toLowerCase()} for {reportPeriod.toLowerCase()} (
                {periodSpan}) as {selectedFormatMeta.name}. May take longer — charts match the
                Dashboard for accuracy.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
