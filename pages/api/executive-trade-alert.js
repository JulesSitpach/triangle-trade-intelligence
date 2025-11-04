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

// Initialize agents
const executiveAgent = new BaseAgent({
  name: 'ExecutiveAdvisor',
  model: 'anthropic/claude-haiku-4.5',  // ✅ Haiku 4.5 for cost-effective consulting-grade output
  maxTokens: 3000  // Longer responses for strategic depth
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

    // ✅ TIER-GATING: Alerts are PAID-ONLY feature
    // Trial users should NOT access real-time crisis alerts
    // Starter, Professional, Premium, and Enterprise tiers get alerts
    const subscriptionTier = user_profile?.subscription_tier || 'Trial';
    // Database stores exact values: "Trial", "Starter", "Professional", "Premium", "Enterprise"
    const isPaidTier = ['Starter', 'Professional', 'Premium', 'Enterprise'].includes(subscriptionTier);

    // ✅ DEBUG: Log tier information to diagnose 403 errors
    console.log('📋 [EXECUTIVE-ALERT] Tier Check:', {
      received_tier: user_profile?.subscription_tier,
      normalized_tier: subscriptionTier,
      fallback_applied: !user_profile?.subscription_tier,
      is_paid: isPaidTier,
      blocked_tier: 'Trial',
      allowed_tiers: ['Starter', 'Professional', 'Premium', 'Enterprise']
    });

    if (!isPaidTier) {
      return res.status(403).json({
        success: false,
        error: 'UPGRADE_REQUIRED',
        code: 'ALERTS_REQUIRE_PAID_SUBSCRIPTION',
        message: 'Real-time crisis alerts are available only with Starter plan ($99/month) or higher',
        required_tier: 'Starter',
        current_tier: subscriptionTier,
        upgrade_url: '/pricing',
        upgrade_benefits: [
          'Real-time tariff policy alerts affecting your products',
          'Section 301/232 tariff escalation notifications',
          'USMCA rule change monitoring',
          'Strategic mitigation recommendations',
          'Full editable certificates (unwatermarked)',
          'Starter: $99/month for 10 analyses + alerts',
          'Professional: $299/month for 100 analyses + priority support',
          'Premium: $599/month + quarterly strategy calls'
        ]
      });
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

    // ========== STEP 1: Identify Which Policies Affect User's Products ==========

    // Get their HS codes
    const userHSCodes = (workflow_intelligence.components || [])
      .map(c => c.hs_code)
      .filter(Boolean);

    // ✅ No fallbacks - fields validated above
    const userIndustry = user_profile.industry_sector;
    const userDestination = user_profile.destination_country;
    const hasChineseComponents = (workflow_intelligence.components || [])
      .some(c => c.origin_country === 'China' || c.origin_country === 'CN');

    // Map of policies and which industries/origins they affect
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
        description: `Your current RVC (${workflow_intelligence.north_american_content}%) exceeds the requirement but has limited buffer. Proposed rule changes could raise thresholds to 70%+.`,
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

    // ========== STEP 2: Generate ONE Executive Advisory ==========

    const headline = generateHeadline(applicablePolicies, userIndustry);
    const executiveAdvisory = await generateExecutiveAdvisoryAI(
      applicablePolicies,
      workflow_intelligence,
      user_profile
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
      strategic_roadmap: executiveAdvisory.strategic_roadmap || [],
      action_this_week: executiveAdvisory.action_items || [],
      cbp_compliance_strategy: cbpGuidance, // NEW: Regulatory guidance
      policies_affecting_you: applicablePolicies.map(p => p.policy),
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

    return res.status(200).json({
      success: true,
      alert: alertStructure,
      policies_analyzed: applicablePolicies.length,
      applicable_policies: applicablePolicies
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

function generateHeadline(policies, industry) {
  if (policies.some(p => p.severity === 'CRITICAL')) {
    return `⚠️ Critical Trade Policy Exposure in Your ${industry} Supply Chain`;
  }
  if (policies.length > 0) {
    return `📊 Your Supply Chain is Affected by ${policies.length} Active Tariff Policies`;
  }
  return '✓ Your Supply Chain Has Favorable Policy Positioning';
}

function highestSeverity(policies) {
  if (policies.some(p => p.severity === 'CRITICAL')) return 'CRITICAL';
  if (policies.some(p => p.severity === 'HIGH')) return 'HIGH';
  return 'MEDIUM';
}

/**
 * ✅ AI-POWERED Executive Advisory Generator
 * Uses Claude 3.5 Sonnet for consulting-grade strategic intelligence
 * NO MORE HARDCODED TEMPLATES
 */
async function generateExecutiveAdvisoryAI(policies, workflow, profile) {
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

  // ✅ CONSULTING-GRADE AI PROMPT ($599/mo Premium tier quality)
  const prompt = `You are a senior trade compliance strategist advising ${profile.contact_person || 'the CEO'} at ${profile.company_name || 'the company'} on tariff policy risks.

**CLIENT PROFILE:**
- Company: ${profile.company_name || 'Client company'}
- Contact: ${profile.contact_person || 'Decision maker'}
- Business Type: ${profile.business_type || 'Manufacturer'}
- Industry: ${profile.industry_sector || 'Manufacturing'}
- Location: ${profile.company_country || 'Not specified'}
- Primary Supplier Country: ${profile.supplier_country || 'Multiple'}

**PRODUCT & TRADE:**
- Product: ${workflow.product_description || 'Manufacturing product'}
- Shipping To: ${profile.destination_country || 'US'}
- Annual Trade Volume: ${tradeVolume > 0 ? `$${tradeVolume.toLocaleString()}` : 'Not provided (CRITICAL: ask for this)'}

**CURRENT USMCA STATUS:**
- Qualified: ${workflow.usmca_qualified ? 'YES' : 'NO'}
- North American Content: ${workflow.north_american_content || 0}%
- Required Threshold: ${workflow.threshold_applied || 65}%
- Safety Margin: ${((workflow.north_american_content || 0) - (workflow.threshold_applied || 65)).toFixed(1)}%
- Preference Criterion: ${workflow.preference_criterion || 'Not specified'}
- Current Annual Savings from USMCA: ${workflow.current_annual_savings > 0 ? `$${workflow.current_annual_savings.toLocaleString()}` : 'Not calculated'}
- Monthly Savings: ${workflow.monthly_savings > 0 ? `$${workflow.monthly_savings.toLocaleString()}` : 'Not calculated'}

**COMPLETE COMPONENT BREAKDOWN (all tariff rates already calculated):**
${componentDetails}

${workflow.strategic_insights ? `**STRATEGIC CONTEXT FROM ANALYSIS:**
${workflow.strategic_insights}
` : ''}

**SUPPLY CHAIN EXPOSURE:**
${chineseComponents.length > 0 ? `
- Chinese Components: ${chineseComponents.length} components (${totalChineseValue}% of product value)
- Section 301 Tariff Rate: ${section301Rate}
- Current Annual Burden: ${section301Burden}
- Components affected: ${chineseComponents.map(c => c.description || c.hs_code).join(', ')}
` : '- No Chinese components identified'}

${rvcPolicy ? `
**RVC RISK:**
- Current RVC: ${workflow.north_american_content}%
- Required Threshold: ${rvcPolicy.impact}
- Buffer: ${workflow.north_american_content - (workflow.threshold_applied || 65)}%
` : ''}

**YOUR TASK:**
Generate a personalized CEO-level strategic advisory for ${profile.company_name || 'this client'}. Write as if you're speaking directly to ${profile.contact_person || 'the CEO'}.

This is a Premium client paying $599/month - give them consulting-grade intelligence, not generic templates.

Respond in JSON format:
{
  "situation_brief": "1-sentence executive summary addressing ${profile.company_name || 'the company'} specifically",
  "problem": "What specific tariff/policy risk affects ${profile.company_name || 'this company'}'s margins (use actual numbers from context)",
  "root_cause": "Why ${profile.company_name || 'this company'} is exposed (reference their specific sourcing decisions and supplier countries)",
  "annual_impact": "Dollar impact on ${profile.company_name || 'this company'} - ONLY state the Section 301 burden they currently pay (e.g., $743,750/year). DO NOT add USMCA savings to this number.",
  "why_now": "Why ${profile.contact_person || 'they'} should care NOW (specific policy timeline or risk event)",
  "current_burden": "Current Section 301 tariff cost in dollars (e.g., $743,750/year on Chinese components). This is what they already pay TODAY - do not add USMCA savings to this number.",
  "potential_savings": "What they could save by nearshoring to eliminate Section 301 exposure (e.g., $743,750/year if all Chinese components moved to Mexico)",
  "payback_period": "Realistic timeline to recover nearshoring investment costs (based on their trade volume)",
  "confidence": 85,
  "strategic_roadmap": [
    {
      "phase": "Phase 1: Assessment (Weeks 1-2)",
      "why": "Why this phase matters for ${profile.company_name || 'this company'} (NO emojis)",
      "actions": ["Specific action 1 for ${profile.company_name || 'this company'}", "Specific action 2 with measurable outcome"],
      "impact": "Expected outcome in dollars or percentages for ${profile.company_name || 'this company'}"
    },
    {
      "phase": "Phase 2: Trial Production (Weeks 3-4)",
      "why": "Business rationale specific to their situation (NO emojis)",
      "actions": ["Concrete action with supplier names", "Measurable deliverable"],
      "impact": "Quantifiable result"
    },
    {
      "phase": "Phase 3: Full Migration (Weeks 5-8)",
      "why": "Strategic benefit for their business (NO emojis)",
      "actions": ["Specific implementation step", "Risk mitigation action"],
      "impact": "Final outcome with numbers"
    }
  ],
  "action_items": [
    "Immediate action for ${profile.company_name || 'this company'} with specific supplier/country names (NO emojis, professional tone)",
    "Second action with concrete deliverable and timeline",
    "Third action with measurable financial or compliance outcome"
  ],
  "broker_insights": "Professional customs broker perspective in formal business language (NO emojis)",
  "professional_disclaimer": "IMPORTANT: This analysis provides strategic intelligence based on current tariff data and trade regulations. ${profile.company_name || 'The company'} should consult with a licensed customs broker, trade attorney, or USMCA compliance specialist to verify all calculations, timelines, and regulatory requirements before implementing any strategic changes. We recommend engaging professional advisors familiar with ${profile.industry_sector || 'your industry'} sector for implementation planning."
}

CRITICAL RULES - PROFESSIONAL FORMATTING:
- NO EMOJIS - Use professional business language only
- ADDRESS ${profile.company_name || 'the company'} BY NAME throughout the advisory
- Reference ${profile.contact_person || 'the decision maker'} when discussing actions or decisions
- Mention their specific supplier country (${profile.supplier_country || 'current suppliers'}) and industry (${profile.industry_sector || 'their industry'})
- NO generic templates ("Review alternatives", "Monitor changes")
- USE actual numbers from context (trade volume, Section 301 rates, component percentages, current savings)
- Reference their current USMCA savings ($${workflow.current_annual_savings?.toLocaleString() || '0'}) to show what they're protecting
- If trade_volume is missing/zero, FLAG THIS PROMINENTLY in annual_impact and current_burden

⚠️ CRITICAL TARIFF MATH RULE:
- DO NOT add Section 301 burden + USMCA savings together!
- Section 301 burden ($${section301Burden}) = what they CURRENTLY pay on Chinese components
- USMCA savings ($${workflow.current_annual_savings?.toLocaleString() || '0'}) = what they CURRENTLY save by being qualified
- These are SEPARATE numbers - do NOT create a "$826,625 total exposure" by adding them
- Correct framing: "Current burden: $743,750/year. If USMCA disqualified, total tariff cost increases to ~$1.2M (you lose $82,875 savings + MFN rates apply)"
- Incorrect framing: "Total exposure: $826,625 ($743,750 + $82,875)" - this is NOT how tariffs work!

⚠️ CURRENT DATE CONTEXT:
- Today is November 2025
- When discussing future policy changes, use "2025-2026" NOT "2024-2025"
- Presidential transitions occur in January 2025, so we're in the NEW administration period
- USMCA is up for review in 2026 (not 2024)
- Be specific: "Contact Foxconn Mexico for PCB quotes" not "Review Mexico suppliers"
- Calculate ROI: If saving $50K/year and nearshoring costs $20K, payback is 4-5 months
- Write as if you're their personal trade advisor who knows their business intimately
- Use professional consulting language (like McKinsey, Deloitte reports)
- Format numbers properly: $2,800,000 not "$2.8M", 3 months not "3-month payback"

⚠️ COST PREMIUM REALISM:
- DO NOT assume Mexico cost parity is guaranteed
- Correct framing: "Phase 1 will validate whether Mexico suppliers can deliver 2-3% cost parity. If premium exceeds 4%, payback extends to 8+ months and strategy requires re-evaluation."
- Incorrect framing: "assuming ${profile.contact_person || 'the decision maker'} can negotiate within 2-3%" - sounds like a given
- Be realistic about supplier qualification risks, quality validation timelines, and volume commitment requirements
- If cost premium data is unavailable, state "Phase 1 will establish actual cost premium - initial supplier quotes required before finalizing ROI"

⚠️ CRITICAL: AVOID REPETITION - Each field should add NEW information:
- Do NOT repeat the same dollar amount ($1,785,000) in multiple fields
- Do NOT repeat "65% RVC" or "0% buffer" in every field
- Do NOT repeat "Chinese microprocessor" or "Section 301" in every sentence
- VARY how you present information:
  * situation_brief: High-level risk summary
  * problem: Specific compliance/tariff issue (mention RVC/buffer ONCE)
  * root_cause: Sourcing decision explanation (mention supplier country ONCE)
  * annual_impact: Total financial exposure (state dollar amount ONCE)
  * current_burden: Breakdown/calculation (can reference same number differently)
  * potential_savings: Future state outcome (focus on benefit, not cost repeat)
- Each strategic_roadmap phase should focus on DIFFERENT aspects (qualification, trial, migration)
- Each action_item should be DISTINCT (no duplicate supplier contacts)`;

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
      why: 'Proposed rules could raise thresholds to 70%+; current buffer is thin',
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

    // Scenario: Threshold increase to 70%
    if (currentRVC < 70) {
      const newBuffer = currentRVC - 70;
      scenarios.scenarios.push({
        scenario: 'If Threshold Increases to 70% (Proposed for 2026)',
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
    title: 'CBP Compliance Strategy for USMCA Qualification',
    urgency: highestSeverity(policies),

    // IMMEDIATE ACTIONS (This week/month)
    immediate_actions: [
      {
        action: 'File Binding Ruling Request (CBP Form 29)',
        why: 'Lock in RVC classification and preference criterion for 3 years',
        timeline: '90 days processing (submit within 2 weeks to plan supply chain transition)',
        impact: 'Eliminates audit risk, allows penalty-free supplier transitions',
        required_docs: [
          'Current bill of materials with % by origin',
          'Manufacturing process description',
          'Labor and overhead allocation methodology',
          'Supplier origin certificates',
          'Trade volume and market context'
        ],
        expected_cost: '$2,000-5,000 legal/consulting fees',
        success_rate: '85%+ when well-documented'
      },
      {
        action: 'Audit Supplier Documentation',
        why: 'Verify all suppliers have valid origin certification (must support USMCA claim)',
        timeline: 'Immediate - before next shipment',
        what_to_verify: [
          'Suppliers have valid Certificates of Origin on file',
          'USMCA component suppliers declare preferential origin status',
          'Manufacturing location matches claim (not transshipment)',
          'Value-added activity documented (labor, overhead, etc.)'
        ],
        audit_findings_template: 'Request written attestation from each supplier confirming they meet USMCA origin requirements',
        non_compliance_risk: 'CBP can retroactively deny USMCA treatment and demand back tariffs (interest + penalties)'
      }
    ],

    // SHORT-TERM STRATEGY (Next 1-3 months)
    short_term_strategy: [
      {
        action: 'Establish Freight Forwarder USMCA Protocol',
        why: 'Ensure all shipments include USMCA declarations and proper Certificates of Origin',
        requirement: 'Freight forwarder must complete "USMCA Claim" box on entry documents',
        documentation: 'Keep copies of all CF 434 (Certificate of Origin) forms for 5 years (CBP audit retention requirement)',
        risk: 'Missing USMCA declaration = automatic full tariff collection + interest',
        cost: '$500-1,000 to train forwarder and establish procedure'
      },
      {
        action: 'Set Up Internal USMCA Tracking System',
        why: 'Document every product batch with RVC calculation and component origins',
        what_to_track: [
          'Invoice date and HS code',
          'Component origins and percentages',
          'RVC calculation and method (Transaction Value vs Net Cost)',
          'Manufacturing location and labor credit',
          'Shipment-level USMCA declarations'
        ],
        audit_readiness: 'CBP typically audits 1 in 500 entries. When selected, you must provide this documentation within 30 days or pay back tariffs',
        typical_penalty: '$50,000+ in back tariffs + 40% penalty if documentation insufficient'
      }
    ],

    // RISK MANAGEMENT (Ongoing)
    risk_management: [
      {
        risk: 'Supplier Location Changes',
        mitigation: 'If supplier moves location or sources components differently, binding ruling could be invalidated',
        action: 'Notify CBP within 30 days of any supplier change that affects RVC'
      },
      {
        risk: 'Threshold Changes',
        mitigation: 'Section 301 rates can change with 30-day notice. If increased significantly, consider exemption request',
        action: 'Monitor USTR calendar for tariff changes. Subscribe to CBP alerts at cbp.gov'
      },
      {
        risk: 'Audit Selection',
        mitigation: 'Companies with high trade volume or policy-impacted products are audit targets',
        action: 'Maintain perfect documentation. Companies with binding rulings have 90% lower audit penalty rates'
      }
    ],

    // REGULATORY CALENDAR
    regulatory_calendar: [
      {
        event: 'USTR Tariff Review Cycle',
        date: 'Typically Q1 and Q3 each year',
        impact: 'Section 301 rates can be modified with 30-day notice',
        action: 'Monitor announcements at ustr.gov'
      },
      {
        event: 'CBP Binding Ruling Decisions',
        date: '90 days from filing',
        impact: 'Once approved, valid for 3 years unless CBP modifies policy',
        action: 'File immediately if planning supply chain changes'
      },
      {
        event: 'USMCA Compliance Audits',
        date: 'Year-round, random selection',
        impact: 'CBP selects ~0.2% of USMCA entries for audit',
        action: 'Maintain audit-ready documentation at all times'
      }
    ],

    // WHO TO CONTACT
    contacts: {
      'CBP Binding Ruling': {
        office: 'CBP Office of Trade (OT) - NAFTA/USMCA Division',
        phone: '(877) CBP-5511',
        email: 'USMCA@cbp.dhs.gov',
        website: 'cbp.gov/trade'
      },
      'USTR Tariff Questions': {
        office: 'Office of the U.S. Trade Representative',
        phone: '(202) 395-3000',
        website: 'ustr.gov'
      },
      'International Trade Compliance': {
        type: 'Recommended: Hire licensed customs broker or trade counsel',
        investment: '$1,000-3,000 one-time (binding ruling + documentation audit)',
        savings: 'Prevents $50,000+ penalty exposure'
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
