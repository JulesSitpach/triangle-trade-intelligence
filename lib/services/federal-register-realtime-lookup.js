/**
 * FEDERAL REGISTER REAL-TIME LOOKUP SERVICE
 * Emergency fallback for cache misses - fetches Section 301 rates on-demand
 *
 * WHEN TO USE:
 * - Cache miss (HS code not in policy_tariffs_cache)
 * - Stale cache (>60 days old)
 * - User-triggered "verify current rate" action
 *
 * FALLBACK HIERARCHY:
 * 1. Cache hit (<25 days)     → confidence: 'high'
 * 2. Cache hit (25-60 days)   → confidence: 'low', warning flag
 * 3. Real-time fetch (this)   → confidence: 'medium', source: 'emergency_fetch'
 * 4. Static fallback          → confidence: 'critical_review_required'
 *
 * RATE LIMITING STRATEGY:
 * - In-memory deduplication (concurrent requests for same HS code = 1 API call)
 * - 5-second cleanup window prevents memory bloat
 * - Federal Register API: 1000 req/hour (plenty of headroom)
 */

import { createClient } from '@supabase/supabase-js';
import { BaseAgent } from '../agents/base-agent.js';
import { logInfo, logError } from '../utils/production-logger.js';

// In-memory deduplication cache: Map<hsCode, Promise<result>>
// Prevents thundering herd when 10 users request same HS code simultaneously
const inflightRequests = new Map();

