import React, { useCallback, useMemo, useState } from 'react';
import { generateFleetStores, MOCK_SYSTEMIC_PATTERNS, MOCK_AUDIT_LOGS } from './data/mockFranchiseData';
import { enrichStore } from './data/enrich';
import { AuditLogEntry, CorrectiveActionItem, CustomerReview, FranchiseStore, StorePhotoAudit, SystemicPattern } from './types/franchise';
import { loadSession, saveSession, Session } from './lib/auth';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { Role } from './lib/auth';
import { OwnerPortal } from './portals/OwnerPortal';
import { StorePortal } from './portals/StorePortal';
import { OfficerPortal } from './portals/OfficerPortal';

const stamp = () => new Date().toISOString().replace('T', ' ').substring(0, 19);

export function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [stores, setStores] = useState<FranchiseStore[]>(() => generateFleetStores().map(enrichStore));
  const [patterns, setPatterns] = useState<SystemicPattern[]>(MOCK_SYSTEMIC_PATTERNS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);

  const [view, setView] = useState<'landing' | 'login'>('landing');
  const [loginRole, setLoginRole] = useState<Role>('owner');

  const login = (s: Session) => {
    saveSession(s);
    setSession(s);
  };
  const logout = () => {
    saveSession(null);
    setSession(null);
    setView('landing');
  };

  const patchStore = useCallback((n: number, fn: (s: FranchiseStore) => FranchiseStore) => {
    setStores((prev) => prev.map((s) => (s.storeNumber === n ? fn(s) : s)));
  }, []);

  const addLog = useCallback((entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    setAuditLogs((prev) => [{ ...entry, id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: stamp() }, ...prev]);
  }, []);

  /* Evidence (video frames or a photo) goes straight to the officer's queue. No rating is given at upload. */
  const onMediaSubmitted = useCallback(
    (storeNumber: number, media: StorePhotoAudit, notes?: string) => {
      const frameCount = media.frames?.length || 1;
      patchStore(storeNumber, (s) => ({
        ...s,
        photos: [media, ...s.photos],
        recentViolationsCount: s.recentViolationsCount + media.detectedViolations.length,
      }));
      addLog({
        storeNumber,
        actionTaken: media.mediaType === 'video' ? `Video submitted: ${frameCount} random frames sent to officer` : 'Photo submitted to officer',
        decisionType: 'Auto-Flagged',
        actor: media.submittedBy || 'Store team',
        notes: notes || 'Awaiting officer rating.',
        aiRecommendation: 'Officer to rate the evidence from the frames.',
      });
    },
    [patchStore, addLog]
  );

  /* The officer rates evidence from the frames. The rating moves the store's risk score. */
  const onRateEvidence = useCallback(
    (storeNumber: number, mediaId: string, rating: number, note?: string) => {
      const delta: Record<number, number> = { 1: 20, 2: 10, 3: 0, 4: -5, 5: -10 };
      const levelFor = (x: number): FranchiseStore['riskLevel'] => (x >= 90 ? 'critical' : x >= 60 ? 'high' : x >= 30 ? 'medium' : 'low');
      patchStore(storeNumber, (s) => {
        const riskScore = Math.max(1, Math.min(99, s.riskScore + (delta[rating] ?? 0)));
        return {
          ...s,
          photos: s.photos.map((p) =>
            p.id === mediaId
              ? { ...p, reviewStatus: 'rated' as const, officerRating: rating, officerNote: note, officerRatedAt: stamp(), overallCleanlinessScore: rating * 20 }
              : p
          ),
          riskScore,
          riskLevel: levelFor(riskScore),
          humanReviewStatus: rating <= 2 ? 'Pending Review' : s.humanReviewStatus,
        };
      });
      addLog({
        storeNumber,
        actionTaken: `Officer rated evidence ${rating}/5`,
        decisionType: rating <= 2 ? 'Auto-Flagged' : 'Approved',
        actor: 'Compliance Officer',
        notes: note || 'Rated from submitted frames.',
        aiRecommendation: rating <= 2 ? 'Rating is low. Store risk score raised.' : 'Rating accepted.',
      });
    },
    [patchStore, addLog]
  );

  const onApprove = useCallback(
    (n: number, type: string, note?: string) => {
      patchStore(n, (s) => ({ ...s, humanReviewStatus: 'Approved' }));
      addLog({ storeNumber: n, actionTaken: `Approved: ${type.replace(/_/g, ' ')}`, decisionType: 'Approved', actor: 'Compliance Officer', notes: note || 'Approved for field dispatch.', aiRecommendation: 'Physical inspection dispatched after AI risk flag.' });
    },
    [patchStore, addLog]
  );
  const onReject = useCallback(
    (n: number, note?: string) => {
      patchStore(n, (s) => ({ ...s, humanReviewStatus: 'Dismissed', riskScore: Math.max(25, s.riskScore - 20), riskLevel: 'medium' }));
      addLog({ storeNumber: n, actionTaken: 'Flag dismissed', decisionType: 'Rejected', actor: 'Compliance Officer', notes: note || 'Resolved locally or not a violation.', aiRecommendation: 'Dismissed after officer review.' });
    },
    [patchStore, addLog]
  );
  const onInvestigate = useCallback(
    (n: number, note?: string) => {
      patchStore(n, (s) => ({ ...s, humanReviewStatus: 'Under Investigation' }));
      addLog({ storeNumber: n, actionTaken: 'More evidence requested', decisionType: 'Investigating', actor: 'Compliance Officer', notes: note || 'Requested extra photos and POS logs.', aiRecommendation: 'Supplementary evidence requested.' });
    },
    [patchStore, addLog]
  );

  const onActionStatus = useCallback(
    (n: number, actionId: string, status: CorrectiveActionItem['status']) => {
      patchStore(n, (s) => {
        const correctiveActions = s.correctiveActions.map((a) => (a.id === actionId ? { ...a, status } : a));
        const unresolved = correctiveActions.filter((a) => a.status !== 'Resolved').length;
        return { ...s, correctiveActions, unresolvedActionsCount: unresolved };
      });
      addLog({ storeNumber: n, actionTaken: `Corrective action ${actionId} marked ${status.toLowerCase()}`, decisionType: 'Approved', actor: `Store ST${n}`, notes: 'Updated by the store team.', aiRecommendation: 'Awaiting officer verification.' });
    },
    [patchStore, addLog]
  );

  const onAddReview = useCallback(
    (n: number, review: CustomerReview) => {
      patchStore(n, (s) => ({
        ...s,
        reviews: [review, ...s.reviews],
        negativeReviewsCount30d: review.sentiment === 'negative' ? s.negativeReviewsCount30d + 1 : s.negativeReviewsCount30d,
      }));
    },
    [patchStore]
  );

  const onDispatchRemediation = useCallback((id: string) => {
    setPatterns((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'Remediation Mandate Sent' } : p)));
  }, []);

  const myStore = useMemo(
    () => (session?.role === 'store' ? stores.find((s) => s.storeNumber === session.storeNumber) || null : null),
    [session, stores]
  );

  if (!session) {
    return view === 'landing' ? (
      <LandingPage onSignIn={(r) => { setLoginRole(r || 'owner'); setView('login'); }} />
    ) : (
      <LoginPage key={loginRole} onLogin={login} onBack={() => setView('landing')} initialRole={loginRole} />
    );
  }
  if (session.role === 'owner') return <OwnerPortal session={session} stores={stores} patterns={patterns} onLogout={logout} />;
  if (session.role === 'store' && myStore) {
    return <StorePortal session={session} store={myStore} onLogout={logout} onMediaSubmitted={onMediaSubmitted} onActionStatus={onActionStatus} onAddReview={onAddReview} />;
  }
  if (session.role === 'officer') {
    return (
      <OfficerPortal
        session={session}
        stores={stores}
        patterns={patterns}
        auditLogs={auditLogs}
        onLogout={logout}
        onApprove={onApprove}
        onReject={onReject}
        onInvestigate={onInvestigate}
        onMediaSubmitted={onMediaSubmitted}
        onRateEvidence={onRateEvidence}
        onDispatchRemediation={onDispatchRemediation}
      />
    );
  }
  return <LoginPage onLogin={login} />;
}

export default App;
