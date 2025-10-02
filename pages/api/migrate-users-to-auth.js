/**
 * Migration Script: Add existing user_profiles to Supabase Auth
 *
 * This creates Supabase Auth users for existing user_profiles entries
 *
 * USAGE:
 * 1. Set temporary passwords for each user
 * 2. POST to this endpoint with user data
 * 3. Users will be created in Supabase Auth
 * 4. Users can then log in with new system
 *
 * Example:
 * POST /api/migrate-users-to-auth
 * {
 *   "users": [
 *     {
 *       "email": "macproductions010@gmail.com",
 *       "password": "TempPassword123!",
 *       "profile_id": "570206c8-b431-4936-81e8-8186ea4065f0"
 *     }
 *   ]
 * }
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { users } = req.body;

    if (!users || !Array.isArray(users)) {
      return res.status(400).json({
        error: 'Invalid request. Provide users array.'
      });
    }

    const results = [];

    for (const userData of users) {
      const { email, password, profile_id } = userData;

      if (!email || !password) {
        results.push({
          email,
          success: false,
          error: 'Missing email or password'
        });
        continue;
      }

      try {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email.toLowerCase(),
          password: password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            migrated_from_user_profiles: true,
            original_profile_id: profile_id,
            migrated_at: new Date().toISOString()
          }
        });

        if (authError) {
          results.push({
            email,
            success: false,
            error: authError.message
          });
          continue;
        }

        // Update user_profiles with auth user ID (for linking)
        if (profile_id) {
          await supabase
            .from('user_profiles')
            .update({
              auth_user_id: authData.user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile_id);
        }

        results.push({
          email,
          success: true,
          auth_user_id: authData.user.id,
          profile_id: profile_id
        });

        console.log('✅ Migrated user:', email);

      } catch (error) {
        results.push({
          email,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return res.status(200).json({
      success: true,
      summary: {
        total: users.length,
        migrated: successCount,
        failed: failCount
      },
      results
    });

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
