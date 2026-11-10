import {
  StorePhotoAudit,
  FranchiseStore,
  CustomerReview,
  HistoricalInspection,
  CorrectiveActionItem,
} from '../types/franchise';

function rng(seed: number) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const NEG: Array<{ text: string; cat: CustomerReview['extractedCategory']; sev: CustomerReview['severity'] }> = [
  { text: 'Tables were sticky and the bin near the counter was overflowing during lunch.', cat: 'Cleanliness', sev: 'high' },
  { text: 'Waited more than 25 minutes for a simple bowl order. Counter staff had no update.', cat: 'Speed & Service', sev: 'medium' },
  { text: 'Staff were not wearing hairnets while handling food. Not what I expect from this brand.', cat: 'Staff Behavior', sev: 'high' },
  { text: 'Food arrived lukewarm and the plating was careless.', cat: 'Food Quality', sev: 'medium' },
  { text: 'Restroom had no soap and the floor was wet.', cat: 'Cleanliness', sev: 'high' },
  { text: 'The cold drinks fridge was not cooling and the menu board was flickering.', cat: 'Equipment / Facilities', sev: 'medium' },
];
const POS = [
  'Quick service, clean tables and friendly staff. Will come back.',
  'Fresh food and a spotless dining area. Great value.',
  'Order was ready before the time promised and the team was polite.',
];
const SOURCES: CustomerReview['source'][] = ['Google Reviews', 'Zomato', 'Swiggy', 'App Feedback', 'Customer Care Ticket'];

