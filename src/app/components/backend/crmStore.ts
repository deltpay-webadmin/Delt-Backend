/**
 * ────────────────────────────────────────────────────────────
 * Delt CRM — shared in-memory store
 * ────────────────────────────────────────────────────────────
 * A lightweight, dependency-free pub/sub store that lets the Leads,
 * Onboarding, Underwriting and Referrals screens share state.
 *
 * It intentionally mirrors the structure of the sample data already used
 * in each page so existing components can keep consuming the same shape.
 *
 * Every call to `update*` fires listeners synchronously so React views
 * using the provided hooks re-render the next tick.
 */

import { useSyncExternalStore, useCallback } from 'react';

// ══════════════════════════════════════════════════════════════
// Types (kept loose/compatible with existing page-level types)
// ══════════════════════════════════════════════════════════════

export type LeadStage =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Application Submitted'
  | 'Bank Verification'
  | 'Identity Verification'
  | 'Underwriting'
  | 'Docs & E-Sign'
  | 'Funded';

export const LEAD_STAGES: LeadStage[] = [
  'New',
  'Contacted',
  'Qualified',
  'Application Submitted',
  'Bank Verification',
  'Identity Verification',
  'Underwriting',
  'Docs & E-Sign',
  'Funded',
];

export interface LeadStepDetail {
  stage: LeadStage;
  completedAt: string | null;
}

export interface TimelineItem {
  icon?: any;
  title: string;
  description: string;
  user: string;
  timestamp: string;
}

export interface LeadTask {
  id: string;
  title: string;
  due: string;
  done: boolean;
}

export interface LeadNote {
  id: string;
  body: string;
  author: string;
  timestamp: string;
}

export interface LeadBundle {
  bundleName: string;
  amount: number;
  dateIssued: string;
  expiration: string;
  status: 'Not Assigned' | 'Credit Issued' | 'Order Placed' | 'Shipped' | 'Delivered';
}

export interface Lead {
  id: string;
  businessName: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  type: 'MCA' | 'Residual' | 'Leasing';
  source: string;
  monthlySales: string;
  amountRequested: string;
  score: number;
  status: 'New' | 'In Progress' | 'Won' | 'Lost';
  priority: 'High' | 'Medium' | 'Low';
  lastActivity: string;
  assignedAgent: string;
  stage: LeadStage;
  timeline: TimelineItem[];
  notes: string;
  extraNotes?: LeadNote[];
  tasks?: LeadTask[];
  blocker?: string;
  stepDetails?: LeadStepDetail[];
  referredBy?: string;
  bundle?: LeadBundle | null;
}

// ── Onboarding ──
export type OnbStep =
  | 'Application Submitted'
  | 'Bank Verification'
  | 'Identity Verification'
  | 'Underwriting'
  | 'Docs & E-Sign'
  | 'Funded';

export type SLAStatus = 'On Track' | 'At Risk' | 'Breached';

export interface OnboardingStepProgress {
  step: OnbStep;
  completedAt: string | null;
  slaTarget: string;
}

export interface OnboardingApp {
  id: string;
  merchantName: string;
  agent: string;
  currentStep: OnbStep;
  currentStepIndex: number;
  timeInStep: string;
  timeInStepHours: number;
  slaTarget: string;
  slaStatus: SLAStatus;
  submittedDate: string;
  blocker: string;
  steps: OnboardingStepProgress[];
  nudges?: number;
  lastNudge?: string;
}

// ── Underwriting ──
export type UWStage =
  | 'Received'
  | 'Doc Collection'
  | 'Bank Review'
  | 'Credit Analysis'
  | 'Committee'
  | 'Approved'
  | 'Declined';

export type ProductType = 'MCA' | 'Term Loan' | 'Line of Credit' | 'Revenue Based';

export interface UWApplication {
  id: string;
  applicationId: string;
  businessName: string;
  dba?: string;
  industry: string;
  state: string;
  productType: ProductType;
  requestedAmount: number;
  monthlyRevenue: number;
  avgDailyBalance: number;
  monthsInBusiness: number;
  creditScore: number;
  existingPositions: number;
  submissionDate: string;
  reviewer: string;
  reviewerInitials: string;
  riskScore: number;
  stage: UWStage;
  daysInStage: number;
  slaThreshold: number;
  factorRate?: number;
  proposedPayback?: number;
  dailyPayment?: number;
  holdbackPct?: number;
  disclosureState?: string;
  missingDocs?: string[];
  notes?: string;
  source: string;
}

// ── Referrals ──
export interface Referral {
  id: string;
  referringMerchant: string;
  referredBusiness: string;
  referralCode: string;
  date: string;
  status: 'Pending' | 'Contacted' | 'Converted' | 'Expired';
  rewardStatus: 'Pending' | 'Paid' | 'N/A';
  rewardAmount: string;
}

export interface ReferralProgram {
  rewardAmount: string;
  freeMonths: string;
  planTier: string;
}

export interface CrmState {
  leads: Lead[];
  onboarding: OnboardingApp[];
  underwriting: UWApplication[];
  referrals: Referral[];
  program: ReferralProgram;
}

// ══════════════════════════════════════════════════════════════
// Seed data (mirrors what each page previously hard-coded)
// ══════════════════════════════════════════════════════════════

