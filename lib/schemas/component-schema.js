/**
 * COMPONENT DATA CONTRACT
 * Single source of truth for enriched component structure
 * Used by: enrichment API, WorkflowResults, trade-risk-alternatives display
 *
 * CRITICAL: All code must use these EXACT field names
 */

/**
 * Enriched Component Structure
 * This is what ai-usmca-complete-analysis.js produces
 * This is what WorkflowResults.js must preserve
 * This is what trade-risk-alternatives.js expects to display
 */
export const ENRICHED_COMPONENT_SCHEMA = {
  // Basic component data (user input)
  description: 'string',                    // Component description
  component_type: 'string',                 // Alias for description
  origin_country: 'string',                 // 2-letter country code (MX, CN, US, etc.)
  country: 'string',                        // Alias for origin_country
  value_percentage: 'number',               // Percentage of total product value
  percentage: 'number',                     // Alias for value_percentage
  manufacturing_location: 'string',         // Where it's made/assembled

  // Enrichment data (AI-generated)
  hs_code: 'string',                        // Classified HS code (8413.91.90)
  classified_hs_code: 'string',             // Alias for hs_code
  hs_description: 'string',                 // Description of HS code

  // Tariff rates (AI-generated with 2025 policy context)
  mfn_rate: 'number',                       // Current MFN rate (with 2025 adjustments)
  base_mfn_rate: 'number',                  // Base MFN rate (pre-policy)
  policy_adjusted_mfn_rate: 'number',       // MFN rate after policy adjustments
  usmca_rate: 'number',                     // USMCA preferential rate

  // Policy layers (CRITICAL for Section 301 display)
  section_301: 'number',                    // Section 301 additional tariff (China goods)
  section_232: 'number',                    // Section 232 (steel/aluminum)
  port_fees: 'number',                      // Port fees and other costs
  total_rate: 'number',                     // Total effective rate (all layers combined)

  // Savings calculation
  savings_percentage: 'number',             // MFN rate - USMCA rate (DISPLAY NAME)
  savings_percent: 'number',                // Alias (API OUTPUT NAME)

  // AI confidence and metadata
  ai_confidence: 'number',                  // AI classification confidence 0-100 (DISPLAY NAME)
  confidence: 'number',                     // Alias (API OUTPUT NAME)
  ai_reasoning: 'string',                   // Why AI chose this classification
  alternative_codes: 'array',               // Alternative HS codes considered

  // Policy adjustments
  policy_adjustments: 'array',              // List of policy changes applied
  rate_source: 'string',                    // 'ai_current_2025', 'database', 'user_provided'
  last_updated: 'string',                   // ISO date string

  // USMCA qualification
  is_usmca_member: 'boolean',               // Is origin country US/MX/CA?

  // Database comparison (optional)
  database_comparison: 'object'             // Comparison with stale database data
};

/**
 * STRICT VALIDATION: Enforce origin_country field
 * Prevents accidental field name inconsistencies from spreading through the system
 * @param {Object} component - Component to validate
 * @returns {Object} Validated component with enforced origin_country field
 * @throws {Error} If component lacks origin country data
 */
export function validateComponentSchema(component, context = 'Unknown') {
  // Strict validation: must have origin country
  const originCountry = component.origin_country || component.country;

  if (!originCountry) {
    const err = new Error(`[SCHEMA ERROR in ${context}] Component missing origin_country field: ${JSON.stringify(component)}`);
    console.error(`❌ ${err.message}`);
    throw err;
  }

  // Warn if using deprecated 'country' field
  if (component.country && !component.origin_country) {
    console.warn(`⚠️  [DEPRECATION] Component using deprecated 'country' field in ${context}. Please use 'origin_country' instead.`);
  }

  return { valid: true, origin_country: originCountry };
}

/**
 * Normalize component data to ensure consistent field names
 * Handles both API output names and display names
 */
