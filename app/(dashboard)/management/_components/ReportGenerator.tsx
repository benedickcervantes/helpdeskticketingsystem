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
      icon: '📋',
      gradient: 'from-emerald-600 to-cyan-600'
    },
    {
      id: 'executive',
      name: 'Executive Summary',
      description: 'High-level overview for C-level executives',
      icon: '👔',
      gradient: 'from-purple-600 to-blue-600'
    },
    {
      id: 'analytics',
      name: 'Analytics Overview',
      description: 'Comprehensive charts and data visualizations',
      icon: '📊',
      gradient: 'from-green-600 to-teal-600'
    },
    {
      id: 'operational',
      name: 'Performance Metrics',
      description: 'Detailed performance metrics and KPIs',
      icon: '⚙️',
      gradient: 'from-orange-600 to-red-600'
    },
    {
      id: 'departmental',
      name: 'Department Analysis',
      description: 'Department-wise performance breakdown',
      icon: '🏢',
      gradient: 'from-indigo-600 to-purple-600'
    },
    {
      id: 'trends',
      name: 'Trend Analysis',
      description: 'Historical trends and predictive insights',
      icon: '📈',
      gradient: 'from-pink-600 to-rose-600'
    },
    {
      id: 'compliance',
      name: 'Compliance Report',
      description: 'SLA compliance and audit trail',
      icon: '📋',
      gradient: 'from-cyan-600 to-blue-600'
    }
  ];

  const formatOptions = [
    { id: 'pdf', name: 'PDF Document', icon: '📄', description: 'Professional PDF with charts', color: 'bg-red-500' },
    { id: 'powerpoint', name: 'PowerPoint Presentation', icon: '📊', description: 'Executive presentation with visualizations', color: 'bg-orange-500' }
  ];

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
          <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 mb-1 sm:mb-2">
            Executive Report Generator
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-400 max-w-2xl mx-auto">
            Create professional reports with comprehensive charts and visualizations designed for executive presentations.
          </p>
          {onDateRangeChange ? (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <label htmlFor="report-date-range" className="text-xs sm:text-sm text-gray-400">
                Report period
              </label>
              <select
                id="report-date-range"
                value={dateRange}
                onChange={(e) => onDateRangeChange(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/30 shadow-xl">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gray-300">Select Report Type</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedReportType(type.id)}
                className={`p-4 sm:p-6 rounded-xl border text-left transition-all duration-300 transform hover:scale-[1.02] ${
                  selectedReportType === type.id
                    ? `border-transparent bg-gradient-to-r ${type.gradient} shadow-lg`
                    : 'border-gray-700 bg-gray-700/30 hover:border-gray-600'
                }`}
              >
                <div className="text-3xl mb-3">{type.icon}</div>
                <h3 className="font-semibold text-white mb-2">{type.name}</h3>
                <p className="text-sm text-gray-300">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/30 shadow-xl">
          <h3 className="text-base sm:text-lg font-semibold text-gray-300 mb-4">Select Report Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {formatOptions.map((format) => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                  selectedFormat === format.id
                    ? `border-transparent ${format.color} text-white shadow-lg`
                    : 'border-gray-700 bg-gray-700/30 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-2">{format.icon}</div>
                <h4 className="font-semibold mb-1">{format.name}</h4>
                <p className="text-sm opacity-80">{format.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Report Preview */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/30 shadow-xl">
          <h3 className="text-base sm:text-lg font-semibold text-gray-300 mb-4">
            {reportTypes.find(t => t.id === selectedReportType)?.name} Preview
          </h3>
          
          <div className="bg-gray-900/50 rounded-xl p-4 sm:p-6 border border-gray-700/50">
            <p className="text-xs sm:text-sm text-gray-400 mb-4">
              Report period: <span className="text-gray-200">{reportPeriod}</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-3 flex items-center">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                  Key Metrics
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm bg-gray-800/30 p-3 rounded-lg">
                    <span className="text-gray-400">Total Requests:</span>
                    <span className="font-semibold text-white">{metrics?.totalTickets || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm bg-gray-800/30 p-3 rounded-lg">
                    <span className="text-gray-400">Resolution Rate:</span>
                    <span className="font-semibold text-emerald-400">{metrics?.resolutionRate || 0}%</span>
                  </div>
                  <div className="flex justify-between text-sm bg-gray-800/30 p-3 rounded-lg">
                    <span className="text-gray-400">Avg Resolution Time:</span>
                    <span className="font-semibold text-white">{metrics?.avgResolutionTime || 0}h</span>
                  </div>
                  <div className="flex justify-between text-sm bg-gray-800/30 p-3 rounded-lg">
                    <span className="text-gray-400">Health Status:</span>
                    <span className="font-semibold text-cyan-400">
                      {healthStatus?.status || 'Unknown'} ({healthStatus?.score || 0}/100)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm bg-gray-800/30 p-3 rounded-lg">
                    <span className="text-gray-400">Feedback Responses:</span>
                    <span className="font-semibold text-white">{feedbackSummary?.totalFeedback || 0}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3 flex items-center">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                  Charts Included
                </h4>
                <div className="space-y-2">
                  <div className="text-sm text-gray-300 bg-gray-800/30 p-3 rounded-lg">• Daily Ticket Trends</div>
                  <div className="text-sm text-gray-300 bg-gray-800/30 p-3 rounded-lg">• Ticket Volume Distribution</div>
                  <div className="text-sm text-gray-300 bg-gray-800/30 p-3 rounded-lg">• Status Distribution ({chartData.statusDistribution?.map((s) => `${s.name}: ${s.value}`).join(', ') || '—'})</div>
                  <div className="text-sm text-gray-300 bg-gray-800/30 p-3 rounded-lg">• Priority Breakdown</div>
                  <div className="text-sm text-gray-300 bg-gray-800/30 p-3 rounded-lg">• Department Performance ({chartData.departmentPerformance?.length || 0} depts)</div>
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
            className="w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl font-semibold text-sm sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
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
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress}%` }}
            ></div>
          </div>
        )}

        {/* Report Features */}
        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-2xl p-4 sm:p-6 border border-cyan-700/30 shadow-xl">
          <h3 className="text-lg font-semibold text-cyan-300 mb-4">Report Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start p-3 bg-cyan-900/20 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-cyan-700/30 flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-cyan-100">Robust Data Handling</h4>
                <p className="text-sm text-cyan-400/80">Safe handling of undefined or missing data</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-cyan-900/20 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-cyan-700/30 flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-cyan-100">Professional Formats</h4>
                <p className="text-sm text-cyan-400/80">PDF and PowerPoint with embedded chart images</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-cyan-900/20 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-cyan-700/30 flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-cyan-100">Error-Free Generation</h4>
                <p className="text-sm text-cyan-400/80">Comprehensive validation prevents crashes</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-cyan-900/20 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-cyan-700/30 flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-cyan-100">Ready for Presentation</h4>
                <p className="text-sm text-cyan-400/80">Formatted for board meetings and executive reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;