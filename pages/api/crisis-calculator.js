/**
 * Crisis Calculator
 * POST /api/crisis-calculator
 *
 * ✅ Calculates tariff policy impact (Section 301, 232) on user's imports
 * ✅ Estimates annual financial burden from tariff rate increases
 * ✅ Identifies supply chain vulnerabilities and mitigation strategies
 */

import { protectedApiHandler } from '../../lib/api/apiHandler';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * ✅ AI-FIRST FIX (Oct 27, 2025): Database-driven tariff rates
 * REMOVED: Hardcoded SECTION_301_RATES and SECTION_232_RATES
 * REPLACED BY: Dynamic database lookups from tariff_rates_cache
 *
 * Fallback: If database doesn't have rate, return null (no silent defaults)
 * This forces us to see when rates are missing instead of using stale hardcoded values
 */

/**
 * Get Section 301 rate from database by origin country and HS code
 * Returns null if not found (no hardcoded defaults)
 */
async function getSection301Rate(originCountry, hsCode) {
  try {
    // ✅ FIX (Nov 20, 2025): Section 301 applies to MULTIPLE origins, not just China
    // Countries with Section 301 tariffs: China (CN), Vietnam (VN), Russia (RU), etc.
    // Must query database for ALL origins, not hardcode China-only logic

    if (!originCountry) {
      return 0; // No origin = no Section 301
    }

    // Query database for Section 301 rate for ANY origin
    // The policy_tariffs_cache table has origin_country filter
    const { data, error } = await supabase
      .from('policy_tariffs_cache')  // ✅ Use policy cache (cron-updated)
      .select('section_301')
      .eq('hs_code', hsCode)
      .eq('origin_country', originCountry.toUpperCase())  // Match by origin
      .limit(1)
      .single();

    if (error || !data?.section_301) {
      // Check if this is a high-risk origin that should have Section 301
      const highRiskOrigins = ['CN', 'VN', 'RU'];
      if (highRiskOrigins.includes(originCountry.toUpperCase())) {
        console.warn(`⚠️ [TARIFF-DB] No Section 301 rate found for ${hsCode} (${originCountry} origin). Returning null for manual review.`);
        return null; // Signal missing data for high-risk origin
      }
      return 0; // No Section 301 for this origin
    }

    return data.section_301; // Already in decimal format (0-1) from database
  } catch (err) {
    console.error(`❌ [TARIFF-DB-ERROR] Failed to fetch Section 301 rate for ${hsCode}:`, err.message);
    return null; // Fail loud - don't use hardcoded default
  }
}

/**
 * Get Section 232 rate from database by HS code (steel/aluminum safeguards)
 * Returns null if not found (no hardcoded defaults)
 */
async function getSection232Rate(hsCode) {
  try {
    const { data, error } = await supabase
      .from('tariff_rates_cache')
      .select('section_232')
      .eq('hs_code', hsCode)
      .limit(1)
      .single();

    if (error || !data?.section_232) {
      console.warn(`⚠️ [TARIFF-DB] No Section 232 rate found for ${hsCode}. Returning null for manual review.`);
      return null; // Signal missing data - don't use hardcoded default
    }

    return data.section_232 / 100; // Convert from percentage to decimal
  } catch (err) {
    console.error(`❌ [TARIFF-DB-ERROR] Failed to fetch Section 232 rate for ${hsCode}:`, err.message);
    return null; // Fail loud - don't use hardcoded default
  }
}

// HS code chapters susceptible to tariffs
const VULNERABLE_CHAPTERS = {
  'steel': ['72', '73'],           // Iron/steel articles
  'aluminum': ['76'],               // Aluminum articles
  'electronics': ['84', '85'],      // Machinery & electronics (Section 301 target)
  'machinery': ['84'],              // Machinery
};

async function estimateSection301Impact(tradeVolume, hsCode, originCountry) {
  // ✅ DATABASE-DRIVEN (Oct 27): Fetch rate from database instead of hardcoded constant
  const section301Rate = await getSection301Rate(originCountry, hsCode);

  if (section301Rate === 0) {
    return {
      rate: 0,
      exposure: false,
      annual_burden: 0,
      explanation: `${originCountry} is not subject to Section 301 tariffs`,
      source: 'business_rule'
    };
  }

  if (section301Rate === null) {
    return {
      rate: null,
      exposure: null,
      annual_burden: null,
      explanation: `⚠️ Section 301 rate not found in database for ${hsCode}. Please check if this HS code is in the tariff_rates_cache table.`,
      source: 'missing_data',
      error: 'NO_TARIFF_DATA'
    };
  }

  const annualBurden = tradeVolume * section301Rate;

  return {
    rate: section301Rate * 100, // As percentage
    exposure: true,
    annual_burden: annualBurden,
    explanation: `${originCountry}-origin products subject to ${(section301Rate * 100).toFixed(1)}% Section 301 tariff`,
    source: 'database_cache'
  };
}

