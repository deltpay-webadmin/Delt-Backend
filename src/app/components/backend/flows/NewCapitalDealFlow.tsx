/**
 * NewCapitalDealFlow — 3-step onboarding for new MCA / capital deals.
 *
 * Persists to Supabase via capitalActions.create (falls back to in-memory
 * if no Supabase env vars). Mirrors NewDealFlow.tsx structure but writes
 * to the capital_deals table.
 *
 * Steps:
 *   1. Merchant & channel   — name, industry, channel (self vs Fundomate)
 *   2. Terms                — funded amount, factor, term days, holdback,
 *                             (commission rate if Fundomate)
 *   3. Review               — summary + optional notes
 */

import React, { useMemo, useState } from 'react';
import { Building2, Handshake } from 'lucide-react';
import {
  OnboardingFlow,
  TextField,
  SelectField,
  TextArea,
  RadioCards,
  ReviewCard,
  ReviewRow,
} from './OnboardingFlow';
import { capitalActions, type CapitalDeal, type CapitalChannel } from '../capitalStore';

const INDUSTRIES = [
  'Restaurant',
  'Retail',
  'E-commerce',
  'Auto',
  'Healthcare',
  'Beauty',
  'Services',
  'Construction',
  'Wholesale',
  'Other',
];

const fmtMoney = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export interface NewCapitalDealFlowProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (d: CapitalDeal) => void;
  initialMerchant?: string;
}

