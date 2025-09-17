import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, company_name, full_name } = req.body;

  if (!email || !password || !company_name) {
    return res.status(400).json({
      error: 'Email, password, and company name are required'
    });
  }

  try {
    console.log('🔐 Registration attempt:', email);

    // Check if user already exists in user_profiles
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(409).json({ error: 'User already exists' });
    }

    // Step 1: Create user in auth.users via Supabase Auth with email confirmation
    console.log('📝 Creating auth user with email confirmation...');
    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login?message=Account created successfully. Please sign in.`,
        data: {
          full_name: full_name || 'New User',
          company_name: company_name
        }
      }
    });

    if (authError || !authData.user) {
      console.error('💥 Auth user creation failed:', authError);
      return res.status(500).json({
        error: 'Failed to create auth user',
        details: authError?.message
      });
    }

    const userId = authData.user.id;
    console.log('✅ Auth user created with ID:', userId);
    console.log('📧 Email confirmation required - user profile will be created after email verification');

    // Don't create profile yet - wait for email confirmation
    // The callback page will create the profile after email verification

    console.log('✅ Registration initiated for:', email);

    // Return success but indicate email verification needed
    return res.status(201).json({
      message: 'Registration successful! Please check your email to confirm your account.',
      email_confirmation_required: true,
      user_id: userId
    });

  } catch (error) {
    console.error('💥 Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
}