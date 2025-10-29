/**
 * Update Executive Alert - Save to Database
 * POST /api/workflow-session/update-executive-alert
 *
 * ✅ Merges executive alert detailed_analysis into most recent workflow
 * ✅ Ensures alert impact analysis service can access rich intelligence
 * ✅ Updates both workflow_sessions and workflow_completions tables
 */

import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  POST: async (req, res) => {
    const userId = req.user.id;
    const { detailed_analysis } = req.body;

    if (!detailed_analysis) {
      return res.status(400).json({
        success: false,
        error: 'detailed_analysis is required'
      });
    }

    try {
      console.log('📝 Saving executive alert to database for user:', userId);

      // Get most recent workflow session
      const { data: sessionsRows } = await supabase
        .from('workflow_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(1);

      // Get most recent workflow completion
      const { data: completionsRows } = await supabase
        .from('workflow_completions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(1);

      let updated = false;

      // Update workflow_sessions if exists
      if (sessionsRows && sessionsRows.length > 0) {
        const session = sessionsRows[0];
        const updatedWorkflowData = {
          ...session.workflow_data,
          detailed_analysis: {
            ...session.workflow_data?.detailed_analysis,  // Keep existing fields
            ...detailed_analysis  // Merge executive alert fields
          }
        };

        const { error: updateError } = await supabase
          .from('workflow_sessions')
          .update({
            workflow_data: updatedWorkflowData,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.id);

        if (!updateError) {
          console.log('✅ Updated workflow_sessions:', session.id);
          updated = true;
        } else {
          console.error('❌ Error updating workflow_sessions:', updateError);
        }
      }

      // Update workflow_completions if exists
      if (completionsRows && completionsRows.length > 0) {
        const completion = completionsRows[0];
        const updatedWorkflowData = {
          ...completion.workflow_data,
          detailed_analysis: {
            ...completion.workflow_data?.detailed_analysis,  // Keep existing fields
            ...detailed_analysis  // Merge executive alert fields
          }
        };

        const { error: updateError } = await supabase
          .from('workflow_completions')
          .update({
            workflow_data: updatedWorkflowData,
            updated_at: new Date().toISOString()
          })
          .eq('id', completion.id);

        if (!updateError) {
          console.log('✅ Updated workflow_completions:', completion.id);
          updated = true;
        } else {
          console.error('❌ Error updating workflow_completions:', updateError);
        }
      }

      if (updated) {
        return res.status(200).json({
          success: true,
          message: 'Executive alert saved to database'
        });
      } else {
        return res.status(404).json({
          success: false,
          error: 'No workflow found for user'
        });
      }

    } catch (error) {
      console.error('❌ Error saving executive alert:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save executive alert to database'
      });
    }
  }
});
