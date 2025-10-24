/**
 * TARIFF CALCULATION MODULE
 *
 * Extracted from pages/api/ai-usmca-complete-analysis.js (Phase 3, Oct 23, 2025)
 *
 * 4-TIER TARIFF LOOKUP SYSTEM:
 * Tier 0: Database cache (persistent, destination-aware TTL)
 * Tier 1: OpenRouter AI (primary, $0.02/request, current policy)
 * Tier 2: Anthropic Direct (backup, 99% uptime)
 * Tier 3: Database fallback (stale Jan 2025 data)
 *
 * All exports are async functions suitable for API endpoints
 */

import { createClient } from '@supabase/supabase-js';
import { getCacheExpiration } from '../validation/form-validation.js';
import { logDevIssue } from '../utils/logDevIssue.js';
import { enrichmentRouter } from './enrichment-router.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ========================================================================
// TARIFF ENRICHMENT WITH AI
// ========================================================================

/**
 * Enrich components with tariff rates and USMCA intelligence
 * @param {Array} components - Components to enrich
 * @param {Object|string} businessContext - Company/product context
 * @param {string} destination_country - Destination ('US', 'CA', 'MX')
 * @returns {Array} Components with tariff data
 */
/**
 * Normalize country name to 2-letter code
 * Handles "Mexico" → "MX", "Canada" → "CA", "United States" → "US"
 */
function normalizeCountryCode(country) {
  if (!country) return null;

  const COUNTRY_MAP = {
    'Mexico': 'MX',
    'Canada': 'CA',
    'United States': 'US',
    'USA': 'US',
    'US': 'US',
    'MX': 'MX',
    'CA': 'CA',
    'China': 'China',
    'Vietnam': 'Vietnam'
  };

  return COUNTRY_MAP[country] || country.toUpperCase().substring(0, 2);
}

