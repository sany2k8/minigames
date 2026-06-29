/**
 * Supabase browser client — the single source for both data and auth.
 *
 * This is a fully offline-first PWA, so the cloud is OPTIONAL. If the Vite env
 * vars are missing (the default), `supabase` is `null` and every cloud helper
 * in `cloud.ts` quietly no-ops, so the offline app behaves exactly as before.
 *
 * Auth is Supabase's own email/password (see `auth.tsx`); supabase-js persists
 * the session and attaches it to every request automatically, so RLS sees the
 * logged-in user via `auth.uid()`.
 *
 * Only the publishable/anon key is ever read here — never service-role or
 * Postgres secrets, which would leak if bundled into client code.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

/** True when both URL and key are configured — gates all cloud features. */
export const isCloudEnabled: boolean = Boolean(url && key);

export const supabase: SupabaseClient | null = isCloudEnabled
  ? createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    })
  : null;
