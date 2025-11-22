/**
 * Comparative Tariff Analysis API
 * Compares tariff rates across US and Mexico (+ future countries)
 *
 * POST /api/comparative-tariff-analysis
 *
 * Request Body:
 * {
 *   components: [
 *     { hs_code: '85423100', origin: 'CN', value: 1000000 }
 *   ],
 *   destinations: ['US', 'MX'],  // Countries to compare
 *   manufacturing_location: 'MX'
 * }
 *
 * Response:
 * {
 *   comparison: {
 *     US: { mfn_total: 50000, usmca_total: 5000, savings: 45000 },
 *     MX: { mfn_total: 35000, usmca_total: 5000, savings: 30000 }
 *   },
 *   recommendation: 'Import to Mexico saves $15K additional vs US',
 *   component_breakdown: [...]
 * }
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { components, destinations, manufacturing_location } = req.body;

    // Validate inputs
    if (!components || !Array.isArray(components) || components.length === 0) {
      return res.status(400).json({ error: 'Components array required' });
    }

    if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return res.status(400).json({ error: 'Destinations array required' });
    }

    // Currently support US and MX only
    const validDestinations = destinations.filter(d => ['US', 'MX'].includes(d));
    if (validDestinations.length === 0) {
      return res.status(400).json({ error: 'Only US and MX destinations currently supported' });
    }

    // Process each destination
    const comparisonResults = {};

    for (const dest of validDestinations) {
      const result = await analyzeForDestination(dest, components, manufacturing_location);
      comparisonResults[dest] = result;
    }

    // Generate recommendation
    const recommendation = generateRecommendation(comparisonResults);

    // Component-level breakdown
    const componentBreakdown = await generateComponentBreakdown(
      components,
      validDestinations
    );

    res.status(200).json({
      success: true,
      comparison: comparisonResults,
      recommendation,
      component_breakdown: componentBreakdown
    });

  } catch (error) {
    console.error('Comparative analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Analyze tariff costs for a single destination
 */
async function analyzeForDestination(destination, components, manufacturingLocation) {
  let mfnTotalDuties = 0;
  let usmcaTotalDuties = 0;
  let policyAdjustments = [];

  for (const component of components) {
    const rates = await getTariffRates(destination, component.hs_code, component.origin);

    const componentValue = component.value || 0;

    // MFN duty calculation
    const mfnDuty = componentValue * (rates.mfn_rate / 100);
    const policyDuty = componentValue * (rates.policy_adjustments / 100);
    mfnTotalDuties += mfnDuty + policyDuty;

    // USMCA duty calculation (usually 0% if qualified)
    const usmcaDuty = componentValue * (rates.usmca_rate / 100);
    usmcaTotalDuties += usmcaDuty;

    // Track policy adjustments
    if (rates.policy_details && rates.policy_details.length > 0) {
      policyAdjustments.push(...rates.policy_details);
    }
  }

  const savings = mfnTotalDuties - usmcaTotalDuties;
  const savingsPercentage = mfnTotalDuties > 0
    ? (savings / mfnTotalDuties) * 100
    : 0;

  return {
    destination,
    mfn_total_duties: Math.round(mfnTotalDuties),
    usmca_total_duties: Math.round(usmcaTotalDuties),
    savings: Math.round(savings),
    savings_percentage: Math.round(savingsPercentage),
    policy_adjustments: policyAdjustments,
    effective_duty_rate: mfnTotalDuties > 0
      ? (mfnTotalDuties / components.reduce((sum, c) => sum + (c.value || 0), 0)) * 100
      : 0
  };
}

/**
 * Get tariff rates for destination + HS code + origin combination
 */
async function getTariffRates(destination, hsCode, originCountry) {
  const normalized = normalizeHSCode(hsCode);

  if (destination === 'US') {
    return await getUSTariffRates(normalized, originCountry);
  } else if (destination === 'MX') {
    return await getMexicoTariffRates(normalized, originCountry);
  }

  throw new Error(`Unsupported destination: ${destination}`);
}

/**
 * Get US tariff rates (existing database)
 */
async function getUSTariffRates(hsCode, originCountry) {
  // Check tariff_intelligence_master
  const { data: masterData } = await supabase
    .from('tariff_intelligence_master')
    .select('mfn_ad_val_rate, usmca_ad_val_rate')
    .eq('hs_code', hsCode)
    .single();

  const mfnRate = masterData?.mfn_ad_val_rate || 0;
  const usmcaRate = masterData?.usmca_ad_val_rate || 0;

  // Check for policy adjustments (Section 301, 232)
  const { data: policyData } = await supabase
    .from('policy_tariffs_cache')
    .select('*')
    .ilike('hs_code_prefix', `${hsCode.substring(0, 4)}%`)
    .or(`origin_country.eq.${originCountry},origin_country.is.null`);

  let policyAdjustments = 0;
  const policyDetails = [];

  if (policyData && policyData.length > 0) {
    for (const policy of policyData) {
      policyAdjustments += policy.section_301 || 0;
      policyAdjustments += policy.section_232 || 0;

      if (policy.section_301 > 0) {
        policyDetails.push({
          type: 'Section 301',
          rate: policy.section_301,
          origin: originCountry
        });
      }

      if (policy.section_232 > 0) {
        policyDetails.push({
          type: 'Section 232',
          rate: policy.section_232,
          origin: originCountry
        });
      }
    }
  }

  return {
    mfn_rate: mfnRate,
    usmca_rate: usmcaRate,
    policy_adjustments: policyAdjustments,
    policy_details: policyDetails
  };
}

