/**
 * Browser-side Supabase client
 * For use in React components and client-side code
 */

import { createBrowserClient } from '@supabase/ssr';

let supabaseClient = null;

/**
 * Get singleton Supabase client for browser
 */
export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return supabaseClient;
}
