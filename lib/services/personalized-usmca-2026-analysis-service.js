/**
 * PERSONALIZED USMCA 2026 RENEGOTIATION ANALYSIS
 *
 * NOT a generic report template.
 * Analyzes USER's SPECIFIC components, origins, and dollar exposure.
 * Shows how USMCA 2026 renegotiation affects THEIR supply chain.
 * Presents strategic considerations and trade-offs for THEIR situation.
 * Tracks policy changes specific to THEIR components and countries.
 */

import { callOpenRouterAI, callAnthropicDirect } from '../ai-helpers';

class PersonalizedUSMCA2026AnalysisService {
  /**
   * Generate personalized USMCA 2026 impact analysis
   * @param {Object} userProfile - User's company data (components, origins, RVC, volume)
   * @returns {Object} Personalized analysis with component exposure, considerations, monitoring
   */
  async generatePersonalizedAnalysis(userProfile) {
    try {
      console.log('📊 Generating personalized USMCA 2026 analysis for:', userProfile.companyName);

      // 1. Calculate component exposure
      const componentExposure = this.calculateComponentExposure(userProfile);
      console.log('💰 Component exposure calculated:', componentExposure);

      // 2. Map USMCA 2026 scenarios to their components
      const riskMapping = this.mapRisksToComponents(componentExposure);
      console.log('🎯 Risk mapping to components:', riskMapping);

      // 3. Build personalized prompt
      const prompt = this.buildPersonalizedPrompt(userProfile, componentExposure, riskMapping);

      // 4. Call AI
      let response;
      try {
        response = await callOpenRouterAI(prompt, {
          model: 'anthropic/claude-haiku-4.5',
          maxTokens: 1200 // Strategic briefing needs room for real analysis
        });
      } catch (error) {
        console.warn('⚠️ OpenRouter failed, trying Anthropic direct...');
        response = await callAnthropicDirect(prompt, {
          model: 'claude-haiku-4-20250514',
          maxTokens: 1200
        });
      }

      // 5. Parse response
      const analysis = this.parseResponse(response);

      console.log('✅ Personalized USMCA 2026 analysis complete');
      return analysis;

    } catch (error) {
      console.error('❌ Personalized analysis failed:', error);
      throw error;
    }
  }

  /**
   * Calculate dollar exposure for each component
   */
  calculateComponentExposure(userProfile) {
    const tradeVolume = userProfile.tradeVolume || userProfile.trade_volume || 0;
    const components = userProfile.componentOrigins || [];

    return components.map(comp => ({
      description: comp.description,
      hs_code: comp.hs_code,
      origin_country: comp.origin_country || comp.country,
      percentage: comp.value_percentage || comp.percentage || 0,
      dollar_value: Math.round(tradeVolume * (comp.value_percentage || 0) / 100),
      usmca_eligible: ['US', 'CA', 'MX'].includes(comp.origin_country || comp.country)
    }));
  }

  /**
   * Map USMCA 2026 renegotiation scenarios to their components
   */
  mapRisksToComponents(componentExposure) {
    const riskMap = {
      MX: {
        issue: 'Mexico labor compliance rules',
        trigger: 'New labor standards expected Dec 2025',
        impact: 'Supplier compliance costs may increase 3-5%'
      },
      CN: {
        issue: 'China component cumulation rules',
        trigger: 'USTR renegotiation proposals Q1 2026',
        impact: 'Stricter value-of-content rules may reduce eligibility'
      },
      CA: {
        issue: 'Canada critical minerals supply',
        trigger: 'Canada supply chain initiative',
        impact: 'Opportunity for new supplier options, potential cost changes'
      },
      US: {
        issue: 'US manufacturing credit',
        trigger: 'Potential labor credit adjustments',
        impact: 'May increase or decrease RVC requirements'
      }
    };

    return componentExposure.map(comp => {
      const risk = riskMap[comp.origin_country] || { issue: 'Monitoring status', trigger: 'Ongoing', impact: 'Policy changes tracked' };
      return {
        ...comp,
        risk_category: risk.issue,
        trigger_date: risk.trigger,
        potential_impact: risk.impact
      };
    });
  }

