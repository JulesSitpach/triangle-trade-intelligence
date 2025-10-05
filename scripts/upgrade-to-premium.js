/**
 * Upgrade User to Premium Tier
 * Run with: node scripts/upgrade-to-premium.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function upgradeToPremium() {
  const email = 'macproductions010@gmail.com';

  console.log('📝 Upgrading user to Premium tier...');
  console.log('Email:', email);

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        subscription_tier: 'Premium',
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

    console.log('✅ User upgraded to Premium:', data);
    console.log('\n📋 Login credentials:');
    console.log('Email:', email);
    console.log('Password: ANY (just type "test123" or anything)');
    console.log('\n🎉 Premium tier benefits:');
    console.log('  • Unlimited USMCA analyses');
    console.log('  • 25% discount on all professional services');
    console.log('  • Quarterly strategy calls with Jorge & Cristina');
    console.log('  • Dedicated Slack/email support');
    console.log('  • Custom trade intelligence reports');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

upgradeToPremium();
