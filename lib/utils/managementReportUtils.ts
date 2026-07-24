import {
  formatExecutiveDuration,
  getDateRangeLabel,
} from '@/lib/utils/analytics';
import {
  formatFeedbackDateTime,
  getFeedbackUserLabel,
  type FeedbackItem,
} from '@/lib/utils/feedbackReportUtils';

export function getReportPeriodLabel(dateRange: string | number = '30'): string {
  return getDateRangeLabel(dateRange);
}

export function buildFeedbackSummary(feedback: FeedbackItem[] = []) {
  const total = feedback.length;
  const emptyDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  if (total === 0) {
    return {
      totalFeedback: 0,
      averageRating: '0',
      satisfactionRate: '0',
      improvementRate: '0',
      highRatings: 0,
      lowRatings: 0,
      ratingDistribution: emptyDistribution,
      ratingBreakdown: [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: 0,
        percent: '0.0',
      })),
      recentComments: [] as Array<{
        rating: number;
        userName: string;
        comment: string;
        date: string;
        ticketTitle?: string;
        hasComment: boolean;
      }>,
    };
  }

  // Same formulas as Feedback tab (ExecutiveFeedbackDashboard)
  const averageRating = (
    feedback.reduce((sum, item) => sum + Number(item.rating || 0), 0) / total
  ).toFixed(1);

  const highRatings = feedback.filter((item) => Number(item.rating) >= 4).length;
  const lowRatings = feedback.filter((item) => Number(item.rating) <= 2).length;

  const satisfactionRate = ((highRatings / total) * 100).toFixed(1);
  const improvementRate = ((lowRatings / total) * 100).toFixed(1);

  const ratingDistribution = { ...emptyDistribution };
  feedback.forEach((item) => {
    const rating = Math.round(Number(item.rating || 0));
    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating as 1 | 2 | 3 | 4 | 5] += 1;
    }
  });

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = ratingDistribution[star as 1 | 2 | 3 | 4 | 5];
    return {
      star,
      count,
      percent: ((count / total) * 100).toFixed(1),
    };
  });

  // Same recent list as Feedback tab — all ratings, newest first (not only written comments)
  const recentComments = [...feedback]
    .sort(
      (a, b) =>
        new Date(String(b.createdAt || 0)).getTime() -
        new Date(String(a.createdAt || 0)).getTime(),
    )
    .slice(0, 8)
    .map((item) => {
      const comment = String(item.suggestions || '').trim();
      return {
        rating: Number(item.rating || 0),
        userName: getFeedbackUserLabel(item),
        comment: comment || 'No written feedback provided.',
        date: formatFeedbackDateTime(item.createdAt),
        ticketTitle: item.ticketTitle || undefined,
        hasComment: comment.length > 0,
      };
    });

  return {
    totalFeedback: total,
    averageRating,
    satisfactionRate,
    improvementRate,
    highRatings,
    lowRatings,
    ratingDistribution,
    ratingBreakdown,
    recentComments,
  };
}

function compactLines(lines: Array<string | null | undefined | false>, max = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    if (!line) continue;
    const trimmed = String(line).trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
}

