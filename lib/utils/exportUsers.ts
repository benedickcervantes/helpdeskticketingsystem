import {
  capitalizeLabel,
  exportTableExcel,
  exportTablePdf,
  formatExportDate,
  type TableExportColumn,
} from '@/lib/utils/tableExport';

export type UserExportColumnKey =
  | 'name'
  | 'email'
  | 'role'
  | 'department'
  | 'designation'
  | 'status'
  | 'createdAt';

export type ExportableUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  department?: string | null;
  designation?: string | null;
  isActive?: boolean | null;
  createdAt?: string | Date | { toDate?: () => Date } | null;
};

type Column = TableExportColumn<ExportableUser> & { key: UserExportColumnKey };

type ColumnSection = {
  title: string;
  columns: Column[];
};

export type UserExportColumnSection = {
  title: string;
  columns: Array<{ key: UserExportColumnKey; header: string }>;
};

function resolveCreatedAt(value: ExportableUser['createdAt']): string {
  if (!value) return '';
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return formatExportDate(value.toDate());
  }
  return formatExportDate(value as string | Date);
}

const COLUMN_SECTIONS: ColumnSection[] = [
  {
    title: 'ACCOUNT',
    columns: [
      { key: 'name', header: 'Full Name', width: 24, value: (r) => r.name || '' },
      { key: 'email', header: 'Email', width: 28, value: (r) => r.email || '' },
      {
        key: 'role',
        header: 'Role',
        width: 12,
        value: (r) => (r.role === 'manager' ? 'Executive' : capitalizeLabel(r.role)),
      },
      { key: 'department', header: 'Department', width: 20, value: (r) => r.department || '' },
      { key: 'designation', header: 'Designation', width: 20, value: (r) => r.designation || '' },
      {
        key: 'status',
        header: 'Status',
        width: 12,
        value: (r) => (r.isActive ? 'Active' : 'Inactive'),
      },
      { key: 'createdAt', header: 'Joined', width: 14, value: (r) => resolveCreatedAt(r.createdAt) },
    ],
  },
];

export const USER_EXPORT_COLUMN_SECTIONS: UserExportColumnSection[] = COLUMN_SECTIONS.map(
  (section) => ({
    title: section.title,
    columns: section.columns.map(({ key, header }) => ({ key, header })),
  }),
);

export const ALL_USER_EXPORT_COLUMN_KEYS: UserExportColumnKey[] = COLUMN_SECTIONS.flatMap(
  (section) => section.columns.map((column) => column.key),
);

function resolveExportColumns(selectedColumnKeys?: UserExportColumnKey[]): Column[] {
  const selected = new Set(selectedColumnKeys ?? ALL_USER_EXPORT_COLUMN_KEYS);
  return COLUMN_SECTIONS.flatMap((section) =>
    section.columns.filter((column) => selected.has(column.key)),
  );
}

export function exportUsersPdf(
  rows: ExportableUser[],
  filterSummary?: string,
  selectedColumnKeys?: UserExportColumnKey[],
) {
  exportTablePdf({
    title: 'User Management Export',
    rows,
    columns: resolveExportColumns(selectedColumnKeys),
    filterSummary,
  });
}

export async function exportUsersExcel(
  rows: ExportableUser[],
  filterSummary?: string,
  selectedColumnKeys?: UserExportColumnKey[],
) {
  await exportTableExcel({
    sheetName: 'Users',
    filenamePrefix: 'users-export',
    rows,
    columns: resolveExportColumns(selectedColumnKeys),
    filterSummary,
  });
}
