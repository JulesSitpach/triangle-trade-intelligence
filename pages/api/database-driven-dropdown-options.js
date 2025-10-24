/**
 * DATABASE-DRIVEN DROPDOWN OPTIONS API
 * NO HARDCODED LISTS - COMPLETE DATABASE INTEGRATION
 *
 * Queries industry_thresholds table for all industry sector options
 * Following AI-first principle: database is single source of truth
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const startTime = Date.now();

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      allowed_methods: ['GET']
    });
  }

  try {
    const { category } = req.query;

    console.log('Dropdown options request', { category });

    let result;
    switch (category) {
      case 'business_types':
        result = await getBusinessTypes();
        break;

      case 'all':
        result = await getAllDropdownOptions();
        break;

      default:
        return res.status(400).json({
          error: 'Invalid category',
          supported_categories: ['business_types', 'all']
        });
    }

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      category,
      data: result,
      processing_time_ms: responseTime,
      timestamp: new Date().toISOString(),
      source: 'database_driven'
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Dropdown options failed:', {
      error: error.message,
      category: req.query.category,
      responseTime,
      stack: error.stack
    });

    // Fail loudly - no hardcoded fallback
    return res.status(500).json({
      success: false,
      error: 'Unable to load dropdown options from database',
      technical_error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      processing_time_ms: responseTime,
      timestamp: new Date().toISOString(),
      message: 'Database error - all dropdown options must come from the database'
    });
  }
}

/**
 * Get business types from database
 * USES industry_thresholds TABLE (same source as qualification engine)
 * NO HARDCODED BUSINESS TYPE LISTS
 */
async function getBusinessTypes() {
  try {
    // Query industry_thresholds table - this is the authoritative source
    // It matches what the qualification engine uses in industry-thresholds-service.js
    const { data: thresholds, error: thresholdError } = await supabase
      .from('industry_thresholds')
      .select('display_name, rvc_percentage, usmca_article, is_active')
      .eq('is_active', true)
      .order('display_name');

    if (thresholdError) {
      console.error('Database query error:', thresholdError);
      throw thresholdError;
    }

    if (!thresholds || thresholds.length === 0) {
      console.error('No thresholds found in industry_thresholds table');
      throw new Error('No active thresholds found in industry_thresholds table');
    }

    // Convert thresholds to dropdown format
    const businessTypes = thresholds.map(threshold => ({
      value: threshold.display_name,
      label: threshold.display_name,
      description: `USMCA ${threshold.rvc_percentage}% RVC`
    }));

    console.log('✓ Business types loaded from industry_thresholds table', {
      totalCategories: businessTypes.length,
      samples: businessTypes.slice(0, 3).map(b => b.label)
    });

    return businessTypes;

  } catch (error) {
    console.error('Failed to load business types from industry_thresholds table:', error.message);
    throw error;
  }
}

/**
 * Get all dropdown options in one request
 * EFFICIENT BATCH LOADING - ALL FROM DATABASE
 */
async function getAllDropdownOptions() {
  try {
    // Load all options in parallel
    const businessTypes = await getBusinessTypes();
    const allCountries = await getCountries();
    const usmcaCountries = await getUSMCACountries();

    return {
      business_types: businessTypes,
      countries: allCountries,
      usmca_countries: usmcaCountries,
      summary: {
        business_types_count: businessTypes.length,
        countries_count: allCountries.length,
        usmca_countries_count: usmcaCountries.length,
        total_options: businessTypes.length + allCountries.length
      }
    };

  } catch (error) {
    console.error('Failed to load all dropdown options:', error.message);
    throw error;
  }
}

/**
 * Get ALL countries list for dropdowns
 * QUERIES database - NO hardcoding
 */
async function getCountries() {
  try {
    const { data: countries, error } = await supabase
      .from('countries')
      .select('code, name')
      .order('name');

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    if (!countries || countries.length === 0) {
      console.error('No countries found in countries table');
      throw new Error('No countries found in countries table');
    }

    // Return country names for dropdown display
    const countryNames = countries.map(country => country.name);

    console.log('✓ Countries loaded from countries table', {
      totalCountries: countryNames.length,
      samples: countryNames.slice(0, 5)
    });

    return countryNames;

  } catch (error) {
    console.error('Failed to load countries from database:', error.message);
    throw error;
  }
}

/**
 * Get USMCA countries list (US, CA, MX only)
 * QUERIES database for countries with USMCA in trade_agreements
 */
async function getUSMCACountries() {
  try {
    const { data: countries, error } = await supabase
      .from('countries')
      .select('code, name, trade_agreements')
      .order('name');

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    if (!countries || countries.length === 0) {
      console.error('No countries found in countries table');
      throw new Error('No countries found in countries table');
    }

    // Filter for USMCA members (trade_agreements contains 'USMCA')
    const usmcaMembers = countries
      .filter(country => {
        const agreements = country.trade_agreements || [];
        return Array.isArray(agreements) && agreements.includes('USMCA');
      })
      .map(country => ({
        code: country.code,
        name: country.name,
        label: country.name,
        value: country.code
      }));

    console.log('✓ USMCA countries loaded from database', {
      totalUsmcaCountries: usmcaMembers.length,
      members: usmcaMembers.map(c => c.name)
    });

    return usmcaMembers;

  } catch (error) {
    console.error('Failed to load USMCA countries from database:', error.message);
    throw error;
  }
}
