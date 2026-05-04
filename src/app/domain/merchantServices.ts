/**
 * Merchant Services taxonomy.
 *
 * Covers residuals, agent payouts, chargeback management, terminal
 * parameters, and analytics primitives. The shapes are intentionally
 * persistence-ready: every record has audit metadata and any operator
 * action lands as a `StatusHistoryEntry` or change-log entry.
 */

import type { ActivityNote, AuditMeta, StatusHistoryEntry } from './audit';

// ── Residuals & payouts ──────────────────────────────────────────
export const PAYOUT_RUN_STATUSES = [
  'draft',
  'in_review',
  'approved',
  'processing',
  'paid',
  'on_hold',
  'failed',
] as const;
export type PayoutRunStatus = (typeof PAYOUT_RUN_STATUSES)[number];

export interface ResidualLineItem {
  merchantId: string;
  merchantName: string;
  processingVolume: number;
  interchangeCost: number;
  netRevenue: number;
  splitPct: number;
  agentEarnings: number;
}

export interface AgentPayout extends AuditMeta {
  id: string;
  agentId: string;
  agentName: string;
  periodMonth: string; // YYYY-MM
  grossEarnings: number;
  adjustments: number;
  netPayout: number;
  status: PayoutRunStatus;
  paidAt?: string;
  paymentRef?: string;
  lineItems: ResidualLineItem[];
  statusHistory: StatusHistoryEntry<PayoutRunStatus>[];
}

export interface PayoutRun extends AuditMeta {
  id: string;
  periodMonth: string;
  totalAgents: number;
  totalGross: number;
  totalNet: number;
  status: PayoutRunStatus;
  approvedBy?: string;
  approvedAt?: string;
  notes: ActivityNote[];
  statusHistory: StatusHistoryEntry<PayoutRunStatus>[];
}

// ── Chargebacks ──────────────────────────────────────────────────
export const CHARGEBACK_STATUSES = [
  'received',
  'evidence_pending',
  'evidence_submitted',
  'representment',
  'won',
  'lost',
  'accepted',
] as const;
export type ChargebackStatus = (typeof CHARGEBACK_STATUSES)[number];

export interface ChargebackCase extends AuditMeta {
  id: string;
  caseNumber: string;
  merchantId: string;
  merchantName: string;
  cardNetwork: 'visa' | 'mastercard' | 'amex' | 'discover';
  reasonCode: string;
  reasonDescription: string;
  amount: number;
  transactionDate: string;
  receivedDate: string;
  responseDeadline: string;
  status: ChargebackStatus;
  assignedTo: string;
  evidenceFiles: string[];
  notes: ActivityNote[];
  statusHistory: StatusHistoryEntry<ChargebackStatus>[];
}

// ── Terminals & parameters ──────────────────────────────────────
export const TERMINAL_STATUSES = [
  'provisioned',
  'shipped',
  'active',
  'inactive',
  'rma',
  'lost',
] as const;
export type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

export interface TerminalParameter {
  key: string;
  label: string;
  value: string;
  category: 'processing' | 'security' | 'tipping' | 'receipt' | 'connectivity';
  editable: boolean;
}

export interface TerminalParameterChange extends AuditMeta {
  id: string;
  terminalId: string;
  parameterKey: string;
  oldValue: string;
  newValue: string;
  reason?: string;
}

export interface Terminal extends AuditMeta {
  id: string;
  serialNumber: string;
  model: string;
  merchantId: string;
  merchantName: string;
  status: TerminalStatus;
  lastSeenAt?: string;
  firmwareVersion: string;
  parameters: TerminalParameter[];
  changeHistory: TerminalParameterChange[];
}

// ── Aggregated KPI snapshot ──────────────────────────────────────
export interface MerchantServicesKpis {
  activeMerchants: number;
  monthlyProcessingVolume: number;
  residualsTtm: number;
  pendingPayoutTotal: number;
  chargebackCount30d: number;
  chargebackRate: number; // 0–1
  chargebackWonRate: number; // 0–1
  activeTerminals: number;
  parameterChanges7d: number;
}