  /**
   * Build personalized AI prompt
   */
  buildPersonalizedPrompt(userProfile, componentExposure, riskMapping) {
    const totalVolume = userProfile.tradeVolume || userProfile.trade_volume || 0;
    const rvc = userProfile.regionalContent || 0;

    // Group by country for monitoring focus
    const countriesMonitored = [...new Set(componentExposure.map(c => c.origin_country))];
    const riskCountries = [...new Set(riskMapping.map(r => r.origin_country))];

    // Calculate Mexico exposure specifically
    const mexicoComponents = componentExposure.filter(c => c.origin_country === 'MX');
    const mexicoExposure = mexicoComponents.reduce((sum, c) => sum + c.dollar_value, 0);

    return `You are a Trade Compliance Director writing a strategic briefing on USMCA 2026 renegotiation exposure.

YOUR ROLE:
- Review Federal Register daily, track USTR negotiation positions
- Calculate RVC scenarios in detail, spot policy impacts on specific industries
- Give strategic counsel based on deep expertise (assume they understand HS codes, RVC, rules of origin)
- Cite their specific numbers, not generic advice

THEIR BUSINESS PROFILE:
Company: ${userProfile.companyName}
Industry: ${userProfile.industry_sector || 'Manufacturing'}
Total Annual Volume: $${totalVolume.toLocaleString()}
Current RVC: ${rvc}%
Mexico Exposure: $${mexicoExposure.toLocaleString()} (${Math.round(mexicoExposure / totalVolume * 100)}%)
Destination: ${userProfile.destinationCountry || 'US'}

THEIR COMPONENT BREAKDOWN:
${componentExposure.map(c =>
  `- ${c.description} (HS ${c.hs_code}): $${c.dollar_value.toLocaleString()} from ${c.origin_country} (${c.percentage}%)`
).join('\n')}

RENEGOTIATION SCENARIOS HITTING THEIR SUPPLY CHAIN:
${riskMapping.map(r =>
  `- ${r.origin_country} - ${r.risk_category}: Triggers ${r.trigger_date}. Impact: ${r.potential_impact}`
).join('\n')}

YOUR TASK: Write a Trade Compliance Director briefing (plain text, 300-400 words per section):

STRUCTURE:
1. BOTTOM LINE FOR LEADERSHIP (3-4 sentences max - for decision-makers)
   - Total renegotiation exposure in dollars + % of volume
   - Single biggest risk + why it matters
   - Timeline/trigger date

2. COMPONENT RISK BREAKDOWN (detailed breakdown for operations)
   - "Your [component] (HS [code]) sourced from [country] at $[amount]: [specific risk]"

3. STRATEGIC CONSIDERATIONS (trade-offs, NOT prescriptive actions)
   - "Consider: [specific trade-off for THEIR situation]"
   - "Trade-off: [Option A] vs [Option B]"
   - "Your position: [strength/weakness based on THEIR data]"

4. WHAT WE'RE MONITORING FOR YOU (peer-to-peer expertise)
   - "I'm tracking [THEIR countries/HS codes] for [specific policy] changes"
   - Specific trigger dates relevant to THEM

EXAMPLE STRUCTURE:

BOTTOM LINE FOR LEADERSHIP
Your Chinese microprocessor ($2.975M, 35% of costs) may lose USMCA trade benefits in Q1 2026, adding tariff duties to your final product. Combined with Mexico labor cost increases, you face $127K–$212K in new costs. You have 90 days to evaluate options before policy changes lock in.

COMPONENT RISK BREAKDOWN
- Microprocessor (HS 8542.31.00): $2.975M from China, faces cumulation tightening...
- Power Supply (HS 8504.40.00): $2.55M from Mexico, exposed to labor standard increases...

STRATEGIC CONSIDERATIONS
- Consider: Is your current China sourcing sustainable through 2026, or should you evaluate alternatives now?
- Trade-off: Absorb $127K–$212K in new costs vs. shift sourcing to higher-cost but policy-protected suppliers
- Your position: 65% Mexico + Canada content gives flexibility IF you can shift high-value components

WHAT WE'RE MONITORING FOR YOU
I'm tracking USTR renegotiation proposals (Q1 2026), Mexico wage policy votes (Dec 15), and China cumulation rules. Next trigger: USTR announcement expected mid-January.

OUTPUT FORMAT (Plain text only - NO JSON, NO MARKDOWN):

BOTTOM LINE FOR LEADERSHIP
[2-3 sentences: plain English, no jargon, dollar impact and timeline]

COMPONENT RISK BREAKDOWN
[List each component with HS code, $ amount, country, specific risk]

STRATEGIC CONSIDERATIONS
[List trade-offs and questions they should consider, NOT prescriptive actions]

WHAT WE'RE MONITORING FOR YOU
[What you're tracking, specific to their HS codes and countries]

CRITICAL RULES:
- Plain TEXT ONLY - no JSON, no code blocks, no markdown, no emojis
- Use section headers EXACTLY as shown (no emojis, no bullets)
- Executive summary: plain English (no jargon), dollars + timeline, max 4 sentences
- Component risks: list each one with HS code and specific dollar amount
- Strategic considerations: "Consider X vs Y", "Trade-off: A vs B", "Your position: strengths/weaknesses" - NO action items
- Monitoring: reference THEIR HS codes and countries, not generic ones
- Federal Register reviewer voice (you know these policies)
- Never: action items with dates, prescriptive steps, templates, technical jargon`;
  }

