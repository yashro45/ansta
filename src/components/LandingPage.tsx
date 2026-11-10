import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { BrandMark } from './Shell';
import { LineChart, PALETTE, RISK_COLORS } from './charts';
import { Role } from '../lib/auth';

const INK = '#070B16';
const GOLD = '#F2B84B';

/* ------------------------------------------------------------------ Hero viewfinder */
const FINDINGS = [
  { t: '00:14', label: 'Hair restraint missing', clause: 'STD-UNI-107', sev: 'High', color: RISK_COLORS.critical, conf: '96.4%' },
  { t: '00:47', label: 'Grease build-up near fryer', clause: 'STD-HYG-402', sev: 'High', color: RISK_COLORS.high, conf: '91.8%' },
  { t: '01:21', label: 'Cooler door left ajar', clause: 'STD-EQP-504', sev: 'Medium', color: '#E0A100', conf: '88.2%' },
];

const Viewfinder: React.FC = () => (
  <div className="relative min-w-0">
    <div className="absolute -inset-6 rounded-[28px] bg-[#4650D6] opacity-25 blur-3xl" />
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A1022] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.8)]">
      <svg viewBox="0 0 640 400" className="block w-full" role="img" aria-label="Kitchen camera frame with AI detections">
        <defs>
          <linearGradient id="vf-scan" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={GOLD} stopOpacity="0" />
            <stop offset="1" stopColor={GOLD} stopOpacity="0.35" />
          </linearGradient>
          <radialGradient id="vf-vig" cx="50%" cy="50%" r="75%">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
          </radialGradient>
        </defs>
        {/* wall + tiles */}
        <rect width="640" height="260" fill="#0E1630" />
        {Array.from({ length: 17 }).map((_, i) => <line key={'v' + i} x1={i * 40} x2={i * 40} y1="60" y2="260" stroke="#18224A" strokeWidth="1" />)}
        {Array.from({ length: 6 }).map((_, i) => <line key={'h' + i} x1="0" x2="640" y1={60 + i * 40} y2={60 + i * 40} stroke="#18224A" strokeWidth="1" />)}
        {/* hood */}
        <polygon points="110,0 530,0 575,64 65,64" fill="#17213F" />
        {Array.from({ length: 9 }).map((_, i) => <line key={'f' + i} x1={150 + i * 42} x2={140 + i * 44} y1="18" y2="54" stroke="#222E5A" strokeWidth="3" />)}
        {/* shelf */}
        <rect x="60" y="116" width="170" height="5" fill="#2A3870" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={72 + i * 40} y={92} width="30" height="24" rx="3" fill="#1D2A58" />)}
        {/* counter + fryer */}
        <rect x="40" y="232" width="560" height="64" fill="#1A2652" />
        <rect x="40" y="232" width="560" height="4" fill="#33437F" />
        <rect x="395" y="168" width="140" height="64" rx="4" fill="#202E60" />
        <rect x="410" y="180" width="48" height="28" rx="3" fill="#0E1630" />
        <rect x="472" y="180" width="48" height="28" rx="3" fill="#0E1630" />
        {/* cooler, door ajar */}
        <rect x="560" y="120" width="60" height="112" fill="#1B2956" />
        <polygon points="560,120 540,130 540,226 560,232" fill="#2B3C7A" />
        {/* floor */}
        <rect y="296" width="640" height="104" fill="#080D1D" />
        {Array.from({ length: 9 }).map((_, i) => <line key={'fl' + i} x1="320" y1="296" x2={i * 80} y2="400" stroke="#131C3B" strokeWidth="1" />)}
        <ellipse cx="445" cy="346" rx="78" ry="17" fill="#C98A00" opacity="0.22" />
        {/* staff member, no hairnet */}
        <rect x="248" y="158" width="76" height="118" rx="22" fill="#2A3866" />
        <rect x="262" y="190" width="48" height="86" rx="8" fill="#3A4A86" />
        <circle cx="286" cy="128" r="23" fill="#44558F" />
        <rect x="236" y="276" width="100" height="20" fill="#0E1630" opacity="0.0" />
        <rect width="640" height="400" fill="url(#vf-vig)" />

        {/* scan sweep */}
        <g className="lp-scan">
          <rect width="640" height="70" fill="url(#vf-scan)" />
          <rect width="640" height="2" y="68" fill={GOLD} opacity="0.9" />
        </g>

        {/* detections, appear in sequence */}
        <g className="lp-box" style={{ animationDelay: '1.0s' }}>
          <rect x="254" y="98" width="64" height="60" fill="none" stroke={RISK_COLORS.critical} strokeWidth="2" />
          <rect x="254" y="78" width="168" height="20" fill={RISK_COLORS.critical} />
          <text x="261" y="92" fontSize="11" fontWeight="700" fill="#fff">Hair restraint missing  96.4%</text>
        </g>
        <g className="lp-box" style={{ animationDelay: '1.7s' }}>
          <rect x="366" y="326" width="158" height="40" fill="none" stroke={RISK_COLORS.high} strokeWidth="2" strokeDasharray="6 3" />
          <rect x="366" y="306" width="150" height="20" fill={RISK_COLORS.high} />
          <text x="373" y="320" fontSize="11" fontWeight="700" fill="#fff">Grease build-up  91.8%</text>
        </g>
        <g className="lp-box" style={{ animationDelay: '2.3s' }}>
          <rect x="538" y="118" width="80" height="116" fill="none" stroke="#E0A100" strokeWidth="2" />
          <rect x="520" y="98" width="98" height="20" fill="#E0A100" />
          <text x="527" y="112" fontSize="11" fontWeight="700" fill="#1a1200">Door ajar  88.2%</text>
        </g>

        {/* HUD */}
        {[[14, 14, 1, 1], [626, 14, -1, 1], [14, 386, 1, -1], [626, 386, -1, -1]].map(([x, y, dx, dy], i) => (
          <path key={i} d={`M${x},${y + 18 * dy} V${y} H${x + 18 * dx}`} fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" />
        ))}
        <circle className="lp-rec" cx="34" cy="34" r="5" fill="#FF3B53" />
        <text x="46" y="38" fontSize="12" fontWeight="700" fill="#fff" letterSpacing="1">REC  CAM 03 · KITCHEN</text>
        <text x="602" y="40" fontSize="12" textAnchor="end" fill="#fff" fillOpacity="0.85">09 NOV 2026  14:32:08</text>
        <text x="30" y="378" fontSize="11" fill="#fff" fillOpacity="0.7">FreshBite #247 · Hazratganj, Lucknow</text>
      </svg>

      <div className="border-t border-white/10 bg-[#0A1022] p-4 sm:p-5">
        <ul className="space-y-2.5">
          {FINDINGS.map((f, i) => (
            <li key={f.t} className="lp-row flex items-center gap-3 text-[13px]" style={{ animationDelay: `${1.2 + i * 0.7}s` }}>
              <span className="w-10 shrink-0 text-xs tabular-nums text-[#7F8AAB]">{f.t}</span>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: f.color }} />
              <span className="flex-1 font-semibold text-white">{f.label}</span>
              <span className="hidden text-xs text-[#7F8AAB] sm:inline">{f.clause}</span>
              <span className="w-14 text-right text-xs font-bold" style={{ color: f.color }}>{f.sev}</span>
            </li>
          ))}
        </ul>
        <div className="lp-row mt-4 flex items-center justify-between rounded-lg bg-white/5 px-3.5 py-2.5 text-xs" style={{ animationDelay: '3.4s' }}>
          <span className="text-[#B7C0D8]">Standards score <b className="ml-1 text-base text-white">62</b> <span className="text-[#7F8AAB]">of 100</span></span>
          <span className="font-bold" style={{ color: GOLD }}>Sent to compliance officer</span>
        </div>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ Audit report document */
