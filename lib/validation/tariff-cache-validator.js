/**
 * TARIFF CACHE PRE-STORAGE VALIDATION
 *
 * PURPOSE:
 * Prevent data corruption by validating tariff data BEFORE database insertion.
 * Catches bad data at the source instead of discovering it weeks later.
 *
 * WHAT IT VALIDATES:
 * 1. HS code format (must be 8-digit, no periods)
 * 2. Tariff rate ranges (0.0-1.0, stored as decimal not percentage)
 * 3. No 0% defaults without documented source
 * 4. Required fields are not null
 * 5. Confidence levels are reasonable
 * 6. Data types are correct
 *
 * USAGE:
 * import { validateTariffCacheRecord, validateTariffCacheBatch } from './tariff-cache-validator.js';
 *
 * // Single record
 * const validation = validateTariffCacheRecord(record);
 * if (!validation.valid) {
 *   console.error('Validation failed:', validation.errors);
 *   throw new Error('Invalid tariff data');
 * }
 *
 * // Batch of records
 * const batchValidation = validateTariffCacheBatch(records);
 * if (!batchValidation.valid) {
 *   console.error(`${batchValidation.invalidCount} of ${records.length} records failed validation`);
 * }
 *
 * Created: November 20, 2025
 * Reason: Prevent recurrence of 998 corrupted records incident
 */

/**
 * Validation error class for better error handling
 */
export class TariffValidationError extends Error {
  constructor(message, field, value, code) {
    super(message);
    this.name = 'TariffValidationError';
    this.field = field;
    this.value = value;
    this.code = code;
  }
}

/**
 * Validate HS code format
 */
function validateHSCode(hsCode, fieldName = 'hs_code') {
  const errors = [];

  // Required
  if (!hsCode) {
    errors.push({
      field: fieldName,
      value: hsCode,
      code: 'REQUIRED',
      message: `${fieldName} is required`
    });
    return errors;
  }

  // Type check
  if (typeof hsCode !== 'string') {
    errors.push({
      field: fieldName,
      value: hsCode,
      code: 'INVALID_TYPE',
      message: `${fieldName} must be a string, got ${typeof hsCode}`
    });
    return errors;
  }

  // Remove any whitespace
  const trimmed = hsCode.trim();

  // Check for periods (should be normalized to 8-digit without periods)
  if (trimmed.includes('.')) {
    errors.push({
      field: fieldName,
      value: hsCode,
      code: 'INVALID_FORMAT',
      message: `${fieldName} should not contain periods. Expected: "73269070", got: "${hsCode}"`
    });
  }

  // Check for non-digits
  if (!/^\d+$/.test(trimmed)) {
    errors.push({
      field: fieldName,
      value: hsCode,
      code: 'INVALID_FORMAT',
      message: `${fieldName} must contain only digits. Got: "${hsCode}"`
    });
  }

  // Length validation (8-digit HTS-8 format, or 6-digit parent codes allowed)
  const validLengths = [6, 8];
  if (!validLengths.includes(trimmed.length)) {
    errors.push({
      field: fieldName,
      value: hsCode,
      code: 'INVALID_LENGTH',
      message: `${fieldName} must be 6 or 8 digits. Got ${trimmed.length} digits: "${hsCode}"`
    });
  }

  // 10-digit codes need truncation to 8-digit
  if (trimmed.length === 10) {
    errors.push({
      field: fieldName,
      value: hsCode,
      code: 'NEEDS_NORMALIZATION',
      message: `${fieldName} is 10-digit (needs truncation to 8-digit HTS-8). Got: "${hsCode}"`
    });
  }

  return errors;
}

/**
 * Validate tariff rate value
 */