// ── Mock data factories ─────────────────────────────────────────
export const MOCK_PAYOUT_RUNS: PayoutRun[] = [
  {
    id: 'pr-2026-04',
    periodMonth: '2026-04',
    totalAgents: 18,
    totalGross: 184_220,
    totalNet: 178_410,
    status: 'approved',
    approvedBy: 'finance.lee',
    approvedAt: '2026-05-02T18:00:00Z',
    notes: [],
    statusHistory: [
      { status: 'draft', at: '2026-05-01T09:00:00Z', by: 'finance.lee' },
      { status: 'in_review', at: '2026-05-02T10:00:00Z', by: 'finance.lee' },
      { status: 'approved', at: '2026-05-02T18:00:00Z', by: 'cfo.jane' },
    ],
    createdAt: '2026-05-01T09:00:00Z',
    createdBy: 'finance.lee',
    updatedAt: '2026-05-02T18:00:00Z',
    updatedBy: 'cfo.jane',
  },
  {
    id: 'pr-2026-03',
    periodMonth: '2026-03',
    totalAgents: 17,
    totalGross: 162_080,
    totalNet: 156_790,
    status: 'paid',
    approvedBy: 'cfo.jane',
    approvedAt: '2026-04-02T18:00:00Z',
    notes: [],
    statusHistory: [
      { status: 'draft', at: '2026-04-01T09:00:00Z', by: 'finance.lee' },
      { status: 'approved', at: '2026-04-02T18:00:00Z', by: 'cfo.jane' },
      { status: 'paid', at: '2026-04-04T08:30:00Z', by: 'system.ach' },
    ],
    createdAt: '2026-04-01T09:00:00Z',
    createdBy: 'finance.lee',
    updatedAt: '2026-04-04T08:30:00Z',
    updatedBy: 'system.ach',
  },
];

export const MOCK_AGENT_PAYOUTS: AgentPayout[] = [
  {
    id: 'ap-001',
    agentId: 'A-001',
    agentName: 'Marcus Johnson',
    periodMonth: '2026-04',
    grossEarnings: 18_440,
    adjustments: -120,
    netPayout: 18_320,
    status: 'approved',
    lineItems: [
      { merchantId: 'M-1001', merchantName: 'Riverside Diner', processingVolume: 184_000, interchangeCost: 4_120, netRevenue: 2_310, splitPct: 50, agentEarnings: 1_155 },
      { merchantId: 'M-1004', merchantName: 'Sunrise Bakery', processingVolume: 92_000, interchangeCost: 2_010, netRevenue: 1_380, splitPct: 50, agentEarnings: 690 },
    ],
    statusHistory: [
      { status: 'draft', at: '2026-05-01T09:00:00Z', by: 'finance.lee' },
      { status: 'approved', at: '2026-05-02T18:00:00Z', by: 'cfo.jane' },
    ],
    createdAt: '2026-05-01T09:00:00Z',
    createdBy: 'finance.lee',
    updatedAt: '2026-05-02T18:00:00Z',
    updatedBy: 'cfo.jane',
  },
];

export const MOCK_CHARGEBACK_CASES: ChargebackCase[] = [
  {
    id: 'cb-001',
    caseNumber: 'CB-78812',
    merchantId: 'M-1001',
    merchantName: 'Riverside Diner',
    cardNetwork: 'visa',
    reasonCode: '13.1',
    reasonDescription: 'Merchandise/Services Not Received',
    amount: 248.50,
    transactionDate: '2026-04-12',
    receivedDate: '2026-04-26',
    responseDeadline: '2026-05-10',
    status: 'evidence_pending',
    assignedTo: 'ops.maya',
    evidenceFiles: [],
    notes: [
      { id: 'n1', body: 'Requested receipt + delivery confirmation from merchant.', author: 'ops.maya', at: '2026-04-26T15:00:00Z' },
    ],
    statusHistory: [
      { status: 'received', at: '2026-04-26T08:00:00Z', by: 'system.processor' },
      { status: 'evidence_pending', at: '2026-04-26T15:00:00Z', by: 'ops.maya' },
    ],
    createdAt: '2026-04-26T08:00:00Z',
    createdBy: 'system.processor',
    updatedAt: '2026-04-26T15:00:00Z',
    updatedBy: 'ops.maya',
  },
];