/**
 * Get Mexico tariff rates (new database)
 */
async function getMexicoTariffRates(hsCode, originCountry) {
  // Check tariff_rates_mexico
  const { data: mexicoData } = await supabase
    .from('tariff_rates_mexico')
    .select('*')
    .eq('hs_code', hsCode)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();

  const mfnRate = mexicoData?.mfn_rate || 0;
  const usmcaRate = mexicoData?.usmca_rate || 0;

  // Check for policy adjustments (Mexican antidumping, safeguards)
  const { data: policyData } = await supabase
    .from('policy_tariffs_international')
    .select('*')
    .eq('destination_country', 'MX')
    .ilike('hs_code', `${hsCode.substring(0, 4)}%`)
    .or(`origin_country.eq.${originCountry},origin_country.is.null`)
    .gte('effective_date', new Date().toISOString().split('T')[0]);

  let policyAdjustments = 0;
  const policyDetails = [];

  if (policyData && policyData.length > 0) {
    for (const policy of policyData) {
      policyAdjustments += policy.rate_adjustment || 0;

      policyDetails.push({
        type: policy.policy_type,
        rate: policy.rate_adjustment,
        origin: originCountry,
        name: policy.policy_name
      });
    }
  }

  return {
    mfn_rate: mfnRate,
    usmca_rate: usmcaRate,
    policy_adjustments: policyAdjustments,
    policy_details: policyDetails
  };
}

/**
 * Generate recommendation based on comparison
 */
function generateRecommendation(comparisonResults) {
  const destinations = Object.keys(comparisonResults);

  if (destinations.length === 1) {
    const dest = destinations[0];
    const result = comparisonResults[dest];

    return `Importing to ${dest}: Save $${result.savings.toLocaleString()} annually with USMCA (${result.savings_percentage}% reduction)`;
  }

  // Compare two destinations
  const [dest1, dest2] = destinations;
  const result1 = comparisonResults[dest1];
  const result2 = comparisonResults[dest2];

  const diff = result1.savings - result2.savings;

  if (Math.abs(diff) < 1000) {
    return `Similar savings in both countries (~$${result1.savings.toLocaleString()}). Choose based on operational factors.`;
  }

  if (diff > 0) {
    return `Import to ${dest1} saves $${Math.abs(diff).toLocaleString()} MORE than ${dest2} (total: $${result1.savings.toLocaleString()} vs $${result2.savings.toLocaleString()})`;
  } else {
    return `Import to ${dest2} saves $${Math.abs(diff).toLocaleString()} MORE than ${dest1} (total: $${result2.savings.toLocaleString()} vs $${result1.savings.toLocaleString()})`;
  }
}

/**
 * Generate component-level breakdown
 */
async function generateComponentBreakdown(components, destinations) {
  const breakdown = [];

  for (const component of components) {
    const componentComparison = {};

    for (const dest of destinations) {
      const rates = await getTariffRates(dest, component.hs_code, component.origin);
      const componentValue = component.value || 0;

      const mfnDuty = componentValue * ((rates.mfn_rate + rates.policy_adjustments) / 100);
      const usmcaDuty = componentValue * (rates.usmca_rate / 100);

      componentComparison[dest] = {
        mfn_rate: rates.mfn_rate,
        policy_adjustments: rates.policy_adjustments,
        total_rate: rates.mfn_rate + rates.policy_adjustments,
        usmca_rate: rates.usmca_rate,
        mfn_duty: Math.round(mfnDuty),
        usmca_duty: Math.round(usmcaDuty),
        savings: Math.round(mfnDuty - usmcaDuty),
        policy_details: rates.policy_details
      };
    }

    breakdown.push({
      hs_code: component.hs_code,
      description: component.description,
      origin: component.origin,
      value: component.value,
      comparison: componentComparison
    });
  }

  return breakdown;
}

/**
 * Normalize HS code (remove periods, pad to 8 digits)
 */
function normalizeHSCode(hsCode) {
  if (!hsCode) return '';

  // Remove periods
  let normalized = hsCode.replace(/\./g, '');

  // Pad to 8 digits if needed
  while (normalized.length < 8) {
    normalized += '0';
  }

  return normalized.substring(0, 8);
}