function validateTariffRate(rate, fieldName, allowNull = true) {
  const errors = [];

  // Null handling
  if (rate === null || rate === undefined) {
    if (!allowNull) {
      errors.push({
        field: fieldName,
        value: rate,
        code: 'REQUIRED',
        message: `${fieldName} cannot be null`
      });
    }
    return errors;
  }

  // Type check
  if (typeof rate !== 'number') {
    errors.push({
      field: fieldName,
      value: rate,
      code: 'INVALID_TYPE',
      message: `${fieldName} must be a number, got ${typeof rate}`
    });
    return errors;
  }

  // Range validation (0.0 to 1.0 = 0% to 100%)
  if (rate < 0 || rate > 1.0) {
    errors.push({
      field: fieldName,
      value: rate,
      code: 'OUT_OF_RANGE',
      message: `${fieldName} must be between 0.0 and 1.0 (decimal form). Got: ${rate}`
    });
  }

  // Warn about likely percentage-as-integer (e.g., 25 instead of 0.25)
  if (rate > 1.0 && rate <= 100) {
    errors.push({
      field: fieldName,
      value: rate,
      code: 'LIKELY_PERCENTAGE',
      message: `${fieldName} appears to be stored as percentage (${rate}), should be decimal (${rate / 100})`
    });
  }

  // Error on extremely high values (>100%)
  if (rate > 100) {
    errors.push({
      field: fieldName,
      value: rate,
      code: 'UNREALISTIC_VALUE',
      message: `${fieldName} is unrealistically high: ${rate}. Max expected: 1.0 (100%)`
    });
  }

  // Warn about 0% without documentation
  if (rate === 0) {
    errors.push({
      field: fieldName,
      value: rate,
      code: 'ZERO_RATE_WARNING',
      message: `${fieldName} is 0%. This should have documented source (exemption, duty-free, etc). Use null if not researched.`,
      severity: 'warning'
    });
  }

  return errors;
}

/**
 * Validate required fields exist
 */
function validateRequiredFields(record) {
  const errors = [];
  const requiredFields = ['hs_code', 'verified_date', 'data_source'];

  for (const field of requiredFields) {
    if (!record[field]) {
      errors.push({
        field,
        value: record[field],
        code: 'REQUIRED',
        message: `${field} is required but is ${record[field] === null ? 'null' : 'undefined'}`
      });
    }
  }

  return errors;
}

/**
 * Validate data source documentation
 */
function validateDataSource(record) {
  const errors = [];

  if (!record.data_source) {
    errors.push({
      field: 'data_source',
      value: record.data_source,
      code: 'REQUIRED',
      message: 'data_source is required for audit trail'
    });
    return errors;
  }

  // Check for generic/unhelpful sources
  const genericSources = ['unknown', 'n/a', 'none', ''];
  if (genericSources.includes(record.data_source.toLowerCase().trim())) {
    errors.push({
      field: 'data_source',
      value: record.data_source,
      code: 'INVALID_SOURCE',
      message: `data_source "${record.data_source}" is not specific enough. Provide: USTR, CBP, Federal Register, AI, etc.`
    });
  }

  // If any rate is 0%, require documented source
  const hasZeroRate = record.section_301 === 0 || record.section_232 === 0;
  if (hasZeroRate && !record.data_source.includes('exemption') && !record.data_source.includes('duty-free')) {
    errors.push({
      field: 'data_source',
      value: record.data_source,
      code: 'INSUFFICIENT_DOCUMENTATION',
      message: `Rate is 0% but data_source doesn't mention "exemption" or "duty-free". Document why rate is 0%.`,
      severity: 'warning'
    });
  }

  return errors;
}

/**
 * Validate confidence level (if present)
 */
function validateConfidence(confidence) {
  const errors = [];

  if (confidence === null || confidence === undefined) {
    return errors; // Optional field
  }

  if (typeof confidence !== 'number') {
    errors.push({
      field: 'confidence',
      value: confidence,
      code: 'INVALID_TYPE',
      message: `confidence must be a number, got ${typeof confidence}`
    });
    return errors;
  }

  // Valid confidence levels: 0, 50, 75, 85, 95, 100
  const validLevels = [0, 50, 75, 85, 90, 95, 100];
  if (!validLevels.includes(confidence) && (confidence < 0 || confidence > 100)) {
    errors.push({
      field: 'confidence',
      value: confidence,
      code: 'INVALID_VALUE',
      message: `confidence should be 0-100. Got: ${confidence}`,
      severity: 'warning'
    });
  }

  return errors;
}

/**
 * Validate a single tariff cache record
 *
 * @param {Object} record - Tariff cache record to validate
 * @returns {Object} - { valid: boolean, errors: Array, warnings: Array }
 */