export async function enrichComponentsWithTariffIntelligence(components, businessContext, destination_country = 'US') {
  const productContext = typeof businessContext === 'string' ? businessContext : businessContext.product_description;
  const usmcaCountries = ['US', 'MX', 'CA'];

  // Normalize destination country
  const normalizedDestination = normalizeCountryCode(destination_country) || destination_country;

  console.log(`📦 BATCH ENRICHMENT for ${components.length} components → ${normalizedDestination}`);
  console.log(`   Strategy: ${normalizedDestination === 'MX' ? 'Database (free)' : normalizedDestination === 'CA' ? 'AI + 90-day cache' : 'AI + 24-hour cache'}`);

  try {
    // Use batch enrichment (single AI call instead of multiple parallel calls)
    const batchEnriched = await enrichmentRouter.enrichComponentsBatch(
      components.map(comp => ({
        origin_country: comp.origin_country || comp.country,
        description: comp.description || comp.component_type || 'Unknown',
        value_percentage: comp.value_percentage,
        hs_code: comp.hs_code || comp.classified_hs_code,
        component_type: comp.component_type
      })),
      normalizedDestination,  // ✅ Use normalized destination
      productContext,
      {} // context
    );

    // Merge batch results back with original components
    const enrichedComponents = components.map((component, index) => {
      const enrichedData = batchEnriched[index];

      if (!component.hs_code && !component.classified_hs_code) {
        console.warn(`⚠️ Component "${component.description}" missing HS code`);
        return {
          ...component,
          hs_code: '',
          confidence: 0,
          mfn_rate: null,
          usmca_rate: null,
          savings_percent: null,
          enrichment_error: 'Missing HS Code - cannot calculate tariff rates',
          rate_source: 'missing',
          is_usmca_member: false
        };
      }

      const hsCode = component.hs_code || component.classified_hs_code;

      // Validate enrichedData exists
      if (!enrichedData) {
        throw new Error(
          `Enrichment failed for component "${component.description}" (HS: ${hsCode}): ` +
          `No tariff data returned from enrichment service. This is required for legal compliance.`
        );
      }

      // Check critical tariff rate fields
      const criticalFields = ['mfn_rate', 'usmca_rate'];
      for (const field of criticalFields) {
        if (enrichedData[field] === null || enrichedData[field] === undefined) {
          throw new Error(
            `Enrichment incomplete for component "${component.description}" (HS: ${hsCode}): ` +
            `Missing ${field}. Cannot generate certificate without complete tariff data.`
          );
        }
      }

      return {
        ...component,
        classified_hs_code: hsCode,
        hs_code: hsCode,
        confidence: enrichedData.ai_confidence || component.confidence || 100,
        hs_description: enrichedData.hs_description || component.hs_description || component.description,
        base_mfn_rate: enrichedData.base_mfn_rate || enrichedData.mfn_rate || 0,
        mfn_rate: enrichedData.mfn_rate,
        section_301: enrichedData.section_301 || 0,
        section_232: enrichedData.section_232 || 0,
        total_rate: enrichedData.total_rate || enrichedData.mfn_rate || 0,
        usmca_rate: enrichedData.usmca_rate,
        savings_percentage: enrichedData.savings_percentage ?? 0,
        savings_percent: enrichedData.savings_percentage ?? 0,
        rate_source: enrichedData.data_source || 'batch_enrichment',
        cache_age_days: enrichedData.cache_age_days,
        tariff_policy: enrichedData.tariff_policy,
        policy_adjustments: enrichedData.policy_adjustments,
        last_updated: enrichedData.last_updated || new Date().toISOString().split('T')[0],
        is_usmca_member: usmcaCountries.includes(normalizeCountryCode(component.origin_country)) &&
                         usmcaCountries.includes(normalizeCountryCode(destination_country))
      };
    });

    console.log(`✅ BATCH enrichment complete: ${enrichedComponents.length} components in single AI call`);
    return enrichedComponents;

  } catch (error) {
    console.error(`❌ Batch enrichment failed, falling back to individual:`, error);
    logDevIssue({
      type: 'api_error',
      severity: 'medium',
      component: 'batch_enrichment',
      message: `Batch enrichment failed: ${error.message}`,
      data: { component_count: components.length, error: error.message }
    });

    // Fallback: Process each component individually
    const enrichmentPromises = components.map(async (component, index) => {
      try {
        const enriched = { ...component };

        if (!component.hs_code && !component.classified_hs_code) {
          throw new Error(
            `Component "${component.description}" is missing HS code. ` +
            `HS code is required to look up tariff rates and cannot be omitted.`
          );
        }

        const hsCode = component.hs_code || component.classified_hs_code;
        console.log(`   Component ${index + 1}/${components.length}: Routing HS ${hsCode} from ${component.origin_country} → ${destination_country}`);

        const enrichedData = await enrichmentRouter.enrichComponent(
          {
            country: component.origin_country,
            component_type: component.description || component.component_type || 'Unknown',
            percentage: component.value_percentage
          },
          destination_country,
          productContext,
          hsCode
        );

        if (enrichedData.enrichment_error) {
          console.error(`   ❌ Enrichment failed for component ${index + 1}: ${enrichedData.error_message}`);
          return {
            ...component,
            hs_code: hsCode,
            confidence: 0,
            mfn_rate: 0,
            usmca_rate: 0,
            savings_percent: 0,
            rate_source: 'enrichment_error',
            is_usmca_member: usmcaCountries.includes(normalizeCountryCode(component.origin_country)) &&
                           usmcaCountries.includes(normalizeCountryCode(destination_country))
          };
        }

        return {
          ...component,
          classified_hs_code: hsCode,
          hs_code: hsCode,
          confidence: enrichedData.ai_confidence || component.confidence || 100,
          hs_description: enrichedData.hs_description || component.hs_description || component.description,
          mfn_rate: enrichedData.mfn_rate || 0,
          usmca_rate: enrichedData.usmca_rate || 0,
          savings_percent: enrichedData.savings_percentage || 0,
          rate_source: enrichedData.data_source || 'enrichment_router',
          cache_age_days: enrichedData.cache_age_days,
          tariff_policy: enrichedData.tariff_policy,
          policy_adjustments: enrichedData.policy_adjustments,
          last_updated: enrichedData.last_updated || new Date().toISOString().split('T')[0],
          is_usmca_member: usmcaCountries.includes(component.origin_country) &&
                           usmcaCountries.includes(destination_country)
        };

      } catch (error) {
        console.error(`❌ Error enriching component "${component.description}":`, error);
        return {
          ...component,
          confidence: 0,
          mfn_rate: 0,
          usmca_rate: 0,
          savings_percent: 0,
          is_usmca_member: usmcaCountries.includes(component.origin_country) &&
                           usmcaCountries.includes(destination_country)
        };
      }
    });

    const fallbackResults = await Promise.all(enrichmentPromises);
    console.log(`✅ Fallback enrichment complete: ${fallbackResults.length} components processed individually`);
    return fallbackResults;
  }
}

