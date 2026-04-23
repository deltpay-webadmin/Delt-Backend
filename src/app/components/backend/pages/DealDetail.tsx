import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, DollarSign, Calendar, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, Clock, FileText, ChevronRight, Shield, Building2, Percent,
  Download, ExternalLink, CreditCard, Activity, Zap, RotateCcw, Eye,
  ArrowUpRight, ArrowDownRight, Ban, RefreshCw, Info,
} from 'lucide-react';
import { useAppNavigate } from '../NavigationContext';

// ── Helpers ──
const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const fmtFull = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtDateShort = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const daysBetween = (a: string, b: string) => Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000);
const today = '2026-04-14';
const COST_RATE = 0.02;

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

// Also map legacy IDs from the Capital table
const LEGACY_MAP: Record<string, string> = {
  'MCA-1001': 'MCA-2026-001', 'MCA-1002': 'MCA-2026-002', 'MCA-1003': 'MCA-2026-005',
  'MCA-1004': 'MCA-2026-004', 'MCA-1005': 'MCA-2026-003', 'MCA-1006': 'MCA-2026-006',
  'MCA-1007': 'MCA-2026-007', 'MCA-1008': 'FDM-2026-001', 'MCA-1009': 'FDM-2026-002',
  'MCA-1010': 'FDM-2026-003', 'MCA-1011': 'FDM-2026-004', 'MCA-1012': 'FDM-2026-005',
};

// ── Generate mock payment schedule ──
function generatePayments(deal: Deal) {
  const payments: { date: string; expected: number; actual: number; balance: number; status: string }[] = [];
  let balance = deal.totalOwed;
  const startDate = new Date(deal.funded + 'T12:00:00');
  const numPayments = Math.min(30, daysBetween(deal.funded, today));
  
  for (let i = 1; i <= numPayments; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const dateStr = d.toISOString().split('T')[0];
    const expected = deal.dailyDebit || Math.round(deal.totalOwed / 150);
    // Simulate some missed payments for slow/default
    let actual = expected;
    if (deal.status === 'default' && i > numPayments - 20) actual = 0;
    else if (deal.status === 'slow' && i > numPayments - 8 && Math.random() > 0.5) actual = Math.round(expected * 0.5);
    balance = Math.max(0, balance - actual);
    payments.push({ date: dateStr, expected, actual, balance, status: actual >= expected ? 'paid' : actual > 0 ? 'partial' : 'missed' });
  }
  return payments.reverse().slice(0, 15);
}

