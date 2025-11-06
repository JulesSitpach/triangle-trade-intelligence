/**
 * Delete a workflow (certificate)
 * DELETE /api/delete-workflow?id={workflowId}
 *
 * ✅ Validates user owns the workflow before deletion
 * ✅ Deletes workflow and associated data
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
      const workflowId = req.query.id;
      const userId = req.user.id;

      if (!workflowId) {
        return res.status(400).json({ error: 'Workflow ID is required' });
      }

      // ✅ Check workflow_sessions first (primary table for active workflows)
      const { data: sessions, error: sessionError } = await supabase
        .from('workflow_sessions')
        .select('id, user_id')
        .eq('id', workflowId);

      let workflowExists = sessions && sessions.length > 0;
      let ownerUserId = workflowExists ? sessions[0].user_id : null;

      // ✅ If not in workflow_sessions, check workflow_completions
      if (!workflowExists) {
        const { data: completions, error: completionError } = await supabase
          .from('workflow_completions')
          .select('id, user_id')
          .eq('id', workflowId);

        workflowExists = completions && completions.length > 0;
        ownerUserId = workflowExists ? completions[0].user_id : null;
      }

      if (!workflowExists) {
        // ✅ IDEMPOTENT DELETE: If workflow doesn't exist, that's OK (already deleted)
        // Don't log as error - this is expected behavior for "clear all" operations
        console.log(`Workflow ${workflowId} not found (already deleted or doesn't exist)`);
        return res.status(200).json({
          success: true,
          message: `Workflow ${workflowId} deleted successfully (or didn't exist)`,
          deleted_id: workflowId
        });
      }

      // ✅ Verify user owns this workflow before deletion
      if (ownerUserId !== userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this workflow' });
      }

      // Certificate data stored in workflow_completions.workflow_data.certificate
      // No separate certificates table to delete from

      // ✅ Delete from workflow_sessions
      const { error: deleteSessionError } = await supabase
        .from('workflow_sessions')
        .delete()
        .eq('id', workflowId)
        .eq('user_id', userId);

      // ✅ Delete from workflow_completions (if it exists there)
      const { error: deleteCompletionError } = await supabase
        .from('workflow_completions')
        .delete()
        .eq('id', workflowId)
        .eq('user_id', userId);

      // ✅ Only log error if BOTH deletes failed with real errors (not "record not found")
      if (deleteSessionError && deleteCompletionError) {
        // Check if errors are just "record not found" (PGRST116 or similar)
        const isNotFoundError = (err) => err?.code === 'PGRST116' || err?.message?.includes('not found');

        if (!isNotFoundError(deleteSessionError) && !isNotFoundError(deleteCompletionError)) {
          await DevIssue.apiError('dashboard', 'delete-workflow', deleteSessionError || deleteCompletionError, {
            workflowId,
            userId,
            note: 'Failed to delete from both workflow_sessions and workflow_completions'
          });
          return res.status(500).json({ error: 'Failed to delete workflow. Please try again or contact support.' });
        }
      }

      console.log(`✅ Deleted workflow ${workflowId} for user ${userId}`);

      return res.status(200).json({
        success: true,
        message: `Workflow ${workflowId} deleted successfully`,
        deleted_id: workflowId
      });

    } catch (error) {
      console.error('Error deleting workflow:', error);
      await logDevIssue({
        type: 'api_error',
        severity: 'error',
        component: 'dashboard',
        message: 'Error deleting workflow',
        data: {
          error: error.message,
          stack: error.stack,
          workflowId: req.query.id,
          userId: req.user?.id
        }
      });

      return res.status(500).json({ error: 'Internal server error' });
    }
  }
});
