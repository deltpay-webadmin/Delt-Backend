/**
 * ────────────────────────────────────────────────────────────────
 * Delt Capital — Underwriting Scoring Engine
 * ────────────────────────────────────────────────────────────────
 * Pure scoring functions. No React. No I/O. Fully unit-testable.
 *
 * Three risk dimensions:
 *   • Plaid Cash Flow Score      (45% weight)
 *   • CRS Credit Score           (35% weight)
 *   • DataMerch MCA History Score (20% weight)
 *
 * Output:
 *   • Sub-scores (0–100)
 *   • Composite score (0–100)
 *   • Risk tier (1–4 or Decline)
 *   • Recommended terms (holdback%, factor range, max advance)
 *   • Hard disqualifier flags (auto-decline reasons)
 *   • Stress-test result for a proposed advance
 */

// ══════════════════════════════════════════════════════════════════
// Inputs
// ══════════════════════════════════════════════════════════════════

export type RevenueTrend = 'growing' | 'flat' | 'declining';
export type DepositConcentration = 'diversified' | 'moderate' | 'concentrated';

/** Signals pulled from Plaid (cash-flow risk). */
export interface PlaidInputs {
  avgDailyBalance: number;          // $
  minDailyBalance: number;          // $
  nsfCount90d: number;              // count over last 90d
  daysSinceLastNsf: number;         // 9999 if never
  monthlyRevenue: number;           // $ avg over last 3 mo
  revenueStdDevPct: number;         // 0–1, stddev / mean across last 3 months
  revenueTrend: RevenueTrend;
  depositConcentration: DepositConcentration;
  revenueChange3moPct: number;      // signed change last 3 mo, e.g. -0.30 = -30%
}

/** Signals from CRS / credit bureau. */
export interface CrsInputs {
  fico: number;                     // personal FICO
  businessCreditScore?: number;     // optional (e.g. PAYDEX, Intelliscore)
  derogatoryMarks: number;          // collections + judgments + liens
  creditUtilizationPct: number;     // 0–1
  timeInFileYears: number;          // length of credit file
  activeBankruptcy: boolean;
}

/** Signals from DataMerch / industry MCA history. */
export interface DataMerchInputs {
  priorPositions: number;           // total historical MCA positions
  priorDefaults: number;            // # of prior MCA defaults/charge-offs
  earlyPayoffs: number;             // positive signal
  currentOpenPositions: number;     // currently outstanding
  positionSeniority: 1 | 2 | 3 | 4; // 1 = senior; we'd be in 2/3/4 if stacked
}

export interface ScoreInputs {
  plaid: PlaidInputs;
  crs: CrsInputs;
  dataMerch: DataMerchInputs;
}

// ══════════════════════════════════════════════════════════════════
// Outputs
// ══════════════════════════════════════════════════════════════════

export interface SubScoreBreakdown {
  total: number;          // 0–100
  components: Array<{ label: string; points: number; max: number; note?: string }>;
}

export type RiskTier = 1 | 2 | 3 | 4 | 'decline';

export interface TierTerms {
  tier: RiskTier;
  label: string;
  holdbackMinPct: number;     // %
  holdbackMaxPct: number;     // %
  factorMin: number;
  factorMax: number;
  maxAdvancePctOfMonthlyRevenue: number; // 0–1, e.g. 1.0, 0.75
}

export interface Disqualifier {
  code: string;
  label: string;
  reason: string;
}

export interface ScoringResult {
  plaidScore: SubScoreBreakdown;
  crsScore: SubScoreBreakdown;
  dataMerchScore: SubScoreBreakdown;
  composite: number;            // 0–100
  weighted: { plaid: number; crs: number; dataMerch: number };
  terms: TierTerms;
  disqualifiers: Disqualifier[];
  decision: 'Auto-Approve' | 'Manual Review' | 'Auto-Decline';
}

export interface StressTestInputs {
  advanceAmount: number;
  factorRate: number;
  termDays: number;             // business days
  avgDailyRevenue: number;
  avgDailyBalance: number;
  tier: RiskTier;
}

