/**
 * TARIFF RATE LOOKUP WITH INTELLIGENT FALLBACK HIERARCHY
 *
 * PURPOSE:
 * Smart tariff rate lookup that falls back from exact match to parent codes.
 * Returns confidence level with each rate so users know reliability.
 *
 * FALLBACK HIERARCHY:
 * 1. Try 8-digit exact match   (confidence: 100) - e.g., "73269070"
 * 2. Try 6-digit parent code    (confidence: 85)  - e.g., "732690"
 * 3. Try 4-digit heading        (confidence: 70)  - e.g., "7326"
 * 4. Try 2-digit chapter prefix (confidence: 50)  - e.g., "73XX"
 * 5. Not found                  (confidence: 0)   - return null, needs research
 *
 * WHY:
 * - Some HS codes have category-level rates (6-digit parent applies to all 8-digit children)
 * - Better to return parent code rate with lower confidence than return nothing
 * - User sees confidence level and knows whether to verify with customs broker
 *
 * USAGE:
 * import { getTariffRateWithFallback } from '@/lib/services/tariff-rate-lookup';
 *
 * const result = await getTariffRateWithFallback('73269070', 'CN', 'section_301');
 * // Returns:
 * // {
 * //   rate: 0.25,
 * //   confidence: 100,
 * //   source: 'exact_match',
 * //   hs_code_used: '73269070',
 * //   verified_source: 'USTR',
 * //   verified_date: '2025-11-20'
 * // }
 *
 * Created: November 20, 2025
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Normalize HS code to 8-digit format (remove periods, pad if needed)
 */
function normalizeHSCode(hsCode) {
  if (!hsCode) return null;

  // Remove periods and spaces
  let normalized = hsCode.toString().replace(/[.\s]/g, '');

  // Pad to 8 digits if shorter (right-pad with zeros)
  if (normalized.length < 8) {
    normalized = normalized.padEnd(8, '0');
  }

  // Truncate to 8 digits if longer
  if (normalized.length > 8) {
    normalized = normalized.substring(0, 8);
  }

  return normalized;
}

/**
 * Try exact match query
 *
 * ✅ FIXED (Nov 21, 2025): Removed .eq('origin_country') filter
 * policy_tariffs_cache has NO origin_country column - rates apply broadly:
 * - Section 301: ALL China-origin goods
 * - Section 232: ALL countries (steel/aluminum)
 */
async function tryExactMatch(hsCode, originCountry, rateField) {
  const { data, error } = await supabase
    .from('policy_tariffs_cache')
    .select('*')
    .eq('hs_code', hsCode)
    // ❌ REMOVED: .eq('origin_country', originCountry) - column doesn't exist!
    .maybeSingle();

  if (error) {
    console.error(`[tariff-rate-lookup] Error querying exact match:`, error);
    return null;
  }

  if (data && data[rateField] !== null && data[rateField] !== undefined) {
    return {
      rate: parseFloat(data[rateField]),
      confidence: 100,
      source: 'exact_match',
      hs_code_used: hsCode,
      verified_source: data.data_source || data.verified_source,
      verified_date: data.verified_date,
      data_age_days: Math.floor((Date.now() - new Date(data.verified_date).getTime()) / (1000 * 60 * 60 * 24))
    };
  }

  return null;
}

/**
 * Try parent code (6-digit) - category-level rate
 *
 * ✅ FIXED (Nov 21, 2025): Removed .eq('origin_country') filter
 */
async function tryParentCode(hsCode, originCountry, rateField) {
  const parent6 = hsCode.substring(0, 6);

  const { data, error } = await supabase
    .from('policy_tariffs_cache')
    .select('*')
    .eq('hs_code', parent6)
    // ❌ REMOVED: .eq('origin_country', originCountry)
    .maybeSingle();

  if (error) {
    console.error(`[tariff-rate-lookup] Error querying parent code:`, error);
    return null;
  }

  if (data && data[rateField] !== null && data[rateField] !== undefined) {
    return {
      rate: parseFloat(data[rateField]),
      confidence: 85,
      source: 'category_rate',
      hs_code_used: parent6,
      verified_source: data.verified_source,
      verified_date: data.verified_date,
      data_age_days: Math.floor((Date.now() - new Date(data.verified_date).getTime()) / (1000 * 60 * 60 * 24)),
      note: `Using category-level rate (6-digit parent code: ${parent6}). Product-specific rate not found.`
    };
  }

  return null;
}

