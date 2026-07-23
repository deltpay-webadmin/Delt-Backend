/**
 * SyncIndicator — tiny pill shown in the top bar that reflects
 * the Supabase hydration + connectivity state.
 *
 *   • Loading    → gray "Syncing…" with spinner
 *   • Online     → green dot "Live"
 *   • Offline    → amber dot "Local"  (Supabase not configured)
 *   • Error      → red dot "Sync error"
 *
 * Rendered inside DeltBackendLayout's header. Pure presentational.
 */

import React from 'react';
import { Loader2, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useCrmSync } from './crmStore';

export function SyncIndicator() {
  const { isLoading, isOnline, lastError } = useCrmSync();

  if (isLoading) {
    return (
      <span
        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-[8px] bg-gray-50 text-gray-500 border border-gray-200"
        title="Loading CRM data from Supabase"
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        Syncing…
      </span>
    );
  }

  if (lastError) {
    return (
      <span
        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-[8px] bg-red-50 text-red-600 border border-red-200"
        title={lastError}
      >
        <AlertTriangle className="w-3 h-3" />
        Sync error
      </span>
    );
  }

  if (!isOnline) {
    return (
      <span
        className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-[8px] bg-amber-50 text-amber-700 border border-amber-200"
        title="Running in local-only mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable persistence."
      >
        <WifiOff className="w-3 h-3" />
        Local
      </span>
    );
  }

  return (
    <span
      className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200"
      title="Connected to Supabase — changes sync live"
    >
      <Wifi className="w-3 h-3" />
      Live
    </span>
  );
}
