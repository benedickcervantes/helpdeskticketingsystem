// @ts-nocheck
'use client';

import { useMemo, useState } from 'react';
import {
  buildManagementReportCharts,
  computeExecutiveMetrics,
  computeHealthStatus,
} from '@/lib/utils/analytics';
import { filterFeedbackByDateRange } from '@/lib/utils/feedbackReportUtils';
import {
  buildFeedbackSummary,
  getReportPeriodLabel,
} from '@/lib/utils/managementReportUtils';

const ReportGenerator = ({
  tickets = [],
  users = [],
  feedback = [],
  dateRange = '30',
  onDateRangeChange,
}) => {
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
  const reportPeriod = useMemo(() => getReportPeriodLabel(dateRange), [dateRange]);
  const chartData = useMemo(
    () => buildManagementReportCharts(tickets, users, dateRange),
    [tickets, users, dateRange],
  );
  const [selectedReportType, setSelectedReportType] = useState('dashboard');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const reportTypes = [
    {
      id: 'dashboard',
      name: 'Management Dashboard Overview',
      description: 'Complete overview across all dashboard sections',
    },
    {
      id: 'executive',
      name: 'Executive Summary',
      description: 'High-level overview for C-level executives',
    },
    {
      id: 'analytics',
      name: 'Analytics Overview',
      description: 'Comprehensive charts and data visualizations',
    },
    {
      id: 'operational',
      name: 'Performance Metrics',
      description: 'Detailed performance metrics and KPIs',
    },
    {
      id: 'departmental',
      name: 'Department Analysis',
      description: 'Department-wise performance breakdown',
    },
    {
      id: 'trends',
      name: 'Trend Analysis',
      description: 'Historical trends and predictive insights',
    },
    {
      id: 'compliance',
      name: 'Compliance Report',
      description: 'SLA compliance and audit trail',
    },
  ];

  const formatOptions = [
    { id: 'pdf', name: 'PDF Document', description: 'Professional PDF with charts' },
    { id: 'powerpoint', name: 'PowerPoint Presentation', description: 'Executive presentation with visualizations' },
  ];

  const renderReportIcon = (id) => {
    const paths = {
      dashboard: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
      executive: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      analytics: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      operational: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      departmental: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      trends: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      compliance: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      pdf: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      powerpoint: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    };
    return (
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-app-primary-soft text-app-primary mb-2.5">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={paths[id] || paths.dashboard} />
        </svg>
      </span>
    );
  };

  const generateChartData = () => chartData;

  const buildReportBase = (overrides = {}) => {
    const charts = generateChartData();
    return {
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      period: reportPeriod,
      summary: {
        totalRequests: metrics?.totalTickets || 0,
        resolutionRate: metrics?.resolutionRate || 0,
        avgResolutionTime: metrics?.avgResolutionTime || 0,
        customerSatisfaction: metrics?.customerSatisfaction || 0,
        criticalIssues: metrics?.criticalTickets || 0,
      },
      feedbackSummary,
      healthStatus: healthStatus?.status || 'Unknown',
      healthScore: healthStatus?.score || 0,
      charts,
      ...overrides,
    };
  };

  const generateDashboardOverviewReport = () => {
    const charts = generateChartData();
    const deptCount = charts.departmentPerformance?.length || 0;
    const topDept = charts.departmentPerformance?.[0];

    return buildReportBase({
      title: 'Management Dashboard Overview Report',
      subtitle: 'Comprehensive IT Helpdesk Performance Summary',
      reportType: 'dashboard',
      keyFindings: [
        `Dashboard overview for ${reportPeriod}: ${metrics?.totalTickets || 0} total support requests`,
        `Resolution rate ${metrics?.resolutionRate || 0}% with average resolution time of ${metrics?.avgResolutionTime || 0} hours`,
        `Support health: ${healthStatus?.status || 'Unknown'} (score ${healthStatus?.score || 0}/100)`,
        `${metrics?.criticalTickets || 0} critical issues requiring attention`,
        `Customer satisfaction at ${metrics?.customerSatisfaction || 0}% from ${feedbackSummary?.totalFeedback || 0} feedback responses`,
        `Department coverage: ${deptCount} departments — top performer: ${topDept?.department || 'N/A'} (${topDept?.resolutionRate || 0}% resolution rate)`,
      ],
      recommendations: [
        (metrics?.resolutionRate || 0) < 80
          ? 'Prioritize backlog reduction and resolution rate improvements'
          : 'Maintain strong resolution performance across all teams',
        (metrics?.avgResolutionTime || 0) > 48
          ? 'Review workflows to reduce average resolution time'
          : 'Resolution times are within acceptable targets',
        (metrics?.criticalTickets || 0) > 0
          ? 'Address critical issues immediately to minimize business impact'
          : 'Continue monitoring for emerging critical issues',
        (feedbackSummary?.totalFeedback || 0) > 0
          ? 'Review executive feedback reports for service improvement opportunities'
          : 'Encourage user feedback to strengthen satisfaction metrics',
        'Share department best practices and monitor SLA compliance regularly',
      ],
    });
  };

  const generateExecutiveReport = () =>
    buildReportBase({
      title: 'IT Support Executive Summary Report',
      subtitle: 'Executive-level performance snapshot',
      reportType: 'executive',
      keyFindings: [
        `Support team handled ${metrics?.totalTickets || 0} requests with ${metrics?.resolutionRate || 0}% resolution rate`,
        `Average resolution time of ${metrics?.avgResolutionTime || 0} hours`,
        `${metrics?.criticalTickets || 0} critical issues requiring immediate attention`,
        `Customer satisfaction at ${metrics?.customerSatisfaction || 0}%`,
      ],
      recommendations: [
        (metrics?.resolutionRate || 0) < 80
          ? 'Improve resolution rate through additional training'
          : 'Maintain excellent resolution performance',
        (metrics?.avgResolutionTime || 0) > 48
          ? 'Implement process improvements to reduce resolution time'
          : 'Resolution times are within acceptable range',
        (metrics?.criticalTickets || 0) > 0
          ? 'Address critical issues immediately to prevent business disruption'
          : 'No critical issues requiring immediate attention',
      ],
    });

  const generateAnalyticsReport = () => {
    const charts = generateChartData();
    return buildReportBase({
      title: 'IT Support Analytics Overview Report',
      subtitle: 'Charts and distribution analysis',
      reportType: 'analytics',
      keyFindings: [
        `Total ticket volume: ${metrics?.totalTickets || 0} requests processed`,
        `Status distribution: ${Math.round(((charts.ticketVolume[3]?.value || 0) / (metrics?.totalTickets || 1)) * 100)}% resolved, ${Math.round(((charts.ticketVolume[1]?.value || 0) / (metrics?.totalTickets || 1)) * 100)}% open`,
        `Priority breakdown: ${charts.priorityDistribution[0]?.value || 0} critical, ${charts.priorityDistribution[1]?.value || 0} high priority`,
        `Department analysis covers ${charts.departmentPerformance?.length || 0} departments`,
        `Top performing department: ${charts.departmentPerformance[0]?.department || 'N/A'}`,
      ],
      recommendations: [
        'Monitor daily ticket volume trends for capacity planning',
        'Focus on reducing open ticket backlog',
        'Implement priority-based routing for critical issues',
        'Share best practices from top-performing departments',
        'Analyze resolution time patterns for process improvements',
      ],
    });
  };

  const generatePerformanceReport = () => {
    const charts = generateChartData();
    const rates = charts.departmentPerformance?.map((d) => d.resolutionRate) || [0];
    return buildReportBase({
      title: 'IT Support Performance Metrics Report',
      subtitle: 'Operational KPIs and efficiency metrics',
      reportType: 'operational',
      keyFindings: [
        `Performance metrics show ${metrics?.totalTickets || 0} total requests processed`,
        `Resolution rate of ${metrics?.resolutionRate || 0}% indicates operational efficiency`,
        `Average resolution time of ${metrics?.avgResolutionTime || 0} hours`,
        `Critical issues count: ${metrics?.criticalTickets || 0}`,
        `Department performance varies from ${Math.min(...rates)}% to ${Math.max(...rates)}%`,
      ],
      recommendations: [
        'Monitor daily ticket volume trends for capacity planning',
        'Implement automated routing for improved efficiency',
        'Regular training sessions for support team members',
        'Focus on departments with lower resolution rates',
        'Implement SLA monitoring and alerting',
      ],
    });
  };

  const generateDepartmentalReport = () => {
    const charts = generateChartData();
    const sortedByVolume = [...(charts.departmentPerformance || [])].sort(
      (a, b) => (b.total || 0) - (a.total || 0),
    );
    const rates = charts.departmentPerformance?.map((d) => d.resolutionRate) || [0];
    return buildReportBase({
      title: 'Department Performance Analysis Report',
      subtitle: 'Department-wise breakdown and comparisons',
      reportType: 'departmental',
      keyFindings: [
        `Department analysis covers ${charts.departmentPerformance?.length || 0} departments`,
        `Top performing department: ${charts.departmentPerformance[0]?.department || 'N/A'} with ${charts.departmentPerformance[0]?.resolutionRate || 0}% resolution rate`,
        `Average department resolution rate: ${Math.round((charts.departmentPerformance?.reduce((sum, d) => sum + (d.resolutionRate || 0), 0) || 0) / (charts.departmentPerformance?.length || 1))}%`,
        `Department with highest volume: ${sortedByVolume[0]?.department || 'N/A'}`,
        `Performance gap: ${Math.max(...rates) - Math.min(...rates)}% between best and worst performing departments`,
      ],
      recommendations: [
        'Share best practices from top-performing departments',
        'Provide additional support to underperforming departments',
        'Implement department-specific training programs',
        'Create department performance dashboards',
        'Regular department performance reviews',
      ],
    });
  };

  const generateTrendsReport = () => {
    const charts = generateChartData();
    return buildReportBase({
      title: 'IT Support Trend Analysis Report',
      subtitle: 'Performance trends and forecasting insights',
      reportType: 'trends',
      keyFindings: [
        `Trend analysis based on ${metrics?.totalTickets || 0} requests over ${reportPeriod}`,
        `Current resolution rate of ${metrics?.resolutionRate || 0}% shows ${(metrics?.resolutionRate || 0) >= 90 ? 'excellent' : (metrics?.resolutionRate || 0) >= 80 ? 'good' : 'room for improvement'} performance`,
        `Average resolution time of ${metrics?.avgResolutionTime || 0} hours is ${(metrics?.avgResolutionTime || 0) <= 24 ? 'excellent' : (metrics?.avgResolutionTime || 0) <= 48 ? 'acceptable' : 'needs improvement'}`,
        `Critical issues represent ${Math.round(((charts.priorityDistribution[0]?.value || 0) / (metrics?.totalTickets || 1)) * 100)}% of total volume`,
        `Department performance trends show ${charts.departmentPerformance?.length || 0} departments with varying performance levels`,
      ],
      recommendations: [
        'Implement trend monitoring dashboards',
        'Set up automated alerts for performance degradation',
        'Conduct regular trend analysis reviews',
        'Develop predictive models for capacity planning',
        'Create trend-based performance improvement plans',
      ],
    });
  };

  const generateComplianceReport = () => {
    const charts = generateChartData();
    return buildReportBase({
      title: 'SLA Compliance & Audit Report',
      subtitle: 'Compliance status and audit findings',
      reportType: 'compliance',
      keyFindings: [
        `SLA compliance analysis for ${metrics?.totalTickets || 0} requests`,
        `Resolution rate compliance: ${(metrics?.resolutionRate || 0) >= 90 ? 'Compliant' : 'Non-compliant'} (${metrics?.resolutionRate || 0}% vs 90% target)`,
        `Response time compliance: ${(metrics?.avgResolutionTime || 0) <= 48 ? 'Compliant' : 'Non-compliant'} (${metrics?.avgResolutionTime || 0}h vs 48h target)`,
        `Critical issues compliance: ${(charts.priorityDistribution[0]?.value || 0) <= 5 ? 'Compliant' : 'Non-compliant'} (${charts.priorityDistribution[0]?.value || 0} critical issues)`,
        `Department compliance varies across ${charts.departmentPerformance?.length || 0} departments`,
      ],
      recommendations: [
        'Implement automated SLA monitoring',
        'Regular compliance reviews and reporting',
        'Process improvements for non-compliant areas',
        'Department-specific SLA targets',
        'Compliance training for support teams',
      ],
    });
  };

  const healthTone =
    healthStatus?.status === 'Excellent'
      ? 'bg-app-primary-soft text-app-primary border-app-primary/30'
      : healthStatus?.status === 'Good'
        ? 'bg-sky-500/15 text-sky-700 border-sky-500/30'
        : healthStatus?.status === 'Fair'
          ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
          : 'bg-rose-500/15 text-rose-500 border-rose-500/30';

  const previewReport = useMemo(() => {
    switch (selectedReportType) {
      case 'executive':
        return generateExecutiveReport();
      case 'analytics':
        return generateAnalyticsReport();
      case 'operational':
        return generatePerformanceReport();
      case 'departmental':
        return generateDepartmentalReport();
      case 'trends':
        return generateTrendsReport();
      case 'compliance':
        return generateComplianceReport();
      case 'dashboard':
      default:
        return generateDashboardOverviewReport();
    }
  }, [
    selectedReportType,
    metrics,
    healthStatus,
    feedbackSummary,
    reportPeriod,
    chartData,
  ]);

  const previewCharts = [
    {
      label: 'Daily Ticket Trends',
      detail: `${chartData.dailyTrends?.length || 0} data points`,
    },
    {
      label: 'Ticket Volume Distribution',
      detail: `${metrics?.totalTickets || 0} total`,
    },
    {
      label: 'Status Distribution',
      detail:
        chartData.statusDistribution
          ?.map((s) => `${s.name}: ${s.value}`)
          .join(' · ') || '—',
    },
    {
      label: 'Priority Breakdown',
      detail: `${chartData.priorityDistribution?.[0]?.value || 0} critical`,
    },
    {
      label: 'Department Performance',
      detail: `${chartData.departmentPerformance?.length || 0} departments`,
    },
  ];

  const previewMetrics = [
    {
      label: 'Total Requests',
      value: metrics?.totalTickets || 0,
      accent: 'text-app',
      bar: 'bg-sky-500',
    },
    {
      label: 'Resolution Rate',
      value: `${metrics?.resolutionRate || 0}%`,
      accent: 'text-app-primary',
      bar: 'bg-app-primary',
    },
    {
      label: 'Avg Resolution',
      value: `${metrics?.avgResolutionTime || 0}h`,
      accent: 'text-amber-600',
      bar: 'bg-amber-500',
    },
    {
      label: 'Satisfaction',
      value: `${metrics?.customerSatisfaction || 0}%`,
      accent: 'text-app-primary',
      bar: 'bg-app-primary',
    },
  ];

  const generateReport = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      let report;
      switch (selectedReportType) {
        case 'dashboard':
          report = generateDashboardOverviewReport();
          break;
        case 'executive':
          report = generateExecutiveReport();
          break;
        case 'analytics':
          report = generateAnalyticsReport();
          break;
        case 'operational':
          report = generatePerformanceReport();
          break;
        case 'departmental':
          report = generateDepartmentalReport();
          break;
        case 'trends':
          report = generateTrendsReport();
          break;
        case 'compliance':
          report = generateComplianceReport();
          break;
        default:
          report = generateDashboardOverviewReport();
      }

      setGenerationProgress(30);

      if (selectedFormat === 'pdf') {
        setGenerationProgress(60);
        const { exportManagementReportPdf } = await import('@/lib/utils/managementReportExport');
        await exportManagementReportPdf(report);
      } else if (selectedFormat === 'powerpoint') {
        setGenerationProgress(60);
        const { exportManagementReportPptx } = await import('@/lib/utils/managementReportExport');
        await exportManagementReportPptx(report);
      }

      setGenerationProgress(90);
      setGenerationProgress(100);

      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Error generating report:', error);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="w-full space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8 px-1">
          <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-app mb-1 sm:mb-2">
            Executive Report Generator
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-app-muted max-w-2xl mx-auto">
            Create professional reports with comprehensive charts and visualizations designed for executive presentations.
          </p>
          {onDateRangeChange ? (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <label htmlFor="report-date-range" className="text-xs sm:text-sm text-app-muted">
                Report period
              </label>
              <select
                id="report-date-range"
                value={dateRange}
                onChange={(e) => onDateRangeChange(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 app-field border rounded-lg text-sm focus:outline-none"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
          ) : null}
        </div>

        {/* Report Type Selection */}
        <div className="app-card rounded-2xl p-4 sm:p-6 border shadow-xl">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-app">Select Report Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {reportTypes.map((type) => {
              const active = selectedReportType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedReportType(type.id)}
                  className={`relative p-4 sm:p-5 rounded-xl border text-left transition-all duration-200 ${
                    active
                      ? 'border-app-primary bg-app-primary-soft shadow-md ring-1 ring-app-primary/30'
                      : 'border-app bg-app-surface-2/40 hover:border-app-primary hover:bg-app-surface-2/70'
                  }`}
                >
                  {active ? (
                    <span className="absolute top-3 right-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-app-primary text-app-on-primary">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : null}
                  {renderReportIcon(type.id)}
                  <h3 className={`font-semibold mb-1 pr-6 ${active ? 'text-app-primary' : 'text-app'}`}>
                    {type.name}
                  </h3>
                  <p className="text-sm text-app-muted">{type.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Format Selection */}
        <div className="app-card rounded-2xl p-4 sm:p-6 border shadow-xl">
          <h3 className="text-base sm:text-lg font-semibold text-app mb-4">Select Report Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {formatOptions.map((format) => {
              const active = selectedFormat === format.id;
              return (
                <button
                  key={format.id}
                  type="button"
                  onClick={() => setSelectedFormat(format.id)}
                  className={`relative p-4 rounded-xl border text-left transition-all duration-200 ${
                    active
                      ? 'border-app-primary bg-app-primary-soft ring-1 ring-app-primary/30 shadow-md'
                      : 'border-app bg-app-surface-2/40 text-app-soft hover:border-app-primary'
                  }`}
                >
                  {active ? (
                    <span className="absolute top-3 right-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-app-primary text-app-on-primary">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : null}
                  {renderReportIcon(format.id)}
                  <h4 className={`font-semibold mb-1 ${active ? 'text-app-primary' : 'text-app'}`}>
                    {format.name}
                  </h4>
                  <p className="text-sm text-app-muted">{format.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Preview */}
        <div className="app-card relative overflow-hidden rounded-2xl border shadow-xl">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-app-primary" />
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-app-primary mb-1">
                  Report preview
                </p>
                <h3 className="text-base sm:text-xl font-bold text-app leading-snug">
                  {previewReport?.title || reportTypes.find((t) => t.id === selectedReportType)?.name}
                </h3>
                <p className="text-sm text-app-muted mt-1">
                  {previewReport?.subtitle || 'Live snapshot of what will be exported'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="inline-flex items-center rounded-lg border border-app bg-app-surface-2/70 px-2.5 py-1 text-xs font-medium text-app-soft">
                  {reportPeriod}
                </span>
                <span className="inline-flex items-center rounded-lg border border-app bg-app-surface-2/70 px-2.5 py-1 text-xs font-medium uppercase text-app-soft">
                  {selectedFormat}
                </span>
                <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${healthTone}`}>
                  {healthStatus?.status || 'Unknown'} · {healthStatus?.score || 0}/100
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {previewMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="relative overflow-hidden rounded-xl border border-app-subtle bg-app-surface-2/50 p-3 sm:p-4"
                >
                  <div className={`absolute inset-x-0 top-0 h-0.5 ${metric.bar}`} />
                  <p className="text-[11px] sm:text-xs font-medium text-app-muted">{metric.label}</p>
                  <p className={`mt-1 text-lg sm:text-2xl font-bold tabular-nums ${metric.accent}`}>
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <div className="rounded-xl border border-app-subtle bg-app-surface-2/40 p-3.5 sm:p-4">
                <h4 className="font-semibold text-app mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-app-primary-soft text-app-primary">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </span>
                  Charts included
                </h4>
                <ul className="space-y-2">
                  {previewCharts.map((chart) => (
                    <li
                      key={chart.label}
                      className="flex items-start gap-2.5 rounded-lg border border-app-subtle bg-app-panel/60 px-3 py-2.5"
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

              <div className="rounded-xl border border-app-subtle bg-app-surface-2/40 p-3.5 sm:p-4">
                <h4 className="font-semibold text-app mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-app-primary-soft text-app-primary">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  Key findings
                </h4>
                <ul className="space-y-2">
                  {(previewReport?.keyFindings || []).slice(0, 4).map((finding, index) => (
                    <li
                      key={`${index}-${finding.slice(0, 24)}`}
                      className="flex items-start gap-2.5 rounded-lg border border-app-subtle bg-app-panel/60 px-3 py-2.5"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-app-surface-3 text-[11px] font-semibold text-app-soft">
                        {index + 1}
                      </span>
                      <p className="text-sm text-app-soft leading-relaxed">{finding}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-app-muted">
                  <span className="inline-flex items-center rounded-md border border-app-subtle bg-app-panel/60 px-2 py-1">
                    {feedbackSummary?.totalFeedback || 0} feedback responses
                  </span>
                  <span className="inline-flex items-center rounded-md border border-app-subtle bg-app-panel/60 px-2 py-1">
                    {metrics?.criticalTickets || 0} critical issues
                  </span>
                  <span className="inline-flex items-center rounded-md border border-app-subtle bg-app-panel/60 px-2 py-1">
                    {(previewReport?.recommendations || []).length} recommendations
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center px-1">
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-4 bg-app-primary text-app-on-primary hover:opacity-90 rounded-xl font-semibold text-sm sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
          >
            <span className="relative z-10">
              {isGenerating ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-3"></div>
                  <span>Generating {selectedFormat.toUpperCase()} Report... {generationProgress}%</span>
                </div>
              ) : (
                `Generate & Download ${selectedFormat.toUpperCase()} Report`
              )}
            </span>
          </button>
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="w-full bg-app-surface-2 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-app-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress}%` }}
            ></div>
          </div>
        )}

        {/* Report Features */}
        <div className="app-card rounded-2xl p-4 sm:p-6 border shadow-xl">
          <h3 className="text-lg font-semibold text-app mb-4">Report Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start p-3 bg-app-surface-2/60 rounded-lg border border-app-subtle">
              <div className="w-8 h-8 rounded-full bg-app-primary-soft flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-4 h-4 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-app">Robust Data Handling</h4>
                <p className="text-sm text-app-muted">Safe handling of undefined or missing data</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-app-surface-2/60 rounded-lg border border-app-subtle">
              <div className="w-8 h-8 rounded-full bg-app-primary-soft flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-4 h-4 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-app">Professional Formats</h4>
                <p className="text-sm text-app-muted">PDF and PowerPoint with embedded chart images</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-app-surface-2/60 rounded-lg border border-app-subtle">
              <div className="w-8 h-8 rounded-full bg-app-primary-soft flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-4 h-4 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-app">Error-Free Generation</h4>
                <p className="text-sm text-app-muted">Comprehensive validation prevents crashes</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-app-surface-2/60 rounded-lg border border-app-subtle">
              <div className="w-8 h-8 rounded-full bg-app-primary-soft flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-4 h-4 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-app">Ready for Presentation</h4>
                <p className="text-sm text-app-muted">Formatted for board meetings and executive reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;