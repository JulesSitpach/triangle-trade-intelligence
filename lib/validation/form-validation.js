/**
 * Form Validation & Utility Functions
 *
 * Pure utility functions extracted from pages/api/ai-usmca-complete-analysis.js
 * These functions have NO external dependencies and are 100% safe to reuse
 *
 * Extracted Oct 23, 2025 - Phase 3 File Decomposition
 */

// ========== CACHE EXPIRATION CONFIGURATION ==========

/**
 * ✅ DESTINATION-AWARE CACHE EXPIRATION (Smart Cost Optimization)
 * Different destinations have different policy volatility:
 * - US: 24 hours (volatile Section 301 policies change frequently)
 * - CA: 90 days (stable, negotiated, predictable rates)
 * - MX: 60 days (relatively stable, less policy churn)
 */
const CACHE_EXPIRATION = {
  'US': 24 * 60 * 60 * 1000,      // 24 hours - volatile Section 301 policies
  'CA': 90 * 24 * 60 * 60 * 1000, // 90 days - stable, predictable
  'MX': 60 * 24 * 60 * 60 * 1000, // 60 days - relatively stable
  'default': 24 * 60 * 60 * 1000  // 24 hours fallback
};

/**
 * Get cache expiration time for a specific destination
 * @param {string} destination - 'US', 'CA', 'MX', or any country code
 * @returns {number} Milliseconds for cache expiration
 */
export function getCacheExpiration(destination) {
  return CACHE_EXPIRATION[destination?.toUpperCase()] || CACHE_EXPIRATION['default'];
}

// ========== INDUSTRY THRESHOLDS ==========
// REMOVED (Nov 7, 2025): Hardcoded thresholds had data errors
// - Agriculture: Was 60%, database has 50% (false rejections)
// - Chemicals: Was 62.5%, database has 62% (false rejections)
//
// REPLACEMENT: Use lib/services/industry-thresholds-service.js instead
// - Queries industry_thresholds table (correct values)
// - AI-first with database fallback
// - Migrated Nov 6, 2025
//
// const INDUSTRY_THRESHOLDS = { ... } ← DELETED
// export function getIndustryThresholds() { ... } ← DELETED

// ========== DE MINIMIS THRESHOLDS ==========

/**
 * De minimis import thresholds by destination country
 * De minimis allows small imports to avoid full customs duties
 * Each country has different rules (as of October 2025)
 */
const DE_MINIMIS = {
  'US': {
    standard: 0,
    note: '⚠️ USA eliminated de minimis for ALL countries (Aug 2025)'
  },
  'CA': {
    standard: 20,      // CAD $20 from non-USMCA
    usmca_duty: 150,   // CAD $150 duty-free from US/MX
    usmca_tax: 40,     // CAD $40 tax-free from US/MX
    note: origin => (origin === 'US' || origin === 'MX')
      ? 'USMCA: CAD $150 duty-free, $40 tax-free'
      : 'CAD $20 - very low threshold'
  },
  'MX': {
    standard: 0,       // Abolished Dec 2024
    usmca: 117,        // USD $117 from US/CA (VAT >$50)
    note: origin => (origin === 'US' || origin === 'CA')
      ? 'USD $117 duty-free under USMCA (VAT applies >$50)'
      : 'No de minimis - 19% global tax rate (Dec 2024)'
  }
};

/**
 * Get de minimis thresholds for a destination
 * @param {string} destination - Destination country ('US', 'CA', 'MX')
 * @returns {Object} De minimis threshold information
 */
export function getDeMinimisThreshold(destination) {
  return DE_MINIMIS[destination?.toUpperCase()] || null;
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Parse trade_volume from string to number
 * Handles comma-separated values from UI form (e.g., "1,500,000" → 1500000)
 *
 * @param {string|number} volumeInput - Trade volume (can be string with commas or number)
 * @returns {number|null} Parsed volume as number, or null if invalid
 *
 * @example
 * parseTradeVolume("1,500,000") // → 1500000
 * parseTradeVolume("1500000")   // → 1500000
 * parseTradeVolume(1500000)     // → 1500000
 * parseTradeVolume("")          // → null
 * parseTradeVolume(-100)        // → null (rejects negative)
 */
export function parseTradeVolume(volumeInput) {
  if (!volumeInput) return null;
  const parsed = parseFloat(String(volumeInput).replace(/[^0-9.-]+/g, ''));
  return !isNaN(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Extract industry from business type description
 * Maps business type text to standard industry categories
 * Used to apply industry-specific thresholds and rules
 *
 * @param {string} businessType - Business type description from user input
 * @returns {string} Normalized industry name
 *
 * @example
 * extractIndustryFromBusinessType("Electronics Manufacturing")
 *   → "Electronics & Technology"
 * extractIndustryFromBusinessType("Textile & Apparel")
 *   → "Textiles & Apparel"
 * extractIndustryFromBusinessType("Unknown")
 *   → "General Manufacturing"
 */
export function extractIndustryFromBusinessType(businessType) {
  if (!businessType) return 'General Manufacturing';

  const type = businessType.toLowerCase();

  // Map business types to industry sectors
  if (type.includes('textile') || type.includes('apparel') || type.includes('clothing')) return 'Textiles & Apparel';
  if (type.includes('automotive') || type.includes('vehicle') || type.includes('transportation')) return 'Automotive & Transportation';
  if (type.includes('electronic') || type.includes('technology') || type.includes('semiconductor')) return 'Electronics & Technology';
  if (type.includes('chemical') || type.includes('pharmaceutical') || type.includes('coating') || type.includes('resin')) return 'Chemicals & Materials';
  if (type.includes('food') || type.includes('agriculture') || type.includes('beverage')) return 'Food & Agriculture';
  if (type.includes('machinery') || type.includes('equipment') || type.includes('industrial')) return 'Machinery & Equipment';
  if (type.includes('metal') || type.includes('steel') || type.includes('aluminum')) return 'Metals & Mining';
  if (type.includes('plastic') || type.includes('polymer')) return 'Plastics & Polymers';

  return 'General Manufacturing';
}

// Export constants for direct access if needed
export { CACHE_EXPIRATION, DE_MINIMIS };
