/**
 * Create Premium Development User
 * Run with: node scripts/create-premium-user.js
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPremiumUser() {
  console.log('🔐 Creating Premium development user...');

  const email = 'dev@triangleintelligence.com';
  const premiumUser = {
    id: randomUUID(),
    email: email,
    company_name: 'Triangle Dev Company',
    full_name: 'Developer Admin',
    subscription_tier: 'Enterprise', // Using Enterprise (highest tier in database)
    status: 'active',
    created_at: new Date().toISOString(),
    terms_accepted_at: new Date().toISOString(),
    privacy_accepted_at: new Date().toISOString()
  };

  // Check if user exists
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (existing) {
    console.log('✏️ User exists, updating to Enterprise...');
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        subscription_tier: 'Enterprise',
        status: 'active'
      })
      .eq('email', email)
      .select();

    if (error) {
      console.error('❌ Update failed:', error);
      return;
    }
    console.log('✅ User updated to Premium:', data);
  } else {
    console.log('➕ Creating new Premium user...');
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([premiumUser])
      .select();

    if (error) {
      console.error('❌ Creation failed:', error);
      return;
    }
    console.log('✅ Premium user created:', data);
  }

  console.log('\n📋 Login Credentials:');
  console.log('Email:', email);
  console.log('Password: ANY (password validation is disabled in login.js)');
  console.log('\n🎉 You now have Premium membership!');
  console.log('Benefits:');
  console.log('  • Unlimited USMCA analyses');
  console.log('  • 25% discount on all professional services');
  console.log('  • Quarterly strategy calls with Jorge & Cristina');
  console.log('  • Dedicated support');
}

createPremiumUser().catch(console.error);
