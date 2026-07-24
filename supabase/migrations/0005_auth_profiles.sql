-- ════════════════════════════════════════════════════════════════
-- 0005 — Auth: staff_profiles + lock CRM tables down to staff only
-- ════════════════════════════════════════════════════════════════
-- Matches the live "Delt Pay Database" project (applied there as the
-- `crm_staff_access` migration). CRM staff live in staff_profiles —
-- deliberately separate from public.profiles, which holds customer-portal
-- accounts in the shared auth.users pool. Only users with a
-- staff_profiles row can read or write CRM data.
--
-- There is intentionally NO auto-provisioning trigger on auth.users:
-- portal customers sign up through the websites and must not become
-- staff. Admins add staff explicitly (see SUPABASE_SETUP.md).

CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'agent'
              CHECK (role IN ('admin', 'manager', 'agent', 'employee')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpers bypass RLS (SECURITY DEFINER) to avoid recursive policy evaluation.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS (SELECT 1 FROM public.staff_profiles WHERE id = auth.uid()); $$;

CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT role FROM public.staff_profiles WHERE id = auth.uid(); $$;

ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_profiles_select_staff ON public.staff_profiles;
CREATE POLICY staff_profiles_select_staff ON public.staff_profiles
  FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS staff_profiles_update_own ON public.staff_profiles;
CREATE POLICY staff_profiles_update_own ON public.staff_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS staff_profiles_admin_all ON public.staff_profiles;
CREATE POLICY staff_profiles_admin_all ON public.staff_profiles
  FOR ALL TO authenticated
  USING (public.current_staff_role() = 'admin')
  WITH CHECK (public.current_staff_role() = 'admin');

-- Non-admins must not promote themselves via the update-own policy.
CREATE OR REPLACE FUNCTION public.staff_prevent_role_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND COALESCE(public.current_staff_role(), '') <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can change staff roles';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS staff_profiles_role_guard ON public.staff_profiles;
CREATE TRIGGER staff_profiles_role_guard
  BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.staff_prevent_role_escalation();

-- ─── Lock down CRM tables: staff only ───────────────────────────
-- Replaces the permissive anon policies from 0001/0003/0004. Revokes are
-- per-table (not schema-wide) so non-CRM tables sharing the database —
-- crm_leads, portal tables — keep their existing grants.
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'pipeline_leads', 'onboarding_apps', 'underwriting_apps', 'referrals',
    'referral_program', 'capital_deals', 'ach_daily_activity', 'ach_imports'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I_anon_all ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_authenticated_all ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_staff_all ON public.%I', t, t);
    EXECUTE format('CREATE POLICY %I_staff_all ON public.%I FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff())', t, t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- Legacy policy names from 0003/0004 (no-ops if already gone).
DROP POLICY IF EXISTS capital_deals_select ON public.capital_deals;
DROP POLICY IF EXISTS capital_deals_insert ON public.capital_deals;
DROP POLICY IF EXISTS capital_deals_update ON public.capital_deals;
DROP POLICY IF EXISTS capital_deals_delete ON public.capital_deals;
DROP POLICY IF EXISTS "anon_all_ach_daily_activity" ON public.ach_daily_activity;
DROP POLICY IF EXISTS "anon_all_ach_imports" ON public.ach_imports;
