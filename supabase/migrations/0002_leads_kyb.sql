-- ════════════════════════════════════════════════════════════════════
-- 0002_leads_kyb.sql — Add KYB intake column to leads
-- ════════════════════════════════════════════════════════════════════
-- Adds a JSONB `kyb` column to store the full Stripe-style onboarding
-- intake (business, representative, owners, processing profile,
-- funding request, bank on file, uploaded docs, attestation) captured
-- when a new lead is created.
--
-- Safe to run against an existing database — idempotent and non-breaking:
-- legacy leads without KYB data keep working (column is nullable).
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.pipeline_leads
  ADD COLUMN IF NOT EXISTS kyb JSONB;

COMMENT ON COLUMN public.pipeline_leads.kyb IS
  'Full KYB onboarding payload (business, reps, owners, processing, bank, docs, attestation). See src/app/components/backend/crmStore.ts -> KybIntake.';

-- Optional index for querying by MCC or monthly volume (disabled by default).
-- CREATE INDEX IF NOT EXISTS leads_kyb_mcc_idx
--   ON public.pipeline_leads ((kyb -> 'business' ->> 'mcc'));
