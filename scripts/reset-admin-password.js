/**
 * Reset Admin Password Script
 * Run with: node scripts/reset-admin-password.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function resetPassword() {
  const email = 'triangleintel@gmail.com';
  const newPassword = 'Admin2025!';

  console.log('🔐 Resetting password for:', email);

  try {
    // Update password using admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      'add67c6f-7a29-46b0-85e0-c8b487f17c53', // User ID from database
      { password: newPassword }
    );

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log('✅ Password reset successful!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', newPassword);
    console.log('\nYou can now login at: http://localhost:3000/login');

  } catch (err) {
    console.error('💥 Script error:', err.message);
  }
}

resetPassword();
