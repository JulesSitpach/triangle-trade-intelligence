/**
 * Create Regular Enterprise User (NOT admin)
 * Run with: node scripts/create-enterprise-user.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createEnterpriseUser() {
  const email = 'user@triangleintelligence.com';

  console.log('📝 Creating regular Enterprise user (NOT admin)...');

  try {
    // Check if user exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (existing) {
      // Update to Enterprise if exists
      console.log('✏️ User exists, updating to Enterprise tier...');
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          subscription_tier: 'Enterprise',
          status: 'active',
          is_admin: false,
          role: 'user'
        })
        .eq('email', email)
        .select();

      if (error) {
        console.error('❌ Update failed:', error);
        return;
      }

      console.log('✅ User updated to Enterprise:', data);
    } else {
      console.log('❌ User does not exist. Please sign up first at /signup');
      console.log('   OR use an existing user from the list below:');

      const { data: users } = await supabase
        .from('user_profiles')
        .select('email, subscription_tier, is_admin, role')
        .or('is_admin.is.null,is_admin.eq.false')
        .limit(5);

      console.log('\n📋 Available non-admin users:');
      users?.forEach(u => {
        console.log(`  - ${u.email} (Tier: ${u.subscription_tier || 'Trial'})`);
      });

      console.log('\n💡 Pick one and I\'ll upgrade it to Enterprise for you.');
      return;
    }

    console.log('\n📋 Login credentials:');
    console.log('Email:', email);
    console.log('Password: ANY (just type "test123" or anything)');
    console.log('Tier: Enterprise (unlimited analyses)');
    console.log('Admin: NO (goes to regular user dashboard)');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

createEnterpriseUser();
