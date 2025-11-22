/**
 * Triangle Intelligence Platform - USMCA Qualification Engine
 * Copyright © 2025 Triangle Intelligence Platform. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * Unauthorized copying, modification, or distribution prohibited.
 * This file contains proprietary Regional Value Content calculation methodology.
 */

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
  // Get industry threshold (use STABLE treaty thresholds from database)
  // ✅ FIX (Nov 13): Removed HS code lookup - RVC thresholds are TREATY-BASED (stable)
  // Bug: Nov 6 change broke system by using AI for treaty thresholds (Electronics 65% → wrong Automotive 75%)
  // Context: With Trump tariff threats, accurate USMCA qualification is CRITICAL
  //   - RVC thresholds (65%, 75%) = STABLE (treaty Articles 4.2-4.5, can't change easily)
  //   - Section 301 tariffs (25% → 60%+) = VOLATILE (handled separately with stale: true)
  const threshold = await getIndustryThreshold(formData.industry_sector, {
    // hsCode REMOVED - was triggering AI agent that returned wrong thresholds
    userId: formData.user_id,
    workflowId: formData.workflow_id,
    companyName: formData.company_name
  });

  // Calculate manufacturing labor - SIMPLIFIED (Nov 21, 2025)
  // Rule: Have actual labor cost data? Use it. No data? Labor credit = 0%.
  const manufacturingLocation = formData.manufacturing_location;
  const isUSMCAManufacturing = ['US', 'MX', 'CA'].includes(manufacturingLocation);

  // ✅ SIMPLIFIED LABOR CREDIT CALCULATION (Nov 21, 2025)
  // No phantom credits - only use actual user-provided data
  let laborValueAdded = 0;
  let laborCostSource = 'none';

  if (formData.has_labor_cost_data && formData.labor_cost_annual > 0 && formData.trade_volume > 0) {
    // User provided actual annual labor cost - calculate percentage
    laborValueAdded = (formData.labor_cost_annual / formData.trade_volume) * 100;
    laborCostSource = 'user_provided';
  }
  // else: No labor cost data = 0% labor credit (honest, no fabrication)

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

${laborCostSource === 'user_provided' ? `✅ USER-PROVIDED LABOR CREDIT: ${laborValueAdded.toFixed(1)}%

Source: Annual direct labor cost $${formData.labor_cost_annual.toLocaleString()} ÷ Trade volume $${formData.trade_volume.toLocaleString()}

CRITICAL: You MUST use this exact labor credit percentage: ${laborValueAdded.toFixed(1)}%
DO NOT adjust or modify this user-provided value.
This is actual cost data from the manufacturer's accounting records.

Return labor_credit_percentage: ${laborValueAdded.toFixed(1)}%`
: `⚠️ NO LABOR CREDIT - No Labor Cost Data Provided

User checked "I don't have labor cost data" or did not provide annual labor cost.

REQUIRED: You MUST return labor_credit_percentage: 0%

DO NOT fabricate, estimate, or infer labor credit without actual annual labor cost data.
DO NOT use industry baselines or substantial transformation checkbox for labor credit.

The only acceptable labor credit source is actual annual direct labor cost in dollars.

Return labor_credit_percentage: 0%`}` : `Manufacturing in ${manufacturingLocation} (non-USMCA country) = 0% labor credit.`}

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
    "north_american_content": [YOUR CALCULATED: component_rvc + labor_credit],
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
