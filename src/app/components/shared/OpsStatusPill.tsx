import React from 'react';

/**
 * Lightweight pill for the operations modules (MCA, Merchant Services,
 * AI Billing). Accepts any string status and maps to a tone — defaults
 * to neutral so we never throw on unknown values that arrive from the
 * backend.
 */
type Tone = 'success' | 'info' | 'warn' | 'danger' | 'neutral' | 'progress';

const toneStyles: Record<Tone, string> = {
  success: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  info: 'text-blue-700 bg-blue-50 border-blue-200',
  warn: 'text-amber-700 bg-amber-50 border-amber-200',
  danger: 'text-red-700 bg-red-50 border-red-200',
  neutral: 'text-gray-700 bg-gray-50 border-gray-200',
  progress: 'text-indigo-700 bg-indigo-50 border-indigo-200',
};

const STATUS_TONE_MAP: Record<string, Tone> = {
  // generic
  draft: 'neutral',
  pending: 'warn',
  approved: 'success',
  paid: 'success',
  funded: 'success',
  active: 'success',
  current: 'success',
  won: 'success',
  converted: 'success',
  in_review: 'progress',
  processing: 'progress',
  shipped: 'progress',
  signed: 'progress',
  wire_queued: 'progress',
  wire_sent: 'progress',
  representment: 'progress',
  evidence_submitted: 'progress',
  evidence_pending: 'warn',
  past_due: 'danger',
  delinquent: 'danger',
  defaulted: 'danger',
  charged_off: 'danger',
  failed: 'danger',
  declined: 'danger',
  lost: 'danger',
  void: 'danger',
  uncollectible: 'danger',
  on_hold: 'warn',
  open: 'info',
  hard_outreach: 'warn',
  soft_outreach: 'info',
  workout: 'progress',
  legal: 'danger',
  recovered: 'success',
  withdrawn: 'neutral',
  expired: 'neutral',
  inactive: 'neutral',
  closed: 'neutral',
};

function formatLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface OpsStatusPillProps {
  status: string;
  tone?: Tone;
  className?: string;
}

export function OpsStatusPill({ status, tone, className = '' }: OpsStatusPillProps) {
  const resolvedTone = tone ?? STATUS_TONE_MAP[status] ?? 'neutral';
  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-md px-2 py-0.5 text-[11px] font-semibold ${toneStyles[resolvedTone]} ${className}`}
    >
      {formatLabel(status)}
    </span>
  );
}
