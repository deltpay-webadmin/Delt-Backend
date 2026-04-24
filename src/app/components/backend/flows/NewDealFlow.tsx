/**
 * NewDealFlow — 3-step Stripe-style onboarding for new capital deals.
 *
 * Steps:
 *   1. Type & borrower   — product type, borrower name, agent
 *   2. Terms             — loan amount, factor rate, daily payment
 *   3. Review            — summary
 */

import React, { useMemo, useState } from 'react';
import { Wallet, Briefcase, TrendingUp } from 'lucide-react';
import {
  OnboardingFlow,
  TextField,
  SelectField,
  TextArea,
  RadioCards,
  ReviewCard,
  ReviewRow,
} from './OnboardingFlow';
import { dealActions, type Deal, type DealType } from '../crmStore';

const AGENTS = ['Marcus J.', 'Sarah K.', 'Michael Chen', 'James Miller', 'Unassigned'];

const fmtMoney = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export interface NewDealFlowProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (d: Deal) => void;
  /** Optional pre-fill of the borrower name (e.g., when launched from a merchant row). */
  initialBorrower?: string;
}

export function NewDealFlow({ open, onClose, onCreated, initialBorrower }: NewDealFlowProps) {
  const [form, setForm] = useState({
    type: 'MCA' as DealType,
    borrower: initialBorrower || '',
    agent: 'Marcus J.',
    loanAmountStr: '50000',
    rateStr: '1.35',
    termDaysStr: '150',
    notes: '',
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const loan = Number(form.loanAmountStr) || 0;
  const rate = Number(form.rateStr) || 0;
  const termDays = Math.max(Number(form.termDaysStr) || 1, 1);
  const repayment = Math.round(loan * rate);
  const dailyPayment = useMemo(() => Math.round(repayment / termDays), [repayment, termDays]);

  return (
    <OnboardingFlow
      open={open}
      onClose={onClose}
      title="New deal"
      subtitle="Originate a new capital deal."
      submitLabel="Create deal"
      steps={[
        {
          title: 'Type & borrower',
          description: 'What kind of deal is this, and who\u2019s it with?',
          validate: () => (form.borrower.trim() ? true : 'Borrower is required.'),
          render: () => (
            <div className="space-y-4">
              <RadioCards<DealType>
                label="Deal type"
                value={form.type}
                onChange={v => update('type', v)}
                options={[
                  {
                    value: 'MCA',
                    label: 'Merchant Cash Advance',
                    description: 'Revenue-based repayment; holdback from daily sales.',
                    icon: <Wallet className="w-4 h-4" />,
                  },
                  {
                    value: 'Lease',
                    label: 'Equipment Lease',
                    description: 'Fixed-term lease for business equipment.',
                    icon: <Briefcase className="w-4 h-4" />,
                  },
                  {
                    value: 'Residual',
                    label: 'Residual Buyout',
                    description: 'Upfront cash against future processing residuals.',
                    icon: <TrendingUp className="w-4 h-4" />,
                  },
                ]}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <TextField
                    label="Borrower"
                    value={form.borrower}
                    onChange={v => update('borrower', v)}
                    placeholder="Metro Diner Group"
                    autoFocus
                  />
                </div>
                <SelectField
                  label="Assigned agent"
                  value={form.agent}
                  onChange={v => update('agent', v)}
                  options={AGENTS}
                />
              </div>
            </div>
          ),
        },
        {
          title: 'Terms',
          description: 'Funding amount, factor rate, and schedule.',
          validate: () => {
            if (loan <= 0) return 'Enter a loan amount greater than $0.';
            if (rate <= 1) return 'Factor rate must be greater than 1.0.';
            if (termDays < 30) return 'Term must be at least 30 days.';
            return true;
          },
          render: () => (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextField
                  label="Loan amount"
                  value={form.loanAmountStr}
                  onChange={v => update('loanAmountStr', v.replace(/[^0-9.]/g, ''))}
                  prefix="$"
                  inputMode="decimal"
                  autoFocus
                />
                <TextField
                  label="Factor rate"
                  value={form.rateStr}
                  onChange={v => update('rateStr', v.replace(/[^0-9.]/g, ''))}
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
              </div>

              <div className="rounded-[10px] border border-gray-200 bg-gray-50/60 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Computed terms
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] text-gray-500">Total repayment</div>
                    <div className="text-[15px] font-semibold text-gray-900 mt-0.5">
                      {fmtMoney(repayment)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Daily payment</div>
                    <div className="text-[15px] font-semibold text-gray-900 mt-0.5">
                      {fmtMoney(dailyPayment)}
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
              <ReviewCard title="Deal">
                <ReviewRow label="Type" value={form.type} />
                <ReviewRow label="Borrower" value={form.borrower} />
                <ReviewRow label="Agent" value={form.agent} />
              </ReviewCard>
              <ReviewCard title="Terms">
                <ReviewRow label="Loan amount" value={fmtMoney(loan)} />
                <ReviewRow label="Factor rate" value={`${rate.toFixed(2)}x`} />
                <ReviewRow label="Term" value={`${termDays} days`} />
                <ReviewRow label="Total repayment" value={fmtMoney(repayment)} />
                <ReviewRow label="Daily payment" value={fmtMoney(dailyPayment)} />
              </ReviewCard>
              <TextArea
                label="Notes"
                value={form.notes}
                onChange={v => update('notes', v)}
                placeholder="Context for the funding committee\u2026"
                optional
              />
            </div>
          ),
        },
      ]}
      onSubmit={async () => {
        const created = dealActions.create({
          type: form.type,
          borrower: form.borrower.trim(),
          agent: form.agent,
          loanAmount: loan,
          rate,
          repaymentAmount: repayment,
          outstanding: repayment,
          collected: 0,
          dailyPayment,
          status: 'Current',
          notes: form.notes,
        });
        onCreated?.(created);
        return {
          title: `Deal ${created.id} created`,
          description: `${fmtMoney(loan)} funded to ${created.borrower}. ACH will initiate next business day.`,
          primaryCta: { label: 'View deal', onClick: onClose },
          secondaryCta: { label: 'Done', onClick: onClose },
        };
      }}
    />
  );
}
