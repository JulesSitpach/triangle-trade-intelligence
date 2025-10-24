/**
 * DATA CONTRACT VALIDATOR
 *
 * Enforces data contract compliance at API boundaries.
 * All data entering or leaving the system MUST pass validation.
 *
 * Usage:
 * - At API entry: validateComponentOrigin(req.body.component)
 * - At API exit: validateTariffRatesCache(cachedRow)
 * - At database read: validateWorkflowSession(row)
 */

import type {
  ComponentOrigin,
  UserTradeProfile,
  WorkflowSessionRow,
  TariffRatesCacheRow,
  CompanyInformation,
  TradeProfile,
  ProductInformation
} from '../types/data-contracts';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalized?: Record<string, any>;
}

/**
 * ============================================================================
 * COMPONENT VALIDATION
 * ============================================================================
 */

export function validateComponentOrigin(component: unknown, context = 'Unknown'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!component || typeof component !== 'object') {
    return {
      valid: false,
      errors: [`Component is not an object in ${context}`],
      warnings: []
    };
  }

  const comp = component as Record<string, any>;

  // Required fields
  if (!comp.description || typeof comp.description !== 'string') {
    errors.push(`Component missing/invalid 'description' in ${context}`);
  }

  if (!comp.hs_code || typeof comp.hs_code !== 'string') {
    errors.push(`Component missing/invalid 'hs_code' in ${context}`);
  }

  // Origin country - check both canonical and alias
  const originCountry = comp.origin_country || comp.country;
  if (!originCountry || typeof originCountry !== 'string') {
    errors.push(`Component missing/invalid 'origin_country' in ${context}`);
  } else if (comp.country && !comp.origin_country) {
    warnings.push(`Component using deprecated 'country' field - should be 'origin_country' in ${context}`);
  }

  // Value percentage - check both canonical and alias
  const percentage = comp.value_percentage ?? comp.percentage;
  if (percentage === null || percentage === undefined) {
    errors.push(`Component missing 'value_percentage' in ${context}`);
  } else if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
    errors.push(`Component invalid 'value_percentage' (must be 0-100) in ${context}`);
  } else if (comp.percentage && !comp.value_percentage) {
    warnings.push(`Component using deprecated 'percentage' alias - should be 'value_percentage' in ${context}`);
  }

  // Tariff rates - check they exist (may be 0, but must exist)
  const requiredRates = ['mfn_rate', 'base_mfn_rate', 'section_301', 'section_232', 'total_rate', 'usmca_rate'];
  requiredRates.forEach(rate => {
    if (comp[rate] === undefined || comp[rate] === null) {
      warnings.push(`Component missing tariff rate '${rate}' in ${context} - will cause invalid calculations`);
    }
  });

  // Check savings percentage calculation
  const savingsPercentage = comp.savings_percentage ?? comp.savings_percent;
  if (savingsPercentage === undefined && comp.mfn_rate && comp.usmca_rate) {
    warnings.push(`Component missing 'savings_percentage' - should be calculated as mfn_rate - usmca_rate in ${context}`);
  }

  // AI confidence - should be 0-100
  if (comp.ai_confidence !== undefined && (typeof comp.ai_confidence !== 'number' || comp.ai_confidence < 0 || comp.ai_confidence > 100)) {
    warnings.push(`Component invalid 'ai_confidence' (must be 0-100) in ${context}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized: {
      ...comp,
      origin_country: originCountry,
      value_percentage: percentage,
      savings_percentage: savingsPercentage ?? ((comp.mfn_rate ?? 0) - (comp.usmca_rate ?? 0))
    }
  };
}

export function validateComponentsArray(components: unknown, context = 'Unknown'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const normalized: ComponentOrigin[] = [];

  if (!Array.isArray(components)) {
    return {
      valid: false,
      errors: [`Components must be an array in ${context}`],
      warnings: []
    };
  }

  if (components.length === 0) {
    return {
      valid: false,
      errors: [`Components array cannot be empty in ${context}`],
      warnings: []
    };
  }

  components.forEach((comp, idx) => {
    const result = validateComponentOrigin(comp, `${context}[${idx}]`);
    if (!result.valid) {
      errors.push(...result.errors);
    }
    warnings.push(...result.warnings);
    if (result.normalized) {
      normalized.push(result.normalized as ComponentOrigin);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized
  };
}

/**
 * ============================================================================
 * TRADE VOLUME VALIDATION
 * ============================================================================
 */

export function validateTradeVolume(volume: unknown, context = 'Unknown'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let normalized: number | undefined;

  if (volume === undefined || volume === null) {
    errors.push(`Trade volume is missing in ${context}`);
  } else if (typeof volume === 'string') {
    // Try to parse string (e.g., "1,000,000")
    const parsed = parseFloat(volume.replace(/[^0-9.-]+/g, ''));
    if (isNaN(parsed)) {
      errors.push(`Trade volume cannot be parsed as number in ${context}: "${volume}"`);
    } else {
      normalized = parsed;
    }
  } else if (typeof volume === 'number') {
    normalized = volume;
  } else {
    errors.push(`Trade volume must be number or string in ${context}`);
  }

  // Validation: trade volume should be positive (or 0 for unknown)
  if (normalized !== undefined && normalized < 0) {
    errors.push(`Trade volume cannot be negative in ${context}`);
  }

  if (normalized === 0) {
    warnings.push(`Trade volume is 0 in ${context} - alerts will use percentage-based analysis`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized
  };
}

/**
 * ============================================================================
 * COMPANY INFORMATION VALIDATION
 * ============================================================================
 */

export function validateCompanyInformation(company: unknown, context = 'Unknown'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!company || typeof company !== 'object') {
    return {
      valid: false,
      errors: [`Company data is not an object in ${context}`],
      warnings: []
    };
  }

  const comp = company as Record<string, any>;

  // Required fields
  if (!comp.company_name || typeof comp.company_name !== 'string') {
    errors.push(`Company missing/invalid 'company_name' in ${context}`);
  }

  if (!comp.company_country || typeof comp.company_country !== 'string') {
    errors.push(`Company missing/invalid 'company_country' in ${context}`);
  }

  if (!comp.business_type || typeof comp.business_type !== 'string') {
    errors.push(`Company missing/invalid 'business_type' in ${context}`);
  }

  // Optional fields
  if (comp.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(comp.email)) {
    warnings.push(`Company email appears invalid in ${context}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized: comp
  };
}