export function NewCapitalDealFlow({
  open,
  onClose,
  onCreated,
  initialMerchant,
}: NewCapitalDealFlowProps) {
  const [form, setForm] = useState({
    merchant: initialMerchant || '',
    type: 'Restaurant',
    channel: 'self' as CapitalChannel,
    fundedAmtStr: '50000',
    factorStr: '1.35',
    termDaysStr: '150',
    holdbackStr: '12',
    commissionRateStr: '8',
    notes: '',
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const fundedAmt = Number(form.fundedAmtStr) || 0;
  const factor = Number(form.factorStr) || 0;
  const termDays = Math.max(Number(form.termDaysStr) || 1, 1);
  const holdback = Number(form.holdbackStr) || 0;
  const commissionRate = Number(form.commissionRateStr) || 0;
  const totalOwed = Math.round(fundedAmt * factor);
  const dailyDebit = useMemo(() => Math.round(totalOwed / termDays), [totalOwed, termDays]);

  return (
    <OnboardingFlow
      open={open}
      onClose={onClose}
      title="New capital deal"
      subtitle="Originate and fund a new MCA position."
      submitLabel="Fund deal"
      steps={[
        {
          title: 'Merchant & channel',
          description: 'Who is this deal with, and where did it come from?',
          validate: () => (form.merchant.trim() ? true : 'Merchant name is required.'),
          render: () => (
            <div className="space-y-4">
              <RadioCards<CapitalChannel>
                label="Channel"
                value={form.channel}
                onChange={v => update('channel', v)}
                options={[
                  {
                    value: 'self',
                    label: 'Self-funded',
                    description: 'Delt is the lender of record. Full economics.',
                    icon: <Building2 className="w-4 h-4" />,
                  },
                  {
                    value: 'fundomate',
                    label: 'Fundomate (referral)',
                    description: 'Referred to Fundomate; Delt earns a commission.',
                    icon: <Handshake className="w-4 h-4" />,
                  },
                ]}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <TextField
                    label="Merchant"
                    value={form.merchant}
                    onChange={v => update('merchant', v)}
                    placeholder="Metro Diner Group"
                    autoFocus
                  />
                </div>
                <SelectField
                  label="Industry"
                  value={form.type}
                  onChange={v => update('type', v)}
                  options={INDUSTRIES}
                />
              </div>
            </div>
          ),
        },
        {
          title: 'Terms',
          description: 'Funding amount, factor rate, schedule, and holdback.',
          validate: () => {
            if (fundedAmt <= 0) return 'Enter a funded amount greater than $0.';
            if (factor <= 1) return 'Factor rate must be greater than 1.0.';
            if (termDays < 30) return 'Term must be at least 30 days.';
            if (holdback <= 0 || holdback > 50)
              return 'Holdback must be between 1% and 50%.';
            if (form.channel === 'fundomate' && (commissionRate <= 0 || commissionRate > 100))
              return 'Commission rate must be between 1% and 100%.';
            return true;
          },
          render: () => (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextField
                  label="Funded amount"
                  value={form.fundedAmtStr}
                  onChange={v => update('fundedAmtStr', v.replace(/[^0-9.]/g, ''))}
                  prefix="$"
                  inputMode="decimal"
                  autoFocus
                />
                <TextField
                  label="Factor rate"
                  value={form.factorStr}
                  onChange={v => update('factorStr', v.replace(/[^0-9.]/g, ''))}
                  placeholder="1.35"
                  inputMode="decimal"
                />
                <TextField
                  label="Term"
                  value={form.termDaysStr}
                  onChange={v => update('termDaysStr', v.replace(/[^0-9]/g, ''))}
                  suffix="days"
                  inputMode="numeric"
                />
                <TextField
                  label="Holdback"
                  value={form.holdbackStr}
                  onChange={v => update('holdbackStr', v.replace(/[^0-9.]/g, ''))}
                  suffix="%"
                  inputMode="decimal"
                />
                {form.channel === 'fundomate' && (
                  <TextField
                    label="Commission rate"
                    value={form.commissionRateStr}
                    onChange={v => update('commissionRateStr', v.replace(/[^0-9.]/g, ''))}
                    suffix="%"
                    inputMode="decimal"
                  />
                )}
              </div>

              <div className="rounded-[8px] border border-gray-200 bg-gray-50/60 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Computed terms
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] text-gray-500">Total owed</div>
                    <div className="text-[15px] font-semibold text-gray-900 mt-0.5">
                      {fmtMoney(totalOwed)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Daily debit</div>
                    <div className="text-[15px] font-semibold text-gray-900 mt-0.5">
                      {fmtMoney(dailyDebit)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          title: 'Review',
          description: 'Confirm terms before funding.',
          render: () => (
            <div className="space-y-3">
              <ReviewCard title="Merchant">
                <ReviewRow label="Name" value={form.merchant} />
                <ReviewRow label="Industry" value={form.type} />
                <ReviewRow
                  label="Channel"
                  value={form.channel === 'fundomate' ? 'Fundomate (referral)' : 'Self-funded'}
                />
              </ReviewCard>
              <ReviewCard title="Terms">
                <ReviewRow label="Funded amount" value={fmtMoney(fundedAmt)} />
                <ReviewRow label="Factor rate" value={`${factor.toFixed(2)}x`} />
                <ReviewRow label="Term" value={`${termDays} days`} />
                <ReviewRow label="Holdback" value={`${holdback}%`} />
                <ReviewRow label="Total owed" value={fmtMoney(totalOwed)} />
                <ReviewRow label="Daily debit" value={fmtMoney(dailyDebit)} />
                {form.channel === 'fundomate' && (
                  <ReviewRow label="Commission rate" value={`${commissionRate}%`} />
                )}
              </ReviewCard>
              <TextArea
                label="Notes"
                value={form.notes}
                onChange={v => update('notes', v)}
                placeholder="Underwriting context, bank flags, stipulations…"
                optional
              />
            </div>
          ),
        },
      ]}
      onSubmit={async () => {
        const today = new Date().toISOString().slice(0, 10);
        const created = capitalActions.create({
          merchant: form.merchant.trim(),
          type: form.type,
          channel: form.channel,
          funded: today,
          fundedAmt,
          factor,
          totalOwed,
          collected: 0,
          holdback,
          dailyDebit,
          status: 'active',
          daysInDefault: 0,
          lastPayment: today,
          achStatus: 'current',
          avg7d: 0,
          avg30d: 0,
          stackCount: 0,
          renewalEligible: false,
          uccFiled: '',
          uccExpires: '',
          costOfCapitalPaid: 0,
          referralCommission:
            form.channel === 'fundomate'
              ? Math.round(fundedAmt * (commissionRate / 100))
              : 0,
          commissionRate: form.channel === 'fundomate' ? commissionRate : undefined,
          commissionPaid: form.channel === 'fundomate' ? false : undefined,
          notes: form.notes.trim() || undefined,
        });
        onCreated?.(created);
        return {
          title: `Deal ${created.id} funded`,
          description: `${fmtMoney(fundedAmt)} to ${created.merchant}. Daily debit of ${fmtMoney(
            dailyDebit,
          )} begins next business day.`,
          primaryCta: { label: 'View portfolio', onClick: onClose },
          secondaryCta: { label: 'Done', onClick: onClose },
        };
      }}
    />
  );
}
