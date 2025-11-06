/**
 * Admin API - Mark dev issue as resolved
 */

import { protectedApiHandler, sendSuccess } from '../../../../../lib/api/apiHandler.js';
import { ApiError } from '../../../../../lib/api/errorHandler.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  POST: async (req, res) => {
    // Check admin access
    if (!req.user?.is_admin && req.user?.role !== 'admin') {
      throw new ApiError('Admin access required', 403);
    }

    const { id } = req.query;

    const { error } = await supabase
      .from('dev_issues')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new ApiError('Failed to mark issue as resolved', 500, { details: error.message });
    }

    return sendSuccess(res, { id }, 'Issue marked as resolved');
  }
});
