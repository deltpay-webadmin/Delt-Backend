/**
 * ────────────────────────────────────────────────────────────
 * Phone normalization & matching helpers
 * ────────────────────────────────────────────────────────────
 * Canonical form is E.164-ish: a leading "+" followed by digits
 * (e.g. "+15551234567"). For NANP numbers we always assume "+1"
 * when no country code is present.
 *
 * `normalizePhone` is deliberately permissive: it accepts inputs
 * like "(555) 123-4567", "555.123.4567", "5551234567", "+1 555
 * 123 4567" and returns the same canonical string for any of them.
 *
 * `phoneDigits` returns the bare digit sequence (no "+", no dashes).
 * Useful for partial / "last-N" matching when typing a number into
 * the call center search box mid-call.
 *
 * `phoneMatches` does both: exact-normalized comparison plus a
 * fallback "last-7-digits" check so a caller-ID without country
 * code still resolves to a stored "+1XXXXXXXXXX".
 */

/** Strip everything that isn't a digit. Returns "" for null/undefined. */
export function phoneDigits(input: string | null | undefined): string {
  if (!input) return '';
  return String(input).replace(/\D+/g, '');
}

/**
 * Canonicalize a phone number to "+<digits>" form.
 *
 * Rules:
 *   • 10 digits → assumed NANP, prefixed with "+1"
 *   • 11 digits starting with "1" → "+<as-is>"
 *   • Already starts with "+" → strip non-digits but keep the "+"
 *   • Anything else with ≥ 7 digits → "+<digits>" (best-effort)
 *   • Empty / fewer than 7 digits → ""
 */
export function normalizePhone(input: string | null | undefined): string {
  if (!input) return '';
  const raw = String(input).trim();
  const hadPlus = raw.startsWith('+');
  const digits = phoneDigits(raw);
  if (!digits) return '';

  if (hadPlus) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length >= 7) return `+${digits}`;
  return '';
}

/**
 * True when `a` and `b` refer to the same phone number.
 *
 * Strategy:
 *   1. Both normalize to the same E.164 string → match.
 *   2. As a fallback, if both have at least 7 digits and the trailing
 *      7 digits are equal, also match. This handles the common
 *      caller-ID case where the carrier dropped the country code.
 */
export function phoneMatches(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (na && nb && na === nb) return true;

  const da = phoneDigits(a);
  const db = phoneDigits(b);
  if (da.length >= 7 && db.length >= 7 && da.slice(-7) === db.slice(-7)) return true;

  return false;
}

/**
 * Format a stored or normalized phone number for display.
 *
 * "+15551234567"          → "(555) 123-4567"
 * "+44 20 7946 0958"      → "+442079460958" (returned as-is, no formatter for non-NANP)
 * "5551234567"            → "(555) 123-4567"
 * "" / undefined          → ""
 */
export function formatPhone(input: string | null | undefined): string {
  const norm = normalizePhone(input);
  if (!norm) return '';
  // NANP formatting: +1XXXYYYZZZZ → (XXX) YYY-ZZZZ
  if (/^\+1\d{10}$/.test(norm)) {
    const d = norm.slice(2);
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return norm;
}

// ── Self-tests ──
// Run with: npx tsx src/app/lib/phone.ts
// (Or import { runPhoneTests } and call from a dev console.)
export function runPhoneTests(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  function eq<T>(label: string, got: T, want: T) {
    if (got === want) passed++;
    else failures.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  }

  // Normalization
  eq('normalize 10-digit', normalizePhone('5551234567'), '+15551234567');
  eq('normalize formatted', normalizePhone('(555) 123-4567'), '+15551234567');
  eq('normalize dotted', normalizePhone('555.123.4567'), '+15551234567');
  eq('normalize dashed', normalizePhone('555-123-4567'), '+15551234567');
  eq('normalize 11-with-1', normalizePhone('15551234567'), '+15551234567');
  eq('normalize +1 prefix', normalizePhone('+1 555 123 4567'), '+15551234567');
  eq('normalize + prefix intl', normalizePhone('+44 20 7946 0958'), '+442079460958');
  eq('normalize empty', normalizePhone(''), '');
  eq('normalize null', normalizePhone(null), '');
  eq('normalize garbage', normalizePhone('abc'), '');

  // Matching
  eq('match same', phoneMatches('(555) 123-4567', '+15551234567'), true);
  eq('match no country code', phoneMatches('5551234567', '+15551234567'), true);
  eq('match different', phoneMatches('5551234567', '5559999999'), false);
  eq('match empty', phoneMatches('', '5551234567'), false);
  eq('match last-7 fallback', phoneMatches('1234567', '+15551234567'), true);

  // Formatting
  eq('format NANP', formatPhone('5551234567'), '(555) 123-4567');
  eq('format already-formatted', formatPhone('(555) 123-4567'), '(555) 123-4567');
  eq('format intl pass-through', formatPhone('+442079460958'), '+442079460958');
  eq('format empty', formatPhone(''), '');

  return { passed, failed: failures.length, failures };
}
