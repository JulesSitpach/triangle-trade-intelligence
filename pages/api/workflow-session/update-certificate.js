/**
 * Update Workflow Completion with Certificate Data
 * Sets certificate_generated=true on most recent matching workflow
 */

import { protectedApiHandler } from '../../../lib/api/apiHandler.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.id;
    const { product_description, hs_code, certificate_data } = req.body;

    try {
      // Find most recent workflow completion matching this product
      const { data: workflows, error: findError } = await supabase
        .from('workflow_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('product_description', product_description)
        .order('completed_at', { ascending: false })
        .limit(1);

      if (findError) {
        console.error('Error finding workflow:', findError);
        return res.status(500).json({ error: 'Failed to find workflow' });
      }

      if (!workflows || workflows.length === 0) {
        console.warn('No matching workflow found to update');
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const workflowId = workflows[0].id;

      // Get current workflow_data to merge certificate into it
      const { data: currentWorkflow } = await supabase
        .from('workflow_completions')
        .select('workflow_data')
        .eq('id', workflowId)
        .single();

      const updatedWorkflowData = {
        ...(currentWorkflow?.workflow_data || {}),
        certificate: certificate_data,
        certificate_generated: true
      };

      // Update the workflow with certificate data
      const { error: updateError } = await supabase
        .from('workflow_completions')
        .update({
          certificate_generated: true,
          workflow_data: updatedWorkflowData
        })
        .eq('id', workflowId);

      if (updateError) {
        console.error('Error updating workflow:', updateError);
        return res.status(500).json({ error: 'Failed to update workflow' });
      }

      console.log(`✅ Updated workflow ${workflowId} with certificate`);

      return res.status(200).json({
        success: true,
        message: 'Certificate added to workflow',
        workflow_id: workflowId
      });

    } catch (error) {
      console.error('Certificate update error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
});
