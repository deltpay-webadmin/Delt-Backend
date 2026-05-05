/**
 * ────────────────────────────────────────────────────────────
 * Delt CRM — Supabase-backed store
 * ────────────────────────────────────────────────────────────
 * Persistent store backed by Supabase Postgres. Preserves the
 * pub/sub + React hook surface of the previous in-memory version
 * so page components don't need to change.
 *
 * Behavior:
 *   • On first hook subscription, `hydrate()` fetches all tables
 *     from Supabase and opens a realtime channel so multi-user
 *     updates stream in live.
 *   • Every action applies an optimistic local update, then writes
 *     to Supabase. On failure, state is rolled back and a toast fires.
 *   • If `supabase` is null (env vars missing), the store falls back
 *     to the original in-memory behavior so the app still runs.
 *
 * DB column names use snake_case; TS types stay camelCase. The
 * `fromDb*` / `toDb*` helpers do the conversion.
 */

import { useSyncExternalStore, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { normalizePhone, phoneMatches, phoneDigits } from '../../lib/phone';

// ══════════════════════════════════════════════════════════════
// Types (unchanged — pages depend on this exact shape)
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

// ── KYB intake (Stripe-style lead onboarding) ──
// Full Know-Your-Business payload captured during lead creation.
// Kept optional on Lead so legacy leads remain valid; persisted as a
// single `kyb` jsonb column in Supabase.
export type BusinessStructure =
  | 'Sole Proprietorship'
  | 'LLC'
  | 'Partnership'
  | 'C Corporation'
  | 'S Corporation'
  | 'Non-Profit'
  | 'Other';

export interface BusinessProfile {
  legalName: string;
  dba: string;
  structure: BusinessStructure;
  taxIdType: 'EIN' | 'SSN';
  taxIdLast4: string;
  stateOfIncorporation: string;
  yearFounded: string;
  website: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  mcc: string; // Merchant Category Code
  industry: string;
  productDescription: string;
}

export interface Representative {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  dobMasked: string; // MM/DD/YYYY — never store full SSN client-side
  ssnLast4: string;
  ownershipPct: number;
  isOwner: boolean;
  isController: boolean;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface BeneficialOwner {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  ownershipPct: number;
  ssnLast4: string;
}

export interface ProcessingProfile {
  monthlyVolume: string;
  avgTicket: string;
  highTicket: string;
  cardPresentPct: number; // 0-100
  currentProcessor: string;
  currentEffectiveRate: string;
  acceptsAmex: boolean;
  hasChargebacks: boolean;
  chargebackRatePct: string;
  seasonalBusiness: boolean;
}

export interface BankOnFile {
  bankName: string;
  accountHolder: string;
  routingLast4: string;
  accountLast4: string;
  accountType: 'Checking' | 'Savings';
  verificationMethod: 'Plaid' | 'Voided Check' | 'Bank Letter' | 'Manual';
}

export interface UploadedDoc {
  id: string;
  kind:
    | 'Processing Statement'
    | 'Bank Statement'
    | 'Voided Check'
    | 'Drivers License'
    | 'EIN Letter'
    | 'Other';
  filename: string;
  size: number;
  uploadedAt: string;
}

export interface FundingRequest {
  requested: boolean;
  amount: string;
  useOfFunds: string;
  timeInBusinessMonths: string;
}

export interface KybIntake {
  business: BusinessProfile;
  representative: Representative;
  owners: BeneficialOwner[];
  processing: ProcessingProfile;
  funding: FundingRequest;
  bank: BankOnFile;
  documents: UploadedDoc[];
  attestation: {
    certifiedAccurate: boolean;
    authorizedToSign: boolean;
    signedAt: string;
    signedByName: string;
  };
}

export interface Lead {
  id: string;
  businessName: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  type: 'MCA' | 'Residual' | 'Processing' | 'Leasing';
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
  /** Full Stripe-style KYB intake captured during lead creation. */
  kyb?: KybIntake;
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

// ── Merchants ──
export type MerchantStatus = 'Active' | 'Inactive' | 'Pending';
export type PlanTier = 'Free' | 'Growth' | 'Custom';

export interface MerchantProducts {
  processing: boolean;
  capital: boolean;
  website: boolean;
  lens: boolean;
}

export interface Merchant {
  id: string;
  name: string;
  industry: string;
  status: MerchantStatus;
  monthlyVolume: number;
  mcaBalance: number;
  capitalDeployed: number;
  healthScore: number;
  agent: string;
  products: MerchantProducts;
  plan: PlanTier;
  monthlyFee: number;
  // Optional contact/business info captured during onboarding.
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  state?: string;
  ein?: string;
  website?: string;
  notes?: string;
}

// ── Deals ──
export type DealStatus = 'Current' | 'Delinquent' | 'Default' | 'Paid Off' | 'Workout';
export type DealType = 'MCA' | 'Lease' | 'Residual';

export interface Deal {
  id: string;
  status: DealStatus;
  delinquencyLabel?: string;
  type: DealType;
  borrower: string;
  loanAmount: number;
  repaymentAmount: number;
  collected: number;
  outstanding: number;
  rate: number;
  dailyPayment: number;
  fundedDate: string;
  dueDate: string;
  agent: string;
  notes?: string;
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

// ── Call logs (customer-service phone tracking) ──
export type CallDirection = 'inbound' | 'outbound';
export type CallStatus =
  | 'queued'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'no-answer'
  | 'busy'
  | 'failed'
  | 'voicemail'
  | 'canceled';
export type CallSubjectKind = 'merchant' | 'lead' | 'none';

export interface CallLog {
  id: string;
  /** E.164-ish canonical form, e.g. "+15551234567". */
  phoneNormalized: string;
  /** Original string the agent entered (for audit). */
  phoneRaw: string;
  direction: CallDirection;
  status: CallStatus;
  subjectKind: CallSubjectKind;
  subjectId: string | null;
  subjectLabel: string | null;
  agent: string;
  startedAt: string;       // ISO timestamp
  endedAt: string | null;
  durationSeconds: number | null;
  notes: string;
  provider: string | null;       // 'twilio' | 'click-to-call' | null
  providerCallSid: string | null;
  recordingUrl: string | null;
}

/** Lightweight "who-is-this" result for a phone-number search. */
export interface PhoneMatch {
  kind: CallSubjectKind;          // 'merchant' | 'lead' | 'none'
  id: string;
  label: string;                  // business name to show in the UI
  contactName?: string;
  matchedField: 'merchant.contactPhone' | 'lead.contactPhone' | 'lead.kyb.business' | 'lead.kyb.representative';
  phone: string;                  // the field value we matched against
}

// ── Tasks / Inbox / Documents / Disputes / Compliance ──
// These are client-side only. The Supabase tables don't exist yet, so updates
// live in memory for the duration of the SPA session. Seeds stay so the UI
// looks alive on first load; user actions then mutate the in-memory list.

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type TaskCategory = 'compliance' | 'collections' | 'sales' | 'onboarding' | 'support' | 'internal';

export interface CrmTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  assignee: string;
  merchant?: string;
  merchantId?: string;
  dealId?: string;
  dueDate: string;
  createdDate: string;
  createdBy: string;
  tags: string[];
  overdue: boolean;
}

export type InboxChannel = 'email' | 'sms' | 'call' | 'note';
export type InboxThreadStatus = 'unread' | 'read' | 'replied' | 'archived';

export interface InboxMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  channel: InboxChannel;
  from: string;
  to: string;
  subject?: string;
  body: string;
  timestamp: string;
  attachments?: string[];
}

export interface InboxThread {
  id: string;
  merchant: string;
  merchantId: string;
  contact: string;
  contactEmail?: string;
  contactPhone?: string;
  channel: InboxChannel;
  status: InboxThreadStatus;
  starred: boolean;
  lastMessage: string;
  lastTimestamp: string;
  messageCount: number;
  agent: string;
  dealId?: string;
  messages: InboxMessage[];
}

export type DocStatus = 'signed' | 'pending_signature' | 'sent' | 'draft' | 'expired' | 'voided';
export type DocType = 'mca_agreement' | 'disclosure' | 'ucc_filing' | 'bank_auth' | 'id_verification' | 'tax_document' | 'amendment' | 'adverse_action';

export interface CrmDocument {
  id: string;
  name: string;
  type: DocType;
  status: DocStatus;
  merchant: string;
  merchantId: string;
  dealId?: string;
  createdDate: string;
  sentDate?: string;
  signedDate?: string;
  expiryDate?: string;
  signer?: string;
  signerEmail?: string;
  agent: string;
  pages: number;
  size: string;
  requiresNotarization: boolean;
  envelopeId?: string;
}

export interface DisputeEvidenceState {
  /** Map of dispute id to evidence label list that has been uploaded. */
  uploaded: Record<string, string[]>;
  /** Map of dispute id to status overrides. */
  submitted: Record<string, boolean>;
}

export interface ComplianceFlags {
  /** Map of "merchantId:controlKey" -> override status (green|yellow|red|gray) */
  overrides: Record<string, 'green' | 'yellow' | 'red' | 'gray'>;
  /** Set of completed checklist item ids. */
  completed: Record<string, boolean>;
}

export interface CrmState {
  leads: Lead[];
  onboarding: OnboardingApp[];
  underwriting: UWApplication[];
  referrals: Referral[];
  program: ReferralProgram;
  /** Client-side only — merchants & deals aren't persisted to Supabase yet. */
  merchants: Merchant[];
  deals: Deal[];
  /** Customer-service call history. */
  callLogs: CallLog[];
  /** Client-side: task board. */
  tasks: CrmTask[];
  /** Client-side: inbox conversations. */
  threads: InboxThread[];
  /** Client-side: e-sign / docs library. */
  documents: CrmDocument[];
  /** Client-side: dispute UI state. */
  disputeState: DisputeEvidenceState;
  /** Client-side: compliance checklist state. */
  complianceFlags: ComplianceFlags;
}

// ══════════════════════════════════════════════════════════════
// Fallback seed data — used only when Supabase is NOT configured.
// Keeps the app functional in preview / contributor environments.
// ══════════════════════════════════════════════════════════════

const fallbackSeed: CrmState = {
  leads: [
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
      ],
      notes: 'Strong financials. Owner is motivated and ready to move forward.',
      referredBy: 'Metro Diner Group',
      tasks: [
        { id: 't1', title: 'Follow up call scheduled', due: 'Tomorrow at 2:00 PM', done: false },
      ],
    },
  ],
  onboarding: [],
  underwriting: [],
  referrals: [],
  program: { rewardAmount: '100', freeMonths: '1', planTier: 'Growth' },
};

