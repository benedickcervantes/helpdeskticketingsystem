// @ts-nocheck
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@/lib/contexts/ThemeContext';
import {
  buildDailyTrendSeries,
  buildFixTimeSummary,
  buildWeeklyFixTimes,
  filterTicketsByDateRange,
  formatExecutiveDuration,
  getDateRangeSpanLabel,
  getTicketCompletedAt,
  getTicketHours,
  hoursToDays,
  isCompletedStatus,
  isInProgressStatus,
  isOpenStatus,
  matchUserToTicket,
  normalizeTicketPriority,
  parseTicketDate,
} from '@/lib/utils/analytics';
import DateRangeSelect from './DateRangeSelect';

function fixDurationTextClass(days) {
  if (days == null || Number.isNaN(days)) return 'text-app';
  if (days < 3) return 'text-emerald-600';
  if (days <= 6) return 'text-amber-600';
  if (days >= 14) return 'text-rose-600';
  return 'text-orange-600';
}

const AnalyticsOverview = ({ tickets = [], users = [], dateRange = '30', onDateRangeChange }) => {
  const { theme } = useTheme();
  const chartAxis = theme === 'light' ? '#5b6b7f' : '#9CA3AF';
  const chartGrid = theme === 'light' ? '#c5ceda' : '#4B5563';
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scopedTickets = useMemo(
    () => filterTicketsByDateRange(Array.isArray(tickets) ? tickets : [], dateRange),
    [tickets, dateRange],
  );

  const stats = useMemo(() => {
    const total = scopedTickets.length;
    const waiting = scopedTickets.filter((t) => isOpenStatus(String(t.status ?? ''))).length;
    const working = scopedTickets.filter((t) => isInProgressStatus(String(t.status ?? ''))).length;
    const done = scopedTickets.filter((t) => isCompletedStatus(String(t.status ?? ''))).length;
    const urgent = scopedTickets.filter((t) => {
      const p = normalizeTicketPriority(String(t.priority ?? ''));
      return p === 'critical' || p === 'high';
    }).length;
    return { total, waiting, working, done, urgent };
  }, [scopedTickets]);

  const dailyTrends = useMemo(() => {
    const days = parseInt(dateRange, 10) || 30;
    return buildDailyTrendSeries(scopedTickets, days, (dayTickets) => ({
      newRequests: dayTickets.length,
      waiting: dayTickets.filter((t) => isOpenStatus(String(t.status ?? ''))).length,
      beingFixed: dayTickets.filter((t) => isInProgressStatus(String(t.status ?? ''))).length,
      done: dayTickets.filter((t) => isCompletedStatus(String(t.status ?? ''))).length,
    }));
  }, [scopedTickets, dateRange]);

  const weeklyFixTimes = useMemo(
    () => buildWeeklyFixTimes(scopedTickets),
    [scopedTickets],
  );

  const fixTimeSummary = useMemo(
    () => buildFixTimeSummary(scopedTickets),
    [scopedTickets],
  );

  const statusItems = useMemo(
    () => [
      { name: 'Waiting', hint: 'Not started yet', value: stats.waiting, color: '#ef4444' },
      { name: 'Being fixed', hint: 'IT is working on it', value: stats.working, color: '#f59e0b' },
      { name: 'Done', hint: 'Resolved or closed', value: stats.done, color: '#10b981' },
    ],
    [stats],
  );

  const priorityItems = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    scopedTickets.forEach((t) => {
      const p = normalizeTicketPriority(String(t.priority ?? ''));
      if (p in counts) counts[p] += 1;
      else counts.medium += 1;
    });
    return [
      { name: 'Critical', hint: 'Business-stopping', value: counts.critical, color: '#dc2626' },
      { name: 'High', hint: 'Needs fast attention', value: counts.high, color: '#ea580c' },
      { name: 'Medium', hint: 'Normal priority', value: counts.medium, color: '#d97706' },
      { name: 'Low', hint: 'Can wait if needed', value: counts.low, color: '#16a34a' },
    ];
  }, [scopedTickets]);

  const departmentData = useMemo(() => {
    const departmentStats = {};
    const safeUsers = Array.isArray(users) ? users : [];

    scopedTickets.forEach((ticket) => {
      const creatorDept = ticket.creator?.department;
      let department = creatorDept || null;
      if (!department) {
        const user = safeUsers.find((u) => matchUserToTicket(u, String(ticket.createdBy ?? '')));
        department = user?.department || null;
      }
      if (!department) department = 'Unassigned';

      if (!departmentStats[department]) {
        departmentStats[department] = { department, total: 0, done: 0, open: 0 };
      }
      departmentStats[department].total += 1;
      if (isCompletedStatus(String(ticket.status ?? ''))) {
        departmentStats[department].done += 1;
      } else {
        departmentStats[department].open += 1;
      }
    });

    return Object.values(departmentStats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [scopedTickets, users]);

  const speedDistribution = useMemo(() => {
    const ranges = [
      { range: 'Under 1h', min: 0, max: 1 },
      { range: '1–4h', min: 1, max: 4 },
      { range: '4–8h', min: 4, max: 8 },
      { range: '8–24h', min: 8, max: 24 },
      { range: '1–3 days', min: 24, max: 72 },
      { range: 'Over 3 days', min: 72, max: Infinity },
    ];

    return ranges.map((range) => {
      const count = scopedTickets.filter((ticket) => {
        if (!isCompletedStatus(String(ticket.status ?? ''))) return false;
        const completedAt = getTicketCompletedAt(ticket);
        const hours = completedAt ? getTicketHours(ticket.createdAt, completedAt) : null;
        return hours !== null && hours >= range.min && hours < range.max;
      }).length;
      return { range: range.range, count };
    });
  }, [scopedTickets]);

  const monthlyComparison = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const allTickets = Array.isArray(tickets) ? tickets : [];

    return months.map((month, index) => {
      const monthTickets = allTickets.filter((ticket) => {
        const ticketDate = parseTicketDate(ticket.createdAt);
        return (
          ticketDate &&
          ticketDate.getMonth() === index &&
          ticketDate.getFullYear() === currentYear
        );
      });
      return {
        month,
        filed: monthTickets.length,
        finished: monthTickets.filter((t) => isCompletedStatus(String(t.status ?? ''))).length,
      };
    });
  }, [tickets]);

  const dailyTrendLines = [
    { dataKey: 'newRequests', label: 'New', color: '#3b82f6' },
    { dataKey: 'waiting', label: 'Waiting', color: '#ef4444' },
    { dataKey: 'beingFixed', label: 'Being fixed', color: '#f59e0b' },
    { dataKey: 'done', label: 'Done', color: '#10b981' },
  ];

  const axisTick = { fontSize: 10, fill: chartAxis };

  const getDailyTrendAxisConfig = (pointCount = 0, mobile = false) => {
    if (pointCount <= 1) return { angle: 0, textAnchor: 'middle', height: 24, interval: 0 };
    if (mobile || pointCount <= 10) {
      const interval = pointCount <= 6 ? 0 : Math.max(1, Math.ceil(pointCount / 5) - 1);
      return { angle: 0, textAnchor: 'middle', height: 28, interval };
    }
    return {
      angle: -25,
      textAnchor: 'end',
      height: 48,
      interval: Math.max(1, Math.floor(pointCount / 8)),
    };
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload;
    return (
      <div className="bg-app-panel border border-app p-2 sm:p-3 rounded-lg shadow-lg max-w-[220px]">
        <p className="font-semibold text-app text-xs sm:text-sm mb-1">
          {point?.dateLabel || label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-app-soft text-xs sm:text-sm">
            {entry.name}: <span style={{ color: entry.color }}>{entry.value}</span>
          </p>
        ))}
      </div>
    );
  };

  const ChartCard = ({ title, subtitle, children }) => (
    <div className="app-card rounded-xl border p-3 sm:p-5 min-w-0">
      <div className="mb-3">
        <h3 className="text-base sm:text-lg font-semibold text-app">{title}</h3>
        {subtitle ? <p className="text-xs text-app-muted mt-0.5">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );

  const LegendPills = ({ items }) => (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.label || item.name}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-app-surface-2/70 text-xs text-app-soft"
        >
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          {item.label || item.name}
        </span>
      ))}
    </div>
  );

  const DistributionBars = ({ items, total, emptyLabel = 'None' }) => {
    const safeTotal = total > 0 ? total : items.reduce((s, i) => s + (i.value || 0), 0);
    if (safeTotal === 0) {
      return <p className="text-sm text-app-muted py-4 text-center">{emptyLabel}</p>;
    }
    return (
      <div className="space-y-3">
        {items.map((item) => {
          const percent = Math.round(((item.value || 0) / safeTotal) * 100);
          return (
            <div key={item.name}>
              <div className="flex items-end justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-app">{item.name}</p>
                  {item.hint ? (
                    <p className="text-[11px] text-app-muted">{item.hint}</p>
                  ) : null}
                </div>
                <p className="text-sm font-bold text-app tabular-nums flex-shrink-0">
                  {item.value}{' '}
                  <span className="text-app-muted font-medium text-xs">({percent}%)</span>
                </p>
              </div>
              <div className="h-3 rounded-full bg-app-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(percent > 0 ? 4 : 0, percent)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const axisConfig = getDailyTrendAxisConfig(dailyTrends.length, isMobile);
  const trendHeight = 240;
  const hasFixTimeData = weeklyFixTimes.length > 0;
  const hasMonthlyData = monthlyComparison.some((m) => m.filed > 0);

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between px-1">
        <div className="text-center sm:text-left min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold text-app mb-1">Charts</h2>
          <p className="text-xs sm:text-sm text-app-muted">
            Visual view of volume, status, speed, and departments
            <span className="text-app-muted/80"> · {getDateRangeSpanLabel(dateRange)}</span>
          </p>
        </div>
        {onDateRangeChange ? (
          <DateRangeSelect value={dateRange} onChange={onDateRangeChange} />
        ) : null}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="app-card rounded-xl border p-4">
          <p className="text-xs text-app-muted">New requests</p>
          <p className="text-2xl font-bold text-app mt-1 tabular-nums">{stats.total}</p>
        </div>
        <div className="app-card rounded-xl border p-4">
          <p className="text-xs text-app-muted">Still open</p>
          <p className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">
            {stats.waiting + stats.working}
          </p>
        </div>
        <div className="app-card rounded-xl border p-4">
          <p className="text-xs text-app-muted">Finished</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{stats.done}</p>
        </div>
        <div className="app-card rounded-xl border p-4">
          <p className="text-xs text-app-muted">Urgent (high + critical)</p>
          <p className="text-2xl font-bold text-rose-600 mt-1 tabular-nums">{stats.urgent}</p>
        </div>
      </div>

      {/* Daily multi-line trend */}
      <ChartCard
        title="Daily request activity"
        subtitle="New tickets filed each day, and how they ended up (waiting / being fixed / done)"
      >
        {dailyTrends.length === 0 ? (
          <p className="text-sm text-app-muted py-8 text-center">No data for this period.</p>
        ) : (
          <>
            <div className="w-full" style={{ height: trendHeight + axisConfig.height }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailyTrends}
                  margin={{ top: 8, right: 8, left: -8, bottom: axisConfig.height }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis
                    dataKey="date"
                    stroke={chartAxis}
                    tick={{ ...axisTick, fill: chartAxis }}
                    minTickGap={8}
                    {...axisConfig}
                  />
                  <YAxis stroke={chartAxis} tick={axisTick} width={28} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {dailyTrendLines.map((line) => (
                    <Line
                      key={line.dataKey}
                      type="monotone"
                      dataKey={line.dataKey}
                      stroke={line.color}
                      strokeWidth={line.dataKey === 'newRequests' ? 2.5 : 2}
                      name={line.label}
                      dot={dailyTrends.length <= 14}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <LegendPills items={dailyTrendLines} />
          </>
        )}
      </ChartCard>

      {/* Status + open-age urgency — clear bars for executives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard
          title="Where requests stand"
          subtitle="Simple pipeline — waiting → being fixed → done"
        >
          {stats.total === 0 ? (
            <p className="text-sm text-app-muted py-8 text-center">No requests in this period.</p>
          ) : (
            <>
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-app-surface-3 mb-4">
                {statusItems.map((item) => {
                  const pct = Math.round((item.value / stats.total) * 100);
                  if (pct <= 0) return null;
                  return (
                    <div
                      key={item.name}
                      className="h-full"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                      title={`${item.name}: ${item.value}`}
                    />
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {statusItems.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-lg border border-app/30 bg-app-surface-2/50 p-3 text-center"
                  >
                    <p
                      className="text-2xl font-bold tabular-nums"
                      style={{ color: item.color }}
                    >
                      {item.value}
                    </p>
                    <p className="text-xs font-medium text-app mt-1">{item.name}</p>
                    <p className="text-[10px] text-app-muted mt-0.5">{item.hint}</p>
                  </div>
                ))}
              </div>
              <DistributionBars items={statusItems} total={stats.total} />
            </>
          )}
        </ChartCard>

        <ChartCard title="How urgent are they?" subtitle="Priority mix of all requests">
          {stats.total === 0 ? (
            <p className="text-sm text-app-muted py-8 text-center">No requests in this period.</p>
          ) : (
            <>
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityItems.filter((i) => i.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius="42%"
                      outerRadius="72%"
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                    >
                      {priorityItems
                        .filter((i) => i.value > 0)
                        .map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0]?.payload;
                        const percent =
                          stats.total > 0
                            ? Math.round((row.value / stats.total) * 100)
                            : 0;
                        return (
                          <div className="bg-app-panel border border-app p-2 rounded-lg shadow-lg text-xs">
                            <p className="font-semibold text-app">{row?.name}</p>
                            <p className="text-app-muted">{row?.hint}</p>
                            <p className="text-app-soft mt-1">
                              {row?.value} ({percent}%)
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {priorityItems.map((item) => {
                  const percent =
                    stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
                  return (
                    <div
                      key={item.name}
                      className="flex items-start gap-2 p-2 rounded-lg bg-app-surface-2/60 border border-app/30"
                    >
                      <span
                        className="w-3 h-3 mt-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-app">{item.name}</p>
                        <p className="text-[11px] text-app-muted">{item.hint}</p>
                        <p className="text-xs text-app-soft mt-0.5 tabular-nums">
                          {item.value} ({percent}%)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      {/* Department stacked bar */}
      <ChartCard
        title="Requests by department"
        subtitle="Which teams filed the most · still open vs finished"
      >
        {departmentData.length === 0 ? (
          <p className="text-sm text-app-muted py-6 text-center">No department data available.</p>
        ) : isMobile ? (
          <div className="space-y-3">
            {departmentData.map((dept) => {
              const max = Math.max(...departmentData.map((d) => d.total), 1);
              return (
                <div
                  key={dept.department}
                  className="rounded-lg border border-app/40 bg-app-surface-2/50 p-3"
                >
                  <p className="text-sm font-medium text-app mb-2 break-words">{dept.department}</p>
                  <div className="h-2.5 rounded-full bg-app-surface-3 overflow-hidden flex mb-2">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${(dept.open / max) * 100}%` }}
                    />
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${(dept.done / max) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-app-muted">
                    {dept.total} total · {dept.open} still open · {dept.done} done
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <div style={{ height: Math.max(240, departmentData.length * 48 + 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={departmentData}
                  margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                  barCategoryGap="28%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} horizontal={false} />
                  <XAxis type="number" stroke={chartAxis} tick={axisTick} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="department"
                    stroke={chartAxis}
                    width={120}
                    tick={{ fontSize: 11, fill: chartAxis }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0]?.payload;
                      return (
                        <div className="bg-app-panel border border-app p-2 rounded-lg shadow-lg text-xs">
                          <p className="font-semibold text-app mb-1">{row?.department}</p>
                          <p className="text-app-soft">Still open: {row?.open}</p>
                          <p className="text-app-soft">Done: {row?.done}</p>
                          <p className="text-app-muted mt-1">Total: {row?.total}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="open" stackId="a" fill="#f59e0b" name="Still open" barSize={14} />
                  <Bar dataKey="done" stackId="a" fill="#10b981" name="Done" barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <LegendPills
              items={[
                { label: 'Still open', color: '#f59e0b' },
                { label: 'Done', color: '#10b981' },
              ]}
            />
          </>
        )}
      </ChartCard>

      {/* Fix time — weekly bars (clearer than fragmented daily area) */}
      <ChartCard
        title="How long do fixes usually take?"
        subtitle="Average days to finish a request, by week · green = 1–2 days · amber = 3–6 days · red = 2 weeks or more"
      >
        {!hasFixTimeData ? (
          <p className="text-sm text-app-muted py-8 text-center">
            No finished tickets in this period yet. This chart fills in once requests are resolved.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
              <div className="rounded-lg bg-app-surface-2/70 border border-app/30 p-3 text-center">
                <p className="text-[11px] sm:text-xs text-app-muted">Typical</p>
                <p
                  className={`text-sm sm:text-base font-bold mt-1 leading-snug ${fixDurationTextClass(hoursToDays(fixTimeSummary.typical))}`}
                >
                  {formatExecutiveDuration(fixTimeSummary.typical)}
                </p>
              </div>
              <div className="rounded-lg bg-app-surface-2/70 border border-app/30 p-3 text-center">
                <p className="text-[11px] sm:text-xs text-app-muted">Fastest</p>
                <p
                  className={`text-sm sm:text-base font-bold mt-1 leading-snug ${fixDurationTextClass(hoursToDays(fixTimeSummary.fastest))}`}
                >
                  {formatExecutiveDuration(fixTimeSummary.fastest)}
                </p>
              </div>
              <div className="rounded-lg bg-app-surface-2/70 border border-app/30 p-3 text-center">
                <p className="text-[11px] sm:text-xs text-app-muted">Slowest</p>
                <p
                  className={`text-sm sm:text-base font-bold mt-1 leading-snug ${fixDurationTextClass(hoursToDays(fixTimeSummary.slowest))}`}
                >
                  {formatExecutiveDuration(fixTimeSummary.slowest)}
                </p>
              </div>
            </div>
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyFixTimes}
                  margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="week" stroke={chartAxis} tick={axisTick} />
                  <YAxis
                    stroke={chartAxis}
                    tick={axisTick}
                    width={40}
                    tickFormatter={(value) =>
                      value === 0 ? '0' : value === 1 ? '1 day' : `${value}d`
                    }
                    domain={[0, 'auto']}
                    allowDecimals
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0]?.payload;
                      return (
                        <div className="bg-app-panel border border-app p-2 rounded-lg shadow-lg text-xs">
                          <p className="font-semibold text-app mb-1">{row?.weekLabel}</p>
                          <p className="text-app-soft">
                            Avg finish time:{' '}
                            <span className="text-app font-medium">
                              {formatExecutiveDuration(row?.avgHours)}
                            </span>
                          </p>
                          <p className="text-app-muted mt-0.5">
                            {row?.count} finished that week
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="avgDays" name="Avg days" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {weeklyFixTimes.map((entry) => (
                      <Cell key={entry.weekLabel} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-app-muted mt-2">
              Based on {fixTimeSummary.count} finished request
              {fixTimeSummary.count === 1 ? '' : 's'} in this period
            </p>
          </>
        )}
      </ChartCard>

      {/* Speed distribution + Monthly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard
          title="How fast were tickets finished?"
          subtitle="Count of completed requests by how long they took"
        >
          {speedDistribution.every((r) => r.count === 0) ? (
            <p className="text-sm text-app-muted py-8 text-center">No finished tickets yet.</p>
          ) : (
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={speedDistribution} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="range" stroke={chartAxis} tick={axisTick} interval={0} angle={isMobile ? -20 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 48 : 28} />
                  <YAxis stroke={chartAxis} tick={axisTick} width={28} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-app-panel border border-app p-2 rounded-lg shadow-lg text-xs">
                          <p className="font-semibold text-app">{payload[0]?.payload?.range}</p>
                          <p className="text-app-soft">{payload[0]?.value} finished</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" name="Finished" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="This year by month"
          subtitle="Requests filed vs finished each month"
        >
          {!hasMonthlyData ? (
            <p className="text-sm text-app-muted py-8 text-center">No monthly data yet.</p>
          ) : (
            <>
              <div className="w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparison} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis dataKey="month" stroke={chartAxis} tick={axisTick} />
                    <YAxis stroke={chartAxis} tick={axisTick} width={28} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="filed" fill="#3b82f6" name="Filed" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="finished" fill="#10b981" name="Finished" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <LegendPills
                items={[
                  { label: 'Filed', color: '#3b82f6' },
                  { label: 'Finished', color: '#10b981' },
                ]}
              />
            </>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default AnalyticsOverview;
