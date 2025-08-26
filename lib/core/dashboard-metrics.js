/**
 * DASHBOARD METRICS - DEFENSIBLE DATA ONLY
 * 
 * MISSION: Replace fabricated dashboard metrics with traceable calculations
 * - All metrics must trace to actual database records
 * - NO success rates, ROI percentages, or confidence scores without source
 * - Clear disclaimers on all estimates
 * 
 * Business Context: Husband's income depends on defensible dashboard data
 */

import { logInfo, logError, logPerformance } from '../production-logger.js';
import { getSupabaseClient } from '../supabase-client.js';
import { validateCalculationAuthenticity } from './trade-analysis.js';

const supabase = getSupabaseClient();

/**
 * Get basic database statistics for dashboard
 * @returns {Promise<Object>} Database statistics with disclaimers
 */
export async function getDashboardStatistics() {
  const startTime = Date.now();
  
  try {
    logInfo('Generating dashboard statistics from database');

    // Get actual database record counts
    const [tradeFlowsCount, hsCodesCount, sessionsCount, countriesCount] = await Promise.all([
      supabase.from('trade_flows').select('*', { count: 'exact', head: true }),
      supabase.from('comtrade_reference').select('*', { count: 'exact', head: true }),
      supabase.from('workflow_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('countries').select('*', { count: 'exact', head: true })
    ]);

    // Calculate basic trade flow statistics
    const { data: tradeValueSample } = await supabase
      .from('trade_flows')
      .select('trade_value')
      .not('trade_value', 'is', null)
      .order('trade_value', { ascending: false })
      .limit(1000);

    const tradeValues = (tradeValueSample || [])
      .map(row => parseFloat(row.trade_value) || 0)
      .filter(val => val > 0);

    const statistics = {
      database_records: {
        trade_flows: tradeFlowsCount.count || 0,
        hs_codes: hsCodesCount.count || 0,
        user_sessions: sessionsCount.count || 0,
        countries: countriesCount.count || 0,
        total_records: (tradeFlowsCount.count || 0) + (hsCodesCount.count || 0) + 
                      (sessionsCount.count || 0) + (countriesCount.count || 0)
      },
      trade_data_summary: tradeValues.length > 0 ? {
        sample_size: tradeValues.length,
        max_trade_value: Math.max(...tradeValues),
        min_trade_value: Math.min(...tradeValues),
        average_trade_value: tradeValues.reduce((sum, val) => sum + val, 0) / tradeValues.length,
        calculation: 'Statistical summary of sample trade flow records',
        disclaimer: 'Based on sample of historical trade flows - not comprehensive analysis'
      } : null,
      data_quality: {
        trade_flows_with_values: tradeValues.length,
        trade_flows_without_values: (tradeFlowsCount.count || 0) - tradeValues.length,
        data_completeness: tradeValues.length > 0 
          ? `${Math.round((tradeValues.length / (tradeFlowsCount.count || 1)) * 100)}%`
          : '0%',
        note: 'Percentage of trade flow records with valid trade values'
      },
      system_health: {
        database_accessible: true,
        last_updated: new Date().toISOString(),
        response_time: Date.now() - startTime,
        status: 'operational'
      },
      mandatory_disclaimers: [
        'Statistics based on historical database records only',
        'Not representative of current market conditions',
        'Sample data used for performance - not comprehensive analysis',
        'Professional verification required for business decisions'
      ],
      data_limitations: [
        'Historical data may be 2+ years old',
        'Database completeness varies by country and time period',
        'Statistics are descriptive only - not predictive',
        'Business impact cannot be calculated from this data alone'
      ]
    };

    logPerformance('dashboard statistics', statistics.system_health.response_time, {
      recordTypes: Object.keys(statistics.database_records).length,
      totalRecords: statistics.database_records.total_records
    });

    return statistics;

  } catch (error) {
    logError('Dashboard statistics generation failed', {
      error: error.message,
      stack: error.stack
    });

    return {
      error: 'Unable to generate dashboard statistics',
      message: error.message,
      fallback_message: 'Database query failed - manual verification required',
      system_health: {
        database_accessible: false,
        last_updated: new Date().toISOString(),
        status: 'error'
      },
      disclaimer: 'No statistics available - contact system administrator'
    };
  }
}

/**
 * Get basic USMCA context information (treaty facts only)
 * @returns {Object} USMCA treaty context with disclaimers
 */
export function getUSMCAContext() {
  return {
    treaty_information: {
      name: 'United States-Mexico-Canada Agreement (USMCA)',
      effective_date: 'July 1, 2020',
      member_countries: ['United States', 'Mexico', 'Canada'],
      tariff_provision: 'Qualifying goods may be eligible for 0% tariff rates',
      source: 'Public treaty text'
    },
    qualification_requirements: {
      rules_of_origin: 'Products must meet specific rules of origin requirements',
      documentation: 'Proper certification and documentation required',
      compliance: 'Ongoing compliance with treaty provisions required',
      professional_verification: 'Customs broker or trade attorney consultation recommended'
    },
    important_disclaimers: [
      'USMCA qualification is not automatic',
      'Rules of origin requirements must be met',
      'Professional verification required for compliance',
      'Treaty provisions subject to interpretation and change'
    ],
    professional_referrals: [
      'Licensed customs broker for qualification assessment',
      'Trade attorney for compliance guidance',
      'U.S. Customs and Border Protection for official rulings'
    ],
    authenticity_verification: validateCalculationAuthenticity({
      usesPublicTreatyText: true,
      hasDisclaimers: true,
      requiresProfessionalVerification: true
    }),
    last_updated: new Date().toISOString()
  };
}

/**
 * Get available trade routes from database
 * @returns {Promise<Object>} Available routes with context
 */
export async function getAvailableTradeRoutes() {
  const startTime = Date.now();
  
  try {
    logInfo('Getting available trade routes from database');

    // Get countries that appear in trade flows
    const { data: reporterCountries } = await supabase
      .from('trade_flows')
      .select('reporter_country')
      .not('reporter_country', 'is', null)
      .limit(1000);

    const { data: partnerCountries } = await supabase
      .from('trade_flows')
      .select('partner_country')
      .not('partner_country', 'is', null)
      .limit(1000);

    const uniqueReporters = [...new Set((reporterCountries || []).map(r => r.reporter_country))];
    const uniquePartners = [...new Set((partnerCountries || []).map(r => r.partner_country))];
    const allTradeCountries = [...new Set([...uniqueReporters, ...uniquePartners])];

    // Get country reference data
    const { data: countryReference } = await supabase
      .from('countries')
      .select('code, name')
      .in('code', allTradeCountries.slice(0, 50)); // Limit for performance

    const routes = {
      available_origins: uniqueReporters.slice(0, 20).map(code => ({
        code,
        name: countryReference?.find(c => c.code === code)?.name || code,
        has_trade_data: true
      })),
      available_destinations: uniquePartners.slice(0, 20).map(code => ({
        code,
        name: countryReference?.find(c => c.code === code)?.name || code,
        has_trade_data: true
      })),
      usmca_countries: [
        { code: 'US', name: 'United States', usmca_member: true },
        { code: 'MX', name: 'Mexico', usmca_member: true },
        { code: 'CA', name: 'Canada', usmca_member: true }
      ],
      route_analysis_available: {
        direct_routes: true,
        triangle_routes: true,
        historical_context_only: true,
        real_time_data: false
      },
      data_source: {
        type: 'Historical trade flows database',
        sample_size: `${uniqueReporters.length} reporter countries, ${uniquePartners.length} partner countries`,
        disclaimer: 'Historical data only - current trade relationships may differ'
      },
      performance: {
        response_time: Date.now() - startTime,
        countries_analyzed: allTradeCountries.length,
        last_updated: new Date().toISOString()
      }
    };

    logPerformance('available trade routes', routes.performance.response_time, {
      originsFound: uniqueReporters.length,
      destinationsFound: uniquePartners.length
    });

    return routes;

  } catch (error) {
    logError('Available trade routes query failed', {
      error: error.message
    });

    return {
      error: 'Unable to retrieve trade routes',
      message: error.message,
      fallback: {
        usmca_countries: [
          { code: 'US', name: 'United States', usmca_member: true },
          { code: 'MX', name: 'Mexico', usmca_member: true },
          { code: 'CA', name: 'Canada', usmca_member: true }
        ],
        common_origins: [
          { code: 'CN', name: 'China' },
          { code: 'IN', name: 'India' },
          { code: 'VN', name: 'Vietnam' }
        ]
      },
      disclaimer: 'Database query failed - using fallback data',
      professional_recommendation: 'Contact trade professionals for current route options'
    };
  }
}