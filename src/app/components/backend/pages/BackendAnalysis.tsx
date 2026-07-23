import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, FileText, Sparkles, Download, UserPlus, Clock,
  CheckCircle2, XCircle, Send, TrendingDown, DollarSign,
  AlertCircle, Loader2, X, File, ArrowRight, ExternalLink,
} from 'lucide-react';
import { useAppNavigate } from '../NavigationContext';
import { BackendCostCalculator } from './BackendCostCalculator';
import { Button, Tabs } from '../ui';

// ── Types ──
type AnalysisStatus = 'idle' | 'uploading' | 'analyzing' | 'done';
type HistoryStatus = 'Lead Created' | 'Proposal Sent' | 'Won' | 'Lost';

interface FeeRow {
  label: string;
  amount: number;
}

interface ExtractedData {
  currentProcessor: string;
  statementPeriod: string;
  totalVolume: number;
  totalTransactions: number;
  avgTicket: number;
  effectiveRate: number;
  fees: FeeRow[];
  chargebackCount: number;
  currentMonthlyCost: number;
}

interface SavingsProposal {
  currentRate: number;
  deltRate: number;
  currentMonthlyCost: number;
  deltMonthlyCost: number;
  currentAnnualCost: number;
  deltAnnualCost: number;
  annualSavings: number;
  savingsPercent: number;
}

interface HistoryRow {
  id: string;
  merchantName: string;
  dateAnalyzed: string;
  currentRate: number;
  proposedRate: number;
  savings: number;
  status: HistoryStatus;
}

// ── Mock parsed result ──
const mockExtracted: ExtractedData = {
  currentProcessor: 'First Data / Clover',
  statementPeriod: 'March 2026',
  totalVolume: 87432,
  totalTransactions: 1847,
  avgTicket: 47.33,
  effectiveRate: 3.42,
  fees: [
    { label: 'Discount Rate', amount: 1842.18 },
    { label: 'Transaction Fees', amount: 369.40 },
    { label: 'Monthly Fees', amount: 25.00 },
    { label: 'PCI Fees', amount: 19.95 },
    { label: 'Statement Fees', amount: 10.00 },
    { label: 'Batch Fees', amount: 55.41 },
    { label: 'Other', amount: 668.24 },
  ],
  chargebackCount: 2,
  currentMonthlyCost: 2990.18,
};

const mockProposal: SavingsProposal = {
  currentRate: 3.42,
  deltRate: 2.61,
  currentMonthlyCost: 2990.18,
  deltMonthlyCost: 2282.18,
  currentAnnualCost: 35882.16,
  deltAnnualCost: 27386.16,
  annualSavings: 8496.00,
  savingsPercent: 23.7,
};

