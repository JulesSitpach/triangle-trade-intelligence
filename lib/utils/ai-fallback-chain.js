/**
 * AI-FIRST FALLBACK CHAIN
 * Priority: OpenRouter → Anthropic → Database Cache → Empty State
 *
 * All AI requests go through this unified fallback system for consistency
 * and transparent error handling.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Execute AI request with full fallback chain
 *
 * @param {Object} options - Configuration options
 * @param {string} options.prompt - The AI prompt to execute
 * @param {string} options.model - Model to use (default: claude-3-haiku)
 * @param {number} options.maxTokens - Max tokens (default: 1000)
 * @param {Object} options.cacheOptions - Database cache options
 * @param {string} options.cacheOptions.table - Table name for caching
 * @param {Object} options.cacheOptions.query - Query to find cached data
 * @param {function} options.cacheOptions.transform - Transform cached data
 *
 * @returns {Object} AI response with source labeling
 */
export async function executeWithFallback(options) {
  const {
    prompt,
    model = 'anthropic/claude-3-haiku',
    maxTokens = 1000,
    cacheOptions = null
  } = options;

  // STEP 1: Try OpenRouter (Primary)
  const openRouterResult = await tryOpenRouter(prompt, model, maxTokens);
  if (openRouterResult.success) {
    // Save to database for future fallback
    if (cacheOptions) {
      await saveToCacheAsync(cacheOptions.table, openRouterResult.data, cacheOptions);
    }

    return {
      success: true,
      data: openRouterResult.data,
      source: 'openrouter_api',
      label: '✓ AI Analysis (OpenRouter)',
      is_cached: false,
      cost_estimate: calculateCost(prompt, openRouterResult.data, 'openrouter')
    };
  }

  // STEP 2: Try Anthropic (Fallback)
  const anthropicResult = await tryAnthropic(prompt, model, maxTokens);
  if (anthropicResult.success) {
    // Save to database for future fallback
    if (cacheOptions) {
      await saveToCacheAsync(cacheOptions.table, anthropicResult.data, cacheOptions);
    }

    return {
      success: true,
      data: anthropicResult.data,
      source: 'anthropic_api',
      label: '⚠️ AI Analysis (Anthropic - OpenRouter unavailable)',
      is_cached: false,
      warning: 'OpenRouter API unavailable - using Anthropic direct',
      cost_estimate: calculateCost(prompt, anthropicResult.data, 'anthropic')
    };
  }

  // STEP 3: Try Database Cache (Last Resort)
  if (cacheOptions) {
    const cacheResult = await tryDatabaseCache(cacheOptions);
    if (cacheResult.success) {
      return {
        success: true,
        data: cacheResult.data,
        source: 'database_cache',
        label: `⚠️ Cached Data (${cacheResult.cached_date})`,
        is_cached: true,
        cached_at: cacheResult.cached_date,
        warning: 'AI services unavailable - using cached results',
        troubleshooting: {
          openrouter_error: openRouterResult.error,
          anthropic_error: anthropicResult.error,
          action: 'Check API keys and service status'
        }
      };
    }
  }

  // STEP 4: Empty State (Nothing Available)
  return {
    success: false,
    data: null,
    source: 'none',
    label: '❌ No Data Available',
    error: 'All AI services and cache unavailable',
    troubleshooting: {
      openrouter: {
        attempted: true,
        error: openRouterResult.error,
        api_key_configured: !!process.env.OPENROUTER_API_KEY
      },
      anthropic: {
        attempted: true,
        error: anthropicResult.error,
        api_key_configured: !!process.env.ANTHROPIC_API_KEY
      },
      database_cache: {
        attempted: !!cacheOptions,
        available: false,
        reason: cacheOptions ? 'No cached data found' : 'Cache not configured'
      },
      next_steps: [
        'Verify OPENROUTER_API_KEY is set in .env.local',
        'Verify ANTHROPIC_API_KEY is set in .env.local',
        'Check API service status',
        'Review database cache configuration'
      ]
    }
  };
}

/**
 * Try OpenRouter API
 */
async function tryOpenRouter(prompt, model, maxTokens) {
  if (!process.env.OPENROUTER_API_KEY) {
    return {
      success: false,
      error: 'OPENROUTER_API_KEY not configured'
    };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://triangle-trade-intelligence.vercel.app',
        'X-Title': 'Triangle Intelligence Platform'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', error);
      return {
        success: false,
        error: `OpenRouter API returned ${response.status}: ${error}`
      };
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return {
        success: false,
        error: 'Invalid response structure from OpenRouter'
      };
    }

    return {
      success: true,
      data: data.choices[0].message.content,
      usage: data.usage
    };

  } catch (error) {
    console.error('OpenRouter request failed:', error);
    return {
      success: false,
      error: `OpenRouter exception: ${error.message}`
    };
  }
}