// ══════════════════════════════════════════════════════════════
// Store (pub/sub)
// ══════════════════════════════════════════════════════════════

interface SyncState {
  isLoading: boolean;
  isOnline: boolean;
  lastError: string | null;
}

let state: CrmState = {
  leads: [],
  onboarding: [],
  underwriting: [],
  referrals: [],
  program: { rewardAmount: '100', freeMonths: '1', planTier: 'Growth' },
  merchants: [],
  deals: [],
  callLogs: [],
  tasks: [],
  threads: [],
  documents: [],
  disputeState: { uploaded: {}, submitted: {} },
  complianceFlags: { overrides: {}, completed: {} },
};

let sync: SyncState = {
  isLoading: isSupabaseConfigured,
  isOnline: isSupabaseConfigured,
  lastError: null,
};

const listeners = new Set<() => void>();

function set(next: Partial<CrmState>) {
  state = { ...state, ...next };
  listeners.forEach(l => l());
}

function setSync(next: Partial<SyncState>) {
  sync = { ...sync, ...next };
  listeners.forEach(l => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  maybeHydrate();
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

function getSyncSnapshot() {
  return sync;
}

// ══════════════════════════════════════════════════════════════
// DB ↔ TS mappers
// ══════════════════════════════════════════════════════════════

function fromDbLead(r: any): Lead {
  return {
    id: r.id,
    businessName: r.business_name,
    industry: r.industry,
    contactName: r.contact_name ?? '',
    contactEmail: r.contact_email ?? '',
    contactPhone: r.contact_phone ?? '',
    type: r.type,
    source: r.source ?? '',
    monthlySales: r.monthly_sales ?? '',
    amountRequested: r.amount_requested ?? '',
    score: r.score ?? 50,
    status: r.status,
    priority: r.priority,
    lastActivity: r.last_activity ?? '',
    assignedAgent: r.assigned_agent ?? '',
    stage: r.stage,
    timeline: r.timeline ?? [],
    notes: r.notes ?? '',
    extraNotes: r.extra_notes ?? [],
    tasks: r.tasks ?? [],
    blocker: r.blocker ?? undefined,
    stepDetails: r.step_details ?? undefined,
    referredBy: r.referred_by ?? undefined,
    bundle: r.bundle ?? null,
    kyb: r.kyb ?? undefined,
  };
}

function toDbLead(l: Partial<Lead>): Record<string, any> {
  const out: Record<string, any> = {};
  if (l.id !== undefined) out.id = l.id;
  if (l.businessName !== undefined) out.business_name = l.businessName;
  if (l.industry !== undefined) out.industry = l.industry;
  if (l.contactName !== undefined) out.contact_name = l.contactName;
  if (l.contactEmail !== undefined) out.contact_email = l.contactEmail;
  if (l.contactPhone !== undefined) out.contact_phone = l.contactPhone;
  if (l.type !== undefined) out.type = l.type;
  if (l.source !== undefined) out.source = l.source;
  if (l.monthlySales !== undefined) out.monthly_sales = l.monthlySales;
  if (l.amountRequested !== undefined) out.amount_requested = l.amountRequested;
  if (l.score !== undefined) out.score = l.score;
  if (l.status !== undefined) out.status = l.status;
  if (l.priority !== undefined) out.priority = l.priority;
  if (l.lastActivity !== undefined) out.last_activity = l.lastActivity;
  if (l.assignedAgent !== undefined) out.assigned_agent = l.assignedAgent;
  if (l.stage !== undefined) out.stage = l.stage;
  if (l.timeline !== undefined) out.timeline = l.timeline;
  if (l.notes !== undefined) out.notes = l.notes;
  if (l.extraNotes !== undefined) out.extra_notes = l.extraNotes;
  if (l.tasks !== undefined) out.tasks = l.tasks;
  if (l.blocker !== undefined) out.blocker = l.blocker;
  if (l.stepDetails !== undefined) out.step_details = l.stepDetails;
  if (l.referredBy !== undefined) out.referred_by = l.referredBy;
  if (l.bundle !== undefined) out.bundle = l.bundle;
  if (l.kyb !== undefined) out.kyb = l.kyb;
  return out;
}

function fromDbOnb(r: any): OnboardingApp {
  return {
    id: r.id,
    merchantName: r.merchant_name,
    agent: r.agent,
    currentStep: r.current_step,
    currentStepIndex: r.current_step_index ?? 0,
    timeInStep: r.time_in_step ?? '',
    timeInStepHours: Number(r.time_in_step_hours ?? 0),
    slaTarget: r.sla_target ?? '',
    slaStatus: r.sla_status ?? 'On Track',
    submittedDate: r.submitted_date ?? '',
    blocker: r.blocker ?? '',
    steps: r.steps ?? [],
    nudges: r.nudges ?? 0,
    lastNudge: r.last_nudge ?? undefined,
  };
}

function toDbOnb(o: Partial<OnboardingApp>): Record<string, any> {
  const out: Record<string, any> = {};
  if (o.id !== undefined) out.id = o.id;
  if (o.merchantName !== undefined) out.merchant_name = o.merchantName;
  if (o.agent !== undefined) out.agent = o.agent;
  if (o.currentStep !== undefined) out.current_step = o.currentStep;
  if (o.currentStepIndex !== undefined) out.current_step_index = o.currentStepIndex;
  if (o.timeInStep !== undefined) out.time_in_step = o.timeInStep;
  if (o.timeInStepHours !== undefined) out.time_in_step_hours = o.timeInStepHours;
  if (o.slaTarget !== undefined) out.sla_target = o.slaTarget;
  if (o.slaStatus !== undefined) out.sla_status = o.slaStatus;
  if (o.submittedDate !== undefined) out.submitted_date = o.submittedDate;
  if (o.blocker !== undefined) out.blocker = o.blocker;
  if (o.steps !== undefined) out.steps = o.steps;
  if (o.nudges !== undefined) out.nudges = o.nudges;
  if (o.lastNudge !== undefined) out.last_nudge = o.lastNudge;
  return out;
}

function fromDbUw(r: any): UWApplication {
  return {
    id: r.id,
    applicationId: r.application_id,
    businessName: r.business_name,
    dba: r.dba ?? undefined,
    industry: r.industry ?? '',
    state: r.state ?? '',
    productType: r.product_type,
    requestedAmount: Number(r.requested_amount ?? 0),
    monthlyRevenue: Number(r.monthly_revenue ?? 0),
    avgDailyBalance: Number(r.avg_daily_balance ?? 0),
    monthsInBusiness: Number(r.months_in_business ?? 0),
    creditScore: Number(r.credit_score ?? 0),
    existingPositions: Number(r.existing_positions ?? 0),
    submissionDate: r.submission_date ?? '',
    reviewer: r.reviewer ?? '',
    reviewerInitials: r.reviewer_initials ?? '',
    riskScore: Number(r.risk_score ?? 0),
    stage: r.stage,
    daysInStage: Number(r.days_in_stage ?? 0),
    slaThreshold: Number(r.sla_threshold ?? 3),
    factorRate: r.factor_rate != null ? Number(r.factor_rate) : undefined,
    proposedPayback: r.proposed_payback != null ? Number(r.proposed_payback) : undefined,
    dailyPayment: r.daily_payment != null ? Number(r.daily_payment) : undefined,
    holdbackPct: r.holdback_pct != null ? Number(r.holdback_pct) : undefined,
    disclosureState: r.disclosure_state ?? undefined,
    missingDocs: r.missing_docs ?? undefined,
    notes: r.notes ?? undefined,
    source: r.source ?? '',
  };
}

function toDbUw(a: Partial<UWApplication>): Record<string, any> {
  const out: Record<string, any> = {};
  if (a.id !== undefined) out.id = a.id;
  if (a.applicationId !== undefined) out.application_id = a.applicationId;
  if (a.businessName !== undefined) out.business_name = a.businessName;
  if (a.dba !== undefined) out.dba = a.dba;
  if (a.industry !== undefined) out.industry = a.industry;
  if (a.state !== undefined) out.state = a.state;
  if (a.productType !== undefined) out.product_type = a.productType;
  if (a.requestedAmount !== undefined) out.requested_amount = a.requestedAmount;
  if (a.monthlyRevenue !== undefined) out.monthly_revenue = a.monthlyRevenue;
  if (a.avgDailyBalance !== undefined) out.avg_daily_balance = a.avgDailyBalance;
  if (a.monthsInBusiness !== undefined) out.months_in_business = a.monthsInBusiness;
  if (a.creditScore !== undefined) out.credit_score = a.creditScore;
  if (a.existingPositions !== undefined) out.existing_positions = a.existingPositions;
  if (a.submissionDate !== undefined) out.submission_date = a.submissionDate;
  if (a.reviewer !== undefined) out.reviewer = a.reviewer;
  if (a.reviewerInitials !== undefined) out.reviewer_initials = a.reviewerInitials;
  if (a.riskScore !== undefined) out.risk_score = a.riskScore;
  if (a.stage !== undefined) out.stage = a.stage;
  if (a.daysInStage !== undefined) out.days_in_stage = a.daysInStage;
  if (a.slaThreshold !== undefined) out.sla_threshold = a.slaThreshold;
  if (a.factorRate !== undefined) out.factor_rate = a.factorRate;
  if (a.proposedPayback !== undefined) out.proposed_payback = a.proposedPayback;
  if (a.dailyPayment !== undefined) out.daily_payment = a.dailyPayment;
  if (a.holdbackPct !== undefined) out.holdback_pct = a.holdbackPct;
  if (a.disclosureState !== undefined) out.disclosure_state = a.disclosureState;
  if (a.missingDocs !== undefined) out.missing_docs = a.missingDocs;
  if (a.notes !== undefined) out.notes = a.notes;
  if (a.source !== undefined) out.source = a.source;
  return out;
}

function fromDbReferral(r: any): Referral {
  return {
    id: r.id,
    referringMerchant: r.referring_merchant,
    referredBusiness: r.referred_business,
    referralCode: r.referral_code,
    date: r.date ?? '',
    status: r.status,
    rewardStatus: r.reward_status,
    rewardAmount: r.reward_amount ?? '',
  };
}

function toDbReferral(r: Partial<Referral>): Record<string, any> {
  const out: Record<string, any> = {};
  if (r.id !== undefined) out.id = r.id;
  if (r.referringMerchant !== undefined) out.referring_merchant = r.referringMerchant;
  if (r.referredBusiness !== undefined) out.referred_business = r.referredBusiness;
  if (r.referralCode !== undefined) out.referral_code = r.referralCode;
  if (r.date !== undefined) out.date = r.date;
  if (r.status !== undefined) out.status = r.status;
  if (r.rewardStatus !== undefined) out.reward_status = r.rewardStatus;
  if (r.rewardAmount !== undefined) out.reward_amount = r.rewardAmount;
  return out;
}

function fromDbProgram(r: any): ReferralProgram {
  return {
    rewardAmount: r.reward_amount ?? '100',
    freeMonths: r.free_months ?? '1',
    planTier: r.plan_tier ?? 'Growth',
  };
}

function toDbProgram(p: Partial<ReferralProgram>): Record<string, any> {
  const out: Record<string, any> = {};
  if (p.rewardAmount !== undefined) out.reward_amount = String(p.rewardAmount);
  if (p.freeMonths !== undefined) out.free_months = String(p.freeMonths);
  if (p.planTier !== undefined) out.plan_tier = p.planTier;
  return out;
}

function fromDbCallLog(r: any): CallLog {
  return {
    id: r.id,
    phoneNormalized: r.phone_normalized,
    phoneRaw: r.phone_raw ?? '',
    direction: r.direction,
    status: r.status,
    subjectKind: r.matched_subject_kind ?? 'none',
    subjectId: r.matched_subject_id ?? null,
    subjectLabel: r.matched_subject_label ?? null,
    agent: r.agent ?? '',
    startedAt: r.started_at,
    endedAt: r.ended_at ?? null,
    durationSeconds: r.duration_seconds ?? null,
    notes: r.notes ?? '',
    provider: r.provider ?? null,
    providerCallSid: r.provider_call_sid ?? null,
    recordingUrl: r.recording_url ?? null,
  };
}

function toDbCallLog(c: Partial<CallLog>): Record<string, any> {
  const out: Record<string, any> = {};
  if (c.id !== undefined) out.id = c.id;
  if (c.phoneNormalized !== undefined) out.phone_normalized = c.phoneNormalized;
  if (c.phoneRaw !== undefined) out.phone_raw = c.phoneRaw;
  if (c.direction !== undefined) out.direction = c.direction;
  if (c.status !== undefined) out.status = c.status;
  if (c.subjectKind !== undefined) out.matched_subject_kind = c.subjectKind;
  if (c.subjectId !== undefined) out.matched_subject_id = c.subjectId;
  if (c.subjectLabel !== undefined) out.matched_subject_label = c.subjectLabel;
  if (c.agent !== undefined) out.agent = c.agent;
  if (c.startedAt !== undefined) out.started_at = c.startedAt;
  if (c.endedAt !== undefined) out.ended_at = c.endedAt;
  if (c.durationSeconds !== undefined) out.duration_seconds = c.durationSeconds;
  if (c.notes !== undefined) out.notes = c.notes;
  if (c.provider !== undefined) out.provider = c.provider;
  if (c.providerCallSid !== undefined) out.provider_call_sid = c.providerCallSid;
  if (c.recordingUrl !== undefined) out.recording_url = c.recordingUrl;
  return out;
}

// ══════════════════════════════════════════════════════════════
// Hydration + realtime
// ══════════════════════════════════════════════════════════════

let hydrated = false;
let hydrating = false;

async function maybeHydrate() {
  if (hydrated || hydrating) return;

  if (!supabase) {
    // Offline mode — load fallback seed once so screens aren't empty.
    hydrated = true;
    set(fallbackSeed);
    setSync({ isLoading: false, isOnline: false });
    return;
  }

  hydrating = true;
  setSync({ isLoading: true, lastError: null });

  try {
    const [leadsRes, onbRes, uwRes, refRes, progRes, callsRes] = await Promise.all([
      supabase.from('leads').select('*').order('id', { ascending: true }),
      supabase.from('onboarding_apps').select('*').order('id', { ascending: true }),
      supabase.from('underwriting_apps').select('*').order('id', { ascending: true }),
      supabase.from('referrals').select('*').order('id', { ascending: true }),
      supabase.from('referral_program').select('*').eq('id', 1).maybeSingle(),
      // call_logs is allowed to fail (migration may not be applied yet) — we
      // catch and ignore the error below so the rest of hydration still works.
      supabase
        .from('call_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(500),
    ]);

    // Treat call_logs failure as soft (table may not exist on older deployments).
    if (callsRes.error) {
      // eslint-disable-next-line no-console
      console.warn('[Delt CRM] call_logs not available — skipping:', callsRes.error.message);
    }

    const firstErr =
      leadsRes.error || onbRes.error || uwRes.error || refRes.error || progRes.error;
    if (firstErr) throw firstErr;

    set({
      leads: (leadsRes.data || []).map(fromDbLead),
      onboarding: (onbRes.data || []).map(fromDbOnb),
      underwriting: (uwRes.data || []).map(fromDbUw),
      referrals: (refRes.data || []).map(fromDbReferral),
      program: progRes.data
        ? fromDbProgram(progRes.data)
        : { rewardAmount: '100', freeMonths: '1', planTier: 'Growth' },
      callLogs: callsRes.error ? [] : (callsRes.data || []).map(fromDbCallLog),
    });

    hydrated = true;
    setSync({ isLoading: false, isOnline: true, lastError: null });
    subscribeRealtime();
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[Delt CRM] Hydration failed:', err);
    hydrated = true; // don't retry-loop — user can refresh
    setSync({ isLoading: false, isOnline: false, lastError: err?.message || 'Failed to load' });
    toast.error('Unable to load CRM data — showing local snapshot.');
    // Keep whatever's already in state (likely empty) to stay functional.
  } finally {
    hydrating = false;
  }
}

function subscribeRealtime() {
  if (!supabase) return;
  const channel = supabase
    .channel('crm-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'leads' },
      payload => applyRealtime('leads', payload),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'onboarding_apps' },
      payload => applyRealtime('onboarding_apps', payload),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'underwriting_apps' },
      payload => applyRealtime('underwriting_apps', payload),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'referrals' },
      payload => applyRealtime('referrals', payload),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'referral_program' },
      payload => applyRealtime('referral_program', payload),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'call_logs' },
      payload => applyRealtime('call_logs', payload),
    )
    .subscribe();
  // Keep reference so it isn't GC'd.
  (globalThis as any).__deltCrmChannel = channel;
}