export interface StressTestResult {
  dailyDebit: number;
  pctOfDailyRevenue: number;    // 0–1
  pctOfAdb: number;             // 0–1
  thresholdRevenuePct: number;  // 0.20 default; 0.15 for tier 3/4
  thresholdAdbPct: number;      // 0.15 (secondary buffer for tier 3/4)
  passes: boolean;
  flags: string[];
  suggestedMaxAdvance: number;  // largest advance that would clear at same term/factor
  suggestedMinTermDays: number; // shortest term that would clear at same advance/factor
}

// ══════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const safe = (n: number | undefined | null, fallback = 0) => (Number.isFinite(n as number) ? (n as number) : fallback);

// ══════════════════════════════════════════════════════════════════
// 1. Plaid Cash Flow Score (45% weight)
// ──────────────────────────────────────────────────────────────────
// Component caps sum to 100.
//   ADB                       20
//   Min daily balance         10
//   NSF / return frequency    20
//   Monthly revenue stability 15
//   Revenue trend             10
//   Deposit concentration     10
//   Days since last NSF       10
//   Revenue magnitude         5
// ══════════════════════════════════════════════════════════════════

export function scorePlaid(p: PlaidInputs): SubScoreBreakdown {
  const components: SubScoreBreakdown['components'] = [];

  // ADB (20)
  let adbPts = 0;
  if (p.avgDailyBalance >= 25000) adbPts = 20;
  else if (p.avgDailyBalance >= 10000) adbPts = 16;
  else if (p.avgDailyBalance >= 5000) adbPts = 12;
  else if (p.avgDailyBalance >= 2500) adbPts = 7;
  else if (p.avgDailyBalance >= 1000) adbPts = 3;
  else adbPts = 0;
  components.push({ label: 'Avg Daily Balance', points: adbPts, max: 20, note: `$${p.avgDailyBalance.toLocaleString()}` });

  // Min daily balance (10)
  let minPts = 0;
  if (p.minDailyBalance >= 5000) minPts = 10;
  else if (p.minDailyBalance >= 2000) minPts = 8;
  else if (p.minDailyBalance >= 500) minPts = 5;
  else if (p.minDailyBalance >= 0) minPts = 2;
  else minPts = 0;
  components.push({ label: 'Min Daily Balance', points: minPts, max: 10, note: `$${p.minDailyBalance.toLocaleString()}` });

  // NSF / returns (20)
  let nsfPts = 20;
  if (p.nsfCount90d === 0) nsfPts = 20;
  else if (p.nsfCount90d <= 1) nsfPts = 15;
  else if (p.nsfCount90d <= 3) nsfPts = 10;
  else if (p.nsfCount90d <= 5) nsfPts = 5;
  else nsfPts = 0;
  components.push({ label: 'NSF / Returns (90d)', points: nsfPts, max: 20, note: `${p.nsfCount90d} returns` });

  // Revenue stability (stdDev / mean) (15)
  let stabPts = 0;
  const sd = clamp(p.revenueStdDevPct, 0, 1);
  if (sd <= 0.10) stabPts = 15;
  else if (sd <= 0.20) stabPts = 12;
  else if (sd <= 0.35) stabPts = 8;
  else if (sd <= 0.50) stabPts = 4;
  else stabPts = 0;
  components.push({ label: 'Revenue Stability', points: stabPts, max: 15, note: `${(sd * 100).toFixed(0)}% σ` });

  // Trend (10)
  const trendPts = p.revenueTrend === 'growing' ? 10 : p.revenueTrend === 'flat' ? 6 : 0;
  components.push({ label: 'Revenue Trend', points: trendPts, max: 10, note: p.revenueTrend });

  // Concentration (10)
  const concPts =
    p.depositConcentration === 'diversified' ? 10 :
    p.depositConcentration === 'moderate' ? 6 : 2;
  components.push({ label: 'Deposit Concentration', points: concPts, max: 10, note: p.depositConcentration });

  // Days since last NSF (10)
  let dslPts = 0;
  if (p.daysSinceLastNsf >= 365 || p.nsfCount90d === 0) dslPts = 10;
  else if (p.daysSinceLastNsf >= 180) dslPts = 8;
  else if (p.daysSinceLastNsf >= 90) dslPts = 6;
  else if (p.daysSinceLastNsf >= 30) dslPts = 3;
  else dslPts = 0;
  components.push({ label: 'Days Since Last NSF', points: dslPts, max: 10, note: p.daysSinceLastNsf >= 9999 ? 'never' : `${p.daysSinceLastNsf}d` });

  // Revenue magnitude (5)
  let magPts = 0;
  if (p.monthlyRevenue >= 100000) magPts = 5;
  else if (p.monthlyRevenue >= 50000) magPts = 4;
  else if (p.monthlyRevenue >= 25000) magPts = 3;
  else if (p.monthlyRevenue >= 10000) magPts = 2;
  else magPts = 0;
  components.push({ label: 'Monthly Revenue', points: magPts, max: 5, note: `$${p.monthlyRevenue.toLocaleString()}/mo` });

  const total = components.reduce((s, c) => s + c.points, 0);
  return { total, components };
}