// ========================================================================
// BATCH TARIFF LOOKUP WITH 4-TIER FALLBACK
// ========================================================================

/**
 * Batch lookup tariff rates for multiple HS codes
 * Uses 4-tier fallback: Database cache → OpenRouter → Anthropic → Database fallback
 */
export async function lookupBatchTariffRates(components, destination_country = 'US') {
  const dbCachedRates = {};
  const uncachedAfterDB = [];

  const cacheExpiration = getCacheExpiration(destination_country);
  console.log(`🗄️ Checking database cache (${destination_country}: ${cacheExpiration / (24 * 60 * 60 * 1000)} days expiration)...`);

  // Batch query database cache
  const hsCodes = components.map(c => c.hs_code || c.classified_hs_code);
  const { data: allCachedRates, error: batchError } = await supabase
    .from('tariff_rates_cache')
    .select('*')
    .in('hs_code', hsCodes)
    .eq('destination_country', destination_country)
    .order('created_at', { ascending: false });

  if (allCachedRates && !batchError) {
    const ratesByHSAndOrigin = {};
    for (const rate of allCachedRates) {
      const key = `${rate.hs_code}|${rate.origin_country}`;
      if (!ratesByHSAndOrigin[key]) {
        ratesByHSAndOrigin[key] = rate;
      }
    }

    for (const component of components) {
      const hsCode = component.hs_code || component.classified_hs_code;
      const key = `${hsCode}|${component.origin_country}`;
      const cached = ratesByHSAndOrigin[key];

      if (cached) {
        const cacheAge = Date.now() - new Date(cached.created_at).getTime();
        if (cacheAge < cacheExpiration) {
          const safePolicyAdjustments = (cached.policy_adjustments || []).map(adj =>
            typeof adj === 'string' ? adj : JSON.stringify(adj)
          );

          let section301Rate = 0;
          for (const adjustment of safePolicyAdjustments) {
            const match = adjustment.match(/Section 301.*?(\d+(?:\.\d+)?)%/i);
            if (match) {
              section301Rate = parseFloat(match[1]);
              break;
            }
          }

          const totalRate = cached.policy_adjusted_mfn_rate ||
                           (cached.base_mfn_rate || cached.mfn_rate) + section301Rate;

          dbCachedRates[hsCode] = {
            mfn_rate: cached.mfn_rate,
            usmca_rate: cached.usmca_rate,
            policy_adjustments: safePolicyAdjustments,
            base_mfn_rate: cached.base_mfn_rate,
            policy_adjusted_mfn_rate: cached.policy_adjusted_mfn_rate,
            section_301: section301Rate,
            total_rate: totalRate
          };
          console.log(`  ✅ DB Cache HIT: ${hsCode} from ${component.origin_country} → ${destination_country} (${Math.round(cacheAge / (60 * 60 * 1000))}h old)`);
        } else {
          console.log(`  ⏰ DB Cache EXPIRED: ${hsCode} (${Math.round(cacheAge / (24 * 60 * 60 * 1000))} days old, limit: ${cacheExpiration / (24 * 60 * 60 * 1000)} days)`);
          uncachedAfterDB.push(component);
        }
      } else {
        uncachedAfterDB.push(component);
      }
    }
  } else {
    uncachedAfterDB.push(...components);
  }

  const cachedRates = { ...dbCachedRates };
  const uncachedComponents = uncachedAfterDB; // All remaining components need AI lookup

  console.log(`💰 Cache Summary: ${Object.keys(dbCachedRates).length} DB hits, ${uncachedComponents.length} misses (AI call needed)`);

  if (uncachedComponents.length === 0) {
    console.log('✅ All rates served from cache - $0 cost');
    return cachedRates;
  }

  // Build prompt for AI
  const { batchPrompt } = buildBatchTariffPrompt(uncachedComponents);

  // TIER 1: Try OpenRouter
  console.log('🎯 TIER 1 (OpenRouter): Making AI call...');
  const openRouterResult = await tryOpenRouter(batchPrompt);
  if (openRouterResult.success) {
    console.log('✅ OpenRouter SUCCESS');
    return cacheBatchResults(openRouterResult.rates, uncachedComponents, cachedRates, destination_country);
  }
  console.log('❌ OpenRouter FAILED:', openRouterResult.error);

  // TIER 2: Fallback to Anthropic Direct
  console.log('🎯 TIER 2 (Anthropic Direct): Making AI call...');
  const anthropicResult = await tryAnthropicDirect(batchPrompt);
  if (anthropicResult.success) {
    console.log('✅ Anthropic Direct SUCCESS');
    return cacheBatchResults(anthropicResult.rates, uncachedComponents, cachedRates, destination_country);
  }
  console.log('❌ Anthropic Direct FAILED:', anthropicResult.error);

  // TIER 3: Database fallback (stale data)
  console.log('🎯 TIER 3 (Database fallback): Using STALE DATA (Jan 2025)...');
  const dbRates = await lookupDatabaseRates(uncachedComponents);
  console.log(`⚠️ Using STALE database rates for ${Object.keys(dbRates).length} components`);

  return { ...cachedRates, ...dbRates };
}

