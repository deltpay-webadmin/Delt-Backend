/**
 * ────────────────────────────────────────────────────────────
 * Auth context
 * ────────────────────────────────────────────────────────────
 * Wraps Supabase Auth. Exposes the current session's profile
 * (name / email / role from the `profiles` table) plus signIn /
 * signOut helpers.
 *
 * When Supabase env vars are missing the app can't authenticate,
 * so a "demo mode" entry is offered instead — clearly labeled,
 * with no real-looking credentials, matching the CRM store's
 * existing local-only fallback behavior.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type ProfileRole = 'admin' | 'manager' | 'agent' | 'employee';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: ProfileRole;
  initials: string;
}

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  profile: Profile | null;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function initialsOf(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.split(/[\s._@-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
}

const DEMO_PROFILE: Profile = {
  id: 'demo',
  email: 'demo@local',
  name: 'Demo User',
  role: 'admin',
  initials: 'DU',
};

/**
 * CRM access requires a row in staff_profiles. Customer-portal accounts
 * (public.profiles) share the same auth.users pool but have no staff row,
 * so they are denied here — returns null for non-staff.
 */
async function fetchProfile(userId: string, email: string): Promise<Profile | null> {
  const { data } = await supabase!
    .from('staff_profiles')
    .select('id, email, full_name, role')
    .eq('id', userId)
    .maybeSingle();

  if (!data) return null;

  const name = data.full_name || email.split('@')[0];
  return {
    id: userId,
    email: data.email || email,
    name,
    role: (data.role as ProfileRole) || 'agent',
    initials: initialsOf(name, email),
  };
}

const NO_ACCESS_MESSAGE =
  'This account does not have CRM access. Ask an administrator to add you as staff.';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'signedOut');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        const p = await fetchProfile(session.user.id, session.user.email ?? '');
        if (cancelled) return;
        if (p) {
          setProfile(p);
          setStatus('signedIn');
        } else {
          await supabase!.auth.signOut();
          setStatus('signedOut');
        }
      } else {
        setStatus('signedOut');
      }
    });

    // NOTE: keep this callback synchronous — supabase-js holds a cross-tab
    // navigator.lock while dispatching auth events, so awaiting auth calls
    // (or anything slow) in here deadlocks every tab of the app.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setStatus('signedOut');
      } else if (event === 'SIGNED_IN' && session?.user) {
        const { id, email } = session.user;
        setTimeout(async () => {
          const p = await fetchProfile(id, email ?? '');
          if (p) {
            setProfile(p);
            setStatus('signedIn');
          } else {
            await supabase!.auth.signOut();
          }
        }, 0);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase is not configured in this environment.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message === 'Invalid login credentials' ? 'Invalid email or password' : error.message };
    }
    // Valid credentials but no staff record → not a CRM user.
    const p = data.user ? await fetchProfile(data.user.id, data.user.email ?? '') : null;
    if (!p) {
      await supabase.auth.signOut();
      return { error: NO_ACCESS_MESSAGE };
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (isDemo) {
      setIsDemo(false);
      setProfile(null);
      setStatus('signedOut');
      return;
    }
    await supabase?.auth.signOut();
  }, [isDemo]);

  const enterDemoMode = useCallback(() => {
    if (isSupabaseConfigured) return; // demo entry only exists without a real backend
    setIsDemo(true);
    setProfile(DEMO_PROFILE);
    setStatus('signedIn');
  }, []);

  return (
    <AuthContext.Provider value={{ status, profile, isDemo, signIn, signOut, enterDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
