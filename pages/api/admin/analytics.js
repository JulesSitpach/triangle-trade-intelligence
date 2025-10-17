/**
 * ADMIN API: General Analytics
 * GET /api/admin/analytics - Returns general platform analytics for admin dashboard
 * Used by AdminDashboard.js for overview metrics
 */

import { createClient } from '@supabase/supabase-js';
import { logDevIssue, DevIssue } from '../../../lib/utils/logDevIssue.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    await DevIssue.validationError('admin_api', 'request_method', req.method, {
      endpoint: '/api/admin/analytics',
      allowed_methods: ['GET']
    });
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Add admin authentication check

    // Get timeframe from query params
    const { timeframe = '30days' } = req.query;
    const daysBack = getDaysFromTimeframe(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Query all required data tables
    const [usersResult, workflowsResult, certificatesResult, subscriptionsResult, serviceRequestsResult] = await Promise.all([
      queryUserProfiles(),
      queryWorkflowCompletions(),
      queryCertificateGeneration(),
      querySubscriptions(),
      queryServiceRequests()
    ]);

    // Calculate analytics metrics
    const analytics = calculatePlatformAnalytics(
      usersResult,
      workflowsResult,
      certificatesResult,
      subscriptionsResult,
      serviceRequestsResult,
      startDate
    );

    return res.status(200).json({
      ...analytics,
      timeframe,
      date_range: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      data_status: {
        users_available: usersResult.data && usersResult.data.length > 0,
        workflows_available: workflowsResult.data && workflowsResult.data.length > 0,
        certificates_available: certificatesResult.data && certificatesResult.data.length > 0,
        using_sample_data: !usersResult.data || usersResult.data.length === 0
      }
    });

  } catch (error) {
    console.error('Admin analytics API error:', error);
    await DevIssue.apiError('admin_api', '/api/admin/analytics', error, {
      timeframe: req.query.timeframe
    });
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Query user profiles with error handling
 */
async function queryUserProfiles() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        company_name,
        email,
        status,
        subscription_tier,
        workflow_completions,
        certificates_generated,
        total_savings,
        created_at,
        last_login
      `)
      .order('created_at', { ascending: false });

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching users:', error);
      await logDevIssue({
        type: 'api_error',
        severity: 'medium',
        component: 'admin_api',
        message: 'Failed to query user_profiles for analytics',
        data: { error: error.message, errorCode: error.code }
      });
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (e) {
    await logDevIssue({
      type: 'api_error',
      severity: 'medium',
      component: 'admin_api',
      message: 'Exception in queryUserProfiles',
      data: { error: e.message }
    });
    return { data: [], error: null };
  }
}

/**
 * Query workflow completions with error handling
 */
async function queryWorkflowCompletions() {
  try {
    const { data, error } = await supabase
      .from('workflow_completions')
      .select(`
        id,
        user_id,
        workflow_type,
        completed_at,
        certificate_generated,
        total_savings,
        status
      `)
      .order('completed_at', { ascending: false });

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching workflows:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (e) {
    return { data: [], error: null };
  }
}

/**
 * Query certificate generation data
 */
async function queryCertificateGeneration() {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        id,
        user_id,
        certificate_type,
        generated_at,
        status
      `)
      .order('generated_at', { ascending: false });

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching certificates:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (e) {
    return { data: [], error: null };
  }
}

/**
 * Query subscriptions for revenue analytics
 */
async function querySubscriptions() {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        tier,
        billing_period,
        status,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscriptions:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (e) {
    return { data: [], error: null };
  }
}

/**
 * Query service requests for service revenue analytics
 */
