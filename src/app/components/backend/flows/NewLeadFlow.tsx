/**
 * NewLeadFlow — Stripe-style KYB onboarding for new merchant-services leads.
 *
 * Eight-step progressive-disclosure wizard mirroring Stripe Connect onboarding,
 * tailored for merchant services (processing, MCA, leasing):
 *   1. Business   — legal entity, MCC, tax ID, address
 *   2. Rep        — controlling signer: name, DOB, SSN last-4, ownership %
 *   3. Owners     — additional beneficial owners (25%+), repeater
 *   4. Processing — volume, avg/high ticket, CP/CNP mix, current processor
 *   5. Funding    — optional capital request
 *   6. Bank       — DDA on file, verification method
 *   7. Documents  — processing statements, voided check, ID (drag-drop)
 *   8. Assign+Review — agent/source/priority, attestation, final review
 *
 * All sensitive values (SSN, tax ID) are captured as last-4 only to keep the
 * lead pipeline PCI/PII-light. Full collection happens during underwriting.
 */

import React, { useMemo, useState } from 'react';
import { Briefcase, CreditCard, HandCoins, Store } from 'lucide-react';
import {
  OnboardingFlow,
  TextField,
  SelectField,
  TextArea,
  RadioCards,
  ReviewCard,
  ReviewRow,
  Checkbox,
  Slider,
  FileDrop,
  RepeaterSection,
  type UploadedFile,
} from './OnboardingFlow';
import {
  leadActions,
  deriveLeadTag,
  LEAD_PLAYBOOK,
  type Lead,
  type LeadTag,
  type AcceptsCards,
  type OpenToSwitch,
  type KybIntake,
  type BeneficialOwner,
  type BusinessStructure,
} from '../crmStore';

// ─── Reference data ────────────────────────────────────────────

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
  'Hospitality',
  'E-commerce',
  'Other',
];

// Common merchant-services MCC codes (abbreviated).
const MCC_OPTIONS = [
  { value: '5812', label: '5812 — Eating Places & Restaurants' },
  { value: '5411', label: '5411 — Grocery Stores & Supermarkets' },
  { value: '5311', label: '5311 — Department Stores' },
  { value: '5541', label: '5541 — Service Stations' },
  { value: '5732', label: '5732 — Electronics Stores' },
  { value: '7230', label: '7230 — Beauty & Barber Shops' },
  { value: '7538', label: '7538 — Auto Service Shops' },
  { value: '7372', label: '7372 — Computer Services / SaaS' },
  { value: '5999', label: '5999 — Misc. Retail' },
  { value: '8099', label: '8099 — Health Services, Other' },
  { value: '1520', label: '1520 — General Contractors' },
  { value: 'other', label: 'Other / not listed' },
];

const SOURCES = [
  'Website Inquiry',
  'Referral',
  'Cold Outbound',
  'Partner',
  'Event',
  'Trade Show',
  'Other',
];

const AGENTS = ['Sarah Johnson', 'Michael Chen', 'James Miller', 'Unassigned'];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

const PROCESSORS = [
  'None / New Business',
  'Stripe',
  'Square',
  'Clover',
  'Toast',
  'First Data / Fiserv',
  'Chase Paymentech',
  'Worldpay',
  'Elavon',
  'TSYS',
  'Heartland',
  'Other',
];

// ─── Helpers ───────────────────────────────────────────────────

