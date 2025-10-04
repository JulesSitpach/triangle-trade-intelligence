/**
 * Dashboard Data API - Action-Driving Dashboard Data
 * Provides 5 key data sections that drive user actions:
 * 1. Qualification Issues (drives service purchases)
 * 2. Active Services (reduces support tickets)
 * 3. Recent Certificates (utility + social proof)
 * 4. Usage Stats (drives upgrades)
 * 5. Recent Successes (encourages repeat usage)
 */

import { protectedApiHandler } from '../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SERVICE_NAMES = {
  'usmca-certificate': 'USMCA Certificate Generation',
  'hs-classification': 'HS Code Classification',
  'crisis-response': 'Crisis Response Management',
  'supplier-sourcing': 'Supplier Sourcing',
  'manufacturing-feasibility': 'Manufacturing Feasibility',
  'market-entry': 'Market Entry Strategy'
};

const SUBSCRIPTION_LIMITS = {
  'Trial': 5,
  'Starter': 10,
  'Professional': 999,
  'Premium': 999
};

export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;

    try {
      // 1. Qualification Issues (drives service purchases)
      const { data: qualificationIssues } = await supabase
        .from('workflow_sessions')
        .select('id, product_description, qualification_status, qualification_percentage, compliance_gaps, completed_at')
        .eq('user_id', userId)
        .eq('qualification_status', 'NOT_QUALIFIED')
        .order('completed_at', { ascending: false })
        .limit(1);

      // 2. Active Services (reduces support tickets)
      const { data: activeServices } = await supabase
        .from('service_requests')
        .select('id, service_type, status, assigned_to, created_at, price')
        .eq('user_id', userId)
        .in('status', ['pending', 'in_progress', 'needs_info'])
        .order('created_at', { ascending: false });

      // 3. Recent Certificates (utility + social proof)
      const { data: recentCertificates } = await supabase
        .from('usmca_certificate_completions')
        .select('id, certificate_number, product_description, estimated_annual_savings, created_at, pdf_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Get total certificates count
      const { count: totalCertificates } = await supabase
        .from('usmca_certificate_completions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 4. Monthly Usage (drives upgrades)
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: monthlyUsed } = await supabase
        .from('workflow_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('completed_at', startOfMonth);

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier, trial_expires_at, is_trial')
        .eq('id', userId)
        .single();

      const limit = SUBSCRIPTION_LIMITS[profile?.subscription_tier] || 5;
      const used = monthlyUsed || 0;
      const percentage = Math.round((used / limit) * 100);

      // 5. All Workflows (for dropdown selector)
      const { data: allWorkflows } = await supabase
        .from('workflow_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      // 6. Vulnerability Analysis History (alerts)
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
          remaining: Math.max(0, limit - used),
          limit_reached: used >= limit
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
