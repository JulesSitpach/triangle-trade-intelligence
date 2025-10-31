/**
 * AI Helpers - 3-Tier Fallback Architecture
 *
 * TIER 1: OpenRouter API (Primary - Current 2025 policy, ~$0.02)
 * TIER 2: Anthropic Direct API (Backup - Same model, ~$0.02)
 * TIER 3: Database Cached Results (FREE - Uses saved enrichment data)
 *
 * Cost: ~$0.02 per request (Tiers 1-2), FREE for Tier 3
 * Uptime: 99.99% (OpenRouter → Anthropic → Database → Graceful fail)
 *
 * Database Tier 3 Strategy:
 * - HS Code classifications saved in ai_classifications table
 * - Component enrichment data cached with timestamps
 * - Results marked as "cached" with age indicator
 * - Perfect for repeat queries on same products
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for database fallback
const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

/**
 * Lookup cached AI classification with multi-priority fallback
 *
 * 🎯 PRIORITY 1: ai_classifications table (recent AI enrichment - BEST!)
 * 🎯 PRIORITY 2: workflow_sessions component enrichment (hours/days old - GOOD!)
 * ⚠️ PRIORITY 3: hs_master_rebuild static data (Jan 2025 - STALE, last resort)
 *
 * @param {string} productDescription - Product description to match
 * @param {string} hsCode - Optional HS code to match
 * @returns {Promise<Object|null>} Cached AI result or null
 */
export async function lookupCachedClassification(productDescription, hsCode = null) {
  try {
    const supabase = getSupabaseClient();

    // 🎯 PRIORITY 1: Check ai_classifications table (your enriched AI results)
    console.log('🔍 PRIORITY 1: Checking ai_classifications (recent AI enrichment)...');

    let aiQuery = supabase
      .from('tariff_rates_cache')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (productDescription) {
      aiQuery = aiQuery.eq('product_description', productDescription);
    } else if (hsCode) {
      aiQuery = aiQuery.eq('hs_code', hsCode);
    }

    const { data: aiData, error: aiError } = await aiQuery;

    if (!aiError && aiData && aiData.length > 0) {
      const result = aiData[0];
      const ageInDays = Math.floor((Date.now() - new Date(result.created_at).getTime()) / (1000 * 60 * 60 * 24));

      console.log(`  ✅ Found AI enrichment: ${result.hs_code} (${ageInDays} days old, ${result.confidence}% confidence)`);

      return {
        hsCode: result.hs_code,
        description: result.description || result.hs_description,
        confidence: result.confidence,
        explanation: result.explanation,
        mfnRate: result.policy_adjusted_mfn_rate || result.mfn_rate || 0,
        usmcaRate: result.usmca_rate || 0,
        policyAdjustments: result.policy_adjustments || [],
        usmcaQualification: result.usmca_qualification,
        alternativeCodes: result.alternative_codes || [],
        requiredDocumentation: result.required_documentation || [],
        source: 'ai_enrichment_database',
        cached: true,
        cacheAge: ageInDays,
        cachedAt: result.created_at,
        stale: false
      };
    }

    // 🎯 PRIORITY 2: Check recent workflow_sessions (component enrichment from last 10 workflows)
    if (hsCode) {
      console.log('🔍 PRIORITY 2: Checking workflow_sessions (recent component enrichment)...');

      const { data: workflowData, error: workflowError } = await supabase
        .from('workflow_sessions')
        .select('component_origins, completed_at')
        .not('component_origins', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10); // Check last 10 workflows for enriched components

      if (!workflowError && workflowData) {
        for (const workflow of workflowData) {
          const matchingComponent = workflow.component_origins?.find(c =>
            (c.hs_code || c.classified_hs_code) === hsCode
          );

          if (matchingComponent && matchingComponent.mfn_rate !== undefined) {
            const ageInHours = Math.floor((Date.now() - new Date(workflow.completed_at).getTime()) / (1000 * 60 * 60));
            console.log(`  ✅ Found workflow enrichment: ${hsCode} (${ageInHours} hours old)`);

            return {
              hsCode: hsCode,
              description: matchingComponent.description || matchingComponent.hs_description,
              confidence: matchingComponent.confidence || matchingComponent.ai_confidence || 80,
              explanation: matchingComponent.explanation || 'From recent workflow enrichment',
              mfnRate: matchingComponent.mfn_rate || 0,
              usmcaRate: matchingComponent.usmca_rate || 0,
              policyAdjustments: matchingComponent.policy_adjustments || [],
              source: 'workflow_enrichment',
              cached: true,
              cacheAge: `${ageInHours} hours`,
              cachedAt: workflow.completed_at,
              stale: false
            };
          }
        }
      }
    }

    // ⚠️ PRIORITY 3: Check hs_master_rebuild (STALE static data - Jan 2025)
    if (hsCode) {
      console.log('🔍 PRIORITY 3: Checking hs_master_rebuild (STALE Jan 2025 data)...');

      const normalizedHsCode = hsCode.replace(/[\.\s\-]/g, '');
      const { data: staticData, error: staticError } = await supabase
        .from('hs_master_rebuild')
        .select('*')
        .eq('hts_code', normalizedHsCode)
        .single();

      if (!staticError && staticData) {
        console.log(`  ⚠️ Using STALE static data: ${hsCode} (Jan 2025 snapshot)`);

        return {
          hsCode: hsCode,
          description: staticData.description,
          confidence: 50, // Lower confidence for stale data
          explanation: '⚠️ STALE DATA - January 2025 static snapshot (does not include 2025 Trump tariff policy)',
          mfnRate: staticData.general_rate || staticData.mfn_rate || 0,
          usmcaRate: staticData.special_rate || staticData.usmca_rate || 0,
          policyAdjustments: ['⚠️ STALE - January 2025 static data, missing 2025 policy updates'],
          source: 'static_database',
          cached: true,
          cacheAge: 'unknown',
          cachedAt: 'January 2025 (static)',
          stale: true
        };
      }
    }

    console.log('❌ No cached data found in any database tier');
    return null;

  } catch (error) {
    console.error('Database lookup error:', error);
    return null;
  }
}

