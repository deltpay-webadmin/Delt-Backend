# Delt Backend — Tooling Roadmap

**Objective:** a fully functional CRM, Marketing, Analytics, Reporting, and Employee-management platform.

**Where it stands today:** the app is a Figma Make export (React + Vite + Tailwind v4) with ~38 backend screens, but only the CRM core is real. Everything else is mock UI with hardcoded data.

| Area | Status | Evidence |
|---|---|---|
| CRM — Leads / Onboarding / Underwriting / Referrals | ✅ Wired to Supabase (Postgres + realtime, optimistic writes) | `crmStore.ts`, migrations `0001`–`0002` |
| Deals / Capital / Merchants | ✅ Wired to Supabase | migration `0003`, `BackendDeals.tsx`, `BackendCapital.tsx` |
| ACH activity import | ✅ Wired to Supabase | migration `0004`, `achStore.ts`, `AchImportFlow.tsx` |
| Auth | ❌ Fake — passwords hardcoded in client code (`Login.tsx`) | serious security gap, see Phase 0 |
| Employees / Payroll | ❌ Hardcoded arrays in `BackendEmployees.tsx`, `BackendPayroll.tsx` | no tables, no HR data |
| Marketing (Outreach) | ❌ Hardcoded `CAMPAIGNS` in `BackendOutreach.tsx` | no email provider, nothing sends |
| Reports | ❌ Static report catalog, no generation engine | `BackendReports.tsx` |
| Analytics / Financials / Residuals | ❌ Mock data | `BackendAnalysis.tsx`, `BackendFinancials.tsx`, `BackendResiduals.tsx` |
| Inbox / Disputes / Retention / Tasks / Documents | ❌ Mock UI | respective pages |
| RLS | ⚠️ Permissive `anon` policy on all tables | flagged in `SUPABASE_SETUP.md` |

The good news: the hard part (a polished UI for every module) already exists. The work is mostly **backing the mock screens with real data and connecting a small number of external services**.

---

## Phase 0 — Security foundation (blocker, ~1–2 weeks, $0)

Nothing else should go live before this. Today anyone with the URL and the anon key can read/write every table, and real-looking credentials ship in the client bundle.

1. **Supabase Auth** (develop — included in Supabase)
   - Email/password + Google SSO. Replace `Login.tsx`'s hardcoded user list.
   - `profiles` table with `role` (admin / manager / agent / employee) — a role-permission map already exists at `src/app/imports/pasted_text/role-permissions.ts` to seed from.
2. **Row Level Security rewrite** (develop)
   - Replace the permissive `anon` policies with per-role policies keyed on `auth.uid()`; scope agents to `assigned_agent`, reviewers to `reviewer`, etc.
3. **Secrets hygiene** (develop)
   - Remove hardcoded passwords and the baked-in project ref in `src/app/utils/supabase/info.tsx`; rotate the anon key; move all server logic to Edge Functions where the service key lives.

## Phase 1 — CRM completion (develop, ~2–4 weeks, $0–$150/mo)

The pipeline is real; what's missing is the connective tissue around it.

| Need | Recommendation | Buy/Build |
|---|---|---|
| Documents & file storage | **Supabase Storage** (contracts, statements, IDs) — `BackendDocuments.tsx` and `FileUploader.tsx` are ready-made UI | Build (included) |
| E-signature on merchant applications | **Dropbox Sign** (~$25/mo API plan) or DocuSign | Buy + connect |
| Email sync in lead timeline / Inbox page | **Gmail API** (Google Workspace you already use) or **Nylas** if you want two-way sync without building | Connect |
| KYB / underwriting data | **Middesk** (business verification) and/or **Persona/Alloy** for KYC — feeds the `leads_kyb` fields and `underwritingScore.ts` instead of manual entry | Buy + connect |
| Phone / SMS logging | **Twilio** (usage-based, ~$0.0079/SMS) | Buy + connect |
| Tasks / activity timeline | New `tasks` + `activities` tables in Supabase; wire `BackendTasks.tsx` and `BackendActivityTimeline.tsx` | Build |

