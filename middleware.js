/**
 * Next.js Middleware - Auth & Admin Verification
 * Automatically refreshes Supabase auth tokens and verifies admin access
 * Critical for Vercel serverless deployment
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired
  await supabase.auth.getUser();

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('triangle_session')?.value;

    if (!sessionCookie) {
      console.log('❌ Admin access denied - No session cookie');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const sessionData = jwt.verify(sessionCookie, process.env.JWT_SECRET);
      const adminEmails = ['triangleintel@gmail.com'];

      if (!adminEmails.includes(sessionData.email)) {
        console.log(`❌ Admin access denied - ${sessionData.email} is not an admin`);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      console.log(`✅ Admin access granted - ${sessionData.email}`);
    } catch (error) {
      console.log('❌ Admin access denied - Invalid session');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

// Run middleware on all routes except static files and API routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
