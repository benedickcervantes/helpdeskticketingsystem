'use client';

import type { ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import html2canvas from 'html2canvas';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { formatExecutiveDuration } from '@/lib/utils/analytics';

type ReportChartsPayload = {
  ticketVolume?: Array<{ name: string; value: number }>;
  statusDistribution?: Array<{ name: string; value: number }>;
  priorityDistribution?: Array<{ name: string; value: number }>;
  dailyTrends?: Array<Record<string, unknown>>;
  departmentPerformance?: Array<{
    department: string;
    total: number;
    resolved?: number;
    done?: number;
    open?: number;
  }>;
  speedDistribution?: Array<{ name: string; value: number }>;
  monthlyComparison?: Array<{ month: string; filed: number; finished: number }>;
  weeklyFixTimes?: Array<{
    week: string;
    weekLabel: string;
    avgDays: number | null;
    avgHours: number;
    count: number;
    fill: string;
  }>;
  fixTimeSummary?: {
    typical: number | null;
    fastest: number | null;
    slowest: number | null;
    count: number;
  };
  chartKpis?: {
    newRequests: number;
    stillOpen: number;
    finished: number;
    urgent: number;
  };
};

const AXIS = '#64748b';
const GRID = '#e2e8f0';
const BG = '#ffffff';

const DAILY_LINES = [
  { dataKey: 'newRequests', label: 'New', color: '#3b82f6' },
  { dataKey: 'waiting', label: 'Waiting', color: '#ef4444' },
  { dataKey: 'beingFixed', label: 'Being fixed', color: '#f59e0b' },
  { dataKey: 'done', label: 'Done', color: '#10b981' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  Waiting: '#ef4444',
  'Being fixed': '#f59e0b',
  Done: '#10b981',
  Open: '#ef4444',
  'In Progress': '#f59e0b',
  Finished: '#10b981',
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#dc2626',
  High: '#ea580c',
  Medium: '#d97706',
  Low: '#16a34a',
};

type CapturedChart = { title: string; image: string };

function ChartShell({
  title,
  subtitle,
  children,
  tall = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  tall?: boolean;
}) {
  return (
    <div
      data-report-chart="true"
      data-title={title}
      style={{
        width: 900,
        background: BG,
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        boxSizing: 'border-box',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{subtitle}</div>
        ) : null}
      </div>
      <div style={{ width: 860, minHeight: tall ? 360 : 280 }}>{children}</div>
    </div>
  );
}

function Legend({
  items,
}: {
  items: Array<{ label: string; color: string }>;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
      {items.map((item) => (
        <span
          key={item.label}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px',
            borderRadius: 8,
            background: '#f1f5f9',
            fontSize: 12,
            color: '#334155',
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: item.color,
              display: 'inline-block',
            }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function ReportChartsBundle({ charts }: { charts: ReportChartsPayload }) {
  const daily = charts.dailyTrends || [];
  const status = charts.statusDistribution || charts.ticketVolume || [];
  const priority = (charts.priorityDistribution || []).filter((p) => p.value > 0);
  const departments = charts.departmentPerformance || [];
  const speed = charts.speedDistribution || [];
  const monthly = charts.monthlyComparison || [];
  const weeklyFix = charts.weeklyFixTimes || [];
  const fixSummary = charts.fixTimeSummary;
  const kpis = charts.chartKpis;
  const statusTotal = status.reduce((sum, s) => sum + (s.value || 0), 0);
  const hasMonthlyData = monthly.some((m) => m.filed > 0);
  const hasWeeklyFix = weeklyFix.length > 0;

  return (
    <div style={{ background: BG, padding: 8 }}>
      {kpis ? (
        <ChartShell
          title="Charts snapshot"
          subtitle="Same KPI strip as the Charts tab"
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: 12,
              paddingTop: 4,
            }}
          >
            {[
              { label: 'New requests', value: kpis.newRequests, color: '#0f172a' },
              { label: 'Still open', value: kpis.stillOpen, color: '#f59e0b' },
              { label: 'Finished', value: kpis.finished, color: '#10b981' },
              {
                label: 'Urgent (high + critical)',
                value: kpis.urgent,
                color: '#dc2626',
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 14,
                  background: '#f8fafc',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: item.color,
                    marginTop: 6,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </ChartShell>
      ) : null}

      {daily.length > 0 ? (
        <ChartShell
          title="Daily request activity"
          subtitle="New tickets filed each day, and how they ended up (waiting / being fixed / done)"
        >
          <LineChart width={860} height={240} data={daily} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="date" stroke={AXIS} tick={{ fontSize: 11, fill: AXIS }} minTickGap={10} />
            <YAxis stroke={AXIS} tick={{ fontSize: 11, fill: AXIS }} width={32} allowDecimals={false} />
            {DAILY_LINES.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.label}
                stroke={line.color}
                strokeWidth={line.dataKey === 'newRequests' ? 2.5 : 2}
                dot={daily.length <= 14}
                activeDot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
          <Legend items={DAILY_LINES.map((l) => ({ label: l.label, color: l.color }))} />
        </ChartShell>
      ) : null}

      <ChartShell
        title="Where requests stand"
        subtitle="Simple pipeline — waiting → being fixed → done"
      >
        <div style={{ paddingTop: 8 }}>
          <div
            style={{
              display: 'flex',
              height: 14,
              width: '100%',
              overflow: 'hidden',
              borderRadius: 999,
              background: '#e2e8f0',
              marginBottom: 16,
            }}
          >
            {status.map((item) => {
              const pct = statusTotal > 0 ? Math.round((item.value / statusTotal) * 100) : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={item.name}
                  style={{
                    width: `${pct}%`,
                    background: STATUS_COLORS[item.name] || '#64748b',
                    height: '100%',
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {status.map((item) => (
              <div
                key={item.name}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 12,
                  textAlign: 'center',
                  background: '#f8fafc',
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: STATUS_COLORS[item.name] || '#0f172a',
                  }}
                >
                  {item.value}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginTop: 4 }}>
                  {item.name}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {status.map((item) => {
              const percent = statusTotal > 0 ? Math.round((item.value / statusTotal) * 100) : 0;
              return (
                <div key={`bar-${item.name}`}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</span>
                    <span style={{ color: '#334155' }}>
                      {item.value}{' '}
                      <span style={{ color: '#64748b' }}>({percent}%)</span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: 12,
                      borderRadius: 999,
                      background: '#e2e8f0',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(percent > 0 ? 4 : 0, percent)}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: STATUS_COLORS[item.name] || '#64748b',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ChartShell>

      {priority.length > 0 ? (
        <ChartShell title="How urgent are they?" subtitle="Priority mix of all requests">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <PieChart width={320} height={260}>
              <Pie
                data={priority}
                dataKey="value"
                nameKey="name"
                cx={160}
                cy={130}
                innerRadius={58}
                outerRadius={100}
                paddingAngle={4}
                isAnimationActive={false}
              >
                {priority.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={PRIORITY_COLORS[entry.name] || '#64748b'}
                  />
                ))}
              </Pie>
            </PieChart>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {priority.map((item) => {
                const total = priority.reduce((s, p) => s + p.value, 0);
                const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div
                    key={item.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: '10px 12px',
                      background: '#f8fafc',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: PRIORITY_COLORS[item.name] || '#64748b',
                        }}
                      />
                      <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
                        {item.name}
                      </span>
                    </span>
                    <span style={{ fontSize: 13, color: '#334155' }}>
                      {item.value} ({percent}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartShell>
      ) : null}

      {departments.length > 0 ? (
        <ChartShell
          title="Requests by department"
          subtitle="Top teams by volume — amber still open, green finished"
          tall
        >
          <BarChart
            width={860}
            height={Math.max(240, departments.length * 42 + 40)}
            data={departments.map((d) => ({
              ...d,
              done: d.done ?? d.resolved ?? 0,
              open: d.open ?? Math.max((d.total || 0) - (d.done ?? d.resolved ?? 0), 0),
            }))}
            layout="vertical"
            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
            <XAxis type="number" stroke={AXIS} tick={{ fontSize: 11, fill: AXIS }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="department"
              width={150}
              stroke={AXIS}
              tick={{ fontSize: 11, fill: AXIS }}
            />
            <Bar
              dataKey="open"
              stackId="a"
              fill="#f59e0b"
              name="Still open"
              isAnimationActive={false}
            />
            <Bar
              dataKey="done"
              stackId="a"
              fill="#10b981"
              name="Done"
              isAnimationActive={false}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
          <Legend
            items={[
              { label: 'Still open', color: '#f59e0b' },
              { label: 'Done', color: '#10b981' },
            ]}
          />
        </ChartShell>
      ) : null}

      {hasWeeklyFix ? (
        <ChartShell
          title="How long do fixes usually take?"
          subtitle="Average days to finish a request, by week · green = 1–2 days · amber = 3–6 days · red = 2 weeks or more"
          tall
        >
          {fixSummary ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 10,
                marginBottom: 16,
              }}
            >
              {[
                { label: 'Typical', hours: fixSummary.typical },
                { label: 'Fastest', hours: fixSummary.fastest },
                { label: 'Slowest', hours: fixSummary.slowest },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 12,
                    textAlign: 'center',
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ fontSize: 11, color: '#64748b' }}>{card.label}</div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#0f172a',
                      marginTop: 4,
                    }}
                  >
                    {formatExecutiveDuration(card.hours)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <BarChart
            width={860}
            height={240}
            data={weeklyFix}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="week" stroke={AXIS} tick={{ fontSize: 11, fill: AXIS }} />
            <YAxis
              stroke={AXIS}
              tick={{ fontSize: 11, fill: AXIS }}
              width={40}
              tickFormatter={(value) =>
                value === 0 ? '0' : value === 1 ? '1 day' : `${value}d`
              }
              allowDecimals
            />
            <Bar dataKey="avgDays" name="Avg days" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {weeklyFix.map((entry) => (
                <Cell key={entry.weekLabel} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
          {fixSummary ? (
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 10 }}>
              Based on {fixSummary.count} finished request
              {fixSummary.count === 1 ? '' : 's'} in this period
            </div>
          ) : null}
        </ChartShell>
      ) : null}

      {speed.some((s) => s.value > 0) ? (
        <ChartShell
          title="How fast were tickets finished?"
          subtitle="Count of completed requests by how long they took"
        >
          <BarChart
            width={860}
            height={240}
            data={speed}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="name" stroke={AXIS} tick={{ fontSize: 11, fill: AXIS }} />
            <YAxis stroke={AXIS} tick={{ fontSize: 11, fill: AXIS }} width={32} allowDecimals={false} />
            <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ChartShell>
      ) : null}

      {hasMonthlyData ? (
        <ChartShell
          title="This year by month"
          subtitle="Requests filed vs finished each month"
        >
          <BarChart
            width={860}
            height={240}
            data={monthly}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="month" stroke={AXIS} tick={{ fontSize: 11, fill: AXIS }} />
            <YAxis stroke={AXIS} tick={{ fontSize: 11, fill: AXIS }} width={32} allowDecimals={false} />
            <Bar dataKey="filed" fill="#3b82f6" name="Filed" radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar
              dataKey="finished"
              fill="#10b981"
              name="Finished"
              radius={[3, 3, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
          <Legend
            items={[
              { label: 'Filed', color: '#3b82f6' },
              { label: 'Finished', color: '#10b981' },
            ]}
          />
        </ChartShell>
      ) : null}
    </div>
  );
}

function waitForPaint(ms = 450) {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, ms);
      });
    });
  });
}

async function waitUntilChartsReady(host: HTMLElement, minCharts: number, timeoutMs = 4000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const panels = host.querySelectorAll('[data-report-chart="true"]');
    const withSvg = Array.from(panels).filter(
      (node) =>
        node.querySelector('svg') ||
        (node as HTMLElement).innerText.trim().length > 20,
    );
    if (panels.length >= minCharts && withSvg.length >= Math.min(minCharts, panels.length)) {
      await waitForPaint(700);
      return;
    }
    await waitForPaint(200);
  }
  // Final grace period even if readiness check timed out
  await waitForPaint(900);
}

function expectedChartCount(charts: ReportChartsPayload) {
  let count = 1; // status panel always
  if (charts.chartKpis) count += 1;
  if ((charts.dailyTrends || []).length > 0) count += 1;
  if ((charts.priorityDistribution || []).some((p) => p.value > 0)) count += 1;
  if ((charts.departmentPerformance || []).length > 0) count += 1;
  if ((charts.weeklyFixTimes || []).length > 0) count += 1;
  if ((charts.speedDistribution || []).some((s) => s.value > 0)) count += 1;
  if ((charts.monthlyComparison || []).some((m) => m.filed > 0)) count += 1;
  return count;
}

async function snapshotPanels(host: HTMLElement): Promise<CapturedChart[]> {
  const nodes = Array.from(
    host.querySelectorAll<HTMLElement>('[data-report-chart="true"]'),
  );
  const captured: CapturedChart[] = [];

  for (const node of nodes) {
    const title = node.getAttribute('data-title') || 'Chart';
    // Ensure full card height is measured after layout
    const width = Math.max(node.scrollWidth, node.offsetWidth, 900);
    const height = Math.max(node.scrollHeight, node.offsetHeight, 280);
    const canvas = await html2canvas(node, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
    });
    const image = canvas.toDataURL('image/png', 1.0);
    if (image && image.length > 1000) {
      captured.push({ title, image });
    }
  }

  return captured;
}

/**
 * Renders dashboard-style Recharts panels and captures high-quality PNG snapshots.
 * Prefers accuracy over speed — waits for charts to fully paint before capture.
 */
export async function captureDashboardStyleCharts(
  charts: ReportChartsPayload | undefined | null,
): Promise<CapturedChart[]> {
  if (!charts || typeof document === 'undefined') return [];

  const host = document.createElement('div');
  host.setAttribute('data-report-chart-host', 'true');
  // Keep in viewport (opacity 0) — off-screen left often breaks SVG capture
  host.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    'width:920px',
    'background:#ffffff',
    'z-index:2147483646',
    'opacity:0',
    'pointer-events:none',
    'overflow:visible',
  ].join(';');
  document.body.appendChild(host);

  let root: Root | null = null;
  try {
    root = createRoot(host);
    root.render(<ReportChartsBundle charts={charts} />);

    const expected = expectedChartCount(charts);
    await waitUntilChartsReady(host, expected, 5000);

    let captured = await snapshotPanels(host);

    // One accuracy retry if first pass missed panels/SVGs
    if (captured.length < expected) {
      await waitForPaint(1000);
      captured = await snapshotPanels(host);
    }

    return captured;
  } finally {
    try {
      root?.unmount();
    } catch {
      // ignore
    }
    host.remove();
  }
}