const seedLeads: Lead[] = [
  {
    id: 'lead-001',
    businessName: 'Green Valley Auto Repair',
    industry: 'Automotive',
    contactName: 'Robert Martinez',
    contactEmail: 'robert@greenvalleyauto.com',
    contactPhone: '(555) 123-4567',
    type: 'MCA',
    source: 'Website Inquiry',
    monthlySales: '$45,000',
    amountRequested: '$75,000',
    score: 82,
    status: 'In Progress',
    priority: 'High',
    lastActivity: '2 hours ago',
    assignedAgent: 'Sarah Johnson',
    stage: 'Qualified',
    timeline: [
      { title: 'Follow-up call completed', description: 'Discussed terms and pricing structure', user: 'Sarah Johnson', timestamp: '2 hours ago' },
      { title: 'Bank statements received', description: '6 months of statements uploaded', user: 'System', timestamp: '1 day ago' },
      { title: 'Initial email sent', description: 'Introduced Delt Pay services', user: 'Sarah Johnson', timestamp: '3 days ago' },
    ],
    notes: 'Strong financials. Owner is motivated and ready to move forward. Prefers daily payment option. Consider offering 1.15 factor rate.',
    referredBy: 'Metro Diner Group',
    tasks: [
      { id: 't1', title: 'Follow up call scheduled', due: 'Tomorrow at 2:00 PM', done: false },
      { id: 't2', title: 'Request bank statements', due: 'Completed yesterday', done: true },
      { id: 't3', title: 'Send proposal to client', due: 'Due in 3 days', done: false },
    ],
  },
  {
    id: 'lead-002',
    businessName: 'Urban Wellness Spa',
    industry: 'Health & Wellness',
    contactName: 'Jennifer Lee',
    contactEmail: 'jlee@urbanwellness.com',
    contactPhone: '(555) 234-5678',
    type: 'Leasing',
    source: 'Referral Partner',
    monthlySales: '$62,000',
    amountRequested: '$120,000',
    score: 91,
    status: 'In Progress',
    priority: 'High',
    lastActivity: '4 hours ago',
    assignedAgent: 'Michael Chen',
    stage: 'Underwriting',
    blocker: 'Missing tax return — requested from merchant twice, no response',
    stepDetails: [
      { stage: 'Application Submitted', completedAt: 'Apr 1, 9:00 AM' },
      { stage: 'Bank Verification', completedAt: 'Apr 1, 4:30 PM' },
      { stage: 'Identity Verification', completedAt: 'Apr 2, 10:20 AM' },
      { stage: 'Underwriting', completedAt: null },
      { stage: 'Docs & E-Sign', completedAt: null },
      { stage: 'Funded', completedAt: null },
    ],
    timeline: [
      { title: 'Tax return requested (2nd)', description: 'Emailed and SMS reminder sent', user: 'Michael Chen', timestamp: '1 day ago' },
      { title: 'ID verified', description: 'Identity verification passed', user: 'System', timestamp: 'Apr 2' },
      { title: 'Discovery call', description: 'Discussed equipment needs and financing', user: 'Michael Chen', timestamp: '2 days ago' },
    ],
    notes: 'Excellent credit profile. Looking to lease new spa equipment worth $120K. Stuck waiting on tax docs.',
    referredBy: 'Coastal Seafood Inc',
  },
  {
    id: 'lead-003',
    businessName: 'Lakeside Bistro',
    industry: 'Food & Beverage',
    contactName: 'David Thompson',
    contactEmail: 'david@lakesidebistro.com',
    contactPhone: '(555) 345-6789',
    type: 'MCA',
    source: 'Cold Outreach',
    monthlySales: '$28,000',
    amountRequested: '$50,000',
    score: 58,
    status: 'New',
    priority: 'Medium',
    lastActivity: '1 day ago',
    assignedAgent: 'Sarah Johnson',
    stage: 'New',
    timeline: [
      { title: 'Lead created', description: 'Added to pipeline from cold outreach', user: 'Sarah Johnson', timestamp: '1 day ago' },
    ],
    notes: 'Initial contact made. Waiting for callback to schedule discovery call.',
  },
  {
    id: 'lead-004',
    businessName: 'TechStart Solutions',
    industry: 'Technology',
    contactName: 'Amanda Rodriguez',
    contactEmail: 'arodriguez@techstart.io',
    contactPhone: '(555) 456-7890',
    type: 'Residual',
    source: 'LinkedIn',
    monthlySales: '$180,000',
    amountRequested: '$250,000',
    score: 95,
    status: 'Won',
    priority: 'High',
    lastActivity: '3 days ago',
    assignedAgent: 'James Miller',
    stage: 'Funded',
    stepDetails: [
      { stage: 'Application Submitted', completedAt: 'Mar 20, 11:00 AM' },
      { stage: 'Bank Verification', completedAt: 'Mar 20, 5:45 PM' },
      { stage: 'Identity Verification', completedAt: 'Mar 21, 9:30 AM' },
      { stage: 'Underwriting', completedAt: 'Mar 22, 2:00 PM' },
      { stage: 'Docs & E-Sign', completedAt: 'Mar 24, 10:15 AM' },
      { stage: 'Funded', completedAt: 'Mar 25, 9:00 AM' },
    ],
    timeline: [
      { title: 'Deal funded', description: 'Funds disbursed — $250K', user: 'System', timestamp: 'Mar 25' },
      { title: 'Docs signed', description: 'E-sign completed by merchant', user: 'System', timestamp: 'Mar 24' },
    ],
    notes: 'Excellent deal closed. Strong residual opportunity with their payment volume.',
  },
  {
    id: 'lead-005',
    businessName: 'Coastal Construction LLC',
    industry: 'Construction',
    contactName: 'Mark Stevens',
    contactEmail: 'mstevens@coastalconstruction.com',
    contactPhone: '(555) 567-8901',
    type: 'MCA',
    source: 'Trade Show',
    monthlySales: '$95,000',
    amountRequested: '$150,000',
    score: 72,
    status: 'In Progress',
    priority: 'Medium',
    lastActivity: '6 hours ago',
    assignedAgent: 'Michael Chen',
    stage: 'Bank Verification',
    blocker: 'Awaiting Plaid link — merchant has not connected bank account',
    stepDetails: [
      { stage: 'Application Submitted', completedAt: 'Apr 8, 10:30 AM' },
      { stage: 'Bank Verification', completedAt: null },
      { stage: 'Identity Verification', completedAt: null },
      { stage: 'Underwriting', completedAt: null },
      { stage: 'Docs & E-Sign', completedAt: null },
      { stage: 'Funded', completedAt: null },
    ],
    timeline: [
      { title: 'Plaid link SMS sent', description: 'Reminded merchant to connect bank', user: 'Michael Chen', timestamp: '6 hours ago' },
      { title: 'Met at trade show', description: 'Collected business card and initial interest', user: 'Michael Chen', timestamp: '4 days ago' },
    ],
    notes: 'Seasonal business. Needs capital for equipment purchase. Awaiting bank connection.',
  },
  {
    id: 'lead-006',
    businessName: 'Metro Pet Care',
    industry: 'Pet Services',
    contactName: 'Lisa Parker',
    contactEmail: 'lisa@metropetcare.com',
    contactPhone: '(555) 678-9012',
    type: 'MCA',
    source: 'Referral Partner',
    monthlySales: '$38,000',
    amountRequested: '$60,000',
    score: 45,
    status: 'Lost',
    priority: 'Low',
    lastActivity: '2 weeks ago',
    assignedAgent: 'Sarah Johnson',
    stage: 'Qualified',
    timeline: [
      { title: 'Lead marked lost', description: 'Credit score too low for approval', user: 'Sarah Johnson', timestamp: '2 weeks ago' },
      { title: 'Qualification call', description: 'Identified credit issues', user: 'Sarah Johnson', timestamp: '3 weeks ago' },
    ],
    notes: 'Credit score below 620. Recommended to reapply in 6 months after improving credit.',
  },
  {
    id: 'lead-007',
    businessName: 'Pinnacle Dental Group',
    industry: 'Healthcare',
    contactName: 'Dr. Sarah Mills',
    contactEmail: 'smills@pinnacledental.com',
    contactPhone: '(555) 789-0123',
    type: 'MCA',
    source: 'Website Inquiry',
    monthlySales: '$110,000',
    amountRequested: '$200,000',
    score: 88,
    status: 'In Progress',
    priority: 'High',
    lastActivity: '1 day ago',
    assignedAgent: 'James Miller',
    stage: 'Docs & E-Sign',
    blocker: 'E-sign link sent — awaiting merchant signature on funding agreement',
    stepDetails: [
      { stage: 'Application Submitted', completedAt: 'Apr 3, 2:10 PM' },
      { stage: 'Bank Verification', completedAt: 'Apr 3, 6:30 PM' },
      { stage: 'Identity Verification', completedAt: 'Apr 4, 8:45 AM' },
      { stage: 'Underwriting', completedAt: 'Apr 6, 10:00 AM' },
      { stage: 'Docs & E-Sign', completedAt: null },
      { stage: 'Funded', completedAt: null },
    ],
    timeline: [
      { title: 'E-sign link emailed', description: 'Funding agreement sent for signature', user: 'System', timestamp: '1 day ago' },
      { title: 'Underwriting approved', description: '$200K approved at 1.25 factor', user: 'System', timestamp: 'Apr 6' },
    ],
    notes: 'Strong dental practice. Underwriting approved quickly. Awaiting final signature.',
  },
  {
    id: 'lead-008',
    businessName: 'Summit Freight Services',
    industry: 'Logistics',
    contactName: 'Carlos Reyes',
    contactEmail: 'creyes@summitfreight.com',
    contactPhone: '(555) 890-1234',
    type: 'MCA',
    source: 'Cold Outreach',
    monthlySales: '$72,000',
    amountRequested: '$100,000',
    score: 67,
    status: 'In Progress',
    priority: 'Medium',
    lastActivity: '12 hours ago',
    assignedAgent: 'Sarah Johnson',
    stage: 'Identity Verification',
    blocker: 'ID photo blurry — re-upload requested via SMS',
    stepDetails: [
      { stage: 'Application Submitted', completedAt: 'Apr 6, 11:00 AM' },
      { stage: 'Bank Verification', completedAt: 'Apr 6, 5:15 PM' },
      { stage: 'Identity Verification', completedAt: null },
      { stage: 'Underwriting', completedAt: null },
      { stage: 'Docs & E-Sign', completedAt: null },
      { stage: 'Funded', completedAt: null },
    ],
    timeline: [
      { title: 'SMS sent for ID re-upload', description: 'Photo too blurry for verification', user: 'System', timestamp: '12 hours ago' },
      { title: 'Bank verified via Plaid', description: 'Bank account connected successfully', user: 'System', timestamp: 'Apr 6' },
    ],
    notes: 'Freight company with steady revenue. Stuck on ID verification — blurry photo.',
  },
];

