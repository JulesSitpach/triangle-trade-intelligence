/**
 * FEDERAL REGISTER SECTION 301 SYNC SERVICE
 * Fetches CURRENT Section 301 tariff rates from official Federal Register API
 * Replaces manual hardcoded rate updates with automated policy monitoring
 *
 * Data Source: Federal Register API (https://www.federalregister.gov/api/v1)
 * Update Frequency: Daily cron job
 * Cache TTL: 30 days (Section 301 rates change with 30-day notice minimum)
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../utils/production-logger.js';

class FederalRegisterSection301Sync {
  constructor() {
    this.apiBase = 'https://www.federalregister.gov/api/v1';
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Main sync function - called by daily cron job
   * Fetches latest Section 301 Federal Register notices and updates cache
   */
  async syncSection301FromFederalRegister() {
    const syncStartTime = Date.now();
    let updatedCount = 0;
    let errorCount = 0;

    try {
      logInfo('🔄 Starting Federal Register Section 301 sync', {
        timestamp: new Date().toISOString(),
        source: 'Federal Register API'
      });

      // Search for Section 301 documents from USTR in last 90 days
      const documents = await this.fetchRecentSection301Documents();

      if (!documents || documents.length === 0) {
        logInfo('No new Section 301 documents found in Federal Register');
        return { success: true, updated: 0, errors: 0, duration_ms: Date.now() - syncStartTime };
      }

      logInfo(`📊 Found ${documents.length} Section 301 documents to process`);

      // Process each document and extract HS codes + rates
      for (const doc of documents) {
        try {
          const extractedRates = await this.extractRatesFromDocument(doc);

          if (extractedRates && extractedRates.length > 0) {
            await this.updateCacheWithRates(extractedRates, doc);
            updatedCount += extractedRates.length;
          }
        } catch (error) {
          errorCount++;
          logError(`Failed to process Federal Register document ${doc.document_number}`, {
            error: error.message
          });
        }
      }

      // Log sync completion
      const syncDuration = Date.now() - syncStartTime;
      await this.logSyncCompletion('federal_register_section_301', updatedCount, errorCount, syncDuration);

      return {
        success: true,
        updated: updatedCount,
        errors: errorCount,
        duration_ms: syncDuration,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logError('Federal Register Section 301 sync failed', { error: error.message });
      await this.logSyncCompletion('federal_register_section_301', updatedCount, errorCount, Date.now() - syncStartTime, error);
      throw error;
    }
  }

  /**
   * Fetch recent Section 301 documents from Federal Register API
   * Searches for USTR notices about Section 301 tariff modifications
   */
  async fetchRecentSection301Documents() {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const dateFilter = ninetyDaysAgo.toISOString().split('T')[0];

      // Federal Register API uses bracket notation for conditions
      const params = new URLSearchParams();
      params.append('conditions[agencies][]', 'trade-representative-office-of-united-states');
      params.append('conditions[term]', 'Section 301');
      params.append('conditions[type][]', 'NOTICE');
      params.append('conditions[publication_date][gte]', dateFilter);
      params.append('fields[]', 'document_number');
      params.append('fields[]', 'title');
      params.append('fields[]', 'publication_date');
      params.append('fields[]', 'html_url');
      params.append('fields[]', 'abstract');
      params.append('fields[]', 'raw_text_url');
      params.append('per_page', '100');
      params.append('order', 'newest');

      const response = await fetch(`${this.apiBase}/documents.json?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Federal Register API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];

    } catch (error) {
      logError('Failed to fetch Federal Register documents', { error: error.message });
      return null;
    }
  }

  /**
   * Extract HS codes and tariff rates from Federal Register XML
   * NO AI - parses structured XML tables directly
   *
   * XML structure:
   * <ROW>
   *   <ENT I="01">8542.31.00</ENT>     <!-- HS code -->
   *   <ENT>Electronic integrated circuits</ENT>  <!-- Description -->
   *   <ENT>50</ENT>                     <!-- Rate percentage -->
   *   <ENT>2025</ENT>                   <!-- Effective year -->
   * </ROW>
   */
  async extractRatesFromDocument(doc) {
    try {
      // Fetch full document metadata to get XML URL
      const metaResponse = await fetch(`${this.apiBase}/documents/${doc.document_number}.json`);

      if (!metaResponse.ok) {
        throw new Error(`Failed to fetch document ${doc.document_number}`);
      }

      const fullDoc = await metaResponse.json();

      if (!fullDoc.full_text_xml_url) {
        logError(`No XML URL for document ${doc.document_number}`);
        return null;
      }

      // Fetch XML
      const xmlResponse = await fetch(fullDoc.full_text_xml_url);
      if (!xmlResponse.ok) {
        throw new Error(`Failed to fetch XML for ${doc.document_number}`);
      }

      const xmlText = await xmlResponse.text();

      // Parse XML to extract HS codes and rates
      const extracted = await this.parseSection301XML(xmlText, doc.publication_date);

      return extracted;

    } catch (error) {
      logError(`Failed to extract rates from document ${doc.document_number}`, {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Parse Federal Register XML to extract HS codes and tariff rates
   * NO AI - parses structured <ROW><ENT> tables directly
   *
   * Example XML structure:
   * <ROW>
   *   <ENT I="01">8542.31.00</ENT>
   *   <ENT>Electronic integrated circuits: processors and controllers</ENT>
   *   <ENT>50</ENT>
   *   <ENT>2025</ENT>
   * </ROW>
   *
   * Returns: [{ hs_code: '8542.31.00', rate: 0.50, effective_date: '2025-01-01', description: '...' }]
   */
  async parseSection301XML(xmlText, publicationDate) {
    try {
      const rates = [];

      // Find all <ROW> elements that contain HS codes
      // Pattern: <ROW> with 4 <ENT> elements (HS code, description, rate %, year)
      const rowPattern = /<ROW>([\s\S]*?)<\/ROW>/g;
      const entPattern = /<ENT[^>]*>(.*?)<\/ENT>/g;

      let rowMatch;
      while ((rowMatch = rowPattern.exec(xmlText)) !== null) {
        const rowContent = rowMatch[1];
        const entries = [];

        let entMatch;
        while ((entMatch = entPattern.exec(rowContent)) !== null) {
          entries.push(entMatch[1].trim());
        }

        // Valid Section 301 table rows have 4 entries: HS code, description, rate %, year
        if (entries.length === 4) {
          const [hsCode, description, ratePercent, year] = entries;

          // Validate HS code format (8-10 digits, may have periods)
          const hsCodeClean = hsCode.replace(/\./g, '');
          if (/^\d{4,10}$/.test(hsCodeClean)) {
            const rate = parseInt(ratePercent) / 100; // Convert 50 to 0.50
            const effectiveDate = `${year}-01-01`;

            rates.push({
              hs_code: hsCode,
              rate: rate,
              rate_percentage: parseInt(ratePercent),
              effective_date: effectiveDate,
              description: description,
              source: `Federal Register ${publicationDate}`,
              list: this.guessListFromYear(year) // Optional: infer List 1/2/3/4A/4B from year
            });
          }
        }
      }

      logInfo(`📊 Parsed ${rates.length} HS codes from XML`, {
        document: publicationDate,
        sample: rates.slice(0, 3)
      });

      return rates.length > 0 ? rates : null;

    } catch (error) {
      logError('XML parsing failed', { error: error.message });
      return null;
    }
  }

  /**
   * Guess Section 301 list assignment based on effective year
   * This is a heuristic - actual list assignments are more complex
   */
  guessListFromYear(year) {
    const effectiveYear = parseInt(year);
    if (effectiveYear <= 2018) return 'List 1 or 2';
    if (effectiveYear === 2019) return 'List 3';
    if (effectiveYear >= 2024) return 'List 4A/4B';
    return 'Unknown';
  }

  /**
   * Update policy_tariffs_cache with extracted rates from Federal Register
   */
  async updateCacheWithRates(rates, sourceDoc) {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const rate of rates) {
        const { error } = await this.supabase
          .from('policy_tariffs_cache')
          .upsert({
            hs_code: rate.hs_code,
            section_301: rate.rate,
            verified_date: sourceDoc.publication_date,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            data_source: `Federal Register ${sourceDoc.document_number} (${sourceDoc.publication_date})`,
            is_stale: false,
            last_updated_by: 'federal-register-section301-sync.js automated',
            update_notes: `Auto-synced from Federal Register: ${sourceDoc.title}`,
            source_url: sourceDoc.html_url
          }, {
            onConflict: 'hs_code'
          });

        if (error) {
          errorCount++;
          if (errorCount <= 3) { // Only log first 3 errors
            logError(`Failed to upsert ${rate.hs_code}`, { error: error.message });
          }
        } else {
          successCount++;
        }
      }

      logInfo(`✅ Updated ${successCount} Section 301 rates from Federal Register`, {
        document_number: sourceDoc.document_number,
        publication_date: sourceDoc.publication_date,
        errors: errorCount
      });

    } catch (error) {
      logError('Failed to update cache with Federal Register rates', {
        error: error.message
      });
      throw error;
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
          source: 'Federal Register API',
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
}

export const federalRegisterSection301Sync = new FederalRegisterSection301Sync();
export default federalRegisterSection301Sync;
