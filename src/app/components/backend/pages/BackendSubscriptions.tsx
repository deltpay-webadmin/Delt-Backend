import React, { useState } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Search,
  Filter,
  Eye,
  Edit,
  XCircle,
  Globe,
  Sparkles,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Layers,
  ChevronDown,
  Plus,
  Building2,
  Store,
  ArrowLeft,
  Palette,
  Link,
  ShieldAlert,
  BarChart3,
} from 'lucide-react';

// ── Types ──
type PlanTier = 'Free' | 'Growth' | 'Custom';
type BillingStatus = 'Current' | 'Past Due' | 'Trial' | 'Cancelled';
type WebsiteStatus = 'Live' | 'Draft' | 'None';
type TopTab = 'plans' | 'iso';

type ISOStatus = 'Active' | 'Trial' | 'Suspended';
type ISOTier = 'Standard' | 'Professional' | 'Enterprise';

interface Subscription {
  id: string;
  merchantName: string;
  plan: PlanTier;
  monthlyFee: number;
  billingStatus: BillingStatus;
  lensUsage: number;
  websiteStatus: WebsiteStatus;
  mcaActive: boolean;
  memberSince: string;
  nextBilling: string;
  agent: string;
}

interface ISOTenant {
  id: string;
  name: string;
  tier: ISOTier;
  monthlyFee: number;
  residualOverride: number;
  mcaCommission: number;
  lensAIFees: number;
  totalRevenue: number;
  agents: number;
  merchants: number;
  status: ISOStatus;
  onboardDate: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  usageData: { month: string; saas: number; residual: number; mca: number; lens: number }[];
}

// ── Data ──
const subscriptions: Subscription[] = [
  { id: 'SUB-001', merchantName: 'Metro Diner Group', plan: 'Custom', monthlyFee: 199, billingStatus: 'Current', lensUsage: 47, websiteStatus: 'Live', mcaActive: true, memberSince: 'Jan 2025', nextBilling: 'May 1, 2026', agent: 'Marcus Johnson' },
  { id: 'SUB-002', merchantName: 'Bright Auto Sales', plan: 'Growth', monthlyFee: 99, billingStatus: 'Current', lensUsage: 12, websiteStatus: 'Live', mcaActive: true, memberSince: 'Mar 2025', nextBilling: 'May 1, 2026', agent: 'Marcus Johnson' },
  { id: 'SUB-003', merchantName: 'Sunset Logistics LLC', plan: 'Free', monthlyFee: 0, billingStatus: 'Current', lensUsage: 0, websiteStatus: 'None', mcaActive: true, memberSince: 'Jun 2025', nextBilling: '—', agent: 'Devon Richards' },
  { id: 'SUB-004', merchantName: 'Peak Construction Co', plan: 'Growth', monthlyFee: 99, billingStatus: 'Past Due', lensUsage: 8, websiteStatus: 'Draft', mcaActive: false, memberSince: 'Sep 2025', nextBilling: 'Apr 1, 2026', agent: 'Priya Patel' },
  { id: 'SUB-005', merchantName: 'Coastal Seafood Inc', plan: 'Custom', monthlyFee: 199, billingStatus: 'Current', lensUsage: 63, websiteStatus: 'Live', mcaActive: true, memberSince: 'Nov 2024', nextBilling: 'May 1, 2026', agent: 'Jamal Foster' },
  { id: 'SUB-006', merchantName: 'Lakeside Catering', plan: 'Free', monthlyFee: 0, billingStatus: 'Trial', lensUsage: 2, websiteStatus: 'None', mcaActive: false, memberSince: 'Apr 2026', nextBilling: 'May 9, 2026', agent: 'Jamal Foster' },
];

