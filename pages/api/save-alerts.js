/**
 * Save generated alerts to database
 * POST /api/save-alerts
 *
 * Saves consolidated alerts to dashboard_notifications table
 * for fast loading on future visits (avoids expensive AI calls)
 */

import { protectedApiHandler } from '../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  POST: async (req, res) => {
    try {
      const { alerts, user_profile } = req.body;
      const userId = req.user.id;

      if (!alerts || !Array.isArray(alerts)) {
        return res.status(400).json({ error: 'Alerts array is required' });
      }

      console.log(`💾 Saving ${alerts.length} alerts for user ${userId}`);

      // Delete existing alerts for this user (replace with new ones)
      const { error: deleteError } = await supabase
        .from('dashboard_notifications')
        .delete()
        .eq('user_id', userId)
        .eq('notification_type', 'consolidated_alert');

      if (deleteError) {
        console.error('⚠️ Error deleting old alerts:', deleteError);
      }

      // Insert new alerts
      const alertsToInsert = alerts.map((alert, index) => ({
        user_id: userId,
        notification_type: 'consolidated_alert',
        title: alert.title || alert.consolidated_title || `Alert ${index + 1}`,
        message: alert.broker_summary || alert.explanation || '',
        data: {
          ...alert,
          generated_at: new Date().toISOString(),
          user_profile: {
            company_name: user_profile?.companyName,
            hs_code: user_profile?.hsCode,
            supplier_country: user_profile?.supplierCountry
          }
        },
        urgency: alert.urgency || 'MEDIUM',
        read: false,
        created_at: new Date().toISOString()
      }));

      const { data, error: insertError } = await supabase
        .from('dashboard_notifications')
        .insert(alertsToInsert)
        .select();

      if (insertError) {
        console.error('❌ Error inserting alerts:', insertError);
        throw insertError;
      }

      console.log(`✅ Successfully saved ${data.length} alerts to database`);

      return res.status(200).json({
        success: true,
        saved_count: data.length,
        message: 'Alerts saved successfully'
      });

    } catch (error) {
      console.error('❌ Error in save-alerts:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});
