import { protectedApiHandler } from '../../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  DELETE: async (req, res) => {
    const userId = req.user.id;

    try {
      // Delete workflow sessions
      const { error: workflowError } = await supabase
        .from('workflow_sessions')
        .delete()
        .eq('user_id', userId);

      if (workflowError) throw workflowError;

      // Delete vulnerability analyses
      const { error: alertError } = await supabase
        .from('vulnerability_analyses')
        .delete()
        .eq('user_id', userId);

      if (alertError) throw alertError;

      return res.status(200).json({
        success: true,
        message: 'All workflow data deleted successfully'
      });
    } catch (error) {
      console.error('Delete workflow data error:', error);
      return res.status(500).json({
        error: 'Failed to delete workflow data',
        details: error.message
      });
    }
  }
});