const allAgents = ['All Agents', 'Marcus Johnson', 'Devon Richards', 'Priya Patel', 'Jamal Foster', 'Sarah Kim'];

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const isoTenants: ISOTenant[] = [
  {
    id: 'ISO-001', name: 'Apex Funding Group', tier: 'Enterprise', monthlyFee: 2499, residualOverride: 8400, mcaCommission: 12600, lensAIFees: 1890, totalRevenue: 25389, agents: 14, merchants: 86, status: 'Active', onboardDate: 'Aug 2024',
    logo: 'AF', primaryColor: '#1E3A5F', secondaryColor: '#4A90D9', customDomain: 'portal.apexfunding.com',
    contactName: 'Richard Torres', contactEmail: 'richard@apexfunding.com', contactPhone: '(305) 555-0142',
    usageData: [
      { month: 'Nov', saas: 2499, residual: 6200, mca: 9800, lens: 1200 },
      { month: 'Dec', saas: 2499, residual: 6800, mca: 10400, lens: 1350 },
      { month: 'Jan', saas: 2499, residual: 7200, mca: 11200, lens: 1520 },
      { month: 'Feb', saas: 2499, residual: 7600, mca: 11800, lens: 1680 },
      { month: 'Mar', saas: 2499, residual: 8100, mca: 12200, lens: 1790 },
      { month: 'Apr', saas: 2499, residual: 8400, mca: 12600, lens: 1890 },
    ],
  },
  {
    id: 'ISO-002', name: 'Liberty Capital Partners', tier: 'Professional', monthlyFee: 999, residualOverride: 3200, mcaCommission: 5400, lensAIFees: 640, totalRevenue: 10239, agents: 6, merchants: 34, status: 'Active', onboardDate: 'Jan 2025',
    logo: 'LC', primaryColor: '#2D5016', secondaryColor: '#6BAF3D', customDomain: 'app.libertycapital.io',
    contactName: 'Sandra Kim', contactEmail: 'sandra@libertycapital.io', contactPhone: '(212) 555-0198',
    usageData: [
      { month: 'Nov', saas: 999, residual: 2100, mca: 3600, lens: 340 },
      { month: 'Dec', saas: 999, residual: 2400, mca: 4000, lens: 410 },
      { month: 'Jan', saas: 999, residual: 2600, mca: 4400, lens: 480 },
      { month: 'Feb', saas: 999, residual: 2800, mca: 4800, lens: 520 },
      { month: 'Mar', saas: 999, residual: 3000, mca: 5100, lens: 580 },
      { month: 'Apr', saas: 999, residual: 3200, mca: 5400, lens: 640 },
    ],
  },
  {
    id: 'ISO-003', name: 'Pinnacle Merchant Solutions', tier: 'Standard', monthlyFee: 499, residualOverride: 1100, mcaCommission: 2200, lensAIFees: 180, totalRevenue: 3979, agents: 3, merchants: 12, status: 'Trial', onboardDate: 'Mar 2026',
    logo: 'PM', primaryColor: '#6B21A8', secondaryColor: '#A855F7', customDomain: '—',
    contactName: 'Derek Williams', contactEmail: 'derek@pinnaclemso.com', contactPhone: '(404) 555-0267',
    usageData: [
      { month: 'Nov', saas: 0, residual: 0, mca: 0, lens: 0 },
      { month: 'Dec', saas: 0, residual: 0, mca: 0, lens: 0 },
      { month: 'Jan', saas: 0, residual: 0, mca: 0, lens: 0 },
      { month: 'Feb', saas: 0, residual: 0, mca: 0, lens: 0 },
      { month: 'Mar', saas: 499, residual: 600, mca: 1400, lens: 90 },
      { month: 'Apr', saas: 499, residual: 1100, mca: 2200, lens: 180 },
    ],
  },
  {
    id: 'ISO-004', name: 'Trident Financial Group', tier: 'Professional', monthlyFee: 999, residualOverride: 4100, mcaCommission: 6800, lensAIFees: 920, totalRevenue: 12819, agents: 8, merchants: 47, status: 'Active', onboardDate: 'Nov 2024',
    logo: 'TF', primaryColor: '#B91C1C', secondaryColor: '#F87171', customDomain: 'dash.tridentfg.com',
    contactName: 'Angela Morrison', contactEmail: 'angela@tridentfg.com', contactPhone: '(713) 555-0331',
    usageData: [
      { month: 'Nov', saas: 999, residual: 2800, mca: 4600, lens: 560 },
      { month: 'Dec', saas: 999, residual: 3100, mca: 5200, lens: 640 },
      { month: 'Jan', saas: 999, residual: 3400, mca: 5600, lens: 720 },
      { month: 'Feb', saas: 999, residual: 3600, mca: 6000, lens: 790 },
      { month: 'Mar', saas: 999, residual: 3900, mca: 6400, lens: 860 },
      { month: 'Apr', saas: 999, residual: 4100, mca: 6800, lens: 920 },
    ],
  },
];