const ReportDoc: React.FC = () => (
  <div className="relative min-w-0 rotate-[1.2deg] rounded-sm bg-white p-7 shadow-[0_40px_80px_-35px_rgba(7,11,22,0.45)] ring-1 ring-black/5 sm:p-9">
    <div className="flex items-start justify-between border-b-2 border-[#0A0F1E] pb-4">
      <div>
        <div className="font-display text-[28px] leading-none text-[#0A0F1E]">Inspection report</div>
        <div className="mt-1.5 text-xs text-[#5B6478]">FreshBite #247, Hazratganj, Lucknow · Ref FG-247-1109</div>
      </div>
      <div className="text-right text-xs text-[#5B6478]">Evidence reviewed<br /><b className="text-[#0A0F1E]">2-min walkthrough, 7 reviews</b></div>
    </div>
    <table className="mt-4 w-full text-left text-[13px]">
      <thead>
        <tr className="text-[11px] text-[#7A8399]">
          <th className="pb-2 font-semibold">Finding</th>
          <th className="hidden pb-2 font-semibold sm:table-cell">Clause</th>
          <th className="pb-2 font-semibold">Evidence</th>
          <th className="pb-2 text-right font-semibold">Severity</th>
        </tr>
      </thead>
      <tbody className="text-[#1B2440]">
        {FINDINGS.map((f) => (
          <tr key={f.t} className="border-t border-[#ECEFF5]">
            <td className="py-2.5 pr-2 font-semibold">{f.label}</td>
            <td className="hidden py-2.5 pr-2 text-[#5B6478] sm:table-cell">{f.clause}</td>
            <td className="py-2.5 pr-2 tabular-nums text-[#5B6478]">Video {f.t}</td>
            <td className="py-2.5 text-right font-bold" style={{ color: f.color }}>{f.sev}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
      <div className="rounded-md bg-[#F5F7FC] p-3"><div className="text-[#7A8399]">Corrective action</div><div className="mt-0.5 font-bold text-[#0A0F1E]">Re-train kitchen team on hair restraint SOP</div></div>
      <div className="rounded-md bg-[#F5F7FC] p-3"><div className="text-[#7A8399]">Due</div><div className="mt-0.5 font-bold text-[#0A0F1E]">12 Nov 2026 · Store manager</div></div>
    </div>
    <div className="mt-6 flex items-center justify-between">
      <span className="text-xs text-[#7A8399]">Score 62 of 100 · sent to compliance officer</span>
      <span className="-rotate-6 rounded-md border-[3px] border-[#D6304A] px-3 py-1 text-base font-extrabold tracking-wide text-[#D6304A] opacity-85">ESCALATED</span>
    </div>
  </div>
);

/* ------------------------------------------------------------------ Portal showcase */
const PORTALS: { role: Role; name: string; line: string }[] = [
  { role: 'owner', name: 'Owner', line: 'Revenue, compliance and satisfaction across every outlet. Charts and numbers, nothing to click through.' },
  { role: 'store', name: 'Store', line: 'Upload a walkthrough, see what the AI found, close each corrective action before the deadline.' },
  { role: 'officer', name: 'Officer', line: 'A queue of the riskiest stores. Inspect the evidence, then approve, dismiss or ask for more proof.' },
];

const PortalPreview: React.FC<{ role: Role }> = ({ role }) => {
  if (role === 'owner')
    return (
      <div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-[#6B7488]">Weekly revenue</div>
            <div className="text-3xl font-extrabold tracking-tight">₹23.02 Cr</div>
          </div>
          <div className="text-right text-xs text-[#6B7488]">Compliant stores<div className="text-xl font-extrabold text-[#0E1630]">89%</div></div>
        </div>
        <LineChart labels={['17 Aug', '31 Aug', '14 Sep', '28 Sep', '12 Oct', '26 Oct', '2 Nov']} series={[{ name: 'Revenue', color: PALETTE[0], values: [21.1, 20.6, 21.9, 22.7, 22.2, 22.6, 23.0] }]} fmt={(n) => `₹${n.toFixed(1)} Cr`} height={200} fill />
      </div>
    );
  if (role === 'store')
    return (
      <div className="space-y-2.5 text-sm">
        {[['Cleanliness', false], ['Uniform and hygiene', true], ['Equipment', false], ['Safety', true]].map(([l, ok]) => (
          <div key={String(l)} className="flex items-center justify-between rounded-lg bg-[#F5F7FC] px-4 py-3">
            <span className="font-semibold">{l}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${ok ? 'bg-[#E3F5EC] text-[#13805A]' : 'bg-[#FDE3E7] text-[#C2253E]'}`}>{ok ? 'Pass' : 'Fail'}</span>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-lg border border-dashed border-[#C8CFE3] px-4 py-3 text-[#5B6478]"><span>Upload 2-minute walkthrough</span><span className="font-bold text-[#0E1630]">Choose file</span></div>
      </div>
    );
  return (
    <ul className="divide-y divide-[#EEF1F7] text-sm">
      {[['FreshBite #7, Patna', 97, 'critical'], ['FreshBite #6, Gorakhpur', 96, 'critical'], ['FreshBite #5, Lucknow', 95, 'critical'], ['FreshBite #11, Gorakhpur', 93, 'high']].map(([n, s, l]) => (
        <li key={String(n)} className="flex items-center gap-3 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-extrabold text-white" style={{ background: RISK_COLORS[String(l)] }}>{s}</span>
          <span className="flex-1 font-semibold">{n}</span>
          <span className="rounded-lg bg-[#0A0F1E] px-3 py-1.5 text-xs font-bold text-white">Inspect</span>
        </li>
      ))}
    </ul>
  );
};

/* ------------------------------------------------------------------ Page */
export const LandingPage: React.FC<{ onSignIn: (role?: Role) => void }> = ({ onSignIn }) => {
  const [tab, setTab] = useState<Role>('owner');
  const active = PORTALS.find((p) => p.role === tab)!;

  return (
    <div className="overflow-x-clip bg-[#F4F6FA] text-[#0E1630]">
      {/* Hero */}
      <section className="relative overflow-hidden text-white" style={{ background: INK }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(900px 500px at 85% 10%, rgba(70,80,214,0.28), transparent 60%), radial-gradient(700px 400px at 0% 100%, rgba(242,184,75,0.08), transparent 60%)' }} />
        <header className="relative mx-auto flex max-w-[1240px] items-center justify-between px-5 py-6 sm:px-10">
          <div className="flex items-center gap-3">
            <BrandMark size={32} />
            <span className="text-[17px] font-extrabold tracking-tight">FranchiseGuard</span>
          </div>
          <nav className="hidden items-center gap-9 text-[13px] font-semibold text-[#9AA5C4] md:flex">
            <a href="#report" className="hover:text-white">The report</a>
            <a href="#portals" className="hover:text-white">Portals</a>
            <a href="#approach" className="hover:text-white">Approach</a>
          </nav>
          <button onClick={() => onSignIn()} className="rounded-full border border-white/25 px-5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-white hover:text-[#070B16]">Sign in</button>
        </header>

        <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 pb-24 pt-10 sm:px-10 lg:grid-cols-[1fr_1.08fr] lg:pb-32 lg:pt-16">
          <div className="min-w-0">
            <h1 className="font-display text-[56px] font-normal leading-[0.98] tracking-[-0.02em] sm:text-[80px]">Every outlet, held to the same standard.</h1>
            <p className="mt-7 max-w-md text-[17px] leading-[1.65] text-[#A9B3D0]">
              A two-minute walkthrough video, a customer photo, a pile of reviews. FranchiseGuard reads all of it, scores the store against your SOPs, and tells the right person what to fix.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button onClick={() => onSignIn()} className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-bold text-[#070B16] transition-transform hover:-translate-y-0.5" style={{ background: GOLD }}>
                Open the platform <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <a href="#report" className="text-sm font-bold text-[#C8D0E8] underline decoration-white/30 underline-offset-[6px] hover:decoration-white">See a finished report</a>
            </div>
          </div>
          <Viewfinder />
        </div>
      </section>

      {/* Numbers */}
      <section className="border-b border-[#E1E6F0] bg-white">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 divide-y divide-[#E1E6F0] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-10">
          {[['500', 'outlets checked against one rulebook'], ['2 min', 'of video is all a store has to record'], ['3', 'portals, each showing only what that role needs']].map(([n, t]) => (
            <div key={t} className="px-0 py-8 sm:px-8 first:sm:pl-0">
              <div className="font-display text-[56px] leading-none tracking-tight text-[#0A0F1E]">{n}</div>
              <div className="mt-2 max-w-[240px] text-sm text-[#5B6478]">{t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Report */}
      <section id="report" className="mx-auto grid max-w-[1240px] items-center gap-16 px-5 py-24 sm:px-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="font-display text-[44px] leading-[1.05] tracking-[-0.015em] sm:text-[56px]">The finding arrives with its proof.</h2>
          <p className="mt-6 max-w-md text-base leading-[1.7] text-[#4A5368]">
            Every issue carries the exact second in the video, the SOP clause it breaks and a deadline for the fix. Nobody has to argue about what was seen, or when.
          </p>
          <ol className="mt-10 max-w-md space-y-0 border-l border-[#CBD2E2]">
            {[['Flagged', 'AI marks the violation on the footage.'], ['Reviewed', 'A compliance officer confirms or dismisses it.'], ['Assigned', 'The store gets an action, an owner and a date.'], ['Verified', 'Unresolved items escalate until closed.']].map(([t, d]) => (
              <li key={t} className="relative pb-6 pl-6 last:pb-0">
                <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#0A0F1E] ring-4 ring-[#F4F6FA]" />
                <span className="font-bold">{t}</span>
                <span className="text-[#5B6478]"> — {d}</span>
              </li>
            ))}
          </ol>
        </div>
        <ReportDoc />
      </section>

      {/* Portals */}
      <section id="portals" style={{ background: INK }} className="py-24 text-white">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-10">
          <h2 className="max-w-2xl font-display text-[44px] leading-[1.05] tracking-[-0.015em] sm:text-[56px]">Three people, three views, one truth.</h2>
          <div className="mt-14 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div role="tablist" className="space-y-1">
                {PORTALS.map((p) => (
                  <button key={p.role} role="tab" aria-selected={tab === p.role} onClick={() => setTab(p.role)} className={`block w-full border-l-2 py-3 pl-5 text-left transition-colors ${tab === p.role ? 'border-[#F2B84B] text-white' : 'border-white/10 text-[#7F8AAB] hover:text-white'}`}>
                    <span className="font-display text-[34px] leading-none">{p.name}</span>
                  </button>
                ))}
              </div>
              <p className="mt-8 max-w-sm text-[15px] leading-[1.7] text-[#A9B3D0]">{active.line}</p>
              <button onClick={() => onSignIn(tab)} className="group mt-8 inline-flex items-center gap-2.5 rounded-full border border-white/25 px-6 py-3 text-sm font-bold transition-colors hover:bg-white hover:text-[#070B16]">
                Sign in as {active.name.toLowerCase()} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
            <div className="min-w-0 rounded-2xl bg-white p-6 text-[#0E1630] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] sm:p-8" key={tab}>
              <PortalPreview role={tab} />
            </div>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section id="approach" className="mx-auto max-w-[1240px] px-5 py-24 sm:px-10">
        <h2 className="max-w-2xl font-display text-[44px] leading-[1.05] tracking-[-0.015em] sm:text-[56px]">Built to assist inspectors, not replace them.</h2>
        <dl className="mt-14 grid gap-x-16 gap-y-10 md:grid-cols-2">
          {[
            ['Consistent by default', 'Every outlet is measured against the same clauses with the same weights, so a score in Patna means what it means in Pune.'],
            ['Patterns, not just incidents', 'A faulty fridge seal in fourteen stores is one supplier problem. Network patterns show it once, with the stores attached.'],
            ['The customer is evidence too', 'Reviews and complaints are sorted by topic and severity and sit beside the video, so hygiene and service problems appear early.'],
            ['A person makes the call', 'The AI explains what it saw and how sure it is. An officer approves, dismisses or asks for more before anything reaches a store.'],
          ].map(([t, d]) => (
            <div key={t} className="border-t border-[#CBD2E2] pt-5">
              <dt className="text-[17px] font-bold">{t}</dt>
              <dd className="mt-2 max-w-md text-[15px] leading-[1.7] text-[#4A5368]">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Closing */}
      <section style={{ background: INK }} className="relative overflow-hidden py-24 text-center text-white">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(600px 300px at 50% 0%, rgba(70,80,214,0.3), transparent 70%)' }} />
        <div className="relative px-5">
          <h2 className="mx-auto max-w-3xl font-display text-[48px] leading-[1.02] tracking-[-0.02em] sm:text-[68px]">See the whole network before the customer does.</h2>
          <button onClick={() => onSignIn()} className="group mt-10 inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-sm font-bold text-[#070B16] transition-transform hover:-translate-y-0.5" style={{ background: GOLD }}>
            Open the platform <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <div className="mt-20 flex items-center justify-center gap-3 text-xs text-[#7F8AAB]">
            <BrandMark size={22} /> FranchiseGuard · Franchise standards intelligence
          </div>
        </div>
      </section>
    </div>
  );
};
