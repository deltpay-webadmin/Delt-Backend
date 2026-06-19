import React, { useState, useMemo } from 'react';
import {
  Banknote, TrendingUp, CalendarClock, Plus, Search, Building2,
  ArrowUpRight, ArrowDownRight, Activity, AlertTriangle, CheckCircle,
  Shield, RefreshCw, Clock, ChevronRight, Upload, Flame,
} from 'lucide-react';
import { useAppNavigate } from '../NavigationContext';
import { NewCapitalDealFlow } from '../flows/NewCapitalDealFlow';
import { AchImportFlow } from '../flows/AchImportFlow';
import { useCapital, capitalActions, type CapitalDeal, type CapitalDealStatus, type CapitalChannel, type LoanPaymentCategory } from '../capitalStore';
import { PortfolioCharts } from './CapitalCharts';
import { useAchActivity, type AchDailyActivity } from '../achStore';

// ══════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════
const COST_RATE = 0.02;
const today = new Date().toISOString().slice(0, 10);

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtK = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : fmt(n));
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtDate = (d: string) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-');
const fmtDateFull = (d: string) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-');
const daysBetween = (a: string, b: string) => {
  if (!a || !b) return 0;
  return Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000);
};

const statusConfig: Record<CapitalDealStatus, { label: string; bg: string; text: string; dot: string; bar: string }> = {
  active:  { label: 'Active',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  paid:    { label: 'Paid Off', bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    bar: 'bg-blue-500' },
  slow:    { label: 'Slow Pay', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   bar: 'bg-amber-500' },
  default: { label: 'Default',  bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500',     bar: 'bg-red-500' },
};

const achColors: Record<string, string> = {
  current: 'text-emerald-600', completed: 'text-blue-600', 'nsf-retry': 'text-amber-600', suspended: 'text-red-600',
};
const achLabels: Record<string, string> = {
  current: 'Current', completed: 'Completed', 'nsf-retry': 'NSF Retry', suspended: 'Suspended',
};

type TabKey = 'portfolio' | 'activity' | 'risk' | 'collections' | 'renewals' | 'concentration';

const PAYMENT_CATEGORIES: { key: LoanPaymentCategory; label: string }[] = [
  { key: 'debit', label: 'ACH Debit' },
  { key: 'lump', label: 'Lump Sum' },
  { key: 'personal_zelle', label: 'Personal / Zelle' },
  { key: 'reversal', label: 'Reversal' },
  { key: 'bounce', label: 'Bounce / NSF' },
  { key: 'adjustment', label: 'Adjustment' },
];
const categoryBadge: Record<LoanPaymentCategory, string> = {
  debit: 'bg-indigo-50 text-indigo-600',
  lump: 'bg-emerald-50 text-emerald-600',
  personal_zelle: 'bg-blue-50 text-blue-600',
  reversal: 'bg-red-50 text-red-600',
  bounce: 'bg-amber-50 text-amber-600',
  adjustment: 'bg-gray-100 text-gray-600',
};
const categoryLabel = (c: LoanPaymentCategory) => PAYMENT_CATEGORIES.find(x => x.key === c)?.label ?? c;

/**
 * Profit waterfall for a self-funded deal (approximate, "so far"):
 *   gross  = max(collected − funded, 0)
 *   borrow = funded × borrowingCostPct% × monthsElapsed   (capital carrying cost)
 *   net    = gross − borrow
 *   then split net per anshu/patrick/delt retained percentages.
 */
function computeProfitSplit(m: CapitalDeal) {
  const monthsElapsed = Math.max(0, daysBetween(m.funded, today) / 30);
  const costPct = (m.borrowingCostPct ?? 2.0) / 100;
  const gross = Math.max(m.collected - m.fundedAmt, 0);
  const borrow = m.fundedAmt * costPct * monthsElapsed;
  const net = gross - borrow;
  const anshuPct = m.anshuPct ?? 0;
  const patrickPct = m.patrickPct ?? 0;
  const deltPct = m.deltRetainedPct ?? 0;
  return {
    monthsElapsed,
    gross,
    borrow,
    net,
    anshu: net * (anshuPct / 100),
    patrick: net * (patrickPct / 100),
    delt: net * (deltPct / 100),
    anshuPct,
    patrickPct,
    deltPct,
  };
}

// ══════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════
export function BackendCapital() {
  const { navigate } = useAppNavigate();
  const { deals: DEALS, isLoading, isOnline, lastError } = useCapital();

  const [filter, setFilter] = useState<'all' | CapitalDealStatus>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | CapitalChannel>('all');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('portfolio');
  const [collectionModal, setCollectionModal] = useState<string | null>(null);
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [achImportOpen, setAchImportOpen] = useState(false);
  const [addPaymentFor, setAddPaymentFor] = useState<CapitalDeal | null>(null);

  const filtered = useMemo(() => DEALS.filter(m => {
    if (filter !== 'all' && m.status !== filter) return false;
    if (channelFilter !== 'all' && m.channel !== channelFilter) return false;
    if (search && !m.merchant.toLowerCase().includes(search.toLowerCase()) && !m.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [DEALS, filter, search, channelFilter]);

  // ── Portfolio Metrics ──
  const M = useMemo(() => {
    const self = DEALS.filter(m => m.channel === 'self');
    const ref = DEALS.filter(m => m.channel === 'fundomate');
    const selfActive = self.filter(m => m.status !== 'paid');

    const selfDeployed = self.reduce((s, m) => s + m.fundedAmt, 0);
    const selfCollected = self.reduce((s, m) => s + m.collected, 0);
    const selfCOC = self.reduce((s, m) => s + m.costOfCapitalPaid, 0);
    const selfOutstanding = selfActive.reduce((s, m) => s + (m.totalOwed - m.collected), 0);
    const selfGross = selfCollected - selfDeployed;
    const selfNet = selfGross - selfCOC;
    const selfRTR = selfDeployed > 0 ? selfOutstanding / selfDeployed : 0;
    const selfWAF = selfDeployed > 0 ? self.reduce((s, m) => s + m.factor * (m.fundedAmt / selfDeployed), 0) : 0;
    const selfDaily = selfActive.reduce((s, m) => s + m.dailyDebit, 0);

    const refFunded = ref.reduce((s, m) => s + m.fundedAmt, 0);
    const refCommTotal = ref.reduce((s, m) => s + m.referralCommission, 0);
    const refCommPaid = ref.filter(m => m.commissionPaid).reduce((s, m) => s + m.referralCommission, 0);
    const refCommPending = refCommTotal - refCommPaid;
    const refAvgRate = ref.length > 0 ? ref.reduce((s, m) => s + (m.commissionRate || 0), 0) / ref.length : 0;

    const totalDeals = DEALS.length;
    const renewals = DEALS.filter(m => m.renewalEligible).length;
    const stacked = DEALS.filter(m => m.stackCount > 0).length;
    const defaultRate = totalDeals > 0 ? DEALS.filter(m => m.status === 'default').length / totalDeals : 0;
    const totalRevenue = selfNet + refCommTotal;
    const totalVolume = selfDeployed + refFunded;

    // ── Ledger-aware portfolio summary ──
    const totalFunded = DEALS.reduce((s, m) => s + m.fundedAmt, 0);
    const totalCollected = DEALS.reduce((s, m) => s + m.collected, 0);
    const totalOutstanding = DEALS.reduce((s, m) => s + Math.max(m.totalOwed - m.collected, 0), 0);
    const countActive = DEALS.filter(m => m.status === 'active').length;
    const countSlow = DEALS.filter(m => m.status === 'slow').length;
    const countPaid = DEALS.filter(m => m.status === 'paid').length;
    const behindDeals = DEALS.filter(m => (m.weeksBehind ?? 0) > 0);
    const avgWeeksBehind = behindDeals.length > 0
      ? behindDeals.reduce((s, m) => s + (m.weeksBehind ?? 0), 0) / behindDeals.length
      : 0;
    const totalBounces = DEALS.reduce((s, m) => s + (m.bounceCount ?? 0), 0);

    // Vintages
    const vintages: Record<string, { count: number; selfCount: number; refCount: number; deployed: number; refFunded: number; collected: number; owed: number; defaults: number; commissions: number }> = {};
    DEALS.forEach(m => {
      const mo = m.funded.slice(0, 7);
      if (!mo) return;
      if (!vintages[mo]) vintages[mo] = { count: 0, selfCount: 0, refCount: 0, deployed: 0, refFunded: 0, collected: 0, owed: 0, defaults: 0, commissions: 0 };
      vintages[mo].count++;
      if (m.channel === 'self') { vintages[mo].selfCount++; vintages[mo].deployed += m.fundedAmt; }
      else { vintages[mo].refCount++; vintages[mo].refFunded += m.fundedAmt; vintages[mo].commissions += m.referralCommission; }
      vintages[mo].collected += m.collected;
      vintages[mo].owed += m.totalOwed;
      if (m.status === 'default') vintages[mo].defaults++;
    });

    // Concentration
    const activeDeployed = selfActive.reduce((s, m) => s + m.fundedAmt, 0);
    const byMerchant = selfActive.map(m => ({ label: m.merchant.split(' ').slice(0, 2).join(' '), value: m.fundedAmt })).sort((a, b) => b.value - a.value);
    const vertMap: Record<string, number> = {};
    selfActive.forEach(m => { vertMap[m.type] = (vertMap[m.type] || 0) + m.fundedAmt; });
    const byVertical = Object.entries(vertMap).map(([k, v]) => ({ label: k, value: v })).sort((a, b) => b.value - a.value);
    const channelSplit = [{ label: 'Self-Funded', value: selfDeployed }, { label: 'Fundomate Referred', value: refFunded }];

    // ── Risk Pulse ─────────────────────────────────────────────────────
    // Capital at risk = outstanding principal on slow + default (self only)
    const capitalAtRisk = self
      .filter(m => m.status === 'default' || m.status === 'slow')
      .reduce((s, m) => s + Math.max(m.totalOwed - m.collected, 0), 0);
    const defaultedOutstanding = self
      .filter(m => m.status === 'default')
      .reduce((s, m) => s + Math.max(m.totalOwed - m.collected, 0), 0);

    // NSF / bounce ledger pass
    const allPayments = DEALS.flatMap(m => (m.payments || []).map(p => ({ ...p, channel: m.channel })));
    const debitLike = allPayments.filter(p => p.category === 'debit' || p.category === 'bounce');
    const bounceCount = allPayments.filter(p => p.category === 'bounce').length;
    const nsfRate = debitLike.length > 0 ? bounceCount / debitLike.length : 0;

    const last7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const last30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const recent7 = allPayments.filter(p => p.payment_date >= last7);
    const recent30 = allPayments.filter(p => p.payment_date >= last30);
    const nsf7 = recent7.filter(p => p.category === 'bounce').length;
    const nsf30 = recent30.filter(p => p.category === 'bounce').length;
    const debit7 = recent7.filter(p => p.category === 'debit' || p.category === 'bounce').length;
    const debit30 = recent30.filter(p => p.category === 'debit' || p.category === 'bounce').length;
    const nsfRate7 = debit7 > 0 ? nsf7 / debit7 : 0;
    const nsfRate30 = debit30 > 0 ? nsf30 / debit30 : 0;

    // Average days-past-due across slow + default
    const overdueDeals = DEALS.filter(m => m.status === 'slow' || m.status === 'default');
    const avgDPD = overdueDeals.length > 0
      ? overdueDeals.reduce((s, m) => s + (m.daysInDefault || 0), 0) / overdueDeals.length
      : 0;

    // Time-cost-of-money daily burn rate (carrying cost across the active book)
    const dailyBorrowBurn = selfActive.reduce((s, m) => {
      const pct = (m.borrowingCostPct ?? 2.0) / 100;
      const outstanding = Math.max(m.fundedAmt - m.collected, 0);
      return s + (outstanding * pct) / 30;
    }, 0);

    // ── Chart series (zero-safe) ───────────────────────────────────────
    // 30-day collections trend from payments ledger
    const trendDays: { date: string; collected: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const collected = allPayments
        .filter(p => p.payment_date === d && p.amount > 0)
        .reduce((s, p) => s + p.amount, 0);
      trendDays.push({ date: d.slice(5), collected });
    }

    // Default-rate trend by vintage month
    const vintageTrend = Object.entries(vintages)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mo, v]) => ({
        month: mo.slice(2),
        defaultRate: v.count > 0 ? (v.defaults / v.count) * 100 : 0,
        deployed: v.deployed,
      }));

    // Aging buckets across active+slow+default by daysInDefault
    const agingBuckets = [
      { label: 'Current', count: 0, outstanding: 0 },
      { label: '1-7d', count: 0, outstanding: 0 },
      { label: '8-30d', count: 0, outstanding: 0 },
      { label: '30d+', count: 0, outstanding: 0 },
    ];
    DEALS.filter(m => m.status !== 'paid').forEach(m => {
      const dpd = m.daysInDefault || 0;
      const out = Math.max(m.totalOwed - m.collected, 0);
      const idx = dpd === 0 ? 0 : dpd <= 7 ? 1 : dpd <= 30 ? 2 : 3;
      agingBuckets[idx].count++;
      agingBuckets[idx].outstanding += out;
    });

    // NSF / bounces by ISO-week for the last 8 weeks
    const nsfWeeks: { week: string; bounces: number; debits: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const end = new Date(Date.now() - i * 7 * 86400000);
      const start = new Date(end.getTime() - 6 * 86400000);
      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);
      const slice = allPayments.filter(p => p.payment_date >= startStr && p.payment_date <= endStr);
      nsfWeeks.push({
        week: endStr.slice(5),
        bounces: slice.filter(p => p.category === 'bounce').length,
        debits: slice.filter(p => p.category === 'debit').length,
      });
    }

    return {
      selfDeployed, selfCollected, selfCOC, selfOutstanding, selfGross, selfNet, selfRTR, selfWAF, selfDaily,
      refFunded, refCommTotal, refCommPaid, refCommPending, refAvgRate,
      totalDeals, renewals, stacked, defaultRate, totalRevenue, totalVolume,
      vintages, activeDeployed, byMerchant, byVertical, channelSplit,
      selfCount: self.length, refCount: ref.length,
      totalFunded, totalCollected, totalOutstanding, countActive, countSlow, countPaid,
      avgWeeksBehind, totalBounces,
      // Risk Pulse
      capitalAtRisk, defaultedOutstanding, nsfRate, nsfRate7, nsfRate30, avgDPD, dailyBorrowBurn,
      // Chart series
      trendDays, vintageTrend, agingBuckets, nsfWeeks,
    };
  }, [DEALS]);

  const statusTabs: { key: 'all' | CapitalDealStatus; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: DEALS.length },
    { key: 'active', label: 'Active', count: DEALS.filter(m => m.status === 'active').length },
    { key: 'slow', label: 'Slow', count: DEALS.filter(m => m.status === 'slow').length },
    { key: 'default', label: 'Default', count: DEALS.filter(m => m.status === 'default').length },
    { key: 'paid', label: 'Paid', count: DEALS.filter(m => m.status === 'paid').length },
  ];
  const channelTabs: { key: 'all' | CapitalChannel; label: string; count: number }[] = [
    { key: 'all', label: 'All Channels', count: DEALS.length },
    { key: 'self', label: 'Self-Funded', count: M.selfCount },
    { key: 'fundomate', label: 'Fundomate', count: M.refCount },
  ];

  const statusTabColors: Record<string, { active: string; badge: string }> = {
    all: { active: 'bg-indigo-50 text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
    active: { active: 'bg-emerald-50 text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
    slow: { active: 'bg-amber-50 text-amber-700', badge: 'bg-amber-100 text-amber-700' },
    default: { active: 'bg-red-50 text-red-700', badge: 'bg-red-100 text-red-700' },
    paid: { active: 'bg-blue-50 text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  };

  // ── Empty state when no deals yet ──
  // Note: we no longer hide the dashboard. The full Capital UI is rendered at
  // all times so the layout is reviewable in Local mode — KPIs, charts, and
  // the deal table degrade gracefully to $0 / 0 / 0.0% when DEALS = [].
  const isEmpty = !isLoading && DEALS.length === 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-5">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Capital</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manual portfolio entry — automation (ACH.com, DataMerch, FiCoSo) coming soon
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ModeIndicator isLoading={isLoading} isOnline={isOnline} lastError={lastError} dealCount={DEALS.length} />
            <button
              onClick={() => setNewDealOpen(true)}
              className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-[6px] hover:bg-brand-hover transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Deal
            </button>
          </div>
        </div>

        {/* ── Inline empty-portfolio banner (non-blocking) ── */}
        {isEmpty && <EmptyBanner onAdd={() => setNewDealOpen(true)} />}

        {(
          <>
            {/* ── View Tabs ── */}
            <div className="border-b border-gray-200">
              <div className="flex gap-1">
                {([
                  { key: 'portfolio' as TabKey, label: 'Portfolio Overview' },
                  { key: 'activity' as TabKey, label: 'ACH Activity' },
                  { key: 'risk' as TabKey, label: 'Risk & Fraud' },
                  { key: 'collections' as TabKey, label: 'Collections' },
                  { key: 'renewals' as TabKey, label: 'Renewals' },
                  { key: 'concentration' as TabKey, label: 'Concentration & Vintage' },
                ]).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-[1px] ${
                      activeTab === t.key
                        ? 'text-brand border-brand'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ═══ PORTFOLIO TAB ═══ */}
            {activeTab === 'portfolio' && (
              <>
                {/* Channel Summary Strip */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 bg-white rounded-[8px] border border-gray-200 p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand to-brand-light" />
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-600">Self-Funded</span>
                      <span className="text-xs text-gray-400">{M.selfCount} deals · Family office capital @ 2%/mo</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <MiniKpi label="Deployed" value={fmt(M.selfDeployed)} sub={`RTR ${fmtPct(M.selfRTR)}`} />
                      <MiniKpi label="Outstanding" value={fmt(M.selfOutstanding)} sub={`WAF ${M.selfWAF.toFixed(3)}x`} />
                      <MiniKpi label="Gross Collected" value={fmt(M.selfCollected)} sub={`Gross P&L ${fmt(M.selfGross)}`} />
                      <MiniKpi label="Net After COC" value={fmt(M.selfNet)} sub={`COC: ${fmt(M.selfCOC)}`} accent={M.selfNet >= 0 ? 'emerald' : 'red'} />
                      <MiniKpi label="Daily ACH" value={fmt(M.selfDaily)} />
                    </div>
                  </div>
                  <div className="bg-white rounded-[8px] border border-gray-200 p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-400 to-transparent" />
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-orange-50 text-orange-600">Fundomate</span>
                      <span className="text-xs text-gray-400">{M.refCount} referred · {fmtPct(M.refAvgRate)} avg comm</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <MiniKpi label="Vol Referred" value={fmt(M.refFunded)} sub={`${M.refCount} deals sent`} />
                      <MiniKpi label="Comm Earned" value={fmt(M.refCommTotal)} sub={`${fmt(M.refCommPaid)} paid`} accent="emerald" />
                      <MiniKpi label="Comm Pending" value={fmt(M.refCommPending)} sub="Awaiting payout" accent={M.refCommPending > 0 ? 'amber' : 'emerald'} />
                    </div>
                  </div>
                </div>

                {/* Blended KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <KpiCard label="Total Revenue" value={fmt(M.totalRevenue)} sub={`Self net ${fmt(M.selfNet)} + Comm ${fmt(M.refCommTotal)}`} accent="emerald" />
                  <KpiCard label="Total Volume" value={fmt(M.totalVolume)} sub={`${M.selfCount} self + ${M.refCount} referred`} accent="indigo" />
                  <KpiCard label="Default Rate" value={fmtPct(M.defaultRate)} sub={`${DEALS.filter(m => m.status === 'default').length} of ${M.totalDeals}`} accent={M.defaultRate > 0.1 ? 'red' : 'emerald'} />
                  <KpiCard label="Stacked Deals" value={M.stacked.toString()} sub="Multiple positions" accent={M.stacked > 0 ? 'amber' : 'emerald'} />
                  <KpiCard label="Renewal Pipeline" value={M.renewals.toString()} sub="≥50% collected" accent="violet" />
                </div>

                {/* Ledger Portfolio Summary */}
                <div className="bg-white rounded-[8px] border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Banknote className="w-4 h-4 text-brand" />
                    <span className="text-sm font-semibold text-gray-900">Portfolio Summary</span>
                    <span className="text-xs text-gray-400">Reconciled from loan_payments ledger</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    <MiniKpi label="Total Funded" value={fmt(M.totalFunded)} />
                    <MiniKpi label="Total Collected" value={fmt(M.totalCollected)} accent="emerald" />
                    <MiniKpi label="Outstanding" value={fmt(M.totalOutstanding)} accent={M.totalOutstanding > 0 ? 'amber' : 'emerald'} />
                    <MiniKpi label="Active" value={String(M.countActive)} />
                    <MiniKpi label="Slow" value={String(M.countSlow)} accent={M.countSlow > 0 ? 'amber' : undefined} />
                    <MiniKpi label="Paid" value={String(M.countPaid)} accent="emerald" />
                    <MiniKpi label="Avg Weeks Behind" value={M.avgWeeksBehind.toFixed(1)} accent={M.avgWeeksBehind > 0 ? 'red' : 'emerald'} />
                    <MiniKpi label="Total Bounces" value={String(M.totalBounces)} accent={M.totalBounces > 0 ? 'red' : 'emerald'} />
                  </div>
                </div>

                {/* Risk Pulse */}
                <div className="bg-white rounded-[8px] border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-semibold text-gray-900">Risk Pulse</span>
                    <span className="text-xs text-gray-400">NSF, DPD, capital-at-risk, time-cost burn</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <MiniKpi
                      label="Capital at Risk"
                      value={fmt(M.capitalAtRisk)}
                      sub={`Default: ${fmt(M.defaultedOutstanding)}`}
                      accent={M.capitalAtRisk > 0 ? 'red' : 'emerald'}
                    />
                    <MiniKpi
                      label="Default Rate"
                      value={fmtPct(M.defaultRate)}
                      sub={`${DEALS.filter(m => m.status === 'default').length} of ${M.totalDeals}`}
                      accent={M.defaultRate > 0.1 ? 'red' : M.defaultRate > 0 ? 'amber' : 'emerald'}
                    />
                    <MiniKpi
                      label="NSF Rate (30d)"
                      value={fmtPct(M.nsfRate30)}
                      sub={`7d: ${fmtPct(M.nsfRate7)} · LTD: ${fmtPct(M.nsfRate)}`}
                      accent={M.nsfRate30 > 0.05 ? 'red' : M.nsfRate30 > 0 ? 'amber' : 'emerald'}
                    />
                    <MiniKpi
                      label="Avg DPD"
                      value={M.avgDPD > 0 ? `${M.avgDPD.toFixed(1)}d` : '0d'}
                      sub="On slow + default"
                      accent={M.avgDPD > 14 ? 'red' : M.avgDPD > 0 ? 'amber' : 'emerald'}
                    />
                    <MiniKpi
                      label="TCM Burn /day"
                      value={fmt(M.dailyBorrowBurn)}
                      sub="Borrow cost on outstanding"
                      accent={M.dailyBorrowBurn > 0 ? 'amber' : 'emerald'}
                    />
                    <MiniKpi
                      label="Stacked / Behind"
                      value={`${M.stacked} / ${DEALS.filter(m => (m.weeksBehind ?? 0) > 0).length}`}
                      sub={`Avg ${M.avgWeeksBehind.toFixed(1)}w behind`}
                      accent={M.stacked > 0 || M.avgWeeksBehind > 0 ? 'amber' : 'emerald'}
                    />
                  </div>
                </div>

                {/* Charts strip */}
                <PortfolioCharts M={M} />

                {/* Filters + Search */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-[8px] p-0.5">
                      {channelTabs.map(t => (
                        <button
                          key={t.key}
                          onClick={() => setChannelFilter(t.key)}
                          className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors flex items-center gap-1.5 ${
                            channelFilter === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {t.label}
                          <span className={`text-[10px] tabular-nums px-1.5 py-px rounded-full ${
                            channelFilter === t.key ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-200 text-gray-500'
                          }`}>{t.count}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      {statusTabs.map(t => {
                        const isActive = filter === t.key;
                        const colors = statusTabColors[t.key];
                        return (
                          <button
                            key={t.key}
                            onClick={() => setFilter(t.key)}
                            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors flex items-center gap-1.5 ${
                              isActive ? colors.active : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {t.label}
                            <span className={`text-[10px] tabular-nums px-1.5 py-px rounded-full ${
                              isActive ? colors.badge : 'bg-gray-100 text-gray-500'
                            }`}>{t.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="relative w-52">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search merchant or ID..."
                      className="w-full pl-8 pr-3 py-[7px] bg-white border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                </div>

                {/* Deal table */}
                <div className="bg-white border border-gray-200 rounded-[8px] overflow-hidden">
                  <table className="w-full min-w-[1100px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <Th className="pl-5">Merchant</Th>
                        <Th>Channel</Th>
                        <Th>Funded</Th>
                        <Th>Factor</Th>
                        <Th className="min-w-[160px]">Collection</Th>
                        <Th>Daily</Th>
                        <Th>Wks Behind</Th>
                        <Th>Bounces</Th>
                        <Th>Last Pmt</Th>
                        <Th>Stack</Th>
                        <Th>ACH</Th>
                        <Th className="pr-5">Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(m => {
                        const remaining = m.totalOwed - m.collected;
                        const pct = m.totalOwed > 0 ? m.collected / m.totalOwed : 0;
                        const isExp = expandedRow === m.id;
                        const isSelf = m.channel === 'self';
                        const trueProfit = isSelf ? Math.max(m.collected - m.fundedAmt, 0) - m.costOfCapitalPaid : m.referralCommission;
                        const dtb = m.collected >= m.fundedAmt ? 0 : m.dailyDebit > 0 ? Math.ceil((m.fundedAmt - m.collected) / m.dailyDebit) : -1;
                        const st = statusConfig[m.status];

                        return (
                          <React.Fragment key={m.id}>
                            <tr
                              onClick={() => setExpandedRow(isExp ? null : m.id)}
                              className={`border-b border-gray-100 cursor-pointer transition-colors ${isExp ? 'bg-indigo-50/30' : 'hover:bg-gray-50/80'}`}
                            >
                              <td className="pl-5 py-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-gray-900">{m.merchant}</span>
                                  {m.renewalEligible && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-50 text-violet-600 uppercase tracking-wide">
                                      <RefreshCw className="w-2.5 h-2.5" /> Renewal
                                    </span>
                                  )}
                                  {!isSelf && m.commissionPaid !== undefined && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${m.commissionPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                      {m.commissionPaid ? 'COMM PAID' : 'COMM PENDING'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-gray-400 font-mono">{m.id}</span>
                                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-px rounded">{m.type}</span>
                                </div>
                              </td>
                              <td className="py-3"><ChannelBadge channel={m.channel} /></td>
                              <td className="py-3">
                                <div className="text-sm font-semibold text-gray-900 tabular-nums">{fmtK(m.fundedAmt)}</div>
                                <div className="text-[11px] text-gray-400">{fmtDate(m.funded)}</div>
                              </td>
                              <td className="py-3 text-sm font-semibold text-brand tabular-nums">{m.factor.toFixed(2)}x</td>
                              <td className="py-3 pr-4">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-gray-700 tabular-nums">{fmtK(m.collected)}</span>
                                  <span className="text-[11px] text-gray-400 tabular-nums">{fmtPct(pct)}</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${pct * 100}%` }} />
                                </div>
                              </td>
                              <td className="py-3 text-sm font-semibold tabular-nums text-gray-900">{m.dailyDebit > 0 ? fmt(m.dailyDebit) : '-'}</td>
                              <td className="py-3">
                                {(m.weeksBehind ?? 0) > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                                    <Clock className="w-3 h-3" /> {m.weeksBehind}w
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">On time</span>
                                )}
                              </td>
                              <td className="py-3">
                                {(m.bounceCount ?? 0) > 0 ? (
                                  <span className="text-xs font-bold text-amber-600 tabular-nums">{m.bounceCount}</span>
                                ) : (
                                  <span className="text-xs text-gray-400">0</span>
                                )}
                              </td>
                              <td className="py-3 text-[11px] text-gray-500 tabular-nums">{fmtDate(m.lastPayment)}</td>
                              <td className="py-3">
                                {m.stackCount === 0 ? (
                                  <span className="text-xs text-gray-400">Clean</span>
                                ) : (
                                  <span className={`inline-flex items-center gap-1 text-xs font-bold ${m.stackCount >= 2 ? 'text-red-600' : 'text-amber-600'}`}>
                                    <AlertTriangle className="w-3 h-3" /> {m.stackCount}
                                  </span>
                                )}
                              </td>
                              <td className="py-3">
                                <span className={`text-[10px] font-bold uppercase tracking-wide ${achColors[m.achStatus] || 'text-gray-500'}`}>
                                  {achLabels[m.achStatus] || m.achStatus}
                                </span>
                              </td>
                              <td className="pr-5 py-3">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                  {st.label}
                                </span>
                              </td>
                            </tr>

                            {isExp && (
                              <tr>
                                <td colSpan={12} className="bg-gray-50 border-b border-gray-200 px-5 py-4">
                                  {isSelf ? (
                                    <>
                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                        <ExpandedKpi label="Factor Profit (Gross)" value={fmt(m.totalOwed - m.fundedAmt)} sub={`${fmtPct(m.factor - 1)} return`} />
                                        <ExpandedKpi label="Cost of Capital Paid" value={fmt(m.costOfCapitalPaid)} sub="2%/mo declining bal" />
                                        <ExpandedKpi label="True Net Profit" value={fmt(trueProfit)} sub={trueProfit >= 0 ? 'Net positive' : 'Net negative'} accent={trueProfit >= 0 ? 'emerald' : 'red'} />
                                        <ExpandedKpi label="Days to Breakeven" value={dtb === 0 ? 'Recovered' : dtb > 0 ? `${dtb}d` : 'N/A'} sub={dtb === 0 ? 'House money' : dtb > 0 ? `~${fmtDateFull(getDateOffset(dtb))}` : 'No debits'} accent={dtb === 0 ? 'emerald' : undefined} />
                                        <ExpandedKpi label="Est. Payoff" value={m.dailyDebit > 0 && remaining > 0 ? `${Math.ceil(remaining / m.dailyDebit)}d` : '-'} sub={m.dailyDebit > 0 && remaining > 0 ? `~${fmtDateFull(getDateOffset(Math.ceil(remaining / m.dailyDebit)))}` : 'Complete / suspended'} />
                                      </div>
                                      <div className="border-t border-gray-200 pt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <ExpandedKpi label="7d / 30d Avg" value={`${fmt(m.avg7d)} / ${fmt(m.avg30d)}`} />
                                        <ExpandedKpi label="Velocity" value={<VelocityArrow avg7d={m.avg7d} avg30d={m.avg30d} />} sub={m.avg7d >= m.avg30d ? 'Stable' : 'Decelerating'} />
                                        <ExpandedKpi label="UCC Expires" value={fmtDateFull(m.uccExpires)} sub={m.uccFiled ? `Filed ${fmtDate(m.uccFiled)}` : 'No UCC on file'} />
                                        <ExpandedKpi label="Last Payment" value={fmtDate(m.lastPayment)} sub={m.daysInDefault > 0 ? <span className="text-red-600">{m.daysInDefault}d overdue</span> : 'On schedule'} />
                                        <ExpandedKpi label="Holdback" value={`${m.holdback}%`} sub="Of daily card volume" />
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                        <ExpandedKpi label="Referral Commission" value={fmt(m.referralCommission)} sub={`${fmtPct(m.commissionRate || 0)} of ${fmtK(m.fundedAmt)} funded`} accent="orange" />
                                        <ExpandedKpi label="Commission Status" value={m.commissionPaid ? 'Paid' : 'Pending'} sub={m.commissionPaid ? 'Funds received' : 'Awaiting Fundomate payout'} accent={m.commissionPaid ? 'emerald' : 'amber'} />
                                        <ExpandedKpi label="Deal Performance" value={`${fmtPct(pct)} collected`} sub={`${fmtK(m.collected)} of ${fmtK(m.totalOwed)}`} />
                                        <ExpandedKpi label="Capital at Risk" value="$0" sub="Fundomate bears all credit risk" accent="emerald" />
                                        <ExpandedKpi label="Renewal Potential" value={m.renewalEligible ? 'Eligible' : 'Not yet'} sub={m.renewalEligible ? 'New commission opportunity' : 'Below 50% threshold'} accent={m.renewalEligible ? 'violet' : undefined} />
                                      </div>
                                    </>
                                  )}
                                  {isSelf && <ProfitSplitPanel m={m} />}

                                  <PaymentLedger m={m} />

                                  <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setAddPaymentFor(m); }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand text-white hover:bg-brand-hover rounded-[6px] transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5" /> Add Payment
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); navigate(`/deals/${m.id}`); }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/5 rounded-[6px] transition-colors"
                                    >
                                      Open Full Detail <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={12} className="py-16 text-center">
                            {DEALS.length === 0 ? (
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-sm text-gray-500">No capital deals yet — your portfolio table will populate here.</span>
                                <button
                                  onClick={() => setNewDealOpen(true)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand text-white rounded-[6px] hover:bg-brand-hover"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add your first deal
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No deals match the current filters.</span>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {filtered.length}/{DEALS.length} deals · {isOnline ? 'Live (Supabase)' : 'Local mode'}
                  </p>
                  <p className="text-xs text-gray-400"><span className="text-brand font-bold">delt</span>pay.com</p>
                </div>
              </>
            )}

            {/* ═══ ACH ACTIVITY TAB ═══ */}
            {activeTab === 'activity' && <ActivityTab onImport={() => setAchImportOpen(true)} />}

            {/* ═══ RISK & FRAUD TAB (consolidated: Risk Signals + Fraud + Stacking & UCC) ═══ */}
            {activeTab === 'risk' && <RiskTab DEALS={DEALS} />}

            {/* ═══ COLLECTIONS TAB ═══ */}
            {activeTab === 'collections' && <CollectionsTab DEALS={DEALS} onEscalate={setCollectionModal} />}

            {/* ═══ RENEWALS TAB ═══ */}
            {activeTab === 'renewals' && <RenewalsTab DEALS={DEALS} />}

            {/* ═══ CONCENTRATION TAB ═══ */}
            {activeTab === 'concentration' && <ConcentrationTab M={M} />}
          </>
        )}
      </div>

      {/* Collection escalation modal */}
      {collectionModal && <CollectionModal dealId={collectionModal} DEALS={DEALS} onClose={() => setCollectionModal(null)} />}

      <NewCapitalDealFlow open={newDealOpen} onClose={() => setNewDealOpen(false)} />
      <AchImportFlow open={achImportOpen} onClose={() => setAchImportOpen(false)} />
      {addPaymentFor && (
        <AddPaymentModal deal={addPaymentFor} onClose={() => setAddPaymentFor(null)} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// PROFIT SPLIT PANEL
// ══════════════════════════════════════════
function ProfitSplitPanel({ m }: { m: CapitalDeal }) {
  const ps = computeProfitSplit(m);
  const sources = m.fundingSources ? Object.entries(m.fundingSources) : [];
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand" />
          <span className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Profit Split Waterfall</span>
          <span className="text-[11px] text-gray-400">~{ps.monthsElapsed.toFixed(1)} mo elapsed @ {(m.borrowingCostPct ?? 2).toFixed(1)}%/mo</span>
        </div>
        {sources.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Funding</span>
            {sources.map(([name, pct]) => (
              <span key={name} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700 capitalize">
                {name} {pct}%
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <ExpandedKpi label="Gross Profit (so far)" value={fmt(ps.gross)} sub="collected − funded" />
        <ExpandedKpi label="Borrowing Cost" value={fmt(ps.borrow)} sub="carry on capital" accent="amber" />
        <ExpandedKpi label="Net Profit" value={fmt(ps.net)} sub={ps.net >= 0 ? 'distributable' : 'underwater'} accent={ps.net >= 0 ? 'emerald' : 'red'} />
        <ExpandedKpi label={`Anshu / Patrick (${ps.anshuPct}/${ps.patrickPct}%)`} value={`${fmt(ps.anshu)} / ${fmt(ps.patrick)}`} sub="partner splits" />
        <ExpandedKpi label={`Delt Retained (${ps.deltPct}%)`} value={fmt(ps.delt)} sub="house" accent="indigo" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// PAYMENT LEDGER
// ══════════════════════════════════════════
function PaymentLedger({ m }: { m: CapitalDeal }) {
  const payments = m.payments || [];
  const total = payments.reduce((s, p) => s + p.amount, 0);
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-4 h-4 text-brand" />
        <span className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Payment Ledger</span>
        <span className="text-[11px] text-gray-400">{payments.length} entries</span>
      </div>
      {payments.length === 0 ? (
        <p className="text-xs text-gray-400 py-3">No payments recorded yet for this deal.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-[6px] overflow-hidden max-h-72 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0">
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-[10px] uppercase tracking-wide text-gray-400">
                <th className="px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 font-semibold text-right">Amount</th>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-3 py-1.5 tabular-nums text-gray-600">{fmtDateFull(p.payment_date)}</td>
                  <td className={`px-3 py-1.5 text-right tabular-nums font-semibold ${p.amount < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {p.amount < 0 ? `(${fmt(Math.abs(p.amount))})` : fmt(p.amount)}
                  </td>
                  <td className="px-3 py-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${categoryBadge[p.category]}`}>{categoryLabel(p.category)}</span>
                  </td>
                  <td className="px-3 py-1.5 text-gray-500">{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td className="px-3 py-2 font-semibold text-gray-700">Total Collected</td>
                <td className="px-3 py-2 text-right tabular-nums font-bold text-gray-900">{fmt(total)}</td>
                <td colSpan={2} className="px-3 py-2 text-[11px] text-gray-400">
                  {Math.abs(total - m.collected) < 1 ? 'Reconciles with deal collected ✓' : `Deal field: ${fmt(m.collected)}`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// ADD PAYMENT MODAL
// ══════════════════════════════════════════
function AddPaymentModal({ deal, onClose }: { deal: CapitalDeal; onClose: () => void }) {
  const [date, setDate] = useState(today);
  const [sign, setSign] = useState<'+' | '-'>('+');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<LoanPaymentCategory>('debit');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const numeric = parseFloat(amount);
  const valid = Number.isFinite(numeric) && numeric > 0 && !!date;

  const submit = () => {
    if (!valid || saving) return;
    setSaving(true);
    const signed = sign === '-' ? -Math.abs(numeric) : Math.abs(numeric);
    capitalActions.addPayment(deal.id, {
      payment_date: date,
      amount: signed,
      category,
      notes: notes.trim() || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-[10px] shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Add Payment</h3>
          <p className="text-xs text-gray-500 mt-0.5">{deal.merchant} · {deal.id}</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
            <div className="flex items-center gap-2">
              <div className="flex rounded-[6px] border border-gray-200 overflow-hidden">
                <button type="button" onClick={() => setSign('+')}
                  className={`px-3 py-2 text-sm font-bold ${sign === '+' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-500'}`}>+</button>
                <button type="button" onClick={() => setSign('-')}
                  className={`px-3 py-2 text-sm font-bold ${sign === '-' ? 'bg-red-500 text-white' : 'bg-white text-gray-500'}`}>−</button>
              </div>
              <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-[6px] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Use − for reversals / bounces.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value as LoanPaymentCategory)}
              className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
              {PAYMENT_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-200 rounded-[6px] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-[6px]">Cancel</button>
          <button onClick={submit} disabled={!valid || saving}
            className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-[6px] hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Saving…' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// EMPTY BANNER (inline, non-blocking)
// ══════════════════════════════════════════
function EmptyBanner({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-gradient-to-r from-indigo-50 via-white to-orange-50 border border-indigo-100 rounded-[10px] px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white border border-indigo-100 flex items-center justify-center shadow-sm">
          <Banknote className="w-5 h-5 text-brand" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Portfolio is empty — preview mode active</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Every KPI, chart, and tab below renders with $0. Add a deal to populate the portfolio. ACH.com / DataMerch / FiCoSo / Fundomate automation wires in later.
          </p>
        </div>
      </div>
      <button
        onClick={onAdd}
        className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-[6px] hover:bg-brand-hover transition-colors inline-flex items-center gap-2 shrink-0"
      >
        <Plus className="w-4 h-4" /> Add your first deal
      </button>
    </div>
  );
}

// ══════════════════════════════════════════
// MODE INDICATOR
// ══════════════════════════════════════════
function ModeIndicator({ isLoading, isOnline, lastError, dealCount }: { isLoading: boolean; isOnline: boolean; lastError: string | null; dealCount: number }) {
  if (isLoading) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
        Loading…
      </span>
    );
  }
  if (lastError) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-600" title={lastError}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Sync error
      </span>
    );
  }
  if (isOnline) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live · {dealCount} {dealCount === 1 ? 'deal' : 'deals'}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-amber-600">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Local mode (no Supabase)
    </span>
  );
}

// ══════════════════════════════════════════
// ACH ACTIVITY TAB — KPIs + daily ledger
// ══════════════════════════════════════════
function ActivityTab({ onImport }: { onImport: () => void }) {
  const { rows, imports, isLoading, isOnline, lastError } = useAchActivity();
  const [range, setRange] = useState<'30d' | '90d' | '6m' | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ORIGINATION' | 'Settlement' | 'Returns'>('all');

  const filtered = useMemo(() => {
    let r = rows;
    if (range !== 'all') {
      const days = range === '30d' ? 30 : range === '90d' ? 90 : 180;
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      r = r.filter(x => x.processingDate >= cutoffStr);
    }
    if (typeFilter !== 'all') r = r.filter(x => x.recordType === typeFilter);
    return r;
  }, [rows, range, typeFilter]);

  // KPIs scoped to current range (ignores typeFilter so totals stay stable)
  const inRange = useMemo(() => {
    if (range === 'all') return rows;
    const days = range === '30d' ? 30 : range === '90d' ? 90 : 180;
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return rows.filter(x => x.processingDate >= cutoffStr);
  }, [rows, range]);

  const kpi = useMemo(() => {
    const origin = inRange.filter(r => r.recordType === 'ORIGINATION');
    const settle = inRange.filter(r => r.recordType === 'Settlement');
    const ret = inRange.filter(r => r.recordType === 'Returns');
    const totalOriginated = origin.reduce((s, r) => s + r.debitAmount, 0);
    const totalSettled = settle.reduce((s, r) => s + r.creditAmount, 0);
    const totalReturned = ret.reduce((s, r) => s + r.debitAmount, 0);
    const originCount = origin.reduce((s, r) => s + r.totalCount, 0);
    const settleCount = settle.reduce((s, r) => s + r.totalCount, 0);
    const retCount = ret.reduce((s, r) => s + r.totalCount, 0);
    const returnRate = totalOriginated > 0 ? totalReturned / totalOriginated : 0;
    const netFlow = totalSettled - totalReturned;

    // Avg settlement lag: settlement_date - processing_date, in days
    const lags = settle
      .filter(r => r.settlementDate && r.processingDate)
      .map(r => daysBetween(r.processingDate, r.settlementDate));
    const avgLag = lags.length > 0 ? lags.reduce((s, d) => s + d, 0) / lags.length : 0;

    return { totalOriginated, totalSettled, totalReturned, originCount, settleCount, retCount, returnRate, netFlow, avgLag };
  }, [inRange]);

  // Group by day for ledger view
  const ledger = useMemo(() => {
    const byDay: Record<string, { date: string; originated: number; settled: number; returned: number; rows: AchDailyActivity[] }> = {};
    for (const r of filtered) {
      if (!byDay[r.processingDate]) byDay[r.processingDate] = { date: r.processingDate, originated: 0, settled: 0, returned: 0, rows: [] };
      byDay[r.processingDate].rows.push(r);
      if (r.recordType === 'ORIGINATION') byDay[r.processingDate].originated += r.debitAmount;
      else if (r.recordType === 'Settlement') byDay[r.processingDate].settled += r.creditAmount;
      else if (r.recordType === 'Returns') byDay[r.processingDate].returned += r.debitAmount;
    }
    return Object.values(byDay).sort((a, b) => b.date.localeCompare(a.date));
  }, [filtered]);

  const dateRangeLabel =
    range === '30d' ? 'Last 30 days' :
    range === '90d' ? 'Last 90 days' :
    range === '6m' ? 'Last 6 months' : 'All time';

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">Loading ACH activity…</div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <Activity size={32} className="mx-auto text-gray-300 mb-3" />
        <h3 className="text-sm font-semibold text-gray-900">No ACH activity yet</h3>
        <p className="text-xs text-gray-500 mt-1.5 max-w-sm mx-auto">
          Import an ACH.com RptActivitySummary export to populate daily originations, settlements, and returns.
        </p>
        <button
          onClick={onImport}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-white bg-brand hover:bg-brand/90 rounded transition-colors"
        >
          <Upload size={14} />
          Import ACH activity
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header strip with filters + import button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-gray-100 rounded p-0.5">
            {([
              { k: '30d', l: '30d' },
              { k: '90d', l: '90d' },
              { k: '6m', l: '6m' },
              { k: 'all', l: 'All' },
            ] as const).map(t => (
              <button
                key={t.k}
                onClick={() => setRange(t.k)}
                className={`px-2.5 py-1 text-[12px] font-medium rounded transition-colors ${
                  range === t.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >{t.l}</button>
            ))}
          </div>
          <span className="text-[11px] text-gray-400">·</span>
          <span className="text-[12px] text-gray-600">{dateRangeLabel}</span>
          {isOnline ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              Live
            </span>
          ) : (
            <span className="text-[10px] text-gray-400">{lastError ? 'offline' : 'local'}</span>
          )}
        </div>
        <button
          onClick={onImport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-white bg-brand hover:bg-brand/90 rounded transition-colors"
        >
          <Upload size={14} />
          Import ACH activity
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Originated" value={fmtK(kpi.totalOriginated)} sub={`${kpi.originCount} txns`} accent="emerald" />
        <KpiCard label="Settled" value={fmtK(kpi.totalSettled)} sub={`${kpi.settleCount} txns`} accent="blue" />
        <KpiCard label="Returned" value={fmtK(kpi.totalReturned)} sub={`${kpi.retCount} txns`} accent="red" />
        <KpiCard label="Return Rate" value={fmtPct(kpi.returnRate)} sub="Returned ÷ Originated" accent={kpi.returnRate > 0.05 ? 'red' : kpi.returnRate > 0.02 ? 'amber' : 'emerald'} />
        <KpiCard label="Net Flow" value={fmtK(kpi.netFlow)} sub="Settled − Returned" accent={kpi.netFlow >= 0 ? 'emerald' : 'red'} />
        <KpiCard label="Settlement Lag" value={`${kpi.avgLag.toFixed(1)}d`} sub="Process → Settle" accent="violet" />
      </div>

      {/* Imports history */}
      {imports.length > 0 && (
        <div className="bg-white rounded-[8px] border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Recent imports</h3>
            <p className="text-xs text-gray-500 mt-0.5">CSV uploads from ACH.com</p>
          </div>
          <div className="divide-y divide-gray-50">
            {imports.slice(0, 5).map(b => (
              <div key={b.id} className="px-5 py-3 flex items-center justify-between text-[12px]">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{b.filename}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {b.dateRange || '—'} · {b.insertedCount} rows · {fmtDateFull(b.createdAt.slice(0, 10))}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-emerald-600">{fmtK(b.totalOriginated)}</span>
                  <span className="text-blue-600">{fmtK(b.totalSettled)}</span>
                  <span className="text-red-600">{fmtK(b.totalReturned)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily ledger */}
      <div className="bg-white rounded-[8px] border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Daily ledger</h3>
            <p className="text-xs text-gray-500 mt-0.5">{ledger.length} days · {filtered.length} rows</p>
          </div>
          <div className="inline-flex bg-gray-100 rounded p-0.5">
            {([
              { k: 'all', l: 'All' },
              { k: 'ORIGINATION', l: 'Orig' },
              { k: 'Settlement', l: 'Settle' },
              { k: 'Returns', l: 'Ret' },
            ] as const).map(t => (
              <button
                key={t.k}
                onClick={() => setTypeFilter(t.k as any)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                  typeFilter === t.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >{t.l}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-5 py-2 font-medium">Date</th>
                <th className="text-right px-3 py-2 font-medium">Originated</th>
                <th className="text-right px-3 py-2 font-medium">Settled</th>
                <th className="text-right px-3 py-2 font-medium">Returned</th>
                <th className="text-right px-5 py-2 font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {ledger.slice(0, 50).map(d => {
                const net = d.settled - d.returned;
                return (
                  <tr key={d.date} className="border-t border-gray-50 hover:bg-gray-50/40">
                    <td className="px-5 py-2 text-gray-700 whitespace-nowrap">{fmtDateFull(d.date)}</td>
                    <td className="text-right px-3 py-2 text-emerald-700">{d.originated ? fmt(d.originated) : '—'}</td>
                    <td className="text-right px-3 py-2 text-blue-700">{d.settled ? fmt(d.settled) : '—'}</td>
                    <td className="text-right px-3 py-2 text-red-700">{d.returned ? fmt(d.returned) : '—'}</td>
                    <td className={`text-right px-5 py-2 font-medium ${net >= 0 ? 'text-gray-900' : 'text-red-700'}`}>{fmt(net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {ledger.length > 50 && (
            <div className="px-5 py-2 text-[11px] text-gray-400 border-t border-gray-50 text-center">
              Showing 50 of {ledger.length} days · narrow your range to see more
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// RISK & FRAUD TAB (merged)
// ══════════════════════════════════════════
function RiskTab({ DEALS }: { DEALS: CapitalDeal[] }) {
  const active = DEALS.filter(m => m.status !== 'paid');
  const tiers = {
    low: active.filter(m => m.achStatus === 'current' && m.stackCount === 0 && (m.avg30d === 0 || m.avg7d >= m.avg30d * 0.9)),
    moderate: active.filter(m => m.achStatus === 'current' && (m.stackCount > 0 || (m.avg30d > 0 && m.avg7d < m.avg30d * 0.9))),
    elevated: active.filter(m => m.achStatus === 'nsf-retry'),
    critical: active.filter(m => m.achStatus === 'suspended' || m.status === 'default'),
  };

  // Fraud rules (auto-detected only — manual rules collapse into row badges)
  const fraudRules = [
    { rule: 'Multiple MCAs across business names', flagged: DEALS.filter(m => m.stackCount >= 2), severity: 'high' as const, detail: 'Owner may have MCAs under multiple DBAs', source: 'DataMerch' },
    { rule: 'Stopped processing after MCA funded', flagged: DEALS.filter(m => m.avg7d === 0 && m.status !== 'paid' && m.status !== 'default'), severity: 'critical' as const, detail: 'MCA underwritten on volume, but processing has ceased', source: 'ACH.com' },
    { rule: 'Single additional stack position', flagged: DEALS.filter(m => m.stackCount === 1), severity: 'medium' as const, detail: 'One overlapping MCA detected', source: 'DataMerch' },
    { rule: 'UCC expiring in <12 months', flagged: DEALS.filter(m => m.uccExpires && daysBetween(today, m.uccExpires) < 365 && daysBetween(today, m.uccExpires) > 0), severity: 'medium' as const, detail: 'Lien position needs renewal', source: 'FiCoSo' },
  ];
  const totalFlags = fraudRules.reduce((s, r) => s + r.flagged.length, 0);

  return (
    <div className="space-y-6">
      {/* Risk Tier Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Low Risk',  count: tiers.low.length,      bal: tiers.low.reduce((s, m) => s + (m.totalOwed - m.collected), 0),      accent: 'emerald' },
          { label: 'Moderate',  count: tiers.moderate.length, bal: tiers.moderate.reduce((s, m) => s + (m.totalOwed - m.collected), 0), accent: 'amber' },
          { label: 'Elevated',  count: tiers.elevated.length, bal: tiers.elevated.reduce((s, m) => s + (m.totalOwed - m.collected), 0), accent: 'orange' },
          { label: 'Critical',  count: tiers.critical.length, bal: tiers.critical.reduce((s, m) => s + (m.totalOwed - m.collected), 0), accent: 'red' },
        ].map(t => <KpiCard key={t.label} label={t.label} value={t.count.toString()} sub={`${fmt(t.bal)} outstanding`} accent={t.accent} />)}
      </div>

      {/* Active Fraud / Risk Rules */}
      <div className="bg-white rounded-[8px] border border-gray-200">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-500" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Risk & Fraud Signals</h3>
              <p className="text-xs text-gray-500 mt-0.5">Auto-flagged patterns across portfolio · DataMerch, ACH.com, FiCoSo (when wired)</p>
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${totalFlags > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {totalFlags > 0 ? `${totalFlags} flags` : 'All clear'}
          </span>
        </div>
        <div className="px-5 py-4 space-y-3">
          {fraudRules.map((flag, i) => {
            const sevColors = { critical: 'bg-red-100 text-red-800 border-red-200', high: 'bg-red-50 text-red-700 border-red-100', medium: 'bg-amber-50 text-amber-700 border-amber-100' };
            return (
              <div key={i} className={`rounded-[6px] border p-3 ${flag.flagged.length > 0 ? sevColors[flag.severity] : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {flag.flagged.length > 0 ? <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      <p className="text-sm font-semibold">{flag.rule}</p>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/80 text-gray-500 border border-gray-200">{flag.source}</span>
                    </div>
                    <p className="text-xs opacity-80 ml-[22px]">{flag.detail}</p>
                    {flag.flagged.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-[22px]">
                        {flag.flagged.map(m => (
                          <span key={m.id} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/60 border border-gray-300">{m.merchant} ({m.id})</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${flag.flagged.length > 0 ? 'bg-white/50' : 'bg-emerald-100 text-emerald-700'}`}>
                    {flag.flagged.length > 0 ? `${flag.flagged.length} flagged` : 'Clear'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-merchant risk matrix (combines tier, stacking, UCC) */}
      <div className="bg-white rounded-[8px] border border-gray-200">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Per-Merchant Risk Matrix</h3>
            <p className="text-xs text-gray-500 mt-0.5">Status, ACH health, velocity, stacking, and UCC expiration — all in one view</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <Th className="pl-5">Merchant</Th><Th>Ch</Th><Th>Status</Th><Th>ACH</Th><Th>Velocity</Th><Th>Stack</Th><Th>UCC Expires</Th><Th>Risk Tier</Th>
              </tr>
            </thead>
            <tbody>
              {DEALS.filter(m => m.status !== 'paid').sort((a, b) => {
                const score = (m: CapitalDeal) => (m.achStatus === 'suspended' ? 4 : m.status === 'default' ? 4 : m.achStatus === 'nsf-retry' ? 3 : m.stackCount >= 2 ? 2 : m.stackCount === 1 ? 1 : 0);
                return score(b) - score(a);
              }).map(m => {
                let tier: string, tierColor: string;
                if (m.achStatus === 'suspended' || m.status === 'default') { tier = 'CRITICAL'; tierColor = 'text-red-700 bg-red-100'; }
                else if (m.achStatus === 'nsf-retry') { tier = 'ELEVATED'; tierColor = 'text-orange-700 bg-orange-50'; }
                else if (m.stackCount > 0 || (m.avg30d > 0 && m.avg7d < m.avg30d * 0.9)) { tier = 'MODERATE'; tierColor = 'text-amber-700 bg-amber-50'; }
                else { tier = 'LOW'; tierColor = 'text-emerald-700 bg-emerald-50'; }
                const uccDays = m.uccExpires ? daysBetween(today, m.uccExpires) : null;
                const uccColor = uccDays == null ? 'text-gray-400' : uccDays < 365 ? 'text-red-600' : uccDays < 730 ? 'text-amber-600' : 'text-gray-600';
                return (
                  <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${tier === 'CRITICAL' ? 'bg-red-50/20' : ''}`}>
                    <td className="pl-5 py-2.5"><p className="text-sm font-medium text-gray-900">{m.merchant}</p><p className="text-[10px] text-gray-400 font-mono">{m.id}</p></td>
                    <td className="py-2.5"><ChannelBadge channel={m.channel} /></td>
                    <td className="py-2.5"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig[m.status].bg} ${statusConfig[m.status].text}`}><span className={`w-1.5 h-1.5 rounded-full ${statusConfig[m.status].dot}`} />{statusConfig[m.status].label}</span></td>
                    <td className="py-2.5"><span className={`text-[10px] font-bold uppercase ${achColors[m.achStatus]}`}>{achLabels[m.achStatus]}</span></td>
                    <td className="py-2.5"><VelocityArrow avg7d={m.avg7d} avg30d={m.avg30d} /></td>
                    <td className="py-2.5">{m.stackCount === 0 ? <span className="text-xs text-gray-400">Clean</span> : <span className={`inline-flex items-center gap-1 text-xs font-bold ${m.stackCount >= 2 ? 'text-red-600' : 'text-amber-600'}`}><AlertTriangle className="w-3 h-3" /> {m.stackCount}</span>}</td>
                    <td className={`py-2.5 text-xs font-semibold tabular-nums ${uccColor}`}>{uccDays == null ? '-' : uccDays > 365 ? `${Math.floor(uccDays / 365)}y ${Math.floor((uccDays % 365) / 30)}m` : `${uccDays}d`}</td>
                    <td className="py-2.5"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${tierColor}`}>{tier}</span></td>
                  </tr>
                );
              })}
              {DEALS.filter(m => m.status !== 'paid').length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-sm text-gray-400">No active deals</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// COLLECTIONS TAB
// ══════════════════════════════════════════
function CollectionsTab({ DEALS, onEscalate }: { DEALS: CapitalDeal[]; onEscalate: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Delinquent" value={DEALS.filter(m => m.status === 'slow' || m.status === 'default').length.toString()} sub={`${DEALS.filter(m => m.status === 'default').length} defaulted`} accent={DEALS.filter(m => m.status === 'default').length > 0 ? 'red' : 'emerald'} />
        <KpiCard label="NSF/Retry" value={DEALS.filter(m => m.achStatus === 'nsf-retry').length.toString()} sub="ACH failures pending" accent="amber" />
        <KpiCard label="Suspended" value={DEALS.filter(m => m.achStatus === 'suspended').length.toString()} sub="ACH debits halted" accent="red" />
        <KpiCard label="Daily ACH Active" value={fmt(DEALS.filter(m => m.achStatus === 'current').reduce((s, m) => s + m.dailyDebit, 0))} sub={`${DEALS.filter(m => m.achStatus === 'current').length} merchants`} accent="emerald" />
        <KpiCard label="At Risk Balance" value={fmt(DEALS.filter(m => m.status === 'slow' || m.status === 'default').reduce((s, m) => s + (m.totalOwed - m.collected), 0))} sub="Outstanding on delinquent" accent="red" />
      </div>

      <div className="bg-white rounded-[8px] border border-gray-200">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <div><h3 className="text-sm font-semibold text-gray-900">Collection Escalation Workflow</h3><p className="text-xs text-gray-500 mt-0.5">Automated escalation stages for delinquent accounts</p></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full"><thead><tr className="border-b border-gray-100 bg-gray-50">
            <Th className="pl-5">Merchant</Th><Th>Status</Th><Th>Current Stage</Th><Th>Days Overdue</Th><Th>Stage Timeline</Th><Th>Next Action</Th>
          </tr></thead>
            <tbody>{DEALS.filter(m => m.status === 'slow' || m.status === 'default').map(m => {
              const stages = [
                { name: 'ACH Retry', icon: '↻', daysIn: 0, active: m.achStatus === 'nsf-retry', done: m.daysInDefault > 3 },
                { name: 'Email Notice', icon: '✉', daysIn: 3, active: m.daysInDefault >= 3 && m.daysInDefault < 7, done: m.daysInDefault >= 7 },
                { name: 'Agent Call', icon: '☎', daysIn: 7, active: m.daysInDefault >= 7 && m.daysInDefault < 14, done: m.daysInDefault >= 14 },
                { name: 'Demand Letter', icon: '⚠', daysIn: 14, active: m.daysInDefault >= 14 && m.daysInDefault < 30, done: m.daysInDefault >= 30 },
                { name: 'Legal', icon: '⚖', daysIn: 30, active: m.daysInDefault >= 30, done: false },
              ];
              const currentStage = [...stages].reverse().find(s => s.active || s.done) || stages[0];
              const nextStage = stages.find(s => !s.active && !s.done) || stages[stages.length - 1];
              return (<tr key={m.id} className="border-b border-gray-50 hover:bg-amber-50/20">
                <td className="pl-5 py-3"><p className="text-sm font-semibold text-gray-900">{m.merchant}</p><p className="text-[10px] text-gray-400 font-mono">{m.id}</p></td>
                <td className="py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig[m.status].bg} ${statusConfig[m.status].text}`}><span className={`w-1.5 h-1.5 rounded-full ${statusConfig[m.status].dot}`} />{statusConfig[m.status].label}</span></td>
                <td className="py-3"><span className="text-sm font-semibold text-gray-900">{currentStage.icon} {currentStage.name}</span></td>
                <td className="py-3"><span className={`text-sm font-bold tabular-nums ${m.daysInDefault >= 14 ? 'text-red-600' : m.daysInDefault >= 7 ? 'text-amber-600' : 'text-gray-700'}`}>{m.daysInDefault}d</span></td>
                <td className="py-3">
                  <div className="flex items-center gap-1">{stages.map((s, i) => (
                    <div key={i} className="flex items-center gap-0.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${s.done ? 'bg-emerald-100 text-emerald-700' : s.active ? 'bg-brand text-white ring-2 ring-brand/20' : 'bg-gray-100 text-gray-400'}`} title={s.name}>{s.done ? '✓' : s.icon}</div>
                      {i < stages.length - 1 && <div className={`w-3 h-0.5 ${s.done ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
                    </div>
                  ))}</div>
                </td>
                <td className="py-3"><button onClick={(e) => { e.stopPropagation(); onEscalate(m.id); }} className="px-2.5 py-1.5 bg-brand text-white text-[10px] font-semibold rounded-[6px] hover:bg-brand-hover transition-colors">{nextStage.name} →</button></td>
              </tr>);
            })}{DEALS.filter(m => m.status === 'slow' || m.status === 'default').length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-sm text-gray-400">No delinquent accounts — all collections current</td></tr>
            )}</tbody></table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// RENEWALS TAB (single consolidated table)
// ══════════════════════════════════════════
function RenewalsTab({ DEALS }: { DEALS: CapitalDeal[] }) {
  const eligible = DEALS.filter(d => d.renewalEligible);
  const sc = (m: CapitalDeal) => {
    const pct = m.totalOwed > 0 ? m.collected / m.totalOwed : 0;
    const daysSF = daysBetween(m.funded, today);
    return Math.round((pct * 40) + (m.avg7d >= m.avg30d ? 30 : m.avg30d > 0 ? 15 : 0) + (Math.min(daysSF / 180, 1) * 20) + (m.achStatus === 'current' ? 10 : 0));
  };
  const avgScore = eligible.length ? Math.round(eligible.reduce((s, m) => s + sc(m), 0) / eligible.length) : 0;
  const pipelineValue = eligible.reduce((s, d) => s + Math.round(d.fundedAmt * 1.15 / 1000) * 1000, 0);
  const estRevenue = eligible.reduce((s, d) => s + Math.round(d.fundedAmt * 1.15 * (d.factor - 1) / 1000) * 1000, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Eligible" value={eligible.length.toString()} sub="≥50% collected threshold" accent="violet" />
        <KpiCard label="Pipeline Value" value={fmt(pipelineValue)} sub="Potential new funding" accent="indigo" />
        <KpiCard label="Est. Revenue" value={fmt(estRevenue)} sub="Factor profit on renewals" accent="emerald" />
        <KpiCard label="Avg Score" value={eligible.length ? avgScore.toString() : '-'} sub="Avg renewal score" accent="blue" />
        <KpiCard label="Near Payoff" value={DEALS.filter(d => d.totalOwed > 0 && d.collected / d.totalOwed >= 0.8 && d.status !== 'paid').length.toString()} sub="≥80% collected" accent="amber" />
      </div>

      <div className="bg-white rounded-[8px] border border-gray-200">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-violet-500" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Renewal Pipeline</h3>
            <p className="text-xs text-gray-500 mt-0.5">All active deals ranked by renewal readiness — scored on collection %, velocity, time since funding, and ACH health</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full"><thead><tr className="border-b border-gray-100 bg-gray-50">
            <Th className="pl-5">Merchant</Th><Th>Channel</Th><Th>Collected</Th><Th>Velocity</Th><Th>Days Since Fund</Th><Th>Renewal Score</Th><Th>Eligible</Th><Th className="pr-5">Suggested Terms</Th>
          </tr></thead>
            <tbody>{DEALS.filter(m => m.status !== 'paid').sort((a, b) => sc(b) - sc(a)).map(m => {
              const pct = m.totalOwed > 0 ? m.collected / m.totalOwed : 0;
              const daysSF = daysBetween(m.funded, today);
              const score = sc(m);
              const sColor = score >= 75 ? 'text-emerald-700 bg-emerald-50' : score >= 50 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';
              const sugAmt = Math.round(m.fundedAmt * (score >= 75 ? 1.25 : 1.0) / 1000) * 1000;
              const sugFactor = score >= 75 ? m.factor - 0.02 : m.factor;
              return (<tr key={m.id} className="border-b border-gray-50 hover:bg-violet-50/30">
                <td className="pl-5 py-3"><p className="text-sm font-semibold text-gray-900">{m.merchant}</p><p className="text-[11px] text-gray-400 font-mono">{m.id}</p></td>
                <td className="py-3"><ChannelBadge channel={m.channel} /></td>
                <td className="py-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct * 100}%` }} /></div><span className="text-xs tabular-nums text-gray-600">{fmtPct(pct)}</span></div></td>
                <td className="py-3"><VelocityArrow avg7d={m.avg7d} avg30d={m.avg30d} /></td>
                <td className="py-3 text-sm tabular-nums text-gray-600">{daysSF}d</td>
                <td className="py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${sColor}`}>{score}/100</span></td>
                <td className="py-3">{m.renewalEligible ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600"><RefreshCw className="w-2.5 h-2.5" /> Yes</span> : <span className="text-xs text-gray-400">Not yet</span>}</td>
                <td className="pr-5 py-3"><div className="bg-gray-50 rounded-[6px] px-2.5 py-1.5 inline-block"><p className="text-xs font-semibold text-gray-900">{fmtK(sugAmt)} @ {sugFactor.toFixed(2)}x</p><p className="text-[10px] text-gray-400">{score >= 75 ? '25% increase, reduced rate' : 'Same terms renewal'}</p></div></td>
              </tr>);
            })}{DEALS.filter(m => m.status !== 'paid').length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-sm text-gray-400">No active deals</td></tr>
            )}</tbody></table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// CONCENTRATION TAB
// ══════════════════════════════════════════
function ConcentrationTab({ M }: { M: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ConcentrationCard
          title="Channel Split"
          icon={<Activity className="w-4 h-4 text-orange-500" />}
          data={M.channelSplit}
          total={M.totalVolume}
          colors={['#4318FF', '#F97316']}
          footer={
            <div className="mt-3 p-3 bg-gray-50 rounded-[6px]">
              <p className="text-[11px] text-gray-500 font-medium mb-1">Capital at Risk</p>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Self-funded: {fmt(M.selfDeployed)} deployed (your capital)<br />
                Fundomate: {fmt(M.refFunded)} (their capital, your commission)<br />
                <span className="text-emerald-600 font-semibold">Referral = zero capital risk, pure fee income</span>
              </p>
            </div>
          }
        />
        <ConcentrationCard
          title="Self-Funded Concentration"
          icon={<Building2 className="w-4 h-4 text-brand" />}
          data={M.byMerchant}
          total={M.activeDeployed}
          colors={['#4318FF', '#06B6D4', '#22C55E', '#F59E0B', '#A855F7', '#EF4444', '#F472B6', '#818CF8']}
          warnThreshold={0.25}
        />
        <ConcentrationCard
          title="Vertical Concentration"
          icon={<TrendingUp className="w-4 h-4 text-violet-500" />}
          data={M.byVertical}
          total={M.activeDeployed}
          colors={['#4318FF', '#06B6D4', '#22C55E', '#F59E0B', '#A855F7', '#EF4444']}
          warnThreshold={0.30}
        />
      </div>

      <div className="bg-white rounded-[8px] border border-gray-200">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-gray-900">Vintage Cohort Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <Th>Cohort</Th><Th>Self</Th><Th>Ref</Th><Th>Self Deployed</Th><Th>Ref Volume</Th><Th>Collected</Th><Th>Dflt %</Th><Th>Collection Rate</Th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(M.vintages).sort(([a], [b]) => a.localeCompare(b)).map(([mo, vRaw]) => {
                const v = vRaw as any;
                const cr = v.owed > 0 ? v.collected / v.owed : 0;
                const dr = v.count > 0 ? v.defaults / v.count : 0;
                return (
                  <tr key={mo} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-3 py-2.5 text-sm font-semibold text-brand">
                      {new Date(mo + '-01T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-3 py-2.5 text-sm tabular-nums text-gray-700">{v.selfCount}</td>
                    <td className="px-3 py-2.5 text-sm tabular-nums text-orange-600">{v.refCount}</td>
                    <td className="px-3 py-2.5 text-sm tabular-nums text-gray-700">{v.deployed > 0 ? fmt(v.deployed) : '-'}</td>
                    <td className="px-3 py-2.5 text-sm tabular-nums text-orange-600">{v.refFunded > 0 ? fmt(v.refFunded) : '-'}</td>
                    <td className="px-3 py-2.5 text-sm tabular-nums text-emerald-600 font-medium">{fmt(v.collected)}</td>
                    <td className="px-3 py-2.5"><span className={`text-sm font-bold tabular-nums ${dr > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmtPct(dr)}</span></td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${cr > 0.7 ? 'bg-emerald-500' : cr > 0.4 ? 'bg-amber-500' : 'bg-gray-300'}`} style={{ width: `${cr * 100}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-gray-500 min-w-[36px] text-right">{fmtPct(cr)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {Object.keys(M.vintages).length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-sm text-gray-400">No vintage data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// COLLECTION ESCALATION MODAL
// ══════════════════════════════════════════
function CollectionModal({ dealId, DEALS, onClose }: { dealId: string; DEALS: CapitalDeal[]; onClose: () => void }) {
  const deal = DEALS.find(m => m.id === dealId);
  if (!deal) return null;
  const stages = [
    { name: 'ACH Auto-Retry',     desc: 'System retries ACH debit on next 3 business days', daysIn: 0,  done: deal.daysInDefault > 3,  active: deal.daysInDefault <= 3 },
    { name: 'Email Notification', desc: 'Automated payment failure notice to merchant owner', daysIn: 3,  done: deal.daysInDefault > 7,  active: deal.daysInDefault > 3 && deal.daysInDefault <= 7 },
    { name: 'Agent Phone Task',   desc: 'Task assigned to agent for personal outreach call', daysIn: 7,  done: deal.daysInDefault > 14, active: deal.daysInDefault > 7 && deal.daysInDefault <= 14 },
    { name: 'Formal Demand Letter', desc: 'Certified demand letter with 10-day cure period', daysIn: 14, done: deal.daysInDefault > 30, active: deal.daysInDefault > 14 && deal.daysInDefault <= 30 },
    { name: 'Legal Escalation',   desc: 'File with legal counsel — confession of judgment or litigation', daysIn: 30, done: false, active: deal.daysInDefault > 30 },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-[8px] shadow-2xl border border-gray-200 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div><h2 className="text-lg font-bold text-gray-900">Collection Workflow</h2><p className="text-xs text-gray-500">{deal.merchant} — {deal.id}</p></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-[6px] text-gray-500 text-lg">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-1">
          {stages.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s.done ? 'bg-emerald-100 text-emerald-700' : s.active ? 'bg-brand text-white ring-2 ring-brand/20' : 'bg-gray-100 text-gray-400'}`}>{s.done ? '✓' : i + 1}</div>
                {i < stages.length - 1 && <div className={`w-0.5 h-12 ${s.done ? 'bg-emerald-300' : s.active ? 'bg-brand/30' : 'bg-gray-200'}`} />}
              </div>
              <div className={`flex-1 pb-5 ${!s.done && !s.active ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-900">{s.name}</p><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${s.done ? 'bg-emerald-50 text-emerald-700' : s.active ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-400'}`}>{s.done ? 'Completed' : s.active ? 'In Progress' : 'Pending'}</span></div>
                <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Day {s.daysIn}+</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3 sticky bottom-0 bg-white">
          <button className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-[6px] hover:bg-brand-hover transition-colors">Advance to Next Stage</button>
          <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-[6px] hover:bg-gray-50 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════
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
    red: 'border-t-red-500', blue: 'border-t-blue-500', gray: 'border-t-gray-300',
    orange: 'border-t-orange-500', violet: 'border-t-violet-500',
  };
  return (
    <div className={`bg-white rounded-[8px] border border-gray-200 border-t-2 ${accentMap[accent] || ''} p-4`}>
      <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1.5">{label}</p>
      <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  );
}

function MiniKpi({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  const colorMap: Record<string, string> = { emerald: 'text-emerald-600', red: 'text-red-600', amber: 'text-amber-600' };
  return (
    <div className="bg-gray-50 rounded-[6px] p-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-base font-bold leading-none ${accent ? colorMap[accent] || 'text-gray-900' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function ExpandedKpi({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: React.ReactNode; accent?: string }) {
  const colorMap: Record<string, string> = { emerald: 'text-emerald-600', red: 'text-red-600', amber: 'text-amber-600', orange: 'text-orange-600', violet: 'text-violet-600' };
  return (
    <div>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-1">{label}</p>
      <p className={`text-base font-bold ${accent ? colorMap[accent] || 'text-gray-900' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ChannelBadge({ channel }: { channel: CapitalChannel }) {
  return channel === 'self' ? (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-600">Self</span>
  ) : (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-orange-50 text-orange-600">FDM</span>
  );
}

function VelocityArrow({ avg7d, avg30d }: { avg7d: number; avg30d: number }) {
  if (avg30d === 0) return <span className="text-xs text-gray-400">-</span>;
  const delta = (avg7d - avg30d) / avg30d;
  const up = delta >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${up ? 'text-emerald-600' : delta > -0.15 ? 'text-amber-600' : 'text-red-600'}`}>
      {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
      {Math.abs(delta * 100).toFixed(0)}%
    </span>
  );
}

function ConcentrationCard({ title, icon, data, total, colors, warnThreshold, footer }: {
  title: string; icon: React.ReactNode; data: { label: string; value: number }[];
  total: number; colors: string[]; warnThreshold?: number; footer?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[8px] border border-gray-200">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="px-5 py-4">
        {total > 0 ? (
          <>
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-4">
              {data.map((d, i) => (
                <div
                  key={i}
                  title={`${d.label}: ${fmtPct(d.value / total)}`}
                  className="rounded-full"
                  style={{ width: `${(d.value / total) * 100}%`, background: colors[i % colors.length], minWidth: d.value > 0 ? 3 : 0 }}
                />
              ))}
            </div>
            <div className="space-y-2">
              {data.map((d, i) => {
                const pct = d.value / total;
                const warn = warnThreshold && pct > warnThreshold;
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: colors[i % colors.length] }} />
                    <span className="text-sm text-gray-700 flex-1">{d.label}</span>
                    <span className="text-xs text-gray-500 tabular-nums">{fmtK(d.value)}</span>
                    <span className={`text-xs tabular-nums font-medium min-w-[40px] text-right ${warn ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>{fmtPct(pct)}</span>
                    {warn && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-400 py-2">No data yet</p>
        )}
        {footer}
      </div>
    </div>
  );
}

function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
