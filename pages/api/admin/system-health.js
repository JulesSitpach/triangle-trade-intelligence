/**
 * Admin API - Get system health metrics
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

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Check database health
    let databaseHealthy = false;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      databaseHealthy = !error && data !== null;
    } catch (error) {
      databaseHealthy = false;
    }

    // Check AI service health (look at recent errors)
    const { data: recentErrors } = await supabase
      .from('dev_issues')
      .select('*')
      .eq('component', 'ai_classification')
      .gte('created_at', oneHourAgo.toISOString());

    const aiHealthy = (recentErrors || []).filter(e => e.severity === 'critical').length === 0;

    // Calculate error rate (last hour)
    const { data: allIssues } = await supabase
      .from('dev_issues')
      .select('*')
      .gte('created_at', oneHourAgo.toISOString());

    const { data: recentCompletions } = await supabase
      .from('workflow_completions')
      .select('*')
      .gte('completed_at', oneHourAgo.toISOString());

    const totalRequests = (recentCompletions || []).length;
    const totalErrors = (allIssues || []).filter(i => i.severity === 'critical').length;
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    // Estimate average response time (from completion time)
    const avgResponseTime = totalRequests > 0
      ? Math.round(((recentCompletions || []).reduce((sum, c) => sum + (c.completion_time_minutes || 0), 0) / totalRequests) * 60 * 1000) // Convert minutes to ms
      : 0;

    return sendSuccess(res, {
      health: {
        database_healthy: databaseHealthy,
        ai_healthy: aiHealthy,
        error_rate: errorRate,
        avg_response_time: avgResponseTime,
        last_checked: new Date().toISOString()
      }
    }, 'System health retrieved successfully');
  }
});
