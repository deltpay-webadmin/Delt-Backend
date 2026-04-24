/**
 * NewLeadFlow — 3-step Stripe-style onboarding for new leads.
 */

import React, { useState } from 'react';
import {
  OnboardingFlow,
  TextField,
  SelectField,
  TextArea,
  RadioCards,
  ReviewCard,
  ReviewRow,
} from './OnboardingFlow';
import { leadActions, type Lead } from '../crmStore';

const INDUSTRIES = [
  'Food & Beverage',
  'Retail',
  'Automotive',
  'Health & Wellness',
  'Technology',
  'Construction',
  'Beauty & Salon',
  'Home Services',
  'Professional Services',
  'Other',
];

const SOURCES = [
  'Website Inquiry',
  'Referral',
  'Cold Outbound',
  'Partner',
  'Event',
  'Other',
];

const AGENTS = ['Sarah Johnson', 'Michael Chen', 'James Miller', 'Unassigned'];

export interface NewLeadFlowProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (lead: Lead) => void;
}

export function NewLeadFlow({ open, onClose, onCreated }: NewLeadFlowProps) {
  const [form, setForm] = useState({
    businessName: '',
    industry: 'Food & Beverage',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    type: 'MCA' as Lead['type'],
    source: 'Website Inquiry',
    monthlySales: '',
    amountRequested: '',
    assignedAgent: 'Sarah Johnson',
    priority: 'Medium' as Lead['priority'],
    notes: '',
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <OnboardingFlow
      open={open}
      onClose={onClose}
      title="New lead"
      subtitle="Capture a new sales opportunity."
      submitLabel="Create lead"
      steps={[
        {
          title: 'Business',
          description: 'Tell us about the prospect.',
          validate: () => (form.businessName.trim() ? true : 'Business name is required.'),
          render: () => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <TextField
                  label="Business name"
                  value={form.businessName}
                  onChange={v => update('businessName', v)}
                  placeholder="Acme Bakery LLC"
                  autoFocus
                />
              </div>
              <SelectField
                label="Industry"
                value={form.industry}
                onChange={v => update('industry', v)}
                options={INDUSTRIES}
              />
              <SelectField
                label="Source"
                value={form.source}
                onChange={v => update('source', v)}
                options={SOURCES}
              />
              <TextField
                label="Monthly sales"
                value={form.monthlySales}
                onChange={v => update('monthlySales', v)}
                placeholder="50,000"
                prefix="$"
                inputMode="decimal"
                optional
              />
              <TextField
                label="Amount requested"
                value={form.amountRequested}
                onChange={v => update('amountRequested', v)}
                placeholder="100,000"
                prefix="$"
                inputMode="decimal"
                optional
              />
            </div>
          ),
        },
        {
          title: 'Contact',
          description: 'Who do we reach, and what product fits?',
          validate: () => {
            if (!form.contactName.trim()) return 'Contact name is required.';
            if (form.contactEmail && !form.contactEmail.includes('@'))
              return 'Enter a valid email.';
            return true;
          },
          render: () => (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <TextField
                    label="Contact name"
                    value={form.contactName}
                    onChange={v => update('contactName', v)}
                    placeholder="Jane Smith"
                    autoFocus
                  />
                </div>
                <TextField
                  label="Email"
                  value={form.contactEmail}
                  onChange={v => update('contactEmail', v)}
                  placeholder="jane@acme.com"
                  type="email"
                  inputMode="email"
                />
                <TextField
                  label="Phone"
                  value={form.contactPhone}
                  onChange={v => update('contactPhone', v)}
                  placeholder="(555) 123-4567"
                  inputMode="tel"
                  optional
                />
                <SelectField
                  label="Assigned agent"
                  value={form.assignedAgent}
                  onChange={v => update('assignedAgent', v)}
                  options={AGENTS}
                />
                <SelectField
                  label="Priority"
                  value={form.priority}
                  onChange={v => update('priority', v as Lead['priority'])}
                  options={['High', 'Medium', 'Low']}
                />
              </div>

              <RadioCards<Lead['type']>
                label="Product interest"
                value={form.type}
                onChange={v => update('type', v)}
                options={[
                  { value: 'MCA', label: 'MCA', description: 'Merchant cash advance.' },
                  { value: 'Residual', label: 'Residual', description: 'Residual buyout.' },
                  { value: 'Leasing', label: 'Leasing', description: 'Equipment lease.' },
                ]}
              />
            </div>
          ),
        },
        {
          title: 'Review',
          render: () => (
            <div className="space-y-3">
              <ReviewCard title="Business">
                <ReviewRow label="Name" value={form.businessName} />
                <ReviewRow label="Industry" value={form.industry} />
                <ReviewRow label="Source" value={form.source} />
                <ReviewRow
                  label="Monthly sales"
                  value={form.monthlySales ? `$${form.monthlySales}` : ''}
                />
                <ReviewRow
                  label="Amount requested"
                  value={form.amountRequested ? `$${form.amountRequested}` : ''}
                />
              </ReviewCard>
              <ReviewCard title="Contact">
                <ReviewRow label="Name" value={form.contactName} />
                <ReviewRow label="Email" value={form.contactEmail} />
                <ReviewRow label="Phone" value={form.contactPhone} />
                <ReviewRow label="Agent" value={form.assignedAgent} />
                <ReviewRow label="Priority" value={form.priority} />
                <ReviewRow label="Product" value={form.type} />
              </ReviewCard>
              <TextArea
                label="Notes"
                value={form.notes}
                onChange={v => update('notes', v)}
                placeholder="Any context worth saving\u2026"
                optional
              />
            </div>
          ),
        },
      ]}
      onSubmit={async () => {
        const created = leadActions.create({
          businessName: form.businessName.trim(),
          industry: form.industry,
          contactName: form.contactName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          type: form.type,
          source: form.source,
          monthlySales: form.monthlySales ? `$${form.monthlySales}` : '',
          amountRequested: form.amountRequested ? `$${form.amountRequested}` : '',
          assignedAgent: form.assignedAgent,
          priority: form.priority,
          notes: form.notes,
        });
        onCreated?.(created);
        return {
          title: `${created.businessName} added`,
          description: 'Lead is in the pipeline. Follow-up tasks have been queued.',
          primaryCta: { label: 'View lead', onClick: onClose },
          secondaryCta: { label: 'Done', onClick: onClose },
        };
      }}
    />
  );
}
