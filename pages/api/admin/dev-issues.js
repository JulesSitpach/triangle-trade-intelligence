/**
 * Admin API - Get all dev issues for monitoring dashboard
 * Accessible only to admin users
 */

import { protectedApiHandler, sendSuccess } from '../../../lib/api/apiHandler.js';
import { ApiError } from '../../../lib/api/errorHandler.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  GET: async (req, res) => {
    // Check admin access
    if (!req.user?.is_admin && req.user?.role !== 'admin') {
      throw new ApiError('Admin access required', 403);
    }

    const { limit = 100, severity, component, resolved } = req.query;

    // Build query
    let query = supabase
      .from('dev_issues')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Apply filters
    if (severity) {
      query = query.eq('severity', severity);
    }

    if (component) {
      query = query.eq('component', component);
    }

    if (resolved !== undefined) {
      query = query.eq('resolved', resolved === 'true');
    }

    const { data: issues, error } = await query;

    if (error) {
      throw new ApiError('Failed to fetch dev issues', 500, { details: error.message });
    }

    return sendSuccess(res, { issues }, 'Dev issues retrieved successfully');
  }
});
