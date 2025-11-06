/**
 * Admin API - Get user analytics overview
 * Shared metrics for both dev and sales teams (daily check-in)
 *
 * Metrics:
 * - MRR (Monthly Recurring Revenue) + growth trend
 * - Conversion rate (trial → paid)
 * - Active users by region
 * - Top industry segments
 * - Tier distribution
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
      .select('subscription_tier, industry, created_at');

    const tierDistribution = (users || []).reduce((acc, user) => {
      const tier = user.subscription_tier || 'Trial';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});

    // === MRR CALCULATION ===
    const tierPricing = {
      'Trial': 0,
      'Starter': 99,
      'Professional': 299,
      'Premium': 599
    };

    const currentMRR = (users || []).reduce((sum, user) => {
      return sum + (tierPricing[user.subscription_tier] || 0);
    }, 0);

    // Calculate MRR from last month
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

    const usersLastMonth = (users || []).filter(u =>
      new Date(u.created_at) < lastMonthDate
    );

    const lastMonthMRR = usersLastMonth.reduce((sum, user) => {
      return sum + (tierPricing[user.subscription_tier] || 0);
    }, 0);

    const mrrGrowth = lastMonthMRR > 0
      ? ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100
      : 0;

    // === MRR TREND (Last 6 months) ===
    const mrrTrend = { months: [], values: [] };
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const usersInMonth = (users || []).filter(u => {
        const createdAt = new Date(u.created_at);
        return createdAt <= monthEnd;
      });

      const monthMRR = usersInMonth.reduce((sum, user) => {
        return sum + (tierPricing[user.subscription_tier] || 0);
      }, 0);

      mrrTrend.months.push(monthDate.toLocaleString('default', { month: 'short' }));
      mrrTrend.values.push(monthMRR);
    }

    // === CONVERSION RATE ===
    const trialUsers = (users || []).filter(u => u.subscription_tier === 'Trial');
    const paidUsers = (users || []).filter(u =>
      ['Starter', 'Professional', 'Premium'].includes(u.subscription_tier)
    );

    const conversionRate = (trialUsers.length + paidUsers.length) > 0
      ? (paidUsers.length / (trialUsers.length + paidUsers.length)) * 100
      : 0;

    // Count conversions this month
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const conversionsThisMonth = paidUsers.filter(u =>
      new Date(u.created_at) >= thisMonthStart
    ).length;

    // === REGIONAL DISTRIBUTION ===
    // Extract region from workflow completions (company_country field)
    const regionalDistribution = (completions || []).reduce((acc, completion) => {
      const country = completion.company_country || 'Unknown';
      // Map to regions
      const region = country === 'US' ? 'United States' :
                     country === 'CA' ? 'Canada' :
                     country === 'MX' ? 'Mexico' :
                     'Other';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});

    // === TOP INDUSTRY ===
    const industryCounts = (users || []).reduce((acc, user) => {
      const industry = user.industry || 'Unknown';
      acc[industry] = (acc[industry] || 0) + 1;
      return acc;
    }, {});

    const topIndustryEntry = Object.entries(industryCounts)
      .sort((a, b) => b[1] - a[1])[0];

    const topIndustry = topIndustryEntry ? topIndustryEntry[0] : 'Electronics';
    const topIndustryCount = topIndustryEntry ? topIndustryEntry[1] : 0;

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
        // Overview KPIs
        mrr: currentMRR,
        mrr_growth: mrrGrowth,
        mrr_trend: mrrTrend,
        conversion_rate: conversionRate,
        conversions_this_month: conversionsThisMonth,
        active_users: activeUsers,
        total_analyses: (completions || []).length,
        top_industry: topIndustry,
        top_industry_count: topIndustryCount,
        regional_distribution: regionalDistribution,

        // Existing metrics (kept for backward compatibility)
        avg_completion_time: avgCompletionTime,
        tier_distribution: tierDistribution,
        top_products: topProducts
      }
    }, 'Analytics retrieved successfully');
  }
});
