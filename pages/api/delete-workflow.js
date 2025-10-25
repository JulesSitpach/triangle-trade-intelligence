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

      // ✅ Verify user owns this workflow before deletion
      const { data: workflows, error: fetchError } = await supabase
        .from('workflow_completions')
        .select('id, user_id')
        .eq('id', workflowId);

      if (fetchError || !workflows || workflows.length === 0) {
        await DevIssue.apiError('dashboard', 'delete-workflow', fetchError || new Error('Workflow not found'), {
          workflowId,
          userId
        });
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const workflow = workflows[0];
      if (workflow.user_id !== userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this workflow' });
      }

      // ✅ Delete associated certificates FIRST (foreign key constraint)
      // Note: The certificates table uses 'workflow_completion_id' not 'workflow_id'
      const { error: deleteCertsError } = await supabase
        .from('certificates')
        .delete()
        .eq('workflow_completion_id', workflowId);

      if (deleteCertsError) {
        console.warn('Warning deleting certificates:', deleteCertsError.message);
        // Don't fail - certificates may not exist for this workflow
      }

      // ✅ Delete the workflow (now safe since certificates are gone)
      const { error: deleteError } = await supabase
        .from('workflow_completions')
        .delete()
        .eq('id', workflowId)
        .eq('user_id', userId);

      if (deleteError) {
        await DevIssue.apiError('dashboard', 'delete-workflow', deleteError, {
          workflowId,
          userId,
          note: 'Foreign key constraint error - certificates may not have been deleted'
        });
        return res.status(500).json({ error: 'Failed to delete workflow. Please try again or contact support.' });
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
