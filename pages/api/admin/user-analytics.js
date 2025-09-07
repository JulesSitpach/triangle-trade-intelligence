/**
 * ADMIN API: User Analytics
 * GET /api/admin/user-analytics - Returns user growth and engagement metrics
 * Provides data for user management and analytics dashboards
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
    
    // Get timeframe from query params
    const { timeframe = '30days' } = req.query;
    const daysBack = getDaysFromTimeframe(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Query user profiles
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*');

    if (usersError && usersError.code !== 'PGRST116') { // Table doesn't exist
      console.error('Error fetching users:', usersError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    // Query user subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('*');

    if (subscriptionsError && subscriptionsError.code !== 'PGRST116') {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return res.status(500).json({ error: 'Failed to fetch subscription data' });
    }

    // If tables don't exist, return empty state
    const userData = users || [];
    const subscriptionData = subscriptions || [];

    // Calculate user analytics
    const analytics = calculateUserAnalytics(userData, subscriptionData, startDate);

    return res.status(200).json({
      ...analytics,
      timeframe,
      date_range: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      data_status: {
        users_table_exists: users !== null,
        subscriptions_table_exists: subscriptions !== null,
        total_users: userData.length,
        total_subscriptions: subscriptionData.length
      }
    });

  } catch (error) {
    console.error('User analytics API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Calculate comprehensive user analytics
 */
function calculateUserAnalytics(users, subscriptions, startDate) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

  // Basic user counts
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const trialUsers = users.filter(u => u.status === 'trial').length;
  const expiredTrialUsers = users.filter(u => u.status === 'trial_expired').length;

  // New users in timeframe
  const newUsersInPeriod = users.filter(u => 
    new Date(u.created_at) >= startDate
  ).length;

  // New users this month
  const newUsersThisMonth = users.filter(u => 
    new Date(u.created_at) >= thirtyDaysAgo
  ).length;

  // Active users (logged in recently)
  const recentlyActiveUsers = users.filter(u => 
    u.last_login && new Date(u.last_login) >= sevenDaysAgo
  ).length;

  // User engagement levels
  const userEngagement = calculateUserEngagement(users);

  // Subscription analytics
  const subscriptionAnalytics = calculateSubscriptionAnalytics(subscriptions);

  // User growth trends
  const growthTrends = calculateUserGrowthTrends(users);

  // Customer satisfaction (mock calculation based on activity)
  const customerSatisfaction = calculateCustomerSatisfaction(users);

  // Churn analysis
  const churnAnalysis = calculateChurnAnalysis(users, subscriptions);

  return {
    // Core metrics
    total_users: totalUsers,
    active_users: recentlyActiveUsers,
    trial_users: trialUsers,
    expired_trial_users: expiredTrialUsers,
    new_users_this_month: newUsersThisMonth,
    new_users_in_period: newUsersInPeriod,

    // Engagement metrics
    customer_satisfaction: customerSatisfaction,
    user_engagement: userEngagement,

    // Growth metrics
    growth_rate_monthly: calculateGrowthRate(users, 30),
    growth_rate_weekly: calculateGrowthRate(users, 7),
    growth_trends: growthTrends,

    // Subscription metrics
    ...subscriptionAnalytics,

    // Churn metrics
    ...churnAnalysis,

    // User distribution
    user_distribution: {
      by_status: calculateDistribution(users, 'status'),
      by_tier: calculateDistribution(users, 'subscription_tier'),
      by_industry: calculateDistribution(users, 'industry'),
      by_company_size: calculateDistribution(users, 'company_size')
    },

    // Activity metrics
    avg_workflows_per_user: totalUsers > 0 ? 
      users.reduce((sum, u) => sum + (u.workflow_completions || 0), 0) / totalUsers : 0,
    avg_certificates_per_user: totalUsers > 0 ?
      users.reduce((sum, u) => sum + (u.certificates_generated || 0), 0) / totalUsers : 0,
    avg_savings_per_user: totalUsers > 0 ?
      users.reduce((sum, u) => sum + (parseFloat(u.total_savings) || 0), 0) / totalUsers : 0
  };
}

/**
 * Calculate user engagement levels
 */
