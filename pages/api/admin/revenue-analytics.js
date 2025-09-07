/**
 * ADMIN API: Revenue Analytics
 * GET /api/admin/revenue-analytics - Returns revenue and financial metrics
 * Provides data for analytics dashboard revenue tracking
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

    // Query user subscriptions for revenue data
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('*');

    if (subscriptionsError && subscriptionsError.code !== 'PGRST116') {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return res.status(500).json({ error: 'Failed to fetch subscription data' });
    }

    // Query user profiles for savings data
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, total_savings, created_at, subscription_tier');

    if (usersError && usersError.code !== 'PGRST116') {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    // Query workflow completions for savings tracking
    const { data: workflows, error: workflowsError } = await supabase
      .from('workflow_completions')
      .select('savings_amount, completed_at, user_id')
      .gte('completed_at', startDate.toISOString());

    if (workflowsError && workflowsError.code !== 'PGRST116') {
      console.error('Error fetching workflows:', workflowsError);
      return res.status(500).json({ error: 'Failed to fetch workflow data' });
    }

    // If tables don't exist, return empty state
    const subscriptionData = subscriptions || [];
    const userData = users || [];
    const workflowData = workflows || [];

    // Calculate revenue analytics
    const analytics = calculateRevenueAnalytics(subscriptionData, userData, workflowData, startDate);

    return res.status(200).json({
      ...analytics,
      timeframe,
      date_range: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      data_status: {
        subscriptions_table_exists: subscriptions !== null,
        users_table_exists: users !== null,
        workflows_table_exists: workflows !== null,
        total_records: subscriptionData.length + userData.length + workflowData.length
      }
    });

  } catch (error) {
    console.error('Revenue analytics API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

/**
 * Calculate comprehensive revenue analytics
 */
function calculateRevenueAnalytics(subscriptions, users, workflows, startDate) {
  // Monthly Recurring Revenue (MRR)
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const totalRevenue = activeSubscriptions.reduce((sum, s) => sum + (s.monthly_fee || 0), 0);
  
  // Average Revenue Per User (ARPU)
  const totalUsers = users.length;
  const avgRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

  // Total customer savings generated (value delivered)
  const totalSavingsGenerated = calculateTotalSavings(users, workflows);

  // Revenue growth calculation
  const revenueGrowth = calculateRevenueGrowth(subscriptions);

  // Revenue by tier
  const revenueByTier = calculateRevenueByTier(activeSubscriptions);

  // Lifetime Value (LTV) estimation
  const lifetimeValueMetrics = calculateLifetimeValueMetrics(subscriptions, users);

  // Revenue trends
  const revenueTrends = calculateRevenueTrends(subscriptions, startDate);

  // Customer acquisition cost and metrics
  const acquisitionMetrics = calculateAcquisitionMetrics(users, totalRevenue);

  return {
    // Core revenue metrics
    total_revenue: Math.round(totalRevenue * 100) / 100,
    monthly_recurring_revenue: Math.round(totalRevenue * 100) / 100,
    avg_revenue_per_user: Math.round(avgRevenuePerUser * 100) / 100,
    
    // Value delivered
    total_savings_generated: Math.round(totalSavingsGenerated * 100) / 100,
    savings_to_revenue_ratio: totalRevenue > 0 ? 
      Math.round((totalSavingsGenerated / totalRevenue) * 100) / 100 : 0,
    avg_savings_per_dollar_spent: totalRevenue > 0 ?
      Math.round((totalSavingsGenerated / totalRevenue) * 100) / 100 : 0,

    // Growth metrics
    ...revenueGrowth,

    // Distribution metrics
    revenue_by_tier: revenueByTier,
    subscription_distribution: calculateSubscriptionDistribution(subscriptions),

    // Customer metrics
    ...lifetimeValueMetrics,
    ...acquisitionMetrics,

    // Trends
    revenue_trends: revenueTrends,

    // Performance indicators
    revenue_per_workflow: workflows.length > 0 ? 
      Math.round((totalRevenue / workflows.length) * 100) / 100 : 0,
    customer_value_ratio: totalSavingsGenerated > 0 ?
      Math.round((totalRevenue / totalSavingsGenerated) * 10000) / 100 : 0 // Revenue as % of savings delivered
  };
}

/**
 * Calculate total customer savings
 */
function calculateTotalSavings(users, workflows) {
  // Sum from user profiles (cumulative savings)
  const userSavings = users.reduce((sum, u) => sum + (parseFloat(u.total_savings) || 0), 0);
  
  // Sum from recent workflows (period-specific savings)
  const workflowSavings = workflows.reduce((sum, w) => sum + (w.savings_amount || 0), 0);
  
  // Use the higher of the two (user profiles should be more comprehensive)
  return Math.max(userSavings, workflowSavings);
}

/**
 * Calculate revenue growth metrics
 */
