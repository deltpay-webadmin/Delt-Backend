/**
 * ────────────────────────────────────────────────────────────
 * Capital store — Supabase-backed portfolio of MCA/Fundomate deals
 * ────────────────────────────────────────────────────────────
 * Powers the Merchants → Capital dashboard. Kept separate from the
 * leaner `Deal` model in crmStore so the portfolio can carry channel,
 * holdback, ACH state, UCC, stacking, renewal eligibility, etc.
 *
 * Behavior mirrors crmStore:
 *   • Pub/sub + React hook surface
 *   • First subscription triggers hydrate() against `capital_deals`
 *   • Realtime channel streams in multi-user updates
 *   • Optimistic local update on writes, rolled back on Supabase error
 *   • If Supabase env vars are missing, falls back to in-memory only
 *     (still functional, but data resets on reload)
 */

import { useSyncExternalStore } from 'react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../lib/supabase';

// ══════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════

export type CapitalDealStatus = 'active' | 'paid' | 'slow' | 'default';
export type CapitalChannel = 'self' | 'fundomate';
export type CapitalAchStatus = 'current' | 'completed' | 'nsf-retry' | 'suspended';

export type LoanPaymentCategory =
  | 'debit'
  | 'reversal'
  | 'personal_zelle'
  | 'lump'
  | 'bounce'
  | 'adjustment';

export interface LoanPayment {
  id: string;
  deal_id: string;
  payment_date: string;       // YYYY-MM-DD
  amount: number;             // signed: negative = reversal
  category: LoanPaymentCategory;
  notes: string | null;
}

export interface CapitalDeal {
  id: string;
  merchant: string;
  type: string;
  channel: CapitalChannel;
  funded: string;            // YYYY-MM-DD
  fundedAmt: number;
  factor: number;
  totalOwed: number;
  collected: number;
  holdback: number;          // %
  dailyDebit: number;
  status: CapitalDealStatus;
  daysInDefault: number;
  lastPayment: string;       // YYYY-MM-DD
  achStatus: CapitalAchStatus;
  avg7d: number;
  avg30d: number;
  stackCount: number;
  renewalEligible: boolean;
  uccFiled: string;          // YYYY-MM-DD
  uccExpires: string;        // YYYY-MM-DD
  costOfCapitalPaid: number;
  referralCommission: number;
  commissionRate?: number;
  commissionPaid?: boolean;
  notes?: string;
  // ── Ledger + profit-split fields (backfilled schema) ──
  signedDate?: string;
  dueDate?: string;
  weeklyPayment?: number;
  dailyPayment?: number;
  monthlyPayment?: number;
  commission?: number;
  balloon?: number;
  rep?: string;
  anshuPct?: number;
  patrickPct?: number;
  deltRetainedPct?: number;
  weeksBehind?: number;
  bounceCount?: number;
  fundingSources?: Record<string, number>;
  borrowingCostPct?: number;
  payments?: LoanPayment[];
}

interface CapitalState {
  deals: CapitalDeal[];
  isLoading: boolean;
  isOnline: boolean;
  lastError: string | null;
}

// ══════════════════════════════════════════════════════════════
// State + pub/sub
// ══════════════════════════════════════════════════════════════

