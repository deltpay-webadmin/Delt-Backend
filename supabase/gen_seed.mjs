// Generates the seed portion of 0001_init.sql by importing seed arrays from crmStore.
// Run: node supabase/gen_seed.mjs > supabase/migrations/_seed.sql
//
// We re-declare the seed arrays here inline so we don't have to strip TS types.
// This file is kept in the repo so the seed can be regenerated if needed.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const storeSrc = readFileSync(join(__dirname, '../src/app/components/backend/crmStore.ts'), 'utf8');

// Extract the 5 seed arrays + program default using a simple regex scan.
// Each seed is declared as: const seedX: T = [ ... ];
function extract(name) {
  const re = new RegExp(`const ${name}[^=]*=\\s*`, 'm');
  const m = storeSrc.match(re);
  if (!m) throw new Error(`Cannot find ${name}`);
  const start = m.index + m[0].length;
  // Find matching bracket.
  let depth = 0;
  let i = start;
  let inStr = false;
  let strCh = '';
  for (; i < storeSrc.length; i++) {
    const c = storeSrc[i];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === strCh) inStr = false;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { inStr = true; strCh = c; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  return storeSrc.slice(start, i);
}

const seedLeadsSrc = extract('seedLeads');
const seedOnbSrc = extract('seedOnboarding');
const seedUwSrc = extract('seedUnderwriting');
const seedRefSrc = extract('seedReferrals');

// Evaluate via dynamic import of a tiny eval module.
const evalModule = `
export const seedLeads = ${seedLeadsSrc};
export const seedOnboarding = ${seedOnbSrc};
export const seedUnderwriting = ${seedUwSrc};
export const seedReferrals = ${seedRefSrc};
`;
const tmp = join(__dirname, '_seed_eval.mjs');
writeFileSync(tmp, evalModule);
const { seedLeads, seedOnboarding, seedUnderwriting, seedReferrals } = await import('./_seed_eval.mjs');

// Helpers
const q = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const jb = (v) => {
  if (v === null || v === undefined) return 'NULL';
  return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
};

let sql = '';

// ── leads ──
sql += '-- Seed: leads\n';
for (const l of seedLeads) {
  sql += `INSERT INTO public.leads (id, business_name, industry, contact_name, contact_email, contact_phone, type, source, monthly_sales, amount_requested, score, status, priority, last_activity, assigned_agent, stage, timeline, notes, extra_notes, tasks, blocker, step_details, referred_by, bundle) VALUES (${[
    q(l.id), q(l.businessName), q(l.industry), q(l.contactName), q(l.contactEmail), q(l.contactPhone),
    q(l.type), q(l.source), q(l.monthlySales), q(l.amountRequested), q(l.score), q(l.status),
    q(l.priority), q(l.lastActivity), q(l.assignedAgent), q(l.stage),
    jb(l.timeline || []), q(l.notes || ''), jb(l.extraNotes || []), jb(l.tasks || []),
    q(l.blocker || null), jb(l.stepDetails || null), q(l.referredBy || null), jb(l.bundle || null),
  ].join(', ')});\n`;
}

// ── onboarding_apps ──
sql += '\n-- Seed: onboarding_apps\n';
for (const o of seedOnboarding) {
  sql += `INSERT INTO public.onboarding_apps (id, merchant_name, agent, current_step, current_step_index, time_in_step, time_in_step_hours, sla_target, sla_status, submitted_date, blocker, steps, nudges, last_nudge) VALUES (${[
    q(o.id), q(o.merchantName), q(o.agent), q(o.currentStep), q(o.currentStepIndex),
    q(o.timeInStep), q(o.timeInStepHours), q(o.slaTarget), q(o.slaStatus),
    q(o.submittedDate), q(o.blocker || null), jb(o.steps || []),
    q(o.nudges ?? 0), q(o.lastNudge || null),
  ].join(', ')});\n`;
}

// ── underwriting_apps ──
sql += '\n-- Seed: underwriting_apps\n';
for (const a of seedUnderwriting) {
  sql += `INSERT INTO public.underwriting_apps (id, application_id, business_name, dba, industry, state, product_type, requested_amount, monthly_revenue, avg_daily_balance, months_in_business, credit_score, existing_positions, submission_date, reviewer, reviewer_initials, risk_score, stage, days_in_stage, sla_threshold, factor_rate, proposed_payback, daily_payment, holdback_pct, disclosure_state, missing_docs, notes, source) VALUES (${[
    q(a.id), q(a.applicationId), q(a.businessName), q(a.dba || null), q(a.industry), q(a.state),
    q(a.productType), q(a.requestedAmount), q(a.monthlyRevenue), q(a.avgDailyBalance),
    q(a.monthsInBusiness), q(a.creditScore), q(a.existingPositions), q(a.submissionDate),
    q(a.reviewer), q(a.reviewerInitials), q(a.riskScore), q(a.stage),
    q(a.daysInStage), q(a.slaThreshold), q(a.factorRate ?? null), q(a.proposedPayback ?? null),
    q(a.dailyPayment ?? null), q(a.holdbackPct ?? null), q(a.disclosureState || null),
    jb(a.missingDocs || null), q(a.notes || null), q(a.source),
  ].join(', ')});\n`;
}

// ── referrals ──
sql += '\n-- Seed: referrals\n';
for (const r of seedReferrals) {
  sql += `INSERT INTO public.referrals (id, referring_merchant, referred_business, referral_code, date, status, reward_status, reward_amount) VALUES (${[
    q(r.id), q(r.referringMerchant), q(r.referredBusiness), q(r.referralCode),
    q(r.date), q(r.status), q(r.rewardStatus), q(r.rewardAmount),
  ].join(', ')});\n`;
}

// ── referral_program ──
sql += "\n-- Seed: referral_program\n";
sql += "INSERT INTO public.referral_program (id, reward_amount, free_months, plan_tier) VALUES (1, '100', '1', 'Growth');\n";

process.stdout.write(sql);
