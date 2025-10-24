/**
 * Industry Thresholds Service
 * Database-driven USMCA qualification thresholds with fallback logic
 *
 * Priority: Database → Hardcoded Fallback
 * Logging: Track which source is being used for migration monitoring
 *
 * Migration Status:
 * Once you stop seeing "hardcoded" log entries for an industry,
 * the database migration is complete and working.
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logWarning } from '../utils/production-logger.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Hardcoded thresholds (MVP baseline)
 * These are DEPRECATED - migrate to database
 */
const HARDCODED_THRESHOLDS = {
  'Automotive': { rvc: 75, labor: 22.5, article: 'Annex 4-B Art. 4.5', method: 'Net Cost', lvc_2025: 45 },
  'Electronics': { rvc: 65, labor: 17.5, article: 'Annex 4-B Art. 4.7', method: 'Transaction Value' },
  'Textiles/Apparel': { rvc: 55, labor: 27.5, article: 'Annex 4-B Art. 4.3', method: 'Yarn Forward' },
  'Chemicals': { rvc: 62.5, labor: 12.5, article: 'Article 4.2', method: 'Net Cost' },
  'Agriculture': { rvc: 60, labor: 17.5, article: 'Annex 4-B Art. 4.4', method: 'Transaction Value' },
  'Machinery': { rvc: 62.5, labor: 12.5, article: 'Article 4.2', method: 'Net Cost' },
  'Precision Instruments': { rvc: 62.5, labor: 12.5, article: 'Article 4.2', method: 'Net Cost' },
  'Transport Equipment': { rvc: 62.5, labor: 15, article: 'Article 4.2', method: 'Net Cost' },
  'Base Metals': { rvc: 62.5, labor: 12.5, article: 'Article 4.2', method: 'Net Cost' },
  'Leather': { rvc: 55, labor: 20, article: 'Annex 4-B Art. 4.3', method: 'Transaction Value' },
  'Wood Products': { rvc: 62.5, labor: 12.5, article: 'Article 4.2', method: 'Net Cost' },
  'Plastics & Rubber': { rvc: 62.5, labor: 12.5, article: 'Article 4.2', method: 'Net Cost' },
  'default': { rvc: 62.5, labor: 15, article: 'Article 4.2', method: 'Net Cost or Transaction Value' }
};

/**
 * Map dropdown/UI industry values to database keys
 * Dropdown shows user-friendly labels, database uses short keys
 */
function mapIndustryToKey(industryValue) {
  const industryMap = {
    'Electronics & Technology': 'Electronics',
    'Electronics': 'Electronics',
    'Textiles & Apparel': 'Textiles/Apparel',
    'Textiles/Apparel': 'Textiles/Apparel',
    'Automotive & Transportation': 'Automotive',
    'Automotive': 'Automotive',
    'Agriculture & Food': 'Agriculture',
    'Agriculture': 'Agriculture',
    'Chemicals & Materials': 'Chemicals',
    'Chemicals': 'Chemicals',
    'General Manufacturing': 'Default',
    'General': 'Default',
    'Other': 'Default',
    'Machinery & Equipment': 'Machinery',
    'Machinery': 'Machinery',
    'Precision Instruments': 'Precision Instruments',
    'Transport Equipment': 'Transport Equipment',
    'Base Metals & Articles': 'Base Metals',
    'Base Metals': 'Base Metals',
    'Leather & Leather Goods': 'Leather',
    'Leather': 'Leather',
    'Wood & Wood Products': 'Wood Products',
    'Wood Products': 'Wood Products',
    'Plastics & Rubber': 'Plastics & Rubber'
  };

  return industryMap[industryValue] || industryValue;
}

/**
 * Get industry threshold with logging
 * 1. Try database first
 * 2. Fall back to hardcoded
 * 3. Log which source was used
 *
 * @param {string} industryValue - What user selected
 * @param {Object} context - Optional context for logging (userId, workflowId, etc.)
 * @returns {Promise<Object>} Threshold object with rvc, labor, article, method
 */
