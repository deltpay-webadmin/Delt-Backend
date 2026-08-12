-- ════════════════════════════════════════════════════════════════
-- 0009 — Rep actions: in-call meeting booking + app-link sends
-- ════════════════════════════════════════════════════════════════
-- Companion to the Call Playbooks live-call action panel:
--   rep_meetings — meetings booked by reps mid-call. The rep-actions
--                  edge function sends the confirmation (email + .ics
--                  calendar invite) immediately, then the
--                  meeting-reminders pg_cron job (every 15 min) sends
--                  the T-24h and T-2h reminder emails and a rep
--                  "text them now" nudge (manual SMS via Google Voice,
--                  same convention as the DeltCapital sms-nudge).
--
-- App-link sends are logged to the existing outreach_events table
-- (campaign 'rep-app-link') so they surface on the Outreach page.

CREATE TABLE IF NOT EXISTS public.rep_meetings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_id            TEXT,
  call_session_id    UUID REFERENCES public.call_sessions(id) ON DELETE SET NULL,
  product            TEXT NOT NULL DEFAULT 'deltpay' CHECK (product IN ('deltpay','deltcapital')),
  merchant_business  TEXT NOT NULL,
  contact_name       TEXT,
  contact_email      TEXT,
  contact_phone      TEXT,
  mode               TEXT NOT NULL DEFAULT 'online' CHECK (mode IN ('online','in_person')),
  location           TEXT,          -- address (in-person) — shown in the invite
  meeting_link       TEXT,          -- video link (online) — shown in the invite
  starts_at          TIMESTAMPTZ NOT NULL,
  duration_min       INT NOT NULL DEFAULT 30,
  rep_name           TEXT,
  rep_email          TEXT,
  notes              TEXT,
  status             TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','cancelled','completed')),
  confirm_sent_at    TIMESTAMPTZ,
  remind_24h_sent_at TIMESTAMPTZ,
  remind_2h_sent_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rep_meetings_starts ON public.rep_meetings(starts_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_rep_meetings_lead   ON public.rep_meetings(lead_id);

-- ─── RLS: staff only (matches 0005/0008) ────────────────────────
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.rep_meetings ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS rep_meetings_staff_all ON public.rep_meetings';
  EXECUTE 'CREATE POLICY rep_meetings_staff_all ON public.rep_meetings FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff())';
  EXECUTE 'REVOKE ALL ON public.rep_meetings FROM anon';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.rep_meetings TO service_role';
  EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.rep_meetings TO authenticated';
END $$;

CREATE OR REPLACE FUNCTION public.touch_rep_meetings() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_touch_rep_meetings ON public.rep_meetings;
CREATE TRIGGER trg_touch_rep_meetings BEFORE UPDATE ON public.rep_meetings
  FOR EACH ROW EXECUTE FUNCTION public.touch_rep_meetings();

-- ─── Cron: meeting reminders every 15 min ───────────────────────
-- Mirrors public.invoke_job() (20260731_05_cron.sql in the DeltPay repo)
-- but targets the rep-actions function. Secrets come from the same vault
-- entries, so the cron secret can never drift between the two.
CREATE OR REPLACE FUNCTION public.invoke_rep_actions_job(p_task TEXT)
RETURNS BIGINT
LANGUAGE sql SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT net.http_post(
    url := 'https://ytemrmpnwmzqeradbeoa.supabase.co/functions/v1/rep-actions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key'),
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
    ),
    body := jsonb_build_object('action', p_task),
    timeout_milliseconds := 10000
  );
$$;

REVOKE EXECUTE ON FUNCTION public.invoke_rep_actions_job(TEXT) FROM public, anon, authenticated;

SELECT cron.schedule('meeting-reminders-15m', '*/15 * * * *',
  $$SELECT public.invoke_rep_actions_job('run-reminders')$$);