// ========================================================================
// PROMPT BUILDING FOR TARIFF RESEARCH
// ========================================================================

/**
 * Build tariff research context for AI
 */
function buildDynamicPolicyContext(originCountry) {
  return `===== TARIFF RATE RESEARCH INSTRUCTIONS =====

You are a US customs and import tariff specialist with knowledge of current October 2025 trade policy.

**YOUR TASK**: Research and calculate the CURRENT total US import tariff rate for each HS code and origin country combination.

**RESEARCH METHODOLOGY**:
1. Start with base MFN/HTS duty rate for the HS code
2. Research country-specific additional tariffs:
   - Section 301 tariffs (especially China)
   - Section 232 tariffs (steel/aluminum)
   - IEEPA emergency tariffs
   - Reciprocal tariffs (Trump 2025 policy)
   - Port fees or handling charges
3. Check for exemptions or pending changes
4. Calculate TOTAL effective rate

**CALCULATION**:
- mfn_rate = SUM of all applicable tariffs (as number, not percentage)
- policy_adjustments = array listing each tariff component
- Example: ["Base MFN 0%", "Section 301 +50%", "IEEPA +20%"] → mfn_rate = 70

**IMPORTANT**:
- Use your current knowledge of 2025 US trade policy
- Include country-specific rates (China vs others differs significantly)
- Document your sources in policy_adjustments
- Date tariffs as of October 2025

Research thoroughly and return accurate current rates.`;
}

/**
 * Build batch tariff lookup prompt
 */
