import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';

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

export const ORGANIZATION = 'FCDC IT Helpdesk';

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
    customerSatisfaction?: number;
    criticalIssues?: number;
  };
  feedbackSummary?: {
    totalFeedback?: number;
    averageRating?: number | string;
    satisfactionRate?: number | string;
  };
  healthStatus?: string;
  healthScore?: number;
  charts?: {
    ticketVolume?: Array<{ name: string; value: number }>;
    statusDistribution?: Array<{ name: string; value: number }>;
    priorityDistribution?: Array<{ name: string; value: number }>;
    dailyTrends?: Array<{ date?: string; total?: number; resolved?: number }>;
    departmentPerformance?: Array<{
      department: string;
      total: number;
      resolved: number;
      resolutionRate: number;
    }>;
  };
  keyFindings?: string[];
  recommendations?: string[];
};

const CHART_COLORS = ['#059669', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

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

function buildChartImages(report: ManagementReport) {
  if (!report.charts) return [];

  const dailyTrendPoints = (report.charts.dailyTrends || []).map((point) => ({
    date: point.date || '',
    total: point.total ?? 0,
  }));

  return [
    ...(dailyTrendPoints.length
      ? [
          {
            title: 'Daily Ticket Trends',
            image: createReportChart(dailyTrendPoints, 'line', 'Daily Ticket Trends'),
          },
        ]
      : []),
    {
      title: 'Ticket Volume Overview',
      image: createReportChart(report.charts.ticketVolume, 'bar', 'Ticket Volume Overview'),
    },
    {
      title: 'Status Distribution',
      image: createReportChart(report.charts.statusDistribution, 'pie', 'Status Distribution', [
        '#EF4444',
        '#F59E0B',
        '#10B981',
      ]),
    },
    {
      title: 'Priority Distribution',
      image: createReportChart(report.charts.priorityDistribution, 'pie', 'Priority Distribution', [
        '#DC2626',
        '#EA580C',
        '#D97706',
        '#16A34A',
      ]),
    },
    {
      title: 'Department Performance',
      image: createReportChart(
        report.charts.departmentPerformance,
        'bar',
        'Department Performance',
      ),
    },
  ].filter((chart) => chart.image);
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
  const cards = [
    { label: 'Total Requests', value: String(summary.totalRequests ?? 0) },
    { label: 'Resolution Rate', value: `${summary.resolutionRate ?? 0}%` },
    { label: 'Avg Resolution', value: `${summary.avgResolutionTime ?? 0}h` },
    { label: 'Satisfaction', value: `${summary.customerSatisfaction ?? 0}%` },
  ];
  const cardWidth = (contentWidth - 9) / 4;
  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + 3);
    setFill(REPORT_BRAND.slate50);
    pdf.roundedRect(x, y, cardWidth, 24, 2, 2, 'F');
    setDraw(REPORT_BRAND.slate200);
    pdf.roundedRect(x, y, cardWidth, 24, 2, 2, 'S');
    pdf.setFontSize(8);
    setText(REPORT_BRAND.slate500);
    pdf.text(card.label, x + 4, y + 8);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    setText(REPORT_BRAND.emeraldDark);
    pdf.text(card.value, x + 4, y + 17);
  });
  y += 32;

  if (report.healthStatus) {
    drawSectionTitle('Support Health Status');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    setText(REPORT_BRAND.slate700);
    pdf.text(
      `Overall health: ${report.healthStatus}${report.healthScore != null ? ` (${report.healthScore}/100)` : ''}`,
      margin,
      y,
    );
    y += 10;
  }

  if (report.feedbackSummary) {
    drawSectionTitle('Feedback Summary');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    setText(REPORT_BRAND.slate700);
    pdf.text(
      `Total feedback: ${report.feedbackSummary.totalFeedback ?? 0} · Average rating: ${report.feedbackSummary.averageRating ?? 0}/5 · Satisfaction: ${report.feedbackSummary.satisfactionRate ?? 0}%`,
      margin,
      y,
    );
    y += 10;
  }

  drawSectionTitle('Executive Summary');
  drawBulletList([
    `Total support requests: ${summary.totalRequests ?? 0}`,
    `Resolution rate: ${summary.resolutionRate ?? 0}%`,
    `Average resolution time: ${summary.avgResolutionTime ?? 0} hours`,
    `Customer satisfaction: ${summary.customerSatisfaction ?? 0}%`,
    `Critical issues: ${summary.criticalIssues ?? 0}`,
  ]);

  if (report.charts?.departmentPerformance?.length) {
    drawSectionTitle('Department Snapshot');
    const colWidths = [58, 22, 22, 24];
    let x = margin;
    ['Department', 'Tickets', 'Resolved', 'Rate'].forEach((header, index) => {
      setFill(REPORT_BRAND.emerald);
      pdf.rect(x, y - 5, colWidths[index], 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      setText(REPORT_BRAND.white);
      pdf.text(header, x + 2, y);
      x += colWidths[index];
    });
    y += 8;

    report.charts.departmentPerformance.slice(0, 8).forEach((dept, rowIndex) => {
      ensureSpace(8);
      if (rowIndex % 2 === 0) {
        setFill(REPORT_BRAND.slate50);
        pdf.rect(margin, y - 4, contentWidth, 7, 'F');
      }
      x = margin;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      setText(REPORT_BRAND.slate700);
      const values = [
        dept.department,
        String(dept.total),
        String(dept.resolved),
        `${dept.resolutionRate}%`,
      ];
      values.forEach((value, index) => {
        const lines = pdf.splitTextToSize(value, colWidths[index] - 3);
        pdf.text(lines, x + 2, y);
        x += colWidths[index];
      });
      y += 7;
    });
    y += 4;
  }

  const chartImages = buildChartImages(report);
  if (chartImages.length) {
    pdf.addPage();
    setFill(REPORT_BRAND.emerald);
    pdf.rect(0, 0, pageWidth, 3, 'F');
    y = margin;
    drawSectionTitle('Analytics Visualizations');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    setText(REPORT_BRAND.slate500);
    pdf.text(`Period: ${report.period}`, margin, y);
    y += 6;
    chartImages.forEach((chart) => {
      ensureSpace(72);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      setText(REPORT_BRAND.slate900);
      pdf.text(chart.title, margin, y);
      y += 4;
      pdf.addImage(chart.image, 'PNG', margin, y, contentWidth, 62);
      y += 68;
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
  addHeaderBar(summarySlide, 'Executive Summary');

  const summary = report.summary || {};
  const kpis = [
    ['Total Requests', String(summary.totalRequests ?? 0)],
    ['Resolution Rate', `${summary.resolutionRate ?? 0}%`],
    ['Avg Resolution', `${summary.avgResolutionTime ?? 0}h`],
    ['Satisfaction', `${summary.customerSatisfaction ?? 0}%`],
  ];

  kpis.forEach(([label, value], index) => {
    const x = 0.45 + index * 2.35;
    summarySlide.addShape('roundRect', {
      x,
      y: 1.0,
      w: 2.15,
      h: 1.15,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.08,
    });
    summarySlide.addText(label, {
      x: x + 0.12,
      y: 1.12,
      w: 1.9,
      h: 0.25,
      fontSize: 11,
      color: '64748B',
    });
    summarySlide.addText(value, {
      x: x + 0.12,
      y: 1.45,
      w: 1.9,
      h: 0.45,
      fontSize: 22,
      bold: true,
      color: '059669',
    });
  });

  const summaryLines = [
    `Support health: ${report.healthStatus || 'N/A'}${report.healthScore != null ? ` (${report.healthScore}/100)` : ''}`,
    `Critical issues: ${summary.criticalIssues ?? 0}`,
    report.feedbackSummary
      ? `Feedback received: ${report.feedbackSummary.totalFeedback ?? 0} · Avg rating ${report.feedbackSummary.averageRating ?? 0}/5`
      : null,
  ].filter(Boolean);

  summaryLines.forEach((line, index) => {
    summarySlide.addText(String(line), {
      x: 0.55,
      y: 2.45 + index * 0.38,
      w: 9,
      h: 0.3,
      fontSize: 13,
      color: '334155',
    });
  });

  const chartImages = buildChartImages(report);
  chartImages.forEach((chart) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'F8FAFC' };
    addHeaderBar(slide, chart.title);
    slide.addImage({
      data: chart.image,
      x: 0.55,
      y: 0.85,
      w: 8.9,
      h: 4.35,
    });
  });

  if (report.charts?.departmentPerformance?.length) {
    const deptSlide = pptx.addSlide();
    deptSlide.background = { color: 'F8FAFC' };
    addHeaderBar(deptSlide, 'Department Performance');

    const rows = [
      [
        { text: 'Department', options: { bold: true, color: 'FFFFFF', fill: { color: '059669' } } },
        { text: 'Tickets', options: { bold: true, color: 'FFFFFF', fill: { color: '059669' } } },
        { text: 'Resolved', options: { bold: true, color: 'FFFFFF', fill: { color: '059669' } } },
        { text: 'Rate', options: { bold: true, color: 'FFFFFF', fill: { color: '059669' } } },
      ],
      ...report.charts.departmentPerformance.slice(0, 8).map((dept) => [
        { text: dept.department },
        { text: String(dept.total) },
        { text: String(dept.resolved) },
        { text: `${dept.resolutionRate}%` },
      ]),
    ];

    deptSlide.addTable(rows, {
      x: 0.55,
      y: 1.0,
      w: 8.9,
      fontSize: 11,
      border: { type: 'solid', color: 'E2E8F0', pt: 1 },
      fill: { color: 'FFFFFF' },
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
