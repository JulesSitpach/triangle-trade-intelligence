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

    // Extract key metrics from existing analysis
    const rvcBuffer = (userProfile.regionalContent || 0) - (existingAnalysis.threshold_applied || 65);
    const riskLevel = rvcBuffer < 5 ? 'HIGH' : rvcBuffer < 10 ? 'MODERATE' : 'LOW';
    const nearshoreOpportunity = (existingAnalysis.potential_savings || 0) * 0.8; // Estimate nearshoring benefit

    return `You are a senior trade strategist writing a holistic portfolio intelligence report for ${userProfile.companyName}.

CLIENT SNAPSHOT:
- Company: ${userProfile.companyName}
- Industry: ${userProfile.industry_sector || userProfile.businessType}
- Trade Volume: $${(tradeVolume || 0).toLocaleString()}/year
- USMCA Status: ${existingAnalysis.situation_brief ? 'Qualified (65% RVC)' : 'Pending analysis'}
- RVC Buffer: ${rvcBuffer.toFixed(0)}% (${riskLevel} vulnerability to policy changes)
- Components: ${affectedComponents.length} affected by current alerts + ${(userProfile.componentOrigins?.length || 0) - affectedComponents.length} stable

ACTIVE TRADE ENVIRONMENT:
- USMCA 2026 Renegotiation: ${monthsToReview} months away
- Mexico Labor Compliance: New standards coming
- Canada Critical Minerals: Supply chain opportunities
- Section 301 Uncertainty: China tariffs remain volatile

YOUR TASK: Write a PORTFOLIO INTELLIGENCE REPORT that connects all the pieces:

1. Give them the BIG PICTURE of where they stand (qualified today, but vulnerable to 2026 changes)
2. Show how ALL their components fit together (cross-component themes)
3. Explain the TRADE LANDSCAPE they're operating in (what's happening NOW)
4. Provide their STRATEGIC ROADMAP (90-day + 2026 prep)
5. Highlight OPPORTUNITIES they're missing (nearshoring, suppliers, competitive advantages)
6. Show what YOU'RE MONITORING for them (why stay subscribed)

Respond in JSON:
{
  "executive_summary": "1 paragraph: Big picture assessment of ${userProfile.companyName}'s trade position (qualified today, risk profile, opportunity value)",
  "portfolio_health_check": {
    "current_status": "USMCA Qualified (${userProfile.regionalContent}% RVC) vs required threshold",
    "risk_level": "${riskLevel} (${rvcBuffer}% buffer, policy uncertainty, ${affectedComponents.length} components at risk)",
    "opportunity_value": "$${Math.round(nearshoreOpportunity).toLocaleString()} potential nearshoring benefit",
    "strategic_position": "Sentence explaining their CURRENT vulnerability and 2026 timeline"
  },
  "cross_component_analysis": {
    "component_breakdown": [
      "Component 1 (Origin): Status, tariff rate, alert impact",
      "Component 2 (Origin): Status, tariff rate, alert impact"
    ],
    "common_themes": "What all ${affectedComponents.length} alerts have in common (e.g., 'Mexico exposure is high (50%)', 'Labor documentation gaps')",
    "diversification_need": "Why their current sourcing is vulnerable and what balanced portfolio would look like"
  },
  "policy_environment": {
    "active_developments": [
      "USMCA 2026: ${countryConfig.scenarios.B.name} (${countryConfig.scenarios.B.probability}% likely)",
      "Mexico Labor: New compliance standards for ${affectedComponents.length} sourced components",
      "Canada Opportunity: Critical minerals initiative creates supplier alternatives",
      "Trump Tariffs: Continued Section 301 uncertainty on China components"
    ],
    "trade_landscape": "1-2 sentences: What this means for ${userProfile.companyName} over next 18 months"
  },
  "strategic_roadmap": {
    "immediate_30_days": [
      "Address Mexico labor documentation gap for [components]",
      "Map Canada connector alternatives (supply security)"
    ],
    "next_90_days": [
      "Increase RVC to 70%+ buffer for renegotiation",
      "Identify backup suppliers in all 3 countries",
      "Lock in current rules via CBP binding ruling"
    ],
    "2026_preparation": [
      "Prepare for 70%+ RVC requirement scenarios",
      "Build 12-month supplier diversity plan",
      "Establish nearshoring timeline for [high-risk component]"
    ]
  },
  "opportunity_spotlight": {
    "nearshoring_potential": "New Mexico suppliers could increase RVC to ${Math.min(75, userProfile.regionalContent + 10)}%+, generating $${Math.round(nearshoreOpportunity).toLocaleString()}/year benefit",
    "supplier_gaps": "Canada critical minerals suppliers now available (Vietnam cumulation rules)",
    "competitive_edge": "Early movers in 2025 will secure best suppliers before 2026 uncertainty hits",
    "hidden_opportunities": "Binding ruling strategy to lock current rules; Mexico nearshoring rush creating capacity"
  },
  "what_we_monitor_for_you": {
    "tracking_sources": [
      "USTR policy announcements (monthly)",
      "CBP operational guidance (weekly)",
      "Federal Register rule changes (daily)",
      "Industry-specific developments (weekly)"
    ],
    "next_alert_triggers": [
      "USMCA 2026 proposal details announced (expected Q1 2026)",
      "Mexico finalized labor rules (expected Dec 2025)",
      "Canada supply chain shifts (ongoing)",
      "Section 301 rate changes (executive decision)"
    ],
    "retention_message": "We continuously scan 12 data sources so ${userProfile.companyName} sees threats and opportunities before competitors"
  },
  "from_your_trade_advisor": {
    "situation_assessment": "From a customs compliance perspective, ${userProfile.companyName} presents ${riskLevel} risk because you have ${rvcBuffer}% RVC buffer with ${affectedComponents.length} Mexico components potentially affected by 2026 renegotiation",
    "immediate_action": "Schedule CBP binding ruling consultation within 30 days to lock current HS classifications before negotiation uncertainty",
    "strategic_insight": "Companies that prepare supply chain diversification in Q4 2025 will be ahead of the rush in 2026 when renegotiation uncertainty hits"
  }
}

CRITICAL RULES - This is a HOLISTIC INTELLIGENCE REPORT, not alert-by-alert breakdown:
- NO EMOJIS - Professional strategic advisory tone
- ADDRESS ${userProfile.companyName} BY NAME (build relationship)
- USE ACTUAL DATA: $${(tradeVolume || 0).toLocaleString()}, ${userProfile.regionalContent}% RVC, ${rvcBuffer}% buffer, ${affectedComponents.length} components
- CONNECT THE DOTS: Show how all ${affectedComponents.length} alerts fit into broader USMCA 2026 timeline
- THINK LIKE A BROKER: What do they really need to hear to stay subscribed and feel smart about their choices?
- SPECIFIC + ACTIONABLE: Not "review suppliers" but "contact Heilind Mexico by [date] for quotes"
- FORWARD-LOOKING: Focus on 2026 preparation as the REAL strategic priority`;
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
