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
  return out;
}

// ══════════════════════════════════════════════════════════════
// Hydration + realtime
// ══════════════════════════════════════════════════════════════

let hydrated = false;
let hydrating = false;

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
    const { data, error } = await supabase
      .from('capital_deals')
      .select('*')
      .order('funded', { ascending: false });
    if (error) throw error;
    set({
      deals: (data || []).map(fromDb),
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
          const exists = state.deals.some(d => d.id === mapped.id);
          set({
            deals: exists
              ? state.deals.map(d => (d.id === mapped.id ? mapped : d))
              : [mapped, ...state.deals],
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