/**
 * Try heading (4-digit) - broader category
 *
 * ✅ FIXED (Nov 21, 2025): Removed .eq('origin_country') filter
 */
async function tryHeading(hsCode, originCountry, rateField) {
  const heading4 = hsCode.substring(0, 4);

  const { data, error } = await supabase
    .from('policy_tariffs_cache')
    .select('*')
    .eq('hs_code', heading4)
    // ❌ REMOVED: .eq('origin_country', originCountry)
    .maybeSingle();

  if (error) {
    console.error(`[tariff-rate-lookup] Error querying heading:`, error);
    return null;
  }

  if (data && data[rateField] !== null && data[rateField] !== undefined) {
    return {
      rate: parseFloat(data[rateField]),
      confidence: 70,
      source: 'heading_rate',
      hs_code_used: heading4,
      verified_source: data.verified_source,
      verified_date: data.verified_date,
      data_age_days: Math.floor((Date.now() - new Date(data.verified_date).getTime()) / (1000 * 60 * 60 * 24)),
      note: `Using heading-level rate (4-digit: ${heading4}). Category and product rates not found.`
    };
  }

  return null;
}

/**
 * Try chapter prefix (2-digit) - very broad, last resort
 *
 * ✅ FIXED (Nov 21, 2025): Removed .eq('origin_country') filter
 */
async function tryChapterPrefix(hsCode, originCountry, rateField) {
  const chapter2 = hsCode.substring(0, 2);

  const { data, error } = await supabase
    .from('policy_tariffs_cache')
    .select('*')
    .like('hs_code', `${chapter2}%`)
    // ❌ REMOVED: .eq('origin_country', originCountry)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`[tariff-rate-lookup] Error querying chapter prefix:`, error);
    return null;
  }

  if (data && data[rateField] !== null && data[rateField] !== undefined) {
    return {
      rate: parseFloat(data[rateField]),
      confidence: 50,
      source: 'chapter_prefix',
      hs_code_used: data.hs_code,
      verified_source: data.verified_source,
      verified_date: data.verified_date,
      data_age_days: Math.floor((Date.now() - new Date(data.verified_date).getTime()) / (1000 * 60 * 60 * 24)),
      note: `Using chapter-level rate (Chapter ${chapter2}). Specific product rate not found. Verify with customs broker.`
    };
  }

  return null;
}

/**
 * Try blanket tariff - applies to all countries
 * ✅ FIXED (Nov 21, 2025): Removed .is('origin_country', null) - column doesn't exist!
 * All rates in policy_tariffs_cache apply broadly (no origin filtering)
 */
async function tryBlanketTariff(hsCode, rateField) {
  const { data, error } = await supabase
    .from('policy_tariffs_cache')
    .select('*')
    .eq('hs_code', hsCode)
    // ❌ REMOVED: .is('origin_country', null) - column doesn't exist!
    .maybeSingle();

  if (error) {
    console.error(`[tariff-rate-lookup] Error querying blanket tariff:`, error);
    return null;
  }

  if (data && data[rateField] !== null && data[rateField] !== undefined) {
    return {
      rate: parseFloat(data[rateField]),
      confidence: 95,
      source: 'blanket_tariff',
      hs_code_used: hsCode,
      verified_source: data.verified_source,
      verified_date: data.verified_date,
      data_age_days: Math.floor((Date.now() - new Date(data.verified_date).getTime()) / (1000 * 60 * 60 * 24)),
      note: `Blanket tariff applies to all countries for this product.`
    };
  }

  return null;
}

/**
 * Main fallback hierarchy function
 *
 * @param {string} hsCode - HS code (8-digit or will be normalized)
 * @param {string} originCountry - Origin country code (CN, MX, CA, etc) or NULL for blanket
 * @param {string} rateField - Rate field to query (section_301, section_232, section_201, ieepa_reciprocal)
 * @returns {Promise<object>} Rate result with confidence level
 */