function genReviews(s: FranchiseStore, r: () => number): CustomerReview[] {
  const negCount = Math.min(6, s.negativeReviewsCount30d);
  const out: CustomerReview[] = [];
  for (let i = 0; i < negCount; i++) {
    const t = NEG[Math.floor(r() * NEG.length)];
    const rating = t.sev === 'high' ? 1 + Math.floor(r() * 2) : 2 + Math.floor(r() * 2);
    out.push({
      id: `rev-${s.storeNumber}-n${i}`,
      timestamp: `2026-10-${String(28 - i * 3).padStart(2, '0')}`,
      source: SOURCES[Math.floor(r() * SOURCES.length)],
      rating,
      text: t.text,
      sentiment: 'negative',
      sentimentScore: -(0.55 + r() * 0.4),
      extractedCategory: t.cat,
      severity: t.sev,
      isRecurringIssue: r() > 0.6,
    });
  }
  const posCount = s.riskScore < 60 ? 3 : 1;
  for (let i = 0; i < posCount; i++) {
    out.push({
      id: `rev-${s.storeNumber}-p${i}`,
      timestamp: `2026-10-${String(30 - i * 4).padStart(2, '0')}`,
      source: SOURCES[Math.floor(r() * SOURCES.length)],
      rating: 4 + Math.floor(r() * 2),
      text: POS[i % POS.length],
      sentiment: 'positive',
      sentimentScore: 0.6 + r() * 0.35,
      extractedCategory: 'Speed & Service',
      severity: 'low',
      isRecurringIssue: false,
    });
  }
  return out.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

const AUDITORS = ['Anita Mishra (Regional QA)', 'Vikram Rao (Field Auditor)', 'Sana Qureshi (Regional QA)'];
const VIOLATIONS = [
  'STD-HYG-402: Floor and fryer area sanitation',
  'STD-UNI-107: Hair restraint / apron missing',
  'STD-SIG-301: Signage illumination',
  'STD-EQP-504: Cooler temperature log gap',
  'STD-SAF-202: Fire extinguisher tag overdue',
];

function genInspections(s: FranchiseStore, r: () => number): HistoricalInspection[] {
  const dates = ['2026-09-22', '2026-06-18', '2026-03-12'];
  return dates.map((date, i) => {
    const base = 100 - s.riskScore;
    const score = Math.max(20, Math.min(99, Math.round(base + (i - 1) * 4 + (r() - 0.5) * 10)));
    const fails = score >= 85 ? 0 : score >= 70 ? 1 : score >= 55 ? 2 : 3;
    const found = VIOLATIONS.slice(0, fails).map((_, k) => VIOLATIONS[(k + i) % VIOLATIONS.length]);
    return {
      id: `insp-${s.storeNumber}-${i}`,
      date,
      auditorName: AUDITORS[(s.storeNumber + i) % AUDITORS.length],
      score,
      violationsFound: found,
      cleanlinessPass: !found.some((f) => f.includes('HYG')),
      uniformPass: !found.some((f) => f.includes('UNI')),
      equipmentPass: !found.some((f) => f.includes('EQP')),
      safetyPass: !found.some((f) => f.includes('SAF')),
      status: fails >= 3 ? 'Escalated' : fails > 0 && i === 0 ? 'Pending Remediation' : 'Completed',
      notes: fails === 0 ? 'No material deviations. Standards maintained.' : `${fails} deviation(s) logged. Corrective actions assigned to the store manager.`,
    };
  });
}

const ACTION_TITLES: Array<[string, string, CorrectiveActionItem['priority']]> = [
  ['Deep-clean fryer station and floor tiles', 'Grease build-up found at last audit', 'High'],
  ['Re-train kitchen staff on hair restraint SOP', 'New hires skipped onboarding module', 'High'],
  ['Replace flickering menu board backlight', 'LED driver failure', 'Medium'],
  ['Calibrate walk-in cooler and sync temperature log', 'Sensor drift', 'Urgent'],
  ['Refresh promotional vinyls to current campaign', 'Outdated POP material', 'Low'],
];

function genActions(s: FranchiseStore): CorrectiveActionItem[] {
  const open = s.unresolvedActionsCount + (s.riskScore >= 30 ? 1 : 0);
  const total = Math.min(ACTION_TITLES.length, open + (s.riskScore >= 15 ? 1 : 0));
  const out: CorrectiveActionItem[] = [];
  for (let i = 0; i < total; i++) {
    const [title, rootCause, priority] = ACTION_TITLES[(i + s.storeNumber) % ACTION_TITLES.length];
    const resolved = i >= open;
    const overdue = !resolved && i < s.unresolvedActionsCount;
    out.push({
      id: `CA-${s.storeNumber}-${i + 1}`,
      title,
      assignedTo: s.operatorName.split(' (')[0],
      dueDate: overdue ? '2026-10-20' : `2026-11-${String(12 + i * 4).padStart(2, '0')}`,
      status: resolved ? 'Resolved' : overdue ? 'Overdue' : i % 2 ? 'In Progress' : 'Open',
      priority,
      rootCause,
      humanApprovalRequired: priority === 'Urgent' || priority === 'High',
    });
  }
  return out;
}

function genPhotos(s: FranchiseStore, r: () => number): StorePhotoAudit[] {
  if (s.riskScore < 60) return [];
  const kitchen = r() > 0.4;
  const crit = s.riskScore >= 90;
  return [
    {
      id: `photo-${s.storeNumber}-auto`,
      timestamp: '2026-10-29 11:20',
      imageUrl: kitchen
        ? 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      mediaType: 'image',
      caption: kitchen ? `Kitchen prep line walkthrough, store #${s.storeNumber}` : `Dining room check, store #${s.storeNumber}`,
      zone: kitchen ? 'Kitchen / Prep Area' : 'Dining Room',
      overallCleanlinessScore: Math.max(30, 100 - s.riskScore + 10),
      aiStatus: 'flagged',
      submittedBy: 'Field Auditor (Regional QA)',
      detectedViolations: [
        {
          id: `v-${s.storeNumber}-auto-1`,
          category: 'Cleanliness',
          label: kitchen ? 'Grease build-up on floor and fryer rim' : 'Uncleared tables and overflowing bin',
          confidence: 90 + Math.round(r() * 60) / 10,
          severity: crit ? 'critical' : 'high',
          boundingBox: { x: 28, y: 55, width: 42, height: 30 },
          evidenceDescription: kitchen ? 'Dark oil residue along the lower line tile near the fryer.' : 'Waste receptacle overflowing during peak turnover.',
          standardClause: 'STD-HYG-402 (Food Contact & Floor Sanitation)',
        },
      ],
    },
  ];
}

/** Gives every store a believable history so each portal page has real content. Existing data is never overwritten. */
export function enrichStore(s: FranchiseStore): FranchiseStore {
  const r = rng(s.storeNumber + 17);
  return {
    ...s,
    photos: s.photos.length ? s.photos : genPhotos(s, r),
    reviews: s.reviews.length ? s.reviews : genReviews(s, r),
    inspections: s.inspections.length ? s.inspections : genInspections(s, r),
    correctiveActions: s.correctiveActions.length ? s.correctiveActions : genActions(s),
  };
}
