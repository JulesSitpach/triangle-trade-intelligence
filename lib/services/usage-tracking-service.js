/**
 * Usage Tracking Service
 * Manages monthly analysis usage counts for subscription tier limits
 *
 * Tier Limits:
 * - Trial: 1 analysis total (7 days)
 * - Starter: 10 analyses/month
 * - Professional: 100 analyses/month
 * - Premium: Unlimited (999999)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Check if user can perform an analysis (without incrementing count)
 * @param {string} userId - User's UUID
 * @param {string} subscriptionTier - User's subscription tier
 * @returns {Promise<Object>} - Usage status
 */
export async function checkAnalysisLimit(userId, subscriptionTier = 'Trial') {
  try {
    const { data, error } = await supabase
      .rpc('check_analysis_limit', {
        p_user_id: userId,
        p_subscription_tier: subscriptionTier
      });

    if (error) {
      console.error('[USAGE-TRACKING] Error checking analysis limit:', error);
      // Fail open - allow usage if check fails
      return {
        canProceed: true,
        currentCount: 0,
        tierLimit: 999999,
        remaining: 999999,
        limitReached: false,
        error: error.message
      };
    }

    // RPC returns array with single row
    const result = data?.[0] || {
      current_count: 0,
      tier_limit: 1,
      remaining_analyses: 0,
      limit_reached: true
    };

    return {
      canProceed: !result.limit_reached,
      currentCount: result.current_count,
      tierLimit: result.tier_limit,
      remaining: result.remaining_analyses,
      limitReached: result.limit_reached,
      subscriptionTier
    };
  } catch (error) {
    console.error('[USAGE-TRACKING] Exception checking limit:', error);
    // Fail open - allow usage if exception occurs
    return {
      canProceed: true,
      currentCount: 0,
      tierLimit: 999999,
      remaining: 999999,
      limitReached: false,
      error: error.message
    };
  }
}

/**
 * Increment analysis count and check if limit reached
 * @param {string} userId - User's UUID
 * @param {string} subscriptionTier - User's subscription tier
 * @returns {Promise<Object>} - Updated usage status
 */
export async function incrementAnalysisCount(userId, subscriptionTier = 'Trial') {
  try {
    const { data, error } = await supabase
      .rpc('increment_analysis_count', {
        p_user_id: userId,
        p_subscription_tier: subscriptionTier
      });

    if (error) {
      console.error('[USAGE-TRACKING] Error incrementing count:', error);
      // Log but don't block - tracking failure shouldn't prevent usage
      return {
        success: false,
        currentCount: 0,
        tierLimit: 999999,
        limitReached: false,
        error: error.message
      };
    }

    // RPC returns array with single row
    const result = data?.[0] || {
      current_count: 1,
      limit_reached: false,
      tier_limit: 1
    };

    console.log(`[USAGE-TRACKING] ✅ Incremented for user ${userId}: ${result.current_count}/${result.tier_limit}`);

    return {
      success: true,
      currentCount: result.current_count,
      tierLimit: result.tier_limit,
      limitReached: result.limit_reached,
      subscriptionTier
    };
  } catch (error) {
    console.error('[USAGE-TRACKING] Exception incrementing count:', error);
    return {
      success: false,
      currentCount: 0,
      tierLimit: 999999,
      limitReached: false,
      error: error.message
    };
  }
}

/**
 * Get usage stats for a user (current billing period)
 * @param {string} userId - User's UUID
 * @returns {Promise<Object>} - Usage statistics
 */
export async function getUserUsageStats(userId) {
  try {
    // Get current billing period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodStartStr = periodStart.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('monthly_usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('billing_period_start', periodStartStr)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('[USAGE-TRACKING] Error fetching stats:', error);
      return null;
    }

    if (!data) {
      // No usage record yet this period
      return {
        userId,
        billingPeriodStart: periodStartStr,
        analysesCount: 0,
        subscriptionTier: 'Trial',
        createdAt: null,
        updatedAt: null
      };
    }

    return {
      userId: data.user_id,
      billingPeriodStart: data.billing_period_start,
      billingPeriodEnd: data.billing_period_end,
      analysesCount: data.analyses_count,
      subscriptionTier: data.subscription_tier,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('[USAGE-TRACKING] Exception fetching stats:', error);
    return null;
  }
}

/**
 * Get usage history for a user (last N months)
 * @param {string} userId - User's UUID
 * @param {number} months - Number of months to retrieve (default 6)
 * @returns {Promise<Array>} - Usage history
 */
export async function getUserUsageHistory(userId, months = 6) {
  try {
    const { data, error } = await supabase
      .from('monthly_usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('billing_period_start', { ascending: false })
      .limit(months);

    if (error) {
      console.error('[USAGE-TRACKING] Error fetching history:', error);
      return [];
    }

    return data.map(record => ({
      billingPeriodStart: record.billing_period_start,
      billingPeriodEnd: record.billing_period_end,
      analysesCount: record.analyses_count,
      subscriptionTier: record.subscription_tier,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    }));
  } catch (error) {
    console.error('[USAGE-TRACKING] Exception fetching history:', error);
    return [];
  }
}

/**
 * Reset usage for a user (admin function - use with caution)
 * @param {string} userId - User's UUID
 * @returns {Promise<boolean>} - Success status
 */
export async function resetUserUsage(userId) {
  try {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodStartStr = periodStart.toISOString().split('T')[0];

    const { error } = await supabase
      .from('monthly_usage_tracking')
      .delete()
      .eq('user_id', userId)
      .eq('billing_period_start', periodStartStr);

    if (error) {
      console.error('[USAGE-TRACKING] Error resetting usage:', error);
      return false;
    }

    console.log(`[USAGE-TRACKING] ⚠️ Reset usage for user ${userId}`);
    return true;
  } catch (error) {
    console.error('[USAGE-TRACKING] Exception resetting usage:', error);
    return false;
  }
}

/**
 * Get aggregate usage stats for all users (admin analytics)
 * @returns {Promise<Object>} - Aggregate statistics
 */
export async function getAggregateUsageStats() {
  try {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodStartStr = periodStart.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('monthly_usage_tracking')
      .select('subscription_tier, analyses_count')
      .eq('billing_period_start', periodStartStr);

    if (error) {
      console.error('[USAGE-TRACKING] Error fetching aggregate stats:', error);
      return null;
    }

    // Group by tier and calculate totals
    const stats = data.reduce((acc, record) => {
      const tier = record.subscription_tier;
      if (!acc[tier]) {
        acc[tier] = {
          userCount: 0,
          totalAnalyses: 0,
          avgAnalysesPerUser: 0
        };
      }
      acc[tier].userCount += 1;
      acc[tier].totalAnalyses += record.analyses_count;
      return acc;
    }, {});

    // Calculate averages
    Object.keys(stats).forEach(tier => {
      stats[tier].avgAnalysesPerUser = Math.round(
        stats[tier].totalAnalyses / stats[tier].userCount
      );
    });

    return {
      periodStart: periodStartStr,
      byTier: stats,
      totalUsers: data.length,
      totalAnalyses: data.reduce((sum, r) => sum + r.analyses_count, 0)
    };
  } catch (error) {
    console.error('[USAGE-TRACKING] Exception fetching aggregate stats:', error);
    return null;
  }
}

export default {
  checkAnalysisLimit,
  incrementAnalysisCount,
  getUserUsageStats,
  getUserUsageHistory,
  resetUserUsage,
  getAggregateUsageStats
};
