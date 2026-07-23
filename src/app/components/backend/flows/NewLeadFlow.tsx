/**
 * NewLeadFlow — Pipedrive-style quick lead capture.
 *
 * A single compact modal that captures only what's needed to get a lead into
 * the pipeline: who it is, how to reach them, what they want, and roughly how
 * big. Everything else (KYB, ownership, bank, documents, attestation) is
 * collected later as the lead advances through pipeline stages — the same way
 * Pipedrive lets you add a deal in seconds and enrich it over time.
 *
 * Only the business name is required. The lead lands in the "New" stage and
 * moves forward from the lead detail panel.
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  X,
  Plus,
  Search,
  Check,
  ChevronDown,
  CreditCard,
  HandCoins,
  Globe,
  Sparkles,
  Store,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { leadActions, LEAD_PRODUCTS, type Lead, type LeadProduct } from '../crmStore';
import { MCC_CODES, mccLabel } from './mccCodes';
import { Button } from '../ui';

// Owners are a single-item list today, but the menu is data-driven so more can
// be added here (or wired to a users table) without touching the UI.
const OWNERS = ['David Hazday'];
const DEFAULT_OWNER = OWNERS[0];

const PRODUCT_ICONS: Record<LeadProduct, React.ReactNode> = {
  Payments: <CreditCard className="w-4 h-4" />,
  Capital: <HandCoins className="w-4 h-4" />,
  Website: <Globe className="w-4 h-4" />,
  Ai: <Sparkles className="w-4 h-4" />,
  Leasing: <Store className="w-4 h-4" />,
  // legacy values never rendered here
  MCA: <HandCoins className="w-4 h-4" />,
  Residual: <CreditCard className="w-4 h-4" />,
  Processing: <CreditCard className="w-4 h-4" />,
};

// Light score heuristic — bigger monthly volume, warmer lead. Full scoring
// happens in underwriting; this is just a starting signal for the pipeline.
function quickScore(monthlyVolume: string): number {
  const vol = Number(monthlyVolume.replace(/[^0-9.]/g, '')) || 0;
  if (vol >= 100_000) return 75;
  if (vol >= 30_000) return 65;
  if (vol >= 10_000) return 58;
  return 50;
}

const money = (v: string) => (v.trim() ? `$${v.trim()}` : '');

// ─── MCC business-type picker (searchable, full ISO list) ──────────────
function BusinessTypePicker({
  value,
  onChange,
}: {
  value: string; // selected MCC code, '' when none
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => MCC_CODES.find(m => m.code === value) || null, [value]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MCC_CODES.slice(0, 50);
    const out = [];
    for (const m of MCC_CODES) {
      if (m.code.includes(q) || m.description.toLowerCase().includes(q)) {
        out.push(m);
        if (out.length >= 50) break;
      }
    }
    return out;
  }, [query]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(o => !o);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm text-left focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
      >
        <span className={selected ? 'text-gray-900 truncate' : 'text-gray-400'}>
          {selected ? mccLabel(selected) : 'Search business type (MCC)…'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-[8px] shadow-lg overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search 981 MCC codes…"
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {matches.length === 0 ? (
                <p className="px-3 py-4 text-xs text-gray-400 text-center">No MCC codes match "{query}"</p>
              ) : (
                matches.map(m => {
                  const isSel = m.code === value;
                  return (
                    <button
                      key={m.code}
                      type="button"
                      onClick={() => {
                        onChange(m.code);
                        setOpen(false);
                        setQuery('');
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                        isSel ? 'bg-brand-50' : ''
                      }`}
                    >
                      <span className="font-mono text-xs text-gray-500 w-10 shrink-0">{m.code}</span>
                      <span className="text-gray-800 flex-1 truncate">{m.description}</span>
                      {isSel && <Check className="w-4 h-4 text-brand shrink-0" />}
                    </button>
                  );
                })
              )}
              {query.trim() === '' && (
                <p className="px-3 py-2 text-[11px] text-gray-400">
                  Showing first 50 — type to search all 981 codes.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export interface NewLeadFlowProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (lead: Lead) => void;
}

const BLANK = {
  businessName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  products: ['Payments'] as LeadProduct[],
  mccCode: '',
  monthlyVolume: '',
  owner: DEFAULT_OWNER,
  priority: 'Medium' as Lead['priority'],
  notes: '',
};

export function NewLeadFlow({ open, onClose, onCreated }: NewLeadFlowProps) {
  const [form, setForm] = useState({ ...BLANK });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const toggleProduct = (p: LeadProduct) =>
    setForm(f => ({
      ...f,
      products: f.products.includes(p) ? f.products.filter(x => x !== p) : [...f.products, p],
    }));

  const reset = () => setForm({ ...BLANK });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!form.businessName.trim()) {
      toast.error('Business name is required');
      return;
    }
    if (form.products.length === 0) {
      toast.error('Select at least one product');
      return;
    }
    const mcc = MCC_CODES.find(m => m.code === form.mccCode);
    const created = leadActions.create({
      businessName: form.businessName.trim(),
      industry: mcc ? mccLabel(mcc) : 'General',
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      products: form.products,
      type: form.products[0],
      source: 'Manual',
      monthlySales: money(form.monthlyVolume),
      score: quickScore(form.monthlyVolume),
      assignedAgent: form.owner,
      priority: form.priority,
      notes: form.notes.trim(),
    });
    reset();
    onCreated?.(created);
  };

  if (!open) return null;

  const inputCls =
    'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">New lead</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Add the basics now — enrich as it moves through the pipeline.
            </p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-[8px] transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3.5 max-h-[72vh] overflow-y-auto">
          <div>
            <label className={labelCls}>Business name</label>
            <input
              autoFocus
              value={form.businessName}
              onChange={e => update('businessName', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Acme Bakery"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Business type</label>
            <BusinessTypePicker value={form.mccCode} onChange={c => update('mccCode', c)} />
          </div>

          <div>
            <label className={labelCls}>Contact name</label>
            <input
              value={form.contactName}
              onChange={e => update('contactName', e.target.value)}
              placeholder="Jane Smith"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                inputMode="email"
                value={form.contactEmail}
                onChange={e => update('contactEmail', e.target.value)}
                placeholder="jane@acme.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                inputMode="tel"
                value={form.contactPhone}
                onChange={e => update('contactPhone', e.target.value)}
                placeholder="(555) 123-4567"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Products <span className="text-gray-400 font-normal">· select all that apply</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LEAD_PRODUCTS.map(p => {
                const active = form.products.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleProduct(p)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-[8px] border text-xs font-medium transition-colors ${
                      active
                        ? 'border-brand bg-brand-50 text-brand-hover'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {PRODUCT_ICONS[p]}
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Monthly volume</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  inputMode="decimal"
                  value={form.monthlyVolume}
                  onChange={e => update('monthlyVolume', e.target.value.replace(/[^0-9.,]/g, ''))}
                  placeholder="50,000"
                  className={inputCls + ' pl-7'}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select
                value={form.priority}
                onChange={e => update('priority', e.target.value as Lead['priority'])}
                className={inputCls}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Owner</label>
            <select
              value={form.owner}
              onChange={e => update('owner', e.target.value)}
              className={inputCls}
            >
              {OWNERS.map(a => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>
              Notes <span className="text-gray-400 font-normal">· optional</span>
            </label>
            <textarea
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              rows={2}
              placeholder="Anything worth remembering…"
              className={inputCls + ' resize-none'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button icon={<Plus />} onClick={handleSubmit}>
            Create lead
          </Button>
        </div>
      </div>
    </div>
  );
}