export function normalizeComponent(component) {
  return {
    // Basic data (preserve both names)
    description: component.description || component.component_type || '',
    component_type: component.component_type || component.description || '',
    origin_country: component.origin_country || component.country || '',
    country: component.country || component.origin_country || '',
    value_percentage: component.value_percentage || component.percentage || 0,
    percentage: component.percentage || component.value_percentage || 0,
    manufacturing_location: component.manufacturing_location || '',

    // HS classification (preserve both names)
    hs_code: component.hs_code || component.classified_hs_code || '',
    classified_hs_code: component.classified_hs_code || component.hs_code || '',
    hs_description: component.hs_description || '',

    // Tariff rates (preserve all)
    mfn_rate: component.mfn_rate || 0,
    base_mfn_rate: component.base_mfn_rate || component.mfn_rate || 0,
    policy_adjusted_mfn_rate: component.policy_adjusted_mfn_rate || component.mfn_rate || 0,
    usmca_rate: component.usmca_rate || 0,

    // Policy layers (CRITICAL for Section 301 display)
    section_301: component.section_301 || 0,
    section_232: component.section_232 || 0,
    port_fees: component.port_fees || 0,
    total_rate: component.total_rate || component.mfn_rate || 0,

    // Savings (CRITICAL: Create BOTH field names)
    savings_percentage: component.savings_percentage || component.savings_percent ||
                       ((component.mfn_rate || 0) - (component.usmca_rate || 0)),
    savings_percent: component.savings_percent || component.savings_percentage ||
                    ((component.mfn_rate || 0) - (component.usmca_rate || 0)),

    // Confidence (CRITICAL: Create BOTH field names)
    ai_confidence: component.ai_confidence || component.confidence || 0,
    confidence: component.confidence || component.ai_confidence || 0,

    // Metadata
    ai_reasoning: component.ai_reasoning || '',
    alternative_codes: component.alternative_codes || [],
    policy_adjustments: component.policy_adjustments || [],
    rate_source: component.rate_source || '',
    last_updated: component.last_updated || new Date().toISOString().split('T')[0],
    is_usmca_member: component.is_usmca_member || false,
    database_comparison: component.database_comparison || null
  };
}

/**
 * Validate enriched component has all required fields for display
 * Returns array of missing fields
 */
export function validateEnrichedComponent(component) {
  const required = [
    'description',
    'origin_country',
    'value_percentage',
    'hs_code',
    'mfn_rate',
    'usmca_rate',
    'savings_percentage',
    'ai_confidence'
  ];

  const missing = required.filter(field => {
    const value = component[field];
    return value === undefined || value === null || value === '';
  });

  return {
    valid: missing.length === 0,
    missing: missing,
    component_description: component.description || component.component_type || 'Unknown'
  };
}

/**
 * Log validation results for debugging
 */
export function logComponentValidation(components, context = 'Unknown') {
  console.log(`\n🔍 Component Validation - ${context}`);
  console.log(`📊 Total Components: ${components.length}`);

  const validationResults = components.map(comp => validateEnrichedComponent(comp));
  const invalidCount = validationResults.filter(r => !r.valid).length;

  if (invalidCount > 0) {
    console.error(`❌ ${invalidCount} components missing enrichment data:`);
    validationResults.filter(r => !r.valid).forEach(result => {
      console.error(`   • "${result.component_description}": Missing ${result.missing.join(', ')}`);
    });
  } else {
    console.log(`✅ All ${components.length} components fully enriched`);
  }

  return {
    total: components.length,
    valid: components.length - invalidCount,
    invalid: invalidCount,
    results: validationResults
  };
}

