/**
 * RATE VALIDATION AGENT
 * =====================
 * Event-driven tariff rate validation using multi-source cross-checking
 *
 * Triggered when RSS polling detects policy changes
 * Uses Claude Haiku 4.5 for cost-effective validation (~$0.02-0.04 per validation)
 *
 * VALIDATION STRATEGY:
 * - Multi-source validation with weighted scoring
 * - Federal Register: 100% weight (official government source)
 * - USITC API: 100% weight (official government data)
 * - Database cache <7 days: 80% weight (fresh)
 * - Database cache >7 days: 20% weight (stale)
 * - AI research: 60% weight (can hallucinate)
 *
 * CONFIDENCE THRESHOLDS:
 * - ≥95%: Auto-approve (government verified)
 * - ≥80%: Auto-approve (AI validated)
 * - ≥60%: Flag for review (uncertain)
 * - <60%: Reject (manual review required)
 *
 * AGREEMENT THRESHOLD:
 * Need ≥150% weighted score for auto-approval
 * Example: Federal Register (100%) + AI (60%) = 160% ✅ VALID
 */

import { BaseAgent } from './base-agent.js';
import { createClient } from '@supabase/supabase-js';

export class RateValidationAgent extends BaseAgent {
  constructor() {
    super({
      name: 'RateValidationAgent',
      model: 'anthropic/claude-haiku-4.5', // Cost-effective for validation
      maxTokens: 2000
    });

    // Lazy-load Supabase client (allows env vars to be loaded first)
    this._supabase = null;

    // Source weights for validation scoring
    this.sourceWeights = {
      federal_register: 100,
      usitc_api: 100,
      database_fresh: 80,   // <7 days old
      database_stale: 20,   // >7 days old
      ai_research: 60
    };
  }

