/**
 * SIMPLE AI-FIRST CLASSIFICATION
 * Let Anthropic AI do the semantic understanding, then validate with database
 */

import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productDescription, businessContext = {}, userProfile = {} } = req.body;

  if (!productDescription || productDescription.length < 3) {
    return res.status(400).json({ 
      error: 'Product description required (minimum 3 characters)',
      results: [] 
    });
  }

  try {
    logInfo('AI Classification Request', { 
      description: productDescription, 
      context: businessContext 
    });

    // Step 1: Get AI classification with rich context
    const aiClassification = await getAIClassification(productDescription, businessContext, userProfile);
    
    // Step 2: Validate AI suggestion against database and get tariff rates
    const validatedResults = await validateWithDatabase(aiClassification);
    
    res.status(200).json({
      success: true,
      results: validatedResults,
      aiAnalysis: aiClassification,
      approach: 'ai_first_with_database_validation',
      resultsCount: validatedResults.length
    });

  } catch (error) {
    logError('AI classification failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
      approach: 'ai_classification_error'
    });
  }
}

/**
 * Get AI classification using Anthropic with rich business context
 */
async function getAIClassification(productDescription, businessContext, userProfile) {
  const contextPrompt = `
Business Context:
- Company Type: ${businessContext.companyType || 'Manufacturing'}
- Trade Volume: ${businessContext.tradeVolume || 'Not specified'}
- Primary Supplier: ${businessContext.primarySupplier || 'Various'}
- Manufacturing Location: ${businessContext.manufacturingLocation || 'Not specified'}

Product to Classify: "${productDescription}"

As a customs classification expert, provide:
1. Most likely 6-digit HS code for this product
2. Confidence percentage (1-100)
3. Chapter reasoning (why this HS chapter)
4. Alternative codes if uncertainty exists
5. Key classification factors

Return ONLY valid JSON:
{
  "primaryCode": "123456",
  "confidence": 85,
  "chapter": "12",
  "reasoning": "explanation",
  "alternativeCodes": ["123457", "123458"],
  "keyFactors": ["factor1", "factor2"]
}`;

  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('Anthropic API key not configured');
      }

      console.log(`🤖 AI Classification attempt ${attempt}/${maxRetries}`);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: contextPrompt
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        lastError = new Error(`Anthropic API error: ${response.status} - ${errorText}`);
        
        // Retry on server errors (5xx) or rate limiting (429)
        if (response.status >= 500 || response.status === 429) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          console.log(`⏳ Anthropic API ${response.status} error, retrying in ${backoffMs}ms... (attempt ${attempt}/${maxRetries})`);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            continue;
          }
        }
        
        throw lastError;
      }

      const result = await response.json();
      const aiText = result.content[0].text;
      
      console.log(`✅ AI Response successful on attempt ${attempt}:`, aiText.substring(0, 200));
      
      // Parse AI response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI response not in expected JSON format');
      }

    } catch (error) {
      lastError = error;
      console.error(`❌ AI classification attempt ${attempt} failed:`, error.message);
      
      // Don't retry on parsing errors or client errors (4xx except 429)
      if (attempt >= maxRetries || (error.message.includes('JSON') || (error.message.includes('4') && !error.message.includes('429')))) {
        break;
      }
      
      // Exponential backoff for other errors
      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Retrying in ${backoffMs}ms... (attempt ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  // All retries failed - return fallback
  console.error('🚫 All AI classification attempts failed, using fallback');
  return {
    primaryCode: null,
    confidence: 0,
    reasoning: `AI classification failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
    alternativeCodes: [],
    keyFactors: ['Professional classification required', 'AI service temporarily unavailable']
  };
}

/**
 * Validate AI suggestions against database and get real tariff rates
 */
async function validateWithDatabase(aiClassification) {
  const results = [];
  
  // Check primary AI suggestion first
  if (aiClassification.primaryCode) {
    const primaryResult = await lookupHSCode(aiClassification.primaryCode);
    if (primaryResult) {
      results.push({
        ...primaryResult,
        source: 'ai_primary',
        aiConfidence: aiClassification.confidence,
        aiReasoning: aiClassification.reasoning
      });
    }
  }
  
  // Check alternative suggestions
  if (aiClassification.alternativeCodes) {
    for (const altCode of aiClassification.alternativeCodes.slice(0, 3)) {
      const altResult = await lookupHSCode(altCode);
      if (altResult) {
        results.push({
          ...altResult,
          source: 'ai_alternative',
          aiConfidence: Math.max(aiClassification.confidence - 20, 30),
          aiReasoning: 'Alternative classification'
        });
      }
    }
  }
  
  return results;
}

/**
 * Look up specific HS code in database and get tariff rates
 */
async function lookupHSCode(hsCode) {
  try {
    // Normalize HS code (remove dots, spaces)
    const normalizedCode = hsCode.replace(/[\.\s\-]/g, '');
    
    // Try exact match first
    const { data: initialData, error: initialError } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, chapter')
      .eq('hs_code', normalizedCode)
      .single();
    
    let data = initialData;
    
    if (initialError || !initialData) {
      // Try 6-digit match if 8-digit not found
      const sixDigit = normalizedCode.substring(0, 6);
      const sixResponse = await supabase
        .from('hs_master_rebuild')
        .select('hs_code, description, chapter')
        .ilike('hs_code', `${sixDigit}%`)
        .limit(1)
        .single();
        
      if (sixResponse.error || !sixResponse.data) return null;
      data = sixResponse.data;
    }
    
    // Use intelligent tariff bridging to get real rates
    const tariffRates = await getTariffRates(data.hs_code);

    // Enhance with comtrade reference insights
    let comtradeInsights = null;
    try {
      const { data: comtradeData } = await supabase
        .from('comtrade_reference')
        .select('*')
        .or(`hs_code.eq.${data.hs_code},hs_code.like.${data.hs_code.substring(0,6)}%`)
        .limit(1)
        .single();

      if (comtradeData) {
        comtradeInsights = {
          trade_volume_usd: comtradeData.trade_value_usd,
          primary_exporters: comtradeData.top_exporters,
          growth_trend: comtradeData.year_over_year_change,
          market_share: comtradeData.market_share_percent
        };
      }
    } catch (error) {
      console.log('No comtrade insights available for', data.hs_code);
    }

    return {
      hsCode: data.hs_code,
      description: data.description,
      chapter: data.chapter || data.hs_code.substring(0, 2),
      confidence: 95, // High confidence for exact database matches
      comtrade_insights: comtradeInsights,
      ...tariffRates
    };
    
  } catch (error) {
    console.error('Database lookup error:', error);
    return null;
  }
}

// DETERMINISTIC RESULT CACHE - Prevents inconsistent results for same input
const tariffResultsCache = new Map();

/**
 * DETERMINISTIC INTELLIGENT TARIFF BRIDGING WITH FUZZY MATCHING
 * Multi-table, multi-strategy tariff rate lookup with stable, cacheable results
 */
async function getTariffRates(hsCode) {
  try {
    // Check cache first for deterministic results
    const cacheKey = hsCode;
    if (tariffResultsCache.has(cacheKey)) {
      const cachedResult = tariffResultsCache.get(cacheKey);
      console.log(`🎯 CACHE HIT: ${hsCode} → MFN: ${cachedResult.mfnRate}% (deterministic)`);
      return cachedResult;
    }
    
    console.log(`🔗 Smart tariff bridging for: ${hsCode} (deterministic mode)`);
    
    // Strategy 1: Direct HS record rates (if they exist)
    const directRates = await getDirectHSRates(hsCode);
    if (directRates.mfnRate > 0) {
      console.log(`✅ Strategy 1 SUCCESS: Direct HS rates → MFN: ${directRates.mfnRate}%`);
      tariffResultsCache.set(cacheKey, directRates);
      return directRates;
    }
    
    // Strategy 2: USMCA tariff table lookup (8-digit with dots)
    const usmcaRates = await getUSMCATariffRates(hsCode);
    if (usmcaRates.mfnRate > 0) {
      console.log(`✅ Strategy 2 SUCCESS: USMCA table → MFN: ${usmcaRates.mfnRate}%`);
      tariffResultsCache.set(cacheKey, usmcaRates);
      return usmcaRates;
    }
    
    // Strategy 3: DETERMINISTIC Progressive digit matching (6-digit → 4-digit → 2-digit)
    const progressiveRates = await getDeterministicProgressiveTariffMatch(hsCode);
    if (progressiveRates.mfnRate > 0) {
      console.log(`✅ Strategy 3 SUCCESS: Progressive match → MFN: ${progressiveRates.mfnRate}% (deterministic)`);
      tariffResultsCache.set(cacheKey, progressiveRates);
      return progressiveRates;
    }
    
    // Strategy 4: DETERMINISTIC Chapter-based similar products
    const chapterRates = await getDeterministicChapterSimilarRates(hsCode);
    if (chapterRates.mfnRate > 0) {
      console.log(`✅ Strategy 4 SUCCESS: Chapter similar → MFN: ${chapterRates.mfnRate}% (deterministic)`);
      tariffResultsCache.set(cacheKey, chapterRates);
      return chapterRates;
    }
    
    console.log(`⚠️ All strategies failed for: ${hsCode} - using default rates`);
    const fallbackResult = {
      mfnRate: 0,
      usmcaRate: 0,
      savingsPercent: 0,
      country: 'US',
      source: 'default_fallback'
    };
    
    tariffResultsCache.set(cacheKey, fallbackResult);
    return fallbackResult;
    
  } catch (error) {
    console.error('Intelligent tariff bridging error:', error);
    const errorResult = { mfnRate: 0, usmcaRate: 0, savingsPercent: 0, source: 'error_fallback' };
    tariffResultsCache.set(hsCode, errorResult);
    return errorResult;
  }
}

/**
 * Strategy 1: Get rates directly from HS record if available
 */
async function getDirectHSRates(hsCode) {
  try {
    const { data } = await supabase
      .from('hs_master_rebuild')
      .select('mfn_rate, usmca_rate, country_source')
      .eq('hs_code', hsCode)
      .single();
    
    if (data) {
      const mfnRate = parseFloat(data.mfn_rate || 0);
      const usmcaRate = parseFloat(data.usmca_rate || 0);
      
      return {
        mfnRate: mfnRate,
        usmcaRate: usmcaRate,
        savingsPercent: Math.max(0, mfnRate - usmcaRate),
        country: data.country_source || 'US',
        source: 'direct_hs_record'
      };
    }
  } catch (error) {
    // Continue to next strategy
  }
  
  return { mfnRate: 0, usmcaRate: 0, savingsPercent: 0 };
}

/**
 * Strategy 2: USMCA tariff table with format conversion
 */
async function getUSMCATariffRates(hsCode) {
  try {
    // Convert formats: 85423100 → 8542.31.00
    const withDots = hsCode.length >= 6 ? 
      hsCode.substring(0, 4) + '.' + hsCode.substring(4, 6) + '.' + hsCode.substring(6) : 
      hsCode;
    
    const { data } = await supabase
      .from('usmca_tariff_rates')
      .select('mfn_rate, usmca_rate, savings_percentage')
      .or(`hs_code.eq.${hsCode},hs_code.eq.${withDots},hs_code.like.${hsCode.substring(0, 6)}%`)
      .gt('mfn_rate', 0)
      .limit(1)
      .single();
    
    if (data) {
      const mfnRate = parseFloat(data.mfn_rate || 0);
      const usmcaRate = parseFloat(data.usmca_rate || 0);
      
      return {
        mfnRate: mfnRate,
        usmcaRate: usmcaRate,
        savingsPercent: parseFloat(data.savings_percentage || Math.max(0, mfnRate - usmcaRate)),
        country: 'US',
        source: 'usmca_table'
      };
    }
  } catch (error) {
    // Continue to next strategy
  }
  
  return { mfnRate: 0, usmcaRate: 0, savingsPercent: 0 };
}

/**
 * Strategy 3: DETERMINISTIC Progressive digit matching (6-digit → 4-digit → 2-digit)
 * Uses stable ordering to ensure consistent results for identical inputs
 */
async function getDeterministicProgressiveTariffMatch(hsCode) {
  const searchLengths = [6, 4, 2];
  
  for (const length of searchLengths) {
    const shortCode = hsCode.substring(0, length);
    
    try {
      // Try hs_master_rebuild table FIRST (34K+ codes with real rates)
      const { data: hsData } = await supabase
        .from('hs_master_rebuild')
        .select('mfn_rate, usmca_rate, hs_code')
        .like('hs_code', `${shortCode}%`)
        .gt('mfn_rate', 0)
        .order('mfn_rate', { ascending: false }) // STABLE: Highest rate first
        .order('hs_code', { ascending: true })   // STABLE: Then by HS code
        .limit(1);
      
      if (hsData && hsData.length > 0) {
        const record = hsData[0];
        const mfnRate = parseFloat(record.mfn_rate || 0);
        const usmcaRate = parseFloat(record.usmca_rate || 0);
        
        return {
          mfnRate: mfnRate,
          usmcaRate: usmcaRate,
          savingsPercent: Math.max(0, mfnRate - usmcaRate),
          country: 'US',
          source: `progressive_hs_${length}digit_deterministic`
        };
      }
      
      // Fallback to tariff_rates table (has many 0% rates - use as last resort)
      const { data: tariffData } = await supabase
        .from('tariff_rates')
        .select('mfn_rate, usmca_rate')
        .eq('hs_code', shortCode)
        .gt('mfn_rate', 0)
        .order('mfn_rate', { ascending: false }) // STABLE: Highest rate first
        .order('hs_code', { ascending: true })   // STABLE: Then by HS code
        .limit(1);
      
      if (hsData && hsData.length > 0) {
        const record = hsData[0];
        const mfnRate = parseFloat(record.mfn_rate || 0);
        const usmcaRate = parseFloat(record.usmca_rate || 0);
        
        return {
          mfnRate: mfnRate,
          usmcaRate: usmcaRate,
          savingsPercent: Math.max(0, mfnRate - usmcaRate),
          country: 'US',
          source: `progressive_hs_${length}digit_deterministic`
        };
      }
      
    } catch (error) {
      continue;
    }
  }
  
  return { mfnRate: 0, usmcaRate: 0, savingsPercent: 0 };
}

/**
 * Strategy 4: DETERMINISTIC Chapter-based similar products with actual tariffs
 */
async function getDeterministicChapterSimilarRates(hsCode) {
  try {
    const chapter = hsCode.substring(0, 2);
    
    // Find products in same chapter with actual tariff rates - DETERMINISTIC ORDERING
    const { data: chapterData } = await supabase
      .from('usmca_tariff_rates')
      .select('mfn_rate, usmca_rate, savings_percentage, hs_code')
      .like('hs_code', `${chapter}%`)
      .gt('mfn_rate', 5) // Look for meaningful tariff rates
      .order('mfn_rate', { ascending: false }) // STABLE: Highest rate first
      .order('hs_code', { ascending: true })   // STABLE: Then by HS code  
      .limit(1);
    
    if (chapterData && chapterData.length > 0) {
      const similar = chapterData[0];
      const mfnRate = parseFloat(similar.mfn_rate || 0);
      const usmcaRate = parseFloat(similar.usmca_rate || 0);
      
      return {
        mfnRate: mfnRate,
        usmcaRate: usmcaRate,
        savingsPercent: parseFloat(similar.savings_percentage || Math.max(0, mfnRate - usmcaRate)),
        country: 'US',
        source: `chapter_${chapter}_similar_deterministic`
      };
    }
  } catch (error) {
    // Final fallback
  }
  
  return { mfnRate: 0, usmcaRate: 0, savingsPercent: 0 };
}