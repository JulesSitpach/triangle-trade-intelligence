/**
 * Alert Status Update API
 * Allows users to update alert lifecycle status (NEW → RESOLVED → ARCHIVED)
 * Tracks resolution history for retention intelligence
 */

import { protectedApiHandler } from '../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.id;
    const {
      crisis_alert_id,
      status,  // RESOLVED, ARCHIVED, or NEW (to reopen)
      resolution_notes,
      estimated_cost_impact,
      actions_taken,
      email_notifications_enabled
    } = req.body;

    // Validate required fields
    if (!crisis_alert_id || !status) {
      return res.status(400).json({
        error: 'Missing required fields: crisis_alert_id and status'
      });
    }

    // Validate status value
    const validStatuses = ['NEW', 'UPDATED', 'RESOLVED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    try {
      // Check if tracking record exists
      const { data: existing } = await supabase
        .from('user_alert_tracking')
        .select('*')
        .eq('user_id', userId)
        .eq('crisis_alert_id', crisis_alert_id)
        .single();

      const updatePayload = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add timestamps based on status
      if (status === 'RESOLVED') {
        updatePayload.resolved_at = new Date().toISOString();
        updatePayload.archived_at = null;  // Clear archive if reopening from archive
      } else if (status === 'ARCHIVED') {
        updatePayload.archived_at = new Date().toISOString();
      } else if (status === 'NEW') {
        // Reopening alert - clear resolution/archive timestamps
        updatePayload.resolved_at = null;
        updatePayload.archived_at = null;
      }

      // Add optional fields if provided
      if (resolution_notes !== undefined) {
        updatePayload.resolution_notes = resolution_notes;
      }
      if (estimated_cost_impact !== undefined) {
        updatePayload.estimated_cost_impact = estimated_cost_impact;
      }
      if (actions_taken !== undefined) {
        updatePayload.actions_taken = actions_taken;
      }
      if (email_notifications_enabled !== undefined) {
        updatePayload.email_notifications_enabled = email_notifications_enabled;
      }

      let result;

      if (existing) {
        // Update existing tracking record
        const { data, error } = await supabase
          .from('user_alert_tracking')
          .update(updatePayload)
          .eq('user_id', userId)
          .eq('crisis_alert_id', crisis_alert_id)
          .select()
          .single();

        if (error) throw error;
        result = data;

        console.log(`✅ Updated alert ${crisis_alert_id} status to ${status}`);
      } else {
        // Create new tracking record (shouldn't happen if dashboard loads first, but handle it)
        const { data, error } = await supabase
          .from('user_alert_tracking')
          .insert({
            user_id: userId,
            crisis_alert_id,
            ...updatePayload,
            first_seen_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        result = data;

        console.log(`✅ Created new alert tracking for ${crisis_alert_id} with status ${status}`);
      }

      return res.status(200).json({
        success: true,
        message: `Alert status updated to ${status}`,
        tracking: result
      });

    } catch (error) {
      console.error('❌ Alert status update failed:', error);
      return res.status(500).json({
        error: 'Failed to update alert status',
        details: error.message
      });
    }
  }
});
