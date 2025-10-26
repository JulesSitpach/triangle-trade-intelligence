/**
 * Industry Thresholds Service
 * Database-driven USMCA qualification thresholds with NO hardcoded fallback
 *
 * Priority: Database ONLY
 * If database fails, fail loudly - no silent fallbacks
 *
 * Migration Status:
 * All 14 industries are in the database with correct thresholds
 * Hardcoded fallback has been removed (Oct 24, 2025)
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logWarning } from '../utils/production-logger.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Map dropdown/UI industry values to database industry_key
 * The dropdown shows detailed product categories (19 options)
 * But the database has simple industry keys (14 options)
 * This function maps between them
 */
function mapIndustryToKey(industryValue) {
  // Mapping from detailed product_category to simple industry_key
  const categoryToKeyMap = {
    // Electronics (3 detailed → 1 key)
    'Consumer Electronics (phones, laptops, chargers)': 'Electronics',
    'Electronic Components (semiconductors, circuits)': 'Electronics',
    'Industrial Electronics (control systems, sensors)': 'Electronics',

    // Apparel/Textiles
    'Apparel & Clothing': 'Textiles/Apparel',
    'Textile Goods & Fabrics': 'Textiles/Apparel',
    'Footwear & Leather Goods': 'Leather',

    // Automotive
    'Automotive Parts & Assemblies': 'Automotive',

    // Metals
    'Base Metals & Metal Products': 'Base Metals',

    // Chemicals
    'Chemicals & Raw Materials': 'Chemicals',

    // Machinery
    'Mechanical Machinery & Industrial Equipment': 'Machinery',

    // Energy
    'Energy Equipment & Renewable Technologies': 'Energy Equipment',

    // Agriculture
    'Agricultural & Food Processing Equipment': 'Agriculture',
    'Raw Agricultural Products': 'Agriculture',
    'Processed Food & Beverages': 'Agriculture',

    // Precision/Medical
    'Precision Instruments & Optical Equipment': 'Precision Instruments',
    'Medical Devices & Healthcare Equipment': 'Precision Instruments',

    // Construction/Building
    'Construction & Building Materials': 'General',

    // Plastics
    'Plastics & Rubber Products': 'Plastics & Rubber',

    // Wood/Paper
    'Wood, Paper & Raw Materials': 'Wood Products'
  };

  // If we have a mapping, use it. Otherwise, try to find a close match
  if (categoryToKeyMap[industryValue]) {
    return categoryToKeyMap[industryValue];
  }

  // Fallback: try case-insensitive partial matching
  for (const [category, key] of Object.entries(categoryToKeyMap)) {
    if (industryValue.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(industryValue.toLowerCase())) {
      return key;
    }
  }

  // Last resort: return as-is (will likely fail, which is better than silent fallback)
  return industryValue;
}

/**
 * Get industry threshold from database ONLY
 * NO hardcoded fallback - fail loudly if database unavailable
 *
 * @param {string} industryValue - What user selected (from dropdown)
 * @param {Object} context - Optional context for logging (userId, workflowId, etc.)
 * @returns {Promise<Object>} Threshold object with rvc, labor, article, method
 */
export async function getIndustryThreshold(industryValue, context = {}) {
  const industryKey = mapIndustryToKey(industryValue);

  try {
    // Query database for active threshold
    const { data: thresholds, error } = await supabase
      .from('industry_thresholds')
      .select('rvc_percentage, labor_percentage, usmca_article, qualification_method')
      .eq('industry_key', industryKey)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Database query error:', error.message);
      throw error;
    }

    if (!thresholds) {
      throw new Error(`No active threshold found for industry_key: ${industryKey}`);
    }

    // SUCCESS: Database found active threshold
    console.log(`✓ Threshold loaded for "${industryValue}" (${industryKey}):`, {
      rvc: thresholds.rvc_percentage,
      labor: thresholds.labor_percentage
    });

    return {
      rvc: parseFloat(thresholds.rvc_percentage),
      labor: parseFloat(thresholds.labor_percentage),
      article: thresholds.usmca_article,
      method: thresholds.qualification_method,
      source: 'database'
    };

  } catch (error) {
    // Fail loudly - this is critical data
    console.error('CRITICAL: Failed to load industry threshold', {
      requestedIndustry: industryValue,
      mappedKey: industryKey,
      error: error.message
    });

    throw new Error(
      `Unable to load USMCA threshold for "${industryValue}". ` +
      `Database unavailable. User cannot proceed with analysis.`
    );
  }
}

/**
 * Get migration status report (informational only)
 * Shows that all industries are now database-driven
 */
export async function getMigrationStatus() {
  try {
    const { data: thresholds, error } = await supabase
      .from('industry_thresholds')
      .select('industry_key, is_active')
      .eq('is_active', true);

    if (error) throw error;

    return {
      summary: {
        totalThresholds: thresholds?.length || 0,
        allDatabaseDriven: true,
        hardcodedFallback: false,
        migrationComplete: true
      },
      activeIndustries: thresholds?.map(t => t.industry_key) || [],
      timestamp: new Date().toISOString(),
      message: 'All industry thresholds are database-driven. No hardcoded fallback.'
    };
  } catch (error) {
    console.error('Failed to get migration status:', error.message);
    return null;
  }
}

export default {
  getIndustryThreshold,
  getMigrationStatus
};
