-- ════════════════════════════════════════════════════════════════
-- 0006 — External lead IDs for imported leads (Meta / Google Sheet sync)
-- ════════════════════════════════════════════════════════════════
-- Leads pushed in from outside sources (Meta lead ads via the Google
-- Sheet sync) carry the source system's ID so re-syncs never create
-- duplicates. NULL for manually created leads.

ALTER TABLE public.pipeline_leads
  ADD COLUMN IF NOT EXISTS external_id TEXT;

-- UNIQUE constraint (NULLs are distinct, so manual leads are unaffected).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pipeline_leads_external_id_key' AND conrelid = 'public.pipeline_leads'::regclass
  ) THEN
    ALTER TABLE public.pipeline_leads ADD CONSTRAINT pipeline_leads_external_id_key UNIQUE (external_id);
  END IF;
END $$;

COMMENT ON COLUMN public.pipeline_leads.external_id IS
  'ID in the originating system (e.g. Meta lead ID) for deduplicated imports. NULL for manually created leads.';
