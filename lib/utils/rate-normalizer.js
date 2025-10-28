/**
 * RATE NORMALIZER - Ensure consistent tariff rate format throughout the system
 *
 * Problem: Section 301 rates stored as both decimals (0.25) and percentages (25)
 * Solution: Normalize to DECIMAL format internally, convert to percentage only for display
 *
 * Decimal Format (Internal Storage): 0.25 = 25%
 * Percentage Format (Display): 25%
 *
 * All rates should be stored/passed as decimals internally (0.0-1.0 range)
 * Display layer converts to percentages for user viewing
 */

/**
 * Normalize a tariff rate to decimal format (0.0-1.0)
 * Handles both decimal input (0.25) and percentage input (25)
 *
 * @param {number} rate - Rate value (could be 0.25 or 25)
 * @returns {number} Normalized decimal rate (0.25)
 */
export function normalizeRateToDecimal(rate) {
  if (rate === null || rate === undefined) return 0;

  const numRate = parseFloat(rate);
  if (isNaN(numRate)) return 0;

  // If rate is >1, it's likely a percentage (25) - convert to decimal
  if (numRate > 1) {
    const decimalRate = numRate / 100;
    console.log(`🔄 Rate normalized: ${numRate}% → ${decimalRate} (decimal)`);
    return decimalRate;
  }

  // Otherwise assume it's already decimal (0.25)
  return numRate;
}

/**
 * Convert decimal rate to percentage for display
 *
 * @param {number} decimalRate - Rate in decimal format (0.25)
 * @returns {number} Percentage (25)
 */
export function decimalToPercentage(decimalRate) {
  if (decimalRate === null || decimalRate === undefined) return 0;
  const numRate = parseFloat(decimalRate);
  if (isNaN(numRate)) return 0;
  return numRate * 100;
}

/**
 * Ensure consistent rate format for tariff object
 * Normalizes all rate fields to decimal format
 *
 * @param {Object} tariffData - Tariff data with rate fields
 * @returns {Object} Tariff data with normalized rates
 */
export function normalizeAllRates(tariffData) {
  if (!tariffData) return tariffData;

  return {
    ...tariffData,
    base_mfn_rate: normalizeRateToDecimal(tariffData.base_mfn_rate),
    mfn_rate: normalizeRateToDecimal(tariffData.mfn_rate),
    section_301: normalizeRateToDecimal(tariffData.section_301),
    section_232: normalizeRateToDecimal(tariffData.section_232),
    total_rate: normalizeRateToDecimal(tariffData.total_rate),
    usmca_rate: normalizeRateToDecimal(tariffData.usmca_rate),
    savings_percentage: normalizeRateToDecimal(tariffData.savings_percentage)
  };
}

/**
 * Validate Section 301 rate is reasonable
 * Valid range: 0-0.50 (0%-50%)
 *
 * @param {number} section301Rate - Rate in decimal format
 * @returns {Object} { valid: boolean, rate: number, warning?: string }
 */
export function validateSection301Rate(section301Rate) {
  const normalized = normalizeRateToDecimal(section301Rate);

  // Valid range: 0-50% (0-0.50 in decimal)
  if (normalized < 0 || normalized > 0.5) {
    return {
      valid: false,
      rate: normalized,
      warning: `⚠️ Section 301 rate ${decimalToPercentage(normalized)}% is outside valid range (0%-50%). Check USTR list.`
    };
  }

  if (normalized === 0) {
    return {
      valid: true,
      rate: normalized,
      warning: 'Section 301 does not apply to this HS code'
    };
  }

  if (normalized >= 0.25) {
    return {
      valid: true,
      rate: normalized,
      warning: `Section 301 rate is ${decimalToPercentage(normalized)}% - verify against current USTR list`
    };
  }

  return {
    valid: true,
    rate: normalized
  };
}

/**
 * Format rate for display with appropriate precision
 *
 * @param {number} rate - Rate in decimal format (0.25)
 * @param {Object} options - { showWarning: boolean, source: string }
 * @returns {string} Formatted display string
 */
export function formatRateForDisplay(rate, options = {}) {
  const normalized = normalizeRateToDecimal(rate);
  const percentage = decimalToPercentage(normalized);

  // Show 1-2 decimal places depending on value
  const displayPercent = percentage < 1
    ? percentage.toFixed(2)
    : percentage.toFixed(1);

  let displayStr = `${displayPercent}%`;

  // Add source indicator if provided
  if (options.source) {
    if (options.source === 'database_fallback' || options.stale) {
      displayStr += ' ⚠️ Jan 2025';
    } else if (options.source === 'current') {
      displayStr += ' ✓ Current';
    }
  }

  return displayStr;
}

/**
 * Calculate total applied rate from components
 * Ensures consistent addition: total = base_mfn + section_301 + section_232
 *
 * @param {number} base_mfn - Base MFN rate (decimal)
 * @param {number} section_301 - Section 301 rate (decimal)
 * @param {number} section_232 - Section 232 rate (decimal)
 * @returns {number} Total rate (decimal)
 */
export function calculateTotalRate(base_mfn = 0, section_301 = 0, section_232 = 0) {
  const normalized = {
    base_mfn: normalizeRateToDecimal(base_mfn),
    section_301: normalizeRateToDecimal(section_301),
    section_232: normalizeRateToDecimal(section_232)
  };

  const total = normalized.base_mfn + normalized.section_301 + normalized.section_232;

  return total;
}

/**
 * Display Section 301 with transparency about volatility
 * Recommends verification for dynamic rates
 *
 * @param {number} section301Rate - Section 301 rate (decimal)
 * @param {boolean} isCurrentData - Is this current or stale data?
 * @returns {Object} { rate: string, confidence: string, recommendation: string }
 */
export function displaySection301Transparently(section301Rate, isCurrentData = true) {
  const normalized = normalizeRateToDecimal(section301Rate);
  const percentage = decimalToPercentage(normalized);

  if (normalized === 0) {
    return {
      rate: '0%',
      confidence: 'Not applicable',
      recommendation: 'This HS code is not subject to Section 301 tariffs'
    };
  }

  const dataAge = isCurrentData ? 'Current (2025)' : 'Historical (Jan 2025)';

  return {
    rate: `${percentage.toFixed(1)}%`,
    confidence: isCurrentData ? 'Subject to change with 30-day notice' : `⚠️ Stale - ${dataAge}`,
    recommendation: 'Section 301 rates change frequently. Verify against USTR Federal Register before customs filing.',
    ustrListRanges: {
      list1: '25%',
      list2: '25%',
      list3: '7.5%-25%',
      list4A: '7.5%-25%',
      list4B: 'Exclusions (0%)',
      unlisted: '0%'
    }
  };
}

export default {
  normalizeRateToDecimal,
  decimalToPercentage,
  normalizeAllRates,
  validateSection301Rate,
  formatRateForDisplay,
  calculateTotalRate,
  displaySection301Transparently
};
