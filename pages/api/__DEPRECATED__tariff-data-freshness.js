/**
 * TARIFF DATA FRESHNESS API
 * Returns current status of tariff data freshness
 * Used by TariffDataFreshness component to display warnings
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get metadata for all tariff data types
    const { data: metadata, error: metaError } = await supabase
      .from('tariff_data_metadata')
      .select('*');

    if (metaError) throw metaError;

    // Get last sync operation
    const { data: lastSync, error: syncError } = await supabase
      .from('tariff_sync_log')
      .select('*')
      .eq('status', 'success')
      .order('sync_timestamp', { ascending: false })
      .limit(1);

    if (syncError) throw syncError;

    // Check if data is fresh across all types
    const now = new Date();
    const isFresh = metadata.every(item => {
      const ageMinutes = (now - new Date(item.last_updated_timestamp)) / (1000 * 60);
      return ageMinutes <= item.warning_threshold_minutes;
    });

    // Calculate days old (for display)
    const daysOld = lastSync?.[0]
      ? Math.floor((now - new Date(lastSync[0].sync_timestamp)) / (1000 * 60 * 60 * 24))
      : null;

    return res.status(200).json({
      success: true,
      is_fresh: isFresh,
      metadata,
      last_sync: lastSync?.[0] || null,
      days_old: daysOld,
      warnings: generateWarnings(metadata, now),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching tariff data freshness:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tariff data freshness',
      message: error.message
    });
  }
}

/**
 * Generate specific warnings for stale data
 */
function generateWarnings(metadata, now) {
  const warnings = [];

  metadata.forEach(item => {
    const ageMinutes = (now - new Date(item.last_updated_timestamp)) / (1000 * 60);

    if (ageMinutes > item.warning_threshold_minutes) {
      warnings.push({
        type: item.key,
        message: `${item.key.replace(/_/g, ' ')} is ${Math.floor(ageMinutes)} minutes old (threshold: ${item.warning_threshold_minutes} minutes)`,
        severity: item.key === 'section_301_rates' ? 'critical' : 'warning',
        age_minutes: Math.floor(ageMinutes),
        threshold_minutes: item.warning_threshold_minutes
      });
    }
  });

  return warnings;
}
