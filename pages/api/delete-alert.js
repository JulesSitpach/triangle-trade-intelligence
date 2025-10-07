/**
 * DELETE /api/delete-alert
 * Deletes a trade alert from the database
 */

import { protectedApiHandler } from '../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  DELETE: async (req, res) => {
    const userId = req.user.id; // Provided by protectedApiHandler

    try {
      // Get alert ID from query
      const { id } = req.query;
      console.log('🗑️ Delete request for alert:', id, 'by user:', userId);

      if (!id) {
        return res.status(400).json({ error: 'Alert ID required' });
      }

      // Delete alert from vulnerability_analyses table
      // Only delete if it belongs to the authenticated user
      console.log(`🗑️ Attempting to delete alert ${id} for user ${userId}`);
      const { error: deleteError } = await supabase
        .from('vulnerability_analyses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ Delete alert error:', deleteError);
        return res.status(500).json({
          error: 'Failed to delete alert',
          details: deleteError.message,
          code: deleteError.code
        });
      }

      console.log(`✅ Alert deleted from vulnerability_analyses: ${id} by user ${userId}`);

      return res.status(200).json({
        success: true,
        message: 'Alert deleted successfully'
      });

    } catch (error) {
      console.error('❌ Unexpected error in delete-alert:', error);
      return res.status(500).json({
        error: 'Server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});
