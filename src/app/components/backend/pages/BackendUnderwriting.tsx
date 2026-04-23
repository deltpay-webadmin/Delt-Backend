import React, { useState, useMemo } from 'react';
import {
  Search, FileText, Clock, TrendingUp, DollarSign, AlertTriangle, Eye,
  LayoutGrid, List, ChevronRight, User, Store, Filter, Plus,
  Banknote, Shield, Calendar, CreditCard, Building2, ArrowRight,
  CheckCircle, XCircle, AlertCircle, MoreHorizontal, Phone,
  FileCheck, Brain, GripVertical, ChevronDown,
} from 'lucide-react';
import { useAppNavigate } from '../NavigationContext';

// ── Types ──
type UWStage = 'Received' | 'Doc Collection' | 'Bank Review' | 'Credit Analysis' | 'Committee' | 'Approved' | 'Declined';
type ProductType = 'MCA' | 'Term Loan' | 'Line of Credit' | 'Revenue Based';

interface Application {
  id: string;
  applicationId: string;
  businessName: string;
  dba?: string;
  industry: string;
  state: string;
  productType: ProductType;
  requestedAmount: number;
  monthlyRevenue: number;
  avgDailyBalance: number;
  monthsInBusiness: number;
  creditScore: number;
  existingPositions: number;
  submissionDate: string;
  reviewer: string;
  reviewerInitials: string;
  riskScore: number;
  stage: UWStage;
  daysInStage: number;
  slaThreshold: number;
  factorRate?: number;
  proposedPayback?: number;
  dailyPayment?: number;
  holdbackPct?: number;
  disclosureState?: string;
  missingDocs?: string[];
  notes?: string;
  source: string;
}

const STAGES: UWStage[] = ['Received', 'Doc Collection', 'Bank Review', 'Credit Analysis', 'Committee', 'Approved', 'Declined'];

