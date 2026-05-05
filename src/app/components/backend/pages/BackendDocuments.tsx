import React, { useState, useMemo } from 'react';
import {
  FileText, Search, Plus, Download, Eye, Send, CheckCircle,
  Clock, AlertTriangle, X, Upload, PenTool, Lock, Unlock,
  ChevronRight, User, Store, Calendar, MoreHorizontal,
  File, FileCheck, FileClock, FileX, Shield, Trash2,
  ExternalLink, Copy, Filter, BarChart3, FolderOpen,
} from 'lucide-react';
import { useDocuments, documentActions, type CrmDocument as Document, type DocStatus, type DocType } from '../crmStore';

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


// ── Upload Modal ──
function UploadModal({ onClose, onUpload }: { onClose: () => void; onUpload: (input: { type: DocType; merchant: string; name: string; sendForSign: boolean }) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [type, setType] = useState<DocType>('mca_agreement');
  const [merchant, setMerchant] = useState('');
  const [name, setName] = useState('');
  const [sendForSign, setSendForSign] = useState(false);
  const canUpload = name.trim().length > 0 && merchant.trim().length > 0;
  const handleSubmit = () => {
    if (!canUpload) return;
    onUpload({ type, merchant: merchant.trim(), name: name.trim(), sendForSign });
    onClose();
  };
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
            <select value={type} onChange={e => setType(e.target.value as DocType)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20">
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Document Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. MCA Agreement — Acme Corp" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Merchant</label>
            <input value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="Merchant name..." className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20" />
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
            <input type="checkbox" id="esign" checked={sendForSign} onChange={e => setSendForSign(e.target.checked)} className="rounded" />
            <label htmlFor="esign" className="text-xs text-gray-600">Send for e-signature after upload</label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-[8px]">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-[6px]">Cancel</button>
          <button onClick={handleSubmit} disabled={!canUpload} className="delt-btn-primary">Upload</button>
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
  const documents = useDocuments();

  const filtered = useMemo(() => {
    return documents.filter(d => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (typeFilter !== 'all' && d.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.merchant.toLowerCase().includes(q) || (d.dealId || '').toLowerCase().includes(q) || d.agent.toLowerCase().includes(q);
      }
      return true;
    });
  }, [documents, search, statusFilter, typeFilter]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    documents.forEach(d => { c[d.status] = (c[d.status] || 0) + 1; });
    return c;
  }, [documents]);

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
            <h1 className="delt-page-title">Documents & E-Sign</h1>
            <p className="text-sm text-gray-500">{documents.length} documents &middot; {pendingCount} awaiting signature</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowUpload(true)} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-[6px] hover:bg-gray-50">
            <Upload className="w-3.5 h-3.5" /> Upload
          </button>
          <button
            onClick={() => {
              const doc = documentActions.create({ name: 'New E-Sign Request', type: 'mca_agreement', status: 'draft', merchant: 'Unassigned' });
              setStatusFilter('draft');
              // Toast hint: user can fill details from the table after creation.
            }}
            className="delt-btn-primary">
            <PenTool className="w-3.5 h-3.5" /> New E-Sign Request
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Documents', value: documents.length, color: 'border-t-brand', icon: FolderOpen },
          { label: 'Signed & Complete', value: signedCount, color: 'border-t-emerald-500', icon: FileCheck },
          { label: 'Awaiting Action', value: pendingCount, color: 'border-t-amber-500', icon: FileClock },
          { label: 'Drafts', value: draftCount, color: 'border-t-gray-400', icon: File },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`delt-card border-t-[3px] ${kpi.color} px-4 py-3`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">{kpi.label}</span>
              </div>
              <p className="delt-page-title">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="delt-card p-4 flex items-center gap-3 flex-wrap">
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
              }`}>{s === 'all' ? `All (${documents.length})` : STATUS_CONFIG[s].label}</button>
          ))}
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
          className="px-3 py-1.5 bg-white border border-gray-200 rounded-[6px] text-[10px] font-semibold text-gray-500 focus:outline-none">
          <option value="all">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Document Table */}
      <div className="delt-card overflow-hidden">
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
                <button className="p-1 hover:bg-gray-100 rounded" title="View" onClick={() => alert(`Preview placeholder for ${doc.id}\n\nNo file payload — UI stores metadata only until the backend doc store is wired.`)}><Eye className="w-3.5 h-3.5 text-gray-400" /></button>
                <button className="p-1 hover:bg-gray-100 rounded" title="Download (no file payload yet)" onClick={() => alert(`No file is attached to ${doc.id}. Document records are metadata-only until backend storage is configured.`)}><Download className="w-3.5 h-3.5 text-gray-400" /></button>
                {(doc.status === 'draft') && <button onClick={() => documentActions.send(doc.id)} className="p-1 hover:bg-blue-50 rounded" title="Send for signature"><Send className="w-3.5 h-3.5 text-blue-500" /></button>}
                <button onClick={() => { if (confirm(`Delete document ${doc.id}?`)) documentActions.remove(doc.id); }} className="p-1 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" /></button>
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

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUpload={({ type, merchant, name, sendForSign }) => {
            const doc = documentActions.create({
              name,
              type,
              status: sendForSign ? 'pending_signature' : 'draft',
              merchant,
              merchantId: '—',
              sentDate: sendForSign ? new Date().toISOString().slice(0, 10) : undefined,
              envelopeId: sendForSign ? `ENV-${Math.floor(Math.random() * 9000) + 1000}` : undefined,
              size: '— KB',
              pages: 1,
            });
            setStatusFilter(sendForSign ? 'pending_signature' : 'draft');
          }}
        />
      )}
    </div>
  );
}
