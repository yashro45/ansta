import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Sparkline } from './charts';

export const Card: React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, right, className = '', bodyClassName = '', children }) => (
  <section className={`fg-card ${className}`}>
    {(title || right) && (
      <header className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          {title && <h3 className="text-[15px] font-bold tracking-tight text-[#0E1630]">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-xs text-[#6B7488]">{subtitle}</p>}
        </div>
        {right}
      </header>
    )}
    <div className={`px-5 pb-5 ${title || right ? 'pt-4' : 'pt-5'} ${bodyClassName}`}>{children}</div>
  </section>
);

export const Kpi: React.FC<{
  label: string;
  value: string;
  delta?: number; // percentage points or %
  deltaSuffix?: string;
  goodWhenUp?: boolean;
  hint?: string;
  spark?: number[];
  color?: string;
}> = ({ label, value, delta, deltaSuffix = '%', goodWhenUp = true, hint, spark, color }) => {
  const up = (delta ?? 0) >= 0;
  const good = up === goodWhenUp;
  return (
    <div className="fg-card flex flex-col justify-between p-4">
      <div className="text-xs font-semibold text-[#6B7488]">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <div className="text-[26px] font-extrabold leading-none tracking-tight text-[#0E1630]">{value}</div>
          {delta !== undefined ? (
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${good ? 'text-[#13805A]' : 'text-[#C2253E]'}`}>
              {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(delta).toFixed(1)}
              {deltaSuffix}
              <span className="font-medium text-[#6B7488]">vs 4w ago</span>
            </div>
          ) : (
            hint && <div className="mt-2 text-xs text-[#6B7488]">{hint}</div>
          )}
        </div>
        {spark && <Sparkline values={spark} color={color} />}
      </div>
    </div>
  );
};

export const Pill: React.FC<{ tone: 'low' | 'medium' | 'high' | 'critical' | 'neutral' | 'info'; children: React.ReactNode }> = ({ tone, children }) => {
  const map: Record<string, string> = {
    low: 'bg-[#E3F5EC] text-[#13805A]',
    medium: 'bg-[#FFF3D6] text-[#8A5F00]',
    high: 'bg-[#FFE9DC] text-[#B4501A]',
    critical: 'bg-[#FDE3E7] text-[#C2253E]',
    neutral: 'bg-[#EEF1F7] text-[#4A5368]',
    info: 'bg-[#E9ECFF] text-[#3A41B8]',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${map[tone]}`}>{children}</span>;
};

export const Segmented: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}> = ({ value, onChange, options }) => (
  <div className="inline-flex rounded-xl bg-[#E9EDF5] p-1">
    {options.map((o) => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${value === o.value ? 'bg-white text-[#0E1630] shadow-sm' : 'text-[#5B6478] hover:text-[#0E1630]'}`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export const Select: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label?: string;
}> = ({ value, onChange, options, label }) => (
  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#5B6478]">
    {label}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-[#DDE2EE] bg-white px-3 py-2 text-xs font-bold text-[#0E1630] focus:border-[#4650D6] focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </label>
);

export const Empty: React.FC<{ icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }> = ({ icon, title, text, action }) => (
  <div className="fg-card flex flex-col items-center px-6 py-12 text-center">
    <div className="mb-3 text-[#9AA3B8]">{icon}</div>
    <h3 className="text-sm font-bold text-[#0E1630]">{title}</h3>
    <p className="mt-1 max-w-sm text-xs text-[#6B7488]">{text}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Toast: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 animate-fadeIn rounded-xl bg-[#0B1226] px-4 py-3 text-xs font-semibold text-white shadow-2xl" role="status">
      {message}
    </div>
  ) : null;

export const riskTone = (l: string): 'low' | 'medium' | 'high' | 'critical' =>
  l === 'critical' ? 'critical' : l === 'high' ? 'high' : l === 'medium' ? 'medium' : 'low';
