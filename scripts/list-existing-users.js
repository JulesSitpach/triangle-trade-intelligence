/**
 * List existing users in user_profiles
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listUsers() {
  console.log('📋 Listing existing users...\n');

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, company_name, subscription_tier, status')
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (data.length === 0) {
    console.log('No users found in user_profiles table.');
    console.log('\n💡 You need to sign up first at http://localhost:3000/signup');
    console.log('   Then confirm your email in Supabase Dashboard > Authentication > Users');
    return;
  }

  console.log(`Found ${data.length} user(s):\n`);
  data.forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`Company: ${user.company_name || 'N/A'}`);
    console.log(`Tier: ${user.subscription_tier || 'Trial'}`);
    console.log(`Status: ${user.status}`);
    console.log(`ID: ${user.id}`);
    console.log('---');
  });

  console.log('\n📋 To login, use any of these emails with ANY password (validation disabled)');
}

listUsers();
