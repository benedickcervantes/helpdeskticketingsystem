// @ts-nocheck
'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { TablePanelSkeleton } from '@/lib/ui/DashboardSkeletons';

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'TICKET_STATUS_CHANGED', label: 'Status changed' },
  { value: 'TICKET_ASSIGNED', label: 'Ticket assigned' },
  { value: 'TICKET_AUTO_RESOLVED', label: 'Auto-resolved' },
  { value: 'USER_CREATED', label: 'User created' },
  { value: 'USER_UPDATED', label: 'User updated' },
  { value: 'USER_DELETED', label: 'User deleted' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Executive' },
  { value: 'SYSTEM', label: 'System' },
];

const actionLabel = (action) => {
  const found = ACTION_OPTIONS.find((o) => o.value === action);
  return found?.label || (action ? action.replace(/_/g, ' ') : '—');
};

const roleBadgeClass = (role) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-app-primary-soft text-app-primary border-app-primary/30';
    case 'MANAGER':
      return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
    case 'SYSTEM':
      return 'bg-app-surface-2 text-app-soft border-app';
    default:
      return 'bg-app-surface-2 text-app-muted border-app';
  }
};

const roleLabel = (role) => {
  if (role === 'MANAGER') return 'Executive';
  if (role === 'ADMIN') return 'Admin';
  if (role === 'SYSTEM') return 'System';
  return role || '—';
};

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const entityLabel = (item) => {
  if (item.ticketNumber) return item.ticketNumber;
  if (item.entityType === 'user' && item.entityId) {
    return item.metadata?.name || item.metadata?.targetName || 'User';
  }
  if (item.entityId) return String(item.entityId).slice(0, 8);
  return '—';
};

const AdminLogs = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [action, setAction] = useState('');
  const [actorRole, setActorRole] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const limit = 25;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (action) params.set('action', action);
      if (actorRole) params.set('actorRole', actorRole);
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const data = await api.get(`/api/v1/audit-logs?${params.toString()}`);
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (!message.toLowerCase().includes('session expired')) {
        console.error('Failed to load audit logs', err);
      }
      setItems([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, action, actorRole, from, to]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const onFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  if (loading && items.length === 0) {
    return <TablePanelSkeleton rows={8} />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-app flex items-center gap-2">
            <svg
              className="w-5 h-5 text-app-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            Admin Logs
          </h2>
          <p className="text-sm text-app-muted mt-1">
            Admin and Executive activity across tickets and users
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 w-full lg:w-auto">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search actor, ticket…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-8 pr-3 py-2 app-field border rounded-lg focus:outline-none text-sm"
            />
          </div>

          <select
            value={action}
            onChange={onFilterChange(setAction)}
            className="app-select px-3 py-2 pr-9 border rounded-lg focus:outline-none text-sm"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value || 'all-actions'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={actorRole}
            onChange={onFilterChange(setActorRole)}
            className="app-select px-3 py-2 pr-9 border rounded-lg focus:outline-none text-sm"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value || 'all-roles'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={from}
            onChange={onFilterChange(setFrom)}
            className="app-field px-3 py-2 border rounded-lg focus:outline-none text-sm"
            aria-label="From date"
          />

          <input
            type="date"
            value={to}
            onChange={onFilterChange(setTo)}
            className="app-field px-3 py-2 border rounded-lg focus:outline-none text-sm"
            aria-label="To date"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm text-app-muted">
        <span>
          {total} {total === 1 ? 'entry' : 'entries'}
          {loading ? ' · Refreshing…' : ''}
        </span>
        <span>
          Page {page} of {totalPages}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-app-subtle bg-app-panel px-4 py-10 text-center text-sm text-app-muted">
          No activity logs found for the selected filters.
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-app-subtle bg-app-panel p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-app truncate">{item.actorName}</p>
                    <span
                      className={`mt-1 inline-flex w-fit items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${roleBadgeClass(item.actorRole)}`}
                    >
                      {roleLabel(item.actorRole)}
                    </span>
                  </div>
                  <time className="shrink-0 text-[11px] tabular-nums text-app-muted text-right">
                    {formatDateTime(item.createdAt)}
                  </time>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-md border border-app bg-app-surface-2 px-2 py-0.5 text-xs font-medium text-app-soft">
                    {actionLabel(item.action)}
                  </span>
                  <span className="font-mono text-xs text-app-primary">{entityLabel(item)}</span>
                  {item.entityType && (
                    <span className="text-[11px] capitalize text-app-muted">{item.entityType}</span>
                  )}
                </div>

                <p className="mt-2.5 text-sm leading-snug text-app-soft break-words">
                  {item.summary}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop / tablet table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-app-subtle bg-app-panel">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-app-surface-2/60 border-b border-app-subtle">
                  <tr className="text-[11px] uppercase tracking-wide text-app-muted">
                    <th className="px-3 py-2.5 font-medium whitespace-nowrap">Time</th>
                    <th className="px-3 py-2.5 font-medium whitespace-nowrap">Actor</th>
                    <th className="px-3 py-2.5 font-medium whitespace-nowrap">Action</th>
                    <th className="px-3 py-2.5 font-medium whitespace-nowrap">Entity</th>
                    <th className="px-3 py-2.5 font-medium min-w-[220px]">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-subtle">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-app-surface-2/40 transition-colors">
                      <td className="px-3 py-2.5 text-app-soft whitespace-nowrap tabular-nums">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-1 min-w-[120px]">
                          <span className="font-medium text-app truncate">{item.actorName}</span>
                          <span
                            className={`inline-flex w-fit items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${roleBadgeClass(item.actorRole)}`}
                          >
                            {roleLabel(item.actorRole)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-app bg-app-surface-2 px-2 py-0.5 text-xs font-medium text-app-soft">
                          {actionLabel(item.action)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="font-mono text-xs text-app-primary">
                          {entityLabel(item)}
                        </span>
                        <div className="text-[11px] text-app-muted capitalize mt-0.5">
                          {item.entityType || '—'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-app-soft">
                        <p className="leading-snug">{item.summary}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="inline-flex items-center rounded-lg border border-app bg-app-surface-2 px-3 py-2 text-sm font-medium text-app-soft disabled:opacity-40 hover:border-app-primary transition-colors"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="inline-flex items-center rounded-lg border border-app bg-app-surface-2 px-3 py-2 text-sm font-medium text-app-soft disabled:opacity-40 hover:border-app-primary transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminLogs;
