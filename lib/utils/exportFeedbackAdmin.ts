import {
  exportTableExcel,
  exportTablePdf,
  formatExportDateTime,
  type TableExportColumn,
} from '@/lib/utils/tableExport';

export type FeedbackExportColumnKey =
  | 'ticketNumber'
  | 'ticketTitle'
  | 'userName'
  | 'userEmail'
  | 'rating'
  | 'suggestions'
  | 'createdAt';

export type ExportableFeedback = {
  ticketNumber?: string | null;
  ticketTitle?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  rating?: number | null;
  suggestions?: string | null;
  createdAt?: string | Date | { toDate?: () => Date } | null;
};

type Column = TableExportColumn<ExportableFeedback> & { key: FeedbackExportColumnKey };

type ColumnSection = {
  title: string;
  columns: Column[];
};

export type FeedbackExportColumnSection = {
  title: string;
  columns: Array<{ key: FeedbackExportColumnKey; header: string }>;
};

function resolveCreatedAt(value: ExportableFeedback['createdAt']): string {
  if (!value) return '';
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return formatExportDateTime(value.toDate());
  }
  return formatExportDateTime(value as string | Date);
}

const COLUMN_SECTIONS: ColumnSection[] = [
  {
    title: 'FEEDBACK',
    columns: [
      { key: 'ticketNumber', header: 'Ticket #', width: 14, value: (r) => r.ticketNumber || '' },
      { key: 'ticketTitle', header: 'Ticket Title', width: 32, value: (r) => r.ticketTitle || '' },
      { key: 'userName', header: 'Submitter', width: 22, value: (r) => r.userName || '' },
      { key: 'userEmail', header: 'Email', width: 28, value: (r) => r.userEmail || '' },
      {
        key: 'rating',
        header: 'Rating',
        width: 10,
        value: (r) => (r.rating != null ? String(r.rating) : ''),
      },
      { key: 'suggestions', header: 'Suggestions', width: 40, value: (r) => r.suggestions || '' },
      {
        key: 'createdAt',
        header: 'Submitted',
        width: 18,
        value: (r) => resolveCreatedAt(r.createdAt),
      },
    ],
  },
];

export const FEEDBACK_EXPORT_COLUMN_SECTIONS: FeedbackExportColumnSection[] = COLUMN_SECTIONS.map(
  (section) => ({
    title: section.title,
    columns: section.columns.map(({ key, header }) => ({ key, header })),
  }),
);

export const ALL_FEEDBACK_EXPORT_COLUMN_KEYS: FeedbackExportColumnKey[] = COLUMN_SECTIONS.flatMap(
  (section) => section.columns.map((column) => column.key),
);

function resolveExportColumns(selectedColumnKeys?: FeedbackExportColumnKey[]): Column[] {
  const selected = new Set(selectedColumnKeys ?? ALL_FEEDBACK_EXPORT_COLUMN_KEYS);
  return COLUMN_SECTIONS.flatMap((section) =>
    section.columns.filter((column) => selected.has(column.key)),
  );
}

export function exportFeedbackPdf(
  rows: ExportableFeedback[],
  filterSummary?: string,
  selectedColumnKeys?: FeedbackExportColumnKey[],
) {
  exportTablePdf({
    title: 'Feedback Analytics Export',
    rows,
    columns: resolveExportColumns(selectedColumnKeys),
    filterSummary,
  });
}

export async function exportFeedbackExcel(
  rows: ExportableFeedback[],
  filterSummary?: string,
  selectedColumnKeys?: FeedbackExportColumnKey[],
) {
  await exportTableExcel({
    sheetName: 'Feedback',
    filenamePrefix: 'feedback-export',
    rows,
    columns: resolveExportColumns(selectedColumnKeys),
    filterSummary,
  });
}
