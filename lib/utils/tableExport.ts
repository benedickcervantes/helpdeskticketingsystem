export type TableExportColumn<T> = {
  key: string;
  header: string;
  width: number;
  value: (row: T) => string;
};

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatExportDate(value?: string | Date | null): string {
  if (!value) return '';
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export function formatExportDateTime(value?: string | Date | null): string {
  if (!value) return '';
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function capitalizeLabel(value?: string | null): string {
  if (!value) return '';
  return value
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function openPrintableHtml(title: string, htmlDocument: string): void {
  const win = window.open('', '_blank');
  if (!win) {
    throw new Error('Unable to open print window. Please allow pop-ups for this site.');
  }
  win.document.open();
  win.document.write(htmlDocument);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 300);
}

export function exportTablePdf<T>(options: {
  title: string;
  rows: T[];
  columns: TableExportColumn<T>[];
  filterSummary?: string;
}): void {
  const { title, rows, columns, filterSummary } = options;
  const headers = columns.map((column) => column.header);
  const body = rows.map((row) => columns.map((column) => column.value(row)));
  const generatedAt = new Date().toLocaleString();
  const filterLabel =
    filterSummary && filterSummary !== 'None (all records)'
      ? filterSummary
      : 'None (all records)';
  const useLandscape = columns.length >= 6;

  const htmlDocument = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  html, body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: "Segoe UI", Arial, sans-serif;
    color: #0f172a;
    margin: 0;
    background: #fff;
  }
  .banner {
    background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
    color: #fff;
    padding: 14px 18px 12px;
  }
  .banner .org {
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.85;
    margin: 0 0 4px;
  }
  .banner h1 {
    font-size: 18px;
    margin: 0;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    font-size: 10px;
    color: #475569;
    padding: 10px 18px 12px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  .meta span strong {
    color: #0f766e;
    font-weight: 600;
  }
  .table-wrap {
    padding: 14px 18px 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: ${useLandscape ? '8.5px' : '10px'};
    table-layout: fixed;
  }
  thead {
    display: table-header-group;
  }
  th, td {
    border: 1px solid #cbd5e1;
    padding: ${useLandscape ? '4px 5px' : '6px 8px'};
    text-align: left;
    vertical-align: top;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  th {
    background: #0f766e;
    color: #fff;
    font-weight: 650;
    font-size: ${useLandscape ? '8px' : '9.5px'};
    letter-spacing: 0.02em;
  }
  tbody tr:nth-child(even) td {
    background: #f0fdfa;
  }
  tbody tr:nth-child(odd) td {
    background: #fff;
  }
  .footer {
    font-size: 9px;
    color: #64748b;
    padding: 8px 18px 16px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  @media print {
    @page {
      size: ${useLandscape ? 'landscape' : 'portrait'};
      margin: 10mm;
    }
    body, th, .banner, .meta, tbody tr:nth-child(even) td {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .banner {
      background: #0f766e !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    th {
      background: #0f766e !important;
      color: #fff !important;
    }
    tbody tr:nth-child(even) td {
      background: #f0fdfa !important;
    }
  }
</style>
</head>
<body>
  <div class="banner">
    <p class="org">FPDC IT Helpdesk</p>
    <h1>${escapeHtml(title)}</h1>
  </div>
  <div class="meta">
    <span><strong>Total records:</strong> ${rows.length}</span>
    <span><strong>Generated:</strong> ${escapeHtml(generatedAt)}</span>
    <span><strong>Filters:</strong> ${escapeHtml(filterLabel)}</span>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${
          body.length
            ? body
                .map(
                  (row) =>
                    `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
                )
                .join('')
            : `<tr><td colspan="${Math.max(headers.length, 1)}">No records</td></tr>`
        }
      </tbody>
    </table>
  </div>
  <div class="footer">
    <span>Confidential · For internal use only</span>
    <span>${escapeHtml(title)}</span>
  </div>
</body>
</html>`;

  openPrintableHtml(title, htmlDocument);
}

export async function exportTableExcel<T>(options: {
  sheetName: string;
  filenamePrefix: string;
  rows: T[];
  columns: TableExportColumn<T>[];
  filterSummary?: string;
  creator?: string;
}): Promise<void> {
  const {
    sheetName,
    filenamePrefix,
    rows,
    columns,
    filterSummary,
    creator = 'FPDC IT Helpdesk',
  } = options;
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = creator;
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName);
  columns.forEach((column, index) => {
    worksheet.getColumn(index + 1).width = column.width;
  });

  worksheet.addRow(columns.map((column) => column.header));
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F766E' },
  };

  rows.forEach((row) => {
    worksheet.addRow(columns.map((column) => column.value(row)));
  });

  if (filterSummary) {
    const info = workbook.addWorksheet('Info');
    info.getColumn(1).width = 18;
    info.getColumn(2).width = 60;
    info.addRow(['Filter summary', filterSummary]);
    info.addRow(['Exported rows', rows.length]);
    info.addRow(['Generated at', new Date().toLocaleString()]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
