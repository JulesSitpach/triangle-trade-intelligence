/**
 * Usage Tracking Service for Triangle Intelligence
 * Automatically tracks and populates USMCA workflow usage data
 */

import { createClient } from '@supabase/supabase-js';

class UsageTrackingService {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Track workflow completion
   * Called when a user completes USMCA workflow
   */
  async trackWorkflowCompletion(userId, workflowData) {
    try {
      const {
        company_name,
        product_description,
        hs_code,
        origin_country,
        import_value,
        tariff_rate,
        savings_amount,
        compliance_status,
        certificate_generated
      } = workflowData;

      // Insert workflow completion record
      const { data: workflow, error: workflowError } = await this.supabase
        .from('workflow_completions')
        .insert({
          user_id: userId,
          company_name,
          product_description,
          hs_code,
          origin_country,
          import_value,
          tariff_rate,
          potential_savings: savings_amount,
          compliance_status,
          certificate_generated,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (workflowError) {
        console.error('Error tracking workflow:', workflowError);
        return { success: false, error: workflowError };
      }

      // Update user's subscription usage
      await this.updateSubscriptionUsage(userId);

      // Track API usage
      await this.trackApiUsage(userId, '/api/usmca-complete', 'POST', 200);

      // Create notification for user
      if (savings_amount > 10000) {
        await this.createNotification(
          userId,
          'Significant Savings Identified!',
          `Your USMCA analysis identified potential savings of $${savings_amount.toLocaleString()}. Consider upgrading to unlock more features.`,
          'success',
          '/pricing'
        );
      }

      return { success: true, data: workflow };
    } catch (error) {
      console.error('Error in trackWorkflowCompletion:', error);
      return { success: false, error };
    }
  }

  /**
   * Track API endpoint usage
   */
  async trackApiUsage(userId, endpoint, method = 'GET', statusCode = 200, responseTime = null) {
    try {
      const { error } = await this.supabase
        .from('api_usage_logs')
        .insert({
          user_id: userId,
          endpoint,
          method,
          status_code: statusCode,
          response_time_ms: responseTime,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error tracking API usage:', error);
      }
    } catch (error) {
      console.error('Error in trackApiUsage:', error);
    }
  }

  /**
   * Update user's subscription usage count
   */
  async updateSubscriptionUsage(userId) {
    try {
      // Get current subscription
      const { data: subscription, error: fetchError } = await this.supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError || !subscription) {
        console.error('Error fetching subscription:', fetchError);
        return;
      }

      // Increment usage counter
      const newUsageCount = (subscription.used_classifications || 0) + 1;

      const { error: updateError } = await this.supabase
        .from('user_subscriptions')
        .update({
          used_classifications: newUsageCount,
          last_used_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating subscription usage:', updateError);
      }

      // Check if user is approaching or exceeded limit
      if (newUsageCount >= subscription.included_classifications * 0.8) {
        const remaining = subscription.included_classifications - newUsageCount;

        if (remaining <= 0) {
          await this.createNotification(
            userId,
            'Classification Limit Reached',
            'You have reached your monthly classification limit. Upgrade your plan to continue.',
            'warning',
            '/pricing'
          );
        } else if (remaining <= 2) {
          await this.createNotification(
            userId,
            'Approaching Classification Limit',
            `You have ${remaining} classifications remaining this month.`,
            'info',
            '/pricing'
          );
        }
      }
    } catch (error) {
      console.error('Error in updateSubscriptionUsage:', error);
    }
  }

  /**
   * Create a notification for a user
   */
  async createNotification(userId, title, message, type = 'info', actionUrl = null) {
    try {
      const { error } = await this.supabase
        .from('dashboard_notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          action_url: actionUrl,
          action_text: actionUrl ? 'View Details' : null,
          is_read: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (error) {
      console.error('Error in createNotification:', error);
    }
  }

  /**
   * Get usage statistics for a user
   */
  async getUserUsageStats(userId, timeframe = '30days') {
    try {
      const startDate = this.getStartDate(timeframe);

      // Get workflow completions
      const { data: workflows, error: workflowError } = await this.supabase
        .from('workflow_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', startDate)
        .order('completed_at', { ascending: false });

      if (workflowError) {
        console.error('Error fetching workflows:', workflowError);
      }

      // Get API usage
      const { data: apiUsage, error: apiError } = await this.supabase
        .from('api_usage_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (apiError) {
        console.error('Error fetching API usage:', apiError);
      }

      // Calculate statistics
      const stats = {
        totalWorkflows: workflows?.length || 0,
        totalApiCalls: apiUsage?.length || 0,
        totalSavingsIdentified: workflows?.reduce((sum, w) => sum + (w.potential_savings || 0), 0) || 0,
        certificatesGenerated: workflows?.filter(w => w.certificate_generated).length || 0,
        avgResponseTime: apiUsage?.length > 0
          ? apiUsage.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / apiUsage.length
          : 0,
        mostUsedEndpoints: this.getMostUsedEndpoints(apiUsage),
        recentWorkflows: workflows?.slice(0, 5) || [],
        timeframe
      };

      return stats;
    } catch (error) {
      console.error('Error in getUserUsageStats:', error);
      return null;
    }
  }

  /**
   * Get admin dashboard statistics
   */
  async getAdminDashboardStats(timeframe = '30days') {
    try {
      const startDate = this.getStartDate(timeframe);

      // Get all workflows
      const { data: workflows, error: workflowError } = await this.supabase
        .from('workflow_completions')
        .select('*')
        .gte('completed_at', startDate);

      // Get all API usage
      const { data: apiUsage, error: apiError } = await this.supabase
        .from('api_usage_logs')
        .select('*')
        .gte('created_at', startDate);

      // Get active users
      const { data: activeUsers, error: userError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .gte('last_active_at', startDate);

      // Get subscription data
      const { data: subscriptions, error: subError } = await this.supabase
        .from('user_subscriptions')
        .select('*');

      const stats = {
        totalUsers: activeUsers?.length || 0,
        totalWorkflows: workflows?.length || 0,
        totalApiCalls: apiUsage?.length || 0,
        totalRevenue: subscriptions?.reduce((sum, s) => sum + (s.monthly_fee || 0), 0) || 0,
        avgWorkflowsPerUser: activeUsers?.length > 0
          ? (workflows?.length || 0) / activeUsers.length
          : 0,
        topProducts: this.getTopProducts(workflows),
        topCountries: this.getTopCountries(workflows),
        subscriptionBreakdown: this.getSubscriptionBreakdown(subscriptions),
        timeframe
      };

      return stats;
    } catch (error) {
      console.error('Error in getAdminDashboardStats:', error);
      return null;
    }
  }

  // Helper methods
  getStartDate(timeframe) {
    const now = new Date();
    switch (timeframe) {
      case '7days':
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case '30days':
        return new Date(now.setDate(now.getDate() - 30)).toISOString();
      case '90days':
        return new Date(now.setDate(now.getDate() - 90)).toISOString();
      case '1year':
        return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      default:
        return new Date(now.setDate(now.getDate() - 30)).toISOString();
    }
  }

  getMostUsedEndpoints(apiUsage) {
    if (!apiUsage || apiUsage.length === 0) return [];

    const endpointCounts = {};
    apiUsage.forEach(log => {
      endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1;
    });

    return Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  getTopProducts(workflows) {
    if (!workflows || workflows.length === 0) return [];

    const productCounts = {};
    workflows.forEach(w => {
      if (w.product_description) {
        const product = w.product_description.substring(0, 50);
        productCounts[product] = (productCounts[product] || 0) + 1;
      }
    });

    return Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([product, count]) => ({ product, count }));
  }

  getTopCountries(workflows) {
    if (!workflows || workflows.length === 0) return [];

    const countryCounts = {};
    workflows.forEach(w => {
      if (w.origin_country) {
        countryCounts[w.origin_country] = (countryCounts[w.origin_country] || 0) + 1;
      }
    });

    return Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));
  }

  getSubscriptionBreakdown(subscriptions) {
    if (!subscriptions || subscriptions.length === 0) return {};

    const breakdown = {
      Essential: 0,
      Professional: 0,
      Enterprise: 0,
      Trial: 0
    };

    subscriptions.forEach(sub => {
      if (sub.is_trial) {
        breakdown.Trial++;
      } else if (sub.subscription_plan) {
        breakdown[sub.subscription_plan] = (breakdown[sub.subscription_plan] || 0) + 1;
      }
    });

    return breakdown;
  }
}

// Singleton instance
let serviceInstance = null;

export function getUsageTrackingService() {
  if (!serviceInstance) {
    serviceInstance = new UsageTrackingService();
  }
  return serviceInstance;
}

export default UsageTrackingService;