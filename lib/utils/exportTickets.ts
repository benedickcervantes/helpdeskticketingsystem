import {
  capitalizeLabel,
  exportTableExcel,
  exportTablePdf,
  formatExportDateTime,
  type TableExportColumn,
} from '@/lib/utils/tableExport';

export type TicketExportColumnKey =
  | 'ticketNumber'
  | 'title'
  | 'description'
  | 'status'
  | 'priority'
  | 'category'
  | 'creatorName'
  | 'creatorEmail'
  | 'creatorDepartment'
  | 'assigneeName'
  | 'assigneeEmail'
  | 'createdAt'
  | 'updatedAt'
  | 'resolvedAt'
  | 'feedbackRating'
  | 'attachmentCount';

export type ExportableTicket = {
  ticketNumber?: string | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  category?: string | null;
  creatorInfo?: { name?: string | null; email?: string | null; department?: string | null } | null;
  creator?: { name?: string | null; email?: string | null; department?: string | null } | null;
  assignedInfo?: { name?: string | null; email?: string | null } | null;
  assignee?: { name?: string | null; email?: string | null } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  resolvedAt?: string | null;
  feedback?: { rating?: number | null } | null;
  attachments?: unknown[] | null;
};

type Column = TableExportColumn<ExportableTicket> & { key: TicketExportColumnKey };

type ColumnSection = {
  title: string;
  columns: Column[];
};

export type TicketExportColumnSection = {
  title: string;
  columns: Array<{ key: TicketExportColumnKey; header: string }>;
};

const COLUMN_SECTIONS: ColumnSection[] = [
  {
    title: 'TICKET',
    columns: [
      { key: 'ticketNumber', header: 'Ticket #', width: 14, value: (r) => r.ticketNumber || '' },
      { key: 'title', header: 'Title', width: 32, value: (r) => r.title || '' },
      { key: 'description', header: 'Description', width: 40, value: (r) => r.description || '' },
      { key: 'status', header: 'Status', width: 14, value: (r) => capitalizeLabel(r.status) },
      { key: 'priority', header: 'Priority', width: 12, value: (r) => capitalizeLabel(r.priority) },
      { key: 'category', header: 'Category', width: 14, value: (r) => capitalizeLabel(r.category) },
    ],
  },
  {
    title: 'PEOPLE',
    columns: [
      {
        key: 'creatorName',
        header: 'Created By',
        width: 20,
        value: (r) => r.creatorInfo?.name || r.creator?.name || '',
      },
      {
        key: 'creatorEmail',
        header: 'Creator Email',
        width: 26,
        value: (r) => r.creatorInfo?.email || r.creator?.email || '',
      },
      {
        key: 'creatorDepartment',
        header: 'Creator Department',
        width: 20,
        value: (r) => r.creatorInfo?.department || r.creator?.department || '',
      },
      {
        key: 'assigneeName',
        header: 'Assigned To',
        width: 20,
        value: (r) => r.assignedInfo?.name || r.assignee?.name || 'Unassigned',
      },
      {
        key: 'assigneeEmail',
        header: 'Assignee Email',
        width: 26,
        value: (r) => r.assignedInfo?.email || r.assignee?.email || '',
      },
    ],
  },
  {
    title: 'DATES & META',
    columns: [
      {
        key: 'createdAt',
        header: 'Created',
        width: 18,
        value: (r) => formatExportDateTime(r.createdAt),
      },
      {
        key: 'updatedAt',
        header: 'Updated',
        width: 18,
        value: (r) => formatExportDateTime(r.updatedAt),
      },
      {
        key: 'resolvedAt',
        header: 'Resolved',
        width: 18,
        value: (r) => formatExportDateTime(r.resolvedAt),
      },
      {
        key: 'feedbackRating',
        header: 'Feedback Rating',
        width: 14,
        value: (r) => (r.feedback?.rating != null ? String(r.feedback.rating) : ''),
      },
      {
        key: 'attachmentCount',
        header: 'Attachments',
        width: 12,
        value: (r) => String(Array.isArray(r.attachments) ? r.attachments.length : 0),
      },
    ],
  },
];

export const TICKET_EXPORT_COLUMN_SECTIONS: TicketExportColumnSection[] = COLUMN_SECTIONS.map(
  (section) => ({
    title: section.title,
    columns: section.columns.map(({ key, header }) => ({ key, header })),
  }),
);

export const ALL_TICKET_EXPORT_COLUMN_KEYS: TicketExportColumnKey[] = COLUMN_SECTIONS.flatMap(
  (section) => section.columns.map((column) => column.key),
);

function resolveExportColumns(selectedColumnKeys?: TicketExportColumnKey[]): Column[] {
  const selected = new Set(selectedColumnKeys ?? ALL_TICKET_EXPORT_COLUMN_KEYS);
  return COLUMN_SECTIONS.flatMap((section) =>
    section.columns.filter((column) => selected.has(column.key)),
  );
}

export function exportTicketsPdf(
  rows: ExportableTicket[],
  filterSummary?: string,
  selectedColumnKeys?: TicketExportColumnKey[],
) {
  exportTablePdf({
    title: 'Tickets Export',
    rows,
    columns: resolveExportColumns(selectedColumnKeys),
    filterSummary,
  });
}

export async function exportTicketsExcel(
  rows: ExportableTicket[],
  filterSummary?: string,
  selectedColumnKeys?: TicketExportColumnKey[],
) {
  await exportTableExcel({
    sheetName: 'Tickets',
    filenamePrefix: 'tickets-export',
    rows,
    columns: resolveExportColumns(selectedColumnKeys),
    filterSummary,
  });
}