const STANDARD_TERMINAL_PARAMETERS: TerminalParameter[] = [
  { key: 'tip_enabled', label: 'Tip prompt enabled', value: 'true', category: 'tipping', editable: true },
  { key: 'tip_presets', label: 'Tip presets (%)', value: '15,18,20', category: 'tipping', editable: true },
  { key: 'receipt_email', label: 'Email receipt', value: 'optional', category: 'receipt', editable: true },
  { key: 'receipt_print', label: 'Auto-print receipt', value: 'true', category: 'receipt', editable: true },
  { key: 'pin_required', label: 'PIN required for debit', value: 'true', category: 'security', editable: false },
  { key: 'cvm_limit', label: 'CVM no-signature limit', value: '50.00', category: 'security', editable: true },
  { key: 'connection_mode', label: 'Connection mode', value: 'wifi', category: 'connectivity', editable: true },
  { key: 'mcc', label: 'MCC', value: '5812', category: 'processing', editable: false },
  { key: 'aba_routing', label: 'ABA routing', value: '****1234', category: 'processing', editable: false },
];

export const MOCK_TERMINALS: Terminal[] = [
  {
    id: 't-001',
    serialNumber: 'PAX-A920-78812',
    model: 'PAX A920 Pro',
    merchantId: 'M-1001',
    merchantName: 'Riverside Diner',
    status: 'active',
    lastSeenAt: '2026-05-04T14:32:00Z',
    firmwareVersion: '4.2.18',
    parameters: STANDARD_TERMINAL_PARAMETERS,
    changeHistory: [
      {
        id: 'tpc-1',
        terminalId: 't-001',
        parameterKey: 'tip_presets',
        oldValue: '10,15,20',
        newValue: '15,18,20',
        reason: 'Owner requested higher floor',
        createdAt: '2026-03-04T09:11:00Z',
        createdBy: 'agent.marcus',
        updatedAt: '2026-03-04T09:11:00Z',
        updatedBy: 'agent.marcus',
      },
    ],
    createdAt: '2025-11-04T00:00:00Z',
    createdBy: 'ops.maya',
    updatedAt: '2026-03-04T09:11:00Z',
    updatedBy: 'agent.marcus',
  },
  {
    id: 't-002',
    serialNumber: 'CLO-MINI-44102',
    model: 'Clover Mini',
    merchantId: 'M-1004',
    merchantName: 'Sunrise Bakery',
    status: 'active',
    lastSeenAt: '2026-05-04T13:18:00Z',
    firmwareVersion: '5.1.2',
    parameters: STANDARD_TERMINAL_PARAMETERS,
    changeHistory: [],
    createdAt: '2026-01-15T00:00:00Z',
    createdBy: 'ops.maya',
    updatedAt: '2026-01-15T00:00:00Z',
    updatedBy: 'ops.maya',
  },
];

export const MOCK_MERCHANT_SERVICES_KPIS: MerchantServicesKpis = {
  activeMerchants: 312,
  monthlyProcessingVolume: 14_820_000,
  residualsTtm: 1_984_000,
  pendingPayoutTotal: 178_410,
  chargebackCount30d: 41,
  chargebackRate: 0.0028,
  chargebackWonRate: 0.62,
  activeTerminals: 408,
  parameterChanges7d: 12,
};
