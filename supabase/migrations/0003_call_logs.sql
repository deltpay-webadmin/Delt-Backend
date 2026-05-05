-- ════════════════════════════════════════════════════════════════════
-- Delt CRM — call logs for customer-service phone tracking
-- ════════════════════════════════════════════════════════════════════
-- Adds:
--   • call_logs        : one row per inbound/outbound customer-service call
--   • merchants_phone_idx (functional index) for fast lookup by digits
--
-- merchant_id is intentionally a TEXT column with no foreign key. Merchants
-- in this app are still partially client-side (see crmStore.ts merchants
-- + BackendMerchants.tsx mock data); leads + onboarding apps can also be
-- the "subject" of a call. The matched_subject_kind discriminates.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.call_logs (
  id                     TEXT PRIMARY KEY,
  -- The phone number that was dialed / received, normalized to E.164-ish ("+15551234567").
  phone_normalized       TEXT NOT NULL,
  -- The exact string the agent saw / typed (kept for audit).
  phone_raw              TEXT,
  -- Direction of the call.
  direction              TEXT NOT NULL DEFAULT 'inbound'
                         CHECK (direction IN ('inbound', 'outbound')),
  -- Call outcome (free-form, but UI uses a fixed list).
  status                 TEXT NOT NULL DEFAULT 'completed'
                         CHECK (status IN ('queued','ringing','in-progress','completed','no-answer','busy','failed','voicemail','canceled')),
  -- Optional link to a CRM subject. We don't FK because the subject may be
  -- a client-side merchant or a Supabase-backed lead.
  matched_subject_kind   TEXT CHECK (matched_subject_kind IN ('merchant','lead','none')),
  matched_subject_id     TEXT,
  matched_subject_label  TEXT,           -- snapshot of the merchant/business name at call time
  agent                  TEXT,            -- CRM user who handled the call
  started_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at               TIMESTAMPTZ,
  duration_seconds       INTEGER,         -- denormalized for fast reporting
  notes                  TEXT NOT NULL DEFAULT '',
  -- Provider hooks (Twilio etc.) — populated only if a telephony backend
  -- ever wires up. Safe to ignore today.
  provider               TEXT,            -- 'twilio' | 'click-to-call' | NULL
  provider_call_sid      TEXT,
  recording_url          TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast caller-ID lookup — exact normalized match.
CREATE INDEX IF NOT EXISTS call_logs_phone_norm_idx
  ON public.call_logs (phone_normalized);

-- Last-N-digits fallback (for when caller-ID drops country code).
CREATE INDEX IF NOT EXISTS call_logs_phone_tail_idx
  ON public.call_logs (RIGHT(phone_normalized, 7));

CREATE INDEX IF NOT EXISTS call_logs_subject_idx
  ON public.call_logs (matched_subject_kind, matched_subject_id);

-- Reuse the touch_updated_at trigger from 0001_init.sql.
DROP TRIGGER IF EXISTS call_logs_touch ON public.call_logs;
CREATE TRIGGER call_logs_touch
  BEFORE UPDATE ON public.call_logs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS: same permissive anon+auth policy as the rest of the schema
-- (no auth model wired yet — see 0001_init.sql).
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS call_logs_anon_all ON public.call_logs;
CREATE POLICY call_logs_anon_all ON public.call_logs
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Realtime so multiple agents watching the call center page see new entries.
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