// ══════════════════════════════════════════════════════════════════
// 2. CRS Credit Score (35% weight)
// ──────────────────────────────────────────────────────────────────
//   FICO                  40
//   Business credit       15
//   Derogatory marks      15
//   Utilization           10
//   Time in file          10
//   Bankruptcy            10
// ══════════════════════════════════════════════════════════════════

export function scoreCrs(c: CrsInputs): SubScoreBreakdown {
  const components: SubScoreBreakdown['components'] = [];

  // FICO (40)
  let ficoPts = 0;
  if (c.fico >= 760) ficoPts = 40;
  else if (c.fico >= 720) ficoPts = 36;
  else if (c.fico >= 680) ficoPts = 30;
  else if (c.fico >= 640) ficoPts = 22;
  else if (c.fico >= 600) ficoPts = 14;
  else if (c.fico >= 550) ficoPts = 6;
  else ficoPts = 0;
  components.push({ label: 'Personal FICO', points: ficoPts, max: 40, note: String(c.fico) });

  // Business credit (15)
  let bizPts = 0;
  const bcs = c.businessCreditScore ?? 0;
  if (!c.businessCreditScore) { bizPts = 7; }
  else if (bcs >= 80) bizPts = 15;
  else if (bcs >= 70) bizPts = 12;
  else if (bcs >= 50) bizPts = 9;
  else if (bcs >= 30) bizPts = 5;
  else bizPts = 2;
  components.push({ label: 'Business Credit', points: bizPts, max: 15, note: c.businessCreditScore ? String(c.businessCreditScore) : 'thin' });

  // Derogs (15)
  let derogPts = 15;
  if (c.derogatoryMarks === 0) derogPts = 15;
  else if (c.derogatoryMarks === 1) derogPts = 10;
  else if (c.derogatoryMarks === 2) derogPts = 5;
  else derogPts = 0;
  components.push({ label: 'Derogatory Marks', points: derogPts, max: 15, note: `${c.derogatoryMarks}` });

  // Utilization (10)
  let utilPts = 0;
  const u = clamp(c.creditUtilizationPct, 0, 1);
  if (u <= 0.30) utilPts = 10;
  else if (u <= 0.50) utilPts = 7;
  else if (u <= 0.75) utilPts = 4;
  else utilPts = 1;
  components.push({ label: 'Credit Utilization', points: utilPts, max: 10, note: `${(u * 100).toFixed(0)}%` });

  // Time in file (10)
  let tifPts = 0;
  if (c.timeInFileYears >= 10) tifPts = 10;
  else if (c.timeInFileYears >= 5) tifPts = 8;
  else if (c.timeInFileYears >= 3) tifPts = 5;
  else if (c.timeInFileYears >= 1) tifPts = 3;
  else tifPts = 0;
  components.push({ label: 'Time in File', points: tifPts, max: 10, note: `${c.timeInFileYears.toFixed(1)}y` });

  // Bankruptcy (10)
  const bkPts = c.activeBankruptcy ? 0 : 10;
  components.push({ label: 'Bankruptcy', points: bkPts, max: 10, note: c.activeBankruptcy ? 'ACTIVE' : 'none' });

  const total = components.reduce((s, c) => s + c.points, 0);
  return { total, components };
}

// ══════════════════════════════════════════════════════════════════
// 3. DataMerch MCA History Score (20% weight)
// ──────────────────────────────────────────────────────────────────
//   Prior positions / stacking history   25
//   Prior defaults                       30
//   Current open positions               20
//   Position seniority                   15
//   Early payoff (positive)              10
// ══════════════════════════════════════════════════════════════════

