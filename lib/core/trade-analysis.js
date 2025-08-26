/**
 * CORE TRADE ANALYSIS - DEFENSIBLE DATA ONLY
 * 
 * MISSION: Replace fabricated metrics with traceable calculations
 * - ALL calculations must be traceable to source data
 * - NO hardcoded percentages, savings, or success rates
 * - Clear disclaimers on all estimates
 * 
 * Context7 Verified Limitations:
 * - UN Comtrade provides historical trade statistics (2+ years old)
 * - NO real-time tariff rates available via API
 * - Trade data can be revised up to 5 years back
 * - Country reporting decreased from 177 (2017) to 146 (2024)
 */

import { logInfo, logError, logPerformance } from '../production-logger.js';
import { getSupabaseClient } from '../supabase-client.js';

const supabase = getSupabaseClient();

/**
 * Analyze bilateral trade flows with clear data limitations
 * @param {string} origin - Origin country code
 * @param {string} destination - Destination country code
 * @returns {Promise<Object>} Historical trade analysis with disclaimers
 */
export async function analyzeBilateralTrade(origin, destination) {
  const startTime = Date.now();
  
  try {
    logInfo('Analyzing bilateral trade', { route: `${origin} -> ${destination}` });

    // Query actual database trade flows
    const { data: tradeFlows, error } = await supabase
      .from('trade_flows')
      .select('*')
      .eq('reporter_country', origin)
      .eq('partner_country', destination)
      .order('trade_value', { ascending: false })
      .limit(100);

    if (error) {
      logError('Bilateral trade query failed', { error: error.message });
      throw error;
    }

    // Calculate basic statistics from actual data
    const tradeValues = tradeFlows
      .map(flow => parseFloat(flow.trade_value) || 0)
      .filter(value => value > 0);

    const analysis = {
      route: `${origin} -> ${destination}`,
      dataSource: {
        type: 'Historical Trade Database',
        records: tradeFlows.length,
        disclaimer: 'HISTORICAL DATA ONLY - NOT CURRENT MARKET CONDITIONS'
      },
      tradeExists: tradeValues.length > 0,
      statistics: tradeValues.length > 0 ? {
        recordCount: tradeValues.length,
        totalValue: tradeValues.reduce((sum, val) => sum + val, 0),
        averageValue: tradeValues.reduce((sum, val) => sum + val, 0) / tradeValues.length,
        maxValue: Math.max(...tradeValues),
        minValue: Math.min(...tradeValues),
        calculation: 'Sum/average of historical trade flow records'
      } : null,
      limitations: [
        'Based on historical data, not current market conditions',
        'Trade flows may be 2+ years old',
        'Does not include tariff rates or shipping costs',
        'Cannot predict future trade patterns'
      ],
      lastUpdated: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };

    logPerformance('analyzeBilateralTrade', analysis.responseTime, {
      route: analysis.route,
      recordsFound: tradeFlows.length
    });

    return analysis;

  } catch (error) {
    logError('Bilateral trade analysis failed', {
      route: `${origin} -> ${destination}`,
      error: error.message
    });
    throw error;
  }
}

/**
 * Analyze potential triangle route with data limitations
 * @param {string} origin - Origin country
 * @param {string} transit - Transit country  
 * @param {string} destination - Destination country
 * @returns {Promise<Object>} Triangle route analysis with disclaimers
 */
