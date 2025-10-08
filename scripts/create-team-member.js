/**
 * Create team member account
 * Usage: node scripts/create-team-member.js email@example.com "Full Name" "password"
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createTeamMember() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error('❌ Usage: node scripts/create-team-member.js email@example.com "Full Name" "password"');
    process.exit(1);
  }

  const [email, fullName, password] = args;

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

  console.log('🔐 Creating team member account...');
  console.log('📧 Email:', email);
  console.log('👤 Name:', fullName);

  try {
    // Create user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log('✅ User created!');
    console.log('User ID:', data.user.id);

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        subscription_tier: 'Starter',
        status: 'active',
        is_admin: false,
        role: 'user'
      });

    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      return;
    }

    console.log('✅ Team member account ready!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('\n🌐 They can login at: https://triangle-trade-intelligence.vercel.app/login');

  } catch (err) {
    console.error('💥 Error:', err.message);
  }
}

createTeamMember();
