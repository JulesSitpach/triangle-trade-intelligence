/**
 * Server-Side Authentication Utilities
 * Proper Next.js pattern for protecting routes without middleware
 */

import { parse } from 'cookie';
import crypto from 'crypto';

/**
 * Verify session cookie on server side
 * @param {string} cookieValue - The triangle_session cookie value
 * @returns {Object|null} - Session data if valid, null otherwise
 */
function verifySession(cookieValue) {
  try {
    if (!cookieValue) return null;

    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const { data, sig } = JSON.parse(decoded);

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('CRITICAL: JWT_SECRET environment variable must be configured');
      return null;
    }

    // Data is already a string (not an object), verify it directly
    const expectedSig = crypto.createHmac('sha256', secret)
      .update(data)
      .digest('hex');

    if (sig !== expectedSig) return null;

    // Parse the data string to get the session object
    const sessionData = JSON.parse(data);

    // Check expiration (7 days)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - sessionData.timestamp > sevenDaysMs) return null;

    return sessionData;
  } catch (error) {
    return null;
  }
}

/**
 * Protect an admin page with server-side authentication
 * Use this in getServerSideProps for all admin pages
 *
 * @example
 * export async function getServerSideProps(context) {
 *   return requireAdminAuth(context);
 * }
 */
export function requireAdminAuth(context) {
  const cookies = parse(context.req.headers.cookie || '');
  const sessionCookie = cookies.triangle_session;

  if (!sessionCookie) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const session = verifySession(sessionCookie);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Check if user is admin
  if (!session.isAdmin) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  // Pass session data to page as props
  return {
    props: {
      session: {
        userId: session.userId,
        email: session.email,
        isAdmin: session.isAdmin,
        companyName: session.companyName
      }
    },
  };
}

/**
 * Protect any authenticated page (non-admin)
 * Use this in getServerSideProps for user dashboard pages
 *
 * @example
 * export async function getServerSideProps(context) {
 *   return requireAuth(context);
 * }
 */
export function requireAuth(context) {
  const cookies = parse(context.req.headers.cookie || '');
  const sessionCookie = cookies.triangle_session;

  if (!sessionCookie) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const session = verifySession(sessionCookie);

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Pass session data to page as props
  return {
    props: {
      session: {
        userId: session.userId,
        email: session.email,
        isAdmin: session.isAdmin,
        companyName: session.companyName
      }
    },
  };
}