/**
 * ============================================================================
 * TARIFF RATES CACHE VALIDATION
 * ============================================================================
 */

export function validateTariffRatesCache(cached: unknown, context = 'Unknown'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!cached || typeof cached !== 'object') {
    return {
      valid: false,
      errors: [`Tariff cache is not an object in ${context}`],
      warnings: []
    };
  }

  const cache = cached as Record<string, any>;

  // Required fields
  if (!cache.hs_code || typeof cache.hs_code !== 'string') {
    errors.push(`Tariff cache missing/invalid 'hs_code' in ${context}`);
  }

  if (!cache.destination_country || typeof cache.destination_country !== 'string') {
    errors.push(`Tariff cache missing/invalid 'destination_country' in ${context}`);
  }

  // Tariff rates must all exist
  const requiredRates = ['mfn_rate', 'base_mfn_rate', 'section_301', 'section_232', 'total_rate', 'usmca_rate'];
  requiredRates.forEach(rate => {
    if (cache[rate] === undefined || cache[rate] === null) {
      errors.push(`Tariff cache missing '${rate}' in ${context}`);
    } else if (typeof cache[rate] !== 'number') {
      errors.push(`Tariff cache invalid '${rate}' (must be number) in ${context}`);
    }
  });

  // CRITICAL: Validate total_rate = base_mfn_rate + section_301 + section_232
  const baseMfn = cache.base_mfn_rate ?? 0;
  const section301 = cache.section_301 ?? 0;
  const section232 = cache.section_232 ?? 0;
  const expectedTotal = baseMfn + section301 + section232;
  const reportedTotal = cache.total_rate ?? 0;

  if (Math.abs(expectedTotal - reportedTotal) > 0.01) {
    errors.push(
      `Tariff rate math error in ${context}: total_rate should be ${expectedTotal.toFixed(2)}% ` +
      `(${baseMfn.toFixed(2)}% + ${section301.toFixed(2)}% + ${section232.toFixed(2)}%), ` +
      `but got ${reportedTotal.toFixed(2)}%`
    );
  }

  // Validation: USMCA rate should be <= MFN rate
  if (cache.usmca_rate && cache.mfn_rate && cache.usmca_rate > cache.mfn_rate) {
    warnings.push(`USMCA rate (${cache.usmca_rate}%) exceeds MFN rate (${cache.mfn_rate}%) in ${context}`);
  }

  // Validation: savings percentage
  if (cache.savings_percentage !== undefined) {
    const expectedSavings = (cache.mfn_rate ?? 0) - (cache.usmca_rate ?? 0);
    if (Math.abs(cache.savings_percentage - expectedSavings) > 0.01) {
      warnings.push(
        `Savings percentage calculation in ${context}: expected ${expectedSavings.toFixed(2)}%, got ${cache.savings_percentage.toFixed(2)}%`
      );
    }
  }

  // Cache expiration check
  if (cache.expires_at) {
    const expiresDate = new Date(cache.expires_at);
    const now = new Date();
    if (now > expiresDate) {
      warnings.push(`Tariff cache expired in ${context} (expired: ${cache.expires_at})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized: cache
  };
}

/**
 * ============================================================================
 * WORKFLOW DATA VALIDATION
 * ============================================================================
 */

export function validateWorkflowSession(session: unknown, context = 'Unknown'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!session || typeof session !== 'object') {
    return {
      valid: false,
      errors: [`Workflow session is not an object in ${context}`],
      warnings: []
    };
  }

  const sess = session as Record<string, any>;

  // Required database fields
  if (!sess.id || typeof sess.id !== 'string') {
    errors.push(`Workflow session missing/invalid 'id' in ${context}`);
  }

  if (!sess.user_id || typeof sess.user_id !== 'string') {
    errors.push(`Workflow session missing/invalid 'user_id' in ${context}`);
  }

  // Company data
  const companyResult = validateCompanyInformation(sess, `${context}.company`);
  if (!companyResult.valid) {
    errors.push(...companyResult.errors);
  }
  warnings.push(...companyResult.warnings);

  // Trade volume
  const volumeResult = validateTradeVolume(sess.trade_volume, `${context}.trade_volume`);
  if (!volumeResult.valid) {
    errors.push(...volumeResult.errors);
  }
  warnings.push(...volumeResult.warnings);

  // HS code
  if (!sess.hs_code || typeof sess.hs_code !== 'string') {
    errors.push(`Workflow session missing/invalid 'hs_code' in ${context}`);
  }

  // Components
  const componentsResult = validateComponentsArray(sess.component_origins, `${context}.component_origins`);
  if (!componentsResult.valid) {
    errors.push(...componentsResult.errors);
  }
  warnings.push(...componentsResult.warnings);

  // USMCA qualification
  if (sess.qualification_status && !['QUALIFIED', 'NOT_QUALIFIED', 'CONDITIONAL'].includes(sess.qualification_status)) {
    warnings.push(`Unknown qualification_status "${sess.qualification_status}" in ${context}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalized: sess
  };
}

/**
 * ============================================================================
 * ERROR REPORTING
 * ============================================================================
 */

export function reportValidationErrors(result: ValidationResult, context: string) {
  if (result.errors.length > 0) {
    console.error(`❌ Data Contract Violation in ${context}:`);
    result.errors.forEach(err => console.error(`   - ${err}`));
    return false;
  }

  if (result.warnings.length > 0) {
    console.warn(`⚠️ Data Contract Warnings in ${context}:`);
    result.warnings.forEach(warn => console.warn(`   - ${warn}`));
  }

  return true;
}

/**
 * ============================================================================
 * BATCH VALIDATION FOR API RESPONSES
 * ============================================================================
 */

export function validateAndNormalizeComponents(
  components: unknown,
  context = 'API Response'
): { components: ComponentOrigin[]; errors: string[] } {
  const result = validateComponentsArray(components, context);

  if (!result.valid) {
    return {
      components: [],
      errors: result.errors
    };
  }

  return {
    components: (result.normalized as ComponentOrigin[]) || [],
    errors: result.errors
  };
}

/**
 * ============================================================================
 * TYPE GUARDS USING VALIDATION
 * ============================================================================
 */

export function isValidComponentOrigin(obj: unknown): obj is ComponentOrigin {
  const result = validateComponentOrigin(obj, 'Type Guard');
  return result.valid && result.normalized !== undefined;
}

export function isValidTariffRatesCache(obj: unknown): obj is TariffRatesCacheRow {
  const result = validateTariffRatesCache(obj, 'Type Guard');
  return result.valid && result.normalized !== undefined;
}

export function isValidWorkflowSession(obj: unknown): obj is WorkflowSessionRow {
  const result = validateWorkflowSession(obj, 'Type Guard');
  return result.valid && result.normalized !== undefined;
}

export default {
  validateComponentOrigin,
  validateComponentsArray,
  validateTradeVolume,
  validateCompanyInformation,
  validateTariffRatesCache,
  validateWorkflowSession,
  reportValidationErrors,
  validateAndNormalizeComponents,
  isValidComponentOrigin,
  isValidTariffRatesCache,
  isValidWorkflowSession
};
