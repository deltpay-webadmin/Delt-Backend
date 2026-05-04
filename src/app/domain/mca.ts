/**
 * MCA operations taxonomy.
 *
 * Covers the full lifecycle: Originate → Underwrite → Fund → Syndicate →
 * Collect → Report → Refer. Each stage is a typed status; transitions
 * are recorded on the deal's `statusHistory`.
 *
 * The pre-existing `Deal` / `UWApplication` types in crmStore.ts remain
 * the canonical record for the legacy UI. The shapes below extend them
 * with operations-grade fields that the new screens consume. Both layers
 * are deliberately compatible so the legacy pages keep working while new
 * surfaces opt in.
 */

import type { ActivityNote, AuditMeta, ImmutableEvent, StatusHistoryEntry } from './audit';

// ── Lifecycle stages ─────────────────────────────────────────────
export const MCA_LIFECYCLE_STAGES = [
  'origination',
  'underwriting',
  'funding',
  'servicing',
  'collections',
  'closed',
] as const;
export type McaLifecycleStage = (typeof MCA_LIFECYCLE_STAGES)[number];

export const ORIGINATION_STATUSES = [
  'lead',
  'application',
  'awaiting_docs',
  'submitted',
] as const;
export type OriginationStatus = (typeof ORIGINATION_STATUSES)[number];

export const UNDERWRITING_STATUSES = [
  'received',
  'doc_collection',
  'bank_review',
  'credit_analysis',
  'committee',
  'approved',
  'declined',
  'withdrawn',
] as const;
export type UnderwritingStatus = (typeof UNDERWRITING_STATUSES)[number];

export const FUNDING_STATUSES = [
  'pending_signature',
  'signed',
  'wire_queued',
  'wire_sent',
  'funded',
  'failed',
  'reversed',
] as const;
export type FundingStatus = (typeof FUNDING_STATUSES)[number];

export const SERVICING_STATUSES = [
  'current',
  'grace',
  'past_due',
  'restructured',
  'paid_off',
] as const;
export type ServicingStatus = (typeof SERVICING_STATUSES)[number];

export const COLLECTIONS_STATUSES = [
  'soft_outreach',
  'hard_outreach',
  'workout',
  'legal',
  'charged_off',
  'recovered',
] as const;
export type CollectionsStatus = (typeof COLLECTIONS_STATUSES)[number];

export const REFERRAL_STATUSES = [
  'pending',
  'contacted',
  'qualified',
  'converted',
  'expired',
] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

// ── Funding ──────────────────────────────────────────────────────
export interface FundingRecord extends AuditMeta {
  id: string;
  dealId: string;
  merchantId: string;
  amount: number;
  netDisbursed: number;
  fees: number;
  factorRate: number;
  paybackAmount: number;
  status: FundingStatus;
  wireRef?: string;
  signedContractUrl?: string;
  fundedAt?: string;
  statusHistory: StatusHistoryEntry<FundingStatus>[];
}

// ── Syndication ──────────────────────────────────────────────────
export interface Syndicator {
  id: string;
  name: string;
  contactEmail: string;
  defaultParticipationPct: number;
  managementFeeBps: number;
  totalCapitalCommitted: number;
  totalDeployed: number;
}

export interface SyndicationPosition extends AuditMeta {
  id: string;
  dealId: string;
  syndicatorId: string;
  participationPct: number; // 0–100
  capitalContributed: number;
  expectedReturn: number;
  collectedToDate: number;
  managementFeeBps: number;
  status: 'committed' | 'funded' | 'closed' | 'defaulted';
}

// ── Collections ──────────────────────────────────────────────────
export interface CollectionsCase extends AuditMeta {
  id: string;
  dealId: string;
  merchantId: string;
  status: CollectionsStatus;
  daysPastDue: number;
  outstandingBalance: number;
  recoveredAmount: number;
  assignedTo: string;
  nextActionDue: string | null;
  statusHistory: StatusHistoryEntry<CollectionsStatus>[];
  notes: ActivityNote[];
}