const seedOnboarding: OnboardingApp[] = [
  {
    id: 'ONB-001',
    merchantName: 'Sunrise Bakery LLC',
    agent: 'Marcus Johnson',
    currentStep: 'Bank Verification',
    currentStepIndex: 1,
    timeInStep: '22 hrs',
    timeInStepHours: 22,
    slaTarget: '24 hrs',
    slaStatus: 'At Risk',
    submittedDate: 'Apr 7, 2026',
    blocker: 'Awaiting Plaid link — merchant has not connected bank account',
    steps: [
      { step: 'Application Submitted', completedAt: 'Apr 7, 10:30 AM', slaTarget: '—' },
      { step: 'Bank Verification', completedAt: null, slaTarget: '24 hrs' },
      { step: 'Identity Verification', completedAt: null, slaTarget: '24 hrs' },
      { step: 'Underwriting', completedAt: null, slaTarget: '48 hrs' },
      { step: 'Docs & E-Sign', completedAt: null, slaTarget: '72 hrs' },
      { step: 'Funded', completedAt: null, slaTarget: '24 hrs' },
    ],
    nudges: 0,
  },
  {
    id: 'ONB-002',
    merchantName: 'Peak Construction Co',
    agent: 'Priya Patel',
    currentStep: 'Underwriting',
    currentStepIndex: 3,
    timeInStep: '3.2 days',
    timeInStepHours: 76.8,
    slaTarget: '48 hrs',
    slaStatus: 'Breached',
    submittedDate: 'Apr 2, 2026',
    blocker: 'Missing tax return — requested from merchant twice, no response',
    steps: [
      { step: 'Application Submitted', completedAt: 'Apr 2, 9:15 AM', slaTarget: '—' },
      { step: 'Bank Verification', completedAt: 'Apr 2, 3:40 PM', slaTarget: '24 hrs' },
      { step: 'Identity Verification', completedAt: 'Apr 3, 11:20 AM', slaTarget: '24 hrs' },
      { step: 'Underwriting', completedAt: null, slaTarget: '48 hrs' },
      { step: 'Docs & E-Sign', completedAt: null, slaTarget: '72 hrs' },
      { step: 'Funded', completedAt: null, slaTarget: '24 hrs' },
    ],
    nudges: 1,
  },
  {
    id: 'ONB-003',
    merchantName: 'Coastal Seafood Inc',
    agent: 'Jamal Foster',
    currentStep: 'Docs & E-Sign',
    currentStepIndex: 4,
    timeInStep: '1.5 days',
    timeInStepHours: 36,
    slaTarget: '72 hrs',
    slaStatus: 'On Track',
    submittedDate: 'Apr 4, 2026',
    blocker: 'E-sign link sent — awaiting merchant signature on funding agreement',
    steps: [
      { step: 'Application Submitted', completedAt: 'Apr 4, 2:10 PM', slaTarget: '—' },
      { step: 'Bank Verification', completedAt: 'Apr 4, 6:30 PM', slaTarget: '24 hrs' },
      { step: 'Identity Verification', completedAt: 'Apr 5, 8:45 AM', slaTarget: '24 hrs' },
      { step: 'Underwriting', completedAt: 'Apr 6, 10:00 AM', slaTarget: '48 hrs' },
      { step: 'Docs & E-Sign', completedAt: null, slaTarget: '72 hrs' },
      { step: 'Funded', completedAt: null, slaTarget: '24 hrs' },
    ],
  },
  {
    id: 'ONB-004',
    merchantName: 'Metro Diner Group',
    agent: 'Marcus Johnson',
    currentStep: 'Identity Verification',
    currentStepIndex: 2,
    timeInStep: '26 hrs',
    timeInStepHours: 26,
    slaTarget: '24 hrs',
    slaStatus: 'Breached',
    submittedDate: 'Apr 6, 2026',
    blocker: 'ID photo blurry — re-upload requested via SMS',
    steps: [
      { step: 'Application Submitted', completedAt: 'Apr 6, 11:00 AM', slaTarget: '—' },
      { step: 'Bank Verification', completedAt: 'Apr 6, 5:15 PM', slaTarget: '24 hrs' },
      { step: 'Identity Verification', completedAt: null, slaTarget: '24 hrs' },
      { step: 'Underwriting', completedAt: null, slaTarget: '48 hrs' },
      { step: 'Docs & E-Sign', completedAt: null, slaTarget: '72 hrs' },
      { step: 'Funded', completedAt: null, slaTarget: '24 hrs' },
    ],
  },
  {
    id: 'ONB-005',
    merchantName: 'Bright Auto Sales',
    agent: 'Devon Richards',
    currentStep: 'Application Submitted',
    currentStepIndex: 0,
    timeInStep: '4 hrs',
    timeInStepHours: 4,
    slaTarget: '—',
    slaStatus: 'On Track',
    submittedDate: 'Apr 9, 2026',
    blocker: 'Application under initial review — all fields complete',
    steps: [
      { step: 'Application Submitted', completedAt: null, slaTarget: '—' },
      { step: 'Bank Verification', completedAt: null, slaTarget: '24 hrs' },
      { step: 'Identity Verification', completedAt: null, slaTarget: '24 hrs' },
      { step: 'Underwriting', completedAt: null, slaTarget: '48 hrs' },
      { step: 'Docs & E-Sign', completedAt: null, slaTarget: '72 hrs' },
      { step: 'Funded', completedAt: null, slaTarget: '24 hrs' },
    ],
  },
  {
    id: 'ONB-006',
    merchantName: 'Lakeside Catering',
    agent: 'Sarah Kim',
    currentStep: 'Bank Verification',
    currentStepIndex: 1,
    timeInStep: '12 hrs',
    timeInStepHours: 12,
    slaTarget: '24 hrs',
    slaStatus: 'On Track',
    submittedDate: 'Apr 8, 2026',
    blocker: 'Plaid connected — awaiting 3-day transaction pull to complete',
    steps: [
      { step: 'Application Submitted', completedAt: 'Apr 8, 9:00 AM', slaTarget: '—' },
      { step: 'Bank Verification', completedAt: null, slaTarget: '24 hrs' },
      { step: 'Identity Verification', completedAt: null, slaTarget: '24 hrs' },
      { step: 'Underwriting', completedAt: null, slaTarget: '48 hrs' },
      { step: 'Docs & E-Sign', completedAt: null, slaTarget: '72 hrs' },
      { step: 'Funded', completedAt: null, slaTarget: '24 hrs' },
    ],
  },
];

