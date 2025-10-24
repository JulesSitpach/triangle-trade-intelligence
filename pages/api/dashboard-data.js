/**
 * Dashboard Data API - User Workflow & Alert Data
 * Provides:
 * 1. All workflow completions with certificate data
 * 2. Real-time crisis alerts from RSS monitoring (matched to user's HS codes)
 * 3. Monthly usage stats for tier limits
 * 4. User profile data
 *
 * DATA CONTRACT: Returns validated WorkflowSessionRow[] and alert data
 * Uses canonical field names from data-contracts.ts
 *
 * UPDATED (October 2025): Now loads crisis_alerts from RSS monitoring instead
 * of static vulnerability_analyses. Alerts are matched to user's product HS codes
 * and combined with workflow context for complete business intelligence.
 */

import { protectedApiHandler } from '../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';
import { DevIssue } from '../../lib/utils/logDevIssue.js';
import {
  validateComponentsArray,
  validateTradeVolume,
  validateTariffRatesCache,
  reportValidationErrors
} from '../../lib/validation/data-contract-validator.ts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SUBSCRIPTION_LIMITS = {
  'Trial': 1,           // 1 analysis total (7-day trial)
  'Starter': 10,        // 10 analyses per month
  'Professional': 100,  // 100 analyses per month
  'Premium': null       // Unlimited
};

