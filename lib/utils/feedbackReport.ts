import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import {
  type FeedbackItem,
  type FeedbackReportMeta,
  parseFeedbackDate,
  formatFeedbackDateTime,
  formatFeedbackDate,
  getFeedbackUserLabel,
  filterFeedbackByDateRange,
  getFeedbackReportPeriodLabel,
} from '@/lib/utils/feedbackReportUtils';

export type { FeedbackItem, FeedbackReportMeta } from '@/lib/utils/feedbackReportUtils';

export {
  parseFeedbackDate,
  formatFeedbackDateTime,
  formatFeedbackDate,
  getFeedbackUserLabel,
  filterFeedbackByDateRange,
} from '@/lib/utils/feedbackReportUtils';

const BRAND = {
  emerald: [16, 185, 129] as const,
  emeraldDark: [5, 150, 105] as const,
  cyan: [6, 182, 212] as const,
  slate900: [15, 23, 42] as const,
  slate700: [51, 65, 85] as const,
  slate500: [100, 116, 139] as const,
  slate200: [226, 232, 240] as const,
  slate50: [248, 250, 252] as const,
  white: [255, 255, 255] as const,
  amber: [245, 158, 11] as const,
  red: [239, 68, 68] as const,
};

const REPORT_TITLE = 'Executive Feedback Report';
const ORGANIZATION = 'FPDC IT Helpdesk';

function getReportPeriodLabel(dateRange?: string | number): string {
  return getFeedbackReportPeriodLabel(dateRange);
}

function computeRatingDistribution(feedback: FeedbackItem[]) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  feedback.forEach((item) => {
    if (item.rating && item.rating >= 1 && item.rating <= 5) {
      distribution[item.rating as 1 | 2 | 3 | 4 | 5] += 1;
    }
  });
  return distribution;
}

function buildMetrics(feedback: FeedbackItem[], meta: FeedbackReportMeta = {}) {
  const total = feedback.length;
  const averageRating =
    total > 0
      ? feedback.reduce((sum, item) => sum + (item.rating || 0), 0) / total
      : 0;
  const highRatings = feedback.filter((item) => (item.rating || 0) >= 4).length;
  const lowRatings = feedback.filter((item) => (item.rating || 0) <= 2).length;

  return {
    totalFeedback: meta.totalFeedback ?? total,
    averageRating: meta.averageRating ?? averageRating.toFixed(1),
    satisfactionRate:
      meta.satisfactionRate ??
      (total > 0 ? ((highRatings / total) * 100).toFixed(1) : '0'),
    improvementRate:
      meta.improvementRate ??
      (total > 0 ? ((lowRatings / total) * 100).toFixed(1) : '0'),
  };
}

function fileStamp(prefix: string) {
  return `${prefix}-${new Date().toISOString().split('T')[0]}`;
}

function applyWorksheetChrome(
  worksheet: ExcelJS.Worksheet,
  columnWidths: number[],
) {
  worksheet.views = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];
  columnWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });
}