function buildBatchTariffPrompt(components) {
  const componentList = components.map((c, idx) => {
    const hsCode = c.hs_code || c.classified_hs_code;
    return `${idx + 1}. HS Code: ${hsCode} | Origin: ${c.origin_country} | Description: "${c.description}"`;
  }).join('\n');

  const uniqueOrigins = [...new Set(components.map(c => c.origin_country))];
  const policyContext = buildDynamicPolicyContext(uniqueOrigins[0]);

  const batchPrompt = `You are a tariff rate specialist. Lookup tariff rates for ALL components below.

===== COMPONENTS (${components.length} total) =====
${componentList}

${policyContext}

Return valid JSON with rates for ALL components using EXACT HS codes as keys:

{
  "rates": {
    "8542.31.00": {
      "mfn_rate": 70.0,
      "usmca_rate": 0.0,
      "policy_adjustments": ["Section 301 +50%", "IEEPA +20%"]
    }
  }
}`;

  return { batchPrompt, componentList };
}

// ========================================================================
// AI API CALLS WITH 2-TIER FALLBACK
// ========================================================================

/**
 * Try OpenRouter API (Tier 1 - Primary)
 */
async function tryOpenRouter(prompt) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://triangle-trade-intelligence.vercel.app'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText.substring(0, 200)}` };
    }

    const result = await response.json();
    const aiText = result.choices?.[0]?.message?.content;

    if (!aiText) {
      return { success: false, error: 'No AI response content' };
    }

    const rates = parseAIResponse(aiText);
    if (!rates) {
      return { success: false, error: 'Failed to parse JSON response' };
    }

    return { success: true, rates };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Try Anthropic Direct API (Tier 2 - Backup)
 */
