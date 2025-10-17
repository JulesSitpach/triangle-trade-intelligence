import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { applyRateLimit, authLimiter } from '../../../lib/security/rateLimiter';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue.js';

// Service role client for user_profiles operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Apply rate limiting FIRST
  try {
    await applyRateLimit(authLimiter)(req, res);
  } catch (error) {
    console.log('🛡️ Rate limit exceeded for referral signup attempt');
    await logDevIssue({
      type: 'api_error',
      severity: 'medium',
      component: 'auth_api',
      message: 'Rate limit exceeded for referral signup',
      data: {
        endpoint: '/api/auth/signup-referral',
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
      }
    });
    return res.status(429).json({
      success: false,
      error: 'Too many registration attempts. Please try again in 15 minutes.'
    });
  }

  if (req.method !== 'POST') {
    await DevIssue.validationError('auth_api', 'HTTP method', req.method, {
      endpoint: '/api/auth/signup-referral',
      allowedMethod: 'POST'
    });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    email,
    password,
    company_name,
    full_name,
    referred_by,
    referral_source,
    referral_code
  } = req.body;

  // Validate required fields
  if (!email || !password || !company_name) {
    await DevIssue.missingData('auth_api', 'required referral signup fields', {
      endpoint: '/api/auth/signup-referral',
      hasEmail: !!email,
      hasPassword: !!password,
      hasCompanyName: !!company_name,
      referredBy: referred_by
    });
    return res.status(400).json({
      error: 'Email, password, and company name are required'
    });
  }

  try {
    console.log('🎁 Referral trial signup attempt:', email, 'referred by:', referred_by);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Calculate trial dates (30 days)
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);

    // Create user profile with Professional trial tier
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('user_profiles')
      .insert([
        {
          email: email.toLowerCase(),
          password_hash: passwordHash,
          company_name: company_name,
          full_name: full_name || 'Trial User',
          subscription_tier: 'Professional',  // Give them Professional tier
          status: 'trial',
          trial_start_date: trialStartDate.toISOString(),
          trial_end_date: trialEndDate.toISOString(),
          trial_used: false,  // Can still have regular trial later if they want
          referred_by: referred_by,
          referral_source: referral_source || 'linkedin',
          referral_date: new Date().toISOString(),
          referral_converted: false,  // Will be true when they pay
          terms_accepted_at: new Date().toISOString(),
          privacy_accepted_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (insertError || !newUser) {
      console.error('💥 User profile creation failed:', insertError);
      await DevIssue.apiError('auth_api', '/api/auth/signup-referral', insertError, {
        email,
        referredBy: referred_by,
        errorCode: insertError?.code,
        errorMessage: insertError?.message
      });
      return res.status(500).json({
        error: 'Failed to create user profile',
        details: insertError?.message
      });
    }

    console.log('✅ Referral trial user created:', newUser.email);
    console.log('🎁 30-day Professional trial activated');
    console.log('📊 Referred by:', referred_by);

    // Auto-login the user (set session cookie)
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        subscription_tier: newUser.subscription_tier,
        status: newUser.status
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const cookie = serialize('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    res.setHeader('Set-Cookie', cookie);

    return res.status(201).json({
      message: '30-day Professional trial activated!',
      user: {
        id: newUser.id,
        email: newUser.email,
        company_name: newUser.company_name,
        full_name: newUser.full_name,
        subscription_tier: newUser.subscription_tier,
        status: newUser.status,
        trial_end_date: newUser.trial_end_date,
        referred_by: newUser.referred_by
      },
      trial: {
        start_date: newUser.trial_start_date,
        end_date: newUser.trial_end_date,
        days_remaining: 30
      }
    });

  } catch (error) {
    console.error('💥 Referral signup error:', error);
    await DevIssue.apiError('auth_api', '/api/auth/signup-referral', error, {
      email: req.body?.email,
      referredBy: req.body?.referred_by,
      attemptedAt: new Date().toISOString()
    });
    return res.status(500).json({ error: 'Registration failed' });
  }
}
