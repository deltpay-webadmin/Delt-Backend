import React, { useState } from 'react';
import {
  ShieldAlert,
  UserMinus,
  Heart,
  Calendar,
  Eye,
  ClipboardPlus,
  X,
  TrendingDown,
  LogIn,
  Headphones,
  AlertOctagon,
  Phone,
  Gift,
  ArrowUpCircle,
  Banknote,
  CheckCircle2,
  Clock,
  MessageSquare,
  Megaphone,
  ExternalLink,
} from 'lucide-react';
import { Button, Tabs } from '../ui';
import { useAppNavigate } from '../NavigationContext';

// ── Types ──
type PlanTier = 'Free' | 'Growth' | 'Custom';
type RiskSignal = 'Volume Declining' | 'No Portal Login 30d' | 'Support Tickets Up' | 'Chargeback Spike' | 'Late Payments' | 'Plan Downgrade Request';

interface RiskBreakdown {
  factor: string;
  weight: number; // 0–100 contribution
  detail: string;
}

interface RetentionMerchant {
  id: string;
  merchantName: string;
  riskScore: number;
  signals: RiskSignal[];
  plan: PlanTier;
  monthlyVolume: number;
  agent: string;
  daysSinceContact: number;
  volumeTrend: number[]; // 6 months
  portalLogins30d: number;
  supportTickets30d: number;
  lastAgentContact: string;
  riskBreakdown: RiskBreakdown[];
}

// ── Sample Data ──
const merchants: RetentionMerchant[] = [
  {
    id: 'MER-041',
    merchantName: 'Peak Construction Co',
    riskScore: 92,
    signals: ['Volume Declining', 'No Portal Login 30d', 'Support Tickets Up'],
    plan: 'Growth',
    monthlyVolume: 18200,
    agent: 'Priya Patel',
    daysSinceContact: 34,
    volumeTrend: [42000, 38000, 31000, 26000, 22000, 18200],
    portalLogins30d: 0,
    supportTickets30d: 5,
    lastAgentContact: 'Mar 6, 2026',
    riskBreakdown: [
      { factor: 'Revenue Decline', weight: 35, detail: '57% volume drop over 6 months' },
      { factor: 'No Portal Activity', weight: 25, detail: 'Zero logins in last 30 days' },
      { factor: 'Support Escalations', weight: 20, detail: '5 tickets opened, 2 unresolved' },
      { factor: 'Agent Contact Gap', weight: 12, detail: '34 days since last outreach' },
    ],
  },
  {
    id: 'MER-019',
    merchantName: 'Sunset Logistics LLC',
    riskScore: 84,
    signals: ['Volume Declining', 'Chargeback Spike', 'Late Payments'],
    plan: 'Free',
    monthlyVolume: 9400,
    agent: 'Devon Richards',
    daysSinceContact: 21,
    volumeTrend: [22000, 19500, 16800, 14200, 11600, 9400],
    portalLogins30d: 2,
    supportTickets30d: 1,
    lastAgentContact: 'Mar 19, 2026',
    riskBreakdown: [
      { factor: 'Revenue Decline', weight: 30, detail: '57% volume drop over 6 months' },
      { factor: 'Chargeback Rate', weight: 28, detail: '3.2% chargeback rate — above 1.5% threshold' },
      { factor: 'Late Payments', weight: 18, detail: '2 late MCA payments in last 60 days' },
      { factor: 'Low Plan Tier', weight: 8, detail: 'Free plan — limited engagement tools' },
    ],
  },
  {
    id: 'MER-027',
    merchantName: 'Bright Auto Sales',
    riskScore: 78,
    signals: ['No Portal Login 30d', 'Plan Downgrade Request'],
    plan: 'Growth',
    monthlyVolume: 31500,
    agent: 'Marcus Johnson',
    daysSinceContact: 12,
    volumeTrend: [35000, 34200, 33800, 33100, 32400, 31500],
    portalLogins30d: 0,
    supportTickets30d: 0,
    lastAgentContact: 'Mar 28, 2026',
    riskBreakdown: [
      { factor: 'No Portal Activity', weight: 30, detail: 'Zero logins in last 30 days' },
      { factor: 'Downgrade Request', weight: 28, detail: 'Requested switch from Growth to Starter' },
      { factor: 'Slight Volume Decline', weight: 12, detail: '10% gradual decline over 6 months' },
      { factor: 'Low Engagement', weight: 8, detail: 'Has not opened last 3 email campaigns' },
    ],
  },
  {
    id: 'MER-008',
    merchantName: 'Lakeside Catering',
    riskScore: 63,
    signals: ['Support Tickets Up', 'Volume Declining'],
    plan: 'Free',
    monthlyVolume: 14700,
    agent: 'Jamal Foster',
    daysSinceContact: 8,
    volumeTrend: [19000, 18200, 17400, 16500, 15600, 14700],
    portalLogins30d: 4,
    supportTickets30d: 3,
    lastAgentContact: 'Apr 1, 2026',
    riskBreakdown: [
      { factor: 'Support Escalations', weight: 25, detail: '3 tickets — billing confusion' },
      { factor: 'Revenue Decline', weight: 22, detail: '23% gradual decline over 6 months' },
      { factor: 'Low Plan Tier', weight: 10, detail: 'Free plan with limited features' },
      { factor: 'Industry Headwinds', weight: 6, detail: 'Catering sector seasonal dip' },
    ],
  },
  {
    id: 'MER-033',
    merchantName: 'Metro Diner Group',
    riskScore: 51,
    signals: ['Chargeback Spike'],
    plan: 'Custom',
    monthlyVolume: 67000,
    agent: 'Marcus Johnson',
    daysSinceContact: 3,
    volumeTrend: [62000, 63500, 65000, 66200, 66800, 67000],
    portalLogins30d: 12,
    supportTickets30d: 1,
    lastAgentContact: 'Apr 6, 2026',
    riskBreakdown: [
      { factor: 'Chargeback Rate', weight: 30, detail: '2.1% rate — elevated but improving' },
      { factor: 'Industry Risk', weight: 12, detail: 'Restaurant sector volatility' },
      { factor: 'High Concentration', weight: 9, detail: 'Single-location revenue dependency' },
    ],
  },
  {
    id: 'MER-055',
    merchantName: 'Coastal Seafood Inc',
    riskScore: 38,
    signals: ['Volume Declining'],
    plan: 'Custom',
    monthlyVolume: 54000,
    agent: 'Jamal Foster',
    daysSinceContact: 5,
    volumeTrend: [58000, 57200, 56400, 55600, 54800, 54000],
    portalLogins30d: 9,
    supportTickets30d: 0,
    lastAgentContact: 'Apr 4, 2026',
    riskBreakdown: [
      { factor: 'Slight Volume Decline', weight: 20, detail: '7% decline — seasonal pattern likely' },
      { factor: 'Market Conditions', weight: 10, detail: 'Seafood supply chain tightening' },
      { factor: 'Renewal Approaching', weight: 8, detail: 'Contract up for renewal in 45 days' },
    ],
  },
];

