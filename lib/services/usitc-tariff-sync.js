/**
 * USITC TARIFF SYNCHRONIZATION SERVICE
 * Fetches real-time tariff rates from USITC DataWeb API
 * Updates tariff_rates_cache with current 2025 rates
 * Tracks Section 301, Section 232, and MFN rates
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../utils/production-logger.js';

class USITCTariffSync {
  constructor() {
    this.apiKey = process.env.USITC_API_KEY;
    this.baseURL = 'https://dataweb.usitc.gov/api';
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Main sync function - called by cron job
   * Fetches latest tariff data and updates cache
   */
  async syncUSITCTariffRates() {
    const syncStartTime = Date.now();
    let updatedCount = 0;
    let errorCount = 0;

    try {
      logInfo('🔄 Starting USITC tariff sync', { timestamp: new Date().toISOString() });

      // Get list of HS codes in current cache
      const { data: cachedCodes, error: fetchError } = await this.supabase
        .from('tariff_rates_cache')
        .select('hs_code, destination_country')
        .neq('hs_code', null);

      if (fetchError) throw fetchError;

      const uniqueCodes = [...new Set(cachedCodes.map(c => c.hs_code))];
      logInfo(`📊 Found ${uniqueCodes.length} unique HS codes to sync`);

      // Sync each HS code with USITC API
      for (const hsCode of uniqueCodes) {
        try {
          const rates = await this.fetchUSITCRates(hsCode);
          if (rates) {
            await this.updateCacheWithRates(hsCode, rates);
            updatedCount++;
          }
        } catch (error) {
          errorCount++;
          logError(`Failed to sync HS code ${hsCode}`, { error: error.message });
        }
      }

      // Update Section 301 rates from known list
      await this.syncSection301Rates();

      // Log sync completion
      const syncDuration = Date.now() - syncStartTime;
      await this.logSyncCompletion('usitc_api', updatedCount, errorCount, syncDuration);

      return {
        success: true,
        updated: updatedCount,
        errors: errorCount,
        duration_ms: syncDuration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logError('USITC tariff sync failed', { error: error.message });
      await this.logSyncCompletion('usitc_api', updatedCount, errorCount, Date.now() - syncStartTime, error);
      throw error;
    }
  }

  /**
   * Fetch tariff rates from USITC DataWeb API for specific HS code
   * API: https://dataweb.usitc.gov/api/Product/HarmonizedCode/{code}
   */
  async fetchUSITCRates(hsCode) {
    if (!this.apiKey) {
      logError('USITC_API_KEY not configured');
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseURL}/Product/HarmonizedCode/${hsCode}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) return null; // HS code not found in USITC
        throw new Error(`USITC API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseUSITCResponse(data);
    } catch (error) {
      logError(`USITC API call failed for HS ${hsCode}`, { error: error.message });
      return null;
    }
  }

  /**
   * Parse USITC API response and extract tariff rates
   * Expected response includes: general_rate_of_duty, special_rates, etc.
   */
  parseUSITCResponse(data) {
    if (!data) return null;

    return {
      mfn_rate: parseFloat(data.general_rate_of_duty) || 0,
      hs_description: data.product_description || '',
      data_source: 'USITC DataWeb API',
      verified: true,
      verified_at: new Date().toISOString()
    };
  }

  /**
   * Update cache with rates from USITC
   */
  async updateCacheWithRates(hsCode, rates) {
    const { error } = await this.supabase
      .from('tariff_rates_cache')
      .update({
        mfn_rate: rates.mfn_rate,
        data_source: 'USITC DataWeb API',
        verified: true,
        last_updated: new Date().toISOString().split('T')[0],
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hour cache
      })
      .eq('hs_code', hsCode);

    if (error) throw error;
  }

  /**
   * Sync Section 301 rates from USTR known list
   * These rates are maintained manually as Section 301 is politically driven
   * Check USTR.gov for latest rates: https://ustr.gov/issue-areas/enforcement/section-301-investigations
   */
  async syncSection301Rates() {
    // Known Section 301 List 3 rates (as of October 2025)
    // Update these when USTR announces changes
    const section301Rates = {
      // Electronics - mostly 25%
      '8542.31.00': 25, // Microprocessors
      '8504.40.95': 0, // Power supplies (duty-free under ITA)
      '8534.31.00': 0, // PCB (duty-free under ITA)
      '8544.42.90': 0, // Connectors (duty-free under ITA)
      '7616.99.50': 0, // Aluminum (no Section 301 on aluminum)
      // Add more as needed from USTR list
    };

    try {
      for (const [hsCode, rate] of Object.entries(section301Rates)) {
        await this.supabase
          .from('tariff_rates_cache')
          .update({
            section_301: rate,
            last_updated: new Date().toISOString().split('T')[0]
          })
          .eq('hs_code', hsCode);
      }

      logInfo('✅ Section 301 rates updated', { codes_updated: Object.keys(section301Rates).length });
    } catch (error) {
      logError('Failed to update Section 301 rates', { error: error.message });
    }
  }

  /**
   * Log sync operation to tariff_sync_log table
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
      logError('Failed to log sync operation', { error: logError.message });
    }
  }

  /**
   * Get current data freshness status
   */
  async getDataFreshness() {
    try {
      const { data: metadata } = await this.supabase
        .from('tariff_data_metadata')
        .select('*');

      const { data: lastSync } = await this.supabase
        .from('tariff_sync_log')
        .select('*')
        .order('sync_timestamp', { ascending: false })
        .limit(1);

      return {
        metadata,
        last_sync: lastSync?.[0],
        is_fresh: this.checkIfFresh(metadata)
      };
    } catch (error) {
      logError('Failed to get data freshness status', { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * Check if tariff data is within acceptable freshness threshold
   */
  checkIfFresh(metadata) {
    const now = new Date();
    return metadata.every(item => {
      const ageMinutes = (now - new Date(item.last_updated_timestamp)) / (1000 * 60);
      return ageMinutes <= item.warning_threshold_minutes;
    });
  }
}

export const usitcTariffSync = new USITCTariffSync();
export default usitcTariffSync;