const emptyOwner = (): BeneficialOwner => ({
  id: `own-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  firstName: '',
  lastName: '',
  title: '',
  email: '',
  ownershipPct: 25,
  ssnLast4: '',
});

function formatMoneyLabel(v: string): string {
  if (!v) return '';
  return `$${v}`;
}

function calcLeadScore(kyb: KybIntake): number {
  // Simple merchant-services heuristic: volume, tenure, processor tenure, chargebacks.
  let score = 50;
  const vol = Number((kyb.processing.monthlyVolume || '').replace(/[^0-9.]/g, '')) || 0;
  if (vol >= 100_000) score += 20;
  else if (vol >= 30_000) score += 12;
  else if (vol >= 10_000) score += 5;

  const months = Number(kyb.funding.timeInBusinessMonths) || 0;
  if (months >= 24) score += 10;
  else if (months >= 12) score += 5;

  if (kyb.processing.currentProcessor && kyb.processing.currentProcessor !== 'None / New Business')
    score += 5;

  if (kyb.processing.hasChargebacks) score -= 8;
  if (kyb.representative.ownershipPct >= 50) score += 3;
  if (kyb.bank.accountLast4) score += 5;
  if (kyb.documents.length >= 3) score += 7;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Component ─────────────────────────────────────────────────

export interface NewLeadFlowProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (lead: Lead) => void;
}

export function NewLeadFlow({ open, onClose, onCreated }: NewLeadFlowProps) {
  // Single form object — one source of truth across all steps.
  const [form, setForm] = useState(() => ({
    // Step 1 — Business
    legalName: '',
    dba: '',
    structure: 'LLC' as BusinessStructure,
    taxIdType: 'EIN' as 'EIN' | 'SSN',
    taxIdLast4: '',
    stateOfIncorporation: 'NY',
    yearFounded: '',
    website: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'NY',
    postalCode: '',
    mcc: '5812',
    industry: 'Food & Beverage',
    productDescription: '',

    // Step 2 — Representative (controller)
    repFirstName: '',
    repLastName: '',
    repTitle: 'Owner',
    repEmail: '',
    repPhone: '',
    repDob: '',
    repSsnLast4: '',
    repOwnershipPct: 100,
    repIsOwner: true,
    repIsController: true,
    repAddressLine1: '',
    repCity: '',
    repState: 'NY',
    repPostalCode: '',

    // Step 3 — Additional owners
    additionalOwners: [] as BeneficialOwner[],

    // Step 4 — Processing profile
    productType: 'Processing' as Lead['type'],
    monthlyVolume: '',
    avgTicket: '',
    highTicket: '',
    cardPresentPct: 70,
    currentProcessor: 'None / New Business',
    currentEffectiveRate: '',
    acceptsAmex: true,
    hasChargebacks: false,
    chargebackRatePct: '',
    seasonalBusiness: false,

    // Step 5 — Funding request (optional)
    fundingRequested: false,
    fundingAmount: '',
    fundingUseOfFunds: '',
    timeInBusinessMonths: '',

    // Step 6 — Bank on file
    bankName: '',
    bankAccountHolder: '',
    bankRoutingLast4: '',
    bankAccountLast4: '',
    bankAccountType: 'Checking' as 'Checking' | 'Savings',
    bankVerification: 'Plaid' as 'Plaid' | 'Voided Check' | 'Bank Letter' | 'Manual',

    // Step 7 — Documents
    docsProcessing: [] as UploadedFile[],
    docsBank: [] as UploadedFile[],
    docsVoidedCheck: [] as UploadedFile[],
    docsId: [] as UploadedFile[],
    docsOther: [] as UploadedFile[],

    // Step 8 — Assignment + attestation
    source: 'Website Inquiry',
    assignedAgent: 'Sarah Johnson',
    priority: 'Medium' as Lead['priority'],
    notes: '',
    attestCertified: false,
    attestAuthorized: false,
    attestSignedByName: '',

    // Pipeline tagging — mirrors the /get-funded gate questions.
    // Auto-derived from acceptsCards + openToSwitch but agent can override.
    acceptsCards: '' as AcceptsCards | '',
    openToSwitch: '' as OpenToSwitch | '',
    leadTagOverride: '' as LeadTag | '',
  }));

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  // Stable derived values
  const ownersTotalPct = useMemo(() => {
    const others = form.additionalOwners.reduce((s, o) => s + (Number(o.ownershipPct) || 0), 0);
    return (Number(form.repOwnershipPct) || 0) + others;
  }, [form.repOwnershipPct, form.additionalOwners]);

  // ─── Submit handler (assembles KybIntake) ─────────────────────
  const handleSubmit = async () => {
    const documents = [
      ...form.docsProcessing.map(f => ({ ...f, kind: 'Processing Statement' as const })),
      ...form.docsBank.map(f => ({ ...f, kind: 'Bank Statement' as const })),
      ...form.docsVoidedCheck.map(f => ({ ...f, kind: 'Voided Check' as const })),
      ...form.docsId.map(f => ({ ...f, kind: 'Drivers License' as const })),
      ...form.docsOther.map(f => ({ ...f, kind: 'Other' as const })),
    ].map(d => ({
      id: d.id,
      kind: d.kind,
      filename: d.name,
      size: d.size,
      uploadedAt: new Date().toISOString(),
    }));

    const kyb: KybIntake = {
      business: {
        legalName: form.legalName.trim(),
        dba: form.dba.trim(),
        structure: form.structure,
        taxIdType: form.taxIdType,
        taxIdLast4: form.taxIdLast4,
        stateOfIncorporation: form.stateOfIncorporation,
        yearFounded: form.yearFounded,
        website: form.website,
        phone: form.phone,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        mcc: form.mcc,
        industry: form.industry,
        productDescription: form.productDescription,
      },
      representative: {
        firstName: form.repFirstName,
        lastName: form.repLastName,
        title: form.repTitle,
        email: form.repEmail,
        phone: form.repPhone,
        dobMasked: form.repDob,
        ssnLast4: form.repSsnLast4,
        ownershipPct: Number(form.repOwnershipPct) || 0,
        isOwner: form.repIsOwner,
        isController: form.repIsController,
        addressLine1: form.repAddressLine1,
        city: form.repCity,
        state: form.repState,
        postalCode: form.repPostalCode,
      },
      owners: form.additionalOwners,
      processing: {
        monthlyVolume: form.monthlyVolume,
        avgTicket: form.avgTicket,
        highTicket: form.highTicket,
        cardPresentPct: form.cardPresentPct,
        currentProcessor: form.currentProcessor,
        currentEffectiveRate: form.currentEffectiveRate,
        acceptsAmex: form.acceptsAmex,
        hasChargebacks: form.hasChargebacks,
        chargebackRatePct: form.chargebackRatePct,
        seasonalBusiness: form.seasonalBusiness,
      },
      funding: {
        requested: form.fundingRequested,
        amount: form.fundingAmount,
        useOfFunds: form.fundingUseOfFunds,
        timeInBusinessMonths: form.timeInBusinessMonths,
      },
      bank: {
        bankName: form.bankName,
        accountHolder: form.bankAccountHolder,
        routingLast4: form.bankRoutingLast4,
        accountLast4: form.bankAccountLast4,
        accountType: form.bankAccountType,
        verificationMethod: form.bankVerification,
      },
      documents,
      attestation: {
        certifiedAccurate: form.attestCertified,
        authorizedToSign: form.attestAuthorized,
        signedAt: new Date().toISOString(),
        signedByName: form.attestSignedByName,
      },
    };

    const score = calcLeadScore(kyb);

    // Derive (or honor manual override of) the pipeline tag.
    const derivedTag = deriveLeadTag(
      form.acceptsCards || undefined,
      form.openToSwitch || undefined,
    );
    const finalTag: LeadTag | null = (form.leadTagOverride as LeadTag) || derivedTag;
    const playbook = finalTag ? LEAD_PLAYBOOK[finalTag] : null;

    const numericMonthlyVolume = Number((form.monthlyVolume || '').replace(/[^0-9.]/g, '')) || undefined;
    const numericAvgTicket     = Number((form.avgTicket     || '').replace(/[^0-9.]/g, '')) || undefined;
    const numericCurrentRate   = Number(form.currentEffectiveRate) || undefined;

    const created = leadActions.create({
      businessName: form.dba.trim() || form.legalName.trim(),
      industry: form.industry,
      contactName: `${form.repFirstName} ${form.repLastName}`.trim(),
      contactEmail: form.repEmail,
      contactPhone: form.repPhone,
      type: form.productType,
      source: form.source,
      monthlySales: formatMoneyLabel(form.monthlyVolume),
      amountRequested: form.fundingRequested ? formatMoneyLabel(form.fundingAmount) : '',
      score,
      assignedAgent: form.assignedAgent,
      // If we have a tag, route via playbook unless the agent picked a stricter priority.
      priority: playbook ? (form.priority || playbook.priority) : form.priority,
      stage: playbook?.initialStage,
      notes: form.notes,
      kyb,
      leadTag: finalTag,
      acceptsCards: (form.acceptsCards || undefined) as AcceptsCards | undefined,
      openToSwitch: (form.openToSwitch || undefined) as OpenToSwitch | undefined,
      monthlyVolumeEstimate: numericMonthlyVolume,
      avgTicket: numericAvgTicket,
      currentRate: numericCurrentRate,
    });

    onCreated?.(created);
    return {
      title: `${created.businessName} added`,
      description:
        'Lead is in the pipeline. Underwriting has been notified and follow-up tasks are queued.',
      primaryCta: { label: 'View lead', onClick: onClose },
      secondaryCta: { label: 'Done', onClick: onClose },
    };
  };

  return (
    <OnboardingFlow
      open={open}
      onClose={onClose}
      title="New lead"
      subtitle="Capture a new merchant-services opportunity."
      submitLabel="Create lead"
      steps={[
        // ─── Step 1: Business ────────────────────────────────
        {
          title: 'Business',
          description: 'Tell us about the legal entity.',
          validate: () => {
            if (!form.legalName.trim()) return 'Legal business name is required.';
            if (!form.taxIdLast4 || form.taxIdLast4.length !== 4)
              return 'Enter the last 4 digits of the tax ID.';
            if (!form.addressLine1.trim()) return 'Business address is required.';
            if (!form.city.trim() || !form.postalCode.trim())
              return 'City and ZIP are required.';
            return true;
          },
          render: () => (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <TextField
                    label="Legal business name"
                    value={form.legalName}
                    onChange={v => update('legalName', v)}
                    placeholder="Acme Bakery LLC"
                    autoFocus
                  />
                </div>
                <TextField
                  label="DBA / Doing business as"
                  value={form.dba}
                  onChange={v => update('dba', v)}
                  placeholder="Acme Bakery"
                  optional
                />
                <SelectField
                  label="Business structure"
                  value={form.structure}
                  onChange={v => update('structure', v as BusinessStructure)}
                  options={[
                    'Sole Proprietorship',
                    'LLC',
                    'Partnership',
                    'C Corporation',
                    'S Corporation',
                    'Non-Profit',
                    'Other',
                  ]}
                />
                <SelectField
                  label="Tax ID type"
                  value={form.taxIdType}
                  onChange={v => update('taxIdType', v as 'EIN' | 'SSN')}
                  options={['EIN', 'SSN']}
                />
                <TextField
                  label={`${form.taxIdType} (last 4)`}
                  value={form.taxIdLast4}
                  onChange={v => update('taxIdLast4', v.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  inputMode="numeric"
                />
                <SelectField
                  label="State of incorporation"
                  value={form.stateOfIncorporation}
                  onChange={v => update('stateOfIncorporation', v)}
                  options={US_STATES}
                />
                <TextField
                  label="Year founded"
                  value={form.yearFounded}
                  onChange={v => update('yearFounded', v.replace(/\D/g, '').slice(0, 4))}
                  placeholder="2018"
                  inputMode="numeric"
                  optional
                />
                <TextField
                  label="Website"
                  value={form.website}
                  onChange={v => update('website', v)}
                  placeholder="acme.com"
                  optional
                />
                <TextField
                  label="Business phone"
                  value={form.phone}
                  onChange={v => update('phone', v)}
                  placeholder="(555) 123-4567"
                  inputMode="tel"
                  optional
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectField
                  label="Industry"
                  value={form.industry}
                  onChange={v => update('industry', v)}
                  options={INDUSTRIES}
                />
                <SelectField
                  label="MCC (merchant category)"
                  value={form.mcc}
                  onChange={v => update('mcc', v)}
                  options={MCC_OPTIONS}
                />
              </div>

              <TextArea
                label="Product / service description"
                value={form.productDescription}
                onChange={v => update('productDescription', v)}
                placeholder="What does the business sell?"
                rows={2}
                optional
              />

              <div className="pt-2 border-t border-gray-100">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Business address
                </div>
                <div className="space-y-3">
                  <TextField
                    label="Street address"
                    value={form.addressLine1}
                    onChange={v => update('addressLine1', v)}
                    placeholder="123 Main St"
                  />
                  <TextField
                    label="Suite / Apt"
                    value={form.addressLine2}
                    onChange={v => update('addressLine2', v)}
                    placeholder="Suite 200"
                    optional
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <TextField
                      label="City"
                      value={form.city}
                      onChange={v => update('city', v)}
                      placeholder="New York"
                    />
                    <SelectField
                      label="State"
                      value={form.state}
                      onChange={v => update('state', v)}
                      options={US_STATES}
                    />
                    <TextField
                      label="ZIP"
                      value={form.postalCode}
                      onChange={v => update('postalCode', v.replace(/[^0-9-]/g, '').slice(0, 10))}
                      placeholder="10001"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>
            </div>
          ),
        },

        // ─── Step 2: Representative ─────────────────────────
        {
          title: 'Rep',
          description: 'Primary signer and controlling person.',
          validate: () => {
            if (!form.repFirstName.trim() || !form.repLastName.trim())
              return 'Representative name is required.';
            if (!form.repEmail.includes('@')) return 'Enter a valid representative email.';
            if (form.repSsnLast4.length !== 4) return 'SSN last 4 is required.';
            if (!form.repDob) return 'Date of birth is required.';
            return true;
          },
          render: () => (
            <div className="space-y-4">
              <div className="text-[12px] text-gray-500 bg-amber-50 border border-amber-100 rounded-[8px] px-3 py-2.5">
                This person is the primary signer. Underwriting requires a controller
                who owns ≥25% or makes business decisions.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextField
                  label="First name"
                  value={form.repFirstName}
                  onChange={v => update('repFirstName', v)}
                  placeholder="Jane"
                  autoFocus
                />
                <TextField
                  label="Last name"
                  value={form.repLastName}
                  onChange={v => update('repLastName', v)}
                  placeholder="Smith"
                />
                <TextField
                  label="Title"
                  value={form.repTitle}
                  onChange={v => update('repTitle', v)}
                  placeholder="Owner / CEO"
                />
                <TextField
                  label="Date of birth"
                  value={form.repDob}
                  onChange={v => update('repDob', v)}
                  placeholder="MM/DD/YYYY"
                />
                <TextField
                  label="Email"
                  value={form.repEmail}
                  onChange={v => update('repEmail', v)}
                  placeholder="jane@acme.com"
                  type="email"
                  inputMode="email"
                />
                <TextField
                  label="Phone"
                  value={form.repPhone}
                  onChange={v => update('repPhone', v)}
                  placeholder="(555) 123-4567"
                  inputMode="tel"
                />
                <TextField
                  label="SSN (last 4)"
                  value={form.repSsnLast4}
                  onChange={v => update('repSsnLast4', v.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  inputMode="numeric"
                />
                <TextField
                  label="Ownership %"
                  value={String(form.repOwnershipPct)}
                  onChange={v => {
                    const n = Math.max(0, Math.min(100, Number(v.replace(/\D/g, '')) || 0));
                    update('repOwnershipPct', n);
                  }}
                  placeholder="100"
                  inputMode="numeric"
                  suffix="%"
                />
              </div>

              <div className="grid gap-2">
                <Checkbox
                  label="This person is a beneficial owner"
                  description="Owns 25% or more of the business."
                  checked={form.repIsOwner}
                  onChange={v => update('repIsOwner', v)}
                />
                <Checkbox
                  label="This person is the controller"
                  description="Authorized to sign on behalf of the business."
                  checked={form.repIsController}
                  onChange={v => update('repIsController', v)}
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Home address
                </div>
                <div className="space-y-3">
                  <TextField
                    label="Street address"
                    value={form.repAddressLine1}
                    onChange={v => update('repAddressLine1', v)}
                    placeholder="456 Home Ln"
                    optional
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <TextField
                      label="City"
                      value={form.repCity}
                      onChange={v => update('repCity', v)}
                      placeholder="Brooklyn"
                      optional
                    />
                    <SelectField
                      label="State"
                      value={form.repState}
                      onChange={v => update('repState', v)}
                      options={US_STATES}
                    />
                    <TextField
                      label="ZIP"
                      value={form.repPostalCode}
                      onChange={v =>
                        update('repPostalCode', v.replace(/[^0-9-]/g, '').slice(0, 10))
                      }
                      placeholder="11201"
                      inputMode="numeric"
                      optional
                    />
                  </div>
                </div>
              </div>
            </div>
          ),
        },

        // ─── Step 3: Additional owners ───────────────────────
        {
          title: 'Owners',
          description: 'Anyone else who owns 25% or more.',
          validate: () => {
            if (ownersTotalPct > 100)
              return `Ownership totals ${ownersTotalPct}%. Must not exceed 100%.`;
            for (const o of form.additionalOwners) {
              if (!o.firstName.trim() || !o.lastName.trim())
                return 'All owners need a first and last name.';
            }
            return true;
          },
          render: () => (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[12px] bg-gray-50 border border-gray-100 rounded-[8px] px-3 py-2.5">
                <span className="text-gray-600">Total ownership accounted for</span>
                <span
                  className={`font-semibold tabular-nums ${
                    ownersTotalPct > 100
                      ? 'text-red-600'
                      : ownersTotalPct < 76
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {ownersTotalPct}%
                </span>
              </div>

              <RepeaterSection
                items={form.additionalOwners}
                onAdd={() =>
                  update('additionalOwners', [...form.additionalOwners, emptyOwner()])
                }
                onRemove={id =>
                  update(
                    'additionalOwners',
                    form.additionalOwners.filter(o => o.id !== id),
                  )
                }
                addLabel="Add another owner"
                emptyHint="No additional owners? Skip to continue. Only owners holding 25% or more need to be listed."
                renderItem={(item) => {
                  const owner = form.additionalOwners.find(o => o.id === item.id)!;
                  const patch = (p: Partial<BeneficialOwner>) =>
                    update(
                      'additionalOwners',
                      form.additionalOwners.map(o =>
                        o.id === owner.id ? { ...o, ...p } : o,
                      ),
                    );
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField
                        label="First name"
                        value={owner.firstName}
                        onChange={v => patch({ firstName: v })}
                        placeholder="Alex"
                      />
                      <TextField
                        label="Last name"
                        value={owner.lastName}
                        onChange={v => patch({ lastName: v })}
                        placeholder="Rivera"
                      />
                      <TextField
                        label="Title"
                        value={owner.title}
                        onChange={v => patch({ title: v })}
                        placeholder="Partner"
                        optional
                      />
                      <TextField
                        label="Email"
                        value={owner.email}
                        onChange={v => patch({ email: v })}
                        placeholder="alex@acme.com"
                        inputMode="email"
                        optional
                      />
                      <TextField
                        label="SSN (last 4)"
                        value={owner.ssnLast4}
                        onChange={v =>
                          patch({ ssnLast4: v.replace(/\D/g, '').slice(0, 4) })
                        }
                        placeholder="1234"
                        inputMode="numeric"
                      />
                      <TextField
                        label="Ownership %"
                        value={String(owner.ownershipPct)}
                        onChange={v => {
                          const n = Math.max(
                            0,
                            Math.min(100, Number(v.replace(/\D/g, '')) || 0),
                          );
                          patch({ ownershipPct: n });
                        }}
                        placeholder="25"
                        inputMode="numeric"
                        suffix="%"
                      />
                    </div>
                  );
                }}
              />
            </div>
          ),
        },

        // ─── Step 4: Processing profile ──────────────────────
        {
          title: 'Processing',
          description: 'Volume, tickets, and current processor.',
          validate: () => {
            if (!form.monthlyVolume.trim()) return 'Monthly processing volume is required.';
            if (!form.avgTicket.trim()) return 'Average ticket is required.';
            return true;
          },
          render: () => (
            <div className="space-y-4">
              <RadioCards<Lead['type']>
                label="Product interest"
                value={form.productType}
                onChange={v => update('productType', v)}
                options={[
                  {
                    value: 'Processing',
                    label: 'Processing',
                    description: 'Card acceptance / merchant account.',
                    icon: <CreditCard className="w-4 h-4" />,
                  },
                  {
                    value: 'MCA',
                    label: 'MCA',
                    description: 'Merchant cash advance.',
                    icon: <HandCoins className="w-4 h-4" />,
                  },
                  {
                    value: 'Leasing',
                    label: 'Leasing',
                    description: 'Equipment / terminal lease.',
                    icon: <Store className="w-4 h-4" />,
                  },
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextField
                  label="Monthly volume"
                  value={form.monthlyVolume}
                  onChange={v => update('monthlyVolume', v.replace(/[^0-9.,]/g, ''))}
                  placeholder="50,000"
                  prefix="$"
                  inputMode="decimal"
                />
                <TextField
                  label="Average ticket"
                  value={form.avgTicket}
                  onChange={v => update('avgTicket', v.replace(/[^0-9.,]/g, ''))}
                  placeholder="75"
                  prefix="$"
                  inputMode="decimal"
                />
                <TextField
                  label="High ticket"
                  value={form.highTicket}
                  onChange={v => update('highTicket', v.replace(/[^0-9.,]/g, ''))}
                  placeholder="500"
                  prefix="$"
                  inputMode="decimal"
                  optional
                />
                <TextField
                  label="Current effective rate"
                  value={form.currentEffectiveRate}
                  onChange={v => update('currentEffectiveRate', v.replace(/[^0-9.]/g, ''))}
                  placeholder="2.75"
                  suffix="%"
                  inputMode="decimal"
                  optional
                />
              </div>

              <Slider
                label="Card-present mix"
                value={form.cardPresentPct}
                onChange={v => update('cardPresentPct', v)}
                suffix={`% CP / ${100 - form.cardPresentPct}% CNP`}
              />

              <SelectField
                label="Current processor"
                value={form.currentProcessor}
                onChange={v => update('currentProcessor', v)}
                options={PROCESSORS}
              />

              <div className="grid gap-2">
                <Checkbox
                  label="Accepts American Express"
                  description="Needs Amex opt-blue or direct MID."
                  checked={form.acceptsAmex}
                  onChange={v => update('acceptsAmex', v)}
                />
                <Checkbox
                  label="Has had chargebacks in the last 12 months"
                  checked={form.hasChargebacks}
                  onChange={v => update('hasChargebacks', v)}
                />
                {form.hasChargebacks && (
                  <TextField
                    label="Chargeback ratio"
                    value={form.chargebackRatePct}
                    onChange={v => update('chargebackRatePct', v.replace(/[^0-9.]/g, ''))}
                    placeholder="0.45"
                    suffix="%"
                    inputMode="decimal"
                  />
                )}
                <Checkbox
                  label="Seasonal business"
                  description="Volume concentrated in certain months."
                  checked={form.seasonalBusiness}
                  onChange={v => update('seasonalBusiness', v)}
                />
              </div>
            </div>
          ),
        },

        // ─── Step 5: Funding (optional) ──────────────────────
        {
          title: 'Funding',
          description: 'Capital request — optional.',
          validate: () => {
            if (form.fundingRequested) {
              if (!form.fundingAmount.trim()) return 'Enter the amount requested.';
              if (!form.timeInBusinessMonths.trim())
                return 'Time in business is required for funding.';
            }
            return true;
          },
          render: () => (
            <div className="space-y-4">
              <Checkbox
                label="Prospect wants working capital"
                description="Enable to collect funding-specific fields."
                checked={form.fundingRequested}
                onChange={v => update('fundingRequested', v)}
              />

              {form.fundingRequested && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TextField
                      label="Amount requested"
                      value={form.fundingAmount}
                      onChange={v => update('fundingAmount', v.replace(/[^0-9.,]/g, ''))}
                      placeholder="100,000"
                      prefix="$"
                      inputMode="decimal"
                    />
                    <TextField
                      label="Time in business (months)"
                      value={form.timeInBusinessMonths}
                      onChange={v =>
                        update('timeInBusinessMonths', v.replace(/\D/g, '').slice(0, 3))
                      }
                      placeholder="24"
                      inputMode="numeric"
                    />
                  </div>
                  <TextArea
                    label="Use of funds"
                    value={form.fundingUseOfFunds}
                    onChange={v => update('fundingUseOfFunds', v)}
                    placeholder="Equipment purchase, inventory, expansion…"
                    rows={3}
                  />
                </div>
              )}

              {!form.fundingRequested && (
                <div className="text-[12px] text-gray-500 bg-gray-50 border border-gray-100 rounded-[6px] px-3 py-3">
                  Skip this step if the prospect isn't requesting capital right now.
                  You can add a funding request later from the lead detail view.
                </div>
              )}
            </div>
          ),
        },

        // ─── Step 6: Bank on file ────────────────────────────
        {
          title: 'Bank',
          description: 'Settlement account and verification.',
          validate: () => {
            if (!form.bankName.trim()) return 'Bank name is required.';
            if (form.bankRoutingLast4.length !== 4) return 'Routing last 4 required.';
            if (form.bankAccountLast4.length < 4) return 'Account last 4 required.';
            return true;
          },
          render: () => (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextField
                  label="Bank name"
                  value={form.bankName}
                  onChange={v => update('bankName', v)}
                  placeholder="Chase, Bank of America, …"
                  autoFocus
                />
                <TextField
                  label="Account holder name"
                  value={form.bankAccountHolder}
                  onChange={v => update('bankAccountHolder', v)}
                  placeholder="Acme Bakery LLC"
                />
                <TextField
                  label="Routing (last 4)"
                  value={form.bankRoutingLast4}
                  onChange={v =>
                    update('bankRoutingLast4', v.replace(/\D/g, '').slice(0, 4))
                  }
                  placeholder="1234"
                  inputMode="numeric"
                />
                <TextField
                  label="Account (last 4)"
                  value={form.bankAccountLast4}
                  onChange={v =>
                    update('bankAccountLast4', v.replace(/\D/g, '').slice(0, 4))
                  }
                  placeholder="5678"
                  inputMode="numeric"
                />
                <SelectField
                  label="Account type"
                  value={form.bankAccountType}
                  onChange={v => update('bankAccountType', v as 'Checking' | 'Savings')}
                  options={['Checking', 'Savings']}
                />
                <SelectField
                  label="Verification method"
                  value={form.bankVerification}
                  onChange={v =>
                    update(
                      'bankVerification',
                      v as 'Plaid' | 'Voided Check' | 'Bank Letter' | 'Manual',
                    )
                  }
                  options={['Plaid', 'Voided Check', 'Bank Letter', 'Manual']}
                />
              </div>
              <div className="text-[12px] text-gray-500 bg-gray-50 border border-gray-100 rounded-[6px] px-3 py-2.5">
                Only the last 4 digits are stored with the lead. Full account and
                routing numbers are collected securely during underwriting.
              </div>
            </div>
          ),
        },

        // ─── Step 7: Documents ───────────────────────────────
        {
          title: 'Docs',
          description: 'Upload supporting documentation.',
          render: () => (
            <div className="space-y-4">
              <FileDrop
                label="Most recent 3 months of processing statements"
                files={form.docsProcessing}
                onAdd={f => update('docsProcessing', [...form.docsProcessing, f])}
                onRemove={id =>
                  update(
                    'docsProcessing',
                    form.docsProcessing.filter(x => x.id !== id),
                  )
                }
                hint="PDFs preferred. Skip if new business."
                optional
              />
              <FileDrop
                label="Most recent 3 months of bank statements"
                files={form.docsBank}
                onAdd={f => update('docsBank', [...form.docsBank, f])}
                onRemove={id =>
                  update('docsBank', form.docsBank.filter(x => x.id !== id))
                }
                optional
              />
              <FileDrop
                label="Voided check"
                files={form.docsVoidedCheck}
                onAdd={f => update('docsVoidedCheck', [...form.docsVoidedCheck, f])}
                onRemove={id =>
                  update(
                    'docsVoidedCheck',
                    form.docsVoidedCheck.filter(x => x.id !== id),
                  )
                }
                optional
              />
              <FileDrop
                label="Driver's license (controller)"
                files={form.docsId}
                onAdd={f => update('docsId', [...form.docsId, f])}
                onRemove={id =>
                  update('docsId', form.docsId.filter(x => x.id !== id))
                }
                accept=".jpg,.jpeg,.png,.pdf"
                optional
              />
              <FileDrop
                label="Other supporting docs"
                files={form.docsOther}
                onAdd={f => update('docsOther', [...form.docsOther, f])}
                onRemove={id =>
                  update('docsOther', form.docsOther.filter(x => x.id !== id))
                }
                optional
              />
            </div>
          ),
        },

        // ─── Step 8: Assign & Review ─────────────────────────
        {
          title: 'Review',
          description: 'Assign ownership and confirm.',
          validate: () => {
            if (!form.attestCertified || !form.attestAuthorized)
              return 'Both attestations are required.';
            if (!form.attestSignedByName.trim())
              return 'Type your name to sign.';
            return true;
          },
          render: () => (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectField
                  label="Assigned agent"
                  value={form.assignedAgent}
                  onChange={v => update('assignedAgent', v)}
                  options={AGENTS}
                />
                <SelectField
                  label="Source"
                  value={form.source}
                  onChange={v => update('source', v)}
                  options={SOURCES}
                />
                <SelectField
                  label="Priority"
                  value={form.priority}
                  onChange={v => update('priority', v as Lead['priority'])}
                  options={['High', 'Medium', 'Low']}
                />
              </div>

              {/* Pipeline tagging — mirrors /get-funded qualifying questions. */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 space-y-3">
                <div>
                  <p className="text-sm font-medium text-emerald-900">Pipeline segment</p>
                  <p className="text-xs text-emerald-800/70">
                    Mirrors the two questions on /get-funded. Auto-derives the segment so the lead routes to the right queue.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SelectField
                    label="Currently accepts cards?"
                    value={form.acceptsCards || ''}
                    onChange={v => update('acceptsCards', (v || '') as AcceptsCards | '')}
                    options={[
                      { label: '— select —', value: '' },
                      { label: 'Yes — with another processor', value: 'yes' },
                      { label: 'No — not yet accepting cards', value: 'no' },
                      { label: 'Already a Delt merchant', value: 'already-delt' },
                    ]}
                  />
                  {form.acceptsCards === 'yes' && (
                    <SelectField
                      label="Open to switching to Delt?"
                      value={form.openToSwitch || ''}
                      onChange={v => update('openToSwitch', (v || '') as OpenToSwitch | '')}
                      options={[
                        { label: '— select —', value: '' },
                        { label: 'Yes', value: 'yes' },
                        { label: 'Maybe', value: 'maybe' },
                        { label: 'No — capital only', value: 'no' },
                      ]}
                    />
                  )}
                </div>
                {(() => {
                  const derived = deriveLeadTag(
                    form.acceptsCards || undefined,
                    form.openToSwitch || undefined,
                  );
                  const tag = (form.leadTagOverride as LeadTag) || derived;
                  const pb = tag ? LEAD_PLAYBOOK[tag] : null;
                  return (
                    <div className="flex items-start gap-3 rounded-md bg-white border border-emerald-200 p-2.5">
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-wider text-emerald-700/70">Derived segment</p>
                        <p className="text-sm font-medium text-gray-900">{tag || 'Not enough signal yet'}</p>
                        {pb && (
                          <p className="text-xs text-gray-600 mt-0.5">
                            Routes to <span className="font-medium">{pb.queue}</span> · {pb.priority} priority · starts at {pb.initialStage}
                          </p>
                        )}
                      </div>
                      <SelectField
                        label="Override"
                        value={form.leadTagOverride || ''}
                        onChange={v => update('leadTagOverride', (v || '') as LeadTag | '')}
                        options={[
                          { label: 'Auto', value: '' },
                          { label: 'MS+CAP-Switcher', value: 'MS+CAP-Switcher' },
                          { label: 'CAP-Only', value: 'CAP-Only' },
                          { label: 'MS+CAP-NewMerchant', value: 'MS+CAP-NewMerchant' },
                          { label: 'Existing-Customer-Upsell', value: 'Existing-Customer-Upsell' },
                        ]}
                      />
                    </div>
                  );
                })()}
              </div>

              <TextArea
                label="Internal notes"
                value={form.notes}
                onChange={v => update('notes', v)}
                placeholder="Any context worth saving…"
                optional
              />

              <div className="pt-2 space-y-2">
                <ReviewCard title="Business">
                  <ReviewRow label="Legal name" value={form.legalName} />
                  <ReviewRow label="DBA" value={form.dba} />
                  <ReviewRow label="Structure" value={form.structure} />
                  <ReviewRow
                    label="Tax ID"
                    value={
                      form.taxIdLast4
                        ? `${form.taxIdType} ••• ${form.taxIdLast4}`
                        : ''
                    }
                  />
                  <ReviewRow label="Industry" value={form.industry} />
                  <ReviewRow label="MCC" value={form.mcc} />
                  <ReviewRow
                    label="Address"
                    value={
                      form.addressLine1
                        ? `${form.addressLine1}, ${form.city}, ${form.state} ${form.postalCode}`
                        : ''
                    }
                  />
                </ReviewCard>

                <ReviewCard title="Controller">
                  <ReviewRow
                    label="Name"
                    value={`${form.repFirstName} ${form.repLastName}`.trim()}
                  />
                  <ReviewRow label="Title" value={form.repTitle} />
                  <ReviewRow label="Email" value={form.repEmail} />
                  <ReviewRow label="Phone" value={form.repPhone} />
                  <ReviewRow
                    label="Ownership"
                    value={`${form.repOwnershipPct}%`}
                  />
                </ReviewCard>

                {form.additionalOwners.length > 0 && (
                  <ReviewCard title={`Additional owners (${form.additionalOwners.length})`}>
                    {form.additionalOwners.map(o => (
                      <ReviewRow
                        key={o.id}
                        label={`${o.firstName} ${o.lastName}`.trim() || 'Owner'}
                        value={`${o.ownershipPct}% · ${o.title || '—'}`}
                      />
                    ))}
                  </ReviewCard>
                )}

                <ReviewCard title="Processing">
                  <ReviewRow label="Product" value={form.productType} />
                  <ReviewRow
                    label="Monthly volume"
                    value={formatMoneyLabel(form.monthlyVolume)}
                  />
                  <ReviewRow
                    label="Avg ticket"
                    value={formatMoneyLabel(form.avgTicket)}
                  />
                  <ReviewRow
                    label="CP / CNP"
                    value={`${form.cardPresentPct}% / ${100 - form.cardPresentPct}%`}
                  />
                  <ReviewRow label="Current processor" value={form.currentProcessor} />
                </ReviewCard>

                {form.fundingRequested && (
                  <ReviewCard title="Funding request">
                    <ReviewRow
                      label="Amount"
                      value={formatMoneyLabel(form.fundingAmount)}
                    />
                    <ReviewRow
                      label="Time in business"
                      value={
                        form.timeInBusinessMonths
                          ? `${form.timeInBusinessMonths} months`
                          : ''
                      }
                    />
                  </ReviewCard>
                )}

                <ReviewCard title="Bank on file">
                  <ReviewRow label="Bank" value={form.bankName} />
                  <ReviewRow
                    label="Account"
                    value={
                      form.bankAccountLast4
                        ? `${form.bankAccountType} ••• ${form.bankAccountLast4}`
                        : ''
                    }
                  />
                  <ReviewRow label="Verification" value={form.bankVerification} />
                </ReviewCard>

                <ReviewCard
                  title={`Documents (${
                    form.docsProcessing.length +
                    form.docsBank.length +
                    form.docsVoidedCheck.length +
                    form.docsId.length +
                    form.docsOther.length
                  })`}
                >
                  <ReviewRow
                    label="Processing statements"
                    value={form.docsProcessing.length || ''}
                  />
                  <ReviewRow label="Bank statements" value={form.docsBank.length || ''} />
                  <ReviewRow
                    label="Voided check"
                    value={form.docsVoidedCheck.length || ''}
                  />
                  <ReviewRow label="ID" value={form.docsId.length || ''} />
                </ReviewCard>
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Attestation
                </div>
                <Checkbox
                  label="Information is accurate"
                  description="I certify the information provided is accurate and complete."
                  checked={form.attestCertified}
                  onChange={v => update('attestCertified', v)}
                />
                <Checkbox
                  label="Authorized to sign"
                  description="I'm authorized to submit this application for the business."
                  checked={form.attestAuthorized}
                  onChange={v => update('attestAuthorized', v)}
                />
                <TextField
                  label="Type your full name to sign"
                  value={form.attestSignedByName}
                  onChange={v => update('attestSignedByName', v)}
                  placeholder="Jane Smith"
                />
              </div>
            </div>
          ),
        },
      ]}
      onSubmit={handleSubmit}
    />
  );
}
