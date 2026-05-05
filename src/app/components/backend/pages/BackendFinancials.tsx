import React, { useState } from 'react';
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Building2,
  Percent,
  Zap,
  CreditCard,
  Briefcase,
  CircleDollarSign,
  PiggyBank,
  Activity,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ReferenceLine,
} from 'recharts';

type Period = 'month' | 'quarter' | 'year' | 'custom';

// ── Summary Data ──
const summaryCards = [
  { label: 'Total Revenue', value: '$536K', raw: 536000, trend: '+12.5%', positive: true, icon: DollarSign, variant: 'emerald' as const },
  { label: 'Total Expenses', value: '$185K', raw: 185000, trend: '-3.2%', positive: true, icon: CreditCard, variant: 'red' as const },
  { label: 'Net Profit', value: '$242K', raw: 242000, trend: '+18.7%', positive: true, icon: TrendingUp, variant: 'indigo' as const },
  { label: 'Cash Flow', value: '$215K', raw: 215000, trend: '+8.4%', positive: true, icon: Activity, variant: 'blue' as const },
];

const variantStyles: Record<string, { bg: string; icon: string }> = {
  emerald: { bg: 'bg-emerald-50 border-emerald-100', icon: 'text-emerald-600' },
  red: { bg: 'bg-red-50 border-red-100', icon: 'text-red-600' },
  indigo: { bg: 'bg-indigo-50 border-indigo-100', icon: 'text-indigo-600' },
  blue: { bg: 'bg-blue-50 border-blue-100', icon: 'text-blue-600' },
};

// ── Revenue & Expense Breakdowns ──
const revenueBreakdown = [
  { label: 'MCA Interest Income', value: 285000, pct: 53.2, color: 'bg-indigo-500' },
  { label: 'Lease Commissions', value: 95000, pct: 17.7, color: 'bg-sky-500' },
  { label: 'Residual Income', value: 47000, pct: 8.8, color: 'bg-teal-500' },
  { label: 'Merchant SaaS Subscriptions', value: 72000, pct: 13.4, color: 'bg-violet-500' },
  { label: 'Lens AI Fees', value: 37000, pct: 6.9, color: 'bg-purple-500' },
];

const expenseBreakdown = [
  { label: 'Sales Commissions', value: 75000, pct: 40.5, color: 'bg-red-500' },
  { label: 'Cost of Capital', value: 65000, pct: 35.1, color: 'bg-orange-500' },
  { label: 'Deployment Fees', value: 28000, pct: 15.1, color: 'bg-amber-500' },
  { label: 'Operating', value: 17000, pct: 9.2, color: 'bg-gray-400' },
];

// ── Cash Flow Forecast (90 days) ──
const cashFlowData = Array.from({ length: 13 }, (_, i) => {
  const week = i;
  const baseIn = 52000 + Math.sin(i * 0.7) * 12000 + (i > 8 ? -8000 : 0);
  const baseOut = 38000 + Math.cos(i * 0.5) * 8000 + (i > 6 ? 5000 : 0);
  const net = baseIn - baseOut;
  return {
    week: `W${week + 1}`,
    label: `Week ${week + 1}`,
    inflows: Math.round(baseIn),
    outflows: Math.round(baseOut),
    net: Math.round(net),
    threshold: 10000,
  };
});

const alertWeeks = cashFlowData.filter((d) => d.net < d.threshold);

// ── Capital Deployment ──
const capitalCards = [
  { label: 'Available Capital', value: '$340K', icon: PiggyBank, variant: 'emerald' as const },
  { label: 'Deployed', value: '$1.26M', icon: Zap, variant: 'indigo' as const },
  { label: 'Utilization', value: '78.8%', icon: Percent, variant: 'blue' as const },
  { label: '30-Day Need', value: '$185K', icon: Briefcase, variant: 'orange' as const },
];

const capitalVariants: Record<string, { bg: string; icon: string }> = {
  ...variantStyles,
  orange: { bg: 'bg-orange-50 border-orange-100', icon: 'text-orange-600' },
};

const fundingSources = [
  { name: 'Pinnacle Funding Group', committed: 600000, deployed: 485000, available: 115000, coc: 2.0, returnPct: 14.2 },
  { name: 'Atlantic Capital Partners', committed: 400000, deployed: 320000, available: 80000, coc: 1.8, returnPct: 16.1 },
  { name: 'Summit Finance Corp', committed: 350000, deployed: 290000, available: 60000, coc: 2.2, returnPct: 12.8 },
  { name: 'Delt Internal Reserve', committed: 250000, deployed: 165000, available: 85000, coc: 0, returnPct: 22.5 },
];

// ── Recent Transactions ──
const transactions = [
  { date: '2026-04-09', desc: 'Metro Diner Group — daily ACH', type: 'Income' as const, amount: 675, category: 'MCA Repayment' },
  { date: '2026-04-09', desc: 'Bright Auto Sales — daily ACH', type: 'Income' as const, amount: 1088, category: 'Residual Repayment' },
  { date: '2026-04-08', desc: 'Marcus J. — commission payout', type: 'Expense' as const, amount: -1575, category: 'Sales Commission' },
  { date: '2026-04-08', desc: 'Pinnacle Funding — monthly COC', type: 'Expense' as const, amount: -9700, category: 'Cost of Capital' },
  { date: '2026-04-07', desc: 'Peak Construction — lease payment', type: 'Income' as const, amount: 855, category: 'Lease Payment' },
  { date: '2026-04-07', desc: 'UCC filing fee — Coastal Seafood', type: 'Expense' as const, amount: -125, category: 'Deployment Fee' },
  { date: '2026-04-06', desc: 'Apex Fitness — final payoff', type: 'Income' as const, amount: 2600, category: 'MCA Repayment' },
  { date: '2026-04-05', desc: 'Atlantic Capital — quarterly draw', type: 'Expense' as const, amount: -50000, category: 'Capital Draw' },
];

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const fmtK = (n: number) => {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return fmt(n);
};

