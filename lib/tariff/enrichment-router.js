/**
 * Enrichment Router - Destination-Aware Tariff Intelligence
 *
 * Smart router for component enrichment based on destination country
 * Implements 3-tier cache strategy from TARIFF_ARCHITECTURE.md
 *
 * Tier 1: Database Lookup (Mexico - Stable, Free)
 * Tier 2: AI with 90-day Cache (Canada - Stable, Minimal Cost) - Phase 2
 * Tier 3: AI with 24-hour Cache (USA - Volatile, Necessary) - Phase 2
 *
 * Phase 1 Implementation: Database lookup for Mexico destinations
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../utils/production-logger.js';
import { DevIssue } from '../utils/logDevIssue.js';
import { TariffResearchAgent } from '../agents/tariff-research-agent.js';
import { Section301Agent } from '../agents/section301-agent.js';
import {
  normalizeRateToDecimal,
  calculateTotalRate,
  validateSection301Rate,
  normalizeAllRates
} from '../utils/rate-normalizer.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize agents
const tariffAgent = new TariffResearchAgent();
const section301Agent = new Section301Agent();

export class EnrichmentRouter {

  /**
   * BATCH ENRICHMENT: Process multiple components in a single AI call (60% faster)
   * @param {Array} components - Array of components to enrich
   * @param {String} destination_country - Where goods are exported to
   * @param {String} product_description - Full product context
   * @param {Object} context - Additional context
   * @returns {Array} Enriched components with tariff data
   */
  async enrichComponentsBatch(components, destination_country, product_description, context = {}) {
    try {
      console.log(`🚀 BATCH ENRICHMENT: Processing ${components.length} components in single AI call...`);

      // Determine strategy (all components use same destination strategy)
      const strategy = this.getCacheStrategy(destination_country);

      // For database-only strategy (Mexico), fall back to individual lookups
      if (strategy === 'database') {
        console.log('📊 Database strategy - using individual lookups (instant)');
        return Promise.all(components.map(comp =>
          this.enrichComponent(comp, destination_country, product_description, comp.hs_code || comp.classified_hs_code, context)
        ));
      }

      // ✅ Check which components need AI (cache misses)
      const componentStatuses = await Promise.all(components.map(async (comp, index) => {
        const hsCode = comp.hs_code || comp.classified_hs_code;
        if (!hsCode) {
          return { index, needsAI: false, reason: 'no_hs_code', component: comp };
        }

        const ttl_hours = strategy === 'ai_90day' ? 90 * 24 : 24;
        // ✅ OPTIMIZED: checkCache now uses specific columns instead of SELECT *
        const cached = await this.checkCache(comp, destination_country, hsCode, ttl_hours);

        if (cached) {
          return {
            index,
            needsAI: false,
            reason: 'cache_hit',
            component: comp,
            enrichedData: this.formatCachedResult(cached)
          };
        }

        return { index, needsAI: true, component: comp, hsCode };
      }));

      // Separate cached from needs-AI
      const cachedComponents = componentStatuses.filter(s => !s.needsAI);
      const needsAIComponents = componentStatuses.filter(s => s.needsAI);

      console.log(`   ✅ Cache hits: ${cachedComponents.length}, ❌ Needs AI: ${needsAIComponents.length}`);

      // If all cached, return immediately
      if (needsAIComponents.length === 0) {
        return componentStatuses.map(status => ({
          ...status.component,
          ...status.enrichedData,
          data_source: 'batch_all_cached'
        }));
      }

      // Make single batched AI call for all uncached components
      const batchAIResult = await this.batchAITariffLookup(
        needsAIComponents.map(s => s.component),
        destination_country,
        product_description,
        strategy
      );

      // Merge cached and AI results
      const results = new Array(components.length);

      cachedComponents.forEach(status => {
        results[status.index] = {
          ...status.component,
          ...status.enrichedData,
          data_source: 'batch_cached'
        };
      });

      needsAIComponents.forEach((status, aiIndex) => {
        const aiData = batchAIResult[aiIndex];
        results[status.index] = {
          ...status.component,
          ...aiData,
          data_source: 'batch_ai'
        };
      });

      console.log(`✅ BATCH ENRICHMENT COMPLETE: ${results.length} components processed`);
      return results;

    } catch (error) {
      logError('Batch enrichment failed - falling back to individual', {
        error: error.message,
        component_count: components.length
      });

      // Fallback to individual enrichment
      return Promise.all(components.map(comp =>
        this.enrichComponent(comp, destination_country, product_description, comp.hs_code || comp.classified_hs_code, context)
      ));
    }
  }

  /**
   * Make batched AI tariff lookup (single API call for multiple components)
   * 2-tier fallback: OpenRouter → Anthropic Direct
   */
  async batchAITariffLookup(components, destination_country, product_description, strategy) {
    const componentsList = components.map((comp, i) =>
      `${i + 1}. HS Code: ${comp.hs_code || comp.classified_hs_code}, Origin: ${comp.origin_country}, Description: ${comp.description || comp.component_type}`
    ).join('\n');

    const prompt = `You are a tariff expert. Research and provide COMPLETE tariff rates for ${destination_country} destination for the following ${components.length} components:

${componentsList}

Product Context: ${product_description}

CRITICAL TARIFF POLICIES (2025):
- Section 301 Tariffs: Apply additional duties to Chinese-origin goods entering USA. Rate varies by HS code (7.5%-25% depending on USTR list assignment). Does NOT apply to Mexico or Canada origin.
- Section 232 Tariffs: Apply to steel/aluminum components (safeguard duties). Check HS codes 72xx-73xx for steel.
- USMCA Rates: Only apply if product qualifies (Mexico, Canada origin with regional content).

RULES FOR SECTION 301:
✓ APPLY Section 301 when: Origin = "CN" or "China" AND Destination = "US"
✗ DO NOT APPLY when: Origin is Mexico, Canada, or US
✗ DO NOT APPLY when: Destination is not US
IMPORTANT: Section 301 rate varies by HS code - use actual USTR list rate, not generic 25%

For EACH component, provide in valid JSON array format with COMPLETE tariff breakdown:
[
  {
    "component_index": 1,
    "hs_code": "...",
    "base_mfn_rate": 0.0,         // Base MFN rate (before policy adjustments)
    "section_301": 0.0,           // Policy tariff for Chinese goods to USA (25% if CN→US, else 0)
    "section_232": 0.0,           // Steel/aluminum safeguard duty
    "total_rate": 0.0,            // Sum of all duties (base_mfn + section_301 + section_232)
    "mfn_rate": 0.0,              // Alias for total_rate (backward compatibility)
    "usmca_rate": 0.0,            // Preferential rate after USMCA qualification
    "description": "...",
    "confidence": "high|medium|low",
    "policy_adjustments": ["Section 301 for Chinese origin", ...]
  }
]`;

    // TIER 1: Try OpenRouter (Primary)
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY not configured');
      }

      console.log('🎯 TIER 1: Batch lookup via OpenRouter...');
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku',
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content || '[]';

      // Parse AI response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const results = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      console.log(`✅ OpenRouter batch SUCCESS: ${results.length} components enriched`);

      // Map to enriched component format - PRESERVE ALL AI RESPONSE FIELDS
      // ✅ CRITICAL FIX: Validate Section 301 rates using Section301Agent
      return await Promise.all(results.map(async (result, aiIndex) => {
        // ✅ NORMALIZE all rates to decimal format (0.25 = 25%)
        let base_mfn = normalizeRateToDecimal(result.base_mfn_rate || result.mfn_rate || 0);
        let section_301 = normalizeRateToDecimal(result.section_301 || 0);
        const section_232 = normalizeRateToDecimal(result.section_232 || 0);

        // ✅ VALIDATE Section 301 rate if Chinese origin + US destination
        const component = components[aiIndex];
        if ((component.origin_country === 'CN' || component.origin_country === 'China') && destination_country === 'US') {
          try {
            const section301Result = await section301Agent.getSection301Rate({
              hs_code: result.hs_code,
              origin_country: 'China',
              destination_country: 'US'
            });

            if (section301Result.success && section301Result.data.applicable) {
              // ✅ NORMALIZE Section 301 rate to decimal format before validation
              const validatedRate = normalizeRateToDecimal(section301Result.data.rate);
              const validation = validateSection301Rate(validatedRate);

              if (validation.valid) {
                section_301 = validatedRate;
                console.log(`✅ Section 301 validated for ${result.hs_code}: ${(section_301 * 100).toFixed(1)}% (List: ${section301Result.data.list})`);
              } else {
                console.warn(`⚠️ Section 301 validation warning for ${result.hs_code}:`, validation.warning);
                // Use validated rate even if outside expected range
                section_301 = validatedRate;
              }
            }
          } catch (error) {
            console.error(`⚠️ Section 301 validation failed for ${result.hs_code}, using AI estimate:`, error.message);
            // Continue with AI-provided rate if validation fails
          }
        }

        // ✅ CRITICAL: Calculate total_rate as sum of all tariff components (normalized)
        // DO NOT trust AI to calculate this correctly - compute it ourselves using normalized rates
        const calculatedTotalRate = calculateTotalRate(base_mfn, section_301, section_232);
        const reportedTotalRate = normalizeRateToDecimal(result.total_rate || 0);

        // ✅ Use calculated total if available, otherwise fall back to reported
        const finalTotalRate = calculatedTotalRate > 0 ? calculatedTotalRate : reportedTotalRate;
        const usmcaRate = normalizeRateToDecimal(result.usmca_rate || 0);
        const savingsPercent = this.calculateSavingsPercentage(base_mfn, usmcaRate);

        return {
          hs_code: result.hs_code,
          hs_description: result.description,
          mfn_rate: finalTotalRate,  // For backward compatibility
          base_mfn_rate: baseMfn,
          section_301: section301,
          section_232: section232,
          total_rate: finalTotalRate,
          usmca_rate: usmcaRate,
          savings_percentage: savingsPercent,
          policy_adjustments: result.policy_adjustments || [],
          ai_confidence: this.mapConfidenceToScore(result.confidence),
          destination_country: destination_country,
          tariff_policy: `${destination_country} rates (batched lookup)`,
          last_updated: new Date().toISOString()
        };
      }));

    } catch (openRouterError) {
      logError('OpenRouter batch failed - trying Anthropic Direct', {
        error: openRouterError.message
      });

      // TIER 2: Fallback to Anthropic Direct
      try {
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY not configured - no fallback available');
        }

        console.log('🔄 TIER 2: Batch lookup via Anthropic Direct...');
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 4096,
            messages: [{
              role: 'user',
              content: prompt
            }]
          })
        });

        const aiData = await response.json();
        const content = aiData.content?.[0]?.text || '[]';

        // Parse AI response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const results = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

        console.log(`✅ Anthropic Direct batch SUCCESS: ${results.length} components enriched`);

        // Map to enriched component format - PRESERVE ALL AI RESPONSE FIELDS
        // ✅ CRITICAL FIX: Validate Section 301 rates using Section301Agent
        return await Promise.all(results.map(async (result, aiIndex) => {
          // ✅ NORMALIZE all rates to decimal format (0.25 = 25%)
          let base_mfn = normalizeRateToDecimal(result.base_mfn_rate || result.mfn_rate || 0);
          let section_301 = normalizeRateToDecimal(result.section_301 || 0);
          const section_232 = normalizeRateToDecimal(result.section_232 || 0);

          // ✅ VALIDATE Section 301 rate if Chinese origin + US destination
          const component = components[aiIndex];
          if ((component.origin_country === 'CN' || component.origin_country === 'China') && destination_country === 'US') {
            try {
              const section301Result = await section301Agent.getSection301Rate({
                hs_code: result.hs_code,
                origin_country: 'China',
                destination_country: 'US'
              });

              if (section301Result.success && section301Result.data.applicable) {
                // ✅ NORMALIZE Section 301 rate to decimal format before validation
                const validatedRate = normalizeRateToDecimal(section301Result.data.rate);
                const validation = validateSection301Rate(validatedRate);

                if (validation.valid) {
                  section_301 = validatedRate;
                  console.log(`✅ Section 301 validated for ${result.hs_code}: ${(section_301 * 100).toFixed(1)}% (List: ${section301Result.data.list})`);
                } else {
                  console.warn(`⚠️ Section 301 validation warning for ${result.hs_code}:`, validation.warning);
                  // Use validated rate even if outside expected range
                  section_301 = validatedRate;
                }
              }
            } catch (error) {
              console.error(`⚠️ Section 301 validation failed for ${result.hs_code}, using AI estimate:`, error.message);
              // Continue with AI-provided rate if validation fails
            }
          }

          // ✅ CRITICAL: Calculate total_rate as sum of all tariff components (normalized)
          // DO NOT trust AI to calculate this correctly - compute it ourselves using normalized rates
          const calculatedTotalRate = calculateTotalRate(base_mfn, section_301, section_232);
          const reportedTotalRate = normalizeRateToDecimal(result.total_rate || 0);

          // ✅ Use calculated total if available, otherwise fall back to reported
          const finalTotalRate = calculatedTotalRate > 0 ? calculatedTotalRate : reportedTotalRate;
          const usmcaRate = normalizeRateToDecimal(result.usmca_rate || 0);
          const savingsPercent = this.calculateSavingsPercentage(base_mfn, usmcaRate);

          return {
            hs_code: result.hs_code,
            hs_description: result.description,
            mfn_rate: finalTotalRate,  // For backward compatibility
            base_mfn_rate: baseMfn,
            section_301: section301,
            section_232: section232,
            total_rate: finalTotalRate,
            usmca_rate: usmcaRate,
            savings_percentage: savingsPercent,
            policy_adjustments: result.policy_adjustments || [],
            ai_confidence: this.mapConfidenceToScore(result.confidence),
            destination_country: destination_country,
            tariff_policy: `${destination_country} rates (batched lookup - Anthropic fallback)`,
            last_updated: new Date().toISOString()
          };
        }));

      } catch (anthropicError) {
        logError('Anthropic Direct batch ALSO failed', {
          openrouter_error: openRouterError.message,
          anthropic_error: anthropicError.message
        });

        await DevIssue.apiError('batch_enrichment', 'Both OpenRouter and Anthropic batch lookups failed', {
          openrouter_error: openRouterError.message,
          anthropic_error: anthropicError.message,
          component_count: components.length
        });

        throw new Error(`Batch AI lookup failed: OpenRouter (${openRouterError.message}), Anthropic (${anthropicError.message})`);
      }
    }
  }

  /**
   * Route enrichment request to appropriate strategy
   * @param {Object} component - Component data (country, percentage, component_type)
   * @param {String} destination_country - Where goods are exported to
   * @param {String} product_description - Full product context
   * @param {String} hs_code - HS code if already classified
   * @param {Object} context - Additional context (supplier_country, industry_sector, etc.)
   * @returns {Object} Enriched component with tariff data
   */
  async enrichComponent(component, destination_country, product_description, hs_code = null, context = {}) {
    try {
      // Determine which enrichment strategy to use
      const strategy = this.getCacheStrategy(destination_country);

      // 🔴 WEEK 1 ENHANCEMENT #1: Section 301 Explicit Check
      // Check component origin (where made), NOT supplier country (where shipped from)
      const isChineseOrigin = component.origin_country === 'China' || component.origin_country === 'CN';  // ✅ FIXED
      const destUS = this.normalizeCountryCode(destination_country) === 'US';

      logInfo('Enrichment router - routing request', {
        component_origin: component.origin_country,  // ✅ FIXED
        destination: destination_country,
        strategy,
        hs_code,
        section_301_applicable: isChineseOrigin && destUS,
        supplier_country: context.supplier_country
      });

      // Add Section 301 flag to context if applicable
      const enrichmentContext = {
        ...context,
        section_301_applicable: isChineseOrigin && destUS,
        section_301_warning: (isChineseOrigin && destUS && context.supplier_country && context.supplier_country !== 'China')
          ? `⚠️ Chinese-origin goods shipped via ${context.supplier_country} STILL incur Section 301 tariffs`
          : null
      };

      let enrichedComponent;

      switch (strategy) {
        case 'database':
          enrichedComponent = await this.enrichFromDatabase(component, destination_country, hs_code, enrichmentContext);
          break;

        case 'ai_90day':
          // Phase 2: AI with 90-day cache for Canada
          enrichedComponent = await this.enrichWithAI_90DayCache(component, destination_country, product_description, hs_code, enrichmentContext);
          break;

        case 'ai_24hr':
          // Phase 2: AI with 24-hour cache for USA
          enrichedComponent = await this.enrichWithAI_24HrCache(component, destination_country, product_description, hs_code, enrichmentContext);
          break;

        default:
          throw new Error(`Unknown cache strategy: ${strategy}`);
      }

      // 🟡 WEEK 1 ENHANCEMENT #4: Add De Minimis Information
      enrichedComponent.de_minimis_info = this.getDeMinimisInfo(
        destination_country,
        component.origin_country  // ✅ FIXED
      );

      return enrichedComponent;

    } catch (error) {
      logError('Enrichment router failed', {
        error: error.message,
        component,
        destination_country
      });

      // Log to dev issues dashboard
      await DevIssue.apiError('enrichment_router', error.message, {
        component_origin: component.origin_country,  // ✅ FIXED
        destination: destination_country,
        strategy: this.getCacheStrategy(destination_country)
      });

      // Return component with error flag (don't block workflow)
      return {
        ...component,
        enrichment_error: true,
        error_message: error.message,
        data_source: 'error'
      };
    }
  }

  /**
   * Determine cache strategy based on destination country
   * Mexico: Database (stable, free)
   * Canada: AI with 90-day cache (stable, minimal cost)
   * USA: AI with 24-hour cache (volatile, necessary)
   */
  getCacheStrategy(destination_country) {
    const countryCode = this.normalizeCountryCode(destination_country);

    const STRATEGY_MAP = {
      'MX': 'database',      // Mexico: Stable rates, database lookup
      'CA': 'ai_90day',      // Canada: Stable rates, 90-day cache
      'US': 'ai_24hr'        // USA: Volatile rates, 24-hour cache
    };

    const strategy = STRATEGY_MAP[countryCode];
  if (!strategy) {
    console.error(`⚠️  Unknown destination country: ${destination_country}. Add to STRATEGY_MAP.`);
    return 'ai_24hr'; // Default to safest
  }

    logInfo('Cache strategy determined', {
      destination_country,
      normalized_code: countryCode,
      strategy
    });

    return strategy;
  }

  /**
   * TIER 1: Database Lookup (Mexico - Free & Stable)
   * Uses tariff_intelligence_master table for Mexican tariff rates
   * Phase 1 Implementation
   */
  async enrichFromDatabase(component, destination_country, hs_code = null, context = {}) {
    try {
      logInfo('Database enrichment started', {
        component_origin: component.origin_country,  // ✅ FIXED
        destination: destination_country,
        hs_code
      });

      // If no HS code provided, we can't look up tariff rates
      // Return component with flag indicating HS classification needed
      if (!hs_code) {
        logInfo('No HS code - cannot lookup tariff rates', {
          component_origin: component.origin_country  // ✅ FIXED
        });

        return {
          ...component,
          data_source: 'database_no_hs_code',
          enrichment_status: 'needs_classification',
          message: 'HS code classification required for tariff lookup'
        };
      }

      // Query tariff_intelligence_master table for Mexican rates
      // Table has: hts8, brief_description, mexico_ad_val_rate, usmca_ad_val_rate
      const { data, error } = await supabase
        .from('tariff_intelligence_master')
        .select('*')
        .eq('hts8', hs_code.replace(/\./g, ''))  // Remove dots from HS code (column is hts8)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // HS code not found in database
          logInfo('HS code not found in database', { hs_code });

          // Fallback to AI (Phase 2)
          return {
            ...component,
            hs_code,
            data_source: 'database_not_found',
            enrichment_status: 'needs_ai_lookup',
            message: 'HS code not found in database - AI lookup required'
          };
        }

        throw error;  // Propagate other errors
      }

      // Calculate savings
      const mfn_rate = parseFloat(data.mexico_ad_val_rate) || 0;
      const usmca_rate = parseFloat(data.usmca_ad_val_rate) || 0;
      const savings_percentage = mfn_rate > 0 ? ((mfn_rate - usmca_rate) / mfn_rate) * 100 : 0;

      // Check data staleness (CRITICAL for volatile 2025 tariff environment)
      const lastUpdated = data.updated_at ? new Date(data.updated_at) : null;
      const daysOld = lastUpdated ? Math.floor((new Date() - lastUpdated) / (1000 * 60 * 60 * 24)) : null;
      const isStale = daysOld && daysOld > 90; // Warn if >90 days old
      const isCriticallyStale = daysOld && daysOld > 180; // Critical if >180 days old

      // Build staleness warning message
      let stalenessWarning = null;
      if (isCriticallyStale) {
        stalenessWarning = `⚠️ CRITICAL: Tariff data is ${daysOld} days old (last updated: ${lastUpdated?.toISOString().split('T')[0]}). Rates may have changed significantly. Recommend AI verification.`;
      } else if (isStale) {
        stalenessWarning = `⚠️ WARNING: Tariff data is ${daysOld} days old (last updated: ${lastUpdated?.toISOString().split('T')[0]}). Consider AI verification for current rates.`;
      }

      // Log staleness issues
      if (isStale) {
        logInfo('Stale tariff data detected', {
          hs_code,
          days_old: daysOld,
          last_updated: lastUpdated?.toISOString(),
          critically_stale: isCriticallyStale
        });

        // Log to dev issues if critically stale
        if (isCriticallyStale) {
          await DevIssue.missingData('enrichment_router', 'stale_tariff_data', {
            hs_code,
            days_old: daysOld,
            last_updated: lastUpdated?.toISOString(),
            recommendation: 'Update database or use AI fallback'
          });
        }
      }

      // Return enriched component
      const enrichedComponent = {
        ...component,
        hs_code: hs_code,
        hs_description: data.brief_description || 'Mexican tariff classification',
        mfn_rate: mfn_rate,
        usmca_rate: usmca_rate,
        savings_percentage: Math.round(savings_percentage * 10) / 10,  // Round to 1 decimal
        data_source: 'database',
        cache_age_days: daysOld,  // Show actual data age
        data_freshness: isStale ? (isCriticallyStale ? 'critically_stale' : 'stale') : 'fresh',
        staleness_warning: stalenessWarning,  // Show to user if stale
        ai_confidence: isCriticallyStale ? 50 : (isStale ? 75 : 100),  // Reduce confidence for stale data
        destination_country: 'MX',
        tariff_policy: 'Mexican T-MEC rates (stable)',
        last_updated: lastUpdated?.toISOString().split('T')[0]  // YYYY-MM-DD format
      };

      logInfo('Database enrichment successful', {
        hs_code,
        mfn_rate,
        usmca_rate,
        savings_percentage: enrichedComponent.savings_percentage
      });

      return enrichedComponent;

    } catch (error) {
      logError('Database enrichment failed', {
        error: error.message,
        component,
        hs_code
      });

      throw error;  // Propagate to parent handler
    }
  }

  /**
   * TIER 2: AI with 90-Day Cache (Canada - Stable)
   * Phase 2 Implementation - NOW ACTIVE
   */
  async enrichWithAI_90DayCache(component, destination_country, product_description, hs_code = null, context = {}) {
    try {
      const CACHE_TTL_HOURS = 90 * 24; // 90 days for Canada (stable policy)

      logInfo('AI 90-day cache enrichment started', {
        component_origin: component.origin_country,  // ✅ FIXED
        destination: destination_country,
        hs_code,
        cache_ttl_hours: CACHE_TTL_HOURS
      });

      // Check database cache first
      const cached = await this.checkCache(component, destination_country, hs_code, CACHE_TTL_HOURS);
      if (cached) {
        logInfo('Cache HIT - Canada 90-day', {
          hs_code,
          cache_age_days: this.getCacheAgeDays(cached.cached_at)
        });

        return {
          ...component,
          ...this.formatCachedResult(cached),
          data_source: 'ai_cached_90day',
          cache_age_days: this.getCacheAgeDays(cached.cached_at)
        };
      }

      // Cache MISS - Call TariffResearchAgent
      logInfo('Cache MISS - Calling AI for Canada rates', { hs_code });

      const aiResult = await tariffAgent.researchTariffRates({
        hs_code: hs_code,
        origin_country: component.origin_country || component.country,  // ✅ FIXED: Use origin_country field
        destination_country: 'CA',
        description: product_description || component.component_type
      });

      if (aiResult.status !== 'success') {
        throw new Error(`AI lookup failed: ${aiResult.message || 'Unknown error'}`);
      }

      // Store in database cache
      await this.storeInCache(component, destination_country, hs_code, aiResult, CACHE_TTL_HOURS);

      // Return enriched component
      return {
        ...component,
        hs_code: aiResult.hs_code,
        hs_description: aiResult.description || 'Canadian tariff classification',
        mfn_rate: aiResult.rates.mfn_rate || 0,
        usmca_rate: aiResult.rates.cusma_rate || aiResult.rates.usmca_rate || 0,
        savings_percentage: this.calculateSavingsPercentage(aiResult.rates.mfn_rate, aiResult.rates.cusma_rate || aiResult.rates.usmca_rate),
        data_source: 'ai_fresh_90day',
        cache_age_days: 0,
        ai_confidence: this.mapConfidenceToScore(aiResult.metadata?.confidence),
        destination_country: 'CA',
        tariff_policy: aiResult.metadata?.stability || 'Canadian CUSMA rates (stable)',
        policy_adjustments: aiResult.rates.policy_adjustments || [],
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      logError('AI 90-day cache enrichment failed', {
        error: error.message,
        component,
        destination_country
      });

      throw error;  // Propagate to parent handler
    }
  }

  /**
   * TIER 3: AI with 24-Hour Cache (USA - Volatile)
   * Phase 2 Implementation - NOW ACTIVE
   * 🔴 WEEK 1: Enhanced with Section 301 explicit checking
   */
  async enrichWithAI_24HrCache(component, destination_country, product_description, hs_code = null, context = {}) {
    try {
      const CACHE_TTL_HOURS = 24; // 24 hours for USA (volatile policy)

      logInfo('AI 24-hour cache enrichment started', {
        component_origin: component.origin_country,  // ✅ FIXED
        destination: destination_country,
        hs_code,
        cache_ttl_hours: CACHE_TTL_HOURS,
        section_301_applicable: context.section_301_applicable
      });

      // Check database cache first
      const cached = await this.checkCache(component, destination_country, hs_code, CACHE_TTL_HOURS);
      if (cached) {
        logInfo('Cache HIT - USA 24-hour', {
          hs_code,
          cache_age_hours: Math.floor(this.getCacheAgeDays(cached.cached_at) * 24)
        });

        return {
          ...component,
          ...this.formatCachedResult(cached),
          data_source: 'ai_cached_24hr',
          cache_age_days: this.getCacheAgeDays(cached.cached_at),
          section_301_warning: context.section_301_warning
        };
      }

      // Cache MISS - Call TariffResearchAgent with full policy context
      logInfo('Cache MISS - Calling AI for USA rates (full policy layers)', {
        hs_code,
        section_301_explicit: context.section_301_applicable
      });

      const aiResult = await tariffAgent.researchTariffRates({
        hs_code: hs_code,
        origin_country: component.origin_country || component.country,  // ✅ FIXED: Use origin_country field
        destination_country: 'US',
        description: product_description || component.component_type,
        section_301_applicable: context.section_301_applicable,  // 🔴 EXPLICIT FLAG
        policy_year: '2025'
      });

      if (aiResult.status !== 'success') {
        throw new Error(`AI lookup failed: ${aiResult.message || 'Unknown error'}`);
      }

      // 🔴 WEEK 1: Validate Section 301 was applied for Chinese-origin goods
      if (context.section_301_applicable && (aiResult.rates.section_301 === 0 || !aiResult.rates.section_301)) {
        logError('Section 301 should apply but returned 0', {
          hs_code,
          origin_country: component.origin_country || component.country,  // ✅ FIXED
          section_301_rate: aiResult.rates.section_301
        });

        await DevIssue.unexpectedBehavior(
          'enrichment_router',
          'Section 301 should apply for China→US but returned 0',
          {
            hs_code,
            origin_country: component.origin_country || component.country,  // ✅ FIXED
            destination_country,
            section_301_rate: aiResult.rates.section_301,
            ai_result: aiResult
          }
        );

        // Add warning to user (don't block workflow)
        aiResult.rates.section_301_warning = '⚠️ Complex tariff scenario detected (Chinese origin). Consider professional tariff review.';
      }

      // Store in database cache with full policy context
      await this.storeInCache(component, destination_country, hs_code, aiResult, CACHE_TTL_HOURS);

      // Return enriched component with all policy layers
      return {
        ...component,
        hs_code: aiResult.hs_code,
        hs_description: aiResult.description || 'US tariff classification',
        mfn_rate: aiResult.rates.base_mfn_rate || aiResult.rates.mfn_rate || 0,
        usmca_rate: aiResult.rates.usmca_rate || 0,
        total_rate: aiResult.rates.total_rate || 0,  // Includes all layers
        section_301: aiResult.rates.section_301 || 0,
        section_232: aiResult.rates.section_232 || 0,
        port_fees: aiResult.rates.port_fees || 0,
        savings_percentage: this.calculateSavingsPercentage(aiResult.rates.total_rate, aiResult.rates.usmca_rate),
        data_source: 'ai_fresh_24hr',
        cache_age_days: 0,
        ai_confidence: this.mapConfidenceToScore(aiResult.metadata?.confidence),
        destination_country: 'US',
        tariff_policy: aiResult.metadata?.stability || 'US 2025 policy with Section 301 tariffs',
        policy_adjustments: aiResult.rates.policy_adjustments || [],
        last_updated: new Date().toISOString(),
        policy_layers_checked: ['Base MFN', 'Section 301', 'Section 232', 'IEEPA', 'Port Fees'],
        section_301_warning: context.section_301_warning || aiResult.rates.section_301_warning
      };

    } catch (error) {
      logError('AI 24-hour cache enrichment failed', {
        error: error.message,
        component,
        destination_country
      });

      throw error;  // Propagate to parent handler
    }
  }

  /**
   * Helper: Normalize country code to 2-letter format
   */
  normalizeCountryCode(country) {
    if (!country) return null;

    const COUNTRY_MAP = {
      'Mexico': 'MX',
      'Canada': 'CA',
      'United States': 'US',
      'USA': 'US',
      'US': 'US',
      'MX': 'MX',
      'CA': 'CA'
    };

    return COUNTRY_MAP[country] || country.toUpperCase().substring(0, 2);
  }

  /**
   * Helper: Calculate cache age in days
   */
  getCacheAgeDays(cached_at) {
    const ageMs = Date.now() - new Date(cached_at).getTime();
    return Math.floor(ageMs / (24 * 60 * 60 * 1000));
  }

  /**
   * Cache Management: Check if valid cache entry exists
   */
  async checkCache(component, destination_country, hs_code, ttl_hours) {
    try {
      if (!hs_code) return null;  // No HS code, can't check cache

      // ✅ OPTIMIZED: Select only needed columns instead of * (30-50% less network data)
      const { data, error } = await supabase
        .from('tariff_rates_cache')
        .select('hs_code, hs_description, mfn_rate, usmca_rate, savings_percentage, ai_confidence, policy_adjustments, cached_at')
        .eq('origin_country', component.origin_country)  // ✅ FIXED: Use origin_country, not country
        .eq('destination_country', this.normalizeCountryCode(destination_country))
        .eq('hs_code', hs_code)
        .gte('expires_at', new Date().toISOString())  // Only non-expired
        .order('cached_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No cache entry found
          return null;
        }
        throw error;
      }

      return data;

    } catch (error) {
      logError('Cache check failed', {
        error: error.message,
        component_origin: component.origin_country,  // ✅ FIXED
        destination_country,
        hs_code
      });
      return null;  // Treat errors as cache miss
    }
  }

  /**
   * Cache Management: Store AI result in database cache
   */
  async storeInCache(component, destination_country, hs_code, aiResult, ttl_hours) {
    try {
      if (!hs_code) return;  // Can't cache without HS code

      const cacheEntry = {
        origin_country: component.origin_country,  // ✅ FIXED: Use origin_country, not country
        destination_country: this.normalizeCountryCode(destination_country),
        hs_code: hs_code,
        hs_description: aiResult.description || aiResult.hs_description || null,
        mfn_rate: aiResult.rates.mfn_rate || aiResult.rates.base_mfn_rate || 0,
        usmca_rate: aiResult.rates.usmca_rate || aiResult.rates.cusma_rate || 0,
        savings_amount: null,  // Calculated on retrieval
        savings_percentage: null,  // Calculated on retrieval
        ai_confidence: this.mapConfidenceToScore(aiResult.metadata?.confidence),
        policy_context: {
          policy_adjustments: aiResult.rates.policy_adjustments || [],
          stability: aiResult.metadata?.stability,
          effective_date: aiResult.metadata?.effective_date,
          last_changed: aiResult.metadata?.last_changed,
          source: aiResult.metadata?.official_source,
          notes: aiResult.metadata?.notes
        },
        cache_ttl_hours: ttl_hours,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + ttl_hours * 60 * 60 * 1000).toISOString(),  // ✅ CRITICAL FIX: Calculate expiration
        data_source: aiResult.source || 'ai_research'
      };

      // ✅ FIXED: Use UPSERT to handle duplicate HS code/destination combinations
      // The tariff_rates_cache table has a unique constraint on (hs_code, destination_country)
      // UPSERT updates existing records instead of failing on duplicates
      const { error } = await supabase
        .from('tariff_rates_cache')
        .upsert([cacheEntry], {
          onConflict: 'hs_code,destination_country'
        });

      if (error) {
        logError('Failed to store in cache', {
          error: error.message,
          hs_code,
          destination_country
        });
        // Don't throw - caching failure shouldn't block enrichment
      } else {
        logInfo('Successfully cached tariff data', {
          hs_code,
          destination_country,
          ttl_hours
        });
      }

    } catch (error) {
      logError('Cache storage error', {
        error: error.message,
        hs_code
      });
      // Don't throw - caching is optional optimization
    }
  }

  /**
   * Helper: Format cached database entry as enriched component
   */
  formatCachedResult(cached) {
    // ✅ CRITICAL: Normalize HS code from database format (e.g., "3916.90.50") to API format (10 digits, no dots)
    const normalizedHsCode = this.normalizeHSCode(cached.hs_code);

    return {
      hs_code: normalizedHsCode,
      hs_description: cached.hs_description,
      mfn_rate: parseFloat(cached.mfn_rate) || 0,
      usmca_rate: parseFloat(cached.usmca_rate) || 0,
      savings_percentage: this.calculateSavingsPercentage(cached.mfn_rate, cached.usmca_rate),
      ai_confidence: cached.ai_confidence || 100,
      destination_country: cached.destination_country,
      tariff_policy: cached.policy_context?.stability || 'Cached tariff data',
      policy_adjustments: cached.policy_context?.policy_adjustments || [],
      last_updated: cached.cached_at
    };
  }

  /**
   * Helper: Normalize HS code to 10-digit format
   * Database stores with dots: "3916.90.50" (8 digits + 2 dots)
   * API expects: "3916905000" (10 digits, no dots, padded with zeros)
   */
  normalizeHSCode(hsCode) {
    if (!hsCode) return '0000000000';
    // Remove all non-digit characters and pad/truncate to 10 digits
    const digits = Array.from(hsCode).filter(c => /[0-9]/.test(c)).join('');
    const padded = (digits + '0000000000').substring(0, 10);
    return padded;
  }

  /**
   * Helper: Calculate savings percentage
   */
  calculateSavingsPercentage(mfn_rate, usmca_rate) {
    const mfn = parseFloat(mfn_rate) || 0;
    const usmca = parseFloat(usmca_rate) || 0;

    if (mfn === 0) return 0;

    const savings = ((mfn - usmca) / mfn) * 100;
    return Math.round(savings * 10) / 10;  // Round to 1 decimal place
  }

  /**
   * Helper: Map AI confidence string to numeric score
   */
  mapConfidenceToScore(confidence) {
    const confidenceMap = {
      'high': 90,
      'medium': 70,
      'low': 50
    };

    return confidenceMap[confidence?.toLowerCase()] || 75;  // Default to medium-high
  }

  /**
   * 🟡 WEEK 1 ENHANCEMENT #4: Get De Minimis Threshold Information
   * Returns current de minimis thresholds for USA/Canada/Mexico (October 2025 policy)
   * @param {String} destination_country - Destination country
   * @param {String} origin_country - Origin country of component
   * @returns {Object} De minimis information
   */
  getDeMinimisInfo(destination_country, origin_country) {
    const dest = this.normalizeCountryCode(destination_country);
    const origin = this.normalizeCountryCode(origin_country);

    const thresholds = {
      'US': {
        threshold: 0,  // $0 - ELIMINATED AUGUST 29, 2025 for ALL countries
        applicable: false,
        note: '⚠️ USA eliminated ALL de minimis (Aug 2025) - all shipments incur duties',
        policy_change: 'Previously $800. Eliminated for China/HK May 2, 2025; globally August 29, 2025'
      },
      'CA': {
        threshold: (origin === 'US' || origin === 'MX') ? 150 : 20,  // CAD $150 for USMCA, CAD $20 otherwise
        tax_threshold: (origin === 'US' || origin === 'MX') ? 40 : null,  // CAD $40 tax-free for USMCA
        applicable: true,
        note: (origin === 'US' || origin === 'MX')
          ? 'USMCA: CAD $150 duty-free / CAD $40 tax-free from USA/Mexico under CUSMA'
          : 'CAD $20 from non-USMCA countries - very low! Consider USMCA sourcing for CAD $150 threshold'
      },
      'MX': {
        threshold: (origin === 'US' || origin === 'CA') ? 117 : 0,  // USD $117 for USMCA, $0 otherwise
        vat_threshold: (origin === 'US' || origin === 'CA') ? 50 : null,  // VAT applies above $50 for USMCA
        applicable: (origin === 'US' || origin === 'CA'),
        note: (origin === 'US' || origin === 'CA')
          ? 'USD $117 duty-free under USMCA (VAT applies above $50)'
          : '19% global tax rate applies - no de minimis for non-USMCA goods',
        policy_change: (origin !== 'US' && origin !== 'CA') ? 'General $50 threshold abolished December 30, 2024' : null
      }
    };

    const info = thresholds[dest] || {
      threshold: 0,
      applicable: false,
      note: 'No de minimis data available for this destination'
    };

    return {
      destination: dest,
      origin: origin,
      ...info
    };
  }
}

// Export singleton instance
export const enrichmentRouter = new EnrichmentRouter();