/**
 * Try Anthropic API (Direct)
 */
async function tryAnthropic(prompt, model, maxTokens) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      success: false,
      error: 'ANTHROPIC_API_KEY not configured'
    };
  }

  try {
    // Convert OpenRouter model format to Anthropic format
    const anthropicModel = model.includes('anthropic/')
      ? model.replace('anthropic/', '')
      : 'claude-3-haiku-20240307';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: anthropicModel,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return {
        success: false,
        error: `Anthropic API returned ${response.status}: ${error}`
      };
    }

    const data = await response.json();

    if (!data.content || !data.content[0] || !data.content[0].text) {
      return {
        success: false,
        error: 'Invalid response structure from Anthropic'
      };
    }

    return {
      success: true,
      data: data.content[0].text,
      usage: data.usage
    };

  } catch (error) {
    console.error('Anthropic request failed:', error);
    return {
      success: false,
      error: `Anthropic exception: ${error.message}`
    };
  }
}

/**
 * Try Database Cache
 */
async function tryDatabaseCache(cacheOptions) {
  try {
    const { table, query, transform } = cacheOptions;

    let dbQuery = supabase.from(table).select('*');

    // Apply query filters
    if (query) {
      Object.keys(query).forEach(key => {
        dbQuery = dbQuery.eq(key, query[key]);
      });
    }

    // Get most recent cached result
    const { data, error } = await dbQuery
      .order('cached_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: error?.message || 'No cached data found'
      };
    }

    // Transform cached data if needed
    const transformedData = transform ? transform(data) : data;

    return {
      success: true,
      data: transformedData,
      cached_date: data.cached_at ? new Date(data.cached_at).toLocaleDateString() : 'unknown'
    };

  } catch (error) {
    console.error('Database cache lookup failed:', error);
    return {
      success: false,
      error: `Database exception: ${error.message}`
    };
  }
}

/**
 * Save AI result to database cache (async, non-blocking)
 */
async function saveToCacheAsync(table, data, cacheOptions) {
  try {
    const cacheRecord = {
      ...cacheOptions.query, // Include query parameters for future lookups
      ai_response: data,
      source: 'openrouter_api',
      cached_at: new Date().toISOString()
    };

    await supabase.from(table).insert(cacheRecord);
    console.log(`✅ Cached AI result to ${table}`);
  } catch (error) {
    console.error(`⚠️ Failed to cache AI result to ${table}:`, error.message);
    // Non-blocking - don't throw error
  }
}

/**
 * Calculate cost estimate for AI request
 */
function calculateCost(prompt, response, service) {
  const promptTokens = Math.ceil(prompt.length / 4); // Rough estimate
  const responseTokens = Math.ceil((response?.length || 0) / 4);
  const totalTokens = promptTokens + responseTokens;

  // Approximate pricing (per 1M tokens)
  const pricing = {
    openrouter: { input: 0.25, output: 1.25 }, // Claude Haiku via OpenRouter
    anthropic: { input: 0.25, output: 1.25 }   // Claude Haiku direct
  };

  const rates = pricing[service] || pricing.anthropic;
  const inputCost = (promptTokens / 1000000) * rates.input;
  const outputCost = (responseTokens / 1000000) * rates.output;

  return {
    tokens: {
      prompt: promptTokens,
      response: responseTokens,
      total: totalTokens
    },
    cost_usd: {
      input: inputCost.toFixed(6),
      output: outputCost.toFixed(6),
      total: (inputCost + outputCost).toFixed(6)
    }
  };
}

/**
 * Helper: Create cache options for common use cases
 */
export function createCacheOptions(type, identifier) {
  const configs = {
    hs_classification: {
      table: 'hs_classifications_cache',
      query: { product_description: identifier },
      transform: (data) => data.ai_response
    },
    usmca_analysis: {
      table: 'usmca_analysis_cache',
      query: { company_id: identifier },
      transform: (data) => data.ai_response
    },
    supplier_research: {
      table: 'supplier_research_cache',
      query: { search_query: identifier },
      transform: (data) => data.ai_response
    }
  };

  return configs[type] || null;
}

export default {
  executeWithFallback,
  createCacheOptions
};
