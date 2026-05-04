/**
 * Websites & AI usage / billing taxonomy.
 *
 * Captures usage events (per-merchant, per-product), the products they
 * map to, billing events / invoices, and a usage-based KPI surface.
 *
 * Design intent: usage events are append-only and carry a stable `id`
 * so an external metering pipeline (e.g. Supabase function or a
 * dedicated worker) can ingest and roll them up into invoices.
 */

import type { AuditMeta, ImmutableEvent } from './audit';

// ── Products ────────────────────────────────────────────────────
export const AI_USAGE_PRODUCTS = [
  'website_hosting',
  'website_traffic',
  'lens_ai_chat',
  'lens_ai_completion',
  'lens_ai_embedding',
  'ai_phone_minutes',
  'ai_email_send',
] as const;
export type AiUsageProduct = (typeof AI_USAGE_PRODUCTS)[number];

export interface AiProduct {
  product: AiUsageProduct;
  label: string;
  description: string;
  meterUnit: string; // e.g. 'request', 'token', 'minute', 'GB'
  unitPriceCents: number;
  active: boolean;
}

export const AI_PRODUCTS: AiProduct[] = [
  { product: 'website_hosting', label: 'Website Hosting', description: 'Per-month hosting fee per published site.', meterUnit: 'site-month', unitPriceCents: 2_900, active: true },
  { product: 'website_traffic', label: 'Website Traffic', description: 'Bandwidth above included quota.', meterUnit: 'GB', unitPriceCents: 12, active: true },
  { product: 'lens_ai_chat', label: 'Lens AI — Chat', description: 'Conversational analytics queries.', meterUnit: '1k tokens', unitPriceCents: 30, active: true },
  { product: 'lens_ai_completion', label: 'Lens AI — Completion', description: 'Background completions for reports.', meterUnit: '1k tokens', unitPriceCents: 60, active: true },
  { product: 'lens_ai_embedding', label: 'Lens AI — Embedding', description: 'Document indexing.', meterUnit: '1k tokens', unitPriceCents: 4, active: true },
  { product: 'ai_phone_minutes', label: 'AI Voice Minutes', description: 'Outbound voice agent minutes.', meterUnit: 'minute', unitPriceCents: 8, active: true },
  { product: 'ai_email_send', label: 'AI Email Send', description: 'AI-personalized outbound email send.', meterUnit: 'email', unitPriceCents: 1, active: true },
];

// ── Usage events ────────────────────────────────────────────────
export interface UsageEvent extends ImmutableEvent {
  merchantId: string;
  product: AiUsageProduct;
  quantity: number;
  unitPriceCents: number;
  computedCostCents: number;
  // For idempotent ingestion from upstream meters.
  externalEventId?: string;
}