export async function downloadFeedbackExcel(
  feedback: FeedbackItem[],
  meta: FeedbackReportMeta = {},
  filenamePrefix = 'feedback-report',
) {
  const metrics = buildMetrics(feedback, meta);
  const distribution = computeRatingDistribution(feedback);
  const period = getReportPeriodLabel(meta.dateRange);
  const generatedAt = new Date().toLocaleString();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = ORGANIZATION;
  workbook.created = new Date();
  workbook.modified = new Date();

  const summary = workbook.addWorksheet('Executive Summary', {
    views: [{ showGridLines: false }],
  });

  summary.mergeCells('A1:F1');
  const titleCell = summary.getCell('A1');
  titleCell.value = REPORT_TITLE;
  titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  summary.getRow(1).height = 34;

  summary.mergeCells('A2:F2');
  const subtitleCell = summary.getCell('A2');
  subtitleCell.value = `${ORGANIZATION} · ${period}`;
  subtitleCell.font = { name: 'Calibri', size: 11, color: { argb: 'FFCBD5E1' } };
  subtitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  summary.getRow(2).height = 22;

  summary.getCell('A4').value = 'Generated';
  summary.getCell('B4').value = generatedAt;
  summary.getCell('A5').value = 'Report period';
  summary.getCell('B5').value = period;
  summary.getCell('A6').value = 'Total submissions';
  summary.getCell('B6').value = metrics.totalFeedback;

  ['A4', 'A5', 'A6'].forEach((ref) => {
    summary.getCell(ref).font = { bold: true, color: { argb: 'FF475569' } };
  });
  ['B4', 'B5', 'B6'].forEach((ref) => {
    summary.getCell(ref).font = { color: { argb: 'FF0F172A' } };
  });

  const kpiStartRow = 8;
  const kpis = [
    ['Total Feedback', metrics.totalFeedback],
    ['Average Rating', `${metrics.averageRating} / 5`],
    ['Satisfaction Rate', `${metrics.satisfactionRate}%`],
    ['Needs Improvement', `${metrics.improvementRate}%`],
  ];

  kpis.forEach(([label, value], index) => {
    const col = index * 2 + 1;
    const labelCell = summary.getCell(kpiStartRow, col);
    const valueCell = summary.getCell(kpiStartRow + 1, col);
    summary.mergeCells(kpiStartRow, col, kpiStartRow, col + 1);
    summary.mergeCells(kpiStartRow + 1, col, kpiStartRow + 1, col + 1);

    labelCell.value = label;
    labelCell.font = { size: 10, bold: true, color: { argb: 'FF64748B' } };
    labelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' },
    };
    labelCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    valueCell.value = value;
    valueCell.font = { size: 16, bold: true, color: { argb: 'FF059669' } };
    valueCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0FDF4' },
    };
    valueCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    summary.getRow(kpiStartRow).height = 20;
    summary.getRow(kpiStartRow + 1).height = 28;
  });

  summary.getCell('A12').value = 'Rating Distribution';
  summary.getCell('A12').font = { size: 12, bold: true, color: { argb: 'FF0F172A' } };

  const distHeaderRow = 13;
  ['Rating', 'Count', 'Share'].forEach((heading, index) => {
    const cell = summary.getCell(distHeaderRow, index + 1);
    cell.value = heading;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' },
    };
    cell.alignment = { horizontal: 'center' };
  });

  [5, 4, 3, 2, 1].forEach((rating, rowOffset) => {
    const row = distHeaderRow + 1 + rowOffset;
    const count = distribution[rating as 1 | 2 | 3 | 4 | 5];
    const share =
      feedback.length > 0 ? `${((count / feedback.length) * 100).toFixed(1)}%` : '0%';
    summary.getCell(row, 1).value = `${rating} ★`;
    summary.getCell(row, 2).value = count;
    summary.getCell(row, 3).value = share;
    if (rowOffset % 2 === 0) {
      [1, 2, 3].forEach((col) => {
        summary.getCell(row, col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      });
    }
  });

  applyWorksheetChrome(summary, [18, 22, 12, 18, 18, 18]);

  const details = workbook.addWorksheet('Feedback Details');
  const headers = [
    '#',
    'Date Submitted',
    'User',
    'Email',
    'Ticket',
    'Rating',
    'Feedback',
  ];

  const headerRow = details.addRow(headers);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF047857' } },
    };
  });

  feedback.forEach((item, index) => {
    const row = details.addRow([
      index + 1,
      formatFeedbackDateTime(item.createdAt),
      item.userName || 'Unknown user',
      item.userEmail || '',
      item.ticketTitle || 'Untitled Ticket',
      item.rating ?? '',
      item.suggestions || '',
    ]);

    row.height = 22;
    row.eachCell((cell, colNumber) => {
      cell.alignment = {
        vertical: 'top',
        horizontal: colNumber === 6 ? 'center' : 'left',
        wrapText: colNumber >= 5,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      if (index % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }

      if (colNumber === 6 && typeof item.rating === 'number') {
        cell.font = { bold: true, color: { argb: 'FFB45309' } };
      }
    });
  });

  details.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(feedback.length, 1), column: headers.length },
  };
  applyWorksheetChrome(details, [5, 22, 24, 28, 34, 10, 48]);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileStamp(filenamePrefix)}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadFeedbackPdf(
  feedback: FeedbackItem[],
  meta: FeedbackReportMeta = {},
  filenamePrefix = 'feedback-report',
) {
  const metrics = buildMetrics(feedback, meta);
  const period = getReportPeriodLabel(meta.dateRange);
  const generatedAt = new Date().toLocaleString();

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const setColor = (rgb: readonly [number, number, number]) => {
    pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
    pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);
  };

  const setTextColor = (rgb: readonly [number, number, number]) => {
    pdf.setTextColor(rgb[0], rgb[1], rgb[2]);
  };

  const drawFooter = (page: number, totalPages: number) => {
    pdf.setPage(page);
    setColor(BRAND.slate200);
    pdf.setLineWidth(0.2);
    pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    setTextColor(BRAND.slate500);
    pdf.text(ORGANIZATION, margin, pageHeight - 8);
    pdf.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 8, {
      align: 'right',
    });
  };

  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - 22) {
      pdf.addPage();
      y = margin;
      drawSectionHeader();
    }
  };

  const drawSectionHeader = () => {
    setColor(BRAND.emerald);
    pdf.rect(0, 0, pageWidth, 3, 'F');
    y = margin;
  };

  const drawCover = () => {
    setColor(BRAND.slate900);
    pdf.rect(0, 0, pageWidth, 52, 'F');
    setColor(BRAND.emerald);
    pdf.rect(0, 52, pageWidth, 2.5, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    setTextColor(BRAND.white);
    pdf.text(REPORT_TITLE, margin, 22);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    setTextColor(BRAND.slate200);
    pdf.text(ORGANIZATION, margin, 31);
    pdf.text(period, margin, 38);
    pdf.text(`Generated ${generatedAt}`, margin, 45);

    y = 64;

    const cardWidth = (contentWidth - 9) / 4;
    const cardHeight = 24;
    const cards = [
      { label: 'Total Feedback', value: String(metrics.totalFeedback) },
      { label: 'Average Rating', value: `${metrics.averageRating}/5` },
      { label: 'Satisfaction', value: `${metrics.satisfactionRate}%` },
      { label: 'Needs Improvement', value: `${metrics.improvementRate}%` },
    ];

    cards.forEach((card, index) => {
      const x = margin + index * (cardWidth + 3);
      setColor(BRAND.slate50);
      pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F');
      setColor(BRAND.slate200);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S');

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      setTextColor(BRAND.slate500);
      pdf.text(card.label, x + 4, y + 8);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      setTextColor(BRAND.emeraldDark);
      pdf.text(card.value, x + 4, y + 17);
    });

    y += cardHeight + 12;
  };

  const drawTableHeader = () => {
    ensureSpace(12);
    const colWidths = [12, 34, 38, 48, 18, contentWidth - 150];
    const headers = ['#', 'Date', 'User', 'Ticket', 'Rating', 'Feedback'];
    let x = margin;

    setColor(BRAND.emerald);
    pdf.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    setTextColor(BRAND.white);

    headers.forEach((header, index) => {
      pdf.text(header, x + 2, y + 6);
      x += colWidths[index];
    });

    y += 11;
    return colWidths;
  };

  drawCover();
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  setTextColor(BRAND.slate900);
  pdf.text('Feedback Submissions', margin, y);
  y += 8;

  let colWidths = drawTableHeader();

  feedback.forEach((item, index) => {
    const feedbackText = item.suggestions?.trim() || '—';
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const feedbackLines = pdf.splitTextToSize(feedbackText, colWidths[5] - 4);
    const rowHeight = Math.max(10, feedbackLines.length * 4 + 4);

    ensureSpace(rowHeight + 2);

    if (index % 2 === 0) {
      setColor(BRAND.slate50);
      pdf.rect(margin, y - 1, contentWidth, rowHeight + 1, 'F');
    }

    setTextColor(BRAND.slate700);
    let x = margin;
    const values = [
      String(index + 1),
      formatFeedbackDateTime(item.createdAt),
      item.userName || 'Unknown user',
      item.ticketTitle || 'Untitled Ticket',
      `${item.rating ?? '—'}/5`,
    ];

    values.forEach((value, colIndex) => {
      const lines = pdf.splitTextToSize(value, colWidths[colIndex] - 3);
      pdf.text(lines, x + 2, y + 4);
      x += colWidths[colIndex];
    });

    setTextColor(BRAND.slate500);
    pdf.text(feedbackLines, x + 2, y + 4);

    y += rowHeight + 1;

    if (y > pageHeight - 30) {
      pdf.addPage();
      drawSectionHeader();
      y += 4;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      setTextColor(BRAND.slate900);
      pdf.text('Feedback Submissions (continued)', margin, y);
      y += 8;
      colWidths = drawTableHeader();
    }
  });

  if (feedback.length === 0) {
    ensureSpace(20);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    setTextColor(BRAND.slate500);
    pdf.text('No feedback submissions found for the selected report period.', margin, y + 6);
  }

  const totalPages = pdf.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    drawFooter(page, totalPages);
  }

  pdf.save(`${fileStamp(filenamePrefix)}.pdf`);
}
