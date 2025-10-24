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

  const prompt = `You are a USMCA trade compliance expert analyzing qualification for ${formData.product_description}.

Analyze whether this product qualifies for USMCA preferential treatment and provide educational explanations for an SMB owner juggling their business.

PRODUCT & BUSINESS CONTEXT:
- Industry: ${industry} (Threshold: ${threshold.rvc}% RVC per ${threshold.article})
- Manufacturing: ${manufacturingLocation} (Labor credit: ${laborValueAdded}%)
- Trade Flow: ${origin}→${destination}${formData.trade_volume ? ` | Annual Volume: $${formData.trade_volume}` : ''}

COMPONENTS:
${componentBreakdown}

MANUFACTURING CONTEXT:
${laborValueAdded}% manufacturing credit for assembly in ${manufacturingLocation} (USMCA Article ${threshold.article}).
${substantialTransformation ? '✓ Substantial transformation - complex processes improve qualification strength' : '⚠️ Standard assembly - document all value-added activities'}

Regional Content Calculation (Show your work for transparency):
- USMCA Components: ${usmcaComponentTotal}%
- Manufacturing Labor Credit: ${laborValueAdded}%
- Total North American Content: ${totalNAContent}%${section301Applicable ? `

CURRENT POLICY ALERT (2025): Chinese components remain subject to Section 301 tariffs (~25%) even with USMCA qualification. Base MFN duties are eliminated, but Section 301 remains.` : ''}${deMinimisNote ? `

${deMinimisNote}` : ''}

// ✅ REMOVED duplicate savings calculation request
// Savings calculation moved to detailed_analysis section only (see line 834-840)
// Single source of truth: AI calculates savings ONCE in structured format

PREFERENCE CRITERION: Determine which USMCA criterion applies (A/B/C/D) based on the product's qualification method (${threshold.method}) and whether it has non-USMCA components.

RESPONSE FORMAT (educational and transparent):

{
  product: {
    hs_code: "string",
    confidence: number
  },
  usmca: {
    qualified: boolean,  // YOUR determination based on analysis
    threshold_applied: ${threshold.rvc},
    threshold_source: "${threshold.article}",
    threshold_reasoning: "Explain why this threshold applies",
    north_american_content: number,  // YOUR calculated total
    gap: number,  // Difference from threshold
    rule: "RVC ${threshold.rvc}%",
    reason: "Your detailed reasoning for qualification decision",
    component_breakdown: array,
    documentation_required: ["string"],
    method_of_qualification: "${threshold.method}",
    preference_criterion: "A/B/C/D"  // Choose based on your analysis
  },
  recommendations: ["Actionable recommendations"],
  detailed_analysis: {
    threshold_research: "Why this specific threshold applies",
    calculation_breakdown: "Step-by-step calculation with your reasoning",
    qualification_reasoning: "Why you determined this qualification status",
    strategic_insights: "Business optimization opportunities",
    savings_analysis: {
      // ✅ FIXED ISSUE #1: SINGLE source of truth for savings calculation
      // AI must calculate ONLY HERE and nowhere else to prevent conflicting answers
      annual_savings: number,  // Total annual USMCA savings (base MFN duties eliminated)
      monthly_savings: number,  // annual_savings / 12
      savings_percentage: number,  // (Total savings / Total trade volume) × 100
      mfn_rate: number,  // Average MFN rate across all components (for display)
      calculation_detail: "CRITICAL: Show your calculation exactly like this:\\n\\nPer Component:\\n- [Component name]: $[Volume] × [Component %] × [Tariff Rate] = $[Savings]\\n\\nThen: SUM all components = $[Total Annual Savings]\\n\\nMonthly: $[Total] ÷ 12 = $[Monthly]\\n\\nPercentage: ($[Total] ÷ $[Trade Volume]) × 100 = [%]\\n\\nIf Chinese components: Only eliminate base MFN (Section 301 tariffs remain)."
    }
  },
  confidence_score: number
}`;

  return prompt;
}
