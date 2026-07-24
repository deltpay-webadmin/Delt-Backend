/**
 * Legacy compatibility shim.
 *
 * Earlier Figma Make iterations baked a project ref and anon key into
 * this file. Those are now sourced from env vars (see src/app/lib/supabase.ts)
 * so no credentials live in the repo. Only the legacy MCA-tracker components
 * (utils/api.ts and friends) still import these exports.
 */

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';

export const projectId = url.replace(/^https?:\/\//, '').split('.')[0] ?? '';
export const publicAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';
