import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useAppNavigate } from '../NavigationContext';
import {
  Upload, FileSpreadsheet, CheckCircle2, Download, Search,
  ChevronDown, X, File, Loader2, ArrowUpDown, ArrowUp, ArrowDown,
  TrendingUp, TrendingDown, DollarSign, Users, BarChart3,
  CalendarDays, Building2, RefreshCw, AlertCircle, Check, Plus,
} from 'lucide-react';

// ── Types ──
type UploadStep = 'idle' | 'uploaded' | 'mapping' | 'processing' | 'done';
type ReportStatus = 'Processed' | 'Pending Review';

interface ResidualRow {
  id: string;
  merchantId: string;
  merchantName: string;
  monthlyVolume: number;
  transactionCount: number;
  grossRevenue: number;
  processorFees: number;
  netRevenue: number;
  agent: string;
  agentShare: number;
  deltNet: number;
}

interface ColumnMapping {
  detected: string;
  mappedTo: string;
  confirmed: boolean;
}

interface UploadHistory {
  id: string;
  period: string;
  uploadDate: string;
  status: ReportStatus;
  fileName: string;
}

// ── Mock Data ──
const agents = ['Sarah Johnson', 'Michael Chen', 'James Miller'];

const mockResidualRows: ResidualRow[] = [
  { id: 'r1', merchantId: 'merchant-001', merchantName: 'Sunrise Cafe & Bakery', monthlyVolume: 37500, transactionCount: 812, grossRevenue: 1282.50, processorFees: 487.50, netRevenue: 795.00, agent: 'Sarah Johnson', agentShare: 397.50, deltNet: 397.50 },
  { id: 'r2', merchantId: 'merchant-002', merchantName: 'TechStart Solutions', monthlyVolume: 125000, transactionCount: 2340, grossRevenue: 4375.00, processorFees: 1625.00, netRevenue: 2750.00, agent: 'Michael Chen', agentShare: 1375.00, deltNet: 1375.00 },
  { id: 'r3', merchantId: 'merchant-003', merchantName: 'Urban Fitness Center', monthlyVolume: 52300, transactionCount: 1105, grossRevenue: 1830.50, processorFees: 680.90, netRevenue: 1149.60, agent: 'Sarah Johnson', agentShare: 574.80, deltNet: 574.80 },
  { id: 'r4', merchantId: 'merchant-005', merchantName: 'Bella Vista Restaurant', monthlyVolume: 68900, transactionCount: 1490, grossRevenue: 2411.50, processorFees: 896.70, netRevenue: 1514.80, agent: 'Michael Chen', agentShare: 757.40, deltNet: 757.40 },
  { id: 'r5', merchantId: 'merchant-006', merchantName: 'Green Leaf Landscaping', monthlyVolume: 42100, transactionCount: 635, grossRevenue: 1473.50, processorFees: 547.30, netRevenue: 926.20, agent: 'Sarah Johnson', agentShare: 463.10, deltNet: 463.10 },
  { id: 'r6', merchantId: 'merchant-007', merchantName: 'Metro Diner Group', monthlyVolume: 89200, transactionCount: 1923, grossRevenue: 3122.00, processorFees: 1160.60, netRevenue: 1961.40, agent: 'James Miller', agentShare: 980.70, deltNet: 980.70 },
  { id: 'r7', merchantId: 'merchant-009', merchantName: 'Luxe Nail Studio', monthlyVolume: 31200, transactionCount: 720, grossRevenue: 1092.00, processorFees: 405.60, netRevenue: 686.40, agent: 'Michael Chen', agentShare: 343.20, deltNet: 343.20 },
  { id: 'r8', merchantId: 'merchant-010', merchantName: 'Harbor Marine Supply', monthlyVolume: 76500, transactionCount: 1245, grossRevenue: 2677.50, processorFees: 994.50, netRevenue: 1683.00, agent: 'James Miller', agentShare: 841.50, deltNet: 841.50 },
];

