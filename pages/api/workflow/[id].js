/**
 * Get Workflow by ID
 * GET /api/workflow/:id
 *
 * ✅ Fetches complete workflow data from database
 * ✅ Includes authorization data for certificate preview
 * ✅ Returns workflow_completions data
 */

import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'workflow_id is required'
      });
    }

    try {
      console.log(`📂 [GET-WORKFLOW] Fetching workflow ${id} for user:`, userId);

      // Fetch workflow from workflow_completions
      const { data: workflow, error } = await supabase
        .from('workflow_completions')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error || !workflow) {
        console.error('❌ [GET-WORKFLOW] Workflow not found:', error);
        return res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
      }

      console.log('✅ [GET-WORKFLOW] Workflow loaded:', {
        id: workflow.id,
        company: workflow.company_name,
        status: workflow.qualification_status,
        has_authorization: !!workflow.workflow_data?.authorization
      });

      return res.status(200).json({
        success: true,
        workflow
      });

    } catch (error) {
      console.error('❌ [GET-WORKFLOW] Error fetching workflow:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch workflow from database'
      });
    }
  }
});
