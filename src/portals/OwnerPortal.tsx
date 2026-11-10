import React, { useMemo, useState } from 'react';
import { Gauge, LayoutDashboard, TrendingUp, ShieldCheck } from 'lucide-react';
import { FranchiseStore, SystemicPattern } from '../types/franchise';
import { Session } from '../lib/auth';
import { Shell, NavItem } from '../components/Shell';
import { Card, Kpi, Segmented, Select } from '../components/ui';
import { Columns, Donut, HBars, LineChart, PALETTE, RISK_COLORS, Scatter } from '../components/charts';
import { groupBy, REGIONS, REGION_LABEL, revenueSeries, rollup, modelSeries, weekLabels } from '../data/analytics';
import { inr, num, pct, secToMin } from '../lib/format';

const NAV: NavItem[] = [
  { id: 'overview', label: 'Executive overview', icon: LayoutDashboard },
  { id: 'revenue', label: 'Revenue & sales', icon: TrendingUp },
  { id: 'compliance', label: 'Compliance & risk', icon: ShieldCheck },
  { id: 'operations', label: 'Customers & operations', icon: Gauge },
];

const TITLES: Record<string, [string, string]> = {
  overview: ['Executive overview', 'How the whole network is performing this week.'],
  revenue: ['Revenue & sales', 'Where the money is made and where it is slipping.'],
  compliance: ['Compliance & risk', 'Standards, risk exposure and what is being fixed.'],
  operations: ['Customers & operations', 'Satisfaction, speed of service, waste and staffing.'],
};