## Phase 2 — Marketing (~2–3 weeks, ~$20–100/mo)

| Need | Recommendation | Buy/Build |
|---|---|---|
| Transactional + campaign email | **Resend** (Broadcasts + audiences, generous free tier, developer-first) — powers `BackendOutreach.tsx` and `TemplateEditor.tsx`. Alternative if the team wants a no-code campaign editor: Brevo or Mailchimp | Buy + connect |
| Lead-capture forms | **Jotform** (already in your stack) → webhook → Supabase Edge Function → `leads` table | Connect |
| Website analytics | **Vercel Web Analytics** (already on Vercel) or Plausible; feeds `BackendWebsites.tsx` | Connect |
| SMS campaigns | Same Twilio account as Phase 1 | Connect |
| Campaign data model | `campaigns`, `campaign_sends`, `templates` tables + send/track Edge Functions | Build |

## Phase 3 — Analytics & Reporting (~3–4 weeks, $0–$100/mo)

| Need | Recommendation | Buy/Build |
|---|---|---|
| In-app dashboards | Build on **Postgres views/materialized views** + the existing Recharts setup (`ui/chart.tsx`). No new vendor needed — the data is already in Supabase | Build |
| Residuals & financials | This is core ISO domain logic — build it: monthly **residual import pipeline** (CSV from your processor, same pattern as `AchImportFlow`) + commission-split engine in Postgres. Don't outsource this | Build |
| Report generation engine | Supabase **Edge Functions**: `exceljs`/SheetJS for CSV/XLSX, `react-pdf` or headless Chromium for PDF (the `ExportDealReport.tsx` print path already exists). Store outputs in Supabase Storage | Build |
| Scheduled reports | **pg_cron** (built into Supabase) triggers generation; **Resend** emails the file link — powers the schedule UI already drawn in `BackendReports.tsx` | Build |
| Ad-hoc BI for non-engineers | **Metabase** (open-source, free self-hosted or ~$85/mo cloud) pointed straight at the Supabase Postgres — instant answer for "slice this any way" requests without building every view | Buy (optional) |
| Product/usage analytics | **PostHog** (free tier) if you want to know how staff use the tool | Buy (optional) |

## Phase 4 — Employee management (~2–3 weeks, ~$40+/employee/mo if payroll bought)

| Need | Recommendation | Buy/Build |
|---|---|---|
| Employee records, roles, reviews, time-off | Build in Supabase: `employees`, `time_off`, `reviews` tables behind the existing `BackendEmployees.tsx` UI, linked to Auth profiles | Build |
| Payroll | **Do not build payroll.** Connect **Gusto** (best API, ~$40/mo + $6/person) or Rippling/ADP. If you only need read-only payroll data in dashboards, **Finch** gives one API across providers | Buy + connect |
| Agent commissions | Build — it's downstream of the Phase 3 residual engine and `AgentCommissions.tsx` UI already exists | Build |

## Cross-cutting (any time, cheap)

- **Sentry** — error monitoring (free tier). You currently have zero visibility into production errors.
- **GitHub Actions CI** — typecheck + build on PR; there are no tests or CI today.
- **`supabase gen types typescript`** — generated DB types instead of the hand-maintained interfaces in `crmStore.ts`.
- **Supabase branching** for a staging environment once real data exists.

---

## Summary: the shopping list

**Already have / keep:** Supabase (database, auth, storage, edge functions, realtime, cron — this is the backbone; expect ~$25/mo Pro tier), Vercel (hosting + web analytics), GitHub, Google Workspace/Gmail, Jotform.

**Buy/sign up for:** Resend (email), Twilio (SMS/voice), Dropbox Sign (e-sign), Middesk or Persona (KYB/KYC), Gusto or Finch (payroll), and optionally Metabase, PostHog, Sentry.

**Develop (the bulk of the work):** real auth + RLS, schema for the ~10 mock modules, residual/commission engine, report generation engine, campaign sending, and wiring each existing screen to its table — the UI layer is already done.

Rough steady-state SaaS cost before payroll seats: **$100–300/month.** Realistic build timeline with one focused developer: **3–4 months** to cover all five pillars.
