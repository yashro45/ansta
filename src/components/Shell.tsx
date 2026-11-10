import React, { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { Session } from '../lib/auth';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export const BrandMark: React.FC<{ size?: number }> = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
    <rect width="40" height="40" rx="11" fill="#F2B84B" />
    <path d="M20 7 31 11.5v8.2c0 6.2-4.3 10.9-11 13.3-6.7-2.4-11-7.1-11-13.3v-8.2L20 7Z" fill="#0B1226" />
    <rect x="14" y="19" width="3" height="7" rx="1" fill="#F2B84B" />
    <rect x="19" y="15" width="3" height="11" rx="1" fill="#F2B84B" />
    <rect x="24" y="21" width="3" height="5" rx="1" fill="#F2B84B" />
  </svg>
);

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner portal',
  store: 'Store portal',
  officer: 'Officer portal',
};

export const Shell: React.FC<{
  session: Session;
  nav: NavItem[];
  active: string;
  onNavigate: (id: string) => void;
  onLogout: () => void;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ session, nav, active, onNavigate, onLogout, title, subtitle, actions, children }) => {
  const [open, setOpen] = useState(false);

  const NavList = (
    <nav className="mt-6 space-y-1">
      {nav.map((n) => {
        const Icon = n.icon;
        const on = n.id === active;
        return (
          <button
            key={n.id}
            onClick={() => {
              onNavigate(n.id);
              setOpen(false);
            }}
            className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-colors ${on ? 'bg-white/10 text-white' : 'text-[#98A2BD] hover:bg-white/5 hover:text-white'}`}
          >
            {on && <span className="absolute -left-4 top-2 h-6 w-1 rounded-r bg-[#F2B84B]" />}
            <Icon className={`h-[18px] w-[18px] ${on ? 'text-[#F2B84B]' : ''}`} />
            <span className="flex-1">{n.label}</span>
            {n.badge !== undefined && n.badge !== 0 && (
              <span className="rounded-full bg-[#F2B84B] px-2 py-0.5 text-[10px] font-extrabold text-[#0B1226]">{n.badge}</span>
            )}
          </button>
        );
      })}
    </nav>
  );

  const Side = (
    <div className="flex h-full flex-col px-4 py-5">
      <div className="flex items-center gap-3 px-1">
        <BrandMark />
        <div>
          <div className="text-[15px] font-extrabold leading-tight tracking-tight text-white">FranchiseGuard</div>
          <div className="text-[11px] text-[#98A2BD]">{ROLE_LABEL[session.role]}</div>
        </div>
      </div>
      {NavList}
      <div className="mt-auto rounded-xl bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2B84B] text-sm font-extrabold text-[#0B1226]">
            {session.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold text-white">{session.displayName}</div>
            <div className="text-[11px] text-[#98A2BD]">ID: {session.id}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs font-bold text-[#C8CFE3] transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-[#0B1226] lg:block">{Side}</aside>

      {/* Mobile header + drawer */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-[#0B1226] px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <BrandMark size={28} />
          <span className="text-sm font-extrabold text-white">FranchiseGuard</span>
        </div>
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-white" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 animate-fadeIn bg-[#0B1226]">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-lg p-2 text-white" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {Side}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-6 sm:px-8 lg:pt-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-[#0E1630]">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-[#5B6478]">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
        <main className="animate-fadeIn" key={active}>{children}</main>
      </div>
    </div>
  );
};
