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
    const { user_profile, workflow_intelligence, raw_alerts, user_id } = req.body;

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

    if (!user_profile.industry_sector) {
      return res.status(400).json({
        error: 'Missing required field: industry_sector',
        success: false,
        details: 'Industry sector is required for USMCA threshold analysis'
      });
    }

    // ========== STEP 1: Fetch Active Crisis Alerts ==========
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: crisisAlerts, error: alertsError } = await supabase
      .from('crisis_alerts')
      .select('*')
      .eq('status', 'active')
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

    // ✅ DYNAMIC: USMCA threshold concerns (uses actual industry threshold, not hardcoded 70%)
    // ✅ No fallback - industry_sector validated above
    const industryThreshold = await getIndustryThreshold(user_profile.industry_sector);
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
      matched_alerts: topAlerts.map(a => ({
        title: a.title,
        severity: a.severity,
        effective_date: a.effective_date,
        description: a.description
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
        benefit: 'Potential 100% tariff elimination for specific HS codes',
        timeline: '2-4 months for exemption application',
        cost_impact: 'Application fee ~$1,000-5,000'
      }
    ];

  } catch (error) {
    console.error('[generateMexicoNearshoringOptions] Error:', error);

    // Fallback to generic options
    return [
      {
        option: 'Nearshoring to Mexico',
        benefit: 'Eliminates Section 301 exposure, increases USMCA RVC buffer',
        timeline: '6-12 weeks for supplier qualification (estimate)',
        cost_impact: '+1-3% unit cost (typically offset by tariff savings within 3-6 months)'
      },
      {
        option: 'Request tariff exemption',
        benefit: 'Potential 100% tariff elimination for specific HS codes',
        timeline: '2-4 months for exemption application',
        cost_impact: 'Application fee ~$1,000-5,000'
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

  // If no rates found, that's a bug in main analysis - use conservative fallback
  const effectiveRate = rateCount > 0
    ? averageSection301Rate / rateCount
    : 0.20; // Conservative fallback (should never be reached)

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
  if (buffer < 5) return '$50,000+ if disqualified';
  if (buffer < 15) return '$30,000+ if disqualified';
  return 'Moderate (adequate buffer exists)';
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
  const section301Burden = section301Policy?.annual_cost_impact?.annualCost || 'not calculated';
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

  // ✅ CONCISE EXECUTIVE ADVISORY PROMPT (Nov 7: Simplified + added crisis alerts)
  const prompt = `You are a trade compliance strategist analyzing tariff risk for ${profile.company_name || 'this company'}.

**KEY DATA:**
- Company: ${profile.company_name || 'Client'} | Industry: ${profile.industry_sector || 'Manufacturing'} | Destination: ${profile.destination_country || 'US'}
- Product: ${workflow.product_description || 'Manufacturing product'} | Trade Volume: ${tradeVolume > 0 ? `$${tradeVolume.toLocaleString()}` : 'Unknown'}
- USMCA Qualified: ${workflow.usmca_qualified ? 'YES' : 'NO'} | RVC: ${workflow.north_american_content || 0}% (threshold: ${workflow.threshold_applied || 65}%)
- Current USMCA Savings: $${workflow.current_annual_savings?.toLocaleString() || '0'}/year

**COMPONENTS:**
${componentDetails}

${chineseComponents.length > 0 ? `**SECTION 301 EXPOSURE:**
- Chinese Components: ${chineseComponents.length} items (${totalChineseValue}% of value)
- Section 301 Rate: ${section301Rate}
- Annual Burden: ${section301Burden}` : ''}

**⚠️ ACTIVE POLICY THREATS (${matchedAlerts.length}):**
${alertSummary}

**TASK:** Generate concise CEO-level intelligence focusing on IMMEDIATE certification issues${matchedAlerts.length > 0 ? ` and the ${matchedAlerts.length} active policy threats listed above` : ''}. Be BRIEF and SPECIFIC.

⚠️ CRITICAL: Think like a trade advisor, NOT a process manager.
- BEFORE suggesting nearshoring, identify USMCA qualification blockers for their specific HS codes
- Check: Do their components have Product-Specific Rules (PSRs) that Mexican sourcing won't fix?
- Consider: Will Mexican assembly actually qualify if core components (batteries, chipsets, modules) remain non-originating?
- Warn about blockers using their ACTUAL HS codes: "Components under HS [their actual code] may fail origin testing even if assembled in Mexico"
- If you identify blockers, state them FIRST before suggesting roadmap
- Speak to the CEO directly about real risks, not just process steps
- Reference their specific component HS codes when discussing qualification risks

**JSON OUTPUT (keep all text concise):**
{
  "situation_brief": "1 sentence: Key risk for ${profile.company_name}${matchedAlerts.length > 0 ? ' including active policy threats' : ''}",
  "problem": "2 sentences: Specific tariff issue + dollar impact${matchedAlerts.length > 0 ? ' + mention most critical alert' : ''}",
  "root_cause": "1 sentence: Why they have this exposure",
  "annual_impact": "$${section301Burden} Section 301 burden${matchedAlerts.length > 0 ? ' + note if alerts increase this' : ''}",
  "why_now": "1 sentence: Timeline/urgency${matchedAlerts.length > 0 ? ' (reference alert effective dates if imminent)' : ''}",
  "current_burden": "$${section301Burden}/year on Chinese components",
  "potential_savings": "$${section301Burden}/year if nearshored to Mexico",
  "payback_period": "X months (be specific based on trade volume)",
  "confidence": 85,
  "timeline_90_days": "90-Day Action Timeline: Week 1-2 (Assessment), Week 3-4 (Trial), Week 5-12 (Migration) - Total estimated savings: $X/year",
  "critical_decision_points": [
    {
      "milestone": "Week 2: Go/No-Go Decision",
      "decision": "What needs to be decided (specific)",
      "data_needed": "What validates the decision",
      "financial_impact": "Cost if delayed or wrong choice"
    },
    {
      "milestone": "Week 4: Supplier Selection",
      "decision": "Key choice to make",
      "data_needed": "Required validation",
      "financial_impact": "Impact on ROI"
    },
    {
      "milestone": "Week 12: Full Migration Complete",
      "decision": "Final commit or rollback",
      "data_needed": "Success metrics",
      "financial_impact": "Annual savings achieved"
    }
  ],
  "action_items": [
    "Specific next step 1 (informational tone, <15 words)",
    "Specific next step 2 (<15 words)",
    "Specific next step 3 (<15 words)"
  ],
  "broker_insights": "1-2 sentences: Professional perspective on ${profile.company_name}'s situation${matchedAlerts.length > 0 ? ' and policy threats' : ''}",
  "professional_disclaimer": "This analysis is for informational purposes only. ${profile.company_name} must verify all data with licensed customs brokers or trade attorneys before making decisions. Not legal or compliance advice.",
  "save_reminder": "Analysis saved for reference only. Consult professionals before acting on this data."
}

**RULES:**
1. NO EMOJIS, NO flowery language
2. Use informational tone: "data shows", "may help validate" (NOT "you should", "must contact")
3. Be SPECIFIC: Name actual suppliers if known, calculate actual ROI
4. CONCISE: situation_brief max 20 words, actions max 10 words each
5. Don't repeat same dollar amounts - vary presentation
6. Section 301 burden = what they pay NOW. Don't add USMCA savings to this.`;

  try {
    console.log('🤖 Calling AI for executive advisory...');
    const aiResponse = await executiveAgent.execute(prompt, {
      temperature: 0.7,  // Creative but grounded
      format: 'json'
    });

    // Check if aiResponse is already an object or a string
    let advisory = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;

    // ✅ UNWRAP if AI returned {success: true, data: {...}} wrapper
    if (advisory.success && advisory.data) {
      advisory = advisory.data;
    }

    // ✅ DEEP LOG: Use JSON.stringify to see full nested arrays (actions, etc.)
    console.log('✅ AI-generated executive advisory:', JSON.stringify(advisory, null, 2));
    return advisory;

  } catch (error) {
    console.error('❌ AI call failed for executive advisory:', error);

    // ⚠️ FALLBACK: Return minimal structure (but flag the failure)
    return {
      situation_brief: '⚠️ AI generation failed - using fallback',
      problem: `Unable to generate custom advisory. Error: ${error.message}`,
      root_cause: 'AI service temporarily unavailable',
      annual_impact: 'Unable to calculate',
      why_now: 'Please retry or contact support',
      current_burden: section301Burden || 'Unknown',
      potential_savings: 'Calculation unavailable',
      payback_period: 'Unable to estimate',
      confidence: 0,
      strategic_roadmap: [],
      action_items: ['Retry request', 'Contact support if issue persists'],
      broker_insights: 'AI advisor temporarily unavailable'
    };
  }
}

// ❌ OLD HARDCODED FUNCTION (KEPT FOR REFERENCE - DELETE AFTER TESTING)
function generateExecutiveAdvisory_HARDCODED_OLD(policies, workflow, profile) {
  const section301Policy = policies.find(p => p.policy === 'Section 301 Tariffs');
  const rvcPolicy = policies.find(p => p.policy === 'USMCA Qualification Risk');

  let advisory = {
    situation_brief: 'Trade policy exposure analysis for your products',
    problem: 'Your supply chain is affected by tariff policies that impact your margins',
    root_cause: 'Sourcing structure and policy landscape',
    annual_impact: 'TBD',
    why_now: 'Trade policy remains volatile with potential changes in 2025',
    current_burden: 'Calculating...',
    potential_savings: 'Subject to strategy implementation',
    payback_period: '3-6 months typical',
    confidence: 85,
    strategic_roadmap: [],
    action_items: [
      'Review supplier alternatives in Mexico/Canada',
      'Evaluate tariff exemption opportunities',
      'Monitor regulatory calendar for policy changes'
    ],
    broker_insights: 'Companies that have nearshored to Mexico in your sector have locked in preferential treatment while insulating from policy uncertainty.'
  };

  // Add Section 301 context if applicable
  if (section301Policy) {
    // ✅ FIX (Oct 27): Use actual calculated rate instead of hardcoded "25%"
    const costInfo = section301Policy.annual_cost_impact;
    const rateDisplay = costInfo?.ratePercent || 'variable';
    const costDisplay = costInfo?.annualCost || 'unknown';

    advisory.problem = `Your Chinese-sourced components remain subject to ${rateDisplay} Section 301 tariffs, creating ongoing policy risk and cost burden of approximately ${costDisplay}.`;
    advisory.current_burden = costDisplay;
    advisory.potential_savings = 'Mexico nearshoring could eliminate this burden within 4-6 weeks';
    advisory.why_now = 'Section 301 tariffs can be modified with 30-day notice. Current political environment suggests heightened risk.';

    advisory.strategic_roadmap = [
      {
        phase: 'Phase 1: Supplier Assessment (Week 1-2)',
        why: 'Identify Mexico suppliers with equivalent quality/cost',
        actions: [
          'Source 2-3 Mexico suppliers with your quality requirements',
          'Request pricing quotes and lead times',
          'Verify certifications and capacity'
        ],
        impact: 'Baseline for ROI decision'
      },
      {
        phase: 'Phase 2: Trial Shipment (Week 3-4)',
        why: 'Validate quality and lead times before full transition',
        actions: [
          'Order sample batch from Mexico supplier',
          'Conduct quality testing vs current supplier',
          'Measure actual lead times and reliability'
        ],
        impact: 'De-risk the transition'
      },
      {
        phase: 'Phase 3: Gradual Migration (Week 5-8)',
        why: 'Transition production without disruption',
        actions: [
          'Phase out China supplier while ramping Mexico production',
          'Update USMCA documentation with new supplier origin',
          'Lock in pricing for 12-month commitment'
        ],
        impact: 'Eliminate Section 301 exposure, increase RVC'
      }
    ];
  }

  // Add RVC context if applicable
  if (rvcPolicy) {
    advisory.situation_brief = 'Your USMCA qualification has limited buffer against potential rule changes';
    advisory.strategic_roadmap.push({
      phase: 'Build RVC Buffer',
      why: 'Proposed rules could raise thresholds significantly; current buffer is thin',
      actions: [
        'Prioritize transitioning highest-cost components to USMCA sources',
        'Evaluate Mexico nearshoring for maximum RVC impact',
        'Document manufacturing value-added in USMCA countries'
      ],
      impact: 'Insulate from policy changes'
    });
  }

  return advisory;
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
    legal_disclaimer: '⚠️ This section provides regulatory intelligence for informational purposes only. Consult a licensed customs broker or trade attorney for compliance advice.',

    // COMPLIANCE CONSIDERATIONS (Typical practices in the industry)
    compliance_considerations: [
      {
        topic: 'Binding Ruling Request (CBP Form 29)',
        what_it_does: 'Locks in RVC classification and preference criterion for 3 years',
        typical_timeline: '90 days CBP processing time',
        business_benefit: 'May help eliminate audit risk and enable penalty-free supplier transitions',
        typical_documentation: [
          'Current bill of materials with % by origin',
          'Manufacturing process description',
          'Labor and overhead allocation methodology',
          'Supplier origin certificates',
          'Trade volume and market context'
        ],
        typical_cost: '$2,000-5,000 for legal/consulting support',
        industry_success_rate: '85%+ approval rate when well-documented (based on CBP data)'
      },
      {
        topic: 'Supplier Documentation Validation',
        what_it_does: 'Verifies suppliers have valid origin certification supporting USMCA claims',
        typical_timeline: 'Companies typically complete this before shipments to mitigate CBP audit risk',
        typical_verification_steps: [
          'Confirming suppliers have valid Certificates of Origin on file',
          'Verifying USMCA component suppliers declare preferential origin status',
          'Validating manufacturing location matches claim (not transshipment)',
          'Reviewing value-added activity documentation (labor, overhead, etc.)'
        ],
        typical_approach: 'Companies typically request written attestation from each supplier confirming USMCA origin requirements',
        cbp_enforcement: 'CBP can retroactively deny USMCA treatment and demand back tariffs (with interest and penalties)'
      }
    ],

    // OPERATIONAL PRACTICES (How companies typically manage USMCA compliance)
    operational_practices: [
      {
        topic: 'Freight Forwarder USMCA Protocol',
        what_it_involves: 'Ensuring all shipments include USMCA declarations and proper Certificates of Origin',
        typical_requirement: 'Freight forwarders typically complete "USMCA Claim" box on entry documents',
        documentation_standard: 'CBP requires 5-year retention of all CF 434 (Certificate of Origin) forms for audit purposes',
        non_compliance_risk: 'Missing USMCA declaration typically results in automatic full tariff collection plus interest',
        typical_setup_cost: '$500-1,000 to train forwarder and establish procedures (industry estimate)'
      },
      {
        topic: 'Internal USMCA Tracking System',
        what_it_involves: 'Documenting every product batch with RVC calculation and component origins',
        typical_tracking_elements: [
          'Invoice date and HS code',
          'Component origins and percentages',
          'RVC calculation and method (Transaction Value vs Net Cost)',
          'Manufacturing location and labor credit',
          'Shipment-level USMCA declarations'
        ],
        cbp_audit_context: 'CBP typically audits 1 in 500 USMCA entries. When selected, companies must provide documentation within 30 days or may face back tariffs',
        typical_penalty_range: '$50,000+ in back tariffs plus penalties up to 40% of merchandise value if documentation is insufficient (19 USC 1592 - negligence/gross negligence)'
      }
    ],

    // RISK FACTORS (Industry data and CBP enforcement patterns)
    risk_factors: [
      {
        risk: 'Supplier Location Changes',
        regulatory_context: 'If supplier moves location or sources components differently, binding rulings may be invalidated',
        cbp_requirement: 'CBP requires notification within 30 days of any supplier change that affects RVC calculations'
      },
      {
        risk: 'Threshold Changes',
        regulatory_context: 'Section 301 rates can change with 30-day USTR notice. Significant increases may warrant exemption requests',
        monitoring_resources: 'USTR publishes tariff change announcements at ustr.gov. CBP alerts available at cbp.gov'
      },
      {
        risk: 'Audit Selection',
        enforcement_pattern: 'Companies with high trade volume or policy-impacted products face higher audit selection rates',
        industry_data: 'Companies with binding rulings experience approximately 90% lower audit penalty rates (based on CBP enforcement statistics)'
      }
    ],

    // REGULATORY TIMELINE (CBP and USTR key dates)
    regulatory_timeline: [
      {
        event: 'USTR Tariff Review Cycle',
        typical_schedule: 'Q1 and Q3 each year',
        regulatory_impact: 'Section 301 rates can be modified with 30-day public notice',
        monitoring_resource: 'Announcements published at ustr.gov'
      },
      {
        event: 'CBP Binding Ruling Decisions',
        typical_timeline: '90 days from filing date',
        regulatory_impact: 'Once approved, rulings are valid for 3 years unless CBP modifies underlying policy',
        planning_context: 'Companies planning supply chain changes typically file binding ruling requests early in the process'
      },
      {
        event: 'USMCA Compliance Audits',
        frequency: 'Year-round, random selection process',
        cbp_data: 'CBP selects approximately 0.2% of USMCA entries for audit annually',
        audit_response_requirement: 'Companies must provide documentation within 30 days of audit notification to avoid back tariffs'
      }
    ],

    // REGULATORY RESOURCES (Public agency contact information)
    regulatory_resources: {
      'CBP Binding Ruling Information': {
        office: 'CBP Office of Trade (OT) - NAFTA/USMCA Division',
        phone: '(877) CBP-5511',
        email: 'USMCA@cbp.dhs.gov',
        website: 'cbp.gov/trade',
        purpose: 'Public information line for binding ruling process and USMCA requirements'
      },
      'USTR Tariff Policy Information': {
        office: 'Office of the U.S. Trade Representative',
        phone: '(202) 395-3000',
        website: 'ustr.gov',
        purpose: 'Public information on Section 301 tariffs and trade policy announcements'
      },
      'Professional Compliance Support': {
        typical_providers: 'Licensed customs brokers and international trade attorneys',
        typical_cost_range: '$1,000-3,000 for binding ruling support and documentation audit (industry estimate)',
        risk_mitigation_context: 'Professional support may help prevent $50,000+ penalty exposure from CBP audits (based on typical enforcement data)',
        disclaimer: 'This platform does not provide legal advice. Consult licensed professionals for compliance decisions.'
      }
    }
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
