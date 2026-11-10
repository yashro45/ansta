import React, { useMemo, useState } from 'react';
import { Star, X, Film, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Eye, History, LayoutDashboard, MapPin, Network, Search, Store } from 'lucide-react';
import { AuditLogEntry, FranchiseStore, StorePhotoAudit, SystemicPattern } from '../types/franchise';
import { Session } from '../lib/auth';
import { Shell, NavItem } from '../components/Shell';
import { Card, Empty, Kpi, Pill, Select, Segmented, Toast, riskTone } from '../components/ui';
import { Columns, Donut, RISK_COLORS } from '../components/charts';
import { REGIONS, REGION_LABEL, groupBy, rollup } from '../data/analytics';
import { num } from '../lib/format';
import { StoreInspectorModal } from '../components/StoreInspectorModal';
import { CustomerMediaUploadModal } from '../components/CustomerMediaUploadModal';
import { CrossLocationDetector } from '../components/CrossLocationDetector';

const TITLES: Record<string, [string, string]> = {
  overview: ['Command center', 'Where compliance risk is highest right now.'],
  evidence: ['Evidence review', 'Look at the frames from each video and give the rating.'],
  fleet: ['Store fleet', 'Search every outlet and open its full inspection file.'],
  actions: ['Action center', 'Review AI flags and decide what happens next.'],
  patterns: ['Network patterns', 'Issues that repeat across several stores.'],
};

export const OfficerPortal: React.FC<{
  session: Session;
  stores: FranchiseStore[];
  patterns: SystemicPattern[];
  auditLogs: AuditLogEntry[];
  onLogout: () => void;
  onApprove: (n: number, type: string, note?: string) => void;
  onReject: (n: number, note?: string) => void;
  onInvestigate: (n: number, note?: string) => void;
  onMediaSubmitted: (n: number, media: StorePhotoAudit, text?: string) => void;
  onRateEvidence: (n: number, mediaId: string, rating: number, note?: string) => void;
  onDispatchRemediation: (patternId: string) => void;
}> = ({ session, stores, patterns, auditLogs, onLogout, onApprove, onReject, onInvestigate, onMediaSubmitted, onRateEvidence, onDispatchRemediation }) => {
  const [page, setPage] = useState('overview');
  const [inspecting, setInspecting] = useState<number | null>(null);
  const [uploadFor, setUploadFor] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };

  const pending = useMemo(() => stores.filter((s) => s.riskScore >= 60 && s.humanReviewStatus === 'Pending Review'), [stores]);
  const awaiting = useMemo(() => stores.reduce((a, s) => a + s.photos.filter((p) => p.reviewStatus === 'awaiting_officer').length, 0), [stores]);
  const nav: NavItem[] = [
    { id: 'overview', label: 'Command center', icon: LayoutDashboard },
    { id: 'evidence', label: 'Evidence review', icon: Film, badge: awaiting },
    { id: 'fleet', label: 'Store fleet', icon: Store },
    { id: 'actions', label: 'Action center', icon: ClipboardCheck, badge: pending.length },
    { id: 'patterns', label: 'Network patterns', icon: Network },
  ];
  const [title, sub] = TITLES[page];
  const inspected = stores.find((s) => s.storeNumber === inspecting) || null;

  return (
    <Shell session={session} nav={nav} active={page} onNavigate={setPage} onLogout={onLogout} title={title} subtitle={sub}>
      {page === 'overview' && <Overview stores={stores} pending={pending} awaiting={awaiting} auditLogs={auditLogs} onInspect={setInspecting} goto={setPage} />}
      {page === 'evidence' && <EvidenceReview stores={stores} onRate={(n, id, r, note) => { onRateEvidence(n, id, r, note); flash(`Rated ${r}/5 for store #${n}.`); }} />}
      {page === 'fleet' && <Fleet stores={stores} onInspect={setInspecting} />}
      {page === 'actions' && (
        <Actions
          stores={stores}
          auditLogs={auditLogs}
          onInspect={setInspecting}
          onApprove={(s, note) => { onApprove(s.storeNumber, s.recommendedActionType, note); flash(`Approved for store #${s.storeNumber}.`); }}
          onReject={(s, note) => { onReject(s.storeNumber, note); flash(`Flag dismissed for store #${s.storeNumber}.`); }}
        />
      )}
      {page === 'patterns' && (
        <CrossLocationDetector
          patterns={patterns}
          onInspectStore={setInspecting}
          onDispatchRemediation={(id) => { onDispatchRemediation(id); flash('Remediation mandate sent.'); }}
        />
      )}

      {inspected && (
        <StoreInspectorModal
          store={inspected}
          onClose={() => setInspecting(null)}
          onApproveAction={onApprove}
          onRejectAction={onReject}
          onInvestigateAction={onInvestigate}
          onOpenMediaUpload={(n) => setUploadFor(n)}
        />
      )}
      {uploadFor !== null && (
        <CustomerMediaUploadModal
          isOpen
          onClose={() => setUploadFor(null)}
          stores={stores}
          preselectedStoreNumber={uploadFor}
          onMediaSubmitted={(n, media, text) => {
            onMediaSubmitted(n, media, text);
            flash('Evidence added and queued for rating.');
          }}
        />
      )}
      <Toast message={toast} />
    </Shell>
  );
};