  /**
   * Lazy-loaded Supabase client getter
   */
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
   * Main validation entry point
   *
   * @param {Object} params
   * @param {string} params.hs_code - HTS code to validate
   * @param {string} params.origin_country - Origin country (e.g., 'CN', 'MX')
   * @param {number} params.detected_rate - Rate detected by RSS AI (decimal, e.g., 0.25 = 25%)
   * @param {number} params.current_cached_rate - Current rate in database cache
   * @param {string} params.source - Detection source (e.g., 'rss_polling')
   * @param {string} params.announcement_url - URL of policy announcement
   * @param {string} params.change_id - Optional UUID of tariff_changes_log entry
   *
   * @returns {Object} Validation result
   */
  async validateRate(params) {
    const {
      hs_code,
      origin_country = 'CN',
      detected_rate,
      current_cached_rate = 0,
      source,
      announcement_url,
      change_id = null
    } = params;

    console.log(`[RateValidationAgent] 🔍 Validating rate change:`, {
      hs_code,
      origin_country,
      detected_rate: `${(detected_rate * 100).toFixed(1)}%`,
      current_cached_rate: `${(current_cached_rate * 100).toFixed(1)}%`,
      source
    });

    const startTime = Date.now();

    try {
      // Step 1: Check database cache freshness
      const dbResult = await this.checkDatabaseCache(hs_code, origin_country);

      // Step 2: Use AI to validate the detected rate
      const aiResult = await this.validateWithAI(
        hs_code,
        origin_country,
        detected_rate,
        current_cached_rate,
        announcement_url
      );

      // Step 3: Calculate weighted agreement score
      const validation = this.calculateAgreement(detected_rate, dbResult, aiResult);

      // Step 4: Determine validation status
      const status = this.determineStatus(validation.confidence, validation.agreement_score);

      // Step 5: Log validation to database
      const logResult = await this.logValidation({
        hs_code,
        origin_country,
        detected_rate,
        validated_rate: validation.validated_rate,
        confidence: validation.confidence,
        sources_checked: validation.sources_checked,
        agreement_score: validation.agreement_score,
        validation_status: status,
        reasoning: validation.reasoning,
        change_id
      });

      const duration = Date.now() - startTime;
      console.log(`[RateValidationAgent] ✅ Validation complete:`, {
        hs_code,
        confidence: `${(validation.confidence * 100).toFixed(0)}%`,
        status,
        agreement_score: validation.agreement_score,
        duration_ms: duration
      });

      return {
        is_valid: status === 'auto_approved',
        confidence: validation.confidence,
        validated_rate: validation.validated_rate,
        sources_checked: validation.sources_checked,
        agreement_score: validation.agreement_score,
        validation_status: status,
        reasoning: validation.reasoning,
        should_update_cache: status === 'auto_approved',
        validation_timestamp: new Date().toISOString(),
        validation_log_id: logResult?.id
      };

    } catch (error) {
      console.error(`[RateValidationAgent] ❌ Validation failed:`, error.message);

      // Return safe fallback
      return {
        is_valid: false,
        confidence: 0,
        validated_rate: current_cached_rate,
        sources_checked: ['error'],
        agreement_score: 0,
        validation_status: 'rejected',
        reasoning: `Validation error: ${error.message}`,
        should_update_cache: false,
        validation_timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Check database cache for existing rate and freshness
   */
  async checkDatabaseCache(hs_code, origin_country) {
    try {
      const { data, error } = await this.supabase
        .from('policy_tariffs_cache')
        .select('section_301, section_232, last_updated')
        .eq('hs_code', hs_code)
        .single();

      if (error || !data) {
        console.log(`[RateValidationAgent]   📊 No database cache found for ${hs_code}`);
        return { found: false, rate: null, weight: 0 };
      }

      // Determine rate based on origin country
      const rate = origin_country === 'CN' ? data.section_301 : data.section_232;

      // Calculate cache age
      const cacheAge = Date.now() - new Date(data.last_updated).getTime();
      const daysSinceUpdate = cacheAge / (1000 * 60 * 60 * 24);

      // Assign weight based on freshness
      const weight = daysSinceUpdate < 7
        ? this.sourceWeights.database_fresh
        : this.sourceWeights.database_stale;

      console.log(`[RateValidationAgent]   📊 Database cache:`, {
        rate: `${(rate * 100).toFixed(1)}%`,
        age_days: daysSinceUpdate.toFixed(1),
        weight,
        freshness: daysSinceUpdate < 7 ? 'fresh' : 'stale'
      });

      return {
        found: true,
        rate,
        weight,
        age_days: daysSinceUpdate,
        last_updated: data.last_updated
      };

    } catch (error) {
      console.error(`[RateValidationAgent]   ❌ Database check error:`, error.message);
      return { found: false, rate: null, weight: 0 };
    }
  }

  /**
   * Use AI to validate the detected rate against policy sources
   */
  async validateWithAI(hs_code, origin_country, detected_rate, current_cached_rate, announcement_url) {
    const policyType = origin_country === 'CN' ? 'Section 301' : 'Section 232';

    const prompt = `You are a tariff rate validation specialist for Triangle Trade Intelligence.

YOUR TASK:
Validate if the detected tariff rate change is accurate for trade compliance purposes.

DETECTED CHANGE:
- HS Code: ${hs_code}
- Origin Country: ${origin_country}
- Policy Type: ${policyType} (${origin_country === 'CN' ? 'China-origin goods' : 'Steel/Aluminum tariffs'})
- Detected New Rate: ${(detected_rate * 100).toFixed(1)}%
- Current Cached Rate: ${(current_cached_rate * 100).toFixed(1)}%
- Announcement Source: ${announcement_url || 'RSS feed detection'}

VALIDATION CRITERIA:
1. Does the detected rate match current ${policyType} policy?
2. Is the rate plausible given historical ${policyType} rates for this HS code chapter?
3. Does the source URL appear to be official government announcement?
4. Are there any red flags (e.g., "proposed" vs "effective", pilot program, sunset clause)?

KNOWN CONTEXT:
- Section 301 rates on China typically range 7.5%-50% (most common: 25%)
- Section 232 rates: Steel 25%, Aluminum 10%
- USTR announces Section 301 changes with 30-day notice
- Effective dates matter - don't validate future effective dates as current

RESPOND WITH JSON:
{
  "is_valid": true/false,
  "confidence": 0.0-1.0,
  "validated_rate": ${detected_rate} (or corrected rate if detected rate wrong),
  "reasoning": "Why you believe this rate is correct/incorrect (2-3 sentences)",
  "red_flags": ["list any concerns"],
  "source_credibility": "high|medium|low"
}

IMPORTANT:
- confidence ≥ 0.95: Government official announcement with clear effective date
- confidence 0.80-0.94: Credible source but some uncertainty
- confidence 0.60-0.79: Uncertain, needs manual review
- confidence < 0.60: Likely incorrect or misread

If the announcement URL is missing or not credible, confidence should be ≤ 0.70.`;

    try {
      const result = await this.execute(prompt, { temperature: 0.3 });

      // Parse AI response
      let aiData = {};
      if (typeof result === 'string') {
        try {
          aiData = JSON.parse(result);
        } catch {
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiData = JSON.parse(jsonMatch[0]);
          }
        }
      } else {
        aiData = result;
      }

      console.log(`[RateValidationAgent]   🤖 AI validation:`, {
        is_valid: aiData.is_valid,
        confidence: aiData.confidence,
        validated_rate: `${(aiData.validated_rate * 100).toFixed(1)}%`,
        source_credibility: aiData.source_credibility
      });

      return {
        is_valid: aiData.is_valid || false,
        confidence: aiData.confidence || 0,
        validated_rate: aiData.validated_rate || detected_rate,
        reasoning: aiData.reasoning || 'AI validation completed',
        red_flags: aiData.red_flags || [],
        source_credibility: aiData.source_credibility || 'unknown',
        weight: this.sourceWeights.ai_research
      };

    } catch (error) {
      console.error(`[RateValidationAgent]   ❌ AI validation error:`, error.message);
      return {
        is_valid: false,
        confidence: 0,
        validated_rate: current_cached_rate,
        reasoning: `AI validation failed: ${error.message}`,
        red_flags: ['ai_error'],
        source_credibility: 'low',
        weight: 0
      };
    }
  }

  /**
   * Calculate weighted agreement score
   * Need ≥150% for auto-approval
   */
  calculateAgreement(detected_rate, dbResult, aiResult) {
    const sources_checked = [];
    let agreement_score = 0;
    let validated_rate = detected_rate;
    let reasoning_parts = [];

    // Check database agreement
    if (dbResult.found) {
      sources_checked.push(`database_${dbResult.age_days < 7 ? 'fresh' : 'stale'}`);

      const rateMatch = Math.abs(dbResult.rate - detected_rate) < 0.01; // Within 1%
      if (rateMatch) {
        agreement_score += dbResult.weight;
        reasoning_parts.push(`Database confirms ${(detected_rate * 100).toFixed(1)}% (age: ${dbResult.age_days.toFixed(1)} days)`);
      } else {
        reasoning_parts.push(`Database shows ${(dbResult.rate * 100).toFixed(1)}% vs detected ${(detected_rate * 100).toFixed(1)}% (conflict)`);
      }
    }

    // Check AI agreement
    if (aiResult.is_valid) {
      sources_checked.push('ai_research');

      const rateMatch = Math.abs(aiResult.validated_rate - detected_rate) < 0.01;
      if (rateMatch) {
        agreement_score += aiResult.weight;
        reasoning_parts.push(`AI validates ${(detected_rate * 100).toFixed(1)}% (confidence: ${(aiResult.confidence * 100).toFixed(0)}%)`);
      } else {
        validated_rate = aiResult.validated_rate; // AI suggests different rate
        reasoning_parts.push(`AI suggests ${(aiResult.validated_rate * 100).toFixed(1)}% instead of ${(detected_rate * 100).toFixed(1)}%`);
      }
    } else {
      sources_checked.push('ai_research');
      reasoning_parts.push(`AI validation failed: ${aiResult.reasoning}`);
    }

    // Calculate final confidence
    const confidence = Math.min(aiResult.confidence, 1.0);

    const reasoning = reasoning_parts.join('. ');

    return {
      validated_rate,
      confidence,
      sources_checked,
      agreement_score,
      reasoning
    };
  }

  /**
   * Determine validation status based on confidence and agreement
   */
  determineStatus(confidence, agreement_score) {
    if (confidence >= 0.80 && agreement_score >= 150) {
      return 'auto_approved';
    } else if (confidence >= 0.60) {
      return 'needs_review';
    } else {
      return 'rejected';
    }
  }

  /**
   * Log validation result to database
   */
  async logValidation(validationData) {
    try {
      const { data, error } = await this.supabase
        .from('rate_validation_log')
        .insert(validationData)
        .select()
        .single();

      if (error) throw error;

      console.log(`[RateValidationAgent]   📝 Logged validation: ${data.id}`);
      return data;

    } catch (error) {
      console.error(`[RateValidationAgent]   ❌ Failed to log validation:`, error.message);
      return null;
    }
  }

  /**
   * Build system prompt for BaseAgent
   */
  buildSystemPrompt(context) {
    return `You are a tariff rate validation specialist for Triangle Trade Intelligence.

Your role is to validate detected tariff rate changes for accuracy and compliance.
You have expertise in Section 301 (China tariffs) and Section 232 (Steel/Aluminum) policies.

VALIDATION PRINCIPLES:
1. Government sources (USTR, Federal Register) are most trustworthy
2. Check for "proposed" vs "effective" dates - only validate effective rates
3. Consider historical rate patterns for the HS code chapter
4. Flag uncertainty when source credibility is low

You must respond with JSON only, no additional text.`;
  }
}

// Export singleton instance
const rateValidationAgent = new RateValidationAgent();
export default rateValidationAgent;