const seedUnderwriting: UWApplication[] = [
  { id: 'app-001', applicationId: 'UW-2026-0147', businessName: 'TechForward Solutions', dba: 'TechForward', industry: 'IT Services', state: 'NY', productType: 'MCA', requestedAmount: 200000, monthlyRevenue: 85000, avgDailyBalance: 14200, monthsInBusiness: 48, creditScore: 712, existingPositions: 0, submissionDate: 'Apr 17, 2026', reviewer: 'Sarah Mitchell', reviewerInitials: 'SM', riskScore: 88, stage: 'Received', daysInStage: 0, slaThreshold: 2, source: 'Direct — Website', missingDocs: ['Last 3 months bank statements', 'Voided check'] },
  { id: 'app-002', applicationId: 'UW-2026-0148', businessName: 'Miami Spice Kitchen', dba: 'Miami Spice', industry: 'Restaurant', state: 'FL', productType: 'MCA', requestedAmount: 75000, monthlyRevenue: 42000, avgDailyBalance: 6800, monthsInBusiness: 36, creditScore: 645, existingPositions: 1, submissionDate: 'Apr 17, 2026', reviewer: 'David Kim', reviewerInitials: 'DK', riskScore: 71, stage: 'Received', daysInStage: 0, slaThreshold: 2, source: 'Agent — Marcus Johnson' },
  { id: 'app-003', applicationId: 'UW-2026-0143', businessName: 'Sunrise Cafe & Bakery', industry: 'Restaurant / Bakery', state: 'NY', productType: 'MCA', requestedAmount: 125000, monthlyRevenue: 37500, avgDailyBalance: 5100, monthsInBusiness: 24, creditScore: 668, existingPositions: 0, submissionDate: 'Apr 15, 2026', reviewer: 'David Kim', reviewerInitials: 'DK', riskScore: 78, stage: 'Doc Collection', daysInStage: 2, slaThreshold: 3, source: 'ISO — Apex Funding', missingDocs: ['Tax returns (2024)', 'Landlord letter'] },
  { id: 'app-004', applicationId: 'UW-2026-0141', businessName: 'Coastal Construction LLC', industry: 'Construction', state: 'VA', productType: 'Term Loan', requestedAmount: 180000, monthlyRevenue: 95000, avgDailyBalance: 18200, monthsInBusiness: 72, creditScore: 701, existingPositions: 1, submissionDate: 'Apr 14, 2026', reviewer: 'Michael Torres', reviewerInitials: 'MT', riskScore: 68, stage: 'Bank Review', daysInStage: 3, slaThreshold: 3, disclosureState: 'VA HB 1027', notes: 'Large deposits irregular — need to verify contract payments', source: 'Direct — Website' },
  { id: 'app-005', applicationId: 'UW-2026-0145', businessName: 'Urban Wellness Spa', industry: 'Health & Wellness', state: 'FL', productType: 'MCA', requestedAmount: 150000, monthlyRevenue: 62000, avgDailyBalance: 9400, monthsInBusiness: 42, creditScore: 724, existingPositions: 0, submissionDate: 'Apr 13, 2026', reviewer: 'Michael Torres', reviewerInitials: 'MT', riskScore: 91, stage: 'Credit Analysis', daysInStage: 4, slaThreshold: 5, factorRate: 1.35, proposedPayback: 202500, dailyPayment: 675, holdbackPct: 15, source: 'Referral Partner' },
  { id: 'app-006', applicationId: 'UW-2026-0138', businessName: 'Green Valley Auto Repair', industry: 'Automotive', state: 'CA', productType: 'Revenue Based', requestedAmount: 75000, monthlyRevenue: 45000, avgDailyBalance: 7200, monthsInBusiness: 60, creditScore: 690, existingPositions: 2, submissionDate: 'Apr 12, 2026', reviewer: 'Sarah Mitchell', reviewerInitials: 'SM', riskScore: 62, stage: 'Credit Analysis', daysInStage: 5, slaThreshold: 5, disclosureState: 'CA SB 1235', factorRate: 1.42, proposedPayback: 106500, dailyPayment: 425, holdbackPct: 18, notes: '2 existing positions — stacking risk. Verify payoff on 1st position.', source: 'Direct — Website' },
  { id: 'app-007', applicationId: 'UW-2026-0139', businessName: 'Brooklyn Vinyl Records', industry: 'Retail', state: 'NY', productType: 'MCA', requestedAmount: 50000, monthlyRevenue: 28000, avgDailyBalance: 4100, monthsInBusiness: 18, creditScore: 632, existingPositions: 0, submissionDate: 'Apr 11, 2026', reviewer: 'David Kim', reviewerInitials: 'DK', riskScore: 74, stage: 'Committee', daysInStage: 2, slaThreshold: 2, factorRate: 1.38, proposedPayback: 69000, dailyPayment: 276, holdbackPct: 15, notes: 'Low TIB (18mo). Revenue trend positive. Recommend approval with conservative terms.', source: 'Direct — Website' },
  { id: 'app-008', applicationId: 'UW-2026-0136', businessName: 'Havana Bites Cafe', industry: 'Restaurant', state: 'FL', productType: 'MCA', requestedAmount: 45000, monthlyRevenue: 34000, avgDailyBalance: 5800, monthsInBusiness: 30, creditScore: 658, existingPositions: 0, submissionDate: 'Apr 10, 2026', reviewer: 'Michael Torres', reviewerInitials: 'MT', riskScore: 85, stage: 'Approved', daysInStage: 1, slaThreshold: 7, factorRate: 1.32, proposedPayback: 59400, dailyPayment: 198, holdbackPct: 12, source: 'Direct — Website' },
  { id: 'app-009', applicationId: 'UW-2026-0135', businessName: 'SoBe Cycle & Fitness', industry: 'Fitness', state: 'FL', productType: 'MCA', requestedAmount: 100000, monthlyRevenue: 56000, avgDailyBalance: 8900, monthsInBusiness: 54, creditScore: 738, existingPositions: 0, submissionDate: 'Apr 9, 2026', reviewer: 'Sarah Mitchell', reviewerInitials: 'SM', riskScore: 93, stage: 'Approved', daysInStage: 2, slaThreshold: 7, factorRate: 1.28, proposedPayback: 128000, dailyPayment: 427, holdbackPct: 12, source: 'Direct — Website' },
  { id: 'app-010', applicationId: 'UW-2026-0129', businessName: 'Metro Pet Care', industry: 'Pet Services', state: 'NJ', productType: 'MCA', requestedAmount: 60000, monthlyRevenue: 38000, avgDailyBalance: 2100, monthsInBusiness: 12, creditScore: 548, existingPositions: 3, submissionDate: 'Apr 5, 2026', reviewer: 'David Kim', reviewerInitials: 'DK', riskScore: 32, stage: 'Declined', daysInStage: 5, slaThreshold: 5, notes: 'Low credit, 3 existing positions, low ADB relative to request. High stacking risk.', source: 'Direct — Website' },
  { id: 'app-011', applicationId: 'UW-2026-0127', businessName: 'Doral Fresh Market', industry: 'Grocery', state: 'FL', productType: 'MCA', requestedAmount: 40000, monthlyRevenue: 31000, avgDailyBalance: 2800, monthsInBusiness: 14, creditScore: 582, existingPositions: 2, submissionDate: 'Apr 3, 2026', reviewer: 'Michael Torres', reviewerInitials: 'MT', riskScore: 38, stage: 'Declined', daysInStage: 8, slaThreshold: 5, notes: 'Negative cash flow trend. Multiple NSFs on bank statements. Adverse action sent.', source: 'Direct — Website' },
];

