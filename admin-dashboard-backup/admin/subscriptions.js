/**
 * ADMIN API: Subscriptions Management
 * GET /api/admin/subscriptions - Returns subscription data for user management dashboard
 * Provides detailed subscription information with billing and usage data
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Add admin authentication check
    
    // Query subscriptions with user profile data
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        tier,
        monthly_fee,
        usage_percent,
        next_billing,
        stripe_subscription_id,
        status,
        created_at,
        updated_at,
        user_profiles!user_subscriptions_user_id_fkey (
          company_name,
          email,
          workflow_completions,
          certificates_generated,
          total_savings
        )
      `)
      .order('created_at', { ascending: false });

    if (subscriptionsError && subscriptionsError.code !== 'PGRST116') { // Table doesn't exist
      console.error('Error fetching subscriptions:', subscriptionsError);
      return res.status(500).json({ error: 'Failed to fetch subscription data' });
    }

    // If table doesn't exist, return empty state
    if (!subscriptions) {
      return res.status(200).json({
        subscriptions: [],
        summary: {
          total: 0,
          active: 0,
          past_due: 0,
          canceled: 0,
          total_mrr: 0,
          avg_revenue_per_user: 0
        },
        message: 'Subscriptions table not populated yet'
      });
    }

    // Enrich subscription data
    const enrichedSubscriptions = subscriptions.map(subscription => ({
      ...subscription,
      user_company: subscription.user_profiles?.company_name || 'Unknown Company',
      user_email: subscription.user_profiles?.email || 'No email',
      
      // Calculate usage metrics
      usage_level: getUsageLevel(subscription.usage_percent),
      
      // Format monetary values
      monthly_fee_formatted: `$${subscription.monthly_fee?.toLocaleString() || '0'}`,
      
      // Calculate billing cycle info
      days_until_billing: subscription.next_billing ? 
        Math.ceil((new Date(subscription.next_billing) - new Date()) / (1000 * 60 * 60 * 24)) : null,
      
      // Calculate subscription age
      subscription_age_days: Math.floor(
        (new Date() - new Date(subscription.created_at)) / (1000 * 60 * 60 * 24)
      ),
      
      // Customer value metrics
      customer_lifetime_value: calculateCustomerLTV(subscription),
      customer_health_score: calculateHealthScore(subscription),
      
      // Format dates
      created_at_formatted: new Date(subscription.created_at).toLocaleDateString(),
      next_billing_formatted: subscription.next_billing ? 
        new Date(subscription.next_billing).toLocaleDateString() : 'No billing date',
      
      // Risk indicators
      risk_indicators: assessRiskIndicators(subscription)
    }));

    // Calculate summary statistics
    const summary = calculateSubscriptionSummary(enrichedSubscriptions);

    // Group by tier for analysis
    const tierAnalysis = calculateTierAnalysis(enrichedSubscriptions);

    // Calculate churn risk analysis
    const churnRiskAnalysis = calculateChurnRiskAnalysis(enrichedSubscriptions);

    return res.status(200).json({
      subscriptions: enrichedSubscriptions,
      summary,
      tier_analysis: tierAnalysis,
      churn_risk: churnRiskAnalysis,
      data_status: {
        total_subscriptions: enrichedSubscriptions.length,
        with_user_data: enrichedSubscriptions.filter(s => s.user_profiles).length,
        active_subscriptions: enrichedSubscriptions.filter(s => s.status === 'active').length
      }
    });

  } catch (error) {
    console.error('Subscriptions API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Calculate subscription summary statistics
 */
function calculateSubscriptionSummary(subscriptions) {
  const total = subscriptions.length;
  const active = subscriptions.filter(s => s.status === 'active').length;
  const pastDue = subscriptions.filter(s => s.status === 'past_due').length;
  const canceled = subscriptions.filter(s => s.status === 'canceled').length;
  const unpaid = subscriptions.filter(s => s.status === 'unpaid').length;

  // Calculate MRR from active subscriptions
  const totalMRR = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.monthly_fee || 0), 0);

  const avgRevenuePerUser = total > 0 ? totalMRR / total : 0;

  // Calculate average usage
  const avgUsage = subscriptions.length > 0 ?
    subscriptions.reduce((sum, s) => sum + (s.usage_percent || 0), 0) / subscriptions.length : 0;

  return {
    total,
    active,
    past_due: pastDue,
    canceled,
    unpaid,
    total_mrr: Math.round(totalMRR * 100) / 100,
    avg_revenue_per_user: Math.round(avgRevenuePerUser * 100) / 100,
    avg_usage_percent: Math.round(avgUsage * 10) / 10,
    health_distribution: {
      healthy: subscriptions.filter(s => s.customer_health_score >= 80).length,
      at_risk: subscriptions.filter(s => s.customer_health_score >= 50 && s.customer_health_score < 80).length,
      critical: subscriptions.filter(s => s.customer_health_score < 50).length
    }
  };
}

/**
 * Calculate tier analysis
 */
