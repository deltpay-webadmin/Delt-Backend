-- ════════════════════════════════════════════════════════════════════
-- 0003_leads_pipeline_tagging.sql — Capture qualifying answers + lead tag
-- ════════════════════════════════════════════════════════════════════
-- Adds columns used by the website's /get-funded gate so we can route
-- inbound leads to the right CRM playbook:
--
--   lead_tag                  Derived segment tag (see below)
--   accepts_cards             yes | no | already-delt
--   open_to_switch            yes | maybe | no  (only meaningful when accepts_cards = 'yes')
--   monthly_volume_estimate   numeric (USD) — pre-application volume estimate
--   avg_ticket                numeric (USD) — avg sale size
--   current_rate              numeric (%) — current processor rate
--   current_per_txn           numeric (USD) — current per-txn fee
--   estimated_savings_monthly numeric (USD) — server-computed snapshot
--   pre_approval_low          numeric (USD)
--   pre_approval_high         numeric (USD)
--
-- LEAD_TAG enum-by-convention (stored as TEXT for flexibility):
--   'MS+CAP-Switcher'           accepts cards, open to switch processing
--   'CAP-Only'                  accepts cards, does NOT want to switch
--   'MS+CAP-NewMerchant'        does not currently accept cards
--   'Existing-Customer-Upsell'  already a Delt merchant
--   NULL                        legacy or manually-entered lead — no signal
--
-- Idempotent and non-breaking. Legacy leads keep working (all new
-- columns are nullable with no default).
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lead_tag                  TEXT,
  ADD COLUMN IF NOT EXISTS accepts_cards             TEXT,
  ADD COLUMN IF NOT EXISTS open_to_switch            TEXT,
  ADD COLUMN IF NOT EXISTS monthly_volume_estimate   NUMERIC,
  ADD COLUMN IF NOT EXISTS avg_ticket                NUMERIC,
  ADD COLUMN IF NOT EXISTS current_rate              NUMERIC,
  ADD COLUMN IF NOT EXISTS current_per_txn           NUMERIC,
  ADD COLUMN IF NOT EXISTS estimated_savings_monthly NUMERIC,
  ADD COLUMN IF NOT EXISTS pre_approval_low          NUMERIC,
  ADD COLUMN IF NOT EXISTS pre_approval_high         NUMERIC;

-- Soft enum check — easier to evolve than a real ENUM type.
ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_lead_tag_check;
ALTER TABLE public.leads
  ADD  CONSTRAINT leads_lead_tag_check
  CHECK (lead_tag IS NULL OR lead_tag IN (
    'MS+CAP-Switcher',
    'CAP-Only',
    'MS+CAP-NewMerchant',
    'Existing-Customer-Upsell'
  ));

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_accepts_cards_check;
ALTER TABLE public.leads
  ADD  CONSTRAINT leads_accepts_cards_check
  CHECK (accepts_cards IS NULL OR accepts_cards IN ('yes', 'no', 'already-delt'));

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_open_to_switch_check;
ALTER TABLE public.leads
  ADD  CONSTRAINT leads_open_to_switch_check
  CHECK (open_to_switch IS NULL OR open_to_switch IN ('yes', 'maybe', 'no'));

-- Indexes for pipeline filters / sales routing.
CREATE INDEX IF NOT EXISTS leads_lead_tag_idx       ON public.leads (lead_tag);
CREATE INDEX IF NOT EXISTS leads_status_lead_tag_idx
  ON public.leads (status, lead_tag);

-- Pipeline reporting view: counts by tag × stage, easy hook for dashboards.
CREATE OR REPLACE VIEW public.leads_pipeline_by_tag AS
SELECT
  COALESCE(lead_tag, 'Untagged')              AS lead_tag,
  stage,
  status,
  priority,
  COUNT(*)::int                                AS lead_count,
  COALESCE(SUM(monthly_volume_estimate), 0)    AS total_volume_estimate,
  COALESCE(SUM(estimated_savings_monthly), 0)  AS total_estimated_savings_monthly
FROM public.leads
GROUP BY 1, 2, 3, 4;

COMMENT ON COLUMN public.leads.lead_tag IS
  'CRM segment derived from /get-funded answers. Drives routing playbook + priority. Values: MS+CAP-Switcher, CAP-Only, MS+CAP-NewMerchant, Existing-Customer-Upsell.';
COMMENT ON COLUMN public.leads.accepts_cards IS
  'Q1 from /get-funded: yes | no | already-delt';
COMMENT ON COLUMN public.leads.open_to_switch IS
  'Q2 from /get-funded (only when accepts_cards=yes): yes | maybe | no';
COMMENT ON VIEW public.leads_pipeline_by_tag IS
  'Pipeline counts grouped by lead_tag x stage x status. Source for the Lead Pipeline dashboard.';
