import React, { useMemo, useState } from 'react';
import { useDeals, type Deal as StoreDeal } from '../crmStore';
import { NewDealFlow } from '../flows/NewDealFlow';
import {
  Plus,
  Search,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Edit,
  ChevronDown,
  Calendar,
  Filter,
  BarChart3,
} from 'lucide-react';
import { useAppNavigate } from '../NavigationContext';

type DealStatus = 'Current' | 'Delinquent' | 'Default' | 'Paid Off' | 'Workout';
type DealType = 'MCA' | 'Lease' | 'Residual';

interface Deal {
  id: string;
  status: DealStatus;
  delinquencyLabel?: string;
  type: DealType;
  borrower: string;
  loanAmount: number;
  repaymentAmount: number;
  collected: number;
  outstanding: number;
  rate: number;
  dailyPayment: number;
  fundedDate: string;
  dueDate: string;
  agent: string;
}

const deals: Deal[] = [
  {
    id: 'D-1001',
    status: 'Current',
    type: 'MCA',
    borrower: 'Metro Diner Group',
    loanAmount: 75000,
    repaymentAmount: 101250,
    collected: 54800,
    outstanding: 46450,
    rate: 1.35,
    dailyPayment: 675,
    fundedDate: '2026-01-15',
    dueDate: '2026-08-12',
    agent: 'Marcus J.',
  },
  {
    id: 'D-1002',
    status: 'Current',
    type: 'Residual',
    borrower: 'Bright Auto Sales',
    loanAmount: 120000,
    repaymentAmount: 163200,
    collected: 98400,
    outstanding: 64800,
    rate: 1.36,
    dailyPayment: 1088,
    fundedDate: '2025-11-03',
    dueDate: '2026-06-28',
    agent: 'Sarah K.',
  },
  {
    id: 'D-1003',
    status: 'Delinquent',
    delinquencyLabel: 'Early 5d',
    type: 'MCA',
    borrower: 'Sunset Logistics LLC',
    loanAmount: 50000,
    repaymentAmount: 67500,
    collected: 22100,
    outstanding: 45400,
    rate: 1.35,
    dailyPayment: 450,
    fundedDate: '2026-02-10',
    dueDate: '2026-09-15',
    agent: 'Marcus J.',
  },
  {
    id: 'D-1004',
    status: 'Delinquent',
    delinquencyLabel: 'Mid 22d',
    type: 'Lease',
    borrower: 'Peak Construction Co',
    loanAmount: 95000,
    repaymentAmount: 128250,
    collected: 41200,
    outstanding: 87050,
    rate: 1.35,
    dailyPayment: 855,
    fundedDate: '2025-12-20',
    dueDate: '2026-07-18',
    agent: 'Devon R.',
  },
  {
    id: 'D-1005',
    status: 'Default',
    type: 'MCA',
    borrower: 'Greenfield Markets',
    loanAmount: 60000,
    repaymentAmount: 81000,
    collected: 18900,
    outstanding: 62100,
    rate: 1.35,
    dailyPayment: 540,
    fundedDate: '2025-09-05',
    dueDate: '2026-04-02',
    agent: 'Sarah K.',
  },
  {
    id: 'D-1006',
    status: 'Paid Off',
    type: 'MCA',
    borrower: 'Apex Fitness Studio',
    loanAmount: 40000,
    repaymentAmount: 52000,
    collected: 52000,
    outstanding: 0,
    rate: 1.30,
    dailyPayment: 520,
    fundedDate: '2025-07-12',
    dueDate: '2025-12-08',
    agent: 'Devon R.',
  },
  {
    id: 'D-1007',
    status: 'Workout',
    type: 'Residual',
    borrower: 'Coastal Seafood Dist.',
    loanAmount: 85000,
    repaymentAmount: 114750,
    collected: 34200,
    outstanding: 80550,
    rate: 1.35,
    dailyPayment: 380,
    fundedDate: '2025-10-18',
    dueDate: '2026-10-10',
    agent: 'Marcus J.',
  },
  {
    id: 'D-1008',
    status: 'Delinquent',
    delinquencyLabel: 'Late 45d',
    type: 'Lease',
    borrower: 'Riverdale Dental Care',
    loanAmount: 110000,
    repaymentAmount: 148500,
    collected: 61200,
    outstanding: 87300,
    rate: 1.35,
    dailyPayment: 990,
    fundedDate: '2025-11-28',
    dueDate: '2026-08-25',
    agent: 'Sarah K.',
  },
];

function getStatusStyle(status: DealStatus) {
  switch (status) {
    case 'Current':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Delinquent':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Default':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'Paid Off':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'Workout':
      return 'bg-purple-50 text-purple-700 border-purple-200';
  }
}

