/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://xxxx.supabase.co. Empty = offline only. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase publishable (or legacy anon) key. Safe to expose to the browser. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** Legacy alias for the publishable key. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
