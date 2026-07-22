// @ts-nocheck
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api/client';
import { subscribeDesignationEvents } from '@/lib/realtime/socketClient';
import { TablePanelSkeleton } from '@/lib/ui/DashboardSkeletons';

const statusBadgeClass = (isActive) =>
  isActive
    ? 'bg-app-primary-soft text-app-primary border-app-primary/30'
    : 'bg-rose-500/15 text-rose-600 border-rose-500/30';

const ConfirmModal = ({ open, title, message, confirmLabel, onClose, onConfirm, loading }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
        aria-label="Close dialog"
        onClick={loading ? undefined : onClose}
        disabled={loading}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-app-subtle bg-app-panel p-5 shadow-2xl">
        <h3 className="text-lg font-semibold text-app">{title}</h3>
        <p className="mt-2 text-sm text-app-muted">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-app bg-app-surface-2 px-3.5 py-2 text-sm font-medium text-app-soft hover:bg-app-surface-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                Working…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const DesignationManagement = () => {
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const beginSave = (action) => {
    setSaving(true);
    setBusyAction(action);
    setError('');
    setNotice('');
  };

  const endSave = () => {
    setSaving(false);
    setBusyAction('');
  };

  const loadDesignations = useCallback(async () => {
    try {
      const data = await api.get('/api/v1/designations/admin');
      setDesignations(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error('Failed to load designations', err);
      setError('Failed to load designations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDesignations();
  }, [loadDesignations]);

  useEffect(() => {
    return subscribeDesignationEvents(() => {
      // Keep admin table in sync (includes inactive rows via admin API).
      loadDesignations();
    });
  }, [loadDesignations]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return designations.filter((item) => {
      if (filterStatus === 'active' && !item.isActive) return false;
      if (filterStatus === 'inactive' && item.isActive) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q);
    });
  }, [designations, searchTerm, filterStatus]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (saving) return;
    const name = newName.trim();
    if (!name) {
      setError('Designation name is required.');
      return;
    }

    beginSave('create');
    try {
      const created = await api.post('/api/v1/designations/admin', { name });
      setDesignations((prev) =>
        [...prev, created].sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
        ),
      );
      setNewName('');
      setNotice(`Added “${created.name}”. It is now available on Register.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add designation.');
    } finally {
      endSave();
    }
  };

  const startEdit = (item) => {
    if (saving) return;
    setEditingId(item.id);
    setEditName(item.name);
    setError('');
    setNotice('');
  };

  const cancelEdit = () => {
    if (saving) return;
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (item) => {
    if (saving) return;
    const name = editName.trim();
    if (!name) {
      setError('Designation name is required.');
      return;
    }

    beginSave('save');
    try {
      const updated = await api.patch(`/api/v1/designations/admin/${item.id}`, { name });
      setDesignations((prev) =>
        prev
          .map((row) => (row.id === item.id ? updated : row))
          .sort(
            (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
          ),
      );
      setEditingId(null);
      setEditName('');
      setNotice(`Updated designation to “${updated.name}”.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update designation.');
    } finally {
      endSave();
    }
  };

  const toggleActive = async (item) => {
    if (saving) return;
    beginSave('toggle');
    try {
      const updated = await api.patch(`/api/v1/designations/admin/${item.id}`, {
        isActive: !item.isActive,
      });
      setDesignations((prev) =>
        prev.map((row) => (row.id === item.id ? updated : row)),
      );
      setNotice(
        updated.isActive
          ? `“${updated.name}” is active again.`
          : `“${updated.name}” deactivated and hidden from Register.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      endSave();
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget || saving) return;
    beginSave('deactivate');
    try {
      const updated = await api.delete(`/api/v1/designations/admin/${deactivateTarget.id}`);
      setDesignations((prev) =>
        prev.map((row) => (row.id === deactivateTarget.id ? updated : row)),
      );
      setNotice(`“${updated.name}” deactivated and hidden from Register.`);
      setDeactivateTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate designation.');
    } finally {
      endSave();
    }
  };

  if (loading) {
    return <TablePanelSkeleton rows={6} />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-app-subtle bg-app-panel px-4 py-4 sm:px-5 sm:py-5">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-app-primary" />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-app">Designations</h2>
            <p className="mt-1 text-sm text-app-muted">
              Add or update designations used on Register and user forms
            </p>
          </div>

          <form onSubmit={handleCreate} className="flex w-full min-w-0 flex-col gap-2 sm:flex-row lg:w-auto">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New designation name"
              maxLength={150}
              className="app-field w-full min-w-0 rounded-xl border px-3 py-2.5 text-sm sm:min-w-[240px]"
            />
            <button
              type="submit"
              disabled={saving || !newName.trim()}
              className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-app-primary bg-app-primary px-4 text-sm font-semibold text-app-on-primary transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busyAction === 'create' ? (
                <>
                  <span className="w-4 h-4 border-2 border-app-on-primary border-t-transparent rounded-full animate-spin" />
                  Adding…
                </>
              ) : (
                'Add'
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
            <svg className="h-4 w-4 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search designations…"
            className="app-field block w-full min-w-0 rounded-lg border py-2 pl-8 pr-3 text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="app-select w-full sm:w-auto rounded-lg border px-3 py-2 pr-9 text-sm"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-500">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-app-primary/30 bg-app-primary-soft px-3 py-2.5 text-sm text-app-primary">
          {notice}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-app-subtle bg-app-panel px-4 py-10 text-center text-sm text-app-muted">
          No designations found.
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-app-subtle bg-app-panel p-3.5"
              >
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={150}
                    className="app-field mb-3 w-full rounded-lg border px-2.5 py-2 text-sm"
                    autoFocus
                  />
                ) : (
                  <p className="text-sm font-semibold text-app break-words [overflow-wrap:anywhere] leading-snug">
                    {item.name}
                  </p>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${statusBadgeClass(item.isActive)}`}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-[11px] text-app-muted tabular-nums">
                    Order {item.sortOrder}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {editingId === item.id ? (
                    <>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => saveEdit(item)}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-app-primary/40 bg-app-primary-soft text-xs font-semibold text-app-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {busyAction === 'save' ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
                            Saving…
                          </>
                        ) : (
                          'Save'
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={cancelEdit}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-app text-xs font-medium text-app-soft disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => startEdit(item)}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-app text-xs font-medium text-app-soft hover:border-app-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          item.isActive
                            ? setDeactivateTarget(item)
                            : toggleActive(item)
                        }
                        className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                          item.isActive
                            ? 'border-rose-500/30 text-rose-500 hover:bg-rose-500/10'
                            : 'border-app-primary/30 text-app-primary hover:bg-app-primary-soft'
                        }`}
                      >
                        {busyAction === 'toggle' ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Updating…
                          </>
                        ) : item.isActive ? (
                          'Deactivate'
                        ) : (
                          'Activate'
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop / tablet table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-app-subtle bg-app-panel">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-app-subtle bg-app-surface-2/60">
                  <tr className="text-[11px] uppercase tracking-wide text-app-muted">
                    <th className="px-3 py-2.5 font-semibold">Designation</th>
                    <th className="px-3 py-2.5 font-semibold w-[100px]">Status</th>
                    <th className="px-3 py-2.5 font-semibold w-[80px]">Order</th>
                    <th className="px-3 py-2.5 font-semibold text-right w-[180px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-subtle">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-app-surface-2/40 transition-colors">
                      <td className="px-3 py-2.5">
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            maxLength={150}
                            className="app-field w-full max-w-md rounded-lg border px-2.5 py-1.5 text-sm"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium text-app break-words [overflow-wrap:anywhere]">
                            {item.name}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${statusBadgeClass(item.isActive)}`}
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-app-soft">{item.sortOrder}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {editingId === item.id ? (
                            <>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => saveEdit(item)}
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-app-primary/40 bg-app-primary-soft px-2.5 py-1.5 text-xs font-semibold text-app-primary disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {busyAction === 'save' ? (
                                  <>
                                    <span className="w-3.5 h-3.5 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
                                    Saving…
                                  </>
                                ) : (
                                  'Save'
                                )}
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={cancelEdit}
                                className="rounded-lg border border-app px-2.5 py-1.5 text-xs font-medium text-app-soft disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => startEdit(item)}
                                className="rounded-lg border border-app px-2.5 py-1.5 text-xs font-medium text-app-soft hover:border-app-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Rename
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  item.isActive
                                    ? setDeactivateTarget(item)
                                    : toggleActive(item)
                                }
                                className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                                  item.isActive
                                    ? 'border-rose-500/30 text-rose-500 hover:bg-rose-500/10'
                                    : 'border-app-primary/30 text-app-primary hover:bg-app-primary-soft'
                                }`}
                              >
                                {busyAction === 'toggle' ? (
                                  <>
                                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Updating…
                                  </>
                                ) : item.isActive ? (
                                  'Deactivate'
                                ) : (
                                  'Activate'
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        open={!!deactivateTarget}
        title="Deactivate designation?"
        message={
          deactivateTarget
            ? `“${deactivateTarget.name}” will be hidden from Register. Existing users keep this designation name.`
            : ''
        }
        confirmLabel="Deactivate"
        loading={saving}
        onClose={() => {
          if (saving) return;
          setDeactivateTarget(null);
        }}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
};

export default DesignationManagement;