function getTypeStyle(type: DealType) {
  switch (type) {
    case 'MCA':
      return 'bg-brand-50 text-brand-hover border-brand-200';
    case 'Lease':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Residual':
      return 'bg-teal-50 text-teal-700 border-teal-200';
  }
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function BackendDeals() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [newDealOpen, setNewDealOpen] = useState(false);
  const { navigate } = useAppNavigate();
  const storeDeals = useDeals();

  // Merge newly-created deals with the static sample portfolio.
  const allDeals: Deal[] = useMemo(
    () => [...(storeDeals as StoreDeal[]) as Deal[], ...deals],
    [storeDeals]
  );

  const filtered = allDeals.filter((d) => {
    if (statusFilter !== 'All' && d.status !== statusFilter) return false;
    if (typeFilter !== 'All' && d.type !== typeFilter) return false;
    if (searchQuery && !d.borrower.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalFunded = allDeals.reduce((s, d) => s + d.loanAmount, 0);
  const totalDeployed = allDeals.filter((d) => d.status !== 'Paid Off').reduce((s, d) => s + d.loanAmount, 0);
  const grossProfit = allDeals.reduce((s, d) => s + (d.collected - d.loanAmount * (d.collected / (d.repaymentAmount || 1))), 0);
  const outstandingBalance = allDeals.reduce((s, d) => s + d.outstanding, 0);
  const defaultRate = allDeals.length > 0 ? ((allDeals.filter((d) => d.status === 'Default').length / allDeals.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
          <p className="text-sm text-gray-500 mt-1">Capital deployment and deal management across all merchants.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-[8px] text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export Portfolio
          </button>
          <button
            onClick={() => setNewDealOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-[8px] text-sm hover:bg-brand-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard label="Total Funded" value={fmt(totalFunded)} icon={<DollarSign className="w-5 h-5" />} trend="+12.3% vs last quarter" trendPositive variant="emerald" />
        <SummaryCard label="Total Deployed" value={fmt(totalDeployed)} icon={<Wallet className="w-5 h-5" />} trend="+8.1% this month" trendPositive variant="blue" />
        <SummaryCard label="Gross Profit" value={fmt(grossProfit)} icon={<TrendingUp className="w-5 h-5" />} trend="+15.7% vs target" trendPositive variant="purple" />
        <SummaryCard label="Outstanding Balance" value={fmt(outstandingBalance)} icon={<BarChart3 className="w-5 h-5" />} variant="orange" />
        <SummaryCard label="Default Rate" value={`${defaultRate}%`} icon={<AlertTriangle className="w-5 h-5" />} trend="-0.4% vs last month" trendPositive variant="red" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-[8px] p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search borrowers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={['All', 'Current', 'Delinquent', 'Default', 'Paid Off', 'Workout']}
            />
            <FilterSelect
              label="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={['All', 'MCA', 'Lease', 'Residual']}
            />
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-[8px] text-sm text-gray-600 bg-white cursor-pointer hover:bg-gray-50">
              <Calendar className="w-4 h-4" />
              <span>Date Range</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Status', 'Type', 'Borrower', 'Loan Amount', 'Repayment', 'Collected', 'Outstanding', 'Rate', 'Daily Pmt', 'Funded', 'Due Date', 'Agent', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/deals/${deal.id}`)}>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-[8px] whitespace-nowrap ${getStatusStyle(deal.status)}`}>
                      {deal.status}
                      {deal.delinquencyLabel && (
                        <span className="ml-0.5 opacity-80">· {deal.delinquencyLabel}</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs border rounded-[8px] ${getTypeStyle(deal.type)}`}>
                      {deal.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{deal.borrower}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(deal.loanAmount)}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(deal.repaymentAmount)}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(deal.collected)}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{fmt(deal.outstanding)}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{deal.rate.toFixed(2)}x</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(deal.dailyPayment)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{deal.fundedDate}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{deal.dueDate}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{deal.agent}</td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 rounded-[8px] hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          <span>Showing {filtered.length} of {allDeals.length} deals</span>
          <span className="text-gray-400">Page 1 of 1</span>
        </div>
      </div>

      <NewDealFlow
        open={newDealOpen}
        onClose={() => setNewDealOpen(false)}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  trend,
  trendPositive,
  variant,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  variant: 'emerald' | 'blue' | 'purple' | 'orange' | 'red';
}) {
  const bg = {
    emerald: 'bg-emerald-50 border-emerald-100',
    blue: 'bg-blue-50 border-blue-100',
    purple: 'bg-purple-50 border-purple-100',
    orange: 'bg-orange-50 border-orange-100',
    red: 'bg-red-50 border-red-100',
  }[variant];

  const iconColor = {
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
  }[variant];

  return (
    <div className={`${bg} border rounded-[8px] p-4 sm:p-5`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{label}</p>
        <div className={iconColor}>{icon}</div>
      </div>
      <p className={`text-xl sm:text-2xl font-bold text-gray-900`}>{value}</p>
      {trend && (
        <p className={`text-xs mt-2 ${trendPositive ? 'text-emerald-600' : 'text-red-600'}`}>{trend}</p>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-[8px] text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {label}: {o}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}