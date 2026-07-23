import React, { useState } from 'react';
import {
  BarChart3, Download, FileText, Search, Calendar, Filter,
  TrendingUp, DollarSign, Users, Store, ChevronRight, Clock,
  CheckCircle, Play, Pause, RefreshCw, X, Eye, Mail, Plus,
  PieChart, ArrowUpRight, ArrowDownRight, Table, FileSpreadsheet,
  Printer, Share2, Star, StarOff, Zap, Settings, FolderOpen,
  Shield, Wallet, Globe, CreditCard, AlertTriangle,
} from 'lucide-react';
import { Button, Tabs } from '../ui';

// ── Types ──
type ReportCategory = 'financial' | 'portfolio' | 'compliance' | 'operations' | 'products';
type ReportFormat = 'pdf' | 'csv' | 'xlsx';

interface Report {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  lastRun?: string;
  schedule?: string;
  starred: boolean;
  formats: ReportFormat[];
  estimatedRows?: number;
}

const CATEGORY_CONFIG: Record<ReportCategory, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  financial: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: DollarSign, label: 'Financial' },
  portfolio: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Wallet, label: 'Portfolio' },
  compliance: { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: Shield, label: 'Compliance' },
  operations: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: BarChart3, label: 'Operations' },
  products: { color: 'text-brand', bg: 'bg-brand-50 border-brand-200', icon: Globe, label: 'Products' },
};

const FORMAT_LABELS: Record<ReportFormat, { label: string; icon: React.ElementType }> = {
  pdf: { label: 'PDF', icon: FileText },
  csv: { label: 'CSV', icon: Table },
  xlsx: { label: 'Excel', icon: FileSpreadsheet },
};