export async function getIndustryThreshold(industryValue, context = {}) {
  const industryKey = mapIndustryToKey(industryValue);

  try {
    // Try to fetch from database
    const { data: thresholds, error } = await supabase
      .from('industry_thresholds')
      .select('rvc_percentage, labor_percentage, usmca_article, qualification_method')
      .eq('industry_key', industryKey)
      .eq('is_active', true)
      .gte('effective_date', new Date().toISOString().split('T')[0])
      .lte('deprecated_date', new Date().toISOString().split('T')[0], { referencedTable: 'null' })
      .single();

    if (!error && thresholds) {
      // SUCCESS: Database found active threshold
      await logThresholdLookup(industryValue, industryKey, 'database', thresholds.rvc_percentage, context);

      return {
        rvc: thresholds.rvc_percentage,
        labor: thresholds.labor_percentage,
        article: thresholds.usmca_article,
        method: thresholds.qualification_method,
        source: 'database'
      };
    }
  } catch (dbError) {
    logWarning('Database threshold lookup failed', {
      error: dbError.message,
      industryKey,
      fallback: 'hardcoded'
    });
  }

  // FALLBACK: Use hardcoded threshold
  const hardcodedThreshold = HARDCODED_THRESHOLDS[industryKey] || HARDCODED_THRESHOLDS['default'];

  await logThresholdLookup(
    industryValue,
    industryKey,
    'hardcoded',
    hardcodedThreshold.rvc,
    context
  );

  return {
    rvc: hardcodedThreshold.rvc,
    labor: hardcodedThreshold.labor,
    article: hardcodedThreshold.article,
    method: hardcodedThreshold.method,
    source: 'hardcoded (DEPRECATED - migrate to database)'
  };
}

/**
 * Log threshold lookup for migration tracking
 * This visibility shows which industries need database migration
 */
async function logThresholdLookup(requestedIndustry, mappedKey, sourceType, rvcApplied, context) {
  try {
    // Non-blocking log insert
    supabase
      .from('industry_threshold_lookup_log')
      .insert({
        requested_industry: requestedIndustry,
        mapped_to_key: mappedKey,
        source_type: sourceType,
        threshold_used: rvcApplied,
        user_id: context.userId,
        workflow_id: context.workflowId,
        company_name: context.companyName
      })
      .then(({ error }) => {
        if (error) {
          logWarning('Failed to log threshold lookup', { error: error.message });
        }
      });

    // Console log for immediate visibility
    if (sourceType === 'hardcoded') {
      logWarning(`⚠️ Using hardcoded threshold for "${requestedIndustry}" (${rvcApplied}% RVC)`, {
        message: 'TECHNICAL DEBT: Migrate this industry to database',
        industryKey: mappedKey
      });
    } else {
      logInfo(`✓ Database threshold loaded for "${requestedIndustry}" (${rvcApplied}% RVC)`, {
        industryKey: mappedKey
      });
    }
  } catch (logError) {
    // Fail silently - don't interrupt workflow for logging errors
    console.error('Threshold logging failed:', logError);
  }
}

/**
 * Get migration status report
 * Shows which industries are still on hardcoded vs database
 */
export async function getMigrationStatus() {
  try {
    const { data: logs, error } = await supabase
      .from('industry_threshold_lookup_log')
      .select('requested_industry, source_type')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

    if (error) throw error;

    // Aggregate by industry and source
    const statusMap = {};
    logs.forEach(log => {
      const industry = log.requested_industry;
      if (!statusMap[industry]) {
        statusMap[industry] = { database: 0, hardcoded: 0, total: 0 };
      }
      statusMap[industry][log.source_type]++;
      statusMap[industry].total++;
    });

    return {
      summary: {
        totalLookups: logs.length,
        industriesTracked: Object.keys(statusMap).length,
        percentageOnDatabase: Object.keys(statusMap).reduce((sum, ind) => {
          const status = statusMap[ind];
          return sum + (status.database / status.total);
        }, 0) / Object.keys(statusMap).length * 100 || 0
      },
      byIndustry: statusMap,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logWarning('Failed to get migration status', { error: error.message });
    return null;
  }
}

export default {
  getIndustryThreshold,
  getMigrationStatus,
  HARDCODED_THRESHOLDS
};