// ── Referrals (MCA partners / ISO submissions) ────────────────────
export interface ReferralPartner {
  id: string;
  name: string;
  partnerType: 'iso' | 'broker' | 'merchant' | 'agent';
  email: string;
  defaultCommissionPct: number;
  ytdSubmissions: number;
  ytdFunded: number;
  ytdPayouts: number;
}

export interface ReferralSubmission extends AuditMeta {
  id: string;
  partnerId: string;
  merchantName: string;
  requestedAmount: number;
  status: ReferralStatus;
  submittedAt: string;
  closedAt?: string;
  fundedAmount?: number;
  commissionPct: number;
  commissionAmount?: number;
}

// ── Aggregated KPI snapshot ──────────────────────────────────────
export interface McaPipelineKpis {
  pipelineCount: number;
  pipelineRequestedAmount: number;
  approvalRate: number;
  fundedMtd: number;
  fundedYtd: number;
  weightedAvgFactorRate: number;
  outstandingPrincipal: number;
  delinquencyRate: number;
  netChargedOff: number;
  syndicationDeployed: number;
}

// ── Mock data factory ────────────────────────────────────────────
export const MOCK_SYNDICATORS: Syndicator[] = [
  {
    id: 'syn-001',
    name: 'Halberd Capital Partners',
    contactEmail: 'ops@halberdcap.com',
    defaultParticipationPct: 50,
    managementFeeBps: 200,
    totalCapitalCommitted: 5_000_000,
    totalDeployed: 3_120_000,
  },
  {
    id: 'syn-002',
    name: 'Northpath Funding',
    contactEmail: 'syndication@northpath.com',
    defaultParticipationPct: 30,
    managementFeeBps: 150,
    totalCapitalCommitted: 2_500_000,
    totalDeployed: 1_650_000,
  },
  {
    id: 'syn-003',
    name: 'Delt Internal Book',
    contactEmail: 'finance@delt.com',
    defaultParticipationPct: 20,
    managementFeeBps: 0,
    totalCapitalCommitted: 10_000_000,
    totalDeployed: 6_440_000,
  },
];

export const MOCK_REFERRAL_PARTNERS: ReferralPartner[] = [
  {
    id: 'rp-001',
    name: 'Velocity ISO Group',
    partnerType: 'iso',
    email: 'submissions@velocityiso.com',
    defaultCommissionPct: 5,
    ytdSubmissions: 124,
    ytdFunded: 31,
    ytdPayouts: 184_500,
  },
  {
    id: 'rp-002',
    name: 'BridgeFund Brokers',
    partnerType: 'broker',
    email: 'deals@bridgefundbrokers.com',
    defaultCommissionPct: 4,
    ytdSubmissions: 78,
    ytdFunded: 22,
    ytdPayouts: 96_300,
  },
];

export const MOCK_FUNDING_RECORDS: FundingRecord[] = [
  {
    id: 'fund-001',
    dealId: 'D-2401',
    merchantId: 'M-1004',
    amount: 75_000,
    netDisbursed: 72_000,
    fees: 3_000,
    factorRate: 1.36,
    paybackAmount: 102_000,
    status: 'funded',
    wireRef: 'WIRE-78812',
    fundedAt: '2026-04-12T15:32:00Z',
    statusHistory: [
      { status: 'pending_signature', at: '2026-04-09T10:00:00Z', by: 'ops.maya' },
      { status: 'signed', at: '2026-04-10T13:11:00Z', by: 'merchant' },
      { status: 'wire_queued', at: '2026-04-12T09:00:00Z', by: 'ops.maya' },
      { status: 'wire_sent', at: '2026-04-12T14:45:00Z', by: 'ops.maya' },
      { status: 'funded', at: '2026-04-12T15:32:00Z', by: 'system.bank-confirm' },
    ],
    createdAt: '2026-04-09T10:00:00Z',
    createdBy: 'ops.maya',
    updatedAt: '2026-04-12T15:32:00Z',
    updatedBy: 'system.bank-confirm',
  },
];