function calculateTierAnalysis(subscriptions) {
  const tiers = {};
  
  subscriptions.forEach(sub => {
    const tier = sub.tier || 'Unknown';
    if (!tiers[tier]) {
      tiers[tier] = {
        count: 0,
        revenue: 0,
        avg_usage: 0,
        avg_health_score: 0
      };
    }
    
    tiers[tier].count++;
    tiers[tier].revenue += sub.monthly_fee || 0;
  });

  // Calculate averages
  Object.keys(tiers).forEach(tier => {
    const tierSubs = subscriptions.filter(s => s.tier === tier);
    tiers[tier].avg_usage = tierSubs.length > 0 ?
      tierSubs.reduce((sum, s) => sum + (s.usage_percent || 0), 0) / tierSubs.length : 0;
    tiers[tier].avg_health_score = tierSubs.length > 0 ?
      tierSubs.reduce((sum, s) => sum + (s.customer_health_score || 0), 0) / tierSubs.length : 0;
    tiers[tier].avg_revenue_per_user = tiers[tier].count > 0 ?
      tiers[tier].revenue / tiers[tier].count : 0;
  });

  return Object.entries(tiers).map(([tier, data]) => ({
    tier,
    ...data,
    revenue: Math.round(data.revenue * 100) / 100,
    avg_usage: Math.round(data.avg_usage * 10) / 10,
    avg_health_score: Math.round(data.avg_health_score * 10) / 10,
    avg_revenue_per_user: Math.round(data.avg_revenue_per_user * 100) / 100
  }));
}

/**
 * Calculate churn risk analysis
 */
function calculateChurnRiskAnalysis(subscriptions) {
  const lowRisk = subscriptions.filter(s => s.customer_health_score >= 80).length;
  const mediumRisk = subscriptions.filter(s => s.customer_health_score >= 50 && s.customer_health_score < 80).length;
  const highRisk = subscriptions.filter(s => s.customer_health_score < 50).length;

  const pastDueSubscriptions = subscriptions.filter(s => s.status === 'past_due').length;
  const lowUsageSubscriptions = subscriptions.filter(s => (s.usage_percent || 0) < 25).length;

  return {
    risk_distribution: {
      low_risk: lowRisk,
      medium_risk: mediumRisk,
      high_risk: highRisk
    },
    risk_indicators: {
      past_due_subscriptions: pastDueSubscriptions,
      low_usage_subscriptions: lowUsageSubscriptions,
      no_recent_activity: subscriptions.filter(s => s.subscription_age_days > 30 && (s.usage_percent || 0) === 0).length
    },
    at_risk_revenue: Math.round(
      subscriptions
        .filter(s => s.customer_health_score < 80)
        .reduce((sum, s) => sum + (s.monthly_fee || 0), 0) * 100
    ) / 100
  };
}

/**
 * Determine usage level category
 */
function getUsageLevel(usagePercent) {
  if (!usagePercent || usagePercent === 0) return 'no_usage';
  if (usagePercent < 25) return 'low_usage';
  if (usagePercent < 75) return 'moderate_usage';
  return 'high_usage';
}

/**
 * Calculate customer lifetime value
 */
function calculateCustomerLTV(subscription) {
  const monthlyFee = subscription.monthly_fee || 0;
  const subscriptionAgeMonths = Math.max(1, subscription.subscription_age_days / 30);
  
  // Simple LTV calculation based on current revenue and subscription age
  const estimatedLifetimeMonths = Math.max(12, subscriptionAgeMonths * 2); // Assume they'll stay at least as long as they already have
  
  return Math.round(monthlyFee * estimatedLifetimeMonths * 100) / 100;
}

/**
 * Calculate customer health score (0-100)
 */
function calculateHealthScore(subscription) {
  let score = 50; // Base score
  
  // Usage factor (0-30 points)
  const usagePercent = subscription.usage_percent || 0;
  if (usagePercent > 75) score += 30;
  else if (usagePercent > 50) score += 20;
  else if (usagePercent > 25) score += 10;
  else if (usagePercent > 0) score += 5;
  
  // Payment status factor (0-25 points)
  if (subscription.status === 'active') score += 25;
  else if (subscription.status === 'past_due') score += 5;
  else if (subscription.status === 'canceled') score -= 50;
  
  // Subscription longevity factor (0-15 points)
  const ageMonths = subscription.subscription_age_days / 30;
  if (ageMonths > 12) score += 15;
  else if (ageMonths > 6) score += 10;
  else if (ageMonths > 3) score += 5;
  
  // Tier factor (0-10 points) - higher tiers indicate more commitment
  const tier = subscription.tier || '';
  if (tier.includes('Enterprise')) score += 10;
  else if (tier.includes('Professional')) score += 5;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Assess risk indicators for subscription
 */
function assessRiskIndicators(subscription) {
  const indicators = [];
  
  if (subscription.status === 'past_due') {
    indicators.push({ type: 'payment', level: 'high', message: 'Payment overdue' });
  }
  
  if ((subscription.usage_percent || 0) === 0) {
    indicators.push({ type: 'usage', level: 'high', message: 'No platform usage' });
  } else if ((subscription.usage_percent || 0) < 25) {
    indicators.push({ type: 'usage', level: 'medium', message: 'Low platform usage' });
  }
  
  if (subscription.days_until_billing && subscription.days_until_billing <= 7) {
    indicators.push({ type: 'billing', level: 'low', message: 'Billing due soon' });
  }
  
  if (subscription.subscription_age_days < 30) {
    indicators.push({ type: 'new', level: 'low', message: 'New subscription - monitor onboarding' });
  }
  
  return indicators;
}