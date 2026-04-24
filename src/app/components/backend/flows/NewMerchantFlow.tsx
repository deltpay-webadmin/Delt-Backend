/**
 * NewMerchantFlow — Stripe-inspired 3-step onboarding for new merchants.
 *
 * Steps:
 *   1. Business   — name, industry, state, EIN, website
 *   2. Contact    — primary contact, plan & product selection
 *   3. Review     — summary + create
 */

import React, { useState } from 'react';
import { Building2, User, CheckCircle2 } from 'lucide-react';
import {
  OnboardingFlow,
  TextField,
  SelectField,
  TextArea,
  RadioCards,
  ReviewCard,
  ReviewRow,
} from './OnboardingFlow';
import {
  merchantActions,
  type Merchant,
  type PlanTier,
} from '../crmStore';

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

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

const AGENTS = ['Sarah Johnson', 'Michael Chen', 'James Miller', 'Unassigned'];

export interface NewMerchantFlowProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (m: Merchant) => void;
}

export function NewMerchantFlow({ open, onClose, onCreated }: NewMerchantFlowProps) {
  const [form, setForm] = useState({
    name: '',
    industry: 'Food & Beverage',
    state: 'NY',
    ein: '',
    website: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    agent: 'Sarah Johnson',
    plan: 'Growth' as PlanTier,
    products: {
      processing: true,
      capital: false,
      website: false,
      lens: false,
    },
    notes: '',
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const toggleProduct = (k: keyof typeof form.products) =>
    setForm(f => ({ ...f, products: { ...f.products, [k]: !f.products[k] } }));

  const planFee: Record<PlanTier, number> = { Free: 0, Growth: 99, Custom: 199 };

  return (
    <OnboardingFlow
      open={open}
      onClose={onClose}
      title="Add merchant"
      subtitle="Onboard a new merchant into Delt."
      submitLabel="Create merchant"
      steps={[
        {
          title: 'Business',
          description: 'Legal business identity and location.',
          validate: () => (form.name.trim() ? true : 'Business name is required.'),
          render: () => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <TextField
                  label="Legal business name"
                  value={form.name}
                  onChange={v => update('name', v)}
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
                label="State"
                value={form.state}
                onChange={v => update('state', v)}
                options={STATES}
              />
              <TextField
                label="EIN"
                value={form.ein}
                onChange={v => update('ein', v)}
                placeholder="12-3456789"
                optional
              />
              <TextField
                label="Website"
                value={form.website}
                onChange={v => update('website', v)}
                placeholder="acmebakery.com"
                optional
              />
            </div>
          ),
        },
        {
          title: 'Contact & plan',
          description: 'Who to reach and what they\u2019re buying.',
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
                  value={form.agent}
                  onChange={v => update('agent', v)}
                  options={AGENTS}
                />
              </div>

              <RadioCards
                label="Plan"
                value={form.plan}
                onChange={v => update('plan', v)}
                options={[
                  { value: 'Free', label: 'Free', description: '$0/mo \u00b7 standard processing' },
                  { value: 'Growth', label: 'Growth', description: '$99/mo \u00b7 advanced tools' },
                  { value: 'Custom', label: 'Custom', description: '$199/mo \u00b7 full platform' },
                ]}
              />

              <div>
                <div className="text-[12px] font-medium text-gray-700 mb-1.5">Products</div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['processing', 'Processing'],
                      ['capital', 'Capital'],
                      ['website', 'Website'],
                      ['lens', 'Lens AI'],
                    ] as const
                  ).map(([key, label]) => {
                    const on = form.products[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleProduct(key)}
                        className={`flex items-center justify-between px-3 py-2 rounded-[6px] border text-[13px] font-medium transition-colors ${
                          on
                            ? 'border-brand bg-brand/[0.04] text-gray-900'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span>{label}</span>
                        <span
                          className={`w-4 h-4 rounded-[3px] border flex items-center justify-center ${
                            on ? 'bg-brand border-brand' : 'border-gray-300'
                          }`}
                        >
                          {on && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ),
        },
        {
          title: 'Review',
          description: 'Make sure everything looks right before creating.',
          render: () => (
            <div className="space-y-3">
              <ReviewCard title="Business">
                <ReviewRow label="Name" value={form.name} />
                <ReviewRow label="Industry" value={form.industry} />
                <ReviewRow label="State" value={form.state} />
                <ReviewRow label="EIN" value={form.ein} />
                <ReviewRow label="Website" value={form.website} />
              </ReviewCard>
              <ReviewCard title="Contact">
                <ReviewRow label="Name" value={form.contactName} />
                <ReviewRow label="Email" value={form.contactEmail} />
                <ReviewRow label="Phone" value={form.contactPhone} />
                <ReviewRow label="Agent" value={form.agent} />
              </ReviewCard>
              <ReviewCard title="Plan">
                <ReviewRow label="Tier" value={`${form.plan} \u00b7 $${planFee[form.plan]}/mo`} />
                <ReviewRow
                  label="Products"
                  value={
                    Object.entries(form.products)
                      .filter(([, on]) => on)
                      .map(([k]) => k[0].toUpperCase() + k.slice(1))
                      .join(', ') || 'None'
                  }
                />
              </ReviewCard>
              <TextArea
                label="Internal notes"
                value={form.notes}
                onChange={v => update('notes', v)}
                placeholder="Anything your team should know\u2026"
                optional
              />
            </div>
          ),
        },
      ]}
      onSubmit={async () => {
        const created = merchantActions.create({
          name: form.name.trim(),
          industry: form.industry,
          state: form.state,
          ein: form.ein,
          website: form.website,
          contactName: form.contactName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          agent: form.agent,
          plan: form.plan,
          monthlyFee: planFee[form.plan],
          products: form.products,
          status: 'Pending',
          notes: form.notes,
        });
        onCreated?.(created);
        return {
          title: `${created.name} created`,
          description: 'Merchant added. Processing account will provision within 5 minutes.',
          primaryCta: {
            label: 'View merchant',
            onClick: () => {
              onClose();
            },
          },
          secondaryCta: { label: 'Done', onClick: onClose },
        };
      }}
    />
  );
}
