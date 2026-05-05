import React, { useState, useMemo } from 'react';
import {
  Banknote, TrendingDown, TrendingUp, CalendarClock, Percent, DollarSign,
  Plus, Search, ChevronDown, Building2, ArrowUpRight, ArrowDownRight,
  Activity, AlertTriangle, CheckCircle, Shield, RefreshCw, Zap, Clock,
  ChevronRight, ExternalLink,
} from 'lucide-react';
import { useAppNavigate } from '../NavigationContext';

// ── Deal Data ──
type DealStatus = 'active' | 'paid' | 'slow' | 'default';
type Channel = 'self' | 'fundomate';

interface Deal {
  id: string; merchant: string; type: string; channel: Channel;
  funded: string; fundedAmt: number; factor: number; totalOwed: number;
  collected: number; holdback: number; dailyDebit: number; status: DealStatus;
  daysInDefault: number; lastPayment: string; achStatus: string;
  avg7d: number; avg30d: number; stackCount: number; renewalEligible: boolean;
  uccFiled: string; uccExpires: string; costOfCapitalPaid: number;
  referralCommission: number; commissionRate?: number; commissionPaid?: boolean;
}

const DEALS: Deal[] = [
  { id:"MCA-2026-001", merchant:"Havana Bites Cafe", type:"Restaurant", channel:"self", funded:"2026-01-15", fundedAmt:18000, factor:1.35, totalOwed:24300, collected:17820, holdback:15, dailyDebit:145, status:"active", daysInDefault:0, lastPayment:"2026-04-12", achStatus:"current", avg7d:141, avg30d:148, stackCount:0, renewalEligible:true, uccFiled:"2026-01-14", uccExpires:"2031-01-14", costOfCapitalPaid:2160, referralCommission:0 },
  { id:"MCA-2026-002", merchant:"Coral Reef Auto Spa", type:"Auto Services", channel:"self", funded:"2026-02-03", fundedAmt:25000, factor:1.38, totalOwed:34500, collected:18400, holdback:18, dailyDebit:210, status:"active", daysInDefault:0, lastPayment:"2026-04-14", achStatus:"current", avg7d:215, avg30d:208, stackCount:1, renewalEligible:true, uccFiled:"2026-02-02", uccExpires:"2031-02-02", costOfCapitalPaid:2500, referralCommission:0 },
  { id:"MCA-2026-003", merchant:"Wynwood Ink Studio", type:"Retail", channel:"self", funded:"2025-11-20", fundedAmt:12000, factor:1.32, totalOwed:15840, collected:15840, holdback:12, dailyDebit:0, status:"paid", daysInDefault:0, lastPayment:"2026-03-28", achStatus:"completed", avg7d:0, avg30d:0, stackCount:0, renewalEligible:false, uccFiled:"2025-11-19", uccExpires:"2030-11-19", costOfCapitalPaid:1440, referralCommission:0 },
  { id:"MCA-2026-004", merchant:"SoBe Cycle & Fitness", type:"Health & Fitness", channel:"self", funded:"2026-03-01", fundedAmt:20000, factor:1.36, totalOwed:27200, collected:5440, holdback:15, dailyDebit:165, status:"active", daysInDefault:0, lastPayment:"2026-04-13", achStatus:"current", avg7d:162, avg30d:167, stackCount:0, renewalEligible:false, uccFiled:"2026-02-28", uccExpires:"2031-02-28", costOfCapitalPaid:800, referralCommission:0 },
  { id:"MCA-2026-005", merchant:"Little Havana Barbershop", type:"Personal Services", channel:"self", funded:"2025-12-10", fundedAmt:8000, factor:1.30, totalOwed:10400, collected:7280, holdback:10, dailyDebit:68, status:"slow", daysInDefault:5, lastPayment:"2026-04-08", achStatus:"nsf-retry", avg7d:42, avg30d:63, stackCount:2, renewalEligible:false, uccFiled:"2025-12-09", uccExpires:"2030-12-09", costOfCapitalPaid:960, referralCommission:0 },
  { id:"MCA-2026-006", merchant:"Doral Fresh Market", type:"Grocery", channel:"self", funded:"2026-01-28", fundedAmt:22000, factor:1.34, totalOwed:29480, collected:14150, holdback:16, dailyDebit:188, status:"active", daysInDefault:0, lastPayment:"2026-04-14", achStatus:"current", avg7d:192, avg30d:186, stackCount:0, renewalEligible:false, uccFiled:"2026-01-27", uccExpires:"2031-01-27", costOfCapitalPaid:1760, referralCommission:0 },
  { id:"MCA-2026-007", merchant:"Brickell Dry Cleaners", type:"Services", channel:"self", funded:"2026-02-20", fundedAmt:10000, factor:1.33, totalOwed:13300, collected:3990, holdback:12, dailyDebit:85, status:"default", daysInDefault:14, lastPayment:"2026-03-31", achStatus:"suspended", avg7d:0, avg30d:28, stackCount:3, renewalEligible:false, uccFiled:"2026-02-19", uccExpires:"2031-02-19", costOfCapitalPaid:600, referralCommission:0 },
  { id:"FDM-2026-001", merchant:"Midtown Taqueria", type:"Restaurant", channel:"fundomate", funded:"2026-02-10", fundedAmt:35000, factor:1.40, totalOwed:49000, collected:22050, holdback:17, dailyDebit:310, status:"active", daysInDefault:0, lastPayment:"2026-04-14", achStatus:"current", avg7d:305, avg30d:312, stackCount:0, renewalEligible:true, uccFiled:"2026-02-09", uccExpires:"2031-02-09", costOfCapitalPaid:0, referralCommission:2450, commissionRate:0.07, commissionPaid:true },
  { id:"FDM-2026-002", merchant:"Kendall Pet Grooming", type:"Personal Services", channel:"fundomate", funded:"2026-03-05", fundedAmt:18000, factor:1.36, totalOwed:24480, collected:6120, holdback:14, dailyDebit:155, status:"active", daysInDefault:0, lastPayment:"2026-04-13", achStatus:"current", avg7d:158, avg30d:153, stackCount:0, renewalEligible:false, uccFiled:"2026-03-04", uccExpires:"2031-03-04", costOfCapitalPaid:0, referralCommission:1260, commissionRate:0.07, commissionPaid:true },
  { id:"FDM-2026-003", merchant:"Aventura Nail Lounge", type:"Personal Services", channel:"fundomate", funded:"2026-03-18", fundedAmt:28000, factor:1.38, totalOwed:38640, collected:4636, holdback:15, dailyDebit:245, status:"active", daysInDefault:0, lastPayment:"2026-04-14", achStatus:"current", avg7d:248, avg30d:241, stackCount:1, renewalEligible:false, uccFiled:"2026-03-17", uccExpires:"2031-03-17", costOfCapitalPaid:0, referralCommission:1960, commissionRate:0.07, commissionPaid:false },
  { id:"FDM-2026-004", merchant:"Hialeah Tire & Brake", type:"Auto Services", channel:"fundomate", funded:"2026-01-22", fundedAmt:42000, factor:1.42, totalOwed:59640, collected:35784, holdback:20, dailyDebit:380, status:"active", daysInDefault:0, lastPayment:"2026-04-14", achStatus:"current", avg7d:375, avg30d:382, stackCount:0, renewalEligible:true, uccFiled:"2026-01-21", uccExpires:"2031-01-21", costOfCapitalPaid:0, referralCommission:2940, commissionRate:0.07, commissionPaid:true },
  { id:"FDM-2026-005", merchant:"Palmetto Bay Bakery", type:"Restaurant", channel:"fundomate", funded:"2026-04-01", fundedAmt:15000, factor:1.32, totalOwed:19800, collected:1188, holdback:12, dailyDebit:126, status:"active", daysInDefault:0, lastPayment:"2026-04-14", achStatus:"current", avg7d:126, avg30d:126, stackCount:0, renewalEligible:false, uccFiled:"2026-03-31", uccExpires:"2031-03-31", costOfCapitalPaid:0, referralCommission:1050, commissionRate:0.07, commissionPaid:false },
];

