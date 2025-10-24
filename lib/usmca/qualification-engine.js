/**
 * USMCA QUALIFICATION ENGINE
 *
 * Extracted from pages/api/ai-usmca-complete-analysis.js (Phase 3, Oct 24, 2025)
 *
 * Builds comprehensive AI prompts for USMCA qualification analysis with:
 * - Industry-specific threshold lookups
 * - Manufacturing labor credit calculations
 * - Component breakdown with tariff rates
 * - Section 301 policy detection
 * - Regional content calculations
 */

import {
  DE_MINIMIS
} from '../validation/form-validation.js';
import { getIndustryThreshold } from '../services/industry-thresholds-service.js';

/**
 * Build comprehensive USMCA qualification prompt for AI analysis
 * Constructs detailed prompt with business context, components, and tariff data
 *
 * @param {Object} formData - Complete form submission data
 * @param {Object} componentRates - Map of HS codes to tariff rates
 * @returns {Promise<string>} Complete prompt for AI USMCA analysis
 */
export async function buildComprehensiveUSMCAPrompt(formData, componentRates = {}) {
  // Get industry threshold (database-first with fallback to hardcoded)
  const threshold = await getIndustryThreshold(formData.industry_sector, {
    userId: formData.user_id,
    workflowId: formData.workflow_id,
    companyName: formData.company_name
  });

  // Calculate manufacturing labor (Week 1 Enhancement #3)
  const manufacturingLocation = formData.manufacturing_location;
  const isUSMCAManufacturing = ['US', 'MX', 'CA'].includes(manufacturingLocation);
  const substantialTransformation = formData.substantial_transformation || false;
  const laborValueAdded = isUSMCAManufacturing ? threshold.labor : 0;

  // Format components with rates (concise) - NOW WITH SECTION 301 VALIDATION
  const componentBreakdown = formData.component_origins
    .map((c, i) => {
      const rates = componentRates[c.hs_code] || {};

      // CRITICAL FIX: Show TOTAL rate with Section 301 breakdown to prevent AI hallucinations
      let rateStr = '';
      if (rates.mfn_rate !== undefined) {
        const baseMFN = rates.mfn_rate;
        const section301 = rates.section_301 || 0;
        const totalRate = rates.total_rate || baseMFN;
        const usmcaRate = rates.usmca_rate || 0;

        // Show breakdown: Base MFN + Section 301 = Total Rate
        if (section301 > 0) {
          rateStr = ` | Base MFN: ${baseMFN}% + Section 301: ${section301}% = Total: ${totalRate}% | USMCA: ${usmcaRate}% | Savings: ${baseMFN}% (Section 301 remains)`;
        } else {
          rateStr = ` | MFN: ${baseMFN}% | USMCA: ${usmcaRate}% | Savings: ${baseMFN - usmcaRate}%`;
        }
      }

      return `${i+1}. ${c.description} - ${c.value_percentage}% from ${c.origin_country}${c.hs_code ? ` (HS: ${c.hs_code})` : ''}${rateStr}`;
    }).join('\n');

  // De minimis note (Week 1 Enhancement #4)
  const destination = formData.destination_country;
  const origin = formData.supplier_country;
  const industry = formData.industry_sector;
  const deMinimisInfo = DE_MINIMIS[destination];
  const deMinimisNote = deMinimisInfo
    ? typeof deMinimisInfo.note === 'function'
      ? deMinimisInfo.note(origin)
      : deMinimisInfo.note
    : '';

  // Week 1 Enhancement #1: Section 301 detection
  const hasChineseComponents = formData.component_origins.some(c =>
    c.origin_country === 'CN' || c.origin_country === 'China'
  );
  const destinationUS = formData.destination_country === 'US';
  const section301Applicable = hasChineseComponents && destinationUS;

  // Calculate USMCA component total for reference (AI will verify)
  const usmcaCountries = ['US', 'MX', 'CA'];
  const usmcaComponentTotal = formData.component_origins
    .filter(c => usmcaCountries.includes(c.origin_country))
    .reduce((sum, c) => sum + parseFloat(c.value_percentage || 0), 0);

  // Calculate total North American content (components + labor)
  const totalNAContent = usmcaComponentTotal + laborValueAdded;

  const prompt = `You are a senior trade compliance strategist and supply chain analyst advising an SMB on USMCA qualification and tariff exposure.

Your analysis should deliver strategic business intelligence, not just compliance assessment. The owner needs to understand:
1. What they're qualifying for and what it means financially
2. What hidden risks remain in their supply chain
3. Strategic options available with ROI analysis
4. How their competitive position compares

PRODUCT & BUSINESS CONTEXT:
- Industry: ${industry} (Threshold: ${threshold.rvc}% RVC per ${threshold.article})
- Manufacturing: ${manufacturingLocation} (Labor credit: ${laborValueAdded}%)
- Trade Flow: ${origin}→${destination}${formData.trade_volume ? ` | Annual Volume: $${formData.trade_volume}` : ''}

COMPONENTS:
${componentBreakdown}

MANUFACTURING CONTEXT:
${laborValueAdded}% manufacturing credit for assembly in ${manufacturingLocation} (USMCA Article ${threshold.article}).
${substantialTransformation ? '✓ Substantial transformation - complex processes improve qualification strength' : '⚠️ Standard assembly - document all value-added activities'}

Regional Content Calculation:
- USMCA Components: ${usmcaComponentTotal}%
- Manufacturing Labor Credit: ${laborValueAdded}%
- Total North American Content: ${totalNAContent}%${section301Applicable ? `

CRITICAL POLICY EXPOSURE (2025): This company has Chinese-origin components subject to Section 301 tariffs (~25%) even with USMCA qualification. Base MFN duties are eliminated, but Section 301 tariffs REMAIN - creating policy risk and ongoing cost burden.` : ''}${deMinimisNote ? `

${deMinimisNote}` : ''}

PREFERENCE CRITERION: Determine which USMCA criterion applies (A/B/C/D) based on qualification method (${threshold.method}).

CRITICAL INSTRUCTION FOR THE "reason" FIELD:
Write this as a senior trade strategist would advise an SMB owner. It should read like business advice, not regulatory documentation.
Structure it like this example:
"I'm pleased to report that your product successfully qualifies for USMCA preferential treatment. You're currently realizing $340 in monthly tariff savings ($4,080 annually). However, I want to draw your attention to a significant exposure: your China-sourced PCB component remains subject to 25% Section 301 tariffs, representing ongoing policy risk. The strategic alternative would be transitioning to a Mexico-based PCB supplier (+2% unit cost, 4-6 weeks implementation) which eliminates this exposure and increases your RVC buffer to 92%. Given a 3-month payback period and the current political environment around trade policy, this merits serious consideration."

Key elements:
- Lead with GOOD news (qualified? savings?)
- Quantify everything in dollars, not percentages
- Identify the KEY vulnerability (Section 301? Supply concentration?)
- Present options with specific tradeoffs (cost % vs benefit)
- Include timeline and payback
- Show competitive/strategic context
- Close with a business decision framework

This is NOT a compliance assessment - it's strategic business advice.

RESPONSE FORMAT - BUSINESS INTELLIGENCE ANALYSIS:

{
  product: {
    hs_code: "string",
    confidence: number
  },
  usmca: {
    qualified: boolean,
    threshold_applied: ${threshold.rvc},
    threshold_source: "${threshold.article}",
    threshold_reasoning: "Why this threshold applies to their industry",
    north_american_content: number,
    gap: number,
    rule: "RVC ${threshold.rvc}%",
    reason: "BUSINESS-FOCUSED executive summary (like in the example below) - not just compliance jargon"
  },
  financial_impact: {
    // Concrete dollar amounts matter to SMB owners
    annual_tariff_savings: number,  // Actual dollars saved per year
    monthly_tariff_savings: number,  // annual / 12
    savings_percentage: number,  // (savings / trade_volume) × 100
    tariff_cost_without_qualification: number,  // What they'd pay if NOT qualified
    section_301_exposure: {
      // CRITICAL: Show policy vulnerabilities
      is_exposed: boolean,  // Do they have Chinese components?
      annual_cost_burden: number,  // What Section 301 costs them per year
      affected_components: ["list of which components hit by Section 301"],
      policy_risk: "Description of why this is a risk (policy can change with 30-day notice)"
    }
  },
  supply_chain_vulnerabilities: {
    // What risks exist in their current structure?
    primary_exposure: "Chinese components subject to Section 301 tariffs",
    vulnerability_level: "High/Medium/Low",
    risk_description: "Detailed explanation of the policy risk and why it matters"
  },
  strategic_alternatives: [
    {
      option: "Current approach - maintain China sourcing",
      cost_impact: "Continue paying $X/month in Section 301 tariffs",
      risk_profile: "Exposed to policy changes",
      timeline: "N/A",
      payback_months: "N/A"
    },
    {
      option: "Switch to Mexico supplier for exposed component",
      cost_impact: "+2% unit cost = +$X/month operational expense",
      benefit: "Eliminates Section 301 exposure, increases RVC to 92%, locks in preferential treatment",
      timeline: "4-6 weeks for supplier qualification",
      payback_months: 3,  // How long to recoup switching costs
      recommendation_rationale: "Competitive advantage, policy insulation, supply chain resilience"
    }
  ],
  competitive_context: {
    // Show they understand the market
    competitor_positioning: "Companies in your sector that moved to Mexico-sourcing have locked in preferential treatment while others remain exposed",
    market_trend: "Nearshoring acceleration due to trade policy volatility"
  },
  recommendations: [
    "Specific, actionable next steps with business rationale"
  ],
  detailed_analysis: {
    threshold_research: "Why this threshold applies",
    calculation_breakdown: "Step-by-step RVC calculation",
    qualification_reasoning: "Why they qualify or don't",
    strategic_insights: "Business implications of qualification status",
    savings_analysis: {
      annual_savings: number,
      monthly_savings: number,
      calculation_detail: "Show per-component breakdown"
    }
  },
  confidence_score: number,

  // IMPORTANT: reason field should read like the example provided:
  // "I'm pleased to report that your product successfully qualifies...
  //  You're currently realizing $340 in monthly tariff savings...
  //  However, I want to draw your attention to a significant exposure..."
}`;

  return prompt;
}
