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
 * @param {Object} finalProductClassification - Pre-classified final product HS code (Nov 12, 2025)
 * @returns {Promise<string>} Complete prompt for AI USMCA analysis
 */
export async function buildComprehensiveUSMCAPrompt(formData, componentRates = {}, preCalculatedFinancials = {}, finalProductClassification = null) {
  // ✅ NEW (Nov 6, 2025): Extract primary HS code from components for AI threshold lookup
  const primaryHSCode = formData.component_origins?.[0]?.hs_code ||
                        formData.hs_code ||
                        null;

  // Get industry threshold (AI-first with HS code, falls back to static DB)
  const threshold = await getIndustryThreshold(formData.industry_sector, {
    hsCode: primaryHSCode,  // ✅ Pass HS code for precise AI lookup
    userId: formData.user_id,
    workflowId: formData.workflow_id,
    companyName: formData.company_name
  });

  // Calculate manufacturing labor (AI-driven for all 3 USMCA countries)
  const manufacturingLocation = formData.manufacturing_location;
  const isUSMCAManufacturing = ['US', 'MX', 'CA'].includes(manufacturingLocation);
  const substantialTransformation = formData.substantial_transformation || false;
  const manufacturingProcess = formData.manufacturing_process || null;
  // ✅ USE DATABASE labor_percentage as baseline (populated by AI research Nov 10, 2025)
  const laborValueAdded = threshold.labor || 12; // Fallback: minimum typical USMCA labor credit (5-25% range per Article 4.5)

  // Format components (minimal)
  const componentBreakdown = formData.component_origins
    .map((c) => `- ${c.description} (${c.value_percentage}% from ${c.origin_country})`)
    .join('\n');

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

  // Build product classification section (Nov 12, 2025)
  const productClassificationSection = finalProductClassification && finalProductClassification.hs_code
    ? `✅ FINAL PRODUCT ALREADY CLASSIFIED (Nov 12, 2025):
The final assembled product has been pre-classified using systematic HS code analysis:
- Product: "${formData.product_description}"
- HS Code: ${finalProductClassification.hs_code}
- Description: ${finalProductClassification.description || 'N/A'}
- Confidence: ${finalProductClassification.confidence}%
- Classification Reasoning: ${finalProductClassification.explanation || 'N/A'}

USE THIS PRE-CLASSIFIED HS CODE in your response. Do not re-classify the product.
Return the same HS code, description, and confidence score in the "product" section below.`
    : `⚠️ PRODUCT CLASSIFICATION REQUIRED:
Pre-classification was not available. Based on product description "${formData.product_description}", determine the FINAL ASSEMBLED PRODUCT HS code.
- Look at the components and manufacturing process
- Classify the completed product (not components)
- Return 8-digit HS code (US HTS standard, not 10-digit statistical suffix)
- Provide confidence score 0.0-1.0 (0.95 = 95% confident)`;

  const prompt = `You are a trade compliance analyst. Your task is to determine USMCA qualification based on the provided data.

RESPONSE FORMAT:
- Return only the JSON object below (any text before/after will cause parsing errors)
- Use the provided component percentages and thresholds in your calculations
- Keep response concise (under 2000 characters)

PRODUCT & BUSINESS CONTEXT:
- Industry: ${industry} (Threshold: ${threshold.rvc}% RVC per ${threshold.article})
- Manufacturing: ${manufacturingLocation}${isUSMCAManufacturing ? ' (USMCA country - eligible for labor credit)' : ' (Non-USMCA - no labor credit)'}
- Trade Flow: ${origin}→${destination}${formData.trade_volume ? ` | Annual Volume: $${formData.trade_volume}` : ''}

COMPONENTS:
${componentBreakdown}

MANUFACTURING LABOR CREDIT CALCULATION:
${isUSMCAManufacturing ? `Manufacturing in ${manufacturingLocation} qualifies for labor value credit under USMCA Article ${threshold.article}.
${substantialTransformation ? `✓ Substantial transformation confirmed${manufacturingProcess ? `\n  Manufacturing activities: ${manufacturingProcess}` : ''}` : '⚠️ Standard assembly only'}

${laborValueAdded > 0 ? `LABOR CREDIT BASELINE: ${laborValueAdded}% (from industry research for ${industry})

You may adjust this baseline UP or DOWN based on actual manufacturing complexity:
${manufacturingProcess ? `- Actual processes: ${manufacturingProcess}` : '- No specific process details provided'}
- Complexity: ${substantialTransformation ? 'High (substantial transformation)' : 'Standard (assembly)'}

Adjustment approach:
- Evaluate actual manufacturing complexity relative to typical ${industry} operations
- Adjust baseline UP if processes involve significant value-added transformation
- Adjust baseline DOWN if processes are simple assembly with minimal transformation
- If no process details provided, use baseline ${laborValueAdded}% as-is
- Final labor_credit_percentage must stay within USMCA Article 4.5 range (5-25%)
- Justify your adjustment based on described manufacturing intensity

Return your final labor_credit_percentage with reasoning.` : `⚠️ NO LABOR CREDIT DATA FOUND for ${industry}.

RESEARCH REQUIRED: Calculate appropriate labor credit percentage based on:
${manufacturingProcess ? `- Manufacturing processes: ${manufacturingProcess}` : '- No process details provided (use industry standards)'}
- Industry: ${industry}
- Complexity: ${substantialTransformation ? 'High (substantial transformation)' : 'Standard (assembly)'}
- USMCA Article 4.5 guidelines (typically 5-25% depending on manufacturing intensity)

Consider typical labor costs for direct assembly, processing, testing, and direct overhead (supervision, quality control, facilities).

Return your researched labor_credit_percentage.`}` : `Manufacturing in ${manufacturingLocation} (non-USMCA country) = 0% labor credit.`}

Regional Content Calculation:
YOU MUST CALCULATE:
- USMCA Components: ${usmcaComponentTotal}%
- Manufacturing Labor Credit: [YOUR CALCULATED %]
- Total North American Content: [USMCA Components + Labor Credit]%
- Required Threshold: ${threshold.rvc}%
- QUALIFIED FOR USMCA?: [YES if Total >= ${threshold.rvc}%, NO otherwise]${section301Applicable ? '\n\nNote: Chinese-origin components may be subject to Section 301 tariffs.' : ''}

PREFERENCE CRITERION (for USMCA Certificate Field 7):
If qualified, determine the CORRECT preference criterion by analyzing the product and manufacturing:

- Criterion A: Good wholly obtained or produced entirely in USMCA territory
  (e.g., agricultural products, minerals extracted in US/CA/MX)

- Criterion B: Good produced entirely from originating materials
  (ALL components must already qualify as USMCA originating)

- Criterion C: Good meets RVC threshold AND undergoes required tariff shift
  (Most common for manufactured goods with mixed origin components)

- Criterion D: Good satisfies product-specific rule from Annex 4-B
  (Industries with special sectoral rules - check Annex 4-B)

Research which criterion applies by evaluating:
1. Component origins: If ALL components are from USMCA countries, Criterion B may apply
2. Manufacturing process: Substantial transformation often indicates Criterion C
3. Industry rules: Some sectors have product-specific requirements (check Annex 4-B for Criterion D)

If not qualified: preference_criterion = null


PRODUCT CLASSIFICATION:
${productClassificationSection}

JUST DETERMINE QUALIFICATION & PRODUCT CLASSIFICATION - Return ONLY this JSON (no other text):

{
  "product": {
    "description": "${formData.product_description}",
    "hs_code": "XXXXXXXX",
    "hs_description": "Full product name per HS code",
    "confidence_score": 0.85
  },
  "usmca": {
    "qualified": boolean,
    "north_american_content": ${totalNAContent},
    "component_rvc": ${usmcaComponentTotal},
    "labor_credit": [YOUR CALCULATED LABOR CREDIT %],
    "threshold_applied": ${threshold.rvc},
    "preference_criterion": "A|B|C|D or null",
    "reason": "One sentence result: e.g. 'Qualified with 82% RVC (threshold 65%)', or 'Not qualified - 58% vs 65% required'"
  }
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
