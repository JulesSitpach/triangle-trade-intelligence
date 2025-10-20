
/**
 * POST /api/consolidate-alerts
 * Intelligent alert consolidation - groups related policy changes
 * Returns consolidated analysis with calibrated urgency and clear cost math
 *
 * Example: 3 alerts about Chinese components → 1 consolidated "China Risk"
 */

import { createClient } from '@supabase/supabase-js';
import { logDevIssue, DevIssue } from '../../lib/utils/logDevIssue.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { alerts, user_profile } = req.body;

    if (!alerts || !user_profile) {
      await DevIssue.missingData('consolidate_alerts_api', 'alerts or user_profile', {
        endpoint: '/api/consolidate-alerts',
        hasAlerts: !!alerts,
        hasUserProfile: !!user_profile,
        alertsCount: alerts?.length || 0
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: alerts and user_profile'
      });
    }

    console.log(`🧠 Consolidating ${alerts.length} alerts for ${user_profile.companyName}`);

    // Group related alerts by common themes
    const alertGroups = groupRelatedAlerts(alerts, user_profile);

    console.log(`📊 Grouped into ${alertGroups.length} consolidated alerts`);

    // Analyze each group with AI for consolidated impact assessment
    const consolidatedAlerts = await Promise.all(
      alertGroups.map(group => analyzeAlertGroup(group, user_profile))
    );

    // Sort by calibrated urgency (not everything is 10/10)
    const sortedAlerts = consolidatedAlerts.sort((a, b) => {
      const urgencyOrder = { 'URGENT': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 };
      return (urgencyOrder[a.urgency] || 5) - (urgencyOrder[b.urgency] || 5);
    });

    return res.status(200).json({
      success: true,
      consolidated_alerts: sortedAlerts,
      original_count: alerts.length,
      consolidated_count: sortedAlerts.length
    });

  } catch (error) {
    console.error('❌ Error consolidating alerts:', error);
    await DevIssue.apiError('consolidate_alerts_api', '/api/consolidate-alerts', error, {
      hasAlerts: !!req.body?.alerts,
      hasUserProfile: !!req.body?.user_profile,
      alertsCount: req.body?.alerts?.length || 0,
      company: req.body?.user_profile?.companyName || 'unknown'
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to consolidate alerts',
      error: error.message
    });
  }
}

/**
 * Group related alerts by:
 * - Same country/region
 * - Same component types
 * - Related policy types (Section 301 + Port Fees = same China issue)
 */
function groupRelatedAlerts(alerts, userProfile) {
  const groups = [];

  // Extract user's components for matching
  const userComponents = userProfile.componentOrigins || [];
  const userCountries = [...new Set(userComponents.map(c => c.origin_country || c.country))];

  console.log('🔍 User countries:', userCountries);
  console.log('🔍 User components:', userComponents.map(c => c.component_type || c.description));

  // Group by country + component combination
  const countryGroups = {};

  alerts.forEach(alert => {
    // Find which user countries this alert affects
    const affectedUserCountries = alert.affected_countries?.filter(c =>
      userCountries.includes(c)
    ) || [];

    // Find which user components this alert affects
    const affectedComponents = userComponents.filter(comp => {
      const compCountry = comp.origin_country || comp.country;
      const compHSCode = comp.hs_code;

      // Match by country
      const countryMatch = affectedUserCountries.includes(compCountry);

      // Match by HS code (first 4 digits)
      const hsCodeMatch = compHSCode && alert.affected_hs_codes?.some(alertHS =>
        compHSCode.startsWith(alertHS.substring(0, 4))
      );

      return countryMatch || hsCodeMatch;
    });

    if (affectedComponents.length > 0) {
      // Group key: country + component types
      const groupKey = affectedUserCountries.join(',') + ':' +
                      affectedComponents.map(c => c.component_type || c.description).join(',');

      if (!countryGroups[groupKey]) {
        countryGroups[groupKey] = {
          key: groupKey,
          affected_countries: affectedUserCountries,
          affected_components: affectedComponents,
          alerts: []
        };
      }

      countryGroups[groupKey].alerts.push(alert);
    } else {
      // Alert doesn't affect user - skip it
      console.log(`⏭️ Skipping alert "${alert.title}" - doesn't affect user's components`);
    }
  });

  // Convert to array
  return Object.values(countryGroups);
}