const isoActiveCount = isoTenants.filter(t => t.status === 'Active').length;
const isoMRR = isoTenants.reduce((s, t) => s + t.totalRevenue, 0);
const isoAvgRevenue = Math.round(isoMRR / isoTenants.length);
const isoTotalMerchants = isoTenants.reduce((s, t) => s + t.merchants, 0);

// ── Helpers ──
function planBadge(plan: PlanTier) {
  switch (plan) {
    case 'Free': return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'Growth': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Custom': return 'bg-purple-50 text-purple-700 border-purple-200';
  }
}

function billingBadge(status: BillingStatus) {
  switch (status) {
    case 'Current': return { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle };
    case 'Past Due': return { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle };
    case 'Trial': return { cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock };
    case 'Cancelled': return { cls: 'bg-red-50 text-red-600 border-red-200', icon: XCircle };
  }
}

function websiteBadge(status: WebsiteStatus) {
  switch (status) {
    case 'Live': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Draft': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'None': return 'bg-gray-100 text-gray-500 border-gray-200';
  }
}

// ── Stats ──
const totalSubscribers = subscriptions.length;
const monthlyRevenue = subscriptions.filter(s => s.billingStatus !== 'Cancelled').reduce((sum, s) => sum + s.monthlyFee, 0);
const paidSubscribers = subscriptions.filter(s => s.monthlyFee > 0 && s.billingStatus !== 'Cancelled');
const avgRevenue = paidSubscribers.length > 0 ? Math.round(monthlyRevenue / totalSubscribers) : 0;
const upgradeRate = 16.7; // 1 of 6 moved up this month

const starterCount = subscriptions.filter(s => s.plan === 'Free').length;
const growthCount = subscriptions.filter(s => s.plan === 'Growth').length;
const intelCount = subscriptions.filter(s => s.plan === 'Custom').length;

