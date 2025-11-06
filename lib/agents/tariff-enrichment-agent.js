/**
 * TARIFF ENRICHMENT AGENT
 *
 * Automatically enriches tariff_intelligence_master with volatile policy rates:
 * - Section 301 (China tariffs)
 * - Section 232 (Steel/Aluminum)
 * - IEEPA reciprocal tariffs
 *
 * STRATEGY: Build database organically - every user request enriches it for future users
 * LIFESPAN: Cache Section 301 for 30 days (changes monthly), Section 232 for 90 days (stable)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Enrich HS code with current Section 301/232 rates using AI
 * Returns enriched data to save to tariff_intelligence_master
 */
export async function enrichHSCodeWithPolicyRates(hsCode, originCountry = 'CN') {
  try {
    console.log(`🔍 Enriching HS ${hsCode} from ${originCountry} with AI-powered policy rates...`);

    const prompt = `You are a US customs tariff expert. Provide CURRENT (January 2025) tariff rates for:

HS CODE: ${hsCode}
ORIGIN: ${originCountry}
DESTINATION: United States

Return ONLY valid JSON (no markdown):
{
  "hs_code": "${hsCode}",
  "section_301": 0,
  "section_232": 0,
  "mfn_rate": 0,
  "confidence": "high|medium|low",
  "effective_date": "2025-01-XX",
  "notes": "Brief explanation of rates",
  "sources": "USTR List 4A, Federal Register citation, etc."
}

RULES:
1. Section 301 ONLY applies to China (CN) origin - return 0 for all other countries
2. Section 232 ONLY applies to steel (HS 72) and aluminum (HS 76) - return 0 for others
3. Use ACTUAL 2025 rates from USTR/CBP - do not guess
4. If unsure, return 0 and confidence "low"
5. MFN rate is the base Most Favored Nation rate (always applicable)
6. All rates as decimals (0.25 = 25%)`;

    // Try OpenRouter first (primary)
    let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1 // Very low - we want factual accuracy
      })
    });

    // Fallback to Anthropic if OpenRouter fails
    if (!response.ok && process.env.ANTHROPIC_API_KEY) {
      console.log('⚠️ OpenRouter failed, trying Anthropic direct...');
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }]
        })
      });
    }

    if (!response.ok) {
      throw new Error(`AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || data.content?.[0]?.text;

    if (!aiResponse) {
      throw new Error('Empty AI response');
    }

    // Parse JSON response
    let enrichedData;
    try {
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        enrichedData = JSON.parse(jsonMatch[1]);
      } else {
        enrichedData = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', aiResponse);
      throw new Error('Invalid JSON from AI');
    }

    // Convert percentages to decimals if AI returned percentages (e.g., 25 -> 0.25)
    if (enrichedData.section_301 > 1) enrichedData.section_301 = enrichedData.section_301 / 100;
    if (enrichedData.section_232 > 1) enrichedData.section_232 = enrichedData.section_232 / 100;
    if (enrichedData.mfn_rate > 1) enrichedData.mfn_rate = enrichedData.mfn_rate / 100;

    console.log(`✅ Enriched HS ${hsCode}: MFN=${enrichedData.mfn_rate}, 301=${enrichedData.section_301}, 232=${enrichedData.section_232} (${enrichedData.confidence})`);

    return enrichedData;

  } catch (error) {
    console.error(`❌ Enrichment failed for HS ${hsCode}:`, error.message);
    // Return safe defaults
    return {
      hs_code: hsCode,
      section_301: 0,
      section_232: 0,
      mfn_rate: 0,
      confidence: 'error',
      notes: `Enrichment failed: ${error.message}`,
      sources: 'N/A'
    };
  }
}

/**
 * Get or enrich tariff data for HS code
 * CACHE-FIRST: Check DB, use AI only if missing or stale
 */
export async function getEnrichedTariffData(hsCode, originCountry = 'CN', forceRefresh = false) {
  try {
    // Normalize HS code (remove periods, spaces)
    const normalizedHS = hsCode.replace(/[.\s]/g, '');

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const { data: cached, error } = await supabase
        .from('tariff_intelligence_master')
        .select('*')
        .eq('hts8', normalizedHS)
        .single();

      if (!error && cached) {
        // Check if cache is fresh
        const updatedAt = new Date(cached.updated_at || cached.created_at);
        const ageInDays = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);

        // Section 301 cache: 30 days (changes monthly)
        // Section 232 cache: 90 days (stable)
        const isFresh = (
          (cached.section_301 > 0 && ageInDays < 30) ||
          (cached.section_232 > 0 && ageInDays < 90) ||
          ageInDays < 90 // General MFN cache
        );

        if (isFresh) {
          console.log(`✅ Cache hit for HS ${normalizedHS} (${Math.round(ageInDays)} days old)`);
          return cached;
        } else {
          console.log(`⚠️ Cache stale for HS ${normalizedHS} (${Math.round(ageInDays)} days old) - refreshing...`);
        }
      }
    }

    // Cache miss or stale - enrich with AI
    const enrichedData = await enrichHSCodeWithPolicyRates(normalizedHS, originCountry);

    // Save to database for future requests
    const { data: upserted, error: upsertError } = await supabase
      .from('tariff_intelligence_master')
      .upsert({
        hts8: normalizedHS,
        section_301: enrichedData.section_301,
        section_232: enrichedData.section_232,
        mfn_ad_val_rate: enrichedData.mfn_rate,
        updated_at: new Date().toISOString(),
        data_source: 'AI_ENRICHMENT',
        brief_description: enrichedData.notes
      }, {
        onConflict: 'hts8'
      })
      .select()
      .single();

    if (upsertError) {
      console.error('⚠️ Failed to cache enriched data:', upsertError.message);
    } else {
      console.log(`💾 Cached enriched data for HS ${normalizedHS}`);
    }

    return upserted || enrichedData;

  } catch (error) {
    console.error(`❌ getEnrichedTariffData failed for HS ${hsCode}:`, error.message);
    return null;
  }
}

/**
 * Bulk enrich multiple HS codes (batch processing)
 * Use this for workflows with many components
 */
export async function bulkEnrichTariffData(components) {
  const enrichmentPromises = components.map(async (component) => {
    const hsCode = component.hs_code;
    const origin = component.origin_country || component.country || 'CN';

    if (!hsCode || hsCode === 'UNKNOWN') {
      return { ...component, enrichment_status: 'skipped_no_hs_code' };
    }

    try {
      const enrichedData = await getEnrichedTariffData(hsCode, origin);
      return {
        ...component,
        mfn_rate: enrichedData.mfn_ad_val_rate || 0,
        section_301: enrichedData.section_301 || 0,
        section_232: enrichedData.section_232 || 0,
        total_rate: (enrichedData.mfn_ad_val_rate || 0) + (enrichedData.section_301 || 0) + (enrichedData.section_232 || 0),
        usmca_rate: enrichedData.usmca_ad_val_rate || 0,
        enrichment_status: 'success'
      };
    } catch (error) {
      console.error(`Failed to enrich component ${component.description}:`, error.message);
      return { ...component, enrichment_status: 'failed' };
    }
  });

  const enriched = await Promise.all(enrichmentPromises);
  const successCount = enriched.filter(c => c.enrichment_status === 'success').length;

  console.log(`✅ Bulk enriched ${successCount}/${components.length} components`);

  return enriched;
}