/* ------------------------------------------------------------------ Overview */
const Overview: React.FC<{
  stores: FranchiseStore[];
  pending: FranchiseStore[];
  awaiting: number;
  auditLogs: AuditLogEntry[];
  onInspect: (n: number) => void;
  goto: (p: string) => void;
}> = ({ stores, pending, awaiting, auditLogs, onInspect, goto }) => {
  const R = rollup(stores);
  const byRegion = groupBy(stores, (s) => s.location.region);
  const keys = REGIONS.filter((r) => byRegion[r]);
  const overdue = stores.reduce((a, s) => a + s.correctiveActions.filter((c) => c.status === 'Overdue').length, 0);
  const queue = [...pending].sort((a, b) => b.riskScore - a.riskScore).slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Evidence awaiting rating" value={num(awaiting)} hint="Frames waiting for you" />
        <Kpi label="Critical stores" value={num(R.critical)} hint="Immediate review" />
        <Kpi label="Awaiting your decision" value={num(pending.length)} hint="High or critical flags" />
        <Kpi label="Overdue corrective actions" value={num(overdue)} hint="Past their due date" />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Priority queue" subtitle="Highest risk stores waiting for review" right={<button onClick={() => goto('actions')} className="text-xs font-bold text-[#3A41B8] hover:underline">Open action center</button>}>
          {queue.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#6B7488]">Queue is clear. Every flagged store has been reviewed.</p>
          ) : (
            <ul className="divide-y divide-[#EEF1F7]">
              {queue.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-white" style={{ background: RISK_COLORS[s.riskLevel] }}>
                    <span className="text-sm font-extrabold leading-none">{s.riskScore}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-[#0E1630]">{s.name}</div>
                    <div className="truncate text-xs text-[#6B7488]">{s.mainIssue}</div>
                  </div>
                  <button onClick={() => onInspect(s.storeNumber)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1226] px-3 py-2 text-xs font-bold text-white hover:bg-[#1B2547]">
                    <Eye className="h-3.5 w-3.5" /> Inspect
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Risk distribution" subtitle="All stores">
          <Donut
            items={(['critical', 'high', 'medium', 'low'] as const).map((l) => ({ label: l[0].toUpperCase() + l.slice(1), value: R[l], color: RISK_COLORS[l] }))}
            centerLabel="stores"
            fmt={num}
          />
        </Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="High and critical stores by region" subtitle="Where to send field auditors">
          <Columns
            labels={keys}
            stacked
            series={[
              { name: 'High', color: RISK_COLORS.high, values: keys.map((k) => rollup(byRegion[k]).high) },
              { name: 'Critical', color: RISK_COLORS.critical, values: keys.map((k) => rollup(byRegion[k]).critical) },
            ]}
            fmt={num}
            height={220}
          />
        </Card>
        <Card title="Recent decisions" subtitle="Latest entries in the audit log">
          <ul className="space-y-2.5">
            {auditLogs.slice(0, 5).map((l) => (
              <li key={l.id} className="text-xs">
                <div className="flex justify-between gap-2">
                  <span className="font-bold text-[#0E1630]">Store #{l.storeNumber} · {l.actionTaken}</span>
                  <span className="shrink-0 text-[#6B7488]">{l.timestamp.substring(0, 10)}</span>
                </div>
                <div className="text-[#6B7488]">{l.actor}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ Fleet */
const Fleet: React.FC<{ stores: FranchiseStore[]; onInspect: (n: number) => void }> = ({ stores, onInspect }) => {
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('All');
  const [risk, setRisk] = useState('All');
  const [sort, setSort] = useState('risk_desc');
  const [pageNo, setPageNo] = useState(1);
  const per = 12;

  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return stores
      .filter((s) => (!k || s.name.toLowerCase().includes(k) || String(s.storeNumber).includes(k) || s.location.city.toLowerCase().includes(k)) && (region === 'All' || s.location.region === region) && (risk === 'All' || s.riskLevel === risk))
      .sort((a, b) => (sort === 'risk_desc' ? b.riskScore - a.riskScore : sort === 'risk_asc' ? a.riskScore - b.riskScore : a.storeNumber - b.storeNumber));
  }, [stores, q, region, risk, sort]);
  const pages = Math.max(1, Math.ceil(list.length / per));
  const cur = Math.min(pageNo, pages);
  const rows = list.slice((cur - 1) * per, cur * per);
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPageNo(1); };

  return (
    <div className="space-y-5">
      <div className="fg-card flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA3B8]" />
          <input value={q} onChange={(e) => reset(setQ)(e.target.value)} placeholder="Search by store number, city or name" className="w-full rounded-xl border border-[#DDE2EE] bg-[#F9FAFD] py-2.5 pl-10 pr-3 text-xs font-semibold focus:border-[#4650D6] focus:outline-none" />
        </div>
        <Select value={region} onChange={reset(setRegion)} options={[{ value: 'All', label: 'All regions' }, ...REGIONS.map((r) => ({ value: r, label: REGION_LABEL[r] }))]} />
        <Select value={risk} onChange={reset(setRisk)} options={[{ value: 'All', label: 'All risk levels' }, { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
        <Select value={sort} onChange={reset(setSort)} options={[{ value: 'risk_desc', label: 'Highest risk first' }, { value: 'risk_asc', label: 'Lowest risk first' }, { value: 'num', label: 'Store number' }]} />
      </div>
      <div className="text-xs font-semibold text-[#5B6478]">{num(list.length)} stores</div>
      {rows.length === 0 ? (
        <Empty icon={<Search className="h-10 w-10" />} title="No stores match" text="Try a different search or clear the filters." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => (
            <button key={s.id} onClick={() => onInspect(s.storeNumber)} className="fg-card p-4 text-left transition-shadow hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-[#0E1630]">{s.name}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-[#6B7488]"><MapPin className="h-3 w-3" />{s.location.city}, {s.location.state}</div>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white" style={{ background: RISK_COLORS[s.riskLevel] }}>{s.riskScore}</div>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-[#4A5368]">{s.mainIssue}</p>
              <div className="mt-3 flex items-center justify-between border-t border-[#EEF1F7] pt-2.5 text-[11px] text-[#6B7488]">
                <span>{s.recentViolationsCount} flags · {s.negativeReviewsCount30d} complaints</span>
                <Pill tone={riskTone(s.riskLevel)}>{s.riskLevel}</Pill>
              </div>
            </button>
          ))}
        </div>
      )}
      {pages > 1 && (
        <div className="fg-card flex items-center justify-between px-4 py-3 text-xs">
          <span className="text-[#6B7488]">Page <b className="text-[#0E1630]">{cur}</b> of {pages}</span>
          <div className="flex gap-2">
            <button disabled={cur === 1} onClick={() => setPageNo(cur - 1)} className="rounded-lg border border-[#DDE2EE] p-1.5 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={cur === pages} onClick={() => setPageNo(cur + 1)} className="rounded-lg border border-[#DDE2EE] p-1.5 disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ Actions */
const Actions: React.FC<{
  stores: FranchiseStore[];
  auditLogs: AuditLogEntry[];
  onInspect: (n: number) => void;
  onApprove: (s: FranchiseStore, note?: string) => void;
  onReject: (s: FranchiseStore, note?: string) => void;
}> = ({ stores, auditLogs, onInspect, onApprove, onReject }) => {
  const [filter, setFilter] = useState('pending');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const pending = stores.filter((s) => s.riskScore >= 60 && s.humanReviewStatus === 'Pending Review');
  const approved = stores.filter((s) => s.humanReviewStatus === 'Approved');
  const investigating = stores.filter((s) => s.humanReviewStatus === 'Under Investigation' || s.humanReviewStatus === 'Investigating');
  const shown = (filter === 'pending' ? pending : filter === 'approved' ? approved : investigating).sort((a, b) => b.riskScore - a.riskScore).slice(0, 25);

  return (
    <div className="space-y-5">
      <Segmented value={filter} onChange={setFilter} options={[{ value: 'pending', label: `Pending (${pending.length})` }, { value: 'investigating', label: `Investigating (${investigating.length})` }, { value: 'approved', label: `Approved (${approved.length})` }]} />
      {shown.length === 0 ? (
        <Empty icon={<CheckCircle2 className="h-10 w-10 text-[#1E9E6A]" />} title="Queue is clear" text="Nothing in this list right now." />
      ) : (
        <div className="space-y-3">
          {shown.map((s) => (
            <div key={s.id} className="fg-card flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white" style={{ background: RISK_COLORS[s.riskLevel] }}>{s.riskScore}</div>
                <div className="min-w-0 space-y-0.5 text-xs">
                  <div className="text-sm font-bold text-[#0E1630]">{s.name}</div>
                  <div className="text-[#4A5368]"><b className="text-[#0E1630]">Issue:</b> {s.mainIssue}</div>
                  <div className="text-[#4A5368]"><b className="text-[#0E1630]">AI suggests:</b> {s.aiRecommendation}</div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                {filter === 'pending' && (
                  <input value={notes[s.storeNumber] || ''} onChange={(e) => setNotes({ ...notes, [s.storeNumber]: e.target.value })} placeholder="Add a note" className="w-full rounded-xl border border-[#DDE2EE] bg-[#F9FAFD] px-3 py-2 text-xs focus:border-[#4650D6] focus:outline-none sm:w-44" />
                )}
                <div className="flex gap-2">
                  <button onClick={() => onInspect(s.storeNumber)} className="rounded-lg border border-[#DDE2EE] px-3 py-2 text-xs font-bold hover:bg-[#F5F7FC]">Inspect</button>
                  {filter === 'pending' && (
                    <>
                      <button onClick={() => onReject(s, notes[s.storeNumber])} className="rounded-lg border border-[#DDE2EE] px-3 py-2 text-xs font-bold hover:bg-[#F5F7FC]">Dismiss</button>
                      <button onClick={() => onApprove(s, notes[s.storeNumber])} className="rounded-lg bg-[#0B1226] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#1B2547]">Approve</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Card title="Decision log" subtitle={`${auditLogs.length} recorded decisions`} right={<History className="h-4 w-4 text-[#9AA3B8]" />}>
        <ul className="divide-y divide-[#EEF1F7]">
          {auditLogs.slice(0, 8).map((l) => (
            <li key={l.id} className="flex flex-col gap-1 py-2.5 text-xs sm:flex-row sm:justify-between">
              <div>
                <span className="font-bold text-[#0E1630]">Store #{l.storeNumber}</span> · {l.actionTaken}
                <div className="text-[#6B7488]">{l.notes}</div>
              </div>
              <div className="shrink-0 text-[#6B7488]">{l.actor} · {l.timestamp.substring(0, 16)}</div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

/* ------------------------------------------------------------------ Evidence review */
const RATING_LABEL: Record<number, string> = { 1: 'Critical non-compliance', 2: 'Poor', 3: 'Fair', 4: 'Good', 5: 'Excellent' };

const EvidenceReview: React.FC<{ stores: FranchiseStore[]; onRate: (n: number, mediaId: string, rating: number, note?: string) => void }> = ({ stores, onRate }) => {
  const [filter, setFilter] = useState('awaiting');
  const [zoom, setZoom] = useState<{ src: string; label: string } | null>(null);
  const [draft, setDraft] = useState<Record<string, { rating: number; note: string }>>({});

  const items = useMemo(
    () =>
      stores
        .flatMap((s) => s.photos.filter((p) => p.reviewStatus).map((p) => ({ store: s, p })))
        .sort((a, b) => b.p.timestamp.localeCompare(a.p.timestamp)),
    [stores]
  );
  const awaiting = items.filter((i) => i.p.reviewStatus === 'awaiting_officer');
  const rated = items.filter((i) => i.p.reviewStatus === 'rated');
  const shown = filter === 'awaiting' ? awaiting : rated;

  return (
    <div className="space-y-5">
      <Segmented value={filter} onChange={setFilter} options={[{ value: 'awaiting', label: `Awaiting rating (${awaiting.length})` }, { value: 'rated', label: `Rated (${rated.length})` }]} />
      {shown.length === 0 ? (
        <Empty
          icon={<Film className="h-10 w-10" />}
          title={filter === 'awaiting' ? 'Nothing waiting' : 'No rated evidence yet'}
          text={filter === 'awaiting' ? 'When a store uploads a video, ten random frames appear here for you to rate.' : 'Evidence you rate will be listed here.'}
        />
      ) : (
        <div className="space-y-5">
          {shown.map(({ store, p }) => {
            const d = draft[p.id] || { rating: 0, note: '' };
            const frames = p.frames && p.frames.length ? p.frames : [{ id: p.id, timeSec: 0, dataUrl: p.imageUrl }];
            return (
              <article key={p.id} className="fg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-[#0E1630]">{store.name}</div>
                    <div className="text-xs text-[#6B7488]">{p.zone} · {p.timestamp} · from {p.submittedBy || 'store team'}{p.durationSec ? ` · ${p.durationSec}s video` : ''}</div>
                  </div>
                  <Pill tone={p.reviewStatus === 'rated' ? 'low' : 'info'}>{p.reviewStatus === 'rated' ? `Rated ${p.officerRating}/5` : 'Awaiting rating'}</Pill>
                </div>
                {p.customerComment && <p className="mt-2 text-xs italic text-[#4A5368]">Store note: "{p.customerComment}"</p>}

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {frames.map((f) => (
                    <button key={f.id} onClick={() => setZoom({ src: f.dataUrl, label: `${store.name} · frame at ${f.timeSec}s` })} className="group relative overflow-hidden rounded-lg bg-[#0B1226]">
                      <img src={f.dataUrl} alt={`Frame at ${f.timeSec}s`} className="aspect-video w-full object-cover transition-transform group-hover:scale-105" />
                      <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white">{f.timeSec}s</span>
                    </button>
                  ))}
                </div>

                {p.reviewStatus === 'rated' ? (
                  <div className="mt-4 rounded-lg bg-[#F5F7FC] p-3 text-xs text-[#38425A]">
                    <b className="text-[#0E1630]">{p.officerRating}/5 · {RATING_LABEL[p.officerRating || 3]}</b> · {p.officerRatedAt}
                    {p.officerNote && <div className="mt-1">"{p.officerNote}"</div>}
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-3 border-t border-[#EEF1F7] pt-4 lg:flex-row lg:items-center">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} aria-label={`${n} stars`} onClick={() => setDraft({ ...draft, [p.id]: { ...d, rating: n } })} className="p-0.5">
                          <Star className={`h-7 w-7 ${n <= d.rating ? 'fill-[#F2B84B] text-[#F2B84B]' : 'text-[#D5DAE6]'}`} />
                        </button>
                      ))}
                      <span className="ml-2 w-44 text-xs font-bold text-[#0E1630]">{d.rating ? `${d.rating}/5 · ${RATING_LABEL[d.rating]}` : 'Choose a rating'}</span>
                    </div>
                    <input value={d.note} onChange={(e) => setDraft({ ...draft, [p.id]: { ...d, note: e.target.value } })} placeholder="Note for the store (optional)" className="min-w-0 flex-1 rounded-xl border border-[#DDE2EE] bg-[#F9FAFD] px-3 py-2.5 text-xs focus:border-[#4650D6] focus:outline-none" />
                    <button disabled={!d.rating} onClick={() => onRate(store.storeNumber, p.id, d.rating, d.note.trim() || undefined)} className="rounded-xl bg-[#0B1226] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1B2547] disabled:opacity-40">
                      Save rating
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {zoom && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={() => setZoom(null)} role="dialog" aria-label="Frame preview">
          <button className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white" aria-label="Close"><X className="h-5 w-5" /></button>
          <figure className="max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img src={zoom.src} alt={zoom.label} className="max-h-[80vh] rounded-lg" />
            <figcaption className="mt-2 text-center text-xs text-white/80">{zoom.label}</figcaption>
          </figure>
        </div>
      )}
    </div>
  );
};