// ── Stats ──
const atRiskCount = merchants.filter(m => m.riskScore >= 50).length;
const churnedThisMonth = 3;
const saveRate = 68;
const avgLifetime = 14.2;

// ── Helpers ──
const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function riskColor(score: number): { ring: string; text: string; bg: string } {
  if (score >= 75) return { ring: 'text-red-500', text: 'text-red-700', bg: 'bg-red-50' };
  if (score >= 50) return { ring: 'text-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' };
  return { ring: 'text-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' };
}

function signalChip(signal: RiskSignal) {
  const map: Record<RiskSignal, string> = {
    'Volume Declining': 'bg-red-50 text-red-700 border-red-200',
    'No Portal Login 30d': 'bg-amber-50 text-amber-700 border-amber-200',
    'Support Tickets Up': 'bg-orange-50 text-orange-700 border-orange-200',
    'Chargeback Spike': 'bg-rose-50 text-rose-700 border-rose-200',
    'Late Payments': 'bg-red-50 text-red-600 border-red-200',
    'Plan Downgrade Request': 'bg-violet-50 text-violet-700 border-violet-200',
  };
  return map[signal] || 'bg-gray-100 text-gray-600 border-gray-200';
}

function planBadgeCls(plan: PlanTier) {
  switch (plan) {
    case 'Free': return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'Growth': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Custom': return 'bg-purple-50 text-purple-700 border-purple-200';
  }
}

// SVG ring score component
function RiskScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const rc = riskColor(score);
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-100" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={rc.ring} />
      </svg>
      <span className={`absolute text-xs font-bold ${rc.text}`}>{score}</span>
    </div>
  );
}

