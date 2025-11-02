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
          maxTokens: 4000 // ✅ INCREASED (Nov 2): Complex JSON with broker advisor section requires more tokens
        });
      } catch (error) {
        console.warn('⚠️ OpenRouter failed, trying Anthropic direct...');
        response = await callAnthropicDirect(prompt, {
          model: 'claude-haiku-4-20250514',
          maxTokens: 4000 // ✅ INCREASED (Nov 2): Complex JSON with broker advisor section requires more tokens
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
    const tradeVolume = userProfile.tradeVolume || userProfile.trade_volume || 0;
    const portfolioImpact = this.calculatePortfolioImpact(affectedComponents, tradeVolume);

    // Build summary of existing analysis for context (but don't repeat it)
    const existingContext = hasExistingAnalysis ? `
THEIR EXISTING USMCA ANALYSIS (do NOT repeat - just use for context):
- Qualification: ${existingAnalysis.situation_brief || 'Not analyzed'}
- RVC: ${userProfile.regionalContent || 'Unknown'}%
- Current savings: $${(existingAnalysis.annual_impact || 0).toLocaleString()}/year
` : '';

    return `You are a senior trade compliance advisor providing strategic portfolio intelligence.

CLIENT: ${userProfile.companyName || 'Client company'}
INDUSTRY: ${userProfile.industry_sector || userProfile.businessType || 'Manufacturing'}
TRADE VOLUME: $${(tradeVolume || 0).toLocaleString()}/year
LOCATION: ${userProfile.companyCountry || 'US'}

${existingContext}

NEW ALERTS THIS WEEK (${affectedComponents.length} alert${affectedComponents.length !== 1 ? 's' : ''}):
${affectedComponents.length > 0 ? affectedComponents.map((item, idx) =>
  `${idx + 1}. ${item.alert.title || item.alert.consolidated_title} (${item.alert.severity || 'MEDIUM'})
   Affects: ${item.affectedComponents.map(c => `${c.description || c.component_type} (${c.origin_country})`).join(', ')}`
).join('\n') : '✅ NO ACTIVE ALERTS'}

PORTFOLIO IMPACT SUMMARY:
${portfolioImpact.summary}

YOUR TASK: Generate an additive advisory that ADDS to their existing analysis, NOT repeating it.

Respond in JSON format:
{
  "portfolio_impact_summary": "2-3 sentences: How do these ${affectedComponents.length} new alerts change their situation? Name specific components and dollar amounts.",
  "updated_priorities": [
    "[URGENT] Specific action for ${userProfile.companyName} with component name, origin country, and dollar protection amount",
    "[NEW] Another specific dated action with measurable impact"
  ],
  "monitoring_intelligence": {
    "tracking_for_you": [
      "Specific policy change that affects THEIR components/industry",
      "Another policy change with relevance to their situation"
    ],
    "will_alert_when": [
      "We'll alert you when: [specific observable event with estimated date, e.g., 'CBP announces microchip origin rules by Feb 1, 2026']"
    ]
  },
  "contingency_scenarios": [
    {
      "scenario": "A",
      "name": "${countryConfig.scenarios.A.name}",
      "probability": ${countryConfig.scenarios.A.probability},
      "description": "${countryConfig.scenarios.A.description}",
      "coordinated_action": "SPECIFIC actions for ${userProfile.companyName}'s ${affectedComponents.length} affected components",
      "portfolio_impact": "Specific dollar amount for $${(tradeVolume || 0).toLocaleString()} portfolio"
    },
    {
      "scenario": "B",
      "name": "${countryConfig.scenarios.B.name}",
      "probability": ${countryConfig.scenarios.B.probability},
      "description": "${countryConfig.scenarios.B.description}",
      "coordinated_action": "Specific actions for their situation",
      "portfolio_impact": "Specific dollar calculation"
    },
    {
      "scenario": "C",
      "name": "${countryConfig.scenarios.C.name}",
      "probability": ${countryConfig.scenarios.C.probability},
      "description": "${countryConfig.scenarios.C.description}",
      "coordinated_action": "Specific actions considering their ${userProfile.regionalContent}% RVC",
      "portfolio_impact": "Dollar impact"
    }
  ],
  "coordinated_action_this_week": {
    "action": "ONE specific action coordinating all ${affectedComponents.length} affected components for ${userProfile.companyName}",
    "time_investment": "Specific time estimate",
    "platform_value": "Why only our platform can provide this intelligence"
  },
  "from_your_trade_advisor": {
    "professional_advisory": "1-2 sentences: From a customs compliance perspective, ${userProfile.companyName} faces [specific risk level] because [reason specific to their RVC/components/origins]",
    "situation_assessment": "Reference their ${userProfile.regionalContent}% RVC and ${affectedComponents.length} component exposures - professional assessment",
    "cbp_compliance_guidance": "Specific CBP concern for their industry and component origins",
    "audit_defensibility": "How their situation (or proposed actions) strengthens/weakens audit defensibility",
    "supplier_validation": "Technical requirements for validating supplier documentation based on their origins"
  }
}

CRITICAL FORMATTING RULES (copied from Premium consulting standards):
- NO EMOJIS - Professional business language only
- ADDRESS ${userProfile.companyName} BY NAME throughout
- Use actual numbers: $${(tradeVolume || 0).toLocaleString()}, ${userProfile.regionalContent}%, ${affectedComponents.length} components
- SPECIFIC not generic: "Contact Heilind Mexico for quotes" not "Review suppliers"
- ADDITIVE not repetitive: Add NEW insights, don't repeat their existing analysis
- Professional tone: Write as their personal trade advisor with deep knowledge
- Each field adds different information (don't repeat dollar amounts or RVC across fields)`;
  }

  /**
   * Parse AI response into structured format (RETENTION-FOCUSED)
   */
  parseAlertImpactResponse(response) {
    try {
      // Try to parse as JSON first
      if (typeof response === 'string') {
        // Extract JSON from markdown code blocks if present
        // Handle various markdown formats with flexible whitespace
        const patterns = [
          /```json\s*([\s\S]*?)\s*```/,           // ```json ... ```
          /```javascript\s*([\s\S]*?)\s*```/,     // ```javascript ... ```
          /```\s*([\s\S]*?)\s*```/,                // ``` ... ```
        ];

        for (const pattern of patterns) {
          const match = response.match(pattern);
          if (match && match[1]) {
            const jsonStr = match[1].trim();
            if (jsonStr) {
              return JSON.parse(jsonStr);
            }
          }
        }

        // If no code blocks found, try parsing the whole response
        const trimmed = response.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          return JSON.parse(trimmed);
        }

        return JSON.parse(response);
      }

      return response;
    } catch (error) {
      console.warn('⚠️ Failed to parse JSON response, returning fallback:', error);
      console.warn('📝 Response preview:', response?.toString?.().substring(0, 500));
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
