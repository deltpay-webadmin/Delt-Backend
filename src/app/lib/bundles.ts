// ═══════════════════════════════════════════
// Shared Bundles catalog + status helpers
// ═══════════════════════════════════════════
//
// BackendBundles is the configuration surface for these bundles. Other
// pages (Leads, Merchant Detail, Retention) need to render bundle
// pickers, statuses, and progress UIs against the same catalog. Before
// this module, each consumer kept its own duplicated array, which drifted
// over time (em-dash vs hyphen, missing tiers, etc.).
//
// Treat BackendBundles as the editor; treat this module as the read API
// that every other surface must use.

export interface BundleDefinition {
  /** Stable id used for bundle assignment / cycle status. */
  id: string;
  /** Display name shown in pickers and merchant-facing UIs. */
  name: string;
  /** Default credit amount in dollars. */
  amount: number;
  /** Optional admin-only description. */
  description?: string;
  /** Default expiration in days. */
  expiration?: number;
  /** auto = system-issued, manual = picked from a Save Playbook. */
  type?: 'auto' | 'manual';
}

/**
 * Canonical bundle catalog. Mirrors initialBundles in BackendBundles.tsx.
 * In production this should come from Supabase; for now it's the single
 * shared source of truth.
 */
export const BUNDLE_CATALOG: BundleDefinition[] = [
  { id: 'welcome',           name: 'Welcome Bundle',     amount: 500, description: 'Issued to every new merchant',    expiration: 30, type: 'auto'   },
  { id: 'referrer',          name: 'Referrer Reward',    amount: 200, description: 'Auto-issued when a referral converts', expiration: 30, type: 'auto'   },
  { id: 'retention-light',   name: 'Retention \u2014 Light',  amount: 200, description: 'Manual, from Save Playbook',      expiration: 30, type: 'manual' },
  { id: 'retention-medium',  name: 'Retention \u2014 Medium', amount: 350, description: 'Manual',                          expiration: 30, type: 'manual' },
  { id: 'retention-full',    name: 'Retention \u2014 Full',   amount: 500, description: 'Manual',                          expiration: 30, type: 'manual' },
];

// ── Lifecycle for an assigned bundle ──

export type BundleStatus =
  | 'Not Assigned'
  | 'Credit Issued'
  | 'Order Placed'
  | 'Shipped'
  | 'Delivered';

export const BUNDLE_STATUSES: BundleStatus[] = [
  'Not Assigned',
  'Credit Issued',
  'Order Placed',
  'Shipped',
  'Delivered',
];

export function bundleStatusCls(status: BundleStatus): string {
  switch (status) {
    case 'Not Assigned':  return 'bg-gray-100 text-gray-600';
    case 'Credit Issued': return 'bg-blue-50 text-blue-700';
    case 'Order Placed':  return 'bg-amber-50 text-amber-700';
    case 'Shipped':       return 'bg-violet-50 text-violet-700';
    case 'Delivered':     return 'bg-emerald-50 text-emerald-700';
  }
}

/**
 * Advance a bundle through the lifecycle. Used by lead/merchant detail
 * pages that let the operator click a status pill to push it forward.
 */
export function nextBundleStatus(current: BundleStatus): BundleStatus {
  const idx = BUNDLE_STATUSES.indexOf(current);
  if (idx < 0 || idx >= BUNDLE_STATUSES.length - 1) return current;
  return BUNDLE_STATUSES[idx + 1];
}

// ── Credit lifecycle (Merchant Detail wallet view) ──

export type CreditStatus = 'Active' | 'Partially Used' | 'Fully Used' | 'Expired';

export function creditStatusCls(s: CreditStatus): string {
  switch (s) {
    case 'Active':         return 'bg-emerald-50 text-emerald-700';
    case 'Partially Used': return 'bg-amber-50 text-amber-700';
    case 'Fully Used':     return 'bg-gray-100 text-gray-500';
    case 'Expired':        return 'bg-red-50 text-red-600';
  }
}

/**
 * Slim picker shape used by Leads / Merchant Detail dropdowns. Drops the
 * admin-only description / expiration / type to keep the picker UI tight.
 */
export const BUNDLE_PICKER_OPTIONS: ReadonlyArray<Pick<BundleDefinition, 'id' | 'name' | 'amount'>> =
  BUNDLE_CATALOG.map(({ id, name, amount }) => ({ id, name, amount }));