const seedReferrals: Referral[] = [
  { id: 'REF-001', referringMerchant: 'Metro Diner Group', referredBusiness: 'Valley Pizza Co', referralCode: 'METRO-2024A', date: 'Mar 28, 2026', status: 'Converted', rewardStatus: 'Paid', rewardAmount: '$100' },
  { id: 'REF-002', referringMerchant: 'Coastal Seafood Inc', referredBusiness: 'Harbor Fish Market', referralCode: 'COAST-7X91', date: 'Apr 2, 2026', status: 'Contacted', rewardStatus: 'Pending', rewardAmount: '$100' },
  { id: 'REF-003', referringMerchant: 'Bright Auto Sales', referredBusiness: 'Sunrise Auto Body', referralCode: 'BRIGHT-KQ33', date: 'Apr 5, 2026', status: 'Pending', rewardStatus: 'Pending', rewardAmount: '$100' },
  { id: 'REF-004', referringMerchant: 'Lakeside Catering', referredBusiness: 'Greenfield Events LLC', referralCode: 'LAKE-PP82', date: 'Feb 15, 2026', status: 'Expired', rewardStatus: 'N/A', rewardAmount: '—' },
];

// ══════════════════════════════════════════════════════════════
// Store
// ══════════════════════════════════════════════════════════════

