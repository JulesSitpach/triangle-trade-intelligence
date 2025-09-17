// Quick fix script to test auth callback profile lookup
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProfile() {
  const userId = 'a01bba2e-5456-4075-965e-72bd261449d5';

  console.log('🔍 Checking for profile with ID:', userId);

  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('❌ Profile lookup error:', error);
  } else {
    console.log('✅ Profile found:', profile);
  }
}

checkProfile();