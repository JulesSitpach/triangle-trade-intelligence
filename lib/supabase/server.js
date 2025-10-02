/**
 * Server-side Supabase client with cookie-based sessions
 * For use in API routes and server-side operations
 * Optimized for Vercel serverless functions
 */

import { createServerClient } from '@supabase/ssr';

/**
 * Create server-side Supabase client for API routes
 * Uses cookies for session management
 */
export function createClient(req, res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies[name];
        },
        set(name, value, options) {
          if (!res) return;

          res.setHeader(
            'Set-Cookie',
            `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; ${
              process.env.NODE_ENV === 'production' ? 'Secure;' : ''
            } Max-Age=${options.maxAge || 604800}`
          );
        },
        remove(name) {
          if (!res) return;

          res.setHeader(
            'Set-Cookie',
            `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
          );
        },
      },
    }
  );
}

/**
 * Admin client with service role key (bypasses RLS)
 * Use only for admin operations
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
