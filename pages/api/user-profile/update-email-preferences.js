/**
 * Update user email notification preferences
 * Saves granular component-level and market intel email preferences
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
    const { userId, preferences } = req.body;

    if (!userId || !preferences) {
      return res.status(400).json({ error: 'Missing userId or preferences' });
    }

    // Update email_preferences in user_profiles
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        email_preferences: preferences
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating email preferences:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Updated email preferences for user ${userId}:`, preferences);

    return res.status(200).json({
      success: true,
      email_preferences: data.email_preferences
    });
  } catch (error) {
    console.error('Update email preferences error:', error);
    return res.status(500).json({ error: error.message });
  }
}