const REPORTS: Report[] = [
  // Financial
  { id: 'RPT-001', name: 'Revenue Summary', description: 'Total revenue breakdown by product line: MCA, Residuals, Websites, Subscriptions, Lens AI. Includes MoM and YoY trends.', category: 'financial', lastRun: '2026-04-17 06:00', schedule: 'Daily @ 6:00 AM', starred: true, formats: ['pdf', 'xlsx'], estimatedRows: 120 },
  { id: 'RPT-002', name: 'Profit & Loss Statement', description: 'Full P&L with revenue, cost of capital (2%/mo), commissions, operational expenses, and net profit.', category: 'financial', lastRun: '2026-04-01 06:00', schedule: 'Monthly — 1st', starred: true, formats: ['pdf', 'xlsx'] },
  { id: 'RPT-003', name: 'Commission Report', description: 'Agent commission detail: deals funded, residual splits, bonus tiers, clawbacks, and net payout per agent.', category: 'financial', lastRun: '2026-04-15 06:00', schedule: 'Bi-weekly — Fri', starred: false, formats: ['pdf', 'xlsx', 'csv'], estimatedRows: 45 },
  { id: 'RPT-004', name: 'Cost of Capital Analysis', description: 'Borrowing cost at 2%/mo applied to all funded deals. Shows blended cost, margin per deal, and payback timeline.', category: 'financial', lastRun: '2026-04-17 06:00', schedule: 'Daily @ 6:00 AM', starred: false, formats: ['pdf', 'xlsx'] },
  { id: 'RPT-005', name: 'Profit Distribution', description: 'How profits are allocated: funder share, agent splits, operational reserve, and owner distributions.', category: 'financial', lastRun: '2026-04-01 06:00', schedule: 'Monthly — 1st', starred: false, formats: ['pdf'] },

  // Portfolio
  { id: 'RPT-006', name: 'Active Portfolio Summary', description: 'All active MCAs: funded amounts, repayment status, collection rates, and projected completion dates.', category: 'portfolio', lastRun: '2026-04-17 06:00', schedule: 'Daily @ 6:00 AM', starred: true, formats: ['pdf', 'xlsx', 'csv'], estimatedRows: 284 },
  { id: 'RPT-007', name: 'Default & Delinquency Report', description: 'Accounts in Slow Pay, Default, or Workout status. Includes NSF history, days past due, and collection attempts.', category: 'portfolio', lastRun: '2026-04-17 06:00', schedule: 'Daily @ 6:00 AM', starred: true, formats: ['pdf', 'xlsx', 'csv'], estimatedRows: 18 },
  { id: 'RPT-008', name: 'Renewal Pipeline', description: 'Merchants approaching renewal eligibility (>60% repaid). Includes projected offer amounts and factor rates.', category: 'portfolio', lastRun: '2026-04-17 08:00', schedule: 'Daily @ 8:00 AM', starred: false, formats: ['pdf', 'csv'], estimatedRows: 42 },
  { id: 'RPT-009', name: 'Stacking Risk Report', description: 'Merchants with multiple active positions from DataMerch consortium data. Cross-referenced with Delt positions.', category: 'portfolio', lastRun: '2026-04-15 06:00', schedule: 'Weekly — Mon', starred: false, formats: ['pdf', 'xlsx'], estimatedRows: 12 },
  { id: 'RPT-010', name: 'Amortization Schedule Export', description: 'Full amortization schedules for all active deals. Includes daily/weekly/monthly breakdowns.', category: 'portfolio', lastRun: '2026-04-01 06:00', schedule: 'Monthly — 1st', starred: false, formats: ['xlsx', 'csv'], estimatedRows: 8400 },

  // Compliance
  { id: 'RPT-011', name: 'State Disclosure Audit', description: 'All disclosure packages sent: NY CFDL, VA HB 1027, CA SB 1235, UT. Tracks delivery, acknowledgment, and compliance gaps.', category: 'compliance', lastRun: '2026-04-17 06:00', schedule: 'Daily @ 6:00 AM', starred: true, formats: ['pdf', 'xlsx', 'csv'], estimatedRows: 67 },
  { id: 'RPT-012', name: 'VAMP / ECM Monitoring', description: 'Visa VAMP and Mastercard ECM threshold proximity for all merchants. Flags at-risk accounts.', category: 'compliance', lastRun: '2026-04-17 06:00', schedule: 'Daily @ 6:00 AM', starred: false, formats: ['pdf', 'xlsx'] },
  { id: 'RPT-013', name: 'PCI Compliance Status', description: 'SAQ completion, ASV scan status, and P2PE validation across all merchants. Highlights expirations.', category: 'compliance', lastRun: '2026-04-15 06:00', schedule: 'Weekly — Mon', starred: false, formats: ['pdf', 'csv'] },
  { id: 'RPT-014', name: 'UCC Filing Register', description: 'All UCC-1 filings: status, expiration dates, amendments, and terminations.', category: 'compliance', lastRun: '2026-04-01 06:00', schedule: 'Monthly — 1st', starred: false, formats: ['pdf', 'xlsx'], estimatedRows: 156 },
  { id: 'RPT-015', name: 'MATCH / OFAC Screening Log', description: 'Quarterly re-screening results for MATCH/TMF and OFAC compliance across merchant portfolio.', category: 'compliance', lastRun: '2026-04-01 06:00', schedule: 'Quarterly', starred: false, formats: ['pdf', 'csv'] },

  // Operations
  { id: 'RPT-016', name: 'Pipeline Conversion Funnel', description: 'Lead → Application → Underwriting → Funded conversion rates. Includes avg time-to-fund and drop-off analysis.', category: 'operations', lastRun: '2026-04-17 06:00', schedule: 'Daily @ 6:00 AM', starred: false, formats: ['pdf', 'xlsx'] },
  { id: 'RPT-017', name: 'Agent Performance Scorecard', description: 'Per-agent metrics: deals funded, volume, approval rate, avg factor, retention, and portfolio health.', category: 'operations', lastRun: '2026-04-15 06:00', schedule: 'Weekly — Mon', starred: true, formats: ['pdf', 'xlsx'], estimatedRows: 12 },
  { id: 'RPT-018', name: 'Dispute & Chargeback Summary', description: 'All disputes filed, won, lost. Win rate, total dollars recovered, and cost-per-dispute analysis.', category: 'operations', lastRun: '2026-04-15 06:00', schedule: 'Weekly — Mon', starred: false, formats: ['pdf', 'xlsx'] },
  { id: 'RPT-019', name: 'Outreach Campaign Performance', description: 'Email/SMS campaign metrics: sent, opened, clicked, converted. Includes drip sequence completion rates.', category: 'operations', lastRun: '2026-04-14 06:00', schedule: 'Weekly — Mon', starred: false, formats: ['pdf', 'csv'] },

  // Products
  { id: 'RPT-020', name: 'Website Analytics Summary', description: 'All merchant websites: page views, unique visitors, conversion rates, mobile scores, and SEO health.', category: 'products', lastRun: '2026-04-17 06:00', schedule: 'Daily @ 6:00 AM', starred: false, formats: ['pdf', 'xlsx'] },
  { id: 'RPT-021', name: 'Subscription MRR Report', description: 'Monthly recurring revenue by plan tier, churn rate, expansion revenue, and lifetime value projections.', category: 'products', lastRun: '2026-04-01 06:00', schedule: 'Monthly — 1st', starred: false, formats: ['pdf', 'xlsx'] },
  { id: 'RPT-022', name: 'Lens AI Usage Report', description: 'Lens AI queries, analysis runs, merchant-facing vs internal usage, and accuracy metrics.', category: 'products', lastRun: '2026-04-15 06:00', schedule: 'Weekly — Mon', starred: false, formats: ['pdf', 'csv'] },
  { id: 'RPT-023', name: 'Cross-Sell Opportunity Report', description: 'Merchants using 1 product who are candidates for others. Ranked by propensity score.', category: 'products', lastRun: '2026-04-17 08:00', schedule: 'Daily @ 8:00 AM', starred: true, formats: ['pdf', 'xlsx', 'csv'], estimatedRows: 89 },
];