export type ReportInsightInput = {
  reportKind:
    | 'dashboard'
    | 'executive'
    | 'analytics'
    | 'operational'
    | 'departmental';
  periodLabel: string;
  periodSpan: string;
  totalTickets: number;
  finishedCount: number;
  openCount: number;
  stillOpenCount: number;
  resolutionRate: number;
  avgResolutionHours: number;
  typicalFixLabel: string;
  urgentOpen: number;
  customerSatisfaction: number;
  health?: {
    status?: string;
    score?: number;
    headline?: string;
    summary?: string;
  };
  feedback?: {
    totalFeedback?: number;
    averageRating?: number | string;
    satisfactionRate?: number | string;
    highRatings?: number;
    lowRatings?: number;
    recentComments?: Array<{ rating: number; comment: string }>;
  };
  serviceQuality?: {
    score?: number;
    verdict?: string;
    verdictSummary?: string;
    overdueOpen?: number;
    agingOpen?: number;
    targets?: Array<{
      title: string;
      display: string;
      targetLabel?: string;
      tone?: string;
    }>;
  };
  team?: {
    allTeams?: number;
    activeTeams?: number;
    needingHelp?: number;
    totalOpen?: number;
    totalOverdue?: number;
    needsHelp?: Array<{
      department: string;
      stillOpen: number;
      overdueOpen: number;
      resolutionRate?: number;
    }>;
    healthiest?: Array<{
      department: string;
      resolutionRate: number;
      totalTickets: number;
    }>;
    weakestByRate?: {
      department: string;
      resolutionRate: number;
      totalTickets: number;
    } | null;
  };
  topByFinish?: { department: string; resolutionRate: number; total?: number } | null;
  topByVolume?: { department: string; total: number } | null;
  chartKpis?: {
    newRequests?: number;
    stillOpen?: number;
    finished?: number;
    urgent?: number;
  };
  priority?: { critical?: number; high?: number; medium?: number; low?: number };
  fixTimeSummary?: {
    typical: number | null;
    fastest: number | null;
    slowest: number | null;
    count: number;
  };
  weeklyFixTimes?: Array<{ week: string; avgDays: number | null; fill?: string }>;
  dailyTrends?: Array<{
    date?: string;
    dateLabel?: string;
    newRequests?: number;
    total?: number;
  }>;
};

function finishRateAdvice(rate: number, stillOpen: number): string {
  if (rate < 60) {
    return `Finish rate is ${rate}% — prioritize clearing ${stillOpen} still-open request${stillOpen === 1 ? '' : 's'} to get above 60%`;
  }
  if (rate < 80) {
    return `Finish rate is ${rate}% (${80 - rate} pts below the 80% healthy mark) — close open backlog first`;
  }
  if (rate < 90) {
    return `Finish rate is solid at ${rate}% — push toward the 90% service target by finishing remaining open work`;
  }
  return `Finish rate is strong at ${rate}% — maintain this completion pace`;
}

function fixTimeAdvice(hours: number, label: string): string {
  if (hours <= 0) {
    return 'Not enough finished tickets yet to judge typical fix time — resolve a few requests to establish a baseline';
  }
  if (hours / 24 >= 14) {
    return `Typical fix time is ${label} (2 weeks+) — triage longest-running tickets immediately`;
  }
  if (hours > 48) {
    return `Typical fix time is ${label} (above the 48h / ~2-day goal) — review tickets stuck past day 2`;
  }
  if (hours / 24 <= 2) {
    return `Typical fix time is ${label} — within the 1–2 day goal; keep this turnaround`;
  }
  return `Typical fix time is ${label} — tighten handoffs to stay under about 2 days`;
}

function peakVolumeDay(
  dailyTrends?: ReportInsightInput['dailyTrends'],
): string | null {
  if (!dailyTrends?.length) return null;
  let peak = dailyTrends[0];
  let peakVal = Number(peak.newRequests ?? peak.total ?? 0);
  dailyTrends.forEach((day) => {
    const val = Number(day.newRequests ?? day.total ?? 0);
    if (val > peakVal) {
      peak = day;
      peakVal = val;
    }
  });
  if (peakVal <= 0) return null;
  const label = peak.dateLabel || peak.date || 'a recent day';
  return `Highest filing day was ${label} with ${peakVal} new request${peakVal === 1 ? '' : 's'} — plan coverage around similar spikes`;
}

function slowWeeksAdvice(
  weekly?: ReportInsightInput['weeklyFixTimes'],
): string | null {
  if (!weekly?.length) return null;
  const slow = weekly.filter((w) => (w.avgDays ?? 0) >= 7);
  if (slow.length === 0) {
    const avg =
      weekly.reduce((sum, w) => sum + (w.avgDays ?? 0), 0) / weekly.length;
    if (avg < 3) {
      return `Weekly finish times stay mostly in the green band (~${avg.toFixed(1)} days avg) — sustain current handling`;
    }
    return null;
  }
  const names = slow
    .slice(-3)
    .map((w) => w.week)
    .join(', ');
  return `Slow finish weeks detected (${names}) — investigate what delayed those completions`;
}

