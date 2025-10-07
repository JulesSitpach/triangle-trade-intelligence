/**
 * Dashboard Data API - User Workflow & Alert Data
 * Provides:
 * 1. All workflow completions with certificate data
 * 2. Vulnerability analysis history (alerts)
 * 3. Monthly usage stats for tier limits
 * 4. User profile data
 */

import { protectedApiHandler } from '../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SUBSCRIPTION_LIMITS = {
  'Starter': 10,        // 10 analyses per month
  'Professional': null, // Unlimited
  'Premium': null       // Unlimited
};

export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;

    try {
      // Monthly Usage (drives upgrades)
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: monthlyUsed } = await supabase
        .from('workflow_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('completed_at', startOfMonth);

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier, status, email')
        .eq('id', userId)
        .single();

      const limit = SUBSCRIPTION_LIMITS[profile?.subscription_tier] !== undefined
        ? SUBSCRIPTION_LIMITS[profile?.subscription_tier]
        : 10; // Default to Starter limit

      const used = monthlyUsed || 0;

      // Handle unlimited tiers (limit === null)
      const isUnlimited = limit === null;
      const percentage = isUnlimited ? 0 : Math.round((used / limit) * 100);
      const remaining = isUnlimited ? null : Math.max(0, limit - used);
      const limitReached = isUnlimited ? false : used >= limit;

      // Get workflows from BOTH tables (sessions = in-progress, completions = with certificates)
      const { data: sessionsRows } = await supabase
        .from('workflow_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      const { data: completionsRows } = await supabase
        .from('workflow_completions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      // Transform workflow_sessions data
      const sessionWorkflows = (sessionsRows || []).map(row => {
        // Extract workflow_data if available
        const workflowData = row.workflow_data || {};

        return {
          id: row.id,
          source: 'session',
          company_name: row.company_name,
          business_type: row.business_type,
          product_description: row.product_description,
          hs_code: row.hs_code,
          qualification_status: row.qualification_status,
          regional_content_percentage: parseFloat(row.regional_content_percentage) || 0,
          required_threshold: parseFloat(row.required_threshold) || 60,
          trade_volume: parseFloat(row.trade_volume) || 0,
          estimated_annual_savings: 0,
          component_origins: row.component_origins || [],
          completed_at: row.completed_at || row.created_at,
          manufacturing_location: row.manufacturing_location,
          certificate_data: null,
          certificate_generated: false,
          // Include full workflow_data for certificate generation
          workflow_data: workflowData
        };
      });

      // Transform workflow_completions data
      const completionWorkflows = (completionsRows || []).map(row => {
        const workflowData = row.workflow_data || {};
        const qualificationResult = workflowData.qualification_result || {};

        return {
          id: row.id,
          source: 'completion',
          company_name: workflowData.company?.name || workflowData.company?.company_name || 'Company',
          business_type: workflowData.company?.business_type || 'Not specified',
          product_description: row.product_description || workflowData.product?.description,
          hs_code: row.hs_code || workflowData.product?.hs_code,
          qualification_status: qualificationResult.status || 'UNKNOWN',
          regional_content_percentage: qualificationResult.regional_content || 0,
          required_threshold: qualificationResult.required_threshold || 60,
          trade_volume: parseFloat(workflowData.company?.annual_trade_volume || workflowData.company?.trade_volume) || 0,
          estimated_annual_savings: row.total_savings || qualificationResult.savings_calculation || 0,
          component_origins: qualificationResult.component_origins || [],
          completed_at: row.completed_at || row.created_at,
          manufacturing_location: qualificationResult.manufacturing_location || '',
          certificate_data: workflowData.certificate || null,
          certificate_generated: !!row.certificate_generated,
          // Include full workflow_data for certificate generation
          workflow_data: workflowData
        };
      });

      // Merge both arrays and sort by completed_at
      const allWorkflows = [...sessionWorkflows, ...completionWorkflows]
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

      // Vulnerability Analysis History (alerts)
      const { data: alertHistory } = await supabase
        .from('vulnerability_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('analyzed_at', { ascending: false });

      return res.status(200).json({
        workflows: allWorkflows || [],
        alerts: alertHistory || [],
        usage_stats: {
          used: used,
          limit: limit,
          percentage: percentage,
          remaining: remaining,
          limit_reached: limitReached,
          is_unlimited: isUnlimited
        },
        user_profile: profile || {}
      });

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      return res.status(500).json({
        error: 'Failed to load dashboard data',
        details: error.message
      });
    }
  }
});
