/**
 * Simple Login with httpOnly Cookies
 * Works with existing user_profiles table
 * No Supabase Auth - just secure cookies
 *
 * Security: Rate limited to 5 attempts per 15 minutes
 */

import { createClient } from '@supabase/supabase-js';
import { serialize } from 'cookie';
import crypto from 'crypto';
import { applyRateLimit, authLimiter } from '../../../lib/security/rateLimiter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple session signing (better than plain base64)
function signSession(sessionData) {
  const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
  const data = JSON.stringify(sessionData);
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ data: sessionData, sig: signature })).toString('base64');
}

export default async function handler(req, res) {
  // Apply rate limiting FIRST
  try {
    await applyRateLimit(authLimiter)(req, res);
  } catch (error) {
    console.log('🛡️ Rate limit exceeded for login attempt');
    return res.status(429).json({
      success: false,
      error: 'Too many login attempts. Please try again in 15 minutes.'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  try {
    console.log('🔐 Login attempt:', email);

    // Get user from YOUR EXISTING user_profiles table
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // For NOW - accept any password (like your old system did)
    // TODO: Add password_hash column and bcrypt validation later
    console.log('⚠️ Password validation temporarily disabled for compatibility');

    // Update last login
    await supabase
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Create session data
    const sessionData = {
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin === true || user.role === 'admin',
      companyName: user.company_name,
      timestamp: Date.now()
    };

    // Sign and encode session
    const sessionToken = signSession(sessionData);

    // Set httpOnly cookie (secure in production!)
    res.setHeader('Set-Cookie', serialize('triangle_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    }));

    console.log('✅ Login successful:', email, 'Admin:', sessionData.isAdmin);

    // Return user data
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        company_name: user.company_name,
        subscription_tier: user.subscription_tier,
        status: user.status,
        full_name: user.full_name,
        isAdmin: sessionData.isAdmin
      }
    });

  } catch (error) {
    console.error('💥 Login error:', error);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
}
