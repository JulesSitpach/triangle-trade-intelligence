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
 *
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
      // ✅ CRITICAL: Use 2000 char limit like results page (prevents malformed JSON)
      let response;
      try {
        response = await callOpenRouterAI(prompt, {
          model: 'anthropic/claude-haiku-4.5',
          maxTokens: 2000 // ✅ LIMITED: Keep response short and valid (like results page)
        });
      } catch (error) {
        console.warn('⚠️ OpenRouter failed, trying Anthropic direct...');
        response = await callAnthropicDirect(prompt, {
          model: 'claude-haiku-4-20250514',
          maxTokens: 2000 // ✅ LIMITED: Keep response short and valid (like results page)
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

YOUR TASK: Create ULTRA-BRIEF PORTFOLIO INTELLIGENCE REPORT (800-1200 chars MAXIMUM).

⚡ CRITICAL: Respond in VALID JSON ONLY - max 1200 characters total (target 800-1000).
- NO markdown code blocks, NO markdown formatting
- NO newlines in strings (use \\n only)
- Each field max 60 characters
- Ultra-concise bullet points
- Remove all adjectives, keep facts only

Analyze ${userProfile.companyName}'s trade position in 5 sections:
1. Executive summary (1 sentence)
2. Top 3 risks (bullets only)
3. Top 3 opportunities (bullets only)
4. Immediate actions (bullets only)
5. Monitoring focus (1 sentence)

{
  "executive_summary": "Brief assessment of ${userProfile.companyName}'s position - qualified today, ${riskLevel} risk, ${rvcBuffer}% policy buffer.",
  "portfolio_risks": [
    "Mexico component concentration (${affectedComponents.length} at risk)",
    "USMCA 2026 renegotiation uncertainty",
    "Section 301 tariff volatility"
  ],
  "portfolio_opportunities": [
    "Nearshoring to Mexico increases RVC to ${Math.min(75, userProfile.regionalContent + 10)}%",
    "Canada suppliers available for critical components",
    "CBP binding ruling locks current HS codes"
  ],
  "immediate_actions": [
    "Document Mexico supplier compliance (30 days)",
    "Map Canada/US alternatives (30 days)",
    "Schedule CBP binding ruling consultation (30 days)"
  ],
  "monitoring_focus": "We scan USTR, CBP, Federal Register daily. Next alerts: USMCA 2026 details (Q1 2026), Mexico labor rules (Dec 2025), Section 301 changes (anytime)."
}`;
  }

  /**
   * AGGRESSIVE JSON REPAIR - Extract and fix malformed JSON from AI response
   * This handles the chaos of AI-generated JSON with unescaped characters, newlines, etc.
   */
  repairJSON(str) {
    // Remove markdown code blocks
    let cleaned = str.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Find the first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      return null;
    }

    let jsonStr = cleaned.substring(firstBrace, lastBrace + 1);

    // AGGRESSIVE FIXES for common AI JSON errors:

    // 1. Fix unescaped newlines within strings: "text\nmore" → "text\\nmore"
    //    Look for quotes with actual newlines between them
    jsonStr = jsonStr.replace(/"([^"]*)\n([^"]*)"/g, (match, p1, p2) => {
      return `"${p1}\\n${p2}"`;
    });

    // 2. Fix multiple actual newlines
    jsonStr = jsonStr.replace(/\n\n+/g, '\n');

    // 3. Remove actual newlines that aren't in strings (common in AI output)
    // Split by quotes to protect string contents
    const parts = jsonStr.split('"');
    for (let i = 0; i < parts.length; i += 2) {
      // Even indices are outside strings
      parts[i] = parts[i].replace(/\n/g, ' ');
    }
    jsonStr = parts.join('"');

    // 4. Fix trailing commas before } or ]
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

    // 5. Fix unquoted property names (e.g., {key: "value"} → {"key": "value"})
    jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

    // 6. Fix single quotes to double quotes (but not within existing double quotes)
    // This is risky but necessary for AI responses
    jsonStr = jsonStr.replace(/:\s*'([^']*)'/g, ': "$1"');

    // 7. Remove any remaining actual newlines/tabs
    jsonStr = jsonStr.replace(/[\r\n\t]+/g, ' ');

    // 8. Clean up multiple spaces
    jsonStr = jsonStr.replace(/\s+/g, ' ');

    return jsonStr;
  }

  /**
   * Parse AI response into structured format (RETENTION-FOCUSED)
   */
  parseAlertImpactResponse(response) {
    try {
      // If already an object, return it
      if (typeof response === 'object' && response !== null) {
        return response;
      }

      const responseStr = String(response || '');

      // Use aggressive JSON repair
      const repairedJSON = this.repairJSON(responseStr);

      if (repairedJSON) {
        console.log('🔧 Attempting to parse repaired JSON...');
        try {
          const parsed = JSON.parse(repairedJSON);
          console.log('✅ Successfully parsed repaired JSON');
          return parsed;
        } catch (e) {
          console.warn('⚠️ Repaired JSON still invalid:', e.message.substring(0, 100));
        }
      }

      // Fallback: try direct parse as last resort
      try {
        return JSON.parse(responseStr);
      } catch (e) {
        console.warn('⚠️ Direct parse failed, using fallback');
      }

    } catch (error) {
      console.warn('⚠️ Failed to parse JSON response, returning fallback:', error);
      console.warn('📝 Response preview:', String(response || '').substring(0, 500));

      // Return fallback matching new SIMPLE JSON structure (4 fields only)
      return {
        executive_summary: 'Your portfolio is being continuously monitored. Analysis in progress with trade policy focus.',
        portfolio_risks: [
          'Mexico component concentration creates Section 301 exposure',
          'USMCA 2026 renegotiation uncertainty affects current qualification',
          'Policy changes could impact RVC calculations'
        ],
        portfolio_opportunities: [
          'Nearshoring to Mexico/Canada improves RVC and resilience',
          'Canada suppliers available for critical components',
          'CBP binding ruling locks current HS codes and tariff treatment'
        ],
        immediate_actions: [
          'Document Mexico supplier compliance (next 30 days)',
          'Map Canada/US alternative suppliers (next 30 days)',
          'Schedule CBP binding ruling consultation (next 30 days)'
        ],
        monitoring_focus: 'We scan USTR, CBP, Federal Register daily for policy changes. Next alerts: USMCA 2026 details (Q1 2026), Mexico labor rules (Dec 2025), Section 301 changes (ongoing).'
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
