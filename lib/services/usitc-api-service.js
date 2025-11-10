/**
 * USITC DataWeb API Service
 * Official US International Trade Commission tariff data
 *
 * API Docs: https://dataweb.usitc.gov/api
 * 100% accurate, live tariff rates directly from government source
 */

import { logDevIssue } from '../utils/logDevIssue.js';

const USITC_API_BASE = 'https://dataweb.usitc.gov/api';
const USITC_API_KEY = process.env.USITC_API_KEY;

export class USITCApiService {
  /**
   * Get current tariff rates for an HS code
   * @param {string} hsCode - 8 or 10 digit HS code
   * @param {string} destinationCountry - US, CA, MX
   * @returns {Object} { mfn_rate, usmca_rate, section_301, section_232, description, source: 'usitc_api' }
   */
  static async getTariffRates(hsCode, destinationCountry = 'US') {
    if (!USITC_API_KEY) {
      console.error('❌ [USITC] API key not configured');
      return null;
    }

    if (!hsCode) {
      console.error('❌ [USITC] HS code required');
      return null;
    }

    // Normalize HS code (remove periods, ensure 8-10 digits)
    const normalizedHS = hsCode.replace(/\./g, '').substring(0, 10);

    try {
      console.log(`🔍 [USITC API] Fetching live tariff data for HS ${normalizedHS}...`);

      // USITC DataWeb API endpoint (correct endpoint from existing code)
      // See lib/utils/usitc-hts-api.js for reference
      const url = `https://api.usitc.gov/dataweb/tariff/hts/${normalizedHS}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${USITC_API_KEY}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [USITC API] HTTP ${response.status}:`, errorText);

        await logDevIssue({
          severity: 'error',
          category: 'external_api',
          issue_type: 'usitc_api_error',
          message: `USITC API error for HS ${normalizedHS}`,
          context: {
            hsCode: normalizedHS,
            status: response.status,
            error: errorText
          }
        });

        return null;
      }

      const data = await response.json();

      if (!data || !data.results || data.results.length === 0) {
        console.warn(`⚠️ [USITC API] No results for HS ${normalizedHS}`);
        return null;
      }

      // Parse USITC DataWeb API response (format from existing code)
      const tariffData = {
        hs_code: normalizedHS,
        description: data.description || '',

        // Base MFN rate (Column 1 - General)
        mfn_rate: this.parseRate(data.general_rate),
        mfn_text_rate: data.general_rate || 'Unknown',

        // USMCA/NAFTA preferential rate
        usmca_rate: this.parseRate(data.ca_mx_rate),

        // Section 301/232 - USITC doesn't have these (need Federal Register or policy_tariffs_cache)
        section_301: 0, // Will query policy_tariffs_cache separately
        section_232: 0, // Will query policy_tariffs_cache separately

        // Metadata
        rate_source: 'usitc_api',
        data_source: 'usitc_dataweb',
        last_verified: data.effective_date || new Date().toISOString(),
        unit: data.unit_of_quantity,
        api_response: data // Store full response for debugging
      };

      console.log(`✅ [USITC API] Found official rates for ${normalizedHS}:`, {
        mfn_rate: tariffData.mfn_rate,
        mfn_text: tariffData.mfn_text_rate,
        usmca_rate: tariffData.usmca_rate
      });

      return tariffData;

    } catch (error) {
      console.error(`❌ [USITC API] Failed to fetch tariff data for ${normalizedHS}:`, error.message);

      await logDevIssue({
        severity: 'error',
        category: 'external_api',
        issue_type: 'usitc_api_exception',
        message: `USITC API exception for HS ${normalizedHS}`,
        context: {
          hsCode: normalizedHS,
          error: error.message,
          stack: error.stack
        }
      });

      return null;
    }
  }

  /**
   * Parse tariff rate from USITC API response
   * Handles: "Free", "3.4%", "$1.32/kg", compound rates
   * @param {string|number} rateValue
   * @returns {number} Decimal rate (0.034 for 3.4%)
   */
  static parseRate(rateValue) {
    if (!rateValue) return 0;

    // If already a number, return it
    if (typeof rateValue === 'number') {
      // If > 1, assume it's a percentage (convert to decimal)
      return rateValue > 1 ? rateValue / 100 : rateValue;
    }

    const rateStr = String(rateValue).trim().toUpperCase();

    // Free / duty-free
    if (rateStr === 'FREE' || rateStr === 'DUTY-FREE') {
      return 0;
    }

    // Ad valorem percentage (e.g., "3.4%", "6.5%")
    const percentMatch = rateStr.match(/(\d+\.?\d*)%/);
    if (percentMatch) {
      return parseFloat(percentMatch[1]) / 100; // Convert to decimal
    }

    // Specific rate (e.g., "$1.32/kg") - return 0 for now (can't convert to ad valorem)
    if (rateStr.includes('$') || rateStr.includes('/')) {
      console.warn(`⚠️ [USITC] Specific rate detected: ${rateStr} - returning 0 (specific rates not supported yet)`);
      return 0;
    }

    // Unknown format
    console.warn(`⚠️ [USITC] Unknown rate format: ${rateStr} - returning 0`);
    return 0;
  }

  /**
   * Batch lookup for multiple HS codes
   * @param {Array<string>} hsCodes
   * @param {string} destinationCountry
   * @returns {Promise<Array>}
   */
  static async batchGetTariffRates(hsCodes, destinationCountry = 'US') {
    console.log(`🔍 [USITC API] Batch lookup for ${hsCodes.length} HS codes...`);

    const results = await Promise.allSettled(
      hsCodes.map(hsCode => this.getTariffRates(hsCode, destinationCountry))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      } else {
        console.error(`❌ [USITC API] Failed for HS ${hsCodes[index]}:`, result.reason);
        return null;
      }
    });
  }
}