function applyRealtime(table: string, payload: any) {
  const { eventType, new: newRow, old: oldRow } = payload;
  if (table === 'leads') {
    if (eventType === 'DELETE') {
      set({ leads: state.leads.filter(l => l.id !== oldRow?.id) });
    } else {
      const mapped = fromDbLead(newRow);
      const exists = state.leads.some(l => l.id === mapped.id);
      set({
        leads: exists
          ? state.leads.map(l => (l.id === mapped.id ? mapped : l))
          : [mapped, ...state.leads],
      });
    }
  } else if (table === 'onboarding_apps') {
    if (eventType === 'DELETE') {
      set({ onboarding: state.onboarding.filter(o => o.id !== oldRow?.id) });
    } else {
      const mapped = fromDbOnb(newRow);
      const exists = state.onboarding.some(o => o.id === mapped.id);
      set({
        onboarding: exists
          ? state.onboarding.map(o => (o.id === mapped.id ? mapped : o))
          : [...state.onboarding, mapped],
      });
    }
  } else if (table === 'underwriting_apps') {
    if (eventType === 'DELETE') {
      set({ underwriting: state.underwriting.filter(a => a.id !== oldRow?.id) });
    } else {
      const mapped = fromDbUw(newRow);
      const exists = state.underwriting.some(a => a.id === mapped.id);
      set({
        underwriting: exists
          ? state.underwriting.map(a => (a.id === mapped.id ? mapped : a))
          : [mapped, ...state.underwriting],
      });
    }
  } else if (table === 'referrals') {
    if (eventType === 'DELETE') {
      set({ referrals: state.referrals.filter(r => r.id !== oldRow?.id) });
    } else {
      const mapped = fromDbReferral(newRow);
      const exists = state.referrals.some(r => r.id === mapped.id);
      set({
        referrals: exists
          ? state.referrals.map(r => (r.id === mapped.id ? mapped : r))
          : [mapped, ...state.referrals],
      });
    }
  } else if (table === 'referral_program') {
    if (newRow) set({ program: fromDbProgram(newRow) });
  } else if (table === 'call_logs') {
    if (eventType === 'DELETE') {
      set({ callLogs: state.callLogs.filter(c => c.id !== oldRow?.id) });
    } else {
      const mapped = fromDbCallLog(newRow);
      const exists = state.callLogs.some(c => c.id === mapped.id);
      set({
        callLogs: exists
          ? state.callLogs.map(c => (c.id === mapped.id ? mapped : c))
          : [mapped, ...state.callLogs],
      });
    }
  }
}

