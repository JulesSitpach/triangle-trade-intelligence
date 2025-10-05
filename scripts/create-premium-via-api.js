/**
 * Create Premium Development User via API
 * Run with: node scripts/create-premium-via-api.js
 */

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function createPremiumUser() {
  console.log('🔐 Creating Enterprise (Premium) development user via API...');

  const email = 'dev@triangleintelligence.com';
  const password = 'dev123';  // Any password works with current login.js

  try {
    // Step 1: Register via API
    console.log('📝 Registering user...');
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        company_name: 'Triangle Dev Company',
        full_name: 'Developer Admin',
        accept_terms: true
      })
    });

    const registerResult = await registerResponse.json();

    if (!registerResponse.ok) {
      if (registerResult.error === 'User already exists') {
        console.log('✓ User already exists, that\'s fine!');
      } else {
        console.error('❌ Registration failed:', registerResult);
        return;
      }
    } else {
      console.log('✅ User registered:', registerResult.message);
      console.log('📧 Check email for confirmation link (or skip if using dev database)');
    }

    // Step 2: Update subscription tier to Enterprise using Supabase directly
    console.log('\n📝 Updating subscription tier to Enterprise...');

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ subscription_tier: 'Enterprise' })
      .eq('email', email)
      .select();

    if (error) {
      console.error('❌ Failed to update tier:', error);
    } else {
      console.log('✅ Updated to Enterprise tier:', data);
    }

    console.log('\n📋 Login Credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\n🎉 You now have Enterprise (Premium) membership!');
    console.log('Benefits:');
    console.log('  • Unlimited USMCA analyses');
    console.log('  • 25% discount on all professional services');
    console.log('  • Dedicated support');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

createPremiumUser();
