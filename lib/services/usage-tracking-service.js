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
      console.error('[USAGE-TRACKING] ⚠️ Error checking analysis limit:', error);
      console.error('[USAGE-TRACKING] subscription_tier passed:', subscriptionTier);

      // Map tier to limit for fallback (when RPC fails)
      // This prevents showing 999999 for non-Premium users when RPC fails
      const tierLimitMap = {
        'Trial': 1,
        'Starter': 10,
        'Professional': 100,
        'Premium': 999999
      };

      const fallbackLimit = tierLimitMap[subscriptionTier] || 1; // Default to Trial limit

      // Fail open but use correct tier limit, not 999999
      return {
        canProceed: true,
        currentCount: 0,
        tierLimit: fallbackLimit,
        remaining: fallbackLimit,
        limitReached: false,
        error: error.message,
        source: 'fallback' // Indicate this is a fallback response
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
      subscriptionTier,
      source: 'database' // Indicate this came from database
    };
  } catch (error) {
    console.error('[USAGE-TRACKING] ⚠️ Exception checking limit:', error);
    console.error('[USAGE-TRACKING] subscription_tier passed:', subscriptionTier);

    // Map tier to limit for fallback
    const tierLimitMap = {
      'Trial': 1,
      'Starter': 10,
      'Professional': 100,
      'Premium': 999999
    };

    const fallbackLimit = tierLimitMap[subscriptionTier] || 1;

    // Fail open but use correct tier limit
    return {
      canProceed: true,
      currentCount: 0,
      tierLimit: fallbackLimit,
      remaining: fallbackLimit,
      limitReached: false,
      error: error.message,
      source: 'fallback' // Indicate this is a fallback response
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
      console.error('[USAGE-TRACKING] ⚠️ Error incrementing count:', error);
      console.error('[USAGE-TRACKING] subscription_tier passed:', subscriptionTier);

      // Map tier to limit for fallback
      const tierLimitMap = {
        'Trial': 1,
        'Starter': 10,
        'Professional': 100,
        'Premium': 999999
      };

      const fallbackLimit = tierLimitMap[subscriptionTier] || 1;

      // Log but don't block - tracking failure shouldn't prevent usage
      return {
        success: false,
        currentCount: 0,
        tierLimit: fallbackLimit,
        limitReached: false,
        error: error.message,
        source: 'fallback'
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
      subscriptionTier,
      source: 'database'
    };
  } catch (error) {
    console.error('[USAGE-TRACKING] ⚠️ Exception incrementing count:', error);
    console.error('[USAGE-TRACKING] subscription_tier passed:', subscriptionTier);

    // Map tier to limit for fallback
    const tierLimitMap = {
      'Trial': 1,
      'Starter': 10,
      'Professional': 100,
      'Premium': 999999
    };

    const fallbackLimit = tierLimitMap[subscriptionTier] || 1;

    return {
      success: false,
      currentCount: 0,
      tierLimit: fallbackLimit,
      limitReached: false,
      error: error.message,
      source: 'fallback'
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
    // Get current billing period (month_year format: "2025-10")
    const now = new Date();
    const month_year = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('monthly_usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', month_year)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('[USAGE-TRACKING] Error fetching stats:', error);
      return null;
    }

    if (!data) {
      // No usage record yet this period
      return {
        userId,
        month_year: month_year,
        analysis_count: 0,
        certificate_count: 0,
        created_at: null,
        updated_at: null
      };
    }

    return {
      user_id: data.user_id,
      month_year: data.month_year,
      analysis_count: data.analysis_count,
      certificate_count: data.certificate_count,
      created_at: data.created_at,
      updated_at: data.updated_at
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
      .order('month_year', { ascending: false })
      .limit(months);

    if (error) {
      console.error('[USAGE-TRACKING] Error fetching history:', error);
      return [];
    }

    return data.map(record => ({
      month_year: record.month_year,
      analysis_count: record.analysis_count,
      certificate_count: record.certificate_count,
      created_at: record.created_at,
      updated_at: record.updated_at
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
    const month_year = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { error } = await supabase
      .from('monthly_usage_tracking')
      .delete()
      .eq('user_id', userId)
      .eq('month_year', month_year);

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
    const month_year = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('monthly_usage_tracking')
      .select('analysis_count, certificate_count')
      .eq('month_year', month_year);

    if (error) {
      console.error('[USAGE-TRACKING] Error fetching aggregate stats:', error);
      return null;
    }

    // Calculate totals
    const totalAnalyses = data.reduce((sum, r) => sum + (r.analysis_count || 0), 0);
    const totalCertificates = data.reduce((sum, r) => sum + (r.certificate_count || 0), 0);

    return {
      month: month_year,
      total_records: data.length,
      total_analyses: totalAnalyses,
      total_certificates: totalCertificates,
      avg_analyses_per_user: data.length > 0 ? Math.round(totalAnalyses / data.length) : 0,
      avg_certificates_per_user: data.length > 0 ? Math.round(totalCertificates / data.length) : 0
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
