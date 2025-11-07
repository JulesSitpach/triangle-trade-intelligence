/**
 * MFN BASE RATES SYNC SERVICE
 * Fetches CURRENT MFN (Most Favored Nation) tariff rates from USITC HTS Database
 *
 * MFN rates are the "normal" tariff rates that apply to WTO member countries
 * These change annually on January 1st when new HTS schedules are published
 *
 * Data Source: USITC DataWeb API (official U.S. tariff database)
 * Update Frequency: Weekly (rates only change Jan 1 each year, but sync ensures freshness)
 * Cache TTL: 365 days (MFN rates are stable for full calendar year)
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../utils/production-logger.js';

class MFNBaseRatesSync {
  constructor() {
    this.usitcApiKey = process.env.USITC_API_KEY;
    this.usitcBase = 'https://dataweb.usitc.gov/api';
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Main sync function - updates MFN rates for all HS codes in cache
   */
  async syncMFNRates() {
    const syncStartTime = Date.now();
    let updatedCount = 0;
    let errorCount = 0;

    try {
      logInfo('🔄 Starting MFN base rates sync', {
        timestamp: new Date().toISOString(),
        source: 'USITC DataWeb API'
      });

      // Get all unique HS codes from tariff_intelligence_master
      const { data: hsCodes, error: fetchError } = await this.supabase
        .from('tariff_intelligence_master')
        .select('hts8')
        .not('hts8', 'is', null);

      if (fetchError) throw fetchError;

      const uniqueCodes = [...new Set(hsCodes.map(c => c.hts8))];
      logInfo(`📊 Found ${uniqueCodes.length} HS codes to sync`);

      // Sync in batches of 50 (rate limiting)
      for (let i = 0; i < uniqueCodes.length; i += 50) {
        const batch = uniqueCodes.slice(i, i + 50);

        for (const hsCode of batch) {
          try {
            const mfnRate = await this.fetchMFNRateFromUSITC(hsCode);

            if (mfnRate !== null) {
              await this.updateCacheWithMFNRate(hsCode, mfnRate);
              updatedCount++;
            }
          } catch (error) {
            errorCount++;
            logError(`Failed to sync MFN rate for ${hsCode}`, { error: error.message });
          }
        }

        // Rate limiting: wait 1 second between batches
        if (i + 50 < uniqueCodes.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Log sync completion
      const syncDuration = Date.now() - syncStartTime;
      await this.logSyncCompletion('mfn_base_rates', updatedCount, errorCount, syncDuration);

      return {
        success: true,
        updated: updatedCount,
        errors: errorCount,
        duration_ms: syncDuration,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logError('MFN sync failed', { error: error.message });
      await this.logSyncCompletion('mfn_base_rates', updatedCount, errorCount, Date.now() - syncStartTime, error);
      throw error;
    }
  }

  /**
   * Fetch MFN rate from USITC DataWeb API
   */
  async fetchMFNRateFromUSITC(hsCode) {
    if (!this.usitcApiKey) {
      logError('USITC_API_KEY not configured');
      return null;
    }

    try {
      const response = await fetch(
        `${this.usitcBase}/tariffs/hts/${hsCode}?year=${new Date().getFullYear()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.usitcApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) return null; // HS code not found
        throw new Error(`USITC API error: ${response.status}`);
      }

      const data = await response.json();

      // Parse MFN rate from general_rate_of_duty field
      return this.parseMFNRate(data);

    } catch (error) {
      logError(`USITC API call failed for ${hsCode}`, { error: error.message });
      return null;
    }
  }

  /**
   * Parse MFN rate from USITC response
   * Handles formats like "6.5%", "Free", "10.5 cents/kg", etc.
   */
  parseMFNRate(data) {
    if (!data || !data.general_rate_of_duty) return null;

    const rateStr = data.general_rate_of_duty.toLowerCase();

    // Handle "Free" or "duty-free"
    if (rateStr.includes('free')) {
      return 0.0;
    }

    // Handle ad valorem percentage (e.g., "6.5%")
    const percentMatch = rateStr.match(/([\d.]+)\s*%/);
    if (percentMatch) {
      return parseFloat(percentMatch[1]) / 100; // Store as decimal (0.065 for 6.5%)
    }

    // Handle specific rates (cents/kg, etc.) - store as 0 for now
    // TODO: Implement specific duty calculation
    if (rateStr.includes('cents') || rateStr.includes('$/')) {
      return 0.0; // Specific duties require unit conversion, not ad valorem
    }

    // Unable to parse
    logError(`Unable to parse MFN rate: ${data.general_rate_of_duty}`);
    return null;
  }

  /**
   * Update cache with MFN rate from USITC
   */
  async updateCacheWithMFNRate(hsCode, mfnRate) {
    try {
      await this.supabase
        .from('policy_tariffs_cache')
        .upsert({
          hs_code: hsCode,
          mfn_rate: mfnRate,
          verified_date: new Date().toISOString().split('T')[0],
          expires_at: new Date(new Date().getFullYear() + 1, 0, 2).toISOString(), // Expires Jan 2 next year
          data_source: 'USITC DataWeb HTS Database',
          is_stale: false,
          last_updated_by: 'mfn-base-rates-sync.js',
          update_notes: `MFN rate for ${new Date().getFullYear()} HTS schedule`
        }, {
          onConflict: 'hs_code'
        });

    } catch (error) {
      logError(`Failed to update MFN cache for ${hsCode}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Log sync operation
   */
  async logSyncCompletion(syncType, codesUpdated, errors, duration, error = null) {
    try {
      await this.supabase
        .from('tariff_sync_log')
        .insert({
          sync_type: syncType,
          hs_codes_updated: codesUpdated,
          source: 'USITC DataWeb API',
          status: error ? 'failed' : (errors > 0 ? 'partial' : 'success'),
          error_message: error?.message,
          policy_changes: {
            sync_duration_ms: duration,
            codes_updated: codesUpdated,
            errors_encountered: errors
          }
        });
    } catch (logError) {
      console.error('Failed to log MFN sync', logError);
    }
  }
}

export const mfnBaseRatesSync = new MFNBaseRatesSync();
export default mfnBaseRatesSync;
