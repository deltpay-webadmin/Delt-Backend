-- ════════════════════════════════════════════════════════════════
-- 0005 — Auth: profiles table + lock down RLS to authenticated users
-- ════════════════════════════════════════════════════════════════
-- Before this migration every table was readable/writable by `anon`.
-- After it, all app tables require a signed-in Supabase Auth user.
--
-- ⚠️ Deploy order matters: apply this migration together with (or after)
-- deploying the frontend that includes real login, and create at least
-- one auth user first — otherwise the deployed app will show empty data.

-- ─── Profiles ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'agent'
              CHECK (role IN ('admin', 'manager', 'agent', 'employee')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS profiles_touch_updated_at ON public.profiles;
CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Auto-create a profile row whenever an auth user is created.
-- `full_name` / `role` can be passed via user_metadata at invite time.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    CASE
      WHEN NEW.raw_user_meta_data ->> 'role' IN ('admin', 'manager', 'agent', 'employee')
        THEN NEW.raw_user_meta_data ->> 'role'
      ELSE 'agent'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Role lookup that bypasses RLS (avoids recursive policy evaluation).
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Profiles RLS: everyone signed in can read the staff directory;
-- users edit their own row; admins manage everything.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;
CREATE POLICY profiles_select_authenticated ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;
CREATE POLICY profiles_admin_all ON public.profiles
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Non-admins must not promote themselves via the update-own policy.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND COALESCE(public.current_user_role(), '') <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can change roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- ─── Lock down existing app tables ──────────────────────────────
-- Drop the permissive anon policies and replace with authenticated-only.
-- Finer per-role rules (agents scoped to assigned_agent, etc.) come later;
-- the critical fix is removing unauthenticated access entirely.
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'leads', 'onboarding_apps', 'underwriting_apps', 'referrals', 'referral_program'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_anon_all ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_authenticated_all ON public.%I', t, t);
    EXECUTE format(
      $p$CREATE POLICY %I_authenticated_all ON public.%I
         FOR ALL TO authenticated USING (true) WITH CHECK (true)$p$, t, t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS capital_deals_select ON public.capital_deals;
DROP POLICY IF EXISTS capital_deals_insert ON public.capital_deals;
DROP POLICY IF EXISTS capital_deals_update ON public.capital_deals;
DROP POLICY IF EXISTS capital_deals_delete ON public.capital_deals;
DROP POLICY IF EXISTS capital_deals_authenticated_all ON public.capital_deals;
CREATE POLICY capital_deals_authenticated_all ON public.capital_deals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_ach_daily_activity" ON public.ach_daily_activity;
DROP POLICY IF EXISTS ach_daily_activity_authenticated_all ON public.ach_daily_activity;
CREATE POLICY ach_daily_activity_authenticated_all ON public.ach_daily_activity
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_ach_imports" ON public.ach_imports;
DROP POLICY IF EXISTS ach_imports_authenticated_all ON public.ach_imports;
CREATE POLICY ach_imports_authenticated_all ON public.ach_imports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Belt-and-braces: revoke table grants from anon so even a future
-- permissive policy can't re-expose data to unauthenticated clients.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
