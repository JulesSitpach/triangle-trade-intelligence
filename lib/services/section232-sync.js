/**
 * SECTION 232 SYNC SERVICE
 * Fetches CURRENT Section 232 tariff rates (steel/aluminum) from Commerce Department
 *
 * Section 232 applies to:
 * - Steel products (25% additional duty on imports from certain countries)
 * - Aluminum products (10% additional duty on imports from certain countries)
 * - Country-specific exemptions exist (Canada, Mexico under USMCA)
 *
 * Data Source: Federal Register + Commerce Department notices
 * Update Frequency: Daily cron job (rates change with Presidential Proclamations)
 * Cache TTL: 30 days
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../utils/production-logger.js';

class Section232Sync {
  constructor() {
    this.apiBase = 'https://www.federalregister.gov/api/v1';
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Main sync function - called by daily cron job
   */
  async syncSection232Rates() {
    const syncStartTime = Date.now();
    let updatedCount = 0;
    let errorCount = 0;

    try {
      logInfo('🔄 Starting Section 232 sync', {
        timestamp: new Date().toISOString(),
        source: 'Federal Register API'
      });

      // Search for Section 232 Presidential Proclamations in last 90 days
      const documents = await this.fetchSection232Documents();

      if (!documents || documents.length === 0) {
        logInfo('No new Section 232 documents found');

        // Still update known rates with current timestamp (even if no new notices)
        await this.updateKnownSection232Rates();

        return { success: true, updated: 0, errors: 0, duration_ms: Date.now() - syncStartTime };
      }

      logInfo(`📊 Found ${documents.length} Section 232 documents to process`);

      // Process each document and extract country exemptions + rate changes
      for (const doc of documents) {
        try {
          const extractedRates = await this.extractSection232Rates(doc);

          if (extractedRates && extractedRates.length > 0) {
            await this.updateCacheWithRates(extractedRates, doc);
            updatedCount += extractedRates.length;
          }
        } catch (error) {
          errorCount++;
          logError(`Failed to process Section 232 document ${doc.document_number}`, {
            error: error.message
          });
        }
      }

      // Log sync completion
      const syncDuration = Date.now() - syncStartTime;
      await this.logSyncCompletion('section_232', updatedCount, errorCount, syncDuration);

      return {
        success: true,
        updated: updatedCount,
        errors: errorCount,
        duration_ms: syncDuration,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logError('Section 232 sync failed', { error: error.message });
      await this.logSyncCompletion('section_232', updatedCount, errorCount, Date.now() - syncStartTime, error);
      throw error;
    }
  }

  /**
   * Fetch Section 232 Presidential Proclamations from Federal Register
   */
  async fetchSection232Documents() {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const dateFilter = ninetyDaysAgo.toISOString().split('T')[0];

      const params = new URLSearchParams({
        conditions: JSON.stringify({
          agencies: ['executive-office-of-the-president'],
          term: 'Section 232',
          type: 'PRESDOCU', // Presidential Documents only
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
      logError('Failed to fetch Section 232 documents', { error: error.message });
      return null;
    }
  }

  /**
   * Extract Section 232 rates from Presidential Proclamation using AI
   *
   * Example text: "The 25 percent ad valorem rate of duty on steel articles
   * shall not apply to articles imported from Canada and Mexico"
   */
  async extractSection232Rates(doc) {
    try {
      const response = await fetch(`${this.apiBase}/documents/${doc.document_number}.json`);

      if (!response.ok) {
        throw new Error(`Failed to fetch document ${doc.document_number}`);
      }

      const fullDoc = await response.json();
      const fullText = fullDoc.body_html || fullDoc.abstract || '';

      // Use AI to extract country exemptions and rate changes
      const extracted = await this.parseSection232TextWithAI(fullText, doc.publication_date);

      return extracted;

    } catch (error) {
      logError(`Failed to extract Section 232 rates from ${doc.document_number}`, {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Parse Section 232 Presidential Proclamation with AI
   */
  async parseSection232TextWithAI(text, publicationDate) {
    try {
      const { BaseAgent } = await import('../agents/base-agent.js');

      const agent = new BaseAgent({
        name: 'Section232Parser',
        model: 'anthropic/claude-haiku-4.5',
        maxTokens: 2000
      });

      const prompt = `Extract Section 232 tariff rates from this Presidential Proclamation.

===== PRESIDENTIAL PROCLAMATION =====
Publication Date: ${publicationDate}
Source: Executive Office of the President

${text.substring(0, 15000)}

===== YOUR TASK =====
Find ALL mentions of:
1. Countries granted exemptions (e.g., "Canada and Mexico exempt")
2. Steel tariff rates (default: 25%)
3. Aluminum tariff rates (default: 10%)
4. Effective dates
5. HS code ranges for steel/aluminum products

Return ONLY valid JSON array:
[
  {
    "country": "Canada",
    "steel_rate": 0.0,
    "aluminum_rate": 0.0,
    "effective_date": "2025-02-15",
    "source": "Presidential Proclamation ${publicationDate}",
    "notes": "Exempt under USMCA"
  },
  {
    "country": "China",
    "steel_rate": 0.25,
    "aluminum_rate": 0.10,
    "effective_date": "2025-02-15",
    "source": "Presidential Proclamation ${publicationDate}",
    "notes": "No exemption - standard Section 232 rates apply"
  }
]

If no Section 232 changes found, return: []

CRITICAL: Only extract rates EXPLICITLY stated. Do NOT infer.`;

      const result = await agent.execute(prompt, { temperature: 0 });

      if (!result.success) {
        logError('AI extraction failed for Section 232 document', {
          error: result.error
        });
        return null;
      }

      return result.data;

    } catch (error) {
      logError('Section 232 AI parsing failed', { error: error.message });
      return null;
    }
  }

  /**
   * Update known Section 232 rates even if no new proclamations
   * This ensures cache doesn't go stale
   */
  async updateKnownSection232Rates() {
    const knownRates = [
      // USMCA exemptions (Canada/Mexico)
      { country: 'CA', steel: 0.0, aluminum: 0.0, notes: 'Exempt under USMCA' },
      { country: 'MX', steel: 0.0, aluminum: 0.0, notes: 'Exempt under USMCA' },

      // Countries subject to Section 232 (non-exhaustive, expand as needed)
      { country: 'CN', steel: 0.25, aluminum: 0.10, notes: 'Standard Section 232 rates' },
      { country: 'IN', steel: 0.25, aluminum: 0.10, notes: 'Standard Section 232 rates' },
      { country: 'KR', steel: 0.25, aluminum: 0.10, notes: 'Standard Section 232 rates' },
    ];

    try {
      for (const rate of knownRates) {
        await this.supabase
          .from('policy_tariffs_cache')
          .upsert({
            hs_code: 'SECTION_232_COUNTRY_' + rate.country, // Country-level rate (not HS-specific)
            origin_country: rate.country,
            section_232_steel: rate.steel,
            section_232_aluminum: rate.aluminum,
            verified_date: new Date().toISOString().split('T')[0],
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            data_source: 'Section 232 known rates (refreshed by daily sync)',
            is_stale: false,
            last_updated_by: 'section232-sync.js',
            update_notes: rate.notes
          }, {
            onConflict: 'hs_code'
          });
      }

      logInfo('✅ Refreshed known Section 232 rates', {
        countries_updated: knownRates.length
      });

    } catch (error) {
      logError('Failed to update known Section 232 rates', { error: error.message });
    }
  }

  /**
   * Update cache with extracted rates from Presidential Proclamation
   */
  async updateCacheWithRates(rates, sourceDoc) {
    try {
      for (const rate of rates) {
        await this.supabase
          .from('policy_tariffs_cache')
          .upsert({
            hs_code: 'SECTION_232_COUNTRY_' + rate.country,
            origin_country: rate.country,
            section_232_steel: rate.steel_rate,
            section_232_aluminum: rate.aluminum_rate,
            verified_date: sourceDoc.publication_date,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            data_source: `Presidential Proclamation ${sourceDoc.document_number}`,
            is_stale: false,
            last_updated_by: 'section232-sync.js automated',
            update_notes: rate.notes,
            source_url: sourceDoc.html_url
          }, {
            onConflict: 'hs_code'
          });
      }

      logInfo(`✅ Updated ${rates.length} Section 232 country rates`, {
        document_number: sourceDoc.document_number
      });

    } catch (error) {
      logError('Failed to update Section 232 cache', { error: error.message });
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
          source: 'Federal Register - Section 232',
          status: error ? 'failed' : (errors > 0 ? 'partial' : 'success'),
          error_message: error?.message,
          policy_changes: {
            sync_duration_ms: duration,
            codes_updated: codesUpdated,
            errors_encountered: errors
          }
        });
    } catch (logError) {
      console.error('Failed to log Section 232 sync', logError);
    }
  }
}

export const section232Sync = new Section232Sync();
export default section232Sync;