// Sparkline
function Sparkline({ data, color = '#6366f1' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 140;
  const h = 36;
  const pad = 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`;

  return (
    <svg width={w} height={h} className="block">
      <polygon points={areaPoints} fill={color} opacity={0.1} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ════════════════════════════════
// Main Component
// ════════════════════════════════
export function BackendRetention() {
  const { navigate } = useAppNavigate();
  const [selectedMerchant, setSelectedMerchant] = useState<RetentionMerchant | null>(null);
  const [activeTasks, setActiveTasks] = useState<Record<string, string[]>>({});

  const addTask = (merchantId: string, task: string) => {
    setActiveTasks(prev => {
      const existing = prev[merchantId] || [];
      if (existing.includes(task)) return prev;
      return { ...prev, [merchantId]: [...existing, task] };
    });
  };

  const merchantTasks = selectedMerchant ? (activeTasks[selectedMerchant.id] || []) : [];

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Retention &amp; Churn</h1>
        <p className="text-sm text-gray-500 mt-1">Detect at-risk merchants and trigger save workflows.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={ShieldAlert} label="At-Risk Merchants" value={String(atRiskCount)} sub="Risk score ≥ 50" variant="amber" />
        <SummaryCard icon={UserMinus} label="Churned This Month" value={String(churnedThisMonth)} sub="Accounts closed or inactive" variant="red" />
        <SummaryCard icon={Heart} label="Save Rate" value={`${saveRate}%`} sub="At-risk merchants retained" variant="emerald" />
        <SummaryCard icon={Calendar} label="Avg Merchant Lifetime" value={`${avgLifetime} mo`} sub="Across all merchants" variant="blue" />
      </div>

      {/* Outreach Engagement Insight */}
      <div className="bg-gradient-to-r from-brand-50 to-purple-50 rounded-[8px] border border-brand-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
            <Megaphone className="w-4.5 h-4.5 text-brand" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Outreach engagement correlates with +3.5 pt health score improvement</p>
            <p className="text-xs text-gray-500 mt-0.5">6 of 8 engaged merchants show rising health scores — 2 disengaged merchants are declining. <span className="font-medium text-gray-700">Merchants who open &amp; respond to outreach churn 42% less.</span></p>
          </div>
        </div>
        <Button size="sm" className="shrink-0" trailingIcon={<ExternalLink />} onClick={() => navigate('/outreach')}>View Outreach</Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[8px] border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Churn Risk Analysis</h2>
          <p className="text-xs text-gray-500 mt-0.5">{merchants.length} merchants monitored &middot; Sorted by risk score</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Merchant Name</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Risk Score</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Risk Signals</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Plan Tier</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Monthly Volume</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Agent</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Days Since Contact</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {merchants.map(m => {
                const highRisk = m.riskScore >= 75;
                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMerchant(m)}
                    className={`transition-colors cursor-pointer ${
                      highRisk
                        ? 'border-l-[3px] border-l-red-500 bg-red-50/30 hover:bg-red-50/50'
                        : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{m.merchantName}</p>
                        <p className="text-xs text-gray-500">{m.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <RiskScoreRing score={m.riskScore} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {m.signals.map(s => (
                          <span key={s} className={`inline-flex px-2 py-0.5 text-[11px] font-medium border rounded-[8px] whitespace-nowrap ${signalChip(s)}`}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium border rounded-[8px] ${planBadgeCls(m.plan)}`}>
                        {m.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(m.monthlyVolume)}</td>
                    <td className="px-4 py-3 text-gray-700">{m.agent}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-medium ${
                        m.daysSinceContact > 21 ? 'text-red-600' : m.daysSinceContact > 14 ? 'text-amber-600' : 'text-gray-700'
                      }`}>
                        {m.daysSinceContact}d
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedMerchant(m)}
                          className="p-1.5 hover:bg-brand-50 rounded-[8px] text-gray-400 hover:text-brand transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => addTask(m.id, 'Schedule Agent Call')}
                          className="p-1.5 hover:bg-amber-50 rounded-[8px] text-gray-400 hover:text-amber-600 transition-colors"
                          title="Assign Save Task"
                        >
                          <ClipboardPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedMerchant && (
        <DetailPanel
          merchant={selectedMerchant}
          tasks={merchantTasks}
          onAddTask={(task) => addTask(selectedMerchant.id, task)}
          onClose={() => setSelectedMerchant(null)}
        />
      )}
    </div>
  );
}

// ── Summary Card ──
function SummaryCard({ icon: Icon, label, value, sub, variant }: {
  icon: React.ElementType; label: string; value: string; sub: string;
  variant: 'amber' | 'red' | 'emerald' | 'blue';
}) {
  const map = {
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
    red: { bg: 'bg-red-50', icon: 'text-red-600' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
  };
  const v = map[variant];
  return (
    <div className="bg-white rounded-[8px] border border-gray-200 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{label}</p>
        <div className={`w-9 h-9 ${v.bg} rounded-[8px] flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${v.icon}`} />
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs mt-2 text-gray-500">{sub}</p>
    </div>
  );
}

// ── Detail Panel ──
function DetailPanel({ merchant, tasks, onAddTask, onClose }: {
  merchant: RetentionMerchant;
  tasks: string[];
  onAddTask: (task: string) => void;
  onClose: () => void;
}) {
  const rc = riskColor(merchant.riskScore);
  const trendDecline = merchant.volumeTrend[0] > 0
    ? Math.round(((merchant.volumeTrend[0] - merchant.volumeTrend[5]) / merchant.volumeTrend[0]) * 100)
    : 0;
  const trendColor = trendDecline > 20 ? '#ef4444' : trendDecline > 10 ? '#f59e0b' : '#6366f1';

  const playbooks = [
    { label: 'Offer Rate Review', icon: Gift, desc: 'Review and potentially lower processing rates' },
    { label: 'Upgrade Plan Offer', icon: ArrowUpCircle, desc: 'Offer discounted upgrade to next tier' },
    { label: 'Capital Pre-Approval', icon: Banknote, desc: 'Pre-approve for new MCA funding' },
    { label: 'Schedule Agent Call', icon: Phone, desc: 'Direct outreach from assigned agent' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 w-full max-w-lg h-full bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <RiskScoreRing score={merchant.riskScore} size={48} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{merchant.merchantName}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{merchant.id} &middot; {merchant.agent}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-[8px] transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Risk Score Breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Risk Score Breakdown</h3>
            <div className="space-y-3">
              {merchant.riskBreakdown.map(rb => (
                <div key={rb.factor}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-700">{rb.factor}</span>
                    <span className="text-xs font-medium text-gray-500">{rb.weight} pts</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${rb.weight >= 25 ? 'bg-red-400' : rb.weight >= 15 ? 'bg-amber-400' : 'bg-blue-400'}`}
                      style={{ width: `${rb.weight}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{rb.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Volume Trend Sparkline */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Volume Trend (6 Months)</h3>
            <div className="bg-gray-50 rounded-[8px] border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-900">{trendDecline > 0 ? `-${trendDecline}%` : 'Stable'}</span>
                  <span className="text-xs text-gray-500">over 6 months</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{fmt(merchant.monthlyVolume)}<span className="text-xs text-gray-500 font-normal"> /mo</span></span>
              </div>
              <Sparkline data={merchant.volumeTrend} color={trendColor} />
              <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                <span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span>
              </div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Engagement Metrics</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-[8px] border border-gray-200 p-3 text-center">
                <LogIn className="w-4 h-4 text-gray-400 mx-auto mb-1.5" />
                <p className="text-lg font-bold text-gray-900">{merchant.portalLogins30d}</p>
                <p className="text-[11px] text-gray-500">Portal Logins</p>
                <p className="text-[10px] text-gray-400">Last 30 days</p>
              </div>
              <div className="bg-gray-50 rounded-[8px] border border-gray-200 p-3 text-center">
                <Headphones className="w-4 h-4 text-gray-400 mx-auto mb-1.5" />
                <p className="text-lg font-bold text-gray-900">{merchant.supportTickets30d}</p>
                <p className="text-[11px] text-gray-500">Support Tickets</p>
                <p className="text-[10px] text-gray-400">Last 30 days</p>
              </div>
              <div className="bg-gray-50 rounded-[8px] border border-gray-200 p-3 text-center">
                <MessageSquare className="w-4 h-4 text-gray-400 mx-auto mb-1.5" />
                <p className="text-sm font-bold text-gray-900">{merchant.lastAgentContact}</p>
                <p className="text-[11px] text-gray-500">Last Contact</p>
                <p className="text-[10px] text-gray-400">{merchant.daysSinceContact}d ago</p>
              </div>
            </div>
          </div>

          {/* Save Playbook */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Save Playbook</h3>
            <p className="text-xs text-gray-500 mb-3">Trigger retention actions — each creates a task for {merchant.agent}.</p>
            <div className="space-y-2">
              {playbooks.map(pb => {
                const PbIcon = pb.icon;
                const isActive = tasks.includes(pb.label);
                return (
                  <button
                    key={pb.label}
                    onClick={() => !isActive && onAddTask(pb.label)}
                    disabled={isActive}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[8px] border text-left transition-colors ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-200 cursor-default'
                        : 'bg-white border-gray-200 hover:bg-brand-50 hover:border-brand-200'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-emerald-100' : 'bg-gray-100'
                    }`}>
                      {isActive ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                      ) : (
                        <PbIcon className="w-4.5 h-4.5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isActive ? 'text-emerald-700' : 'text-gray-900'}`}>
                        {pb.label}
                        {isActive && <span className="text-xs font-normal ml-2">— Task Created</span>}
                      </p>
                      <p className="text-xs text-gray-500">{pb.desc}</p>
                    </div>
                    {!isActive && (
                      <span className="text-xs text-brand font-medium shrink-0">Assign →</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tasks Summary */}
          {tasks.length > 0 && (
            <div className="bg-brand-50 rounded-[8px] border border-brand-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-brand" />
                <span className="text-sm font-medium text-brand-hover">{tasks.length} Active Save Task{tasks.length > 1 ? 's' : ''}</span>
              </div>
              <p className="text-xs text-brand">
                Assigned to {merchant.agent} &middot; Created just now
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}