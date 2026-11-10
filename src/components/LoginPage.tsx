import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, KeyRound, ShieldCheck, Store, User } from 'lucide-react';
import { authenticate, EXAMPLE_STORE_IDS, OFFICER_ID, OWNER_ID, Role, SHARED_PASSWORD, Session } from '../lib/auth';
import { BrandMark } from './Shell';

const PORTALS: { role: Role; label: string; icon: React.ComponentType<{ className?: string }>; blurb: string; defaultId: string }[] = [
  { role: 'owner', label: 'Owner', icon: BarChart3, blurb: 'Business analytics across every outlet: revenue, compliance, customer sentiment.', defaultId: OWNER_ID },
  { role: 'store', label: 'Store', icon: Store, blurb: 'Your outlet only: upload evidence, close corrective actions, read reviews.', defaultId: EXAMPLE_STORE_IDS[0] },
  { role: 'officer', label: 'Officer', icon: ShieldCheck, blurb: 'Review AI flags, inspect stores, approve actions and issue cure notices.', defaultId: OFFICER_ID },
];

export const LoginPage: React.FC<{ onLogin: (s: Session) => void; onBack?: () => void; initialRole?: Role }> = ({ onLogin, onBack, initialRole = 'owner' }) => {
  const [role, setRole] = useState<Role>(initialRole);
  const [id, setId] = useState<string>(PORTALS.find((p) => p.role === initialRole)!.defaultId);
  const [pw, setPw] = useState<string>('');
  const [error, setError] = useState<string>('');
  const portal = PORTALS.find((p) => p.role === role)!;

  const pick = (r: Role) => {
    const p = PORTALS.find((x) => x.role === r)!;
    setRole(r);
    setId(p.defaultId);
    setPw('');
    setError('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = authenticate(role, id, pw);
    if (!s) {
      setError(
        role === 'store'
          ? 'ID or password is wrong. Store IDs look like ST247 (ST + store number 1 to 500).'
          : 'ID or password is wrong. Use the credentials shown on this page.'
      );
      return;
    }
    onLogin(s);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-[#0B1226] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }}
        />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-[#4650D6] opacity-30 blur-[120px]" />
        <div className="relative flex items-center gap-3">
          <BrandMark size={40} />
          <div>
            <div className="text-lg font-extrabold tracking-tight">FranchiseGuard</div>
            <div className="text-xs text-[#98A2BD]">Standards intelligence for multi-outlet brands</div>
          </div>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-[44px] font-extrabold leading-[1.05] tracking-tight">Every outlet held to the same standard, every day.</h1>
          <p className="mt-5 text-[15px] leading-relaxed text-[#B7C0D8]">
            Video walkthroughs, customer photos and reviews are audited by AI, scored against your brand SOPs and turned into one clear picture for owners, store teams and compliance officers.
          </p>
          <svg viewBox="0 0 420 120" className="mt-10 w-full max-w-md" aria-hidden="true">
            <defs>
              <linearGradient id="lp" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#F2B84B" stopOpacity="0.35" />
                <stop offset="1" stopColor="#F2B84B" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 95 C40 90 60 70 95 74 S150 40 190 48 S250 30 290 36 S360 12 420 8 V120 H0Z" fill="url(#lp)" />
            <path d="M0 95 C40 90 60 70 95 74 S150 40 190 48 S250 30 290 36 S360 12 420 8" fill="none" stroke="#F2B84B" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <div className="relative flex gap-10 text-sm">
          {[['500', 'outlets monitored'], ['3', 'role-based portals'], ['24/7', 'AI evidence review']].map(([a, b]) => (
            <div key={b}>
              <div className="text-2xl font-extrabold text-[#F2B84B]">{a}</div>
              <div className="text-xs text-[#98A2BD]">{b}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign-in */}
      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark size={36} />
            <div className="text-lg font-extrabold tracking-tight text-[#0E1630]">FranchiseGuard</div>
          </div>
          {onBack && (
            <button onClick={onBack} className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#5B6478] hover:text-[#0E1630]">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to home
            </button>
          )}
          <h2 className="text-[28px] font-extrabold tracking-tight text-[#0E1630]">Sign in</h2>
          <p className="mt-1 text-sm text-[#5B6478]">Choose your portal and enter the ID and password shown below.</p>

          <div role="tablist" className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-[#E9EDF5] p-1.5">
            {PORTALS.map((p) => {
              const Icon = p.icon;
              const on = p.role === role;
              return (
                <button
                  key={p.role}
                  role="tab"
                  aria-selected={on}
                  onClick={() => pick(p.role)}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold transition-all ${on ? 'bg-white text-[#0E1630] shadow-sm' : 'text-[#5B6478] hover:text-[#0E1630]'}`}
                >
                  <Icon className="h-4 w-4" /> {p.label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-[#5B6478]">{portal.blurb}</p>

          {/* Credentials are shown on purpose: this is an open demo */}
          <div className="mt-5 rounded-2xl border border-[#F2D9A0] bg-[#FFF8E6] p-4">
            <div className="text-xs font-bold text-[#8A5F00]">Login credentials for the {portal.label.toLowerCase()} portal</div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[11px] text-[#8A5F00]">ID</div>
                <div className="font-extrabold text-[#0E1630]">{portal.defaultId}</div>
              </div>
              <div>
                <div className="text-[11px] text-[#8A5F00]">Password</div>
                <div className="font-extrabold text-[#0E1630]">{SHARED_PASSWORD}</div>
              </div>
            </div>
            {role === 'store' && (
              <div className="mt-3 border-t border-[#F2D9A0] pt-3 text-xs text-[#6F4C00]">
                Each store signs in with its own ID: <b>ST</b> + store number (1 to 500). Same password.
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {EXAMPLE_STORE_IDS.map((s) => (
                    <button key={s} type="button" onClick={() => { setId(s); setPw(SHARED_PASSWORD); setError(''); }} className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-[#0E1630] shadow-sm hover:bg-[#FFF1CC]">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => { setPw(SHARED_PASSWORD); setError(''); }}
              className="mt-3 text-xs font-bold text-[#3A41B8] hover:underline"
            >
              Fill password
            </button>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-[#0E1630]">{role === 'store' ? 'Store ID' : 'ID'}</span>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA3B8]" />
                <input
                  value={id}
                  onChange={(e) => { setId(e.target.value); setError(''); }}
                  autoComplete="username"
                  className="w-full rounded-xl border border-[#DDE2EE] bg-white py-3 pl-10 pr-3 text-sm font-semibold text-[#0E1630] focus:border-[#4650D6] focus:outline-none focus:ring-4 focus:ring-[#4650D6]/10"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-[#0E1630]">Password</span>
              <div className="relative mt-1.5">
                <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA3B8]" />
                <input
                  value={pw}
                  onChange={(e) => { setPw(e.target.value); setError(''); }}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-[#DDE2EE] bg-white py-3 pl-10 pr-3 text-sm font-semibold text-[#0E1630] focus:border-[#4650D6] focus:outline-none focus:ring-4 focus:ring-[#4650D6]/10"
                />
              </div>
            </label>
            {error && <div role="alert" className="rounded-xl bg-[#FDE3E7] px-3 py-2.5 text-xs font-semibold text-[#C2253E]">{error}</div>}
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1226] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#1B2547]">
              Sign in to {portal.label.toLowerCase()} portal <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