const COST_RATE = 0.02;
const today = '2026-04-14';

// ── Helpers ──
const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : fmt(n);
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtDateFull = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const daysBetween = (a: string, b: string) => Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000);

// ── Status / ACH configs ──
const statusConfig: Record<DealStatus, { label: string; bg: string; text: string; dot: string; bar: string }> = {
  active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  paid: { label: 'Paid Off', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', bar: 'bg-blue-500' },
  slow: { label: 'Slow Pay', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  default: { label: 'Default', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', bar: 'bg-red-500' },
};

const achColors: Record<string, string> = {
  current: 'text-emerald-600', completed: 'text-blue-600', 'nsf-retry': 'text-amber-600', suspended: 'text-red-600',
};
const achLabels: Record<string, string> = {
  current: 'Current', completed: 'Completed', 'nsf-retry': 'NSF Retry', suspended: 'Suspended',
};

// ══════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════
export function BackendCapital() {
  const { navigate } = useAppNavigate();
  const [filter, setFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'collections' | 'risk' | 'fraud' | 'renewals' | 'stacking' | 'concentration'>('portfolio');
  const [collectionModal, setCollectionModal] = useState<string | null>(null);

  const filtered = useMemo(() => DEALS.filter(m => {
    if (filter !== 'all' && m.status !== filter) return false;
    if (channelFilter !== 'all' && m.channel !== channelFilter) return false;
    if (search && !m.merchant.toLowerCase().includes(search.toLowerCase()) && !m.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [filter, search, channelFilter]);

  // ── Portfolio Metrics ──
  const M = useMemo(() => {
    const self = DEALS.filter(m => m.channel === 'self');
    const ref = DEALS.filter(m => m.channel === 'fundomate');
    const selfActive = self.filter(m => m.status !== 'paid');
    const allActive = DEALS.filter(m => m.status !== 'paid');

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
    const defaultRate = DEALS.filter(m => m.status === 'default').length / DEALS.length;
    const totalRevenue = selfNet + refCommTotal;
    const totalVolume = selfDeployed + refFunded;

    // Vintages
    const vintages: Record<string, { count: number; selfCount: number; refCount: number; deployed: number; refFunded: number; collected: number; owed: number; defaults: number; commissions: number }> = {};
    DEALS.forEach(m => {
      const mo = m.funded.slice(0, 7);
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

    return {
      selfDeployed, selfCollected, selfCOC, selfOutstanding, selfGross, selfNet, selfRTR, selfWAF, selfDaily,
      refFunded, refCommTotal, refCommPaid, refCommPending, refAvgRate,
      totalDeals, renewals, stacked, defaultRate, totalRevenue, totalVolume,
      vintages, activeDeployed, byMerchant, byVertical, channelSplit,
      selfCount: self.length, refCount: ref.length,
    };
  }, []);

  const statusTabs = [
    { key: 'all', label: 'All', count: DEALS.length },
    { key: 'active', label: 'Active', count: DEALS.filter(m => m.status === 'active').length },
    { key: 'slow', label: 'Slow', count: DEALS.filter(m => m.status === 'slow').length },
    { key: 'default', label: 'Default', count: DEALS.filter(m => m.status === 'default').length },
    { key: 'paid', label: 'Paid', count: DEALS.filter(m => m.status === 'paid').length },
  ];
  const channelTabs = [
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

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-5">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="delt-page-title">Capital</h1>
            <p className="delt-page-subtitle">Self-funded positions + Fundomate referral pipeline</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>ACH.com - DataMerch - FiCoSo</span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Synced Apr 14
              </span>
            </div>
            <button className="delt-btn-primary">
              <Plus className="w-4 h-4" /> New Deal
            </button>
          </div>
        </div>

        {/* ── View Tabs ── */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1">
            {([
              { key: 'portfolio' as const, label: 'Portfolio Overview' },
              { key: 'collections' as const, label: 'Collections' },
              { key: 'risk' as const, label: 'Risk Signals' },
              { key: 'fraud' as const, label: 'Fraud Detection' },
              { key: 'renewals' as const, label: 'Renewals' },
              { key: 'stacking' as const, label: 'Stacking & UCC' },
              { key: 'concentration' as const, label: 'Concentration & Vintage' },
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
        {activeTab === 'portfolio' && <>
          {/* Channel Summary Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Self-Funded Block */}
            <div className="lg:col-span-2 delt-card p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand to-brand-light" />
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-600">Self-Funded</span>
                <span className="text-xs text-gray-400">{M.selfCount} deals - Family office capital @ 2%/mo</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <MiniKpi label="Deployed" value={fmt(M.selfDeployed)} sub={`RTR ${fmtPct(M.selfRTR)}`} />
                <MiniKpi label="Outstanding" value={fmt(M.selfOutstanding)} sub={`WAF ${M.selfWAF.toFixed(3)}x`} />
                <MiniKpi label="Gross Collected" value={fmt(M.selfCollected)} sub={`Gross P&L ${fmt(M.selfGross)}`} />
                <MiniKpi label="Net After COC" value={fmt(M.selfNet)} sub={`COC: ${fmt(M.selfCOC)}`} accent={M.selfNet >= 0 ? 'emerald' : 'red'} />
                <MiniKpi label="Daily ACH" value={fmt(M.selfDaily)} />
              </div>
            </div>
            {/* Fundomate Block */}
            <div className="delt-card p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-400 to-transparent" />
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-orange-50 text-orange-600">Fundomate</span>
                <span className="text-xs text-gray-400">{M.refCount} referred - {fmtPct(M.refAvgRate)} avg comm</span>
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
            <KpiCard label="Stacked Deals" value={M.stacked.toString()} sub="DataMerch monitored" accent={M.stacked > 0 ? 'amber' : 'emerald'} />
            <KpiCard label="Renewal Pipeline" value={M.renewals.toString()} sub=">=50% collected" accent="violet" />
          </div>

          {/* ═══ FILTERS + SEARCH (portfolio tab only) ═══ */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Channel filter pills */}
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
              {/* Status filter pills */}
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

          {/* ═══ DEAL TABLE ═══ */}
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
                  <Th>Velocity</Th>
                  <Th>Stack</Th>
                  <Th>ACH</Th>
                  <Th className="pr-5">Status</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const remaining = m.totalOwed - m.collected;
                  const pct = m.collected / m.totalOwed;
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
                        <td className="py-3"><VelocityArrow avg7d={m.avg7d} avg30d={m.avg30d} /></td>
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

                      {/* ── EXPANDED ROW ── */}
                      {isExp && (
                        <tr>
                          <td colSpan={10} className="bg-gray-50 border-b border-gray-200 px-5 py-4">
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
                                  <ExpandedKpi label="UCC Expires" value={fmtDateFull(m.uccExpires)} sub={`Filed ${fmtDate(m.uccFiled)} - FiCoSo`} />
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
                                <div className="border-t border-gray-200 pt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                                  <ExpandedKpi label="7d / 30d Avg" value={`${fmt(m.avg7d)} / ${fmt(m.avg30d)}`} />
                                  <ExpandedKpi label="Velocity" value={<VelocityArrow avg7d={m.avg7d} avg30d={m.avg30d} />} sub={m.avg7d >= m.avg30d ? 'Stable' : 'Decelerating'} />
                                  <ExpandedKpi label="Stacking" value={m.stackCount > 0 ? `${m.stackCount} detected` : 'Clean'} sub="DataMerch" accent={m.stackCount > 0 ? 'amber' : 'emerald'} />
                                  <ExpandedKpi label="Last Payment" value={fmtDate(m.lastPayment)} sub="Fundomate servicing" />
                                  <ExpandedKpi label="UCC" value={fmtDateFull(m.uccExpires)} sub="Filed by Fundomate" />
                                </div>
                              </>
                            )}
                            {/* Navigate to full detail */}
                            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
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
                    <td colSpan={10} className="py-16 text-center text-sm text-gray-400">No deals match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {filtered.length}/{DEALS.length} deals - ACH.com - QBO - DataMerch - FiCoSo - Fundomate
            </p>
            <p className="text-xs text-gray-400"><span className="text-brand font-bold">delt</span>pay.com</p>
          </div>
        </>}

        {/* ═══ COLLECTIONS TAB ═══ */}
        {activeTab === 'collections' && (
          <div className="space-y-6">
            {/* Collection KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KpiCard label="Delinquent" value={DEALS.filter(m => m.status === 'slow' || m.status === 'default').length.toString()} sub={`${DEALS.filter(m => m.status === 'default').length} defaulted`} accent={DEALS.filter(m => m.status === 'default').length > 0 ? 'red' : 'emerald'} />
              <KpiCard label="NSF/Retry" value={DEALS.filter(m => m.achStatus === 'nsf-retry').length.toString()} sub="ACH failures pending" accent="amber" />
              <KpiCard label="Suspended" value={DEALS.filter(m => m.achStatus === 'suspended').length.toString()} sub="ACH debits halted" accent="red" />
              <KpiCard label="Daily ACH Active" value={fmt(DEALS.filter(m => m.achStatus === 'current').reduce((s, m) => s + m.dailyDebit, 0))} sub={`${DEALS.filter(m => m.achStatus === 'current').length} merchants`} accent="emerald" />
              <KpiCard label="At Risk Balance" value={fmt(DEALS.filter(m => m.status === 'slow' || m.status === 'default').reduce((s, m) => s + (m.totalOwed - m.collected), 0))} sub="Outstanding on delinquent" accent="red" />
            </div>

            {/* Collection Escalation Workflow */}
            <div className="delt-card">
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
                    { name: 'ACH Retry', icon: '↻', daysIn: 0, active: m.achStatus === 'nsf-retry', done: m.daysInDefault > 3, ts: m.daysInDefault >= 0 ? 'Day 1-3' : '' },
                    { name: 'Email Notice', icon: '✉', daysIn: 3, active: m.daysInDefault >= 3 && m.daysInDefault < 7, done: m.daysInDefault >= 7, ts: m.daysInDefault >= 3 ? 'Day 3' : '' },
                    { name: 'Agent Call', icon: '☎', daysIn: 7, active: m.daysInDefault >= 7 && m.daysInDefault < 14, done: m.daysInDefault >= 14, ts: m.daysInDefault >= 7 ? 'Day 7' : '' },
                    { name: 'Demand Letter', icon: '⚠', daysIn: 14, active: m.daysInDefault >= 14 && m.daysInDefault < 30, done: m.daysInDefault >= 30, ts: m.daysInDefault >= 14 ? 'Day 14' : '' },
                    { name: 'Legal', icon: '⚖', daysIn: 30, active: m.daysInDefault >= 30, done: false, ts: '' },
                  ];
                  const currentStage = stages.findLast(s => s.active || s.done) || stages[0];
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
                    <td className="py-3">
                      <button onClick={(e) => { e.stopPropagation(); setCollectionModal(m.id); }} className="px-2.5 py-1.5 bg-brand text-white text-[10px] font-semibold rounded-[6px] hover:bg-brand-hover transition-colors">{nextStage.name} →</button>
                    </td>
                  </tr>);
                })}{DEALS.filter(m => m.status === 'slow' || m.status === 'default').length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-sm text-gray-400">No delinquent accounts — all collections current</td></tr>
                )}</tbody></table>
              </div>
            </div>

            {/* ACH Status Overview */}
            <div className="delt-card">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-500" />
                <div><h3 className="text-sm font-semibold text-gray-900">ACH Status Overview</h3><p className="text-xs text-gray-500 mt-0.5">Real-time debit status for all active deals</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full"><thead><tr className="border-b border-gray-100 bg-gray-50">
                  <Th className="pl-5">Merchant</Th><Th>Channel</Th><Th>ACH Status</Th><Th>Daily Debit</Th><Th>Last Payment</Th><Th>7d Avg</Th><Th>30d Avg</Th><Th>Velocity</Th>
                </tr></thead>
                <tbody>{DEALS.filter(m => m.status !== 'paid').sort((a, b) => {
                  const order: Record<string, number> = { suspended: 0, 'nsf-retry': 1, current: 2 };
                  return (order[a.achStatus] ?? 3) - (order[b.achStatus] ?? 3);
                }).map(m => (
                  <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${m.achStatus === 'suspended' ? 'bg-red-50/30' : m.achStatus === 'nsf-retry' ? 'bg-amber-50/30' : ''}`}>
                    <td className="pl-5 py-2.5"><p className="text-sm font-medium text-gray-900">{m.merchant}</p><p className="text-[10px] text-gray-400 font-mono">{m.id}</p></td>
                    <td className="py-2.5"><ChannelBadge channel={m.channel} /></td>
                    <td className="py-2.5"><span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${m.achStatus === 'current' ? 'bg-emerald-50 text-emerald-700' : m.achStatus === 'nsf-retry' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}><span className={`w-1.5 h-1.5 rounded-full ${m.achStatus === 'current' ? 'bg-emerald-500' : m.achStatus === 'nsf-retry' ? 'bg-amber-500' : 'bg-red-500'}`} />{achLabels[m.achStatus]}</span></td>
                    <td className="py-2.5 text-sm font-semibold tabular-nums text-gray-900">{m.dailyDebit > 0 ? fmt(m.dailyDebit) : '-'}</td>
                    <td className="py-2.5 text-xs text-gray-500 tabular-nums">{fmtDate(m.lastPayment)}</td>
                    <td className="py-2.5 text-sm tabular-nums font-mono text-gray-700">{fmt(m.avg7d)}</td>
                    <td className="py-2.5 text-sm tabular-nums font-mono text-gray-700">{fmt(m.avg30d)}</td>
                    <td className="py-2.5"><VelocityArrow avg7d={m.avg7d} avg30d={m.avg30d} /></td>
                  </tr>
                ))}</tbody></table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ RISK SIGNALS TAB ═══ */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            {/* Risk Tier Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => {
                const active = DEALS.filter(m => m.status !== 'paid');
                const tiers = {
                  low: active.filter(m => m.achStatus === 'current' && m.stackCount === 0 && (m.avg30d === 0 || m.avg7d >= m.avg30d * 0.9)),
                  moderate: active.filter(m => m.achStatus === 'current' && (m.stackCount > 0 || (m.avg30d > 0 && m.avg7d < m.avg30d * 0.9))),
                  elevated: active.filter(m => m.achStatus === 'nsf-retry'),
                  critical: active.filter(m => m.achStatus === 'suspended' || m.status === 'default'),
                };
                return [
                  { label: 'Low Risk', count: tiers.low.length, bal: tiers.low.reduce((s, m) => s + (m.totalOwed - m.collected), 0), accent: 'emerald' },
                  { label: 'Moderate', count: tiers.moderate.length, bal: tiers.moderate.reduce((s, m) => s + (m.totalOwed - m.collected), 0), accent: 'amber' },
                  { label: 'Elevated', count: tiers.elevated.length, bal: tiers.elevated.reduce((s, m) => s + (m.totalOwed - m.collected), 0), accent: 'orange' as string },
                  { label: 'Critical', count: tiers.critical.length, bal: tiers.critical.reduce((s, m) => s + (m.totalOwed - m.collected), 0), accent: 'red' },
                ].map(t => <KpiCard key={t.label} label={t.label} value={t.count.toString()} sub={`${fmt(t.bal)} outstanding`} accent={t.accent} />);
              })()}
            </div>

            {/* Cross-Product Risk Correlation */}
            <div className="delt-card">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand" />
                <div><h3 className="text-sm font-semibold text-gray-900">Cross-Product Risk Correlation</h3><p className="text-xs text-gray-500 mt-0.5">Processing health alongside MCA repayment — early warning signals</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full"><thead><tr className="border-b border-gray-100 bg-gray-50">
                  <Th className="pl-5">Merchant</Th><Th>MCA Status</Th><Th>ACH</Th><Th>Processing Vol</Th><Th>Vol Trend (7d vs 30d)</Th><Th>Collection %</Th><Th>Risk Tier</Th><Th>Signal</Th>
                </tr></thead>
                <tbody>{DEALS.filter(m => m.status !== 'paid').map(m => {
                  const volTrend = m.avg30d > 0 ? (m.avg7d - m.avg30d) / m.avg30d : (m.avg7d === 0 ? -1 : 0);
                  const pct = m.collected / m.totalOwed;
                  const paymentsCurrent = m.achStatus === 'current';
                  const volDeclining = volTrend < -0.10;
                  const volGrowing = volTrend >= 0.03;
                  let signal: string, signalColor: string, signalBg: string;
                  if (volDeclining && paymentsCurrent) { signal = 'EARLY WARNING'; signalColor = 'text-red-700'; signalBg = 'bg-red-50 border-red-200'; }
                  else if (volGrowing && paymentsCurrent) { signal = 'RENEWAL SIGNAL'; signalColor = 'text-emerald-700'; signalBg = 'bg-emerald-50 border-emerald-200'; }
                  else if (!paymentsCurrent && volDeclining) { signal = 'HIGH RISK'; signalColor = 'text-red-700'; signalBg = 'bg-red-100 border-red-300'; }
                  else if (!paymentsCurrent) { signal = 'WATCH'; signalColor = 'text-amber-700'; signalBg = 'bg-amber-50 border-amber-200'; }
                  else { signal = 'STABLE'; signalColor = 'text-gray-600'; signalBg = 'bg-gray-50 border-gray-200'; }
                  // Risk tier
                  let tier: string, tierColor: string;
                  if (m.achStatus === 'suspended' || m.status === 'default') { tier = 'CRITICAL'; tierColor = 'text-red-700 bg-red-100'; }
                  else if (m.achStatus === 'nsf-retry') { tier = 'ELEVATED'; tierColor = 'text-orange-700 bg-orange-50'; }
                  else if (m.stackCount > 0 || (m.avg30d > 0 && m.avg7d < m.avg30d * 0.9)) { tier = 'MODERATE'; tierColor = 'text-amber-700 bg-amber-50'; }
                  else { tier = 'LOW'; tierColor = 'text-emerald-700 bg-emerald-50'; }
                  return (<tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${signal === 'HIGH RISK' || signal === 'EARLY WARNING' ? 'bg-red-50/20' : ''}`}>
                    <td className="pl-5 py-2.5"><p className="text-sm font-medium text-gray-900">{m.merchant}</p><p className="text-[10px] text-gray-400">{m.type}</p></td>
                    <td className="py-2.5"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig[m.status].bg} ${statusConfig[m.status].text}`}><span className={`w-1.5 h-1.5 rounded-full ${statusConfig[m.status].dot}`} />{statusConfig[m.status].label}</span></td>
                    <td className="py-2.5"><span className={`text-[10px] font-bold uppercase ${achColors[m.achStatus]}`}>{achLabels[m.achStatus]}</span></td>
                    <td className="py-2.5 text-sm tabular-nums font-mono text-gray-700">{m.avg7d > 0 ? `${fmt(m.avg7d)}/d` : '-'}</td>
                    <td className="py-2.5"><VelocityArrow avg7d={m.avg7d} avg30d={m.avg30d} /></td>
                    <td className="py-2.5"><div className="flex items-center gap-1.5"><div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${statusConfig[m.status].bar}`} style={{ width: `${pct * 100}%` }} /></div><span className="text-[10px] tabular-nums text-gray-500">{fmtPct(pct)}</span></div></td>
                    <td className="py-2.5"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${tierColor}`}>{tier}</span></td>
                    <td className="py-2.5"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${signalBg} ${signalColor}`}>{signal}</span></td>
                  </tr>);
                })}</tbody></table>
              </div>
            </div>

            {/* Payment Velocity */}
            <div className="delt-card">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-900">Payment Velocity Monitor</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <Th className="pl-5">Merchant</Th><Th>Ch</Th><Th>7d Avg</Th><Th>30d Avg</Th><Th>Delta</Th><Th>Signal</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEALS.filter(m => m.status !== 'paid').map(m => {
                      const delta = m.avg30d > 0 ? (m.avg7d - m.avg30d) / m.avg30d : 0;
                      const signal = m.avg7d === 0 ? 'STOPPED' : delta < -0.15 ? 'DECEL' : delta < 0 ? 'SOFT' : 'STABLE';
                      const sigColor = { STOPPED: 'text-red-600', DECEL: 'text-red-600', SOFT: 'text-amber-600', STABLE: 'text-emerald-600' }[signal];
                      return (
                        <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="pl-5 py-2.5 text-sm font-medium text-gray-900 max-w-[160px] truncate">{m.merchant}</td>
                          <td className="px-3 py-2.5"><ChannelBadge channel={m.channel} /></td>
                          <td className="px-3 py-2.5 text-sm tabular-nums text-gray-700 font-mono">{fmt(m.avg7d)}</td>
                          <td className="px-3 py-2.5 text-sm tabular-nums text-gray-700 font-mono">{fmt(m.avg30d)}</td>
                          <td className="px-3 py-2.5"><VelocityArrow avg7d={m.avg7d} avg30d={m.avg30d} /></td>
                          <td className="px-3 py-2.5"><span className={`text-[10px] font-bold uppercase tracking-wide ${sigColor}`}>{signal}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ FRAUD DETECTION TAB ═══ */}
        {activeTab === 'fraud' && (
          <div className="space-y-6">
            {/* Fraud Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="Active Flags" value={(() => { let c = 0; DEALS.forEach(m => { if (m.stackCount >= 2) c++; if (m.status === 'default' && m.avg7d === 0) c++; }); return c; })().toString()} sub="Across all rules" accent="red" />
              <KpiCard label="Multi-Stack" value={DEALS.filter(m => m.stackCount >= 2).length.toString()} sub="Multiple MCA detected" accent="amber" />
              <KpiCard label="Zero Processing" value={DEALS.filter(m => m.avg7d === 0 && m.status !== 'paid').length.toString()} sub="Stopped after funding" accent="red" />
              <KpiCard label="Clean Merchants" value={DEALS.filter(m => m.stackCount === 0 && m.avg7d > 0).length.toString()} sub="No fraud indicators" accent="emerald" />
            </div>

            {/* First-Party Fraud Detection Flags */}
            <div className="delt-card">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-red-500" /><div><h3 className="text-sm font-semibold text-gray-900">First-Party Fraud Detection (CPFPP)</h3><p className="text-xs text-gray-500 mt-0.5">Auto-flagged patterns across portfolio — DataMerch + FiCoSo cross-reference</p></div></div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700">{(() => { let c = 0; DEALS.forEach(m => { if (m.stackCount >= 2) c++; if (m.status === 'default' && m.avg7d === 0) c++; }); return c; })()} flags active</span>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { rule: 'Multiple MCAs across different business names', flagged: DEALS.filter(m => m.stackCount >= 2), severity: 'high' as const, detail: 'Owner may have MCAs under multiple DBAs — DataMerch cross-reference', source: 'DataMerch' },
                  { rule: 'Stopped processing but MCA funded on volume', flagged: DEALS.filter(m => m.avg7d === 0 && m.status !== 'paid'), severity: 'critical' as const, detail: 'MCA was underwritten based on card processing volume, but processing has ceased', source: 'ACH.com' },
                  { rule: 'Bank account changed shortly after funding', flagged: [] as Deal[], severity: 'high' as const, detail: 'No bank changes detected in current portfolio', source: 'ACH.com' },
                  { rule: 'Sudden address change post-funding', flagged: [] as Deal[], severity: 'medium' as const, detail: 'No address changes detected', source: 'FiCoSo' },
                  { rule: 'Revenue inconsistency: stated vs actual deposits', flagged: [] as Deal[], severity: 'high' as const, detail: 'Bank deposits match stated revenue within 15% tolerance', source: 'Bank Statements' },
                  { rule: 'UCC filed by unknown lender post-funding', flagged: [] as Deal[], severity: 'high' as const, detail: 'No unauthorized UCC filings detected', source: 'FiCoSo' },
                ].map((flag, i) => {
                  const sevColors = { critical: 'bg-red-100 text-red-800 border-red-200', high: 'bg-red-50 text-red-700 border-red-100', medium: 'bg-amber-50 text-amber-700 border-amber-100' };
                  return (<div key={i} className={`rounded-[6px] border p-3 ${flag.flagged.length > 0 ? sevColors[flag.severity] : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {flag.flagged.length > 0 ? <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                          <p className="text-sm font-semibold">{flag.rule}</p>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/80 text-gray-500 border border-gray-200">{flag.source}</span>
                        </div>
                        <p className="text-xs opacity-80 ml-[22px]">{flag.detail}</p>
                        {flag.flagged.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2 ml-[22px]">{flag.flagged.map(m => (
                            <span key={m.id} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/60 border border-gray-300">{m.merchant} ({m.id})</span>
                          ))}</div>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${flag.flagged.length > 0 ? 'bg-white/50' : 'bg-emerald-100 text-emerald-700'}`}>
                        {flag.flagged.length > 0 ? `${flag.flagged.length} flagged` : 'Clear'}
                      </span>
                    </div>
                  </div>);
                })}
              </div>
            </div>

            {/* Merchant Fraud Risk Matrix */}
            <div className="delt-card">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand" />
                <div><h3 className="text-sm font-semibold text-gray-900">Merchant Fraud Risk Matrix</h3><p className="text-xs text-gray-500 mt-0.5">Per-merchant fraud indicator scoring</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full"><thead><tr className="border-b border-gray-100 bg-gray-50">
                  <Th className="pl-5">Merchant</Th><Th>Stacking</Th><Th>Processing</Th><Th>Bank Changes</Th><Th>UCC Anomalies</Th><Th>Revenue Match</Th><Th>Fraud Score</Th>
                </tr></thead>
                <tbody>{DEALS.filter(m => m.status !== 'paid').map(m => {
                  const stackScore = m.stackCount >= 2 ? 30 : m.stackCount === 1 ? 10 : 0;
                  const procScore = m.avg7d === 0 ? 30 : (m.avg30d > 0 && m.avg7d < m.avg30d * 0.7) ? 15 : 0;
                  const bankScore = 0;
                  const uccScore = 0;
                  const revScore = 0;
                  const total = stackScore + procScore + bankScore + uccScore + revScore;
                  const riskColor = total >= 40 ? 'text-red-700 bg-red-100' : total >= 20 ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50';
                  return (<tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${total >= 40 ? 'bg-red-50/20' : ''}`}>
                    <td className="pl-5 py-2.5"><p className="text-sm font-medium text-gray-900">{m.merchant}</p><p className="text-[10px] text-gray-400 font-mono">{m.id}</p></td>
                    <td className="py-2.5"><FraudIndicator score={stackScore} max={30} /></td>
                    <td className="py-2.5"><FraudIndicator score={procScore} max={30} /></td>
                    <td className="py-2.5"><FraudIndicator score={bankScore} max={15} /></td>
                    <td className="py-2.5"><FraudIndicator score={uccScore} max={15} /></td>
                    <td className="py-2.5"><FraudIndicator score={revScore} max={10} /></td>
                    <td className="py-2.5"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${riskColor}`}>{total}/100</span></td>
                  </tr>);
                })}</tbody></table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ RENEWALS TAB ═══ */}
        {activeTab === 'renewals' && (
          <div className="space-y-6">
            {/* Renewal Pipeline KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KpiCard label="Eligible" value={DEALS.filter(d => d.renewalEligible).length.toString()} sub="≥50% collected threshold" accent="violet" />
              <KpiCard label="Pipeline Value" value={fmt(DEALS.filter(d => d.renewalEligible).reduce((s, d) => s + Math.round(d.fundedAmt * 1.15 / 1000) * 1000, 0))} sub="Potential new funding" accent="indigo" />
              <KpiCard label="Est. Revenue" value={fmt(DEALS.filter(d => d.renewalEligible).reduce((s, d) => s + Math.round(d.fundedAmt * 1.15 * (d.factor - 1) / 1000) * 1000, 0))} sub="Factor profit on renewals" accent="emerald" />
              <KpiCard label="Avg Score" value={(() => { const elig = DEALS.filter(d => d.renewalEligible); if (!elig.length) return '-'; const avg = elig.reduce((s, m) => { const pct = m.collected / m.totalOwed; return s + Math.round((pct * 40) + (m.avg7d >= m.avg30d ? 30 : 15) + (Math.min(daysBetween(m.funded, today) / 180, 1) * 20) + (m.achStatus === 'current' ? 10 : 0)); }, 0) / elig.length; return Math.round(avg).toString(); })()} sub="Avg renewal score" accent="blue" />
              <KpiCard label="Near Payoff" value={DEALS.filter(d => d.collected / d.totalOwed >= 0.8 && d.status !== 'paid').length.toString()} sub="≥80% collected" accent="amber" />
            </div>

            {/* Renewal Scoring Model */}
            <div className="delt-card">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-violet-500" />
                <div><h3 className="text-sm font-semibold text-gray-900">Renewal Scoring Model</h3><p className="text-xs text-gray-500 mt-0.5">{DEALS.filter(d => d.renewalEligible).length} merchants approaching payoff — scored by likelihood</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full"><thead><tr className="border-b border-gray-100 bg-gray-50"><Th className="pl-5">Merchant</Th><Th>Collected</Th><Th>Repayment</Th><Th>Volume Trend</Th><Th>Days Since Fund</Th><Th>Renewal Score</Th><Th>Suggested Terms</Th></tr></thead>
                  <tbody>{DEALS.filter(d => d.renewalEligible).sort((a, b) => {
                    const sc = (m: Deal) => Math.round((m.collected / m.totalOwed) * 40 + (m.avg7d >= m.avg30d ? 30 : m.avg30d > 0 ? 15 : 0) + Math.min(daysBetween(m.funded, today) / 180, 1) * 20 + (m.achStatus === 'current' ? 10 : 0));
                    return sc(b) - sc(a);
                  }).map(m => {
                    const pct = m.collected / m.totalOwed;
                    const daysSF = daysBetween(m.funded, today);
                    const score = Math.round((pct * 40) + (m.avg7d >= m.avg30d ? 30 : m.avg30d > 0 ? 15 : 0) + (Math.min(daysSF / 180, 1) * 20) + (m.achStatus === 'current' ? 10 : 0));
                    const sColor = score >= 75 ? 'text-emerald-700 bg-emerald-50' : score >= 50 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';
                    const sugAmt = Math.round(m.fundedAmt * (score >= 75 ? 1.25 : 1.0) / 1000) * 1000;
                    const sugFactor = score >= 75 ? m.factor - 0.02 : m.factor;
                    return (<tr key={m.id} className="border-b border-gray-50 hover:bg-violet-50/30">
                      <td className="pl-5 py-3"><p className="text-sm font-semibold text-gray-900">{m.merchant}</p><p className="text-[11px] text-gray-400 font-mono">{m.id}</p></td>
                      <td className="py-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct * 100}%` }} /></div><span className="text-xs tabular-nums text-gray-600">{fmtPct(pct)}</span></div></td>
                      <td className="py-3"><span className={`text-xs font-semibold ${m.achStatus === 'current' ? 'text-emerald-600' : 'text-amber-600'}`}>{m.achStatus === 'current' ? 'Perfect' : 'Issues'}</span></td>
                      <td className="py-3"><VelocityArrow avg7d={m.avg7d} avg30d={m.avg30d} /></td>
                      <td className="py-3 text-sm tabular-nums text-gray-600">{daysSF}d</td>
                      <td className="py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${sColor}`}>{score}/100</span></td>
                      <td className="py-3"><div className="bg-gray-50 rounded-[6px] px-2.5 py-1.5"><p className="text-xs font-semibold text-gray-900">{fmtK(sugAmt)} @ {sugFactor.toFixed(2)}x</p><p className="text-[10px] text-gray-400">{score >= 75 ? '25% increase, reduced rate' : 'Same terms renewal'}</p></div></td>
                    </tr>);
                  })}</tbody>
                </table>
              </div>
            </div>

            {/* All Deals - Renewal Readiness */}
            <div className="delt-card">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <div><h3 className="text-sm font-semibold text-gray-900">Full Portfolio — Renewal Readiness</h3><p className="text-xs text-gray-500 mt-0.5">Collection progress toward renewal eligibility (50% threshold)</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full"><thead><tr className="border-b border-gray-100 bg-gray-50">
                  <Th className="pl-5">Merchant</Th><Th>Channel</Th><Th>Funded</Th><Th>Collection Progress</Th><Th>Status</Th><Th>Est. Days to 50%</Th><Th>Eligible</Th>
                </tr></thead>
                <tbody>{DEALS.filter(m => m.status !== 'paid').sort((a, b) => (b.collected / b.totalOwed) - (a.collected / a.totalOwed)).map(m => {
                  const pct = m.collected / m.totalOwed;
                  const toFifty = pct >= 0.5 ? 0 : m.dailyDebit > 0 ? Math.ceil(((m.totalOwed * 0.5) - m.collected) / m.dailyDebit) : -1;
                  return (<tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="pl-5 py-2.5"><p className="text-sm font-medium text-gray-900">{m.merchant}</p><p className="text-[10px] text-gray-400 font-mono">{m.id}</p></td>
                    <td className="py-2.5"><ChannelBadge channel={m.channel} /></td>
                    <td className="py-2.5 text-sm tabular-nums text-gray-700">{fmtK(m.fundedAmt)}</td>
                    <td className="py-2.5 pr-4"><div className="flex items-center gap-2"><div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct >= 0.5 ? 'bg-violet-500' : 'bg-gray-300'}`} style={{ width: `${pct * 100}%` }} /></div><span className="text-xs tabular-nums text-gray-500 min-w-[36px] text-right">{fmtPct(pct)}</span></div></td>
                    <td className="py-2.5"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig[m.status].bg} ${statusConfig[m.status].text}`}><span className={`w-1.5 h-1.5 rounded-full ${statusConfig[m.status].dot}`} />{statusConfig[m.status].label}</span></td>
                    <td className="py-2.5 text-sm tabular-nums text-gray-600">{toFifty === 0 ? <span className="text-emerald-600 font-semibold">Reached</span> : toFifty > 0 ? `${toFifty}d` : '-'}</td>
                    <td className="py-2.5">{m.renewalEligible ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600"><RefreshCw className="w-2.5 h-2.5" /> Yes</span> : <span className="text-xs text-gray-400">Not yet</span>}</td>
                  </tr>);
                })}</tbody></table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STACKING & UCC TAB ═══ */}
        {activeTab === 'stacking' && (
          <div className="space-y-6">
            {/* Stacking KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KpiCard label="Clean" value={DEALS.filter(m => m.stackCount === 0).length.toString()} sub="No stacking detected" accent="emerald" />
              <KpiCard label="Single Stack" value={DEALS.filter(m => m.stackCount === 1).length.toString()} sub="1 additional MCA" accent="amber" />
              <KpiCard label="Multi-Stack" value={DEALS.filter(m => m.stackCount >= 2).length.toString()} sub="2+ additional MCAs" accent="red" />
              <KpiCard label="UCC Active" value={DEALS.filter(m => daysBetween(today, m.uccExpires) > 0).length.toString()} sub="Liens on file" accent="indigo" />
              <KpiCard label="UCC Expiring <1yr" value={DEALS.filter(m => daysBetween(today, m.uccExpires) < 365).length.toString()} sub="Need renewal" accent={DEALS.filter(m => daysBetween(today, m.uccExpires) < 365).length > 0 ? 'amber' : 'emerald'} />
            </div>

            {/* DataMerch Stacking Monitor */}
            <div className="delt-card">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /><div><h3 className="text-sm font-semibold text-gray-900">DataMerch Stacking Monitor</h3><p className="text-xs text-gray-500 mt-0.5">Cross-lender MCA position detection — synced daily</p></div></div>
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />DataMerch synced Apr 14</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full"><thead><tr className="border-b border-gray-100 bg-gray-50">
                  <Th className="pl-5">Merchant</Th><Th>Channel</Th><Th>Our Position</Th><Th>Stack Count</Th><Th>Risk Level</Th><Th>Total Exposure (Est.)</Th><Th>DataMerch Notes</Th>
                </tr></thead>
                <tbody>{DEALS.sort((a, b) => b.stackCount - a.stackCount).map(m => {
                  const riskLevel = m.stackCount >= 3 ? 'CRITICAL' : m.stackCount >= 2 ? 'HIGH' : m.stackCount === 1 ? 'MODERATE' : 'LOW';
                  const riskColor = { CRITICAL: 'text-red-700 bg-red-100', HIGH: 'text-red-700 bg-red-50', MODERATE: 'text-amber-700 bg-amber-50', LOW: 'text-emerald-700 bg-emerald-50' }[riskLevel];
                  const estExposure = m.stackCount > 0 ? m.fundedAmt * (1 + m.stackCount * 0.8) : m.fundedAmt;
                  const notes = m.stackCount >= 3 ? 'Multiple lenders - default risk elevated' : m.stackCount >= 2 ? 'Overlapping positions detected' : m.stackCount === 1 ? 'Single additional position' : 'No external positions found';
                  return (<tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${m.stackCount >= 2 ? 'bg-red-50/20' : ''}`}>
                    <td className="pl-5 py-2.5"><p className="text-sm font-medium text-gray-900">{m.merchant}</p><p className="text-[10px] text-gray-400 font-mono">{m.id}</p></td>
                    <td className="py-2.5"><ChannelBadge channel={m.channel} /></td>
                    <td className="py-2.5 text-sm tabular-nums text-gray-700">{fmtK(m.fundedAmt)}</td>
                    <td className="py-2.5">{m.stackCount === 0 ? <span className="text-xs text-gray-400">0 — Clean</span> : <span className={`inline-flex items-center gap-1 text-xs font-bold ${m.stackCount >= 2 ? 'text-red-600' : 'text-amber-600'}`}><AlertTriangle className="w-3 h-3" /> {m.stackCount}</span>}</td>
                    <td className="py-2.5"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${riskColor}`}>{riskLevel}</span></td>
                    <td className="py-2.5 text-sm tabular-nums text-gray-700">{m.stackCount > 0 ? `~${fmtK(estExposure)}` : fmt(m.fundedAmt)}</td>
                    <td className="py-2.5 text-xs text-gray-500 max-w-[200px]">{notes}</td>
                  </tr>);
                })}</tbody></table>
              </div>
            </div>

            {/* FiCoSo UCC Filing Status */}
            <div className="delt-card">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-brand" /><div><h3 className="text-sm font-semibold text-gray-900">FiCoSo UCC Filing Status</h3><p className="text-xs text-gray-500 mt-0.5">UCC-1 lien positions and expiration tracking</p></div></div>
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />FiCoSo synced Apr 14</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full"><thead><tr className="border-b border-gray-100 bg-gray-50">
                  <Th className="pl-5">Merchant</Th><Th>Channel</Th><Th>UCC Filed</Th><Th>UCC Expires</Th><Th>Time Remaining</Th><Th>Filed By</Th><Th>Position</Th><Th>Action</Th>
                </tr></thead>
                <tbody>{DEALS.sort((a, b) => daysBetween(today, a.uccExpires) - daysBetween(today, b.uccExpires)).map(m => {
                  const uccDays = daysBetween(today, m.uccExpires);
                  const uccColor = uccDays < 365 ? 'text-red-600' : uccDays < 730 ? 'text-amber-600' : 'text-emerald-600';
                  const filedBy = m.channel === 'self' ? 'Delt Pay' : 'Fundomate';
                  return (<tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${uccDays < 365 ? 'bg-red-50/20' : ''}`}>
                    <td className="pl-5 py-2.5"><p className="text-sm font-medium text-gray-900">{m.merchant}</p><p className="text-[10px] text-gray-400 font-mono">{m.id}</p></td>
                    <td className="py-2.5"><ChannelBadge channel={m.channel} /></td>
                    <td className="py-2.5 text-xs text-gray-500 tabular-nums">{fmtDateFull(m.uccFiled)}</td>
                    <td className="py-2.5 text-xs text-gray-500 tabular-nums">{fmtDateFull(m.uccExpires)}</td>
                    <td className="py-2.5"><span className={`text-xs font-semibold tabular-nums ${uccColor}`}>{uccDays > 365 ? `${Math.floor(uccDays / 365)}y ${Math.floor((uccDays % 365) / 30)}m` : `${uccDays}d`}</span></td>
                    <td className="py-2.5 text-xs text-gray-600">{filedBy}</td>
                    <td className="py-2.5"><span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600">1st</span></td>
                    <td className="py-2.5">{uccDays < 365 ? <button className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded-[6px] hover:bg-amber-100 transition-colors">Renew UCC</button> : <span className="text-[10px] text-gray-400">Active</span>}</td>
                  </tr>);
                })}</tbody></table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ CONCENTRATION TAB ═══ */}
        {/* ═══ COLLECTION ESCALATION MODAL ═══ */}
        {collectionModal && (() => {
          const deal = DEALS.find(m => m.id === collectionModal);
          if (!deal) return null;
          const stages = [
            { name: 'ACH Auto-Retry', desc: 'System retries ACH debit on next 3 business days', daysIn: 0, done: deal.daysInDefault > 3, active: deal.daysInDefault <= 3, ts: deal.daysInDefault >= 0 ? fmtDate(deal.lastPayment) : '-' },
            { name: 'Email Notification', desc: 'Automated payment failure notice to merchant owner', daysIn: 3, done: deal.daysInDefault > 7, active: deal.daysInDefault > 3 && deal.daysInDefault <= 7, ts: deal.daysInDefault >= 3 ? 'Sent' : 'Pending' },
            { name: 'Agent Phone Task', desc: 'Task assigned to agent for personal outreach call', daysIn: 7, done: deal.daysInDefault > 14, active: deal.daysInDefault > 7 && deal.daysInDefault <= 14, ts: deal.daysInDefault >= 7 ? 'Assigned' : 'Pending' },
            { name: 'Formal Demand Letter', desc: 'Certified demand letter with cure period (10 business days)', daysIn: 14, done: deal.daysInDefault > 30, active: deal.daysInDefault > 14 && deal.daysInDefault <= 30, ts: deal.daysInDefault >= 14 ? 'Sent' : 'Pending' },
            { name: 'Legal Escalation', desc: 'File with legal counsel — confession of judgment or litigation', daysIn: 30, done: false, active: deal.daysInDefault > 30, ts: deal.daysInDefault >= 30 ? 'Active' : 'Pending' },
          ];
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30" onClick={() => setCollectionModal(null)} />
              <div className="relative bg-white rounded-[8px] shadow-2xl border border-gray-200 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div><h2 className="text-lg font-bold text-gray-900">Collection Workflow</h2><p className="text-xs text-gray-500">{deal.merchant} &mdash; {deal.id}</p></div>
                  <button onClick={() => setCollectionModal(null)} className="p-2 hover:bg-gray-100 rounded-[6px] text-gray-500 text-lg">&times;</button>
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
                        <p className="text-[10px] text-gray-400 mt-0.5">Day {s.daysIn}+ &bull; {s.ts}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3 sticky bottom-0 bg-white">
                  <button className="delt-btn-primary">Advance to Next Stage</button>
                  <button onClick={() => setCollectionModal(null)} className="delt-btn-secondary">Close</button>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'concentration' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Channel Split */}
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
              {/* By Merchant */}
              <ConcentrationCard
                title="Self-Funded Concentration"
                icon={<Building2 className="w-4 h-4 text-brand" />}
                data={M.byMerchant}
                total={M.activeDeployed}
                colors={['#4318FF', '#06B6D4', '#22C55E', '#F59E0B', '#A855F7', '#EF4444', '#F472B6', '#818CF8']}
                warnThreshold={0.25}
              />
              {/* By Vertical */}
              <ConcentrationCard
                title="Vertical Concentration"
                icon={<TrendingUp className="w-4 h-4 text-violet-500" />}
                data={M.byVertical}
                total={M.activeDeployed}
                colors={['#4318FF', '#06B6D4', '#22C55E', '#F59E0B', '#A855F7', '#EF4444']}
                warnThreshold={0.30}
              />
            </div>

            {/* Vintage Cohort */}
            <div className="delt-card">
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
                    {Object.entries(M.vintages).sort(([a], [b]) => a.localeCompare(b)).map(([mo, v]) => {
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
                          <td className="px-3 py-2.5">
                            <span className={`text-sm font-bold tabular-nums ${dr > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {fmtPct(dr)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${cr > 0.7 ? 'bg-emerald-500' : cr > 0.4 ? 'bg-amber-500' : 'bg-gray-300'}`}
                                  style={{ width: `${cr * 100}%` }}
                                />
                              </div>
                              <span className="text-xs tabular-nums text-gray-500 min-w-[36px] text-right">{fmtPct(cr)}</span>
                            </div>
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
      </div>

      <NewDealFlow
        open={newDealOpen}
        onClose={() => setNewDealOpen(false)}
      />
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
    red: 'border-t-red-500', blue: 'border-t-blue-500', gray: 'border-t-gray-300',
    orange: 'border-t-orange-500', violet: 'border-t-violet-500',
  };
  return (
    <div className={`delt-card border-t-2 ${accentMap[accent] || ''} p-4`}>
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

function ChannelBadge({ channel }: { channel: Channel }) {
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
    <div className="delt-card">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="px-5 py-4">
        {/* Bar */}
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
        {/* Legend */}
        <div className="space-y-2">
          {data.map((d, i) => {
            const pct = d.value / total;
            const warn = warnThreshold && pct > warnThreshold;
            return (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: colors[i % colors.length] }} />
                <span className="text-sm text-gray-700 flex-1">{d.label}</span>
                <span className="text-xs text-gray-500 tabular-nums">{fmtK(d.value)}</span>
                <span className={`text-xs tabular-nums font-medium min-w-[40px] text-right ${warn ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>
                  {fmtPct(pct)}
                </span>
                {warn && <AlertTriangle className="w-3 h-3 text-amber-500" />}
              </div>
            );
          })}
        </div>
        {footer}
      </div>
    </div>
  );
}

function FraudIndicator({ score, max }: { score: number; max: number }) {
  if (score === 0) return <span className="text-xs text-emerald-500">✓ Clear</span>;
  const pct = score / max;
  const color = pct >= 0.8 ? 'bg-red-500' : pct >= 0.5 ? 'bg-amber-500' : 'bg-amber-300';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-10 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct * 100}%` }} />
      </div>
      <span className="text-[10px] tabular-nums text-gray-500">{score}/{max}</span>
    </div>
  );
}

function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}