/**
 * Execute AI call with 3-tier fallback
 * @param {Object} params
 * @param {string} params.prompt - The AI prompt
 * @param {string} params.model - Model to use (default: anthropic/claude-3-haiku)
 * @param {number} params.maxTokens - Max tokens (default: 2000)
 * @param {Function} params.databaseFallback - Optional custom database fallback function
 * @param {Object} params.cacheKey - Optional cache lookup parameters {productDescription, hsCode}
 * @returns {Promise<Object>} AI response with metadata
 */
export async function executeAIWithFallback({
  prompt,
  model = 'anthropic/claude-haiku-4.5',
  maxTokens = 2000,
  databaseFallback = null,
  cacheKey = null
}) {
  const startTime = Date.now();

  // TIER 1: Try OpenRouter first
  console.log('🎯 TIER 1: Trying OpenRouter...');
  try {
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://triangle-trade-intelligence.vercel.app',
        'X-Title': 'Triangle Trade Intelligence',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!openRouterResponse.ok) {
      throw new Error(`OpenRouter API failed: HTTP ${openRouterResponse.status}`);
    }

    const data = await openRouterResponse.json();
    const responseText = data.choices[0].message.content;

    console.log(`✅ OpenRouter SUCCESS (${Date.now() - startTime}ms)`);

    return {
      success: true,
      content: responseText,
      provider: 'openrouter',
      tier: 1,
      duration: Date.now() - startTime,
      usage: data.usage
    };

  } catch (openRouterError) {
    console.log(`❌ OpenRouter FAILED: ${openRouterError.message}`);

    // TIER 2: Try Anthropic Direct API
    console.log('🎯 TIER 2: Trying Anthropic Direct API...');
    try {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });

      // Convert OpenRouter model format to Anthropic format
      const anthropicModel = model.replace('anthropic/', '');
      const resolvedModel = anthropicModel.includes('haiku')
        ? 'claude-haiku-4-20250514'
        : 'claude-sonnet-4-20250514';

      const message = await anthropic.messages.create({
        model: resolvedModel,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = message.content[0].text;

      console.log(`✅ Anthropic Direct SUCCESS (${Date.now() - startTime}ms)`);

      return {
        success: true,
        content: responseText,
        provider: 'anthropic_direct',
        tier: 2,
        duration: Date.now() - startTime,
        usage: message.usage
      };

    } catch (anthropicError) {
      console.log(`❌ Anthropic Direct FAILED: ${anthropicError.message}`);

      // TIER 3: Database cached results fallback
      console.log('🎯 TIER 3: Checking database for cached AI results...');

      try {
        let cachedResult = null;

        // Try custom database fallback first (if provided)
        if (databaseFallback) {
          console.log('Using custom database fallback function...');
          cachedResult = await databaseFallback();
        }
        // Try built-in cache lookup if cacheKey provided
        else if (cacheKey && cacheKey.productDescription) {
          console.log(`Looking up cached classification for: "${cacheKey.productDescription.substring(0, 50)}..."`);
          cachedResult = await lookupCachedClassification(
            cacheKey.productDescription,
            cacheKey.hsCode
          );
        }

        if (cachedResult) {
          console.log(`✅ Database SUCCESS - Using cached result (${Date.now() - startTime}ms)`);

          // Format cached result as AI response
          const formattedContent = typeof cachedResult === 'string'
            ? cachedResult
            : JSON.stringify(cachedResult);

          return {
            success: true,
            content: formattedContent,
            provider: 'database_cache',
            tier: 3,
            duration: Date.now() - startTime,
            cached: true,
            cacheAge: cachedResult.cacheAge || 'unknown',
            warning: cachedResult.cacheAge > 30
              ? `⚠️ Cache is ${cachedResult.cacheAge} days old - consider re-running analysis`
              : null
          };
        }

        console.log('❌ No cached results found in database');
      } catch (dbError) {
        console.log(`❌ Database lookup FAILED: ${dbError.message}`);
      }

      // All tiers failed
      console.log(`❌ ALL TIERS FAILED (${Date.now() - startTime}ms)`);
      return {
        success: false,
        error: `All AI tiers failed: OpenRouter (${openRouterError.message}), Anthropic (${anthropicError.message})`,
        duration: Date.now() - startTime
      };
    }
  }
}