class FederalRegisterRealtimeLookup {
  constructor() {
    this.apiBase = 'https://www.federalregister.gov/api/v1';
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Fetch Section 301 rate for a single HS code in real-time
   * Uses in-memory deduplication to prevent duplicate API calls
   *
   * @param {string} hsCode - HS code (e.g., "8542.31.00")
   * @returns {Promise<Object>} Rate data with source and confidence
   */
  async fetchSection301ForHSCode(hsCode) {
    const normalizedHS = hsCode.replace(/\./g, ''); // Remove periods

    // Check if already fetching this HS code
    if (inflightRequests.has(normalizedHS)) {
      logInfo(`🔄 Deduplicating request for ${hsCode} (already in-flight)`);
      return await inflightRequests.get(normalizedHS);
    }

    // Create promise for this fetch
    const fetchPromise = this._actuallyFetchFromAPI(normalizedHS, hsCode);
    inflightRequests.set(normalizedHS, fetchPromise);

    try {
      const result = await fetchPromise;
      return result;
    } finally {
      // Clean up after 5 seconds (prevents memory leak)
      setTimeout(() => {
        inflightRequests.delete(normalizedHS);
      }, 5000);
    }
  }

  /**
   * Internal: Actually fetch from Federal Register API
   * Separated for in-memory deduplication logic
   *
   * @private
   */
  async _actuallyFetchFromAPI(normalizedHS, originalHS) {
    const startTime = Date.now();

    try {
      logInfo(`🚨 EMERGENCY FETCH: ${originalHS} from Federal Register API`);

      // Step 1: Search Federal Register for this HS code
      const documents = await this._searchFederalRegisterForHS(normalizedHS, originalHS);

      if (!documents || documents.length === 0) {
        logInfo(`No Federal Register documents found for ${originalHS}`);
        return {
          hs_code: originalHS,
          section_301: null,
          found: false,
          confidence: 'none',
          source: 'federal_register_emergency_fetch',
          notes: `No Section 301 notices found for HS ${originalHS} in Federal Register`,
          fetch_duration_ms: Date.now() - startTime
        };
      }

      logInfo(`Found ${documents.length} Federal Register documents for ${originalHS}`);

      // Step 2: Extract rate from most recent document
      const mostRecentDoc = documents[0]; // Already sorted by newest
      const extractedRate = await this._extractRateFromDocument(mostRecentDoc, originalHS);

      if (!extractedRate) {
        logInfo(`Could not extract rate from Federal Register document for ${originalHS}`);
        return {
          hs_code: originalHS,
          section_301: null,
          found: false,
          confidence: 'none',
          source: 'federal_register_emergency_fetch',
          notes: `Document found but rate extraction failed for HS ${originalHS}`,
          fetch_duration_ms: Date.now() - startTime
        };
      }

      // Step 3: Update cache with emergency fetch result
      await this._updateCacheWithEmergencyFetch(extractedRate, mostRecentDoc);

      logInfo(`✅ Emergency fetch successful: ${originalHS} = ${extractedRate.rate * 100}%`, {
        duration_ms: Date.now() - startTime,
        document: mostRecentDoc.document_number
      });

      return {
        hs_code: originalHS,
        section_301: extractedRate.rate,
        verified_date: mostRecentDoc.publication_date,
        data_source: `Federal Register ${mostRecentDoc.document_number} (emergency fetch)`,
        source_url: mostRecentDoc.html_url,
        confidence: 'medium', // Real-time fetch, not scheduled sync
        is_emergency_fetch: true,
        found: true,
        fetch_duration_ms: Date.now() - startTime,
        notes: extractedRate.notes || `Fetched on-demand from Federal Register`
      };

    } catch (error) {
      logError(`Emergency fetch failed for ${originalHS}`, {
        error: error.message,
        duration_ms: Date.now() - startTime
      });

      return {
        hs_code: originalHS,
        section_301: null,
        found: false,
        confidence: 'error',
        source: 'federal_register_emergency_fetch',
        error: error.message,
        notes: `Emergency fetch failed: ${error.message}`,
        fetch_duration_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Search Federal Register API for documents mentioning this HS code
   *
   * @private
   */
  async _searchFederalRegisterForHS(normalizedHS, originalHS) {
    try {
      // Search for both formats: with and without periods
      const searchTerms = [normalizedHS, originalHS].filter(Boolean).join(' OR ');

      const params = new URLSearchParams({
        conditions: JSON.stringify({
          agencies: ['office-of-the-united-states-trade-representative'],
          term: `"${searchTerms}" AND "Section 301"`
        }),
        fields: ['document_number', 'title', 'publication_date', 'html_url', 'abstract'],
        order: 'newest', // Most recent first
        per_page: 5 // Only need the most recent few
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
      logError('Federal Register search failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Extract Section 301 rate from Federal Register document for specific HS code
   * Uses AI to parse legal text (same as sync job, but filtered to one HS code)
   *
   * @private
   */
  async _extractRateFromDocument(doc, hsCode) {
    try {
      // Fetch full document
      const response = await fetch(`${this.apiBase}/documents/${doc.document_number}.json`);

      if (!response.ok) {
        throw new Error(`Failed to fetch document ${doc.document_number}`);
      }

      const fullDoc = await response.json();
      const fullText = fullDoc.body_html || fullDoc.abstract || '';

      // Use AI to extract rate for this specific HS code
      const extracted = await this._parseSection301TextWithAI(fullText, hsCode, doc.publication_date);

      return extracted;

    } catch (error) {
      logError(`Failed to extract rate from document ${doc.document_number}`, {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Use AI to parse Federal Register legal text for SPECIFIC HS code rate
   * Similar to sync job, but filtered to one HS code for faster processing
   *
   * @private
   */
  async _parseSection301TextWithAI(text, hsCode, publicationDate) {
    try {
      const agent = new BaseAgent({
        name: 'FederalRegisterEmergencyParser',
        model: 'anthropic/claude-haiku-4.5',
        maxTokens: 1500 // Smaller than sync job (only 1 HS code)
      });

      const normalizedHS = hsCode.replace(/\./g, '');

      const prompt = `Extract Section 301 tariff rate for SPECIFIC HS code from Federal Register notice.

===== FEDERAL REGISTER DOCUMENT =====
Publication Date: ${publicationDate}
Source: U.S. Trade Representative (USTR)

${text.substring(0, 10000)} // Truncate to avoid token limits

===== YOUR TASK =====
Find the Section 301 tariff rate for THIS SPECIFIC HS CODE ONLY: ${hsCode} (also check ${normalizedHS})

Look for mentions of:
1. HS code: "${hsCode}" OR "${normalizedHS}"
2. Tariff rate (e.g., "25 percent", "7.5%", "additional duty")
3. Effective date

Return ONLY valid JSON (single object, NOT array):
{
  "hs_code": "${hsCode}",
  "rate": 0.25,
  "rate_percentage": 25,
  "effective_date": "2025-02-15",
  "notes": "Brief excerpt from document showing this rate"
}

If HS code ${hsCode} is NOT mentioned in this document, return: null

CRITICAL: Only extract rate if HS code is EXPLICITLY mentioned. Do NOT infer or guess.`;

      const result = await agent.execute(prompt, { temperature: 0 });

      if (!result.success || !result.data) {
        logError('AI extraction failed for emergency fetch', {
          error: result.error,
          hsCode: hsCode
        });
        return null;
      }

      return result.data;

    } catch (error) {
      logError('AI parsing failed for emergency fetch', { error: error.message });
      return null;
    }
  }

  /**
   * Update cache with emergency fetch result
   * Marked with is_emergency_fetch flag and 30-day expiry
   *
   * @private
   */
  async _updateCacheWithEmergencyFetch(rateData, sourceDoc) {
    try {
      const { error } = await this.supabase
        .from('policy_tariffs_cache')
        .upsert({
          hs_code: rateData.hs_code,
          section_301: rateData.rate,
          verified_date: sourceDoc.publication_date,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          data_source: `Federal Register ${sourceDoc.document_number} (emergency fetch)`,
          is_stale: false,
          is_emergency_fetch: true, // Flag for monitoring
          last_updated_by: 'federal-register-realtime-lookup.js',
          update_notes: `Emergency real-time fetch: ${rateData.notes || 'User-triggered rate verification'}`,
          source_url: sourceDoc.html_url
        }, {
          onConflict: 'hs_code'
        });

      if (error) {
        logError('Failed to update cache with emergency fetch', { error: error.message });
      } else {
        logInfo(`✅ Cache updated with emergency fetch for ${rateData.hs_code}`);
      }

    } catch (error) {
      logError('Cache update failed', { error: error.message });
      // Don't throw - cache update failure shouldn't block user request
    }
  }

  /**
   * Clear in-flight requests (for testing/debugging)
   */
  static clearInflightRequests() {
    inflightRequests.clear();
  }

  /**
   * Get current in-flight request count (for monitoring)
   */
  static getInflightCount() {
    return inflightRequests.size;
  }
}

// Export singleton instance
export default new FederalRegisterRealtimeLookup();

// Export class for testing
export { FederalRegisterRealtimeLookup };
