import {
  capitalizeLabel,
  exportTableExcel,
  exportTablePdf,
  formatExportDateTime,
  type TableExportColumn,
} from '@/lib/utils/tableExport';

export type AdminLogExportColumnKey =
  | 'createdAt'
  | 'actorName'
  | 'actorRole'
  | 'action'
  | 'entity'
  | 'entityType'
  | 'summary';

export type ExportableAdminLog = {
  createdAt?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  action?: string | null;
  ticketNumber?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  summary?: string | null;
  metadata?: { name?: string | null; targetName?: string | null } | null;
};

type Column = TableExportColumn<ExportableAdminLog> & { key: AdminLogExportColumnKey };

type ColumnSection = {
  title: string;
  columns: Column[];
};

export type AdminLogExportColumnSection = {
  title: string;
  columns: Array<{ key: AdminLogExportColumnKey; header: string }>;
};

function roleLabel(role?: string | null) {
  if (role === 'MANAGER') return 'Executive';
  if (role === 'ADMIN') return 'Admin';
  if (role === 'SYSTEM') return 'System';
  return role || '';
}

function actionLabel(action?: string | null) {
  if (!action) return '';
  return action
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function entityLabel(item: ExportableAdminLog) {
  if (item.ticketNumber) return item.ticketNumber;
  if (item.entityType === 'user' && item.entityId) {
    return item.metadata?.name || item.metadata?.targetName || 'User';
  }
  if (item.entityId) return String(item.entityId).slice(0, 8);
  return '';
}

const COLUMN_SECTIONS: ColumnSection[] = [
  {
    title: 'ACTIVITY',
    columns: [
      {
        key: 'createdAt',
        header: 'Time',
        width: 18,
        value: (r) => formatExportDateTime(r.createdAt),
      },
      { key: 'actorName', header: 'Actor', width: 22, value: (r) => r.actorName || '' },
      { key: 'actorRole', header: 'Actor Role', width: 12, value: (r) => roleLabel(r.actorRole) },
      { key: 'action', header: 'Action', width: 20, value: (r) => actionLabel(r.action) },
      { key: 'entity', header: 'Entity', width: 16, value: (r) => entityLabel(r) },
      {
        key: 'entityType',
        header: 'Entity Type',
        width: 14,
        value: (r) => capitalizeLabel(r.entityType),
      },
      { key: 'summary', header: 'Details', width: 48, value: (r) => r.summary || '' },
    ],
  },
];

export const ADMIN_LOG_EXPORT_COLUMN_SECTIONS: AdminLogExportColumnSection[] =
  COLUMN_SECTIONS.map((section) => ({
    title: section.title,
    columns: section.columns.map(({ key, header }) => ({ key, header })),
  }));

export const ALL_ADMIN_LOG_EXPORT_COLUMN_KEYS: AdminLogExportColumnKey[] =
  COLUMN_SECTIONS.flatMap((section) => section.columns.map((column) => column.key));

function resolveExportColumns(selectedColumnKeys?: AdminLogExportColumnKey[]): Column[] {
  const selected = new Set(selectedColumnKeys ?? ALL_ADMIN_LOG_EXPORT_COLUMN_KEYS);
  return COLUMN_SECTIONS.flatMap((section) =>
    section.columns.filter((column) => selected.has(column.key)),
  );
}

export function exportAdminLogsPdf(
  rows: ExportableAdminLog[],
  filterSummary?: string,
  selectedColumnKeys?: AdminLogExportColumnKey[],
) {
  exportTablePdf({
    title: 'Admin Logs Export',
    rows,
    columns: resolveExportColumns(selectedColumnKeys),
    filterSummary,
  });
}

export async function exportAdminLogsExcel(
  rows: ExportableAdminLog[],
  filterSummary?: string,
  selectedColumnKeys?: AdminLogExportColumnKey[],
) {
  await exportTableExcel({
    sheetName: 'Admin Logs',
    filenamePrefix: 'admin-logs-export',
    rows,
    columns: resolveExportColumns(selectedColumnKeys),
    filterSummary,
  });
}