  /**
   * Parse AI response - extract plain text sections by section headers
   */
  parseResponse(response) {
    const aiText = String(response || '');
    console.log('🔍 Raw AI response length:', aiText.length);

    // Extract sections by looking for section headers (no emojis)
    const executiveSummaryMatch = aiText.match(/BOTTOM LINE FOR LEADERSHIP\s*\n([^]*?)(?=\n\nCOMPONENT RISK|$)/i);
    const componentRisksMatch = aiText.match(/COMPONENT RISK BREAKDOWN\s*\n([^]*?)(?=\n\nSTRATEGIC CONSIDERATIONS|$)/i);
    const considerationsMatch = aiText.match(/STRATEGIC CONSIDERATIONS\s*\n([^]*?)(?=\n\nWHAT WE'RE MONITORING|$)/i);
    const monitoringMatch = aiText.match(/WHAT WE'RE MONITORING FOR YOU\s*\n([^]*?)$/i);

    if (executiveSummaryMatch) {
      console.log('✅ Successfully parsed plain text response');
      return {
        executive_summary: executiveSummaryMatch[1].trim(),
        exposure_summary: executiveSummaryMatch[1].trim(),
        component_risks: componentRisksMatch ? componentRisksMatch[1].trim().split('\n').filter(l => l.trim()).map(l => l.replace(/^[-*•]\s*/, '')) : [],
        strategic_considerations: considerationsMatch ? considerationsMatch[1].trim().split('\n').filter(l => l.trim()).map(l => l.replace(/^[-*•]\s*/, '')) : [],
        monitoring_focus: monitoringMatch ? monitoringMatch[1].trim() : ''
      };
    }

    // Fallback: Try alternate patterns
    console.warn('⚠️ Could not find section headers, trying alternate patterns...');
    const altExecMatch = aiText.match(/BOTTOM LINE[^]*?:?\s*([^]*?)(?=\nCOMPONENT|$)/i);
    const altComponentMatch = aiText.match(/COMPONENT[^]*?:?\s*([^]*?)(?=\nSTRATEGIC|$)/i);
    const altConsiderMatch = aiText.match(/STRATEGIC[^]*?:?\s*([^]*?)(?=\nMONITORING|$)/i);
    const altMonitorMatch = aiText.match(/MONITORING[^]*?:?\s*([^]*?)$/i);

    if (altExecMatch) {
      console.log('✅ Successfully parsed using alternate patterns');
      return {
        executive_summary: altExecMatch[1].trim(),
        exposure_summary: altExecMatch[1].trim(),
        component_risks: altComponentMatch ? altComponentMatch[1].trim().split('\n').filter(l => l.trim()).map(l => l.replace(/^[-*•]\s*/, '')) : [],
        strategic_considerations: altConsiderMatch ? altConsiderMatch[1].trim().split('\n').filter(l => l.trim()).map(l => l.replace(/^[-*•]\s*/, '')) : [],
        monitoring_focus: altMonitorMatch ? altMonitorMatch[1].trim() : ''
      };
    }

    // Last resort: Return raw text
    console.warn('⚠️ Could not parse structured sections');
    return {
      executive_summary: aiText.substring(0, 500),
      exposure_summary: aiText.substring(0, 500),
      component_risks: [],
      strategic_considerations: [],
      monitoring_focus: ''
    };
  }
}

// Force recompilation - cache bust
export default new PersonalizedUSMCA2026AnalysisService();