/**
 * Builds Key Findings + Recommendations that change with live dashboard data.
 */
export function buildDataDrivenInsights(input: ReportInsightInput): {
  keyFindings: string[];
  recommendations: string[];
} {
  const rate = input.resolutionRate || 0;
  const stillOpen = input.stillOpenCount || 0;
  const overdue =
    input.team?.totalOverdue ?? input.serviceQuality?.overdueOpen ?? 0;
  const aging = input.serviceQuality?.agingOpen ?? 0;
  const urgent = input.urgentOpen || 0;
  const feedbackTotal = input.feedback?.totalFeedback || 0;
  const weakTargets = (input.serviceQuality?.targets || []).filter(
    (t) => t.tone === 'warning' || t.tone === 'critical',
  );
  const topNeed = input.team?.needsHelp?.[0];
  const topHealthy = input.team?.healthiest?.[0] || input.topByFinish;
  const weakest = input.team?.weakestByRate;
  const critical = input.priority?.critical ?? 0;
  const high = input.priority?.high ?? 0;

  const commonFindings: Array<string | null | undefined | false> = [
    input.health?.headline
      ? `${input.health.headline} (${input.health.status || 'Unknown'} · ${input.health.score ?? 0}/100)`
      : input.health?.status
        ? `Support health: ${input.health.status} (${input.health.score ?? 0}/100)`
        : null,
    input.health?.summary || null,
    `${input.totalTickets} request${input.totalTickets === 1 ? '' : 's'} in ${input.periodLabel.toLowerCase()} (${input.periodSpan}) · ${rate}% finished (${input.finishedCount}) · ${stillOpen} still open`,
    `Typical fix time ${input.typicalFixLabel}${
      input.fixTimeSummary?.count
        ? ` · fastest ${formatExecutiveDuration(input.fixTimeSummary.fastest)} · slowest ${formatExecutiveDuration(input.fixTimeSummary.slowest)}`
        : ''
    }`,
    urgent > 0
      ? `${urgent} high/critical request${urgent === 1 ? '' : 's'} still open`
      : 'No high/critical requests currently open',
    overdue > 0
      ? `${overdue} request${overdue === 1 ? '' : 's'} open 2 weeks or longer${aging > 0 ? ` · ${aging} aging 1–2 weeks` : ''}`
      : aging > 0
        ? `${aging} open request${aging === 1 ? '' : 's'} aging 1–2 weeks (not yet overdue)`
        : 'No tickets open two weeks or longer',
  ];

  const commonRecs: Array<string | null | undefined | false> = [
    finishRateAdvice(rate, stillOpen),
    fixTimeAdvice(input.avgResolutionHours || 0, input.typicalFixLabel),
    urgent > 0
      ? `Clear ${urgent} open high/critical item${urgent === 1 ? '' : 's'} before lower-priority work`
      : null,
    overdue > 0
      ? `Escalate and close ${overdue} ticket${overdue === 1 ? '' : 's'} open 2 weeks+ this week`
      : aging > 0
        ? `Watch ${aging} ticket${aging === 1 ? '' : 's'} aging 1–2 weeks so they do not become overdue`
        : null,
  ];

  if (input.reportKind === 'executive') {
    return {
      keyFindings: compactLines(
        [
          ...commonFindings,
          feedbackTotal > 0
            ? `Customer satisfaction ${input.customerSatisfaction}% from ${feedbackTotal} rating${feedbackTotal === 1 ? '' : 's'} (avg ${input.feedback?.averageRating ?? '—'}/5)`
            : 'No user ratings in this period yet',
          input.serviceQuality?.verdict
            ? `Service quality verdict: ${input.serviceQuality.verdict} (${input.serviceQuality.score}/100)`
            : null,
        ],
        7,
      ),
      recommendations: compactLines(
        [
          ...commonRecs,
          rate >= 80 && urgent === 0 && overdue === 0
            ? 'No urgent operational risks — keep current staffing and triage cadence'
            : null,
          feedbackTotal === 0
            ? 'Ask users to rate completed tickets so satisfaction can guide next actions'
            : Number(input.feedback?.lowRatings || 0) > 0
              ? `Review ${input.feedback?.lowRatings} low rating${(input.feedback?.lowRatings || 0) === 1 ? '' : 's'} (≤2★) for recurring complaints`
              : `Satisfaction is ${input.customerSatisfaction}% — keep the practices users are rating highly`,
          topNeed
            ? `Give extra support to ${topNeed.department} (${topNeed.stillOpen} open · ${topNeed.overdueOpen} overdue)`
            : topHealthy
              ? `Protect capacity that keeps ${'department' in topHealthy ? topHealthy.department : 'top teams'} performing well`
              : null,
        ],
        6,
      ),
    };
  }

  if (input.reportKind === 'analytics') {
    const kpis = input.chartKpis || {};
    const finishedPct =
      input.totalTickets > 0
        ? Math.round((input.finishedCount / input.totalTickets) * 100)
        : 0;
    const openPct =
      input.totalTickets > 0
        ? Math.round((input.openCount / input.totalTickets) * 100)
        : 0;
    return {
      keyFindings: compactLines(
        [
          `Charts KPIs: ${kpis.newRequests ?? input.totalTickets} new · ${kpis.stillOpen ?? stillOpen} still open · ${kpis.finished ?? input.finishedCount} finished · ${kpis.urgent ?? urgent} urgent`,
          `Status mix: ${finishedPct}% finished · ${openPct}% open/waiting`,
          `Priority mix: ${critical} critical · ${high} high · ${input.priority?.medium ?? 0} medium · ${input.priority?.low ?? 0} low`,
          input.fixTimeSummary?.count
            ? `Fix time — typical ${formatExecutiveDuration(input.fixTimeSummary.typical)}, fastest ${formatExecutiveDuration(input.fixTimeSummary.fastest)}, slowest ${formatExecutiveDuration(input.fixTimeSummary.slowest)} (${input.fixTimeSummary.count} finished)`
            : 'No finished tickets yet for weekly fix-time analysis',
          input.topByVolume
            ? `Highest volume team: ${input.topByVolume.department} (${input.topByVolume.total} requests)`
            : null,
          input.topByFinish
            ? `Best finish rate: ${input.topByFinish.department} (${input.topByFinish.resolutionRate}%)`
            : null,
        ],
        7,
      ),
      recommendations: compactLines(
        [
          peakVolumeDay(input.dailyTrends),
          stillOpen > 0
            ? `Reduce the ${stillOpen}-ticket open backlog where volume is concentrated${
                input.topByVolume
                  ? ` — start with ${input.topByVolume.department}`
                  : ''
              }`
            : 'Open backlog is clear — monitor new filings daily',
          urgent > 0 || critical + high > 0
            ? `Route ${urgent || critical + high} urgent/high items to available support capacity first`
            : 'Priority mix looks manageable — keep triage rules as-is',
          slowWeeksAdvice(input.weeklyFixTimes),
          input.topByFinish && input.topByVolume
            ? `Share handling practices from ${input.topByFinish.department} with higher-volume teams like ${input.topByVolume.department}`
            : input.topByFinish
              ? `Replicate what works in ${input.topByFinish.department} across other teams`
              : null,
          finishRateAdvice(rate, stillOpen),
        ],
        6,
      ),
    };
  }

  if (input.reportKind === 'operational') {
    return {
      keyFindings: compactLines(
        [
          input.serviceQuality?.verdict
            ? `${input.serviceQuality.verdict} — score ${input.serviceQuality.score}/100`
            : null,
          input.serviceQuality?.verdictSummary || null,
          `${input.totalTickets} requests measured · finish rate ${rate}% · typical fix ${input.typicalFixLabel}`,
          overdue > 0
            ? `${overdue} open 2 weeks+ · ${aging} aging 1–2 weeks`
            : aging > 0
              ? `${aging} aging 1–2 weeks · none overdue past 2 weeks`
              : 'No overdue (2 weeks+) tickets',
          urgent > 0
            ? `${urgent} open high/critical request${urgent === 1 ? '' : 's'}`
            : 'No open high/critical requests',
          weakTargets.length
            ? `Targets needing work: ${weakTargets
                .map((t) => `${t.title} at ${t.display} (target ${t.targetLabel || '—'})`)
                .join('; ')}`
            : 'All quality targets are in a healthy range',
          feedbackTotal > 0
            ? `Satisfaction ${input.customerSatisfaction}% · avg ${input.feedback?.averageRating ?? '—'}/5 from ${feedbackTotal} ratings`
            : 'No feedback ratings in this period',
        ],
        8,
      ),
      recommendations: compactLines(
        [
          ...weakTargets.map(
            (t) =>
              `Improve “${t.title}” — currently ${t.display}, target ${t.targetLabel || '—'}`,
          ),
          overdue > 0
            ? `Close ${overdue} overdue (2 weeks+) ticket${overdue === 1 ? '' : 's'} to lift the quality score`
            : null,
          finishRateAdvice(rate, stillOpen),
          fixTimeAdvice(input.avgResolutionHours || 0, input.typicalFixLabel),
          weakest
            ? `Coach ${weakest.department} first (${weakest.resolutionRate}% finish on ${weakest.totalTickets} requests)`
            : topNeed
              ? `Support ${topNeed.department} (${topNeed.stillOpen} open · ${topNeed.overdueOpen} overdue)`
              : null,
          feedbackTotal === 0
            ? 'Collect post-resolution ratings so the satisfaction target can be measured'
            : Number(input.feedback?.lowRatings || 0) > 0
              ? `Act on ${input.feedback?.lowRatings} low rating${(input.feedback?.lowRatings || 0) === 1 ? '' : 's'} and recent written comments`
              : `Keep satisfaction near ${input.customerSatisfaction}% by protecting response quality`,
          weakTargets.length === 0 && overdue === 0 && rate >= 80
            ? 'Targets are on track — brief leadership only on exceptions'
            : 'Flag slipping targets to leadership in the next ops review',
        ],
        7,
      ),
    };
  }

  if (input.reportKind === 'departmental') {
    const needsList = (input.team?.needsHelp || [])
      .slice(0, 3)
      .map(
        (t) =>
          `${t.department} (${t.stillOpen} open${t.overdueOpen ? ` · ${t.overdueOpen} overdue` : ''})`,
      );
    const healthyList = (input.team?.healthiest || [])
      .slice(0, 3)
      .map((t) => `${t.department} (${t.resolutionRate}%)`);
    const active = input.team?.activeTeams ?? 0;
    const all = input.team?.allTeams ?? 0;
    const needing = input.team?.needingHelp ?? 0;
    const healthyDept =
      topHealthy && 'department' in topHealthy ? topHealthy.department : '';
    const healthyRate =
      topHealthy && 'resolutionRate' in topHealthy ? topHealthy.resolutionRate : 0;
    const ratesGapNote =
      healthyDept && weakest && healthyDept !== weakest.department
        ? `Gap: ${healthyDept} at ${healthyRate}% vs ${weakest.department} at ${weakest.resolutionRate}%`
        : null;

    return {
      keyFindings: compactLines(
        [
          `${all} departments tracked · ${active} with activity · ${needing} needing help`,
          `${input.team?.totalOpen ?? stillOpen} still open across teams · ${overdue} open 2 weeks+`,
          topNeed
            ? `Most at risk: ${topNeed.department} (${topNeed.stillOpen} open · ${topNeed.overdueOpen} overdue)`
            : 'No teams currently flagged for help',
          healthyDept ? `Healthiest: ${healthyDept} (${healthyRate}% finish)` : null,
          ratesGapNote,
          input.topByVolume
            ? `Highest volume: ${input.topByVolume.department} (${input.topByVolume.total} requests)`
            : null,
          needsList.length ? `Needs help now: ${needsList.join('; ')}` : null,
        ],
        8,
      ),
      recommendations: compactLines(
        [
          healthyDept
            ? `Share practices from ${healthyDept}${
                healthyList.length > 1
                  ? ` (also strong: ${healthyList.slice(1).join(', ')})`
                  : ''
              }`
            : null,
          topNeed
            ? `Give extra support to ${topNeed.department} this week — ${topNeed.stillOpen} open and ${topNeed.overdueOpen} overdue 2w+`
            : needing > 0
              ? `Support the ${needing} team${needing === 1 ? '' : 's'} marked as needing help`
              : 'No team is in the needs-help list — keep monitoring finish rates',
          overdue > 0
            ? `Drive down ${overdue} team overdue ticket${overdue === 1 ? '' : 's'} (open 2 weeks+)`
            : null,
          input.topByVolume
            ? `Check staffing on ${input.topByVolume.department} — highest volume at ${input.topByVolume.total} requests`
            : null,
          weakest && (!topNeed || weakest.department !== topNeed.department)
            ? `Improve finish rate in ${weakest.department} (currently ${weakest.resolutionRate}%)`
            : null,
          'Review these named team results in the next operations meeting',
        ],
        6,
      ),
    };
  }

  // Full overview (dashboard)
  return {
    keyFindings: compactLines(
      [
        ...commonFindings,
        input.serviceQuality?.verdict
          ? `Service quality: ${input.serviceQuality.verdict} · ${input.serviceQuality.score}/100`
          : null,
        feedbackTotal > 0
          ? `Satisfaction ${input.customerSatisfaction}% from ${feedbackTotal} ratings (avg ${input.feedback?.averageRating ?? '—'}/5)${
              Number(input.feedback?.lowRatings || 0) > 0
                ? ` · ${input.feedback?.lowRatings} low (≤2★)`
                : ''
            }`
          : 'No feedback ratings in this period',
        input.team
          ? `${input.team.allTeams ?? 0} teams tracked · ${input.team.needingHelp ?? 0} needing help · strongest: ${
              topHealthy && 'department' in topHealthy
                ? `${topHealthy.department} (${topHealthy.resolutionRate}%)`
                : 'N/A'
            }`
          : null,
        weakTargets.length
          ? `Weak targets: ${weakTargets.map((t) => `${t.title} (${t.display})`).join(', ')}`
          : null,
        topNeed
          ? `Team focus: ${topNeed.department} has ${topNeed.stillOpen} open (${topNeed.overdueOpen} overdue)`
          : null,
      ],
      8,
    ),
    recommendations: compactLines(
      [
        ...commonRecs,
        topNeed
          ? `Stand up extra help for ${topNeed.department} (${topNeed.stillOpen} open · ${topNeed.overdueOpen} overdue)`
          : null,
        topHealthy &&
        input.topByVolume &&
        'department' in topHealthy &&
        topHealthy.department !== input.topByVolume.department
          ? `Copy what works in ${topHealthy.department} into higher-volume ${input.topByVolume.department}`
          : topHealthy && 'department' in topHealthy
            ? `Protect and share practices from ${topHealthy.department}`
            : null,
        ...weakTargets.slice(0, 2).map(
          (t) =>
            `Lift “${t.title}” from ${t.display} toward ${t.targetLabel || 'target'}`,
        ),
        feedbackTotal === 0
          ? 'Encourage users to rate completed requests so service quality stays measurable'
          : Number(input.feedback?.lowRatings || 0) > 0
            ? `Read recent comments and the ${input.feedback?.lowRatings} low rating${(input.feedback?.lowRatings || 0) === 1 ? '' : 's'} for recurring themes`
            : `Satisfaction is ${input.customerSatisfaction}% — keep reinforcing what users praise`,
        peakVolumeDay(input.dailyTrends),
        slowWeeksAdvice(input.weeklyFixTimes),
      ],
      7,
    ),
  };
}
