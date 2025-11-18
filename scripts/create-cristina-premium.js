/**
 * Create Premium Account for Cristina Escalante (Simplified & Robust)
 * Run with: node scripts/create-cristina-premium.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAccount() {
  const email = 'cris.escalante.r@hotmail.com';
  const password = 'Triangle2025!Premium';

  console.log('🚀 Creating Premium account for Cristina Escalante\n');

  try {
    // Step 1: Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.find(u => u.email === email);

    if (userExists) {
      console.log('✅ User already exists:', userExists.id);
      const userId = userExists.id;

      // Just create/update profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          user_id: userId,
          full_name: 'Cristina Escalante',
          email: email,
          user_email: email,
          company_name: 'Triangle Intelligence Platform',
          subscription_tier: 'Premium',
          status: 'active',
          email_notifications: true,
          analyses_this_month: 0,
          analyses_reset_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();

      if (profileError) throw profileError;
      console.log('✅ Profile updated to Premium');

      // Initialize usage tracking
      const currentMonth = new Date().toISOString().substring(0, 7);
      await supabase.from('monthly_usage_tracking').upsert({
        user_id: userId,
        month: currentMonth,
        analysis_count: 0,
        limit_tier: 500,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,month' });

      console.log('✅ Usage tracking initialized');
      printSuccess(email, password, userId);
      return;
    }

    // Step 2: Create new auth user
    console.log('Creating new auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: 'Cristina Escalante' }
    });

    if (authError) throw authError;
    const userId = authData.user.id;
    console.log('✅ Auth user created:', userId);

    // Step 3: Create profile with same ID pattern
    console.log('Creating user profile...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        user_id: userId,
        full_name: 'Cristina Escalante',
        email: email,
        user_email: email,
        company_name: 'Triangle Intelligence Platform',
        subscription_tier: 'Premium',
        status: 'active',
        email_notifications: true,
        analyses_this_month: 0,
        analyses_reset_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) throw profileError;
    console.log('✅ User profile created');

    // Step 4: Initialize monthly tracking
    console.log('Initializing usage tracking...');
    const currentMonth = new Date().toISOString().substring(0, 7);
    const { error: usageError } = await supabase
      .from('monthly_usage_tracking')
      .insert({
        user_id: userId,
        month: currentMonth,
        analysis_count: 0,
        limit_tier: 500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (usageError) console.warn('⚠️  Usage tracking:', usageError.message);
    else console.log('✅ Usage tracking initialized');

    printSuccess(email, password, userId);

  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    process.exit(1);
  }
}

function printSuccess(email, password, userId) {
  console.log('\n' + '='.repeat(70));
  console.log('✅ ACCOUNT READY FOR CRISTINA ESCALANTE');
  console.log('='.repeat(70));
  console.log('\n📋 Credentials:');
  console.log(`   Email:     ${email}`);
  console.log(`   Password:  ${password}`);
  console.log(`   User ID:   ${userId}`);
  console.log('\n🎯 Subscription:');
  console.log('   Tier:      Premium');
  console.log('   Analyses:  500 per month');
  console.log('\n🔗 Login at:');
  console.log('   https://triangle-trade-intelligence.vercel.app/login');
  console.log('\n⚠️  IMPORTANT:');
  console.log('   Share credentials securely with Cristina');
  console.log('   She should change password after first login');
  console.log('\n' + '='.repeat(70) + '\n');
}

createAccount()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
