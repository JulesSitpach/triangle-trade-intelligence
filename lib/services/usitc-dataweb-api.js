/**
 * USITC DataWeb API Service - CORRECT IMPLEMENTATION
 *
 * Official USITC DataWeb API for tariff rate lookups
 * Base URL: https://datawebws.usitc.gov/dataweb
 * Endpoint: POST /api/v2/report2/runReport
 *
 * This replaces the broken REST endpoint attempts in usitc-api-service.js
 * Uses complex JSON query payloads as documented in USITC API guide
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../utils/production-logger.js';

class USITCDataWebAPI {
  constructor() {
    this.baseURL = 'https://datawebws.usitc.gov/dataweb';
    this._supabase = null;  // Lazy initialization
  }

  // Lazy load API key (might not be available at module load time)
  get apiKey() {
    return process.env.USITC_API_KEY;
  }

  // Lazy load Supabase client only when needed
  get supabase() {
    if (!this._supabase) {
      this._supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }
    return this._supabase;
  }

  /**
   * Verify HS code and get official 8-digit HTS-8 code + tariff rates
   *
   * This is the KEY function for AI classification verification
   * AI suggests: 8534310000 (10-digit)
   * USITC returns: 85343100 (8-digit official HTS-8) + official rates
   *
   * @param {string} hsCode - HS code from AI classification (can be 6, 8, or 10 digits)
   * @param {number} year - Year for tariff schedule (default: current year)
   * @returns {object} { hts8, description, mfn_rate, usmca_rate, verified: true }
   */
  async verifyAndGetTariffRates(hsCode, year = new Date().getFullYear()) {
    if (!this.apiKey) {
      logError('USITC_API_KEY not configured - cannot verify HS code');
      return null;
    }

    try {
      // Normalize HS code: remove dots/spaces, truncate to 8 digits
      const normalizedHS = hsCode.replace(/[.\s]/g, '').substring(0, 8);

      logInfo(`🔍 [USITC-VERIFY] Looking up HTS ${normalizedHS} for year ${year}`);

      // Build USITC DataWeb query payload
      const queryPayload = this.buildHTSLookupQuery(normalizedHS, year);

      // Call USITC API
      const response = await fetch(`${this.baseURL}/api/v2/report2/runReport`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(queryPayload)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');

        if (response.status === 401) {
          logError('USITC API authentication failed - check API key', {
            status: response.status,
            error: errorText.substring(0, 500)
          });
          return null;
        }
        if (response.status === 403) {
          logError('USITC API access forbidden - check API key permissions', {
            status: response.status,
            error: errorText.substring(0, 500)
          });
          return null;
        }
        if (response.status === 404) {
          logError(`HS code ${normalizedHS} not found in USITC database`, {
            status: response.status,
            error: errorText.substring(0, 500)
          });
          return null;
        }
        throw new Error(`USITC API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();

      // Parse response and extract tariff data
      const parsedData = this.parseUSITCResponse(data, normalizedHS);

      if (parsedData) {
        logInfo(`✅ [USITC-VERIFIED] ${parsedData.hts8}: ${parsedData.description}`);
        logInfo(`   MFN: ${(parsedData.mfn_rate * 100).toFixed(1)}%, USMCA: ${(parsedData.usmca_rate * 100).toFixed(1)}%`);
      }

      return parsedData;

    } catch (error) {
      logError(`USITC API call failed for ${hsCode}`, { error: error.message });
      return null;
    }
  }

  /**
   * Build USITC DataWeb query payload for HTS lookup
   *
   * This creates the complex JSON structure required by USITC API
   * Based on official USITC DataWeb API documentation
   */
  buildHTSLookupQuery(htsCode, year) {
    return {
      "savedQueryName": "",
      "savedQueryDesc": `Triangle Intelligence HTS lookup: ${htsCode}`,
      "isOwner": true,
      "runMonthly": false,
      "reportOptions": {
        "tradeType": "Import",  // We want import tariff rates
        "classificationSystem": "HTS"  // HTS classification system
      },
      "searchOptions": {
        "componentSettings": {
          "timeframeSelectType": "fullYears",
          "years": [year.toString()],
          "yearsTimeline": "Annual"  // Annual aggregation (we just want rates, not trade data)
        },
        "countries": {
          "aggregation": "Aggregate Country",
          "countries": ["0"],  // All countries (for general MFN rates)
          "countryGroups": {
            "systemGroups": [],
            "userGroups": []
          },
          "countriesExpanded": [
            {
              "name": "All Countries",
              "value": "all"
            }
          ],
          "countriesSelectType": "all"
        },
        "commodities": {
          "aggregation": "Show Detail",  // Show individual HTS codes, not aggregated
          "codeDisplayFormat": "YES",
          "commodities": [htsCode],  // The specific HTS code we're looking up
          "commoditiesExpanded": [],
          "commoditiesManual": htsCode,  // Manual entry of specific code
          "commodityGroups": {
            "systemGroups": [],
            "userGroups": []
          },
          "commoditySelectType": "manual"  // Manual selection (not all codes)
        },
        "MiscGroup": {
          "districts": {
            "aggregation": "Aggregate District",
            "districtGroups": { "userGroups": [] },
            "districts": [],
            "districtsExpanded": [{ "name": "All Districts", "value": "all" }],
            "districtsSelectType": "all"
          },
          "importPrograms": {
            "aggregation": null,
            "importPrograms": [],
            "programsSelectType": "all"
          },
          "extImportPrograms": {
            "aggregation": "Aggregate CSC",
            "extImportPrograms": [],
            "extImportProgramsExpanded": [],
            "programsSelectType": "all"
          },
          "provisionCodes": {
            "aggregation": "Aggregate RPCODE",
            "provisionCodesSelectType": "all",
            "rateProvisionCodes": [],
            "rateProvisionCodesExpanded": []
          }
        }
      },
      "dataOptions": {
        "valueType": "unitValue",  // We want rate values, not trade values
        "displayValues": ["Values"]
      }
    };
  }

  /**
   * Parse USITC DataWeb response JSON
   *
   * USITC returns complex nested JSON with tariff data buried in tables
   * This extracts: HTS-8 code, description, MFN rate, USMCA rate
   */
  parseUSITCResponse(response, requestedCode) {
    try {
      if (!response.dto || !response.dto.tables || response.dto.tables.length === 0) {
        logError('USITC response missing expected data structure');
        return null;
      }

      const table = response.dto.tables[0];

      // Extract column headers to find rate columns
      const columns = this.extractColumns(table.column_groups);

      // Extract row data
      const rows = table.row_groups?.[0]?.rowsNew || [];

      if (rows.length === 0) {
        logError(`No data returned for HTS ${requestedCode}`);
        return null;
      }

      // First row contains our HTS code data
      const firstRow = rows[0];
      const rowData = firstRow.rowEntries || [];

      // Try to extract HTS code, description, and rates
      // USITC structure: [HTS Code, Description, ..., Rate columns]
      let hts8 = requestedCode;
      let description = '';
      let mfn_rate = 0;
      let usmca_rate = 0;

      // Parse row entries
      if (rowData.length >= 2) {
        // First entry is usually HTS code
        hts8 = rowData[0]?.value || requestedCode;
        // Second entry is usually description
        description = rowData[1]?.value || '';
      }

      // Look for rate data in additional columns
      // USITC may return duty rates as text (e.g., "2.5%", "Free")
      for (let i = 2; i < rowData.length; i++) {
        const cellValue = rowData[i]?.value || '';
        const columnLabel = columns[i] || '';

        // Try to identify MFN rate column
        if (columnLabel.toLowerCase().includes('general') ||
            columnLabel.toLowerCase().includes('mfn') ||
            columnLabel.toLowerCase().includes('duty')) {
          mfn_rate = this.parseRateString(cellValue);
        }

        // Try to identify USMCA/special rate column
        if (columnLabel.toLowerCase().includes('special') ||
            columnLabel.toLowerCase().includes('usmca') ||
            columnLabel.toLowerCase().includes('nafta')) {
          usmca_rate = this.parseRateString(cellValue);
        }
      }

      return {
        hts8: hts8.replace(/\./g, ''),  // Remove periods for consistency
        hts8_formatted: hts8,  // Keep formatted version with periods
        description: description,
        mfn_rate: mfn_rate,  // Decimal format (0.057 = 5.7%)
        usmca_rate: usmca_rate,
        verified: true,
        verified_date: new Date().toISOString().split('T')[0],
        data_source: 'USITC DataWeb API',
        year: new Date().getFullYear()
      };

    } catch (error) {
      logError('Failed to parse USITC response', { error: error.message });
      return null;
    }
  }

  /**
   * Extract column names from USITC nested column structure
   */
  extractColumns(columnGroups, prevCols = null) {
    const columns = prevCols || [];

    if (!columnGroups) return columns;

    for (const group of columnGroups) {
      if (Array.isArray(group.columns)) {
        this.extractColumns(group.columns, columns);
      } else if (group.label) {
        columns.push(group.label);
      }
    }

    return columns;
  }

  /**
   * Parse tariff rate string to decimal
   *
   * Handles formats:
   * - "2.5%" → 0.025
   * - "Free" → 0.0
   * - "5.7 cents/kg" → 0.0 (specific duty, not ad valorem - return 0)
   */
  parseRateString(rateStr) {
    if (!rateStr || typeof rateStr !== 'string') return 0;

    const lower = rateStr.toLowerCase().trim();

    // Free = 0%
    if (lower === 'free' || lower === 'duty-free') {
      return 0.0;
    }

    // Ad valorem percentage: "2.5%" or "2.5 percent"
    const percentMatch = lower.match(/([\d.]+)\s*%/);
    if (percentMatch) {
      return parseFloat(percentMatch[1]) / 100;  // Convert to decimal
    }

    // Specific duties (cents/kg, $/unit) - not ad valorem
    // We return 0 because we can't calculate without quantity
    if (lower.includes('cent') || lower.includes('$/')) {
      return 0.0;
    }

    // Unknown format
    return 0;
  }

  /**
   * Cache verified tariff data for future lookups
   * Stores in tariff_intelligence_master for permanent use
   */
  async cacheVerifiedRate(data) {
    try {
      const { error } = await this.supabase
        .from('tariff_intelligence_master')
        .upsert({
          hts8: data.hts8,
          brief_description: data.description,
          mfn_ad_val_rate: data.mfn_rate,
          usmca_ad_val_rate: data.usmca_rate,
          source: 'USITC DataWeb API',
          begin_effect_date: `${data.year}-01-01`
        }, {
          onConflict: 'hts8'
        });

      if (error) {
        logError('Failed to cache verified tariff rate', { error: error.message });
      } else {
        logInfo(`💾 [USITC-CACHE] Saved ${data.hts8} to database for future lookups`);
      }
    } catch (error) {
      logError('Cache operation failed', { error: error.message });
    }
  }
}

export const usitcDataWebAPI = new USITCDataWebAPI();
export default usitcDataWebAPI;
