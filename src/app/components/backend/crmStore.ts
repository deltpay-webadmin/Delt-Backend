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

export interface CrmState {
  leads: Lead[];
  onboarding: OnboardingApp[];
  underwriting: UWApplication[];
  referrals: Referral[];
  program: ReferralProgram;
  /** Client-side only — merchants & deals aren't persisted to Supabase yet. */
  merchants: Merchant[];
  deals: Deal[];
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
    const [leadsRes, onbRes, uwRes, refRes, progRes] = await Promise.all([
      supabase.from('leads').select('*').order('id', { ascending: true }),
      supabase.from('onboarding_apps').select('*').order('id', { ascending: true }),
      supabase.from('underwriting_apps').select('*').order('id', { ascending: true }),
      supabase.from('referrals').select('*').order('id', { ascending: true }),
      supabase.from('referral_program').select('*').eq('id', 1).maybeSingle(),
    ]);

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