export const MOCK_SYNDICATION_POSITIONS: SyndicationPosition[] = [
  {
    id: 'sp-001',
    dealId: 'D-2401',
    syndicatorId: 'syn-001',
    participationPct: 50,
    capitalContributed: 36_000,
    expectedReturn: 51_000,
    collectedToDate: 22_400,
    managementFeeBps: 200,
    status: 'funded',
    createdAt: '2026-04-12T15:32:00Z',
    createdBy: 'finance.lee',
    updatedAt: '2026-04-30T00:00:00Z',
    updatedBy: 'finance.lee',
  },
  {
    id: 'sp-002',
    dealId: 'D-2401',
    syndicatorId: 'syn-003',
    participationPct: 50,
    capitalContributed: 36_000,
    expectedReturn: 51_000,
    collectedToDate: 22_400,
    managementFeeBps: 0,
    status: 'funded',
    createdAt: '2026-04-12T15:32:00Z',
    createdBy: 'finance.lee',
    updatedAt: '2026-04-30T00:00:00Z',
    updatedBy: 'finance.lee',
  },
];

export const MOCK_COLLECTIONS_CASES: CollectionsCase[] = [
  {
    id: 'cc-001',
    dealId: 'D-2389',
    merchantId: 'M-0993',
    status: 'hard_outreach',
    daysPastDue: 14,
    outstandingBalance: 28_400,
    recoveredAmount: 6_100,
    assignedTo: 'collector.priya',
    nextActionDue: '2026-05-06T17:00:00Z',
    statusHistory: [
      { status: 'soft_outreach', at: '2026-04-22T09:00:00Z', by: 'collector.priya' },
      { status: 'hard_outreach', at: '2026-04-29T09:00:00Z', by: 'collector.priya' },
    ],
    notes: [
      { id: 'n1', body: 'Merchant promised partial payment Friday.', author: 'collector.priya', at: '2026-04-30T14:22:00Z' },
    ],
    createdAt: '2026-04-22T09:00:00Z',
    createdBy: 'system.servicing',
    updatedAt: '2026-04-30T14:22:00Z',
    updatedBy: 'collector.priya',
  },
];

export const MOCK_REFERRAL_SUBMISSIONS: ReferralSubmission[] = [
  {
    id: 'rs-001',
    partnerId: 'rp-001',
    merchantName: 'Sunrise Bakery LLC',
    requestedAmount: 80_000,
    status: 'qualified',
    submittedAt: '2026-04-28T11:00:00Z',
    commissionPct: 5,
    createdAt: '2026-04-28T11:00:00Z',
    createdBy: 'partner.velocity',
    updatedAt: '2026-04-29T10:00:00Z',
    updatedBy: 'uw.kelly',
  },
  {
    id: 'rs-002',
    partnerId: 'rp-002',
    merchantName: 'Coastline Auto Repair',
    requestedAmount: 45_000,
    status: 'converted',
    submittedAt: '2026-04-15T08:30:00Z',
    closedAt: '2026-04-25T16:00:00Z',
    fundedAmount: 40_000,
    commissionPct: 4,
    commissionAmount: 1_600,
    createdAt: '2026-04-15T08:30:00Z',
    createdBy: 'partner.bridgefund',
    updatedAt: '2026-04-25T16:00:00Z',
    updatedBy: 'finance.lee',
  },
];

export const MOCK_MCA_KPIS: McaPipelineKpis = {
  pipelineCount: 28,
  pipelineRequestedAmount: 1_840_000,
  approvalRate: 0.47,
  fundedMtd: 612_000,
  fundedYtd: 4_220_000,
  weightedAvgFactorRate: 1.34,
  outstandingPrincipal: 7_180_000,
  delinquencyRate: 0.061,
  netChargedOff: 184_000,
  syndicationDeployed: 3_120_000,
};

export type McaImmutableEvent = ImmutableEvent;
