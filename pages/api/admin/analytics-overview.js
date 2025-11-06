/**
 * Admin API - Get user analytics for monitoring
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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get total analyses (last 30 days)
    const { data: completions } = await supabase
      .from('workflow_completions')
      .select('*')
      .gte('completed_at', thirtyDaysAgo.toISOString());

    // Get active users (users who completed at least 1 analysis in last 30 days)
    const activeUsers = new Set((completions || []).map(c => c.user_id)).size;

    // Calculate average completion time
    const totalTime = (completions || []).reduce((sum, c) => sum + (c.completion_time_minutes || 0), 0);
    const avgCompletionTime = completions && completions.length > 0
      ? Math.round(totalTime / completions.length)
      : 0;

    // Get tier distribution
    const { data: users } = await supabase
      .from('user_profiles')
      .select('subscription_tier');

    const tierDistribution = (users || []).reduce((acc, user) => {
      const tier = user.subscription_tier || 'Trial';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});

    // Get popular products (by HS code)
    const hsCodeCount = (completions || []).reduce((acc, completion) => {
      const hs = completion.hs_code || 'Unknown';
      acc[hs] = (acc[hs] || 0) + 1;
      return acc;
    }, {});

    const topProducts = Object.entries(hsCodeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([hs_code, count]) => ({ hs_code, count }));

    return sendSuccess(res, {
      analytics: {
        total_analyses: (completions || []).length,
        active_users: activeUsers,
        avg_completion_time: avgCompletionTime,
        tier_distribution: tierDistribution,
        top_products: topProducts
      }
    }, 'Analytics retrieved successfully');
  }
});