// ════════════════════════════════════════
// Main Component
// ════════════════════════════════════════
export function BackendSubscriptions() {
  const [topTab, setTopTab] = useState<TopTab>('plans');
  const [planFilter, setPlanFilter] = useState<'All' | PlanTier>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | BillingStatus>('All');
  const [agentFilter, setAgentFilter] = useState('All Agents');
  const [search, setSearch] = useState('');
  const [selectedISO, setSelectedISO] = useState<ISOTenant | null>(null);

  const filtered = subscriptions.filter(s => {
    const matchPlan = planFilter === 'All' || s.plan === planFilter;
    const matchStatus = statusFilter === 'All' || s.billingStatus === statusFilter;
    const matchAgent = agentFilter === 'All Agents' || s.agent === agentFilter;
    const matchSearch = s.merchantName.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    return matchPlan && matchStatus && matchAgent && matchSearch;
  });

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Top Tab Bar */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {([
            { key: 'plans' as const, label: 'Merchant Plans' },
            { key: 'iso' as const, label: 'ISO Tenants' },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTopTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                topTab === t.key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {topTab === 'iso' ? (
        selectedISO ? (
          <ISOTenantDetail tenant={selectedISO} onBack={() => setSelectedISO(null)} />
        ) : (
          <ISOTenantsTab onViewTenant={(t) => setSelectedISO(t)} />
        )
      ) : (
        <>
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Merchant Subscriptions</h1>
            <p className="text-sm text-gray-500 mt-1">Track plan tiers, billing, and upgrades across all merchants.</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard icon={Users} label="Total Subscribers" value={String(totalSubscribers)} sub={`${paidSubscribers.length} paid, ${starterCount} free`} variant="indigo" />
            <SummaryCard icon={DollarSign} label="Monthly Subscription Revenue" value={fmt(monthlyRevenue)} sub={`${paidSubscribers.length} paying merchants`} variant="emerald" />
            <SummaryCard icon={CreditCard} label="Avg Revenue Per Merchant" value={fmt(avgRevenue)} sub="Across all subscribers" variant="blue" />
            <SummaryCard icon={ArrowUpRight} label="Upgrade Rate" value={`${upgradeRate}%`} sub="Free → Growth/Custom this month" variant="purple" />
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-[8px] border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 flex flex-col xl:flex-row xl:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search merchants..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Plan Tier filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 font-medium">Plan:</span>
                  {(['All', 'Free', 'Growth', 'Custom'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPlanFilter(p)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-[8px] border transition-colors ${
                        planFilter === p
                          ? 'bg-brand-50 text-brand-hover border-brand-200'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {p === 'Free' ? 'Free — Free' : p === 'Growth' ? 'Growth — $99' : p === 'Custom' ? 'Custom — $199' : p}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="hidden xl:block w-px h-6 bg-gray-200" />

                {/* Status filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 font-medium">Status:</span>
                  {(['All', 'Current', 'Trial', 'Past Due', 'Cancelled'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-[8px] border transition-colors ${
                        statusFilter === s
                          ? 'bg-brand-50 text-brand-hover border-brand-200'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="hidden xl:block w-px h-6 bg-gray-200" />

                {/* Agent dropdown */}
                <div className="relative">
                  <select
                    value={agentFilter}
                    onChange={e => setAgentFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium border border-gray-200 rounded-[8px] bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent cursor-pointer"
                  >
                    {allAgents.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Merchant Name</th>
                    <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Plan Tier</th>
                    <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Monthly Fee</th>
                    <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Billing Status</th>
                    <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Lens AI Usage</th>
                    <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Website</th>
                    <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">MCA Active</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Member Since</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Next Billing</th>
                    <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(sub => {
                    const billing = billingBadge(sub.billingStatus);
                    const BillingIcon = billing.icon;
                    const isPastDue = sub.billingStatus === 'Past Due';
                    return (
                      <tr key={sub.id} className={`transition-colors ${isPastDue ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-gray-50/50'}`}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{sub.merchantName}</p>
                            <p className="text-xs text-gray-500">{sub.agent}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium border rounded-[8px] ${planBadge(sub.plan)}`}>
                            {sub.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {sub.monthlyFee === 0 ? <span className="text-gray-400">Free</span> : `$${sub.monthlyFee}`}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-[8px] ${billing.cls}`}>
                            <BillingIcon className="w-3 h-3" />
                            {sub.billingStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-gray-700">{sub.lensUsage}</span>
                            <span className="text-gray-400 text-xs">calls</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-[8px] ${websiteBadge(sub.websiteStatus)}`}>
                            {sub.websiteStatus === 'Live' && <Globe className="w-3 h-3" />}
                            {sub.websiteStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {sub.mcaActive ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-50 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{sub.memberSince}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{sub.nextBilling}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button className="p-1.5 hover:bg-brand-50 rounded-[8px] text-gray-400 hover:text-brand transition-colors" title="View">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 hover:bg-blue-50 rounded-[8px] text-gray-400 hover:text-blue-600 transition-colors" title="Change Plan">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 hover:bg-red-50 rounded-[8px] text-gray-400 hover:text-red-600 transition-colors" title="Cancel">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-gray-500">
                No subscriptions match your current filters.
              </div>
            )}
          </div>

          {/* Plan Distribution */}
          <PlanDistribution starter={starterCount} growth={growthCount} intelligence={intelCount} total={totalSubscribers} />
        </>
      )}
    </div>
  );
}

// ── Summary Card ──
function SummaryCard({ icon: Icon, label, value, sub, variant }: {
  icon: React.ElementType; label: string; value: string; sub: string;
  variant: 'indigo' | 'emerald' | 'blue' | 'purple';
}) {
  const map = {
    indigo: { bg: 'bg-brand-50', icon: 'text-brand' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
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

// ── Plan Distribution Visualization ──
function PlanDistribution({ starter, growth, intelligence, total }: {
  starter: number; growth: number; intelligence: number; total: number;
}) {
  const plans = [
    { name: 'Free', price: 'Free', count: starter, pct: Math.round((starter / total) * 100), color: 'bg-gray-400', ringColor: 'ring-gray-200', badgeColor: 'bg-gray-100 text-gray-600', barTrack: 'bg-gray-100', barFill: 'bg-gray-400' },
    { name: 'Growth', price: '$99/mo', count: growth, pct: Math.round((growth / total) * 100), color: 'bg-blue-500', ringColor: 'ring-blue-200', badgeColor: 'bg-blue-50 text-blue-700', barTrack: 'bg-blue-100', barFill: 'bg-blue-500' },
    { name: 'Custom', price: 'Custom', count: intelligence, pct: Math.round((intelligence / total) * 100), color: 'bg-purple-500', ringColor: 'ring-purple-200', badgeColor: 'bg-purple-50 text-purple-700', barTrack: 'bg-purple-100', barFill: 'bg-purple-500' },
  ];

  return (
    <div className="bg-white rounded-[8px] border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Plan Distribution</h3>
        <p className="text-xs text-gray-500 mt-0.5">{total} total merchants across all plan tiers</p>
      </div>

      {/* Stacked bar overview */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex h-3 rounded-full overflow-hidden">
          {plans.map(p => (
            <div
              key={p.name}
              className={`${p.barFill} transition-all`}
              style={{ width: `${p.pct}%` }}
            />
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="px-5 pb-5 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map(p => (
          <div key={p.name} className="border border-gray-200 rounded-[8px] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-[8px] ${p.badgeColor}`}>
                {p.name}
              </span>
              <span className="text-xs text-gray-500">{p.price}</span>
            </div>
            <div className="flex items-end justify-between mb-3">
              <p className="text-3xl font-bold text-gray-900">{p.count}</p>
              <p className="text-sm text-gray-500">{p.pct}%</p>
            </div>
            <div className={`h-2 rounded-full ${p.barTrack}`}>
              <div
                className={`h-2 rounded-full ${p.barFill} transition-all`}
                style={{ width: `${p.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ISO Tenants Tab ──
function ISOTenantsTab({ onViewTenant }: { onViewTenant: (t: ISOTenant) => void }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ISO Tenants</h1>
          <p className="text-sm text-gray-500 mt-1">Manage ISOs licensing the Delt platform</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-[8px] hover:bg-brand-hover transition-colors">
          <Plus className="w-4 h-4" />
          Onboard ISO
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Building2} label="Active ISOs" value={String(isoActiveCount)} sub={`${isoTenants.length} total tenants`} variant="indigo" />
        <SummaryCard icon={DollarSign} label="ISO MRR" value={fmt(isoMRR)} sub="Combined monthly revenue" variant="emerald" />
        <SummaryCard icon={CreditCard} label="Avg Revenue Per ISO" value={fmt(isoAvgRevenue)} sub="Across all ISO tenants" variant="blue" />
        <SummaryCard icon={Store} label="Total ISO Merchants" value={String(isoTotalMerchants)} sub="Aggregate across all tenants" variant="purple" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[8px] border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">ISO Name</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Plan / Tier</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">SaaS Fee</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Residual Override</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">MCA Cut</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Lens AI Fees</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Total Revenue</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Agents</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Merchants</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Onboard Date</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isoTenants.map(t => {
                const sBadge = isoStatusBadge(t.status);
                const SIcon = sBadge.icon;
                return (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[8px] flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: t.primaryColor }}>
                          {t.logo}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-500">{t.contactName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium border rounded-[8px] ${isoTierBadge(t.tier)}`}>
                        {t.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(t.monthlyFee)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(t.residualOverride)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(t.mcaCommission)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt(t.lensAIFees)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(t.totalRevenue)}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{t.agents}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{t.merchants}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-[8px] ${sBadge.cls}`}>
                        <SIcon className="w-3 h-3" />
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.onboardDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => onViewTenant(t)} className="p-1.5 hover:bg-brand-50 rounded-[8px] text-gray-400 hover:text-brand transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 hover:bg-blue-50 rounded-[8px] text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 hover:bg-red-50 rounded-[8px] text-gray-400 hover:text-red-600 transition-colors" title="Suspend">
                          <ShieldAlert className="w-4 h-4" />
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
    </div>
  );
}

// ── ISO Helpers ──
function isoTierBadge(tier: ISOTier) {
  switch (tier) {
    case 'Standard': return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'Professional': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Enterprise': return 'bg-purple-50 text-purple-700 border-purple-200';
  }
}

function isoStatusBadge(status: ISOStatus) {
  switch (status) {
    case 'Active': return { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle };
    case 'Trial': return { cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock };
    case 'Suspended': return { cls: 'bg-red-50 text-red-600 border-red-200', icon: ShieldAlert };
  }
}

// ── ISO Tenant Detail ──
function ISOTenantDetail({ tenant, onBack }: { tenant: ISOTenant; onBack: () => void }) {
  const sBadge = isoStatusBadge(tenant.status);
  const SIcon = sBadge.icon;

  const revenueCards = [
    { label: 'SaaS Platform Fee', value: tenant.monthlyFee, icon: CreditCard, color: 'indigo', desc: 'Monthly platform licensing fee' },
    { label: 'Residual Override', value: tenant.residualOverride, icon: TrendingUp, color: 'emerald', desc: 'Override on ISO merchant residuals' },
    { label: 'MCA Commission Cut', value: tenant.mcaCommission, icon: DollarSign, color: 'blue', desc: 'Revenue share on MCA deals' },
    { label: 'Lens AI Per-Call Fees', value: tenant.lensAIFees, icon: Sparkles, color: 'purple', desc: 'Based on ISO merchant AI usage' },
  ] as const;

  const colorMap: Record<string, { bg: string; text: string }> = {
    indigo: { bg: 'bg-brand-50', text: 'text-brand' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  };

  const maxTotal = Math.max(...tenant.usageData.map(d => d.saas + d.residual + d.mca + d.lens));

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to ISO Tenants
        </button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[12px] flex items-center justify-center text-white text-lg font-bold shrink-0" style={{ background: tenant.primaryColor }}>
              {tenant.logo}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border rounded-[8px] ${sBadge.cls}`}>
                  <SIcon className="w-3 h-3" />
                  {tenant.status}
                </span>
                <span className={`inline-flex px-2.5 py-1 text-xs font-medium border rounded-[8px] ${isoTierBadge(tenant.tier)}`}>
                  {tenant.tier}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Onboarded {tenant.onboardDate} &middot; {tenant.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-[8px] text-gray-600 hover:bg-gray-50 transition-colors">
              Edit Tenant
            </button>
            <button className="px-4 py-2 text-sm font-medium border border-red-200 rounded-[8px] text-red-600 hover:bg-red-50 transition-colors">
              Suspend
            </button>
          </div>
        </div>
      </div>

      {/* ISO Info + White-Label Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-[8px] border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">ISO Information</h3>
          <div className="space-y-0">
            {[
              { label: 'Contact', value: tenant.contactName },
              { label: 'Email', value: tenant.contactEmail },
              { label: 'Phone', value: tenant.contactPhone },
              { label: 'Agents', value: String(tenant.agents) },
              { label: 'Merchants', value: String(tenant.merchants) },
              { label: 'Total Monthly Revenue', value: fmt(tenant.totalRevenue) },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-500">{row.label}</span>
                <span className="text-sm font-medium text-gray-900">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[8px] border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">White-Label Configuration</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-500">Logo</span>
              <div className="w-10 h-10 rounded-[8px] flex items-center justify-center text-white text-sm font-bold" style={{ background: tenant.primaryColor }}>
                {tenant.logo}
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">Brand Colors</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-[8px] border border-gray-200" style={{ background: tenant.primaryColor }} />
                  <span className="text-xs text-gray-500 font-mono">{tenant.primaryColor}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-[8px] border border-gray-200" style={{ background: tenant.secondaryColor }} />
                  <span className="text-xs text-gray-500 font-mono">{tenant.secondaryColor}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">Custom Domain</span>
              {tenant.customDomain !== '—' ? (
                <div className="flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-brand-500" />
                  <span className="text-sm font-medium text-brand">{tenant.customDomain}</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Not configured</span>
              )}
            </div>
            <div className="mt-1 rounded-[8px] overflow-hidden border border-gray-200">
              <div className="h-10 flex items-center px-4 gap-2" style={{ background: tenant.primaryColor }}>
                <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold" style={{ background: tenant.secondaryColor }}>
                  {tenant.logo[0]}
                </div>
                <span className="text-white text-xs font-medium">{tenant.name}</span>
              </div>
              <div className="h-14 bg-gray-50 flex items-center justify-center">
                <span className="text-xs text-gray-400">Portal preview</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Layers */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Revenue Layers</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {revenueCards.map(rc => {
            const RcIcon = rc.icon;
            const c = colorMap[rc.color];
            return (
              <div key={rc.label} className="bg-white rounded-[8px] border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">{rc.label}</p>
                  <div className={`w-8 h-8 ${c.bg} rounded-[8px] flex items-center justify-center`}>
                    <RcIcon className={`w-4 h-4 ${c.text}`} />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900">{fmt(rc.value)}</p>
                <p className="text-xs text-gray-400 mt-1">{rc.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-[8px] border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-brand-50 rounded-[8px] flex items-center justify-center">
            <Users className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{tenant.agents}</p>
            <p className="text-sm text-gray-500">Active Agents</p>
          </div>
        </div>
        <div className="bg-white rounded-[8px] border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-50 rounded-[8px] flex items-center justify-center">
            <Store className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{tenant.merchants}</p>
            <p className="text-sm text-gray-500">Merchants Under ISO</p>
          </div>
        </div>
      </div>

      {/* 6-Month Usage Chart */}
      <div className="bg-white rounded-[8px] border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">6-Month Revenue Breakdown</h3>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-5 mb-5">
            {[
              { label: 'SaaS Fee', color: 'bg-brand-500' },
              { label: 'Residual Override', color: 'bg-emerald-500' },
              { label: 'MCA Commission', color: 'bg-blue-500' },
              { label: 'Lens AI', color: 'bg-purple-500' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                <span className="text-xs text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-3 h-52">
            {tenant.usageData.map(d => {
              const total = d.saas + d.residual + d.mca + d.lens;
              const scale = maxTotal > 0 ? (total / maxTotal) : 0;
              const h = scale * 176;
              const saasH = total > 0 ? (d.saas / total) * h : 0;
              const resH = total > 0 ? (d.residual / total) * h : 0;
              const mcaH = total > 0 ? (d.mca / total) * h : 0;
              const lensH = total > 0 ? (d.lens / total) * h : 0;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-gray-500 font-medium">{fmt(total)}</span>
                  <div className="w-full flex flex-col rounded-t-md overflow-hidden" style={{ height: `${Math.max(h, 2)}px` }}>
                    <div className="bg-purple-500" style={{ height: `${lensH}px` }} />
                    <div className="bg-blue-500" style={{ height: `${mcaH}px` }} />
                    <div className="bg-emerald-500" style={{ height: `${resH}px` }} />
                    <div className="bg-brand-500" style={{ height: `${saasH}px` }} />
                  </div>
                  <span className="text-xs text-gray-500">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}