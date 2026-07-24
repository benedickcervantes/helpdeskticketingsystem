// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api/client';
import { subscribeDepartmentEvents } from '@/lib/realtime/socketClient';
import {
  filterTicketsByDateRange,
  formatExecutiveDuration,
  getDateRangeSpanLabel,
  getTicketHours,
  isCompletedStatus,
  isInProgressStatus,
  isOpenStatus,
  matchUserToTicket,
  parseTicketDate,
  resolveTicketDepartment,
} from '@/lib/utils/analytics';
import { ExecutiveByTeamSkeleton } from '@/lib/ui/DashboardSkeletons';
import DateRangeSelect from './DateRangeSelect';
import TeamSortSelect from './TeamSortSelect';

const toDepartmentNames = (data) => {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => (typeof item === 'string' ? item : item?.name))
    .map((name) => String(name || '').trim())
    .filter(Boolean);
};

const emptyStats = () => ({
  totalUsers: 0,
  activeUsers: 0,
  totalTickets: 0,
  resolvedTickets: 0,
  openTickets: 0,
  inProgressTickets: 0,
  stillOpen: 0,
  overdueOpen: 0,
  resolutionHours: [],
  avgResolutionTime: 0,
  resolutionRate: 0,
});

const healthTone = (rate, hasTickets) => {
  if (!hasTickets) return 'idle';
  if (rate >= 80) return 'excellent';
  if (rate >= 60) return 'good';
  if (rate >= 40) return 'warning';
  return 'critical';
};

const healthBadge = {
  idle: 'bg-app-surface-2 text-app-muted border-app/40',
  excellent: 'bg-app-primary-soft text-app-primary border-app-primary/30',
  good: 'bg-sky-500/15 text-sky-700 border-sky-500/30',
  warning: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  critical: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
};

const healthLabel = {
  idle: 'No activity',
  excellent: 'Healthy',
  good: 'OK',
  warning: 'Needs help',
  critical: 'At risk',
};

