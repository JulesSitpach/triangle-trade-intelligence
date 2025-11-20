import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { applyRateLimit, authLimiter } from '../../../lib/security/rateLimiter';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue.js';

// Service role client for user_profiles operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Anon client for auth operations
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Apply rate limiting FIRST
  try {
    await applyRateLimit(authLimiter)(req, res);
  } catch (error) {
    console.log('🛡️ Rate limit exceeded for registration attempt');
    await logDevIssue({
      type: 'api_error',
      severity: 'medium',
      component: 'auth_api',
      message: 'Rate limit exceeded for registration',
      data: {
        endpoint: '/api/auth/register',
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
      endpoint: '/api/auth/register',
      allowedMethod: 'POST'
    });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, company_name, full_name, accept_terms } = req.body;

  // Validate required fields
  if (!email || !password || !company_name) {
    await DevIssue.missingData('auth_api', 'required registration fields', {
      endpoint: '/api/auth/register',
      hasEmail: !!email,
      hasPassword: !!password,
      hasCompanyName: !!company_name
    });
    return res.status(400).json({
      error: 'Email, password, and company name are required'
    });
  }

  // Validate terms acceptance
  if (!accept_terms) {
    await DevIssue.validationError('auth_api', 'accept_terms', accept_terms, {
      endpoint: '/api/auth/register',
      email
    });
    return res.status(400).json({
      error: 'You must accept the Terms of Service and Privacy Policy to register'
    });
  }

  try {
    console.log('🔐 Registration attempt:', email);

    // Check if user already exists and handle unconfirmed accounts
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('user_profiles')
      .select('email, user_id, created_at')
      .eq('email', email)
      .single();

    if (existingProfile) {
      // Check if the auth account is confirmed
      const { data: authUser, error: authCheckError } = await supabaseAdmin.auth.admin.getUserById(existingProfile.user_id);

      if (authUser && authUser.user && authUser.user.email_confirmed_at) {
        // Account exists and is confirmed - block signup
        console.log('❌ User already exists and is confirmed:', email);
        return res.status(409).json({ error: 'User already exists' });
      }

      // Account exists but NOT confirmed - check if it's stale (> 24 hours old)
      const accountAge = Date.now() - new Date(existingProfile.created_at).getTime();
      const isStale = accountAge > 24 * 60 * 60 * 1000; // 24 hours

      if (isStale) {
        console.log('🧹 Cleaning up stale unconfirmed account (>24h old):', email);

        // Delete old unconfirmed account from user_profiles
        await supabaseAdmin
          .from('user_profiles')
          .delete()
          .eq('user_id', existingProfile.user_id);

        // Delete old unconfirmed auth user
        await supabaseAdmin.auth.admin.deleteUser(existingProfile.user_id);

        console.log('✅ Stale account deleted, proceeding with new signup');
      } else {
        // Account < 24 hours old - tell user to check email
        console.log('⏰ Recent unconfirmed account exists (<24h old):', email);
        return res.status(409).json({
          error: 'Account exists but email not confirmed. Please check your email for the confirmation link. If you didn\'t receive it, try again in 24 hours.'
        });
      }
    }

    // Step 1: Create user in auth.users via Supabase Auth
    // ✅ CONVERSION FIX: Skip email verification for trial users (instant access)
    console.log('📝 Creating auth user...');
    const termsAcceptedAt = new Date().toISOString();
    const isTrial = true; // All new signups start on trial

    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login?message=Account created successfully. Please sign in.`,
        data: {
          full_name: full_name || 'New User',
          company_name: company_name,
          subscription_tier: 'Trial',
          terms_accepted_at: termsAcceptedAt,
          privacy_accepted_at: termsAcceptedAt
        },
        // ✅ Skip email confirmation for trial users = instant conversion
        // This dramatically improves signup conversion by eliminating email friction
        emailRedirectTo: isTrial ? undefined : `${process.env.NEXT_PUBLIC_APP_URL}/login?message=Account created successfully. Please sign in.`
      }
    });

    if (authError || !authData.user) {
      console.error('💥 Auth user creation failed:', authError);
      await DevIssue.apiError('auth_api', '/api/auth/register', authError, {
        email,
        errorCode: authError?.code,
        errorMessage: authError?.message
      });
      return res.status(500).json({
        error: 'Failed to create auth user',
        details: authError?.message
      });
    }

    const userId = authData.user.id;
    console.log('✅ Auth user created with ID:', userId);

    // CRITICAL: Create user_profiles record IMMEDIATELY (don't wait for email confirmation)
    // If we wait, user_id stays NULL and dashboard breaks
    // Calculate trial end date (7 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId, // Use auth user ID as profile ID (foreign key to auth.users)
        user_id: userId,
        email: email.toLowerCase(),
        company_name: company_name,
        full_name: full_name || 'New User',
        subscription_tier: 'Trial',
        status: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
        terms_accepted_at: termsAcceptedAt,
        privacy_accepted_at: termsAcceptedAt
      })
      .select()
      .single();

    if (profileError) {
      console.error('💥 Failed to create user profile:', profileError);
      await DevIssue.apiError('auth_api', '/api/auth/register - profile creation', profileError, {
        userId,
        email,
        errorCode: profileError?.code
      });

      // CRITICAL: If profile creation fails, delete auth user to maintain data integrity
      console.log('🔄 Rolling back auth user creation...');
      await supabaseAuth.auth.admin.deleteUser(userId);

      return res.status(500).json({
        error: 'Failed to create user profile',
        details: profileError.message
      });
    }

    console.log('✅ User profile created:', profile.id);

    // ✅ CONVERSION FIX: For trial users, create immediate session (no email verification)
    // Sign in the user immediately after registration
    const { data: sessionData, error: sessionError } = await supabaseAuth.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (sessionError || !sessionData.session) {
      console.error('⚠️ Auto-login after trial signup failed:', sessionError);
      // Fallback: Return success but require manual login
      return res.status(201).json({
        message: 'Registration successful! You can now sign in.',
        email_confirmation_required: false,
        user_id: userId,
        profile: profile
      });
    }

    console.log('✅ Trial user auto-logged in - instant access granted');

    // Return session data so frontend can redirect immediately
    return res.status(201).json({
      message: 'Registration successful! Redirecting to dashboard...',
      email_confirmation_required: false,
      user_id: userId,
      profile: profile,
      session: sessionData.session,
      user: sessionData.user,
      instant_access: true
    });

  } catch (error) {
    console.error('💥 Registration error:', error);
    await DevIssue.apiError('auth_api', '/api/auth/register', error, {
      email: req.body?.email,
      attemptedAt: new Date().toISOString()
    });
    return res.status(500).json({ error: 'Registration failed' });
  }
}