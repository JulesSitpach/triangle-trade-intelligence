/**
 * Admin verification utility
 * Verifies if a request is from an admin user
 */

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verify if the request is from an admin user
 * @param {Object} req - Request object
 * @returns {Promise<{isAdmin: boolean, user?: Object, error?: string}>}
 */
export async function verifyAdmin(req) {
  try {
    // Get session cookie
    const sessionCookie = req.cookies?.triangle_session;

    if (!sessionCookie) {
      return { isAdmin: false, error: 'No session found' };
    }

    // Verify JWT session
    let sessionData;
    try {
      sessionData = jwt.verify(sessionCookie, process.env.JWT_SECRET);
    } catch (jwtError) {
      return { isAdmin: false, error: 'Invalid session' };
    }

    // Check if user is admin
    if (!sessionData?.email) {
      return { isAdmin: false, error: 'Invalid session data' };
    }

    // Admin emails
    const adminEmails = ['triangleintel@gmail.com'];
    const isAdmin = adminEmails.includes(sessionData.email);

    if (!isAdmin) {
      return { isAdmin: false, error: 'Not an admin user' };
    }

    // Get full user profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', sessionData.email)
      .single();

    return {
      isAdmin: true,
      user: {
        id: sessionData.userId,
        email: sessionData.email,
        ...userProfile
      }
    };
  } catch (error) {
    console.error('Error verifying admin:', error);
    return { isAdmin: false, error: 'Verification failed' };
  }
}

/**
 * Middleware to require admin access
 * Usage: const result = await requireAdmin(req, res);
 * Returns null if unauthorized (response already sent), otherwise returns admin user
 */
export async function requireAdmin(req, res) {
  const verification = await verifyAdmin(req);

  if (!verification.isAdmin) {
    res.status(403).json({
      error: 'Admin access required',
      message: verification.error || 'Unauthorized'
    });
    return null;
  }

  return verification.user;
}
