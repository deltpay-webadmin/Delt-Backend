import React, { useState, useMemo, Fragment } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  ArrowLeft, Download, Edit3, DollarSign, TrendingUp, TrendingDown,
  BarChart3, Activity, Shield, CheckCircle, AlertTriangle, Monitor,
  Wifi, WifiOff, ChevronRight, ExternalLink, Calendar, FileText,
  CreditCard, ArrowUpRight, ArrowDownRight, Building2, User, Phone,
  Mail, MapPin, Clock, Search, ChevronDown, Info,
} from 'lucide-react';
import { useAppNavigate } from '../NavigationContext';

// ── Helpers ──
const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmt0 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;
const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt0(n);
const fmtNum = (n: number) => new Intl.NumberFormat('en-US').format(n);

// ── Merchant Data (keyed by merchantId) ──
interface MerchantData {
  name: string; dba: string; legalName: string; mid: string; status: string;
  industry: string; owner: string; email: string; phone: string; address: string;
  agent: string; agentSplit: number; onboarded: string; processor: string;
  platform: string; pricingModel: string; mcc: string; riskLevel: string;
  lensScore: number; chargebackRate: number; planTier: string;
}

interface MonthlyResidual {
  month: string; volume: number; txns: number; grossRev: number;
  procFees: number; netRev: number; agentShare: number; deltNet: number;
  effRate: number; avgTicket: number;
}

interface InterchangeRow {
  category: string; volume: number; pct: number; rate: string; cost: number;
}

interface FeeItem {
  fee: string; amount: number; type: string; note?: string;
}

interface ChargebackItem {
  date: string; amount: number; reason: string; status: string; resolution: string;
}

interface EquipmentItem {
  device: string; serial: string; location: string; status: string;
  deployed: string; warranty: string; connectivity: string; firmware: string; lastPing: string;
}

interface BatchItem {
  date: string; txns: number; amount: number; settled: boolean; time: string;
}

const MERCHANTS: Record<string, MerchantData> = {
  'merchant-001': { name: 'Sunrise Cafe & Bakery', dba: 'Sunrise Cafe', legalName: 'Sunrise Cafe & Bakery LLC', mid: '4485-7721-0093', status: 'Active', industry: 'Food & Beverage / Restaurant', owner: 'Michael Roberts', email: 'michael@sunrisecafe.com', phone: '(305) 555-0147', address: '2847 SW 8th St, Miami, FL 33135', agent: 'Sarah Johnson', agentSplit: 50, onboarded: '2025-08-12', processor: 'North / NAB', platform: 'Clover Flex + Clover Station Duo', pricingModel: 'Tiered + Pass-Through', mcc: '5812', riskLevel: 'Low', lensScore: 78, chargebackRate: 0.004, planTier: 'Growth' },
  'merchant-002': { name: 'TechStart Solutions', dba: 'TechStart', legalName: 'TechStart Solutions Inc.', mid: '4485-9932-1187', status: 'Active', industry: 'Technology / SaaS', owner: 'David Kim', email: 'david@techstart.io', phone: '(305) 555-0298', address: '1200 Brickell Ave #1420, Miami, FL 33131', agent: 'Michael Chen', agentSplit: 50, onboarded: '2025-06-20', processor: 'North / NAB', platform: 'Clover Virtual Terminal', pricingModel: 'Interchange Plus', mcc: '5734', riskLevel: 'Low', lensScore: 85, chargebackRate: 0.002, planTier: 'Pro' },
  'merchant-003': { name: 'Urban Fitness Center', dba: 'Urban Fitness', legalName: 'Urban Fitness Center LLC', mid: '4485-6643-0521', status: 'Active', industry: 'Health & Fitness', owner: 'Rachel Torres', email: 'rachel@urbanfitness.com', phone: '(305) 555-0366', address: '990 NE 125th St, North Miami, FL 33161', agent: 'Sarah Johnson', agentSplit: 50, onboarded: '2025-07-15', processor: 'North / NAB', platform: 'Clover Station Duo', pricingModel: 'Tiered', mcc: '7941', riskLevel: 'Low', lensScore: 72, chargebackRate: 0.006, planTier: 'Growth' },
  'merchant-005': { name: 'Bella Vista Restaurant', dba: 'Bella Vista', legalName: 'Bella Vista Restaurant Group LLC', mid: '4485-3314-0877', status: 'Active', industry: 'Food & Beverage / Restaurant', owner: 'Marco Deluca', email: 'marco@bellavista.com', phone: '(305) 555-0412', address: '3100 Coral Way, Coral Gables, FL 33145', agent: 'Michael Chen', agentSplit: 50, onboarded: '2025-05-10', processor: 'North / NAB', platform: 'Clover Station Duo + Clover Flex', pricingModel: 'Tiered + Pass-Through', mcc: '5812', riskLevel: 'Low', lensScore: 81, chargebackRate: 0.003, planTier: 'Pro' },
  'merchant-006': { name: 'Green Leaf Landscaping', dba: 'Green Leaf', legalName: 'Green Leaf Landscaping Services LLC', mid: '4485-8827-0234', status: 'Active', industry: 'Services / Landscaping', owner: 'Carlos Mendez', email: 'carlos@greenleafmiami.com', phone: '(305) 555-0533', address: '7400 SW 117th Ave, Kendall, FL 33183', agent: 'Sarah Johnson', agentSplit: 50, onboarded: '2025-09-01', processor: 'North / NAB', platform: 'Clover Go', pricingModel: 'Flat Rate', mcc: '0780', riskLevel: 'Low', lensScore: 65, chargebackRate: 0.001, planTier: 'Free' },
  'merchant-007': { name: 'Metro Diner Group', dba: 'Metro Diner', legalName: 'Metro Diner Group Inc.', mid: '4485-2256-0991', status: 'Active', industry: 'Food & Beverage / Restaurant', owner: 'James Park', email: 'james@metrodiner.com', phone: '(305) 555-0644', address: '5820 NW 7th Ave, Miami, FL 33127', agent: 'James Miller', agentSplit: 50, onboarded: '2025-04-22', processor: 'North / NAB', platform: 'Clover Station Duo x2', pricingModel: 'Interchange Plus', mcc: '5812', riskLevel: 'Medium', lensScore: 70, chargebackRate: 0.008, planTier: 'Pro' },
  'merchant-008': { name: 'Luxe Nail Studio', dba: 'Luxe Nails', legalName: 'Luxe Nail Studio LLC', mid: '4485-1178-0445', status: 'Active', industry: 'Personal Care / Salon', owner: 'Lisa Nguyen', email: 'lisa@luxenails.com', phone: '(305) 555-0755', address: '1040 Lincoln Rd, Miami Beach, FL 33139', agent: 'Michael Chen', agentSplit: 50, onboarded: '2025-08-05', processor: 'North / NAB', platform: 'Clover Mini', pricingModel: 'Flat Rate', mcc: '7230', riskLevel: 'Low', lensScore: 74, chargebackRate: 0.002, planTier: 'Growth' },
  'merchant-009': { name: 'Harbor Marine Supply', dba: 'Harbor Marine', legalName: 'Harbor Marine Supply Corp.', mid: '4485-5589-0668', status: 'Active', industry: 'Retail / Marine', owner: 'Tom Sullivan', email: 'tom@harbormarine.com', phone: '(305) 555-0866', address: '15400 Biscayne Blvd, Aventura, FL 33160', agent: 'James Miller', agentSplit: 50, onboarded: '2025-10-15', processor: 'North / NAB', platform: 'Clover Station Duo', pricingModel: 'Tiered', mcc: '5551', riskLevel: 'Low', lensScore: 69, chargebackRate: 0.005, planTier: 'Growth' },
};

