import React, { useMemo, useState } from 'react';
import { BookOpen, Camera, CheckCircle2, ClipboardCheck, Film, LayoutDashboard, MessageSquareQuote, Plus, Send, Star } from 'lucide-react';
import { CorrectiveActionItem, CustomerReview, FranchiseStore, StorePhotoAudit } from '../types/franchise';
import { Session } from '../lib/auth';
import { Shell, NavItem } from '../components/Shell';
import { Card, Empty, Kpi, Pill, Toast, riskTone } from '../components/ui';
import { Donut, LineChart, PALETTE, RISK_COLORS, Ring } from '../components/charts';
import { modelSeries, weekLabels } from '../data/analytics';
import { inr, pct, secToMin } from '../lib/format';
import { CustomerMediaUploadModal } from '../components/CustomerMediaUploadModal';
import { BrandStandardsManual } from '../components/BrandStandardsManual';
import { analyzeCustomerReview } from '../services/apiClient';

const TITLES: Record<string, [string, string]> = {
  overview: ['My store', 'Your standards score, key numbers and what needs attention.'],
  media: ['Evidence & videos', 'Upload a walkthrough video or photos. Ten random frames go to the compliance officer, who rates them.'],
  actions: ['Corrective actions', 'Fix what the audit found and report progress to headquarters.'],
  reviews: ['Customer reviews', 'What customers say about your store.'],
  standards: ['Brand standards', 'The SOPs every outlet is audited against.'],
};

