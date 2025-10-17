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

    // Build component context
    const componentContext = affectedComponents.map(c => {
      return `- ${c.component_type || c.description}: ${c.percentage || c.value_percentage}% from ${c.origin_country || c.country} (HS ${c.hs_code || 'unknown'})`;
    }).join('\n');

    // Build alerts context (what policies are affecting these components)
    const alertsContext = alerts.map(a => {
      return `- ${a.title}: ${a.tariff_adjustment || 'Policy change'} (${a.category})`;
    }).join('\n');

    const prompt = `You are a trade policy analyst providing CONSOLIDATED impact analysis.

=== USER BUSINESS CONTEXT ===
Company: ${userProfile.companyName}
Business Type: ${userProfile.businessType}
Product: ${userProfile.productDescription}
Annual Trade Volume: $${userProfile.tradeVolume || userProfile.annual_trade_volume || 'unknown'}

=== AFFECTED COMPONENTS (${totalPercentageAffected}% of product) ===
${componentContext}

=== RELATED POLICY CHANGES (Multiple alerts consolidated) ===
${alertsContext}

=== ANALYSIS REQUIRED ===

Provide ONE CONSOLIDATED analysis that:

1. **Groups related issues** - Don't treat Section 301 + Port Fees + Transshipment as 3 separate crises
2. **Calibrates urgency** - Not everything is 10/10
3. **Clarifies cost math** - One total impact, not duplicated amounts
4. **Skips obvious advice** - No "contact Crisis Navigator" or "find other suppliers" (they already know)
5. **Extracts specifics** - What's ACTUALLY new and actionable from these policies

**Consolidated Title**: (Short, clear summary of the grouped issue)
Example: "China Microcontroller Risk (Consolidated)" not "Section 301 Tariffs on Chinese Imports"

**Real Urgency Level**:
- URGENT: Immediate action required (days) - Only for critical supply disruptions
- HIGH: Address within 2-4 weeks - Most policy changes fall here
- MEDIUM: Plan for next quarter - Long-term strategic shifts
- LOW: Monitor for now - Doesn't significantly impact business

**Clear Cost Calculation**:
- Calculate ONCE for all related policies
- Example: "~$550K annually (25% tariff on $2.2M Chinese components)"
- NOT: "$500K Section 301 + $300K port fees + $200K transshipment" (that's confusing)

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
  "consolidated_title": "China Component Risk (Consolidated)",
  "urgency": "HIGH",
  "urgency_reasoning": "Policy effective Oct 31, affects 40% of supply chain, but not immediate disruption",
  "affected_components": [
    {
      "component": "Microcontrollers",
      "percentage": 40,
      "origin": "CN",
      "hs_code": "8542.31.00"
    }
  ],
  "consolidated_impact": {
    "total_annual_cost": "$550K",
    "confidence": "medium",
    "breakdown": "25% Section 301 tariff on $2.2M Chinese components. Port fees add ~3% but are separate operational cost, not tariff.",
    "stack_explanation": "Section 301 (25%) applies on top of MFN rate (0%). Port fees (3%) are separate vessel charges, not tariffs."
  },
  "explanation": "New tariffs affect 40% of your supply chain (Chinese microcontrollers). Effective Oct 31, adding ~$550K annually to component costs. Port fees are separate operational costs.",
  "what_you_know": [
    "Need to diversify from China",
    "Mexico manufacturing could help USMCA qualification"
  ],
  "what_you_might_not_know": [
    "Section 301 tariffs stack on MFN rates (total 25% for these HS codes)",
    "Vietnam/Thailand suppliers also under investigation for transshipment",
    "Exemption requests due by Oct 15 (tight deadline)"
  ],
  "specific_action_items": [
    "Review HS 8542.31.00 classification - some subcategories may have lower rates",
    "Check if your current Vietnam supplier is actually manufacturing or just transshipping Chinese goods",
    "File Section 301 exemption request before Oct 15 deadline (only 2 weeks left)"
  ],
  "related_alerts": ["Section 301 Tariffs", "Port Fee Increases", "Transshipment Investigation"]
}

CRITICAL RULES:
- ONE consolidated impact calculation (not 3 separate amounts)
- Realistic urgency (not everything is URGENT)
- Skip obvious recommendations
- Focus on specific, actionable, non-obvious insights
- Explain how tariffs/fees stack or don't stack`;

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

    return {
      id: `consolidated-${group.key}`,
      title: analysis.consolidated_title || 'Consolidated Policy Alert',
      urgency: analysis.urgency || 'MEDIUM',
      urgency_reasoning: analysis.urgency_reasoning || '',
      affected_components: analysis.affected_components || affectedComponents,
      consolidated_impact: analysis.consolidated_impact || {},
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