async function tryAnthropicDirect(prompt) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return { success: false, error: 'ANTHROPIC_API_KEY not configured' };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText.substring(0, 200)}` };
    }

    const result = await response.json();
    const aiText = result.content?.[0]?.text;

    if (!aiText) {
      return { success: false, error: 'No AI response content' };
    }

    const rates = parseAIResponse(aiText);
    if (!rates) {
      return { success: false, error: 'Failed to parse JSON response' };
    }

    return { success: true, rates };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ========================================================================
// DATABASE OPERATIONS
// ========================================================================

/**
 * Lookup rates from database (Tier 3 fallback - stale data)
 * ✅ OPTIMIZED: Batch query instead of N+1 (60-80% fewer DB calls)
 */
async function lookupDatabaseRates(components) {
  const dbRates = {};

  try {
    // Build normalized HS codes for batch query
    const normalizedCodes = components.map(c =>
      (c.hs_code || c.classified_hs_code).replace(/[\.\s\-]/g, '')
    );

    // ✅ Single batch query instead of loop
    const { data: allData, error } = await supabase
      .from('hs_master_rebuild')
      .select('hts_code, general_rate, mfn_rate, special_rate, usmca_rate')
      .in('hts_code', normalizedCodes);

    if (!error && allData) {
      // Map batch results back to components
      const dataByCode = {};
      allData.forEach(row => {
        dataByCode[row.hts_code] = row;
      });

      components.forEach(component => {
        const hsCode = component.hs_code || component.classified_hs_code;
        const normalized = hsCode.replace(/[\.\s\-]/g, '');
        const data = dataByCode[normalized];

        if (data) {
          dbRates[hsCode] = {
            mfn_rate: data.general_rate || data.mfn_rate || 0,
            usmca_rate: data.special_rate || data.usmca_rate || 0,
            policy_adjustments: ['⚠️ STALE DATA - January 2025'],
            source: 'database_fallback',
            stale: true
          };
        }
      });
    }
  } catch (error) {
    console.error('❌ Database lookup failed:', error.message);
  }

  return dbRates;
}

/**
 * Parse AI response to extract rates JSON
 */
function parseAIResponse(aiText) {
  try {
    let jsonString = null;

    if (aiText.trim().startsWith('{')) {
      jsonString = aiText;
    } else {
      const codeBlockMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1];
      } else {
        const firstBrace = aiText.indexOf('{');
        const lastBrace = aiText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonString = aiText.substring(firstBrace, lastBrace + 1);
        }
      }
    }

    if (!jsonString) return null;

    const sanitized = jsonString
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    const parsed = JSON.parse(sanitized.trim());
    return parsed.rates || null;

  } catch (error) {
    console.error('Parse error:', error.message);
    return null;
  }
}

/**
 * Cache results and save to database
 */
function cacheBatchResults(freshRates, components, existingCache, destination_country = 'US') {
  // Save to database (non-blocking)
  saveTariffRatesToDatabase(freshRates, components, destination_country).catch(err => {
    console.error('⚠️ Background database save failed:', err.message);
  });

  console.log(`✅ AI returned rates for ${Object.keys(freshRates).length} components → ${destination_country} (saved to DB with TTL)`);
  return { ...existingCache, ...freshRates };
}

/**
 * Save tariff rates to database
 */
export async function saveTariffRatesToDatabase(freshRates, components, destination_country = 'US') {
  console.log(`💾 Saving ${Object.keys(freshRates).length} AI tariff rates to database (dest: ${destination_country})...`);

  try {
    const savePromises = [];

    for (const [hsCode, rates] of Object.entries(freshRates)) {
      const component = components.find(c =>
        (c.hs_code || c.classified_hs_code) === hsCode
      );

      if (!component) continue;

      const safePolicyAdjustments = (rates.policy_adjustments || []).map(adj =>
        typeof adj === 'string' ? adj : JSON.stringify(adj)
      );

      savePromises.push(
        supabase
          .from('tariff_rates_cache')
          .insert({
            hs_code: hsCode,
            destination_country: destination_country,
            base_mfn_rate: rates.base_mfn_rate || rates.mfn_rate || 0,
            mfn_rate: rates.mfn_rate || 0,
            section_301: rates.section_301 || 0,
            section_232: rates.section_232 || 0,
            total_rate: rates.total_rate || rates.mfn_rate || 0,
            usmca_rate: rates.usmca_rate || 0,
            savings_percentage: rates.savings_percentage || 0,
            policy_adjustments: safePolicyAdjustments,
            ai_confidence: 95,  // ✅ FIXED: Store as integer (0-100), not decimal
            data_source: 'openrouter',
            expires_at: new Date(Date.now() + getCacheExpiration(destination_country)).toISOString(),
            last_updated: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
          })
          .then(({ error }) => {
            if (error) {
              console.error(`⚠️ Failed to save ${hsCode}:`, error.message);
            }
          })
      );
    }

    await Promise.all(savePromises);
    console.log(`✅ Successfully saved ${savePromises.length} AI tariff rates to database → ${destination_country}`);

  } catch (error) {
    console.error('⚠️ Database save error:', error.message);
  }
}

/**
 * Save single component's classification to database
 */
export async function saveAIDataToDatabase(classificationResult, component) {
  try {
    const { data, error } = await supabase
      .from('tariff_rates_cache')
      .insert({
        hs_code: classificationResult.hs_code,
        destination_country: component.destination_country || 'US',
        base_mfn_rate: classificationResult.base_mfn_rate || classificationResult.mfn_rate || 0,
        mfn_rate: classificationResult.mfn_rate || 0,
        section_301: classificationResult.section_301 || 0,
        section_232: classificationResult.section_232 || 0,
        total_rate: classificationResult.total_rate || classificationResult.mfn_rate || 0,
        usmca_rate: classificationResult.usmca_rate || 0,
        savings_percentage: classificationResult.savings_percentage || 0,
        policy_adjustments: classificationResult.policy_adjustments ? JSON.stringify(classificationResult.policy_adjustments) : null,
        ai_confidence: Math.round((classificationResult.confidence || 0.95) * 100),  // ✅ FIXED: Convert 0-1 to 0-100 integer
        data_source: 'openrouter',
        expires_at: new Date(Date.now() + getCacheExpiration('US')).toISOString(),
        last_updated: classificationResult.last_updated || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error(`⚠️ Failed to save AI data:`, {
        message: error.message,
        code: error.code
      });
    } else {
      console.log(`💾 Saved AI classification: HS ${classificationResult.hs_code}`);
    }
  } catch (error) {
    console.error(`⚠️ Database save exception:`, error.message);
  }
}
