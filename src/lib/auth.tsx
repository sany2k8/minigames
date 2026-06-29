/**
 * Authentication via Supabase Auth (email + password) — the same source as the
 * database, so one project owns both.
 *
 * Offline-first contract: when Supabase isn't configured (`isCloudEnabled`
 * false) this is a permanently logged-out state and the account UI is hidden;
 * the offline game keeps working. On sign in/out we flip the cloud "authed"
 * flag (so sync only runs for real users) and push a profile snapshot.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isCloudEnabled } from './supabase';
import { setCloudAuthed, syncProfile, pushFavorites, pushHighScores } from './cloud';
import { levelInfo, useApp } from '../store/store';

export interface AuthResult {
  ok: boolean;
  /** Human-readable message to surface in the UI (error or info). */
  message?: string;
}

interface AuthContextValue {
  enabled: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function profileSnapshot() {
  const s = useApp.getState();
  const tier = levelInfo(s.points);
  return {
    displayName: s.p1Name,
    points: s.points,
    level: tier.level,
    tier: tier.title,
    gamesWon: s.gamesWon,
    gamesPlayed: s.gamesPlayed
  };
}

/** On login, mirror the local store up to the cloud so the tables populate. */
function fullSync() {
  const s = useApp.getState();
  void syncProfile(profileSnapshot());
  void pushFavorites(s.favorites);
  void pushHighScores(s.highScores);
}

/** Map Supabase's terse auth errors to friendlier copy. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Wrong email or password.';
  if (m.includes('already registered')) return 'That email already has an account — try signing in.';
  if (m.includes('email not confirmed')) return 'Please confirm your email first (check your inbox).';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(isCloudEnabled);

  useEffect(() => {
    if (!supabase) return;
    let live = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!live) return;
      setSession(data.session);
      setLoading(false);
      setCloudAuthed(Boolean(data.session));
      if (data.session) fullSync();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!live) return;
      setSession(next);
      setCloudAuthed(Boolean(next));
      if (next?.user) {
        const meta = next.user.user_metadata as { display_name?: string } | undefined;
        const name = meta?.display_name || next.user.email?.split('@')[0];
        const st = useApp.getState();
        if (name && (st.p1Name === 'Player 1' || !st.p1Name)) st.setNames(name, st.p2Name);
        fullSync();
      }
    });

    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const disabled: AuthResult = { ok: false, message: 'Cloud sync is off — add Supabase keys to enable accounts.' };

    return {
      enabled: isCloudEnabled,
      loading,
      session,
      user: session?.user ?? null,

      async signUp(email, password, displayName) {
        if (!supabase) return disabled;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: displayName ? { display_name: displayName } : undefined }
        });
        if (error) return { ok: false, message: friendly(error.message) };
        // Confirmations on → no session until the email link is clicked.
        if (!data.session) {
          return { ok: true, message: 'Account created — check your email to confirm, then sign in.' };
        }
        return { ok: true };
      },

      async signIn(email, password) {
        if (!supabase) return disabled;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { ok: false, message: friendly(error.message) };
        return { ok: true };
      },

      async signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
        setCloudAuthed(false);
      }
    };
  }, [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
