import React, { useEffect, useRef, useState } from 'react';

/** Categorical order is fixed: a series keeps its colour wherever it appears. */
export const PALETTE = ['#3B4BD8', '#0E9F8E', '#CC8F00', '#D6456B', '#2F9BE0', '#8A5CD6'];
export const RISK_COLORS: Record<string, string> = {
  low: '#1E9E6A',
  medium: '#CC8F00',
  high: '#E8702A',
  critical: '#D6304A',
};
const INK = '#0E1630';
const MUTED = '#6B7488';
const GRID = '#E7EAF2';

export function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth || 600);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => setW(Math.round(entries[0].contentRect.width) || 600));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Left margin wide enough for the longest axis label. */
const leftFor = (labels: string[]) => Math.max(40, Math.max(...labels.map((l) => l.length)) * 6.8 + 14);

export function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return m * p;
}

function Tip({ x, y, w, children }: { x: number; y: number; w: number; children: React.ReactNode }) {
  const flip = x > w * 0.6;
  return (
    <div
      className="pointer-events-none absolute z-20 rounded-lg border border-[#E4E8F1] bg-white px-3 py-2 text-xs shadow-lg"
      style={{ left: x, top: y, transform: flip ? 'translate(calc(-100% - 12px), -50%)' : 'translate(12px, -50%)', minWidth: 120 }}
    >
      {children}
    </div>
  );
}

export function Legend({ items }: { items: { name: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4A5368]">
      {items.map((it) => (
        <span key={it.name} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: it.color }} />
          {it.name}
        </span>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- Sparkline */
export function Sparkline({ values, color = PALETTE[0], w = 96, h = 32 }: { values: number[]; color?: string; w?: number; h?: number }) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 6) + 3, h - 4 - ((v - lo) / span) * (h - 8)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} role="img" aria-label="Trend sparkline">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={3} fill={color} stroke="#fff" strokeWidth={2} />
    </svg>
  );
}

/* ---------------------------------------------------------------- Line chart */
export interface LineSeries {
  name: string;
  color: string;
  values: number[];
  dashed?: boolean;
}

