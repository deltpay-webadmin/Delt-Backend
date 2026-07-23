import React, { useState, useMemo } from 'react';
import {
  Shield, AlertTriangle, Clock, CheckCircle, XCircle, ChevronRight,
  Search, Filter, ArrowUpRight, ArrowDownRight, DollarSign, FileText,
  Upload, GripVertical, Eye, Send, BarChart3, TrendingUp, TrendingDown,
  AlertCircle, Bell, Calculator, ExternalLink, Plus, RefreshCw,
  ChevronDown, X, Paperclip, MessageSquare, User, Calendar,
  Zap, Activity,
} from 'lucide-react';

// ══════════════════════════════════════
// TYPES & DATA
// ══════════════════════════════════════

type DisputeStage = 'new' | 'evidence' | 'draft' | 'review' | 'submitted' | 'awaiting' | 'won' | 'lost';
type Urgency = 'critical' | 'urgent' | 'normal';

interface Dispute {
  id: string;
  merchant: string;
  merchantId: string;
  vertical: string;
  cardNetwork: string;
  reasonCode: string;
  reasonLabel: string;
  reasonCategory: 'fraud' | 'service' | 'authorization' | 'processing';
  amount: number;
  transactionDate: string;
  disputeDate: string;
  responseDeadline: string;
  daysLeft: number;
  stage: DisputeStage;
  handler: string;
  cardLast4: string;
  arnNumber: string;
  evidenceTypes: string[];
  evidenceCollected: string[];
  notes: { author: string; text: string; date: string }[];
  outcome?: 'won' | 'lost';
  stageTimestamps: Partial<Record<DisputeStage, string>>;
}

interface PreChargebackAlert {
  id: string;
  merchant: string;
  source: 'Verifi CDRN' | 'Ethoca';
  amount: number;
  cardLast4: string;
  alertDate: string;
  expiresIn: number;
  transactionDate: string;
  status: 'pending' | 'refunded' | 'expired';
  descriptor: string;
}

const DISPUTES: Dispute[] = [
  {
    id: 'DSP-2026-001', merchant: 'Havana Bites Cafe', merchantId: 'MID-001', vertical: 'Restaurant',
    cardNetwork: 'Visa', reasonCode: '10.4', reasonLabel: 'Other Fraud — Card-Absent Environment',
    reasonCategory: 'fraud', amount: 487.50, transactionDate: '2026-03-28', disputeDate: '2026-04-10',
    responseDeadline: '2026-04-17', daysLeft: 1, stage: 'evidence', handler: 'Sarah M.',
    cardLast4: '4821', arnNumber: '74929403850008741234567',
    evidenceTypes: ['AVS/CVV match', 'IP geolocation', 'Device fingerprint', '3D Secure proof'],
    evidenceCollected: ['AVS/CVV match', 'IP geolocation'],
    notes: [
      { author: 'Sarah M.', text: 'Customer claims card was stolen. Transaction shows 3DS authentication passed.', date: '2026-04-11' },
      { author: 'System', text: 'AVS match confirmed: full match. CVV2 match: yes.', date: '2026-04-11' },
    ],
    stageTimestamps: { new: '2026-04-10', evidence: '2026-04-11' },
  },
  {
    id: 'DSP-2026-002', merchant: 'Coral Reef Auto Spa', merchantId: 'MID-002', vertical: 'Auto Services',
    cardNetwork: 'Visa', reasonCode: '13.1', reasonLabel: 'Merchandise / Services Not Received',
    reasonCategory: 'service', amount: 325.00, transactionDate: '2026-03-15', disputeDate: '2026-04-08',
    responseDeadline: '2026-04-18', daysLeft: 2, stage: 'draft', handler: 'Sarah M.',
    cardLast4: '7392', arnNumber: '74929403850009182345678',
    evidenceTypes: ['Delivery confirmation', 'Service completion record', 'Signed receipt', 'Communication logs'],
    evidenceCollected: ['Service completion record', 'Signed receipt', 'Communication logs'],
    notes: [
      { author: 'Sarah M.', text: 'Service was completed on-site. Have signed work order + before/after photos.', date: '2026-04-09' },
    ],
    stageTimestamps: { new: '2026-04-08', evidence: '2026-04-09', draft: '2026-04-12' },
  },
  {
    id: 'DSP-2026-003', merchant: 'SoBe Cycle & Fitness', merchantId: 'MID-004', vertical: 'Health & Fitness',
    cardNetwork: 'Mastercard', reasonCode: '4853', reasonLabel: 'Cardholder Dispute — Not as Described',
    reasonCategory: 'service', amount: 199.00, transactionDate: '2026-03-20', disputeDate: '2026-04-05',
    responseDeadline: '2026-04-20', daysLeft: 4, stage: 'review', handler: 'John D.',
    cardLast4: '5511', arnNumber: '53429403850007291234567',
    evidenceTypes: ['Terms of service', 'Refund policy acknowledgment', 'Service description', 'Communication logs'],
    evidenceCollected: ['Terms of service', 'Refund policy acknowledgment', 'Service description', 'Communication logs'],
    notes: [
      { author: 'John D.', text: 'Membership dispute. TOS clearly states cancellation policy. Have signed agreement.', date: '2026-04-06' },
      { author: 'Sarah M.', text: 'Reviewed draft — strong case. Ready to submit.', date: '2026-04-13' },
    ],
    stageTimestamps: { new: '2026-04-05', evidence: '2026-04-06', draft: '2026-04-10', review: '2026-04-13' },
  },
  {
    id: 'DSP-2026-004', merchant: 'Doral Fresh Market', merchantId: 'MID-006', vertical: 'Grocery',
    cardNetwork: 'Visa', reasonCode: '10.4', reasonLabel: 'Other Fraud — Card-Absent Environment',
    reasonCategory: 'fraud', amount: 892.30, transactionDate: '2026-03-22', disputeDate: '2026-04-02',
    responseDeadline: '2026-04-25', daysLeft: 9, stage: 'submitted', handler: 'Sarah M.',
    cardLast4: '3345', arnNumber: '74929403850011928345678',
    evidenceTypes: ['AVS/CVV match', 'Delivery confirmation', 'Device fingerprint'],
    evidenceCollected: ['AVS/CVV match', 'Delivery confirmation', 'Device fingerprint'],
    notes: [
      { author: 'Sarah M.', text: 'Submitted with full evidence package. Delivery confirmed with signature.', date: '2026-04-08' },
    ],
    stageTimestamps: { new: '2026-04-02', evidence: '2026-04-03', draft: '2026-04-05', review: '2026-04-07', submitted: '2026-04-08' },
  },
  {
    id: 'DSP-2026-005', merchant: 'Midtown Taqueria', merchantId: 'FDM-001', vertical: 'Restaurant',
    cardNetwork: 'Visa', reasonCode: '13.3', reasonLabel: 'Not as Described or Defective Merchandise',
    reasonCategory: 'service', amount: 156.80, transactionDate: '2026-02-18', disputeDate: '2026-03-10',
    responseDeadline: '2026-04-10', daysLeft: -6, stage: 'won', handler: 'John D.',
    cardLast4: '8102', arnNumber: '74929403850005612345678', outcome: 'won',
    evidenceTypes: ['Delivery confirmation', 'Communication logs', 'Refund policy acknowledgment'],
    evidenceCollected: ['Delivery confirmation', 'Communication logs', 'Refund policy acknowledgment'],
    notes: [
      { author: 'System', text: 'Dispute resolved in merchant favor. Funds returned.', date: '2026-04-08' },
    ],
    stageTimestamps: { new: '2026-03-10', evidence: '2026-03-11', draft: '2026-03-14', review: '2026-03-15', submitted: '2026-03-16', awaiting: '2026-03-16', won: '2026-04-08' },
  },
  {
    id: 'DSP-2026-006', merchant: 'Kendall Pet Grooming', merchantId: 'FDM-002', vertical: 'Personal Services',
    cardNetwork: 'Mastercard', reasonCode: '4837', reasonLabel: 'No Cardholder Authorization',
    reasonCategory: 'authorization', amount: 275.00, transactionDate: '2026-02-25', disputeDate: '2026-03-15',
    responseDeadline: '2026-04-15', daysLeft: -1, stage: 'won', handler: 'Sarah M.',
    cardLast4: '6290', arnNumber: '53429403850003781234567', outcome: 'won',
    evidenceTypes: ['Signed receipt', 'AVS/CVV match', 'Communication logs'],
    evidenceCollected: ['Signed receipt', 'AVS/CVV match', 'Communication logs'],
    notes: [
      { author: 'System', text: 'Won — signed receipt proved authorization.', date: '2026-04-12' },
    ],
    stageTimestamps: { new: '2026-03-15', evidence: '2026-03-16', draft: '2026-03-18', review: '2026-03-19', submitted: '2026-03-20', awaiting: '2026-03-20', won: '2026-04-12' },
  },
  {
    id: 'DSP-2026-007', merchant: 'Aventura Nail Lounge', merchantId: 'FDM-003', vertical: 'Personal Services',
    cardNetwork: 'Visa', reasonCode: '13.1', reasonLabel: 'Merchandise / Services Not Received',
    reasonCategory: 'service', amount: 420.00, transactionDate: '2026-02-10', disputeDate: '2026-03-05',
    responseDeadline: '2026-04-05', daysLeft: -11, stage: 'lost', handler: 'John D.',
    cardLast4: '1158', arnNumber: '74929403850006793456789', outcome: 'lost',
    evidenceTypes: ['Delivery confirmation', 'Service completion record'],
    evidenceCollected: ['Service completion record'],
    notes: [
      { author: 'System', text: 'Lost — insufficient delivery proof. Missing signed confirmation.', date: '2026-04-02' },
    ],
    stageTimestamps: { new: '2026-03-05', evidence: '2026-03-06', draft: '2026-03-10', review: '2026-03-11', submitted: '2026-03-12', awaiting: '2026-03-12', lost: '2026-04-02' },
  },
  {
    id: 'DSP-2026-008', merchant: 'Hialeah Tire & Brake', merchantId: 'FDM-004', vertical: 'Auto Services',
    cardNetwork: 'Visa', reasonCode: '10.4', reasonLabel: 'Other Fraud — Card-Absent Environment',
    reasonCategory: 'fraud', amount: 1250.00, transactionDate: '2026-03-05', disputeDate: '2026-03-25',
    responseDeadline: '2026-04-28', daysLeft: 12, stage: 'awaiting', handler: 'Sarah M.',
    cardLast4: '9473', arnNumber: '74929403850012039456789',
    evidenceTypes: ['AVS/CVV match', 'IP geolocation', 'Device fingerprint', '3D Secure proof'],
    evidenceCollected: ['AVS/CVV match', 'IP geolocation', 'Device fingerprint', '3D Secure proof'],
    notes: [
      { author: 'Sarah M.', text: 'Strong case — full 3DS authentication + matching device fingerprint from prior purchases.', date: '2026-04-01' },
    ],
    stageTimestamps: { new: '2026-03-25', evidence: '2026-03-26', draft: '2026-03-28', review: '2026-03-30', submitted: '2026-04-01', awaiting: '2026-04-01' },
  },
  {
    id: 'DSP-2026-009', merchant: 'Palmetto Bay Bakery', merchantId: 'FDM-005', vertical: 'Restaurant',
    cardNetwork: 'Mastercard', reasonCode: '4834', reasonLabel: 'Point-of-Interaction Error',
    reasonCategory: 'processing', amount: 67.50, transactionDate: '2026-04-01', disputeDate: '2026-04-12',
    responseDeadline: '2026-04-19', daysLeft: 3, stage: 'new', handler: 'Unassigned',
    cardLast4: '2087', arnNumber: '53429403850004892345678',
    evidenceTypes: ['Terminal transaction log', 'Batch settlement record', 'Signed receipt'],
    evidenceCollected: [],
    notes: [],
    stageTimestamps: { new: '2026-04-12' },
  },
  {
    id: 'DSP-2026-010', merchant: 'Little Havana Barbershop', merchantId: 'MID-005', vertical: 'Personal Services',
    cardNetwork: 'Visa', reasonCode: '13.6', reasonLabel: 'Credit Not Processed',
    reasonCategory: 'service', amount: 85.00, transactionDate: '2026-03-10', disputeDate: '2026-04-14',
    responseDeadline: '2026-04-22', daysLeft: 6, stage: 'new', handler: 'Unassigned',
    cardLast4: '5543', arnNumber: '74929403850013140567890',
    evidenceTypes: ['Refund policy acknowledgment', 'Communication logs', 'Terms of service'],
    evidenceCollected: [],
    notes: [],
    stageTimestamps: { new: '2026-04-14' },
  },
  {
    id: 'DSP-2026-011', merchant: 'Wynwood Ink Studio', merchantId: 'MID-003', vertical: 'Retail',
    cardNetwork: 'Visa', reasonCode: '10.4', reasonLabel: 'Other Fraud — Card-Absent Environment',
    reasonCategory: 'fraud', amount: 345.00, transactionDate: '2026-01-20', disputeDate: '2026-02-15',
    responseDeadline: '2026-03-18', daysLeft: -29, stage: 'won', handler: 'Sarah M.',
    cardLast4: '7721', arnNumber: '74929403850002501234567', outcome: 'won',
    evidenceTypes: ['AVS/CVV match', '3D Secure proof', 'IP geolocation'],
    evidenceCollected: ['AVS/CVV match', '3D Secure proof', 'IP geolocation'],
    notes: [{ author: 'System', text: 'Won — compelling 3DS evidence.', date: '2026-03-15' }],
    stageTimestamps: { new: '2026-02-15', evidence: '2026-02-16', draft: '2026-02-18', review: '2026-02-19', submitted: '2026-02-20', awaiting: '2026-02-20', won: '2026-03-15' },
  },
  {
    id: 'DSP-2026-012', merchant: 'Brickell Dry Cleaners', merchantId: 'MID-007', vertical: 'Services',
    cardNetwork: 'Mastercard', reasonCode: '4853', reasonLabel: 'Cardholder Dispute — Not as Described',
    reasonCategory: 'service', amount: 128.00, transactionDate: '2026-01-15', disputeDate: '2026-02-10',
    responseDeadline: '2026-03-12', daysLeft: -35, stage: 'lost', handler: 'John D.',
    cardLast4: '3389', arnNumber: '53429403850001392345678', outcome: 'lost',
    evidenceTypes: ['Terms of service', 'Communication logs'],
    evidenceCollected: ['Terms of service'],
    notes: [{ author: 'System', text: 'Lost — no communication logs provided. Weak evidence.', date: '2026-03-10' }],
    stageTimestamps: { new: '2026-02-10', evidence: '2026-02-11', draft: '2026-02-14', review: '2026-02-15', submitted: '2026-02-16', awaiting: '2026-02-16', lost: '2026-03-10' },
  },
];

