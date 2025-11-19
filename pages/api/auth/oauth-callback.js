import { getSupabaseServiceClient } from '../../../lib/database/supabase-client';
import { serialize } from 'cookie';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, email, full_name, avatar_url, provider } = req.body;

  if (!user_id || !email) {
    return res.status(400).json({ error: 'User ID and email are required' });
  }

  try {
    const supabase = getSupabaseServiceClient();

    // Check if user profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    let profile;

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = not found, which is OK
      console.error('Error fetching profile:', fetchError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingProfile) {
      // User exists - update last activity timestamp
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          updated_at: new Date().toISOString()
          // ✅ FIX: Removed last_login_at and avatar_url (columns don't exist)
        })
        .eq('user_id', user_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      profile = updatedProfile;
      console.log('✅ Existing user profile updated:', email);
    } else {
      // New user - create profile with Trial tier
      // Calculate trial end date (7 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      const { data: newProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user_id, // ✅ FIX: Primary key must be set explicitly (same as auth user ID)
          user_id,
          email: email.toLowerCase(),
          user_email: email.toLowerCase(),
          company_name: null, // ✅ OAuth users provide this in Step 1 of workflow, not during signup
          full_name: full_name || email.split('@')[0],
          subscription_tier: 'Trial',
          status: 'trial',
          trial_ends_at: trialEndsAt.toISOString(),
          analyses_this_month: 0,
          analyses_reset_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return res.status(500).json({ error: 'Failed to create profile' });
      }

      profile = newProfile;
      console.log('✅ New user profile created:', email, '| Tier: Trial');
    }

    // Create session data (same format as regular login)
    const sessionData = {
      userId: user_id,
      email: profile.email,
      isAdmin: profile.is_admin || false,
      companyName: profile.company_name || null,
      timestamp: Date.now()
    };

    // Sign session using same method as regular login
    const dataString = JSON.stringify(sessionData);
    const signature = crypto.createHmac('sha256', process.env.JWT_SECRET)
      .update(dataString)
      .digest('hex');
    const sessionToken = Buffer.from(JSON.stringify({ data: dataString, sig: signature })).toString('base64');

    // Set HTTP-only cookie (same name and settings as regular login)
    const cookie = serialize('triangle_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({
      success: true,
      user: {
        id: user_id,
        email: profile.email,
        full_name: profile.full_name,
        subscription_tier: profile.subscription_tier,
        isAdmin: profile.is_admin || false
      }
    });

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
