import React, { useState, useMemo } from 'react';
import { useAppNavigate } from '../NavigationContext';
import { useMerchants, type Merchant as StoreMerchant } from '../crmStore';
import { NewMerchantFlow } from '../flows/NewMerchantFlow';
import {
  Plus, Search, Building2, Store, DollarSign, CreditCard, Heart,
  Banknote, Globe, Brain, ChevronDown,
} from 'lucide-react';
import { Button } from '../ui';

// ── Types ──
type MerchantStatus = 'Active' | 'Inactive' | 'Pending';
type PlanTier = 'Free' | 'Growth' | 'Custom';

interface Products {
  processing: boolean;
  capital: boolean;
  website: boolean;
  lens: boolean;
}

interface Merchant {
  id: string;
  name: string;
  industry: string;
  status: MerchantStatus;
  monthlyVolume: number;
  mcaBalance: number;
  capitalDeployed: number;
  healthScore: number;
  agent: string;
  products: Products;
  plan: PlanTier;
  monthlyFee: number;
}

// ── Mock Data ──
const merchants: Merchant[] = [
  { id: 'merchant-001', name: 'Sunrise Cafe & Bakery', industry: 'Food & Beverage', status: 'Active', monthlyVolume: 37500, mcaBalance: 187500, capitalDeployed: 250000, healthScore: 78, agent: 'Sarah Johnson', products: { processing: true, capital: true, website: false, lens: false }, plan: 'Growth', monthlyFee: 99 },
  { id: 'merchant-002', name: 'TechStart Solutions', industry: 'Technology', status: 'Active', monthlyVolume: 125000, mcaBalance: 0, capitalDeployed: 0, healthScore: 92, agent: 'Michael Chen', products: { processing: true, capital: false, website: true, lens: true }, plan: 'Custom', monthlyFee: 199 },
  { id: 'merchant-003', name: 'Urban Fitness Center', industry: 'Health & Wellness', status: 'Active', monthlyVolume: 52300, mcaBalance: 225000, capitalDeployed: 300000, healthScore: 65, agent: 'Sarah Johnson', products: { processing: true, capital: true, website: true, lens: false }, plan: 'Growth', monthlyFee: 99 },
  { id: 'merchant-004', name: 'Coastal Auto Repair', industry: 'Automotive', status: 'Pending', monthlyVolume: 18400, mcaBalance: 75000, capitalDeployed: 75000, healthScore: 58, agent: 'James Miller', products: { processing: true, capital: true, website: false, lens: false }, plan: 'Free', monthlyFee: 0 },
  { id: 'merchant-005', name: 'Bella Vista Restaurant', industry: 'Food & Beverage', status: 'Active', monthlyVolume: 68900, mcaBalance: 150000, capitalDeployed: 350000, healthScore: 85, agent: 'Michael Chen', products: { processing: true, capital: true, website: true, lens: true }, plan: 'Custom', monthlyFee: 199 },
  { id: 'merchant-006', name: 'Green Leaf Landscaping', industry: 'Home Services', status: 'Active', monthlyVolume: 42100, mcaBalance: 0, capitalDeployed: 0, healthScore: 71, agent: 'Sarah Johnson', products: { processing: true, capital: false, website: false, lens: false }, plan: 'Free', monthlyFee: 0 },
  { id: 'merchant-007', name: 'Metro Diner Group', industry: 'Food & Beverage', status: 'Active', monthlyVolume: 89200, mcaBalance: 320000, capitalDeployed: 500000, healthScore: 88, agent: 'James Miller', products: { processing: true, capital: true, website: true, lens: true }, plan: 'Custom', monthlyFee: 199 },
  { id: 'merchant-008', name: 'Peak Construction Co', industry: 'Construction', status: 'Inactive', monthlyVolume: 0, mcaBalance: 87050, capitalDeployed: 150000, healthScore: 32, agent: 'Sarah Johnson', products: { processing: false, capital: true, website: false, lens: false }, plan: 'Growth', monthlyFee: 99 },
  { id: 'merchant-009', name: 'Luxe Nail Studio', industry: 'Beauty & Salon', status: 'Active', monthlyVolume: 31200, mcaBalance: 0, capitalDeployed: 0, healthScore: 80, agent: 'Michael Chen', products: { processing: true, capital: false, website: true, lens: false }, plan: 'Growth', monthlyFee: 99 },
  { id: 'merchant-010', name: 'Harbor Marine Supply', industry: 'Retail', status: 'Active', monthlyVolume: 76500, mcaBalance: 210000, capitalDeployed: 280000, healthScore: 74, agent: 'James Miller', products: { processing: true, capital: true, website: false, lens: true }, plan: 'Custom', monthlyFee: 199 },
];

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const agents = [...new Set(merchants.map(m => m.agent))];
const industries = [...new Set(merchants.map(m => m.industry))];

