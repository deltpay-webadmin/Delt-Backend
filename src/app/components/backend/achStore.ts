/**
 * ────────────────────────────────────────────────────────────
 * ACH Daily Activity store — Supabase-backed
 * ────────────────────────────────────────────────────────────
 * Holds the daily summary rows imported from ACH.com's
 * RptActivitySummary report (Origination, Settlement, Returns).
 *
 * Behavior mirrors capitalStore:
 *   • Pub/sub + React hook surface
 *   • First subscription triggers hydrate() against `ach_daily_activity`
 *   • Realtime channel streams in multi-user updates
 *   • Optimistic local update on writes, rolled back on Supabase error
 *   • If Supabase env vars are missing, falls back to in-memory only
 */

import { useSyncExternalStore } from 'react';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../../lib/supabase';

// ══════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════

export type AchRecordType = 'ORIGINATION' | 'Settlement' | 'Returns';

export interface AchDailyActivity {
  id: string;
  processingDate: string;       // YYYY-MM-DD
  recordType: AchRecordType;
  debitAmount: number;
  creditAmount: number;
  debitCount: number;
  creditCount: number;
  totalCount: number;
  effectiveEntryDate: string;   // YYYY-MM-DD or ''
  settlementDate: string;       // YYYY-MM-DD or ''
  source: string;
  customerName: string;
  nachaId: string;
  importBatchId?: string | null;
  createdAt: string;
}

export interface AchImportBatch {
  id: string;
  filename: string;
  source: string;
  customerName: string;
  nachaId: string;
  dateRange: string;
  rowCount: number;
  insertedCount: number;
  skippedCount: number;
  totalOriginated: number;
  totalSettled: number;
  totalReturned: number;
  notes?: string | null;
  createdAt: string;
}

interface AchState {
  rows: AchDailyActivity[];
  imports: AchImportBatch[];
  isLoading: boolean;
  isOnline: boolean;
  lastError: string | null;
}

// ══════════════════════════════════════════════════════════════
// State + pub/sub
// ══════════════════════════════════════════════════════════════

let state: AchState = {
  rows: [],
  imports: [],
  isLoading: true,
  isOnline: false,
  lastError: null,
};

const listeners = new Set<() => void>();

function emit() { for (const l of listeners) l(); }
function set(patch: Partial<AchState>) {
  state = { ...state, ...patch };
  emit();
}

// ══════════════════════════════════════════════════════════════
// DB ↔ TS mapping
// ══════════════════════════════════════════════════════════════

function fromDb(r: any): AchDailyActivity {
  return {
    id: r.id,
    processingDate: r.processing_date || '',
    recordType: r.record_type as AchRecordType,
    debitAmount: Number(r.debit_amount) || 0,
    creditAmount: Number(r.credit_amount) || 0,
    debitCount: Number(r.debit_count) || 0,
    creditCount: Number(r.credit_count) || 0,
    totalCount: Number(r.total_count) || 0,
    effectiveEntryDate: r.effective_entry_date || '',
    settlementDate: r.settlement_date || '',
    source: r.source || 'ach.com',
    customerName: r.customer_name || '',
    nachaId: r.nacha_id || '',
    importBatchId: r.import_batch_id ?? null,
    createdAt: r.created_at || new Date().toISOString(),
  };
}

function toDb(d: Partial<AchDailyActivity>): Record<string, any> {
  const out: Record<string, any> = {};
  if (d.processingDate !== undefined) out.processing_date = d.processingDate;
  if (d.recordType !== undefined) out.record_type = d.recordType;
  if (d.debitAmount !== undefined) out.debit_amount = d.debitAmount;
  if (d.creditAmount !== undefined) out.credit_amount = d.creditAmount;
  if (d.debitCount !== undefined) out.debit_count = d.debitCount;
  if (d.creditCount !== undefined) out.credit_count = d.creditCount;
  if (d.totalCount !== undefined) out.total_count = d.totalCount;
  if (d.effectiveEntryDate !== undefined) out.effective_entry_date = d.effectiveEntryDate || null;
  if (d.settlementDate !== undefined) out.settlement_date = d.settlementDate || null;
  if (d.source !== undefined) out.source = d.source;
  if (d.customerName !== undefined) out.customer_name = d.customerName;
  if (d.nachaId !== undefined) out.nacha_id = d.nachaId;
  if (d.importBatchId !== undefined) out.import_batch_id = d.importBatchId ?? null;
  return out;
}

