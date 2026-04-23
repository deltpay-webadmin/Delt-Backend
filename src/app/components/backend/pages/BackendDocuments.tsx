import React, { useState, useMemo } from 'react';
import {
  FileText, Search, Plus, Download, Eye, Send, CheckCircle,
  Clock, AlertTriangle, X, Upload, PenTool, Lock, Unlock,
  ChevronRight, User, Store, Calendar, MoreHorizontal,
  File, FileCheck, FileClock, FileX, Shield, Trash2,
  ExternalLink, Copy, Filter, BarChart3, FolderOpen,
} from 'lucide-react';

// ── Types ──
type DocStatus = 'signed' | 'pending_signature' | 'sent' | 'draft' | 'expired' | 'voided';
type DocType = 'mca_agreement' | 'disclosure' | 'ucc_filing' | 'bank_auth' | 'id_verification' | 'tax_document' | 'amendment' | 'adverse_action';

interface Document {
  id: string;
  name: string;
  type: DocType;
  status: DocStatus;
  merchant: string;
  merchantId: string;
  dealId?: string;
  createdDate: string;
  sentDate?: string;
  signedDate?: string;
  expiryDate?: string;
  signer?: string;
  signerEmail?: string;
  agent: string;
  pages: number;
  size: string;
  requiresNotarization: boolean;
  envelopeId?: string;
}

const STATUS_CONFIG: Record<DocStatus, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  signed: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Signed', icon: FileCheck },
  pending_signature: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Awaiting Signature', icon: FileClock },
  sent: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', label: 'Sent', icon: Send },
  draft: { color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', label: 'Draft', icon: File },
  expired: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Expired', icon: FileX },
  voided: { color: 'text-gray-400', bg: 'bg-gray-50 border-gray-100', label: 'Voided', icon: FileX },
};

const TYPE_LABELS: Record<DocType, string> = {
  mca_agreement: 'MCA Agreement',
  disclosure: 'Disclosure Package',
  ucc_filing: 'UCC-1 Filing',
  bank_auth: 'Bank Authorization',
  id_verification: 'ID Verification',
  tax_document: 'Tax Document',
  amendment: 'Amendment',
  adverse_action: 'Adverse Action Notice',
};