/**
 * Analyze a group of related alerts with AI
 * Returns ONE consolidated alert with clear cost calculation
 */
async function analyzeAlertGroup(group, userProfile) {
  try {
    const affectedComponents = group.affected_components || [];
    const alerts = group.alerts || [];

    // Calculate total percentage affected
    const totalPercentageAffected = affectedComponents.reduce((sum, c) =>
      sum + (c.percentage || c.value_percentage || 0), 0
    );

    // ========== QUERY USER'S WORKFLOW ANALYSIS FOR RICH PERSONALIZED DATA ==========
    // Instead of asking AI to make up generic advice, use the detailed analysis already generated
    let workflowIntelligence = null;
    if (userProfile.userId) {
      try {
        const { data: workflowData, error } = await supabase
          .from('workflow_completions')
          .select('workflow_data')
          .eq('user_id', userProfile.userId)
          .order('completed_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && workflowData?.workflow_data) {
          workflowIntelligence = {
            recommendations: workflowData.workflow_data.recommendations || [],
            detailed_analysis: workflowData.workflow_data.detailed_analysis || {},
            usmca_status: workflowData.workflow_data.usmca?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
            regional_content: workflowData.workflow_data.usmca?.north_american_content || 0,
            threshold_required: workflowData.workflow_data.usmca?.threshold_applied || 0,
            savings_data: workflowData.workflow_data.savings || {}
          };

          console.log(`✅ Found workflow intelligence: ${workflowIntelligence.recommendations.length} recommendations, ${Object.keys(workflowIntelligence.detailed_analysis).length} analysis sections`);
        }
      } catch (queryError) {
        console.warn('⚠️ Could not query workflow intelligence:', queryError.message);
        // Continue without workflow intelligence - will generate from scratch
      }
    }

    // CRITICAL FIX: Build component context WITH REAL TARIFF DATA to prevent AI hallucinations
    const componentContext = affectedComponents.map(c => {
      // Extract real tariff data from cached enrichment
      const baseMFN = c.mfn_rate || c.tariff_rates?.mfn_rate || 0;
      const section301 = c.section_301 || c.tariff_rates?.section_301 || 0;
      const totalRate = c.total_rate || c.tariff_rates?.total_rate || baseMFN;
      const usmcaRate = c.usmca_rate || c.tariff_rates?.usmca_rate || 0;

      // Build detailed tariff breakdown for AI
      let tariffInfo = '';
      if (section301 > 0) {
        tariffInfo = ` | Base MFN: ${baseMFN}% + Section 301: ${section301}% = Total: ${totalRate}% | USMCA: ${usmcaRate}%`;
      } else if (baseMFN > 0) {
        tariffInfo = ` | MFN: ${baseMFN}% | USMCA: ${usmcaRate}%`;
      }

      return `- ${c.component_type || c.description}: ${c.percentage || c.value_percentage}% from ${c.origin_country || c.country} (HS ${c.hs_code || 'unknown'})${tariffInfo}`;
    }).join('\n');

    // Build alerts context (what policies are affecting these components)
    const alertsContext = alerts.map(a => {
      return `- ${a.title}: ${a.tariff_adjustment || 'Policy change'} (${a.category})`;
    }).join('\n');

    // ========== BUILD WORKFLOW INTELLIGENCE CONTEXT ==========
    // Use rich personalized data from user's workflow analysis instead of making up generic advice
    let workflowContext = '';
    if (workflowIntelligence) {
      const { recommendations, detailed_analysis, usmca_status, regional_content, threshold_required, savings_data } = workflowIntelligence;

      // Extract key recommendations (focus on ones relevant to affected components)
      const relevantRecommendations = recommendations
        .filter(rec => {
          const recLower = rec.toLowerCase();
          // Filter for recommendations about Chinese components, Section 301, supplier alternatives, etc.
          return recLower.includes('section 301') ||
                 recLower.includes('chinese') ||
                 recLower.includes('supplier') ||
                 recLower.includes('usmca') ||
                 recLower.includes('mexico') ||
                 recLower.includes('canada') ||
                 recLower.includes('north american');
        })
        .slice(0, 8); // Max 8 most relevant recommendations

      const recommendationsList = relevantRecommendations.length > 0
        ? relevantRecommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n')
        : 'No specific recommendations available';

      // Extract savings analysis with real dollar amounts
      const savingsAnalysis = detailed_analysis.savings_analysis || 'No savings analysis available';

      workflowContext = `

=== EXISTING WORKFLOW INTELLIGENCE (USE THIS RICH DATA!) ===
**Current USMCA Status**: ${usmca_status} (${regional_content}% NA content, threshold: ${threshold_required}%)

**Existing Cost Analysis**:
${savingsAnalysis}

**Existing Strategic Recommendations** (CRITICAL - Use these insights, don't make up generic advice):
${recommendationsList}

**YOUR TASK**: Synthesize the above existing analysis in the context of these NEW policy changes.
- Reference specific dollar amounts and supplier locations from the existing analysis
- Build on the strategic insights already provided
- Show how the NEW policy changes affect the existing recommendations
- DO NOT repeat obvious advice like "find suppliers" - user already has detailed supplier recommendations above
- DO NOT make up generic scenarios - use the specific analysis provided above
`;
    }

    const prompt = `You are a trade policy analyst providing CONSOLIDATED impact analysis.

=== USER BUSINESS CONTEXT ===
Company: ${userProfile.companyName}
Business Type: ${userProfile.businessType}
Product: ${userProfile.productDescription}
Annual Trade Volume: $${userProfile.tradeVolume || userProfile.annual_trade_volume || 'unknown'}

=== AFFECTED COMPONENTS (${totalPercentageAffected}% of product) ===
${componentContext}

=== RELATED POLICY CHANGES (Multiple alerts consolidated) ===
${alertsContext}${workflowContext}

=== ANALYSIS REQUIRED ===

Provide ONE CONSOLIDATED analysis that:

1. **Groups related issues** - Don't treat Section 301 + Port Fees + Transshipment as 3 separate crises
2. **Calibrates urgency** - Not everything is 10/10
3. **Clarifies cost math** - One total impact, not duplicated amounts
4. **Skips obvious advice** - No "contact Crisis Navigator" or "find other suppliers" (they already know)
5. **Extracts specifics** - What's ACTUALLY new and actionable from these policies
6. **Broker Summary** - Start with conversational, plain-English summary (4-6 sentences, ~150 words max)

**Consolidated Title**: (Short, clear summary of the grouped issue)
Example: "China Microcontroller Risk (Consolidated)" not "Section 301 Tariffs on Chinese Imports"

**Broker Summary** (CRITICAL - This appears at the top):
Write like an experienced customs broker talking to a client over coffee:
- Start with the bad news plainly (no sugarcoating)
- Explain the timeline realistically (urgent vs. emergency vs. strategic planning)
- Give clear recommendation with reasoning
- End with specific action to take this week
- Tone: professional but conversational, like talking to a colleague
- Length: 4-6 sentences, ~150 words max
- Avoid jargon, use analogies if helpful
- Be direct, no corporate speak

Example: "Here's the situation: Section 301 tariffs on Chinese steel just jumped 25 percentage points. Based on your $10M annual volume and 40% Chinese steel content, this adds roughly $1M to your annual costs. The timeline here is important. This takes effect January 1st, which gives you 8-10 weeks to plan your response. Not a fire drill, but you need to move. I'd recommend getting quotes from USMCA suppliers immediately. Yes, the material will cost 15-20% more (~$400K premium on $4M steel), but you'll eliminate the $1M tariff hit AND qualify for duty-free USMCA treatment. Net result: you save ~$600K annually. Time to make some calls."

**Real Urgency Level + Timeline**:
- URGENT: Immediate action required → Timeline: "Days to weeks" → Effective date in <30 days
- HIGH: Strategic planning required → Timeline: "2-3 months" → Effective date 30-90 days
- MEDIUM: Long-term monitoring → Timeline: "6-12 months" → Effective date 3-12 months
- LOW: Background awareness → Timeline: "Monitor ongoing" → No specific effective date

CRITICAL: Urgency and timeline must align! Don't say "HIGH urgency" and then "Not urgent"

**Effective Date**: Specific date when policy takes effect (e.g., "January 1, 2025", "October 31, 2025", "60 days after publication")

**Clear Cost Calculation** (CRITICAL - Avoid Circular Math):
- Calculate ONCE for all related policies
- CORRECT approach when Annual Trade Volume is known:
  Example: Annual Trade Volume = $10M
  → Chinese steel (40% of product) = $10M × 0.40 = $4M
  → Section 301 tariff (25%) = $4M × 0.25 = $1M annual cost
  → Show: "~$1M annually (25% Section 301 on $4M Chinese steel component)"

- If Annual Trade Volume is UNKNOWN:
  → State clearly: "Unable to calculate dollar impact without annual trade volume"
  → Show percentage impact: "25% tariff on 40% of product = X% total cost increase"
  → Recommend user provide volume for accurate cost estimate

- ❌ NEVER use circular logic like: "$1.92M tariff on $1.92M steel component"
  (This is circular - where did $1.92M come from? You need the base annual volume!)

- Include confidence level and WHY (explain the confidence score)

**Mitigation Scenarios** (Side-by-side comparison of options):
Provide 2-4 realistic mitigation strategies with cost comparison:
- Option 1: Status Quo (do nothing) - costs and consequences
- Option 2: USMCA Suppliers - costs, timeline, benefits, tradeoffs
- Option 3: Alternative Countries (Vietnam, India) - costs, timeline, benefits, tradeoffs
- Option 4: (Optional) Hybrid approach or exemption request

For each scenario include:
- title: Short name (e.g., "Switch to USMCA Suppliers")
- cost_impact: Annual cost change (e.g., "+$200K annually" or "-$1.5M savings")
- timeline: How long to implement (e.g., "3-4 months transition")
- benefit: Primary advantage (e.g., "Eliminate $2M tariff, qualify for USMCA")
- tradeoffs: Array of considerations (e.g., ["15-20% higher material cost", "Need quality approval process"])
- recommended: boolean (mark the best option)

**What You Probably Already Know** (skip this in recommendations):
- Need to diversify suppliers (duh)
- Should explore USMCA qualification (obvious)
- Consider Mexico alternatives (they get it)

**What You Might NOT Know** (focus recommendations here):
- Specific exemption windows or deadlines
- Tariff rate combinations (how Section 301 + MFN stack)
- Specific HS codes affected that you didn't realize
- Alternative sourcing strategies beyond the obvious

Return ONLY valid JSON:
{
  "consolidated_title": "China Steel Component Risk (Consolidated)",
  "broker_summary": "Use the example above as a guide. Calculate real costs using: Annual Volume × Component % × Tariff Rate. Show your math clearly.",
  "urgency": "HIGH",
  "timeline": "2-3 months",
  "effective_date": "January 1, 2025",
  "urgency_reasoning": "Requires strategic supplier changes and contract renegotiation, not emergency action. Timeline allows proper vetting and transition before Jan 1 effective date.",
  "affected_components": [
    {
      "component": "Steel Housing",
      "percentage": 40,
      "origin": "CN",
      "hs_code": "7326.90.85"
    }
  ],
  "consolidated_impact": {
    "total_annual_cost": "$XXX,XXX",
    "confidence": "high/medium/low",
    "confidence_explanation": "CRITICAL: Use the EXACT tariff rates provided in the component data above. Do NOT hallucinate rates. Explain how you calculated the cost based on the provided rates + annual volume.",
    "breakdown": "CRITICAL: Calculate using the REAL Section 301 rate from component data (e.g., 25%), NOT a made-up rate. Show: Base MFN + Section 301 = Total Rate.",
    "stack_explanation": "Explain how tariffs stack (Base MFN + Section 301 = Total), using the ACTUAL rates from the component data above, NOT assumed rates."
  },
  "mitigation_scenarios": [
    {
      "title": "Status Quo (Do Nothing)",
      "cost_impact": "+$XXX,XXX annually (calculate from: Annual Volume × Component % × Tariff Rate)",
      "timeline": "Immediate",
      "benefit": "No transition effort required",
      "tradeoffs": ["Double your component cost", "Lose competitive advantage", "Competitors will move faster"],
      "recommended": false
    },
    {
      "title": "Switch to USMCA Suppliers",
      "cost_impact": "-$1.6M net savings",
      "timeline": "3-4 months transition",
      "benefit": "Eliminate $2M tariff, qualify for USMCA duty-free",
      "tradeoffs": ["Material costs 15-20% more ($288K-$384K)", "Need supplier qualification", "Potential quality approval delays"],
      "recommended": true
    },
    {
      "title": "Alternative Countries (India/Vietnam)",
      "cost_impact": "-$800K savings",
      "timeline": "2-3 months transition",
      "benefit": "Lower material costs than USMCA, avoid Section 301",
      "tradeoffs": ["Still pay regular MFN tariffs", "Longer shipping times", "No USMCA benefits"],
      "recommended": false
    }
  ],
  "explanation": "Section 301 tariffs affect 40% of your supply chain (Chinese steel housing). Effective January 1, 2025, adding $1.98M annually to component costs. This is a 100% tariff that doubles the landed cost of these parts.",
  "what_you_know": [
    "Need to diversify from China",
    "Mexico manufacturing could help USMCA qualification"
  ],
  "what_you_might_not_know": [
    "Section 301 (100%) stacks on top of existing MFN rates for HS 7326.90.85",
    "You have until January 1 to transition - that's 10 weeks, enough time but no room for delays",
    "Indian suppliers can match China pricing but you'll still pay 6.8% MFN tariff (better than 100%)"
  ],
  "specific_action_items": [
    "Request quotes from 3-4 USMCA steel fabricators by end of this week",
    "Review HS 7326.90.85 classification - verify this is correct code for your housing",
    "Calculate exact cost comparison: Mexico supplier premium vs. $2M tariff savings",
    "Schedule quality approval timeline with engineering team (plan for 4-6 weeks)"
  ],
  "related_alerts": ["Section 301 Tariffs on Steel", "China Trade War Escalation"]
}

CRITICAL RULES:
- ONE consolidated impact calculation (not 3 separate amounts)
- Realistic urgency (not everything is URGENT)
- Skip obvious recommendations
- Focus on specific, actionable, non-obvious insights
- Explain how tariffs/fees stack or don't stack
- ALWAYS include broker_summary at the top (conversational, plain English)
- ALWAYS include effective_date (when policy takes effect)
- ALWAYS include confidence_explanation (why this confidence score)
- ALWAYS include mitigation_scenarios (2-4 options with cost comparison)`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4.5", // Sonnet 4.5 for intelligent consolidation (user-facing)
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.3 // Slight creativity for professional consolidation while staying accurate
      })
    });

    if (!response.ok) {
      await logDevIssue({
        type: 'api_error',
        severity: 'critical',
        component: 'consolidate_alerts_api',
        message: 'OpenRouter API failed for alert consolidation',
        data: {
          status: response.status,
          company: userProfile.companyName,
          alertCount: alerts.length
        }
      });
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      await logDevIssue({
        type: 'api_error',
        severity: 'high',
        component: 'consolidate_alerts_api',
        message: 'Empty AI response for alert consolidation',
        data: {
          company: userProfile.companyName,
          alertCount: alerts.length
        }
      });
      throw new Error('No response from AI');
    }

    // Parse AI response
    let analysis;
    try {
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        analysis = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', aiResponse);
      await DevIssue.apiError('consolidate_alerts_api', 'analyzeAlertGroup (parsing)', parseError, {
        company: userProfile.companyName,
        alertCount: alerts.length,
        responsePreview: aiResponse?.substring(0, 200)
      });
      throw new Error('Invalid JSON from AI');
    }

    console.log(`✅ Consolidated analysis: ${analysis.consolidated_title} (${analysis.urgency})`);

    // ========== CRITICAL: VALIDATE AI NUMBERS AGAINST COMPONENT TARIFF DATA ==========
    // Prevent AI hallucinations like claiming "100% Section 301" when cache shows 25%
    if (analysis.consolidated_impact?.breakdown || analysis.broker_summary) {
      const combinedText = `${analysis.consolidated_impact?.breakdown || ''} ${analysis.broker_summary || ''}`;

      // Extract percentage claims from AI text (e.g., "100%", "25%")
      const percentageMatches = combinedText.match(/(\d+\.?\d*)%/g) || [];
      const aiPercentages = percentageMatches.map(p => parseFloat(p.replace('%', '')));

      // Get actual cached rates from affected components
      const cachedRates = affectedComponents.map(c => ({
        baseMFN: c.mfn_rate || c.tariff_rates?.mfn_rate || 0,
        section301: c.section_301 || c.tariff_rates?.section_301 || 0,
        totalRate: c.total_rate || c.tariff_rates?.total_rate || (c.mfn_rate || 0),
        component: c.component_type || c.description
      }));

      // Check if AI claimed any rates significantly different from cache (>10% deviation)
      const significantDeviations = aiPercentages.filter(aiRate => {
        const matchesAnyCache = cachedRates.some(cached =>
          Math.abs(aiRate - cached.baseMFN) < 1 ||  // Matches base MFN
          Math.abs(aiRate - cached.section301) < 1 || // Matches Section 301
          Math.abs(aiRate - cached.totalRate) < 1     // Matches total rate
        );

        return !matchesAnyCache && aiRate > 10; // AI claimed a rate >10% that doesn't match cache
      });

      if (significantDeviations.length > 0) {
        console.warn('⚠️ AI VALIDATION WARNING (ALERTS): AI claimed tariff rates not found in component cache:', significantDeviations);

        await DevIssue.unexpectedBehavior(
          'consolidate_alerts_api',
          `AI claimed tariff rates (${significantDeviations.join('%, ')}%) not matching component cached data`,
          {
            company: userProfile.companyName,
            ai_percentages: aiPercentages,
            cached_rates: cachedRates,
            deviations: significantDeviations,
            broker_summary_preview: analysis.broker_summary?.substring(0, 300),
            breakdown_preview: analysis.consolidated_impact?.breakdown
          }
        );

        // Add validation warning to alert
        analysis._validation_warning = `AI claimed rates ${significantDeviations.join('%, ')}% not found in component tariff cache. Verify with real cached data before trusting cost estimates.`;
      } else {
        console.log('✅ AI tariff numbers validated against component cache - no significant deviations');
      }
    }

    return {
      id: `consolidated-${group.key}`,
      title: analysis.consolidated_title || 'Consolidated Policy Alert',
      broker_summary: analysis.broker_summary || '',
      urgency: analysis.urgency || 'MEDIUM',
      timeline: analysis.timeline || '',
      effective_date: analysis.effective_date || '',
      urgency_reasoning: analysis.urgency_reasoning || '',
      affected_components: analysis.affected_components || affectedComponents,
      consolidated_impact: analysis.consolidated_impact || {},
      mitigation_scenarios: analysis.mitigation_scenarios || [],
      explanation: analysis.explanation || '',
      what_you_know: analysis.what_you_know || [],
      what_you_might_not_know: analysis.what_you_might_not_know || [],
      specific_action_items: analysis.specific_action_items || [],
      related_alerts: analysis.related_alerts || alerts.map(a => a.title),
      original_alert_count: alerts.length
    };

  } catch (error) {
    console.error('❌ Alert group analysis error:', error.message);
    return {
      id: `consolidated-${group.key}`,
      title: 'Policy Alert Analysis Failed',
      urgency: 'MEDIUM',
      explanation: 'Unable to consolidate alerts - please review individually',
      error: error.message
    };
  }
}
