# Supabase Setup for Delt CRM

The CRM (Leads, Onboarding, Underwriting, Referrals) now persists to a shared Supabase Postgres database. Follow these steps once per environment.

If Supabase env vars are **not** set, the app still runs — it falls back to an in-memory snapshot with a small amber **"Local"** chip in the top bar. Data will not survive refreshes in that mode.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Choose any name (e.g. `delt-crm`) and generate a strong database password.
3. Pick the region closest to your users.
4. Wait ~1–2 minutes for provisioning.

## 2. Run the migration

1. In your Supabase project, open **SQL Editor** (left sidebar).
2. Click **New query**.
3. Copy the entire contents of [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) and paste.
4. Click **Run** (or press `⌘/Ctrl + Enter`).

You should see `Success. No rows returned.` followed by confirmation of the seed `INSERT`s.

The script creates 5 tables:

| Table | Purpose |
|---|---|
| `leads` | Pipeline leads with timeline, tasks, bundles, step details |
| `onboarding_apps` | Onboarding pipeline with step progress + SLA |
| `underwriting_apps` | Underwriting queue with risk scores + terms |
| `referrals` | Merchant-referred prospects |
| `referral_program` | Single-row reward config (`id = 1`) |

It also:

- Enables **Row Level Security** with a permissive `anon + authenticated` policy (no per-user auth yet — tighten once auth is wired up).
- Adds each table to the `supabase_realtime` publication so live updates stream to every open browser.
- Installs an `updated_at` trigger that touches the row on every `UPDATE`.

The migration is **idempotent for schema** but **not for seed data** — re-running will error on `INSERT` duplicates. To re-seed from scratch, truncate the tables first:

```sql
TRUNCATE public.leads, public.onboarding_apps, public.underwriting_apps, public.referrals, public.referral_program RESTART IDENTITY;
```

## 3. Grab your project URL + anon key

In Supabase: **Project Settings → API**.

- **Project URL** → used for `VITE_SUPABASE_URL`
- **anon / public** key → used for `VITE_SUPABASE_ANON_KEY`

## 4. Wire env vars locally

Create `.env.local` in the repo root:

```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...long.jwt.here
```

Restart `npm run dev`. The top-bar chip should flip from **Local** → **Syncing…** → **Live** (green).

## 5. Wire env vars in Vercel

In your Vercel project: **Settings → Environment Variables** and add the same two keys for each environment you care about (Production / Preview / Development). Redeploy.

---

## How it works

- On first page mount, `crmStore` calls `hydrate()` which fetches all five tables in parallel and opens a single realtime channel.
- Every action (`leadActions.update`, `referralActions.payReward`, etc.) applies an **optimistic local update**, then writes to Supabase. On failure the local state rolls back and a toast explains what happened.
- Realtime events from other clients flow into `applyRealtime()` and reconcile the local cache without a refetch.
- When Supabase is not configured, the store returns a small fallback seed so dev/preview environments still render screens.

## Authentication (migration `0005_auth_profiles.sql`)

The app now requires a real Supabase Auth sign-in. Migration `0005`:

- Creates a `profiles` table (`id` → `auth.users`, `full_name`, `role` ∈ `admin | manager | agent | employee`), auto-populated by a trigger whenever an auth user is created.
- **Removes all `anon` access** — every app table now requires an authenticated session. It also revokes `anon` table grants outright.
- Lets users edit their own profile, but only admins change roles.

### Rollout order (important)

Applying `0005` before deploying the new frontend will make the old deployed app show empty data (it used the anon key with no login). Do it in this order:

1. Deploy the frontend from this branch (it includes the login screen).
2. Run `supabase/migrations/0005_auth_profiles.sql` in the SQL Editor.
3. Create your first users: **Authentication → Users → Add user** (email + password, and optionally set `{"full_name": "...", "role": "admin"}` in user metadata), or promote an existing user:

   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'you@company.com';
   ```

4. **Rotate the anon key** (Project Settings → API → "Reset" on the anon key). The previous key was committed to this repo's git history in `src/app/utils/supabase/info.tsx`, so treat it as public. Update `VITE_SUPABASE_ANON_KEY` locally and in Vercel afterwards.

### Roles

| Role | View |
|---|---|
| `admin`, `manager` | Full backend view, can switch to the agent view |
| `agent`, `employee` | Agent view only |

### Tightening further later

The table policies are still all-or-nothing per authenticated user. Next step is per-role scoping: agents restricted to rows where `assigned_agent` matches their profile, reviewers to `reviewer`, etc. — add those to the `USING (...)` clauses with `public.current_user_role()`.
