-- ════════════════════════════════════════════════════════════════
-- 0007 — Mirror website leads (crm_leads) into the CRM pipeline
-- ════════════════════════════════════════════════════════════════
-- The live "Delt Pay Database" project has a crm_leads table fed by the
-- Delt Pay / Delt Capital website forms (via the submit-lead edge
-- function and a delt_capital.leads mirror trigger). This migration
-- copies every new crm_leads row into pipeline_leads so website leads
-- appear in Delt Backend automatically, deduplicated by external_id.
--
-- Guarded: silently skips on databases without crm_leads (fresh installs
-- that only run this repo's migrations).

DO $outer$
BEGIN
  IF to_regclass('public.crm_leads') IS NULL THEN
    RAISE NOTICE 'crm_leads not present — skipping mirror setup';
    RETURN;
  END IF;

  CREATE OR REPLACE FUNCTION public.mirror_crm_lead_to_pipeline()
  RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
  DECLARE
    v_source TEXT;
    v_type TEXT;
    v_notes TEXT;
  BEGIN
    v_source := CASE NEW.source
      WHEN 'delt_pay_site'     THEN 'Website Inquiry'
      WHEN 'delt_capital_site' THEN 'Capital Site'
      WHEN 'meta_ads'          THEN 'Meta Ads'
      ELSE COALESCE(NULLIF(NEW.source, ''), 'Website Inquiry')
    END;

    v_type := CASE lower(COALESCE(NEW.product_interest, ''))
      WHEN 'capital' THEN 'MCA'
      ELSE 'Processing'
    END;

    v_notes := concat_ws(E'\n',
      NULLIF(NEW.message, ''),
      NULLIF(concat_ws(' · ',
        CASE WHEN NULLIF(NEW.form_name, '')    IS NOT NULL THEN 'Form: ' || NEW.form_name END,
        CASE WHEN NULLIF(NEW.utm_campaign, '') IS NOT NULL THEN 'Campaign: ' || NEW.utm_campaign END,
        CASE WHEN NULLIF(NEW.utm_source, '')   IS NOT NULL THEN 'UTM source: ' || NEW.utm_source END
      ), '')
    );

    INSERT INTO public.pipeline_leads (
      id, external_id, business_name, industry, contact_name, contact_email,
      contact_phone, type, source, monthly_sales, amount_requested, score,
      status, priority, last_activity, assigned_agent, stage, timeline, notes
    )
    VALUES (
      'crm-' || NEW.id,
      'crm_leads:' || NEW.id,
      COALESCE(NULLIF(NEW.company, ''), NULLIF(NEW.full_name, ''), 'Website Lead'),
      'General',
      COALESCE(NEW.full_name, ''),
      COALESCE(NEW.email, ''),
      COALESCE(NEW.phone, ''),
      v_type,
      v_source,
      COALESCE(NULLIF(NEW.monthly_volume, ''), ''),
      '',
      50, 'New', 'Medium', 'just now', 'Unassigned', 'New',
      jsonb_build_array(jsonb_build_object(
        'title', 'Lead created',
        'description', 'Imported automatically from ' || v_source,
        'user', 'Website',
        'timestamp', to_char(NEW.created_at, 'YYYY-MM-DD HH24:MI')
      )),
      COALESCE(v_notes, '')
    )
    ON CONFLICT (external_id) DO NOTHING;

    RETURN NEW;
  END; $$;

  DROP TRIGGER IF EXISTS crm_leads_mirror_to_pipeline ON public.crm_leads;
  CREATE TRIGGER crm_leads_mirror_to_pipeline
    AFTER INSERT ON public.crm_leads
    FOR EACH ROW EXECUTE FUNCTION public.mirror_crm_lead_to_pipeline();

  -- Backfill existing website leads through the same mapping.
  INSERT INTO public.pipeline_leads (
    id, external_id, business_name, industry, contact_name, contact_email,
    contact_phone, type, source, monthly_sales, amount_requested, score,
    status, priority, last_activity, assigned_agent, stage, timeline, notes
  )
  SELECT
    'crm-' || c.id,
    'crm_leads:' || c.id,
    COALESCE(NULLIF(c.company, ''), NULLIF(c.full_name, ''), 'Website Lead'),
    'General',
    COALESCE(c.full_name, ''),
    COALESCE(c.email, ''),
    COALESCE(c.phone, ''),
    CASE lower(COALESCE(c.product_interest, '')) WHEN 'capital' THEN 'MCA' ELSE 'Processing' END,
    CASE c.source
      WHEN 'delt_pay_site'     THEN 'Website Inquiry'
      WHEN 'delt_capital_site' THEN 'Capital Site'
      WHEN 'meta_ads'          THEN 'Meta Ads'
      ELSE COALESCE(NULLIF(c.source, ''), 'Website Inquiry')
    END,
    COALESCE(NULLIF(c.monthly_volume, ''), ''),
    '',
    50, 'New', 'Medium', 'just now', 'Unassigned', 'New',
    jsonb_build_array(jsonb_build_object(
      'title', 'Lead created',
      'description', 'Backfilled from website leads',
      'user', 'Website',
      'timestamp', to_char(c.created_at, 'YYYY-MM-DD HH24:MI')
    )),
    COALESCE(concat_ws(E'\n',
      NULLIF(c.message, ''),
      NULLIF('Form: ' || COALESCE(NULLIF(c.form_name, ''), ''), 'Form: ')
    ), '')
  FROM public.crm_leads c
  ON CONFLICT (external_id) DO NOTHING;
END $outer$;