const PRE_ALERTS: PreChargebackAlert[] = [
  { id: 'PCA-001', merchant: 'Havana Bites Cafe', source: 'Verifi CDRN', amount: 142.50, cardLast4: '4821', alertDate: '2026-04-15', expiresIn: 48, transactionDate: '2026-04-01', status: 'pending', descriptor: 'HAVANA BITES*ONLINE' },
  { id: 'PCA-002', merchant: 'Coral Reef Auto Spa', source: 'Ethoca', amount: 289.00, cardLast4: '7392', alertDate: '2026-04-14', expiresIn: 24, transactionDate: '2026-03-30', status: 'pending', descriptor: 'CORAL REEF AUTO*SPA' },
  { id: 'PCA-003', merchant: 'Doral Fresh Market', source: 'Verifi CDRN', amount: 67.80, cardLast4: '9918', alertDate: '2026-04-13', expiresIn: 0, transactionDate: '2026-03-25', status: 'refunded', descriptor: 'DORAL FRESH*MARKET' },
  { id: 'PCA-004', merchant: 'SoBe Cycle & Fitness', source: 'Ethoca', amount: 199.00, cardLast4: '5511', alertDate: '2026-04-12', expiresIn: 0, transactionDate: '2026-03-15', status: 'expired', descriptor: 'SOBE CYCLE*FIT' },
];

// ── Reason code database ──
const REASON_CODES: Record<string, { category: string; network: string; description: string; requiredEvidence: string[]; strategy: string; winRate: number }> = {
  '10.4': { category: 'Fraud', network: 'Visa', description: 'Other Fraud — Card-Absent Environment', requiredEvidence: ['AVS/CVV match proof', 'IP geolocation data', 'Device fingerprint records', '3D Secure authentication log', 'Prior transaction history from same device'], strategy: 'Demonstrate cardholder authentication via 3DS. Show AVS/CVV match. Present device fingerprint matching prior legitimate purchases. If EMV 3DS 2.0 was used, liability shift applies.', winRate: 0.62 },
  '13.1': { category: 'Consumer Disputes', network: 'Visa', description: 'Merchandise / Services Not Received', requiredEvidence: ['Delivery confirmation with signature', 'Tracking number with carrier confirmation', 'Service completion photographs', 'Signed work order or receipt', 'Communication logs showing delivery arrangements'], strategy: 'Provide irrefutable proof of delivery: carrier tracking + signature. For services, show signed completion form with date/time stamp. Include any post-delivery communication from cardholder.', winRate: 0.71 },
  '13.3': { category: 'Consumer Disputes', network: 'Visa', description: 'Not as Described or Defective Merchandise', requiredEvidence: ['Product/service description as advertised', 'Terms of service agreement', 'Refund policy acknowledgment (signed)', 'Communication logs', 'Photographs of delivered goods'], strategy: 'Show the product/service matched the description. Present signed TOS acknowledging the refund/return policy. Include all communication showing merchant attempted resolution.', winRate: 0.48 },
  '13.6': { category: 'Consumer Disputes', network: 'Visa', description: 'Credit Not Processed', requiredEvidence: ['Refund policy acknowledgment', 'Communication logs showing no refund was owed', 'Terms of service', 'Proof services were rendered in full'], strategy: 'Prove no refund was warranted: either no return was made, the return window expired, or services were fully rendered. Show signed refund policy and any communication.', winRate: 0.55 },
  '4837': { category: 'Authorization', network: 'Mastercard', description: 'No Cardholder Authorization', requiredEvidence: ['Signed sales receipt', 'AVS/CVV match confirmation', 'Communication logs with cardholder', 'Terminal transaction log'], strategy: 'Present signed receipt or proof of cardholder presence. For card-not-present, show AVS/CVV match and any authentication (3DS). Prior purchase history from same card strengthens case.', winRate: 0.58 },
  '4853': { category: 'Cardholder Disputes', network: 'Mastercard', description: 'Cardholder Dispute — Not as Described', requiredEvidence: ['Terms of service signed by cardholder', 'Service description matching delivery', 'Communication logs', 'Refund policy acknowledgment'], strategy: 'Similar to Visa 13.3. Demonstrate service/product matched description. Show signed agreement and all attempts at resolution. Merchant goodwill efforts strengthen case.', winRate: 0.44 },
  '4834': { category: 'Processing Errors', network: 'Mastercard', description: 'Point-of-Interaction Error', requiredEvidence: ['Terminal transaction log', 'Batch settlement record', 'Signed receipt', 'Proof of correct amount charged'], strategy: 'Provide terminal transaction log showing correct processing. Include batch settlement proof and signed receipt matching the charged amount. Show no duplicate existed.', winRate: 0.73 },
};

