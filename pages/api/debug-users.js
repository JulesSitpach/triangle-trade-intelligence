/**
 * Debug Users - Check what users exist in database
 * Access at: http://localhost:3000/api/debug-users
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // Check user_profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, company_name, is_admin, role, created_at')
      .limit(10);

    // Check auth.users (Supabase Auth)
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

    return res.status(200).json({
      success: true,
      user_profiles: {
        count: profiles?.length || 0,
        data: profiles,
        error: profileError?.message
      },
      auth_users: {
        count: authUsers?.length || 0,
        emails: authUsers?.map(u => u.email) || [],
        error: authError?.message
      },
      diagnosis: {
        hasUserProfiles: !!profiles && profiles.length > 0,
        hasAuthUsers: !!authUsers && authUsers.length > 0,
        needsMigration: (profiles?.length || 0) > (authUsers?.length || 0)
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
