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
      // First, try crisis_alerts table
      let alert = null;
      let tableUsed = null;

      const { data: crisisAlert, error: crisisError } = await supabase
        .from('crisis_alerts')
        .select('id, user_id')
        .eq('id', alertId)
        .single();

      if (!crisisError && crisisAlert) {
        alert = crisisAlert;
        tableUsed = 'crisis_alerts';
      } else {
        // Try alerts table
        const { data: generalAlert, error: generalError } = await supabase
          .from('alerts')
          .select('id, user_id')
          .eq('id', alertId)
          .single();

        if (!generalError && generalAlert) {
          alert = generalAlert;
          tableUsed = 'alerts';
        }
      }

      if (!alert) {
        await DevIssue.apiError('dashboard', 'delete-alert', new Error('Alert not found'), {
          alertId,
          userId
        });
        return res.status(404).json({ error: 'Alert not found' });
      }

      if (alert.user_id !== userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this alert' });
      }

      // ✅ Delete the alert
      const { error: deleteError } = await supabase
        .from(tableUsed)
        .delete()
        .eq('id', alertId)
        .eq('user_id', userId);

      if (deleteError) {
        await DevIssue.apiError('dashboard', 'delete-alert', deleteError, {
          alertId,
          userId,
          table: tableUsed
        });
        return res.status(500).json({ error: 'Failed to delete alert' });
      }

      console.log(`✅ Deleted alert ${alertId} for user ${userId} from ${tableUsed}`);

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
