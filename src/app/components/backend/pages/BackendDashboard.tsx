import React, { useState, useMemo } from 'react';
import {
  RefreshCw, ChevronRight, Zap, AlertTriangle, TrendingDown,
  Landmark, Info, Shield, BarChart3, Users, DollarSign, Activity,
} from 'lucide-react';
import { useAppNavigate } from '../NavigationContext';
import { BackendButton, BackendPageHeader } from '../ui';

// ─── ALERTS / NOTIFICATIONS ─────────────────────────────────────
const ALERTS = [
  { id: 1, type: 'chargeback' as const, severity: 'critical' as const, time: '12m ago', title: 'Chargeback — Bella Vista Restaurant', body: 'Visa $487.00 · Reason 13.1 (Merch Not Received) · Deadline Apr 25', merchant: 'Bella Vista Restaurant', agent: 'Michael Chen', actions: ['Respond', 'View'] },
  { id: 2, type: 'chargeback' as const, severity: 'critical' as const, time: '2h ago', title: 'Chargeback — Metro Diner Group', body: 'MC $215.30 · Reason 4837 (No Auth) · Deadline Apr 22', merchant: 'Metro Diner Group', agent: 'James Miller', actions: ['Respond', 'View'] },
  { id: 3, type: 'interchange' as const, severity: 'warning' as const, time: '3h ago', title: 'IC Padding — Sunrise Cafe', body: 'Visa Qual +14bps ($19.95/mo · $239/yr est. overcharge)', merchant: 'Sunrise Cafe & Bakery', agent: 'Sarah Johnson', actions: ['Verify', 'Flag North'] },
  { id: 4, type: 'chargeback' as const, severity: 'warning' as const, time: '5h ago', title: 'CB Rate 0.72% — Harbor Marine', body: '3 chargebacks in 30 days. Exceeds 0.5% threshold. VDMP risk.', merchant: 'Harbor Marine Supply', agent: 'James Miller', actions: ['Risk Profile'] },
  { id: 5, type: 'risk' as const, severity: 'warning' as const, time: '1d ago', title: 'Volume ↓28% — Green Leaf Landscaping', body: '$58.4K → $42.1K MoM. Lens flags attrition risk.', merchant: 'Green Leaf Landscaping', agent: 'Sarah Johnson', actions: ['Lens Report'] },
  { id: 6, type: 'capital' as const, severity: 'critical' as const, time: '4d ago', title: 'NSF ×3 — Little Havana Barbershop', body: '3rd consecutive NSF on daily ACH ($68). Flagged Slow Pay.', merchant: 'Little Havana Barbershop', agent: null, actions: ['Collection Status'] },
  { id: 7, type: 'info' as const, severity: 'info' as const, time: '3d ago', title: 'April 2026 IC Schedule Published', body: 'Visa L2 sunset. CEDP Product 3 mandatory. Re-verify portfolio.', merchant: null, agent: null, actions: ['View Changes'] },
];

type AlertType = typeof ALERTS[number]['type'];

// ─── DASHBOARD DATA ─────────────────────────────────────────────
const PIPELINE = { leads: 8, newThisWeek: 2, inProgress: 5, won: 1, conversionRate: 12.5, avgTimeToFund: 5.2, uwQueue: 4, uwPending: 2 };
const MERCHANTS_DATA = { total: 8, active: 8, avgHealth: 78, churnRisk: 1, totalVolume: 522700, avgEffRate: 3.42, alertCount: 4 };
const CAPITAL = { deployed: 115000, outstanding: 72100, grossCollected: 82920, netAfterCOC: -42300, dailyACH: 861, defaultRate: 8.3, activeDeals: 7, renewalPipeline: 4, fundomateComm: 9660 };
const RESIDUALS = { period: 'March 2026', totalVolume: 522700, netRevenue: 11466.40, agentPayouts: 5733.20, deltRetained: 5733.20, merchants: 8 };
const TEAM = { agents: 4, topAgent: 'Michael Chen', topAgentVol: 187200, totalCommissions: 5733.20 };

const REVENUE_TREND = [
  { month: 'Oct', net: 6820, vol: 285000 },
  { month: 'Nov', net: 7450, vol: 318000 },
  { month: 'Dec', net: 8100, vol: 355000 },
  { month: 'Jan', net: 9200, vol: 412000 },
  { month: 'Feb', net: 10100, vol: 468000 },
  { month: 'Mar', net: 11466, vol: 522700 },
];
const maxRev = Math.max(...REVENUE_TREND.map(r => r.net));

