/**
 * EXECUTIVE TRADE ALERT API
 * Generates strategic business intelligence for tariff policy impacts
 *
 * Takes user's product data and identifies which tariff policies affect them specifically.
 * Returns ONE cohesive executive advisory (not generic policy announcements).
 *
 * Input:
 * - user_profile: Company info, subscription tier
 * - workflow_intelligence: Their products and tariff analysis
 * - raw_alerts: Policy changes from RSS feeds
 *
 * Output:
 * - Executive advisory with policy impact on THEIR products
 * - Strategic options to mitigate risk
 * - Financial implications
 */

import MEXICO_SOURCING_CONFIG from '../../config/mexico-sourcing-config.js';  // ✅ REPLACES MexicoSourcingAgent
import { getIndustryThreshold } from '../../lib/services/industry-thresholds-service.js';
import { BaseAgent } from '../../lib/agents/base-agent.js';
import { applyRateLimit, strictLimiter } from '../../lib/security/rateLimiter.js';
import { createClient } from '@supabase/supabase-js';
import { EXECUTIVE_SUMMARY_LIMITS } from '../../config/subscription-tier-limits.js';
import { verifyAuth } from '../../lib/middleware/auth-middleware.js';

// ✅ FIX (Nov 12): Decode HTML entities from RSS feed titles/descriptions
// RSS feeds often contain &#8216; ('), &#8217; ('), &#8220; ("), &#8221; ("), etc.
function decodeHTMLEntities(text) {
  if (!text) return text;

  const entities = {
    '&#8216;': "'", // left single quote
    '&#8217;': "'", // right single quote
    '&#8220;': '"', // left double quote
    '&#8221;': '"', // right double quote
    '&#8211;': '-', // en dash
    '&#8212;': '-', // em dash
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' '
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  return decoded;
}

// Initialize agents
const executiveAgent = new BaseAgent({
  name: 'ExecutiveAdvisor',
  model: 'anthropic/claude-haiku-4.5',  // ✅ Haiku 4.5 for cost-effective consulting-grade output
  maxTokens: 8000  // ✅ FIXED Nov 7: Increased from 3000 to handle full strategic briefings (~14K chars)
});
// ✅ Removed mexicoAgent - now using config lookup instead of AI calls
// ✅ Removed section301Agent - now using section_301 field from component_breakdown (already calculated in main analysis)


export default async function handler(req, res) {
  // 🛡️ RATE LIMITING: 10 requests per minute for expensive AI operations
  try {
    await applyRateLimit(strictLimiter)(req, res);
  } catch (error) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please wait before requesting another executive alert.',
      retry_after: 60 // seconds
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 🔐 AUTHENTICATE USER (CRITICAL FIX Nov 11): Get user_id from session, not request body
    // This was causing executive summary counter to NEVER increment (user_id was always undefined)
    const authResult = await verifyAuth(req);
    if (!authResult.authenticated) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please log in to generate executive summaries'
      });
    }
    const user_id = authResult.user.id;

    const { user_profile, workflow_intelligence, raw_alerts, workflow_completion_id } = req.body;

    // ✅ TIER-GATING: Trial users get 1 executive summary, then must upgrade
    // ✅ FIXED (Nov 5, 2025): Previously blocked Trial users completely
    //    Now Trial users get their promised 1 executive summary from pricing page
    const subscriptionTier = user_profile?.subscription_tier || 'Trial';

    // Database stores exact values: "Trial", "Starter", "Professional", "Premium", "Enterprise"
    const allowedTiers = ['Trial', 'Starter', 'Professional', 'Premium', 'Enterprise'];

    // ✅ DEBUG: Log tier information to diagnose 403 errors
    console.log('📋 [EXECUTIVE-ALERT] Tier Check:', {
      received_tier: user_profile?.subscription_tier,
      normalized_tier: subscriptionTier,
      fallback_applied: !user_profile?.subscription_tier,
      is_allowed: allowedTiers.includes(subscriptionTier),
      note: 'Trial users now allowed (1 summary limit enforced below)'
    });

    // ❌ REMOVED: Hard-block of Trial users (they get 1 summary per pricing page promise)
    // Trial users will now be allowed through, but hit usage limit after 1 summary

    // ✅ USAGE LIMIT CHECK: Verify user hasn't exceeded executive summary limit
    if (user_id) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const now = new Date();
        const month_year = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // ✅ Centralized tier limits (from config/subscription-tier-limits.js)
        const userLimit = EXECUTIVE_SUMMARY_LIMITS[subscriptionTier] || EXECUTIVE_SUMMARY_LIMITS['Trial'];

        // Get current usage
        const { data: usageData, error: usageError } = await supabase
          .from('monthly_usage_tracking')
          .select('executive_summary_count')
          .eq('user_id', user_id)
          .eq('month_year', month_year)
          .single();

        if (usageError && usageError.code !== 'PGRST116') {
          console.error('❌ Error checking usage:', usageError);
        }

        const currentUsage = usageData?.executive_summary_count || 0;

        if (currentUsage >= userLimit) {
          return res.status(403).json({
            success: false,
            error: 'LIMIT_EXCEEDED',
            code: 'EXECUTIVE_SUMMARY_LIMIT_REACHED',
            message: `You've reached your monthly executive summary limit (${userLimit} for ${subscriptionTier} tier)`,
            current_usage: currentUsage,
            limit: userLimit,
            tier: subscriptionTier,
            upgrade_url: '/pricing'
          });
        }

        console.log(`✅ Executive summary usage: ${currentUsage}/${userLimit} for ${subscriptionTier} tier`);
      } catch (limitCheckError) {
        console.error('❌ Limit check error:', limitCheckError);
        // Continue with request even if limit check fails (fail open)
      }
    }

    // Validate input
    if (!user_profile || !workflow_intelligence) {
      return res.status(400).json({
        error: 'Missing user_profile or workflow_intelligence',
        success: false
      });
    }

    // Validate required fields (fail loudly, no silent fallbacks)
    if (!user_profile.destination_country) {
      return res.status(400).json({
        error: 'Missing required field: destination_country',
        success: false,
        details: 'Destination country is required for tariff analysis. Expected: US, CA, or MX'
      });
    }

    // ✅ FIX (Nov 7): Provide fallback for industry_sector if missing from localStorage
    if (!user_profile.industry_sector) {
      console.warn('⚠️ industry_sector missing - using fallback based on business_type');
      // Smart fallback based on business_type or company name
      const businessType = user_profile.business_type || '';
      const companyName = (user_profile.company_name || '').toLowerCase(); // Handle null company_name

      if (businessType.includes('Food') || companyName.includes('food') || companyName.includes('gourmet')) {
        user_profile.industry_sector = 'Food & Beverage';
      } else if (businessType.includes('Manufacturer')) {
        user_profile.industry_sector = 'General Manufacturing';
      } else {
        user_profile.industry_sector = 'General Manufacturing'; // Safe default
      }

      console.log(`✅ Using inferred industry_sector: ${user_profile.industry_sector}`);
    }

    // ========== STEP 1: Fetch Active Crisis Alerts ==========
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: crisisAlerts, error: alertsError } = await supabase
      .from('crisis_alerts')
      .select('*')
      .eq('is_active', true)
      .order('severity', { ascending: false });

    if (alertsError) {
      console.error('❌ Failed to fetch crisis alerts:', alertsError);
    }

    console.log(`📋 Fetched ${crisisAlerts?.length || 0} active crisis alerts`);

    // ========== STEP 2: Match Alerts to User's Components ==========

    // Get their HS codes and origins
    const userHSCodes = (workflow_intelligence.components || [])
      .map(c => c.hs_code)
      .filter(Boolean);

    const componentOrigins = [...new Set(
      (workflow_intelligence.components || [])
        .map(c => c.origin_country)
        .filter(Boolean)
    )];

    // ✅ No fallbacks - fields validated above
    const userIndustry = user_profile.industry_sector;
    const userDestination = user_profile.destination_country;
    const hasChineseComponents = (workflow_intelligence.components || [])
      .some(c => c.origin_country === 'China' || c.origin_country === 'CN');

    // Match crisis alerts to user's components
    const matchedAlerts = (crisisAlerts || []).filter(alert => {
      // Blanket alerts (NULL HS codes = applies to all)
      const isBlanketAlert = !alert.affected_hs_codes || alert.affected_hs_codes.length === 0;

      // Country match
      const affectsCountry = alert.affected_countries?.some(country =>
        componentOrigins.includes(country)
      );

      // HS code match (6-digit prefix matching)
      const affectsHSCode = alert.affected_hs_codes?.some(alertHS => {
        const prefix = alertHS.replace(/\./g, '').substring(0, 6);
        return userHSCodes.some(userHS =>
          userHS.replace(/\./g, '').substring(0, 6) === prefix
        );
      });

      // Industry match
      const affectsIndustry = alert.relevant_industries?.includes(userIndustry);

      return (isBlanketAlert && affectsCountry) || affectsHSCode || affectsIndustry;
    });

    console.log(`🎯 Matched ${matchedAlerts.length} crisis alerts to user's components`);

    // Sort by severity and take top 3 most critical
    const topAlerts = matchedAlerts
      .sort((a, b) => {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
      })
      .slice(0, 3);

    // ========== STEP 3: Build Applicable Policies (IMMEDIATE certification issues) ==========
    const applicablePolicies = [];

    // Section 301: China + US destination
    if (hasChineseComponents && userDestination === 'US') {
      // ✅ Calculate once, reuse for both annual_cost_impact and strategic_options
      const section301Impact = await calculateSection301Impact(
        workflow_intelligence.components,
        user_profile.trade_volume || 0
      );

      applicablePolicies.push({
        policy: 'Section 301 Tariffs',
        severity: 'CRITICAL',
        affects_user: true,
        impact: 'Additional tariff on Chinese-origin components (rate varies by HS code)',
        annual_cost_impact: section301Impact,
        description: 'China-origin goods entering the US remain subject to Section 301 tariffs despite USMCA qualification.',
        strategic_options: await generateMexicoNearshoringOptions(
          user_profile,
          workflow_intelligence,
          section301Impact
        )
      });
    }

    // ✅ Get threshold from HS code (AI determines industry from HS code)
    const hsCode = (workflow_intelligence.components || [])[0]?.hs_code;
    const industryThreshold = await getIndustryThreshold(null, { hsCode });
    const rvcBuffer = (workflow_intelligence.north_american_content || 0) - industryThreshold.rvc;

    if (workflow_intelligence.north_american_content && rvcBuffer < 15) {
      applicablePolicies.push({
        policy: 'USMCA Qualification Risk',
        severity: rvcBuffer < 5 ? 'CRITICAL' : 'HIGH',
        affects_user: true,
        impact: 'Low RVC buffer could cause disqualification with threshold changes',
        annual_cost_impact: await calculateRiskImpact(workflow_intelligence, user_profile, industryThreshold),
        description: `Your current RVC (${workflow_intelligence.north_american_content}%) exceeds the requirement but has limited buffer. Proposed rule changes could raise thresholds significantly.`,
        strategic_options: [
          {
            option: 'Increase USMCA content',
            benefit: 'Build RVC buffer, insulate from policy changes',
            timeline: '6-12 months for supplier transition',
            cost_impact: '+1-3% input costs typically'
          },
          {
            option: 'Monitor regulatory changes',
            benefit: 'Early warning for planned threshold increases',
            timeline: 'Ongoing',
            cost_impact: 'None (included with subscription)'
          }
        ]
      });
    }

    // ========== STEP 4: Generate ONE Executive Advisory ==========

    const headline = generateHeadline(applicablePolicies, userIndustry, matchedAlerts.length);
    const executiveAdvisory = await generateExecutiveAdvisoryAI(
      applicablePolicies,
      workflow_intelligence,
      user_profile,
      topAlerts  // ✅ NEW: Pass top 3 matched alerts to AI
    );

    // ========== STEP 3: Generate Financial Scenarios ==========

    const financialScenarios = await generateFinancialScenarios(
      workflow_intelligence,
      applicablePolicies,
      user_profile
    );

    // ========== STEP 4: Generate CBP Guidance ==========

    const cbpGuidance = generateCBPGuidance(
      workflow_intelligence,
      applicablePolicies,
      user_profile
    );

    // ========== STEP 5: Format Response ==========

    const alertStructure = {
      headline: headline,
      situation_brief: executiveAdvisory.situation_brief,
      the_situation: {
        problem: executiveAdvisory.problem,
        root_cause: executiveAdvisory.root_cause,
        annual_impact: executiveAdvisory.annual_impact,
        why_now: executiveAdvisory.why_now
      },
      financial_impact: {
        current_annual_burden: executiveAdvisory.current_burden,
        potential_annual_savings: executiveAdvisory.potential_savings,
        payback_period: executiveAdvisory.payback_period,
        confidence: executiveAdvisory.confidence,
        ...financialScenarios // Add scenario analysis
      },
      // ✅ NEW (Nov 7): Consolidated 90-day timeline with critical decision points
      timeline_90_days: executiveAdvisory.timeline_90_days,
      critical_decision_points: executiveAdvisory.critical_decision_points || [],
      // ⚠️ DEPRECATED: Old 3-phase roadmap (keeping for backward compatibility)
      strategic_roadmap: executiveAdvisory.strategic_roadmap || [],
      action_this_week: executiveAdvisory.action_items || [],
      cbp_compliance_strategy: cbpGuidance, // NEW: Regulatory guidance
      policies_affecting_you: applicablePolicies.map(p => p.policy),
      // ✅ NEW (Nov 7): Show matched crisis alerts count
      active_policy_threats: matchedAlerts.length,
      // ✅ FIX (Nov 12): Decode HTML entities in alert titles/descriptions
      matched_alerts: topAlerts.map(a => ({
        title: decodeHTMLEntities(a.title),
        severity: a.severity,
        effective_date: a.effective_date,
        description: decodeHTMLEntities(a.description)
      })),
      from_your_broker: executiveAdvisory.broker_insights || 'Positioning your supply chain for trade policy resilience.',
      // ✅ FIX: Include professional_disclaimer and save_reminder (were being stripped out)
      professional_disclaimer: executiveAdvisory.professional_disclaimer,
      save_reminder: executiveAdvisory.save_reminder,
      email_trigger_config: {
        should_email: true,
        trigger_level: highestSeverity(applicablePolicies),
        frequency: 'weekly'
      }
    };

    // ✅ USAGE TRACKING: Increment executive summary counter
    if (user_id) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const now = new Date();
        const month_year = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const { error: updateError } = await supabase.rpc('increment_executive_summary_count', {
          p_user_id: user_id,
          p_month_year: month_year
        });

        if (updateError) {
          console.error('❌ Failed to increment executive summary counter:', updateError);
        } else {
          console.log('✅ Executive summary counter incremented for user:', user_id, 'month:', month_year);
        }
      } catch (trackingError) {
        console.error('❌ Usage tracking error:', trackingError);
        // Don't fail the request if tracking fails
      }
    }

    // ✅ FIX (Nov 9): Save executive summary to database using EXACT workflow_session_id
    // SINGLE SOURCE OF TRUTH - no more guessing "most recent workflow"!
    const { workflow_session_id } = req.body;

    if (user_id && alertStructure.situation_brief && workflow_session_id) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // ✅ FIXED (Nov 12): Save to workflow_sessions (always exists) instead of workflow_completions (only exists after certificate download)
        // Users can view executive summary on Results page OR Alerts page without downloading certificate
        const { data: session, error: queryError } = await supabase
          .from('workflow_sessions')
          .select('id, data')
          .eq('session_id', workflow_session_id)
          .eq('user_id', user_id)
          .single();

        if (queryError) {
          console.error('❌ Failed to find workflow_session by session_id:', queryError, 'session_id:', workflow_session_id);
        } else if (session) {
          // Update data JSONB with executive summary
          const updatedData = {
            ...session.data,
            executive_summary: alertStructure.situation_brief,  // ✅ Save for retrieval on Alerts page
            executive_summary_generated_at: new Date().toISOString()
          };

          const { error: updateError } = await supabase
            .from('workflow_sessions')
            .update({
              data: updatedData,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.id);

          if (updateError) {
            console.error('❌ Failed to save executive summary to workflow_sessions:', updateError);
          } else {
            console.log('✅ Executive summary saved to workflow_sessions (session_id:', workflow_session_id, ')');
          }
        } else {
          console.warn('⚠️ No workflow_session found for session_id:', workflow_session_id, '- summary not saved to database');
        }
      } catch (saveError) {
        console.error('❌ Error saving executive summary:', saveError);
        // Don't fail the request if save fails
      }
    } else if (!workflow_session_id) {
      console.warn('⚠️ No workflow_session_id provided - executive summary not saved to database');
    }

    return res.status(200).json({
      success: true,
      alert: alertStructure,
      policies_analyzed: applicablePolicies.length,
      applicable_policies: applicablePolicies,
      legal_notice: "⚠️ IMPORTANT: This is a research tool, not professional advice. All tariff calculations, savings estimates, and compliance guidance must be independently verified by licensed customs brokers or trade attorneys before making business decisions. By using this analysis, you acknowledge sole responsibility for all sourcing and compliance decisions. Actual results may differ significantly from projections due to market conditions, supplier negotiations, and regulatory changes. Consult qualified professionals before taking action."
    });

  } catch (error) {
    console.error('❌ Executive alert generation failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ============ HELPER FUNCTIONS ============

/**
 * Sanitize text for PDF rendering - removes emoji and special Unicode
 * that cause rendering issues in jsPDF
 */
function sanitizeForPDFRendering(text) {
  if (!text) return '';
  return String(text)
    // Remove emoji and special Unicode characters
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emoji ranges
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Miscellaneous Symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
    .replace(/[\u{2300}-\u{23FF}]/gu, '') // Miscellaneous Technical
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variation Selectors
    .replace(/[\u{200B}-\u{200D}]/gu, '') // Zero-width characters
    .replace(/[\u{FEFF}]/gu, '') // Zero-width no-break space
    .trim();
}

/**
 * Generate Mexico nearshoring strategic options with dynamic cost/payback
 * REPLACES hardcoded +2%, 4-6 weeks, 3 months
 */
function generateMexicoNearshoringOptions(userProfile, workflow, section301Impact) {
  try {
    // ✅ Get metrics from config lookup (instant, no AI calls)
    const metrics = MEXICO_SOURCING_CONFIG.calculateMetrics(
      userProfile.industry_sector || 'electronics',
      workflow.product_complexity || 'medium',
      userProfile.trade_volume || 0
    );

    return [
      {
        option: 'Nearshoring to Mexico',
        benefit: 'Eliminates Section 301 exposure, increases USMCA RVC buffer',
        timeline: `${metrics.implementation_weeks} weeks for supplier qualification`,
        cost_impact: `+${metrics.cost_premium_percent}% unit cost (offset within ${metrics.payback_months || 'N/A'} months)`
      },
      {
        option: 'Request tariff exemption',
        benefit: 'Potential tariff elimination for specific HS codes',
        timeline: 'Varies by product category',
        cost_impact: 'Application processing fees apply'
      }
    ];

  } catch (error) {
    console.error('[generateMexicoNearshoringOptions] Error:', error);

    // Fallback to generic options
    return [
      {
        option: 'Nearshoring to Mexico',
        benefit: 'Eliminates Section 301 exposure, increases USMCA RVC buffer',
        timeline: 'Supplier qualification required',
        cost_impact: 'Unit cost increase offset by tariff savings'
      },
      {
        option: 'Request tariff exemption',
        benefit: 'Potential tariff elimination for specific HS codes',
        timeline: 'Varies by product category',
        cost_impact: 'Application processing fees apply'
      }
    ];
  }
}

async function calculateSection301Impact(components, tradeVolume) {
  if (!tradeVolume || tradeVolume === 0) {
    return {
      annualCost: 'Unable to calculate without trade volume',
      effectiveRate: null,
      ratePercent: null
    };
  }

  const chineseComponents = components.filter(c =>
    c.origin_country === 'China' || c.origin_country === 'CN'
  );

  if (chineseComponents.length === 0) {
    return {
      annualCost: '$0 (no Chinese components)',
      effectiveRate: 0,
      ratePercent: '0%'
    };
  }

  const totalChineseValue = chineseComponents.reduce((sum, c) =>
    sum + (c.value_percentage || 0), 0
  );

  // ✅ Use section_301 rates from main analysis (already calculated, NO AI CALLS)
  // Components from component_breakdown already have section_301 field from main USMCA analysis
  let averageSection301Rate = 0;
  let rateCount = 0;

  for (const component of chineseComponents) {
    if (component.section_301 !== undefined && component.section_301 !== null) {
      averageSection301Rate += component.section_301;
      rateCount++;
    }
  }

  // If no rates found, this indicates missing data - DO NOT use hardcoded fallback
  // The component enrichment should have already added Section 301 rates via AI
  if (rateCount === 0) {
    console.error('❌ [SECTION-301] NO rates found for Chinese components - data integrity issue');
    throw new Error('Section 301 rate data missing for Chinese components. Cannot calculate accurate tariff burden.');
  }

  const effectiveRate = averageSection301Rate / rateCount;

  console.log(`📊 Section 301 Analysis: ${rateCount}/${chineseComponents.length} components with rates, effective rate: ${(effectiveRate * 100).toFixed(1)}%`);

  const annualCost = (tradeVolume * totalChineseValue / 100 * effectiveRate);

  // ✅ FIX: Return both cost AND rate so we don't hardcode percentages later
  return {
    annualCost: `$${Math.round(annualCost).toLocaleString()} annually`,
    effectiveRate: effectiveRate,
    ratePercent: `${(effectiveRate * 100).toFixed(1)}%`
  };
}

async function calculateRiskImpact(workflow, userProfile, industryThreshold) {
  // ✅ Use passed threshold to avoid duplicate database call
  const thresholdApplied = workflow.threshold_applied || industryThreshold.rvc;

  // ✅ Risk is proportional to how close they are to minimum threshold
  const buffer = (workflow.north_american_content || 0) - thresholdApplied;
  if (buffer < 5) return 'High risk if disqualified';
  if (buffer < 15) return 'Moderate risk if disqualified';
  return 'Low risk (adequate buffer exists)';
}

function generateHeadline(policies, industry, alertCount = 0) {
  // ✅ FIX (Nov 7): Database stores lowercase severity values
  if (policies.some(p => (p.severity || '').toLowerCase() === 'critical')) {
    return alertCount > 0
      ? `⚠️ Critical: ${alertCount} Active Policy Threats + USMCA Risk`
      : `⚠️ Critical Trade Policy Exposure in Your ${industry} Supply Chain`;
  }
  if (alertCount > 0) {
    return `⚠️ ${alertCount} Active Tariff Threats Affecting Your Components`;
  }
  if (policies.length > 0) {
    return `📊 Your Supply Chain is Affected by ${policies.length} Active Tariff Policies`;
  }
  return '✓ Your Supply Chain Has Favorable Policy Positioning';
}

function highestSeverity(policies) {
  // ✅ FIX (Nov 7): Database stores lowercase severity values
  if (policies.some(p => (p.severity || '').toLowerCase() === 'critical')) return 'CRITICAL';
  if (policies.some(p => (p.severity || '').toLowerCase() === 'high')) return 'HIGH';
  return 'MEDIUM';
}

/**
 * ✅ AI-POWERED Executive Advisory Generator
 * Uses Claude 3.5 Sonnet for consulting-grade strategic intelligence
 * NO MORE HARDCODED TEMPLATES
 */
async function generateExecutiveAdvisoryAI(policies, workflow, profile, matchedAlerts = []) {
  const section301Policy = policies.find(p => p.policy === 'Section 301 Tariffs');
  const rvcPolicy = policies.find(p => p.policy === 'USMCA Qualification Risk');

  // Build context for AI - Give it ALL component data (already enriched with tariff rates)
  const components = workflow.components || [];
  const chineseComponents = components.filter(c => c.origin_country === 'China' || c.origin_country === 'CN');
  const totalChineseValue = chineseComponents.reduce((sum, c) => sum + (c.value_percentage || 0), 0);

  const tradeVolume = profile.trade_volume || workflow.trade_volume || 0;
  // ✅ FIX (Nov 12): Extract calculated values correctly (annualCost already includes $ prefix)
  const section301BurdenFormatted = section301Policy?.annual_cost_impact?.annualCost || 'Unable to calculate';
  const section301BurdenAmount = section301Policy?.annual_cost_impact?.annualCost || null;
  const section301Rate = section301Policy?.annual_cost_impact?.ratePercent || 'varies';

  // ✅ Build detailed component breakdown for AI (no lookups needed - all data already here)
  const componentDetails = components.map(c =>
    `  - ${c.description || c.hs_code}: ${c.value_percentage}% of product, Origin: ${c.origin_country}, MFN: ${((c.mfn_rate || 0) * 100).toFixed(1)}%, Section 301: ${((c.section_301 || 0) * 100).toFixed(1)}%, USMCA: ${((c.usmca_rate || 0) * 100).toFixed(1)}%`
  ).join('\n');

  // ✅ Build active policy threats (matched crisis alerts)
  const alertSummary = matchedAlerts.length > 0
    ? matchedAlerts.map(alert =>
        `  - [${alert.severity}] ${alert.title} (effective ${alert.effective_date}): ${alert.description}`
      ).join('\n')
    : 'No active policy alerts';

  // ✅ OPTIMIZED (Nov 7): Match portfolio briefing narrative style
  const prompt = `You are a Trade Compliance Director writing a strategic briefing for ${profile.company_name}'s operations team about tariff impacts and IMMEDIATE certification issues.

COMPONENTS (${components.length} total):
${components.map(c => `• ${c.description || c.hs_code} (${c.origin_country}) - ${c.value_percentage}% | HS: ${c.hs_code} | MFN: ${((c.mfn_rate || 0) * 100).toFixed(1)}% | Section 301: ${((c.section_301 || 0) * 100).toFixed(1)}%`).join('\n')}

CURRENT STATUS:
• Trade Volume: $${tradeVolume.toLocaleString()} | USMCA: ${workflow.usmca_qualified ? `✅ Qualified (RVC ${workflow.north_american_content}%)` : '❌ Not Qualified'}
• Savings: $${workflow.current_annual_savings?.toLocaleString() || '0'}/year${chineseComponents.length > 0 ? `\n• Section 301 Burden: ${section301BurdenFormatted} (${chineseComponents.length} Chinese components = ${totalChineseValue}% of value)` : ''}

${matchedAlerts.length > 0 ? `ACTIVE POLICY THREATS (${matchedAlerts.length}):
${matchedAlerts.map(a => `• [${a.severity}] ${a.title} (${a.effective_date})`).join('\n')}` : ''}

Write an expressive, narrative briefing - tell their supply chain STORY with personality and strategic insight about certification risks and immediate impacts.

# Business Impact Summary: ${profile.company_name}

## Certification Status & Immediate Risks
${matchedAlerts.length > 0 ? `Write 2-3 bullets about active policy threats affecting their certification/tariffs. Use emoji (🔴 CRITICAL, 🟠 HIGH, 🟡 MEDIUM). Example: "🔴 Section 301 escalation threatens $${section301Burden} annual burden on Chinese components"` : `Write 2-3 bullets about certification status and tariff exposure. Example: "✅ USMCA qualified saving $${workflow.current_annual_savings?.toLocaleString()}/year" or "⚠️ $${section301Burden} Section 301 burden on ${chineseComponents.length} Chinese components"`}

## Your Certification Situation
Write 2-3 **narrative paragraphs** painting their certification picture. Use exact percentages and dollar amounts (calculate from data - don't invent!). ${matchedAlerts.length > 0 ? 'Weave policy threats naturally.' : 'Focus on current status and immediate risks.'}

Example: "${profile.company_name}'s ${workflow.product_description} sits at an interesting certification crossroads. ${workflow.usmca_qualified ? `USMCA qualification delivers $${workflow.current_annual_savings?.toLocaleString()}/year savings` : 'Missing USMCA qualification leaves money on the table'}, but ${chineseComponents.length > 0 ? `${chineseComponents.length} Chinese components (${totalChineseValue}% of value) create ${section301BurdenFormatted} Section 301 exposure` : 'geographic sourcing creates policy vulnerabilities'}. Current certification strategy faces pressure from recent developments."

## Critical Risks & Opportunities
Write 2-3 paragraphs presenting genuine strategic CHOICES. Frame as "choosing between paths" - show trade-offs, not recommendations. ${chineseComponents.length > 0 ? `Example: "Path A: Accept ${section301BurdenFormatted} Section 301 burden, maintain current suppliers. Path B: Nearshore to Mexico (12-18mo transition) - eliminate Section 301 but face qualification challenges for HS ${chineseComponents[0]?.hs_code}."` : 'Focus on qualification improvement vs maintaining status quo.'}

## 90-Day Action Timeline
Write 2-3 paragraphs describing action path with specific milestones:
- **Week 1-2**: Assessment phase - what data to gather, who to contact
- **Week 3-4**: Trial phase - initial supplier contacts or qualification testing
- **Week 5-12**: Migration phase - full implementation with ROI tracking

Structure around decision gates: "Week 2 is the go/no-go decision point. If data shows viable alternatives, Week 4 begins supplier qualification..."

## What This Means For You
Write 2-3 paragraphs of professional perspective. ${matchedAlerts.length > 0 ? 'Reference policy landscape.' : 'Focus on certification strategy.'} Use informational tone ("data shows", "may help validate" NOT "you must"). Be specific with HS codes and dollar amounts.

---

**Return ONLY markdown. NO JSON. NO code fences.**

RULES: Narrative prose with personality. NEVER invent numbers - use ONLY component data. Readable language ("works beautifully" not "current methodology allows"). Present real trade-offs. Use their HS codes, exact percentages.`;

  try {
    console.log('🤖 Calling AI for executive advisory...');
    const aiResponse = await executiveAgent.execute(prompt, {
      temperature: 0.8  // ✅ Higher temp for expressive narrative writing
    });

    // ✅ FIX (Nov 7): Extract markdown text (BaseAgent returns { success, data })
    const markdownBriefing = typeof aiResponse === 'string'
      ? aiResponse
      : aiResponse.data?.raw || aiResponse.data || aiResponse.text || aiResponse.content || '';

    // ✅ NEW (Nov 9): Sanitize for PDF rendering - remove emoji/special chars
    const sanitizedBriefing = sanitizeForPDFRendering(markdownBriefing);

    console.log('✅ AI-generated executive summary:', {
      markdown_length: sanitizedBriefing.length,
      has_sections: sanitizedBriefing.includes('##'),
      preview: sanitizedBriefing.substring(0, 200),
      emoji_removed: markdownBriefing.length - sanitizedBriefing.length + ' chars'
    });

    // ✅ Return markdown with structured metadata for backward compatibility
    // ✅ FIX (Nov 12): Use calculated values instead of placeholder strings
    // ✅ FIX (Nov 12): Add action_items + strategic_roadmap (AI returns narrative markdown, not structured JSON)
    return {
      situation_brief: sanitizedBriefing, // Full markdown in main field (sanitized)
      markdown_content: sanitizedBriefing, // Also store in dedicated field (sanitized)
      problem: section301BurdenAmount ? `Section 301 burden: ${section301BurdenFormatted}` : 'No Section 301 burden (no Chinese components)',
      annual_impact: section301BurdenFormatted, // Already includes $ prefix
      current_burden: section301BurdenAmount ? `${section301BurdenFormatted}` : '$0/year',
      potential_savings: section301BurdenAmount ? `${section301BurdenFormatted}` : '$0/year',
      confidence: 85,
      // ✅ FIX (Nov 12): These are narrative in markdown, not separate arrays
      // The full text is in situation_brief with sections like "## 90-Day Action Timeline"
      action_items: [
        'Review current Section 301 exposure across all Chinese-origin components',
        'Contact Mexican suppliers for nearshoring alternatives',
        'Review USMCA qualification requirements for component substitutions'
      ],
      strategic_roadmap: [
        { phase: 'Assessment (Weeks 1-2)', description: 'Gather supplier data and tariff exposure calculations' },
        { phase: 'Trial (Weeks 3-4)', description: 'Test Mexican supplier samples and qualification scenarios' },
        { phase: 'Migration (Weeks 5-12)', description: 'Implement sourcing changes and track ROI' }
      ]
    };

  } catch (error) {
    console.error('❌ AI call failed for executive advisory:', error);

    // ⚠️ FALLBACK: Return minimal structure (but flag the failure)
    // ✅ FIX (Nov 12): Use calculated values even in fallback
    return {
      situation_brief: '⚠️ AI generation failed - using fallback',
      problem: `Unable to generate custom advisory. Error: ${error.message}`,
      root_cause: 'AI service temporarily unavailable',
      annual_impact: section301BurdenFormatted || 'Unable to calculate',
      why_now: 'Please retry or contact support',
      current_burden: section301BurdenFormatted || 'Unknown',
      potential_savings: section301BurdenFormatted || 'Calculation unavailable',
      payback_period: 'Unable to estimate',
      confidence: 0,
      strategic_roadmap: [],
      action_items: ['Retry request', 'Contact support if issue persists'],
      broker_insights: 'AI advisor temporarily unavailable'
    };
  }
}

// ========== FINANCIAL SCENARIO ANALYSIS ==========
/**
 * Generate "what-if" scenarios for tariff policy changes
 * Shows user the financial impact if policies escalate or improve
 */
async function generateFinancialScenarios(workflow, policies, profile) {
  const section301Policy = policies.find(p => p.policy === 'Section 301 Tariffs');
  const rvcPolicy = policies.find(p => p.policy === 'USMCA Qualification Risk');

  const scenarios = {
    scenarios: []
  };

  if (section301Policy) {
    // ✅ FIX (Oct 27): Extract actual rate from object instead of hardcoding "25%"
    const costInfo = section301Policy.annual_cost_impact;
    const currentCostStr = costInfo?.annualCost || 'unknown';
    const currentRate = costInfo?.ratePercent || '25%'; // Fallback if not calculated
    const currentCost = extractDollarAmount(currentCostStr);

    scenarios.scenarios.push({
      scenario: `Current State (${currentRate} Section 301)`,
      annual_burden: currentCostStr,
      description: `Your current tariff exposure with existing ${currentRate} Section 301 rate on Chinese components`
    });

    // Scenario: Section 301 increases by 20%
    if (currentCost !== null) {
      const increasedCost = Math.round(currentCost * 1.2); // 20% increase
      const currentRateNum = parseFloat(currentRate) || 25;
      const futureRateNum = (currentRateNum * 1.2).toFixed(1);

      scenarios.scenarios.push({
        scenario: `If Section 301 Increases to ${futureRateNum}%`,
        annual_burden: `$${increasedCost.toLocaleString()}`,
        impact_vs_current: `+$${(increasedCost - currentCost).toLocaleString()}/year additional burden`,
        likelihood: 'Medium (possible with administration change)',
        mitigation: 'Mexico nearshoring eliminates entire exposure'
      });
    }

    // ✅ DYNAMIC: Mexico nearshoring scenario (uses config-based estimates)
    // Extract or estimate Mexico sourcing costs from config
    const mexicoMetrics = MEXICO_SOURCING_CONFIG.calculateMetrics?.(
      profile.industry_sector || 'electronics',
      workflow.product_complexity || 'medium',
      profile.trade_volume || 0
    ) || {
      mexico_cost_premium_percent: 2.0,
      annual_cost_increase: Math.round((profile.trade_volume || 0) * 0.02),
      payback_months: 3
    };

    const nearshoreAnnualCost = Math.round(mexicoMetrics.annual_cost_increase || (profile.trade_volume || 0) * 0.02);
    const nearshorePaybackMonths = mexicoMetrics.payback_months || 3;

    scenarios.scenarios.push({
      scenario: 'If You Nearshore to Mexico',
      annual_burden: 'Eliminated',
      cost_to_implement: `+$${nearshoreAnnualCost.toLocaleString()}/year (${mexicoMetrics.mexico_cost_premium_percent || 2}% unit cost increase)`,
      payback_timeline: `${nearshorePaybackMonths} months (tariff savings offset cost increase)`,
      additional_benefits: '5-8% RVC increase, policy insulation, supply chain resilience',
      competitive_advantage: 'Locks in preferential treatment while competitors remain exposed'
    });

    // Scenario: Tariff exemption (unlikely but possible)
    scenarios.scenarios.push({
      scenario: 'If Exemption Granted (Rare)',
      annual_burden: 'Reduced to $0 (for exempted HS codes only)',
      timeline: '2-4 months (exemption application process)',
      success_rate: 'Low (less than 5% of applications)',
      cost: 'Application fee $1,000-5,000'
    });
  }

  if (rvcPolicy) {
    const currentRVC = workflow.north_american_content || 0;
    const threshold = workflow.threshold_applied || 60;

    scenarios.scenarios.push({
      scenario: `Current RVC: ${currentRVC}% (Buffer: ${currentRVC - threshold}%)`,
      risk_level: currentRVC - threshold < 5 ? 'CRITICAL' : currentRVC - threshold < 10 ? 'HIGH' : 'MODERATE',
      description: `Qualification is safe but has limited margin against threshold increases`
    });

    // Scenario: Threshold increase (2026 renegotiation)
    const proposedThreshold = 70; // Example threshold for scenario planning
    if (currentRVC < proposedThreshold) {
      const newBuffer = currentRVC - proposedThreshold;
      scenarios.scenarios.push({
        scenario: `If Threshold Increases to ${proposedThreshold}% (Scenario for 2026 Renegotiation)`,
        qualification_status: newBuffer < 0 ? '❌ WOULD NOT QUALIFY' : '⚠️ MINIMUM BUFFER',
        buffer: `${newBuffer}% margin`,
        estimated_cost_if_disqualified: `$${(workflow.trade_volume * (workflow.mfn_rate_avg || 0.03)).toLocaleString()}/year`,
        mitigation: 'Nearshore high-value components to Mexico suppliers now'
      });
    }

    // Scenario: Mexico nearshoring for RVC
    scenarios.scenarios.push({
      scenario: 'If You Nearshore Key Components to Mexico',
      new_rvc: `${Math.min(currentRVC + 12, 95)}%`,
      new_buffer: `${Math.min(currentRVC + 12, 95) - 70}% (comfortable margin)`,
      timeline: '8-12 weeks for supplier transition',
      cost_impact: '+1-2% input costs (offset by RVC buffer + policy insulation)'
    });
  }

  return scenarios;
}

// ========== CBP COMPLIANCE STRATEGY ==========
/**
 * Provides specific U.S. Customs and Border Protection (CBP) guidance
 * Including binding ruling strategy, documentation requirements, and audit prevention
 */
function generateCBPGuidance(workflow, policies, profile) {
  const section301Policy = policies.find(p => p.policy === 'Section 301 Tariffs');
  const rvcPolicy = policies.find(p => p.policy === 'USMCA Qualification Risk');

  return {
    title: 'CBP Compliance Intelligence for USMCA Qualification',
    urgency: highestSeverity(policies),
    legal_disclaimer: '⚠️ This section provides regulatory intelligence for informational purposes only. Consult a licensed customs broker or trade attorney for compliance advice.'
  };
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Extract dollar amount from formatted string like "$43,750 annually"
 */
function extractDollarAmount(str) {
  if (typeof str !== 'string') return null;
  const match = str.match(/\$(\d+(?:,\d{3})*)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return null;
}
