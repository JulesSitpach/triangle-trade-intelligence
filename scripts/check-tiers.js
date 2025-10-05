/**
 * Check existing subscription tiers in database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTiers() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Existing subscription tiers in database:');
    const tiers = [...new Set(data.map(u => u.subscription_tier))];
    console.log(tiers);
  }
}

checkTiers();