let state: CapitalState = {
  deals: [],
  isLoading: true,
  isOnline: false,
  lastError: null,
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function set(patch: Partial<CapitalState>) {
  state = { ...state, ...patch };
  emit();
}

// ══════════════════════════════════════════════════════════════
// DB ↔ TS mapping
// ══════════════════════════════════════════════════════════════

function fromDb(r: any): CapitalDeal {
  return {
    id: r.id,
    merchant: r.merchant,
    type: r.type || 'Restaurant',
    channel: (r.channel as CapitalChannel) || 'self',
    funded: r.funded || new Date().toISOString().slice(0, 10),
    fundedAmt: Number(r.funded_amt) || 0,
    factor: Number(r.factor) || 1.35,
    totalOwed: Number(r.total_owed) || 0,
    collected: Number(r.collected) || 0,
    holdback: Number(r.holdback) || 12,
    dailyDebit: Number(r.daily_debit) || 0,
    status: (r.status as CapitalDealStatus) || 'active',
    daysInDefault: Number(r.days_in_default) || 0,
    lastPayment: r.last_payment || r.funded || '',
    achStatus: (r.ach_status as CapitalAchStatus) || 'current',
    avg7d: Number(r.avg_7d) || 0,
    avg30d: Number(r.avg_30d) || 0,
    stackCount: Number(r.stack_count) || 0,
    renewalEligible: !!r.renewal_eligible,
    uccFiled: r.ucc_filed || '',
    uccExpires: r.ucc_expires || '',
    costOfCapitalPaid: Number(r.cost_of_capital_paid) || 0,
    referralCommission: Number(r.referral_commission) || 0,
    commissionRate: r.commission_rate == null ? undefined : Number(r.commission_rate),
    commissionPaid: r.commission_paid == null ? undefined : !!r.commission_paid,
    notes: r.notes || undefined,
    signedDate: r.signed_date || undefined,
    dueDate: r.due_date || undefined,
    weeklyPayment: r.weekly_payment == null ? undefined : Number(r.weekly_payment),
    dailyPayment: r.daily_payment == null ? undefined : Number(r.daily_payment),
    monthlyPayment: r.monthly_payment == null ? undefined : Number(r.monthly_payment),
    commission: r.commission == null ? undefined : Number(r.commission),
    balloon: r.balloon == null ? undefined : Number(r.balloon),
    rep: r.rep || undefined,
    anshuPct: r.anshu_pct == null ? undefined : Number(r.anshu_pct),
    patrickPct: r.patrick_pct == null ? undefined : Number(r.patrick_pct),
    deltRetainedPct: r.delt_retained_pct == null ? undefined : Number(r.delt_retained_pct),
    weeksBehind: r.weeks_behind == null ? undefined : Number(r.weeks_behind),
    bounceCount: r.bounce_count == null ? undefined : Number(r.bounce_count),
    fundingSources: r.funding_sources || undefined,
    borrowingCostPct: r.borrowing_cost_pct == null ? undefined : Number(r.borrowing_cost_pct),
    payments: [],
  };
}

function fromDbPayment(r: any): LoanPayment {
  return {
    id: r.id,
    deal_id: r.deal_id,
    payment_date: r.payment_date,
    amount: Number(r.amount) || 0,
    category: (r.category as LoanPaymentCategory) || 'debit',
    notes: r.notes ?? null,
  };
}

function toDb(d: Partial<CapitalDeal>): Record<string, any> {
  const out: Record<string, any> = {};
  if (d.id !== undefined) out.id = d.id;
  if (d.merchant !== undefined) out.merchant = d.merchant;
  if (d.type !== undefined) out.type = d.type;
  if (d.channel !== undefined) out.channel = d.channel;
  if (d.funded !== undefined) out.funded = d.funded;
  if (d.fundedAmt !== undefined) out.funded_amt = d.fundedAmt;
  if (d.factor !== undefined) out.factor = d.factor;
  if (d.totalOwed !== undefined) out.total_owed = d.totalOwed;
  if (d.collected !== undefined) out.collected = d.collected;
  if (d.holdback !== undefined) out.holdback = d.holdback;
  if (d.dailyDebit !== undefined) out.daily_debit = d.dailyDebit;
  if (d.status !== undefined) out.status = d.status;
  if (d.daysInDefault !== undefined) out.days_in_default = d.daysInDefault;
  if (d.lastPayment !== undefined) out.last_payment = d.lastPayment || null;
  if (d.achStatus !== undefined) out.ach_status = d.achStatus;
  if (d.avg7d !== undefined) out.avg_7d = d.avg7d;
  if (d.avg30d !== undefined) out.avg_30d = d.avg30d;
  if (d.stackCount !== undefined) out.stack_count = d.stackCount;
  if (d.renewalEligible !== undefined) out.renewal_eligible = d.renewalEligible;
  if (d.uccFiled !== undefined) out.ucc_filed = d.uccFiled || null;
  if (d.uccExpires !== undefined) out.ucc_expires = d.uccExpires || null;
  if (d.costOfCapitalPaid !== undefined) out.cost_of_capital_paid = d.costOfCapitalPaid;
  if (d.referralCommission !== undefined) out.referral_commission = d.referralCommission;
  if (d.commissionRate !== undefined) out.commission_rate = d.commissionRate ?? null;
  if (d.commissionPaid !== undefined) out.commission_paid = d.commissionPaid ?? null;
  if (d.notes !== undefined) out.notes = d.notes || null;
  if (d.signedDate !== undefined) out.signed_date = d.signedDate || null;
  if (d.dueDate !== undefined) out.due_date = d.dueDate || null;
  if (d.weeklyPayment !== undefined) out.weekly_payment = d.weeklyPayment ?? null;
  if (d.dailyPayment !== undefined) out.daily_payment = d.dailyPayment ?? null;
  if (d.monthlyPayment !== undefined) out.monthly_payment = d.monthlyPayment ?? null;
  if (d.commission !== undefined) out.commission = d.commission ?? null;
  if (d.balloon !== undefined) out.balloon = d.balloon ?? null;
  if (d.rep !== undefined) out.rep = d.rep || null;
  if (d.anshuPct !== undefined) out.anshu_pct = d.anshuPct ?? null;
  if (d.patrickPct !== undefined) out.patrick_pct = d.patrickPct ?? null;
  if (d.deltRetainedPct !== undefined) out.delt_retained_pct = d.deltRetainedPct ?? null;
  if (d.weeksBehind !== undefined) out.weeks_behind = d.weeksBehind ?? null;
  if (d.bounceCount !== undefined) out.bounce_count = d.bounceCount ?? null;
  if (d.fundingSources !== undefined) out.funding_sources = d.fundingSources ?? null;
  if (d.borrowingCostPct !== undefined) out.borrowing_cost_pct = d.borrowingCostPct ?? null;
  return out;
}

// ══════════════════════════════════════════════════════════════
// Hydration + realtime
// ══════════════════════════════════════════════════════════════

let hydrated = false;
let hydrating = false;

/** Group payments by deal_id and attach them (sorted by date) to each deal in place. */
function attachPayments(deals: CapitalDeal[], payments: LoanPayment[]) {
  const byDeal = new Map<string, LoanPayment[]>();
  for (const p of payments) {
    const list = byDeal.get(p.deal_id) || [];
    list.push(p);
    byDeal.set(p.deal_id, list);
  }
  for (const d of deals) {
    const list = (byDeal.get(d.id) || []).sort((a, b) => a.payment_date.localeCompare(b.payment_date));
    d.payments = list;
  }
}

async function maybeHydrate() {
  if (hydrated || hydrating) return;

  if (!supabase) {
    hydrated = true;
    set({ isLoading: false, isOnline: false });
    return;
  }

  hydrating = true;
  set({ isLoading: true, lastError: null });

  try {
    const [dealsRes, payRes] = await Promise.all([
      supabase.from('capital_deals').select('*').order('funded', { ascending: false }),
      supabase.from('loan_payments').select('*').order('payment_date', { ascending: true }),
    ]);
    if (dealsRes.error) throw dealsRes.error;
    if (payRes.error) throw payRes.error;

    const deals = (dealsRes.data || []).map(fromDb);
    attachPayments(deals, (payRes.data || []).map(fromDbPayment));
    set({
      deals,
      isLoading: false,
      isOnline: true,
      lastError: null,
    });
    hydrated = true;
    subscribeRealtime();
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[Capital] Hydration failed:', err);
    hydrated = true;
    set({ isLoading: false, isOnline: false, lastError: err?.message || 'Failed to load' });
    toast.error('Unable to load capital deals — running in local mode.');
  } finally {
    hydrating = false;
  }
}

function subscribeRealtime() {
  if (!supabase) return;
  const channel = supabase
    .channel('capital-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'capital_deals' },
      (payload: any) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        if (eventType === 'DELETE') {
          set({ deals: state.deals.filter(d => d.id !== oldRow?.id) });
        } else if (newRow) {
          const mapped = fromDb(newRow);
          const existing = state.deals.find(d => d.id === mapped.id);
          mapped.payments = existing?.payments ?? [];
          set({
            deals: existing
              ? state.deals.map(d => (d.id === mapped.id ? mapped : d))
              : [mapped, ...state.deals],
          });
        }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'loan_payments' },
      (payload: any) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        if (eventType === 'DELETE') {
          if (!oldRow?.deal_id) return;
          set({
            deals: state.deals.map(d =>
              d.id === oldRow.deal_id
                ? { ...d, payments: (d.payments || []).filter(p => p.id !== oldRow.id) }
                : d,
            ),
          });
        } else if (newRow) {
          const p = fromDbPayment(newRow);
          set({
            deals: state.deals.map(d => {
              if (d.id !== p.deal_id) return d;
              const others = (d.payments || []).filter(x => x.id !== p.id);
              const next = [...others, p].sort((a, b) => a.payment_date.localeCompare(b.payment_date));
              return { ...d, payments: next };
            }),
          });
        }
      },
    )
    .subscribe();
  (globalThis as any).__deltCapitalChannel = channel;
}

