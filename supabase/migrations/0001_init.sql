-- ════════════════════════════════════════════════════════════════════
-- Delt CRM — initial schema, seed data, RLS, and realtime
-- ════════════════════════════════════════════════════════════════════
-- Run this file in the Supabase SQL Editor once per project.
-- It is idempotent for schema (IF NOT EXISTS) but the seed INSERTs will
-- fail if rows already exist — delete all rows first to re-seed.
--
-- Tables:
--   leads, onboarding_apps, underwriting_apps, referrals, referral_program
--
-- Nested arrays are stored as JSONB (timeline, tasks, steps, etc.).
-- Row Level Security is enabled with permissive policies for anon+auth.
-- ════════════════════════════════════════════════════════════════════

-- ── leads ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pipeline_leads (
  id                TEXT PRIMARY KEY,
  business_name     TEXT NOT NULL,
  industry          TEXT NOT NULL DEFAULT 'General',
  contact_name      TEXT,
  contact_email     TEXT,
  contact_phone     TEXT,
  type              TEXT NOT NULL DEFAULT 'MCA',
  source            TEXT,
  monthly_sales     TEXT,
  amount_requested  TEXT,
  score             INTEGER NOT NULL DEFAULT 50,
  status            TEXT NOT NULL DEFAULT 'New',
  priority          TEXT NOT NULL DEFAULT 'Medium',
  last_activity     TEXT,
  assigned_agent    TEXT,
  stage             TEXT NOT NULL DEFAULT 'New',
  timeline          JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes             TEXT NOT NULL DEFAULT '',
  extra_notes       JSONB NOT NULL DEFAULT '[]'::jsonb,
  tasks             JSONB NOT NULL DEFAULT '[]'::jsonb,
  blocker           TEXT,
  step_details      JSONB,
  referred_by       TEXT,
  bundle            JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── onboarding_apps ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.onboarding_apps (
  id                    TEXT PRIMARY KEY,
  merchant_name         TEXT NOT NULL,
  agent                 TEXT NOT NULL,
  current_step          TEXT NOT NULL,
  current_step_index    INTEGER NOT NULL DEFAULT 0,
  time_in_step          TEXT,
  time_in_step_hours    NUMERIC,
  sla_target            TEXT,
  sla_status            TEXT NOT NULL DEFAULT 'On Track',
  submitted_date        TEXT,
  blocker               TEXT,
  steps                 JSONB NOT NULL DEFAULT '[]'::jsonb,
  nudges                INTEGER NOT NULL DEFAULT 0,
  last_nudge            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── underwriting_apps ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.underwriting_apps (
  id                    TEXT PRIMARY KEY,
  application_id        TEXT NOT NULL UNIQUE,
  business_name         TEXT NOT NULL,
  dba                   TEXT,
  industry              TEXT,
  state                 TEXT,
  product_type          TEXT NOT NULL DEFAULT 'MCA',
  requested_amount      NUMERIC NOT NULL DEFAULT 0,
  monthly_revenue       NUMERIC NOT NULL DEFAULT 0,
  avg_daily_balance     NUMERIC NOT NULL DEFAULT 0,
  months_in_business    INTEGER NOT NULL DEFAULT 0,
  credit_score          INTEGER NOT NULL DEFAULT 0,
  existing_positions    INTEGER NOT NULL DEFAULT 0,
  submission_date       TEXT,
  reviewer              TEXT,
  reviewer_initials     TEXT,
  risk_score            INTEGER NOT NULL DEFAULT 0,
  stage                 TEXT NOT NULL DEFAULT 'Received',
  days_in_stage         INTEGER NOT NULL DEFAULT 0,
  sla_threshold         INTEGER NOT NULL DEFAULT 3,
  factor_rate           NUMERIC,
  proposed_payback      NUMERIC,
  daily_payment         NUMERIC,
  holdback_pct          NUMERIC,
  disclosure_state      TEXT,
  missing_docs          JSONB,
  notes                 TEXT,
  source                TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── referrals ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id                    TEXT PRIMARY KEY,
  referring_merchant    TEXT NOT NULL,
  referred_business     TEXT NOT NULL,
  referral_code         TEXT NOT NULL,
  date                  TEXT,
  status                TEXT NOT NULL DEFAULT 'Pending',
  reward_status         TEXT NOT NULL DEFAULT 'Pending',
  reward_amount         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── referral_program (single-row config; id always = 1) ─────────────
CREATE TABLE IF NOT EXISTS public.referral_program (
  id             INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  reward_amount  TEXT NOT NULL DEFAULT '100',
  free_months    TEXT NOT NULL DEFAULT '1',
  plan_tier      TEXT NOT NULL DEFAULT 'Growth',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── updated_at trigger helper ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['pipeline_leads','onboarding_apps','underwriting_apps','referrals','referral_program'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_touch ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER %I_touch BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
  END LOOP;
END $$;

-- ── Row Level Security (permissive — no auth yet) ───────────────────
ALTER TABLE public.pipeline_leads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_apps    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.underwriting_apps  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_program   ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['pipeline_leads','onboarding_apps','underwriting_apps','referrals','referral_program'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_anon_all ON public.%I', t, t);
    EXECUTE format($p$CREATE POLICY %I_anon_all ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)$p$, t, t);
  END LOOP;
END $$;

-- ── Realtime (allow multi-client live sync) ─────────────────────────
-- Silently skip if the publication already has the table.
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['pipeline_leads','onboarding_apps','underwriting_apps','referrals','referral_program'])
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN
      -- already in publication
      NULL;
    END;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════════
-- Seed data (safe to skip if tables already populated)
-- ════════════════════════════════════════════════════════════════════

-- Seed: leads
INSERT INTO public.pipeline_leads (id, business_name, industry, contact_name, contact_email, contact_phone, type, source, monthly_sales, amount_requested, score, status, priority, last_activity, assigned_agent, stage, timeline, notes, extra_notes, tasks, blocker, step_details, referred_by, bundle) VALUES ('lead-001', 'Green Valley Auto Repair', 'Automotive', 'Robert Martinez', 'robert@greenvalleyauto.com', '(555) 123-4567', 'MCA', 'Website Inquiry', '$45,000', '$75,000', 82, 'In Progress', 'High', '2 hours ago', 'Sarah Johnson', 'Qualified', '[{"title":"Follow-up call completed","description":"Discussed terms and pricing structure","user":"Sarah Johnson","timestamp":"2 hours ago"},{"title":"Bank statements received","description":"6 months of statements uploaded","user":"System","timestamp":"1 day ago"},{"title":"Initial email sent","description":"Introduced Delt Pay services","user":"Sarah Johnson","timestamp":"3 days ago"}]'::jsonb, 'Strong financials. Owner is motivated and ready to move forward. Prefers daily payment option. Consider offering 1.15 factor rate.', '[]'::jsonb, '[{"id":"t1","title":"Follow up call scheduled","due":"Tomorrow at 2:00 PM","done":false},{"id":"t2","title":"Request bank statements","due":"Completed yesterday","done":true},{"id":"t3","title":"Send proposal to client","due":"Due in 3 days","done":false}]'::jsonb, NULL, NULL, 'Metro Diner Group', NULL);
INSERT INTO public.pipeline_leads (id, business_name, industry, contact_name, contact_email, contact_phone, type, source, monthly_sales, amount_requested, score, status, priority, last_activity, assigned_agent, stage, timeline, notes, extra_notes, tasks, blocker, step_details, referred_by, bundle) VALUES ('lead-002', 'Urban Wellness Spa', 'Health & Wellness', 'Jennifer Lee', 'jlee@urbanwellness.com', '(555) 234-5678', 'Leasing', 'Referral Partner', '$62,000', '$120,000', 91, 'In Progress', 'High', '4 hours ago', 'Michael Chen', 'Underwriting', '[{"title":"Tax return requested (2nd)","description":"Emailed and SMS reminder sent","user":"Michael Chen","timestamp":"1 day ago"},{"title":"ID verified","description":"Identity verification passed","user":"System","timestamp":"Apr 2"},{"title":"Discovery call","description":"Discussed equipment needs and financing","user":"Michael Chen","timestamp":"2 days ago"}]'::jsonb, 'Excellent credit profile. Looking to lease new spa equipment worth $120K. Stuck waiting on tax docs.', '[]'::jsonb, '[]'::jsonb, 'Missing tax return — requested from merchant twice, no response', '[{"stage":"Application Submitted","completedAt":"Apr 1, 9:00 AM"},{"stage":"Bank Verification","completedAt":"Apr 1, 4:30 PM"},{"stage":"Identity Verification","completedAt":"Apr 2, 10:20 AM"},{"stage":"Underwriting","completedAt":null},{"stage":"Docs & E-Sign","completedAt":null},{"stage":"Funded","completedAt":null}]'::jsonb, 'Coastal Seafood Inc', NULL);
INSERT INTO public.pipeline_leads (id, business_name, industry, contact_name, contact_email, contact_phone, type, source, monthly_sales, amount_requested, score, status, priority, last_activity, assigned_agent, stage, timeline, notes, extra_notes, tasks, blocker, step_details, referred_by, bundle) VALUES ('lead-003', 'Lakeside Bistro', 'Food & Beverage', 'David Thompson', 'david@lakesidebistro.com', '(555) 345-6789', 'MCA', 'Cold Outreach', '$28,000', '$50,000', 58, 'New', 'Medium', '1 day ago', 'Sarah Johnson', 'New', '[{"title":"Lead created","description":"Added to pipeline from cold outreach","user":"Sarah Johnson","timestamp":"1 day ago"}]'::jsonb, 'Initial contact made. Waiting for callback to schedule discovery call.', '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL);
INSERT INTO public.pipeline_leads (id, business_name, industry, contact_name, contact_email, contact_phone, type, source, monthly_sales, amount_requested, score, status, priority, last_activity, assigned_agent, stage, timeline, notes, extra_notes, tasks, blocker, step_details, referred_by, bundle) VALUES ('lead-004', 'TechStart Solutions', 'Technology', 'Amanda Rodriguez', 'arodriguez@techstart.io', '(555) 456-7890', 'Residual', 'LinkedIn', '$180,000', '$250,000', 95, 'Won', 'High', '3 days ago', 'James Miller', 'Funded', '[{"title":"Deal funded","description":"Funds disbursed — $250K","user":"System","timestamp":"Mar 25"},{"title":"Docs signed","description":"E-sign completed by merchant","user":"System","timestamp":"Mar 24"}]'::jsonb, 'Excellent deal closed. Strong residual opportunity with their payment volume.', '[]'::jsonb, '[]'::jsonb, NULL, '[{"stage":"Application Submitted","completedAt":"Mar 20, 11:00 AM"},{"stage":"Bank Verification","completedAt":"Mar 20, 5:45 PM"},{"stage":"Identity Verification","completedAt":"Mar 21, 9:30 AM"},{"stage":"Underwriting","completedAt":"Mar 22, 2:00 PM"},{"stage":"Docs & E-Sign","completedAt":"Mar 24, 10:15 AM"},{"stage":"Funded","completedAt":"Mar 25, 9:00 AM"}]'::jsonb, NULL, NULL);
INSERT INTO public.pipeline_leads (id, business_name, industry, contact_name, contact_email, contact_phone, type, source, monthly_sales, amount_requested, score, status, priority, last_activity, assigned_agent, stage, timeline, notes, extra_notes, tasks, blocker, step_details, referred_by, bundle) VALUES ('lead-005', 'Coastal Construction LLC', 'Construction', 'Mark Stevens', 'mstevens@coastalconstruction.com', '(555) 567-8901', 'MCA', 'Trade Show', '$95,000', '$150,000', 72, 'In Progress', 'Medium', '6 hours ago', 'Michael Chen', 'Bank Verification', '[{"title":"Plaid link SMS sent","description":"Reminded merchant to connect bank","user":"Michael Chen","timestamp":"6 hours ago"},{"title":"Met at trade show","description":"Collected business card and initial interest","user":"Michael Chen","timestamp":"4 days ago"}]'::jsonb, 'Seasonal business. Needs capital for equipment purchase. Awaiting bank connection.', '[]'::jsonb, '[]'::jsonb, 'Awaiting Plaid link — merchant has not connected bank account', '[{"stage":"Application Submitted","completedAt":"Apr 8, 10:30 AM"},{"stage":"Bank Verification","completedAt":null},{"stage":"Identity Verification","completedAt":null},{"stage":"Underwriting","completedAt":null},{"stage":"Docs & E-Sign","completedAt":null},{"stage":"Funded","completedAt":null}]'::jsonb, NULL, NULL);
INSERT INTO public.pipeline_leads (id, business_name, industry, contact_name, contact_email, contact_phone, type, source, monthly_sales, amount_requested, score, status, priority, last_activity, assigned_agent, stage, timeline, notes, extra_notes, tasks, blocker, step_details, referred_by, bundle) VALUES ('lead-006', 'Metro Pet Care', 'Pet Services', 'Lisa Parker', 'lisa@metropetcare.com', '(555) 678-9012', 'MCA', 'Referral Partner', '$38,000', '$60,000', 45, 'Lost', 'Low', '2 weeks ago', 'Sarah Johnson', 'Qualified', '[{"title":"Lead marked lost","description":"Credit score too low for approval","user":"Sarah Johnson","timestamp":"2 weeks ago"},{"title":"Qualification call","description":"Identified credit issues","user":"Sarah Johnson","timestamp":"3 weeks ago"}]'::jsonb, 'Credit score below 620. Recommended to reapply in 6 months after improving credit.', '[]'::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL);
INSERT INTO public.pipeline_leads (id, business_name, industry, contact_name, contact_email, contact_phone, type, source, monthly_sales, amount_requested, score, status, priority, last_activity, assigned_agent, stage, timeline, notes, extra_notes, tasks, blocker, step_details, referred_by, bundle) VALUES ('lead-007', 'Pinnacle Dental Group', 'Healthcare', 'Dr. Sarah Mills', 'smills@pinnacledental.com', '(555) 789-0123', 'MCA', 'Website Inquiry', '$110,000', '$200,000', 88, 'In Progress', 'High', '1 day ago', 'James Miller', 'Docs & E-Sign', '[{"title":"E-sign link emailed","description":"Funding agreement sent for signature","user":"System","timestamp":"1 day ago"},{"title":"Underwriting approved","description":"$200K approved at 1.25 factor","user":"System","timestamp":"Apr 6"}]'::jsonb, 'Strong dental practice. Underwriting approved quickly. Awaiting final signature.', '[]'::jsonb, '[]'::jsonb, 'E-sign link sent — awaiting merchant signature on funding agreement', '[{"stage":"Application Submitted","completedAt":"Apr 3, 2:10 PM"},{"stage":"Bank Verification","completedAt":"Apr 3, 6:30 PM"},{"stage":"Identity Verification","completedAt":"Apr 4, 8:45 AM"},{"stage":"Underwriting","completedAt":"Apr 6, 10:00 AM"},{"stage":"Docs & E-Sign","completedAt":null},{"stage":"Funded","completedAt":null}]'::jsonb, NULL, NULL);
INSERT INTO public.pipeline_leads (id, business_name, industry, contact_name, contact_email, contact_phone, type, source, monthly_sales, amount_requested, score, status, priority, last_activity, assigned_agent, stage, timeline, notes, extra_notes, tasks, blocker, step_details, referred_by, bundle) VALUES ('lead-008', 'Summit Freight Services', 'Logistics', 'Carlos Reyes', 'creyes@summitfreight.com', '(555) 890-1234', 'MCA', 'Cold Outreach', '$72,000', '$100,000', 67, 'In Progress', 'Medium', '12 hours ago', 'Sarah Johnson', 'Identity Verification', '[{"title":"SMS sent for ID re-upload","description":"Photo too blurry for verification","user":"System","timestamp":"12 hours ago"},{"title":"Bank verified via Plaid","description":"Bank account connected successfully","user":"System","timestamp":"Apr 6"}]'::jsonb, 'Freight company with steady revenue. Stuck on ID verification — blurry photo.', '[]'::jsonb, '[]'::jsonb, 'ID photo blurry — re-upload requested via SMS', '[{"stage":"Application Submitted","completedAt":"Apr 6, 11:00 AM"},{"stage":"Bank Verification","completedAt":"Apr 6, 5:15 PM"},{"stage":"Identity Verification","completedAt":null},{"stage":"Underwriting","completedAt":null},{"stage":"Docs & E-Sign","completedAt":null},{"stage":"Funded","completedAt":null}]'::jsonb, NULL, NULL);

-- Seed: onboarding_apps
INSERT INTO public.onboarding_apps (id, merchant_name, agent, current_step, current_step_index, time_in_step, time_in_step_hours, sla_target, sla_status, submitted_date, blocker, steps, nudges, last_nudge) VALUES ('ONB-001', 'Sunrise Bakery LLC', 'Marcus Johnson', 'Bank Verification', 1, '22 hrs', 22, '24 hrs', 'At Risk', 'Apr 7, 2026', 'Awaiting Plaid link — merchant has not connected bank account', '[{"step":"Application Submitted","completedAt":"Apr 7, 10:30 AM","slaTarget":"—"},{"step":"Bank Verification","completedAt":null,"slaTarget":"24 hrs"},{"step":"Identity Verification","completedAt":null,"slaTarget":"24 hrs"},{"step":"Underwriting","completedAt":null,"slaTarget":"48 hrs"},{"step":"Docs & E-Sign","completedAt":null,"slaTarget":"72 hrs"},{"step":"Funded","completedAt":null,"slaTarget":"24 hrs"}]'::jsonb, 0, NULL);
INSERT INTO public.onboarding_apps (id, merchant_name, agent, current_step, current_step_index, time_in_step, time_in_step_hours, sla_target, sla_status, submitted_date, blocker, steps, nudges, last_nudge) VALUES ('ONB-002', 'Peak Construction Co', 'Priya Patel', 'Underwriting', 3, '3.2 days', 76.8, '48 hrs', 'Breached', 'Apr 2, 2026', 'Missing tax return — requested from merchant twice, no response', '[{"step":"Application Submitted","completedAt":"Apr 2, 9:15 AM","slaTarget":"—"},{"step":"Bank Verification","completedAt":"Apr 2, 3:40 PM","slaTarget":"24 hrs"},{"step":"Identity Verification","completedAt":"Apr 3, 11:20 AM","slaTarget":"24 hrs"},{"step":"Underwriting","completedAt":null,"slaTarget":"48 hrs"},{"step":"Docs & E-Sign","completedAt":null,"slaTarget":"72 hrs"},{"step":"Funded","completedAt":null,"slaTarget":"24 hrs"}]'::jsonb, 1, NULL);
INSERT INTO public.onboarding_apps (id, merchant_name, agent, current_step, current_step_index, time_in_step, time_in_step_hours, sla_target, sla_status, submitted_date, blocker, steps, nudges, last_nudge) VALUES ('ONB-003', 'Coastal Seafood Inc', 'Jamal Foster', 'Docs & E-Sign', 4, '1.5 days', 36, '72 hrs', 'On Track', 'Apr 4, 2026', 'E-sign link sent — awaiting merchant signature on funding agreement', '[{"step":"Application Submitted","completedAt":"Apr 4, 2:10 PM","slaTarget":"—"},{"step":"Bank Verification","completedAt":"Apr 4, 6:30 PM","slaTarget":"24 hrs"},{"step":"Identity Verification","completedAt":"Apr 5, 8:45 AM","slaTarget":"24 hrs"},{"step":"Underwriting","completedAt":"Apr 6, 10:00 AM","slaTarget":"48 hrs"},{"step":"Docs & E-Sign","completedAt":null,"slaTarget":"72 hrs"},{"step":"Funded","completedAt":null,"slaTarget":"24 hrs"}]'::jsonb, 0, NULL);
INSERT INTO public.onboarding_apps (id, merchant_name, agent, current_step, current_step_index, time_in_step, time_in_step_hours, sla_target, sla_status, submitted_date, blocker, steps, nudges, last_nudge) VALUES ('ONB-004', 'Metro Diner Group', 'Marcus Johnson', 'Identity Verification', 2, '26 hrs', 26, '24 hrs', 'Breached', 'Apr 6, 2026', 'ID photo blurry — re-upload requested via SMS', '[{"step":"Application Submitted","completedAt":"Apr 6, 11:00 AM","slaTarget":"—"},{"step":"Bank Verification","completedAt":"Apr 6, 5:15 PM","slaTarget":"24 hrs"},{"step":"Identity Verification","completedAt":null,"slaTarget":"24 hrs"},{"step":"Underwriting","completedAt":null,"slaTarget":"48 hrs"},{"step":"Docs & E-Sign","completedAt":null,"slaTarget":"72 hrs"},{"step":"Funded","completedAt":null,"slaTarget":"24 hrs"}]'::jsonb, 0, NULL);
INSERT INTO public.onboarding_apps (id, merchant_name, agent, current_step, current_step_index, time_in_step, time_in_step_hours, sla_target, sla_status, submitted_date, blocker, steps, nudges, last_nudge) VALUES ('ONB-005', 'Bright Auto Sales', 'Devon Richards', 'Application Submitted', 0, '4 hrs', 4, '—', 'On Track', 'Apr 9, 2026', 'Application under initial review — all fields complete', '[{"step":"Application Submitted","completedAt":null,"slaTarget":"—"},{"step":"Bank Verification","completedAt":null,"slaTarget":"24 hrs"},{"step":"Identity Verification","completedAt":null,"slaTarget":"24 hrs"},{"step":"Underwriting","completedAt":null,"slaTarget":"48 hrs"},{"step":"Docs & E-Sign","completedAt":null,"slaTarget":"72 hrs"},{"step":"Funded","completedAt":null,"slaTarget":"24 hrs"}]'::jsonb, 0, NULL);
INSERT INTO public.onboarding_apps (id, merchant_name, agent, current_step, current_step_index, time_in_step, time_in_step_hours, sla_target, sla_status, submitted_date, blocker, steps, nudges, last_nudge) VALUES ('ONB-006', 'Lakeside Catering', 'Sarah Kim', 'Bank Verification', 1, '12 hrs', 12, '24 hrs', 'On Track', 'Apr 8, 2026', 'Plaid connected — awaiting 3-day transaction pull to complete', '[{"step":"Application Submitted","completedAt":"Apr 8, 9:00 AM","slaTarget":"—"},{"step":"Bank Verification","completedAt":null,"slaTarget":"24 hrs"},{"step":"Identity Verification","completedAt":null,"slaTarget":"24 hrs"},{"step":"Underwriting","completedAt":null,"slaTarget":"48 hrs"},{"step":"Docs & E-Sign","completedAt":null,"slaTarget":"72 hrs"},{"step":"Funded","completedAt":null,"slaTarget":"24 hrs"}]'::jsonb, 0, NULL);

-- Seed: underwriting_apps
INSERT INTO public.underwriting_apps (id, application_id, business_name, dba, industry, state, product_type, requested_amount, monthly_revenue, avg_daily_balance, months_in_business, credit_score, existing_positions, submission_date, reviewer, reviewer_initials, risk_score, stage, days_in_stage, sla_threshold, factor_rate, proposed_payback, daily_payment, holdback_pct, disclosure_state, missing_docs, notes, source) VALUES ('app-001', 'UW-2026-0147', 'TechForward Solutions', 'TechForward', 'IT Services', 'NY', 'MCA', 200000, 85000, 14200, 48, 712, 0, 'Apr 17, 2026', 'Sarah Mitchell', 'SM', 88, 'Received', 0, 2, NULL, NULL, NULL, NULL, NULL, '["Last 3 months bank statements","Voided check"]'::jsonb, NULL, 'Direct — Website');
INSERT INTO public.underwriting_apps (id, application_id, business_name, dba, industry, state, product_type, requested_amount, monthly_revenue, avg_daily_balance, months_in_business, credit_score, existing_positions, submission_date, reviewer, reviewer_initials, risk_score, stage, days_in_stage, sla_threshold, factor_rate, proposed_payback, daily_payment, holdback_pct, disclosure_state, missing_docs, notes, source) VALUES ('app-002', 'UW-2026-0148', 'Miami Spice Kitchen', 'Miami Spice', 'Restaurant', 'FL', 'MCA', 75000, 42000, 6800, 36, 645, 1, 'Apr 17, 2026', 'David Kim', 'DK', 71, 'Received', 0, 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Agent — Marcus Johnson');
INSERT INTO public.underwriting_apps (id, application_id, business_name, dba, industry, state, product_type, requested_amount, monthly_revenue, avg_daily_balance, months_in_business, credit_score, existing_positions, submission_date, reviewer, reviewer_initials, risk_score, stage, days_in_stage, sla_threshold, factor_rate, proposed_payback, daily_payment, holdback_pct, disclosure_state, missing_docs, notes, source) VALUES ('app-003', 'UW-2026-0143', 'Sunrise Cafe & Bakery', NULL, 'Restaurant / Bakery', 'NY', 'MCA', 125000, 37500, 5100, 24, 668, 0, 'Apr 15, 2026', 'David Kim', 'DK', 78, 'Doc Collection', 2, 3, NULL, NULL, NULL, NULL, NULL, '["Tax returns (2024)","Landlord letter"]'::jsonb, NULL, 'ISO — Apex Funding');
INSERT INTO public.underwriting_apps (id, application_id, business_name, dba, industry, state, product_type, requested_amount, monthly_revenue, avg_daily_balance, months_in_business, credit_score, existing_positions, submission_date, reviewer, reviewer_initials, risk_score, stage, days_in_stage, sla_threshold, factor_rate, proposed_payback, daily_payment, holdback_pct, disclosure_state, missing_docs, notes, source) VALUES ('app-004', 'UW-2026-0141', 'Coastal Construction LLC', NULL, 'Construction', 'VA', 'Term Loan', 180000, 95000, 18200, 72, 701, 1, 'Apr 14, 2026', 'Michael Torres', 'MT', 68, 'Bank Review', 3, 3, NULL, NULL, NULL, NULL, 'VA HB 1027', NULL, 'Large deposits irregular — need to verify contract payments', 'Direct — Website');
INSERT INTO public.underwriting_apps (id, application_id, business_name, dba, industry, state, product_type, requested_amount, monthly_revenue, avg_daily_balance, months_in_business, credit_score, existing_positions, submission_date, reviewer, reviewer_initials, risk_score, stage, days_in_stage, sla_threshold, factor_rate, proposed_payback, daily_payment, holdback_pct, disclosure_state, missing_docs, notes, source) VALUES ('app-005', 'UW-2026-0145', 'Urban Wellness Spa', NULL, 'Health & Wellness', 'FL', 'MCA', 150000, 62000, 9400, 42, 724, 0, 'Apr 13, 2026', 'Michael Torres', 'MT', 91, 'Credit Analysis', 4, 5, 1.35, 202500, 675, 15, NULL, NULL, NULL, 'Referral Partner');
INSERT INTO public.underwriting_apps (id, application_id, business_name, dba, industry, state, product_type, requested_amount, monthly_revenue, avg_daily_balance, months_in_business, credit_score, existing_positions, submission_date, reviewer, reviewer_initials, risk_score, stage, days_in_stage, sla_threshold, factor_rate, proposed_payback, daily_payment, holdback_pct, disclosure_state, missing_docs, notes, source) VALUES ('app-006', 'UW-2026-0138', 'Green Valley Auto Repair', NULL, 'Automotive', 'CA', 'Revenue Based', 75000, 45000, 7200, 60, 690, 2, 'Apr 12, 2026', 'Sarah Mitchell', 'SM', 62, 'Credit Analysis', 5, 5, 1.42, 106500, 425, 18, 'CA SB 1235', NULL, '2 existing positions — stacking risk. Verify payoff on 1st position.', 'Direct — Website');
INSERT INTO public.underwriting_apps (id, application_id, business_name, dba, industry, state, product_type, requested_amount, monthly_revenue, avg_daily_balance, months_in_business, credit_score, existing_positions, submission_date, reviewer, reviewer_initials, risk_score, stage, days_in_stage, sla_threshold, factor_rate, proposed_payback, daily_payment, holdback_pct, disclosure_state, missing_docs, notes, source) VALUES ('app-007', 'UW-2026-0139', 'Brooklyn Vinyl Records', NULL, 'Retail', 'NY', 'MCA', 50000, 28000, 4100, 18, 632, 0, 'Apr 11, 2026', 'David Kim', 'DK', 74, 'Committee', 2, 2, 1.38, 69000, 276, 15, NULL, NULL, 'Low TIB (18mo). Revenue trend positive. Recommend approval with conservative terms.', 'Direct — Website');
INSERT INTO public.underwriting_apps (id, application_id, business_name, dba, industry, state, product_type, requested_amount, monthly_revenue, avg_daily_balance, months_in_business, credit_score, existing_positions, submission_date, reviewer, reviewer_initials, risk_score, stage, days_in_stage, sla_threshold, factor_rate, proposed_payback, daily_payment, holdback_pct, disclosure_state, missing_docs, notes, source) VALUES ('app-008', 'UW-2026-0136', 'Havana Bites Cafe', NULL, 'Restaurant', 'FL', 'MCA', 45000, 34000, 5800, 30, 658, 0, 'Apr 10, 2026', 'Michael Torres', 'MT', 85, 'Approved', 1, 7, 1.32, 59400, 198, 12, NULL, NULL, NULL, 'Direct — Website');
INSERT INTO public.underwriting_apps (id, application_id, business_name, dba, industry, state, product_type, requested_amount, monthly_revenue, avg_daily_balance, months_in_business, credit_score, existing_positions, submission_date, reviewer, reviewer_initials, risk_score, stage, days_in_stage, sla_threshold, factor_rate, proposed_payback, daily_payment, holdback_pct, disclosure_state, missing_docs, notes, source) VALUES ('app-009', 'UW-2026-0135', 'SoBe Cycle & Fitness', NULL, 'Fitness', 'FL', 'MCA', 100000, 56000, 8900, 54, 738, 0, 'Apr 9, 2026', 'Sarah Mitchell', 'SM', 93, 'Approved', 2, 7, 1.28, 128000, 427, 12, NULL, NULL, NULL, 'Direct — Website');
INSERT INTO public.underwriting_apps (id, application_id, business_name, dba, industry, state, product_type, requested_amount, monthly_revenue, avg_daily_balance, months_in_business, credit_score, existing_positions, submission_date, reviewer, reviewer_initials, risk_score, stage, days_in_stage, sla_threshold, factor_rate, proposed_payback, daily_payment, holdback_pct, disclosure_state, missing_docs, notes, source) VALUES ('app-010', 'UW-2026-0129', 'Metro Pet Care', NULL, 'Pet Services', 'NJ', 'MCA', 60000, 38000, 2100, 12, 548, 3, 'Apr 5, 2026', 'David Kim', 'DK', 32, 'Declined', 5, 5, NULL, NULL, NULL, NULL, NULL, NULL, 'Low credit, 3 existing positions, low ADB relative to request. High stacking risk.', 'Direct — Website');
INSERT INTO public.underwriting_apps (id, application_id, business_name, dba, industry, state, product_type, requested_amount, monthly_revenue, avg_daily_balance, months_in_business, credit_score, existing_positions, submission_date, reviewer, reviewer_initials, risk_score, stage, days_in_stage, sla_threshold, factor_rate, proposed_payback, daily_payment, holdback_pct, disclosure_state, missing_docs, notes, source) VALUES ('app-011', 'UW-2026-0127', 'Doral Fresh Market', NULL, 'Grocery', 'FL', 'MCA', 40000, 31000, 2800, 14, 582, 2, 'Apr 3, 2026', 'Michael Torres', 'MT', 38, 'Declined', 8, 5, NULL, NULL, NULL, NULL, NULL, NULL, 'Negative cash flow trend. Multiple NSFs on bank statements. Adverse action sent.', 'Direct — Website');

-- Seed: referrals
INSERT INTO public.referrals (id, referring_merchant, referred_business, referral_code, date, status, reward_status, reward_amount) VALUES ('REF-001', 'Metro Diner Group', 'Valley Pizza Co', 'METRO-2024A', 'Mar 28, 2026', 'Converted', 'Paid', '$100');
INSERT INTO public.referrals (id, referring_merchant, referred_business, referral_code, date, status, reward_status, reward_amount) VALUES ('REF-002', 'Coastal Seafood Inc', 'Harbor Fish Market', 'COAST-7X91', 'Apr 2, 2026', 'Contacted', 'Pending', '$100');
INSERT INTO public.referrals (id, referring_merchant, referred_business, referral_code, date, status, reward_status, reward_amount) VALUES ('REF-003', 'Bright Auto Sales', 'Sunrise Auto Body', 'BRIGHT-KQ33', 'Apr 5, 2026', 'Pending', 'Pending', '$100');
INSERT INTO public.referrals (id, referring_merchant, referred_business, referral_code, date, status, reward_status, reward_amount) VALUES ('REF-004', 'Lakeside Catering', 'Greenfield Events LLC', 'LAKE-PP82', 'Feb 15, 2026', 'Expired', 'N/A', '—');

-- Seed: referral_program
INSERT INTO public.referral_program (id, reward_amount, free_months, plan_tier) VALUES (1, '100', '1', 'Growth');