export function LineChart({
  labels,
  series,
  height = 260,
  fmt = (n: number) => String(Math.round(n)),
  fmtAxis,
  yMin,
  yMax,
  refLine,
  fill = false,
}: {
  labels: string[];
  series: LineSeries[];
  height?: number;
  fmt?: (n: number) => string;
  fmtAxis?: (n: number) => string;
  yMin?: number;
  yMax?: number;
  refLine?: { value: number; label: string };
  fill?: boolean;
}) {
  const [wrap, w] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const all = series.flatMap((s) => s.values).concat(refLine ? [refLine.value] : []);
  let lo = yMin ?? Math.min(...all);
  let hi = yMax ?? Math.max(...all);
  if (yMin === undefined || yMax === undefined) {
    const pad = (hi - lo || Math.abs(hi) || 1) * 0.15;
    if (yMin === undefined) lo -= pad;
    if (yMax === undefined) hi += pad;
  }
  const span = hi - lo || 1;
  const faLabel = fmtAxis || fmt;
  const m = { l: leftFor([0, 1, 2, 3, 4].map((k) => faLabel(lo + (span * k) / 4))), r: 16, t: 10, b: 28 };
  const iw = Math.max(50, w - m.l - m.r);
  const ih = height - m.t - m.b;
  const n = labels.length;
  const X = (i: number) => m.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const Y = (v: number) => m.t + ih - ((v - lo) / span) * ih;
  const ticks = [0, 1, 2, 3, 4].map((k) => lo + (span * k) / 4);
  const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 70))));
  const fa = fmtAxis || fmt;

  return (
    <div>
      {series.length > 1 && <Legend items={series} />}
      <div ref={wrap} className="relative" style={{ height }}>
        <svg width={w} height={height} role="img" aria-label="Line chart">
          <defs>
            <linearGradient id={`lg-${series[0]?.color.slice(1)}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={series[0]?.color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={series[0]?.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={m.l} x2={w - m.r} y1={Y(t)} y2={Y(t)} stroke={GRID} strokeWidth={1} />
              <text x={m.l - 8} y={Y(t) + 4} textAnchor="end" fontSize={11} fill={MUTED}>{fa(t)}</text>
            </g>
          ))}
          {labels.map((l, i) =>
            i % step === 0 || i === n - 1 ? (
              <text key={i} x={X(i)} y={height - 8} textAnchor="middle" fontSize={11} fill={MUTED}>{l}</text>
            ) : null
          )}
          {refLine && (
            <g>
              <line x1={m.l} x2={w - m.r} y1={Y(refLine.value)} y2={Y(refLine.value)} stroke="#9AA3B8" strokeDasharray="5 4" />
              <text x={w - m.r} y={Y(refLine.value) - 5} textAnchor="end" fontSize={11} fill={MUTED}>{refLine.label}</text>
            </g>
          )}
          {fill && series.length === 1 && (
            <path
              d={`M${X(0)},${Y(series[0].values[0])} ${series[0].values.map((v, i) => `L${X(i)},${Y(v)}`).join(' ')} L${X(n - 1)},${m.t + ih} L${X(0)},${m.t + ih} Z`}
              fill={`url(#lg-${series[0].color.slice(1)})`}
            />
          )}
          {series.map((s) => (
            <path
              key={s.name}
              d={s.values.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? '6 4' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {series.map((s) => (
            <circle key={s.name + 'end'} cx={X(n - 1)} cy={Y(s.values[n - 1])} r={4} fill={s.color} stroke="#fff" strokeWidth={2} />
          ))}
          {hover !== null && (
            <g>
              <line x1={X(hover)} x2={X(hover)} y1={m.t} y2={m.t + ih} stroke="#9AA3B8" strokeWidth={1} />
              {series.map((s) => (
                <circle key={s.name} cx={X(hover)} cy={Y(s.values[hover])} r={4.5} fill={s.color} stroke="#fff" strokeWidth={2} />
              ))}
            </g>
          )}
          <rect
            x={m.l}
            y={m.t}
            width={iw}
            height={ih}
            fill="transparent"
            onMouseMove={(e) => {
              const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
              const px = e.clientX - box.left - m.l;
              setHover(Math.max(0, Math.min(n - 1, Math.round((px / iw) * (n - 1)))));
            }}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
        {hover !== null && (
          <Tip x={X(hover)} y={m.t + ih / 2} w={w}>
            <div className="mb-1 font-semibold" style={{ color: INK }}>{labels[hover]}</div>
            {series.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-4 text-[#4A5368]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-semibold" style={{ color: INK }}>{fmt(s.values[hover])}</span>
              </div>
            ))}
          </Tip>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Columns (single, grouped by stack) */
export function Columns({
  labels,
  series,
  stacked = false,
  height = 240,
  fmt = (n: number) => String(Math.round(n)),
  fmtAxis,
  showValues = true,
}: {
  labels: string[];
  series: { name: string; color: string; values: number[] }[];
  stacked?: boolean;
  height?: number;
  fmt?: (n: number) => string;
  fmtAxis?: (n: number) => string;
  showValues?: boolean;
}) {
  const [wrap, w] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const n = labels.length;
  const totals = labels.map((_, i) => series.reduce((a, s) => a + s.values[i], 0));
  const maxV = niceMax(stacked ? Math.max(...totals) : Math.max(...series.flatMap((s) => s.values)));
  const m = { l: leftFor([0, 1, 2, 3, 4].map((k) => (fmtAxis || fmt)((maxV * k) / 4))), r: 10, t: 14, b: 28 };
  const iw = Math.max(50, w - m.l - m.r);
  const ih = height - m.t - m.b;
  const Y = (v: number) => m.t + ih - (v / maxV) * ih;
  const band = iw / n;
  const bw = Math.min(46, band * 0.62);
  const fa = fmtAxis || fmt;
  const single = series.length === 1;

  return (
    <div>
      {series.length > 1 && <Legend items={series} />}
      <div ref={wrap} className="relative" style={{ height }}>
        <svg width={w} height={height} role="img" aria-label="Column chart">
          {[0, 1, 2, 3, 4].map((k) => {
            const t = (maxV * k) / 4;
            return (
              <g key={k}>
                <line x1={m.l} x2={w - m.r} y1={Y(t)} y2={Y(t)} stroke={GRID} />
                <text x={m.l - 8} y={Y(t) + 4} textAnchor="end" fontSize={11} fill={MUTED}>{fa(t)}</text>
              </g>
            );
          })}
          {labels.map((l, i) => {
            const cx = m.l + band * i + band / 2;
            const groupW = stacked || single ? bw : Math.min(bw * 1.6, band * 0.8);
            const sw = stacked ? bw : groupW / series.length;
            let acc = 0;
            return (
              <g key={l} opacity={hover === null || hover === i ? 1 : 0.55}>
                <text x={cx} y={height - 8} textAnchor="middle" fontSize={11} fill={MUTED}>{l}</text>
                {series.map((s, si) => {
                  const v = s.values[i];
                  if (stacked) {
                    const y0 = Y(acc);
                    acc += v;
                    const y1 = Y(acc);
                    return <rect key={s.name} x={cx - bw / 2} y={y1} width={bw} height={Math.max(0, y0 - y1)} fill={s.color} stroke="#fff" strokeWidth={1.5} />;
                  }
                  const x = cx - groupW / 2 + si * sw + (series.length > 1 ? 1 : 0);
                  const h = (v / maxV) * ih;
                  const r = Math.min(4, sw / 2, h);
                  const wd = sw - (series.length > 1 ? 2 : 0);
                  return (
                    <path
                      key={s.name}
                      d={`M${x},${m.t + ih} V${m.t + ih - h + r} Q${x},${m.t + ih - h} ${x + r},${m.t + ih - h} H${x + wd - r} Q${x + wd},${m.t + ih - h} ${x + wd},${m.t + ih - h + r} V${m.t + ih} Z`}
                      fill={s.color}
                    />
                  );
                })}
                {showValues && single && n <= 8 && (
                  <text x={cx} y={Y(series[0].values[i]) - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill={INK}>{fmt(series[0].values[i])}</text>
                )}
                <rect x={m.l + band * i} y={m.t} width={band} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <Tip x={m.l + band * hover + band / 2} y={m.t + ih / 3} w={w}>
            <div className="mb-1 font-semibold" style={{ color: INK }}>{labels[hover]}</div>
            {series.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-4 text-[#4A5368]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-sm" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-semibold" style={{ color: INK }}>{fmt(s.values[hover])}</span>
              </div>
            ))}
            {stacked && series.length > 1 && (
              <div className="mt-1 flex justify-between border-t border-[#E4E8F1] pt-1 text-[#4A5368]">
                <span>Total</span>
                <span className="font-semibold" style={{ color: INK }}>{fmt(totals[hover])}</span>
              </div>
            )}
          </Tip>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Horizontal bars (HTML) */
export function HBars({
  items,
  fmt = (n: number) => String(Math.round(n)),
  color = PALETTE[0],
  onClick,
}: {
  items: { label: string; sub?: string; value: number; color?: string; id?: number }[];
  fmt?: (n: number) => string;
  color?: string;
  onClick?: (id: number) => void;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div
          key={it.label}
          style={{ gridTemplateColumns: 'minmax(90px,170px) 1fr 80px' }}
          className={`grid items-center gap-3 text-xs ${onClick && it.id !== undefined ? 'cursor-pointer hover:opacity-80' : ''}`}
          onClick={() => onClick && it.id !== undefined && onClick(it.id)}
        >
          <div className="min-w-0">
            <div className="truncate font-semibold text-[#0E1630]">{it.label}</div>
            {it.sub && <div className="truncate text-[11px] text-[#6B7488]">{it.sub}</div>}
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF1F7]">
            <div className="h-full rounded-full" style={{ width: `${(it.value / max) * 100}%`, background: it.color || color }} />
          </div>
          <div className="text-right font-semibold text-[#0E1630]">{fmt(it.value)}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- Donut */
export function Donut({
  items,
  size = 180,
  centerLabel,
  fmt = (n: number) => String(Math.round(n)),
}: {
  items: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel: string;
  fmt?: (n: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = items.reduce((a, i) => a + i.value, 0) || 1;
  const r = size / 2 - 14;
  const c = size / 2;
  let ang = -Math.PI / 2;
  const arcs = items.map((it) => {
    const a0 = ang;
    const a1 = ang + (it.value / total) * Math.PI * 2;
    ang = a1;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const full = it.value / total > 0.9999;
    const p = (a: number, rr: number) => `${(c + rr * Math.cos(a)).toFixed(2)},${(c + rr * Math.sin(a)).toFixed(2)}`;
    const d = full
      ? `M${p(0, r)} A${r},${r} 0 1 1 ${p(Math.PI, r)} A${r},${r} 0 1 1 ${p(0, r)}`
      : `M${p(a0, r)} A${r},${r} 0 ${large} 1 ${p(a1, r)}`;
    return { d, ...it };
  });
  const active = hover !== null ? items[hover] : null;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label="Donut chart">
          <circle cx={c} cy={c} r={r} fill="none" stroke="#EEF1F7" strokeWidth={18} />
          {arcs.map((a, i) =>
            a.value > 0 ? (
              <path
                key={a.label}
                d={a.d}
                fill="none"
                stroke={a.color}
                strokeWidth={hover === i ? 22 : 18}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ transition: 'stroke-width .15s' }}
              />
            ) : null
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="font-extrabold text-[#0E1630]" style={{ fontSize: size < 120 ? 15 : 24, lineHeight: 1.1 }}>{active ? fmt(active.value) : fmt(total)}</div>
          <div className="max-w-[90px] text-[#6B7488]" style={{ fontSize: size < 120 ? 9 : 11 }}>{active ? active.label : centerLabel}</div>
        </div>
      </div>
      <ul className="min-w-[150px] flex-1 space-y-2 text-xs">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center justify-between gap-3" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="inline-flex items-center gap-2 text-[#4A5368]">
              <span className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: it.color }} />
              {it.label}
            </span>
            <span className="font-semibold text-[#0E1630]">
              {fmt(it.value)} <span className="font-normal text-[#6B7488]">({((it.value / total) * 100).toFixed(0)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- Scatter */
export interface ScatterPoint {
  x: number;
  y: number;
  label: string;
  color: string;
}

export function Scatter({
  points,
  height = 280,
  xTitle,
  yTitle,
  fmtX = (n: number) => String(Math.round(n)),
  fmtY = (n: number) => String(Math.round(n)),
}: {
  points: ScatterPoint[];
  height?: number;
  xTitle: string;
  yTitle: string;
  fmtX?: (n: number) => string;
  fmtY?: (n: number) => string;
}) {
  const [wrap, w] = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xlo = Math.min(...xs), xhi = Math.max(...xs), ylo = Math.min(...ys), yhi = Math.max(...ys);
  const m = { l: leftFor([ylo, yhi].map(fmtY)) + 8, r: 14, t: 10, b: 40 };
  const iw = Math.max(50, w - m.l - m.r);
  const ih = height - m.t - m.b;
  const X = (v: number) => m.l + ((v - xlo) / (xhi - xlo || 1)) * iw;
  const Y = (v: number) => m.t + ih - ((v - ylo) / (yhi - ylo || 1)) * ih;
  return (
    <div ref={wrap} className="relative" style={{ height }}>
      <svg width={w} height={height} role="img" aria-label="Scatter plot">
        {[0, 1, 2, 3, 4].map((k) => {
          const vy = ylo + ((yhi - ylo) * k) / 4;
          const vx = xlo + ((xhi - xlo) * k) / 4;
          return (
            <g key={k}>
              <line x1={m.l} x2={w - m.r} y1={Y(vy)} y2={Y(vy)} stroke={GRID} />
              <text x={m.l - 8} y={Y(vy) + 4} textAnchor="end" fontSize={11} fill={MUTED}>{fmtY(vy)}</text>
              <text x={X(vx)} y={m.t + ih + 16} textAnchor="middle" fontSize={11} fill={MUTED}>{fmtX(vx)}</text>
            </g>
          );
        })}
        <text x={m.l + iw / 2} y={height - 4} textAnchor="middle" fontSize={11} fill={MUTED}>{xTitle}</text>
        <text transform={`translate(12 ${m.t + ih / 2}) rotate(-90)`} textAnchor="middle" fontSize={11} fill={MUTED}>{yTitle}</text>
        {points.map((p, i) => (
          <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={hover === i ? 6 : 3.5} fill={p.color} fillOpacity={0.7} stroke="#fff" strokeWidth={hover === i ? 2 : 0.8} />
        ))}
        <rect
          x={m.l}
          y={m.t}
          width={iw}
          height={ih}
          fill="transparent"
          onMouseMove={(e) => {
            const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
            const mx = e.clientX - box.left;
            const my = e.clientY - box.top;
            let best = -1, bd = 14 * 14;
            points.forEach((p, i) => {
              const d = (X(p.x) - mx) ** 2 + (Y(p.y) - my) ** 2;
              if (d < bd) { bd = d; best = i; }
            });
            setHover(best >= 0 ? best : null);
          }}
          onMouseLeave={() => setHover(null)}
        />
      </svg>
      {hover !== null && (
        <Tip x={X(points[hover].x)} y={Y(points[hover].y)} w={w}>
          <div className="font-semibold text-[#0E1630]">{points[hover].label}</div>
          <div className="text-[#4A5368]">{xTitle}: <b className="text-[#0E1630]">{fmtX(points[hover].x)}</b></div>
          <div className="text-[#4A5368]">{yTitle}: <b className="text-[#0E1630]">{fmtY(points[hover].y)}</b></div>
        </Tip>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Ring gauge */
export function Ring({ value, size = 120, color, label }: { value: number; size?: number; color: string; label: string }) {
  const r = size / 2 - 10;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${label} ${Math.round(v)} out of 100`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="#EEF1F7" strokeWidth={10} />
        <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${(v / 100) * circ} ${circ}`} transform={`rotate(-90 ${c} ${c})`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-[#0E1630]">{Math.round(v)}</span>
        <span className="text-[11px] text-[#6B7488]">{label}</span>
      </div>
    </div>
  );
}
