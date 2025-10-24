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
 * UI display names (from dropdown) → database lookup keys
 */
function mapIndustryToKey(industryValue) {
  const industryMap = {
    // Electronics
    'Electronics & Technology': 'Electronics',
    'Electronics': 'Electronics',
    // Textiles
    'Textiles & Apparel': 'Textiles/Apparel',
    'Textiles/Apparel': 'Textiles/Apparel',
    // Automotive
    'Automotive & Transportation': 'Automotive',
    'Automotive': 'Automotive',
    // Agriculture
    'Agriculture & Food': 'Agriculture',
    'Agriculture': 'Agriculture',
    // Chemicals
    'Chemicals & Materials': 'Chemicals',
    'Chemicals': 'Chemicals',
    // Machinery & Energy Equipment
    'Machinery & Equipment': 'Machinery',
    'Machinery': 'Machinery',
    'Energy Equipment': 'Energy Equipment',
    // Precision Instruments
    'Precision Instruments': 'Precision Instruments',
    // Transport Equipment
    'Transport Equipment': 'Transport Equipment',
    // Base Metals
    'Base Metals & Articles': 'Base Metals',
    'Base Metals': 'Base Metals',
    // Leather
    'Leather & Leather Goods': 'Leather',
    'Leather': 'Leather',
    // Wood Products
    'Wood & Wood Products': 'Wood Products',
    'Wood Products': 'Wood Products',
    // Plastics & Rubber
    'Plastics & Rubber': 'Plastics & Rubber',
    // General
    'General Manufacturing': 'General',
    'General': 'General',
    'Other': 'General'  // Default to General for unknown values
  };

  return industryMap[industryValue] || industryValue;
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
