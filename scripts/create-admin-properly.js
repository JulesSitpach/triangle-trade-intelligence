/**
 * Create admin user using Supabase's proper signup API
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createAdmin() {
  // Use service role key for admin operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const email = 'triangleintel@gmail.com';
  const password = 'Admin2025!';

  console.log('🔐 Creating admin user via Supabase Admin API...');

  try {
    // Create user with admin API (bypasses email confirmation)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Triangle Admin',
        company_name: 'Triangle Intelligence'
      }
    });

    if (error) {
      console.error('❌ Error creating user:', error.message);
      return;
    }

    console.log('✅ User created successfully!');
    console.log('User ID:', data.user.id);

    // Now create user profile with admin access
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: data.user.id,
        email: email,
        full_name: 'Triangle Admin',
        company_name: 'Triangle Intelligence',
        subscription_tier: 'Starter',
        status: 'active',
        is_admin: true,
        role: 'admin'
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      return;
    }

    console.log('✅ Admin profile created!');
    console.log('\n🎉 Admin account ready!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Role: Admin');
    console.log('\n🌐 Login at: https://triangle-trade-intelligence.vercel.app/login');

  } catch (err) {
    console.error('💥 Unexpected error:', err.message);
  }
}

createAdmin();
