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
import {
  ANALYSIS_LIMITS,
  EXECUTIVE_SUMMARY_LIMITS,
  PORTFOLIO_BRIEFING_LIMITS
} from '../../config/subscription-tier-limits.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ All limits now imported from centralized config (config/subscription-tier-limits.js)
// Legacy constants renamed to match centralized config names:
const SUBSCRIPTION_LIMITS = ANALYSIS_LIMITS;
const BRIEFING_LIMITS = PORTFOLIO_BRIEFING_LIMITS;

// ✅ Helper function to calculate risk score from severity level
const calculateRiskScore = (severity) => {
  const severityMap = {
    'CRITICAL': 95,
    'HIGH': 80,
    'high': 80,
    'MEDIUM': 60,
    'medium': 60,
    'LOW': 30,
    'low': 30
  };
  return severityMap[severity] || 60;
};

export default protectedApiHandler({
  GET: async (req, res) => {
    const userId = req.user.id;

    try {
      // ✅ FIX: Read permanent usage counter from monthly_usage_tracking table
      // REASON: Counting workflow_sessions records causes counter to reset when records are deleted
      // monthly_usage_tracking is the source of truth for subscription tier limits
      // It increments when results are created and never decreases (deleting certificates/alerts doesn't affect it)

      // Calculate current billing period (month_year format: "2025-10")
      const now = new Date();
      const month_year = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const { data: usageRecord, error: usageError } = await supabase
        .from('monthly_usage_tracking')
        .select('analysis_count, briefing_count, executive_summary_count')
        .eq('user_id', userId)
        .eq('month_year', month_year)
        .single();

      if (usageError && usageError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error reading usage tracking:', usageError);
      }

      const monthlyUsed = usageRecord?.analysis_count || 0;
      const monthlyBriefingsUsed = usageRecord?.briefing_count || 0;
      const monthlyExecutiveSummariesUsed = usageRecord?.executive_summary_count || 0;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier, status, email, subscription_period_start, subscription_period_end')
        .eq('user_id', userId)
        .single();

      console.log('📊 Dashboard Usage Check:', {
        userId,
        email: profile?.email,
        tier: profile?.subscription_tier,
        analysisLimit: SUBSCRIPTION_LIMITS[profile?.subscription_tier],
        briefingLimit: BRIEFING_LIMITS[profile?.subscription_tier],
        executiveSummaryLimit: EXECUTIVE_SUMMARY_LIMITS[profile?.subscription_tier],
        source: 'monthly_usage_tracking',
        billingPeriod: month_year,
        analysisCount: monthlyUsed,
        briefingCount: monthlyBriefingsUsed,
        executiveSummaryCount: monthlyExecutiveSummariesUsed
      });

      // === WORKFLOW ANALYSIS LIMITS ===
      const limit = SUBSCRIPTION_LIMITS[profile?.subscription_tier] !== undefined
        ? SUBSCRIPTION_LIMITS[profile?.subscription_tier]
        : 10; // Default to Starter limit

      const used = monthlyUsed || 0;

      // Handle unlimited tiers (limit === null)
      const isUnlimited = limit === null;
      const percentage = isUnlimited ? 0 : Math.round((used / limit) * 100);
      const remaining = isUnlimited ? null : Math.max(0, limit - used);
      const limitReached = isUnlimited ? false : used >= limit;

      // === PORTFOLIO BRIEFING LIMITS ===
      const briefingLimit = BRIEFING_LIMITS[profile?.subscription_tier] !== undefined
        ? BRIEFING_LIMITS[profile?.subscription_tier]
        : 50; // Default to Starter limit

      const briefingUsed = monthlyBriefingsUsed || 0;

      const isBriefingUnlimited = briefingLimit === null;
      const briefingPercentage = isBriefingUnlimited ? 0 : Math.round((briefingUsed / briefingLimit) * 100);
      const briefingRemaining = isBriefingUnlimited ? null : Math.max(0, briefingLimit - briefingUsed);
      const briefingLimitReached = isBriefingUnlimited ? false : briefingUsed >= briefingLimit;

      // === EXECUTIVE SUMMARY LIMITS ===
      const executiveSummaryLimit = EXECUTIVE_SUMMARY_LIMITS[profile?.subscription_tier] !== undefined
        ? EXECUTIVE_SUMMARY_LIMITS[profile?.subscription_tier]
        : 15; // Default to Starter limit

      const executiveSummaryUsed = monthlyExecutiveSummariesUsed || 0;

      const isExecutiveSummaryUnlimited = executiveSummaryLimit === null;
      const executiveSummaryPercentage = isExecutiveSummaryUnlimited ? 0 : Math.round((executiveSummaryUsed / executiveSummaryLimit) * 100);
      const executiveSummaryRemaining = isExecutiveSummaryUnlimited ? null : Math.max(0, executiveSummaryLimit - executiveSummaryUsed);
      const executiveSummaryLimitReached = isExecutiveSummaryUnlimited ? false : executiveSummaryUsed >= executiveSummaryLimit;

      // ✅ FIX (Nov 6): Only show COMPLETED + QUALIFIED workflows in "My Certificates"
      // workflow_sessions are IN-PROGRESS only - don't show them in certificates list
      // We'll show in-progress sessions in a separate "Draft Analyses" section if needed
      const { data: sessionsRows } = await supabase
        .from('workflow_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('qualification_status', 'QUALIFIED')
        .not('completed_at', 'is', null)  // Only show completed sessions
        .order('completed_at', { ascending: false });

      // ✅ FIX (Nov 6): Only show QUALIFIED certificates in dashboard
      // NOT_QUALIFIED analyses shouldn't appear in "My Certificates"
      const { data: completionsRows, error: completionsError } = await supabase
        .from('workflow_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('qualification_status', 'QUALIFIED')
        .order('completed_at', { ascending: false });

      // 🔍 DEBUG: Log what we got from database
      console.log(`📊 [DASHBOARD] Found ${completionsRows?.length || 0} QUALIFIED certificates for user ${userId}`);
      if (completionsError) {
        console.error('❌ [DASHBOARD] Error fetching completions:', completionsError);
      }

      // Transform workflow_sessions data
      const sessionWorkflows = (sessionsRows || []).map(row => {
        // Extract data if available (workflow_sessions uses 'data' column, not 'workflow_data')
        const workflowData = row.data || {};

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

        // ✅ FIX: Fallback to JSONB workflow_data when top-level columns are NULL
        // ✅ FIX (Nov 9): Include executive_summary in workflow_data for auto-display on Results page
        const enrichedWorkflowData = { ...workflowData };
        if (row.executive_summary) {
          enrichedWorkflowData.detailed_analysis = enrichedWorkflowData.detailed_analysis || {};
          enrichedWorkflowData.detailed_analysis.situation_brief = row.executive_summary;
          console.log(`✅ [DASHBOARD] Added executive_summary to workflow ${row.id} for auto-display`);
        }

        return {
          id: row.id,
          source: 'session',
          company_name: row.company_name || workflowData.company?.company_name,
          company_country: row.company_country || workflowData.company?.company_country,
          destination_country: row.destination_country || workflowData.company?.destination_country,
          business_type: row.business_type || workflowData.company?.business_type,
          industry_sector: row.industry_sector || workflowData.company?.industry_sector,
          product_description: row.product_description || workflowData.product?.description,
          hs_code: row.hs_code || workflowData.product?.hs_code,
          qualification_status: row.qualification_status || workflowData.usmca?.qualification_status,
          regional_content_percentage: parseFloat(row.regional_content_percentage || workflowData.usmca?.regional_content) || 0,
          required_threshold: parseFloat(row.required_threshold) || 60,
          trade_volume: volumeResult.normalized || workflowData.company?.trade_volume || 0,  // ✅ Fallback to JSONB
          estimated_annual_savings: parseFloat(row.estimated_annual_savings || workflowData.savings?.annual_savings) || 0,
          component_origins: row.component_origins || [],
          completed_at: row.completed_at || row.created_at,
          manufacturing_location: row.manufacturing_location,
          certificate_data: null,
          certificate_generated: false,
          // Include full workflow_data for certificate generation + executive_summary for auto-display
          workflow_data: enrichedWorkflowData
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
      // CRITICAL FIX: Extract HS codes from BOTH workflow-level AND component-level
      const workflowHSCodes = allWorkflows
        .map(w => w.hs_code)
        .filter(code => code && code !== 'Not classified');

      const componentHSCodes = allWorkflows
        .flatMap(w => w.component_origins || [])
        .map(comp => comp.hs_code)
        .filter(code => code);

      const userHSCodes = [...new Set([...workflowHSCodes, ...componentHSCodes])];

      // Get ALL destination countries from ALL workflows (user may ship to multiple destinations)
      const userDestinations = [...new Set(
        allWorkflows
          .map(w => w.workflow_data?.company?.destination_country || w.workflow_data?.destination_country)
          .filter(dest => dest)  // Remove null/undefined
      )];

      // Get ALL origin countries (supplier countries) from component data
      const userOriginCountries = [...new Set(
        allWorkflows
          .flatMap(w => w.component_origins || [])
          .map(comp => comp.origin_country || comp.country)
          .filter(country => country)
      )];

      // Get user's industries/business types
      const userIndustries = [...new Set(
        allWorkflows
          .map(w => w.business_type || w.workflow_data?.company?.business_type)
          .filter(industry => industry)
      )];

      // Debug: only log if explicitly requested via query param
      if (req.query.debug === 'alerts') {
        console.log('📍 User Alert Filtering Context:', {
          userId,
          userHSCodes: userHSCodes.length,
          userDestinations,
          userOriginCountries,
          userIndustries,
          workflowCount: allWorkflows.length
        });
      }

      // Crisis Alerts from RSS Monitoring (real-time government announcements)
      // Match alerts using 4 criteria: HS codes, origin countries, industries, destinations
      // Supports both specific alerts (HS 8542.31 from China) and blanket tariffs (all Chinese imports)
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

        // Filter alerts that match user's HS codes AND ANY of user's destination countries
        const normalizeCode = (code) => {
          if (!code) return null;
          if (code.includes('Canada') || code === 'CA') return 'CA';
          if (code.includes('Mexico') || code === 'MX') return 'MX';
          if (code.includes('United States') || code === 'USA' || code === 'US') return 'US';
          return code.toUpperCase();
        };

        const relevantAlerts = (matchedAlerts || []).filter(alert => {
          // Enhanced matching: Check HS codes, origin countries, industries, and destinations
          // Alert is relevant if ALL specified criteria match (blanket tariffs have fewer criteria)

          let isRelevant = true;

          // 1. Check HS Code Match (if alert specifies HS codes)
          if (alert.affected_hs_codes && alert.affected_hs_codes.length > 0) {
            const hsCodeMatch = userHSCodes.some(userCode =>
              alert.affected_hs_codes.some(affectedCode =>
                userCode.startsWith(affectedCode.replace(/\./g, '').substring(0, 6))
              )
            );
            isRelevant = isRelevant && hsCodeMatch;
          }

          // 2. Check Origin Country Match (if alert specifies origin countries)
          // Example: "All goods FROM China face 25% tariff" (blanket tariff)
          if (alert.affected_countries && alert.affected_countries.length > 0) {
            const originMatch = userOriginCountries.some(userOrigin =>
              alert.affected_countries.some(alertCountry =>
                normalizeCode(userOrigin) === normalizeCode(alertCountry)
              )
            );
            isRelevant = isRelevant && originMatch;
          }

          // 3. Check Industry Match (if alert specifies industries AND user has industries set)
          // Example: "Steel industry faces new restrictions"
          // NOTE: If user hasn't set business_type, don't filter by industry (show alerts anyway)
          if (alert.relevant_industries && alert.relevant_industries.length > 0 && userIndustries.length > 0) {
            const industryMatch = userIndustries.some(userIndustry =>
              alert.relevant_industries.some(alertIndustry =>
                userIndustry.toLowerCase().includes(alertIndustry.toLowerCase()) ||
                alertIndustry.toLowerCase().includes(userIndustry.toLowerCase())
              )
            );
            isRelevant = isRelevant && industryMatch;
          }
          // If user hasn't set industries, don't filter by industry - show alert anyway

          // 4. Check Destination Match (if alert specifies destinations)
          if (alert.affected_destinations && alert.affected_destinations.length > 0) {
            if (userDestinations.length > 0) {
              const destinationMatch = alert.affected_destinations.some(alertDest =>
                userDestinations.some(userDest => normalizeCode(userDest) === normalizeCode(alertDest))
              );
              isRelevant = isRelevant && destinationMatch;
            } else {
              // User has no destinations set - don't filter by destination
              isRelevant = isRelevant && true;
            }
          }

          return isRelevant;
        });

        // Debug logging: only show if requested
        if (req.query.debug === 'alerts') {
          console.log(`✅ Alert filtering complete:`, {
            totalAlerts: (matchedAlerts || []).length,
            relevantAlerts: relevantAlerts.length,
            filtered: (matchedAlerts || []).length - relevantAlerts.length,
            criteria: {
              hsCodes: userHSCodes.length,
              origins: userOriginCountries,
              industries: userIndustries,
              destinations: userDestinations
            }
          });
        }

        // ✅ ALERT LIFECYCLE: Get user-specific tracking data
        const relevantAlertIds = relevantAlerts.map(a => a.id);
        let alertTracking = {};

        if (relevantAlertIds.length > 0) {
          try {
            const { data: trackingData } = await supabase
              .from('user_alert_tracking')
              .select('*')
              .eq('user_id', userId)
              .in('crisis_alert_id', relevantAlertIds);

            // Map tracking data by crisis_alert_id for fast lookup
            alertTracking = (trackingData || []).reduce((acc, track) => {
              acc[track.crisis_alert_id] = track;
              return acc;
            }, {});

            // Auto-create tracking records for NEW alerts (first time user sees them)
            const newAlerts = relevantAlerts.filter(a => !alertTracking[a.id]);
            if (newAlerts.length > 0) {
              const newTrackingRecords = newAlerts.map(alert => ({
                user_id: userId,
                crisis_alert_id: alert.id,
                status: 'NEW',
                first_seen_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString()
              }));

              const { data: inserted } = await supabase
                .from('user_alert_tracking')
                .insert(newTrackingRecords)
                .select();

              // Add newly created tracking records to map
              (inserted || []).forEach(track => {
                alertTracking[track.crisis_alert_id] = track;
              });

              console.log(`✅ Created tracking for ${newAlerts.length} new alerts`);
            }

            // Update last_seen_at for all existing alerts
            const existingAlertIds = relevantAlerts
              .filter(a => alertTracking[a.id] && alertTracking[a.id].status !== 'ARCHIVED')
              .map(a => a.id);

            if (existingAlertIds.length > 0) {
              await supabase
                .from('user_alert_tracking')
                .update({ last_seen_at: new Date().toISOString() })
                .eq('user_id', userId)
                .in('crisis_alert_id', existingAlertIds);
            }
          } catch (trackingError) {
            console.error('⚠️ Alert tracking query failed:', trackingError);
            // Continue without tracking data - don't fail the entire request
          }
        }

        // ✅ AI FILTER: Remove non-strategic alerts (earnings, logistics, carrier ops)
        // Only show alerts that help users make sourcing/shipping decisions
        const strategicKeywords = [
          'tariff', 'duty', 'section 301', 'section 232', 'trade agreement',
          'usmca', 'cbp', 'customs', 'import', 'export', 'trade policy',
          'nearshoring', 'reshoring', 'trade war', 'investigation'
        ];

        const nonStrategicKeywords = [
          'earnings', 'quarterly', 'profit', 'revenue', 'stock price',
          'freight rate', 'diesel price', 'capacity', 'carrier', 'fleet',
          'warehouse', 'automation', 'patent', 'gaming', 'postal'
        ];

        const strategicAlerts = relevantAlerts.filter(alert => {
          const text = `${alert.title} ${alert.description}`.toLowerCase();

          // Must contain strategic keywords
          const hasStrategic = strategicKeywords.some(kw => text.includes(kw));

          // Must NOT contain non-strategic keywords
          const hasNonStrategic = nonStrategicKeywords.some(kw => text.includes(kw));

          return hasStrategic && !hasNonStrategic;
        });

        console.log(`🤖 Dashboard alert filtering: ${strategicAlerts.length}/${relevantAlerts.length} strategic alerts (filtered ${relevantAlerts.length - strategicAlerts.length} non-strategic)`);

        // Transform crisis alerts to match expected structure (with lifecycle status)
        crisisAlerts = strategicAlerts.slice(0, 5).map(alert => {
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
            severity_level: alert.severity || 'MEDIUM',
            // ✅ FIXED: Use correct field name (severity, not severity_level)
            overall_risk_level: alert.severity || 'MEDIUM',
            // ✅ FIXED: Calculate risk_score from severity (crisis_score field doesn't exist)
            risk_score: calculateRiskScore(alert.severity),
            // ✅ FIXED: Add missing alert_count field
            alert_count: 1,

            // ✅ CRITICAL: Preserve original alert fields for component matching
            affected_hs_codes: alert.affected_hs_codes,
            affected_countries: alert.affected_countries,
            relevant_industries: alert.relevant_industries,
            title: alert.title,
            description: alert.description,

            // ✅ ALERT LIFECYCLE: User-specific tracking data
            lifecycle_status: alertTracking[alert.id]?.status || 'NEW',
            first_seen_at: alertTracking[alert.id]?.first_seen_at,
            last_seen_at: alertTracking[alert.id]?.last_seen_at,
            resolved_at: alertTracking[alert.id]?.resolved_at,
            resolution_notes: alertTracking[alert.id]?.resolution_notes,
            estimated_cost_impact: alertTracking[alert.id]?.estimated_cost_impact,
            actions_taken: alertTracking[alert.id]?.actions_taken || [],
            email_notifications_enabled: alertTracking[alert.id]?.email_notifications_enabled ?? true,

            // Transform crisis alert into vulnerability analysis format
            primary_vulnerabilities: [
              {
                title: alert.title,
                // ✅ SCHEMA COMPATIBILITY (Nov 8): Support both old (severity) and new (severity_level)
                severity: alert.severity_level || alert.severity,
                description: alert.description,
                impact: alert.business_impact
              }
            ],

            alerts: [
              {
                title: alert.title,
                // ✅ SCHEMA COMPATIBILITY (Nov 8): Support both old (severity) and new (severity_level)
                severity: alert.severity_level || alert.severity,
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

      // Alerts come from crisis_alerts table (matched to user's products via user_alert_tracking)
      const allAlerts = crisisAlerts;

      // ✅ ALERT LIFECYCLE: Fetch historical context (resolved alerts summary)
      let alertHistoricalContext = null;
      try {
        const { data: resolvedSummary } = await supabase
          .from('user_resolved_alerts_summary')
          .select('*')
          .eq('user_id', userId)
          .single();

        alertHistoricalContext = resolvedSummary || {
          total_resolved: 0,
          total_cost_impact_prevented: 0,
          resolved_last_30d: 0,
          most_recent_resolution: null
        };
      } catch (err) {
        console.log('ℹ️ No historical alert data (expected for new users)');
        alertHistoricalContext = {
          total_resolved: 0,
          total_cost_impact_prevented: 0,
          resolved_last_30d: 0,
          most_recent_resolution: null
        };
      }

      // ✅ ALERT LIFECYCLE: Fetch recent activity (30-day timeline)
      let recentAlertActivity = [];
      try {
        const { data: recentActivity } = await supabase
          .from('user_alert_activity_30d')
          .select('*')
          .eq('user_id', userId)
          .order('first_seen_at', { ascending: false })
          .limit(20);

        recentAlertActivity = recentActivity || [];
      } catch (err) {
        console.log('ℹ️ No recent alert activity');
        recentAlertActivity = [];
      }

      // CRITICAL: Prevent caching of user-specific data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // ✅ NEW (Nov 8, 2025): Calculate period end date for 30-day rolling periods
      const tier = profile?.subscription_tier || 'Trial';
      let periodEnd;
      let daysRemaining;

      if (tier === 'Trial' || !profile?.subscription_period_end) {
        // Trial users: Use calendar month end
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        periodEnd = nextMonth;
        daysRemaining = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24));
      } else {
        // Paid users: Use 30-day rolling period
        periodEnd = new Date(profile.subscription_period_end);
        daysRemaining = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24));
      }

      return res.status(200).json({
        workflows: allWorkflows || [],
        alerts: allAlerts || [],
        usage_stats: {
          used: used,
          limit: limit,
          percentage: percentage,
          remaining: remaining,
          limit_reached: limitReached,
          is_unlimited: isUnlimited,
          period_end: periodEnd.toISOString(),
          days_remaining: daysRemaining
        },
        briefing_usage_stats: {
          used: briefingUsed,
          limit: briefingLimit,
          percentage: briefingPercentage,
          remaining: briefingRemaining,
          limit_reached: briefingLimitReached,
          is_unlimited: isBriefingUnlimited
        },
        executive_summary_usage_stats: {
          used: executiveSummaryUsed,
          limit: executiveSummaryLimit,
          percentage: executiveSummaryPercentage,
          remaining: executiveSummaryRemaining,
          limit_reached: executiveSummaryLimitReached,
          is_unlimited: isExecutiveSummaryUnlimited
        },
        user_profile: profile || {},

        // ✅ ALERT LIFECYCLE: Historical context and recent activity
        alert_historical_context: alertHistoricalContext,
        recent_alert_activity: recentAlertActivity
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
