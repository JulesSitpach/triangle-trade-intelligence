/**
 * Admin API - Get sales metrics for monitoring
 */

import { protectedApiHandler, sendSuccess } from '../../../lib/api/apiHandler.js';
import { ApiError } from '../../../lib/api/errorHandler.js';
import { createClient } from '@supabase/supabase-js';
import { getTierPrice } from '../../../config/pricing-config.js';

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

    // Get total revenue
    const { data: invoices } = await supabase
      .from('invoices')
      .select('amount_paid')
      .eq('status', 'paid');

    const totalRevenue = (invoices || []).reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);

    // Get active subscriptions
    const { data: activeUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .neq('subscription_tier', 'Trial')
      .eq('status', 'active');

    // Calculate MRR (Monthly Recurring Revenue) using centralized pricing config
    const mrr = (activeUsers || []).reduce((sum, user) => {
      return sum + getTierPrice(user.subscription_tier);
    }, 0);

    // Get all users for conversion rate
    const { data: allUsers } = await supabase
      .from('user_profiles')
      .select('subscription_tier');

    const totalUsers = (allUsers || []).length;
    const paidUsers = (activeUsers || []).length;
    const conversionRate = totalUsers > 0 ? paidUsers / totalUsers : 0;

    // Recent subscriptions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentSubs } = await supabase
      .from('invoices')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    return sendSuccess(res, {
      metrics: {
        total_revenue: totalRevenue,
        active_subscriptions: paidUsers,
        mrr: mrr,
        conversion_rate: conversionRate,
        recent_subscriptions: recentSubs || []
      }
    }, 'Sales metrics retrieved successfully');
  }
});