const DOCUMENTS: Document[] = [
  { id: 'DOC-001', name: 'MCA Agreement — Brooklyn Vinyl Records', type: 'mca_agreement', status: 'pending_signature', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', dealId: 'DL-2026-0415', createdDate: '2026-04-16', sentDate: '2026-04-16', signer: 'David Park', signerEmail: 'david@brooklynvinyl.com', agent: 'Sarah Kim', pages: 14, size: '2.4 MB', requiresNotarization: false, envelopeId: 'ENV-8842' },
  { id: 'DOC-002', name: 'NY CFDL Disclosure — Brooklyn Vinyl Records', type: 'disclosure', status: 'pending_signature', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', dealId: 'DL-2026-0415', createdDate: '2026-04-16', sentDate: '2026-04-16', signer: 'David Park', signerEmail: 'david@brooklynvinyl.com', agent: 'Sarah Kim', pages: 9, size: '1.8 MB', requiresNotarization: false, envelopeId: 'ENV-8843' },
  { id: 'DOC-003', name: 'VA HB 1027 Disclosure — Richmond Auto Detailing', type: 'disclosure', status: 'sent', merchant: 'Richmond Auto Detailing', merchantId: 'M-1003', dealId: 'DL-2026-0416', createdDate: '2026-04-17', sentDate: '2026-04-17', signer: 'James Richardson', signerEmail: 'james@richmondauto.com', agent: 'Marcus Johnson', pages: 11, size: '2.1 MB', requiresNotarization: false, envelopeId: 'ENV-8850', expiryDate: '2026-04-22' },
  { id: 'DOC-004', name: 'MCA Agreement — Havana Bites Cafe', type: 'mca_agreement', status: 'signed', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', dealId: 'DL-2026-0412', createdDate: '2026-04-12', sentDate: '2026-04-12', signedDate: '2026-04-13', signer: 'Maria Gonzalez', signerEmail: 'maria@havanabites.com', agent: 'Marcus Johnson', pages: 12, size: '2.2 MB', requiresNotarization: false, envelopeId: 'ENV-8801' },
  { id: 'DOC-005', name: 'UCC-1 Filing — Havana Bites Cafe', type: 'ucc_filing', status: 'signed', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', dealId: 'DL-2026-0412', createdDate: '2026-04-14', signedDate: '2026-04-14', agent: 'Marcus Johnson', pages: 3, size: '480 KB', requiresNotarization: false },
  { id: 'DOC-006', name: 'Bank Authorization — Havana Bites Cafe', type: 'bank_auth', status: 'signed', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', dealId: 'DL-2026-0412', createdDate: '2026-04-12', sentDate: '2026-04-12', signedDate: '2026-04-13', signer: 'Maria Gonzalez', signerEmail: 'maria@havanabites.com', agent: 'Marcus Johnson', pages: 2, size: '320 KB', requiresNotarization: false, envelopeId: 'ENV-8802' },
  { id: 'DOC-007', name: 'MCA Agreement — SoBe Cycle & Fitness', type: 'mca_agreement', status: 'signed', merchant: 'SoBe Cycle & Fitness', merchantId: 'M-1010', createdDate: '2026-04-09', sentDate: '2026-04-09', signedDate: '2026-04-09', signer: 'Carlos Mendez', signerEmail: 'carlos@sobecycle.com', agent: 'James Miller', pages: 12, size: '2.1 MB', requiresNotarization: false, envelopeId: 'ENV-8790' },
  { id: 'DOC-008', name: 'Adverse Action Notice — Doral Fresh Market', type: 'adverse_action', status: 'draft', merchant: 'Doral Fresh Market', merchantId: 'M-1008', createdDate: '2026-04-15', agent: 'Marcus Johnson', pages: 2, size: '180 KB', requiresNotarization: false },
  { id: 'DOC-009', name: 'ID Verification — Brooklyn Vinyl Records', type: 'id_verification', status: 'signed', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', createdDate: '2026-04-16', signedDate: '2026-04-16', signer: 'David Park', agent: 'Sarah Kim', pages: 1, size: '3.6 MB', requiresNotarization: false },
  { id: 'DOC-010', name: 'Amendment — Little Havana Barbershop', type: 'amendment', status: 'draft', merchant: 'Little Havana Barbershop', merchantId: 'M-1006', createdDate: '2026-04-16', agent: 'Marcus Johnson', pages: 4, size: '520 KB', requiresNotarization: false },
  { id: 'DOC-011', name: 'Tax Document (W-9) — Havana Bites Cafe', type: 'tax_document', status: 'signed', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', createdDate: '2026-04-10', signedDate: '2026-04-11', signer: 'Maria Gonzalez', agent: 'Marcus Johnson', pages: 1, size: '140 KB', requiresNotarization: false },
  { id: 'DOC-012', name: 'Broker Compensation Disclosure — Brooklyn Vinyl', type: 'disclosure', status: 'draft', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', dealId: 'DL-2026-0415', createdDate: '2026-04-17', agent: 'Sarah Kim', pages: 3, size: '290 KB', requiresNotarization: false },
];

// ── Upload Modal ──
function UploadModal({ onClose }: { onClose: () => void }) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[8px] shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900">Upload Document</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Document Type</label>
            <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20">
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Merchant</label>
            <input placeholder="Search merchant..." className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20" />
          </div>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-[8px] p-8 text-center transition-colors ${dragOver ? 'border-brand bg-brand/5' : 'border-gray-300 bg-gray-50'}`}>
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-1">Drag & drop files here, or click to browse</p>
            <p className="text-[10px] text-gray-400">PDF, DOCX, PNG, JPG up to 25 MB</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="esign" className="rounded" />
            <label htmlFor="esign" className="text-xs text-gray-600">Send for e-signature after upload</label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-[8px]">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-[6px]">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 bg-brand text-white text-xs font-medium rounded-[6px] hover:bg-brand-hover">Upload</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──
export function BackendDocuments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<DocType | 'all'>('all');
  const [showUpload, setShowUpload] = useState(false);

  const filtered = useMemo(() => {
    return DOCUMENTS.filter(d => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (typeFilter !== 'all' && d.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.merchant.toLowerCase().includes(q) || (d.dealId || '').toLowerCase().includes(q) || d.agent.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, statusFilter, typeFilter]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    DOCUMENTS.forEach(d => { c[d.status] = (c[d.status] || 0) + 1; });
    return c;
  }, []);

  const pendingCount = (statusCounts['pending_signature'] || 0) + (statusCounts['sent'] || 0);
  const signedCount = statusCounts['signed'] || 0;
  const draftCount = statusCounts['draft'] || 0;

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-brand to-brand-light flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents & E-Sign</h1>
            <p className="text-sm text-gray-500">{DOCUMENTS.length} documents &middot; {pendingCount} awaiting signature</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowUpload(true)} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-[6px] hover:bg-gray-50">
            <Upload className="w-3.5 h-3.5" /> Upload
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-medium rounded-[6px] hover:bg-brand-hover">
            <PenTool className="w-3.5 h-3.5" /> New E-Sign Request
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Documents', value: DOCUMENTS.length, color: 'border-t-brand', icon: FolderOpen },
          { label: 'Signed & Complete', value: signedCount, color: 'border-t-emerald-500', icon: FileCheck },
          { label: 'Awaiting Action', value: pendingCount, color: 'border-t-amber-500', icon: FileClock },
          { label: 'Drafts', value: draftCount, color: 'border-t-gray-400', icon: File },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`bg-white rounded-[8px] border border-gray-200 border-t-[3px] ${kpi.color} px-4 py-3`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[8px] border border-gray-200 p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {(['all', 'signed', 'pending_signature', 'sent', 'draft', 'expired'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1.5 rounded-[6px] text-[10px] font-semibold border whitespace-nowrap transition-colors ${
                statusFilter === s ? (s === 'all' ? 'bg-brand/5 text-brand border-brand/20' : `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color}`) : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}>{s === 'all' ? `All (${DOCUMENTS.length})` : STATUS_CONFIG[s].label}</button>
          ))}
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-[6px] text-[10px] font-semibold text-gray-500 focus:outline-none">
          <option value="all">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Document Table */}
      <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-500 uppercase tracking-wide font-semibold border-b border-gray-200">
          <span className="flex-1">Document</span>
          <span className="w-32">Type</span>
          <span className="w-36">Merchant</span>
          <span className="w-28">Signer</span>
          <span className="w-20">Date</span>
          <span className="w-24">Status</span>
          <span className="w-16">Actions</span>
        </div>
        {filtered.map(doc => {
          const scfg = STATUS_CONFIG[doc.status];
          const SIcon = scfg.icon;
          return (
            <div key={doc.id} className="px-4 py-3 flex items-center gap-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-[10px] font-mono text-gray-400">{doc.id}</span>
                  {doc.dealId && <span className="text-[9px] font-mono text-brand bg-indigo-50 px-1.5 py-0.5 rounded">{doc.dealId}</span>}
                  {doc.envelopeId && <span className="text-[9px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{doc.envelopeId}</span>}
                </div>
                <h4 className="text-xs font-semibold text-gray-900 truncate">{doc.name}</h4>
                <span className="text-[10px] text-gray-400">{doc.pages} pages &middot; {doc.size}</span>
              </div>
              <span className="w-32 shrink-0 text-[10px] text-gray-600">{TYPE_LABELS[doc.type]}</span>
              <span className="w-36 shrink-0 text-[10px] text-gray-600 truncate">{doc.merchant}</span>
              <span className="w-28 shrink-0 text-[10px] text-gray-500 truncate">{doc.signer || '—'}</span>
              <div className="w-20 shrink-0">
                <span className="text-[10px] font-mono text-gray-500">{doc.signedDate || doc.sentDate || doc.createdDate}</span>
              </div>
              <span className={`w-24 shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border ${scfg.bg} ${scfg.color}`}>
                <SIcon className="w-3 h-3" />{scfg.label}
              </span>
              <div className="w-16 shrink-0 flex items-center gap-1">
                <button className="p-1 hover:bg-gray-100 rounded" title="View"><Eye className="w-3.5 h-3.5 text-gray-400" /></button>
                <button className="p-1 hover:bg-gray-100 rounded" title="Download"><Download className="w-3.5 h-3.5 text-gray-400" /></button>
                {(doc.status === 'draft') && <button className="p-1 hover:bg-blue-50 rounded" title="Send for signature"><Send className="w-3.5 h-3.5 text-blue-500" /></button>}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-5 py-16 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No documents match your filters</p>
          </div>
        )}
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
}
