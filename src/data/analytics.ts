import { FranchiseStore } from '../types/franchise';

export const WEEKS = 12;

export function weekLabels(n = WEEKS): string[] {
  const end = new Date('2026-11-02T00:00:00');
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 7 * 86400000);
    out.push(`${d.getDate()} ${mon[d.getMonth()]}`);
  }
  return out;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000;
  return h / 100;
}

/** Series of length n whose last value is exactly `cur`. History is modelled from the current value. */
export function modelSeries(cur: number, slope: number, amp: number, seed: string, n = WEEKS, rel = false): number[] {
  const ph = hash(seed);
  const wave = (w: number) => Math.sin(w * 0.85 + ph) + 0.5 * Math.cos(w * 0.37 + ph * 2);
  const out: number[] = [];
  for (let w = 0; w < n; w++) {
    const d = slope * (w - (n - 1)) + amp * (wave(w) - wave(n - 1));
    out.push(rel ? cur * (1 + d) : cur + d);
  }
  return out;
}

export interface Rollup {
  count: number;
  revenue: number;
  avgRisk: number;
  compliantRate: number;
  csat: number;
  ticket: number;
  waste: number;
  turnover: number;
  negReviews: number;
  violations: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  revenueChange: number;
}

export function rollup(stores: FranchiseStore[]): Rollup {
  const n = Math.max(1, stores.length);
  const sum = (f: (s: FranchiseStore) => number) => stores.reduce((a, s) => a + f(s), 0);
  const level = (l: string) => stores.filter((s) => s.riskLevel === l).length;
  const revenue = sum((s) => s.posMetrics.weeklyRevenue);
  return {
    count: stores.length,
    revenue,
    avgRisk: sum((s) => s.riskScore) / n,
    compliantRate: (stores.filter((s) => s.riskLevel === 'low' || s.riskLevel === 'medium').length / n) * 100,
    csat: sum((s) => s.posMetrics.customerSatisfactionScore) / n,
    ticket: sum((s) => s.posMetrics.avgTicketTimeSec) / n,
    waste: sum((s) => s.posMetrics.wastePercentage) / n,
    turnover: sum((s) => s.posMetrics.staffTurnoverRate) / n,
    negReviews: sum((s) => s.negativeReviewsCount30d),
    violations: sum((s) => s.recentViolationsCount),
    critical: level('critical'),
    high: level('high'),
    medium: level('medium'),
    low: level('low'),
    revenueChange: sum((s) => s.posMetrics.revenueChangePct) / n,
  };
}

export const REGIONS = ['Central', 'East', 'North', 'Metro', 'West', 'South'] as const;
export const REGION_LABEL: Record<string, string> = {
  Central: 'Central (Lucknow)',
  East: 'East (Gorakhpur)',
  North: 'North',
  Metro: 'Metro',
  West: 'West',
  South: 'South',
};

export function groupBy<T>(items: T[], key: (t: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const it of items) (out[key(it)] ||= []).push(it);
  return out;
}

/** Weekly revenue for a set of stores over the last n weeks (modelled from current weekly revenue). */
export function revenueSeries(stores: FranchiseStore[], seed: string, n = WEEKS): number[] {
  const total = stores.reduce((a, s) => a + s.posMetrics.weeklyRevenue, 0);
  return modelSeries(1, 0.011, 0.028, seed, n, true).map((f) => total * f);
}
