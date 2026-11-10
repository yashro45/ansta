export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  city: string;
  state: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central' | 'Metro';
}

export interface POSMetrics {
  weeklyRevenue: number;
  revenueChangePct: number; // e.g. -18.2
  avgTicketTimeSec: number;
  wastePercentage: number;
  staffTurnoverRate: number; // % quarterly
  customerSatisfactionScore: number; // 0-100
}

export interface VisualViolationDetection {
  id: string;
  category: 'Cleanliness' | 'Uniform' | 'Signage' | 'Safety' | 'Equipment' | 'Storage' | 'Branding';
  label: string;
  confidence: number; // 0 - 100
  severity: 'low' | 'medium' | 'high' | 'critical';
  boundingBox?: { x: number; y: number; width: number; height: number }; // percentages
  evidenceDescription: string;
  standardClause: string;
  timestampSec?: number; // For video timestamps (e.g. 00:04 in video)
}

export interface StorePhotoAudit {
  id: string;
  timestamp: string;
  imageUrl: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  durationSec?: number;
  caption: string;
  zone: 'Kitchen / Prep Area' | 'Dining Room' | 'Restroom' | 'Storefront / Entrance' | 'Storage / Walk-in' | 'Drive-Thru / POS' | 'Food Quality & Plating';
  detectedViolations: VisualViolationDetection[];
  overallCleanlinessScore: number;
  aiStatus: 'analyzed' | 'flagged' | 'passed';
  submittedBy?: string; // e.g. "Customer (Dine-in)", "Mystery Auditor", "Store Supervisor"
  customerRating?: number; // legacy field, no longer collected
  customerComment?: string;
  orderNumber?: string;
  /** Random frames taken from the video in the browser, sent to the officer for rating. */
  frames?: { id: string; timeSec: number; dataUrl: string }[];
  reviewStatus?: 'awaiting_officer' | 'rated';
  officerRating?: number; // 1 to 5, given by the officer from the frames
  officerNote?: string;
  officerRatedAt?: string;
}

export interface CustomerMediaSubmission {
  id: string;
  storeNumber: number;
  storeName: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  zone: 'Kitchen / Prep Area' | 'Dining Room' | 'Restroom' | 'Storefront / Entrance' | 'Storage / Walk-in' | 'Drive-Thru / POS' | 'Food Quality & Plating';
  customerName: string;
  customerPhone?: string;
  orderNumber?: string;
  rating: number;
  feedbackText: string;
  timestamp: string;
  aiStatus: 'analyzed' | 'flagged' | 'passed';
  cleanlinessScore: number;
  violations: VisualViolationDetection[];
}

export interface CustomerReview {
  id: string;
  timestamp: string;
  source: 'Google Reviews' | 'Yelp' | 'App Feedback' | 'Customer Care Ticket' | 'Zomato' | 'Swiggy' | 'Zomato / Customer App';
  rating: number; // 1 to 5
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -1.0 to +1.0
  extractedCategory: 'Cleanliness' | 'Food Quality' | 'Staff Behavior' | 'Speed & Service' | 'Equipment / Facilities' | 'Pricing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRecurringIssue: boolean;
}

export interface HistoricalInspection {
  id: string;
  date: string;
  auditorName: string;
  score: number; // 0 - 100
  violationsFound: string[];
  cleanlinessPass: boolean;
  uniformPass: boolean;
  equipmentPass: boolean;
  safetyPass: boolean;
  status: 'Completed' | 'Pending Remediation' | 'Escalated';
  notes: string;
}

export interface CorrectiveActionItem {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Overdue';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  rootCause: string;
  humanApprovalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface RiskScoreBreakdown {
  totalScore: number; // 0 - 100
  photoViolationsWeight: number; // e.g. 20 / 30
  customerComplaintsWeight: number; // e.g. 18 / 25
  repeatViolationsWeight: number; // e.g. 25 / 25
  businessAnomaliesWeight: number; // e.g. 10 / 15
  unresolvedActionsWeight: number; // e.g. 18 / 15
  dominantFactor: string;
}

export interface FranchiseStore {
  id: string;
  storeNumber: number; // e.g. 247
  name: string;
  operatorName: string;
  operatorPhone: string;
  operatorEmail: string;
  address: string;
  location: LocationCoordinates;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  riskTrend: 'up' | 'down' | 'stable';
  mainIssue: string;
  aiExplanation: string;
  aiRecommendation: string;
  recommendedActionType: 'physical_inspection' | 'cure_notice' | 'equipment_replace' | 'staff_training' | 'monitor';
  recentViolationsCount: number;
  negativeReviewsCount30d: number;
  previousAuditViolationsCount: number;
  unresolvedActionsCount: number;
  posMetrics: POSMetrics;
  riskBreakdown: RiskScoreBreakdown;
  photos: StorePhotoAudit[];
  reviews: CustomerReview[];
  inspections: HistoricalInspection[];
  correctiveActions: CorrectiveActionItem[];
  humanReviewStatus: 'Pending Review' | 'Approved' | 'Rejected' | 'Investigating' | 'Dismissed' | 'Under Investigation';
  humanReviewNote?: string;
  lastUpdated: string;
}

export interface SystemicPattern {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  category: 'Equipment Supplier Defect' | 'Regional Training Breakdown' | 'Operational Process SOP' | 'Vendor Quality Drift' | 'Software / POS';
  affectedStoresCount: number;
  affectedStoreNumbers: number[];
  patternDescription: string;
  detectedCorrelation: string;
  hypothesizedRootCause: string;
  recommendedFleetAction: string;
  potentialCostRisk: string;
  status: 'Active Investigation' | 'Remediation Mandate Sent' | 'Resolved';
  dateDetected: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  storeNumber: number;
  actionTaken: string;
  actor: string;
  decisionType: 'Approved' | 'Rejected' | 'Investigating' | 'Auto-Flagged' | 'Dismissed';
  notes: string;
  aiRecommendation: string;
}

export interface FranchiseBrand {
  id: string;
  name: string;
  category: string;
  totalLocations: number;
  headquarters: string;
  complianceTargetPct: number;
}
