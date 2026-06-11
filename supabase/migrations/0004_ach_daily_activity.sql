-- ════════════════════════════════════════════════════════════
-- 0004_ach_daily_activity.sql
-- ────────────────────────────────────────────────────────────
-- Extends capital_deals with partner-split + flexible payment
-- schedule columns, and adds the ach_daily_activity ledger fed
-- by ACH.com RptActivitySummary CSV exports.
-- ════════════════════════════════════════════════════════════

-- ─── capital_deals: partner-split + flexible payment columns ─────
ALTER TABLE public.capital_deals
  ADD COLUMN IF NOT EXISTS weekly_payment NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS monthly_payment NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS commission NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS balloon NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS rep TEXT,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS anshu_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS patrick_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS delt_retained_pct NUMERIC(5,2);

-- ─── ach_daily_activity: one row per (processing_date, record_type) ────
CREATE TABLE IF NOT EXISTS public.ach_daily_activity (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processing_date       DATE NOT NULL,
  record_type           TEXT NOT NULL CHECK (record_type IN ('ORIGINATION','Settlement','Returns')),
  debit_amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  credit_amount         NUMERIC(14,2) NOT NULL DEFAULT 0,
  debit_count           INTEGER NOT NULL DEFAULT 0,
  credit_count          INTEGER NOT NULL DEFAULT 0,
  total_count           INTEGER NOT NULL DEFAULT 0,
  effective_entry_date  DATE,
  settlement_date       DATE,
  source                TEXT NOT NULL DEFAULT 'ach.com',
  customer_name         TEXT,
  nacha_id              TEXT,
  import_batch_id       UUID,
  raw                   JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A given report row is unique on (processing_date, record_type, effective_entry_date, settlement_date)
-- so re-imports replace cleanly. Using a composite to dedupe split-rows on the same processing date.
CREATE UNIQUE INDEX IF NOT EXISTS ach_daily_activity_dedup_idx
  ON public.ach_daily_activity (
    processing_date,
    record_type,
    COALESCE(effective_entry_date, '1900-01-01'::date),
    COALESCE(settlement_date,      '1900-01-01'::date),
    debit_amount,
    credit_amount
  );

CREATE INDEX IF NOT EXISTS ach_daily_activity_processing_date_idx
  ON public.ach_daily_activity (processing_date DESC);

CREATE INDEX IF NOT EXISTS ach_daily_activity_record_type_idx
  ON public.ach_daily_activity (record_type);

-- ─── ach_imports: audit trail of every CSV upload ────────────────
CREATE TABLE IF NOT EXISTS public.ach_imports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename        TEXT NOT NULL,
  source          TEXT NOT NULL DEFAULT 'ach.com',
  customer_name   TEXT,
  nacha_id        TEXT,
  date_range      TEXT,
  row_count       INTEGER NOT NULL DEFAULT 0,
  inserted_count  INTEGER NOT NULL DEFAULT 0,
  skipped_count   INTEGER NOT NULL DEFAULT 0,
  total_originated NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_settled    NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_returned   NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ach_imports_created_at_idx
  ON public.ach_imports (created_at DESC);

-- ─── updated_at triggers ─────────────────────────────────────────
DROP TRIGGER IF EXISTS set_updated_at_ach_daily_activity ON public.ach_daily_activity;
CREATE TRIGGER set_updated_at_ach_daily_activity
  BEFORE UPDATE ON public.ach_daily_activity
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────
ALTER TABLE public.ach_daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ach_imports         ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_ach_daily_activity" ON public.ach_daily_activity;
CREATE POLICY "anon_all_ach_daily_activity" ON public.ach_daily_activity
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_ach_imports" ON public.ach_imports;
CREATE POLICY "anon_all_ach_imports" ON public.ach_imports
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ─── Realtime publication ───────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ach_daily_activity'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ach_daily_activity;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ach_imports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ach_imports;
  END IF;
END $$;