// ── Product Icon ──
function ProductIcon({ active, children, color, label, onClick }: { active: boolean; children: React.ReactNode; color: string; label: string; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center w-6 h-6 rounded-[8px] transition-colors group/icon ${active ? `${color} cursor-pointer` : 'bg-gray-100 text-gray-300'}`}
      onClick={active ? onClick : undefined}
      title={label}
    >
      {children}
      <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none z-10">
        {label}
      </span>
    </span>
  );
}

// ── Plan Tier Letter ──
function PlanLetter({ plan }: { plan: PlanTier }) {
  const cfg = {
    Free: { letter: 'F', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
    Growth: { letter: 'G', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
    Custom: { letter: 'C', cls: 'bg-purple-50 text-purple-600 border-purple-200' },
  }[plan];
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-[8px] border text-[10px] font-bold ${cfg.cls}`}>
      {cfg.letter}
    </span>
  );
}

// ── Pill Toggle ──
function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
        active
          ? 'bg-brand text-white border-brand'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

// ══════════════════════════════════════
// Main Component
// ══════════════════════════════════════
export function BackendMerchants() {
  const { navigate } = useAppNavigate();
  const storeMerchants = useMerchants();
  const [newMerchantOpen, setNewMerchantOpen] = useState(false);

  // Combine newly-created merchants (from the CRM store) with the static sample roster.
  // Store merchants are displayed first so newly-created ones are visible immediately.
  const allMerchants: Merchant[] = useMemo(
    () => [...(storeMerchants as StoreMerchant[]) as Merchant[], ...merchants],
    [storeMerchants]
  );

  const [search, setSearch] = useState('');
  const [productFilters, setProductFilters] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<MerchantStatus | 'All'>('All');
  const [planFilter, setPlanFilter] = useState<PlanTier | 'All'>('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [agentFilter, setAgentFilter] = useState('All');

  const toggleProduct = (p: string) => {
    setProductFilters(prev => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return allMerchants.filter(m => {
      if (search) {
        const q = search.toLowerCase();
        if (!m.name.toLowerCase().includes(q) && !m.industry.toLowerCase().includes(q) && !m.agent.toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;
      if (planFilter !== 'All' && m.plan !== planFilter) return false;
      if (industryFilter !== 'All' && m.industry !== industryFilter) return false;
      if (agentFilter !== 'All' && m.agent !== agentFilter) return false;
      if (productFilters.has('Processing') && !m.products.processing) return false;
      if (productFilters.has('Capital') && !m.products.capital) return false;
      if (productFilters.has('Website') && !m.products.website) return false;
      if (productFilters.has('Lens AI') && !m.products.lens) return false;
      return true;
    });
  }, [allMerchants, search, statusFilter, planFilter, industryFilter, agentFilter, productFilters]);

  // ── Aggregates ──
  const total = allMerchants.length;
  const totalVolume = allMerchants.reduce((s, m) => s + m.monthlyVolume, 0);
  const totalSubRevenue = allMerchants.reduce((s, m) => s + m.monthlyFee, 0);
  const totalCapitalDeployed = allMerchants.reduce((s, m) => s + m.capitalDeployed, 0);
  const totalOutstanding = allMerchants.reduce((s, m) => s + m.mcaBalance, 0);
  const avgHealth = total > 0 ? Math.round(allMerchants.reduce((s, m) => s + m.healthScore, 0) / total) : 0;

  // Plan distribution
  const planCounts = { Free: 0, Growth: 0, Custom: 0 };
  allMerchants.forEach(m => planCounts[m.plan]++);

  const statusColor = (s: MerchantStatus) =>
    s === 'Active' ? 'bg-emerald-50 text-emerald-700' :
    s === 'Pending' ? 'bg-amber-50 text-amber-700' :
    'bg-gray-100 text-gray-500';

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-emerald-600 bg-emerald-50' :
    s >= 60 ? 'text-amber-600 bg-amber-50' :
    'text-red-600 bg-red-50';

  const planBadgeCls = (p: PlanTier) =>
    p === 'Free' ? 'bg-gray-100 text-gray-600' :
    p === 'Growth' ? 'bg-blue-50 text-blue-700' :
    'bg-purple-50 text-purple-700';

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Merchants</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} merchants across all products and plans</p>
        </div>
        <Button icon={<Plus />} onClick={() => setNewMerchantOpen(true)}>
          Add Merchant
        </Button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card label="Total Merchants" value={total.toString()} icon={<Store className="w-4 h-4 text-brand" />} />
          <Card label="Subscription Revenue" value={fmt(totalSubRevenue)} sub="/month" icon={<CreditCard className="w-4 h-4 text-blue-600" />} />
          <Card label="Capital Deployed" value={fmt(totalCapitalDeployed)} icon={<Banknote className="w-4 h-4 text-violet-600" />} />
          <Card label="Outstanding Balance" value={fmt(totalOutstanding)} icon={<DollarSign className="w-4 h-4 text-amber-600" />} />
          <Card label="Avg Health Score" value={avgHealth.toString()} icon={<Heart className="w-4 h-4 text-rose-500" />} />
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="px-6 pb-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search merchants..."
              className="w-full pl-8 pr-3 py-[7px] bg-white border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>

          {/* Divider */}
          <span className="w-px h-6 bg-gray-200" />

          {/* Product pills */}
          {['Processing', 'Capital', 'Website', 'Lens AI'].map(p => (
            <Pill key={p} label={p} active={productFilters.has(p)} onClick={() => toggleProduct(p)} />
          ))}

          {/* Divider */}
          <span className="w-px h-6 bg-gray-200" />

          {/* Dropdowns */}
          <Dropdown value={statusFilter} onChange={v => setStatusFilter(v as any)} options={['All', 'Active', 'Pending', 'Inactive']} label="Status" />
          <Dropdown value={planFilter} onChange={v => setPlanFilter(v as any)} options={['All', 'Free', 'Growth', 'Custom']} label="Plan" />
          <Dropdown value={industryFilter} onChange={v => setIndustryFilter(v)} options={['All', ...industries]} label="Industry" />
          <Dropdown value={agentFilter} onChange={v => setAgentFilter(v)} options={['All', ...agents]} label="Agent" />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 bg-white border-t border-gray-200 overflow-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <Th className="pl-6 w-[260px]">Merchant</Th>
              <Th className="w-[160px]">Products</Th>
              <Th className="w-[90px]">Status</Th>
              <Th className="w-[80px]">Plan</Th>
              <Th className="w-[65px] text-center">Score</Th>
              <Th className="pr-6 w-[130px]">Agent</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(m => (
              <tr
                key={m.id}
                onClick={() => navigate(`/merchants/${m.id}`)}
                className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
              >
                {/* Merchant */}
                <td className="pl-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-brand/5 flex items-center justify-center shrink-0 group-hover:bg-brand/10 transition-colors">
                      <Building2 className="w-4 h-4 text-brand" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                      <p className="text-xs text-gray-400 truncate">{m.industry}</p>
                    </div>
                  </div>
                </td>

                {/* Products */}
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    <ProductIcon active={m.products.processing} color="bg-brand-100 text-brand" label="Payments" onClick={(e) => { e.stopPropagation(); navigate(`/merchants/${m.id}/payments`); }}>
                      <CreditCard className="w-3 h-3" />
                    </ProductIcon>
                    <ProductIcon active={m.products.capital} color="bg-emerald-100 text-emerald-600" label="Capital" onClick={(e) => { e.stopPropagation(); navigate(`/merchants/${m.id}/capital`); }}>
                      <Banknote className="w-3 h-3" />
                    </ProductIcon>
                    <ProductIcon active={m.products.website} color="bg-sky-100 text-sky-600" label="Website" onClick={(e) => { e.stopPropagation(); navigate(`/merchants/${m.id}/website`); }}>
                      <Globe className="w-3 h-3" />
                    </ProductIcon>
                    <ProductIcon active={m.products.lens} color="bg-purple-100 text-purple-600" label="Lens AI" onClick={(e) => { e.stopPropagation(); navigate(`/merchants/${m.id}/lens`); }}>
                      <Brain className="w-3 h-3" />
                    </ProductIcon>
                  </div>
                </td>

                {/* Status */}
                <td className="py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(m.status)}`}>
                    {m.status}
                  </span>
                </td>

                {/* Plan */}
                <td className="py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-[8px] text-xs font-medium ${planBadgeCls(m.plan)}`}>
                    {m.plan}
                  </span>
                </td>

                {/* Score */}
                <td className="py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-[8px] text-xs font-bold tabular-nums ${scoreColor(m.healthScore)}`}>
                    {m.healthScore}
                  </span>
                </td>

                {/* Agent */}
                <td className="pr-6 py-3">
                  <span className="text-sm text-gray-600 truncate block">{m.agent}</span>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                  No merchants match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-700">{filtered.length}</span> of <span className="font-medium text-gray-700">{total}</span> merchants
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled>Previous</Button>
          <Button variant="secondary" size="sm" disabled>Next</Button>
        </div>
      </div>

      {/* ── Plan Distribution ── */}
      <div className="bg-white border-t border-gray-200 px-6 py-5 shrink-0">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Plan Distribution</h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {([
            { plan: 'Free' as PlanTier, color: 'bg-gray-400', label: 'Free', sub: '$0/mo' },
            { plan: 'Growth' as PlanTier, color: 'bg-blue-500', label: 'Growth', sub: '$99/mo' },
            { plan: 'Custom' as PlanTier, color: 'bg-purple-500', label: 'Custom', sub: '$199/mo' },
          ]).map(({ plan, color, label, sub }) => (
            <div key={plan} className="bg-gray-50 rounded-[8px] p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-[10px] text-gray-400 ml-auto">{sub}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {planCounts[plan]}
                <span className="text-sm font-normal text-gray-400 ml-1">({Math.round((planCounts[plan] / total) * 100)}%)</span>
              </p>
            </div>
          ))}
        </div>
        <div className="h-2.5 rounded-full overflow-hidden flex bg-gray-100">
          <div className="bg-gray-400 transition-all" style={{ width: `${total ? (planCounts.Free / total) * 100 : 0}%` }} />
          <div className="bg-blue-500 transition-all" style={{ width: `${total ? (planCounts.Growth / total) * 100 : 0}%` }} />
          <div className="bg-purple-500 transition-all" style={{ width: `${total ? (planCounts.Custom / total) * 100 : 0}%` }} />
        </div>
      </div>

      {/* New merchant flow */}
      <NewMerchantFlow
        open={newMerchantOpen}
        onClose={() => setNewMerchantOpen(false)}
      />
    </div>
  );
}

// ══════════════════════════════════════
// Shared sub-components
// ══════════════════════════════════════

function Card({ label, value, icon, sub }: { label: string; value: string; icon: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-white rounded-[8px] border border-gray-200 p-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-gray-500 font-medium leading-tight">{label}</span>
        {icon}
      </div>
      <p className="text-lg font-bold text-gray-900 leading-none">
        {value}
        {sub && <span className="text-xs font-normal text-gray-400 ml-0.5">{sub}</span>}
      </p>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`py-2.5 px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide text-left ${className}`}>
      {children}
    </th>
  );
}

function Dropdown({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-2.5 py-[7px] bg-white border border-gray-200 rounded-[8px] text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand appearance-none pr-7"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
    >
      {options.map(o => (
        <option key={o} value={o}>{o === 'All' ? `All ${label}` : o}</option>
      ))}
    </select>
  );
}