const historyData: HistoryRow[] = [
  { id: 'h1', merchantName: 'Mario\'s Pizzeria', dateAnalyzed: 'Apr 2, 2026', currentRate: 3.81, proposedRate: 2.74, savings: 7640, status: 'Won' },
  { id: 'h2', merchantName: 'Apex Plumbing LLC', dateAnalyzed: 'Mar 28, 2026', currentRate: 3.15, proposedRate: 2.48, savings: 4920, status: 'Proposal Sent' },
  { id: 'h3', merchantName: 'Bloom Florist', dateAnalyzed: 'Mar 21, 2026', currentRate: 4.02, proposedRate: 2.85, savings: 9360, status: 'Lead Created' },
  { id: 'h4', merchantName: 'QuickLube Auto Care', dateAnalyzed: 'Mar 14, 2026', currentRate: 3.55, proposedRate: 2.63, savings: 6120, status: 'Lost' },
];

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtWhole = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// ══════════════════════════════════════
// Main Component
// ══════════════════════════════════════
export function BackendAnalysis() {
  const { navigate } = useAppNavigate();
  const [activeView, setActiveView] = useState<'cost-calculator' | 'statement-analyzer'>('cost-calculator');
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [proposal, setProposal] = useState<SavingsProposal | null>(null);
  const [autoLeadCreated, setAutoLeadCreated] = useState(false);
  const [autoLeadName, setAutoLeadName] = useState('');
  const [leadBannerVisible, setLeadBannerVisible] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>(historyData);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter(f =>
      f.type === 'application/pdf' || f.type.startsWith('image/')
    );
    if (valid.length) setFiles(prev => [...prev, ...valid]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const analyze = () => {
    if (!files.length) return;
    setStatus('uploading');
    setAutoLeadCreated(false);
    setLeadBannerVisible(false);
    setTimeout(() => {
      setStatus('analyzing');
      setTimeout(() => {
        setExtracted(mockExtracted);
        setProposal(mockProposal);
        setStatus('done');

        // Auto-create lead from the uploaded statement
        const fileName = files[0]?.name || 'Statement';
        const merchantName = fileName
          .replace(/\.(pdf|png|jpg|jpeg|tiff?)$/i, '')
          .replace(/[-_]/g, ' ')
          .replace(/statement|stmt|processing/gi, '')
          .trim();
        const derivedName = merchantName.length > 2
          ? merchantName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
          : 'New Prospect';

        setAutoLeadName(derivedName);
        setAutoLeadCreated(true);
        setLeadBannerVisible(true);

        // Add to history
        const newEntry: HistoryRow = {
          id: `h-auto-${Date.now()}`,
          merchantName: derivedName,
          dateAnalyzed: 'Apr 9, 2026',
          currentRate: mockProposal.currentRate,
          proposedRate: mockProposal.deltRate,
          savings: mockProposal.annualSavings,
          status: 'Lead Created',
        };
        setHistory(prev => [newEntry, ...prev]);
      }, 2200);
    }, 800);
  };

  const reset = () => {
    setStatus('idle');
    setFiles([]);
    setExtracted(null);
    setProposal(null);
  };

  const statusBadge = (s: HistoryStatus) => {
    const cfg: Record<HistoryStatus, string> = {
      'Lead Created': 'bg-blue-50 text-blue-700',
      'Proposal Sent': 'bg-amber-50 text-amber-700',
      'Won': 'bg-emerald-50 text-emerald-700',
      'Lost': 'bg-gray-100 text-gray-500',
    };
    return cfg[s];
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analysis</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cost calculator and statement analysis tools.</p>
        </div>

        {/* ── View Tabs ── */}
        <Tabs
          active={activeView}
          onChange={setActiveView}
          tabs={[
            { id: 'cost-calculator', label: 'Cost Calculator' },
            { id: 'statement-analyzer', label: 'Statement Analyzer' },
          ]}
        />

        {activeView === 'cost-calculator' && (
          <BackendCostCalculator />
        )}

        {activeView === 'statement-analyzer' && (
          <>
            {/* ── Upload Section ── */}
            {status !== 'done' && (
              <div className="bg-white rounded-[8px] border border-gray-200 p-6">
                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-[8px] p-10 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-brand bg-brand/5'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,image/*"
                    multiple
                    className="hidden"
                    onChange={e => e.target.files && handleFiles(e.target.files)}
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                      dragOver ? 'bg-brand/10' : 'bg-gray-100'
                    }`}>
                      <Upload className={`w-6 h-6 ${dragOver ? 'text-brand' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Drag & drop merchant statements here
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF or image files — credit card processing statements
                      </p>
                    </div>
                  </div>
                </div>

                {/* File list */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-[8px]">
                        <File className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700 truncate flex-1">{f.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="p-0.5 hover:bg-gray-200 rounded transition-colors">
                          <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={analyze}
                    disabled={!files.length || status === 'uploading' || status === 'analyzing'}
                    className="px-5 py-2.5 bg-brand text-white text-sm font-medium rounded-[8px] hover:bg-brand-hover transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {status === 'uploading' || status === 'analyzing' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {status === 'uploading' ? 'Uploading...' : status === 'analyzing' ? 'Analyzing...' : 'Analyze Statement'}
                  </button>
                  {(status === 'uploading' || status === 'analyzing') && (
                    <p className="text-xs text-gray-400">
                      {status === 'uploading' ? 'Uploading file...' : 'AI is extracting fees and calculating savings...'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Results: two-column layout ── */}
            {status === 'done' && extracted && proposal && (
              <>
                {/* Reset bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Analysis complete — {files[0]?.name}
                  </div>
                  <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2">
                    Analyze another statement
                  </button>
                </div>

                {/* Auto-lead created banner */}
                {leadBannerVisible && autoLeadCreated && (
                  <div className="bg-brand/5 border border-brand/20 rounded-[8px] px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[8px] bg-brand/10 flex items-center justify-center shrink-0">
                        <UserPlus className="w-4.5 h-4.5 text-brand" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Lead auto-created: <span className="text-brand">{autoLeadName}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Added to pipeline as <span className="font-medium">New Lead</span> · Statement attached · Savings proposal linked
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => navigate('/leads')}
                        className="px-3.5 py-2 bg-brand text-white text-xs font-medium rounded-[8px] hover:bg-brand-hover transition-colors flex items-center gap-1.5"
                      >
                        View in Pipeline
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setLeadBannerVisible(false)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* ── Left: Extracted Data ── */}
                  <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand" />
                        Extracted Data
                      </h2>
                    </div>

                    <div className="px-5 py-4 space-y-4">
                      {/* Meta */}
                      <div className="grid grid-cols-2 gap-3">
                        <MetaField label="Current Processor" value={extracted.currentProcessor} />
                        <MetaField label="Statement Period" value={extracted.statementPeriod} />
                        <MetaField label="Total Volume" value={fmtWhole(extracted.totalVolume)} />
                        <MetaField label="Total Transactions" value={extracted.totalTransactions.toLocaleString()} />
                        <MetaField label="Avg Ticket" value={fmt(extracted.avgTicket)} />
                        <MetaField label="Effective Rate" value={`${extracted.effectiveRate}%`} />
                      </div>

                      {/* Fee breakdown */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fee Breakdown</p>
                        <div className="border border-gray-200 rounded-[8px] overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Fee Type</th>
                                <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {extracted.fees.map(f => (
                                <tr key={f.label}>
                                  <td className="px-3 py-2 text-sm text-gray-700">{f.label}</td>
                                  <td className="px-3 py-2 text-sm text-gray-900 text-right font-medium tabular-nums">{fmt(f.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Bottom stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <MetaField label="Chargeback Count" value={extracted.chargebackCount.toString()} warn={extracted.chargebackCount > 0} />
                        <MetaField label="Current Monthly Cost" value={fmt(extracted.currentMonthlyCost)} highlight />
                      </div>
                    </div>
                  </div>

                  {/* ── Right: Delt Savings Proposal ── */}
                  <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-emerald-600" />
                        Delt Savings Proposal
                      </h2>
                    </div>

                    <div className="px-5 py-4 flex-1 flex flex-col">
                      {/* Comparison table */}
                      <div className="border border-gray-200 rounded-[8px] overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5"></th>
                              <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5">Current</th>
                              <th className="text-right text-[11px] font-semibold text-brand uppercase tracking-wide px-3 py-2.5">With Delt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            <CompareRow label="Effective Rate" current={`${proposal.currentRate}%`} delt={`${proposal.deltRate}%`} />
                            <CompareRow label="Monthly Cost" current={fmt(proposal.currentMonthlyCost)} delt={fmt(proposal.deltMonthlyCost)} />
                            <CompareRow label="Annual Cost" current={fmtWhole(proposal.currentAnnualCost)} delt={fmtWhole(proposal.deltAnnualCost)} />
                            <tr className="bg-emerald-50/50">
                              <td className="px-3 py-3 text-sm font-semibold text-gray-900">Annual Savings</td>
                              <td className="px-3 py-3 text-right"></td>
                              <td className="px-3 py-3 text-right">
                                <span className="text-base font-bold text-emerald-600">{fmtWhole(proposal.annualSavings)}</span>
                              </td>
                            </tr>
                            <tr className="bg-emerald-50/50">
                              <td className="px-3 py-3 text-sm font-semibold text-gray-900">Savings %</td>
                              <td className="px-3 py-3 text-right"></td>
                              <td className="px-3 py-3 text-right">
                                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">{proposal.savingsPercent}%</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Savings callout */}
                      <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-[8px] p-4 text-center">
                        <p className="text-xs text-emerald-600 font-medium mb-1">Projected Annual Savings</p>
                        <p className="text-3xl font-bold text-emerald-700">{fmtWhole(proposal.annualSavings)}</p>
                        <p className="text-xs text-emerald-500 mt-1">{proposal.savingsPercent}% reduction in processing costs</p>
                      </div>

                      {/* CTA buttons */}
                      <div className="mt-auto pt-5 flex items-center gap-3">
                        <button className="flex-1 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-[8px] hover:bg-brand-hover transition-colors flex items-center justify-center gap-2">
                          <Download className="w-4 h-4" />
                          Generate Proposal PDF
                        </button>
                        {autoLeadCreated ? (
                          <button
                            onClick={() => navigate('/leads')}
                            className="flex-1 px-4 py-2.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-[8px] border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Lead Created — View
                          </button>
                        ) : (
                          <button className="flex-1 px-4 py-2.5 bg-white text-brand text-sm font-medium rounded-[8px] border border-brand hover:bg-brand/5 transition-colors flex items-center justify-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Create Lead
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── History Table ── */}
            <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Analysis History
                </h2>
                <span className="text-xs text-gray-400">{history.length} analyses</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide pl-5 pr-3 py-2.5">Merchant Name</th>
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5">Date Analyzed</th>
                      <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5">Current Rate</th>
                      <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5">Proposed Rate</th>
                      <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5">Savings</th>
                      <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide pl-3 pr-5 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="pl-5 pr-3 py-3 text-sm font-medium text-gray-900">{row.merchantName}</td>
                        <td className="px-3 py-3 text-sm text-gray-500">{row.dateAnalyzed}</td>
                        <td className="px-3 py-3 text-sm text-gray-700 text-right tabular-nums">{row.currentRate}%</td>
                        <td className="px-3 py-3 text-sm text-brand text-right font-medium tabular-nums">{row.proposedRate}%</td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-sm font-medium text-emerald-600 tabular-nums">{fmtWhole(row.savings)}/yr</span>
                        </td>
                        <td className="pl-3 pr-5 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// Sub-components
// ══════════════════════════════════════

function MetaField({ label, value, highlight, warn }: { label: string; value: string; highlight?: boolean; warn?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-[8px] px-3 py-2.5">
      <p className="text-[11px] text-gray-500 font-medium mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${
        highlight ? 'text-brand' : warn ? 'text-amber-600' : 'text-gray-900'
      }`}>
        {value}
        {warn && <AlertCircle className="inline w-3.5 h-3.5 ml-1 -mt-0.5" />}
      </p>
    </div>
  );
}

function CompareRow({ label, current, delt }: { label: string; current: string; delt: string }) {
  return (
    <tr>
      <td className="px-3 py-2.5 text-sm text-gray-700">{label}</td>
      <td className="px-3 py-2.5 text-sm text-gray-500 text-right tabular-nums">{current}</td>
      <td className="px-3 py-2.5 text-sm text-gray-900 text-right font-medium tabular-nums">{delt}</td>
    </tr>
  );
}