export function scoreDataMerch(d: DataMerchInputs): SubScoreBreakdown {
  const components: SubScoreBreakdown['components'] = [];

  // Prior positions (25) — more stacking = worse
  let priorPts = 0;
  if (d.priorPositions === 0) priorPts = 25;
  else if (d.priorPositions === 1) priorPts = 20;
  else if (d.priorPositions === 2) priorPts = 14;
  else if (d.priorPositions === 3) priorPts = 7;
  else priorPts = 0;
  components.push({ label: 'Prior MCA Positions', points: priorPts, max: 25, note: `${d.priorPositions}` });

  // Prior defaults (30)
  let defPts = 30;
  if (d.priorDefaults === 0) defPts = 30;
  else if (d.priorDefaults === 1) defPts = 10;
  else defPts = 0;
  components.push({ label: 'Prior Defaults', points: defPts, max: 30, note: `${d.priorDefaults}` });

  // Current open (20)
  let openPts = 0;
  if (d.currentOpenPositions === 0) openPts = 20;
  else if (d.currentOpenPositions === 1) openPts = 13;
  else if (d.currentOpenPositions === 2) openPts = 5;
  else openPts = 0;
  components.push({ label: 'Open Positions', points: openPts, max: 20, note: `${d.currentOpenPositions}` });

  // Seniority (15)
  let senPts = 15;
  if (d.positionSeniority === 1) senPts = 15;
  else if (d.positionSeniority === 2) senPts = 9;
  else if (d.positionSeniority === 3) senPts = 4;
  else senPts = 0;
  components.push({ label: 'Position Seniority', points: senPts, max: 15, note: `${d.positionSeniority}${d.positionSeniority === 1 ? 'st' : d.positionSeniority === 2 ? 'nd' : d.positionSeniority === 3 ? 'rd' : 'th'}` });

  // Early payoffs (10) — positive signal
  let epPts = 0;
  if (d.earlyPayoffs >= 2) epPts = 10;
  else if (d.earlyPayoffs === 1) epPts = 6;
  else epPts = 3; // neutral default
  components.push({ label: 'Early Payoffs', points: epPts, max: 10, note: `${d.earlyPayoffs}` });

  const total = components.reduce((s, c) => s + c.points, 0);
  return { total, components };
}

// ══════════════════════════════════════════════════════════════════
// Composite & Tier Mapping
// ══════════════════════════════════════════════════════════════════

export const WEIGHTS = { plaid: 0.45, crs: 0.35, dataMerch: 0.20 } as const;

export function computeComposite(plaid: number, crs: number, dataMerch: number): number {
  return Math.round(plaid * WEIGHTS.plaid + crs * WEIGHTS.crs + dataMerch * WEIGHTS.dataMerch);
}

export function tierFromComposite(composite: number): TierTerms {
  if (composite >= 80) return {
    tier: 1, label: 'Tier 1 — Low Risk',
    holdbackMinPct: 10, holdbackMaxPct: 12,
    factorMin: 1.25, factorMax: 1.30,
    maxAdvancePctOfMonthlyRevenue: 1.00,
  };
  if (composite >= 65) return {
    tier: 2, label: 'Tier 2 — Moderate Risk',
    holdbackMinPct: 13, holdbackMaxPct: 15,
    factorMin: 1.35, factorMax: 1.40,
    maxAdvancePctOfMonthlyRevenue: 0.75,
  };
  if (composite >= 50) return {
    tier: 3, label: 'Tier 3 — Elevated Risk',
    holdbackMinPct: 16, holdbackMaxPct: 18,
    factorMin: 1.42, factorMax: 1.48,
    maxAdvancePctOfMonthlyRevenue: 0.60,
  };
  if (composite >= 35) return {
    tier: 4, label: 'Tier 4 — High Risk',
    holdbackMinPct: 19, holdbackMaxPct: 22,
    factorMin: 1.49, factorMax: 1.55,
    maxAdvancePctOfMonthlyRevenue: 0.45,
  };
  return {
    tier: 'decline', label: 'Decline / Manual Review',
    holdbackMinPct: 0, holdbackMaxPct: 0,
    factorMin: 0, factorMax: 0,
    maxAdvancePctOfMonthlyRevenue: 0,
  };
}

