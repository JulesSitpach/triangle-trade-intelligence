/**
 * Get user email notification preferences
 * Loads granular component-level and market intel email preferences
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from session
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || req.cookies['sb-access-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Get email preferences from user_profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .select('email_preferences')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error loading email preferences:', error);
      return res.status(500).json({ error: error.message });
    }

    // Default to empty object (all enabled) if not set
    const preferences = data?.email_preferences || {};

    console.log(`✅ Loaded email preferences for user ${user.id}`);

    return res.status(200).json({
      success: true,
      email_preferences: preferences
    });
  } catch (error) {
    console.error('Get email preferences error:', error);
    return res.status(500).json({ error: error.message });
  }
}
