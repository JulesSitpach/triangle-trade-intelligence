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
import MEXICO_SOURCING_CONFIG from '../../config/mexico-sourcing-config.js';  // ✅ REPLACES MexicoSourcingAgent (3 AI calls → 0)

/**
 * Build comprehensive USMCA qualification prompt for AI analysis
 * Constructs detailed prompt with business context, components, and tariff data
 *
 * @param {Object} formData - Complete form submission data
 * @param {Object} componentRates - Map of HS codes to tariff rates
 * @param {Object} preCalculatedFinancials - Pre-calculated financial data (Oct 26 optimization)
 * @returns {Promise<string>} Complete prompt for AI USMCA analysis
 */
export async function buildComprehensiveUSMCAPrompt(formData, componentRates = {}, preCalculatedFinancials = {}) {
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

  const prompt = `You are a senior trade compliance strategist advising an SMB owner on USMCA qualification strategy.

Your role is to SYNTHESIZE the provided financial data into strategic business advice, NOT to calculate numbers (calculations are pre-done for accuracy and speed).

The owner needs to understand:
1. What they're qualifying for and what it means for their business
2. What hidden risks remain in their supply chain
3. Strategic options available with pre-calculated ROI
4. How their competitive position compares

⚡ CRITICAL: Use the provided financial_impact data directly - do NOT recalculate or modify these numbers. They are pre-calculated for accuracy.

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
- Total North American Content: ${totalNAContent}%
- Required Threshold: ${threshold.rvc}%
- QUALIFIED FOR USMCA?: ${totalNAContent >= threshold.rvc ? 'YES - Meets RVC requirement' : 'NO - Falls short of RVC requirement'}${section301Applicable ? `

CRITICAL POLICY EXPOSURE (2025): This company has Chinese-origin components subject to Section 301 tariffs. If qualified for USMCA, base MFN duties are eliminated, but Section 301 tariffs REMAIN - creating policy risk and ongoing cost burden. IMPORTANT: Determine the ACTUAL Section 301 rate from the USTR tariff list - rates vary by HS code (7.5%-50%, most electronics at 25%, some steel at 7.5%).` : ''}${deMinimisNote ? `

${deMinimisNote}` : ''}

FINANCIAL IMPACT (PRE-CALCULATED):
- Annual Tariff Savings: $${preCalculatedFinancials.annual_tariff_savings?.toLocaleString() || 0}
- Monthly Tariff Savings: $${preCalculatedFinancials.monthly_tariff_savings?.toLocaleString() || 0}
- Tariff Cost Without USMCA: $${preCalculatedFinancials.tariff_cost_without_qualification?.toLocaleString() || 0}/year
- Section 301 Exposure: ${preCalculatedFinancials.section_301_exposure?.is_exposed ? `YES - $${preCalculatedFinancials.section_301_exposure?.annual_cost_burden?.toLocaleString() || 0}/year burden` : 'NO - No Chinese-origin components'}

PREFERENCE CRITERION: Only determine if product QUALIFIES for USMCA (${totalNAContent}% >= ${threshold.rvc}% threshold).
- If QUALIFIED (${totalNAContent}% >= ${threshold.rvc}%):
  * Determine which USMCA criterion applies (A/B/C/D) based on their qualification method
  * Criterion A: All materials wholly obtained in USMCA territory (rare)
  * Criterion B: RVC (Regional Value Content) - use this if the ${totalNAContent}% content meets their ${threshold.rvc}% requirement
  * Criterion C: Specific origin rule by product type
  * Criterion D: Administrative rule for certain sectors
  * Most products use Criterion B (RVC) - use that unless a specific origin rule explicitly applies to their HS code
- If NOT QUALIFIED (${totalNAContent}% < ${threshold.rvc}%):
  * Set qualified: false, preference_criterion: null
  * Identify the exact gap (${threshold.rvc}% - ${totalNAContent}% = ${Math.max(0, threshold.rvc - totalNAContent)}% short)
  * Explain what would need to change to qualify

CRITICAL INSTRUCTION FOR THE "reason" FIELD:
Write this as a senior trade strategist would advise an SMB owner. It should read like business advice, not regulatory documentation.

Key elements (ALL NUMBERS MUST BE CALCULATED FROM ACTUAL DATA):
- Lead with GOOD news (qualified? savings?)
- Quantify everything in ACTUAL DOLLARS based on their trade volume, not example percentages
- Identify the KEY vulnerability (Section 301? Supply concentration?)
- Present options with SPECIFIC CALCULATED tradeoffs based on their industry and complexity:
  * Cost premiums: Calculate based on industry (electronics: 1-3%, automotive: 2-4%, textiles: 0-2%, aerospace: 15-20%)
  * Timelines: Calculate based on product complexity (simple: 4-8 weeks, standard: 6-12 weeks, complex: 12-20 weeks, highly engineered: 20-26 weeks)
  * Payback period: Calculate as (setup_cost + annual_premium_cost) / (monthly_section_301_savings × 12)
- Show competitive/strategic context
- Close with a business decision framework

FORBIDDEN: Generic numbers (25%, 2%, 3 months, 4-6 weeks) - calculate everything from THIS user's data

This is NOT a compliance assessment - it's strategic business advice with specific financial analysis.

RESPONSE FORMAT - BUSINESS INTELLIGENCE ANALYSIS:

{
  product: {
    hs_code: "string",
    confidence: number
  },

  // ✅ CRITICAL: Component-level tariff rates (Oct 26, 2025 FIX)
  // Frontend requires these fields for each component to display correctly
  // If ANY are missing, frontend shows 0.0% and breaks the certificate flow
  components: [
    {
      "description": "Component name from user input",
      "hs_code": "10-digit HS code",
      "origin_country": "Country code (CN, MX, US, etc)",
      "value_percentage": number,  // From user input
      "mfn_rate": number,          // CRITICAL: Base Most Favored Nation rate (%)
      "usmca_rate": number,        // Preferential rate after USMCA qualification (%)
      "section_301": number,       // Policy tariff for Chinese-origin goods to USA (%)
      "section_232": number,       // Steel/aluminum safeguard duty (%)
      "total_rate": number,        // Sum of all applied duties
      "savings_percentage": number, // (mfn_rate - usmca_rate) / mfn_rate × 100
      "policy_adjustments": ["Section 301 for Chinese origin", ...],  // Applied policies
      "ai_confidence": number,     // 0-100 confidence in this rate
      "data_source": "USITC October 2025 | USTR List 4A | DB cache"
    }
  ],

  usmca: {
    qualified: boolean,
    preference_criterion: "A|B|C|D - Which USMCA rule of origin applies",
    component_breakdown: "COPY the components array above - frontend needs this for table display",
    threshold_applied: ${threshold.rvc},
    threshold_source: "${threshold.article}",
    threshold_reasoning: "Why this threshold applies to their industry",
    north_american_content: number,
    gap: number,
    rule: "RVC ${threshold.rvc}%",
    reason: "BUSINESS-FOCUSED executive summary synthesizing the financial impact and risks - not just compliance jargon"
  },
  financial_impact: {
    // ✅ OPTIMIZED (Oct 26): Use pre-calculated numbers directly
    // DO NOT recalculate or modify these - they are pre-computed for accuracy
    annual_tariff_savings: ${preCalculatedFinancials.annual_tariff_savings || 0},
    monthly_tariff_savings: ${preCalculatedFinancials.monthly_tariff_savings || 0},
    savings_percentage: ${preCalculatedFinancials.savings_percentage || 0},
    tariff_cost_without_qualification: ${preCalculatedFinancials.tariff_cost_without_qualification || 0},
    section_301_exposure: {
      is_exposed: ${preCalculatedFinancials.section_301_exposure?.is_exposed || false},
      annual_cost_burden: ${preCalculatedFinancials.section_301_exposure?.annual_cost_burden || 0},
      affected_components: ${JSON.stringify(preCalculatedFinancials.section_301_exposure?.affected_components || [])},
      policy_risk: "Section 301 rates can change with 30-day notice from USTR, creating ongoing cost volatility"
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
      option: "Maintain current China sourcing",
      cost_impact: "Continue $${preCalculatedFinancials.section_301_exposure?.annual_cost_burden?.toLocaleString() || 0}/year Section 301 burden",
      risk_profile: "Exposed to policy changes (rates can shift with 30-day notice)",
      timeline: "Immediate",
      payback_months: null
    }${preCalculatedFinancials.section_301_exposure?.is_exposed ? `,
    {
      option: "Switch to Mexico supplier for exposed component",
      cost_impact: "Use Mexico_Sourcing_Config for estimated premiums: electronics 1-3%, auto 2-4%, textiles 0-2%, machinery 3-5%. Show setup_cost + annual_premium vs Section_301 burden.",
      benefit: "Eliminates $${preCalculatedFinancials.section_301_exposure?.annual_cost_burden?.toLocaleString() || 0}/year Section 301 exposure, increases RVC buffer, policy insulation",
      timeline: "4-12 weeks depending on product complexity",
      payback_months: "Calculate based on annual_section_301_burden vs implementation costs",
      recommendation_rationale: "Competitive advantage, policy insulation, supply chain resilience"
    }` : ''}
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

/**
 * Calculate Mexico nearshoring alternatives with dynamic cost/payback
 * ✅ REWRITTEN: Uses config lookup instead of 3 expensive AI calls
 *
 * OLD COST: 3 AI calls × $0.01 = $0.03 per analysis
 * NEW COST: 0 AI calls = $0.00 per analysis
 * IMPROVEMENT: 100% cost reduction, instant response
 *
 * @param {Object} formData - Form submission data
 * @param {Object} section301Exposure - { annual_cost_burden, affected_components }
 * @returns {Object} Mexico sourcing analysis (synchronous - no AI calls)
 */
export function calculateMexicoNearshoring(formData, section301Exposure) {
  try {
    // ✅ Get metrics from config lookup (instant, no AI)
    const metrics = MEXICO_SOURCING_CONFIG.calculateMetrics(
      formData.industry_sector,
      formData.product_complexity || 'medium',
      formData.trade_volume || 0
    );

    // Calculate payback period (local math)
    const tariffBurden = section301Exposure?.annual_cost_burden || 0;
    const annualPremiumCost = (formData.trade_volume || 0) * (metrics.cost_premium_percent / 100);
    const netAnnualSavings = tariffBurden - annualPremiumCost;

    const paybackMonths = netAnnualSavings > 0
      ? Math.ceil((metrics.setup_cost_usd + annualPremiumCost) / (netAnnualSavings / 12))
      : null;

    return {
      success: true,
      cost_premium_percent: metrics.cost_premium_percent,
      annual_cost_increase_usd: Math.round(annualPremiumCost),
      setup_cost_usd: metrics.setup_cost_usd,
      implementation_weeks: metrics.implementation_weeks,
      payback_months: paybackMonths,
      confidence: 0.85,
      section_301_exposure: section301Exposure,
      source: 'mexico_sourcing_config'  // ← NOT AI (static config)
    };

  } catch (error) {
    console.error('[calculateMexicoNearshoring] Error:', error);

    // Fallback to industry defaults
    return {
      success: false,
      error: error.message,
      fallback: {
        cost_premium_percent: 2.0,
        timeline_weeks: 8,
        payback_months: 3,
        warning: 'Using default estimates - AI calculation unavailable'
      }
    };
  }
}