const DepartmentAnalytics = ({
  tickets = [],
  users = [],
  dateRange = '30',
  onDateRangeChange,
}) => {
  const [departmentNames, setDepartmentNames] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [sortBy, setSortBy] = useState('open');

  useEffect(() => {
    let cancelled = false;

    const apply = (data) => {
      if (cancelled) return;
      const names = toDepartmentNames(data);
      const seen = new Set();
      const unique = [];
      names.forEach((name) => {
        const key = name.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        unique.push(name);
      });
      setDepartmentNames(unique);
      setLoadingDepartments(false);
    };

    api
      .get('/api/v1/departments')
      .then(apply)
      .catch(() => {
        if (!cancelled) {
          setDepartmentNames([]);
          setLoadingDepartments(false);
        }
      });

    const unsub = subscribeDepartmentEvents((items) => apply(items));
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const departmentStats = useMemo(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    const scopedTickets = filterTicketsByDateRange(
      Array.isArray(tickets) ? tickets : [],
      dateRange,
    );
    const now = Date.now();

    const stats = {};
    const ensure = (name) => {
      if (!name) return null;
      if (!stats[name]) stats[name] = emptyStats();
      return stats[name];
    };

    // Seed every active department so All teams always lists the full roster
    departmentNames.forEach((name) => ensure(name));

    const canonicalByLower = {};
    Object.keys(stats).forEach((name) => {
      canonicalByLower[name.toLowerCase()] = name;
    });

    const resolveCanonical = (raw) => {
      if (!raw) return null;
      const trimmed = String(raw).trim();
      if (!trimmed) return null;
      const existing = canonicalByLower[trimmed.toLowerCase()];
      if (existing) return existing;
      canonicalByLower[trimmed.toLowerCase()] = trimmed;
      ensure(trimmed);
      return trimmed;
    };

    safeUsers.forEach((user) => {
      const dept = resolveCanonical(user.department);
      if (!dept) return;
      const row = ensure(dept);
      row.totalUsers += 1;
      if (user.isActive !== false) row.activeUsers += 1;
    });

    scopedTickets.forEach((ticket) => {
      let deptName = resolveTicketDepartment(ticket, safeUsers);
      if (!deptName) {
        const creator = safeUsers.find((user) =>
          matchUserToTicket(user, ticket.createdBy || ticket.created_by_id),
        );
        deptName = creator?.department || null;
      }

      // Match Charts / At a Glance: never drop tickets — bucket unknowns as Unassigned
      const dept = resolveCanonical(deptName) || resolveCanonical('Unassigned');
      if (!dept) return;

      const row = ensure(dept);
      row.totalTickets += 1;

      if (isCompletedStatus(ticket.status)) {
        row.resolvedTickets += 1;
        const hours = getTicketHours(
          ticket.createdAt,
          ticket.resolvedAt || ticket.updatedAt,
        );
        if (hours !== null) row.resolutionHours.push(hours);
      } else {
        row.stillOpen += 1;
        if (isOpenStatus(ticket.status)) row.openTickets += 1;
        if (isInProgressStatus(ticket.status)) row.inProgressTickets += 1;

        const created = parseTicketDate(ticket.createdAt);
        if (created) {
          const daysOpen = (now - created.getTime()) / (1000 * 60 * 60 * 24);
          if (daysOpen >= 14) row.overdueOpen += 1;
        }
      }
    });

    Object.keys(stats).forEach((dept) => {
      const row = stats[dept];
      row.resolutionRate =
        row.totalTickets > 0
          ? Math.round((row.resolvedTickets / row.totalTickets) * 100)
          : 0;
      row.avgResolutionTime =
        row.resolutionHours.length > 0
          ? Math.round(
              (row.resolutionHours.reduce((sum, hours) => sum + hours, 0) /
                row.resolutionHours.length) *
                10,
            ) / 10
          : 0;
      delete row.resolutionHours;
    });

    // Prefer official department list order, then any leftover names
    const ordered = [];
    const seen = new Set();
    departmentNames.forEach((name) => {
      const key = name.toLowerCase();
      if (seen.has(key) || !stats[name]) return;
      seen.add(key);
      ordered.push([name, stats[name]]);
    });
    Object.entries(stats)
      .sort(
        (a, b) =>
          b[1].stillOpen - a[1].stillOpen ||
          b[1].totalTickets - a[1].totalTickets ||
          a[0].localeCompare(b[0]),
      )
      .forEach(([name, row]) => {
        const key = name.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        ordered.push([name, row]);
      });

    return ordered;
  }, [tickets, users, dateRange, departmentNames]);

  const sortedTeams = useMemo(() => {
    const copy = [...departmentStats];
    if (sortBy === 'volume') {
      copy.sort((a, b) => b[1].totalTickets - a[1].totalTickets || a[0].localeCompare(b[0]));
    } else if (sortBy === 'rate') {
      copy.sort(
        (a, b) =>
          b[1].resolutionRate - a[1].resolutionRate ||
          b[1].totalTickets - a[1].totalTickets,
      );
    } else {
      copy.sort(
        (a, b) =>
          b[1].overdueOpen - a[1].overdueOpen ||
          b[1].stillOpen - a[1].stillOpen ||
          b[1].totalTickets - a[1].totalTickets,
      );
    }
    return copy;
  }, [departmentStats, sortBy]);

  const summary = useMemo(() => {
    const withActivity = departmentStats.filter(([, s]) => s.totalTickets > 0);
    const needingHelp = withActivity.filter(
      ([, s]) => s.stillOpen > 0 || s.resolutionRate < 60,
    );
    const totalOpen = withActivity.reduce((sum, [, s]) => sum + s.stillOpen, 0);
    const totalOverdue = withActivity.reduce((sum, [, s]) => sum + s.overdueOpen, 0);
    return {
      allTeams: departmentStats.length,
      activeTeams: withActivity.length,
      needingHelp: needingHelp.length,
      totalOpen,
      totalOverdue,
    };
  }, [departmentStats]);

  const needsHelp = useMemo(
    () =>
      [...departmentStats]
        .filter(([, s]) => s.stillOpen > 0)
        .sort(
          (a, b) =>
            b[1].overdueOpen - a[1].overdueOpen || b[1].stillOpen - a[1].stillOpen,
        )
        .slice(0, 5),
    [departmentStats],
  );

  const healthiest = useMemo(
    () =>
      [...departmentStats]
        .filter(([, s]) => s.totalTickets >= 2)
        .sort((a, b) => b[1].resolutionRate - a[1].resolutionRate)
        .slice(0, 3),
    [departmentStats],
  );

  if (loadingDepartments && departmentStats.length === 0) {
    return <ExecutiveByTeamSkeleton />;
  }

  if (departmentStats.length === 0) {
    return (
      <div className="space-y-4 min-w-0">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-app mb-1">By Team</h2>
          <p className="text-xs sm:text-sm text-app-muted">
            Which departments need the most IT help
          </p>
        </div>
        <p className="text-sm text-app-muted py-8 text-center">
          No active departments yet. Add departments in Admin → Departments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 w-full max-w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between min-w-0">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-app mb-1">By Team</h2>
          <p className="text-xs sm:text-sm text-app-muted">
            By requester department · last {dateRange} days
            <span className="text-app-muted/80"> · {getDateRangeSpanLabel(dateRange)}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto sm:items-stretch">
          <TeamSortSelect value={sortBy} onChange={setSortBy} className="w-full sm:w-auto" />
          {onDateRangeChange ? (
            <DateRangeSelect
              value={dateRange}
              onChange={onDateRangeChange}
              className="w-full sm:w-auto"
            />
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="app-card rounded-xl border p-4">
          <p className="text-xs text-app-muted">All departments</p>
          <p className="text-2xl font-bold text-app mt-1 tabular-nums">{summary.allTeams}</p>
          <p className="text-[11px] text-app-muted mt-1">
            {summary.activeTeams} with requests
          </p>
        </div>
        <div className="app-card rounded-xl border p-4">
          <p className="text-xs text-app-muted">Still open (all teams)</p>
          <p className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">{summary.totalOpen}</p>
        </div>
        <div className="app-card rounded-xl border p-4">
          <p className="text-xs text-app-muted">Teams needing help</p>
          <p className="text-2xl font-bold text-orange-600 mt-1 tabular-nums">{summary.needingHelp}</p>
        </div>
        <div className="app-card rounded-xl border p-4">
          <p className="text-xs text-app-muted">Open 2 weeks+</p>
          <p className="text-2xl font-bold text-rose-600 mt-1 tabular-nums">{summary.totalOverdue}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="app-card rounded-xl border p-4 sm:p-5">
          <h3 className="text-base sm:text-lg font-semibold text-app mb-1">
            Needs the most help
          </h3>
          <p className="text-xs text-app-muted mb-4">
            Teams with the most open / overdue requests
          </p>
          {needsHelp.length === 0 ? (
            <p className="text-sm text-app-muted py-4 text-center">
              No open requests across teams right now.
            </p>
          ) : (
            <div className="space-y-3">
              {needsHelp.map(([dept, stats], index) => {
                const maxOpen = Math.max(...needsHelp.map(([, s]) => s.stillOpen), 1);
                return (
                  <div key={dept} className="min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-app-surface-2 border border-app flex items-center justify-center text-xs font-bold text-app-muted flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-app break-words">{dept}</p>
                          <p className="text-[11px] text-app-muted">
                            {stats.stillOpen} open
                            {stats.overdueOpen > 0
                              ? ` · ${stats.overdueOpen} overdue (2 weeks+)`
                              : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-amber-600 tabular-nums flex-shrink-0">
                        {stats.stillOpen}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-app-surface-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${stats.overdueOpen > 0 ? 'bg-rose-500' : 'bg-amber-500'}`}
                        style={{ width: `${(stats.stillOpen / maxOpen) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="app-card rounded-xl border p-4 sm:p-5">
          <h3 className="text-base sm:text-lg font-semibold text-app mb-1">
            Healthiest teams
          </h3>
          <p className="text-xs text-app-muted mb-4">
            Highest finish rate (teams with at least 2 requests)
          </p>
          {healthiest.length === 0 ? (
            <p className="text-sm text-app-muted py-4 text-center">
              Not enough activity yet to rank teams.
            </p>
          ) : (
            <div className="space-y-4">
              {healthiest.map(([dept, stats], index) => (
                <div key={dept} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <span
                      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? 'bg-amber-500/20 text-amber-800 border border-amber-500/40'
                          : index === 1
                            ? 'bg-app-surface-2 text-app-soft border border-app'
                            : 'bg-orange-500/15 text-orange-800 border border-orange-500/35'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-app break-words">{dept}</p>
                      <p className="text-xs text-app-muted">
                        {stats.resolvedTickets}/{stats.totalTickets} finished
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600">{stats.resolutionRate}%</p>
                    <p className="text-[11px] text-app-muted">
                      {stats.avgResolutionTime > 0
                        ? formatExecutiveDuration(stats.avgResolutionTime)
                        : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-semibold text-app mb-3 px-1">
          All departments ({sortedTeams.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {sortedTeams.map(([department, stats]) => {
            const tone = healthTone(stats.resolutionRate, stats.totalTickets > 0);
            return (
              <div
                key={department}
                className="app-card rounded-xl border p-4 sm:p-5 min-w-0 h-full"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="text-sm sm:text-base font-semibold text-app break-words min-w-0">
                    {department}
                  </h4>
                  <span
                    className={`inline-flex shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-lg border ${healthBadge[tone]}`}
                  >
                    {healthLabel[tone]}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-lg bg-app-surface-2/60 border border-app/30 p-2 text-center">
                    <p className="text-lg font-bold text-app tabular-nums">{stats.totalTickets}</p>
                    <p className="text-[10px] text-app-muted">Requests</p>
                  </div>
                  <div className="rounded-lg bg-app-surface-2/60 border border-app/30 p-2 text-center">
                    <p className="text-lg font-bold text-amber-600 tabular-nums">{stats.stillOpen}</p>
                    <p className="text-[10px] text-app-muted">Still open</p>
                  </div>
                  <div className="rounded-lg bg-app-surface-2/60 border border-app/30 p-2 text-center">
                    <p className="text-lg font-bold text-rose-600 tabular-nums">{stats.overdueOpen}</p>
                    <p className="text-[10px] text-app-muted">2 weeks+</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-app-muted mb-1">
                  <span>{stats.resolutionRate}% finished</span>
                  <span>
                    {stats.resolvedTickets > 0
                      ? `Typical ${formatExecutiveDuration(stats.avgResolutionTime)}`
                      : 'No finishes yet'}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-app-surface-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${stats.resolutionRate}%` }}
                  />
                </div>
                <p className="text-[11px] text-app-muted mt-2">
                  {stats.activeUsers}/{stats.totalUsers} people active in this team
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="app-card rounded-xl border p-4 sm:p-5 min-w-0 overflow-hidden">
        <h3 className="text-base sm:text-lg font-semibold text-app mb-3">Team details</h3>
        <div className="w-full overflow-x-auto rounded-xl border border-app bg-app-panel">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-app bg-app-surface-2/60 text-left text-[11px] uppercase tracking-wide text-app-muted">
                <th className="px-3 py-2.5 font-semibold">Team</th>
                <th className="px-3 py-2.5 font-semibold">Requests</th>
                <th className="px-3 py-2.5 font-semibold">Still open</th>
                <th className="px-3 py-2.5 font-semibold">2 weeks+</th>
                <th className="px-3 py-2.5 font-semibold">Finished %</th>
                <th className="px-3 py-2.5 font-semibold">Typical time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--app-border-subtle)]">
              {sortedTeams.map(([department, stats]) => {
                const tone = healthTone(stats.resolutionRate, stats.totalTickets > 0);
                return (
                  <tr key={department} className="hover:bg-app-surface-2/50">
                    <td className="px-3 py-2.5 font-medium text-app break-words">{department}</td>
                    <td className="px-3 py-2.5 text-app-muted tabular-nums">{stats.totalTickets}</td>
                    <td className="px-3 py-2.5 text-amber-600 font-medium tabular-nums">
                      {stats.stillOpen}
                    </td>
                    <td className="px-3 py-2.5 text-rose-600 font-medium tabular-nums">
                      {stats.overdueOpen}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-lg border ${healthBadge[tone]}`}
                      >
                        {stats.resolutionRate}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-app-muted">
                      {stats.resolvedTickets > 0
                        ? formatExecutiveDuration(stats.avgResolutionTime)
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentAnalytics;