// ══════════════════════════════════════════════════════════════
// Optimistic write helper
// ══════════════════════════════════════════════════════════════

async function persist(
  apply: () => void,
  rollback: () => void,
  op: () => Promise<{ error: { message: string } | null }>,
): Promise<void> {
  apply();
  if (!supabase) return; // offline: optimistic only
  try {
    const { error } = await op();
    if (error) {
      rollback();
      toast.error(`Save failed — ${error.message}`);
    }
  } catch (err: any) {
    rollback();
    toast.error(`Save failed — ${err?.message || 'unknown error'}`);
  }
}

// ══════════════════════════════════════════════════════════════
// Actions
// ══════════════════════════════════════════════════════════════

function nextId(): string {
  const year = new Date().getFullYear();
  const used = new Set(state.deals.map(d => d.id));
  let n = state.deals.filter(d => d.id.startsWith(`MCA-${year}-`)).length + 1;
  let id = `MCA-${year}-${String(n).padStart(3, '0')}`;
  while (used.has(id)) {
    n++;
    id = `MCA-${year}-${String(n).padStart(3, '0')}`;
  }
  return id;
}

export const capitalActions = {
  create(partial: Partial<CapitalDeal>): CapitalDeal {
    const today = new Date().toISOString().slice(0, 10);
    const fundedAmt = partial.fundedAmt ?? 0;
    const factor = partial.factor ?? 1.35;
    const totalOwed = partial.totalOwed ?? Math.round(fundedAmt * factor);
    const channel = partial.channel || 'self';
    const id = partial.id || nextId();

    const deal: CapitalDeal = {
      id,
      merchant: partial.merchant || 'New Merchant',
      type: partial.type || 'Restaurant',
      channel,
      funded: partial.funded || today,
      fundedAmt,
      factor,
      totalOwed,
      collected: partial.collected ?? 0,
      holdback: partial.holdback ?? 12,
      dailyDebit: partial.dailyDebit ?? 0,
      status: partial.status || 'active',
      daysInDefault: partial.daysInDefault ?? 0,
      lastPayment: partial.lastPayment || partial.funded || today,
      achStatus: partial.achStatus || 'current',
      avg7d: partial.avg7d ?? 0,
      avg30d: partial.avg30d ?? 0,
      stackCount: partial.stackCount ?? 0,
      renewalEligible: partial.renewalEligible ?? false,
      uccFiled: partial.uccFiled || '',
      uccExpires: partial.uccExpires || '',
      costOfCapitalPaid: partial.costOfCapitalPaid ?? 0,
      referralCommission: partial.referralCommission ?? 0,
      commissionRate: partial.commissionRate,
      commissionPaid: partial.commissionPaid,
      notes: partial.notes,
    };

    const prev = state.deals;
    persist(
      () => set({ deals: [deal, ...state.deals] }),
      () => set({ deals: prev }),
      () => supabase!.from('capital_deals').insert(toDb(deal)).then(r => ({ error: r.error })),
    );
    return deal;
  },

  update(id: string, patch: Partial<CapitalDeal>) {
    const prev = state.deals;
    if (!prev.some(d => d.id === id)) return;
    persist(
      () => set({ deals: state.deals.map(d => (d.id === id ? { ...d, ...patch } : d)) }),
      () => set({ deals: prev }),
      () => supabase!.from('capital_deals').update(toDb(patch)).eq('id', id).then(r => ({ error: r.error })),
    );
  },

  remove(id: string) {
    const prev = state.deals;
    if (!prev.some(d => d.id === id)) return;
    persist(
      () => set({ deals: state.deals.filter(d => d.id !== id) }),
      () => set({ deals: prev }),
      () => supabase!.from('capital_deals').delete().eq('id', id).then(r => ({ error: r.error })),
    );
  },

  /**
   * Record a payment against a deal. Writes to `loan_payments`, appends to the
   * deal's local ledger, and recomputes `collected` (= Σ amount) + `lastPayment`.
   * The recomputed `collected` is also persisted back to `capital_deals`.
   */
  addPayment(
    dealId: string,
    p: { payment_date: string; amount: number; category: LoanPaymentCategory; notes?: string | null },
  ): LoanPayment | null {
    const deal = state.deals.find(d => d.id === dealId);
    if (!deal) return null;

    const payment: LoanPayment = {
      id:
        (globalThis as any).crypto?.randomUUID?.() ??
        `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      deal_id: dealId,
      payment_date: p.payment_date,
      amount: p.amount,
      category: p.category,
      notes: p.notes ?? null,
    };

    const prev = state.deals;
    const nextPayments = [...(deal.payments || []), payment].sort((a, b) =>
      a.payment_date.localeCompare(b.payment_date),
    );
    const collected = nextPayments.reduce((s, x) => s + x.amount, 0);
    const lastPayment = nextPayments.reduce(
      (acc, x) => (x.payment_date > acc ? x.payment_date : acc),
      deal.lastPayment || '',
    );

    persist(
      () =>
        set({
          deals: state.deals.map(d =>
            d.id === dealId ? { ...d, payments: nextPayments, collected, lastPayment } : d,
          ),
        }),
      () => set({ deals: prev }),
      async () => {
        const insert = await supabase!
          .from('loan_payments')
          .insert({
            id: payment.id,
            deal_id: payment.deal_id,
            payment_date: payment.payment_date,
            amount: payment.amount,
            category: payment.category,
            notes: payment.notes,
          });
        if (insert.error) return { error: insert.error };
        const upd = await supabase!
          .from('capital_deals')
          .update({ collected, last_payment: lastPayment || null })
          .eq('id', dealId);
        return { error: upd.error };
      },
    );
    return payment;
  },

  /** Snapshot of all current deal ids (used by the underwriting approve handoff). */
  allIds(): string[] {
    return state.deals.map(d => d.id);
  },

  /** Force a full reload of deals + payments from Supabase. */
  async refresh(): Promise<void> {
    if (!supabase) return;
    set({ isLoading: true, lastError: null });
    try {
      const [dealsRes, payRes] = await Promise.all([
        supabase.from('capital_deals').select('*').order('funded', { ascending: false }),
        supabase.from('loan_payments').select('*').order('payment_date', { ascending: true }),
      ]);
      if (dealsRes.error) throw dealsRes.error;
      if (payRes.error) throw payRes.error;
      const deals = (dealsRes.data || []).map(fromDb);
      attachPayments(deals, (payRes.data || []).map(fromDbPayment));
      set({ deals, isLoading: false, isOnline: true, lastError: null });
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('[Capital] Refresh failed:', err);
      set({ isLoading: false, lastError: err?.message || 'Failed to refresh' });
      toast.error('Unable to refresh capital deals.');
    }
  },
};

// ══════════════════════════════════════════════════════════════
// React hook
// ══════════════════════════════════════════════════════════════

const subscribe = (l: () => void) => {
  listeners.add(l);
  void maybeHydrate();
  return () => {
    listeners.delete(l);
  };
};
const getSnapshot = () => state;

export function useCapital() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
