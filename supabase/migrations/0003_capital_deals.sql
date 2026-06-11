-- ════════════════════════════════════════════════════════════════════
-- Delt — capital_deals table for the Capital portfolio dashboard
-- ════════════════════════════════════════════════════════════════════
-- Stores the full MCA / Fundomate-referral deal portfolio that drives
-- the Merchants → Capital page. Decoupled from the simpler `deals`
-- shape inside crmStore (which powers the Deals tab) so the portfolio
-- can carry channel, holdback, ACH state, UCC filings, stack count,
-- renewal eligibility, etc.

CREATE TABLE IF NOT EXISTS public.capital_deals (
  id                      TEXT PRIMARY KEY,
  merchant                TEXT NOT NULL,
  type                    TEXT NOT NULL DEFAULT 'Restaurant',
  channel                 TEXT NOT NULL DEFAULT 'self' CHECK (channel IN ('self','fundomate')),
  funded                  DATE NOT NULL DEFAULT CURRENT_DATE,
  funded_amt              NUMERIC NOT NULL DEFAULT 0,
  factor                  NUMERIC NOT NULL DEFAULT 1.35,
  total_owed              NUMERIC NOT NULL DEFAULT 0,
  collected               NUMERIC NOT NULL DEFAULT 0,
  holdback                NUMERIC NOT NULL DEFAULT 12,
  daily_debit             NUMERIC NOT NULL DEFAULT 0,
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paid','slow','default')),
  days_in_default         INTEGER NOT NULL DEFAULT 0,
  last_payment            DATE,
  ach_status              TEXT NOT NULL DEFAULT 'current' CHECK (ach_status IN ('current','completed','nsf-retry','suspended')),
  avg_7d                  NUMERIC NOT NULL DEFAULT 0,
  avg_30d                 NUMERIC NOT NULL DEFAULT 0,
  stack_count             INTEGER NOT NULL DEFAULT 0,
  renewal_eligible        BOOLEAN NOT NULL DEFAULT FALSE,
  ucc_filed               DATE,
  ucc_expires             DATE,
  cost_of_capital_paid    NUMERIC NOT NULL DEFAULT 0,
  referral_commission     NUMERIC NOT NULL DEFAULT 0,
  commission_rate         NUMERIC,
  commission_paid         BOOLEAN,
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS capital_deals_status_idx   ON public.capital_deals (status);
CREATE INDEX IF NOT EXISTS capital_deals_channel_idx  ON public.capital_deals (channel);
CREATE INDEX IF NOT EXISTS capital_deals_funded_idx   ON public.capital_deals (funded DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS capital_deals_set_updated_at ON public.capital_deals;
CREATE TRIGGER capital_deals_set_updated_at
BEFORE UPDATE ON public.capital_deals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.capital_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS capital_deals_select ON public.capital_deals;
CREATE POLICY capital_deals_select ON public.capital_deals
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS capital_deals_insert ON public.capital_deals;
CREATE POLICY capital_deals_insert ON public.capital_deals
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS capital_deals_update ON public.capital_deals;
CREATE POLICY capital_deals_update ON public.capital_deals
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS capital_deals_delete ON public.capital_deals;
CREATE POLICY capital_deals_delete ON public.capital_deals
  FOR DELETE TO anon, authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.capital_deals;