async function queryServiceRequests() {
  try {
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        id,
        user_id,
        service_type,
        status,
        price,
        paid_at,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching service requests:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (e) {
    return { data: [], error: null };
  }
}

/**
 * Calculate comprehensive platform analytics
 */
function calculatePlatformAnalytics(usersResult, workflowsResult, certificatesResult, subscriptionsResult, serviceRequestsResult, startDate) {
  const users = usersResult.data || [];
  const workflows = workflowsResult.data || [];
  const certificates = certificatesResult.data || [];
  const subscriptions = subscriptionsResult.data || [];
  const serviceRequests = serviceRequestsResult.data || [];

  // If no real data, return sample analytics
  if (users.length === 0 && workflows.length === 0 && certificates.length === 0) {
    return getSampleAnalytics();
  }

  // Calculate real metrics
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

  // User metrics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const newUsersThisMonth = users.filter(u =>
    new Date(u.created_at) >= thirtyDaysAgo
  ).length;

  // Workflow metrics
  const totalWorkflows = workflows.length;
  const completedWorkflows = workflows.filter(w => w.status === 'completed').length;
  const workflowsThisMonth = workflows.filter(w =>
    new Date(w.completed_at) >= thirtyDaysAgo
  ).length;

  // Certificate metrics
  const totalCertificates = certificates.length;
  const certificatesThisMonth = certificates.filter(c =>
    new Date(c.generated_at) >= thirtyDaysAgo
  ).length;

  // Calculate total savings
  const totalSavings = users.reduce((sum, u) => sum + (parseFloat(u.total_savings) || 0), 0);
  const avgSavingsPerUser = totalUsers > 0 ? totalSavings / totalUsers : 0;

  // Conversion rates
  const workflowToUserRate = totalUsers > 0 ? (totalWorkflows / totalUsers) * 100 : 0;
  const certificateConversionRate = totalWorkflows > 0 ? (totalCertificates / totalWorkflows) * 100 : 0;

  // Subscription metrics (Task 4.3)
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const tierPricing = {
    professional: 299,
    business: 499,
    enterprise: 599
  };
  const monthlyRecurringRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((total, sub) => total + (tierPricing[sub.tier] || 0), 0);

  // Service revenue metrics (Task 4.3)
  const paidServiceRequests = serviceRequests.filter(s => s.paid_at);
  const totalServiceRevenue = paidServiceRequests.reduce((total, service) => {
    return total + (parseFloat(service.price) || 0);
  }, 0);
  const pendingServiceRequests = serviceRequests.filter(s => s.status === 'pending').length;

  return {
    // Core metrics (what AdminDashboard.js expects)
    total_workflows: totalWorkflows,
    total_certificates: totalCertificates,

    // Extended metrics
    users: {
      total: totalUsers,
      active: activeUsers,
      new_this_month: newUsersThisMonth,
      growth_rate: calculateGrowthRate(users, 30)
    },
    workflows: {
      total: totalWorkflows,
      completed: completedWorkflows,
      this_month: workflowsThisMonth,
      avg_per_user: totalUsers > 0 ? totalWorkflows / totalUsers : 0
    },
    certificates: {
      total: totalCertificates,
      this_month: certificatesThisMonth,
      conversion_rate: Math.round(certificateConversionRate * 10) / 10
    },
    revenue: {
      total_savings_generated: Math.round(totalSavings),
      avg_savings_per_user: Math.round(avgSavingsPerUser),
      estimated_value_delivered: Math.round(totalSavings * 1.15), // Assume 15% service fee
      // Task 4.3: Subscription & Service Revenue
      monthly_recurring_revenue: monthlyRecurringRevenue,
      total_service_revenue: Math.round(totalServiceRevenue),
      active_subscriptions: activeSubscriptions,
      pending_service_requests: pendingServiceRequests
    },
    engagement: {
      workflow_to_user_ratio: Math.round(workflowToUserRate * 10) / 10,
      certificate_completion_rate: Math.round(certificateConversionRate * 10) / 10,
      avg_workflows_per_user: totalUsers > 0 ? Math.round((totalWorkflows / totalUsers) * 10) / 10 : 0
    }
  };
}

/**
 * Return sample analytics when no real data exists
 */
function getSampleAnalytics() {
  return {
    // Core metrics (what AdminDashboard.js expects)
    total_workflows: 0,
    total_certificates: 0,

    // Extended metrics
    users: {
      total: 0,
      active: 0,
      new_this_month: 0,
      growth_rate: 0
    },
    workflows: {
      total: 0,
      completed: 0,
      this_month: 0,
      avg_per_user: 0
    },
    certificates: {
      total: 0,
      this_month: 0,
      conversion_rate: 0
    },
    revenue: {
      total_savings_generated: 0,
      avg_savings_per_user: 0,
      estimated_value_delivered: 0,
      // Task 4.3: Subscription & Service Revenue
      monthly_recurring_revenue: 0,
      total_service_revenue: 0,
      active_subscriptions: 0,
      pending_service_requests: 0
    },
    engagement: {
      workflow_to_user_ratio: 0,
      certificate_completion_rate: 0,
      avg_workflows_per_user: 0
    },
    sample_data: true,
    message: "No user data available yet. Metrics will populate as users complete workflows."
  };
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