// ══════════════════════════════════════════════════════════════
// Optimistic write helper
// ══════════════════════════════════════════════════════════════

async function persist<T>(
  label: string,
  apply: () => void,
  rollback: () => void,
  op: () => Promise<{ error: { message: string } | null }>,
): Promise<void> {
  apply();
  if (!supabase) return; // offline mode: optimistic-only
  try {
    const { error } = await op();
    if (error) {
      rollback();
      // eslint-disable-next-line no-console
      console.error(`[Delt CRM] ${label} failed:`, error);
      toast.error(`Couldn't save ${label.toLowerCase()} — reverted.`);
    }
  } catch (err: any) {
    rollback();
    // eslint-disable-next-line no-console
    console.error(`[Delt CRM] ${label} threw:`, err);
    toast.error(`Couldn't save ${label.toLowerCase()} — reverted.`);
  }
}

// ══════════════════════════════════════════════════════════════
// Hooks
// ══════════════════════════════════════════════════════════════

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

export function useMerchants() {
  const selector = useCallback(() => state.merchants, []);
  return useSyncExternalStore(subscribe, selector, selector);
}

export function useDeals() {
  const selector = useCallback(() => state.deals, []);
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

export function useCallLogs() {
  const selector = useCallback(() => state.callLogs, []);
  return useSyncExternalStore(subscribe, selector, selector);
}

export function useTasks() {
  const selector = useCallback(() => state.tasks, []);
  return useSyncExternalStore(subscribe, selector, selector);
}

export function useThreads() {
  const selector = useCallback(() => state.threads, []);
  return useSyncExternalStore(subscribe, selector, selector);
}

export function useDocuments() {
  const selector = useCallback(() => state.documents, []);
  return useSyncExternalStore(subscribe, selector, selector);
}

export function useDisputeState() {
  const selector = useCallback(() => state.disputeState, []);
  return useSyncExternalStore(subscribe, selector, selector);
}

export function useComplianceFlags() {
  const selector = useCallback(() => state.complianceFlags, []);
  return useSyncExternalStore(subscribe, selector, selector);
}

// ══════════════════════════════════════════════════════════════
// Phone search — find merchants/leads by phone number on file.
// Used by the Call Center page for inbound caller-ID lookup and
// outbound dial-by-number flows.
// ══════════════════════════════════════════════════════════════

/**
 * Returns every CRM record whose stored phone matches the input.
 *
 * Searches:
 *   • merchants.contactPhone           (in-memory store + onboarding-created merchants)
 *   • leads.contactPhone               (Supabase-backed)
 *   • leads.kyb.business.phone         (KYB intake)
 *   • leads.kyb.representative.phone   (KYB intake)
 *
 * Empty / too-short input returns []. Use `phoneMatches` so that
 * "(555) 123-4567" matches a stored "+15551234567" (etc.).
 */
export function searchByPhone(input: string): PhoneMatch[] {
  const norm = normalizePhone(input);
  if (!norm && phoneDigits(input).length < 7) return [];

  const out: PhoneMatch[] = [];

  for (const m of state.merchants) {
    if (m.contactPhone && phoneMatches(m.contactPhone, input)) {
      out.push({
        kind: 'merchant',
        id: m.id,
        label: m.name,
        contactName: m.contactName,
        matchedField: 'merchant.contactPhone',
        phone: m.contactPhone,
      });
    }
  }

  for (const l of state.leads) {
    if (l.contactPhone && phoneMatches(l.contactPhone, input)) {
      out.push({
        kind: 'lead',
        id: l.id,
        label: l.businessName,
        contactName: l.contactName,
        matchedField: 'lead.contactPhone',
        phone: l.contactPhone,
      });
      continue;
    }
    const bizPhone = l.kyb?.business?.phone;
    if (bizPhone && phoneMatches(bizPhone, input)) {
      out.push({
        kind: 'lead',
        id: l.id,
        label: l.businessName,
        contactName: l.contactName,
        matchedField: 'lead.kyb.business',
        phone: bizPhone,
      });
      continue;
    }
    const repPhone = l.kyb?.representative?.phone;
    if (repPhone && phoneMatches(repPhone, input)) {
      out.push({
        kind: 'lead',
        id: l.id,
        label: l.businessName,
        contactName: l.contactName,
        matchedField: 'lead.kyb.representative',
        phone: repPhone,
      });
    }
  }

  return out;
}

/** Exposes hydration & connectivity status for UI indicators. */
export function useCrmSync() {
  return useSyncExternalStore(subscribe, getSyncSnapshot, getSyncSnapshot);
}

// ══════════════════════════════════════════════════════════════
// Actions (signatures unchanged — pages unchanged)
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
    // Generate an ID that's unique against current state.
    const used = new Set(state.leads.map(l => l.id));
    let n = state.leads.length + 1;
    let id = `lead-${String(n).padStart(3, '0')}`;
    while (used.has(id)) id = `lead-${String(++n).padStart(3, '0')}`;

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
      extraNotes: [],
      tasks: [],
    };
    const prev = state.leads;
    persist(
      'lead',
      () => set({ leads: [created, ...state.leads] }),
      () => set({ leads: prev }),
      () => supabase!.from('leads').insert(toDbLead(created)).then(r => ({ error: r.error })),
    );
    return created;
  },

  update(id: string, patch: Partial<Lead>) {
    const prev = state.leads;
    const lead = state.leads.find(l => l.id === id);
    if (!lead) return;
    persist(
      'lead',
      () => set({ leads: state.leads.map(l => (l.id === id ? { ...l, ...patch } : l)) }),
      () => set({ leads: prev }),
      () => supabase!.from('leads').update(toDbLead(patch)).eq('id', id).then(r => ({ error: r.error })),
    );
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
    const prev = state.onboarding;
    const target = state.onboarding.find(o => o.id === id);
    if (!target) return;
    const patch = { nudges: (target.nudges || 0) + 1, lastNudge: nowStamp() };
    persist(
      'onboarding nudge',
      () =>
        set({
          onboarding: state.onboarding.map(o => (o.id === id ? { ...o, ...patch } : o)),
        }),
      () => set({ onboarding: prev }),
      () => supabase!.from('onboarding_apps').update(toDbOnb(patch)).eq('id', id).then(r => ({ error: r.error })),
    );
  },

  reassign(id: string, newAgent: string) {
    const prev = state.onboarding;
    persist(
      'reassign',
      () =>
        set({
          onboarding: state.onboarding.map(o => (o.id === id ? { ...o, agent: newAgent } : o)),
        }),
      () => set({ onboarding: prev }),
      () => supabase!.from('onboarding_apps').update({ agent: newAgent }).eq('id', id).then(r => ({ error: r.error })),
    );
  },

  advance(id: string) {
    const STEPS: OnbStep[] = ['Application Submitted', 'Bank Verification', 'Identity Verification', 'Underwriting', 'Docs & E-Sign', 'Funded'];
    const target = state.onboarding.find(o => o.id === id);
    if (!target) return;
    const nextIdx = Math.min(target.currentStepIndex + 1, STEPS.length - 1);
    const nextStep = STEPS[nextIdx];
    const steps = target.steps.map((s, i) => (i === target.currentStepIndex ? { ...s, completedAt: nowStamp() } : s));
    const patch: Partial<OnboardingApp> = {
      currentStep: nextStep,
      currentStepIndex: nextIdx,
      steps,
      timeInStep: '0 hrs',
      timeInStepHours: 0,
      slaStatus: 'On Track',
    };
    const prev = state.onboarding;
    persist(
      'advance step',
      () =>
        set({
          onboarding: state.onboarding.map(o => (o.id === id ? { ...o, ...patch } : o)),
        }),
      () => set({ onboarding: prev }),
      () => supabase!.from('onboarding_apps').update(toDbOnb(patch)).eq('id', id).then(r => ({ error: r.error })),
    );
  },
};

