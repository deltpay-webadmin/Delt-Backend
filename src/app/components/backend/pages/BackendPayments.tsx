import React, { useState, useMemo } from 'react';
import {
  DollarSign, Search, Filter, Download, Eye, RefreshCw,
  CheckCircle, XCircle, Clock, AlertTriangle, X, Plus,
  ArrowUpRight, ArrowDownRight, TrendingUp, BarChart3,
  CreditCard, Building2, Calendar, Store, ChevronRight,
  Banknote, ArrowRight, Phone, Mail, MoreHorizontal,
  Wallet, ArrowLeftRight, ShieldAlert, Zap, ChevronDown,
} from 'lucide-react';

// ── Types ──
type PaymentStatus = 'success' | 'failed' | 'pending' | 'returned' | 'scheduled';
type PaymentMethod = 'ach' | 'wire' | 'card' | 'check';
type CollectionStatus = 'current' | 'slow_pay' | 'default' | 'workout' | 'paid_off';

interface Payment {
  id: string;
  merchant: string;
  merchantId: string;
  dealId?: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  date: string;
  type: 'collection' | 'funding' | 'refund' | 'fee';
  description: string;
  failReason?: string;
  retryDate?: string;
}

interface CollectionAccount {
  id: string;
  merchant: string;
  merchantId: string;
  dealId: string;
  status: CollectionStatus;
  totalOwed: number;
  totalCollected: number;
  dailyAmount: number;
  consecutiveNSF: number;
  lastPaymentDate: string;
  nextPaymentDate: string;
  percentPaid: number;
  agent: string;
  daysPastDue: number;
}

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  success: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Success', icon: CheckCircle },
  failed: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Failed', icon: XCircle },
  pending: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', label: 'Pending', icon: Clock },
  returned: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Returned', icon: ArrowLeftRight },
  scheduled: { color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', label: 'Scheduled', icon: Calendar },
};

