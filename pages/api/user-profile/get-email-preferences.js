/**
 * Get user email notification preferences
 * Loads granular component-level and market intel email preferences
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verify custom triangle_session cookie (same as auth/me.js)
function verifySession(cookieValue) {
  try {
    if (!cookieValue) return null;
    const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8');
    const { data, sig } = JSON.parse(decoded);
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const expectedSig = crypto.createHmac('sha256', secret).update(dataString).digest('hex');
    if (sig !== expectedSig) return null;
    const sessionData = typeof data === 'string' ? JSON.parse(data) : data;
    // Check expiration (7 days)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - sessionData.timestamp > sevenDaysMs) return null;
    return sessionData;
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from triangle_session cookie (matching auth/me.js pattern)
    const cookies = parse(req.headers.cookie || '');
    const sessionCookie = cookies.triangle_session;

    if (!sessionCookie) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = verifySession(sessionCookie);

    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Get email preferences from user_profiles using session.userId
    const { data, error } = await supabase
      .from('user_profiles')
      .select('email_preferences')
      .eq('user_id', session.userId)
      .single();

    if (error) {
      console.error('Error loading email preferences:', error);
      return res.status(500).json({ error: error.message });
    }

    // Default to empty object (all enabled) if not set
    const preferences = data?.email_preferences || {};

    console.log(`✅ Loaded email preferences for user ${session.userId}`);

    return res.status(200).json({
      success: true,
      email_preferences: preferences
    });
  } catch (error) {
    console.error('Get email preferences error:', error);
    return res.status(500).json({ error: error.message });
  }
}