const STAGE_CONFIG: Record<UWStage, { color: string; bg: string; border: string; dot: string }> = {
  'Received': { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
  'Doc Collection': { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500' },
  'Bank Review': { color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  'Credit Analysis': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  'Committee': { color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  'Approved': { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Declined': { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
};

const APPLICATIONS: Application[] = [
  {
    id: 'app-001', applicationId: 'UW-2026-0147', businessName: 'TechForward Solutions', dba: 'TechForward', industry: 'IT Services', state: 'NY',
    productType: 'MCA', requestedAmount: 200000, monthlyRevenue: 85000, avgDailyBalance: 14200, monthsInBusiness: 48, creditScore: 712,
    existingPositions: 0, submissionDate: 'Apr 17, 2026', reviewer: 'Sarah Mitchell', reviewerInitials: 'SM', riskScore: 88,
    stage: 'Received', daysInStage: 0, slaThreshold: 2, source: 'Direct — Website',
    missingDocs: ['Last 3 months bank statements', 'Voided check'],
  },
  {
    id: 'app-002', applicationId: 'UW-2026-0148', businessName: 'Miami Spice Kitchen', dba: 'Miami Spice', industry: 'Restaurant', state: 'FL',
    productType: 'MCA', requestedAmount: 75000, monthlyRevenue: 42000, avgDailyBalance: 6800, monthsInBusiness: 36, creditScore: 645,
    existingPositions: 1, submissionDate: 'Apr 17, 2026', reviewer: 'David Kim', reviewerInitials: 'DK', riskScore: 71,
    stage: 'Received', daysInStage: 0, slaThreshold: 2, source: 'Agent — Marcus Johnson',
  },
  {
    id: 'app-003', applicationId: 'UW-2026-0143', businessName: 'Sunrise Cafe & Bakery', industry: 'Restaurant / Bakery', state: 'NY',
    productType: 'MCA', requestedAmount: 125000, monthlyRevenue: 37500, avgDailyBalance: 5100, monthsInBusiness: 24, creditScore: 668,
    existingPositions: 0, submissionDate: 'Apr 15, 2026', reviewer: 'David Kim', reviewerInitials: 'DK', riskScore: 78,
    stage: 'Doc Collection', daysInStage: 2, slaThreshold: 3, source: 'ISO — Apex Funding',
    missingDocs: ['Tax returns (2024)', 'Landlord letter'],
  },
  {
    id: 'app-004', applicationId: 'UW-2026-0141', businessName: 'Coastal Construction LLC', industry: 'Construction', state: 'VA',
    productType: 'Term Loan', requestedAmount: 180000, monthlyRevenue: 95000, avgDailyBalance: 18200, monthsInBusiness: 72, creditScore: 701,
    existingPositions: 1, submissionDate: 'Apr 14, 2026', reviewer: 'Michael Torres', reviewerInitials: 'MT', riskScore: 68,
    stage: 'Bank Review', daysInStage: 3, slaThreshold: 3, disclosureState: 'VA HB 1027',
    notes: 'Large deposits irregular — need to verify contract payments',
  },
  {
    id: 'app-005', applicationId: 'UW-2026-0145', businessName: 'Urban Wellness Spa', industry: 'Health & Wellness', state: 'FL',
    productType: 'MCA', requestedAmount: 150000, monthlyRevenue: 62000, avgDailyBalance: 9400, monthsInBusiness: 42, creditScore: 724,
    existingPositions: 0, submissionDate: 'Apr 13, 2026', reviewer: 'Michael Torres', reviewerInitials: 'MT', riskScore: 91,
    stage: 'Credit Analysis', daysInStage: 4, slaThreshold: 5,
    factorRate: 1.35, proposedPayback: 202500, dailyPayment: 675, holdbackPct: 15,
  },
  {
    id: 'app-006', applicationId: 'UW-2026-0138', businessName: 'Green Valley Auto Repair', industry: 'Automotive', state: 'CA',
    productType: 'Revenue Based', requestedAmount: 75000, monthlyRevenue: 45000, avgDailyBalance: 7200, monthsInBusiness: 60, creditScore: 690,
    existingPositions: 2, submissionDate: 'Apr 12, 2026', reviewer: 'Sarah Mitchell', reviewerInitials: 'SM', riskScore: 62,
    stage: 'Credit Analysis', daysInStage: 5, slaThreshold: 5, disclosureState: 'CA SB 1235',
    factorRate: 1.42, proposedPayback: 106500, dailyPayment: 425, holdbackPct: 18,
    notes: '2 existing positions — stacking risk. Verify payoff on 1st position.',
  },
  {
    id: 'app-007', applicationId: 'UW-2026-0139', businessName: 'Brooklyn Vinyl Records', industry: 'Retail', state: 'NY',
    productType: 'MCA', requestedAmount: 50000, monthlyRevenue: 28000, avgDailyBalance: 4100, monthsInBusiness: 18, creditScore: 632,
    existingPositions: 0, submissionDate: 'Apr 11, 2026', reviewer: 'David Kim', reviewerInitials: 'DK', riskScore: 74,
    stage: 'Committee', daysInStage: 2, slaThreshold: 2,
    factorRate: 1.38, proposedPayback: 69000, dailyPayment: 276, holdbackPct: 15,
    notes: 'Low TIB (18mo). Revenue trend positive. Recommend approval with conservative terms.',
  },
  {
    id: 'app-008', applicationId: 'UW-2026-0136', businessName: 'Havana Bites Cafe', industry: 'Restaurant', state: 'FL',
    productType: 'MCA', requestedAmount: 45000, monthlyRevenue: 34000, avgDailyBalance: 5800, monthsInBusiness: 30, creditScore: 658,
    existingPositions: 0, submissionDate: 'Apr 10, 2026', reviewer: 'Michael Torres', reviewerInitials: 'MT', riskScore: 85,
    stage: 'Approved', daysInStage: 1, slaThreshold: 7,
    factorRate: 1.32, proposedPayback: 59400, dailyPayment: 198, holdbackPct: 12,
  },
  {
    id: 'app-009', applicationId: 'UW-2026-0135', businessName: 'SoBe Cycle & Fitness', industry: 'Fitness', state: 'FL',
    productType: 'MCA', requestedAmount: 100000, monthlyRevenue: 56000, avgDailyBalance: 8900, monthsInBusiness: 54, creditScore: 738,
    existingPositions: 0, submissionDate: 'Apr 9, 2026', reviewer: 'Sarah Mitchell', reviewerInitials: 'SM', riskScore: 93,
    stage: 'Approved', daysInStage: 2, slaThreshold: 7,
    factorRate: 1.28, proposedPayback: 128000, dailyPayment: 427, holdbackPct: 12,
  },
  {
    id: 'app-010', applicationId: 'UW-2026-0129', businessName: 'Metro Pet Care', industry: 'Pet Services', state: 'NJ',
    productType: 'MCA', requestedAmount: 60000, monthlyRevenue: 38000, avgDailyBalance: 2100, monthsInBusiness: 12, creditScore: 548,
    existingPositions: 3, submissionDate: 'Apr 5, 2026', reviewer: 'David Kim', reviewerInitials: 'DK', riskScore: 32,
    stage: 'Declined', daysInStage: 5, slaThreshold: 5,
    notes: 'Low credit, 3 existing positions, low ADB relative to request. High stacking risk.',
  },
  {
    id: 'app-011', applicationId: 'UW-2026-0127', businessName: 'Doral Fresh Market', industry: 'Grocery', state: 'FL',
    productType: 'MCA', requestedAmount: 40000, monthlyRevenue: 31000, avgDailyBalance: 2800, monthsInBusiness: 14, creditScore: 582,
    existingPositions: 2, submissionDate: 'Apr 3, 2026', reviewer: 'Michael Torres', reviewerInitials: 'MT', riskScore: 38,
    stage: 'Declined', daysInStage: 8, slaThreshold: 5,
    notes: 'Negative cash flow trend. Multiple NSFs on bank statements. Adverse action sent.',
  },
];

const fmt = (n: number) => `$${n.toLocaleString()}`;

function getRiskColor(score: number) {
  if (score >= 80) return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (score >= 60) return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
  return { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
}

// ── Kanban Card ──
function KanbanCard({ app, onView }: { app: Application; onView: () => void }) {
  const risk = getRiskColor(app.riskScore);
  const overSLA = app.daysInStage >= app.slaThreshold;
  return (
    <div onClick={onView} className="bg-white rounded-[8px] border border-gray-200 p-3 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-mono text-brand">{app.applicationId}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${risk.bg} ${risk.text} ${risk.border}`}>{app.riskScore}</span>
      </div>
      <h4 className="text-xs font-semibold text-gray-900 mb-0.5">{app.businessName}</h4>
      <p className="text-[10px] text-gray-500 mb-2">{app.industry} &middot; {app.state}</p>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-900">{fmt(app.requestedAmount)}</span>
        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${app.productType === 'MCA' ? 'bg-indigo-50 text-indigo-600' : app.productType === 'Term Loan' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{app.productType}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
        <div className="text-[10px]"><span className="text-gray-400">Rev: </span><span className="text-gray-600 font-medium">{fmt(app.monthlyRevenue)}/mo</span></div>
        <div className="text-[10px]"><span className="text-gray-400">ADB: </span><span className="text-gray-600 font-medium">{fmt(app.avgDailyBalance)}</span></div>
        <div className="text-[10px]"><span className="text-gray-400">FICO: </span><span className="text-gray-600 font-medium">{app.creditScore}</span></div>
        <div className="text-[10px]"><span className="text-gray-400">TIB: </span><span className="text-gray-600 font-medium">{app.monthsInBusiness}mo</span></div>
      </div>

      {app.existingPositions > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] font-medium text-amber-700">{app.existingPositions} existing position{app.existingPositions > 1 ? 's' : ''}</span>
        </div>
      )}

      {app.factorRate && (
        <div className="bg-gray-50 rounded-[4px] px-2 py-1.5 mb-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Factor</span><span className="font-semibold text-gray-700">{app.factorRate}x</span>
          </div>
          {app.dailyPayment && (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-400">Daily</span><span className="font-semibold text-gray-700">${app.dailyPayment}</span>
            </div>
          )}
        </div>
      )}

      {app.missingDocs && app.missingDocs.length > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <FileText className="w-3 h-3 text-red-400" />
          <span className="text-[10px] text-red-600">{app.missingDocs.length} doc{app.missingDocs.length > 1 ? 's' : ''} needed</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-[8px] font-semibold text-indigo-700">{app.reviewerInitials}</span>
          </div>
          <span className="text-[10px] text-gray-400">{app.reviewer.split(' ')[0]}</span>
        </div>
        <div className={`flex items-center gap-1 text-[10px] ${overSLA ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
          <Clock className="w-3 h-3" />
          {app.daysInStage}d{overSLA && ' ⚠'}
        </div>
      </div>
    </div>
  );
}

// ── Main ──
export function BackendUnderwriting() {
  const { navigate } = useAppNavigate();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [activeTab, setActiveTab] = useState<'All' | UWStage>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewerFilter, setReviewerFilter] = useState('All');

  const filtered = useMemo(() => {
    return APPLICATIONS.filter(app => {
      if (activeTab !== 'All' && app.stage !== activeTab) return false;
      if (reviewerFilter !== 'All' && app.reviewer !== reviewerFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return app.applicationId.toLowerCase().includes(q) || app.businessName.toLowerCase().includes(q) || app.industry.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeTab, searchQuery, reviewerFilter]);

  const inQueueCount = APPLICATIONS.filter(a => !['Approved', 'Declined'].includes(a.stage)).length;
  const approvedCount = APPLICATIONS.filter(a => a.stage === 'Approved').length;
  const declinedCount = APPLICATIONS.filter(a => a.stage === 'Declined').length;
  const totalDecided = approvedCount + declinedCount;
  const approvalRate = totalDecided > 0 ? ((approvedCount / totalDecided) * 100).toFixed(1) : '0.0';
  const pipelineValue = APPLICATIONS.filter(a => !['Declined'].includes(a.stage)).reduce((s, a) => s + a.requestedAmount, 0);
  const overSLACount = APPLICATIONS.filter(a => a.daysInStage >= a.slaThreshold && !['Approved', 'Declined'].includes(a.stage)).length;
  const avgDaysToDecision = totalDecided > 0 ? (APPLICATIONS.filter(a => ['Approved', 'Declined'].includes(a.stage)).reduce((s, a) => s + a.daysInStage, 0) / totalDecided).toFixed(1) : '—';

  const tabs: Array<'All' | UWStage> = ['All', ...STAGES];

  const kanbanStages = STAGES.filter(s => s !== 'Declined');

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-brand to-brand-light flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Underwriting Queue</h1>
            <p className="text-sm text-gray-500">{inQueueCount} applications in pipeline &middot; {overSLACount > 0 ? <span className="text-red-600 font-medium">{overSLACount} over SLA</span> : 'All within SLA'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-[6px] p-0.5">
            <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-[4px] transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-[4px] transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-[6px] hover:bg-brand-hover">
            <Plus className="w-3.5 h-3.5" /> New Application
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'In Pipeline', value: inQueueCount, sub: `${APPLICATIONS.length} total`, color: 'border-t-brand', icon: FileText },
          { label: 'Avg Decision Time', value: `${avgDaysToDecision}d`, sub: 'SLA: 5 business days', color: 'border-t-blue-500', icon: Clock },
          { label: 'Approval Rate', value: `${approvalRate}%`, sub: `${approvedCount} of ${totalDecided} decided`, color: 'border-t-emerald-500', icon: CheckCircle },
          { label: 'Pipeline Value', value: `$${(pipelineValue / 1000).toFixed(0)}K`, sub: `${APPLICATIONS.filter(a => a.stage !== 'Declined').length} active deals`, color: 'border-t-amber-500', icon: DollarSign },
          { label: 'Over SLA', value: overSLACount, sub: overSLACount > 0 ? 'Needs attention' : 'All on track', color: overSLACount > 0 ? 'border-t-red-500' : 'border-t-gray-300', icon: AlertTriangle },
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

      {/* Filters */}
      <div className="bg-white rounded-[8px] border border-gray-200 p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search applications..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
        </div>
        {viewMode === 'table' && (
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map(tab => {
              const count = tab === 'All' ? APPLICATIONS.length : APPLICATIONS.filter(a => a.stage === tab).length;
              const isActive = activeTab === tab;
              const cfg = tab !== 'All' ? STAGE_CONFIG[tab] : null;
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1.5 rounded-[6px] text-[10px] font-semibold border whitespace-nowrap transition-colors ${
                    isActive ? (cfg ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-brand/5 text-brand border-brand/20') : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}>{tab} <span className="ml-0.5 opacity-70">{count}</span></button>
              );
            })}
          </div>
        )}
        <select value={reviewerFilter} onChange={e => setReviewerFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-[6px] text-[10px] font-semibold text-gray-500 focus:outline-none">
          <option value="All">All Reviewers</option>
          <option>David Kim</option>
          <option>Sarah Mitchell</option>
          <option>Michael Torres</option>
        </select>
      </div>

      {/* ── KANBAN VIEW ── */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {kanbanStages.map(stage => {
            const cfg = STAGE_CONFIG[stage];
            const stageApps = APPLICATIONS.filter(a => a.stage === stage && (
              !searchQuery || a.applicationId.toLowerCase().includes(searchQuery.toLowerCase()) || a.businessName.toLowerCase().includes(searchQuery.toLowerCase())
            ) && (reviewerFilter === 'All' || a.reviewer === reviewerFilter));
            const stageValue = stageApps.reduce((s, a) => s + a.requestedAmount, 0);

            return (
              <div key={stage} className="min-w-[260px] w-[260px] flex-shrink-0">
                {/* Column header */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-t-[8px] ${cfg.bg} border ${cfg.border} border-b-0`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-[11px] font-semibold ${cfg.color}`}>{stage}</span>
                    <span className={`text-[10px] font-bold ${cfg.color} bg-white/60 px-1.5 py-0.5 rounded`}>{stageApps.length}</span>
                  </div>
                  {stageValue > 0 && <span className="text-[9px] font-medium text-gray-500">{fmt(stageValue)}</span>}
                </div>

                {/* Column body */}
                <div className="bg-gray-50/70 border border-gray-200 border-t-0 rounded-b-[8px] p-2 space-y-2 min-h-[200px]">
                  {stageApps.map(app => (
                    <KanbanCard key={app.id} app={app} onView={() => navigate(`/underwriting/${app.id}`)} />
                  ))}
                  {stageApps.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-[10px] text-gray-400">No applications</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Declined column - separate styling */}
          {(() => {
            const stage: UWStage = 'Declined';
            const cfg = STAGE_CONFIG[stage];
            const stageApps = APPLICATIONS.filter(a => a.stage === stage && (
              !searchQuery || a.applicationId.toLowerCase().includes(searchQuery.toLowerCase()) || a.businessName.toLowerCase().includes(searchQuery.toLowerCase())
            ) && (reviewerFilter === 'All' || a.reviewer === reviewerFilter));
            return (
              <div className="min-w-[260px] w-[260px] flex-shrink-0 opacity-75">
                <div className={`flex items-center justify-between px-3 py-2 rounded-t-[8px] ${cfg.bg} border ${cfg.border} border-b-0`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className={`text-[11px] font-semibold ${cfg.color}`}>{stage}</span>
                    <span className={`text-[10px] font-bold ${cfg.color} bg-white/60 px-1.5 py-0.5 rounded`}>{stageApps.length}</span>
                  </div>
                </div>
                <div className="bg-gray-50/70 border border-gray-200 border-t-0 rounded-b-[8px] p-2 space-y-2 min-h-[200px]">
                  {stageApps.map(app => (
                    <KanbanCard key={app.id} app={app} onView={() => navigate(`/underwriting/${app.id}`)} />
                  ))}
                  {stageApps.length === 0 && <div className="py-8 text-center"><p className="text-[10px] text-gray-400">No declines</p></div>}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['App ID', 'Business', 'Product', 'Amount', 'Mo. Revenue', 'ADB', 'FICO', 'Positions', 'TIB', 'Risk', 'Stage', 'Factor', 'Reviewer', 'Days', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(app => {
                  const risk = getRiskColor(app.riskScore);
                  const scfg = STAGE_CONFIG[app.stage];
                  const overSLA = app.daysInStage >= app.slaThreshold;
                  return (
                    <tr key={app.id} className={`hover:bg-gray-50/50 transition-colors ${overSLA && !['Approved', 'Declined'].includes(app.stage) ? 'bg-red-50/20' : ''}`}>
                      <td className="px-3 py-3">
                        <span className="text-[10px] font-mono font-semibold text-brand cursor-pointer hover:underline" onClick={() => navigate(`/underwriting/${app.id}`)}>{app.applicationId}</span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-xs font-semibold text-gray-900">{app.businessName}</p>
                        <p className="text-[10px] text-gray-400">{app.industry} &middot; {app.state}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${app.productType === 'MCA' ? 'bg-indigo-50 text-indigo-600' : app.productType === 'Term Loan' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{app.productType}</span>
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-gray-900">{fmt(app.requestedAmount)}</td>
                      <td className="px-3 py-3 text-[10px] text-gray-600">{fmt(app.monthlyRevenue)}</td>
                      <td className="px-3 py-3 text-[10px] text-gray-600">{fmt(app.avgDailyBalance)}</td>
                      <td className="px-3 py-3 text-[10px] font-medium text-gray-700">{app.creditScore}</td>
                      <td className="px-3 py-3">
                        {app.existingPositions > 0 ? (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{app.existingPositions}</span>
                        ) : <span className="text-[10px] text-gray-300">0</span>}
                      </td>
                      <td className="px-3 py-3 text-[10px] text-gray-600">{app.monthsInBusiness}mo</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${risk.bg} ${risk.text} ${risk.border}`}>{app.riskScore}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded ${scfg.bg} ${scfg.color}`}>{app.stage}</span>
                      </td>
                      <td className="px-3 py-3 text-[10px] font-mono text-gray-600">{app.factorRate ? `${app.factorRate}x` : '—'}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-[8px] font-semibold text-indigo-700">{app.reviewerInitials}</span>
                          </div>
                          <span className="text-[10px] text-gray-500">{app.reviewer.split(' ')[0]}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-medium ${overSLA && !['Approved', 'Declined'].includes(app.stage) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{app.daysInStage}d</span>
                      </td>
                      <td className="px-3 py-3">
                        <button onClick={() => navigate(`/underwriting/${app.id}`)} className="p-1 hover:bg-indigo-50 rounded text-gray-400 hover:text-brand">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No applications match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-100 border border-emerald-200 rounded" /><span>Low Risk (80+)</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-amber-100 border border-amber-200 rounded" /><span>Medium (60-79)</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-red-100 border border-red-200 rounded" /><span>High Risk (&lt;60)</span></div>
          <span className="text-gray-300">|</span>
          <span>ADB = Avg Daily Balance &middot; TIB = Time in Business &middot; SLA = 5 business days</span>
        </div>
        <p>{APPLICATIONS.length} total applications</p>
      </div>
    </div>
  );
}