const COLLECTION_STATUS_CONFIG: Record<CollectionStatus, { color: string; bg: string; label: string }> = {
  current: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Current' },
  slow_pay: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Slow Pay' },
  default: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Default' },
  workout: { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', label: 'Workout' },
  paid_off: { color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', label: 'Paid Off' },
};

const PAYMENTS: Payment[] = [
  { id: 'PMT-4501', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', dealId: 'DL-2026-0412', amount: 145, status: 'success', method: 'ach', date: '2026-04-17', type: 'collection', description: 'Daily ACH collection' },
  { id: 'PMT-4500', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', dealId: 'DL-2026-0412', amount: 145, status: 'success', method: 'ach', date: '2026-04-16', type: 'collection', description: 'Daily ACH collection' },
  { id: 'PMT-4499', merchant: 'SoBe Cycle & Fitness', merchantId: 'M-1010', amount: 210, status: 'success', method: 'ach', date: '2026-04-17', type: 'collection', description: 'Daily ACH collection' },
  { id: 'PMT-4498', merchant: 'Little Havana Barbershop', merchantId: 'M-1006', amount: 68, status: 'failed', method: 'ach', date: '2026-04-17', type: 'collection', description: 'Daily ACH collection', failReason: 'NSF — Insufficient Funds', retryDate: '2026-04-19' },
  { id: 'PMT-4497', merchant: 'Little Havana Barbershop', merchantId: 'M-1006', amount: 68, status: 'failed', method: 'ach', date: '2026-04-16', type: 'collection', description: 'Daily ACH collection', failReason: 'NSF — Insufficient Funds' },
  { id: 'PMT-4496', merchant: 'Little Havana Barbershop', merchantId: 'M-1006', amount: 68, status: 'failed', method: 'ach', date: '2026-04-15', type: 'collection', description: 'Daily ACH collection', failReason: 'NSF — Insufficient Funds' },
  { id: 'PMT-4495', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', dealId: 'DL-2026-0412', amount: 45000, status: 'success', method: 'wire', date: '2026-04-14', type: 'funding', description: 'MCA funding — wire transfer' },
  { id: 'PMT-4494', merchant: 'Midtown Taqueria', merchantId: 'M-1005', amount: 185, status: 'success', method: 'ach', date: '2026-04-17', type: 'collection', description: 'Daily ACH collection' },
  { id: 'PMT-4493', merchant: 'Metro Diner Group', merchantId: 'M-1011', amount: 320, status: 'success', method: 'ach', date: '2026-04-17', type: 'collection', description: 'Daily ACH collection' },
  { id: 'PMT-4492', merchant: 'Harbor Marine Supply', merchantId: 'M-1009', amount: 29, status: 'success', method: 'card', date: '2026-04-17', type: 'fee', description: 'Website hosting — monthly subscription' },
  { id: 'PMT-4491', merchant: 'Coral Reef Auto Spa', merchantId: 'M-1004', amount: 175, status: 'pending', method: 'ach', date: '2026-04-17', type: 'collection', description: 'Daily ACH collection — processing' },
  { id: 'PMT-4490', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', amount: 79, status: 'success', method: 'card', date: '2026-04-16', type: 'fee', description: 'Website hosting — monthly subscription' },
  { id: 'PMT-4489', merchant: 'TechStart Solutions', merchantId: 'M-1002', amount: 149, status: 'success', method: 'card', date: '2026-04-15', type: 'fee', description: 'Website hosting — premium plan' },
  { id: 'PMT-4488', merchant: 'Bella Vista Restaurant', merchantId: 'M-1005', amount: 79, status: 'success', method: 'card', date: '2026-04-15', type: 'fee', description: 'Website hosting — business plan' },
];

const COLLECTIONS: CollectionAccount[] = [
  { id: 'C-001', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', dealId: 'DL-2026-0412', status: 'current', totalOwed: 62100, totalCollected: 17820, dailyAmount: 145, consecutiveNSF: 0, lastPaymentDate: '2026-04-17', nextPaymentDate: '2026-04-18', percentPaid: 28.7, agent: 'Marcus Johnson', daysPastDue: 0 },
  { id: 'C-002', merchant: 'SoBe Cycle & Fitness', merchantId: 'M-1010', dealId: 'DL-2026-0388', status: 'current', totalOwed: 84000, totalCollected: 52920, dailyAmount: 210, consecutiveNSF: 0, lastPaymentDate: '2026-04-17', nextPaymentDate: '2026-04-18', percentPaid: 63.0, agent: 'James Miller', daysPastDue: 0 },
  { id: 'C-003', merchant: 'Metro Diner Group', merchantId: 'M-1011', dealId: 'DL-2026-0371', status: 'current', totalOwed: 101250, totalCollected: 54800, dailyAmount: 320, consecutiveNSF: 0, lastPaymentDate: '2026-04-17', nextPaymentDate: '2026-04-18', percentPaid: 54.1, agent: 'Sarah Kim', daysPastDue: 0 },
  { id: 'C-004', merchant: 'Midtown Taqueria', merchantId: 'M-1005', dealId: 'DL-2026-0395', status: 'current', totalOwed: 48000, totalCollected: 31450, dailyAmount: 185, consecutiveNSF: 0, lastPaymentDate: '2026-04-17', nextPaymentDate: '2026-04-18', percentPaid: 65.5, agent: 'Marcus Johnson', daysPastDue: 0 },
  { id: 'C-005', merchant: 'Coral Reef Auto Spa', merchantId: 'M-1004', dealId: 'DL-2026-0405', status: 'current', totalOwed: 56000, totalCollected: 22400, dailyAmount: 175, consecutiveNSF: 0, lastPaymentDate: '2026-04-16', nextPaymentDate: '2026-04-17', percentPaid: 40.0, agent: 'James Miller', daysPastDue: 0 },
  { id: 'C-006', merchant: 'Little Havana Barbershop', merchantId: 'M-1006', dealId: 'DL-2026-0380', status: 'slow_pay', totalOwed: 28560, totalCollected: 14960, dailyAmount: 68, consecutiveNSF: 3, lastPaymentDate: '2026-04-12', nextPaymentDate: '2026-04-19', percentPaid: 52.4, agent: 'Marcus Johnson', daysPastDue: 5 },
];

// ── Main ──
export function BackendPayments() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'collections'>('transactions');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [collectionStatusFilter, setCollectionStatusFilter] = useState<CollectionStatus | 'all'>('all');

  const filteredPayments = useMemo(() => {
    return PAYMENTS.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.merchant.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.dealId || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, statusFilter]);

  const filteredCollections = useMemo(() => {
    return COLLECTIONS.filter(c => {
      if (collectionStatusFilter !== 'all' && c.status !== collectionStatusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.merchant.toLowerCase().includes(q) || c.dealId.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, collectionStatusFilter]);

  const todayCollected = PAYMENTS.filter(p => p.date === '2026-04-17' && p.status === 'success' && p.type === 'collection').reduce((s, p) => s + p.amount, 0);
  const todayFailed = PAYMENTS.filter(p => p.date === '2026-04-17' && p.status === 'failed').length;
  const totalOutstanding = COLLECTIONS.reduce((s, c) => s + (c.totalOwed - c.totalCollected), 0);
  const avgCollectionRate = COLLECTIONS.filter(c => c.status !== 'paid_off').reduce((s, c, _, a) => s + c.percentPaid / a.length, 0);

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-brand to-brand-light flex items-center justify-center shadow-sm">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments & Collections</h1>
            <p className="text-sm text-gray-500">Track ACH collections, fundings, and payment health</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-[8px] hover:bg-gray-50">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-[8px] hover:bg-brand-hover">
            <RefreshCw className="w-3.5 h-3.5" /> Retry Failed
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Today's Collections", value: `$${todayCollected.toLocaleString()}`, sub: `${PAYMENTS.filter(p => p.date === '2026-04-17' && p.status === 'success' && p.type === 'collection').length} successful`, color: 'border-t-emerald-500', icon: DollarSign },
          { label: 'Failed Today', value: todayFailed, sub: `${todayFailed} NSF returns`, color: 'border-t-red-500', icon: XCircle },
          { label: 'Outstanding Balance', value: `$${(totalOutstanding / 1000).toFixed(0)}K`, sub: `${COLLECTIONS.length} active accounts`, color: 'border-t-brand', icon: Banknote },
          { label: 'Avg % Collected', value: `${avgCollectionRate.toFixed(1)}%`, sub: 'across active deals', color: 'border-t-blue-500', icon: TrendingUp },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`bg-white rounded-[8px] border border-gray-200 border-t-[3px] ${kpi.color} px-4 py-3`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-[8px] p-1 w-fit">
        {(['transactions', 'collections'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setSearch(''); setStatusFilter('all'); setCollectionStatusFilter('all'); }}
            className={`px-4 py-2 rounded-[8px] text-xs font-medium transition-all ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab === 'transactions' ? 'Transactions' : 'Collection Accounts'}
          </button>
        ))}
      </div>

      {activeTab === 'transactions' ? (
        <>
          {/* Transaction Filters */}
          <div className="bg-white rounded-[8px] border border-gray-200 p-4 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            </div>
            <div className="flex items-center gap-1">
              {(['all', 'success', 'failed', 'pending', 'returned', 'scheduled'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1.5 rounded-[8px] text-[10px] font-semibold border whitespace-nowrap transition-colors ${
                    statusFilter === s ? (s === 'all' ? 'bg-brand/5 text-brand border-brand/20' : `${PAYMENT_STATUS_CONFIG[s].bg} ${PAYMENT_STATUS_CONFIG[s].color}`) : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}>{s === 'all' ? 'All' : PAYMENT_STATUS_CONFIG[s].label}</button>
              ))}
            </div>
          </div>

          {/* Transaction Table */}
          <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-500 uppercase tracking-wide font-semibold border-b border-gray-200">
              <span className="w-20">ID</span>
              <span className="flex-1">Merchant</span>
              <span className="w-20">Type</span>
              <span className="w-16">Method</span>
              <span className="w-24 text-right">Amount</span>
              <span className="w-20">Date</span>
              <span className="w-24">Status</span>
              <span className="w-12"></span>
            </div>
            {filteredPayments.map(pmt => {
              const scfg = PAYMENT_STATUS_CONFIG[pmt.status];
              const SIcon = scfg.icon;
              return (
                <div key={pmt.id} className={`px-4 py-3 flex items-center gap-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors ${pmt.status === 'failed' ? 'bg-red-50/20' : ''}`}>
                  <span className="w-20 shrink-0 text-[10px] font-mono text-gray-400">{pmt.id}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-gray-900 truncate">{pmt.merchant}</h4>
                    <p className="text-[10px] text-gray-400">{pmt.description}</p>
                    {pmt.failReason && <p className="text-[10px] text-red-600 mt-0.5">{pmt.failReason}{pmt.retryDate ? ` — Retry: ${pmt.retryDate}` : ''}</p>}
                  </div>
                  <span className={`w-20 shrink-0 text-[10px] font-medium ${pmt.type === 'funding' ? 'text-brand' : pmt.type === 'refund' ? 'text-amber-600' : pmt.type === 'fee' ? 'text-gray-500' : 'text-gray-600'}`}>
                    {pmt.type.charAt(0).toUpperCase() + pmt.type.slice(1)}
                  </span>
                  <span className="w-16 shrink-0 text-[10px] text-gray-500 uppercase">{pmt.method}</span>
                  <span className={`w-24 shrink-0 text-xs font-semibold text-right ${pmt.type === 'funding' ? 'text-brand' : pmt.status === 'failed' ? 'text-red-600' : 'text-gray-900'}`}>
                    {pmt.type === 'funding' ? '-' : ''}${pmt.amount.toLocaleString()}
                  </span>
                  <span className="w-20 shrink-0 text-[10px] font-mono text-gray-500">{pmt.date.replace('2026-', '')}</span>
                  <span className={`w-24 shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border ${scfg.bg} ${scfg.color}`}>
                    <SIcon className="w-3 h-3" />{scfg.label}
                  </span>
                  <div className="w-12 shrink-0 flex items-center">
                    {pmt.status === 'failed' && (
                      <button className="p-1 hover:bg-blue-50 rounded" title="Retry"><RefreshCw className="w-3.5 h-3.5 text-blue-500" /></button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Collection Filters */}
          <div className="bg-white rounded-[8px] border border-gray-200 p-4 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            </div>
            <div className="flex items-center gap-1">
              {(['all', 'current', 'slow_pay', 'default', 'workout', 'paid_off'] as const).map(s => (
                <button key={s} onClick={() => setCollectionStatusFilter(s)}
                  className={`px-2.5 py-1.5 rounded-[8px] text-[10px] font-semibold border whitespace-nowrap transition-colors ${
                    collectionStatusFilter === s ? (s === 'all' ? 'bg-brand/5 text-brand border-brand/20' : `${COLLECTION_STATUS_CONFIG[s].bg} ${COLLECTION_STATUS_CONFIG[s].color}`) : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}>{s === 'all' ? 'All' : COLLECTION_STATUS_CONFIG[s].label}</button>
              ))}
            </div>
          </div>

          {/* Collection Accounts */}
          <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-500 uppercase tracking-wide font-semibold border-b border-gray-200">
              <span className="flex-1">Merchant / Deal</span>
              <span className="w-24">Status</span>
              <span className="w-20">Daily</span>
              <span className="w-28">Collected</span>
              <span className="w-28">Outstanding</span>
              <span className="w-16">% Paid</span>
              <span className="w-16">NSFs</span>
              <span className="w-20">Past Due</span>
            </div>
            {filteredCollections.map(acct => {
              const scfg = COLLECTION_STATUS_CONFIG[acct.status];
              const outstanding = acct.totalOwed - acct.totalCollected;
              return (
                <div key={acct.id} className={`px-4 py-3 flex items-center gap-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors ${acct.status === 'slow_pay' ? 'bg-amber-50/20' : acct.status === 'default' ? 'bg-red-50/20' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-gray-900">{acct.merchant}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-brand">{acct.dealId}</span>
                      <span className="text-[10px] text-gray-400">{acct.agent}</span>
                    </div>
                  </div>
                  <span className={`w-24 shrink-0 text-[10px] font-semibold px-2 py-1 rounded border ${scfg.bg} ${scfg.color}`}>{scfg.label}</span>
                  <span className="w-20 shrink-0 text-xs font-semibold text-gray-900">${acct.dailyAmount}</span>
                  <span className="w-28 shrink-0 text-xs text-gray-600">${acct.totalCollected.toLocaleString()}</span>
                  <span className="w-28 shrink-0 text-xs font-semibold text-gray-900">${outstanding.toLocaleString()}</span>
                  <div className="w-16 shrink-0">
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${acct.percentPaid >= 60 ? 'bg-emerald-500' : acct.percentPaid >= 30 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${acct.percentPaid}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-600">{acct.percentPaid.toFixed(0)}%</span>
                    </div>
                  </div>
                  <span className={`w-16 shrink-0 text-xs font-semibold text-center ${acct.consecutiveNSF > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {acct.consecutiveNSF > 0 ? acct.consecutiveNSF : '—'}
                  </span>
                  <span className={`w-20 shrink-0 text-[10px] font-semibold ${acct.daysPastDue > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {acct.daysPastDue > 0 ? `${acct.daysPastDue} days` : 'On time'}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
