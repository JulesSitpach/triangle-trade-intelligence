/**
 * ALERT IMPACT ANALYSIS SERVICE
 * RETENTION-FOCUSED: Portfolio intelligence that keeps users subscribed
 *
 * Key Features (4 Small Enhancements for Retention):
 * 1. Dollar amounts on priorities - Shows value without decision paralysis
 * 2. "We're monitoring" intelligence - Creates anticipation for next update
 * 3. Portfolio coordination - Shows orchestration across all components
 * 4. Unique platform value - Reminds users this is irreplaceable
 *
 * Philosophy:
 * - Additive AI analysis (reuses existing workflow analysis + adds alert impact)
 * - Efficient (only analyzes NEW threats, not re-computing existing analysis)
 * - Simple (no sales comparisons, ROI frameworks, or competitive anxiety)
 * - Actionable (coordinated strategy, not individual component tasks)
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

      // DEBUG: Log input data
      console.log('📊 INPUT DATA CHECK:');
      console.log('   - consolidatedAlerts count:', consolidatedAlerts?.length);
      console.log('   - userProfile.componentOrigins count:', userProfile.componentOrigins?.length);
      console.log('   - userProfile.tradeVolume:', userProfile.tradeVolume || userProfile.trade_volume);

      if (userProfile.componentOrigins?.length > 0) {
        console.log('   - First component:', {
          description: userProfile.componentOrigins[0].description || userProfile.componentOrigins[0].component_type,
          origin_country: userProfile.componentOrigins[0].origin_country || userProfile.componentOrigins[0].country,
          hs_code: userProfile.componentOrigins[0].hs_code
        });
      }

      // 1. Get country-specific USMCA 2026 config
      const countryConfig = getCountryConfig(userProfile.companyCountry);

      // 2. Calculate which components are affected by alerts
      const affectedComponents = this.mapAlertsToComponents(consolidatedAlerts, userProfile.componentOrigins || []);

      // DEBUG: Log mapping result
      console.log('🎯 ALERT MAPPING RESULT:');
      console.log('   - affectedComponents count:', affectedComponents.length);
      if (affectedComponents.length === 0) {
        console.warn('⚠️ WARNING: NO components matched any alerts!');
        console.warn('   This will cause AI to generate generic advice with no specific data.');
      } else {
        console.log('   - Matched alerts:', affectedComponents.map(item =>
          `"${item.alert.title || item.alert.consolidated_title}" affects ${item.affectedComponents.length} components`
        ));
      }

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
          model: 'anthropic/claude-haiku-4.5',
          maxTokens: 2000 // Keep response concise
        });
      } catch (error) {
        console.warn('⚠️ OpenRouter failed, trying Anthropic direct...');
        response = await callAnthropicDirect(prompt, {
          model: 'claude-haiku-4-20250514',
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
   * Calculate portfolio impact with dollar amounts (RETENTION-FOCUSED)
   */
  calculatePortfolioImpact(affectedComponents, annualTradeVolume) {
    if (!affectedComponents || affectedComponents.length === 0) {
      return {
        summary: 'No components affected by current alerts',
        componentValues: [],
        totalProtected: '$0'
      };
    }

    const componentValues = [];
    let totalValueAtRisk = 0;

    affectedComponents.forEach(item => {
      const valuePercentage = this.calculateValueAtRisk(item.affectedComponents);
      const dollarValue = (annualTradeVolume * valuePercentage) / 100;
      totalValueAtRisk += dollarValue;

      componentValues.push(
        `$${Math.round(dollarValue).toLocaleString()} protected`
      );
    });

    const portfolioPercentage = ((totalValueAtRisk / annualTradeVolume) * 100).toFixed(1);

    return {
      summary: `${affectedComponents.length} of ${affectedComponents[0]?.affectedComponents?.length || 'your'} components affected\nCombined exposure: $${Math.round(totalValueAtRisk).toLocaleString()} of your $${(annualTradeVolume / 1000000).toFixed(1)}M portfolio (${portfolioPercentage}%)`,
      componentValues,
      totalProtected: `$${Math.round(totalValueAtRisk).toLocaleString()}`
    };
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
   * Build efficient additive prompt (RETENTION-FOCUSED)
   */
  buildAdditivePrompt({ existingAnalysis, consolidatedAlerts, affectedComponents, countryConfig, userProfile, monthsToReview }) {
    const hasExistingAnalysis = existingAnalysis && Object.keys(existingAnalysis).length > 0;

    // Calculate portfolio impact with dollar amounts
    const tradeVolume = userProfile.tradeVolume || userProfile.trade_volume || 0;
    if (!tradeVolume || tradeVolume === 0) {
      console.warn('⚠️ trade_volume missing from userProfile - using default value of 0');
    }
    const portfolioImpact = this.calculatePortfolioImpact(affectedComponents, tradeVolume);

    // Build executive summary narrative from detailed_analysis fields
    const executiveSummary = hasExistingAnalysis ? `
${existingAnalysis.situation_brief || ''}

The Problem: ${existingAnalysis.problem || 'Not specified'}

Root Cause: ${existingAnalysis.root_cause || 'Not specified'}

Annual Impact: ${existingAnalysis.annual_impact || 'Not calculated'}

Why Act Now: ${existingAnalysis.why_now || 'Not specified'}

Current Burden: ${existingAnalysis.current_burden || 'Not calculated'}

Potential Savings: ${existingAnalysis.potential_savings || 'Not calculated'}

Payback Period: ${existingAnalysis.payback_period || 'Not specified'}

Recommended Actions:
${(existingAnalysis.action_items || []).map((item, idx) => `${idx + 1}. ${typeof item === 'string' ? item : item.action || item}`).join('\n')}

Strategic Roadmap:
${(existingAnalysis.strategic_roadmap || []).map(phase => `
${phase.phase || phase.name}
${phase.why || ''}
Actions: ${Array.isArray(phase.actions) ? phase.actions.join(', ') : phase.actions || ''}
Impact: ${phase.impact || ''}
`).join('\n')}

From Your Trade Advisor: ${existingAnalysis.broker_insights || 'Continue monitoring trade policy developments.'}
`.trim() : 'Company has USMCA qualification. No major strategic initiatives in progress.';

    return `You are a senior trade compliance advisor providing ONGOING portfolio intelligence for a subscribed client.

RETENTION-FOCUSED APPROACH:
- Show portfolio-wide coordination across all components
- Emphasize "we're monitoring" to create anticipation
- Add dollar amounts to priorities (NOT decision frameworks)
- Highlight unique intelligence they can't get elsewhere

DO NOT:
- Re-analyze what they already know (existing strategic plan below)
- Create sales comparisons or ROI frameworks
- Add competitive anxiety or broker comparisons
- Make them feel overwhelmed

EXISTING STRATEGIC PLAN (Already completed - DO NOT repeat this information):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${executiveSummary}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PORTFOLIO IMPACT (${affectedComponents.length} alert${affectedComponents.length !== 1 ? 's' : ''} this week):
${portfolioImpact.summary}

NEW ALERTS AFFECTING THIS COMPANY:
${affectedComponents.length > 0 ? affectedComponents.map((item, idx) => `
${idx + 1}. ${item.alert.title || item.alert.consolidated_title}
   - Severity: ${item.alert.severity || item.alert.urgency || 'MEDIUM'}
   - Affects: ${item.affectedComponents.map(c =>
     `${c.component_type || c.description} (${c.origin_country || c.country})`
   ).join(', ')}
   - Value protected: ${portfolioImpact.componentValues[idx] || 'calculating...'}
`).join('\n') : '✅ NO ACTIVE ALERTS - Company is in good standing'}

WHAT WE'RE MONITORING FOR YOU:
- ${consolidatedAlerts.length} active policy changes across MX, CA, US
- USMCA 2026 renegotiation proposals (${monthsToReview} months until review)
- CBP audit procedure changes
- Industry-specific regulatory updates for ${userProfile.businessType || userProfile.industry_sector || 'your sector'}

USMCA 2026 INTELLIGENCE (${countryConfig.fullName} Position):
- Time until review: ${monthsToReview} months (July 2026)
- Your country's position: ${countryConfig.position.toUpperCase()} (${countryConfig.priorities[0]})
- Most likely scenario: ${countryConfig.scenarios.B.name} (${countryConfig.scenarios.B.probability}% probability)
  → ${countryConfig.scenarios.B.description}
- Your current RVC: ${userProfile.regionalContent || 'Unknown'}%
- Industry: ${userProfile.businessType || userProfile.industry_sector || 'Not specified'}

YOUR TASK (Keep it simple and actionable - 500 words max):

${affectedComponents.length > 0 ? `
1. PORTFOLIO IMPACT SUMMARY (2-3 sentences):
   - How do these ${affectedComponents.length} alerts affect the portfolio?
   - What's the coordinated response needed?
   - Keep it concrete, not anxiety-inducing

2. UPDATED PRIORITIES (Add dollar amounts, NO decision frameworks):
   - Format: [URGENT - 30 days] Action ($XXX,XXX protected)
   - Format: [NEW - 60 days] Action ($XXX,XXX protected)
   - Show portfolio coordination (e.g., "all 4 suppliers" not "contact supplier")

3. MONITORING INTELLIGENCE (Create anticipation):
   - What policy changes are we tracking for them?
   - When will we alert them next?
   - Format: "We'll alert you when: [specific trigger]"
` : `
1. ALL CLEAR STATUS (2-3 sentences):
   - Confirm no immediate threats
   - Summarize current USMCA compliance status
   - Note what we're still monitoring for them

2. PROACTIVE RECOMMENDATIONS (2-3 items):
   - USMCA 2026 preparation steps
   - Portfolio optimization opportunities
`}

4. USMCA 2026 SCENARIOS (Show predictive intelligence):

   Scenario A (${countryConfig.scenarios.A.probability}%): ${countryConfig.scenarios.A.name}
   - What happens: ${countryConfig.scenarios.A.description}
   - Your coordinated action: [Portfolio-wide response, not single component]
   - Portfolio impact: [Estimate across all components]

   Scenario B (${countryConfig.scenarios.B.probability}%): ${countryConfig.scenarios.B.name}
   - What happens: ${countryConfig.scenarios.B.description}
   - Your coordinated action: [Portfolio-wide response]
   - Portfolio impact: [Estimate across all components]

   Scenario C (${countryConfig.scenarios.C.probability}%): ${countryConfig.scenarios.C.name}
   - What happens: ${countryConfig.scenarios.C.description}
   - Your coordinated action: [Portfolio-wide response]
   - Portfolio impact: [Estimate across all components]

5. THIS WEEK'S COORDINATED ACTION (Show orchestration value):
   - Single coordinated action across multiple components
   - Show time investment ("6-8 hours this week")
   - Emphasize unique platform value ("email templates provided")

RESPONSE FORMAT (JSON):
{
  "portfolio_impact_summary": "Portfolio-wide impact in 2-3 sentences (concrete, not anxiety-inducing)",
  "updated_priorities": [
    "[URGENT - 30 days] Mexico labor compliance certification ($620,000 protected)",
    "[NEW - 60 days] Canada supply chain documentation ($270,000 protected)"
  ],
  "monitoring_intelligence": {
    "tracking_for_you": [
      "12 USMCA renegotiation proposals",
      "47 Mexico regulatory changes in pipeline",
      "8 Canada documentation rule updates"
    ],
    "will_alert_when": [
      "Mexico labor law effective date announced (estimated Feb 1, 2026)",
      "USMCA 2026 public comment period opens",
      "Canada documentation requirements finalized (60-90 days)"
    ]
  },
  "contingency_scenarios": [
    {
      "scenario": "A",
      "name": "${countryConfig.scenarios.A.name}",
      "probability": ${countryConfig.scenarios.A.probability},
      "description": "...",
      "coordinated_action": "Portfolio-wide response across all components",
      "portfolio_impact": "Estimated impact across entire $X.XM portfolio"
    },
    {
      "scenario": "B",
      "name": "${countryConfig.scenarios.B.name}",
      "probability": ${countryConfig.scenarios.B.probability},
      "description": "...",
      "coordinated_action": "Portfolio-wide response",
      "portfolio_impact": "Estimated impact"
    },
    {
      "scenario": "C",
      "name": "${countryConfig.scenarios.C.name}",
      "probability": ${countryConfig.scenarios.C.probability},
      "description": "...",
      "coordinated_action": "Portfolio-wide response",
      "portfolio_impact": "Estimated impact"
    }
  ],
  "coordinated_action_this_week": {
    "action": "Contact all 4 suppliers simultaneously for compliance documentation",
    "time_investment": "6-8 hours this week",
    "platform_value": "Email templates provided, tracking dashboard included"
  }
}`;
  }

  /**
   * Parse AI response into structured format (RETENTION-FOCUSED)
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
      console.warn('⚠️ Failed to parse JSON response, returning fallback:', error);
      // Return retention-focused fallback format
      return {
        portfolio_impact_summary: response.toString().substring(0, 300) || 'Alert analysis in progress',
        updated_priorities: [],
        monitoring_intelligence: {
          tracking_for_you: [
            'Active policy changes across MX, CA, US',
            'USMCA 2026 renegotiation proposals',
            'CBP audit procedure changes'
          ],
          will_alert_when: [
            'New policy changes detected',
            'USMCA 2026 comment period opens'
          ]
        },
        contingency_scenarios: [],
        coordinated_action_this_week: {
          action: 'Review current alerts and workflow',
          time_investment: '15-30 minutes',
          platform_value: 'Comprehensive portfolio monitoring'
        }
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
