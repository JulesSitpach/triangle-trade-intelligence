/**
 * ALERT IMPACT ANALYSIS SERVICE
 * Additive AI analysis - reuses existing workflow analysis + adds alert impact
 * Efficient: Only analyzes NEW threats, not re-computing existing analysis
 */

import { callOpenRouterAI, callAnthropicDirect } from '../ai-helpers';
import { getCountryConfig } from '../usmca/usmca-2026-config';

class AlertImpactAnalysisService {
  /**
   * Generate additive alert impact analysis
   * @param {Object} existingAnalysis - From workflow results page (situation_brief, strategic_roadmap, etc.)
   * @param {Array} consolidatedAlerts - Active alerts from database
   * @param {Object} userProfile - User's company data (companyCountry, componentOrigins, etc.)
   * @returns {Object} Alert impact analysis (what's NEW, not repetitive)
   */
  async generateAlertImpact(existingAnalysis, consolidatedAlerts, userProfile) {
    try {
      console.log('🔍 Generating ADDITIVE alert impact analysis...');

      // 1. Get country-specific USMCA 2026 config
      const countryConfig = getCountryConfig(userProfile.companyCountry);

      // 2. Calculate which components are affected by alerts
      const affectedComponents = this.mapAlertsToComponents(consolidatedAlerts, userProfile.componentOrigins || []);

      // 3. Calculate time to USMCA 2026 review
      const monthsToReview = this.getMonthsUntilReview('2026-07-01');

      // 4. Build efficient prompt (ADDITIVE, not repetitive)
      const prompt = this.buildAdditivePrompt({
        existingAnalysis,
        consolidatedAlerts,
        affectedComponents,
        countryConfig,
        userProfile,
        monthsToReview
      });

      // 5. Call AI (Tier 1: OpenRouter, Tier 2: Anthropic)
      let response;
      try {
        response = await callOpenRouterAI(prompt, {
          model: 'anthropic/claude-3.5-haiku',
          maxTokens: 2000 // Keep response concise
        });
      } catch (error) {
        console.warn('⚠️ OpenRouter failed, trying Anthropic direct...');
        response = await callAnthropicDirect(prompt, {
          model: 'claude-3-5-haiku-20241022',
          maxTokens: 2000
        });
      }

      // 6. Parse and structure response
      const analysis = this.parseAlertImpactResponse(response);

      console.log('✅ Alert impact analysis complete');
      return analysis;

    } catch (error) {
      console.error('❌ Alert impact analysis failed:', error);
      throw error;
    }
  }

  /**
   * Map alerts to specific components in user's product
   */
  mapAlertsToComponents(alerts, components) {
    return alerts.map(alert => {
      const affectedComps = components.filter(comp => {
        // Match by HS code
        const hsMatch = alert.affected_hs_codes?.some(code =>
          comp.hs_code?.startsWith(code.replace(/\./g, '').substring(0, 6))
        );

        // Match by origin country
        const originMatch = alert.affected_countries?.some(country =>
          (comp.origin_country || comp.country)?.toUpperCase() === country.toUpperCase()
        );

        return hsMatch || originMatch;
      });

      return {
        alert,
        affectedComponents: affectedComps,
        totalValueAtRisk: this.calculateValueAtRisk(affectedComps)
      };
    }).filter(item => item.affectedComponents.length > 0); // Only alerts that affect user
  }

  /**
   * Calculate total value at risk from affected components
   */
  calculateValueAtRisk(components) {
    return components.reduce((total, comp) => {
      const percentage = comp.percentage || comp.value_percentage || 0;
      return total + percentage;
    }, 0);
  }