export function BackendFinancials() {
  const [period, setPeriod] = useState<Period>('month');

  const periods: { key: Period; label: string }[] = [
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'year', label: 'Year' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="delt-page-title">Financials</h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-md">
            Super Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Tabs */}
          <div className="flex bg-gray-100 rounded-[6px] p-0.5">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-[4px] transition-colors ${
                  period === p.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-[6px] text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const v = variantStyles[card.variant];
          return (
            <div key={card.label} className={`${v.bg} border rounded-[8px] p-4 sm:p-5`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">{card.label}</p>
                <div className={v.icon}><Icon className="w-5 h-5" /></div>
              </div>
              <p className="text-xl sm:delt-page-title">{card.value}</p>
              <p className={`text-xs mt-2 flex items-center gap-1 ${card.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                {card.positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {card.trend} vs last period
              </p>
            </div>
          );
        })}
      </div>

      {/* Revenue & Expense Breakdown — Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="delt-card">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Breakdown</h2>
            <p className="text-xs text-gray-500 mt-0.5">Total: {fmt(revenueBreakdown.reduce((s, r) => s + r.value, 0))}</p>
          </div>
          <div className="px-5 py-4 space-y-5">
            {revenueBreakdown.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{fmtK(item.value)}</span>
                    <span className="text-xs text-gray-500 w-12 text-right">{item.pct}%</span>
                  </div>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="delt-card">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Expense Breakdown</h2>
            <p className="text-xs text-gray-500 mt-0.5">Total: {fmt(expenseBreakdown.reduce((s, e) => s + e.value, 0))}</p>
          </div>
          <div className="px-5 py-4 space-y-5">
            {expenseBreakdown.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{fmtK(item.value)}</span>
                    <span className="text-xs text-gray-500 w-12 text-right">{item.pct}%</span>
                  </div>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cash Flow Forecast */}
      <div className="delt-card">
        <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cash Flow Forecast</h2>
            <p className="text-xs text-gray-500 mt-0.5">90-day projection — inflows vs outflows</p>
          </div>
          {alertWeeks.length > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              {alertWeeks.length} week(s) below $10K threshold
            </div>
          )}
        </div>
        <div className="px-5 py-4">
          {/* Legend */}
          <div className="flex items-center gap-5 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-600">Inflows</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-xs text-gray-600">Outflows</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-indigo-500" />
              <span className="text-xs text-gray-600">Net Position</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-amber-400 border-t border-dashed border-amber-400" />
              <span className="text-xs text-gray-600">Threshold ($10K)</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }}
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`,
                    name === 'inflows' ? 'Inflows' : name === 'outflows' ? 'Outflows' : 'Net',
                  ]}
                />
                <ReferenceLine y={10000} stroke="#F59E0B" strokeDasharray="6 4" strokeWidth={1.5} />
                <Area type="monotone" dataKey="net" stroke="#6366F1" strokeWidth={2} fill="url(#netGrad)" />
                <Area type="monotone" dataKey="inflows" stroke="#10B981" strokeWidth={2} fill="none" dot={false} />
                <Area type="monotone" dataKey="outflows" stroke="#F87171" strokeWidth={2} fill="none" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Capital Deployment */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Capital Deployment</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {capitalCards.map((card) => {
            const Icon = card.icon;
            const v = capitalVariants[card.variant];
            return (
              <div key={card.label} className={`${v.bg} border rounded-[8px] p-4 sm:p-5`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">{card.label}</p>
                  <div className={v.icon}><Icon className="w-5 h-5" /></div>
                </div>
                <p className="text-xl sm:delt-page-title">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Funding Source Table */}
        <div className="delt-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Funding Source</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Committed</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Deployed</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Available</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">COC Rate</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fundingSources.map((src) => {
                  const util = ((src.deployed / src.committed) * 100).toFixed(0);
                  return (
                    <tr key={src.name} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-indigo-50 rounded flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{src.name}</p>
                            <p className="text-xs text-gray-500">{util}% utilized</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{fmt(src.committed)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{fmt(src.deployed)}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600">{fmt(src.available)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{src.coc > 0 ? `${src.coc.toFixed(1)}%` : '—'}</td>
                      <td className="px-4 py-3 text-right font-medium text-indigo-600">{src.returnPct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td className="px-4 py-3 font-semibold text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(fundingSources.reduce((s, f) => s + f.committed, 0))}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(fundingSources.reduce((s, f) => s + f.deployed, 0))}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600">{fmt(fundingSources.reduce((s, f) => s + f.available, 0))}</td>
                  <td className="px-4 py-3 text-right text-gray-500">Avg {(fundingSources.filter(f => f.coc > 0).reduce((s, f) => s + f.coc, 0) / fundingSources.filter(f => f.coc > 0).length).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right font-semibold text-indigo-600">{(fundingSources.reduce((s, f) => s + f.returnPct, 0) / fundingSources.length).toFixed(1)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="delt-card">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Description</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Type</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{tx.date}</td>
                  <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{tx.desc}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs border rounded-md ${
                        tx.type === 'Income'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.amount >= 0 ? '+' : ''}{fmt(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{tx.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          <span>Showing 8 most recent</span>
          <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">View All Transactions</button>
        </div>
      </div>
    </div>
  );
}