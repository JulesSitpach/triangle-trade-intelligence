/**
 * Properly reset password using Supabase Admin API
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function resetPassword() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const email = 'triangleintel@gmail.com';
  const userId = 'add67c6f-7a29-46b0-85e0-c8b487f17c53';
  const newPassword = 'Admin2025!';

  console.log('🔐 Resetting password for:', email);
  console.log('📋 User ID:', userId);

  try {
    // Method 1: Update user password directly
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      console.error('❌ Error:', error);

      // Method 2: Try generating reset link instead
      console.log('\n📧 Trying password reset link method...');
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email
      });

      if (linkError) {
        console.error('❌ Link error:', linkError);
      } else {
        console.log('✅ Recovery link generated!');
        console.log('🔗 Link:', linkData.properties?.action_link);
      }
      return;
    }

    console.log('✅ Password updated successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 New Password:', newPassword);
    console.log('\n🌐 You can now login at:');
    console.log('   - Local: http://localhost:3000/login');
    console.log('   - Production: https://triangle-trade-intelligence.vercel.app/login');

  } catch (err) {
    console.error('💥 Unexpected error:', err.message);
  }
}

resetPassword();