// ── Helpers ──
const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n);
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtDateFull = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const urgencyOf = (d: Dispute): Urgency => d.daysLeft <= 3 ? 'critical' : d.daysLeft <= 7 ? 'urgent' : 'normal';
const urgencyColor: Record<Urgency, { bg: string; text: string; dot: string; border: string }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
  urgent: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  normal: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
};

const stageConfig: Record<DisputeStage, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-blue-700', bg: 'bg-blue-50' },
  evidence: { label: 'Evidence Collection', color: 'text-amber-700', bg: 'bg-amber-50' },
  draft: { label: 'Draft Response', color: 'text-orange-700', bg: 'bg-orange-50' },
  review: { label: 'Review', color: 'text-purple-700', bg: 'bg-purple-50' },
  submitted: { label: 'Submitted', color: 'text-brand', bg: 'bg-brand-50' },
  awaiting: { label: 'Awaiting Decision', color: 'text-gray-700', bg: 'bg-gray-100' },
  won: { label: 'Won', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  lost: { label: 'Lost', color: 'text-red-700', bg: 'bg-red-50' },
};

const STAGE_ORDER: DisputeStage[] = ['new', 'evidence', 'draft', 'review', 'submitted', 'awaiting', 'won'];

const categoryColors: Record<string, { bg: string; text: string }> = {
  fraud: { bg: 'bg-red-50', text: 'text-red-700' },
  service: { bg: 'bg-blue-50', text: 'text-blue-700' },
  authorization: { bg: 'bg-purple-50', text: 'text-purple-700' },
  processing: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════
export function BackendDisputes() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'workflow' | 'analytics' | 'alerts' | 'codes' | 'costcalc'>('inbox');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [evidenceModal, setEvidenceModal] = useState<string | null>(null);
  const [costCalcId, setCostCalcId] = useState<string | null>(null);

  // ── Active (non-resolved) disputes sorted by urgency ──
  const activeDisputes = useMemo(() =>
    DISPUTES.filter(d => d.stage !== 'won' && d.stage !== 'lost')
      .sort((a, b) => a.daysLeft - b.daysLeft),
  []);

  const filtered = useMemo(() => {
    let list = DISPUTES;
    if (stageFilter !== 'all') list = list.filter(d => d.stage === stageFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d => d.merchant.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.reasonCode.includes(q));
    }
    return list;
  }, [stageFilter, search]);

  // ── Analytics calculations ──
  const analytics = useMemo(() => {
    const resolved = DISPUTES.filter(d => d.stage === 'won' || d.stage === 'lost');
    const won = resolved.filter(d => d.outcome === 'won');
    const lost = resolved.filter(d => d.outcome === 'lost');
    const totalAmount = DISPUTES.reduce((s, d) => s + d.amount, 0);
    const recoveredAmount = won.reduce((s, d) => s + d.amount, 0);
    const lostAmount = lost.reduce((s, d) => s + d.amount, 0);
    const winRate = resolved.length > 0 ? won.length / resolved.length : 0;
    const pendingAmount = DISPUTES.filter(d => d.stage !== 'won' && d.stage !== 'lost').reduce((s, d) => s + d.amount, 0);

    // Win rate by reason code
    const byReasonCode: Record<string, { wins: number; total: number; code: string; label: string }> = {};
    resolved.forEach(d => {
      if (!byReasonCode[d.reasonCode]) byReasonCode[d.reasonCode] = { wins: 0, total: 0, code: d.reasonCode, label: d.reasonLabel };
      byReasonCode[d.reasonCode].total++;
      if (d.outcome === 'won') byReasonCode[d.reasonCode].wins++;
    });

    // Win rate by vertical
    const byVertical: Record<string, { wins: number; total: number }> = {};
    resolved.forEach(d => {
      if (!byVertical[d.vertical]) byVertical[d.vertical] = { wins: 0, total: 0 };
      byVertical[d.vertical].total++;
      if (d.outcome === 'won') byVertical[d.vertical].wins++;
    });

    // Win rate by evidence type
    const byEvidence: Record<string, { wins: number; total: number }> = {};
    resolved.forEach(d => {
      d.evidenceCollected.forEach(e => {
        if (!byEvidence[e]) byEvidence[e] = { wins: 0, total: 0 };
        byEvidence[e].total++;
        if (d.outcome === 'won') byEvidence[e].wins++;
      });
    });

    return {
      total: DISPUTES.length, active: activeDisputes.length, resolved: resolved.length,
      won: won.length, lost: lost.length, winRate, totalAmount, recoveredAmount, lostAmount, pendingAmount,
      byReasonCode, byVertical, byEvidence,
    };
  }, [activeDisputes]);

  const tabs = [
    { key: 'inbox' as const, label: 'Dispute Inbox', badge: activeDisputes.length },
    { key: 'workflow' as const, label: 'Representment Workflow', badge: DISPUTES.filter(d => !['won', 'lost'].includes(d.stage)).length },
    { key: 'codes' as const, label: 'Reason Codes' },
    { key: 'analytics' as const, label: 'Win/Loss Analytics' },
    { key: 'alerts' as const, label: 'Pre-CB Alerts', badge: PRE_ALERTS.filter(a => a.status === 'pending').length },
    { key: 'costcalc' as const, label: 'Cost Calculator' },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
            <p className="text-sm text-gray-500 mt-0.5">Chargeback management, representment workflow & analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>North - Verifi CDRN - Ethoca</span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <button className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-[8px] hover:bg-brand-hover transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Log Dispute
            </button>
          </div>
        </div>

        {/* ── Urgency Summary Strip ── */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Critical (< 3 days)', count: activeDisputes.filter(d => d.daysLeft <= 3).length, amount: activeDisputes.filter(d => d.daysLeft <= 3).reduce((s, d) => s + d.amount, 0), color: 'red', accent: 'border-t-red-500' },
            { label: 'Urgent (3-7 days)', count: activeDisputes.filter(d => d.daysLeft > 3 && d.daysLeft <= 7).length, amount: activeDisputes.filter(d => d.daysLeft > 3 && d.daysLeft <= 7).reduce((s, d) => s + d.amount, 0), color: 'amber', accent: 'border-t-amber-500' },
            { label: 'Normal (> 7 days)', count: activeDisputes.filter(d => d.daysLeft > 7).length, amount: activeDisputes.filter(d => d.daysLeft > 7).reduce((s, d) => s + d.amount, 0), color: 'emerald', accent: 'border-t-emerald-500' },
            { label: 'Win Rate (Resolved)', count: analytics.resolved, amount: analytics.recoveredAmount, color: 'indigo', accent: 'border-t-brand', isRate: true },
          ].map((s, i) => (
            <div key={i} className={`bg-white rounded-[8px] border border-gray-200 border-t-2 ${s.accent} p-4`}>
              <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1.5">{s.label}</p>
              <div className="flex items-end justify-between">
                <p className="text-xl font-bold text-gray-900 leading-none">
                  {s.isRate ? fmtPct(analytics.winRate) : s.count}
                </p>
                <p className="text-xs text-gray-400">{fmt(s.amount)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tab Nav ── */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-[1px] flex items-center gap-2 ${
                  activeTab === t.key ? 'text-brand border-brand' : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {t.label}
                {t.badge !== undefined && (
                  <span className={`text-[10px] tabular-nums px-1.5 py-px rounded-full ${
                    activeTab === t.key ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-500'
                  }`}>{t.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════ */}
        {/* INBOX TAB                               */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            {/* Search + Filters */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search disputes, merchants, reason codes..."
                  className="w-full pl-8 pr-3 py-[7px] bg-white border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
              </div>
              <div className="flex items-center gap-1">
                {['all', 'new', 'evidence', 'draft', 'review', 'submitted', 'awaiting'].map(s => (
                  <button key={s} onClick={() => setStageFilter(s)}
                    className={`px-2.5 py-1.5 rounded-[8px] text-xs font-medium transition-colors ${stageFilter === s ? 'bg-brand/10 text-brand' : 'text-gray-500 hover:bg-gray-50'}`}>
                    {s === 'all' ? 'All Active' : stageConfig[s as DisputeStage]?.label || s}
                  </button>
                ))}
              </div>
            </div>

            {/* Dispute Table */}
            <div className="bg-white border border-gray-200 rounded-[8px] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <Th className="pl-5">Urgency</Th><Th>Dispute</Th><Th>Merchant</Th><Th>Reason Code</Th>
                    <Th>Amount</Th><Th>Deadline</Th><Th>Stage</Th><Th>Handler</Th><Th className="pr-5">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.filter(d => stageFilter === 'all' ? !['won', 'lost'].includes(d.stage) : true).sort((a, b) => a.daysLeft - b.daysLeft).map(d => {
                    const urg = urgencyOf(d);
                    const uc = urgencyColor[urg];
                    const sc = stageConfig[d.stage];
                    const isSelected = selectedDispute === d.id;
                    return (
                      <React.Fragment key={d.id}>
                        <tr onClick={() => setSelectedDispute(isSelected ? null : d.id)}
                          className={`border-b border-gray-100 cursor-pointer transition-colors ${isSelected ? 'bg-brand-50/40' : 'hover:bg-gray-50/80'}`}>
                          <td className="pl-5 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${uc.bg} ${uc.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${uc.dot} ${urg === 'critical' ? 'animate-pulse' : ''}`} />
                              {d.daysLeft <= 0 ? 'OVERDUE' : `${d.daysLeft}d left`}
                            </span>
                          </td>
                          <td className="py-3">
                            <p className="text-sm font-semibold text-gray-900">{d.id}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{d.cardNetwork} ****{d.cardLast4}</p>
                          </td>
                          <td className="py-3">
                            <p className="text-sm font-medium text-gray-900">{d.merchant}</p>
                            <p className="text-[10px] text-gray-400">{d.vertical}</p>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${categoryColors[d.reasonCategory].bg} ${categoryColors[d.reasonCategory].text}`}>
                                {d.reasonCategory.toUpperCase()}
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-gray-900">{d.cardNetwork} {d.reasonCode}</p>
                                <p className="text-[10px] text-gray-400 max-w-[180px] truncate">{d.reasonLabel}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-sm font-semibold tabular-nums text-gray-900">{fmt(d.amount)}</td>
                          <td className="py-3">
                            <p className={`text-xs font-medium tabular-nums ${d.daysLeft <= 3 ? 'text-red-600' : d.daysLeft <= 7 ? 'text-amber-600' : 'text-gray-600'}`}>
                              {fmtDate(d.responseDeadline)}
                            </p>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.color}`}>
                              {sc.label}
                            </span>
                          </td>
                          <td className="py-3 text-xs text-gray-600">{d.handler}</td>
                          <td className="pr-5 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); setEvidenceModal(d.id); }}
                                className="p-1.5 rounded-[8px] hover:bg-gray-100 text-gray-400 hover:text-brand transition-colors" title="Evidence Builder">
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setCostCalcId(d.id); }}
                                className="p-1.5 rounded-[8px] hover:bg-gray-100 text-gray-400 hover:text-brand transition-colors" title="Cost Calculator">
                                <Calculator className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {isSelected && (
                          <tr><td colSpan={9} className="bg-gray-50 border-b border-gray-200 px-5 py-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              {/* Timeline */}
                              <div className="lg:col-span-2">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-3">Representment Pipeline</p>
                                <div className="flex items-center gap-1 mb-4">
                                  {STAGE_ORDER.map((st, i) => {
                                    const isDone = d.stageTimestamps[st] !== undefined;
                                    const isCurrent = d.stage === st;
                                    const isLost = d.stage === 'lost' && i === STAGE_ORDER.length - 1;
                                    return (
                                      <React.Fragment key={st}>
                                        <div className={`flex flex-col items-center gap-1`}>
                                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                            isDone && !isCurrent ? 'bg-emerald-100 text-emerald-700' :
                                            isCurrent ? 'bg-brand text-white ring-2 ring-brand/20' :
                                            isLost ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-400'
                                          }`}>
                                            {isDone && !isCurrent ? '✓' : i + 1}
                                          </div>
                                          <p className="text-[9px] text-gray-500 text-center leading-tight max-w-[60px]">{stageConfig[st].label}</p>
                                          {d.stageTimestamps[st] && <p className="text-[8px] text-gray-400">{fmtDate(d.stageTimestamps[st]!)}</p>}
                                        </div>
                                        {i < STAGE_ORDER.length - 1 && (
                                          <div className={`flex-1 h-0.5 mb-8 ${isDone ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                  {d.stage === 'lost' && (
                                    <>
                                      <div className="flex-1 h-0.5 mb-8 bg-red-200" />
                                      <div className="flex flex-col items-center gap-1">
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-red-100 text-red-700">✗</div>
                                        <p className="text-[9px] text-red-600 text-center">Lost</p>
                                        {d.stageTimestamps.lost && <p className="text-[8px] text-gray-400">{fmtDate(d.stageTimestamps.lost)}</p>}
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Evidence Progress */}
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-2">Evidence Checklist</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {d.evidenceTypes.map(ev => {
                                    const collected = d.evidenceCollected.includes(ev);
                                    return (
                                      <div key={ev} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-xs ${collected ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {collected ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
                                        {ev}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Notes & Details */}
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-2">Details</p>
                                <div className="space-y-2 mb-4">
                                  <div className="flex justify-between text-xs"><span className="text-gray-500">Transaction</span><span className="text-gray-900 font-medium">{fmtDate(d.transactionDate)}</span></div>
                                  <div className="flex justify-between text-xs"><span className="text-gray-500">Dispute Filed</span><span className="text-gray-900 font-medium">{fmtDate(d.disputeDate)}</span></div>
                                  <div className="flex justify-between text-xs"><span className="text-gray-500">ARN</span><span className="text-gray-900 font-mono text-[10px]">{d.arnNumber.slice(0, 12)}...</span></div>
                                  <div className="flex justify-between text-xs"><span className="text-gray-500">Network</span><span className="text-gray-900 font-medium">{d.cardNetwork}</span></div>
                                </div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-2">Activity Log</p>
                                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                                  {d.notes.map((n, i) => (
                                    <div key={i} className="bg-white rounded-[8px] border border-gray-200 px-2.5 py-2">
                                      <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-[10px] font-semibold text-gray-700">{n.author}</span>
                                        <span className="text-[9px] text-gray-400">{fmtDate(n.date)}</span>
                                      </div>
                                      <p className="text-[11px] text-gray-600 leading-relaxed">{n.text}</p>
                                    </div>
                                  ))}
                                  {d.notes.length === 0 && <p className="text-xs text-gray-400 italic">No notes yet</p>}
                                </div>
                              </div>
                            </div>
                          </td></tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {filtered.filter(d => stageFilter === 'all' ? !['won', 'lost'].includes(d.stage) : true).length === 0 && (
                    <tr><td colSpan={9} className="py-12 text-center text-sm text-gray-400">No disputes match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* WORKFLOW TAB                             */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'workflow' && (
          <div className="space-y-6">
            {/* Kanban-style stage columns */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {(['new', 'evidence', 'draft', 'review', 'submitted', 'awaiting', 'won'] as DisputeStage[]).map(stage => {
                const stageDisputes = DISPUTES.filter(d => d.stage === stage);
                const lostDisputes = stage === 'won' ? DISPUTES.filter(d => d.stage === 'lost') : [];
                const sc = stageConfig[stage];
                return (
                  <div key={stage} className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
                    <div className={`px-3 py-2.5 border-b border-gray-100 ${sc.bg}`}>
                      <div className="flex items-center justify-between">
                        <p className={`text-[11px] font-bold uppercase tracking-wide ${sc.color}`}>{sc.label}</p>
                        <span className={`text-[10px] font-bold tabular-nums px-1.5 py-px rounded-full ${sc.bg} ${sc.color}`}>{stageDisputes.length}</span>
                      </div>
                    </div>
                    <div className="p-2 space-y-2 min-h-[120px] max-h-[400px] overflow-y-auto">
                      {stageDisputes.map(d => {
                        const urg = urgencyOf(d);
                        return (
                          <div key={d.id} onClick={() => { setActiveTab('inbox'); setSelectedDispute(d.id); }}
                            className={`rounded-[8px] border p-2.5 cursor-pointer hover:shadow-sm transition-all ${
                              urg === 'critical' ? 'border-red-200 bg-red-50/30' : 'border-gray-200 hover:border-brand/30'
                            }`}>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[10px] font-bold text-gray-500">{d.id}</p>
                              {d.daysLeft <= 7 && d.stage !== 'won' && d.stage !== 'lost' && (
                                <span className={`text-[8px] font-bold px-1 py-px rounded ${urgencyColor[urg].bg} ${urgencyColor[urg].text}`}>
                                  {d.daysLeft <= 0 ? 'OVERDUE' : `${d.daysLeft}d`}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-gray-900 truncate">{d.merchant}</p>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[10px] text-gray-500">{d.cardNetwork} {d.reasonCode}</span>
                              <span className="text-xs font-bold tabular-nums text-gray-900">{fmt(d.amount)}</span>
                            </div>
                            {/* Evidence progress bar */}
                            {!['won', 'lost'].includes(d.stage) && d.evidenceTypes.length > 0 && (
                              <div className="mt-2">
                                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-brand rounded-full" style={{ width: `${(d.evidenceCollected.length / d.evidenceTypes.length) * 100}%` }} />
                                </div>
                                <p className="text-[8px] text-gray-400 mt-0.5">{d.evidenceCollected.length}/{d.evidenceTypes.length} evidence</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Show lost disputes in the Won column */}
                      {lostDisputes.map(d => (
                        <div key={d.id} className="rounded-[8px] border border-red-200 bg-red-50/30 p-2.5 cursor-pointer hover:shadow-sm"
                          onClick={() => { setActiveTab('inbox'); setStageFilter('all'); setSelectedDispute(d.id); }}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-bold text-gray-500">{d.id}</p>
                            <span className="text-[8px] font-bold px-1 py-px rounded bg-red-100 text-red-700">LOST</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-900 truncate">{d.merchant}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-gray-500">{d.cardNetwork} {d.reasonCode}</span>
                            <span className="text-xs font-bold tabular-nums text-red-600">{fmt(d.amount)}</span>
                          </div>
                        </div>
                      ))}
                      {stageDisputes.length === 0 && lostDisputes.length === 0 && (
                        <p className="text-[10px] text-gray-400 text-center py-4">Empty</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SLA Tracking */}
            <div className="bg-white rounded-[8px] border border-gray-200">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-900">SLA Tracking — Response Deadlines</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">
                    <Th className="pl-5">Dispute</Th><Th>Merchant</Th><Th>Stage</Th><Th>Deadline</Th><Th>Time Remaining</Th><Th>Handler</Th><Th>SLA Status</Th>
                  </tr></thead>
                  <tbody>
                    {activeDisputes.map(d => {
                      const urg = urgencyOf(d);
                      const slaStatus = d.daysLeft <= 0 ? 'BREACHED' : d.daysLeft <= 3 ? 'AT RISK' : 'ON TRACK';
                      const slaColor = d.daysLeft <= 0 ? 'text-red-700 bg-red-50' : d.daysLeft <= 3 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50';
                      return (
                        <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="pl-5 py-2.5"><p className="text-sm font-semibold text-gray-900">{d.id}</p><p className="text-[10px] text-gray-400">{d.cardNetwork} {d.reasonCode}</p></td>
                          <td className="py-2.5 text-sm text-gray-700">{d.merchant}</td>
                          <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${stageConfig[d.stage].bg} ${stageConfig[d.stage].color}`}>{stageConfig[d.stage].label}</span></td>
                          <td className="py-2.5 text-xs tabular-nums text-gray-600">{fmtDateFull(d.responseDeadline)}</td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${d.daysLeft <= 0 ? 'bg-red-500' : d.daysLeft <= 3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.max(0, Math.min(100, ((30 - Math.max(0, d.daysLeft)) / 30) * 100))}%` }} />
                              </div>
                              <span className={`text-xs font-bold tabular-nums ${d.daysLeft <= 0 ? 'text-red-600' : d.daysLeft <= 3 ? 'text-amber-600' : 'text-gray-600'}`}>
                                {d.daysLeft <= 0 ? `${Math.abs(d.daysLeft)}d overdue` : `${d.daysLeft}d`}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 text-xs text-gray-600">{d.handler}</td>
                          <td className="py-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${slaColor}`}>{slaStatus}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* REASON CODES TAB                        */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'codes' && (
          <div className="space-y-4">
            <div className="bg-white rounded-[8px] border border-gray-200">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Reason Code Classification Engine</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Auto-tagged codes with required evidence and representment strategy (CPFPP exam framework)</p>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {Object.entries(REASON_CODES).map(([code, info]) => {
                  const disputeCount = DISPUTES.filter(d => d.reasonCode === code).length;
                  return (
                    <div key={code} className="px-5 py-4 hover:bg-gray-50/50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center">
                            <span className="text-lg font-bold text-brand">{code}</span>
                            <span className="text-[9px] text-gray-400 font-medium">{info.network}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{info.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${categoryColors[info.category === 'Fraud' ? 'fraud' : info.category === 'Authorization' ? 'authorization' : info.category === 'Processing Errors' ? 'processing' : 'service'].bg} ${categoryColors[info.category === 'Fraud' ? 'fraud' : info.category === 'Authorization' ? 'authorization' : info.category === 'Processing Errors' ? 'processing' : 'service'].text}`}>
                                {info.category.toUpperCase()}
                              </span>
                              <span className="text-[10px] text-gray-400">{disputeCount} dispute{disputeCount !== 1 ? 's' : ''} in portfolio</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Historical Win Rate</p>
                          <p className={`text-lg font-bold ${info.winRate >= 0.6 ? 'text-emerald-600' : info.winRate >= 0.5 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(info.winRate)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-2">Required Evidence</p>
                          <div className="space-y-1">
                            {info.requiredEvidence.map((ev, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                                <Paperclip className="w-3 h-3 text-gray-400 shrink-0" />
                                {ev}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-2">Recommended Strategy</p>
                          <p className="text-xs text-gray-600 leading-relaxed bg-brand-50/50 rounded-[8px] p-3 border border-brand-100">{info.strategy}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* ANALYTICS TAB                           */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Top KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KpiCard label="Total Disputes" value={analytics.total.toString()} sub={`${analytics.active} active, ${analytics.resolved} resolved`} accent="indigo" />
              <KpiCard label="Win Rate" value={fmtPct(analytics.winRate)} sub={`${analytics.won}W / ${analytics.lost}L`} accent={analytics.winRate >= 0.6 ? 'emerald' : 'amber'} />
              <KpiCard label="Dollars Recovered" value={fmt(analytics.recoveredAmount)} sub="From won disputes" accent="emerald" />
              <KpiCard label="Dollars Lost" value={fmt(analytics.lostAmount)} sub="From lost disputes" accent="red" />
              <KpiCard label="At Risk" value={fmt(analytics.pendingAmount)} sub={`${analytics.active} pending disputes`} accent="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Win Rate by Reason Code */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand" />
                  <h3 className="text-sm font-semibold text-gray-900">Win Rate by Reason Code</h3>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {Object.entries(analytics.byReasonCode).map(([code, data]) => {
                    const wr = data.total > 0 ? data.wins / data.total : 0;
                    return (
                      <div key={code}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-900">{code} <span className="text-gray-400 font-normal">({data.total})</span></span>
                          <span className={`text-xs font-bold ${wr >= 0.6 ? 'text-emerald-600' : wr >= 0.5 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(wr)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${wr >= 0.6 ? 'bg-emerald-500' : wr >= 0.5 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${wr * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(analytics.byReasonCode).length === 0 && <p className="text-xs text-gray-400">No resolved disputes yet</p>}
                </div>
              </div>

              {/* Win Rate by Vertical */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Win Rate by Vertical</h3>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {Object.entries(analytics.byVertical).sort((a, b) => (b[1].total > 0 ? b[1].wins / b[1].total : 0) - (a[1].total > 0 ? a[1].wins / a[1].total : 0)).map(([vert, data]) => {
                    const wr = data.total > 0 ? data.wins / data.total : 0;
                    return (
                      <div key={vert}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-900">{vert} <span className="text-gray-400 font-normal">({data.total})</span></span>
                          <span className={`text-xs font-bold ${wr >= 0.6 ? 'text-emerald-600' : wr >= 0.5 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(wr)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${wr >= 0.6 ? 'bg-emerald-500' : wr >= 0.5 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${wr * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Win Rate by Evidence Type */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Win Rate by Evidence Type</h3>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {Object.entries(analytics.byEvidence).sort((a, b) => (b[1].total > 0 ? b[1].wins / b[1].total : 0) - (a[1].total > 0 ? a[1].wins / a[1].total : 0)).map(([ev, data]) => {
                    const wr = data.total > 0 ? data.wins / data.total : 0;
                    return (
                      <div key={ev}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-900">{ev} <span className="text-gray-400">({data.total})</span></span>
                          <span className={`text-xs font-bold ${wr >= 0.6 ? 'text-emerald-600' : wr >= 0.5 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(wr)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${wr >= 0.6 ? 'bg-emerald-500' : wr >= 0.5 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${wr * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Representment Argument Effectiveness */}
            <div className="bg-white rounded-[8px] border border-gray-200">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <div><h3 className="text-sm font-semibold text-gray-900">Representment Argument Effectiveness</h3><p className="text-xs text-gray-500 mt-0.5">Which evidence combinations actually win disputes</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">
                    <Th className="pl-5">Evidence Combination</Th><Th>Times Used</Th><Th>Wins</Th><Th>Losses</Th><Th>Win Rate</Th><Th>Verdict</Th>
                  </tr></thead>
                  <tbody>
                    {[
                      { combo: 'AVS/CVV + 3D Secure + IP Geolocation', used: 3, wins: 3, losses: 0 },
                      { combo: 'Signed Receipt + AVS/CVV + Communication Logs', used: 1, wins: 1, losses: 0 },
                      { combo: 'Service Completion + Signed Receipt + Comms', used: 1, wins: 1, losses: 0 },
                      { combo: 'Delivery Confirmation + Communication Logs + Refund Policy', used: 1, wins: 1, losses: 0 },
                      { combo: 'TOS + Refund Policy + Service Description + Comms', used: 1, wins: 1, losses: 0 },
                      { combo: 'TOS only (no communication logs)', used: 1, wins: 0, losses: 1 },
                      { combo: 'Service Completion only (no delivery proof)', used: 1, wins: 0, losses: 1 },
                    ].map((row, i) => {
                      const wr = row.used > 0 ? row.wins / row.used : 0;
                      return (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="pl-5 py-2.5 text-sm text-gray-900">{row.combo}</td>
                          <td className="py-2.5 text-sm tabular-nums text-gray-600">{row.used}</td>
                          <td className="py-2.5 text-sm tabular-nums text-emerald-600 font-semibold">{row.wins}</td>
                          <td className="py-2.5 text-sm tabular-nums text-red-600 font-semibold">{row.losses}</td>
                          <td className="py-2.5"><span className={`text-sm font-bold ${wr >= 0.6 ? 'text-emerald-600' : wr > 0 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(wr)}</span></td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${wr >= 0.8 ? 'bg-emerald-50 text-emerald-700' : wr >= 0.5 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                              {wr >= 0.8 ? 'STRONG' : wr >= 0.5 ? 'MODERATE' : 'WEAK'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* PRE-CHARGEBACK ALERTS TAB                */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[8px] border border-amber-200 p-4 flex items-start gap-3">
              <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Pre-Chargeback Alerts (Phase 2)</p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  Integrated with Verifi CDRN and Ethoca. Alerts surface <span className="font-semibold">before</span> they become formal disputes.
                  Proactive refunds are cheaper than fighting chargebacks and protect the merchant's CB ratio (must stay below 1% Visa / 1.5% MC).
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[8px] border border-gray-200">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Active Pre-Chargeback Alerts</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> {PRE_ALERTS.filter(a => a.status === 'pending').length} pending</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> {PRE_ALERTS.filter(a => a.status === 'refunded').length} refunded</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" /> {PRE_ALERTS.filter(a => a.status === 'expired').length} expired</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">
                    <Th className="pl-5">Alert</Th><Th>Source</Th><Th>Merchant</Th><Th>Descriptor</Th><Th>Amount</Th><Th>Card</Th><Th>Expires In</Th><Th>Status</Th><Th className="pr-5">Action</Th>
                  </tr></thead>
                  <tbody>
                    {PRE_ALERTS.map(a => {
                      const statusColors: Record<string, { bg: string; text: string }> = {
                        pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
                        refunded: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
                        expired: { bg: 'bg-gray-100', text: 'text-gray-500' },
                      };
                      const sc = statusColors[a.status];
                      return (
                        <tr key={a.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${a.status === 'pending' && a.expiresIn <= 24 ? 'bg-amber-50/30' : ''}`}>
                          <td className="pl-5 py-2.5">
                            <p className="text-sm font-semibold text-gray-900">{a.id}</p>
                            <p className="text-[10px] text-gray-400">{fmtDate(a.alertDate)}</p>
                          </td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.source === 'Verifi CDRN' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                              {a.source}
                            </span>
                          </td>
                          <td className="py-2.5 text-sm text-gray-900">{a.merchant}</td>
                          <td className="py-2.5 text-xs font-mono text-gray-500">{a.descriptor}</td>
                          <td className="py-2.5 text-sm font-semibold tabular-nums text-gray-900">{fmt(a.amount)}</td>
                          <td className="py-2.5 text-xs font-mono text-gray-500">****{a.cardLast4}</td>
                          <td className="py-2.5">
                            {a.status === 'pending' ? (
                              <span className={`text-xs font-bold tabular-nums ${a.expiresIn <= 24 ? 'text-red-600' : 'text-amber-600'}`}>{a.expiresIn}h</span>
                            ) : <span className="text-xs text-gray-400">-</span>}
                          </td>
                          <td className="py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>{a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span></td>
                          <td className="pr-5 py-2.5">
                            {a.status === 'pending' ? (
                              <button className="px-3 py-1.5 bg-brand text-white text-[10px] font-semibold rounded-[8px] hover:bg-brand-hover transition-colors">
                                Issue Refund
                              </button>
                            ) : <span className="text-xs text-gray-400">-</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CB Ratio Monitor */}
            <div className="bg-white rounded-[8px] border border-gray-200">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-semibold text-gray-900">Chargeback Ratio Monitor</h3>
              </div>
              <div className="px-5 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { merchant: 'Havana Bites Cafe', txnCount: 1247, cbCount: 3, ratio: 0.0024, threshold: 0.01, network: 'Visa' },
                    { merchant: 'Coral Reef Auto Spa', txnCount: 892, cbCount: 2, ratio: 0.0022, threshold: 0.01, network: 'Visa' },
                    { merchant: 'SoBe Cycle & Fitness', txnCount: 456, cbCount: 1, ratio: 0.0022, threshold: 0.015, network: 'Mastercard' },
                  ].map((m, i) => {
                    const pctOfThreshold = m.ratio / m.threshold;
                    const color = pctOfThreshold >= 0.8 ? 'text-red-600' : pctOfThreshold >= 0.5 ? 'text-amber-600' : 'text-emerald-600';
                    const barColor = pctOfThreshold >= 0.8 ? 'bg-red-500' : pctOfThreshold >= 0.5 ? 'bg-amber-500' : 'bg-emerald-500';
                    return (
                      <div key={i} className="bg-gray-50 rounded-[8px] p-3">
                        <p className="text-xs font-semibold text-gray-900 mb-2">{m.merchant}</p>
                        <div className="flex items-end justify-between mb-1.5">
                          <span className={`text-lg font-bold tabular-nums ${color}`}>{(m.ratio * 100).toFixed(2)}%</span>
                          <span className="text-[10px] text-gray-400">{m.network} limit: {(m.threshold * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pctOfThreshold * 100}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{m.cbCount} CB / {m.txnCount.toLocaleString()} txns</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* CHARGEBACK COST CALCULATOR TAB          */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'costcalc' && (() => {
          const CB_FEE_MIN = 25;
          const CB_FEE_MAX = 50;
          const LABOR_RATE_PER_HOUR = 45;
          const AVG_HOURS_PER_DISPUTE = 1.5;
          const laborPerDispute = LABOR_RATE_PER_HOUR * AVG_HOURS_PER_DISPUTE;

          // Merchant CB ratio data for fine exposure
          const merchantRatios = [
            { merchant: 'Havana Bites Cafe', txnCount: 1247, cbCount: 3, network: 'Visa', threshold: 0.01 },
            { merchant: 'Coral Reef Auto Spa', txnCount: 892, cbCount: 2, network: 'Visa', threshold: 0.01 },
            { merchant: 'SoBe Cycle & Fitness', txnCount: 456, cbCount: 1, network: 'Mastercard', threshold: 0.015 },
            { merchant: 'Doral Fresh Market', txnCount: 1034, cbCount: 2, network: 'Visa', threshold: 0.01 },
            { merchant: 'Hialeah Tire & Brake', txnCount: 678, cbCount: 1, network: 'Visa', threshold: 0.01 },
            { merchant: 'Midtown Taqueria', txnCount: 1560, cbCount: 1, network: 'Visa', threshold: 0.01 },
          ].map(m => ({ ...m, ratio: m.cbCount / m.txnCount, pctOfThreshold: (m.cbCount / m.txnCount) / m.threshold }));

          // Network fine tiers
          const fineExposure = merchantRatios.filter(m => m.pctOfThreshold >= 0.5);
          const criticalRatio = merchantRatios.filter(m => m.pctOfThreshold >= 0.8);

          // Per-dispute cost breakdown
          const disputeCosts = DISPUTES.map(d => {
            const cbFee = d.amount > 500 ? CB_FEE_MAX : d.amount > 200 ? 35 : CB_FEE_MIN;
            const lostRevenue = d.amount;
            const networkFine = d.amount > 500 ? 150 : d.amount > 200 ? 75 : 25;
            const totalInaction = cbFee + lostRevenue + laborPerDispute + networkFine;
            const winProb = REASON_CODES[d.reasonCode]?.winRate || 0.5;
            const expectedRecovery = lostRevenue * winProb;
            const representmentCost = laborPerDispute;
            const netROI = expectedRecovery - representmentCost;
            const roiPct = representmentCost > 0 ? (netROI / representmentCost) * 100 : 0;
            return { ...d, cbFee, lostRevenue, laborCost: laborPerDispute, networkFine, totalInaction, winProb, expectedRecovery, representmentCost, netROI, roiPct };
          });

          // Aggregates
          const totalCBFees = disputeCosts.reduce((s, d) => s + d.cbFee, 0);
          const totalLostRevenue = disputeCosts.reduce((s, d) => s + d.lostRevenue, 0);
          const totalLaborCost = disputeCosts.reduce((s, d) => s + d.laborCost, 0);
          const totalNetworkFines = disputeCosts.reduce((s, d) => s + d.networkFine, 0);
          const totalInaction = totalCBFees + totalLostRevenue + totalLaborCost + totalNetworkFines;
          const totalExpectedRecovery = disputeCosts.reduce((s, d) => s + d.expectedRecovery, 0);
          const totalRepresentmentCost = disputeCosts.reduce((s, d) => s + d.representmentCost, 0);
          const portfolioROI = totalRepresentmentCost > 0 ? ((totalExpectedRecovery - totalRepresentmentCost) / totalRepresentmentCost) * 100 : 0;

          // Won/lost actuals
          const wonDisputes = disputeCosts.filter(d => d.outcome === 'won');
          const lostDisputes = disputeCosts.filter(d => d.outcome === 'lost');
          const actualRecovered = wonDisputes.reduce((s, d) => s + d.amount, 0);
          const actualLost = lostDisputes.reduce((s, d) => s + d.totalInaction, 0);
          const actualSaved = actualRecovered + wonDisputes.reduce((s, d) => s + d.cbFee + d.networkFine, 0);

          return (
            <div className="space-y-6">
              {/* Module ROI Banner */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-[8px] border border-emerald-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-sm font-bold text-emerald-900">Dispute Management ROI</h3>
                    </div>
                    <p className="text-xs text-emerald-700 leading-relaxed max-w-xl">
                      Every dispute left unfought costs you the transaction amount <strong>plus</strong> chargeback fees, labor overhead, and potential card network fines.
                      This calculator shows the true cost of inaction and proves the ROI of systematic representment.
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-6">
                    <p className="text-[10px] text-emerald-600 uppercase tracking-wide font-bold mb-1">Portfolio ROI</p>
                    <p className="text-3xl font-bold text-emerald-700 tabular-nums">{portfolioROI.toFixed(0)}%</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">Expected return on representment</p>
                  </div>
                </div>
              </div>

              {/* Aggregate Cost KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-red-500 p-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1">Total CB Fees</p>
                  <p className="text-lg font-bold text-red-700 tabular-nums">{fmt(totalCBFees)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">${CB_FEE_MIN}-${CB_FEE_MAX} per dispute</p>
                </div>
                <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-red-500 p-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1">Lost Revenue</p>
                  <p className="text-lg font-bold text-red-700 tabular-nums">{fmt(totalLostRevenue)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{DISPUTES.length} txn amounts</p>
                </div>
                <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-amber-500 p-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1">Labor Cost</p>
                  <p className="text-lg font-bold text-amber-700 tabular-nums">{fmt(totalLaborCost)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{AVG_HOURS_PER_DISPUTE}h × ${LABOR_RATE_PER_HOUR}/hr</p>
                </div>
                <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-amber-500 p-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1">Fine Exposure</p>
                  <p className="text-lg font-bold text-amber-700 tabular-nums">{fmt(totalNetworkFines)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">If ratio breaches</p>
                </div>
                <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-red-500 p-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1">Total Cost (Inaction)</p>
                  <p className="text-lg font-bold text-red-700 tabular-nums">{fmt(totalInaction)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">If no disputes fought</p>
                </div>
                <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-emerald-500 p-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1">Actual Saved</p>
                  <p className="text-lg font-bold text-emerald-700 tabular-nums">{fmt(actualSaved)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{wonDisputes.length} won disputes</p>
                </div>
              </div>

              {/* Per-Dispute Cost Breakdown Table */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-red-500" />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Per-Dispute Cost Breakdown</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Full cost analysis for every dispute — fee + lost revenue + labor + fine exposure</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700">{fmt(totalInaction)} total exposure</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <Th className="pl-5">Dispute</Th>
                        <Th>Txn Amount</Th>
                        <Th>CB Fee</Th>
                        <Th>Lost Revenue</Th>
                        <Th>Labor</Th>
                        <Th>Fine Risk</Th>
                        <Th>Total Inaction</Th>
                        <Th>Win Prob</Th>
                        <Th>Exp. Recovery</Th>
                        <Th className="pr-5">ROI</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {disputeCosts.sort((a, b) => b.totalInaction - a.totalInaction).map(d => {
                        const isResolved = d.stage === 'won' || d.stage === 'lost';
                        const rowBg = d.outcome === 'won' ? 'bg-emerald-50/30' : d.outcome === 'lost' ? 'bg-red-50/30' : '';
                        return (
                          <tr key={d.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${rowBg}`}>
                            <td className="pl-5 py-2.5">
                              <p className="text-sm font-medium text-gray-900">{d.merchant}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-gray-400 font-mono">{d.id}</span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${stageConfig[d.stage].bg} ${stageConfig[d.stage].color}`}>{stageConfig[d.stage].label}</span>
                              </div>
                            </td>
                            <td className="py-2.5 text-sm font-semibold tabular-nums text-gray-900">{fmt(d.amount)}</td>
                            <td className="py-2.5 text-sm tabular-nums text-red-600">{fmt(d.cbFee)}</td>
                            <td className="py-2.5 text-sm tabular-nums text-red-600">{fmt(d.lostRevenue)}</td>
                            <td className="py-2.5 text-sm tabular-nums text-amber-600">{fmt(d.laborCost)}</td>
                            <td className="py-2.5 text-sm tabular-nums text-amber-600">{fmt(d.networkFine)}</td>
                            <td className="py-2.5">
                              <span className="text-sm font-bold tabular-nums text-red-700">{fmt(d.totalInaction)}</span>
                            </td>
                            <td className="py-2.5">
                              {isResolved ? (
                                <span className={`text-xs font-bold ${d.outcome === 'won' ? 'text-emerald-600' : 'text-red-600'}`}>{d.outcome === 'won' ? 'WON' : 'LOST'}</span>
                              ) : (
                                <span className={`text-xs font-semibold tabular-nums ${d.winProb >= 0.65 ? 'text-emerald-600' : d.winProb >= 0.5 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(d.winProb)}</span>
                              )}
                            </td>
                            <td className="py-2.5 text-sm tabular-nums text-emerald-600">{fmt(d.expectedRecovery)}</td>
                            <td className="pr-5 py-2.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${d.roiPct >= 100 ? 'bg-emerald-50 text-emerald-700' : d.roiPct >= 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                                {d.roiPct >= 0 ? '+' : ''}{d.roiPct.toFixed(0)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Totals row */}
                      <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td className="pl-5 py-3 text-sm font-bold text-gray-900">Portfolio Total ({DISPUTES.length} disputes)</td>
                        <td className="py-3 text-sm font-bold tabular-nums text-gray-900">{fmt(totalLostRevenue)}</td>
                        <td className="py-3 text-sm font-bold tabular-nums text-red-700">{fmt(totalCBFees)}</td>
                        <td className="py-3 text-sm font-bold tabular-nums text-red-700">{fmt(totalLostRevenue)}</td>
                        <td className="py-3 text-sm font-bold tabular-nums text-amber-700">{fmt(totalLaborCost)}</td>
                        <td className="py-3 text-sm font-bold tabular-nums text-amber-700">{fmt(totalNetworkFines)}</td>
                        <td className="py-3 text-base font-bold tabular-nums text-red-700">{fmt(totalInaction)}</td>
                        <td className="py-3 text-sm font-bold tabular-nums text-gray-600">{fmtPct(analytics.winRate)}</td>
                        <td className="py-3 text-sm font-bold tabular-nums text-emerald-700">{fmt(totalExpectedRecovery)}</td>
                        <td className="pr-5 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tabular-nums bg-emerald-100 text-emerald-800">+{portfolioROI.toFixed(0)}%</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card Network Fine Exposure */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Card Network Fine Exposure</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Visa VDMP / Mastercard ECM program thresholds — fines escalate with each month in breach</p>
                    </div>
                  </div>
                  {criticalRatio.length > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700">{criticalRatio.length} approaching threshold</span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">All within limits</span>
                  )}
                </div>
                <div className="px-5 py-4">
                  {/* Fine tier reference */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div className="rounded-[8px] border border-blue-200 bg-blue-50/50 p-3">
                      <p className="text-[10px] text-blue-700 uppercase tracking-wide font-bold mb-2">Visa VDMP Fine Schedule</p>
                      <div className="space-y-1">
                        {[
                          { tier: 'Standard', range: '< 0.9%', fine: 'No fines', color: 'text-emerald-600' },
                          { tier: 'Early Warning', range: '0.9% - 1.0%', fine: '$50/CB after month 4', color: 'text-amber-600' },
                          { tier: 'Excessive', range: '> 1.0%', fine: '$50-$100/CB + $25K/mo review fee', color: 'text-red-600' },
                          { tier: 'High Excessive', range: '> 1.8%', fine: '$100/CB + $75K/mo + potential termination', color: 'text-red-700' },
                        ].map((t, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${t.color}`}>{t.tier}</span>
                              <span className="text-gray-400">({t.range})</span>
                            </div>
                            <span className="text-gray-600">{t.fine}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[8px] border border-orange-200 bg-orange-50/50 p-3">
                      <p className="text-[10px] text-orange-700 uppercase tracking-wide font-bold mb-2">Mastercard ECM Fine Schedule</p>
                      <div className="space-y-1">
                        {[
                          { tier: 'Compliant', range: '< 1.0%', fine: 'No fines', color: 'text-emerald-600' },
                          { tier: 'Chargeback Monitored', range: '1.0% - 1.5%', fine: '$5K/mo after month 3', color: 'text-amber-600' },
                          { tier: 'Excessive', range: '1.5% - 3.0%', fine: '$25K-$100K/mo escalating', color: 'text-red-600' },
                          { tier: 'High Excessive', range: '> 3.0%', fine: '$200K/mo + acquirer liability', color: 'text-red-700' },
                        ].map((t, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${t.color}`}>{t.tier}</span>
                              <span className="text-gray-400">({t.range})</span>
                            </div>
                            <span className="text-gray-600">{t.fine}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Per-merchant ratio vs threshold */}
                  <div className="space-y-3">
                    {merchantRatios.sort((a, b) => b.pctOfThreshold - a.pctOfThreshold).map((m, i) => {
                      const barColor = m.pctOfThreshold >= 0.8 ? 'bg-red-500' : m.pctOfThreshold >= 0.5 ? 'bg-amber-500' : 'bg-emerald-500';
                      const textColor = m.pctOfThreshold >= 0.8 ? 'text-red-600' : m.pctOfThreshold >= 0.5 ? 'text-amber-600' : 'text-emerald-600';
                      const monthlyFine = m.pctOfThreshold >= 1.0 ? (m.network === 'Visa' ? 25000 : 5000) : m.pctOfThreshold >= 0.8 ? 500 : 0;
                      return (
                        <div key={i} className={`rounded-[8px] border p-3 ${m.pctOfThreshold >= 0.8 ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-gray-50/50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{m.merchant}</p>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-500">{m.network}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-gray-400">{m.cbCount} CB / {m.txnCount.toLocaleString()} txns</span>
                              <span className={`text-sm font-bold tabular-nums ${textColor}`}>{(m.ratio * 100).toFixed(2)}%</span>
                              {monthlyFine > 0 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">~{fmt(monthlyFine)}/mo fine risk</span>}
                            </div>
                          </div>
                          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`absolute inset-y-0 left-0 rounded-full ${barColor}`} style={{ width: `${Math.min(m.pctOfThreshold * 100, 100)}%` }} />
                            <div className="absolute inset-y-0 right-0 w-px bg-red-500" style={{ left: '100%' }} />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-gray-400">0%</span>
                            <span className="text-[10px] text-gray-400">{fmtPct(m.pctOfThreshold)} of {m.network} threshold ({(m.threshold * 100).toFixed(1)}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ROI Summary — The Business Case */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cost of Inaction */}
                <div className="bg-white rounded-[8px] border border-red-200">
                  <div className="px-5 py-3.5 border-b border-red-100 bg-red-50/50 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-semibold text-red-900">Cost of Inaction (Not Fighting)</h3>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    {[
                      { label: 'Chargeback Fees', value: totalCBFees, desc: `$${CB_FEE_MIN}-$${CB_FEE_MAX} × ${DISPUTES.length} disputes`, icon: '💳' },
                      { label: 'Lost Transaction Revenue', value: totalLostRevenue, desc: 'Full amount of disputed transactions', icon: '📉' },
                      { label: 'Representment Labor', value: totalLaborCost, desc: `${AVG_HOURS_PER_DISPUTE}h × $${LABOR_RATE_PER_HOUR}/hr × ${DISPUTES.length} disputes`, icon: '⏱' },
                      { label: 'Network Fine Exposure', value: totalNetworkFines, desc: 'Escalating fines if CB ratio breaches', icon: '⚠' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                        <span className="text-lg">{item.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.label}</p>
                          <p className="text-[10px] text-gray-400">{item.desc}</p>
                        </div>
                        <span className="text-sm font-bold tabular-nums text-red-700">{fmt(item.value)}</span>
                      </div>
                    ))}
                    <div className="bg-red-50 rounded-[8px] p-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-red-800">Total Cost of Doing Nothing</p>
                      <span className="text-xl font-bold tabular-nums text-red-700">{fmt(totalInaction)}</span>
                    </div>
                  </div>
                </div>

                {/* Value of Fighting */}
                <div className="bg-white rounded-[8px] border border-emerald-200">
                  <div className="px-5 py-3.5 border-b border-emerald-100 bg-emerald-50/50 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-semibold text-emerald-900">Value of Systematic Representment</h3>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    {[
                      { label: 'Expected Recovery (All)', value: totalExpectedRecovery, desc: `Based on ${fmtPct(analytics.winRate)} win rate`, positive: true },
                      { label: 'Actual Recovered (Won)', value: actualRecovered, desc: `${wonDisputes.length} disputes won`, positive: true },
                      { label: 'Fees + Fines Avoided', value: wonDisputes.reduce((s, d) => s + d.cbFee + d.networkFine, 0), desc: 'CB fees + network fines not incurred', positive: true },
                      { label: 'Representment Cost', value: totalRepresentmentCost, desc: `Labor investment (${DISPUTES.length} disputes)`, positive: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.label}</p>
                          <p className="text-[10px] text-gray-400">{item.desc}</p>
                        </div>
                        <span className={`text-sm font-bold tabular-nums ${item.positive ? 'text-emerald-700' : 'text-gray-600'}`}>{item.positive ? '+' : '-'}{fmt(item.value)}</span>
                      </div>
                    ))}
                    <div className="bg-emerald-50 rounded-[8px] p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-emerald-800">Net Expected Value</p>
                        <span className="text-xl font-bold tabular-nums text-emerald-700">+{fmt(totalExpectedRecovery - totalRepresentmentCost)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-emerald-700">Portfolio ROI on Representment</p>
                        <span className="text-lg font-bold tabular-nums text-emerald-800">+{portfolioROI.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="bg-brand/5 rounded-[8px] border border-brand/20 p-3 mt-2">
                      <p className="text-xs text-brand font-semibold mb-1">Bottom Line</p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        For every <strong className="text-gray-900">$1</strong> spent on representment labor, you recover an expected <strong className="text-emerald-700">${(totalExpectedRecovery / totalRepresentmentCost).toFixed(2)}</strong> in transaction revenue.
                        Not fighting disputes costs <strong className="text-red-700">{fmt(totalInaction)}</strong> across the portfolio — {((totalInaction / totalRepresentmentCost)).toFixed(1)}× more than the cost of fighting them.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {DISPUTES.length} total disputes — North - Verifi CDRN - Ethoca - {analytics.active} active
          </p>
          <p className="text-xs text-gray-400"><span className="text-brand font-bold">delt</span>pay.com</p>
        </div>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* EVIDENCE BUILDER MODAL                   */}
      {/* ════════════════════════════════════════ */}
      {evidenceModal && (() => {
        const dispute = DISPUTES.find(d => d.id === evidenceModal);
        if (!dispute) return null;
        const rcInfo = REASON_CODES[dispute.reasonCode];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setEvidenceModal(null)} />
            <div className="relative bg-white rounded-[8px] shadow-2xl border border-gray-200 w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Evidence Builder</h2>
                    <p className="text-xs text-gray-500">{dispute.id} — {dispute.merchant} — {dispute.cardNetwork} {dispute.reasonCode}</p>
                  </div>
                  <button onClick={() => setEvidenceModal(null)} className="p-2 hover:bg-gray-100 rounded-[8px] text-gray-500 text-lg">&times;</button>
                </div>
              </div>

              {rcInfo && (
                <div className="px-6 py-3 bg-brand-50/50 border-b border-brand-100">
                  <p className="text-[10px] text-brand uppercase tracking-wide font-bold mb-1">Recommended Strategy — {dispute.reasonCode}</p>
                  <p className="text-xs text-brand-hover leading-relaxed">{rcInfo.strategy}</p>
                </div>
              )}

              <div className="px-6 py-5 space-y-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Required Evidence Collection</p>

                {dispute.evidenceTypes.map((ev, i) => {
                  const collected = dispute.evidenceCollected.includes(ev);
                  return (
                    <div key={i} className={`rounded-[8px] border p-3 ${collected ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 border-dashed bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {collected ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          )}
                          <div>
                            <p className={`text-sm font-medium ${collected ? 'text-emerald-800' : 'text-gray-700'}`}>{ev}</p>
                            {collected && <p className="text-[10px] text-emerald-600 mt-0.5">Uploaded &bull; Verified</p>}
                          </div>
                        </div>
                        {!collected ? (
                          <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-[8px] hover:bg-gray-50 flex items-center gap-1.5">
                              <Upload className="w-3 h-3" /> Upload
                            </button>
                            <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-[8px] hover:bg-gray-50 flex items-center gap-1.5">
                              <GripVertical className="w-3 h-3" /> From Vault
                            </button>
                          </div>
                        ) : (
                          <button className="px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-100 rounded-[8px] flex items-center gap-1">
                            <Eye className="w-3 h-3" /> View
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between sticky bottom-0 bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full" style={{ width: `${(dispute.evidenceCollected.length / dispute.evidenceTypes.length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-500">{dispute.evidenceCollected.length}/{dispute.evidenceTypes.length} collected</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setEvidenceModal(null)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-[8px] hover:bg-gray-50">Cancel</button>
                  <button className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-[8px] hover:bg-brand-hover flex items-center gap-2">
                    <Send className="w-3.5 h-3.5" /> Submit for Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════ */}
      {/* CHARGEBACK COST CALCULATOR MODAL         */}
      {/* ════════════════════════════════════════ */}
      {costCalcId && (() => {
        const dispute = DISPUTES.find(d => d.id === costCalcId);
        if (!dispute) return null;
        const cbFee = 35;
        const lostRevenue = dispute.amount;
        const laborCost = 85;
        const networkFineRisk = dispute.amount > 500 ? 150 : 50;
        const totalCostOfInaction = cbFee + lostRevenue + laborCost + networkFineRisk;
        const representmentCost = laborCost;
        const expectedRecovery = lostRevenue * (REASON_CODES[dispute.reasonCode]?.winRate || 0.5);
        const roi = ((expectedRecovery - representmentCost) / representmentCost) * 100;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setCostCalcId(null)} />
            <div className="relative bg-white rounded-[8px] shadow-2xl border border-gray-200 w-full max-w-md mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Chargeback Cost Calculator</h2>
                    <p className="text-xs text-gray-500">{dispute.id} — {dispute.merchant}</p>
                  </div>
                  <button onClick={() => setCostCalcId(null)} className="p-2 hover:bg-gray-100 rounded-[8px] text-gray-500 text-lg">&times;</button>
                </div>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-3">Cost of Inaction (Not Fighting)</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Chargeback Fee', value: cbFee, note: 'Network / processor fee' },
                      { label: 'Lost Transaction Revenue', value: lostRevenue, note: 'Full transaction amount' },
                      { label: 'Representment Labor', value: laborCost, note: 'Staff time for response' },
                      { label: 'Network Fine Risk', value: networkFineRisk, note: 'If CB ratio breaches threshold' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <div><p className="text-sm text-gray-700">{item.label}</p><p className="text-[10px] text-gray-400">{item.note}</p></div>
                        <span className="text-sm font-semibold tabular-nums text-gray-900">{fmt(item.value)}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                      <p className="text-sm font-bold text-red-700">Total Cost of Inaction</p>
                      <span className="text-lg font-bold tabular-nums text-red-700">{fmt(totalCostOfInaction)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-[8px] border border-emerald-200 p-3">
                  <p className="text-[10px] text-emerald-700 uppercase tracking-wide font-semibold mb-2">ROI of Fighting This Dispute</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-emerald-700">Win probability ({dispute.reasonCode})</span><span className="font-bold text-emerald-800">{fmtPct(REASON_CODES[dispute.reasonCode]?.winRate || 0.5)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-emerald-700">Expected recovery</span><span className="font-bold text-emerald-800">{fmt(expectedRecovery)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-emerald-700">Representment cost</span><span className="font-bold text-emerald-800">{fmt(representmentCost)}</span></div>
                    <div className="border-t border-emerald-300 pt-1.5 flex justify-between text-xs"><span className="text-emerald-800 font-bold">Expected ROI</span><span className="font-bold text-emerald-800 text-base">{roi.toFixed(0)}%</span></div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3">
                <button className="flex-1 px-4 py-2 bg-brand text-white text-sm font-medium rounded-[8px] hover:bg-brand-hover transition-colors">Fight This Dispute</button>
                <button onClick={() => setCostCalcId(null)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-[8px] hover:bg-gray-50">Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ══════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`py-2.5 px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-left ${className}`}>
      {children}
    </th>
  );
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  const accentMap: Record<string, string> = {
    indigo: 'border-t-brand', emerald: 'border-t-emerald-500', amber: 'border-t-amber-500',
    red: 'border-t-red-500', blue: 'border-t-blue-500',
  };
  return (
    <div className={`bg-white rounded-[8px] border border-gray-200 border-t-2 ${accentMap[accent] || ''} p-4`}>
      <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1.5">{label}</p>
      <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  );
}
