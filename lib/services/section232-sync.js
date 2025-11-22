/**
 * SECTION 232 SYNC SERVICE
 * Fetches CURRENT Section 232 tariff rates (steel/aluminum) from Federal Register
 *
 * CURRENT RATES (as of June 2025):
 * - Steel: 50% on ALL countries (increased from 25%)
 * - Aluminum: 50% on ALL countries (increased from 10%)
 * - UK Exception: 25% temporary (expires July 2025)
 * - NO USMCA exemption: Canada and Mexico pay 50%
 *
 * ONLY EXEMPTION: Material smelted/melted in USA → 0%
 *
 * Data Source: Federal Register Presidential Proclamations
 * Update Frequency: Daily cron job at 06:30 UTC
 * Cache TTL: 30 days
 * Fallback: Section232ResearchAgent (AI on-demand research)
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
        logInfo('No new Section 232 documents found - database cache will continue to serve existing rates');

        // ✅ NO HARDCODED FALLBACK - Let AI research handle any database misses
        // Database cache (30-day TTL) continues to serve until cron finds new proclamations
        // If cache expires, Section232ResearchAgent will perform on-demand AI research

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
1. Countries granted exemptions (e.g., "United Kingdom 25% exception")
2. Steel tariff rates (current default: 50%)
3. Aluminum tariff rates (current default: 50%)
4. Effective dates
5. HS code ranges for steel/aluminum products

NOTE: As of June 2025, standard Section 232 rates are 50% for both steel and aluminum.
Canada and Mexico are NOT exempt (they pay 50% despite USMCA).

Return ONLY valid JSON array:
[
  {
    "country": "United Kingdom",
    "steel_rate": 0.25,
    "aluminum_rate": 0.25,
    "effective_date": "2025-06-04",
    "source": "Presidential Proclamation ${publicationDate}",
    "notes": "Temporary exception - 25% instead of standard 50%"
  },
  {
    "country": "Canada",
    "steel_rate": 0.50,
    "aluminum_rate": 0.50,
    "effective_date": "2025-06-04",
    "source": "Presidential Proclamation ${publicationDate}",
    "notes": "USMCA does NOT exempt from Section 232 - standard 50% applies"
  },
  {
    "country": "China",
    "steel_rate": 0.50,
    "aluminum_rate": 0.50,
    "effective_date": "2025-06-04",
    "source": "Presidential Proclamation ${publicationDate}",
    "notes": "Standard Section 232 rates - 50% for both steel and aluminum"
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
   * ❌ REMOVED: updateKnownSection232Rates() (Nov 21, 2025)
   *
   * Hardcoded fallback rates are always stale and defeat the purpose of automated monitoring.
   *
   * New Architecture:
   * 1. Primary: Database cache (updated daily by this cron job)
   * 2. Secondary: AI research (Section232ResearchAgent) for on-demand lookups
   * 3. Never: Hardcoded rates
   *
   * The old function had stale rates:
   * - CA/MX: 0% (WRONG - actually 50%, USMCA does NOT exempt)
   * - CN: 25% steel / 10% aluminum (WRONG - both 50% as of June 2025)
   */

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