function calculateRevenueGrowth(subscriptions) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

  // Current period MRR
  const currentMRR = subscriptions
    .filter(s => s.status === 'active' && new Date(s.created_at) <= now)
    .reduce((sum, s) => sum + (s.monthly_fee || 0), 0);

  // Previous period MRR
  const previousMRR = subscriptions
    .filter(s => {
      const createdAt = new Date(s.created_at);
      return s.status === 'active' && createdAt <= thirtyDaysAgo;
    })
    .reduce((sum, s) => sum + (s.monthly_fee || 0), 0);

  // Growth rate
  const mrrGrowthRate = previousMRR > 0 ? 
    ((currentMRR - previousMRR) / previousMRR) * 100 : 0;

  // New MRR this period
  const newMRR = subscriptions
    .filter(s => {
      const createdAt = new Date(s.created_at);
      return s.status === 'active' && createdAt >= thirtyDaysAgo;
    })
    .reduce((sum, s) => sum + (s.monthly_fee || 0), 0);

  return {
    mrr_growth_rate: Math.round(mrrGrowthRate * 100) / 100,
    new_mrr_this_period: Math.round(newMRR * 100) / 100,
    previous_period_mrr: Math.round(previousMRR * 100) / 100,
    current_period_mrr: Math.round(currentMRR * 100) / 100
  };
}

/**
 * Calculate revenue by subscription tier
 */
function calculateRevenueByTier(activeSubscriptions) {
  const tierRevenue = {};
  
  activeSubscriptions.forEach(sub => {
    const tier = sub.tier || 'Unknown';
    tierRevenue[tier] = (tierRevenue[tier] || 0) + (sub.monthly_fee || 0);
  });

  return Object.entries(tierRevenue).map(([tier, revenue]) => ({
    tier,
    revenue: Math.round(revenue * 100) / 100,
    subscriber_count: activeSubscriptions.filter(s => s.tier === tier).length,
    avg_revenue_per_subscriber: activeSubscriptions.filter(s => s.tier === tier).length > 0 ?
      Math.round((revenue / activeSubscriptions.filter(s => s.tier === tier).length) * 100) / 100 : 0
  }));
}

/**
 * Calculate lifetime value metrics
 */
function calculateLifetimeValueMetrics(subscriptions, users) {
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const averageMonthlyRevenue = activeSubscriptions.length > 0 ?
    activeSubscriptions.reduce((sum, s) => sum + (s.monthly_fee || 0), 0) / activeSubscriptions.length : 0;

  // Estimate average customer lifetime (based on account age)
  const avgCustomerLifetimeMonths = users.length > 0 ?
    users.reduce((sum, u) => {
      const accountAgeMonths = Math.max(1, 
        (new Date() - new Date(u.created_at)) / (1000 * 60 * 60 * 24 * 30)
      );
      return sum + accountAgeMonths;
    }, 0) / users.length : 12;

  const estimatedLTV = averageMonthlyRevenue * avgCustomerLifetimeMonths;

  return {
    estimated_customer_ltv: Math.round(estimatedLTV * 100) / 100,
    avg_customer_lifetime_months: Math.round(avgCustomerLifetimeMonths * 10) / 10,
    avg_monthly_revenue_per_customer: Math.round(averageMonthlyRevenue * 100) / 100
  };
}

/**
 * Calculate revenue trends over time
 */
function calculateRevenueTrends(subscriptions, startDate) {
  const trends = [];
  const daysBack = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));

  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Active subscriptions on this date
    const activeOnDate = subscriptions.filter(s => {
      const createdAt = new Date(s.created_at);
      const isActive = s.status === 'active';
      const wasCreatedByDate = createdAt <= date;
      
      return isActive && wasCreatedByDate;
    });

    const dailyRevenue = activeOnDate.reduce((sum, s) => sum + (s.monthly_fee || 0), 0);

    trends.push({
      date: dateStr,
      mrr: Math.round(dailyRevenue * 100) / 100,
      subscribers: activeOnDate.length
    });
  }

  return trends;
}

/**
 * Calculate customer acquisition metrics
 */
function calculateAcquisitionMetrics(users, totalRevenue) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newCustomers = users.filter(u => 
    new Date(u.created_at) >= thirtyDaysAgo
  ).length;

  // Simple CAC estimation (assuming some marketing spend)
  const estimatedMarketingSpend = totalRevenue * 0.3; // Assume 30% of revenue goes to marketing
  const customerAcquisitionCost = newCustomers > 0 ? 
    estimatedMarketingSpend / newCustomers : 0;

  return {
    new_customers_this_month: newCustomers,
    estimated_customer_acquisition_cost: Math.round(customerAcquisitionCost * 100) / 100,
    estimated_marketing_spend: Math.round(estimatedMarketingSpend * 100) / 100
  };
}

/**
 * Calculate subscription distribution
 */
function calculateSubscriptionDistribution(subscriptions) {
  const distribution = {
    active: subscriptions.filter(s => s.status === 'active').length,
    past_due: subscriptions.filter(s => s.status === 'past_due').length,
    canceled: subscriptions.filter(s => s.status === 'canceled').length,
    unpaid: subscriptions.filter(s => s.status === 'unpaid').length
  };

  const total = subscriptions.length;
  
  return Object.entries(distribution).map(([status, count]) => ({
    status,
    count,
    percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
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