const TOP_MERCHANTS = [
  { name: 'TechStart Solutions', vol: 125000, net: 2750, health: 92, alerts: 0 },
  { name: 'Metro Diner Group', vol: 89200, net: 1961, health: 68, alerts: 1 },
  { name: 'Harbor Marine Supply', vol: 76500, net: 1683, health: 55, alerts: 2 },
  { name: 'Bella Vista Restaurant', vol: 68900, net: 1515, health: 61, alerts: 1 },
  { name: 'Urban Fitness Center', vol: 52300, net: 1150, health: 85, alerts: 0 },
];

const TEAM_SNAP = [
  { name: 'Sarah Johnson', vol: '$131.9K', merchants: 3, color: 'bg-emerald-500' },
  { name: 'Michael Chen', vol: '$187.2K', merchants: 3, color: 'bg-brand' },
  { name: 'James Miller', vol: '$165.7K', merchants: 2, color: 'bg-amber-500' },
  { name: 'Lyndon', vol: '$0', merchants: 0, color: 'bg-gray-400' },
];

const TYPE_STYLE: Record<string, { Icon: React.ElementType; color: string; bg: string }> = {
  chargeback: { Icon: Zap, color: 'text-red-500', bg: 'bg-red-50' },
  interchange: { Icon: BarChart3, color: 'text-orange-500', bg: 'bg-orange-50' },
  risk: { Icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  capital: { Icon: Landmark, color: 'text-violet-500', bg: 'bg-violet-50' },
  info: { Icon: Info, color: 'text-gray-500', bg: 'bg-gray-100' },
};

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtK = (n: number) => `$${(n / 1000).toFixed(0)}K`;

// ─── COMPONENT ──────────────────────────────────────────────────
export function BackendDashboard() {
  const { navigate } = useAppNavigate();
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null);
  const [alertFilter, setAlertFilter] = useState<'all' | AlertType>('all');

  const now = new Date();
  const criticalCount = ALERTS.filter(a => a.severity === 'critical').length;
  const filteredAlerts = alertFilter === 'all' ? ALERTS : ALERTS.filter(a => a.type === alertFilter);

  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-5">

        {/* ═══ HEADER ═══ */}
        <BackendPageHeader
          title={`${greeting}, David`}
          subtitle={
            <>
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-gray-600 font-medium">{MERCHANTS_DATA.total} merchants</span>
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-gray-600 font-medium">{fmtK(MERCHANTS_DATA.totalVolume)} processed this period</span>
            </>
          }
          actions={
            <BackendButton variant="primary" leftIcon={<RefreshCw className="w-4 h-4" />}>
              Refresh Data
            </BackendButton>
          }
        />


        {/* ═══ CRITICAL ALERT STRIP ═══ */}
        {criticalCount > 0 && (
          <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200/50 rounded-[8px]">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <div>
                <p className="text-sm font-bold text-red-600">{criticalCount} critical alert{criticalCount > 1 ? 's' : ''}</p>
                <p className="text-xs text-red-800/70 mt-0.5">
                  {ALERTS.filter(a => a.severity === 'critical').map(a => a.merchant || a.title).filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold font-mono shadow-md shadow-red-500/30">
              {criticalCount}
            </span>
          </div>
        )}

        {/* ═══ MAIN GRID ═══ */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">

          {/* ─── LEFT: Metrics ─── */}
          <div className="space-y-5">

            {/* Revenue KPIs */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Revenue & Processing</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <BigKPI label="Net Revenue" value={`$${RESIDUALS.netRevenue.toLocaleString()}`} sub={RESIDUALS.period} color="text-emerald-600" />
                <BigKPI label="Total Volume" value={fmtK(RESIDUALS.totalVolume)} sub={`${MERCHANTS_DATA.total} merchants`} />
                <BigKPI label="Delt Retained" value={`$${RESIDUALS.deltRetained.toLocaleString()}`} sub="After agent splits" color="text-brand" />
                <BigKPI label="Agent Payouts" value={`$${RESIDUALS.agentPayouts.toLocaleString()}`} sub={`${TEAM.agents} agents`} color="text-amber-500" />
              </div>
            </div>

            {/* Revenue Trend */}
            <div className="delt-card p-5">
              <div className="flex items-baseline justify-between mb-4">
                <p className="text-sm font-bold text-gray-900">Revenue Trend</p>
                <p className="text-[11px] text-gray-400">Last 6 months · Net revenue</p>
              </div>
              <div className="flex items-end justify-between gap-2 h-[160px]">
                {REVENUE_TREND.map((r, i) => {
                  const pct = (r.net / maxRev) * 100;
                  const isCurrent = i === REVENUE_TREND.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full gap-1.5">
                      <span className="text-[10px] font-semibold font-mono text-gray-500">${(r.net / 1000).toFixed(1)}K</span>
                      <div className="flex-1 w-full flex flex-col justify-end">
                        <div
                          className={`w-full rounded ${isCurrent ? 'bg-brand' : 'bg-gray-200'}`}
                          style={{ height: `${pct}%`, transition: 'height 0.5s ease', minHeight: 4 }}
                        />
                      </div>
                      <span className={`text-[11px] ${isCurrent ? 'text-brand font-bold' : 'text-gray-400 font-medium'}`}>{r.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pipeline + Capital */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Pipeline */}
              <div className="delt-card p-5">
                <div className="flex items-center gap-2 mb-3.5">
                  <Activity className="w-4 h-4 text-brand" />
                  <span className="text-sm font-bold text-gray-900 flex-1">Pipeline</span>
                  <button onClick={() => navigate('/leads')} className="text-[11px] text-brand font-semibold hover:underline">View →</button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <MiniKPI label="Leads" value={PIPELINE.leads} />
                  <MiniKPI label="New" value={PIPELINE.newThisWeek} accent />
                  <MiniKPI label="In Progress" value={PIPELINE.inProgress} />
                  <MiniKPI label="Won" value={PIPELINE.won} color="text-emerald-600" />
                </div>
                <div className="h-px bg-gray-100 my-2.5" />
                <div className="grid grid-cols-4 gap-1.5">
                  <MiniKPI label="Conversion" value={`${PIPELINE.conversionRate}%`} />
                  <MiniKPI label="Avg Fund" value={`${PIPELINE.avgTimeToFund}d`} />
                  <MiniKPI label="UW Queue" value={PIPELINE.uwQueue} />
                  <MiniKPI label="UW Pending" value={PIPELINE.uwPending} color="text-amber-500" />
                </div>
              </div>

              {/* Capital */}
              <div className="delt-card p-5">
                <div className="flex items-center gap-2 mb-3.5">
                  <Landmark className="w-4 h-4 text-brand" />
                  <span className="text-sm font-bold text-gray-900 flex-1">Capital</span>
                  <button onClick={() => navigate('/capital')} className="text-[11px] text-brand font-semibold hover:underline">View →</button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <MiniKPI label="Deployed" value={fmtK(CAPITAL.deployed)} />
                  <MiniKPI label="Outstanding" value={fmtK(CAPITAL.outstanding)} />
                  <MiniKPI label="Collected" value={fmtK(CAPITAL.grossCollected)} color="text-emerald-600" />
                  <MiniKPI label="Daily ACH" value={`$${CAPITAL.dailyACH}`} />
                </div>
                <div className="h-px bg-gray-100 my-2.5" />
                <div className="grid grid-cols-4 gap-1.5">
                  <MiniKPI label="Default" value={`${CAPITAL.defaultRate}%`} color={CAPITAL.defaultRate > 5 ? 'text-red-500' : 'text-emerald-600'} />
                  <MiniKPI label="Active" value={CAPITAL.activeDeals} />
                  <MiniKPI label="Renewals" value={CAPITAL.renewalPipeline} />
                  <MiniKPI label="Fundomate" value={`$${(CAPITAL.fundomateComm / 1000).toFixed(1)}K`} color="text-brand" />
                </div>
              </div>
            </div>

            {/* Top Merchants */}
            <div className="delt-card overflow-hidden">
              <div className="flex items-baseline justify-between px-5 pt-4 pb-3">
                <p className="text-sm font-bold text-gray-900">Top Merchants by Volume</p>
                <button onClick={() => navigate('/merchants')} className="text-[11px] text-brand font-semibold hover:underline">All Merchants →</button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {['Merchant', 'Volume', 'Net Rev', 'Health', 'Alerts'].map(h => (
                      <th key={h} className="px-5 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TOP_MERCHANTS.map((m, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900">{m.name}</td>
                      <td className="px-5 py-3 text-sm font-mono tabular-nums text-gray-700">{fmtK(m.vol)}</td>
                      <td className="px-5 py-3 text-sm font-mono tabular-nums text-emerald-600">${m.net.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${m.health >= 80 ? 'bg-emerald-500' : m.health >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${m.health}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold font-mono ${m.health >= 80 ? 'text-emerald-600' : m.health >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{m.health}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {m.alerts > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold font-mono">{m.alerts}</span>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold">Clean</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── RIGHT: Alert Feed ─── */}
          <div className="xl:sticky xl:top-6 xl:max-h-[calc(100vh-72px)] flex flex-col overflow-hidden">
            {/* Alert Header */}
            <div className="bg-white border border-gray-200 rounded-t-[8px] px-4 pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2.5">
                <p className="text-base font-extrabold text-gray-900">Alerts</p>
                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold font-mono">
                  {ALERTS.length}
                </span>
              </div>
              <div className="flex gap-1">
                {(['all', 'chargeback', 'interchange', 'risk'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setAlertFilter(f)}
                    className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium border transition-colors ${
                      alertFilter === f
                        ? 'bg-gray-900 border-gray-900 text-white'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Alert Feed */}
            <div className="flex-1 overflow-y-auto bg-white border-x border-gray-200">
              {filteredAlerts.map(a => {
                const ts = TYPE_STYLE[a.type] || TYPE_STYLE.info;
                const isCrit = a.severity === 'critical';
                const isExp = expandedAlert === a.id;
                const borderColor = a.type === 'chargeback' ? 'border-l-red-500' : a.type === 'interchange' ? 'border-l-orange-500' : a.type === 'risk' ? 'border-l-amber-500' : a.type === 'capital' ? 'border-l-violet-500' : 'border-l-gray-400';
                return (
                  <div
                    key={a.id}
                    onClick={() => setExpandedAlert(isExp ? null : a.id)}
                    className={`px-4 py-3.5 border-b border-gray-100 border-l-[3px] ${borderColor} cursor-pointer transition-colors ${isCrit ? 'bg-red-50/50' : 'hover:bg-gray-50/50'}`}
                  >
                    <div className="flex gap-2.5">
                      <div className={`w-7 h-7 rounded-[6px] ${ts.bg} ${ts.color} flex items-center justify-center shrink-0 mt-0.5`}>
                        <ts.Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {isCrit && (
                            <span className="relative flex h-[7px] w-[7px]">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-red-500" />
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-gray-400 font-medium">{a.time}</span>
                        </div>
                        <p className="text-[13px] font-bold text-gray-900 leading-snug">{a.title}</p>
                        <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{a.body}</p>
                      </div>
                    </div>
                    {isExp && (
                      <div className="mt-2.5 pt-2.5 border-t border-gray-200">
                        {a.merchant && (
                          <p className="text-[11px] text-gray-500 mb-2">
                            📍 {a.merchant}{a.agent ? ` · 👤 ${a.agent}` : ''}
                          </p>
                        )}
                        <div className="flex gap-1.5">
                          {a.actions.map((act, ai) => (
                            <button
                              key={ai}
                              onClick={(e) => e.stopPropagation()}
                              className={`px-3 py-1.5 rounded-[6px] text-[11px] font-semibold transition-colors ${
                                ai === 0
                                  ? 'bg-brand text-white hover:bg-brand-hover'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {act}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Team Snapshot */}
            <div className="bg-white border border-gray-200 rounded-b-[8px] px-4 py-3.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Team Snapshot</p>
              <div className="space-y-2">
                {TEAM_SNAP.map((a, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${a.color} shrink-0`} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-900">{a.name}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <span className="font-mono font-semibold text-gray-600">{a.vol}</span>
                        <span className="text-gray-300">·</span>
                        <span>{a.merchants} merchant{a.merchants !== 1 ? 's' : ''}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SUB-COMPONENTS ─────────────────────────────────────────────
function BigKPI({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="delt-card p-4">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
      <p className={`text-xl font-extrabold font-mono tracking-tight ${color || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function MiniKPI({ label, value, color, accent }: { label: string; value: string | number; color?: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-base font-bold font-mono tracking-tight ${accent ? 'text-brand' : color || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