export async function analyzeTriangleRoute(origin, transit, destination) {
  const startTime = Date.now();
  
  try {
    logInfo('Analyzing triangle route', { 
      route: `${origin} -> ${transit} -> ${destination}` 
    });

    // Get both legs of triangle route
    const [leg1Analysis, leg2Analysis] = await Promise.all([
      analyzeBilateralTrade(origin, transit),
      analyzeBilateralTrade(transit, destination)
    ]);

    const triangleAnalysis = {
      route: `${origin} -> ${transit} -> ${destination}`,
      leg1: {
        route: `${origin} -> ${transit}`,
        ...leg1Analysis
      },
      leg2: {
        route: `${transit} -> ${destination}`,
        ...leg2Analysis
      },
      viability: {
        bothLegsExist: leg1Analysis.tradeExists && leg2Analysis.tradeExists,
        analysis: leg1Analysis.tradeExists && leg2Analysis.tradeExists 
          ? 'Historical trade flows exist for both legs'
          : 'Missing trade flows on one or both legs',
        disclaimer: 'PRELIMINARY ASSESSMENT - REQUIRES PROFESSIONAL VERIFICATION'
      },
      usmcaContext: {
        isUSMCARoute: ['US', 'CA', 'MX'].includes(transit) && ['US', 'CA', 'MX'].includes(destination),
        treatyNote: 'USMCA qualification requires customs authority verification',
        tariffDisclaimer: 'Tariff rates not available via API - contact customs authorities'
      },
      methodology: {
        calculation: 'Historical trade flow existence check only',
        limitations: [
          'Cannot calculate actual savings without current tariff data',
          'Does not include compliance requirements',
          'Does not include shipping costs or logistics',
          'Historical data may not reflect current trade relationships'
        ]
      },
      professionalReferral: {
        required: true,
        contacts: [
          'Customs broker for tariff verification',
          'Freight forwarder for shipping costs',
          'Trade lawyer for compliance requirements'
        ]
      },
      lastUpdated: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };

    logPerformance('analyzeTriangleRoute', triangleAnalysis.responseTime, {
      route: triangleAnalysis.route,
      leg1Records: leg1Analysis.statistics?.recordCount || 0,
      leg2Records: leg2Analysis.statistics?.recordCount || 0
    });

    return triangleAnalysis;

  } catch (error) {
    logError('Triangle route analysis failed', {
      route: `${origin} -> ${transit} -> ${destination}`,
      error: error.message
    });
    throw error;
  }
}

/**
 * Get available countries from database
 * @returns {Promise<Array>} List of countries with trade data
 */
export async function getAvailableCountries() {
  try {
    const { data: countries, error } = await supabase
      .from('countries')
      .select('code, name')
      .order('name');

    if (error) {
      logError('Countries query failed', { error: error.message });
      throw error;
    }

    return {
      countries: countries || [],
      total: countries?.length || 0,
      dataSource: 'Countries reference table',
      disclaimer: 'List of countries with potential trade data - not guaranteed current coverage'
    };

  } catch (error) {
    logError('Get available countries failed', { error: error.message });
    throw error;
  }
}

/**
 * Get basic HS code information without fabricated tariff data
 * @param {string} hsCode - HS code to lookup
 * @returns {Promise<Object>} HS code information with limitations
 */
export async function getHSCodeInfo(hsCode) {
  try {
    const { data: hsData, error } = await supabase
      .from('comtrade_reference')
      .select('*')
      .eq('hs_code', hsCode)
      .limit(1);

    if (error) {
      logError('HS code query failed', { hsCode, error: error.message });
      throw error;
    }

    const hsInfo = hsData?.[0];

    return {
      hsCode: hsCode,
      found: !!hsInfo,
      description: hsInfo?.product_description || 'No description available',
      dataSource: 'HS Code Reference Database',
      limitations: [
        'Description only - no tariff rates available',
        'Classification may vary by country',
        'Requires customs authority verification for accuracy'
      ],
      professionalVerification: 'Contact customs broker for official classification',
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    logError('HS code lookup failed', { hsCode, error: error.message });
    throw error;
  }
}

/**
 * Validate calculation authenticity - ensures no fabricated data
 * @param {Object} calculation - Calculation object to validate
 * @returns {Object} Validation result
 */
export function validateCalculationAuthenticity(calculation) {
  const issues = [];

  // Check for hardcoded values
  const jsonString = JSON.stringify(calculation);
  
  // Common fabricated patterns
  if (jsonString.includes('$') && /\$\d+[KM]/.test(jsonString)) {
    issues.push('Contains formatted currency amounts that may be estimates');
  }
  
  if (jsonString.includes('%') && /\d+%/.test(jsonString)) {
    issues.push('Contains percentage values that may be estimates');
  }
  
  if (jsonString.includes('success') || jsonString.includes('confidence')) {
    issues.push('Contains success/confidence metrics that may be fabricated');
  }

  // Check for required disclaimers
  const hasDisclaimer = jsonString.toLowerCase().includes('estimate') || 
                       jsonString.toLowerCase().includes('preliminary') ||
                       jsonString.toLowerCase().includes('disclaimer');

  return {
    isAuthentic: issues.length === 0 && hasDisclaimer,
    issues: issues,
    hasRequiredDisclaimers: hasDisclaimer,
    recommendation: issues.length > 0 
      ? 'Add disclaimers and source attribution'
      : 'Calculation appears properly attributed',
    timestamp: new Date().toISOString()
  };
}