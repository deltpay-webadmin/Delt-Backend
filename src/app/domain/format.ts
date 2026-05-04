/**
 * Shared formatters for operations surfaces.
 *
 * Kept in `domain/` so any page can import without a runtime dep beyond
 * Intl. Cents helpers exist because billing data is stored in integer
 * cents to avoid float drift.
 */

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const pct = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 });
const num = new Intl.NumberFormat('en-US');

export function formatUsd(amount: number, opts?: { precise?: boolean }): string {
  return opts?.precise ? usd2.format(amount) : usd.format(amount);
}

export function formatCents(cents: number, opts?: { precise?: boolean }): string {
  return formatUsd(cents / 100, opts);
}

export function formatPct(value: number): string {
  return pct.format(value);
}

export function formatNumber(value: number): string {
  return num.format(value);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
