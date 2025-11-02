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

YOUR TASK (Produce detailed, specific, actionable intelligence - NOT generic placeholders):

CRITICAL REQUIREMENTS:
- DO NOT use placeholder text like "Portfolio-wide response" - REPLACE with specific actions
- DO NOT use generic dollar amounts - CALCULATE from affected components
- DO NOT be vague - name specific suppliers, countries, dates, percentages
- DO NOT repeat existing strategic plan above - ADD incremental intelligence from alerts
- MUST ground all recommendations in the company's specific situation: ${userProfile.companyName}, ${userProfile.industry_sector || userProfile.businessType}
- MUST use specific component names and origins from their portfolio
- MUST calculate financial impact in dollars (not percentages)

${affectedComponents.length > 0 ? `
1. PORTFOLIO IMPACT SUMMARY (2-3 sentences):
   - How do these ${affectedComponents.length} alerts affect their specific portfolio?
   - Be specific: name the components at risk, the countries affected, the dollar amounts
   - Provide concrete coordinated response needed across their components

2. UPDATED PRIORITIES (REQUIRED: Must list 3-5 specific, dated actions with dollar amounts):
   - Format: [URGENT - ${new Date().toISOString().split('T')[0]}] Specific action for component X from country Y ($XXX,XXX immediate protection)
   - Format: [NEW - DEADLINE] Specific action with context from existing plan ($XXX,XXX protected)
   - DO NOT use generic language - name suppliers, components, tariffs, specific deadlines
   - Calculate protection amount from their portfolio value

3. MONITORING INTELLIGENCE (REQUIRED: Specific triggers they care about):
   - What specific policy changes are we tracking that could affect THEIR components?
   - When will alerts trigger? Name the specific event and estimated date
   - Format: "We'll alert you when: [specific observable event like 'CBP announces new microchip origin rules' on estimated date]"
` : `
1. STRONG COMPLIANCE STATUS (2-3 sentences):
   - Confirm no immediate threats to their specific products
   - Reference their current USMCA status with specific numbers
   - Name what we're still monitoring that affects them specifically

2. PROACTIVE OPTIMIZATION RECOMMENDATIONS (REQUIRED: 2-3 specific, detailed items):
   - Name the component and origin country that could benefit from optimization
   - Provide specific ROI calculation based on their trade volume
   - Reference USMCA 2026 preparation steps that apply to their industry
`}

4. USMCA 2026 CONTINGENCY SCENARIOS (Show predictive intelligence specific to THEIR situation):

   Scenario A (${countryConfig.scenarios.A.probability}%): ${countryConfig.scenarios.A.name}
   - What happens: ${countryConfig.scenarios.A.description}
   - Your company's coordinated action: SPECIFIC actions across THEIR components (${affectedComponents.length > 0 ? affectedComponents.map(c => c.affectedComponents.map(ac => ac.description).join(', ')).join('; ') : userProfile.businessType + ' sourcing'}), NOT generic portfolio response
   - Financial impact on ${userProfile.companyName}: Specific dollar amount based on $${(userProfile.tradeVolume || 0).toLocaleString()} portfolio

   Scenario B (${countryConfig.scenarios.B.probability}%): ${countryConfig.scenarios.B.name}
   - What happens: ${countryConfig.scenarios.B.description}
   - Your company's coordinated action: SPECIFIC actions for their situation, name countries/suppliers/components
   - Financial impact: Specific dollar calculation, not "Estimated impact"

   Scenario C (${countryConfig.scenarios.C.probability}%): ${countryConfig.scenarios.C.name}
   - What happens: ${countryConfig.scenarios.C.description}
   - Your company's coordinated action: SPECIFIC actions, reference their current RVC (${userProfile.regionalContent || 0}%) and qualification status
   - Financial impact: Dollar amount relevant to their trade volume

5. THIS WEEK'S SPECIFIC COORDINATED ACTION (Show orchestration value):
   - Name the specific action that coordinates across their components
   - Provide time estimate and specific suppliers/contacts to involve
   - Reference their existing strategic plan above - how does this week's action support it?

RESPONSE FORMAT (JSON - MUST provide specific details, NOT placeholders):
{
  "portfolio_impact_summary": "2-3 sentences specific to ${userProfile.companyName}: name affected components (e.g., 'Your China-origin microprocessors'), countries, and specific dollar amounts. Concrete, not anxiety-inducing.",
  "updated_priorities": [
    "[URGENT - SPECIFIC DATE like 'Jan 15'] Specific action for specific component from specific country ($X,XXX,XXX protected or at risk)",
    "[NEW - SPECIFIC DEADLINE] Another specific action with component/country/dollar amount from the existing plan",
    "[MONITORING - SPECIFIC DATE] Third specific action if applicable"
  ],
  "monitoring_intelligence": {
    "tracking_for_you": [
      "SPECIFIC policy change #1 that affects THEIR component/country combination",
      "SPECIFIC policy change #2 with relevance to THEIR industry (${userProfile.industry_sector || userProfile.businessType})",
      "SPECIFIC policy change #3 that could impact THEIR RVC (currently ${userProfile.regionalContent || 0}%)"
    ],
    "will_alert_when": [
      "SPECIFIC event like 'CBP announces new HS classification for microchips' (estimated date, e.g., Feb 1, 2026)",
      "SPECIFIC trigger like 'USMCA 2026 renegotiation proposal includes RVC threshold change' (estimated date)",
      "SPECIFIC change like 'Mexico removes tariff on component X' or similar (estimated date)"
    ]
  },
  "contingency_scenarios": [
    {
      "scenario": "A",
      "name": "${countryConfig.scenarios.A.name}",
      "probability": ${countryConfig.scenarios.A.probability},
      "description": "${countryConfig.scenarios.A.description}",
      "coordinated_action": "SPECIFIC portfolio action for ${userProfile.companyName}: Name the components affected (e.g., 'Shift microprocessor sourcing from China to Mexico'), suppliers involved, timeline (e.g., '6-week transition'), and specific steps",
      "portfolio_impact": "SPECIFIC financial impact: If this scenario occurs, your $${(userProfile.tradeVolume || 0).toLocaleString()} portfolio would see [specific dollar amount] additional cost or savings, based on your current China sourcing exposure"
    },
    {
      "scenario": "B",
      "name": "${countryConfig.scenarios.B.name}",
      "probability": ${countryConfig.scenarios.B.probability},
      "description": "${countryConfig.scenarios.B.description}",
      "coordinated_action": "SPECIFIC actions across THEIR components: Name the countries affected, suppliers to engage, documentation needed, and timeline",
      "portfolio_impact": "SPECIFIC dollar amount for your situation, calculated from your tariff rates and trade volume"
    },
    {
      "scenario": "C",
      "name": "${countryConfig.scenarios.C.name}",
      "probability": ${countryConfig.scenarios.C.probability},
      "description": "${countryConfig.scenarios.C.description}",
      "coordinated_action": "SPECIFIC contingency action: Reference their current RVC status (${userProfile.regionalContent || 0}%), qualification status, and what they would do to maintain compliance",
      "portfolio_impact": "Specific financial impact in dollars, not generic estimates"
    }
  ],
  "coordinated_action_this_week": {
    "action": "SPECIFIC coordinated action: Name the components, countries, specific suppliers/brokers to contact, and how it coordinates across their portfolio",
    "time_investment": "Specific time estimate (e.g., '8 hours for customs broker calls and documentation review')",
    "platform_value": "Reference the existing strategic plan above and explain how this week's action supports it"
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