// ── Underwriting actions ──
export const underwritingActions = {
  create(partial: Partial<UWApplication>): UWApplication {
    const used = new Set(state.underwriting.map(a => a.id));
    let n = state.underwriting.length + 1;
    let id = `app-${String(n).padStart(3, '0')}`;
    while (used.has(id)) id = `app-${String(++n).padStart(3, '0')}`;
    const appId = `UW-2026-${String(200 + n).padStart(4, '0')}`;
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
    const prev = state.underwriting;
    persist(
      'underwriting app',
      () => set({ underwriting: [app, ...state.underwriting] }),
      () => set({ underwriting: prev }),
      () => supabase!.from('underwriting_apps').insert(toDbUw(app)).then(r => ({ error: r.error })),
    );
    return app;
  },

  update(id: string, patch: Partial<UWApplication>) {
    const prev = state.underwriting;
    persist(
      'underwriting app',
      () =>
        set({
          underwriting: state.underwriting.map(a => (a.id === id ? { ...a, ...patch } : a)),
        }),
      () => set({ underwriting: prev }),
      () => supabase!.from('underwriting_apps').update(toDbUw(patch)).eq('id', id).then(r => ({ error: r.error })),
    );
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
    const target = state.referrals.find(r => r.id === id);
    if (!target) return;
    const nextRewardStatus: Referral['rewardStatus'] =
      status === 'Converted'
        ? target.rewardStatus === 'N/A'
          ? 'Pending'
          : target.rewardStatus
        : target.rewardStatus;
    const prev = state.referrals;
    persist(
      'referral status',
      () =>
        set({
          referrals: state.referrals.map(r =>
            r.id === id ? { ...r, status, rewardStatus: nextRewardStatus } : r,
          ),
        }),
      () => set({ referrals: prev }),
      () =>
        supabase!
          .from('referrals')
          .update({ status, reward_status: nextRewardStatus })
          .eq('id', id)
          .then(r => ({ error: r.error })),
    );
  },

  payReward(id: string) {
    const prev = state.referrals;
    persist(
      'reward payout',
      () =>
        set({
          referrals: state.referrals.map(r => (r.id === id ? { ...r, rewardStatus: 'Paid' } : r)),
        }),
      () => set({ referrals: prev }),
      () => supabase!.from('referrals').update({ reward_status: 'Paid' }).eq('id', id).then(r => ({ error: r.error })),
    );
  },

  create(partial: Partial<Referral>) {
    const used = new Set(state.referrals.map(r => r.id));
    let n = state.referrals.length + 1;
    let id = `REF-${String(n).padStart(3, '0')}`;
    while (used.has(id)) id = `REF-${String(++n).padStart(3, '0')}`;
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
    const prev = state.referrals;
    persist(
      'referral',
      () => set({ referrals: [ref, ...state.referrals] }),
      () => set({ referrals: prev }),
      () => supabase!.from('referrals').insert(toDbReferral(ref)).then(r => ({ error: r.error })),
    );
    return ref;
  },
};

// ── Program actions ──
export const programActions = {
  update(patch: Partial<ReferralProgram>) {
    // Coerce to strings (interface stores strings; callers sometimes pass Number()).
    const coerced: Partial<ReferralProgram> = {};
    if (patch.rewardAmount !== undefined) coerced.rewardAmount = String(patch.rewardAmount);
    if (patch.freeMonths !== undefined) coerced.freeMonths = String(patch.freeMonths);
    if (patch.planTier !== undefined) coerced.planTier = patch.planTier;

    const prev = state.program;
    persist(
      'referral program',
      () => set({ program: { ...state.program, ...coerced } }),
      () => set({ program: prev }),
      () =>
        supabase!
          .from('referral_program')
          .upsert({ id: 1, ...toDbProgram(coerced) })
          .then(r => ({ error: r.error })),
    );
  },
};

// ── Merchant actions (client-side only — not yet backed by Supabase) ──
export const merchantActions = {
  create(partial: Partial<Merchant>): Merchant {
    const used = new Set(state.merchants.map(m => m.id));
    let n = state.merchants.length + 1;
    let id = `merchant-${String(n).padStart(3, '0')}`;
    while (used.has(id)) id = `merchant-${String(++n).padStart(3, '0')}`;
    const merchant: Merchant = {
      id,
      name: partial.name || 'New Merchant',
      industry: partial.industry || 'General',
      status: (partial.status as MerchantStatus) || 'Pending',
      monthlyVolume: partial.monthlyVolume ?? 0,
      mcaBalance: partial.mcaBalance ?? 0,
      capitalDeployed: partial.capitalDeployed ?? 0,
      healthScore: partial.healthScore ?? 75,
      agent: partial.agent || 'Unassigned',
      products: partial.products || { processing: true, capital: false, website: false, lens: false },
      plan: (partial.plan as PlanTier) || 'Free',
      monthlyFee: partial.monthlyFee ?? 0,
      contactName: partial.contactName,
      contactEmail: partial.contactEmail,
      contactPhone: partial.contactPhone,
      state: partial.state,
      ein: partial.ein,
      website: partial.website,
      notes: partial.notes,
    };
    set({ merchants: [merchant, ...state.merchants] });
    return merchant;
  },

  update(id: string, patch: Partial<Merchant>) {
    set({ merchants: state.merchants.map(m => (m.id === id ? { ...m, ...patch } : m)) });
  },

  remove(id: string) {
    set({ merchants: state.merchants.filter(m => m.id !== id) });
  },
};

// ── Deal actions (client-side only — not yet backed by Supabase) ──
export const dealActions = {
  create(partial: Partial<Deal>): Deal {
    const used = new Set(state.deals.map(d => d.id));
    let n = state.deals.length + 1;
    const next = () => `D-${String(2000 + n).padStart(4, '0')}`;
    while (used.has(next())) n++;
    const id = partial.id || next();
    const loan = partial.loanAmount ?? 0;
    const rate = partial.rate ?? 1.35;
    const repayment = partial.repaymentAmount ?? Math.round(loan * rate);
    const today = new Date();
    const due = new Date(today);
    due.setMonth(due.getMonth() + 9);
    const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
    const deal: Deal = {
      id,
      status: (partial.status as DealStatus) || 'Current',
      delinquencyLabel: partial.delinquencyLabel,
      type: (partial.type as DealType) || 'MCA',
      borrower: partial.borrower || 'New Borrower',
      loanAmount: loan,
      repaymentAmount: repayment,
      collected: partial.collected ?? 0,
      outstanding: partial.outstanding ?? repayment,
      rate,
      dailyPayment: partial.dailyPayment ?? Math.round(repayment / 150),
      fundedDate: partial.fundedDate || fmtDate(today),
      dueDate: partial.dueDate || fmtDate(due),
      agent: partial.agent || 'Unassigned',
      notes: partial.notes,
    };
    set({ deals: [deal, ...state.deals] });
    return deal;
  },

  update(id: string, patch: Partial<Deal>) {
    set({ deals: state.deals.map(d => (d.id === id ? { ...d, ...patch } : d)) });
  },

  remove(id: string) {
    set({ deals: state.deals.filter(d => d.id !== id) });
  },
};

