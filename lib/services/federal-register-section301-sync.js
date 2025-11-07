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

      const params = new URLSearchParams({
        conditions: JSON.stringify({
          agencies: ['office-of-the-united-states-trade-representative'],
          term: 'Section 301',
          publication_date: { gte: dateFilter }
        }),
        fields: ['document_number', 'title', 'publication_date', 'html_url', 'abstract'],
        per_page: 100
      });

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
   * Extract HS codes and tariff rates from Federal Register document
   * Uses AI to parse legal text and extract structured rate data
   *
   * IMPORTANT: This requires AI because Federal Register notices are unstructured legal text
   * Example: "subheading 8542.31.00 is modified to impose an additional duty of 25 percent"
   */
  async extractRatesFromDocument(doc) {
    try {
      // Fetch full document HTML
      const response = await fetch(`${this.apiBase}/documents/${doc.document_number}.json`);

      if (!response.ok) {
        throw new Error(`Failed to fetch document ${doc.document_number}`);
      }

      const fullDoc = await response.json();
      const fullText = fullDoc.body_html || fullDoc.abstract || '';

      // Use AI to extract HS codes + rates from legal text
      // This is necessary because Federal Register doesn't provide structured tariff data
      const extracted = await this.parseSection301TextWithAI(fullText, doc.publication_date);

      return extracted;

    } catch (error) {
      logError(`Failed to extract rates from document ${doc.document_number}`, {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Use AI to parse Federal Register legal text and extract HS codes + rates
   *
   * Example input text:
   * "The additional 25 percent ad valorem duty imposed pursuant to Section 301
   *  shall apply to products of China classified under subheading 8542.31.00"
   *
   * Expected output:
   * [{ hs_code: '8542.31.00', rate: 0.25, list: 'List 4A', effective_date: '2025-02-15' }]
   */
  async parseSection301TextWithAI(text, publicationDate) {
    try {
      // Import BaseAgent for 2-tier AI fallback (OpenRouter → Anthropic)
      const { BaseAgent } = await import('../agents/base-agent.js');

      const agent = new BaseAgent({
        name: 'FederalRegisterParser',
        model: 'anthropic/claude-haiku-4.5',
        maxTokens: 2000
      });

      const prompt = `Extract Section 301 tariff rates from this Federal Register notice.

===== FEDERAL REGISTER DOCUMENT =====
Publication Date: ${publicationDate}
Source: U.S. Trade Representative (USTR)

${text.substring(0, 15000)} // Truncate to avoid token limits

===== YOUR TASK =====
Find ALL mentions of:
1. HS codes (format: 8542.31.00 or 85423100)
2. Tariff rates (e.g., "25 percent", "7.5%", "additional duty of 15%")
3. Effective dates
4. List assignments (List 1, List 2, List 3, List 4A, List 4B)

Return ONLY valid JSON array:
[
  {
    "hs_code": "8542.31.00",
    "rate": 0.25,
    "rate_percentage": 25,
    "list": "List 4A",
    "effective_date": "2025-02-15",
    "source": "Federal Register ${publicationDate}",
    "notes": "Brief excerpt from document explaining this rate"
  }
]

If no Section 301 rates found, return: []

CRITICAL: Only extract rates that are EXPLICITLY stated in the document.
Do NOT infer or guess rates.`;

      const result = await agent.execute(prompt, { temperature: 0 });

      if (!result.success) {
        logError('AI extraction failed for Federal Register document', {
          error: result.error
        });
        return null;
      }

      return result.data;

    } catch (error) {
      logError('AI parsing failed', { error: error.message });
      return null;
    }
  }

  /**
   * Update policy_tariffs_cache with extracted rates from Federal Register
   */
  async updateCacheWithRates(rates, sourceDoc) {
    try {
      for (const rate of rates) {
        await this.supabase
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
      }

      logInfo(`✅ Updated ${rates.length} Section 301 rates from Federal Register`, {
        document_number: sourceDoc.document_number,
        publication_date: sourceDoc.publication_date
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