let state: CrmState = {
  leads: seedLeads,
  onboarding: seedOnboarding,
  underwriting: seedUnderwriting,
  referrals: seedReferrals,
  program: { rewardAmount: '100', freeMonths: '1', planTier: 'Growth' },
};

const listeners = new Set<() => void>();

function set(next: Partial<CrmState>) {
  state = { ...state, ...next };
  listeners.forEach(l => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

// ── Hooks ──
export function useCrm() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useLeads() {
  const selector = useCallback(() => state.leads, []);
  return useSyncExternalStore(subscribe, selector, selector);
}

export function useOnboarding() {
  const selector = useCallback(() => state.onboarding, []);
  return useSyncExternalStore(subscribe, selector, selector);
}

export function useUnderwriting() {
  const selector = useCallback(() => state.underwriting, []);
  return useSyncExternalStore(subscribe, selector, selector);
}

export function useReferrals() {
  const selector = useCallback(() => state.referrals, []);
  return useSyncExternalStore(subscribe, selector, selector);
}

export function useReferralProgram() {
  const selector = useCallback(() => state.program, []);
  return useSyncExternalStore(subscribe, selector, selector);
}

// ══════════════════════════════════════════════════════════════
// Actions
// ══════════════════════════════════════════════════════════════

const nowStamp = () =>
  new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

// ── Lead actions ──
export const leadActions = {
  create(lead: Partial<Lead>): Lead {
    const id = `lead-${String(state.leads.length + 1).padStart(3, '0')}`;
    const created: Lead = {
      id,
      businessName: lead.businessName || 'New Business',
      industry: lead.industry || 'General',
      contactName: lead.contactName || '',
      contactEmail: lead.contactEmail || '',
      contactPhone: lead.contactPhone || '',
      type: (lead.type as any) || 'MCA',
      source: lead.source || 'Manual',
      monthlySales: lead.monthlySales || '$0',
      amountRequested: lead.amountRequested || '$0',
      score: lead.score ?? 50,
      status: 'New',
      priority: (lead.priority as any) || 'Medium',
      lastActivity: 'just now',
      assignedAgent: lead.assignedAgent || 'Unassigned',
      stage: 'New',
      timeline: [{ title: 'Lead created', description: 'Manually added via CRM', user: lead.assignedAgent || 'System', timestamp: 'just now' }],
      notes: lead.notes || '',
    };
    set({ leads: [created, ...state.leads] });
    return created;
  },
  update(id: string, patch: Partial<Lead>) {
    set({ leads: state.leads.map(l => (l.id === id ? { ...l, ...patch } : l)) });
  },
  setStatus(id: string, status: Lead['status']) {
    leadActions.update(id, { status, lastActivity: 'just now' });
    leadActions.addTimeline(id, { title: `Status set to ${status}`, description: 'Updated from pipeline', user: 'You', timestamp: 'just now' });
  },
  advanceStage(id: string) {
    const lead = state.leads.find(l => l.id === id);
    if (!lead) return;
    const idx = LEAD_STAGES.indexOf(lead.stage);
    if (idx < 0 || idx >= LEAD_STAGES.length - 1) return;
    const next = LEAD_STAGES[idx + 1];
    const patch: Partial<Lead> = { stage: next, lastActivity: 'just now' };
    if (next === 'Funded') patch.status = 'Won';
    else if (lead.status === 'New') patch.status = 'In Progress';
    leadActions.update(id, patch);
    leadActions.addTimeline(id, { title: `Advanced to ${next}`, description: 'Pipeline stage promoted', user: 'You', timestamp: 'just now' });
  },
  submitApplication(id: string) {
    const lead = state.leads.find(l => l.id === id);
    if (!lead) return;
    const patch: Partial<Lead> = {
      stage: 'Application Submitted',
      status: 'In Progress',
      lastActivity: 'just now',
      stepDetails: lead.stepDetails || [
        { stage: 'Application Submitted', completedAt: nowStamp() },
        { stage: 'Bank Verification', completedAt: null },
        { stage: 'Identity Verification', completedAt: null },
        { stage: 'Underwriting', completedAt: null },
        { stage: 'Docs & E-Sign', completedAt: null },
        { stage: 'Funded', completedAt: null },
      ],
    };
    leadActions.update(id, patch);
    leadActions.addTimeline(id, { title: 'Application submitted', description: 'Handed off to onboarding', user: 'You', timestamp: 'just now' });
  },
  markLost(id: string) {
    leadActions.update(id, { status: 'Lost', lastActivity: 'just now' });
    leadActions.addTimeline(id, { title: 'Lead marked lost', description: 'Closed-lost from pipeline', user: 'You', timestamp: 'just now' });
  },
  addNote(id: string, body: string, author = 'You') {
    const lead = state.leads.find(l => l.id === id);
    if (!lead) return;
    const note: LeadNote = { id: `n-${Date.now()}`, body, author, timestamp: nowStamp() };
    leadActions.update(id, { extraNotes: [...(lead.extraNotes || []), note], lastActivity: 'just now' });
    leadActions.addTimeline(id, { title: 'Note added', description: body.slice(0, 80), user: author, timestamp: 'just now' });
  },
  toggleTask(id: string, taskId: string) {
    const lead = state.leads.find(l => l.id === id);
    if (!lead) return;
    const tasks = (lead.tasks || []).map(t => (t.id === taskId ? { ...t, done: !t.done } : t));
    leadActions.update(id, { tasks });
  },
  addTask(id: string, title: string, due = 'No due date') {
    const lead = state.leads.find(l => l.id === id);
    if (!lead) return;
    const task: LeadTask = { id: `t-${Date.now()}`, title, due, done: false };
    leadActions.update(id, { tasks: [...(lead.tasks || []), task] });
  },
  addTimeline(id: string, item: TimelineItem) {
    const lead = state.leads.find(l => l.id === id);
    if (!lead) return;
    leadActions.update(id, { timeline: [item, ...lead.timeline] });
  },
  assignBundle(id: string, bundle: { name: string; amount: number }) {
    const now = new Date();
    const exp = new Date(now);
    exp.setDate(exp.getDate() + 30);
    const b: LeadBundle = {
      bundleName: bundle.name,
      amount: bundle.amount,
      dateIssued: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      expiration: exp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Credit Issued',
    };
    leadActions.update(id, { bundle: b });
    leadActions.addTimeline(id, { title: `Bundle assigned: ${bundle.name}`, description: `$${bundle.amount} credit issued`, user: 'You', timestamp: 'just now' });
  },
  cycleBundleStatus(id: string) {
    const lead = state.leads.find(l => l.id === id);
    if (!lead || !lead.bundle) return;
    const order: LeadBundle['status'][] = ['Credit Issued', 'Order Placed', 'Shipped', 'Delivered'];
    const idx = order.indexOf(lead.bundle.status);
    const next = order[Math.min(idx + 1, order.length - 1)];
    leadActions.update(id, { bundle: { ...lead.bundle, status: next } });
  },
};

// ── Onboarding actions ──
export const onboardingActions = {
  nudge(id: string) {
    set({
      onboarding: state.onboarding.map(o =>
        o.id === id ? { ...o, nudges: (o.nudges || 0) + 1, lastNudge: nowStamp() } : o,
      ),
    });
  },
  reassign(id: string, newAgent: string) {
    set({ onboarding: state.onboarding.map(o => (o.id === id ? { ...o, agent: newAgent } : o)) });
  },
  advance(id: string) {
    set({
      onboarding: state.onboarding.map(o => {
        if (o.id !== id) return o;
        const STEPS: OnbStep[] = ['Application Submitted', 'Bank Verification', 'Identity Verification', 'Underwriting', 'Docs & E-Sign', 'Funded'];
        const nextIdx = Math.min(o.currentStepIndex + 1, STEPS.length - 1);
        const nextStep = STEPS[nextIdx];
        const steps = o.steps.map((s, i) => (i === o.currentStepIndex ? { ...s, completedAt: nowStamp() } : s));
        return { ...o, currentStep: nextStep, currentStepIndex: nextIdx, steps, timeInStep: '0 hrs', timeInStepHours: 0, slaStatus: 'On Track' as SLAStatus };
      }),
    });
  },
};

// ── Underwriting actions ──
export const underwritingActions = {
  create(partial: Partial<UWApplication>): UWApplication {
    const num = state.underwriting.length + 1;
    const id = `app-${String(num).padStart(3, '0')}`;
    const appId = `UW-2026-${String(200 + num).padStart(4, '0')}`;
    const reviewer = partial.reviewer || 'Sarah Mitchell';
    const app: UWApplication = {
      id,
      applicationId: appId,
      businessName: partial.businessName || 'New Applicant',
      industry: partial.industry || 'General',
      state: partial.state || 'NY',
      productType: (partial.productType as ProductType) || 'MCA',
      requestedAmount: partial.requestedAmount ?? 50000,
      monthlyRevenue: partial.monthlyRevenue ?? 30000,
      avgDailyBalance: partial.avgDailyBalance ?? 5000,
      monthsInBusiness: partial.monthsInBusiness ?? 24,
      creditScore: partial.creditScore ?? 650,
      existingPositions: partial.existingPositions ?? 0,
      submissionDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      reviewer,
      reviewerInitials: reviewer.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase(),
      riskScore: partial.riskScore ?? 70,
      stage: 'Received',
      daysInStage: 0,
      slaThreshold: 2,
      source: partial.source || 'Manual',
    };
    set({ underwriting: [app, ...state.underwriting] });
    return app;
  },
  update(id: string, patch: Partial<UWApplication>) {
    set({ underwriting: state.underwriting.map(a => (a.id === id ? { ...a, ...patch } : a)) });
  },
  setStage(id: string, stage: UWStage) {
    underwritingActions.update(id, { stage, daysInStage: 0 });
  },
  approve(id: string) {
    underwritingActions.update(id, { stage: 'Approved', daysInStage: 0 });
  },
  decline(id: string) {
    underwritingActions.update(id, { stage: 'Declined', daysInStage: 0 });
  },
};

// ── Referral actions ──
export const referralActions = {
  setStatus(id: string, status: Referral['status']) {
    set({
      referrals: state.referrals.map(r =>
        r.id === id
          ? { ...r, status, rewardStatus: status === 'Converted' ? (r.rewardStatus === 'N/A' ? 'Pending' : r.rewardStatus) : r.rewardStatus }
          : r,
      ),
    });
  },
  payReward(id: string) {
    set({
      referrals: state.referrals.map(r => (r.id === id ? { ...r, rewardStatus: 'Paid' } : r)),
    });
  },
  create(partial: Partial<Referral>) {
    const id = `REF-${String(state.referrals.length + 1).padStart(3, '0')}`;
    const ref: Referral = {
      id,
      referringMerchant: partial.referringMerchant || 'Unknown',
      referredBusiness: partial.referredBusiness || 'Prospect',
      referralCode: partial.referralCode || `CODE-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Pending',
      rewardStatus: 'Pending',
      rewardAmount: `$${state.program.rewardAmount}`,
    };
    set({ referrals: [ref, ...state.referrals] });
    return ref;
  },
};

export const programActions = {
  update(patch: Partial<ReferralProgram>) {
    set({ program: { ...state.program, ...patch } });
  },
};
