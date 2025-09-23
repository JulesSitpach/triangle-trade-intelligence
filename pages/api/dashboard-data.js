/**
 * Dashboard Data API - Real Subscription & Usage Tracking
 * Provides actual user subscription data and USMCA workflow usage statistics
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Subscription tier configurations
const SUBSCRIPTION_TIERS = {
  'trial': { limit: 5, name: 'Trial' },
  'essential': { limit: 5, name: 'Essential' },
  'professional': { limit: 25, name: 'Professional' },
  'enterprise': { limit: 999, name: 'Enterprise' } // Unlimited represented as 999
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID required' });
    }

    let dashboardData = {
      user_profile: {
        subscription_plan: 'Trial',
        subscription_tier: 'trial',
        is_trial: true,
        trial_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        needs_upgrade: false
      },
      usage_stats: {
        used: 0,
        included: 5,
        remaining: 5,
        percentage: 0,
        limit_reached: false
      },
      recent_activity: [],
      notifications: [],
      business_intelligence: [],
      triangle_opportunities: [],
      data_status: { source: 'database' }
    };

    if (supabase) {
      try {
        // Get user subscription info
        const { data: userData, error: userError } = await supabase
          .from('auth_users')
          .select('subscription_tier, subscription_status, trial_expires_at, created_at')
          .eq('id', user_id)
          .single();

        if (userData && !userError) {
          const tier = userData.subscription_tier || 'trial';
          const tierConfig = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.trial;
          const isTrialUser = tier === 'trial' || userData.subscription_status === 'trial';

          // Calculate trial expiration
          const trialExpiry = userData.trial_expires_at ?
            new Date(userData.trial_expires_at) :
            new Date(userData.created_at ? new Date(userData.created_at).getTime() + 30 * 24 * 60 * 60 * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000);

          const trialExpired = isTrialUser && trialExpiry < new Date();

          // Get usage stats for current month
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const { data: workflowData, error: workflowError } = await supabase
            .from('usmca_workflow_sessions')
            .select('id, step, completed_at, company_name, product_description, tariff_savings')
            .eq('user_id', user_id)
            .eq('step', 'certificate_generation')
            .gte('completed_at', startOfMonth.toISOString())
            .order('completed_at', { ascending: false });

          const completedCount = workflowData ? workflowData.length : 0;
          const remaining = Math.max(0, tierConfig.limit - completedCount);
          const percentage = tierConfig.limit > 0 ? (completedCount / tierConfig.limit) * 100 : 0;
          const limitReached = completedCount >= tierConfig.limit;

          // Calculate total savings
          const totalSavings = workflowData ?
            workflowData.reduce((sum, workflow) => sum + (workflow.tariff_savings || 0), 0) : 0;

          dashboardData = {
            user_profile: {
              subscription_plan: tierConfig.name,
              subscription_tier: tier,
              is_trial: isTrialUser,
              trial_expires_at: trialExpiry.toISOString(),
              trial_expired: trialExpired,
              needs_upgrade: limitReached || trialExpired
            },
            usage_stats: {
              used: completedCount,
              included: tierConfig.limit,
              remaining: remaining,
              percentage: Math.round(percentage),
              limit_reached: limitReached,
              total_savings: totalSavings
            },
            recent_activity: workflowData ? workflowData.slice(0, 3).map(workflow => ({
              id: workflow.id,
              product_description: workflow.product_description || 'Product Classification',
              company_name: workflow.company_name,
              tariff_savings: workflow.tariff_savings,
              completed_at: workflow.completed_at,
              status: 'completed'
            })) : [],
            notifications: [
              ...(limitReached ? [{
                type: 'warning',
                message: `You've reached your monthly limit of ${tierConfig.limit} analyses. Upgrade to continue.`,
                action_url: '/pricing'
              }] : []),
              ...(trialExpired ? [{
                type: 'error',
                message: 'Your trial has expired. Upgrade to continue using Triangle Intelligence.',
                action_url: '/pricing'
              }] : [])
            ],
            data_status: {
              source: 'database',
              user_found: true,
              workflows_found: completedCount
            }
          };

          // Enhance with business intelligence and triangle opportunities
          try {
            // Get business intelligence recommendations
            const { data: businessIntel } = await supabase
              .from('usmca_business_intelligence')
              .select('*')
              .limit(4);

            if (businessIntel && businessIntel.length > 0) {
              dashboardData.business_intelligence = businessIntel.map(intel => ({
                recommendation: intel.strategic_recommendation,
                priority: intel.priority_level,
                savings_potential: intel.estimated_annual_savings,
                timeline: intel.timeline_to_implementation
              }));
            }

            // Get triangle routing opportunities
            const { data: triangleOpps } = await supabase
              .from('triangle_routing_opportunities')
              .select('*')
              .order('cost_savings_percent', { ascending: false })
              .limit(2);

            if (triangleOpps && triangleOpps.length > 0) {
              dashboardData.triangle_opportunities = triangleOpps.map(opp => ({
                route: opp.route_description,
                savings_percent: opp.cost_savings_percent,
                annual_savings: opp.estimated_annual_savings,
                benefits: opp.usmca_benefits
              }));
            }
          } catch (enhanceError) {
            console.error('Error enhancing dashboard data:', enhanceError);
            // Continue with basic dashboard data if enhancement fails
          }
        }
      } catch (dbError) {
        console.error('Database query error:', dbError);
        dashboardData.data_status = { source: 'database_error', error: dbError.message };
      }
    } else {
      dashboardData.data_status = { source: 'no_database_connection' };
    }

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Dashboard data API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      data_status: { source: 'error_fallback' }
    });
  }
}