  /**
   * Calculate months until USMCA 2026 review
   */
  getMonthsUntilReview(reviewDate) {
    const now = new Date();
    const review = new Date(reviewDate);
    const diffMs = review - now;
    const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, diffMonths);
  }

  /**
   * Build efficient additive prompt
   */
  buildAdditivePrompt({ existingAnalysis, consolidatedAlerts, affectedComponents, countryConfig, userProfile, monthsToReview }) {
    const hasExistingAnalysis = existingAnalysis && Object.keys(existingAnalysis).length > 0;

    return `You are a senior trade compliance advisor analyzing NEW threats to an existing strategic plan.

IMPORTANT: The company already has a complete analysis (below). DO NOT re-analyze basics.
Focus ONLY on:
1. How NEW alerts impact the EXISTING plan
2. Which priorities change due to alerts
3. NEW actions required
4. Updated timeline with alert deadlines
5. Contingency scenarios for USMCA 2026

${hasExistingAnalysis ? `
EXISTING STRATEGIC PLAN (Already completed - DO NOT repeat):
- Situation: ${existingAnalysis.situation_brief || 'Company has USMCA qualification'}
- Current burden: ${existingAnalysis.current_burden || 'None specified'}
- Potential savings: ${existingAnalysis.potential_savings || 'Not calculated'}
- Strategic roadmap: ${JSON.stringify(existingAnalysis.strategic_roadmap || []).substring(0, 500)}
- Action items: ${JSON.stringify(existingAnalysis.action_items || []).substring(0, 300)}
- Timeline: ${existingAnalysis.payback_period || 'Not specified'}
` : `
EXISTING STRATEGIC PLAN:
- Company has USMCA qualification
- No major strategic initiatives in progress
`}

NEW ALERTS AFFECTING THIS COMPANY (${affectedComponents.length} alert${affectedComponents.length !== 1 ? 's' : ''}):
${affectedComponents.length > 0 ? affectedComponents.map((item, idx) => `
${idx + 1}. ${item.alert.title || item.alert.consolidated_title}
   - Description: ${item.alert.description || item.alert.explanation || 'Policy change affecting trade'}
   - Severity: ${item.alert.severity || item.alert.urgency || 'MEDIUM'}
   - Affects YOUR components: ${item.affectedComponents.map(c =>
     `${c.component_type || c.description} (${c.origin_country || c.country}, ${c.percentage || c.value_percentage}% of value)`
   ).join(', ')}
   - Total value at risk: ${item.totalValueAtRisk}% of product
`).join('\n') : '✅ NO ACTIVE ALERTS - Company is in good standing'}

USMCA 2026 RENEGOTIATION (${countryConfig.fullName} Position):
- Time until review: ${monthsToReview} months (July 2026)
- Your country's position: ${countryConfig.position.toUpperCase()} (${countryConfig.priorities[0]})
- Most likely scenario: ${countryConfig.scenarios.B.name} (${countryConfig.scenarios.B.probability}% probability)
  → ${countryConfig.scenarios.B.description}
- Your current RVC: ${userProfile.regionalContent || 'Unknown'}%
- Industry: ${userProfile.businessType || userProfile.industrySecor || 'Not specified'}

YOUR TASK (Be concise - 500 words max):

${affectedComponents.length > 0 ? `
1. ALERT IMPACT SUMMARY (2-3 sentences):
   - How do these NEW alerts change the company's strategic priorities?
   - What becomes MORE URGENT now?

2. UPDATED PRIORITIES (List only what CHANGES):
   - Which existing actions move up in urgency?
   - What NEW actions are required due to alerts?
   - Format: [URGENT/NEW] Action description

3. UPDATED TIMELINE (Only NEW deadlines):
   - Alert-driven milestones
   - USMCA 2026 preparation deadlines
   - Format: "By [Date]: [Action] (Reason: [Alert/USMCA])"
` : `
1. ALL CLEAR STATUS (2-3 sentences):
   - Confirm no immediate threats
   - Summarize current USMCA compliance status
   - Note: Still monitor for USMCA 2026 changes

2. PROACTIVE RECOMMENDATIONS (2-3 items):
   - Optimization opportunities despite no active threats
   - USMCA 2026 preparation steps
`}

4. USMCA 2026 CONTINGENCY SCENARIOS (3 scenarios):

   Scenario A (${countryConfig.scenarios.A.probability}%): ${countryConfig.scenarios.A.name}
   - What happens: ${countryConfig.scenarios.A.description}
   - Your action: [Brief, specific action]
   - Cost impact: [Estimate]

   Scenario B (${countryConfig.scenarios.B.probability}%): ${countryConfig.scenarios.B.name}
   - What happens: ${countryConfig.scenarios.B.description}
   - Your action: [Brief, specific action]
   - Cost impact: [Estimate]

   Scenario C (${countryConfig.scenarios.C.probability}%): ${countryConfig.scenarios.C.name}
   - What happens: ${countryConfig.scenarios.C.description}
   - Your action: [Brief, specific action]
   - Cost impact: [Estimate]

5. RECOMMENDED NEXT STEP (1 sentence):
   - Single most important action for THIS WEEK

RESPONSE FORMAT (JSON):
{
  "alert_impact_summary": "How alerts change priorities",
  "updated_priorities": ["[URGENT] Action 1", "[NEW] Action 2"],
  "updated_timeline": ["By Jan 2026: Submit USTR comment (USMCA 2026)", "By Mar 2026: Achieve 75% RVC (Alert risk)"],
  "contingency_scenarios": [
    {
      "scenario": "A",
      "name": "${countryConfig.scenarios.A.name}",
      "probability": ${countryConfig.scenarios.A.probability},
      "description": "...",
      "your_action": "...",
      "cost_impact": "..."
    },
    {
      "scenario": "B",
      "name": "${countryConfig.scenarios.B.name}",
      "probability": ${countryConfig.scenarios.B.probability},
      "description": "...",
      "your_action": "...",
      "cost_impact": "..."
    },
    {
      "scenario": "C",
      "name": "${countryConfig.scenarios.C.name}",
      "probability": ${countryConfig.scenarios.C.probability},
      "description": "...",
      "your_action": "...",
      "cost_impact": "..."
    }
  ],
  "next_step_this_week": "Most critical action"
}`;
  }

  /**
   * Parse AI response into structured format
   */
  parseAlertImpactResponse(response) {
    try {
      // Try to parse as JSON first
      if (typeof response === 'string') {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
        return JSON.parse(response);
      }

      return response;
    } catch (error) {
      console.warn('⚠️ Failed to parse JSON response, returning raw:', error);
      // Return structured format even if parsing fails
      return {
        alert_impact_summary: response.toString().substring(0, 500),
        updated_priorities: [],
        updated_timeline: [],
        contingency_scenarios: [],
        next_step_this_week: 'Review alerts and consult with trade advisor'
      };
    }
  }

  /**
   * Calculate financial impact of alert on user's business
   */
  calculateAlertFinancialImpact(alert, affectedComponents, annualTradeVolume) {
    if (!affectedComponents || affectedComponents.length === 0) {
      return { impact: 0, description: 'No direct impact' };
    }

    const totalValueAtRisk = this.calculateValueAtRisk(affectedComponents);
    const valueAtRiskDollars = (annualTradeVolume || 0) * (totalValueAtRisk / 100);

    // Estimate tariff impact (assuming 10% as default if not specified)
    const estimatedTariffRate = alert.impact_percentage || 10;
    const annualCost = valueAtRiskDollars * (estimatedTariffRate / 100);

    return {
      impact: annualCost,
      description: `${totalValueAtRisk}% of product value at risk ($${Math.round(valueAtRiskDollars).toLocaleString()}) × ${estimatedTariffRate}% tariff`,
      components: affectedComponents.map(c => c.component_type || c.description).join(', ')
    };
  }
}

export default new AlertImpactAnalysisService();