const uploadHistory: UploadHistory[] = [
  { id: 'u1', period: 'March 2026', uploadDate: 'Apr 3, 2026', status: 'Processed', fileName: 'march-2026-residuals.csv' },
  { id: 'u2', period: 'February 2026', uploadDate: 'Mar 4, 2026', status: 'Processed', fileName: 'feb-2026-residuals.csv' },
  { id: 'u3', period: 'January 2026', uploadDate: 'Feb 3, 2026', status: 'Processed', fileName: 'jan-2026-residuals.csv' },
  { id: 'u4', period: 'December 2025', uploadDate: 'Jan 5, 2026', status: 'Processed', fileName: 'dec-2025-residuals.csv' },
];

const detectedColumns: ColumnMapping[] = [
  { detected: 'MID', mappedTo: 'Merchant ID', confirmed: true },
  { detected: 'Merchant_Name', mappedTo: 'Name', confirmed: true },
  { detected: 'Total_Vol', mappedTo: 'Volume', confirmed: true },
  { detected: 'Txn_Count', mappedTo: 'Transactions', confirmed: true },
  { detected: 'Gross_Rev', mappedTo: 'Gross Revenue', confirmed: true },
  { detected: 'Proc_Fees', mappedTo: 'Processor Fees', confirmed: true },
  { detected: 'Net_Income', mappedTo: 'Net Revenue', confirmed: true },
];

