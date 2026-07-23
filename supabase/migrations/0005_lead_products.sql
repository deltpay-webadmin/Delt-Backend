-- ─────────────────────────────────────────────────────────────────────
-- 0005_lead_products
-- Leads can be interested in more than one product (Payments, Capital,
-- Website, Ai, Leasing). Add a `products` array alongside the legacy
-- single `type` column. Backfill existing rows from `type` so nothing is
-- lost; `type` continues to hold the primary product for legacy views.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS products JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: seed products from the existing single type where empty.
UPDATE public.leads
SET products = to_jsonb(ARRAY[type])
WHERE (products IS NULL OR products = '[]'::jsonb) AND type IS NOT NULL;
