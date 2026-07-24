/**
 * ────────────────────────────────────────────────────────────
 * Supabase client
 * ────────────────────────────────────────────────────────────
 * Creates a single Supabase client instance from Vite env vars.
 *
 * If either env var is missing, `supabase` is exported as `null`
 * and the CRM store falls back to its in-memory behavior with a
 * console warning. This keeps the app runnable in preview or
 * contributor environments without credentials.
 *
 * Required env vars (set in .env.local or Vercel):
 *   VITE_SUPABASE_URL        e.g. https://xxxxxxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY   long JWT from Project Settings → API
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
        realtime: { params: { eventsPerSecond: 10 } },
      })
    : null;

export const isSupabaseConfigured = supabase !== null;

if (!supabase && typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.warn(
    '[Delt CRM] Supabase env vars missing. Running in local-only mode. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable persistence.',
  );
}