const systemFields = ['Merchant ID', 'Name', 'Volume', 'Transactions', 'Gross Revenue', 'Processor Fees', 'Net Revenue'];

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtWhole = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// ══════════════════════════════════════
// Admin Residuals View
// ══════════════════════════════════════
export function BackendResiduals() {
  const { navigate } = useAppNavigate();
  const [step, setStep] = useState<UploadStep>('idle');
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>(detectedColumns);
  const [agentFilter, setAgentFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('March 2026');
  const [showProcessedData, setShowProcessedData] = useState(true); // show sample data by default
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter(f =>
      f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls') ||
      f.type === 'text/csv' || f.type.includes('spreadsheet')
    );
    if (valid.length) {
      setFiles(valid);
      setStep('uploaded');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const startMapping = () => {
    setColumnMappings(detectedColumns);
    setStep('mapping');
  };

  const updateMapping = (idx: number, value: string) => {
    setColumnMappings(prev => prev.map((m, i) => i === idx ? { ...m, mappedTo: value, confirmed: true } : m));
  };

  const processReport = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('done');
      setShowProcessedData(true);
      setShowUpload(false);
    }, 2000);
  };

  const resetUpload = () => {
    setStep('idle');
    setFiles([]);
    setShowUpload(false);
  };

  const filtered = useMemo(() => {
    return mockResidualRows.filter(r => {
      if (agentFilter !== 'All' && r.agent !== agentFilter) return false;
      return true;
    });
  }, [agentFilter]);

  const totals = useMemo(() => ({
    volume: filtered.reduce((s, r) => s + r.monthlyVolume, 0),
    transactions: filtered.reduce((s, r) => s + r.transactionCount, 0),
    gross: filtered.reduce((s, r) => s + r.grossRevenue, 0),
    procFees: filtered.reduce((s, r) => s + r.processorFees, 0),
    net: filtered.reduce((s, r) => s + r.netRevenue, 0),
    agentPay: filtered.reduce((s, r) => s + r.agentShare, 0),
    deltNet: filtered.reduce((s, r) => s + r.deltNet, 0),
  }), [filtered]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Residual Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">Upload processor residual reports and distribute agent commissions.</p>
          </div>
          <button
            onClick={() => { setShowUpload(true); setStep('idle'); setFiles([]); }}
            className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-[6px] hover:bg-brand-hover transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Report
          </button>
        </div>

        {/* ── Upload Section ── */}
        {showUpload && (
          <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-brand" />
                {step === 'mapping' ? 'Column Mapping' : step === 'processing' ? 'Processing Report...' : step === 'done' ? 'Report Processed' : 'Upload Residual Report'}
              </h2>
              <button onClick={resetUpload} className="p-1 hover:bg-gray-100 rounded transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="p-5">
              {/* Step: Upload */}
              {(step === 'idle' || step === 'uploaded') && (
                <>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[8px] p-8 text-center cursor-pointer transition-colors ${
                      dragOver ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={e => e.target.files && handleFiles(e.target.files)}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        dragOver ? 'bg-brand/10' : 'bg-gray-100'
                      }`}>
                        <Upload className={`w-5 h-5 ${dragOver ? 'text-brand' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Drag & drop residual report here</p>
                        <p className="text-xs text-gray-400 mt-1">CSV or Excel files from your processor</p>
                      </div>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-4">
                      {files.map((f, i) => (
                        <div key={`${f.name}-${i}`} className="flex items-center gap-3 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-[6px]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-sm text-gray-700 truncate flex-1">{f.name}</span>
                          <span className="text-xs text-gray-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                          <button onClick={() => { setFiles([]); setStep('idle'); }} className="p-0.5 hover:bg-emerald-100 rounded transition-colors">
                            <X className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={startMapping}
                        className="mt-3 px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-[6px] hover:bg-brand-hover transition-colors flex items-center gap-2"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                        Detect & Map Columns
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Step: Column Mapping */}
              {step === 'mapping' && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">
                    We detected {columnMappings.length} columns in your file. Confirm or remap each to its system field.
                  </p>
                  <div className="border border-gray-200 rounded-[6px] overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5 w-1/3">Detected Column</th>
                          <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5 w-16">→</th>
                          <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5 w-1/3">System Field</th>
                          <th className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5 w-20">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {columnMappings.map((m, i) => (
                          <tr key={m.detected}>
                            <td className="px-4 py-3">
                              <code className="text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-700">{m.detected}</code>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-300">→</td>
                            <td className="px-4 py-3">
                              <select
                                value={m.mappedTo}
                                onChange={e => updateMapping(i, e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                              >
                                {systemFields.map(f => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                                <option value="Skip">Skip</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {m.confirmed ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                  <Check className="w-3.5 h-3.5" /> Mapped
                                </span>
                              ) : (
                                <span className="text-xs text-amber-600 font-medium">Review</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={processReport}
                      className="px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-[6px] hover:bg-brand-hover transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Process Report
                    </button>
                    <button
                      onClick={() => setStep('uploaded')}
                      className="px-4 py-2.5 bg-white text-gray-600 text-sm font-medium rounded-[6px] border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Processing */}
              {step === 'processing' && (
                <div className="flex flex-col items-center py-10 gap-4">
                  <Loader2 className="w-8 h-8 text-brand animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">Processing residual report...</p>
                    <p className="text-xs text-gray-400 mt-1">Matching merchants, calculating agent splits, and verifying totals.</p>
                  </div>
                </div>
              )}

              {/* Step: Done */}
              {step === 'done' && (
                <div className="flex items-center gap-3 py-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Report processed successfully</p>
                    <p className="text-xs text-gray-500">8 merchants matched · 3 agents assigned · Commission statements updated</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Summary Cards (shown when processed data exists) ── */}
        {showProcessedData && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <SummaryCard label="Report Period" value="March 2026" icon={<CalendarDays className="w-4 h-4 text-brand" />} />
              <SummaryCard label="Total Volume" value={fmtWhole(totals.volume)} icon={<BarChart3 className="w-4 h-4 text-emerald-600" />} />
              <SummaryCard label="Total Net Revenue" value={fmt(totals.net)} icon={<DollarSign className="w-4 h-4 text-blue-600" />} />
              <SummaryCard label="Total Agent Payouts" value={fmt(totals.agentPay)} icon={<Users className="w-4 h-4 text-amber-600" />} />
              <SummaryCard label="Delt Retained" value={fmt(totals.deltNet)} icon={<DollarSign className="w-4 h-4 text-violet-600" />} />
            </div>

            {/* ── Filters ── */}
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={agentFilter}
                onChange={e => setAgentFilter(e.target.value)}
                className="px-3 py-[7px] bg-white border border-gray-200 rounded-[6px] text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              >
                <option value="All">All Agents</option>
                {agents.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="px-3 py-[7px] bg-white border border-gray-200 rounded-[6px] text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              >
                <option value="March 2026">March 2026</option>
                <option value="February 2026">February 2026</option>
                <option value="January 2026">January 2026</option>
                <option value="December 2025">December 2025</option>
              </select>
              <span className="text-xs text-gray-400 ml-auto">
                Showing <span className="font-medium text-gray-700">{filtered.length}</span> of {mockResidualRows.length} merchants
              </span>
            </div>

            {/* ── Parsed Report Table ── */}
            <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <Th className="pl-5">Merchant Name</Th>
                      <Th className="text-right">Monthly Volume</Th>
                      <Th className="text-right">Transactions</Th>
                      <Th className="text-right">Gross Revenue</Th>
                      <Th className="text-right">Processor Fees</Th>
                      <Th className="text-right">Net Revenue</Th>
                      <Th>Agent</Th>
                      <Th className="text-right">Agent Share</Th>
                      <Th className="text-right pr-5">Delt Net</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="pl-5 py-3">
                          <button
                            onClick={() => navigate(`/residuals/${r.merchantId}`)}
                            className="text-sm font-medium text-brand hover:underline underline-offset-2"
                          >
                            {r.merchantName}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900 text-right tabular-nums">{fmtWhole(r.monthlyVolume)}</td>
                        <td className="px-3 py-3 text-sm text-gray-600 text-right tabular-nums">{r.transactionCount.toLocaleString()}</td>
                        <td className="px-3 py-3 text-sm text-gray-900 text-right tabular-nums">{fmt(r.grossRevenue)}</td>
                        <td className="px-3 py-3 text-sm text-red-600 text-right tabular-nums">-{fmt(r.processorFees)}</td>
                        <td className="px-3 py-3 text-sm text-gray-900 text-right font-medium tabular-nums">{fmt(r.netRevenue)}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{r.agent}</td>
                        <td className="px-3 py-3 text-sm text-amber-700 text-right font-medium tabular-nums">{fmt(r.agentShare)}</td>
                        <td className="px-3 py-3 text-sm text-emerald-700 text-right font-medium tabular-nums pr-5">{fmt(r.deltNet)}</td>
                      </tr>
                    ))}

                    {/* Totals row */}
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td className="pl-5 py-3 text-sm font-bold text-gray-900">Total</td>
                      <td className="px-3 py-3 text-sm font-bold text-gray-900 text-right tabular-nums">{fmtWhole(totals.volume)}</td>
                      <td className="px-3 py-3 text-sm font-bold text-gray-900 text-right tabular-nums">{totals.transactions.toLocaleString()}</td>
                      <td className="px-3 py-3 text-sm font-bold text-gray-900 text-right tabular-nums">{fmt(totals.gross)}</td>
                      <td className="px-3 py-3 text-sm font-bold text-red-600 text-right tabular-nums">-{fmt(totals.procFees)}</td>
                      <td className="px-3 py-3 text-sm font-bold text-gray-900 text-right tabular-nums">{fmt(totals.net)}</td>
                      <td className="px-3 py-3"></td>
                      <td className="px-3 py-3 text-sm font-bold text-amber-700 text-right tabular-nums">{fmt(totals.agentPay)}</td>
                      <td className="px-3 py-3 text-sm font-bold text-emerald-700 text-right tabular-nums pr-5">{fmt(totals.deltNet)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── Upload History ── */}
        <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              Upload History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <Th className="pl-5">Period</Th>
                  <Th>Upload Date</Th>
                  <Th>Status</Th>
                  <Th className="pr-5 text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {uploadHistory.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="pl-5 py-3 text-sm font-medium text-gray-900">{h.period}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{h.uploadDate}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        h.status === 'Processed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 pr-5 text-right">
                      <button className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline underline-offset-2">
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-[8px] px-4 py-3">
          <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">
            Processed reports auto-populate agent commission statements under <span className="font-semibold">Team → Agents</span>. Agents can view their allocated residuals in the <span className="font-semibold">My Residuals</span> section of their portal.
          </p>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════
// Agent "My Residuals" View
// ══════════════════════════════════════
const agentMerchants = mockResidualRows.filter(r => r.agent === 'Sarah Johnson');
const prevPeriodAgentTotal = 1320.80;

interface AgentStatement {
  id: string;
  period: string;
  merchants: number;
  volume: number;
  commission: number;
}

const agentStatements: AgentStatement[] = [
  { id: 'as1', period: 'March 2026', merchants: 3, volume: 131900, commission: 1435.40 },
  { id: 'as2', period: 'February 2026', merchants: 3, volume: 124200, commission: 1320.80 },
  { id: 'as3', period: 'January 2026', merchants: 3, volume: 118500, commission: 1278.60 },
  { id: 'as4', period: 'December 2025', merchants: 2, volume: 85000, commission: 962.10 },
];

export function AgentResiduals() {
  const myTotal = agentMerchants.reduce((s, r) => s + r.agentShare, 0);
  const myVolume = agentMerchants.reduce((s, r) => s + r.monthlyVolume, 0);
  const trend = myTotal - prevPeriodAgentTotal;
  const trendPct = ((trend / prevPeriodAgentTotal) * 100).toFixed(1);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Residuals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your residual income from merchant processing portfolios.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard label="My Merchants" value={agentMerchants.length.toString()} icon={<Building2 className="w-4 h-4 text-brand" />} />
          <SummaryCard label="My Volume" value={fmtWhole(myVolume)} icon={<BarChart3 className="w-4 h-4 text-emerald-600" />} />
          <SummaryCard label="My Commission" value={fmt(myTotal)} icon={<DollarSign className="w-4 h-4 text-amber-600" />} />
          <div className="bg-white rounded-[8px] border border-gray-200 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-gray-500 font-medium leading-tight">vs Last Period</span>
              {trend >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
            </div>
            <p className={`text-lg font-bold leading-none ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trendPct}%
            </p>
            <p className="text-[11px] text-gray-400 mt-1">{trend >= 0 ? '+' : ''}{fmt(trend)}</p>
          </div>
        </div>

        {/* Agent Table */}
        <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">March 2026 — My Merchants</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <Th className="pl-5">Merchant Name</Th>
                  <Th className="text-right">Volume</Th>
                  <Th className="text-right">Transactions</Th>
                  <Th className="text-right pr-5">My Share</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agentMerchants.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="pl-5 py-3 text-sm font-medium text-gray-900">{r.merchantName}</td>
                    <td className="px-3 py-3 text-sm text-gray-900 text-right tabular-nums">{fmtWhole(r.monthlyVolume)}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 text-right tabular-nums">{r.transactionCount.toLocaleString()}</td>
                    <td className="px-3 py-3 text-sm text-emerald-700 text-right font-medium tabular-nums pr-5">{fmt(r.agentShare)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td className="pl-5 py-3 text-sm font-bold text-gray-900">Total</td>
                  <td className="px-3 py-3 text-sm font-bold text-gray-900 text-right tabular-nums">{fmtWhole(myVolume)}</td>
                  <td className="px-3 py-3 text-sm font-bold text-gray-900 text-right tabular-nums">
                    {agentMerchants.reduce((s, r) => s + r.transactionCount, 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-emerald-700 text-right tabular-nums pr-5">{fmt(myTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Historical Statements */}
        <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              Historical Statements
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <Th className="pl-5">Period</Th>
                  <Th className="text-right">Merchants</Th>
                  <Th className="text-right">Volume</Th>
                  <Th className="text-right">Commission</Th>
                  <Th className="pr-5 text-right">Download</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agentStatements.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="pl-5 py-3 text-sm font-medium text-gray-900">{s.period}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 text-right">{s.merchants}</td>
                    <td className="px-3 py-3 text-sm text-gray-900 text-right tabular-nums">{fmtWhole(s.volume)}</td>
                    <td className="px-3 py-3 text-sm text-emerald-700 text-right font-medium tabular-nums">{fmt(s.commission)}</td>
                    <td className="px-3 py-3 pr-5 text-right">
                      <button className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline underline-offset-2">
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


// ══════════════════════════════════════
// Shared sub-components
// ══════════════════════════════════════

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[8px] border border-gray-200 p-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-gray-500 font-medium leading-tight">{label}</span>
        {icon}
      </div>
      <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
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