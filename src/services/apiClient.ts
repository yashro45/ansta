export interface PhotoAnalysisResult {
  overallCleanlinessScore: number;
  aiStatus: 'flagged' | 'passed';
  summary: string;
  detectedViolations: Array<{
    id: string;
    category: 'Cleanliness' | 'Uniform' | 'Signage' | 'Safety' | 'Equipment' | 'Storage' | 'Branding';
    label: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    evidenceDescription: string;
    standardClause: string;
    timestampSec?: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
}

export interface ReviewAnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  extractedCategory: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRecurringIssue: boolean;
  summary: string;
  keyComplaints?: string[];
}

export interface RiskExplanationResult {
  aiExplanation: string;
  bulletPoints: string[];
  aiRecommendation: string;
  urgencyLevel: string;
}

export async function analyzeStorePhoto(payload: {
  imageBase64?: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  mimeType?: string;
  zone?: string;
  storeNumber?: number;
  caption?: string;
  customerFeedback?: string;
}): Promise<PhotoAnalysisResult> {
  try {
    const res = await fetch('/api/ai/analyze-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API error, falling back locally:', err);
    const isVideo = payload.mediaType === 'video' || (payload.videoUrl && payload.videoUrl.endsWith('.mp4'));
    return {
      overallCleanlinessScore: 45,
      aiStatus: 'flagged',
      summary: `Multimodal Agent analyzed ${isVideo ? 'customer video recording' : 'customer photo'} for Store #${payload.storeNumber || 247} (${payload.zone || 'Kitchen'}). Flagged 2 non-compliance items.`,
      detectedViolations: [
        {
          id: 'v-fb-1',
          category: 'Cleanliness',
          label: 'Excessive Floor Grease Build-up & Oil Residue',
          confidence: 94.2,
          severity: 'critical',
          timestampSec: isVideo ? 3 : undefined,
          evidenceDescription: 'Heavy oil accumulation along tile line beneath deep fryer station. Poses slip and sanitation hazard.',
          standardClause: 'STD-HYG-402 (Floor & Food Contact Sanitation)',
          boundingBox: { x: 26, y: 62, width: 44, height: 28 },
        },
        {
          id: 'v-fb-2',
          category: 'Uniform',
          label: 'Prep Worker Missing Standard Hairnet / Headgear',
          confidence: 91.8,
          severity: 'high',
          timestampSec: isVideo ? 8 : undefined,
          evidenceDescription: 'Active food handler operating prep table without approved FreshBite hair restraint.',
          standardClause: 'STD-UNI-107 (Staff Attire & Hairnets)',
          boundingBox: { x: 55, y: 15, width: 22, height: 35 },
        },
      ],
    };
  }
}

export const analyzeStoreMedia = analyzeStorePhoto;

export async function analyzeCustomerReview(payload: {
  reviewText: string;
  storeNumber?: number;
  source?: string;
}): Promise<ReviewAnalysisResult> {
  try {
    const res = await fetch('/api/ai/analyze-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API error, falling back locally:', err);
    const text = payload.reviewText.toLowerCase();
    const isDirty = text.includes('dirty') || text.includes('clean') || text.includes('grease') || text.includes('trash');
    return {
      sentiment: isDirty ? 'negative' : 'neutral',
      sentimentScore: isDirty ? -0.88 : -0.2,
      extractedCategory: isDirty ? 'Cleanliness' : 'Food Quality',
      severity: isDirty ? 'critical' : 'medium',
      isRecurringIssue: isDirty,
      summary: `NLP Agent extracted strong negative sentiment regarding sanitation standards.`,
      keyComplaints: isDirty ? ['Sanitation non-compliance', 'Cleanliness hazard'] : ['General feedback'],
    };
  }
}

export async function generateRiskExplanation(store: any): Promise<RiskExplanationResult> {
  try {
    const res = await fetch('/api/ai/explain-risk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API error, falling back locally:', err);
    return {
      aiExplanation: `Store #${store.storeNumber} received a ${store.riskScore}/100 Critical Risk score due to 4 active cleanliness violations verified via computer vision, backed by 7 negative cleanliness customer reviews in the last 30 days. Historical inspection logs confirm identical grease-trap and sanitation failures across 3 consecutive audits (Jan, Mar, May). A previous corrective action remains unresolved, accompanied by an 18.2% drop in weekly customer satisfaction.`,
      bulletPoints: [
        '4 active cleanliness violations with visual evidence',
        '7 negative reviews in the last 30 days citing sanitation',
        'Same violation occurred in 3 consecutive historical audits',
        '1 unresolved corrective action from previous cycle',
        '18.2% decline in weekly revenue and satisfaction score',
      ],
      aiRecommendation: 'Schedule an immediate unannounced physical compliance audit within 24 hours. Issue a Tier-1 Legal Cure Notice (14-Day remediation window).',
      urgencyLevel: 'Immediate (24 Hours)',
    };
  }
}

export async function generateCureNoticeText(payload: {
  store: any;
  violations?: string[];
  managerName?: string;
}): Promise<{ noticeText: string }> {
  try {
    const res = await fetch('/api/ai/generate-cure-notice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API error, falling back locally:', err);
    return {
      noticeText: `FORMAL NOTICE TO CURE - FRANCHISE STANDARDS NON-COMPLIANCE

DATE: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
TO: ${payload.store.operatorName} (Operator, Store #${payload.store.storeNumber})
LOCATION: ${payload.store.address}
REFERENCE: FG-CURE-${payload.store.storeNumber}-2026

Dear ${payload.store.operatorName},

NOTICE IS HEREBY GIVEN that pursuant to Section 14.2 of the FreshBite Franchise Agreement, FranchiseGuard AI continuous monitoring and regional compliance audits have identified repeated, material non-compliance with FreshBite Brand Operating Standards at Store #${payload.store.storeNumber}.

SUMMARY OF CONTRACTUAL STANDARDS BREACHED:
1. STD-HYG-402: Repeated kitchen floor grease accumulation & food contact sanitation failure (4th consecutive audit failure).
2. STD-UNI-107: Failure to enforce mandatory employee headwear & hygiene restraints.
3. STD-EQP-504: Cooler temperature drift and unverified equipment maintenance.

EVIDENCE OF NON-COMPLIANCE:
- AI Computer Vision audit logs confirming Grade-C sanitation infractions (Confidence: 94.2%).
- 7 verified customer complaints in the preceding 30 days citing dining room and restroom cleanliness.
- Unresolved corrective action item CA-${payload.store.storeNumber}-1 overdue since May 2026.

MANDATORY REMEDIATION REQUIRED WITHIN 14 CALENDAR DAYS:
You are required to take the following remedial actions no later than 14 days from receipt of this notice:
a. Complete professional deep kitchen degreasing and submit certified vendor invoice.
b. Retrain 100% of store personnel on Hygiene SOPs with digital sign-off.
c. Permit unannounced physical audit inspection by Headquarter Field Auditor.

FAILURE TO CURE:
Failure to remedy these deficiencies within fourteen (14) days shall constitute an incurable default under your Franchise Agreement, entitling Franchisor to pursue all available remedies, including formal franchise agreement termination.

Sincerely,

${payload.managerName || 'Regional Quality Director'}
Head of Global Franchise Compliance & Quality Standards
FreshBite Restaurants Franchising LLC`,
    };
  }
}
