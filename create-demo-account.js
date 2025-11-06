/**
 * Create Demo Account for VIP Testing
 * Creates a pre-configured Starter account without payment
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDemoAccount() {
  const demoUser = {
    email: 'ja.ochoa.demo@triangle-trade-intel.site',
    password: 'CCVIAL2025!',
    companyName: 'CCVIAL - Sepropen Sepropaint',
    fullName: 'JA Ochoa',
    subscriptionTier: 'Starter'
  };

  console.log('\nCreating demo account for:', demoUser.fullName);

  // Step 1: Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: demoUser.email,
    password: demoUser.password,
    email_confirm: true // Auto-confirm email
  });

  if (authError) {
    console.error('❌ Auth creation failed:', authError);
    return;
  }

  console.log('✅ Auth user created:', authData.user.id);

  // Step 2: Create user profile
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30); // 30 days from now
  
  const resetDate = new Date();
  resetDate.setDate(resetDate.getDate() + 30);

  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: authData.user.id,
      email: demoUser.email,
      user_email: demoUser.email,
      company_name: demoUser.companyName,
      full_name: demoUser.fullName,
      subscription_tier: demoUser.subscriptionTier,
      analyses_this_month: 0, // Start at 0, can use up to 15
      analyses_reset_date: resetDate.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      email_confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (profileError) {
    console.error('❌ Profile creation failed:', profileError);
    return;
  }

  console.log('✅ User profile created');
  console.log('\n📧 ========================================');
  console.log('   DEMO ACCOUNT CREATED');
  console.log('========================================');
  console.log('Name:', demoUser.fullName);
  console.log('Company:', demoUser.companyName);
  console.log('Email:', demoUser.email);
  console.log('Password:', demoUser.password);
  console.log('Tier:', demoUser.subscriptionTier + ' (15 workflows/month)');
  console.log('Valid Until:', trialEndsAt.toLocaleDateString());
  console.log('\nLogin URL: https://triangle-trade-intel.site');
  console.log('========================================\n');
}

createDemoAccount().catch(console.error);