// ── Billing ────────────────────────────────────────────────────
export const INVOICE_STATUSES = [
  'draft',
  'open',
  'paid',
  'void',
  'past_due',
  'uncollectible',
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface InvoiceLine {
  product: AiUsageProduct;
  description: string;
  quantity: number;
  unitPriceCents: number;
  amountCents: number;
}

export interface Invoice extends AuditMeta {
  id: string;
  number: string;
  merchantId: string;
  merchantName: string;
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  amountDueCents: number;
  paidAt?: string;
  lines: InvoiceLine[];
}

export interface BillingEvent extends ImmutableEvent {
  merchantId: string;
  invoiceId?: string;
  type:
    | 'invoice.created'
    | 'invoice.finalized'
    | 'invoice.paid'
    | 'invoice.payment_failed'
    | 'invoice.refunded'
    | 'subscription.activated'
    | 'subscription.canceled';
  amountCents?: number;
}

// ── KPI snapshot ───────────────────────────────────────────────
export interface AiUsageKpis {
  activeMerchants: number;
  totalUsageEventsMtd: number;
  computedRevenueMtdCents: number;
  invoicedMtdCents: number;
  collectedMtdCents: number;
  outstandingCents: number;
  topProductByRevenue: AiUsageProduct;
  averageUsagePerMerchantCents: number;
}

// ── Mock data ──────────────────────────────────────────────────
export const MOCK_USAGE_EVENTS: UsageEvent[] = [
  {
    id: 'ue-001',
    occurredAt: '2026-05-04T11:18:00Z',
    actor: 'merchant:M-1001',
    type: 'usage',
    subjectType: 'merchant',
    subjectId: 'M-1001',
    payload: { tokens: 4200 },
    merchantId: 'M-1001',
    product: 'lens_ai_chat',
    quantity: 4.2, // 1k token units
    unitPriceCents: 30,
    computedCostCents: 126,
  },
  {
    id: 'ue-002',
    occurredAt: '2026-05-04T11:42:00Z',
    actor: 'merchant:M-1004',
    type: 'usage',
    subjectType: 'merchant',
    subjectId: 'M-1004',
    payload: { minutes: 12 },
    merchantId: 'M-1004',
    product: 'ai_phone_minutes',
    quantity: 12,
    unitPriceCents: 8,
    computedCostCents: 96,
  },
  {
    id: 'ue-003',
    occurredAt: '2026-05-04T08:00:00Z',
    actor: 'system.cron',
    type: 'usage',
    subjectType: 'merchant',
    subjectId: 'M-1001',
    payload: { sites: 1 },
    merchantId: 'M-1001',
    product: 'website_hosting',
    quantity: 1,
    unitPriceCents: 2_900,
    computedCostCents: 2_900,
  },
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    number: 'INV-2026-04-0001',
    merchantId: 'M-1001',
    merchantName: 'Riverside Diner',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    status: 'paid',
    subtotalCents: 8_400,
    taxCents: 0,
    totalCents: 8_400,
    amountDueCents: 0,
    paidAt: '2026-05-02T10:00:00Z',
    lines: [
      { product: 'website_hosting', description: 'Hosting — riversidediner.com', quantity: 1, unitPriceCents: 2_900, amountCents: 2_900 },
      { product: 'lens_ai_chat', description: 'Lens AI — Chat (April)', quantity: 184, unitPriceCents: 30, amountCents: 5_500 },
    ],
    createdAt: '2026-05-01T00:00:00Z',
    createdBy: 'system.billing',
    updatedAt: '2026-05-02T10:00:00Z',
    updatedBy: 'system.billing',
  },
  {
    id: 'inv-002',
    number: 'INV-2026-04-0002',
    merchantId: 'M-1004',
    merchantName: 'Sunrise Bakery',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    status: 'open',
    subtotalCents: 12_400,
    taxCents: 0,
    totalCents: 12_400,
    amountDueCents: 12_400,
    lines: [
      { product: 'website_hosting', description: 'Hosting — sunrise.bakery', quantity: 1, unitPriceCents: 2_900, amountCents: 2_900 },
      { product: 'ai_phone_minutes', description: 'AI Voice — April', quantity: 720, unitPriceCents: 8, amountCents: 5_760 },
      { product: 'ai_email_send', description: 'AI Email — April', quantity: 3_740, unitPriceCents: 1, amountCents: 3_740 },
    ],
    createdAt: '2026-05-01T00:00:00Z',
    createdBy: 'system.billing',
    updatedAt: '2026-05-01T00:00:00Z',
    updatedBy: 'system.billing',
  },
];

export const MOCK_BILLING_EVENTS: BillingEvent[] = [
  {
    id: 'be-001',
    occurredAt: '2026-05-01T00:00:00Z',
    actor: 'system.billing',
    type: 'invoice.created',
    subjectType: 'invoice',
    subjectId: 'inv-001',
    merchantId: 'M-1001',
    invoiceId: 'inv-001',
    amountCents: 8_400,
    payload: {},
  },
  {
    id: 'be-002',
    occurredAt: '2026-05-02T10:00:00Z',
    actor: 'system.billing',
    type: 'invoice.paid',
    subjectType: 'invoice',
    subjectId: 'inv-001',
    merchantId: 'M-1001',
    invoiceId: 'inv-001',
    amountCents: 8_400,
    payload: { method: 'ach' },
  },
];

export const MOCK_AI_USAGE_KPIS: AiUsageKpis = {
  activeMerchants: 86,
  totalUsageEventsMtd: 18_412,
  computedRevenueMtdCents: 1_842_000,
  invoicedMtdCents: 1_810_000,
  collectedMtdCents: 1_640_000,
  outstandingCents: 170_000,
  topProductByRevenue: 'lens_ai_chat',
  averageUsagePerMerchantCents: 21_400,
};
