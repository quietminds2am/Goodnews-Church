import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly in dev, but never crash the whole app in production —
  // pages that need data will show a friendly error state instead.
  // eslint-disable-next-line no-console
  console.error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project credentials."
  );
}

// The anon key is safe to expose in client code by design — Supabase
// enforces all real access control via Row Level Security policies
// (see supabase/migrations/0002_rls.sql). Never put the service-role key
// here or in any VITE_-prefixed variable.
//
// Note: intentionally untyped (no Database generic). The hand-authored
// types in src/types/database.ts are applied manually at each call site
// (e.g. `(data ?? []) as EventRow[]`) instead — this avoids supabase-js's
// generic Database constraints silently collapsing Insert/Update payload
// types to `never` when a hand-written schema type doesn't match its
// exact expected shape (Row/Insert/Update/Relationships per table).
export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
