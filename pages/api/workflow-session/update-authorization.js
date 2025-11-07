/**
 * Update Authorization Data - Save to Database
 * POST /api/workflow-session/update-authorization
 *
 * ✅ Saves certificate authorization data to workflow session
 * ✅ Enables auto-population when user returns from dashboard
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
    const { authorization_data } = req.body;

    if (!authorization_data) {
      return res.status(400).json({
        success: false,
        error: 'authorization_data is required'
      });
    }

    try {
      console.log('📝 [UPDATE-AUTHORIZATION] Saving authorization data for user:', userId);

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
        const updatedData = {
          ...session.data,
          authorization: {
            ...session.data?.authorization,  // Keep existing authorization fields
            ...authorization_data  // Merge new authorization data
          }
        };

        const { error: updateError } = await supabase
          .from('workflow_sessions')
          .update({
            data: updatedData
          })
          .eq('id', session.id);

        if (!updateError) {
          console.log('✅ [UPDATE-AUTHORIZATION] Updated workflow_sessions:', session.id);
          updated = true;
        } else {
          console.error('❌ [UPDATE-AUTHORIZATION] Error updating workflow_sessions:', updateError);
        }
      }

      // Update workflow_completions if exists
      if (completionsRows && completionsRows.length > 0) {
        const completion = completionsRows[0];
        const updatedWorkflowData = {
          ...completion.workflow_data,
          authorization: {
            ...completion.workflow_data?.authorization,  // Keep existing authorization fields
            ...authorization_data  // Merge new authorization data
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
          console.log('✅ [UPDATE-AUTHORIZATION] Updated workflow_completions:', completion.id);
          updated = true;
        } else {
          console.error('❌ [UPDATE-AUTHORIZATION] Error updating workflow_completions:', updateError);
        }
      }

      if (updated) {
        return res.status(200).json({
          success: true,
          message: 'Authorization data saved to database'
        });
      } else {
        return res.status(404).json({
          success: false,
          error: 'No workflow found for user'
        });
      }

    } catch (error) {
      console.error('❌ [UPDATE-AUTHORIZATION] Error saving authorization data:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save authorization data to database'
      });
    }
  }
});