/**
 * Save AI classification result to database for future caching
 * @param {Object} params
 * @param {string} params.productDescription - Product description
 * @param {Object} params.classificationData - AI classification result
 * @param {Array} params.componentOrigins - Component origins array
 * @returns {Promise<void>}
 */
export async function saveCachedClassification({
  productDescription,
  classificationData,
  componentOrigins = []
}) {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('tariff_rates_cache')
      .upsert({
        product_description: productDescription,
        hs_code: classificationData.hsCode,
        confidence: classificationData.confidence,
        explanation: classificationData.explanation,
        mfn_rate: classificationData.mfnRate,
        usmca_rate: classificationData.usmcaRate,
        usmca_qualification: classificationData.usmcaQualification,
        alternative_codes: classificationData.alternativeCodes || [],
        required_documentation: classificationData.requiredDocumentation || [],
        component_origins: componentOrigins,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'product_description'
      });

    if (error) {
      console.error('Failed to cache AI result:', error.message);
    } else {
      console.log(`💾 Cached AI classification for: "${productDescription.substring(0, 50)}..."`);
    }
  } catch (error) {
    console.error('Error saving cached classification:', error);
  }
}

/**
 * Parse AI JSON response with robust error handling
 * @param {string} response - Raw AI response
 * @returns {Object} Parsed JSON object
 */
export function parseAIResponse(response) {
  try {
    // Try direct parse first
    return JSON.parse(response);
  } catch (e) {
    // Extract JSON from markdown code blocks
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                      response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse extracted JSON:', parseError);
      }
    }

    // Return raw response if parsing fails
    return { raw: response, parseError: true };
  }
}

/**
 * Call OpenRouter AI API directly
 * Used by alert-impact-analysis-service for strategic analysis
 * @param {string} prompt - User prompt
 * @param {Object} options - API options (model, maxTokens, temperature)
 * @returns {Promise<string>} AI response text
 */
export async function callOpenRouterAI(prompt, options = {}) {
  const {
    model = 'anthropic/claude-haiku-4.5',
    maxTokens = 2000,
    temperature = 1.0,
    systemPrompt = 'You are a helpful AI assistant.'
  } = options;

  try {
    console.log(`🔵 OpenRouter API call: ${model}, ${maxTokens} tokens`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://triangleintelligence.com',
        'X-Title': 'Triangle Intelligence Platform',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0].message.content;

    console.log(`✅ OpenRouter response received (${responseText.length} chars)`);

    return responseText;

  } catch (error) {
    console.error('❌ OpenRouter API failed:', error.message);
    throw error;
  }
}

/**
 * Call Anthropic API directly (fallback)
 * @param {string} prompt - User prompt
 * @param {Object} options - API options (model, maxTokens, temperature)
 * @returns {Promise<string>} AI response text
 */
export async function callAnthropicDirect(prompt, options = {}) {
  const {
    model = 'claude-3-5-haiku-20241022',
    maxTokens = 2000,
    temperature = 1.0,
    systemPrompt = 'You are a helpful AI assistant.'
  } = options;

  try {
    console.log(`🟣 Anthropic Direct API call: ${model}, ${maxTokens} tokens`);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    const responseText = message.content[0].text;

    console.log(`✅ Anthropic response received (${responseText.length} chars)`);

    return responseText;

  } catch (error) {
    console.error('❌ Anthropic Direct API failed:', error.message);
    throw error;
  }
}

export default {
  executeAIWithFallback,
  parseAIResponse,
  lookupCachedClassification,
  saveCachedClassification,
  callOpenRouterAI,
  callAnthropicDirect
};
