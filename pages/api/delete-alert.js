/**
 * Delete a trade alert
 * DELETE /api/delete-alert?id={alertId}
 *
 * ✅ Validates user owns the alert before deletion
 * ✅ Deletes alert from database
 */

import { protectedApiHandler } from '../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';
import { logDevIssue, DevIssue } from '../../lib/utils/logDevIssue.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  DELETE: async (req, res) => {
    try {
      const alertId = req.query.id;
      const userId = req.user.id;

      if (!alertId) {
        return res.status(400).json({ error: 'Alert ID is required' });
      }

      // ✅ Verify user owns this alert before deletion
      // User alerts are tracked in user_alert_tracking table
      // (Global crisis_alerts remain - we just delete the user's tracking record)
      const { data: alerts, error: fetchError } = await supabase
        .from('user_alert_tracking')
        .select('id, user_id')
        .eq('id', alertId);

      if (fetchError || !alerts || alerts.length === 0) {
        // Alert doesn't exist - for a "clear all" operation, this is OK
        // Just return success (idempotent delete)
        console.log(`Alert ${alertId} not found (already deleted or doesn't exist)`);
        return res.status(200).json({
          success: true,
          message: `Alert ${alertId} deleted successfully (or didn't exist)`,
          deleted_id: alertId
        });
      }

      const alert = alerts[0];
      if (alert.user_id !== userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this alert' });
      }

      // ✅ Delete the user's alert tracking record
      const { error: deleteError } = await supabase
        .from('user_alert_tracking')
        .delete()
        .eq('id', alertId)
        .eq('user_id', userId);

      if (deleteError) {
        await DevIssue.apiError('dashboard', 'delete-alert', deleteError, {
          alertId,
          userId,
          table: 'user_alert_tracking'
        });
        return res.status(500).json({ error: 'Failed to delete alert' });
      }

      console.log(`✅ Deleted alert tracking ${alertId} for user ${userId}`);

      return res.status(200).json({
        success: true,
        message: `Alert ${alertId} deleted successfully`,
        deleted_id: alertId
      });

    } catch (error) {
      console.error('Error deleting alert:', error);
      await logDevIssue({
        type: 'api_error',
        severity: 'error',
        component: 'dashboard',
        message: 'Error deleting alert',
        data: {
          error: error.message,
          stack: error.stack,
          alertId: req.query.id,
          userId: req.user?.id
        }
      });

      return res.status(500).json({ error: 'Internal server error' });
    }
  }
});
