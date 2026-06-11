/**
 * AchImportFlow — Upload ACH.com RptActivitySummary CSV and ingest daily rows.
 *
 * Three-step modal:
 *   1. Drop / pick CSV
 *   2. Preview parsed rows + totals (read meta from header block)
 *   3. Commit to Supabase via achActions.importBatch
 *
 * CSV format (ACH.com RptActivitySummary):
 *   • Lots of metadata rows at top:
 *       CustomerName=Delt Pay LLC
 *       NachaID=1002014247
 *       textbox67=Date range
 *       textbox43=Run time
 *   • Then a header row starting with: ProcessingDate_1,RecordTypeName,...
 *   • Then data rows
 *   • Then a footer block starting with: textbox94,textbox95,...
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Check, FileText, Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import { achActions, type ImportRow, type AchRecordType } from '../achStore';

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

interface ParsedCsv {
  meta: { customerName: string; nachaId: string; dateRange: string };
  rows: ImportRow[];
  warnings: string[];
}

function parseDate(s: string): string {
  if (!s) return '';
  const t = s.trim();
  let m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, mm, dd, yy] = m;
    return `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const [, yy, mm, dd] = m;
    return `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return '';
}

function splitCsvLine(line: string): string[] {
  // Minimal CSV splitter — handles quoted strings with commas
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && line[i + 1] === '"' && inQuotes) {
      cur += '"';
      i++;
    } else if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function parseAchCsv(text: string): ParsedCsv {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/);

  // ── Metadata extraction (key=value rows scattered above header) ──
  const meta = { customerName: '', nachaId: '', dateRange: '' };
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('CustomerName=')) meta.customerName = line.slice('CustomerName='.length);
    else if (line.startsWith('NachaID=')) meta.nachaId = line.slice('NachaID='.length);
    else if (line.startsWith('textbox67=')) meta.dateRange = line.slice('textbox67='.length);
  }

  // ── Locate the data header ──
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('ProcessingDate_1,RecordTypeName')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) {
    warnings.push('No data header found — is this an ACH.com RptActivitySummary export?');
    return { meta, rows: [], warnings };
  }

  const header = splitCsvLine(lines[headerIdx]);
  const col = (name: string) => header.findIndex(h => h.toLowerCase() === name.toLowerCase());
  const idx = {
    processingDate: col('ProcessingDate_1'),
    recordType: col('RecordTypeName'),
    debitAmount: col('DebitAmount'),
    creditAmount: col('CreditAmount'),
    debitCount: col('DebitCount'),
    creditCount: col('CreditCount'),
    totalCount: col('TotalCount'),
    effectiveEntryDate: col('EffectiveEntryDate_1'),
    settlementDate: col('SettlementDate_1'),
  };

  const rows: ImportRow[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    // Footer / next-section markers
    if (raw.startsWith('textbox') || raw.startsWith('CustomerName=')) break;

    const cells = splitCsvLine(lines[i]);
    if (cells.length < 5) continue;

    const recordTypeRaw = (cells[idx.recordType] || '').trim();
    const allowed: AchRecordType[] = ['ORIGINATION', 'Settlement', 'Returns'];
    if (!allowed.includes(recordTypeRaw as AchRecordType)) continue;

    const processingDate = parseDate(cells[idx.processingDate]);
    if (!processingDate) {
      warnings.push(`Skipped row ${i + 1}: unparseable date "${cells[idx.processingDate]}"`);
      continue;
    }

    rows.push({
      processingDate,
      recordType: recordTypeRaw as AchRecordType,
      debitAmount: Number(cells[idx.debitAmount]) || 0,
      creditAmount: Number(cells[idx.creditAmount]) || 0,
      debitCount: Number(cells[idx.debitCount]) || 0,
      creditCount: Number(cells[idx.creditCount]) || 0,
      totalCount: Number(cells[idx.totalCount]) || 0,
      effectiveEntryDate: parseDate(cells[idx.effectiveEntryDate]),
      settlementDate: parseDate(cells[idx.settlementDate]),
    });
  }

  return { meta, rows, warnings };
}

// ══════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════

export interface AchImportFlowProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'upload' | 'preview' | 'success';

export function AchImportFlow({ open, onClose }: AchImportFlowProps) {
  const [step, setStep] = useState<Step>('upload');
  const [filename, setFilename] = useState('');
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = useCallback(() => {
    setStep('upload');
    setFilename('');
    setParsed(null);
    setSubmitting(false);
    setResult(null);
    setError(null);
    setDragOver(false);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setFilename(file.name);
    try {
      const text = await file.text();
      const p = parseAchCsv(text);
      if (!p.rows.length) {
        setError(p.warnings[0] || 'No valid rows found in this CSV.');
        return;
      }
      setParsed(p);
      setStep('preview');
    } catch (err: any) {
      setError(err?.message || 'Failed to read file.');
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
  };

  const totals = useMemo(() => {
    if (!parsed) return { origin: 0, settle: 0, ret: 0, originCount: 0, settleCount: 0, retCount: 0 };
    return parsed.rows.reduce(
      (acc, r) => {
        if (r.recordType === 'ORIGINATION') {
          acc.origin += r.debitAmount;
          acc.originCount += r.totalCount;
        } else if (r.recordType === 'Settlement') {
          acc.settle += r.creditAmount;
          acc.settleCount += r.totalCount;
        } else if (r.recordType === 'Returns') {
          acc.ret += r.debitAmount;
          acc.retCount += r.totalCount;
        }
        return acc;
      },
      { origin: 0, settle: 0, ret: 0, originCount: 0, settleCount: 0, retCount: 0 },
    );
  }, [parsed]);

  const handleCommit = async () => {
    if (!parsed) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await achActions.importBatch(parsed.rows, {
        filename,
        customerName: parsed.meta.customerName || 'Unknown',
        nachaId: parsed.meta.nachaId || '',
        dateRange: parsed.meta.dateRange || '',
      });
      if (r.error) {
        setError(r.error);
      } else {
        setResult({ inserted: r.inserted, skipped: r.skipped });
        setStep('success');
      }
    } catch (err: any) {
      setError(err?.message || 'Import failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleClose}
          />

          <motion.div
            className="absolute right-0 top-0 h-full w-full sm:max-w-[600px] bg-white shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900">Import ACH activity</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  Upload an ACH.com RptActivitySummary CSV to ingest daily originations, settlements, and returns.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1 -mr-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {step === 'upload' && (
                <div>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                      dragOver ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                    }`}
                  >
                    <Upload size={28} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-[13px] font-medium text-gray-700">Drop your CSV here</p>
                    <p className="text-[12px] text-gray-500 mt-1">or click to choose a file</p>
                    <p className="text-[11px] text-gray-400 mt-3">Expects ACH.com RptActivitySummary format</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={onPick}
                  />
                  {error && (
                    <div className="mt-4 p-3 rounded border border-red-100 bg-red-50 text-[12px] text-red-700 flex gap-2">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              )}

              {step === 'preview' && parsed && (
                <div className="space-y-4">
                  {/* File card */}
                  <div className="flex items-center gap-3 p-3 border border-gray-100 rounded">
                    <FileText size={16} className="text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-gray-900 truncate">{filename}</p>
                      <p className="text-[11px] text-gray-500">
                        {parsed.meta.customerName || '—'} · NachaID {parsed.meta.nachaId || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Meta */}
                  {parsed.meta.dateRange && (
                    <div className="text-[12px] text-gray-600">
                      <span className="text-gray-400">Range:</span> {parsed.meta.dateRange}
                    </div>
                  )}

                  {/* Totals */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded border border-gray-100 bg-emerald-50/40">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-medium">Originated</p>
                      <p className="text-[15px] font-semibold text-gray-900 mt-1">{fmt(totals.origin)}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{totals.originCount} txns</p>
                    </div>
                    <div className="p-3 rounded border border-gray-100 bg-blue-50/40">
                      <p className="text-[10px] uppercase tracking-wider text-blue-700 font-medium">Settled</p>
                      <p className="text-[15px] font-semibold text-gray-900 mt-1">{fmt(totals.settle)}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{totals.settleCount} txns</p>
                    </div>
                    <div className="p-3 rounded border border-gray-100 bg-red-50/40">
                      <p className="text-[10px] uppercase tracking-wider text-red-700 font-medium">Returned</p>
                      <p className="text-[15px] font-semibold text-gray-900 mt-1">{fmt(totals.ret)}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{totals.retCount} txns</p>
                    </div>
                  </div>

                  {/* Preview list */}
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-2">
                      Preview · first 8 of {parsed.rows.length} rows
                    </p>
                    <div className="border border-gray-100 rounded overflow-hidden">
                      <table className="w-full text-[12px]">
                        <thead className="bg-gray-50">
                          <tr className="text-gray-500">
                            <th className="text-left px-3 py-2 font-medium">Date</th>
                            <th className="text-left px-3 py-2 font-medium">Type</th>
                            <th className="text-right px-3 py-2 font-medium">Debit</th>
                            <th className="text-right px-3 py-2 font-medium">Credit</th>
                            <th className="text-right px-3 py-2 font-medium">#</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsed.rows.slice(0, 8).map((r, i) => (
                            <tr key={i} className="border-t border-gray-50">
                              <td className="px-3 py-1.5 text-gray-700">{r.processingDate}</td>
                              <td className="px-3 py-1.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  r.recordType === 'ORIGINATION' ? 'bg-emerald-50 text-emerald-700' :
                                  r.recordType === 'Settlement' ? 'bg-blue-50 text-blue-700' :
                                  'bg-red-50 text-red-700'
                                }`}>{r.recordType}</span>
                              </td>
                              <td className="text-right px-3 py-1.5 text-gray-700">{r.debitAmount ? fmt(r.debitAmount) : '—'}</td>
                              <td className="text-right px-3 py-1.5 text-gray-700">{r.creditAmount ? fmt(r.creditAmount) : '—'}</td>
                              <td className="text-right px-3 py-1.5 text-gray-500">{r.totalCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {parsed.warnings.length > 0 && (
                    <div className="p-3 rounded border border-amber-100 bg-amber-50/60 text-[11px] text-amber-800">
                      <p className="font-medium mb-1">{parsed.warnings.length} warnings</p>
                      <ul className="space-y-0.5">
                        {parsed.warnings.slice(0, 3).map((w, i) => <li key={i}>• {w}</li>)}
                      </ul>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 rounded border border-red-100 bg-red-50 text-[12px] text-red-700 flex gap-2">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              )}

              {step === 'success' && result && (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                    <Check size={28} className="text-emerald-600" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-gray-900">Import complete</h3>
                  <p className="text-[13px] text-gray-500 mt-1.5">
                    Added {result.inserted} {result.inserted === 1 ? 'row' : 'rows'}
                    {result.skipped > 0 && ` · ${result.skipped} skipped (duplicates)`}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {step !== 'success' && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                {step === 'preview' ? (
                  <button
                    onClick={reset}
                    className="text-[13px] text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    Back
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleClose}
                    className="px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  {step === 'preview' && (
                    <button
                      onClick={handleCommit}
                      disabled={submitting}
                      className="px-3.5 py-1.5 text-[13px] font-medium text-white bg-brand hover:bg-brand/90 disabled:opacity-60 rounded transition-colors flex items-center gap-1.5"
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                      Import {parsed?.rows.length ?? 0} rows
                    </button>
                  )}
                </div>
              </div>
            )}
            {step === 'success' && (
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-3.5 py-1.5 text-[13px] font-medium text-white bg-brand hover:bg-brand/90 rounded transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