// Residual data per merchant
function getResiduals(id: string): MonthlyResidual[] {
  const base: Record<string, MonthlyResidual[]> = {
    'merchant-001': [
      { month: 'Mar 2026', volume: 37500, txns: 812, grossRev: 1282.50, procFees: 487.50, netRev: 795.00, agentShare: 397.50, deltNet: 397.50, effRate: 0.0342, avgTicket: 46.18 },
      { month: 'Feb 2026', volume: 33400, txns: 724, grossRev: 1123.46, procFees: 434.10, netRev: 689.36, agentShare: 344.68, deltNet: 344.68, effRate: 0.0336, avgTicket: 46.13 },
      { month: 'Jan 2026', volume: 31200, txns: 688, grossRev: 1060.80, procFees: 405.60, netRev: 655.20, agentShare: 327.60, deltNet: 327.60, effRate: 0.0340, avgTicket: 45.35 },
      { month: 'Dec 2025', volume: 39800, txns: 876, grossRev: 1393.00, procFees: 517.40, netRev: 875.60, agentShare: 437.80, deltNet: 437.80, effRate: 0.0350, avgTicket: 45.43 },
      { month: 'Nov 2025', volume: 28900, txns: 642, grossRev: 982.60, procFees: 375.70, netRev: 606.90, agentShare: 303.45, deltNet: 303.45, effRate: 0.0340, avgTicket: 45.02 },
      { month: 'Oct 2025', volume: 26100, txns: 578, grossRev: 887.40, procFees: 339.30, netRev: 548.10, agentShare: 274.05, deltNet: 274.05, effRate: 0.0340, avgTicket: 45.16 },
    ],
  };
  if (base[id]) return base[id];
  // Generate synthetic data for other merchants
  const seed = id.charCodeAt(id.length - 1);
  const baseVol = 25000 + seed * 1200;
  return ['Mar 2026', 'Feb 2026', 'Jan 2026', 'Dec 2025', 'Nov 2025', 'Oct 2025'].map((month, i) => {
    const vol = Math.round(baseVol * (1 - i * 0.06) * (0.92 + Math.sin(seed + i) * 0.12));
    const txns = Math.round(vol / (38 + seed % 15));
    const grossRev = vol * (0.033 + (seed % 5) * 0.001);
    const procFees = grossRev * (0.37 + (seed % 3) * 0.02);
    const netRev = grossRev - procFees;
    return { month, volume: vol, txns, grossRev: +grossRev.toFixed(2), procFees: +procFees.toFixed(2), netRev: +netRev.toFixed(2), agentShare: +(netRev / 2).toFixed(2), deltNet: +(netRev / 2).toFixed(2), effRate: +(grossRev / vol).toFixed(4), avgTicket: +(vol / txns).toFixed(2) };
  });
}

const INTERCHANGE_BREAKDOWN: InterchangeRow[] = [
  { category: 'Visa Credit — Qual', volume: 14250, pct: 0.38, rate: '1.65% + $0.10', cost: 248.63 },
  { category: 'Visa Credit — Mid-Qual', volume: 3375, pct: 0.09, rate: '2.30% + $0.10', cost: 81.00 },
  { category: 'Visa Debit — Regulated', volume: 7500, pct: 0.20, rate: '0.05% + $0.22', cost: 19.51 },
  { category: 'MC Credit — Qual', volume: 8625, pct: 0.23, rate: '1.73% + $0.10', cost: 157.80 },
  { category: 'MC Debit — Regulated', volume: 2250, pct: 0.06, rate: '0.05% + $0.22', cost: 6.08 },
  { category: 'Amex OptBlue', volume: 1500, pct: 0.04, rate: '2.40% + $0.10', cost: 37.50 },
];

// ─── PUBLISHED INTERCHANGE REFERENCE (April 2026) ───
const IC_SCHEDULE = { version: 'April 2026', effectiveDate: 'April 18, 2026', nextUpdate: 'October 2026', lastChecked: '2026-04-15' };

const PUBLISHED_RATES: Record<string, { network: string; published: { rate: number; txnFee: number }; program: string; notes: string; range?: { low: number; high: number }; commonPadding: string }> = {
  'Visa Credit — Qual': { network: 'Visa', published: { rate: 1.51, txnFee: 0.10 }, program: 'CPS Retail / CPS Retail 2', notes: 'Card present, swiped/dipped/tapped.', commonPadding: 'Processors often blend Rewards 1 (1.65%) into this bucket at a higher blended rate' },
  'Visa Credit — Mid-Qual': { network: 'Visa', published: { rate: 1.99, txnFee: 0.10 }, program: 'CPS Rewards 2 / EIRF', notes: 'Rewards cards or keyed-in transactions.', range: { low: 1.65, high: 2.30 }, commonPadding: "This is the #1 bucket for padding — processors exploit the ambiguity" },
  'Visa Debit — Regulated': { network: 'Visa', published: { rate: 0.05, txnFee: 0.22 }, program: 'Regulated Debit (Durbin)', notes: 'Durbin-regulated debit. Rate set by Federal Reserve.', commonPadding: 'This rate is federally regulated — ZERO reason for variance.' },
  'MC Credit — Qual': { network: 'Mastercard', published: { rate: 1.58, txnFee: 0.10 }, program: 'Merit III / Core', notes: 'Card present, standard consumer credit.', commonPadding: "Watch for World/World Elite cards being bucketed here at a padded rate" },
  'MC Debit — Regulated': { network: 'Mastercard', published: { rate: 0.05, txnFee: 0.22 }, program: 'Regulated Debit (Durbin)', notes: 'Same Durbin regulation as Visa.', commonPadding: 'Identical to Visa regulated — any variance is pure markup.' },
  'Amex OptBlue': { network: 'Amex', published: { rate: 2.30, txnFee: 0.10 }, program: 'OptBlue Tier 3', notes: 'Amex OptBlue for merchants under $1M/yr.', range: { low: 1.60, high: 3.30 }, commonPadding: 'Amex has the widest tier spread — always verify which OptBlue tier' },
};

function parseRate(s: string): { rate: number; txnFee: number } {
  const m = s.match(/([\d.]+)%\s*\+\s*\$([\d.]+)/);
  return m ? { rate: parseFloat(m[1]), txnFee: parseFloat(m[2]) } : { rate: 0, txnFee: 0 };
}

interface Verification { status: string; severity: number; message: string; publishedRate: number; publishedTxnFee: number; diffBps: number; ratePadding: number; txnPadding: number; totalPadding: number; annualImpact: number; estTxns: number; commonPadding: string; program: string; notes: string; hasRange: boolean; range?: { low: number; high: number } }

function verifyLine(line: InterchangeRow, avgTicket: number): Verification {
  const ref = PUBLISHED_RATES[line.category];
  const parsed = parseRate(line.rate);
  const empty: Verification = { status: 'unknown', severity: 0, message: 'No reference rate found', publishedRate: 0, publishedTxnFee: 0, diffBps: 0, ratePadding: 0, txnPadding: 0, totalPadding: 0, annualImpact: 0, estTxns: 0, commonPadding: '', program: '', notes: '', hasRange: false };
  if (!ref) return empty;
  const pub = ref.published;
  const diffBps = Math.round(parsed.rate * 100) - Math.round(pub.rate * 100);
  const diffTxnFee = Math.round(((parsed.txnFee || 0) - (pub.txnFee || 0)) * 100);
  const estTxns = avgTicket > 0 ? Math.round(line.volume / avgTicket) : 0;
  const ratePadding = Math.max(line.volume * (diffBps / 10000), 0);
  const txnPadding = Math.max(estTxns * (parsed.txnFee - pub.txnFee), 0);
  const totalPadding = ratePadding + txnPadding;
  const annualImpact = totalPadding * 12;
  const hasRange = !!ref.range;
  const withinRange = hasRange && ref.range && parsed.rate >= ref.range.low && parsed.rate <= ref.range.high;
  let status: string, severity: number, message: string;
  if (diffBps === 0 && diffTxnFee === 0) { status = 'verified'; severity = 0; message = 'Exact match to published rate'; }
  else if (diffBps <= 2 && diffTxnFee <= 0) { status = 'verified'; severity = 0; message = 'Within rounding tolerance'; }
  else if (hasRange && withinRange && diffBps <= 10) { status = 'acceptable'; severity = 1; message = `Within range (${ref.range!.low}%–${ref.range!.high}%). ${diffBps} bps above base.`; }
  else if (hasRange && withinRange) { status = 'review'; severity = 2; message = `Within range but ${diffBps} bps above base. Request card-level detail.`; }
  else if (diffBps > 0 && diffBps <= 5) { status = 'review'; severity = 1; message = `${diffBps} bps above published. Minor variance.`; }
  else if (diffBps > 5 && diffBps <= 15) { status = 'flag'; severity = 2; message = `${diffBps} bps above published. Likely padding.`; }
  else if (diffBps > 15) { status = 'alert'; severity = 3; message = `${diffBps} bps above published — significant overcharge.`; }
  else if (diffBps < 0) { status = 'verified'; severity = 0; message = `${Math.abs(diffBps)} bps below published. Favorable.`; }
  else { status = 'review'; severity = 1; message = 'Review manually'; }
  if (line.category.includes('Regulated') && (diffBps > 0 || diffTxnFee > 0)) { status = 'alert'; severity = 3; message = `Regulated debit is federally set. ANY variance is pure markup. Reported: ${parsed.rate}% + $${parsed.txnFee} vs Published: ${pub.rate}% + $${pub.txnFee.toFixed(2)}`; }
  return { status, severity, message, publishedRate: pub.rate, publishedTxnFee: pub.txnFee, diffBps, ratePadding, txnPadding, totalPadding, annualImpact, estTxns, commonPadding: ref.commonPadding, program: ref.program, notes: ref.notes, hasRange, range: ref.range };
}