export const StorePortal: React.FC<{
  session: Session;
  store: FranchiseStore;
  onLogout: () => void;
  onMediaSubmitted: (storeNumber: number, media: StorePhotoAudit, notes?: string) => void;
  onActionStatus: (storeNumber: number, actionId: string, status: CorrectiveActionItem['status']) => void;
  onAddReview: (storeNumber: number, review: CustomerReview) => void;
}> = ({ session, store, onLogout, onMediaSubmitted, onActionStatus, onAddReview }) => {
  const [page, setPage] = useState('overview');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const openActions = store.correctiveActions.filter((a) => a.status !== 'Resolved');
  const nav: NavItem[] = [
    { id: 'overview', label: 'My store', icon: LayoutDashboard },
    { id: 'media', label: 'Evidence & videos', icon: Camera, badge: store.photos.length || undefined },
    { id: 'actions', label: 'Corrective actions', icon: ClipboardCheck, badge: openActions.length || undefined },
    { id: 'reviews', label: 'Customer reviews', icon: MessageSquareQuote },
    { id: 'standards', label: 'Brand standards', icon: BookOpen },
  ];

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };

  const [title, sub] = TITLES[page];
  const color = RISK_COLORS[store.riskLevel];
  const score = 100 - store.riskScore;
  const labels = useMemo(() => weekLabels(12), []);
  const revSeries = useMemo(() => modelSeries(store.posMetrics.weeklyRevenue, 0.011, 0.03, String(store.storeNumber), 12, true), [store]);
  const csatSeries = useMemo(() => modelSeries(store.posMetrics.customerSatisfactionScore, 0.3, 1.2, 'c' + store.storeNumber, 12), [store]);

  const uploadBtn = (
    <button
      onClick={() => setUploadOpen(true)}
      className="inline-flex items-center gap-2 rounded-xl bg-[#0B1226] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1B2547]"
    >
      <Plus className="h-4 w-4" /> Upload photo or video
    </button>
  );

  return (
    <Shell session={session} nav={nav} active={page} onNavigate={setPage} onLogout={onLogout} title={title} subtitle={sub} actions={page === 'overview' || page === 'media' ? uploadBtn : undefined}>
      {page === 'overview' && (
        <div className="space-y-5">
          <Card>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <Ring value={score} color={color} label="Standards score" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold tracking-tight text-[#0E1630]">{store.name}</h2>
                  <Pill tone={riskTone(store.riskLevel)}>{store.riskLevel} risk</Pill>
                </div>
                <p className="mt-1 text-xs text-[#6B7488]">{store.address} · Operator: {store.operatorName}</p>
                <div className="mt-3 rounded-xl bg-[#F5F7FC] p-3 text-xs leading-relaxed text-[#38425A]">
                  <b className="text-[#0E1630]">AI assessment. </b>{store.aiExplanation}
                </div>
                <div className="mt-2 rounded-xl bg-[#EEF0FF] p-3 text-xs leading-relaxed text-[#272C6E]">
                  <b>Recommended next step. </b>{store.aiRecommendation}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Weekly revenue" value={inr(store.posMetrics.weeklyRevenue)} hint={`${store.posMetrics.revenueChangePct >= 0 ? '+' : ''}${store.posMetrics.revenueChangePct.toFixed(1)}% vs last week`} spark={revSeries} color={PALETTE[0]} />
            <Kpi label="Customer satisfaction" value={`${store.posMetrics.customerSatisfactionScore} / 100`} spark={csatSeries} color={PALETTE[4]} hint={`${store.negativeReviewsCount30d} negative reviews in 30 days`} />
            <Kpi label="Avg service time" value={secToMin(store.posMetrics.avgTicketTimeSec)} hint={`Waste ${pct(store.posMetrics.wastePercentage)} · Turnover ${store.posMetrics.staffTurnoverRate}%`} />
            <Kpi label="Open actions" value={String(openActions.length)} hint={`${store.recentViolationsCount} AI-detected violations`} />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card className="xl:col-span-2" title="Revenue and satisfaction" subtitle="Last 12 weeks">
              <LineChart labels={labels} series={[{ name: 'Weekly revenue', color: PALETTE[0], values: revSeries }]} fmt={inr} height={230} fill />
            </Card>
            <Card title="Latest audit checklist" subtitle={store.inspections[0] ? `${store.inspections[0].date} · score ${store.inspections[0].score}` : 'No audit yet'}>
              {store.inspections[0] ? (
                <ul className="space-y-2.5 text-sm">
                  {[
                    ['Cleanliness', store.inspections[0].cleanlinessPass],
                    ['Uniform & hygiene', store.inspections[0].uniformPass],
                    ['Equipment', store.inspections[0].equipmentPass],
                    ['Safety', store.inspections[0].safetyPass],
                  ].map(([l, ok]) => (
                    <li key={String(l)} className="flex items-center justify-between">
                      <span className="text-[#38425A]">{l}</span>
                      <Pill tone={ok ? 'low' : 'critical'}>{ok ? 'Pass' : 'Fail'}</Pill>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#6B7488]">No audits recorded yet.</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {page === 'media' && (
        <div className="space-y-5">
          {store.photos.length === 0 ? (
            <Empty
              icon={<Film className="h-10 w-10" />}
              title="No evidence uploaded yet"
              text="Upload a walkthrough video of your kitchen, dining area and storage. Ten random frames are sent to the compliance officer for rating."
              action={uploadBtn}
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {store.photos.map((p) => {
                const isVideo = p.mediaType === 'video' && p.videoUrl;
                return (
                  <article key={p.id} className="fg-card overflow-hidden">
                    <div className="relative aspect-video bg-[#0B1226]">
                      {isVideo ? (
                        <video src={p.videoUrl} poster={p.imageUrl} controls playsInline preload="none" className="h-full w-full object-cover" />
                      ) : (
                        <img src={p.imageUrl} alt={p.caption} loading="lazy" className="h-full w-full object-cover" />
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white">{isVideo ? 'Video' : 'Photo'}</span>
                      {!p.reviewStatus && (
                        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold ${p.aiStatus === 'flagged' ? 'bg-[#D6304A] text-white' : 'bg-[#1E9E6A] text-white'}`}>
                          {p.aiStatus === 'flagged' ? 'Flagged' : 'Passed'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 p-4">
                      <div className="text-sm font-bold text-[#0E1630]">{p.caption}</div>
                      <div className="text-[11px] text-[#6B7488]">{p.zone} · {p.timestamp}{p.overallCleanlinessScore > 0 && !p.reviewStatus ? ` · Hygiene score ${p.overallCleanlinessScore}/100` : ''}</div>
                      {p.reviewStatus && (
                        <div className="rounded-lg bg-[#F5F7FC] p-2.5 text-xs">
                          {p.reviewStatus === 'rated' ? (
                            <>
                              <div className="flex items-center gap-1.5 font-bold text-[#0E1630]">
                                <span className="inline-flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`h-3.5 w-3.5 ${n <= (p.officerRating || 0) ? 'fill-[#F2B84B] text-[#F2B84B]' : 'text-[#D5DAE6]'}`} />)}</span>
                                Rated {p.officerRating}/5 by the officer
                              </div>
                              {p.officerNote && <div className="mt-1 text-[#4A5368]">"{p.officerNote}"</div>}
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5 font-bold text-[#3A41B8]"><Send className="h-3.5 w-3.5" /> Sent to the officer. Waiting for a rating.</div>
                          )}
                        </div>
                      )}
                      {p.frames && p.frames.length > 1 && (
                        <div>
                          <div className="mb-1 text-[11px] font-semibold text-[#6B7488]">{p.frames.length} frames sent</div>
                          <div className="grid grid-cols-5 gap-1">
                            {p.frames.map((f) => <img key={f.id} src={f.dataUrl} alt={`Frame at ${f.timeSec}s`} title={`${f.timeSec}s`} className="aspect-video w-full rounded object-cover" />)}
                          </div>
                        </div>
                      )}
                      {p.reviewStatus && p.detectedViolations.length === 0 ? null : p.detectedViolations.length === 0 ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#13805A]"><CheckCircle2 className="h-4 w-4" /> No violations detected</div>
                      ) : (
                        <ul className="space-y-1.5">
                          {p.detectedViolations.map((v) => (
                            <li key={v.id} className="rounded-lg bg-[#F5F7FC] p-2 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-[#0E1630]">{v.label}</span>
                                <Pill tone={riskTone(v.severity)}>{v.severity}</Pill>
                              </div>
                              <div className="mt-0.5 text-[#6B7488]">{v.standardClause}{v.timestampSec !== undefined ? ` · at ${v.timestampSec}s` : ''}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {page === 'actions' && (
        <div className="space-y-5">
          {store.correctiveActions.length === 0 ? (
            <Empty icon={<ClipboardCheck className="h-10 w-10" />} title="Nothing to fix" text="No corrective actions are assigned to your store right now." />
          ) : (
            <div className="space-y-3">
              {store.correctiveActions.map((a) => {
                const tone = a.status === 'Resolved' ? 'low' : a.status === 'Overdue' ? 'critical' : a.status === 'In Progress' ? 'info' : 'neutral';
                return (
                  <div key={a.id} className="fg-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#0E1630]">{a.title}</span>
                        <Pill tone={tone}>{a.status}</Pill>
                        <Pill tone={a.priority === 'Urgent' ? 'critical' : a.priority === 'High' ? 'high' : a.priority === 'Medium' ? 'medium' : 'neutral'}>{a.priority}</Pill>
                      </div>
                      <div className="mt-1 text-xs text-[#6B7488]">Due {a.dueDate} · Assigned to {a.assignedTo} · Root cause: {a.rootCause}</div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {a.status !== 'Resolved' && a.status !== 'In Progress' && (
                        <button onClick={() => { onActionStatus(store.storeNumber, a.id, 'In Progress'); flash('Marked as in progress.'); }} className="rounded-lg border border-[#DDE2EE] px-3 py-2 text-xs font-bold text-[#0E1630] hover:bg-[#F5F7FC]">
                          Start work
                        </button>
                      )}
                      {a.status !== 'Resolved' && (
                        <button onClick={() => { onActionStatus(store.storeNumber, a.id, 'Resolved'); flash('Marked as resolved. Headquarters will verify.'); }} className="rounded-lg bg-[#0B1226] px-3 py-2 text-xs font-bold text-white hover:bg-[#1B2547]">
                          Mark resolved
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Card title="Audit history" subtitle="Past inspections of your store" bodyClassName="overflow-x-auto fg-scroll">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4E8F1] text-[#6B7488]">
                  <th className="py-2 font-semibold">Date</th>
                  <th className="py-2 font-semibold">Auditor</th>
                  <th className="py-2 text-right font-semibold">Score</th>
                  <th className="py-2 pl-6 font-semibold">Findings</th>
                  <th className="py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {store.inspections.map((i) => (
                  <tr key={i.id} className="border-b border-[#F0F2F8] align-top last:border-0">
                    <td className="py-2.5 font-semibold text-[#0E1630]">{i.date}</td>
                    <td className="py-2.5">{i.auditorName}</td>
                    <td className="py-2.5 text-right font-bold">{i.score}</td>
                    <td className="py-2.5 pl-6 text-[#4A5368]">{i.violationsFound.length ? i.violationsFound.join('; ') : 'No findings'}</td>
                    <td className="py-2.5"><Pill tone={i.status === 'Completed' ? 'low' : i.status === 'Escalated' ? 'critical' : 'medium'}>{i.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {page === 'reviews' && <ReviewsPage store={store} onAddReview={onAddReview} flash={flash} />}
      {page === 'standards' && <BrandStandardsManual />}

      {uploadOpen && (
        <CustomerMediaUploadModal
          isOpen
          lockStore
          onClose={() => setUploadOpen(false)}
          stores={[store]}
          preselectedStoreNumber={store.storeNumber}
          onMediaSubmitted={(n, media, text) => {
            onMediaSubmitted(n, media, text);
            flash(media.mediaType === 'video' ? 'Sent to the officer: 10 random frames from your video.' : 'Photo sent to the officer.');
          }}
        />
      )}
      <Toast message={toast} />
    </Shell>
  );
};

const ReviewsPage: React.FC<{ store: FranchiseStore; onAddReview: (n: number, r: CustomerReview) => void; flash: (m: string) => void }> = ({ store, onAddReview, flash }) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const counts = { positive: 0, neutral: 0, negative: 0 };
  store.reviews.forEach((r) => counts[r.sentiment]++);
  const rated = store.reviews.filter((r) => r.rating > 0);
  const avg = rated.length ? rated.reduce((a, r) => a + r.rating, 0) / rated.length : 0;

  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const a = await analyzeCustomerReview({ reviewText: text, storeNumber: store.storeNumber, source: 'Manual entry' });
      onAddReview(store.storeNumber, {
        id: `rev-${store.storeNumber}-${Date.now()}`,
        timestamp: new Date().toISOString().substring(0, 10),
        source: 'Customer Care Ticket',
        rating: 0,
        text: text.trim(),
        sentiment: a.sentiment,
        sentimentScore: a.sentimentScore,
        extractedCategory: (a.extractedCategory as CustomerReview['extractedCategory']) || 'Food Quality',
        severity: a.severity,
        isRecurringIssue: a.isRecurringIssue,
      });
      setText('');
      flash('Feedback logged and analysed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="space-y-5 xl:col-span-2">
        <div className="space-y-3">
          {store.reviews.map((r) => (
            <div key={r.id} className="fg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {r.rating > 0 ? <span className="inline-flex">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? 'fill-[#F2B84B] text-[#F2B84B]' : 'text-[#D5DAE6]'}`} />)}</span> : <span className="text-[11px] font-bold text-[#6B7488]">Unrated</span>}
                  <span className="text-xs text-[#6B7488]">{r.source} · {r.timestamp}</span>
                </div>
                <div className="flex gap-1.5">
                  <Pill tone="info">{r.extractedCategory}</Pill>
                  <Pill tone={r.sentiment === 'negative' ? riskTone(r.severity) : r.sentiment === 'positive' ? 'low' : 'neutral'}>{r.sentiment}</Pill>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#38425A]">{r.text}</p>
              {r.isRecurringIssue && <div className="mt-2 text-[11px] font-bold text-[#B4501A]">Recurring issue</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-5">
        <Card title="Sentiment" subtitle={`${store.reviews.length} reviews${rated.length ? ` · average ${avg.toFixed(1)} stars` : ''}`}>
          <Donut
            size={150}
            centerLabel="reviews"
            items={[
              { label: 'Positive', value: counts.positive, color: RISK_COLORS.low },
              { label: 'Neutral', value: counts.neutral, color: '#9AA3B8' },
              { label: 'Negative', value: counts.negative, color: RISK_COLORS.critical },
            ]}
          />
        </Card>
        <Card title="Log customer feedback" subtitle="Paste a complaint or review. AI tags the topic and severity.">
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Tables were sticky and the waiter was rude."
            className="w-full resize-none rounded-xl border border-[#DDE2EE] bg-[#F9FAFD] p-3 text-xs focus:border-[#4650D6] focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-[#6B7488]">Ratings are given by the officer only.</span>
            <button disabled={busy || !text.trim()} onClick={submit} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1226] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-40">
              <Send className="h-3.5 w-3.5" /> {busy ? 'Analysing…' : 'Analyse and save'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
