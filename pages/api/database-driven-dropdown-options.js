/**
 * GET /api/database-driven-dropdown-options
 *
 * Returns dropdown options from the database instead of hardcoded values
 * Business types come from usmca_qualification_rules product_category column
 * Countries and other data from system config
 */

import { createClient } from '@supabase/supabase-js';
import { SYSTEM_CONFIG } from '../../config/system-config.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const category = req.query.category || 'all';

    // Load all dropdown data
    const businessTypes = await getBusinessTypesFromDatabase();
    const countries = getCountriesFromConfig();
    const usmcaCountries = getUSMCACountriesFromConfig();
    const importVolumes = getImportVolumesFromConfig();

    // Return based on category filter
    let responseData = {};

    if (category === 'all' || category === 'business_types') {
      responseData.businessTypes = businessTypes;
    }
    if (category === 'all' || category === 'countries') {
      responseData.countries = countries;
    }
    if (category === 'all' || category === 'usmca_countries') {
      responseData.usmcaCountries = usmcaCountries;
    }
    if (category === 'all' || category === 'import_volumes') {
      responseData.importVolumes = importVolumes;
    }

    return res.status(200).json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString(),
      source: 'database',
      businessTypes: businessTypes.length,
      countries: countries.length,
      usmcaCountries: usmcaCountries.length
    });

  } catch (error) {
    console.error('[DROPDOWN-OPTIONS] Database query failed:', error);
    return res.status(500).json({
      error: 'Failed to load dropdown options from database',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Query the usmca_qualification_rules table for distinct product categories
 * Each product category has a regional_content_threshold that determines USMCA eligibility
 */
async function getBusinessTypesFromDatabase() {
  try {
    // Query distinct product_category values from the database
    const { data, error } = await supabase
      .from('usmca_qualification_rules')
      .select('product_category, regional_content_threshold')
      .order('product_category', { ascending: true });

    if (error) {
      console.error('[DROPDOWN-OPTIONS] Query error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('[DROPDOWN-OPTIONS] No product categories found in database');
      return [];
    }

    // Transform database rows to dropdown format
    // Keep all unique product categories with their thresholds
    const businessTypes = data.map(row => ({
      value: row.product_category.toLowerCase().replace(/\s+/g, '_'),
      label: row.product_category,
      threshold: parseFloat(row.regional_content_threshold),
      description: `Requires ${row.regional_content_threshold}% regional content for USMCA qualification`
    }));

    console.log(`[DROPDOWN-OPTIONS] Loaded ${businessTypes.length} product categories from usmca_qualification_rules table`);
    return businessTypes;

  } catch (error) {
    console.error('[DROPDOWN-OPTIONS] Failed to load business types from database:', error.message);
    // Fail loudly - don't return empty array
    throw new Error(`Database query failed: Unable to load product categories from usmca_qualification_rules table. ${error.message}`);
  }
}

/**
 * Get countries from system config (no database needed for this static list)
 */
function getCountriesFromConfig() {
  try {
    const codeMappings = SYSTEM_CONFIG.countries.codeMappings;

    // Convert code->name mappings to dropdown format
    const countries = Object.entries(codeMappings)
      .map(([name, code]) => ({
        value: code,
        label: name,
        code: code
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return countries;
  } catch (error) {
    console.error('[DROPDOWN-OPTIONS] Failed to load countries from config:', error.message);
    throw new Error(`Config error: Unable to load countries. ${error.message}`);
  }
}

/**
 * Get USMCA countries from system config
 */
function getUSMCACountriesFromConfig() {
  try {
    const codeMappings = SYSTEM_CONFIG.countries.codeMappings;
    const usmcaCountryCodes = SYSTEM_CONFIG.countries.usmcaCountries;

    // Build list of USMCA countries with their full names from mappings
    const usmcaCountries = usmcaCountryCodes
      .map(code => {
        // Find the country name that maps to this code
        const countryName = Object.entries(codeMappings).find(
          ([_, c]) => c === code
        )?.[0] || code;

        return {
          value: code,
          label: countryName,
          code: code
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    return usmcaCountries;
  } catch (error) {
    console.error('[DROPDOWN-OPTIONS] Failed to load USMCA countries from config:', error.message);
    throw new Error(`Config error: Unable to load USMCA countries. ${error.message}`);
  }
}

/**
 * Get import volume ranges from config (static list, no database needed)
 */
function getImportVolumesFromConfig() {
  return [
    { value: 'Under $500K', label: 'Under $500K annually' },
    { value: '$500K - $1M', label: '$500K - $1M annually' },
    { value: '$1M - $5M', label: '$1M - $5M annually' },
    { value: '$5M+', label: '$5M+ annually' }
  ];
}