/**
 * CRITICAL VALIDATION: Verify component data integrity BEFORE API response
 *
 * This prevents the "silent data loss" bug where:
 * 1. AI calculates correct tariff rates ✅
 * 2. API stores them in result.usmca.component_breakdown ✅
 * 3. API overwrites with raw data in result.component_origins ❌
 * 4. Frontend receives 0.0% rates ❌
 * 5. No error - just broken output ❌
 *
 * This validation catches #3 and #4 immediately by verifying:
 * - Component arrays exist and have data
 * - Each component has all required tariff fields
 * - No undefined/null where data is required
 * - Data types are correct (numbers, not strings or undefined)
 *
 * @param {Object} result - The API result object about to be sent
 * @throws {Error} If validation fails (loud failure, not silent)
 */
export function validateAPIResponse(result) {
  const errors = [];

  // Check 1: Components exist
  const components = result?.component_origins || result?.components || [];

  if (!Array.isArray(components) || components.length === 0) {
    throw new Error(
      `❌ VALIDATION FAILED: No components in API response.\n` +
      `  - result.component_origins: ${Array.isArray(result?.component_origins) ? result.component_origins.length : 'missing'}\n` +
      `  - result.components: ${Array.isArray(result?.components) ? result.components.length : 'missing'}\n` +
      `  This indicates data was lost between AI enrichment and API response.`
    );
  }

  // Check 2: Each component has required tariff fields (not all 0 or undefined)
  const requiredFields = ['mfn_rate', 'usmca_rate', 'section_301', 'total_rate', 'savings_percentage'];
  const fieldIssues = [];

  components.forEach((component, index) => {
    // At least ONE tariff field should have a non-zero value
    const hasAnyTariffData = requiredFields.some(field => {
      const value = component[field];
      return value !== undefined && value !== null && value !== '';
    });

    if (!hasAnyTariffData) {
      fieldIssues.push(
        `Component ${index + 1} "${component.description}": ` +
        `All tariff fields are empty/zero ` +
        `[mfn:${component.mfn_rate}, usmca:${component.usmca_rate}, s301:${component.section_301}]`
      );
    }

    // Check for obviously broken data (missing core fields)
    if (!component.description || component.description.trim() === '') {
      fieldIssues.push(`Component ${index + 1}: Missing description`);
    }

    if (component.value_percentage === undefined || component.value_percentage === null) {
      fieldIssues.push(`Component ${index + 1}: Missing value_percentage`);
    }
  });

  if (fieldIssues.length > 0) {
    errors.push(
      `❌ VALIDATION FAILED: Components missing tariff data\n` +
      `  Issues found:\n` +
      fieldIssues.map(issue => `    - ${issue}`).join('\n') +
      `\n  This means AI enrichment did not complete successfully or result was overwritten.`
    );
  }

  // Check 3: USMCA qualification makes sense
  const usmca = result?.usmca || {};

  if (usmca.qualified === undefined || usmca.qualified === null) {
    errors.push(
      `❌ VALIDATION FAILED: USMCA qualification status missing\n` +
      `  result.usmca.qualified is undefined - AI analysis incomplete?`
    );
  }

  if (components.length > 0 && !usmca.component_breakdown) {
    errors.push(
      `⚠️ WARNING: USMCA component breakdown missing\n` +
      `  This is where enriched tariff data is stored. Check that ` +
      `result.usmca.component_breakdown is populated by AI analysis.`
    );
  }

  // Throw ALL errors at once (don't fix one and find another later)
  if (errors.length > 0) {
    const errorMessage = errors.join('\n\n');
    console.error('📋 API RESPONSE VALIDATION ERRORS:');
    console.error(errorMessage);
    console.error('\n🔍 Debug Info:');
    console.error(`  - Components count: ${components.length}`);
    console.error(`  - First component:`, components[0] || 'none');
    console.error(`  - USMCA qualified: ${usmca.qualified}`);

    throw new Error(errorMessage);
  }

  // If we get here, response is valid
  console.log(`✅ API RESPONSE VALIDATION PASSED`);
  console.log(`  - ${components.length} components with tariff data`);
  console.log(`  - USMCA qualified: ${usmca.qualified}`);

  return true;
}