export function validateTariffCacheRecord(record) {
  const errors = [];
  const warnings = [];

  // Required fields
  errors.push(...validateRequiredFields(record));

  // HS code format
  errors.push(...validateHSCode(record.hs_code));

  // Tariff rates (all optional, but if present must be valid)
  const rateFields = ['section_301', 'section_232', 'section_201', 'ieepa_reciprocal'];
  for (const field of rateFields) {
    if (record[field] !== undefined) {
      const fieldErrors = validateTariffRate(record[field], field, true);
      fieldErrors.forEach(err => {
        if (err.severity === 'warning') {
          warnings.push(err);
        } else {
          errors.push(err);
        }
      });
    }
  }

  // Data source
  const sourceErrors = validateDataSource(record);
  sourceErrors.forEach(err => {
    if (err.severity === 'warning') {
      warnings.push(err);
    } else {
      errors.push(err);
    }
  });

  // Confidence level
  if (record.confidence !== undefined) {
    const confErrors = validateConfidence(record.confidence);
    confErrors.forEach(err => {
      if (err.severity === 'warning') {
        warnings.push(err);
      } else {
        errors.push(err);
      }
    });
  }

  // Verified date (should be recent)
  if (record.verified_date) {
    const verifiedDate = new Date(record.verified_date);
    const now = new Date();
    const daysSince = (now - verifiedDate) / (1000 * 60 * 60 * 24);

    if (daysSince > 90) {
      warnings.push({
        field: 'verified_date',
        value: record.verified_date,
        code: 'STALE_DATA',
        message: `verified_date is ${Math.floor(daysSince)} days old (>90 days). Consider refreshing.`,
        severity: 'warning'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    record
  };
}

/**
 * Validate a batch of tariff cache records
 *
 * @param {Array} records - Array of tariff cache records
 * @returns {Object} - { valid: boolean, validCount: number, invalidCount: number, results: Array }
 */
export function validateTariffCacheBatch(records) {
  const results = records.map(record => validateTariffCacheRecord(record));

  const validCount = results.filter(r => r.valid).length;
  const invalidCount = results.filter(r => !r.valid).length;

  return {
    valid: invalidCount === 0,
    validCount,
    invalidCount,
    totalCount: records.length,
    successRate: ((validCount / records.length) * 100).toFixed(1),
    results
  };
}

/**
 * Filter out invalid records and return only valid ones
 *
 * @param {Array} records - Array of tariff cache records
 * @param {Object} options - { throwOnError: boolean, logWarnings: boolean }
 * @returns {Array} - Array of valid records only
 */
export function filterValidRecords(records, options = {}) {
  const { throwOnError = false, logWarnings = true } = options;

  const validation = validateTariffCacheBatch(records);

  if (!validation.valid) {
    const invalidRecords = validation.results.filter(r => !r.valid);

    if (throwOnError) {
      const firstError = invalidRecords[0].errors[0];
      throw new TariffValidationError(
        `Validation failed: ${firstError.message}`,
        firstError.field,
        firstError.value,
        firstError.code
      );
    }

    if (logWarnings) {
      console.warn(`⚠️  ${validation.invalidCount} of ${records.length} records failed validation`);
      console.warn('   First 3 invalid records:');
      invalidRecords.slice(0, 3).forEach((result, i) => {
        console.warn(`   ${i + 1}. HS ${result.record.hs_code}: ${result.errors[0].message}`);
      });
    }
  }

  // Return only valid records
  return validation.results
    .filter(r => r.valid)
    .map(r => r.record);
}

/**
 * Assert record is valid (throws if not)
 *
 * @param {Object} record - Tariff cache record to validate
 * @throws {TariffValidationError} - If validation fails
 */
export function assertValidRecord(record) {
  const validation = validateTariffCacheRecord(record);

  if (!validation.valid) {
    const firstError = validation.errors[0];
    throw new TariffValidationError(
      `Validation failed: ${firstError.message}`,
      firstError.field,
      firstError.value,
      firstError.code
    );
  }

  if (validation.warnings.length > 0) {
    console.warn(`⚠️  Validation passed with ${validation.warnings.length} warnings:`);
    validation.warnings.forEach(warning => {
      console.warn(`   - ${warning.field}: ${warning.message}`);
    });
  }

  return true;
}

export default {
  validateTariffCacheRecord,
  validateTariffCacheBatch,
  filterValidRecords,
  assertValidRecord,
  TariffValidationError
};