export function DealDetail() {
  const { navigate, currentPage } = useAppNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'financials'>('overview');

  const dealId = currentPage.split('/deals/')[1] || '';
  const mappedId = LEGACY_MAP[dealId] || dealId;
  const deal = DEALS.find(d => d.id === mappedId || d.id === dealId) || DEALS[0];

  const outstanding = deal.totalOwed - deal.collected;
  const pctCollected = deal.totalOwed > 0 ? deal.collected / deal.totalOwed : 0;
  const daysActive = daysBetween(deal.funded, today);
  const estDaysRemaining = deal.dailyDebit > 0 ? Math.ceil(outstanding / deal.dailyDebit) : 0;
  const grossProfit = deal.collected - deal.fundedAmt;
  const netProfit = deal.channel === 'self' ? grossProfit - deal.costOfCapitalPaid : deal.referralCommission;
  const monthsActive = Math.max(1, daysActive / 30);
  const costOfCapitalAccrued = deal.channel === 'self' ? deal.fundedAmt * COST_RATE * monthsActive : 0;
  const trueProfit = deal.channel === 'self' ? Math.max(deal.collected - deal.fundedAmt, 0) - deal.costOfCapitalPaid : deal.referralCommission;
  const daysToBreakeven = deal.collected >= deal.fundedAmt ? 0 : deal.dailyDebit > 0 ? Math.ceil((deal.fundedAmt - deal.collected) / deal.dailyDebit) : -1;
  const estPayoffDate = deal.dailyDebit > 0 && outstanding > 0 ? (() => { const d = new Date(); d.setDate(d.getDate() + estDaysRemaining); return d.toISOString().split('T')[0]; })() : null;
  const breakevenDate = daysToBreakeven > 0 ? (() => { const d = new Date(); d.setDate(d.getDate() + daysToBreakeven); return d.toISOString().split('T')[0]; })() : null;

  // Velocity
  const velocityDelta = deal.avg30d > 0 ? (deal.avg7d - deal.avg30d) / deal.avg30d : 0;
  const velocitySignal = deal.avg7d === 0 ? 'Stopped' : velocityDelta < -0.15 ? 'Decelerating' : velocityDelta < 0 ? 'Softening' : 'Stable';
  const velocityColor = deal.avg7d === 0 ? 'text-red-600' : velocityDelta < -0.15 ? 'text-red-600' : velocityDelta < 0 ? 'text-amber-600' : 'text-emerald-600';

  const payments = useMemo(() => generatePayments(deal), [deal.id]);

  const statusConfig: Record<DealStatus, { label: string; bg: string; text: string; dot: string }> = {
    active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    paid: { label: 'Paid Off', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    slow: { label: 'Slow Pay', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    default: { label: 'Default', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  };

  const achConfig: Record<string, { label: string; color: string }> = {
    current: { label: 'Current', color: 'text-emerald-600' },
    completed: { label: 'Completed', color: 'text-blue-600' },
    'nsf-retry': { label: 'NSF Retry', color: 'text-amber-600' },
    suspended: { label: 'Suspended', color: 'text-red-600' },
  };

  const st = statusConfig[deal.status];
  const ach = achConfig[deal.achStatus] || { label: deal.achStatus, color: 'text-gray-500' };
  const uccDaysLeft = daysBetween(today, deal.uccExpires);

  return (
    <div className="min-h-full bg-canvas pb-16">
      {/* ═══ Header ═══ */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1440px] mx-auto px-6 py-5">
          <button
            onClick={() => navigate('/capital')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Capital
          </button>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-2xl font-bold text-gray-900">{deal.merchant}</h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
                {deal.renewalEligible && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 uppercase tracking-wide">
                    <RefreshCw className="w-3 h-3" /> Renewal Eligible
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">{deal.id}</span>
                <span>{deal.type}</span>
                <span>-</span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                  deal.channel === 'self' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  {deal.channel === 'self' ? 'Self-Funded' : 'Fundomate'}
                </span>
                <span>-</span>
                <span>Funded {fmtDate(deal.funded)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3.5 py-2 border border-gray-200 rounded-[6px] text-sm text-gray-600 bg-white hover:bg-gray-50 inline-flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
              <button className="px-3.5 py-2 bg-brand text-white rounded-[6px] text-sm font-medium hover:bg-brand-hover inline-flex items-center gap-2 transition-colors">
                <ExternalLink className="w-4 h-4" /> View Merchant
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-5 -mb-[1px]">
            {(['overview', 'payments', 'financials'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-[6px] transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-brand border-brand bg-canvas'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 py-6">
        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <KpiCard label="Funded Amount" value={fmt(deal.fundedAmt)} accent="indigo" />
              <KpiCard label="Total Owed" value={fmt(deal.totalOwed)} sub={`Factor ${deal.factor.toFixed(2)}x`} accent="gray" />
              <KpiCard label="Collected" value={fmt(deal.collected)} sub={`${(pctCollected * 100).toFixed(1)}% of total`} accent="emerald" />
              <KpiCard label="Outstanding" value={fmt(outstanding)} sub={outstanding > 0 ? `~${estDaysRemaining} days left` : 'Fully paid'} accent={outstanding > 0 ? 'amber' : 'emerald'} />
              <KpiCard label="Daily Payment" value={deal.dailyDebit > 0 ? fmt(deal.dailyDebit) : '-'} sub={`${deal.holdback}% holdback`} accent="blue" />
              <KpiCard label="Days Active" value={daysActive.toString()} sub={`Since ${fmtDateShort(deal.funded)}`} accent="gray" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* ── Left Column ── */}
              <div className="lg:col-span-8 space-y-6">
                {/* Repayment Progress */}
                <Card title="Repayment Progress" right={<span className="text-sm text-gray-500">{(pctCollected * 100).toFixed(1)}% complete</span>}>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          deal.status === 'default' ? 'bg-red-500' :
                          deal.status === 'slow' ? 'bg-amber-500' :
                          deal.status === 'paid' ? 'bg-blue-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(pctCollected * 100, 100)}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <MiniStat label="Total Owed" value={fmt(deal.totalOwed)} />
                      <MiniStat label="Collected" value={fmt(deal.collected)} />
                      <MiniStat label="Remaining" value={fmt(outstanding)} />
                      <MiniStat label="Est. Payoff" value={estDaysRemaining > 0 ? `${estDaysRemaining} days` : 'Complete'} />
                    </div>
                  </div>
                </Card>

                {/* Payment Velocity */}
                <Card title="Payment Velocity" icon={<Activity className="w-4 h-4 text-blue-500" />}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-[8px] p-3.5">
                      <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">7-Day Avg</p>
                      <p className="text-lg font-bold text-gray-900">{deal.avg7d > 0 ? fmt(deal.avg7d) : '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-[8px] p-3.5">
                      <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">30-Day Avg</p>
                      <p className="text-lg font-bold text-gray-900">{deal.avg30d > 0 ? fmt(deal.avg30d) : '-'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-[8px] p-3.5">
                      <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">Trend</p>
                      <div className="flex items-center gap-1.5">
                        {velocityDelta >= 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-lg font-bold ${velocityColor}`}>
                          {deal.avg30d > 0 ? `${Math.abs(velocityDelta * 100).toFixed(0)}%` : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-[8px] p-3.5">
                      <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">Signal</p>
                      <span className={`text-sm font-bold ${velocityColor}`}>{velocitySignal}</span>
                    </div>
                  </div>
                </Card>

                {/* Recent Payments Table */}
                <Card title="Recent Payments" icon={<CreditCard className="w-4 h-4 text-violet-500" />}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left text-[11px] text-gray-500 uppercase tracking-wide font-medium py-2 pr-4">Date</th>
                          <th className="text-left text-[11px] text-gray-500 uppercase tracking-wide font-medium py-2 pr-4">Expected</th>
                          <th className="text-left text-[11px] text-gray-500 uppercase tracking-wide font-medium py-2 pr-4">Actual</th>
                          <th className="text-left text-[11px] text-gray-500 uppercase tracking-wide font-medium py-2 pr-4">Status</th>
                          <th className="text-right text-[11px] text-gray-500 uppercase tracking-wide font-medium py-2">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p, i) => (
                          <tr key={i} className="border-b border-gray-50 last:border-0">
                            <td className="py-2.5 pr-4 text-sm text-gray-600">{fmtDateShort(p.date)}</td>
                            <td className="py-2.5 pr-4 text-sm text-gray-700 tabular-nums">{fmt(p.expected)}</td>
                            <td className="py-2.5 pr-4 text-sm font-medium tabular-nums text-gray-900">{fmt(p.actual)}</td>
                            <td className="py-2.5 pr-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                p.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                                p.status === 'partial' ? 'bg-amber-50 text-amber-700' :
                                'bg-red-50 text-red-700'
                              }`}>
                                {p.status === 'paid' ? 'Paid' : p.status === 'partial' ? 'Partial' : 'Missed'}
                              </span>
                            </td>
                            <td className="py-2.5 text-sm text-gray-600 tabular-nums text-right">{fmt(p.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* ── Right Column ── */}
              <div className="lg:col-span-4 space-y-6">
                {/* Deal Details */}
                <Card title="Deal Details">
                  <div className="space-y-3">
                    <DetailRow label="Merchant" value={deal.merchant} />
                    <DetailRow label="Industry" value={deal.type} />
                    <DetailRow label="Channel" value={deal.channel === 'self' ? 'Self-Funded' : 'Fundomate Referral'} />
                    <DetailRow label="Factor Rate" value={`${deal.factor.toFixed(2)}x`} />
                    <DetailRow label="Holdback %" value={`${deal.holdback}%`} />
                    <DetailRow label="Funded Date" value={fmtDate(deal.funded)} />
                    <DetailRow label="Last Payment" value={fmtDate(deal.lastPayment)} />
                  </div>
                </Card>

                {/* ACH & Compliance */}
                <Card title="ACH & Compliance" icon={<Shield className="w-4 h-4 text-gray-400" />}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">ACH Status</span>
                      <span className={`text-sm font-semibold ${ach.color}`}>{ach.label}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">UCC Filed</span>
                      <span className="text-sm text-gray-900">{fmtDate(deal.uccFiled)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">UCC Expires</span>
                      <span className={`text-sm font-medium ${uccDaysLeft < 365 ? 'text-red-600' : uccDaysLeft < 730 ? 'text-amber-600' : 'text-gray-900'}`}>
                        {fmtDate(deal.uccExpires)} ({Math.floor(uccDaysLeft / 365)}y {Math.floor((uccDaysLeft % 365) / 30)}m)
                      </span>
                    </div>
                    {deal.daysInDefault > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Days in Default</span>
                        <span className="text-sm font-bold text-red-600">{deal.daysInDefault} days</span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Stacking Risk */}
                <Card title="Stacking Risk" icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Active Stacks</span>
                    {deal.stackCount === 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                        <CheckCircle className="w-4 h-4" /> Clean
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${deal.stackCount >= 2 ? 'text-red-600' : 'text-amber-600'}`}>
                        <AlertTriangle className="w-4 h-4" /> {deal.stackCount} position{deal.stackCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {deal.stackCount > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-[6px]">
                      <p className="text-xs text-amber-700">
                        DataMerch shows {deal.stackCount} concurrent MCA position{deal.stackCount > 1 ? 's' : ''}. Higher stack counts increase default risk.
                      </p>
                    </div>
                  )}
                </Card>

                {/* Profitability & Breakeven */}
                <Card title="Profitability & Breakeven" icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}>
                  <div className="space-y-3">
                    {deal.channel === 'self' ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Factor Profit (Gross)</span>
                          <span className="text-sm font-semibold text-gray-900">{fmt(deal.totalOwed - deal.fundedAmt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">COC Paid</span>
                          <span className="text-sm font-medium text-red-600">-{fmt(deal.costOfCapitalPaid)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-sm font-semibold text-gray-900">True Net Profit</span>
                          <span className={`text-sm font-bold ${trueProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(trueProfit)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Days to Breakeven</span>
                          <span className={`text-sm font-semibold ${daysToBreakeven === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {daysToBreakeven === 0 ? 'Recovered' : daysToBreakeven > 0 ? `${daysToBreakeven}d` : 'N/A'}
                          </span>
                        </div>
                        {breakevenDate && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Breakeven Date</span>
                            <span className="text-sm text-gray-700">~{fmtDate(breakevenDate)}</span>
                          </div>
                        )}
                        {estPayoffDate && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Est. Payoff Date</span>
                            <span className="text-sm text-gray-700">~{fmtDate(estPayoffDate)}</span>
                          </div>
                        )}
                        {daysToBreakeven === 0 && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-[6px]">
                            <p className="text-xs text-emerald-700 font-medium">Principal recovered - now operating on house money.</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Capital at Risk</span>
                          <span className="text-sm font-bold text-emerald-600">$0</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Commission Earned</span>
                          <span className="text-sm font-semibold text-orange-600">{fmt(deal.referralCommission)}</span>
                        </div>
                        <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-[6px]">
                          <p className="text-xs text-emerald-700">Fundomate bears all credit risk. This is pure fee income with zero capital exposure.</p>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                {/* Renewal Potential */}
                <Card title="Renewal Potential" icon={<RefreshCw className="w-4 h-4 text-violet-500" />}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      {deal.renewalEligible ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700">Eligible</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">Not Yet</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Collection Progress</span>
                      <span className="text-sm font-medium text-gray-900">{(pctCollected * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pctCollected >= 0.5 ? 'bg-violet-500' : 'bg-gray-300'}`}
                        style={{ width: `${Math.min(pctCollected * 100, 100)}%` }}
                      />
                    </div>
                    {deal.renewalEligible ? (
                      <div className="p-2.5 bg-violet-50 border border-violet-100 rounded-[6px]">
                        <p className="text-xs text-violet-700">
                          {deal.channel === 'self' ? 'Eligible for renewal. New advance opportunity once 50%+ collected.' : 'Eligible for new Fundomate referral - additional commission opportunity.'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Must collect at least 50% of total owed to qualify for renewal.</p>
                    )}
                  </div>
                </Card>

                {/* Commission (Fundomate only) */}
                {deal.channel === 'fundomate' && (
                  <Card title="Referral Commission" icon={<DollarSign className="w-4 h-4 text-emerald-500" />}>
                    <div className="space-y-3">
                      <DetailRow label="Commission Rate" value={`${((deal.commissionRate || 0) * 100).toFixed(0)}%`} />
                      <DetailRow label="Commission Amount" value={fmt(deal.referralCommission)} />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Payment Status</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          deal.commissionPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {deal.commissionPaid ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ PAYMENTS TAB ═══ */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="Total Payments" value={payments.length.toString()} accent="indigo" />
              <KpiCard label="On-Time Rate" value={`${payments.length > 0 ? ((payments.filter(p => p.status === 'paid').length / payments.length) * 100).toFixed(0) : 0}%`} accent="emerald" />
              <KpiCard label="Missed Payments" value={payments.filter(p => p.status === 'missed').length.toString()} accent="red" />
              <KpiCard label="Partial Payments" value={payments.filter(p => p.status === 'partial').length.toString()} accent="amber" />
            </div>

            <Card title="Full Payment History" icon={<FileText className="w-4 h-4 text-gray-400" />}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-[11px] text-gray-500 uppercase tracking-wide font-semibold py-2.5 pr-4">Date</th>
                      <th className="text-left text-[11px] text-gray-500 uppercase tracking-wide font-semibold py-2.5 pr-4">Expected</th>
                      <th className="text-left text-[11px] text-gray-500 uppercase tracking-wide font-semibold py-2.5 pr-4">Actual</th>
                      <th className="text-left text-[11px] text-gray-500 uppercase tracking-wide font-semibold py-2.5 pr-4">Variance</th>
                      <th className="text-left text-[11px] text-gray-500 uppercase tracking-wide font-semibold py-2.5 pr-4">Status</th>
                      <th className="text-right text-[11px] text-gray-500 uppercase tracking-wide font-semibold py-2.5">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => {
                      const variance = p.actual - p.expected;
                      return (
                        <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 pr-4 text-sm text-gray-700">{fmtDate(p.date)}</td>
                          <td className="py-3 pr-4 text-sm text-gray-600 tabular-nums">{fmt(p.expected)}</td>
                          <td className="py-3 pr-4 text-sm font-medium text-gray-900 tabular-nums">{fmt(p.actual)}</td>
                          <td className="py-3 pr-4">
                            <span className={`text-sm font-medium tabular-nums ${variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {variance >= 0 ? '+' : ''}{fmt(variance)}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                              p.status === 'partial' ? 'bg-amber-50 text-amber-700' :
                              'bg-red-50 text-red-700'
                            }`}>
                              {p.status === 'paid' ? (
                                <><CheckCircle className="w-3 h-3" /> Paid</>
                              ) : p.status === 'partial' ? (
                                <><Clock className="w-3 h-3" /> Partial</>
                              ) : (
                                <><Ban className="w-3 h-3" /> Missed</>
                              )}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-600 tabular-nums text-right">{fmt(p.balance)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ═══ FINANCIALS TAB ═══ */}
        {activeTab === 'financials' && (
          <div className="space-y-6">
            {deal.channel === 'self' ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard label="Capital Deployed" value={fmt(deal.fundedAmt)} accent="indigo" />
                  <KpiCard label="Gross Revenue" value={fmt(deal.collected)} sub={`Factor return: ${fmt(deal.totalOwed - deal.fundedAmt)}`} accent="emerald" />
                  <KpiCard label="Cost of Capital" value={fmt(deal.costOfCapitalPaid)} sub={`2% / month (${monthsActive.toFixed(1)} mo)`} accent="amber" />
                  <KpiCard label="Net P&L" value={fmt(netProfit)} sub={netProfit >= 0 ? 'Profitable' : 'Below breakeven'} accent={netProfit >= 0 ? 'emerald' : 'red'} />
                </div>

                <Card title="P&L Breakdown" icon={<DollarSign className="w-4 h-4 text-emerald-500" />}>
                  <div className="space-y-4">
                    <FinancialRow label="Funded Amount (Capital Deployed)" value={fmt(deal.fundedAmt)} type="neutral" />
                    <FinancialRow label={`Total Owed (${deal.factor.toFixed(2)}x factor)`} value={fmt(deal.totalOwed)} type="neutral" />
                    <FinancialRow label="Collected to Date" value={fmt(deal.collected)} type="positive" />
                    <FinancialRow label="Outstanding Balance" value={fmt(outstanding)} type="neutral" />
                    <div className="border-t border-gray-200 pt-3">
                      <FinancialRow label="Gross P&L (Collected - Funded)" value={fmt(grossProfit)} type={grossProfit >= 0 ? 'positive' : 'negative'} bold />
                    </div>
                    <FinancialRow label={`Cost of Capital (2%/mo x ${monthsActive.toFixed(1)} mo)`} value={`-${fmt(deal.costOfCapitalPaid)}`} type="negative" />
                    <div className="border-t border-gray-200 pt-3">
                      <FinancialRow label="Net Profit After COC" value={fmt(netProfit)} type={netProfit >= 0 ? 'positive' : 'negative'} bold />
                    </div>
                    {outstanding > 0 && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-[6px] p-3 mt-2">
                        <p className="text-xs text-indigo-700">
                          <strong>Projected total return:</strong> {fmt(deal.totalOwed - deal.fundedAmt)} gross profit on {fmt(deal.fundedAmt)} deployed ({((deal.factor - 1) * 100).toFixed(0)}% return), less estimated COC of {fmt(costOfCapitalAccrued)}.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard label="Volume Referred" value={fmt(deal.fundedAmt)} accent="orange" />
                  <KpiCard label="Commission Rate" value={`${((deal.commissionRate || 0) * 100).toFixed(0)}%`} accent="indigo" />
                  <KpiCard label="Commission Earned" value={fmt(deal.referralCommission)} accent="emerald" />
                  <KpiCard label="Status" value={deal.commissionPaid ? 'Paid' : 'Pending'} accent={deal.commissionPaid ? 'emerald' : 'amber'} />
                </div>

                <Card title="Referral Commission Breakdown" icon={<DollarSign className="w-4 h-4 text-orange-500" />}>
                  <div className="space-y-4">
                    <FinancialRow label="Deal Funded Amount" value={fmt(deal.fundedAmt)} type="neutral" />
                    <FinancialRow label={`Commission Rate`} value={`${((deal.commissionRate || 0) * 100).toFixed(0)}%`} type="neutral" />
                    <div className="border-t border-gray-200 pt-3">
                      <FinancialRow label="Commission Earned" value={fmt(deal.referralCommission)} type="positive" bold />
                    </div>
                    <FinancialRow label="Payment Status" value={deal.commissionPaid ? 'Paid Out' : 'Awaiting Payout'} type={deal.commissionPaid ? 'positive' : 'neutral'} />
                    <div className="bg-orange-50 border border-orange-100 rounded-[6px] p-3 mt-2">
                      <p className="text-xs text-orange-700">
                        This is a Fundomate referral deal. Capital is deployed and serviced by Fundomate. Delt earns a {((deal.commissionRate || 0) * 100).toFixed(0)}% referral commission on the funded amount.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Deal Performance (funder side) */}
                <Card title="Deal Performance (Funder Side)" icon={<TrendingUp className="w-4 h-4 text-blue-500" />}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MiniStatCard label="Total Owed" value={fmt(deal.totalOwed)} />
                    <MiniStatCard label="Collected" value={fmt(deal.collected)} />
                    <MiniStatCard label="Outstanding" value={fmt(outstanding)} />
                    <MiniStatCard label="Collection %" value={`${(pctCollected * 100).toFixed(1)}%`} />
                  </div>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub Components ──

function Card({ title, children, icon, right }: { title: string; children: React.ReactNode; icon?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[8px] border border-gray-200">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        {right}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-gray-500 font-medium">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function MiniStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-[8px] p-3">
      <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function FinancialRow({ label, value, type, bold }: { label: string; value: string; type: 'positive' | 'negative' | 'neutral'; bold?: boolean }) {
  const colorCls = type === 'positive' ? 'text-emerald-600' : type === 'negative' ? 'text-red-600' : 'text-gray-900';
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm text-gray-600 ${bold ? 'font-semibold text-gray-900' : ''}`}>{label}</span>
      <span className={`text-sm tabular-nums ${colorCls} ${bold ? 'font-bold text-base' : 'font-medium'}`}>{value}</span>
    </div>
  );
}