function calculateUserEngagement(users) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));

  let highlyActive = 0, active = 0, lowActivity = 0, inactive = 0;

  users.forEach(user => {
    if (!user.last_login) {
      inactive++;
      return;
    }

    const lastLogin = new Date(user.last_login);
    if (lastLogin >= sevenDaysAgo) {
      highlyActive++;
    } else if (lastLogin >= thirtyDaysAgo) {
      active++;
    } else if (lastLogin >= ninetyDaysAgo) {
      lowActivity++;
    } else {
      inactive++;
    }
  });

  return {
    highly_active: highlyActive,
    active: active,
    low_activity: lowActivity,
    inactive: inactive,
    engagement_score: users.length > 0 ? 
      ((highlyActive * 4 + active * 3 + lowActivity * 2) / (users.length * 4)) * 100 : 0
  };
}

/**
 * Calculate subscription analytics
 */
function calculateSubscriptionAnalytics(subscriptions) {
  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  
  // Calculate MRR
  const totalMRR = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.monthly_fee || 0), 0);

  // Average revenue per user
  const avgRevenuePerUser = totalSubscriptions > 0 ? totalMRR / totalSubscriptions : 0;

  // Subscription tier distribution
  const tierDistribution = calculateDistribution(subscriptions, 'tier');

  return {
    total_subscriptions: totalSubscriptions,
    active_subscriptions: activeSubscriptions,
    total_mrr: totalMRR,
    avg_revenue_per_user: Math.round(avgRevenuePerUser * 100) / 100,
    subscription_tiers: tierDistribution
  };
}

/**
 * Calculate churn analysis
 */
function calculateChurnAnalysis(users, subscriptions) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Calculate churn rate based on expired trials and canceled subscriptions
  const expiredTrials = users.filter(u => u.status === 'trial_expired').length;
  const canceledSubscriptions = subscriptions.filter(s => s.status === 'canceled').length;
  
  const totalChurned = expiredTrials + canceledSubscriptions;
  const totalUsers = users.length;
  
  const churnRate = totalUsers > 0 ? (totalChurned / totalUsers) * 100 : 0;

  return {
    churn_rate: Math.round(churnRate * 10) / 10,
    churned_users: totalChurned,
    expired_trials: expiredTrials,
    canceled_subscriptions: canceledSubscriptions
  };
}

/**
 * Calculate user growth trends
 */
function calculateUserGrowthTrends(users) {
  const trends = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const newUsersThisDay = users.filter(u => 
      u.created_at.split('T')[0] === dateStr
    ).length;

    trends.push({
      date: dateStr,
      new_users: newUsersThisDay,
      cumulative_users: users.filter(u => 
        new Date(u.created_at) <= date
      ).length
    });
  }

  return trends;
}

/**
 * Calculate customer satisfaction (based on activity and usage)
 */
function calculateCustomerSatisfaction(users) {
  if (users.length === 0) return 0;

  // Mock satisfaction score based on user activity
  const avgWorkflows = users.reduce((sum, u) => sum + (u.workflow_completions || 0), 0) / users.length;
  const avgCertificates = users.reduce((sum, u) => sum + (u.certificates_generated || 0), 0) / users.length;
  
  // Simple satisfaction calculation (0-5 scale)
  const satisfactionScore = Math.min(5, Math.max(0, 
    3 + (avgWorkflows / 10) + (avgCertificates / 5)
  ));

  return Math.round(satisfactionScore * 10) / 10;
}

/**
 * Calculate growth rate for a given period
 */
function calculateGrowthRate(users, days) {
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - days);
  
  const previousPeriodStart = new Date();
  previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2));

  const currentPeriodUsers = users.filter(u => 
    new Date(u.created_at) >= periodStart
  ).length;

  const previousPeriodUsers = users.filter(u => {
    const createdAt = new Date(u.created_at);
    return createdAt >= previousPeriodStart && createdAt < periodStart;
  }).length;

  if (previousPeriodUsers === 0) return currentPeriodUsers > 0 ? 100 : 0;

  return Math.round(((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 1000) / 10;
}

/**
 * Calculate distribution by field
 */
function calculateDistribution(items, field) {
  const distribution = {};
  
  items.forEach(item => {
    const value = item[field] || 'Unknown';
    distribution[value] = (distribution[value] || 0) + 1;
  });

  return Object.entries(distribution).map(([key, count]) => ({
    label: key,
    count,
    percentage: items.length > 0 ? 
      Math.round((count / items.length) * 1000) / 10 : 0
  }));
}

/**
 * Convert timeframe string to days
 */
function getDaysFromTimeframe(timeframe) {
  switch (timeframe) {
    case '7days': return 7;
    case '30days': return 30;
    case '90days': return 90;
    case '1year': return 365;
    default: return 30;
  }
}