-- ════════════════════════════════════════════════════════════════
-- 0010 — Meeting outcomes: track show / no-show for show-rate stats
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.rep_meetings DROP CONSTRAINT IF EXISTS rep_meetings_status_check;
ALTER TABLE public.rep_meetings ADD CONSTRAINT rep_meetings_status_check
  CHECK (status IN ('scheduled','completed','no_show','cancelled'));
CREATE INDEX IF NOT EXISTS idx_rep_meetings_status ON public.rep_meetings(status);