const statusIcon = (s: string) => s === 'verified' || s === 'acceptable' ? '✓' : s === 'review' ? '?' : s === 'flag' ? '⚑' : s === 'alert' ? '✕' : '—';
const statusColor = (s: string) => s === 'verified' || s === 'acceptable' ? '#22c55e' : s === 'review' ? '#f59e0b' : s === 'flag' ? '#f97316' : s === 'alert' ? '#ef4444' : '#6b7280';

const FEE_SCHEDULE: FeeItem[] = [
  { fee: 'Monthly Minimum', amount: 25.00, type: 'fixed' },
  { fee: 'Statement Fee', amount: 10.00, type: 'fixed' },
  { fee: 'PCI Compliance Fee', amount: 14.95, type: 'fixed' },
  { fee: 'Batch Settlement Fee', amount: 0.25, type: 'per-batch', note: '~30 batches/mo' },
  { fee: 'Gateway Fee', amount: 0.03, type: 'per-txn' },
  { fee: 'Chargeback Fee', amount: 25.00, type: 'per-incident' },
  { fee: 'Retrieval Fee', amount: 15.00, type: 'per-incident' },
  { fee: 'Annual Fee', amount: 99.00, type: 'annual', note: 'Billed August' },
];

const CHARGEBACKS: ChargebackItem[] = [
  { date: '2026-03-22', amount: 87.50, reason: '4837 — No Cardholder Auth', status: 'Won', resolution: '2026-04-05' },
  { date: '2026-01-14', amount: 142.00, reason: '4853 — Not as Described', status: 'Lost', resolution: '2026-02-10' },
  { date: '2025-11-30', amount: 56.25, reason: '4840 — Fraudulent Processing', status: 'Won', resolution: '2025-12-18' },
];

function getEquipment(merchant: MerchantData): EquipmentItem[] {
  const base: EquipmentItem[] = [
    { device: 'Clover Station Duo', serial: 'C06-2841-XR', location: 'Front Counter', status: 'Active', deployed: '2025-08-15', warranty: '2027-08-15', connectivity: 'Ethernet', firmware: 'v4.12.3', lastPing: '2 min ago' },
    { device: 'Clover Flex (LTE)', serial: 'CFX-9917-BM', location: 'Mobile', status: 'Active', deployed: '2025-09-02', warranty: '2027-09-02', connectivity: 'LTE + WiFi', firmware: 'v4.12.3', lastPing: '8 min ago' },
  ];
  if (merchant.platform.includes('Mini')) base.push({ device: 'Clover Mini (WiFi)', serial: 'CMN-4402-KL', location: 'Secondary', status: 'Active', deployed: '2026-01-10', warranty: '2028-01-10', connectivity: 'WiFi', firmware: 'v4.11.8', lastPing: '1 min ago' });
  return base;
}

const BATCHES_RECENT: BatchItem[] = [
  { date: 'Apr 14', txns: 28, amount: 1294.50, settled: true, time: '11:02 PM' },
  { date: 'Apr 13', txns: 31, amount: 1387.00, settled: true, time: '11:01 PM' },
  { date: 'Apr 12', txns: 24, amount: 1102.75, settled: true, time: '11:03 PM' },
  { date: 'Apr 11', txns: 33, amount: 1521.25, settled: true, time: '11:01 PM' },
  { date: 'Apr 10', txns: 27, amount: 1245.80, settled: true, time: '11:02 PM' },
  { date: 'Apr 9', txns: 22, amount: 998.50, settled: true, time: '11:04 PM' },
  { date: 'Apr 8', txns: 30, amount: 1356.20, settled: true, time: '11:01 PM' },
];

// ── Interchange Downgrade Data ──
const DOWNGRADE_ALERTS = [
  { txnDate: 'Mar 28', cardType: 'Visa Business', amount: 847.50, qualifiedAt: 'EIRF (Mid-Qual)', shouldBe: 'CPS Retail', cause: 'Missing Level II data on B2B card', lostBps: 65, lostDollars: 5.51 },
  { txnDate: 'Mar 22', cardType: 'MC World Elite', amount: 1240.00, qualifiedAt: 'Standard', shouldBe: 'Merit III', cause: 'Non-EMV fallback — chip read failed', lostBps: 45, lostDollars: 5.58 },
  { txnDate: 'Mar 18', cardType: 'Visa Signature', amount: 392.00, qualifiedAt: 'EIRF', shouldBe: 'CPS Rewards 1', cause: 'Keyed entry when terminal available', lostBps: 55, lostDollars: 2.16 },
  { txnDate: 'Mar 15', cardType: 'Visa Business', amount: 1650.00, qualifiedAt: 'EIRF (Mid-Qual)', shouldBe: 'CPS Retail', cause: 'Missing Level II data on B2B card', lostBps: 65, lostDollars: 10.73 },
  { txnDate: 'Mar 11', cardType: 'MC Corporate', amount: 2100.00, qualifiedAt: 'Standard', shouldBe: 'Data Rate I', cause: 'Missing Level II data on B2B card', lostBps: 70, lostDollars: 14.70 },
  { txnDate: 'Mar 8', cardType: 'Visa Credit', amount: 156.80, qualifiedAt: 'Mid-Qual', shouldBe: 'CPS Retail', cause: 'Keyed entry when terminal available', lostBps: 55, lostDollars: 0.86 },
];
const DOWNGRADE_MONTHLY_LOSS = DOWNGRADE_ALERTS.reduce((s, d) => s + d.lostDollars, 0);