// ══════════════════════════════════════════════════════════════════
// Hard disqualifiers (auto-decline regardless of composite)
// ══════════════════════════════════════════════════════════════════

export interface DisqualifierConfig {
  nsfWindowDays: number;        // default 30
  adbFloor: number;             // default 1000
  revDeclineThresholdPct: number; // default 0.30
  maxOpenPositions: number;     // default 2 (so 3+ disqualifies)
}

export const DEFAULT_DQ: DisqualifierConfig = {
  nsfWindowDays: 30,
  adbFloor: 1000,
  revDeclineThresholdPct: 0.30,
  maxOpenPositions: 2,
};

export function evaluateDisqualifiers(
  inputs: ScoreInputs,
  cfg: DisqualifierConfig = DEFAULT_DQ,
): Disqualifier[] {
  const dq: Disqualifier[] = [];
  if (inputs.crs.activeBankruptcy) {
    dq.push({ code: 'BK', label: 'Active bankruptcy', reason: 'Personal bankruptcy currently active.' });
  }
  if (inputs.dataMerch.priorDefaults >= 2) {
    dq.push({ code: 'PRIOR_DEF', label: '2+ prior MCA defaults', reason: `${inputs.dataMerch.priorDefaults} prior MCA defaults on file.` });
  }
  if (inputs.dataMerch.currentOpenPositions > cfg.maxOpenPositions) {
    dq.push({ code: 'STACKED', label: 'Stacked 3+ positions', reason: `${inputs.dataMerch.currentOpenPositions} open positions currently.` });
  }
  if (inputs.plaid.avgDailyBalance < cfg.adbFloor) {
    dq.push({ code: 'ADB_LOW', label: `ADB below $${cfg.adbFloor.toLocaleString()}`, reason: `Avg daily balance $${inputs.plaid.avgDailyBalance.toLocaleString()}.` });
  }
  if (inputs.plaid.nsfCount90d > 0 && inputs.plaid.daysSinceLastNsf < cfg.nsfWindowDays) {
    dq.push({ code: 'NSF_RECENT', label: `NSF in last ${cfg.nsfWindowDays}d`, reason: `Last NSF ${inputs.plaid.daysSinceLastNsf}d ago.` });
  }
  if (inputs.plaid.revenueChange3moPct <= -cfg.revDeclineThresholdPct) {
    dq.push({
      code: 'REV_DECLINE',
      label: `Revenue declining >${(cfg.revDeclineThresholdPct * 100).toFixed(0)}%`,
      reason: `Revenue down ${(inputs.plaid.revenueChange3moPct * 100).toFixed(0)}% over last 3 months.`,
    });
  }
  return dq;
}

// ══════════════════════════════════════════════════════════════════
// Top-level orchestrator
// ══════════════════════════════════════════════════════════════════

export function evaluateApplication(
  inputs: ScoreInputs,
  cfg: DisqualifierConfig = DEFAULT_DQ,
): ScoringResult {
  const plaidScore = scorePlaid(inputs.plaid);
  const crsScore = scoreCrs(inputs.crs);
  const dataMerchScore = scoreDataMerch(inputs.dataMerch);
  const composite = computeComposite(plaidScore.total, crsScore.total, dataMerchScore.total);
  const disqualifiers = evaluateDisqualifiers(inputs, cfg);
  const terms = disqualifiers.length > 0
    ? tierFromComposite(0) // force decline tier
    : tierFromComposite(composite);

  let decision: ScoringResult['decision'];
  if (disqualifiers.length > 0) decision = 'Auto-Decline';
  else if (composite >= 80 && terms.tier === 1) decision = 'Auto-Approve';
  else if (composite < 35) decision = 'Auto-Decline';
  else decision = 'Manual Review';

  return {
    plaidScore,
    crsScore,
    dataMerchScore,
    composite,
    weighted: {
      plaid: +(plaidScore.total * WEIGHTS.plaid).toFixed(1),
      crs: +(crsScore.total * WEIGHTS.crs).toFixed(1),
      dataMerch: +(dataMerchScore.total * WEIGHTS.dataMerch).toFixed(1),
    },
    terms,
    disqualifiers,
    decision,
  };
}

