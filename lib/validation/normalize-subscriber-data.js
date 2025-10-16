/**
 * SUBSCRIBER DATA NORMALIZATION
 * Ensures consistent field naming before database storage
 * Prevents field name inconsistencies found in production audit
 */

/**
 * Normalize subscriber data to use correct field names
 * @param {Object} data - Raw subscriber data from API request
 * @returns {Object} Normalized data with correct field names
 */
function normalizeSubscriberData(data) {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const normalized = { ...data };

  // CRITICAL FIX: Rename 'components' → 'component_origins'
  // Issue found: 4 production records had wrong field name
  // Migration 020 fixed existing data, this prevents future occurrences
  if (normalized.components && !normalized.component_origins) {
    console.warn('⚠️ Normalizing: components → component_origins');
    normalized.component_origins = normalized.components;
    delete normalized.components;
  }

  // Normalize component_origins array to ensure snake_case fields
  if (normalized.component_origins && Array.isArray(normalized.component_origins)) {
    normalized.component_origins = normalized.component_origins.map(comp => normalizeComponent(comp));
  }

  return normalized;
}

/**
 * Normalize a single component to use snake_case field names
 * @param {Object} component - Component data
 * @returns {Object} Normalized component with snake_case fields
 */
function normalizeComponent(component) {
  if (!component || typeof component !== 'object') {
    return component;
  }

  const normalized = {};

  // Map camelCase → snake_case (accept both, store as snake_case)
  const fieldMappings = {
    // Core fields
    'description': 'description',
    'originCountry': 'origin_country',
    'origin_country': 'origin_country',
    'country': 'origin_country', // Alias
    'valuePercentage': 'value_percentage',
    'value_percentage': 'value_percentage',
    'percentage': 'value_percentage', // Alias
    'componentType': 'component_type',
    'component_type': 'component_type',

    // Enrichment fields (from AI/database)
    'hsCode': 'hs_code',
    'hs_code': 'hs_code',
    'classifiedHsCode': 'classified_hs_code',
    'classified_hs_code': 'classified_hs_code',
    'hsDescription': 'hs_description',
    'hs_description': 'hs_description',
    'mfnRate': 'mfn_rate',
    'mfn_rate': 'mfn_rate',
    'usmcaRate': 'usmca_rate',
    'usmca_rate': 'usmca_rate',
    'savingsAmount': 'savings_amount',
    'savings_amount': 'savings_amount',
    'savingsPercentage': 'savings_percentage',
    'savings_percentage': 'savings_percentage',
    'savingsPercent': 'savings_percent',
    'savings_percent': 'savings_percent',
    'aiConfidence': 'ai_confidence',
    'ai_confidence': 'ai_confidence',
    'confidence': 'confidence',
    'isUsmcaMember': 'is_usmca_member',
    'is_usmca_member': 'is_usmca_member',
    'rateSource': 'rate_source',
    'rate_source': 'rate_source',
    'lastUpdated': 'last_updated',
    'last_updated': 'last_updated'
  };

  // Apply field mappings
  Object.keys(component).forEach(key => {
    const normalizedKey = fieldMappings[key] || key;

    // Only set if not already set (prefer existing snake_case)
    if (normalized[normalizedKey] === undefined) {
      normalized[normalizedKey] = component[key];
    }
  });

  return normalized;
}

/**
 * Validate that subscriber_data has required fields
 * @param {Object} data - Normalized subscriber data
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateSubscriberData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['subscriber_data must be an object'] };
  }

  // Check for component_origins (most critical field for admin dashboards)
  if (data.component_origins) {
    if (!Array.isArray(data.component_origins)) {
      errors.push('component_origins must be an array');
    } else if (data.component_origins.length > 0) {
      // Validate each component has required fields
      data.component_origins.forEach((comp, idx) => {
        if (!comp.description && !comp.component_type) {
          errors.push(`Component ${idx + 1}: missing description or component_type`);
        }
        if (!comp.origin_country && !comp.country) {
          errors.push(`Component ${idx + 1}: missing origin_country`);
        }
        if (comp.value_percentage === undefined && comp.percentage === undefined) {
          errors.push(`Component ${idx + 1}: missing value_percentage`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Log validation warnings without failing the request
 * @param {Object} validationResult - Result from validateSubscriberData
 * @param {string} context - Where this validation is happening
 */
function logValidationWarnings(validationResult, context = 'API') {
  if (!validationResult.isValid) {
    console.warn(`⚠️ ${context} validation warnings:`, validationResult.errors);
  }
}

// ES6 exports for Next.js compatibility
export {
  normalizeSubscriberData,
  normalizeComponent,
  validateSubscriberData,
  logValidationWarnings
};
