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
   * ⚠️ DEPRECATED - Replaced by Federal Register automated sync
   *
   * OLD APPROACH: Manually hardcoded 5 HS codes with Section 301 rates
   * NEW APPROACH: Daily cron job fetches from Federal Register API
   *
   * See: lib/services/federal-register-section301-sync.js
   * Cron: pages/api/cron/sync-section301-from-federal-register.js
   *
   * This function is kept for emergency fallback only.
   * Do NOT use for production - cache is populated by automated Federal Register sync.
   */
  async syncSection301Rates() {
    logInfo('⚠️ syncSection301Rates called - this is deprecated, use Federal Register sync instead');

    // Emergency fallback rates ONLY (if Federal Register sync fails for >7 days)
    // These should NEVER be the primary data source
    const emergencyFallbackRates = {
      '8542.31.00': 25, // Last verified Nov 6, 2025 - CHECK FEDERAL REGISTER FOR CURRENT
    };

    const lastResortDate = '2025-11-06';

    try {
      // Check if Federal Register sync has run recently
      const { data: recentSync } = await this.supabase
        .from('tariff_sync_log')
        .select('*')
        .eq('sync_type', 'federal_register_section_301')
        .order('sync_timestamp', { ascending: false })
        .limit(1)
        .single();

      const daysSinceSync = recentSync
        ? Math.floor((Date.now() - new Date(recentSync.sync_timestamp).getTime()) / (24 * 60 * 60 * 1000))
        : 999;

      if (daysSinceSync < 7) {
        logInfo('✅ Federal Register sync is current - skipping emergency fallback');
        return;
      }

      // EMERGENCY ONLY: Federal Register hasn't run in 7+ days
      logError(`⚠️ EMERGENCY FALLBACK: Federal Register sync hasn't run in ${daysSinceSync} days`, {
        action: 'Using stale hardcoded rates as last resort',
        warning: 'These rates may be INCORRECT - fix Federal Register sync immediately'
      });

      for (const [hsCode, rate] of Object.entries(emergencyFallbackRates)) {
        await this.supabase
          .from('policy_tariffs_cache')
          .upsert({
            hs_code: hsCode,
            section_301: rate / 100,
            verified_date: lastResortDate,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ONLY
            data_source: `EMERGENCY FALLBACK - hardcoded as of ${lastResortDate}`,
            is_stale: true, // Mark as stale immediately
            last_updated_by: 'usitc-tariff-sync.js EMERGENCY fallback',
            update_notes: `⚠️ STALE DATA - Federal Register sync failed, using ${daysSinceSync}-day-old fallback`
          }, {
            onConflict: 'hs_code'
          });
      }

    } catch (error) {
      logError('Emergency fallback failed', { error: error.message });
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
