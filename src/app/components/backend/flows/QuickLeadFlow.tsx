/**
 * QuickLeadFlow — fast single-screen lead capture.
 *
 * The default "New Lead" experience for both admin and agent views:
 * one screen, four required keystrokes minimum (business name), smart
 * defaults for everything else, saves straight to Supabase through
 * leadActions.create. "Create & add another" supports rapid entry.
 *
 * The full 8-step KYB intake (NewLeadFlow) stays one click away for
 * when a complete application is being taken.
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, ArrowRight, CreditCard, HandCoins, Store } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { leadActions, type Lead } from '../crmStore';
import { useAuth } from '../../../auth/AuthContext';

const SOURCES = [
  'Website Inquiry',
  'Meta Ads',
  'Referral',
  'Cold Outbound',
  'Partner',
  'Event',
  'Trade Show',
  'Other',
];

const AGENTS = ['Sarah Johnson', 'Michael Chen', 'James Miller', 'Unassigned'];

const PRODUCT_TYPES: { value: Lead['type']; label: string; icon: React.ElementType }[] = [
  { value: 'Processing', label: 'Processing', icon: CreditCard },
  { value: 'MCA', label: 'MCA', icon: HandCoins },
  { value: 'Leasing', label: 'Leasing', icon: Store },
];

export interface QuickLeadFlowProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (lead: Lead) => void;
  /** Open the full KYB application instead. */
  onOpenFullApplication?: () => void;
}

interface QuickForm {
  businessName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  type: Lead['type'];
  monthlySales: string;
  source: string;
  assignedAgent: string;
  priority: Lead['priority'];
  notes: string;
}

export function QuickLeadFlow({ open, onClose, onCreated, onOpenFullApplication }: QuickLeadFlowProps) {
  const { profile } = useAuth();

  // Agents default new leads to themselves; admins to Unassigned.
  const defaultAgent =
    profile && (profile.role === 'agent' || profile.role === 'employee')
      ? profile.name
      : 'Unassigned';

  const emptyForm = (): QuickForm => ({
    businessName: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    type: 'Processing',
    monthlySales: '',
    source: 'Website Inquiry',
    assignedAgent: defaultAgent,
    priority: 'Medium',
    notes: '',
  });

  const [form, setForm] = useState<QuickForm>(emptyForm);
  const [showNotes, setShowNotes] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof QuickForm>(k: K, v: QuickForm[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setShowNotes(false);
      setCreatedCount(0);
      setTimeout(() => firstFieldRef.current?.focus(), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (addAnother: boolean) => {
    if (!form.businessName.trim()) {
      toast.error('Business name is required');
      firstFieldRef.current?.focus();
      return;
    }
    if (form.contactEmail && !form.contactEmail.includes('@')) {
      toast.error('Enter a valid email or leave it blank');
      return;
    }

    const created = leadActions.create({
      businessName: form.businessName.trim(),
      contactName: form.contactName.trim(),
      contactPhone: form.contactPhone.trim(),
      contactEmail: form.contactEmail.trim(),
      type: form.type,
      monthlySales: form.monthlySales ? `$${form.monthlySales.replace(/^\$/, '')}` : '',
      source: form.source,
      assignedAgent: form.assignedAgent,
      priority: form.priority,
      notes: form.notes.trim(),
    });

    onCreated?.(created);
    toast.success(`Lead "${created.businessName}" created`);

    if (addAnother) {
      const keepSource = form.source;
      const keepAgent = form.assignedAgent;
      setForm({ ...emptyForm(), source: keepSource, assignedAgent: keepAgent });
      setCreatedCount(c => c + 1);
      firstFieldRef.current?.focus();
    } else {
      onClose();
    }
  };

  const agentOptions =
    profile && !AGENTS.includes(profile.name) ? [profile.name, ...AGENTS] : AGENTS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">New Lead</h3>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {createdCount > 0
                ? `${createdCount} added this session`
                : 'Quick capture — details can be added later.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-[6px]">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={e => {
            e.preventDefault();
            submit(false);
          }}
          className="px-5 py-4 space-y-3 max-h-[65vh] overflow-y-auto"
        >
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1">
              Business name <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstFieldRef}
              value={form.businessName}
              onChange={e => update('businessName', e.target.value)}
              placeholder="Acme Bakery"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Contact name</label>
              <input
                value={form.contactName}
                onChange={e => update('contactName', e.target.value)}
                placeholder="Jane Smith"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Phone</label>
              <input
                value={form.contactPhone}
                onChange={e => update('contactPhone', e.target.value)}
                placeholder="(555) 123-4567"
                inputMode="tel"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1">Email</label>
            <input
              value={form.contactEmail}
              onChange={e => update('contactEmail', e.target.value)}
              placeholder="jane@acme.com"
              type="email"
              inputMode="email"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1">Product interest</label>
            <div className="grid grid-cols-3 gap-2">
              {PRODUCT_TYPES.map(p => {
                const Icon = p.icon;
                const active = form.type === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => update('type', p.value)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-[6px] border text-[12px] font-medium transition-colors ${
                      active
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Monthly volume</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  value={form.monthlySales}
                  onChange={e => update('monthlySales', e.target.value.replace(/[^0-9.,]/g, ''))}
                  placeholder="50,000"
                  inputMode="decimal"
                  className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Source</label>
              <select
                value={form.source}
                onChange={e => update('source', e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {SOURCES.map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Assigned to</label>
              <select
                value={form.assignedAgent}
                onChange={e => update('assignedAgent', e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {agentOptions.map(a => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={e => update('priority', e.target.value as Lead['priority'])}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>

          {showNotes ? (
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => update('notes', e.target.value)}
                rows={2}
                placeholder="Any context worth saving…"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNotes(true)}
              className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium"
            >
              + Add a note
            </button>
          )}
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => submit(true)}
              className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-[6px] hover:bg-indigo-100 transition-colors"
            >
              Create & add another
            </button>
            <button
              type="button"
              onClick={() => submit(false)}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-[6px] hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Create Lead
            </button>
          </div>
          {onOpenFullApplication && (
            <button
              type="button"
              onClick={onOpenFullApplication}
              className="w-full flex items-center justify-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-700 transition-colors"
            >
              Taking a full application? Open the complete KYB intake
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
