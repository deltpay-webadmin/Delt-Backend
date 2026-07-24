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

## Live deployment: "Delt Pay Database" project

The production Supabase project (`ytemrmpnwmzqeradbeoa`, **Delt Pay Database**) is shared with the Delt Pay / Delt Capital websites and the customer portal. The CRM schema was applied to it directly (as migrations `crm_staff_access`, `crm_core_tables`, `crm_leads_mirror`) — equivalent to this repo's `0001`–`0007` without demo seed data. Two naming facts to know:

- The CRM's lead table is **`pipeline_leads`** (not `leads`) — `public.leads` was already taken by a view over the Capital site's raw leads.
- CRM staff live in **`staff_profiles`** (not `profiles`) — `public.profiles` belongs to the customer portal. Portal customers share `auth.users` but have no staff row, so the CRM rejects them at login and RLS blocks them from all CRM tables.

### Lead ingestion (all automatic, deduplicated by `external_id`)

| Source | Path |
|---|---|
| Delt Pay website forms | `submit-lead` edge fn → `crm_leads` → mirror trigger → `pipeline_leads` |
| Delt Capital site | `delt_capital.leads` → `crm_leads` → mirror trigger → `pipeline_leads` |
| Meta lead ads | Google Sheet → Apps Script → `sheet-lead-sync` edge fn → `pipeline_leads` |
| Manual / Quick Add / KYB intake | app UI → `pipeline_leads` |

### Adding CRM staff

Create the auth user (**Authentication → Users → Add user**), then:

```sql
INSERT INTO public.staff_profiles (id, email, full_name, role)
SELECT id, email, 'Full Name', 'admin'   -- role: admin | manager | agent | employee
FROM auth.users WHERE email = 'you@company.com';
```

There is deliberately **no** auto-provisioning trigger — website signups must not become staff.

### Frontend env vars (local `.env.local` and Vercel)

```bash
VITE_SUPABASE_URL=https://ytemrmpnwmzqeradbeoa.supabase.co
VITE_SUPABASE_ANON_KEY=<anon / publishable key from Project Settings → API>
```

### Roles

| Role | View |
|---|---|
| `admin`, `manager` | Full backend view, can switch to the agent view |
| `agent`, `employee` | Agent view only |

### Tightening further later

CRM table policies are all-or-nothing per staff member. Next step is per-role scoping: agents restricted to rows where `assigned_agent` matches their profile, reviewers to `reviewer`, etc. — add those to the `USING (...)` clauses with `public.current_staff_role()`.
