import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

/**
 * Returns a Supabase browser client, or null if no project is configured.
 * When null, callers should fall back to localStorage (demo mode) so the
 * app keeps working with zero setup.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (client !== undefined) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    client = null;
    return client;
  }

  client = createBrowserClient(url, key);
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
