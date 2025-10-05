/**
 * Upgrade Existing User to Enterprise
 * Run with: node scripts/upgrade-to-enterprise.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function upgradeToEnterprise() {
  // Use the first available user
  const email = 'macproductions010@gmail.com';

  console.log('📝 Upgrading user to Enterprise tier...');
  console.log('Email:', email);

  try {
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

    console.log('✅ User upgraded to Enterprise:', data);
    console.log('\n📋 Login credentials:');
    console.log('Email:', email);
    console.log('Password: ANY (just type "test123" or anything)');
    console.log('\n🎉 Enterprise tier benefits:');
    console.log('  • Unlimited USMCA analyses');
    console.log('  • 25% discount on all professional services');
    console.log('  • Dedicated support');
    console.log('  • Goes to REGULAR user dashboard (not admin)');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

upgradeToEnterprise();
