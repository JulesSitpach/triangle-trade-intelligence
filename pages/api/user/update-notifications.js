import { createClient } from '@supabase/supabase-js';
import { withAuth } from '../../../lib/middleware/auth-middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { policyAlerts, tariffChanges, weeklySummary, serviceMatches } = req.body;
    const userId = req.user.id;

    // Update notification preferences in user_profiles table
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        notification_prefs: {
          policyAlerts: policyAlerts !== undefined ? policyAlerts : true,
          tariffChanges: tariffChanges !== undefined ? tariffChanges : true,
          weeklySummary: weeklySummary !== undefined ? weeklySummary : false,
          serviceMatches: serviceMatches !== undefined ? serviceMatches : true
        }
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Notification preferences update error:', updateError);
      return res.status(500).json({ error: 'Failed to update notification preferences' });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification preferences saved successfully'
    });

  } catch (error) {
    console.error('Unexpected error updating notification preferences:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export default withAuth(handler);
