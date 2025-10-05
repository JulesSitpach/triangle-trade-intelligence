/**
 * Create Dev User Profile Directly (Bypass Auth)
 * Run with: node scripts/create-dev-user-simple.js
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDevUser() {
  const email = 'dev@triangleintelligence.com';

  console.log('📝 Creating dev user profile directly...');

  try {
    // Check if user exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (existing) {
      console.log('✅ User already exists:', existing);
      console.log('\n📋 Login credentials:');
      console.log('Email:', email);
      console.log('Password: ANY (just type "dev123" or anything)');
      return;
    }

    // Create user profile without auth (for development)
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        email: email,
        company_name: 'Triangle Dev Company',
        full_name: 'Developer Admin',
        subscription_tier: 'Enterprise',
        status: 'active',
        country: 'US',
        role: 'user',
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('❌ Failed to create user:', error);
      return;
    }

    console.log('✅ User profile created:', data);
    console.log('\n📋 Login credentials:');
    console.log('Email:', email);
    console.log('Password: ANY (just type "dev123" or anything)');
    console.log('\n🎉 Enterprise tier with unlimited analyses!');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

createDevUser();