// ══════════════════════════════════════════════════════════════
// Call log actions
// ══════════════════════════════════════════════════════════════

interface LogCallInput {
  phone: string;                           // raw, as entered
  direction?: CallDirection;               // default 'outbound'
  status?: CallStatus;                     // default 'completed'
  subjectKind?: CallSubjectKind;           // default 'none'
  subjectId?: string | null;
  subjectLabel?: string | null;
  agent?: string;
  startedAt?: string;                      // ISO; defaults to now
  endedAt?: string | null;
  durationSeconds?: number | null;
  notes?: string;
  provider?: string | null;                // 'twilio' | 'click-to-call' | null
  providerCallSid?: string | null;
  recordingUrl?: string | null;
}

function newCallLogId(): string {
  // Use a sortable-ish ID so the optimistic insert keeps the newest-first order.
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `call-${ts}-${rand}`;
}

export const callLogActions = {
  /**
   * Insert a call log row. The phone number is normalized before insert
   * so all rows in `call_logs.phone_normalized` share a single canonical
   * format — this is what makes caller-ID lookup cheap.
   */
  log(input: LogCallInput): CallLog {
    const phoneRaw = input.phone || '';
    const phoneNormalized = normalizePhone(phoneRaw) || phoneRaw;
    const startedAt = input.startedAt || new Date().toISOString();
    const log: CallLog = {
      id: newCallLogId(),
      phoneRaw,
      phoneNormalized,
      direction: input.direction || 'outbound',
      status: input.status || 'completed',
      subjectKind: input.subjectKind || 'none',
      subjectId: input.subjectId ?? null,
      subjectLabel: input.subjectLabel ?? null,
      agent: input.agent || 'Unassigned',
      startedAt,
      endedAt: input.endedAt ?? null,
      durationSeconds: input.durationSeconds ?? null,
      notes: input.notes || '',
      provider: input.provider ?? null,
      providerCallSid: input.providerCallSid ?? null,
      recordingUrl: input.recordingUrl ?? null,
    };
    const prev = state.callLogs;
    persist(
      'call log',
      () => set({ callLogs: [log, ...state.callLogs] }),
      () => set({ callLogs: prev }),
      () => supabase!.from('call_logs').insert(toDbCallLog(log)).then(r => ({ error: r.error })),
    );
    return log;
  },

  update(id: string, patch: Partial<CallLog>) {
    const prev = state.callLogs;
    persist(
      'call log',
      () => set({ callLogs: state.callLogs.map(c => (c.id === id ? { ...c, ...patch } : c)) }),
      () => set({ callLogs: prev }),
      () => supabase!.from('call_logs').update(toDbCallLog(patch)).eq('id', id).then(r => ({ error: r.error })),
    );
  },

  associate(id: string, kind: CallSubjectKind, subjectId: string | null, subjectLabel: string | null) {
    callLogActions.update(id, { subjectKind: kind, subjectId, subjectLabel });
  },

  remove(id: string) {
    const prev = state.callLogs;
    persist(
      'call log delete',
      () => set({ callLogs: state.callLogs.filter(c => c.id !== id) }),
      () => set({ callLogs: prev }),
      () => supabase!.from('call_logs').delete().eq('id', id).then(r => ({ error: r.error })),
    );
  },
};

// ══════════════════════════════════════════════════════════════
// Tasks / Inbox / Documents / Disputes / Compliance — actions
// ══════════════════════════════════════════════════════════════
//
// These mutate in-memory state. No Supabase persistence yet — the
// underlying tables don't exist. Seeds are loaded once on first
// subscriber so the UI feels populated; user-driven mutations are
// session-scoped and reset on reload.