async function estimateSection232Impact(tradeVolume, hsCode) {
  const chapter = hsCode?.substring(0, 2);

  // ✅ DATABASE-DRIVEN (Oct 27): Fetch rate from database instead of hardcoded constant
  const section232Rate = await getSection232Rate(hsCode);

  // Determine if this HS code is subject to Section 232
  const isSteel = VULNERABLE_CHAPTERS.steel.includes(chapter);
  const isAluminum = VULNERABLE_CHAPTERS.aluminum.includes(chapter);

  if (!isSteel && !isAluminum) {
    return {
      rate: 0,
      category: null,
      annual_burden: 0,
      exposure: false,
      source: 'business_rule'
    };
  }

  if (section232Rate === null) {
    return {
      rate: null,
      category: isSteel ? 'steel' : 'aluminum',
      annual_burden: null,
      exposure: null,
      explanation: `⚠️ Section 232 rate not found in database for ${hsCode}. Please check if this HS code is in the tariff_rates_cache table.`,
      source: 'missing_data',
      error: 'NO_TARIFF_DATA'
    };
  }

  const burden = tradeVolume * section232Rate;

  return {
    rate: section232Rate * 100,
    category: isSteel ? 'steel' : 'aluminum',
    annual_burden: burden,
    exposure: burden > 0,
    source: 'database_cache'
  };
}

export default protectedApiHandler({
  POST: async (req, res) => {
    try {
      const { action, data } = req.body;

      // ✅ VALIDATION: Fail loudly
      if (!action || action !== 'calculate_crisis_penalty') {
        return res.status(400).json({
          success: false,
          error: 'action must be "calculate_crisis_penalty"'
        });
      }

      const { tradeVolume, hsCode, originCountry, businessType, sessionId } = data || {};

      // Validate required fields
      if (!tradeVolume || tradeVolume <= 0) {
        return res.status(400).json({
          success: false,
          error: 'tradeVolume is required and must be > 0'
        });
      }

      if (!hsCode) {
        return res.status(400).json({
          success: false,
          error: 'hsCode is required'
        });
      }

      if (!originCountry) {
        return res.status(400).json({
          success: false,
          error: 'originCountry is required'
        });
      }

      // ✅ DATABASE-DRIVEN (Oct 27): Await async tariff rate lookups
      const section301Impact = await estimateSection301Impact(tradeVolume, hsCode, originCountry);
      const section232Impact = await estimateSection232Impact(tradeVolume, hsCode);

      // Check if we got valid data from database
      if (section301Impact.error === 'NO_TARIFF_DATA' && section232Impact.error === 'NO_TARIFF_DATA') {
        return res.status(400).json({
          success: false,
          error: 'MISSING_TARIFF_DATA',
          message: 'Tariff rates for this HS code not found in database. Please ensure the HS code is in the tariff_rates_cache table.',
          missing_rates: {
            section_301: section301Impact.explanation,
            section_232: section232Impact.explanation
          }
        });
      }

      // Total annual burden - handle null values
      const totalAnnualBurden =
        (section301Impact.annual_burden || 0) +
        (section232Impact.annual_burden || 0);

      // Generate mitigation recommendations
      const recommendations = [];

      if (section301Impact.exposure) {
        recommendations.push({
          strategy: 'Mexico Nearshoring',
          description: 'Move sourcing from China to Mexico to eliminate Section 301 tariffs',
          estimated_savings: section301Impact.annual_burden,
          implementation_months: 4,
          payback_months: Math.round(section301Impact.annual_burden / (tradeVolume * 0.02)) // Assuming 2% cost increase
        });
      }

      if (section232Impact.exposure) {
        recommendations.push({
          strategy: 'Domestic Sourcing',
          description: `Source ${section232Impact.category} from US suppliers to qualify for Section 232 exemptions`,
          estimated_savings: section232Impact.annual_burden,
          implementation_months: 3
        });
      }

      recommendations.push({
        strategy: 'Binding Ruling',
        description: 'File CBP Form 29 for binding HS classification to lock in tariff treatment for 3 years',
        estimated_savings: totalAnnualBurden * 0.1, // 10% average savings from optimized classification
        implementation_months: 3
      });

      return res.status(200).json({
        success: true,
        crisis_analysis: {
          product: hsCode,
          origin_country: originCountry,
          trade_volume: tradeVolume,

          tariff_impacts: {
            section_301: {
              rate: section301Impact.rate,
              annual_burden: Math.round(section301Impact.annual_burden),
              exposure: section301Impact.exposure,
              explanation: section301Impact.explanation
            },
            section_232: {
              rate: section232Impact.rate,
              category: section232Impact.category,
              annual_burden: Math.round(section232Impact.annual_burden),
              exposure: section232Impact.exposure
            },
            total_annual_burden: Math.round(totalAnnualBurden)
          },

          supply_chain_vulnerability: {
            level: totalAnnualBurden > tradeVolume * 0.20 ? 'HIGH' :
                   totalAnnualBurden > tradeVolume * 0.10 ? 'MEDIUM' : 'LOW',
            at_risk_components: [originCountry],
            policy_risk: 'Section 301 can escalate with 30 days notice'
          },

          strategic_recommendations: recommendations,

          immediate_actions: [
            'Audit supplier documentation and certificates of origin',
            'Verify freight forwarder USMCA compliance claims',
            'Evaluate nearshoring costs vs current tariff burden',
            'Consider filing CBP Form 29 binding ruling'
          ]
        },
        session_id: sessionId,
        calculated_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Crisis calculation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to calculate crisis impact'
      });
    }
  }
});
