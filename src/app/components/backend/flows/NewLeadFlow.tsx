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

import React, { useState } from 'react';
import { X, Plus, CreditCard, HandCoins, Store } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { leadActions, type Lead } from '../crmStore';

const AGENTS = ['Sarah Johnson', 'Michael Chen', 'James Miller', 'Unassigned'];

const TYPES: { value: Lead['type']; label: string; icon: React.ReactNode }[] = [
  { value: 'Processing', label: 'Processing', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'MCA', label: 'MCA', icon: <HandCoins className="w-4 h-4" /> },
  { value: 'Leasing', label: 'Leasing', icon: <Store className="w-4 h-4" /> },
];

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

export interface NewLeadFlowProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (lead: Lead) => void;
}

export function NewLeadFlow({ open, onClose, onCreated }: NewLeadFlowProps) {
  const [form, setForm] = useState({
    businessName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    type: 'Processing' as Lead['type'],
    monthlyVolume: '',
    assignedAgent: 'Sarah Johnson',
    priority: 'Medium' as Lead['priority'],
    notes: '',
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const reset = () =>
    setForm({
      businessName: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      type: 'Processing',
      monthlyVolume: '',
      assignedAgent: 'Sarah Johnson',
      priority: 'Medium',
      notes: '',
    });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!form.businessName.trim()) {
      toast.error('Business name is required');
      return;
    }
    const created = leadActions.create({
      businessName: form.businessName.trim(),
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      type: form.type,
      source: 'Manual',
      monthlySales: money(form.monthlyVolume),
      score: quickScore(form.monthlyVolume),
      assignedAgent: form.assignedAgent,
      priority: form.priority,
      notes: form.notes.trim(),
    });
    reset();
    onCreated?.(created);
  };

  if (!open) return null;

  const inputCls =
    'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500';
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
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-[6px] transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
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
            <label className={labelCls}>Product interest</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(t => {
                const active = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update('type', t.value)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-[8px] border text-xs font-medium transition-colors ${
                      active
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {t.icon}
                    {t.label}
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
              value={form.assignedAgent}
              onChange={e => update('assignedAgent', e.target.value)}
              className={inputCls}
            >
              {AGENTS.map(a => (
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
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-[6px] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-[6px] hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create lead
          </button>
        </div>
      </div>
    </div>
  );
}
