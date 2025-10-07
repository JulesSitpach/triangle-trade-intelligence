/**
 * DELETE /api/delete-workflow
 * Deletes a workflow/certificate from the database
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
      // Get workflow ID from query
      const { id } = req.query;
      console.log('🗑️ Delete request for workflow:', id, 'by user:', userId);

      if (!id) {
        return res.status(400).json({ error: 'Workflow ID required' });
      }

      // Workflows can be in either workflow_sessions OR workflow_completions
      // Try deleting from both tables (only one will have a match)
      console.log(`🗑️ Attempting to delete workflow ${id} for user ${userId}`);

      // Try workflow_sessions first
      const { error: sessionError } = await supabase
        .from('workflow_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      // Try workflow_completions second
      const { error: completionError } = await supabase
        .from('workflow_completions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      // If both failed, return error
      if (sessionError && completionError) {
        console.error('❌ Delete failed from both tables:');
        console.error('  - workflow_sessions error:', sessionError);
        console.error('  - workflow_completions error:', completionError);
        return res.status(500).json({
          error: 'Failed to delete workflow',
          details: 'Not found in workflow_sessions or workflow_completions',
          sessionError: sessionError.message,
          completionError: completionError.message
        });
      }

      // Success - deleted from at least one table
      const deletedFrom = !sessionError ? 'workflow_sessions' : 'workflow_completions';
      console.log(`✅ Workflow deleted from ${deletedFrom}: ${id} by user ${userId}`);

      return res.status(200).json({
        success: true,
        message: 'Workflow deleted successfully',
        deletedFrom
      });

    } catch (error) {
      console.error('❌ Unexpected error in delete-workflow:', error);
      return res.status(500).json({
        error: 'Server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});