function importFromDb(r: any): AchImportBatch {
  return {
    id: r.id,
    filename: r.filename || '',
    source: r.source || 'ach.com',
    customerName: r.customer_name || '',
    nachaId: r.nacha_id || '',
    dateRange: r.date_range || '',
    rowCount: Number(r.row_count) || 0,
    insertedCount: Number(r.inserted_count) || 0,
    skippedCount: Number(r.skipped_count) || 0,
    totalOriginated: Number(r.total_originated) || 0,
    totalSettled: Number(r.total_settled) || 0,
    totalReturned: Number(r.total_returned) || 0,
    notes: r.notes ?? null,
    createdAt: r.created_at || new Date().toISOString(),
  };
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
    const [activityRes, importsRes] = await Promise.all([
      supabase
        .from('ach_daily_activity')
        .select('*')
        .order('processing_date', { ascending: false })
        .limit(5000),
      supabase
        .from('ach_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);
    if (activityRes.error) throw activityRes.error;

    set({
      rows: (activityRes.data || []).map(fromDb),
      imports: (importsRes.data || []).map(importFromDb),
      isLoading: false,
      isOnline: true,
      lastError: null,
    });
    hydrated = true;
    subscribeRealtime();
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[ACH] Hydration failed:', err);
    hydrated = true;
    set({ isLoading: false, isOnline: false, lastError: err?.message || 'Failed to load' });
    toast.error('Unable to load ACH activity — running in local mode.');
  } finally {
    hydrating = false;
  }
}

function subscribeRealtime() {
  if (!supabase) return;
  const channel = supabase
    .channel('ach-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'ach_daily_activity' },
      (payload: any) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        if (eventType === 'DELETE') {
          set({ rows: state.rows.filter(r => r.id !== oldRow?.id) });
        } else if (newRow) {
          const mapped = fromDb(newRow);
          const exists = state.rows.some(r => r.id === mapped.id);
          set({
            rows: exists
              ? state.rows.map(r => (r.id === mapped.id ? mapped : r))
              : [mapped, ...state.rows],
          });
        }
      },
    )
    .subscribe();
  (globalThis as any).__deltAchChannel = channel;
}

// ══════════════════════════════════════════════════════════════
// Actions
// ══════════════════════════════════════════════════════════════

export interface ImportRow {
  processingDate: string;
  recordType: AchRecordType;
  debitAmount: number;
  creditAmount: number;
  debitCount: number;
  creditCount: number;
  totalCount: number;
  effectiveEntryDate: string;
  settlementDate: string;
}

export interface ImportMeta {
  filename: string;
  customerName: string;
  nachaId: string;
  dateRange: string;
}

export const achActions = {
  /** Bulk import an array of parsed CSV rows. Returns insert summary. */
  async importBatch(
    rows: ImportRow[],
    meta: ImportMeta,
  ): Promise<{ inserted: number; skipped: number; batchId?: string; error?: string }> {
    if (!rows.length) return { inserted: 0, skipped: 0 };

    const totalOriginated = rows.filter(r => r.recordType === 'ORIGINATION').reduce((s, r) => s + r.debitAmount, 0);
    const totalSettled = rows.filter(r => r.recordType === 'Settlement').reduce((s, r) => s + r.creditAmount, 0);
    const totalReturned = rows.filter(r => r.recordType === 'Returns').reduce((s, r) => s + r.debitAmount, 0);

    if (!supabase) {
      // Local-only: just merge into state
      const synthetic = rows.map((r, i) => ({
        id: `local-${Date.now()}-${i}`,
        ...r,
        source: 'ach.com',
        customerName: meta.customerName,
        nachaId: meta.nachaId,
        importBatchId: null,
        createdAt: new Date().toISOString(),
      } as AchDailyActivity));
      set({ rows: [...synthetic, ...state.rows] });
      toast.success(`Imported ${rows.length} rows (local mode).`);
      return { inserted: rows.length, skipped: 0 };
    }

    try {
      // 1. Create import batch record
      const { data: batchData, error: batchErr } = await supabase
        .from('ach_imports')
        .insert({
          filename: meta.filename,
          source: 'ach.com',
          customer_name: meta.customerName,
          nacha_id: meta.nachaId,
          date_range: meta.dateRange,
          row_count: rows.length,
          inserted_count: 0,
          skipped_count: 0,
          total_originated: totalOriginated,
          total_settled: totalSettled,
          total_returned: totalReturned,
        })
        .select('*')
        .single();
      if (batchErr) throw batchErr;

      const batchId = batchData.id;
      const payload = rows.map(r => ({
        ...toDb(r),
        source: 'ach.com',
        customer_name: meta.customerName,
        nacha_id: meta.nachaId,
        import_batch_id: batchId,
      }));

      // 2. Bulk insert (chunked to avoid payload limits)
      const CHUNK = 500;
      let inserted = 0;
      for (let i = 0; i < payload.length; i += CHUNK) {
        const slice = payload.slice(i, i + CHUNK);
        const { data, error } = await supabase
          .from('ach_daily_activity')
          .upsert(slice, {
            onConflict: 'processing_date,record_type,effective_entry_date,settlement_date,debit_amount,credit_amount',
            ignoreDuplicates: false,
          })
          .select('*');
        if (error) throw error;
        inserted += (data?.length ?? slice.length);
        if (data) {
          const mapped = data.map(fromDb);
          set({ rows: [...mapped, ...state.rows] });
        }
      }

      const skipped = rows.length - inserted;
      // 3. Update batch with final counts
      await supabase
        .from('ach_imports')
        .update({ inserted_count: inserted, skipped_count: skipped })
        .eq('id', batchId);

      // 4. Refresh imports list
      const { data: importsData } = await supabase
        .from('ach_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (importsData) set({ imports: importsData.map(importFromDb) });

      toast.success(`Imported ${inserted} ACH rows.`);
      return { inserted, skipped, batchId };
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('[ACH] Import failed:', err);
      toast.error(`Import failed — ${err?.message || 'unknown error'}`);
      return { inserted: 0, skipped: rows.length, error: err?.message };
    }
  },

  async deleteImport(batchId: string): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.from('ach_daily_activity').delete().eq('import_batch_id', batchId);
      await supabase.from('ach_imports').delete().eq('id', batchId);
      set({
        rows: state.rows.filter(r => r.importBatchId !== batchId),
        imports: state.imports.filter(i => i.id !== batchId),
      });
      toast.success('Import deleted.');
    } catch (err: any) {
      toast.error(`Delete failed — ${err?.message || 'unknown error'}`);
    }
  },
};

// ══════════════════════════════════════════════════════════════
// React hook
// ══════════════════════════════════════════════════════════════

const subscribe = (l: () => void) => {
  listeners.add(l);
  void maybeHydrate();
  return () => { listeners.delete(l); };
};
const getSnapshot = () => state;

export function useAchActivity() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