const TASK_SEED: CrmTask[] = [
  { id: 'T-001', title: 'Issue VAMP intervention notice — Coral Reef Auto Spa', description: 'Fraud-to-sales at 0.82%. VAMP trigger is 0.9%. Issue notice and draft remediation plan before breach.', status: 'todo', priority: 'critical', category: 'compliance', assignee: 'James Miller', merchant: 'Coral Reef Auto Spa', merchantId: 'M-1004', dueDate: '2026-04-17', createdDate: '2026-04-17', createdBy: 'System', tags: ['VAMP', 'card networks'], overdue: true },
  { id: 'T-002', title: 'Schedule ASV scans — 3 merchants overdue', description: 'Havana Bites, Coral Reef Auto Spa, +1 have ASV scans expiring within 48 hours.', status: 'todo', priority: 'critical', category: 'compliance', assignee: 'Sarah Kim', dueDate: '2026-04-18', createdDate: '2026-04-16', createdBy: 'System', tags: ['PCI', 'ASV'], overdue: false },
  { id: 'T-003', title: 'Generate broker compensation disclosure — Brooklyn Vinyl', description: 'NY CFDL requires broker compensation disclosure when ISO/agent involved.', status: 'in_progress', priority: 'critical', category: 'compliance', assignee: 'Sarah Kim', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', dealId: 'DL-2026-0415', dueDate: '2026-04-18', createdDate: '2026-04-16', createdBy: 'System', tags: ['NY CFDL', 'disclosure'], overdue: false },
  { id: 'T-004', title: 'Send adverse action notice — Doral Fresh Market', description: 'CRS credit report influenced partial decline. FCRA requires notice within 30 days.', status: 'todo', priority: 'high', category: 'compliance', assignee: 'Marcus Johnson', merchant: 'Doral Fresh Market', dueDate: '2026-04-19', createdDate: '2026-04-14', createdBy: 'System', tags: ['FCRA'], overdue: false },
  { id: 'T-005', title: 'Follow up — Richmond Auto Detailing funding', description: 'VA 3-day review period expires Apr 22. Collect signed acknowledgment and fund.', status: 'in_progress', priority: 'high', category: 'sales', assignee: 'Marcus Johnson', merchant: 'Richmond Auto Detailing', merchantId: 'M-1003', dealId: 'DL-2026-0416', dueDate: '2026-04-22', createdDate: '2026-04-17', createdBy: 'Marcus Johnson', tags: ['VA review', 'funding'], overdue: false },
  { id: 'T-006', title: 'Collection call — Little Havana Barbershop', description: '3 consecutive NSFs. Status: Slow Pay. Discuss payment plan.', status: 'todo', priority: 'high', category: 'collections', assignee: 'Marcus Johnson', merchant: 'Little Havana Barbershop', dueDate: '2026-04-18', createdDate: '2026-04-13', createdBy: 'System', tags: ['NSF', 'slow pay'], overdue: false },
  { id: 'T-007', title: 'Reconcile CRS credit pulls — March', description: 'Monthly pull count vs billing reconciliation.', status: 'todo', priority: 'medium', category: 'internal', assignee: 'Sarah Kim', dueDate: '2026-04-21', createdDate: '2026-04-01', createdBy: 'System', tags: ['CRS', 'monthly'], overdue: false },
  { id: 'T-008', title: 'Draft ECM remediation plan — Midtown Taqueria', description: 'MC chargeback ratio at 1.17% (threshold 1.5%).', status: 'todo', priority: 'medium', category: 'compliance', assignee: 'James Miller', merchant: 'Midtown Taqueria', merchantId: 'M-1005', dueDate: '2026-04-22', createdDate: '2026-04-15', createdBy: 'System', tags: ['ECM', 'Mastercard'], overdue: false },
  { id: 'T-009', title: 'Review stacking flag — Brooklyn Vinyl Records', description: 'DataMerch flagged 1 existing position: Rapid Capital $28k.', status: 'in_progress', priority: 'medium', category: 'onboarding', assignee: 'Sarah Kim', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', dealId: 'DL-2026-0415', dueDate: '2026-04-18', createdDate: '2026-04-16', createdBy: 'System', tags: ['DataMerch'], overdue: false },
  { id: 'T-010', title: 'Present renewal offer — Havana Bites Cafe', description: '73% repaid. Auto-generated renewal: $50K at 1.36x.', status: 'todo', priority: 'medium', category: 'sales', assignee: 'Marcus Johnson', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', dealId: 'DL-2026-0412', dueDate: '2026-04-21', createdDate: '2026-04-15', createdBy: 'System', tags: ['renewal'], overdue: false },
  { id: 'T-011', title: 'MATCH re-screen Q2 batch', description: 'Quarterly MATCH/TMF re-screening for 127 active merchants.', status: 'todo', priority: 'medium', category: 'compliance', assignee: 'Sarah Kim', dueDate: '2026-04-23', createdDate: '2026-04-10', createdBy: 'System', tags: ['MATCH', 'quarterly'], overdue: false },
  { id: 'T-012', title: 'Report 2 defaults to DataMerch', description: 'Report default data to DataMerch consortium.', status: 'todo', priority: 'low', category: 'compliance', assignee: 'Sarah Kim', dueDate: '2026-04-23', createdDate: '2026-04-10', createdBy: 'System', tags: ['DataMerch'], overdue: false },
  { id: 'T-013', title: 'Plaid security questionnaire renewal', description: 'Annual Plaid vendor security questionnaire due May 5.', status: 'todo', priority: 'low', category: 'compliance', assignee: 'Sarah Kim', dueDate: '2026-05-05', createdDate: '2026-04-01', createdBy: 'System', tags: ['Plaid', 'vendor'], overdue: false },
  { id: 'T-014', title: 'Create NJ S1760 impact assessment', description: 'NJ bill: APR via Reg Z for NJ merchants if enacted.', status: 'todo', priority: 'low', category: 'compliance', assignee: 'Marcus Johnson', dueDate: '2026-04-30', createdDate: '2026-04-15', createdBy: 'System', tags: ['regulatory', 'NJ'], overdue: false },
  { id: 'T-015', title: 'PCI SAQ follow-up — Midtown Taqueria', description: 'Confirmed scan completed Mar 15 — PASS. Close task.', status: 'done', priority: 'medium', category: 'compliance', assignee: 'Sarah Kim', merchant: 'Midtown Taqueria', merchantId: 'M-1005', dueDate: '2026-04-13', createdDate: '2026-04-01', createdBy: 'Sarah Kim', tags: ['PCI'], overdue: false },
];

const THREAD_SEED: InboxThread[] = [
  { id: 'th-1', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', contact: 'David Park', contactEmail: 'david@brooklynvinyl.com', contactPhone: '(718) 555-0198', channel: 'email', status: 'unread', starred: true, lastMessage: 'Hi Sarah, I received the disclosure documents but I have a question about the broker compensation section...', lastTimestamp: '2026-04-17 10:30', messageCount: 4, agent: 'Sarah Kim', dealId: 'DL-2026-0415', messages: [
    { id: 'm1a', direction: 'outbound', channel: 'email', from: 'Sarah Kim <sarah@deltpay.com>', to: 'david@brooklynvinyl.com', subject: 'NY CFDL Disclosure Package', body: 'Hi David,\n\nAttached is your Commercial Finance Disclosure as required by New York law.\n\nBest,\nSarah', timestamp: '2026-04-16 15:10', attachments: ['NY_CFDL_Disclosure_DL-2026-0415.pdf'] },
    { id: 'm1b', direction: 'inbound', channel: 'email', from: 'david@brooklynvinyl.com', to: 'sarah@deltpay.com', subject: 'Re: NY CFDL Disclosure', body: 'Hi Sarah, two questions on the APR and broker compensation. Thanks, David', timestamp: '2026-04-16 16:45' },
    { id: 'm1c', direction: 'outbound', channel: 'email', from: 'Sarah Kim <sarah@deltpay.com>', to: 'david@brooklynvinyl.com', subject: 'Re: Re: NY CFDL Disclosure', body: 'Hi David, the APR is required by NY. Broker compensation disclosure follows by EOD tomorrow. Best, Sarah', timestamp: '2026-04-16 17:20' },
    { id: 'm1d', direction: 'inbound', channel: 'email', from: 'david@brooklynvinyl.com', to: 'sarah@deltpay.com', subject: 'Re: Re: Re: NY CFDL Disclosure', body: 'Hi Sarah, I received the disclosure documents but I have a question about the broker compensation section. Thanks, David', timestamp: '2026-04-17 10:30' },
  ] },
  { id: 'th-2', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', contact: 'Maria Gonzalez', contactEmail: 'maria@havanabites.com', contactPhone: '(305) 555-0142', channel: 'sms', status: 'read', starred: false, lastMessage: 'Great, thank you for the update! We are excited about the renewal offer.', lastTimestamp: '2026-04-16 14:15', messageCount: 2, agent: 'Marcus Johnson', messages: [
    { id: 'm2a', direction: 'outbound', channel: 'sms', from: 'Delt Pay', to: '(305) 555-0142', body: 'Hi Maria! Pre-qualified for $50K renewal. Want details?', timestamp: '2026-04-15 09:15' },
    { id: 'm2b', direction: 'inbound', channel: 'sms', from: '(305) 555-0142', to: 'Delt Pay', body: 'Great, thank you for the update! We are excited about the renewal offer.', timestamp: '2026-04-16 14:15' },
  ] },
  { id: 'th-3', merchant: 'Midtown Taqueria', merchantId: 'M-1005', contact: 'Roberto Fuentes', contactEmail: 'roberto@midtowntaq.com', contactPhone: '(212) 555-0167', channel: 'call', status: 'read', starred: false, lastMessage: 'Inbound call — 12m. Owner asked about chargeback on Mar 28.', lastTimestamp: '2026-04-14 16:45', messageCount: 1, agent: 'Marcus Johnson', messages: [
    { id: 'm3a', direction: 'inbound', channel: 'call', from: '(212) 555-0167', to: 'Marcus Johnson', body: 'Inbound call — 12m 05s. Owner asked about chargeback on Mar 28 transaction ($315).', timestamp: '2026-04-14 16:45' },
  ] },
  { id: 'th-4', merchant: 'Coral Reef Auto Spa', merchantId: 'M-1004', contact: 'Carlos Mendez', contactEmail: 'carlos@coralreefauto.com', contactPhone: '(954) 555-0189', channel: 'email', status: 'unread', starred: false, lastMessage: 'I spoke with my web developer. He says enabling 3DS will cost about $200/mo. Is that normal?', lastTimestamp: '2026-04-16 09:20', messageCount: 1, agent: 'James Miller', messages: [
    { id: 'm4a', direction: 'inbound', channel: 'email', from: 'carlos@coralreefauto.com', to: 'james.m@deltpay.com', subject: 'Re: Chargeback Prevention — 3DS', body: 'James, I spoke with my web developer. He says enabling 3DS will cost $200/mo. Is that normal? Carlos', timestamp: '2026-04-16 09:20' },
  ] },
];

const DOCUMENT_SEED: CrmDocument[] = [
  { id: 'DOC-001', name: 'MCA Agreement — Brooklyn Vinyl Records', type: 'mca_agreement', status: 'pending_signature', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', dealId: 'DL-2026-0415', createdDate: '2026-04-16', sentDate: '2026-04-16', signer: 'David Park', signerEmail: 'david@brooklynvinyl.com', agent: 'Sarah Kim', pages: 14, size: '2.4 MB', requiresNotarization: false, envelopeId: 'ENV-8842' },
  { id: 'DOC-002', name: 'NY CFDL Disclosure — Brooklyn Vinyl Records', type: 'disclosure', status: 'pending_signature', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', dealId: 'DL-2026-0415', createdDate: '2026-04-16', sentDate: '2026-04-16', signer: 'David Park', signerEmail: 'david@brooklynvinyl.com', agent: 'Sarah Kim', pages: 9, size: '1.8 MB', requiresNotarization: false, envelopeId: 'ENV-8843' },
  { id: 'DOC-003', name: 'VA HB 1027 Disclosure — Richmond Auto Detailing', type: 'disclosure', status: 'sent', merchant: 'Richmond Auto Detailing', merchantId: 'M-1003', dealId: 'DL-2026-0416', createdDate: '2026-04-17', sentDate: '2026-04-17', signer: 'James Richardson', signerEmail: 'james@richmondauto.com', agent: 'Marcus Johnson', pages: 11, size: '2.1 MB', requiresNotarization: false, envelopeId: 'ENV-8850', expiryDate: '2026-04-22' },
  { id: 'DOC-004', name: 'MCA Agreement — Havana Bites Cafe', type: 'mca_agreement', status: 'signed', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', dealId: 'DL-2026-0412', createdDate: '2026-04-12', sentDate: '2026-04-12', signedDate: '2026-04-13', signer: 'Maria Gonzalez', signerEmail: 'maria@havanabites.com', agent: 'Marcus Johnson', pages: 12, size: '2.2 MB', requiresNotarization: false, envelopeId: 'ENV-8801' },
  { id: 'DOC-005', name: 'UCC-1 Filing — Havana Bites Cafe', type: 'ucc_filing', status: 'signed', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', dealId: 'DL-2026-0412', createdDate: '2026-04-14', signedDate: '2026-04-14', agent: 'Marcus Johnson', pages: 3, size: '480 KB', requiresNotarization: false },
  { id: 'DOC-008', name: 'Adverse Action Notice — Doral Fresh Market', type: 'adverse_action', status: 'draft', merchant: 'Doral Fresh Market', merchantId: 'M-1008', createdDate: '2026-04-15', agent: 'Marcus Johnson', pages: 2, size: '180 KB', requiresNotarization: false },
  { id: 'DOC-010', name: 'Amendment — Little Havana Barbershop', type: 'amendment', status: 'draft', merchant: 'Little Havana Barbershop', merchantId: 'M-1006', createdDate: '2026-04-16', agent: 'Marcus Johnson', pages: 4, size: '520 KB', requiresNotarization: false },
  { id: 'DOC-012', name: 'Broker Compensation Disclosure — Brooklyn Vinyl', type: 'disclosure', status: 'draft', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', dealId: 'DL-2026-0415', createdDate: '2026-04-17', agent: 'Sarah Kim', pages: 3, size: '290 KB', requiresNotarization: false },
];

let _seedsLoaded = false;
function ensureSeeds() {
  if (_seedsLoaded) return;
  _seedsLoaded = true;
  if (state.tasks.length === 0) state.tasks = TASK_SEED;
  if (state.threads.length === 0) state.threads = THREAD_SEED;
  if (state.documents.length === 0) state.documents = DOCUMENT_SEED;
}

ensureSeeds();

function nextId(prefix: string, used: Set<string>) {
  let n = used.size + 1;
  let id = `${prefix}-${String(n).padStart(3, '0')}`;
  while (used.has(id)) id = `${prefix}-${String(++n).padStart(3, '0')}`;
  return id;
}

export const taskActions = {
  create(partial: Partial<CrmTask>): CrmTask {
    const used = new Set(state.tasks.map(t => t.id));
    const id = partial.id || nextId('T', used);
    const task: CrmTask = {
      id,
      title: partial.title || 'Untitled task',
      description: partial.description || '',
      status: partial.status || 'todo',
      priority: partial.priority || 'medium',
      category: partial.category || 'internal',
      assignee: partial.assignee || 'Unassigned',
      merchant: partial.merchant,
      merchantId: partial.merchantId,
      dealId: partial.dealId,
      dueDate: partial.dueDate || new Date().toISOString().slice(0, 10),
      createdDate: new Date().toISOString().slice(0, 10),
      createdBy: partial.createdBy || 'You',
      tags: partial.tags || [],
      overdue: false,
    };
    set({ tasks: [task, ...state.tasks] });
    return task;
  },
  update(id: string, patch: Partial<CrmTask>) {
    set({ tasks: state.tasks.map(t => (t.id === id ? { ...t, ...patch } : t)) });
  },
  setStatus(id: string, status: TaskStatus) {
    taskActions.update(id, { status });
  },
  toggleDone(id: string) {
    const t = state.tasks.find(x => x.id === id);
    if (!t) return;
    taskActions.update(id, { status: t.status === 'done' ? 'todo' : 'done' });
  },
  remove(id: string) {
    set({ tasks: state.tasks.filter(t => t.id !== id) });
  },
};

export const inboxActions = {
  compose(input: { merchant?: string; merchantId?: string; contact?: string; to: string; channel: 'email' | 'sms'; subject?: string; body: string; agent?: string }): InboxThread {
    const used = new Set(state.threads.map(t => t.id));
    const id = nextId('th', used);
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const msg: InboxMessage = {
      id: `m-${Date.now()}`,
      direction: 'outbound',
      channel: input.channel,
      from: input.agent || 'You',
      to: input.to,
      subject: input.subject,
      body: input.body,
      timestamp: ts,
    };
    const thread: InboxThread = {
      id,
      merchant: input.merchant || input.to,
      merchantId: input.merchantId || '—',
      contact: input.contact || input.to,
      contactEmail: input.channel === 'email' ? input.to : undefined,
      contactPhone: input.channel === 'sms' ? input.to : undefined,
      channel: input.channel,
      status: 'replied',
      starred: false,
      lastMessage: input.body,
      lastTimestamp: ts,
      messageCount: 1,
      agent: input.agent || 'You',
      messages: [msg],
    };
    set({ threads: [thread, ...state.threads] });
    return thread;
  },
  reply(threadId: string, body: string, agent?: string) {
    if (!body.trim()) return;
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 16);
    set({
      threads: state.threads.map(t => {
        if (t.id !== threadId) return t;
        const msg: InboxMessage = {
          id: `m-${Date.now()}`,
          direction: 'outbound',
          channel: t.channel === 'note' ? 'note' : t.channel,
          from: agent || 'You',
          to: t.contactEmail || t.contactPhone || t.contact,
          body,
          timestamp: ts,
        };
        return {
          ...t,
          status: 'replied' as InboxThreadStatus,
          messages: [...t.messages, msg],
          messageCount: t.messageCount + 1,
          lastMessage: body,
          lastTimestamp: ts,
        };
      }),
    });
  },
  toggleStar(id: string) {
    set({ threads: state.threads.map(t => (t.id === id ? { ...t, starred: !t.starred } : t)) });
  },
  setStatus(id: string, status: InboxThreadStatus) {
    set({ threads: state.threads.map(t => (t.id === id ? { ...t, status } : t)) });
  },
  archive(id: string) {
    inboxActions.setStatus(id, 'archived');
  },
  markRead(id: string) {
    set({ threads: state.threads.map(t => (t.id === id && t.status === 'unread' ? { ...t, status: 'read' } : t)) });
  },
  remove(id: string) {
    set({ threads: state.threads.filter(t => t.id !== id) });
  },
};

export const documentActions = {
  create(partial: Partial<CrmDocument>): CrmDocument {
    const used = new Set(state.documents.map(d => d.id));
    const id = partial.id || nextId('DOC', used);
    const doc: CrmDocument = {
      id,
      name: partial.name || 'Untitled Document',
      type: partial.type || 'mca_agreement',
      status: partial.status || 'draft',
      merchant: partial.merchant || 'Unassigned',
      merchantId: partial.merchantId || '—',
      dealId: partial.dealId,
      createdDate: new Date().toISOString().slice(0, 10),
      sentDate: partial.sentDate,
      signedDate: partial.signedDate,
      expiryDate: partial.expiryDate,
      signer: partial.signer,
      signerEmail: partial.signerEmail,
      agent: partial.agent || 'You',
      pages: partial.pages ?? 1,
      size: partial.size || '— KB',
      requiresNotarization: partial.requiresNotarization ?? false,
      envelopeId: partial.envelopeId,
    };
    set({ documents: [doc, ...state.documents] });
    return doc;
  },
  update(id: string, patch: Partial<CrmDocument>) {
    set({ documents: state.documents.map(d => (d.id === id ? { ...d, ...patch } : d)) });
  },
  send(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    const envelopeId = `ENV-${Math.floor(Math.random() * 9000) + 1000}`;
    documentActions.update(id, { status: 'sent', sentDate: today, envelopeId });
  },
  remove(id: string) {
    set({ documents: state.documents.filter(d => d.id !== id) });
  },
};

export const disputeActions = {
  uploadEvidence(disputeId: string, evidenceLabel: string) {
    const cur = state.disputeState.uploaded[disputeId] || [];
    if (cur.includes(evidenceLabel)) return;
    set({
      disputeState: {
        ...state.disputeState,
        uploaded: { ...state.disputeState.uploaded, [disputeId]: [...cur, evidenceLabel] },
      },
    });
  },
  removeEvidence(disputeId: string, evidenceLabel: string) {
    const cur = state.disputeState.uploaded[disputeId] || [];
    set({
      disputeState: {
        ...state.disputeState,
        uploaded: { ...state.disputeState.uploaded, [disputeId]: cur.filter(e => e !== evidenceLabel) },
      },
    });
  },
  submitForReview(disputeId: string) {
    set({
      disputeState: {
        ...state.disputeState,
        submitted: { ...state.disputeState.submitted, [disputeId]: true },
      },
    });
  },
};

export const complianceActions = {
  toggleCompleted(itemId: string) {
    const cur = state.complianceFlags.completed[itemId];
    set({
      complianceFlags: {
        ...state.complianceFlags,
        completed: { ...state.complianceFlags.completed, [itemId]: !cur },
      },
    });
  },
  setOverride(merchantId: string, controlKey: string, status: 'green' | 'yellow' | 'red' | 'gray') {
    set({
      complianceFlags: {
        ...state.complianceFlags,
        overrides: { ...state.complianceFlags.overrides, [`${merchantId}:${controlKey}`]: status },
      },
    });
  },
};