// ══════════════════════════════════════════════════════════════════
// Income-to-Holdback Stress Test
// ──────────────────────────────────────────────────────────────────
// Daily ACH debit = (Advance × Factor) / TermDays
// Threshold:
//   • Tier 1/2  → daily debit ≤ 20% of avg daily revenue
//   • Tier 3/4  → daily debit ≤ 15% of avg daily revenue
//                 AND daily debit ≤ 15% of ADB (secondary buffer)
// Suggests: max advance that would clear, or min term length.
// ══════════════════════════════════════════════════════════════════

export function stressTest(input: StressTestInputs): StressTestResult {
  const conservative = input.tier === 3 || input.tier === 4;
  const thresholdRevenuePct = conservative ? 0.15 : 0.20;
  const thresholdAdbPct = 0.15;

  const dailyDebit = input.termDays > 0
    ? (input.advanceAmount * input.factorRate) / input.termDays
    : 0;

  const pctOfDailyRevenue = input.avgDailyRevenue > 0 ? dailyDebit / input.avgDailyRevenue : 1;
  const pctOfAdb = input.avgDailyBalance > 0 ? dailyDebit / input.avgDailyBalance : 1;

  const flags: string[] = [];
  if (pctOfDailyRevenue > thresholdRevenuePct) {
    flags.push(`Daily debit is ${(pctOfDailyRevenue * 100).toFixed(1)}% of daily revenue (max ${(thresholdRevenuePct * 100).toFixed(0)}%)`);
  }
  if (conservative && pctOfAdb > thresholdAdbPct) {
    flags.push(`Daily debit is ${(pctOfAdb * 100).toFixed(1)}% of ADB (max ${(thresholdAdbPct * 100).toFixed(0)}% for Tier 3/4)`);
  }

  const passes = flags.length === 0;

  // Suggested max advance at same factor/term that clears the revenue test
  const maxDailyByRev = input.avgDailyRevenue * thresholdRevenuePct;
  const maxDailyByAdb = conservative ? input.avgDailyBalance * thresholdAdbPct : Infinity;
  const maxDaily = Math.min(maxDailyByRev, maxDailyByAdb);
  const suggestedMaxAdvance = input.factorRate > 0
    ? Math.floor((maxDaily * input.termDays) / input.factorRate / 100) * 100
    : 0;

  // Suggested min term at same advance/factor
  const suggestedMinTermDays = maxDaily > 0
    ? Math.ceil((input.advanceAmount * input.factorRate) / maxDaily)
    : input.termDays;

  return {
    dailyDebit: +dailyDebit.toFixed(2),
    pctOfDailyRevenue: +pctOfDailyRevenue.toFixed(4),
    pctOfAdb: +pctOfAdb.toFixed(4),
    thresholdRevenuePct,
    thresholdAdbPct,
    passes,
    flags,
    suggestedMaxAdvance,
    suggestedMinTermDays,
  };
}

// ══════════════════════════════════════════════════════════════════
// Default placeholder inputs (for new applications)
// ══════════════════════════════════════════════════════════════════

export function defaultScoreInputs(seed?: {
  monthlyRevenue?: number;
  avgDailyBalance?: number;
  fico?: number;
  existingPositions?: number;
}): ScoreInputs {
  const mr = safe(seed?.monthlyRevenue, 30000);
  const adb = safe(seed?.avgDailyBalance, 5000);
  return {
    plaid: {
      avgDailyBalance: adb,
      minDailyBalance: Math.max(0, Math.round(adb * 0.3)),
      nsfCount90d: 0,
      daysSinceLastNsf: 9999,
      monthlyRevenue: mr,
      revenueStdDevPct: 0.15,
      revenueTrend: 'flat',
      depositConcentration: 'moderate',
      revenueChange3moPct: 0,
    },
    crs: {
      fico: safe(seed?.fico, 650),
      businessCreditScore: undefined,
      derogatoryMarks: 0,
      creditUtilizationPct: 0.35,
      timeInFileYears: 6,
      activeBankruptcy: false,
    },
    dataMerch: {
      priorPositions: safe(seed?.existingPositions, 0),
      priorDefaults: 0,
      earlyPayoffs: 0,
      currentOpenPositions: safe(seed?.existingPositions, 0),
      positionSeniority: safe(seed?.existingPositions, 0) > 0 ? 2 : 1,
    },
  };
}