// ── Approval/Decline Data ──
const APPROVAL_DECLINE = {
  total: 812, approved: 764, declined: 41, referred: 7,
  declineReasons: [
    { reason: 'Insufficient Funds', count: 18, pct: 43.9, revenue: 832.40 },
    { reason: 'AVS Mismatch', count: 8, pct: 19.5, revenue: 412.00 },
    { reason: 'Velocity Limit', count: 6, pct: 14.6, revenue: 287.50 },
    { reason: 'Card Expired', count: 5, pct: 12.2, revenue: 198.75 },
    { reason: 'Fraud Block', count: 3, pct: 7.3, revenue: 156.00 },
    { reason: 'Other', count: 1, pct: 2.4, revenue: 45.00 },
  ],
};
const TOTAL_DECLINED_REVENUE = APPROVAL_DECLINE.declineReasons.reduce((s, d) => s + d.revenue, 0);

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════
export function MerchantResidualDetail() {
  const { navigate, currentPage } = useAppNavigate();
  const [activeTab, setActiveTab] = useState<'residuals' | 'interchange' | 'equipment' | 'chargebacks' | 'batches'>('residuals');
  const [verifyMode, setVerifyMode] = useState(false);
  const [expandedVerifyRow, setExpandedVerifyRow] = useState<number | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [disputeModal, setDisputeModal] = useState<{ open: boolean; chargeback: ChargebackItem | null }>({ open: false, chargeback: null });

  const merchantId = currentPage.split('/residuals/')[1] || 'merchant-001';
  const M = MERCHANTS[merchantId] || MERCHANTS['merchant-001'];
  const residuals = useMemo(() => getResiduals(merchantId), [merchantId]);
  const equipment = useMemo(() => getEquipment(M), [merchantId]);

  const latestMonth = residuals[0];
  const prevMonth = residuals[1];
  const volDelta = prevMonth.volume > 0 ? (latestMonth.volume - prevMonth.volume) / prevMonth.volume : 0;
  const revDelta = prevMonth.netRev > 0 ? (latestMonth.netRev - prevMonth.netRev) / prevMonth.netRev : 0;
  const totalInterchangeCost = INTERCHANGE_BREAKDOWN.reduce((s, r) => s + r.cost, 0);

  const verifications = useMemo(() => INTERCHANGE_BREAKDOWN.map(line => ({ ...line, v: verifyLine(line, latestMonth.avgTicket) })), [latestMonth.avgTicket]);
  const totalPadding = verifications.reduce((s, v) => s + v.v.totalPadding, 0);
  const annualPadding = totalPadding * 12;
  const flagCount = verifications.filter(v => ['flag', 'alert', 'review'].includes(v.v.status)).length;
  const alertCount = verifications.filter(v => v.v.status === 'alert').length;

  const tabs = [
    { key: 'residuals' as const, label: 'Residual Detail', icon: DollarSign },
    { key: 'interchange' as const, label: 'Interchange & Rates', icon: BarChart3 },
    { key: 'equipment' as const, label: 'Equipment & Terminals', icon: Monitor },
    { key: 'chargebacks' as const, label: 'Chargebacks & Risk', icon: Shield },
    { key: 'batches' as const, label: 'Batch History', icon: FileText },
  ];

  const handleExportStatement = () => {
    const header = ['Period', 'Volume', 'Txns', 'Gross Rev', 'Proc Fees', 'Net Rev', 'Agent Share', 'Delt Net', 'Eff Rate', 'Avg Ticket'];
    const rows = residuals.map(r => [r.month, r.volume, r.txns, r.grossRev, r.procFees, r.netRev, r.agentShare, r.deltNet, r.effRate, r.avgTicket]);
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${M.mid}-residual-statement.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Exported', { description: `${M.name} residual statement downloaded as CSV.` });
  };

  return (
    <div className="h-full overflow-y-auto bg-canvas">
      <div className="max-w-[1440px] mx-auto px-6 py-6">
        {/* ── Breadcrumb + Back ── */}
        <div className="mb-1">
          <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
            <button onClick={() => navigate('/residuals')} className="text-brand hover:underline font-medium">Residuals</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-600 font-medium">{M.name}</span>
          </div>
          <button
            onClick={() => navigate('/residuals')}
            className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand-hover font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Residuals
          </button>
        </div>

        {/* ── Merchant Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-4 mt-4 mb-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1.5">
              <h1 className="text-2xl font-bold text-gray-900">{M.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-600">{M.industry.split('/')[0].trim()}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {M.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
              <span>MID: <span className="font-mono text-xs text-gray-700 font-medium">{M.mid}</span></span>
              <span>MCC: <span className="font-medium text-gray-700">{M.mcc}</span></span>
              <span>Agent: <span className="font-medium text-brand">{M.agent}</span> ({M.agentSplit}% split)</span>
              <span>Processor: <span className="font-medium text-gray-700">{M.processor}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.info('Edit merchant', { description: `Editing ${M.name} — merchant profile editor coming soon.` })}
              className="px-3.5 py-2 border border-gray-200 rounded-[6px] text-sm text-gray-600 bg-white hover:bg-gray-50 inline-flex items-center gap-2 font-medium transition-colors"
            >
              <Edit3 className="w-4 h-4" /> Edit
            </button>
            <button onClick={handleExportStatement} className="px-3.5 py-2 bg-brand text-white rounded-[6px] text-sm font-medium hover:bg-brand-hover inline-flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4" /> Export Statement
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-5">
          <KpiCard label="Monthly Volume" value={fmt0(latestMonth.volume)} delta={volDelta} sub="vs. last month" accent="indigo" />
          <KpiCard label="Net Revenue" value={fmt(latestMonth.netRev)} delta={revDelta} sub="Delt + Agent" accent="emerald" />
          <KpiCard label="Effective Rate" value={fmtPct(latestMonth.effRate)} sub={`Avg ticket ${fmt(latestMonth.avgTicket)}`} accent="blue" />
          <KpiCard label="Delt Net" value={fmt(latestMonth.deltNet)} sub={`${M.agentSplit}% after agent split`} accent="indigo" />
          <LensScoreCard score={M.lensScore} />
          <KpiCard label="Chargeback Rate" value={fmtPct(M.chargebackRate)} sub="Industry avg: 0.6%" accent={M.chargebackRate > 0.008 ? 'red' : 'emerald'} />
        </div>

        {/* ── Tab Bar ── */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-0">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-[1px] flex items-center gap-1.5 ${
                  activeTab === t.key
                    ? 'text-brand border-brand'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ RESIDUAL DETAIL TAB ═══ */}
        {activeTab === 'residuals' && (
          <div className="space-y-6">
            {/* Approval/Decline Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
              <Card title="Approval / Decline Breakdown" sub="March 2026 transaction outcomes">
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex-1">
                    <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                      <div className="bg-emerald-500 transition-all" style={{ width: `${(APPROVAL_DECLINE.approved / APPROVAL_DECLINE.total) * 100}%` }} />
                      <div className="bg-red-400 transition-all" style={{ width: `${(APPROVAL_DECLINE.declined / APPROVAL_DECLINE.total) * 100}%` }} />
                      <div className="bg-amber-400 transition-all" style={{ width: `${(APPROVAL_DECLINE.referred / APPROVAL_DECLINE.total) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-emerald-50 rounded-[6px] p-3 text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Approved</p>
                    <p className="text-xl font-bold text-emerald-700">{APPROVAL_DECLINE.approved}</p>
                    <p className="text-[10px] text-emerald-600">{((APPROVAL_DECLINE.approved / APPROVAL_DECLINE.total) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-red-50 rounded-[6px] p-3 text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Declined</p>
                    <p className="text-xl font-bold text-red-600">{APPROVAL_DECLINE.declined}</p>
                    <p className="text-[10px] text-red-500">{((APPROVAL_DECLINE.declined / APPROVAL_DECLINE.total) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-amber-50 rounded-[6px] p-3 text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Referred</p>
                    <p className="text-xl font-bold text-amber-600">{APPROVAL_DECLINE.referred}</p>
                    <p className="text-[10px] text-amber-500">{((APPROVAL_DECLINE.referred / APPROVAL_DECLINE.total) * 100).toFixed(1)}%</p>
                  </div>
                </div>
                <div className="bg-red-50/50 border border-red-100 rounded-[6px] px-3 py-2 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <p className="text-xs text-red-700"><span className="font-semibold">{fmt(TOTAL_DECLINED_REVENUE)}</span> estimated lost revenue from declines this month</p>
                </div>
              </Card>

              <Card title="Decline Reason Distribution" sub="Top reasons for transaction failures">
                <div className="space-y-2.5">
                  {APPROVAL_DECLINE.declineReasons.map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700 font-medium">{d.reason}</span>
                          <span className="text-xs tabular-nums text-gray-500">{d.count} ({d.pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${d.pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs tabular-nums font-semibold text-red-600 shrink-0 w-16 text-right">{fmt(d.revenue)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            {/* Monthly History Table */}
            <Card title="Monthly Residual History" sub="Rolling 6-month processor residual history">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Period', 'Volume', 'Txns', 'Gross Rev', 'Proc Fees', 'Net Rev', 'Agent', 'Delt Net', 'Eff Rate', 'Avg Ticket'].map(h => (
                        <Th key={h}>{h}</Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {residuals.map((r, i) => (
                      <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50/50 ${i === 0 ? 'bg-indigo-50/30' : ''}`}>
                        <td className={`px-3 py-2.5 text-sm font-semibold ${i === 0 ? 'text-brand' : 'text-gray-900'}`}>{r.month}</td>
                        <td className="px-3 py-2.5 text-sm tabular-nums text-gray-900">{fmt0(r.volume)}</td>
                        <td className="px-3 py-2.5 text-sm tabular-nums text-gray-600">{fmtNum(r.txns)}</td>
                        <td className="px-3 py-2.5 text-sm tabular-nums text-gray-900">{fmt(r.grossRev)}</td>
                        <td className="px-3 py-2.5 text-sm tabular-nums text-red-600">{fmt(r.procFees)}</td>
                        <td className="px-3 py-2.5 text-sm tabular-nums font-semibold text-gray-900">{fmt(r.netRev)}</td>
                        <td className="px-3 py-2.5 text-sm tabular-nums text-brand">{fmt(r.agentShare)}</td>
                        <td className="px-3 py-2.5 text-sm tabular-nums font-semibold text-emerald-600">{fmt(r.deltNet)}</td>
                        <td className="px-3 py-2.5 text-sm tabular-nums text-gray-700">{fmtPct(r.effRate)}</td>
                        <td className="px-3 py-2.5 text-sm tabular-nums text-gray-700">{fmt(r.avgTicket)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* Volume Trend */}
              <Card title="Volume Trend" sub="Last 6 months">
                <div className="flex items-end justify-between gap-1 h-16 px-1">
                  {[...residuals].reverse().map((r, i, arr) => {
                    const mx = Math.max(...arr.map(x => x.volume));
                    const isLast = i === arr.length - 1;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full max-w-[24px] rounded ${isLast ? 'bg-brand' : 'bg-brand/20'}`}
                          style={{ height: `${Math.max((r.volume / mx) * 100, 6)}%`, transition: 'height 0.5s ease' }}
                        />
                        <span className="text-[9px] text-gray-400">{r.month.slice(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Account Details */}
              <Card title="Account Details">
                <div className="space-y-2.5">
                  {[
                    { l: 'Legal Name', v: M.legalName },
                    { l: 'DBA', v: M.dba },
                    { l: 'MID', v: M.mid, mono: true },
                    { l: 'MCC Code', v: `${M.mcc} — Eating Places, Restaurants` },
                    { l: 'Pricing Model', v: M.pricingModel },
                    { l: 'Owner', v: M.owner },
                    { l: 'Contact', v: M.email },
                    { l: 'Phone', v: M.phone },
                    { l: 'Address', v: M.address },
                    { l: 'Onboarded', v: new Date(M.onboarded + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                    { l: 'Risk Tier', v: M.riskLevel },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between items-start gap-3">
                      <span className="text-xs text-gray-500 shrink-0 min-w-[90px]">{r.l}</span>
                      <span className={`text-xs text-right font-medium text-gray-900 ${r.mono ? 'font-mono' : ''}`}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Agent Commission */}
              <Card title="Agent Commission Structure">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-[8px] bg-indigo-50 flex items-center justify-center text-sm font-bold text-brand">
                    {M.agent.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{M.agent}</p>
                    <p className="text-[11px] text-gray-500">{M.agentSplit}/{100 - M.agentSplit} net revenue split</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-[8px] p-3 flex gap-3">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-gray-500 mb-0.5">Agent</p>
                    <p className="text-base font-bold text-brand">{fmt(latestMonth.agentShare)}</p>
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-gray-500 mb-0.5">Delt</p>
                    <p className="text-base font-bold text-emerald-600">{fmt(latestMonth.deltNet)}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          </div>
        )}

        {/* ═══ INTERCHANGE TAB ═══ */}
        {activeTab === 'interchange' && (
          <div className="space-y-6">
            {/* Interchange Card with Verify Toggle */}
            <div className="bg-white rounded-[8px] border border-gray-200">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Interchange Breakdown by Card Type</h3>
                  <p className="text-xs text-gray-500 mt-0.5">March 2026 · {fmt0(latestMonth.volume)} total volume</p>
                </div>
                <button
                  onClick={() => { setVerifyMode(!verifyMode); setExpandedVerifyRow(null); setShowSchedule(false); }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[6px] text-sm font-medium transition-all ${
                    verifyMode
                      ? 'bg-brand text-white shadow-sm'
                      : 'border border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  {verifyMode ? 'Verification ON' : 'Verify Interchange'}
                </button>
              </div>

              <div className="px-5 py-4">
                {/* Verification Summary Banner */}
                {verifyMode && (
                  <div className={`mb-4 border rounded-[8px] p-4 ${
                    alertCount > 0 ? 'border-red-200 bg-red-50/50' : flagCount > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-emerald-200 bg-emerald-50/50'
                  }`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          alertCount > 0 ? 'bg-red-100 text-red-600' : flagCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {alertCount > 0 ? '⚠' : flagCount > 0 ? '⚑' : '✓'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {alertCount > 0 ? `${alertCount} alert${alertCount > 1 ? 's' : ''} — potential interchange padding detected`
                              : flagCount > 0 ? `${flagCount} item${flagCount > 1 ? 's' : ''} need review`
                              : 'All interchange rates verified'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Compared against published {IC_SCHEDULE.version} Visa/MC/Amex schedule · Last updated {IC_SCHEDULE.lastChecked}
                          </p>
                        </div>
                      </div>
                      {totalPadding > 0 && (
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Est. Monthly Overcharge</p>
                          <p className="text-xl font-bold text-red-600 font-mono">${totalPadding.toFixed(2)}</p>
                          <p className="text-xs text-red-500 font-mono">${annualPadding.toFixed(0)}/yr</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200/60">
                      <button
                        onClick={() => setShowSchedule(!showSchedule)}
                        className="px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-white border border-gray-200 text-brand hover:bg-indigo-50 transition-colors"
                      >
                        {showSchedule ? 'Hide' : 'View'} Published Rates
                      </button>
                      <p className="text-xs text-gray-500">
                        Next rate update: <span className="font-semibold text-gray-700">{IC_SCHEDULE.nextUpdate}</span> · Set a reminder to re-verify after each April & October cycle
                      </p>
                    </div>
                  </div>
                )}

                {/* Published Rates Reference */}
                {verifyMode && showSchedule && (
                  <div className="mb-4 border border-indigo-100 bg-indigo-50/30 rounded-[8px] p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Published Interchange Reference — {IC_SCHEDULE.version}</h4>
                    <p className="text-xs text-gray-500 mb-3">Source: Visa USA & Mastercard US fee schedules · Effective {IC_SCHEDULE.effectiveDate}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Object.entries(PUBLISHED_RATES).map(([cat, ref]) => (
                        <div key={cat} className="bg-white border border-gray-200 rounded-[6px] p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ref.network === 'Visa' ? '#1a1f71' : ref.network === 'Mastercard' ? '#eb001b' : ref.network === 'Amex' ? '#006fcf' : '#ff6000' }} />
                            <span className="text-xs font-semibold text-gray-900">{cat}</span>
                          </div>
                          <p className="text-sm font-bold font-mono text-gray-800">{ref.published.rate}% + ${ref.published.txnFee.toFixed(2)}</p>
                          {ref.range && <p className="text-[10px] text-gray-500 mt-0.5">Range: {ref.range.low}% – {ref.range.high}%</p>}
                          <p className="text-[10px] text-gray-400 mt-1">{ref.program}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {verifyMode && <Th>Status</Th>}
                        <Th>Card Category</Th>
                        <Th>Volume</Th>
                        <Th>% of Total</Th>
                        <Th>Interchange Rate</Th>
                        {verifyMode && <Th>Published Rate</Th>}
                        {verifyMode && <Th>Variance</Th>}
                        {!verifyMode && <Th>IC Cost</Th>}
                        {!verifyMode && <Th>Margin to Merchant</Th>}
                      </tr>
                    </thead>
                    <tbody>
                      {verifications.map((line, i) => {
                        const v = line.v;
                        const isExpanded = expandedVerifyRow === i;
                        return (
                          <Fragment key={i}>
                            <tr
                              className={`border-b border-gray-50 hover:bg-gray-50/50 ${verifyMode ? 'cursor-pointer' : ''}`}
                              onClick={() => verifyMode && setExpandedVerifyRow(isExpanded ? null : i)}
                            >
                              {verifyMode && (
                                <td className="px-3 py-2.5">
                                  <span
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                                    style={{ background: `${statusColor(v.status)}15`, color: statusColor(v.status), border: `1.5px solid ${statusColor(v.status)}30` }}
                                  >
                                    {statusIcon(v.status)}
                                  </span>
                                </td>
                              )}
                              <td className="px-3 py-2.5 text-sm font-medium text-gray-900">{line.category}</td>
                              <td className="px-3 py-2.5 text-sm tabular-nums text-gray-700">{fmt0(line.volume)}</td>
                              <td className="px-3 py-2.5 text-sm tabular-nums text-gray-700">{fmtPct(line.pct)}</td>
                              <td className="px-3 py-2.5 text-sm tabular-nums text-gray-500">{line.rate}</td>
                              {verifyMode && (
                                <td className="px-3 py-2.5 text-sm tabular-nums text-gray-400">{v.publishedRate.toFixed(2)}% + ${v.publishedTxnFee.toFixed(2)}</td>
                              )}
                              {verifyMode && (
                                <td className="px-3 py-2.5 text-sm tabular-nums font-semibold" style={{ color: v.diffBps > 5 ? '#ef4444' : v.diffBps > 0 ? '#f59e0b' : '#22c55e' }}>
                                  {v.diffBps > 0 ? '+' : ''}{v.diffBps} bps
                                </td>
                              )}
                              {!verifyMode && <td className="px-3 py-2.5 text-sm tabular-nums text-red-600">{fmt(line.cost)}</td>}
                              {!verifyMode && <td className="px-3 py-2.5 text-sm tabular-nums font-semibold text-emerald-600">{fmt((line.volume * latestMonth.effRate) - line.cost)}</td>}
                            </tr>
                            {/* Expanded verification detail */}
                            {verifyMode && isExpanded && (
                              <tr>
                                <td colSpan={7} className="px-0 py-0">
                                  <div className="mx-3 mb-3 bg-gray-50 border border-gray-200 rounded-[8px] p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-1">Verification</p>
                                        <p className="text-sm font-bold mb-1" style={{ color: statusColor(v.status) }}>
                                          {statusIcon(v.status)} {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                                        </p>
                                        <p className="text-xs text-gray-600 leading-relaxed">{v.message}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-1">Published Program</p>
                                        <p className="text-sm font-semibold text-gray-900">{v.program}</p>
                                        {v.hasRange && <p className="text-xs text-gray-500 mt-0.5">Valid range: {v.range!.low}% – {v.range!.high}%</p>}
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{v.notes}</p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-1">Dollar Impact</p>
                                        <div className="space-y-1.5 text-xs">
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Rate padding:</span>
                                            <span className="font-mono font-semibold" style={{ color: v.ratePadding > 0 ? '#ef4444' : '#22c55e' }}>${v.ratePadding.toFixed(2)}/mo</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">Txn fee padding:</span>
                                            <span className="font-mono font-semibold" style={{ color: v.txnPadding > 0 ? '#ef4444' : '#22c55e' }}>${v.txnPadding.toFixed(2)}/mo</span>
                                          </div>
                                          <div className="flex justify-between pt-1.5 border-t border-gray-200 font-semibold">
                                            <span className="text-gray-700">Annual impact:</span>
                                            <span className="font-mono" style={{ color: v.annualImpact > 0 ? '#ef4444' : '#22c55e' }}>${v.annualImpact.toFixed(0)}/yr</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    {v.commonPadding && (
                                      <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                                        <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                        <span><span className="font-semibold text-gray-700">Common padding tactic:</span> {v.commonPadding}</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                      {/* Totals row */}
                      <tr className="bg-gray-50 font-semibold">
                        {verifyMode && <td className="px-3 py-2.5" />}
                        <td className="px-3 py-2.5 text-sm text-gray-900">Total</td>
                        <td className="px-3 py-2.5 text-sm tabular-nums text-gray-900">{fmt0(latestMonth.volume)}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-900">100%</td>
                        <td className="px-3 py-2.5" />
                        {verifyMode && <td className="px-3 py-2.5" />}
                        {verifyMode && (
                          <td className="px-3 py-2.5 text-sm tabular-nums font-bold" style={{ color: totalPadding > 0 ? '#ef4444' : '#22c55e' }}>
                            {totalPadding > 0 ? `$${totalPadding.toFixed(2)}/mo` : 'Clean'}
                          </td>
                        )}
                        {!verifyMode && <td className="px-3 py-2.5 text-sm tabular-nums text-red-600">{fmt(totalInterchangeCost)}</td>}
                        {!verifyMode && <td className="px-3 py-2.5 text-sm tabular-nums text-emerald-600">{fmt(latestMonth.grossRev - totalInterchangeCost)}</td>}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Interchange Downgrade Alerts */}
              <Card title="Interchange Downgrade Alerts"
                sub={`${DOWNGRADE_ALERTS.length} downgrades — ${fmt(DOWNGRADE_MONTHLY_LOSS)} lost this month`}
                right={<span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700">{fmt(DOWNGRADE_MONTHLY_LOSS)}/mo</span>}
              >
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-[8px] p-3">
                  <p className="text-xs text-amber-800 font-medium mb-1">Common Downgrade Causes</p>
                  <div className="flex flex-wrap gap-2">
                    {[{ cause: 'Missing Level II Data (B2B)', count: 3 },{ cause: 'Non-EMV Fallback', count: 1 },{ cause: 'Keyed Entry (Terminal Available)', count: 2 }].map((c, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-amber-200 rounded text-xs text-amber-800"><span className="font-semibold">{c.count}x</span> {c.cause}</span>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full"><thead><tr className="border-b border-gray-100 bg-gray-50">{['Date','Card Type','Amount','Qualified At','Should Be','Cause','Lost'].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
                    <tbody>{DOWNGRADE_ALERTS.map((d, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-red-50/30">
                        <td className="px-3 py-2.5 text-sm tabular-nums text-gray-700">{d.txnDate}</td>
                        <td className="px-3 py-2.5 text-sm font-medium text-gray-900">{d.cardType}</td>
                        <td className="px-3 py-2.5 text-sm tabular-nums text-gray-700">{fmt(d.amount)}</td>
                        <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700">{d.qualifiedAt}</span></td>
                        <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">{d.shouldBe}</span></td>
                        <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[200px]">{d.cause}</td>
                        <td className="px-3 py-2.5 text-sm tabular-nums font-semibold text-red-600">-{fmt(d.lostDollars)}</td>
                      </tr>
                    ))}</tbody>
                    <tfoot><tr className="border-t-2 border-gray-200 bg-red-50/30"><td colSpan={6} className="px-3 py-2.5 text-sm font-semibold text-gray-900">Total Monthly Downgrade Loss</td><td className="px-3 py-2.5 text-sm font-bold tabular-nums text-red-700">-{fmt(DOWNGRADE_MONTHLY_LOSS)}</td></tr></tfoot>
                  </table>
                </div>
              </Card>

              {/* Fee Schedule */}
              <Card title="Fee Schedule" sub="Monthly recurring + per-transaction fees">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Fee', 'Amount', 'Type'].map(h => <Th key={h}>{h}</Th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {FEE_SCHEDULE.map((f, i) => {
                      const typeLabel = f.type === 'fixed' ? 'Fixed' : f.type === 'per-txn' ? 'Per Txn' : f.type === 'per-batch' ? 'Per Batch' : f.type === 'per-incident' ? 'Per Incident' : 'Annual';
                      const typeBg = f.type === 'fixed' ? 'bg-blue-50 text-blue-700' : f.type === 'annual' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600';
                      return (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="px-3 py-2.5 text-sm font-medium text-gray-900">{f.fee}</td>
                          <td className="px-3 py-2.5 text-sm tabular-nums text-gray-700">{fmt(f.amount)}</td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeBg}`}>{typeLabel}</span>
                            {f.note && <span className="ml-2 text-[10px] text-gray-400">{f.note}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>

              {/* Fee Audit Summary */}
              <Card title="Fee Audit Summary" sub="Hidden costs impacting this merchant">
                <div className="space-y-3">
                  {[
                    { label: 'Interchange Downgrades', value: DOWNGRADE_MONTHLY_LOSS, note: `${DOWNGRADE_ALERTS.length} transactions this month` },
                    { label: 'PCI Non-Compliance Fee', value: 0, note: 'Currently compliant' },
                    { label: 'Batch Timing Penalties', value: 0, note: 'All batches settled on time' },
                    { label: 'Unnecessary Surcharges', value: 4.95, note: 'Annual fee prorated' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm text-gray-700">{item.label}</p>
                        <p className="text-[10px] text-gray-400">{item.note}</p>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${item.value > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {item.value > 0 ? `-${fmt(item.value)}` : '$0.00'}
                      </span>
                    </div>
                  ))}
                  <div className="border-t-2 border-gray-200 pt-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Total Hidden Costs</p>
                      <p className="text-[10px] text-gray-500">Quote this number for rate review pitches</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600 tabular-nums">{fmt(DOWNGRADE_MONTHLY_LOSS + 4.95)}/mo</p>
                      <p className="text-xs text-red-500 tabular-nums">{fmt((DOWNGRADE_MONTHLY_LOSS + 4.95) * 12)}/yr</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Rate Comparison Tool */}
              <Card title="Rate Comparison Tool" sub="Current vs. Delt standard vs. market">
                <div className="space-y-4">
                  {[
                    { label: 'Current Effective Rate', rate: latestMonth.effRate, monthlyCost: latestMonth.volume * latestMonth.effRate, color: 'bg-gray-600', tag: 'Current' },
                    { label: 'Delt Standard (IC+)', rate: 0.0295, monthlyCost: latestMonth.volume * 0.0295, color: 'bg-brand', tag: 'Delt' },
                    { label: 'Market Benchmark (MCC 5812)', rate: 0.0355, monthlyCost: latestMonth.volume * 0.0355, color: 'bg-gray-400', tag: 'Market' },
                  ].map((r, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                          <span className="text-sm text-gray-700">{r.label}</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-500 rounded">{r.tag}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold tabular-nums text-gray-900">{fmtPct(r.rate)}</span>
                          <span className="text-xs text-gray-400 ml-2 tabular-nums">{fmt(r.monthlyCost)}/mo</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${r.color} opacity-70`} style={{ width: `${Math.min((r.rate / 0.04) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-[8px] p-3 mt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">Potential Monthly Savings on Delt</p>
                        <p className="text-[10px] text-emerald-600">Based on current volume of {fmt0(latestMonth.volume)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-emerald-700 tabular-nums">{fmt(latestMonth.volume * latestMonth.effRate - latestMonth.volume * 0.0295)}/mo</p>
                        <p className="text-xs text-emerald-600 tabular-nums">{fmt((latestMonth.volume * latestMonth.effRate - latestMonth.volume * 0.0295) * 12)}/yr</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Rate Analysis */}
              <Card title="Rate Analysis" sub="Merchant pricing vs actual cost basis">
                <div className="space-y-4">
                  {[
                    { label: 'Merchant Effective Rate', value: fmtPct(latestMonth.effRate), bar: latestMonth.effRate, color: 'bg-gray-700' },
                    { label: 'Blended IC + Assessments', value: fmtPct(totalInterchangeCost / latestMonth.volume), bar: totalInterchangeCost / latestMonth.volume, color: 'bg-red-500' },
                    { label: 'Gross Margin (Spread)', value: fmtPct(latestMonth.effRate - totalInterchangeCost / latestMonth.volume), bar: latestMonth.effRate - totalInterchangeCost / latestMonth.volume, color: 'bg-emerald-500' },
                    { label: 'Net Margin After Agent', value: fmtPct(latestMonth.deltNet / latestMonth.volume), bar: latestMonth.deltNet / latestMonth.volume, color: 'bg-brand' },
                  ].map((r, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm text-gray-600">{r.label}</span>
                        <span className="text-sm font-bold tabular-nums text-gray-900">{r.value}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${r.color} opacity-70`} style={{ width: `${Math.min((r.bar / 0.04) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ═══ EQUIPMENT TAB ═══ */}
        {activeTab === 'equipment' && (
          <div className="space-y-6">
            <Card title="Terminal & Equipment Inventory" sub={`${equipment.length} active devices`}
              right={<span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-600">Platform: {M.platform.split('+')[0].trim()}</span>}
            >
              <div className="space-y-3">
                {equipment.map((eq, i) => (
                  <div key={i} className="border border-gray-200 rounded-[8px] p-4 grid grid-cols-2 md:grid-cols-5 gap-4 hover:bg-gray-50/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Monitor className="w-4 h-4 text-brand" />
                        <span className="text-sm font-bold text-gray-900">{eq.device}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono">{eq.serial}</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Location</p>
                      <p className="text-sm font-medium text-gray-900">{eq.location}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Connectivity</p>
                      <p className="text-sm font-medium text-gray-900">{eq.connectivity}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">FW {eq.firmware}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Warranty</p>
                      <p className="text-sm font-medium text-gray-900">{new Date(eq.warranty + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Deployed {new Date(eq.deployed + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Status</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]" />
                        <span className="text-sm font-semibold text-emerald-600">Online</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">Last ping: {eq.lastPing}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ═══ CHARGEBACKS TAB ═══ */}
        {activeTab === 'chargebacks' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            <Card title="Chargeback History" sub="Click any row to open the dispute workflow"
              right={
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${M.chargebackRate > 0.008 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {fmtPct(M.chargebackRate)} rate
                </span>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Date', 'Amount', 'Reason Code', 'Status', 'Resolved', ''].map(h => <Th key={h}>{h}</Th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {CHARGEBACKS.map((cb, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-indigo-50/40 cursor-pointer group transition-colors" onClick={() => setDisputeModal({ open: true, chargeback: cb })}>
                        <td className="px-3 py-2.5 text-sm tabular-nums text-gray-700">{new Date(cb.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-3 py-2.5 text-sm tabular-nums font-semibold text-gray-900">{fmt(cb.amount)}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-700">{cb.reason}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${cb.status === 'Won' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {cb.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-sm tabular-nums text-gray-600">{new Date(cb.resolution + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                        <td className="px-3 py-2.5"><span className="text-xs text-brand font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Open Dispute <ChevronRight className="w-3 h-3" /></span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="space-y-6">
              <Card title="Risk Summary">
                <div className="space-y-3">
                  {[
                    { l: 'Chargeback Rate', v: fmtPct(M.chargebackRate), c: M.chargebackRate > 0.008 ? 'text-red-600' : 'text-emerald-600' },
                    { l: 'Visa Threshold', v: M.chargebackRate > 0.009 ? 'At Risk' : 'Within Limits', c: M.chargebackRate > 0.009 ? 'text-red-600' : 'text-emerald-600' },
                    { l: 'MC Threshold', v: 'Within Limits', c: 'text-emerald-600' },
                    { l: 'Total Disputes (12mo)', v: '3', c: '' },
                    { l: 'Win Rate', v: '66.7%', c: 'text-emerald-600' },
                    { l: 'Total Exposure', v: fmt(CHARGEBACKS.reduce((s, c) => s + c.amount, 0)), c: '' },
                    { l: 'Risk Tier', v: M.riskLevel, c: 'text-emerald-600' },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-sm text-gray-500">{r.l}</span>
                      <span className={`text-sm font-semibold ${r.c || 'text-gray-900'}`}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Compliance Status">
                <div className="space-y-2.5">
                  {[
                    { l: 'PCI DSS', v: 'Compliant' },
                    { l: 'SAQ Type', v: 'SAQ B-IP' },
                    { l: 'Last PCI Scan', v: 'Mar 12, 2026' },
                    { l: 'EMV Enabled', v: 'All terminals' },
                    { l: '3D Secure', v: 'N/A (Card Present)' },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{r.l}</span>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-sm font-semibold text-emerald-600">{r.v}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ═══ BATCH HISTORY TAB ═══ */}
        {activeTab === 'batches' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            <Card title="Recent Batch History" sub="Last 7 days of batch settlements">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Date', 'Settled', 'Transactions', 'Amount', 'Avg Txn'].map(h => <Th key={h}>{h}</Th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {BATCHES_RECENT.map((b, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-3 py-2.5 text-sm font-semibold text-gray-900">{b.date}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-xs text-emerald-600 font-medium">{b.time}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-sm tabular-nums text-gray-700">{b.txns}</td>
                        <td className="px-3 py-2.5 text-sm tabular-nums font-semibold text-gray-900">{fmt(b.amount)}</td>
                        <td className="px-3 py-2.5 text-sm tabular-nums text-gray-700">{fmt(b.amount / b.txns)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="space-y-6">
              <Card title="7-Day Batch Summary">
                <div className="space-y-2.5">
                  {[
                    { l: 'Total Settled', v: fmt(BATCHES_RECENT.reduce((s, b) => s + b.amount, 0)) },
                    { l: 'Total Transactions', v: fmtNum(BATCHES_RECENT.reduce((s, b) => s + b.txns, 0)) },
                    { l: 'Avg Daily Volume', v: fmt(BATCHES_RECENT.reduce((s, b) => s + b.amount, 0) / BATCHES_RECENT.length) },
                    { l: 'Avg Batch Size', v: `${Math.round(BATCHES_RECENT.reduce((s, b) => s + b.txns, 0) / BATCHES_RECENT.length)} txns` },
                    { l: 'Settlement Time', v: 'Next Day', c: 'text-emerald-600' },
                    { l: 'Missed Batches', v: '0', c: 'text-emerald-600' },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-sm text-gray-500">{r.l}</span>
                      <span className={`text-sm font-semibold tabular-nums ${r.c || 'text-gray-900'}`}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Batch Volume (7d)">
                <div className="flex items-end justify-between gap-1.5 h-14 px-1">
                  {[...BATCHES_RECENT].reverse().map((b, i, arr) => {
                    const mx = Math.max(...arr.map(x => x.amount));
                    const isLast = i === arr.length - 1;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full max-w-[28px] rounded ${isLast ? 'bg-brand' : 'bg-brand/20'}`}
                          style={{ height: `${Math.max((b.amount / mx) * 100, 8)}%`, transition: 'height 0.5s ease' }}
                        />
                        <span className="text-[9px] text-gray-400">{b.date.split(' ')[1]}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}
        {/* ═══ DISPUTE WORKFLOW MODAL ═══ */}
        {disputeModal.open && disputeModal.chargeback && (() => {
          const cb = disputeModal.chargeback;
          const reasonCode = cb.reason.split(' — ')[0] || cb.reason;
          const reasonDesc = cb.reason.split(' — ')[1] || cb.reason;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30" onClick={() => setDisputeModal({ open: false, chargeback: null })} />
              <div className="relative bg-white rounded-[8px] shadow-2xl border border-gray-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Dispute Workflow</h2>
                    <p className="text-xs text-gray-500">Chargeback {fmt(cb.amount)} &mdash; {new Date(cb.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <button onClick={() => setDisputeModal({ open: false, chargeback: null })} className="p-2 hover:bg-gray-100 rounded-[6px]"><span className="text-gray-500 text-lg">&times;</span></button>
                </div>
                <div className="px-6 py-5 space-y-5">
                  {/* Dispute Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-[6px] p-3"><p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-1">Reason Code</p><p className="text-sm font-bold text-gray-900">{reasonCode}</p><p className="text-xs text-gray-500">{reasonDesc}</p></div>
                    <div className="bg-gray-50 rounded-[6px] p-3"><p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-1">Amount</p><p className="text-sm font-bold text-gray-900">{fmt(cb.amount)}</p><p className="text-xs text-gray-500">Original transaction</p></div>
                    <div className="bg-gray-50 rounded-[6px] p-3"><p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-1">Status</p><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cb.status === 'Won' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{cb.status}</span></div>
                    <div className="bg-gray-50 rounded-[6px] p-3"><p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-1">Response Deadline</p><p className="text-sm font-bold text-gray-900">30 days from filing</p></div>
                  </div>

                  {/* Evidence Builder */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Evidence Builder</h3>
                    <div className="space-y-2">
                      {[
                        { doc: 'Signed receipt / authorization', attached: true },
                        { doc: 'Delivery confirmation / tracking', attached: false },
                        { doc: 'Customer communication log', attached: true },
                        { doc: 'Transaction / AVS / CVV proof', attached: true },
                        { doc: 'Refund policy (signed by cardholder)', attached: false },
                      ].map((e, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${e.attached ? 'bg-brand border-brand' : 'border-gray-300'}`}>
                              {e.attached && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`text-sm ${e.attached ? 'text-gray-900' : 'text-gray-500'}`}>{e.doc}</span>
                          </div>
                          <button
                            onClick={() => e.attached
                              ? toast.info('Opening document', { description: e.doc })
                              : toast.success('Upload started', { description: `Attach "${e.doc}" to this dispute.` })}
                            className="text-xs text-brand font-medium hover:underline"
                          >{e.attached ? 'View' : 'Upload'}</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Representment Workflow */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Representment Timeline</h3>
                    <div className="space-y-0">
                      {[
                        { step: 'Chargeback Filed', date: new Date(cb.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), done: true },
                        { step: 'Evidence Collected', date: 'Within 5 days', done: cb.status === 'Won' },
                        { step: 'Representment Submitted', date: 'Within 10 days', done: cb.status === 'Won' },
                        { step: 'Issuer Review', date: '15-30 days', done: cb.status === 'Won' },
                        { step: 'Resolution', date: new Date(cb.resolution + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), done: true },
                      ].map((s, i, arr) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${s.done ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
                            {i < arr.length - 1 && <div className={`w-px h-6 ${s.done ? 'bg-brand' : 'bg-gray-200'}`} />}
                          </div>
                          <div className="pb-3"><p className={`text-sm font-medium ${s.done ? 'text-gray-900' : 'text-gray-400'}`}>{s.step}</p><p className="text-xs text-gray-400">{s.date}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3 sticky bottom-0 bg-white">
                  {cb.status !== 'Won' && <button onClick={() => { toast.success('Representment submitted', { description: `Dispute for ${fmt(cb.amount)} chargeback sent to issuer for review.` }); setDisputeModal({ open: false, chargeback: null }); }} className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-[6px] hover:bg-brand-hover transition-colors">Submit Representment</button>}
                  <button onClick={() => setDisputeModal({ open: false, chargeback: null })} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-[6px] hover:bg-gray-50 transition-colors">Close</button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}

// ══════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-left">{children}</th>;
}

function Card({ title, sub, children, right }: { title: string; sub?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[8px] border border-gray-200">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        {right}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function KpiCard({ label, value, sub, accent, delta }: { label: string; value: string; sub?: string; accent: string; delta?: number }) {
  const accentMap: Record<string, string> = {
    indigo: 'border-t-brand', emerald: 'border-t-emerald-500', amber: 'border-t-amber-500',
    red: 'border-t-red-500', blue: 'border-t-blue-500',
  };
  return (
    <div className={`bg-white rounded-[8px] border border-gray-200 border-t-2 ${accentMap[accent] || ''} p-4`}>
      <p className="text-[11px] text-gray-500 font-medium mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
        {delta !== undefined && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {delta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(delta * 100).toFixed(1)}%
          </span>
        )}
      </div>
      {sub && <p className="text-[11px] text-gray-400 mt-1.5">{sub}</p>}
    </div>
  );
}

function LensScoreCard({ score }: { score: number }) {
  const color = score >= 70 ? '#0E9F6E' : score >= 50 ? '#E3A008' : '#F05252';
  const circumference = 2 * Math.PI * 18;
  return (
    <div className="bg-white rounded-[8px] border border-gray-200 border-t-2 border-t-emerald-500 p-4">
      <p className="text-[11px] text-gray-500 font-medium mb-1.5">Lens Health Score</p>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#F0F2F8" strokeWidth="4" />
        <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
          strokeLinecap="round" transform="rotate(-90 22 22)" />
        <text x="22" y="26" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1A1F36" fontFamily="monospace">{score}</text>
      </svg>
      <p className="text-[11px] text-gray-400 mt-1">Out of 100 · {score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor'}</p>
    </div>
  );
}