export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;

    try {
      // ✅ FIX: Rolling 30-day usage window (fair for mid-month upgrades)
      // Count workflows CREATED in last 30 days (not completed, which may be NULL)
      // Users get 100 analyses per month = ~3.3 per day rolling window
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: monthlyUsed } = await supabase
        .from('workflow_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo);

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier, status, email')
        .eq('user_id', userId)
        .single();

      console.log('📊 Dashboard Usage Check:', {
        userId,
        email: profile?.email,
        tier: profile?.subscription_tier,
        tierLimit: SUBSCRIPTION_LIMITS[profile?.subscription_tier]
      });

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

        // === DATA CONTRACT VALIDATION ===
        // Validate trade_volume
        const volumeResult = validateTradeVolume(row.trade_volume, `workflow_session[${row.id}].trade_volume`);
        if (!volumeResult.valid) {
          reportValidationErrors(volumeResult, `dashboard-data: session ${row.id}`);
        }

        // Validate components if present
        if (row.component_origins?.length > 0) {
          const componentsResult = validateComponentsArray(row.component_origins, `workflow_session[${row.id}].components`);
          if (!componentsResult.valid) {
            reportValidationErrors(componentsResult, `dashboard-data: session ${row.id}`);
          }
        }

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
          trade_volume: volumeResult.normalized || 0,  // ✅ Use validated value
          estimated_annual_savings: parseFloat(row.estimated_annual_savings) || 0,  // ✅ FIXED: Use actual savings
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

        // === DATA CONTRACT VALIDATION ===
        // Validate trade_volume from workflow
        const volumeResult = validateTradeVolume(
          workflowData.company?.trade_volume,
          `workflow_completion[${row.id}].company.trade_volume`
        );
        if (!volumeResult.valid) {
          reportValidationErrors(volumeResult, `dashboard-data: completion ${row.id}`);
        }

        // Validate components if present
        if (qualificationResult.component_origins?.length > 0) {
          const componentsResult = validateComponentsArray(
            qualificationResult.component_origins,
            `workflow_completion[${row.id}].components`
          );
          if (!componentsResult.valid) {
            reportValidationErrors(componentsResult, `dashboard-data: completion ${row.id}`);
          }
        }

        return {
          id: row.id,
          source: 'completion',
          company_name: workflowData.company?.company_name || workflowData.company?.name || 'Company',  // ✅ FIX: use company_name as primary
          business_type: workflowData.company?.business_type || 'Not specified',
          product_description: row.product_description || workflowData.product?.description,
          hs_code: row.hs_code || workflowData.product?.hs_code,
          qualification_status: qualificationResult.status || 'UNKNOWN',
          regional_content_percentage: qualificationResult.regional_content || 0,
          required_threshold: qualificationResult.required_threshold || 60,
          trade_volume: volumeResult.normalized || 0,  // ✅ Use validated value
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

      // Get user's HS codes from workflows to match with crisis alerts
      const userHSCodes = [...new Set(
        allWorkflows
          .map(w => w.hs_code)
          .filter(code => code && code !== 'Not classified')
      )];

      // NEW: Get user's destination country from most recent workflow (Phase 3 - Destination-Aware Alerts)
      const userDestination = allWorkflows.length > 0
        ? (allWorkflows[0].workflow_data?.company?.destination_country ||
           allWorkflows[0].workflow_data?.destination_country ||
           null)
        : null;

      console.log('📍 User Alert Filtering Context:', {
        userId,
        userHSCodes: userHSCodes.length,
        userDestination,
        workflowCount: allWorkflows.length
      });

      // Crisis Alerts from RSS Monitoring (real-time government announcements)
      // Match alerts to user's HS codes AND destination country
      let crisisAlerts = [];

      if (userHSCodes.length > 0) {
        try {
          // Get crisis alerts that affect user's HS codes
          // Wrapped in try-catch to prevent hanging if query fails
          const { data: matchedAlerts, error: alertsError } = await supabase
            .from('crisis_alerts')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(20); // Get recent alerts

          if (alertsError) {
            console.error('Crisis alerts query error:', alertsError);
            await DevIssue.apiError('dashboard_data', 'crisis alerts query', alertsError, { userId });
            // Continue without alerts rather than failing
          } else {

        // Filter alerts that match user's HS codes AND destination country
        const relevantAlerts = (matchedAlerts || []).filter(alert => {
          // 1. Check HS Code Match (existing logic)
          let hsCodeMatch = true;
          if (alert.affected_hs_codes && alert.affected_hs_codes.length > 0) {
            hsCodeMatch = userHSCodes.some(userCode =>
              alert.affected_hs_codes.some(affectedCode =>
                userCode.startsWith(affectedCode.replace(/\./g, '').substring(0, 6))
              )
            );
          }

          // 2. Check Destination Match (NEW - Phase 3)
          let destinationMatch = true;
          if (alert.affected_destinations && alert.affected_destinations.length > 0) {
            // Alert has specific destinations - check if user's destination matches
            if (userDestination) {
              // Normalize destination codes for comparison
              const normalizeCode = (code) => {
                if (!code) return null;
                if (code.includes('Canada') || code === 'CA') return 'CA';
                if (code.includes('Mexico') || code === 'MX') return 'MX';
                if (code.includes('United States') || code === 'USA' || code === 'US') return 'US';
                return code.toUpperCase();
              };

              const userDestCode = normalizeCode(userDestination);
              destinationMatch = alert.affected_destinations.some(dest =>
                normalizeCode(dest) === userDestCode
              );
            } else {
              // User has no destination set - show all alerts (don't filter)
              destinationMatch = true;
            }
          }
          // If alert has no specific destinations, it affects all destinations (global alert)

          // Alert is relevant if BOTH HS code AND destination match
          const isRelevant = hsCodeMatch && destinationMatch;

          // Debug logging for filtered alerts
          if (!isRelevant && (matchedAlerts || []).length < 10) {
            console.log(`🚫 Alert filtered out: "${alert.title}"`, {
              hsCodeMatch,
              destinationMatch,
              userDestination,
              alertDestinations: alert.affected_destinations
            });
          }

          return isRelevant;
        });

        console.log(`✅ Alert filtering complete:`, {
          totalAlerts: (matchedAlerts || []).length,
          relevantAlerts: relevantAlerts.length,
          filtered: (matchedAlerts || []).length - relevantAlerts.length,
          userDestination
        });

        // Transform crisis alerts to match expected structure
        crisisAlerts = relevantAlerts.slice(0, 5).map(alert => {
          // Find the most recent workflow for context
          const contextWorkflow = allWorkflows[0] || {};

          return {
            id: alert.id,
            source: 'crisis_alert',
            company_name: contextWorkflow.company_name || 'Your Company',
            business_type: contextWorkflow.business_type || 'Not specified',
            hs_code: contextWorkflow.hs_code || 'Multiple',
            product_description: contextWorkflow.product_description || 'Product',
            trade_volume: contextWorkflow.trade_volume || 0,
            qualification_status: contextWorkflow.qualification_status || 'NEEDS_REVIEW',
            component_origins: contextWorkflow.component_origins || [],

            // Crisis alert specific data
            analyzed_at: alert.created_at,
            alert_type: 'rss_crisis',
            severity_level: alert.severity_level,
            // ✅ FIXED: Add field name expected by UserDashboard
            overall_risk_level: alert.severity_level,
            // ✅ FIXED: Add missing risk_score field
            risk_score: alert.crisis_score || 0,
            // ✅ FIXED: Add missing alert_count field
            alert_count: 1,

            // Transform crisis alert into vulnerability analysis format
            primary_vulnerabilities: [
              {
                title: alert.title,
                severity: alert.severity_level,
                description: alert.description,
                impact: alert.business_impact
              }
            ],

            alerts: [
              {
                title: alert.title,
                severity: alert.severity_level,
                description: alert.description,
                potential_impact: alert.business_impact,
                recommended_action: alert.recommended_actions,
                monitoring_guidance: `Source: ${alert.source_type} | Score: ${alert.crisis_score}/10`,
                affected_components: alert.affected_industries || [],
                alert_triggers: alert.keywords_matched || []
              }
            ],

            recommendations: {
              // ✅ FIXED: Change field name to match component expectations
              immediate_actions: alert.recommended_actions
                ? [alert.recommended_actions]
                : [],
              // Keep backwards compatibility
              diversification_strategies: alert.recommended_actions
                ? [alert.recommended_actions]
                : []
            }
          };
        });
          }
        } catch (alertError) {
          console.error('Crisis alerts fetch failed:', alertError);
          await logDevIssue({
            type: 'api_error',
            severity: 'medium',
            component: 'dashboard_data',
            message: 'Crisis alerts fetch failed',
            data: { userId, error: alertError.message, userHSCodes }
          });
          // Continue without alerts - don't fail the entire dashboard
          crisisAlerts = [];
        }
      }

      // CRITICAL: Prevent caching of user-specific data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      return res.status(200).json({
        workflows: allWorkflows || [],
        alerts: crisisAlerts || [],
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
      await DevIssue.apiError('dashboard_data', '/api/dashboard-data', error, { userId });
      return res.status(500).json({
        error: 'Failed to load dashboard data',
        details: error.message
      });
    }
  }
});
