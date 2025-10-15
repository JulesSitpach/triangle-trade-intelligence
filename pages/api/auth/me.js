/**
 * Get Current User from Cookie Session
 * Returns authenticated user data if valid session exists
 */

import { parse } from 'cookie';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function verifySession(cookieValue) {
  try {
    if (!cookieValue) return null;

    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const { data, sig } = JSON.parse(decoded);

    const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    const expectedSig = crypto.createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');

    if (sig !== expectedSig) return null;

    // Check expiration (7 days)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > sevenDaysMs) return null;

    return data;
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const cookies = parse(req.headers.cookie || '');
    const sessionCookie = cookies.triangle_session;

    if (!sessionCookie) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'No session found'
      });
    }

    const session = verifySession(sessionCookie);

    if (!session) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Invalid session'
      });
    }

    // Fetch user profile from database to get subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', session.userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError);
    }

    return res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        isAdmin: session.isAdmin,
        company_name: session.companyName,
        subscription_tier: profile?.subscription_tier || 'Trial'
      }
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({
      success: false,
      authenticated: false,
      error: 'Server error'
    });
  }
}
