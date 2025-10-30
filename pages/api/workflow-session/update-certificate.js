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

    console.log('💾 UPDATE-CERTIFICATE REQUEST:', {
      userId,
      product_description,
      hs_code,
      has_certificate_data: !!certificate_data
    });

    try {
      // STRATEGY 1: Find most recent workflow completion matching this product
      let { data: workflows, error: findError } = await supabase
        .from('workflow_completions')
        .select('id, product_description, completed_at')
        .eq('user_id', userId)
        .eq('product_description', product_description)
        .order('completed_at', { ascending: false })
        .limit(1);

      if (findError) {
        console.error('❌ Error finding workflow:', findError);
        return res.status(500).json({ error: 'Failed to find workflow' });
      }

      // STRATEGY 2: If no exact match, try to find by HS code
      if (!workflows || workflows.length === 0) {
        console.warn(`⚠️ No exact match for product_description: "${product_description}"`);
        console.log('🔍 Trying fallback: match by HS code...');

        const { data: hsWorkflows } = await supabase
          .from('workflow_completions')
          .select('id, product_description, hs_code, completed_at')
          .eq('user_id', userId)
          .eq('hs_code', hs_code)
          .order('completed_at', { ascending: false })
          .limit(1);

        if (hsWorkflows && hsWorkflows.length > 0) {
          console.log(`✅ Found workflow by HS code: ${hs_code}`);
          workflows = hsWorkflows;
        }
      }

      // STRATEGY 3: If still no match, get most recent workflow for this user
      if (!workflows || workflows.length === 0) {
        console.log('🔍 No match by HS code. Getting most recent workflow for user...');

        const { data: recentWorkflows } = await supabase
          .from('workflow_completions')
          .select('id, product_description, hs_code, completed_at')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .limit(1);

        if (recentWorkflows && recentWorkflows.length > 0) {
          console.log(`✅ Using most recent workflow (may not be exact match)`);
          workflows = recentWorkflows;
        }
      }

      if (!workflows || workflows.length === 0) {
        console.error('❌ No workflow_completions found for this user at all');
        return res.status(404).json({
          error: 'Workflow not found',
          details: 'You need to complete the USMCA workflow before editing certificates'
        });
      }

      const workflowId = workflows[0].id;
      console.log(`📝 Updating workflow ${workflowId} with certificate data`);

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
        console.error('❌ Error updating workflow:', updateError);
        return res.status(500).json({ error: 'Failed to update workflow' });
      }

      console.log(`✅ Successfully updated workflow ${workflowId} with certificate data`);

      return res.status(200).json({
        success: true,
        message: 'Certificate saved successfully',
        workflow_id: workflowId,
        product_description: workflows[0].product_description
      });

    } catch (error) {
      console.error('❌ Certificate update error:', error);
      return res.status(500).json({
        error: error.message,
        details: 'Internal server error while saving certificate'
      });
    }
  }
});
