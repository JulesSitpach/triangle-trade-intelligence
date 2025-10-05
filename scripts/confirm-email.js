/**
 * Confirm Email for Development User
 * Run with: node scripts/confirm-email.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function confirmEmail() {
  const email = 'dev@triangleintelligence.com';

  console.log('📧 Confirming email for:', email);

  try {
    // Get the user from auth.users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Failed to list users:', listError);
      return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      console.log('❌ User not found in auth.users. Creating manually...');

      // Create user in user_profiles directly
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert([{
          email: email,
          company_name: 'Triangle Dev Company',
          full_name: 'Developer Admin',
          subscription_tier: 'Enterprise',
          status: 'active',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (profileError) {
        console.error('❌ Failed to create profile:', profileError);
        return;
      }

      console.log('✅ User profile created:', profile);
      console.log('\n📋 You can now login with:');
      console.log('Email:', email);
      console.log('Password: ANY (password validation is disabled)');
      return;
    }

    // Update user to confirmed
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error('❌ Failed to confirm email:', updateError);
      return;
    }

    console.log('✅ Email confirmed for user:', user.email);

    // Now create user_profiles entry
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: email,
        company_name: 'Triangle Dev Company',
        full_name: 'Developer Admin',
        subscription_tier: 'Enterprise',
        status: 'active',
        created_at: new Date().toISOString()
      }, { onConflict: 'email' })
      .select();

    if (profileError) {
      console.error('⚠️ Profile creation warning:', profileError);
    } else {
      console.log('✅ User profile created/updated:', profile);
    }

    console.log('\n📋 You can now login with:');
    console.log('Email:', email);
    console.log('Password: ANY (password validation is disabled)');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

confirmEmail();