export const OwnerPortal: React.FC<{
  session: Session;
  stores: FranchiseStore[];
  patterns: SystemicPattern[];
  onLogout: () => void;
}> = ({ session, stores, patterns, onLogout }) => {
  const [page, setPage] = useState('overview');
  const [region, setRegion] = useState('All');
  const [range, setRange] = useState('12');

  const scoped = useMemo(() => (region === 'All' ? stores : stores.filter((s) => s.location.region === region)), [stores, region]);
  const R = useMemo(() => rollup(scoped), [scoped]);
  const weeks = Number(range);
  const labels = useMemo(() => weekLabels(weeks), [weeks]);
  const seed = region;

  const revSeries = useMemo(() => revenueSeries(scoped, seed, weeks), [scoped, seed, weeks]);
  const compSeries = useMemo(() => modelSeries(R.compliantRate, 0.35, 0.8, seed + 'c', weeks).map((v) => Math.min(100, v)), [R.compliantRate, seed, weeks]);
  const csatSeries = useMemo(() => modelSeries(R.csat, 0.25, 0.6, seed + 's', weeks), [R.csat, seed, weeks]);
  const ticketSeries = useMemo(() => modelSeries(R.ticket, -0.8, 1.6, seed + 't', weeks), [R.ticket, seed, weeks]);

  const delta4 = (a: number[]) => {
    const i = a.length - 1;
    const j = Math.max(0, i - 4);
    return a[j] ? ((a[i] - a[j]) / a[j]) * 100 : 0;
  };
  const deltaPts = (a: number[]) => a[a.length - 1] - a[Math.max(0, a.length - 5)];

  const byRegion = useMemo(() => groupBy(scoped, (s) => s.location.region), [scoped]);
  const regionKeys = REGIONS.filter((r) => byRegion[r]);
  const regionRollups = regionKeys.map((r) => ({ r, ...rollup(byRegion[r]) }));
  const regionShort = regionKeys.map((r) => r);

  const byCity = useMemo(() => {
    const g = groupBy(scoped, (s) => s.location.city);
    return Object.entries(g)
      .map(([city, list]) => ({ city, ...rollup(list) }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [scoped]);

  const top10 = useMemo(() => [...scoped].sort((a, b) => b.posMetrics.weeklyRevenue - a.posMetrics.weeklyRevenue).slice(0, 8), [scoped]);
  const growth = useMemo(() => {
    const bins = [
      { l: '< -10%', f: (v: number) => v < -10 },
      { l: '-10 to -5%', f: (v: number) => v >= -10 && v < -5 },
      { l: '-5 to 0%', f: (v: number) => v >= -5 && v < 0 },
      { l: '0 to 3%', f: (v: number) => v >= 0 && v < 3 },
      { l: '3 to 6%', f: (v: number) => v >= 3 && v < 6 },
      { l: '> 6%', f: (v: number) => v >= 6 },
    ];
    return bins.map((b) => ({ l: b.l, v: scoped.filter((s) => b.f(s.posMetrics.revenueChangePct)).length }));
  }, [scoped]);

  const regionRevSeries = useMemo(
    () => regionKeys.map((r, i) => ({ name: r, color: PALETTE[i % PALETTE.length], values: revenueSeries(byRegion[r], r, weeks) })),
    [regionKeys.join(','), byRegion, weeks]
  );

  const scatterRisk = useMemo(
    () => scoped.map((s) => ({ x: s.riskScore, y: s.posMetrics.customerSatisfactionScore, label: `Store #${s.storeNumber} · ${s.location.city}`, color: RISK_COLORS[s.riskLevel] })),
    [scoped]
  );
  const scatterOps = useMemo(
    () => scoped.map((s) => ({ x: s.posMetrics.avgTicketTimeSec, y: s.posMetrics.customerSatisfactionScore, label: `Store #${s.storeNumber} · ${s.location.city}`, color: PALETTE[4] })),
    [scoped]
  );

  const [title, sub] = TITLES[page];
  const filters = (
    <>
      <Select
        value={region}
        onChange={setRegion}
        options={[{ value: 'All', label: 'All regions' }, ...REGIONS.map((r) => ({ value: r, label: REGION_LABEL[r] }))]}
      />
      <Segmented value={range} onChange={setRange} options={[{ value: '4', label: '4W' }, { value: '8', label: '8W' }, { value: '12', label: '12W' }]} />
    </>
  );

  const riskItems = (['critical', 'high', 'medium', 'low'] as const).map((l) => ({
    label: l[0].toUpperCase() + l.slice(1),
    value: R[l],
    color: RISK_COLORS[l],
  }));

  return (
    <Shell session={session} nav={NAV} active={page} onNavigate={setPage} onLogout={onLogout} title={title} subtitle={`${sub} Showing ${num(R.count)} stores${region === 'All' ? '' : ` in ${REGION_LABEL[region]}`}.`} actions={filters}>
      {page === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Kpi label="Weekly revenue" value={inr(R.revenue)} delta={delta4(revSeries)} spark={revSeries} color={PALETTE[0]} />
            <Kpi label="Compliant stores" value={pct(R.compliantRate, 0)} delta={deltaPts(compSeries)} deltaSuffix=" pts" spark={compSeries} color={PALETTE[1]} />
            <Kpi label="Customer satisfaction" value={`${R.csat.toFixed(1)} / 100`} delta={deltaPts(csatSeries)} deltaSuffix=" pts" spark={csatSeries} color={PALETTE[4]} />
            <Kpi label="Avg service time" value={secToMin(R.ticket)} delta={delta4(ticketSeries)} goodWhenUp={false} spark={ticketSeries} color={PALETTE[2]} />
            <Kpi label="High and critical stores" value={num(R.high + R.critical)} hint={`${R.critical} critical · ${R.high} high`} />
            <Kpi label="Negative reviews, 30 days" value={num(R.negReviews)} hint={`${R.violations} AI-detected violations`} />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card className="xl:col-span-2" title="Weekly revenue" subtitle="Network total, per week">
              <LineChart labels={labels} series={[{ name: 'Revenue', color: PALETTE[0], values: revSeries }]} fmt={inr} fill />
            </Card>
            <Card title="Risk distribution" subtitle="Stores by current risk level">
              <Donut items={riskItems} centerLabel="stores" fmt={num} />
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card title="Revenue by region" subtitle="Weekly revenue, current week">
              <Columns labels={regionShort} series={[{ name: 'Revenue', color: PALETTE[0], values: regionRollups.map((r) => r.revenue) }]} fmt={inr} />
            </Card>
            <Card title="Compliant stores over time" subtitle="Share of stores rated low or medium risk">
              <LineChart labels={labels} series={[{ name: 'Compliant stores', color: PALETTE[1], values: compSeries }]} fmt={(n) => pct(n)} fmtAxis={(n) => `${Math.round(n)}%`} refLine={{ value: 95, label: 'Brand target 95%' }} />
            </Card>
          </div>
        </div>
      )}

      {page === 'revenue' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Weekly revenue" value={inr(R.revenue)} delta={delta4(revSeries)} spark={revSeries} color={PALETTE[0]} />
            <Kpi label="Avg revenue per store" value={inr(R.revenue / Math.max(1, R.count))} hint="Per week" />
            <Kpi label="Average growth" value={`${R.revenueChange >= 0 ? '+' : ''}${R.revenueChange.toFixed(1)}%`} hint="Week on week, store average" />
            <Kpi label="Stores in decline" value={num(scoped.filter((s) => s.posMetrics.revenueChangePct < 0).length)} hint="Negative revenue change" />
          </div>
          <Card title="Revenue by region over time" subtitle="Weekly revenue per region">
            <LineChart labels={labels} series={regionRevSeries} fmt={inr} height={300} />
          </Card>
          <div className="grid gap-5 xl:grid-cols-2">
            <Card title="Top stores by weekly revenue" subtitle="Eight highest earners">
              <HBars items={top10.map((s) => ({ label: `#${s.storeNumber} ${s.location.city}`, sub: s.name.split(' - ')[1], value: s.posMetrics.weeklyRevenue }))} fmt={inr} />
            </Card>
            <Card title="How stores are growing" subtitle="Number of stores by weekly revenue change">
              <Columns labels={growth.map((g) => g.l)} series={[{ name: 'Stores', color: PALETTE[0], values: growth.map((g) => g.v) }]} fmt={num} />
            </Card>
          </div>
          <Card title="City leaderboard" subtitle="Ranked by weekly revenue" bodyClassName="overflow-x-auto fg-scroll">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4E8F1] text-[#6B7488]">
                  <th className="py-2 font-semibold">City</th>
                  <th className="py-2 text-right font-semibold">Stores</th>
                  <th className="py-2 text-right font-semibold">Weekly revenue</th>
                  <th className="py-2 text-right font-semibold">Per store</th>
                  <th className="py-2 text-right font-semibold">Satisfaction</th>
                  <th className="py-2 text-right font-semibold">Compliant</th>
                </tr>
              </thead>
              <tbody>
                {byCity.slice(0, 10).map((c) => (
                  <tr key={c.city} className="border-b border-[#F0F2F8] last:border-0">
                    <td className="py-2.5 font-bold text-[#0E1630]">{c.city}</td>
                    <td className="py-2.5 text-right">{c.count}</td>
                    <td className="py-2.5 text-right font-semibold">{inr(c.revenue)}</td>
                    <td className="py-2.5 text-right">{inr(c.revenue / c.count)}</td>
                    <td className="py-2.5 text-right">{c.csat.toFixed(1)}</td>
                    <td className="py-2.5 text-right">{pct(c.compliantRate, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {page === 'compliance' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Compliant stores" value={pct(R.compliantRate, 0)} delta={deltaPts(compSeries)} deltaSuffix=" pts" spark={compSeries} color={PALETTE[1]} />
            <Kpi label="Average risk score" value={R.avgRisk.toFixed(1)} hint="Lower is better, out of 100" />
            <Kpi label="Critical stores" value={num(R.critical)} hint="Need immediate review" />
            <Kpi label="AI-detected violations" value={num(R.violations)} hint="Open across selected stores" />
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            <Card className="xl:col-span-2" title="Risk levels by region" subtitle="Number of stores in each level">
              <Columns
                labels={regionShort}
                stacked
                series={(['low', 'medium', 'high', 'critical'] as const).map((l) => ({
                  name: l[0].toUpperCase() + l.slice(1),
                  color: RISK_COLORS[l],
                  values: regionRollups.map((r) => r[l]),
                }))}
                fmt={num}
              />
            </Card>
            <Card title="Risk distribution" subtitle="All selected stores">
              <Donut items={riskItems} centerLabel="stores" fmt={num} />
            </Card>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <Card title="Risk score vs customer satisfaction" subtitle="Each dot is one store, coloured by risk level">
              <Scatter points={scatterRisk} xTitle="Risk score" yTitle="Satisfaction" />
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-[#4A5368]">
                {riskItems.map((i) => (
                  <span key={i.label} className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: i.color }} /> {i.label}
                  </span>
                ))}
              </div>
            </Card>
            <Card title="Network-wide issues" subtitle="Stores affected by each cross-location pattern">
              <HBars
                items={patterns.map((p, i) => ({ label: p.title.split('(')[0].trim(), sub: `${p.severity} · ${p.status}`, value: p.affectedStoresCount, color: PALETTE[i % PALETTE.length] }))}
                fmt={(n) => `${n} stores`}
              />
            </Card>
          </div>
          <Card title="AI-detected violations by region" subtitle="Open violations in the latest evidence">
            <Columns labels={regionShort} series={[{ name: 'Violations', color: RISK_COLORS.high, values: regionRollups.map((r) => r.violations) }]} fmt={num} height={220} />
          </Card>
        </div>
      )}

      {page === 'operations' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Customer satisfaction" value={`${R.csat.toFixed(1)} / 100`} delta={deltaPts(csatSeries)} deltaSuffix=" pts" spark={csatSeries} color={PALETTE[4]} />
            <Kpi label="Avg service time" value={secToMin(R.ticket)} delta={delta4(ticketSeries)} goodWhenUp={false} spark={ticketSeries} color={PALETTE[2]} />
            <Kpi label="Food waste" value={pct(R.waste)} hint="Share of food cost" />
            <Kpi label="Staff turnover" value={pct(R.turnover, 0)} hint="Quarterly, store average" />
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <Card title="Satisfaction by region" subtitle="Average score out of 100">
              <Columns labels={regionShort} series={[{ name: 'Satisfaction', color: PALETTE[4], values: regionRollups.map((r) => r.csat) }]} fmt={(n) => n.toFixed(1)} />
            </Card>
            <Card title="Negative reviews by region" subtitle="Last 30 days">
              <Columns labels={regionShort} series={[{ name: 'Negative reviews', color: PALETTE[3], values: regionRollups.map((r) => r.negReviews) }]} fmt={num} />
            </Card>
            <Card title="Service time by region" subtitle="Average, in seconds">
              <Columns labels={regionShort} series={[{ name: 'Service time', color: PALETTE[2], values: regionRollups.map((r) => r.ticket) }]} fmt={(n) => secToMin(n)} fmtAxis={(n) => `${Math.round(n)}s`} />
            </Card>
            <Card title="Food waste and staff turnover" subtitle="Average per region">
              <Columns
                labels={regionShort}
                series={[
                  { name: 'Food waste %', color: PALETTE[1], values: regionRollups.map((r) => r.waste) },
                  { name: 'Staff turnover % (quarterly)', color: PALETTE[5], values: regionRollups.map((r) => r.turnover) },
                ]}
                fmt={(n) => `${n.toFixed(1)}%`}
                fmtAxis={(n) => `${Math.round(n)}%`}
              />
            </Card>
          </div>
          <Card title="Service time vs satisfaction" subtitle="Slower stores tend to score lower. Each dot is one store.">
            <Scatter points={scatterOps} xTitle="Avg service time (s)" yTitle="Satisfaction" fmtX={(n) => `${Math.round(n)}s`} />
          </Card>
        </div>
      )}
      <p className="mt-8 text-center text-[11px] text-[#8A93A8]">Demo dataset. Weekly history is modelled from each store's current metrics.</p>
    </Shell>
  );
};