// ── Recent Exports ──
interface RecentExport {
  id: string;
  reportName: string;
  format: ReportFormat;
  generatedAt: string;
  size: string;
  status: 'ready' | 'generating' | 'failed';
}

const RECENT_EXPORTS: RecentExport[] = [
  { id: 'EXP-101', reportName: 'Revenue Summary', format: 'xlsx', generatedAt: '2026-04-17 06:02', size: '1.2 MB', status: 'ready' },
  { id: 'EXP-100', reportName: 'Active Portfolio Summary', format: 'csv', generatedAt: '2026-04-17 06:01', size: '340 KB', status: 'ready' },
  { id: 'EXP-099', reportName: 'Default & Delinquency Report', format: 'pdf', generatedAt: '2026-04-17 06:01', size: '890 KB', status: 'ready' },
  { id: 'EXP-098', reportName: 'State Disclosure Audit', format: 'xlsx', generatedAt: '2026-04-17 06:00', size: '2.1 MB', status: 'ready' },
  { id: 'EXP-097', reportName: 'Cross-Sell Opportunity Report', format: 'csv', generatedAt: '2026-04-17 08:01', size: '180 KB', status: 'generating' },
];

// ── Main ──
export function BackendReports() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'library' | 'exports'>('library');
  const [reports, setReports] = useState(REPORTS);

  const filtered = reports.filter(r => {
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleStar = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, starred: !r.starred } : r));
  };

  const starredReports = filtered.filter(r => r.starred);
  const unstarredReports = filtered.filter(r => !r.starred);

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-brand to-brand-light flex items-center justify-center shadow-sm">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Export Center</h1>
            <p className="text-sm text-gray-500">{REPORTS.length} reports &middot; {REPORTS.filter(r => r.schedule).length} scheduled</p>
          </div>
        </div>
        <Button size="sm" icon={<Plus />}>Custom Report</Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-[8px] p-1 w-fit">
        {(['library', 'exports'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-[8px] text-xs font-medium transition-all ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab === 'library' ? 'Report Library' : `Recent Exports (${RECENT_EXPORTS.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'library' ? (
        <>
          {/* Filters */}
          <div className="bg-white rounded-[8px] border border-gray-200 p-4 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1.5 rounded-[8px] text-[10px] font-semibold border whitespace-nowrap transition-colors ${categoryFilter === 'all' ? 'bg-brand/5 text-brand border-brand/20' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>All</button>
              {Object.entries(CATEGORY_CONFIG).map(([k, v]) => {
                const Icon = v.icon;
                return (
                  <button key={k} onClick={() => setCategoryFilter(k as ReportCategory)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[10px] font-semibold border whitespace-nowrap transition-colors ${
                      categoryFilter === k ? `${v.bg} ${v.color}` : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}><Icon className="w-3 h-3" />{v.label}</button>
                );
              })}
            </div>
          </div>

          {/* Starred */}
          {starredReports.length > 0 && (
            <div>
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Starred Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {starredReports.map(report => {
                  const ccfg = CATEGORY_CONFIG[report.category];
                  const CatIcon = ccfg.icon;
                  return (
                    <div key={report.id} className="bg-white rounded-[8px] border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center border ${ccfg.bg}`}>
                            <CatIcon className={`w-3.5 h-3.5 ${ccfg.color}`} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900">{report.name}</h4>
                            <span className={`text-[9px] font-semibold ${ccfg.color}`}>{ccfg.label}</span>
                          </div>
                        </div>
                        <button onClick={() => toggleStar(report.id)} className="p-0.5">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 mb-3 line-clamp-2">{report.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {report.schedule && <span className="text-[9px] text-gray-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{report.schedule}</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          {report.formats.map(f => {
                            const fcfg = FORMAT_LABELS[f];
                            return (
                              <button key={f} className="px-2 py-1 bg-gray-50 hover:bg-brand/5 hover:text-brand border border-gray-200 rounded-[8px] text-[9px] font-semibold text-gray-500 transition-colors flex items-center gap-0.5">
                                <Download className="w-2.5 h-2.5" />{fcfg.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Reports */}
          <div>
            {starredReports.length > 0 && <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">All Reports</h3>}
            <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
              {unstarredReports.map((report, i) => {
                const ccfg = CATEGORY_CONFIG[report.category];
                const CatIcon = ccfg.icon;
                return (
                  <div key={report.id} className={`px-4 py-3 flex items-center gap-4 hover:bg-gray-50/50 transition-colors ${i < unstarredReports.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center border shrink-0 ${ccfg.bg}`}>
                      <CatIcon className={`w-4 h-4 ${ccfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-gray-900">{report.name}</h4>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${ccfg.bg} ${ccfg.color}`}>{ccfg.label}</span>
                        {report.estimatedRows && <span className="text-[9px] text-gray-400">~{report.estimatedRows.toLocaleString()} rows</span>}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">{report.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {report.schedule && <span className="text-[9px] text-gray-400 flex items-center gap-0.5 whitespace-nowrap"><Clock className="w-2.5 h-2.5" />{report.schedule}</span>}
                      <div className="flex items-center gap-1">
                        {report.formats.map(f => (
                          <button key={f} className="px-2 py-1 bg-gray-50 hover:bg-brand/5 hover:text-brand border border-gray-200 rounded-[8px] text-[9px] font-semibold text-gray-500 transition-colors flex items-center gap-0.5">
                            <Download className="w-2.5 h-2.5" />{FORMAT_LABELS[f].label}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => toggleStar(report.id)} className="p-1 hover:bg-gray-100 rounded">
                        <StarOff className="w-3.5 h-3.5 text-gray-300 hover:text-amber-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-5 py-16 text-center">
                  <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No reports match your search</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Recent Exports Tab */
        <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-500 uppercase tracking-wide font-semibold border-b border-gray-200">
            <span className="flex-1">Report</span>
            <span className="w-16">Format</span>
            <span className="w-36">Generated</span>
            <span className="w-16">Size</span>
            <span className="w-20">Status</span>
            <span className="w-20">Actions</span>
          </div>
          {RECENT_EXPORTS.map(exp => (
            <div key={exp.id} className="px-4 py-3 flex items-center gap-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-gray-900">{exp.reportName}</h4>
                <span className="text-[10px] text-gray-400 font-mono">{exp.id}</span>
              </div>
              <span className="w-16 shrink-0 text-[10px] font-semibold text-gray-600 uppercase">{exp.format}</span>
              <span className="w-36 shrink-0 text-[10px] font-mono text-gray-500">{exp.generatedAt}</span>
              <span className="w-16 shrink-0 text-[10px] text-gray-500">{exp.size}</span>
              <span className={`w-20 shrink-0 text-[10px] font-semibold flex items-center gap-1 ${
                exp.status === 'ready' ? 'text-emerald-600' : exp.status === 'generating' ? 'text-blue-600' : 'text-red-600'
              }`}>
                {exp.status === 'ready' ? <CheckCircle className="w-3 h-3" /> : exp.status === 'generating' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
                {exp.status === 'ready' ? 'Ready' : exp.status === 'generating' ? 'Generating' : 'Failed'}
              </span>
              <div className="w-20 shrink-0 flex items-center gap-1">
                {exp.status === 'ready' && (
                  <>
                    <button className="p-1 hover:bg-gray-100 rounded" title="Download"><Download className="w-3.5 h-3.5 text-brand" /></button>
                    <button className="p-1 hover:bg-gray-100 rounded" title="Email"><Mail className="w-3.5 h-3.5 text-gray-400" /></button>
                    <button className="p-1 hover:bg-gray-100 rounded" title="Preview"><Eye className="w-3.5 h-3.5 text-gray-400" /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