export async function getTariffRateWithFallback(hsCode, originCountry, rateField) {
  // Normalize HS code
  const normalized = normalizeHSCode(hsCode);

  if (!normalized) {
    return {
      rate: null,
      confidence: 0,
      source: 'invalid_hs_code',
      error: 'Invalid HS code format',
      message: 'HS code could not be normalized. Provide 6-8 digit code.'
    };
  }

  if (!rateField) {
    return {
      rate: null,
      confidence: 0,
      source: 'missing_rate_field',
      error: 'Rate field not specified',
      message: 'Must specify which rate to query (section_301, section_232, etc)'
    };
  }

  console.log(`[tariff-rate-lookup] Querying ${rateField} for HS ${normalized} from ${originCountry || 'ANY'}`);

  // Level 0: Try blanket tariff (NULL origin, applies to all)
  if (originCountry) {
    const blanket = await tryBlanketTariff(normalized, rateField);
    if (blanket) {
      console.log(`  ✅ Found blanket tariff (confidence: ${blanket.confidence})`);
      return blanket;
    }
  }

  // Level 1: Try exact 8-digit match
  if (originCountry) {
    const exact = await tryExactMatch(normalized, originCountry, rateField);
    if (exact) {
      console.log(`  ✅ Found exact match (confidence: ${exact.confidence})`);
      return exact;
    }
  }

  // Level 2: Try 6-digit parent (category-level)
  if (originCountry) {
    const parent = await tryParentCode(normalized, originCountry, rateField);
    if (parent) {
      console.log(`  ⚠️  Using parent code ${parent.hs_code_used} (confidence: ${parent.confidence})`);
      return parent;
    }
  }

  // Level 3: Try 4-digit heading (rare fallback)
  if (originCountry) {
    const heading = await tryHeading(normalized, originCountry, rateField);
    if (heading) {
      console.log(`  ⚠️  Using heading ${heading.hs_code_used} (confidence: ${heading.confidence})`);
      return heading;
    }
  }

  // Level 4: Try chapter prefix (last resort)
  if (originCountry) {
    const prefix = await tryChapterPrefix(normalized, originCountry, rateField);
    if (prefix) {
      console.log(`  ⚠️  Using chapter prefix (confidence: ${prefix.confidence})`);
      return prefix;
    }
  }

  // Level 5: Not found anywhere
  console.log(`  ❌ No rate found for ${rateField} (HS ${normalized} from ${originCountry || 'ANY'})`);

  return {
    rate: null,
    confidence: 0,
    source: 'not_found',
    hs_code_used: normalized,
    message: `No ${rateField} rate found for HS code ${normalized} from ${originCountry || 'any country'}. Contact customs broker for verification.`,
    needs_research: true
  };
}

/**
 * Get all policy tariffs for a product (Section 301, 232, 201, IEEPA)
 *
 * @param {string} hsCode - HS code (8-digit or will be normalized)
 * @param {string} originCountry - Origin country code (CN, MX, CA, etc)
 * @returns {Promise<object>} All policy tariffs with confidence levels
 */
export async function getAllPolicyTariffs(hsCode, originCountry) {
  const [section301, section232, section201, ieepa] = await Promise.all([
    getTariffRateWithFallback(hsCode, originCountry, 'section_301'),
    getTariffRateWithFallback(hsCode, originCountry, 'section_232'),
    getTariffRateWithFallback(hsCode, originCountry, 'section_201'),
    getTariffRateWithFallback(hsCode, originCountry, 'ieepa_reciprocal')
  ]);

  // Calculate total policy tariff (stack all rates)
  const totalPolicyRate = [
    section301.rate || 0,
    section232.rate || 0,
    section201.rate || 0,
    ieepa.rate || 0
  ].reduce((sum, rate) => sum + rate, 0);

  // Calculate confidence (lowest confidence of all non-null rates)
  const confidences = [section301, section232, section201, ieepa]
    .filter(r => r.rate !== null)
    .map(r => r.confidence);

  const overallConfidence = confidences.length > 0
    ? Math.min(...confidences)
    : 0;

  return {
    section_301: section301,
    section_232: section232,
    section_201: section201,
    ieepa_reciprocal: ieepa,
    total_policy_rate: totalPolicyRate,
    overall_confidence: overallConfidence,
    hs_code_normalized: normalizeHSCode(hsCode),
    origin_country: originCountry
  };
}

/**
 * Export utility functions
 */
export { normalizeHSCode };
