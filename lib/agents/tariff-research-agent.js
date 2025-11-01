/**
 * TARIFF RESEARCH AGENT - North American Trade Triangle
 *
 * Architecture based on real-world stability:
 * - Canada/Mexico rates: STABLE → Pre-loaded knowledge base
 * - US rates: VOLATILE (Trump) → Real-time AI research
 *
 * Tier 1: Static knowledge base (CA/MX - FREE, instant)
 * Tier 2: AI research with 24hr cache (US only - $0.02/call)
 * Tier 3: Database fallback (stale Jan 2025 - marked as STALE)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * STATIC KNOWLEDGE BASE
 * Canada and Mexico tariff rates - stable, pre-loaded
 * Source: Official tariff schedules (updated quarterly if needed)
 */
const STABLE_TARIFF_KNOWLEDGE = {
  // CANADA: Predictable CUSMA rates
  'CA': {
    // Electronics (Chapter 85)
    '8537.10.90': {
      mfn_rate: 2.7,
      cusma_rate: 0,
      source: 'CBSA Customs Tariff 2025',
      notes: 'Industrial control modules - duty-free under CUSMA'
    },
    '8542.31.00': {
      mfn_rate: 0,
      cusma_rate: 0,
      source: 'CBSA Customs Tariff 2025',
      notes: 'Microcontrollers - no duty (Canada promotes electronics)'
    },
    '8538.90.00': {
      mfn_rate: 0,
      cusma_rate: 0,
      source: 'CBSA Customs Tariff 2025'
    },

    // Automotive (Chapter 87)
    '8708.30.00': {
      mfn_rate: 6.0,
      cusma_rate: 0,
      source: 'CBSA Customs Tariff 2025'
    },

    // Textiles (Chapter 61-62)
    '6109.10.00': {
      mfn_rate: 18.0,
      cusma_rate: 0,
      source: 'CBSA Customs Tariff 2025'
    }
  },

  // MEXICO: Stable T-MEC rates
  'MX': {
    // Electronics
    '8537.10.90': {
      igi_rate: 10,
      tmec_rate: 0,
      source: 'TIGIE 2025',
      notes: 'IGI = Impuesto General de Importación (General Import Tax)'
    },
    '8542.31.00': {
      igi_rate: 5,
      tmec_rate: 0,
      source: 'TIGIE 2025',
      notes: 'Lower duty to encourage electronics manufacturing'
    },
    '8538.90.00': {
      igi_rate: 5,
      tmec_rate: 0,
      source: 'TIGIE 2025'
    },

    // Automotive
    '8708.30.00': {
      igi_rate: 10,
      tmec_rate: 0,
      source: 'TIGIE 2025'
    },

    // Textiles
    '6109.10.00': {
      igi_rate: 35,
      tmec_rate: 0,
      source: 'TIGIE 2025',
      notes: 'Mexico protects textile industry - high MFN rate'
    }
  }
};

/**
 * AI Research Cache (US rates only - volatile)
 * TTL: 24 hours (Trump can change rates anytime)
 */
const US_RATE_CACHE = new Map();
const US_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export class TariffResearchAgent {
  constructor() {
    this.name = 'tariff-research';
    this.version = '2.0.0';
  }

  /**
   * Main entry point: Get tariff rates for destination country
   * ARCHITECTURE: Database FIRST (12K codes), AI overlay for volatile adjustments
   */
  async researchTariffRates(request) {
    const { hs_code, origin_country, destination_country = 'US', description } = request;

    if (!hs_code || !origin_country) {
      return this.formatError('Missing required fields: hs_code and origin_country');
    }

    console.log(`[TARIFF RESEARCH] ${hs_code} from ${origin_country} → ${destination_country}`);

    // STEP 1: Query database for MEXICO (stable rates)
    if (destination_country === 'MX') {
      // If origin is US, check for retaliatory tariffs via AI
      if (origin_country === 'US') {
        console.log(`🇺🇸→🇲🇽 US goods to Mexico - checking for retaliation...`);
        return this.getMexicoRateWithRetaliationCheck(hs_code, description);
      }

      // For other origins, use database (stable T-MEC)
      const dbResult = await this.queryDatabase(hs_code, 'MX');
      if (dbResult.found) {
        console.log(`✅ MEXICO DATABASE HIT: ${hs_code} (FREE, instant)`);
        return this.formatDatabaseResult(dbResult, 'MX');
      }
    }

    // US: FULL AI RESEARCH (everything changes - rules, fees, tariffs)
    if (destination_country === 'US') {
      console.log(`🇺🇸 US destination - FULL AI research (volatile, 24hr cache)...`);
      return this.getVolatileUSRate(hs_code, origin_country, description);
    }

    // CANADA: No rates in database, use AI with long-term cache (stable)
    if (destination_country === 'CA') {
      console.log(`🍁 Canadian rate via AI (stable, 90-day cache)...`);
      return await this.getCanadianRateViaAI(hs_code, origin_country, description);
    }

    return this.formatError(`Unsupported destination: ${destination_country}`);
  }

  /**
   * Query database for base tariff rates (US/Mexico coverage)
   */
  async queryDatabase(hsCode, destinationCountry) {
    try {
      const cleanHsCode = hsCode.replace(/\./g, ''); // Remove dots from HS code

      const { data, error } = await supabase
        .from('tariff_intelligence_master')
        .select('*')
        .eq('hts8', cleanHsCode)
        .single();

      if (error || !data) {
        return { found: false };
      }

      // Extract rates based on destination
      let result = {
        found: true,
        hs_code: data.hts8,
        description: data.brief_description
      };

      if (destinationCountry === 'US') {
        result.mfn_rate = parseFloat(data.mfn_ad_val_rate || 0);
        result.usmca_rate = parseFloat(data.usmca_ad_val_rate || 0);
      } else if (destinationCountry === 'MX') {
        result.mfn_rate = parseFloat(data.mexico_ad_val_rate || 0);
        result.usmca_rate = 0; // T-MEC preferential rate
      }

      return result;

    } catch (error) {
      console.error('[DATABASE QUERY ERROR]', error);
      return { found: false };
    }
  }

  /**
   * Add US Section 301 overlay (volatile Trump tariffs)
   */
  async addUSSection301Overlay(dbResult, originCountry, description) {
    const { hs_code, mfn_rate, usmca_rate } = dbResult;

    // For non-China origins, base rate is usually sufficient
    if (originCountry !== 'CN') {
      console.log(`✅ Non-China origin, using database base rate only`);
      return this.formatDatabaseResult(dbResult, 'US', 'database');
    }

    // China origin: Need AI to check current Section 301 tariffs
    console.log(`🇨🇳 China origin - checking Section 301 (volatile)...`);

    const cacheKey = `US-301-${hs_code}-CN`;
    const cached = this.checkUSCache(cacheKey);
    if (cached) {
      console.log('✅ Section 301 cache HIT (24hr)');
      return cached;
    }

    try {
      const prompt = this.buildSection301Prompt(hs_code, description, mfn_rate);
      const aiResult = await this.tryOpenRouter(hs_code, 'CN', prompt);

      if (aiResult.success) {
        const result = {
          status: 'success',
          source: 'database + ai_section_301',
          destination_country: 'US',
          destination_country_name: 'United States',
          hs_code: hs_code,
          rates: {
            mfn_rate: mfn_rate,
            section_301: aiResult.data.rates.total_rate - mfn_rate,
            total_rate: aiResult.data.rates.total_rate,
            usmca_rate: usmca_rate,
            policy_adjustments: aiResult.data.rates.policy_adjustments
          },
          metadata: {
            official_source: 'Database + AI Section 301 Research',
            base_rate_source: 'tariff_intelligence_master',
            section_301_source: aiResult.data.metadata.official_source,
            effective_date: aiResult.data.metadata.effective_date,
            confidence: 'high',
            notes: `Base: ${mfn_rate}%, Section 301: ${(aiResult.data.rates.total_rate - mfn_rate)}%`,
            stability: 'VOLATILE - Section 301 tariffs change frequently'
          },
          agent_version: this.version,
          timestamp: new Date().toISOString()
        };

        this.cacheUSRateAndReturn(cacheKey, result);
        return result;
      }

      // AI failed, return database base rate with warning
      console.log('⚠️ AI Section 301 lookup failed, using base rate only');
      return this.formatDatabaseResult(dbResult, 'US', 'database_no_section_301');

    } catch (error) {
      console.error('[SECTION 301 ERROR]', error);
      return this.formatDatabaseResult(dbResult, 'US', 'database_no_section_301');
    }
  }

  /**
   * Build Section 301 research prompt
   */
  buildSection301Prompt(hsCode, description, baseRate) {
    const today = new Date().toISOString().split('T')[0];

    return `Research CURRENT US Section 301 tariffs for Chinese imports.

Product: ${description || 'Not specified'}
HS Code: ${hsCode}
Base US MFN Rate: ${baseRate}%
Origin: CHINA

===== YOUR TASK =====
Check if this HS code has Section 301 additional tariffs from China.

Trump administration Section 301 List status:
- List 1 (25%)
- List 2 (25%)
- List 3 (25%)
- List 4A (7.5% or 25%)
- List 4B exclusions

Return ONLY valid JSON:
{
  "hs_code": "${hsCode}",
  "base_mfn_rate": ${baseRate},
  "section_301": 0.0,
  "total_rate": ${baseRate},
  "policy_adjustments": ["No Section 301 tariffs" or "Section 301 List X (Y%)"],
  "effective_date": "${today}",
  "source": "USTR Section 301",
  "confidence": "high",
  "notes": "Brief explanation"
}`;
  }

  /**
   * Get Canadian rates via AI (stable, 90-day cache)
   */
  async getCanadianRateViaAI(hsCode, originCountry, description) {
    const cacheKey = `CA-${hsCode}`;
    const CANADA_CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days (stable treaty)

    // Check long-term cache
    const cached = US_RATE_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CANADA_CACHE_TTL) {
      console.log('✅ Canadian rate cache HIT (90-day TTL)');
      return { ...cached.data, cache_hit: true };
    }

    console.log('🔍 Researching Canadian rate via AI...');

    const prompt = `Research Canadian tariff rates for this product entering CANADA.

Product: ${description || 'Not specified'}
HS Code: ${hsCode}
Origin: ${this.getCountryName(originCountry)}
Destination: CANADA

===== CHECK FOR RETALIATORY TARIFFS =====
CRITICAL: Canada may retaliate against US tariffs!

If origin is USA, check:
1. Are there any retaliatory tariffs on US goods?
2. Did Canada impose counter-tariffs in response to Trump tariffs?
3. Are there emergency measures affecting US imports?

For all origins, provide:
1. Canadian MFN rate (general import duty from CBSA Customs Tariff 2025)
2. CUSMA/USMCA preferential rate (usually 0% for qualifying goods)
3. Any retaliatory or counter-tariffs
4. Source (CBSA Customs Tariff 2025 + recent policy announcements)

Canadian rates are NORMALLY STABLE, but check recent news for retaliation!

Return ONLY valid JSON:
{
  "hs_code": "${hsCode}",
  "mfn_rate": 0.0,
  "cusma_rate": 0.0,
  "retaliation_rate": 0.0,
  "total_rate": 0.0,
  "policy_adjustments": ["Base MFN: X%" or "Retaliatory tariff on US goods: X%"],
  "effective_date": "2025-01-01",
  "source": "CBSA Customs Tariff 2025",
  "confidence": "high",
  "notes": "Note any retaliatory measures if applicable"
}`;

    try {
      const aiResult = await this.tryOpenRouter(hsCode, originCountry, prompt);

      if (aiResult.success) {
        const result = {
          status: 'success',
          source: 'ai_research_canada',
          destination_country: 'CA',
          destination_country_name: 'Canada',
          hs_code: hsCode,
          rates: aiResult.data.rates,
          metadata: {
            ...aiResult.data.metadata,
            stability: 'STABLE - Canadian CUSMA rates rarely change (90-day cache)'
          },
          agent_version: this.version,
          timestamp: new Date().toISOString()
        };

        // Cache for 90 days
        US_RATE_CACHE.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      }

      return this.formatError('Failed to research Canadian rate');

    } catch (error) {
      console.error('[CANADIAN RATE ERROR]', error);
      return this.formatError(error.message);
    }
  }

  /**
   * Get STABLE rates (Canada/Mexico) from pre-loaded knowledge
   */
  getStableRate(hsCode, originCountry, destinationCountry) {
    const knowledge = STABLE_TARIFF_KNOWLEDGE[destinationCountry];

    if (!knowledge) {
      return this.formatError(`No knowledge base for ${destinationCountry}`);
    }

    // Check if we have this HS code pre-loaded
    const rates = knowledge[hsCode];

    if (rates) {
      console.log(`✅ STABLE RATE HIT: ${destinationCountry} ${hsCode} (FREE, instant)`);

      return {
        status: 'success',
        source: 'stable_knowledge',
        destination_country: destinationCountry,
        destination_country_name: this.getCountryName(destinationCountry),
        hs_code: hsCode,
        rates: {
          mfn_rate: rates.mfn_rate || rates.igi_rate || 0,
          usmca_rate: rates.cusma_rate || rates.tmec_rate || 0,
          total_rate: rates.mfn_rate || rates.igi_rate || 0,
          policy_adjustments: []
        },
        metadata: {
          official_source: rates.source,
          effective_date: '2025-01-01',
          confidence: 'high',
          notes: rates.notes || 'Pre-loaded from official tariff schedule',
          stability: 'STABLE - Canada/Mexico rates change rarely'
        },
        agent_version: this.version,
        timestamp: new Date().toISOString()
      };
    }

    // HS code not in knowledge base - need to add it or research
    console.log(`⚠️ UNKNOWN HS CODE: ${hsCode} for ${destinationCountry}`);
    console.log('💡 RECOMMENDATION: Add this to STABLE_TARIFF_KNOWLEDGE');

    return {
      status: 'not_found',
      message: `HS code ${hsCode} not in ${destinationCountry} knowledge base`,
      recommendation: 'Add to STABLE_TARIFF_KNOWLEDGE or use AI research',
      destination_country: destinationCountry,
      hs_code: hsCode,
      agent_version: this.version
    };
  }

  /**
   * Get VOLATILE US rates via AI research (Trump chaos)
   */
  async getVolatileUSRate(hsCode, originCountry, description) {
    const cacheKey = `US-${hsCode}-${originCountry}`;

    // Check 24hr cache first
    const cached = this.checkUSCache(cacheKey);
    if (cached) {
      console.log('✅ US rate cache HIT (24hr TTL)');
      return cached;
    }

    console.log('🔍 US rate cache MISS - researching current policy...');

    try {
      // TIER 1: OpenRouter API (Primary)
      console.log('🎯 TIER 1: Trying OpenRouter for US rates...');
      const openRouterResult = await this.tryOpenRouter(hsCode, originCountry, description);
      if (openRouterResult.success) {
        console.log('✅ OpenRouter SUCCESS');
        return this.cacheUSRateAndReturn(cacheKey, openRouterResult.data);
      }
      console.log('❌ OpenRouter FAILED:', openRouterResult.error);

      // TIER 2: Anthropic Direct API
      console.log('🎯 TIER 2: Trying Anthropic Direct...');
      const anthropicResult = await this.tryAnthropicDirect(hsCode, originCountry, description);
      if (anthropicResult.success) {
        console.log('✅ Anthropic Direct SUCCESS');
        return this.cacheUSRateAndReturn(cacheKey, anthropicResult.data);
      }
      console.log('❌ Anthropic Direct FAILED:', anthropicResult.error);

      // TIER 3: Database fallback (stale Jan 2025)
      console.log('🎯 TIER 3: Falling back to database (STALE)...');
      const dbResult = await this.searchDatabase(hsCode);
      if (dbResult.found) {
        return this.formatDatabaseResult(dbResult, cacheKey);
      }

      return this.formatError('All US rate sources unavailable');

    } catch (error) {
      console.error('[TARIFF RESEARCH ERROR]', error);
      return this.formatError(error.message);
    }
  }

  /**
   * TIER 1: OpenRouter API for US rates
   */
  async tryOpenRouter(hsCode, originCountry, description) {
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        return { success: false, error: 'OPENROUTER_API_KEY not configured' };
      }

      const prompt = this.buildUSRatePrompt(hsCode, originCountry, description);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://triangle-trade-intelligence.vercel.app'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-haiku-4.5',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}` };
      }

      const result = await response.json();
      const aiText = result.choices?.[0]?.message?.content;

      if (!aiText) {
        return { success: false, error: 'No AI response' };
      }

      const parsed = this.parseAIResponse(aiText);
      if (!parsed) {
        return { success: false, error: 'Failed to parse response' };
      }

      return { success: true, data: parsed };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * TIER 2: Anthropic Direct API
   */
  async tryAnthropicDirect(hsCode, originCountry, description) {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        return { success: false, error: 'ANTHROPIC_API_KEY not configured' };
      }

      const prompt = this.buildUSRatePrompt(hsCode, originCountry, description);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      const result = await response.json();
      const aiText = result.content?.[0]?.text;

      if (!aiText) {
        return { success: false, error: 'No AI response' };
      }

      const parsed = this.parseAIResponse(aiText);
      if (!parsed) {
        return { success: false, error: 'Failed to parse response' };
      }

      return { success: true, data: parsed };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Build US rate research prompt (Trump chaos-aware)
   * FULL RESEARCH - Base rates, overlays, fees, rules - EVERYTHING changes
   */
  buildUSRatePrompt(hsCode, originCountry, description) {
    const today = new Date().toISOString().split('T')[0];
    const originName = this.getCountryName(originCountry);

    return `You are a US tariff rate specialist tracking Trump administration policy changes in real-time.

===== CRITICAL: FULL US RATE RESEARCH AS OF ${today} =====
Destination: UNITED STATES
Origin: ${originName} (${originCountry})
HS Code: ${hsCode}
Product: ${description || 'Not specified'}

===== WHY FULL RESEARCH IS NEEDED =====
US rates are HIGHLY VOLATILE in 2025:
- Base HTS rates can change (emergency authority)
- Section 301 tariffs change WEEKLY
- Port fees fluctuate based on politics
- IEEPA emergency tariffs appear overnight
- Trade rules modified without notice
- Exemptions granted/revoked randomly

===== YOUR RESEARCH TASK =====
Research the COMPLETE, CURRENT tariff rate including ALL layers:

**Layer 1: Base HTS/MFN Rate**
- Check USITC Harmonized Tariff Schedule
- Note if base rate changed recently (Trump uses emergency authority)

**Layer 2: Section 301 Additional Duties**
- China origin: Check List 1, 2, 3, 4A, 4B status
- Current rates: 7.5%, 25%, or 100%?
- Any exclusions granted for this HS code?

**Layer 3: Section 232 (Steel/Aluminum)**
- 25% on steel, 10% on aluminum
- Check if this product qualifies

**Layer 4: IEEPA Emergency Tariffs**
- Any emergency national security tariffs?
- Country-specific measures?

**Layer 5: Port Fees & Other Costs**
- Chinese port fees (if origin = China)
- Container inspection fees
- Any new administrative fees?

**Layer 6: USMCA Preferential Rate**
- If origin = CA/MX, what's the USMCA rate?
- Does product qualify for duty-free treatment?

**CRITICAL REQUIREMENTS:**
1. Return TOTAL effective rate (all layers combined)
2. List each policy adjustment separately
3. Note if ANY rate changed in last 30 days
4. Specify confidence level based on source freshness
5. Include source references (USITC, USTR, CBP, Federal Register)

Return ONLY valid JSON:
{
  "hs_code": "${hsCode}",
  "base_mfn_rate": 0.0,
  "section_301": 0.0,
  "section_232": 0.0,
  "ieepa": 0.0,
  "port_fees": 0.0,
  "total_rate": 0.0,
  "usmca_rate": 0.0,
  "policy_adjustments": [
    "Base MFN: 2.7%",
    "Section 301 List 4A: 25%",
    "Total effective rate: 27.7%"
  ],
  "effective_date": "${today}",
  "last_changed": "2025-10-01",
  "source": "USITC HTS 2025 + USTR Section 301 + CBP",
  "confidence": "high",
  "notes": "Brief explanation of current policy status"
}`;
  }

  /**
   * Parse AI response (handles full US rate breakdown)
   */
  parseAIResponse(aiText) {
    try {
      const jsonMatch = aiText.match(/```json\s*([\s\S]*?)\s*```/) ||
                       aiText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        console.error('No JSON in AI response');
        return null;
      }

      const jsonText = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonText);

      return {
        status: 'success',
        source: 'ai_research',
        destination_country: 'US',
        destination_country_name: 'United States',
        hs_code: parsed.hs_code,
        rates: {
          base_mfn_rate: parseFloat(parsed.base_mfn_rate || 0),
          section_301: parseFloat(parsed.section_301 || 0),
          section_232: parseFloat(parsed.section_232 || 0),
          ieepa: parseFloat(parsed.ieepa || 0),
          port_fees: parseFloat(parsed.port_fees || 0),
          total_rate: parseFloat(parsed.total_rate || 0),
          usmca_rate: parseFloat(parsed.usmca_rate || 0),
          policy_adjustments: parsed.policy_adjustments || []
        },
        metadata: {
          official_source: parsed.source,
          effective_date: parsed.effective_date,
          last_changed: parsed.last_changed,
          confidence: parsed.confidence || 'medium',
          notes: parsed.notes,
          stability: 'VOLATILE - US rates change frequently (24hr cache)'
        },
        agent_version: this.version,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error parsing AI response:', error);
      return null;
    }
  }

  /**
   * TIER 3: Database lookup (stale)
   */
  async searchDatabase(hsCode) {
    try {
      const { data, error } = await supabase
        .from('hs_master_rebuild')
        .select('*')
        .eq('hs_code', hsCode)
        .single();

      if (error || !data) {
        return { found: false };
      }

      return {
        found: true,
        hs_code: data.hs_code,
        description: data.description,
        mfn_rate: parseFloat(data.mfn_rate || 0),
        usmca_rate: parseFloat(data.usmca_rate || 0)
      };

    } catch (error) {
      console.error('[DB ERROR]', error);
      return { found: false };
    }
  }

  formatDatabaseResult(dbResult, destinationCountry, source = 'database') {
    let warning, stability, confidence;

    if (destinationCountry === 'MX') {
      // Mexico rates from database are current and stable
      warning = null;
      stability = 'STABLE - Mexico T-MEC rates rarely change';
      confidence = 'high';
    } else if (destinationCountry === 'US' && source === 'database') {
      // US base rate from database (without Section 301 check)
      warning = null;
      stability = 'Base rate stable, but Section 301 may apply';
      confidence = 'high';
    } else if (source === 'database_no_section_301') {
      // US rate when Section 301 AI lookup failed
      warning = '⚠️ Section 301 lookup unavailable - showing base rate only';
      stability = 'INCOMPLETE - May not include Section 301 tariffs';
      confidence = 'medium';
    } else {
      // Fallback for unknown cases
      warning = '⚠️ Database fallback used';
      stability = 'May not reflect current policy';
      confidence = 'medium';
    }

    return {
      status: 'success',
      source: source,
      warning: warning,
      destination_country: destinationCountry,
      destination_country_name: this.getCountryName(destinationCountry),
      hs_code: dbResult.hs_code,
      description: dbResult.description,
      rates: {
        mfn_rate: dbResult.mfn_rate,
        usmca_rate: dbResult.usmca_rate,
        total_rate: dbResult.mfn_rate,
        policy_adjustments: []
      },
      metadata: {
        official_source: 'tariff_intelligence_master (HTS 2025)',
        effective_date: '2025-01-01',
        confidence: confidence,
        notes: `${destinationCountry} tariff rate from database`,
        stability: stability
      },
      agent_version: this.version,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * US Rate Cache (24hr TTL)
   */
  checkUSCache(key) {
    const cached = US_RATE_CACHE.get(key);
    if (cached && Date.now() - cached.timestamp < US_CACHE_TTL) {
      return { ...cached.data, cache_hit: true };
    }
    return null;
  }

  cacheUSRateAndReturn(key, data) {
    US_RATE_CACHE.set(key, {
      data,
      timestamp: Date.now()
    });
    return data;
  }

  /**
   * Helpers
   */
  getCountryName(code) {
    const names = {
      'US': 'United States',
      'CA': 'Canada',
      'MX': 'Mexico',
      'CN': 'China',
      'TW': 'Taiwan',
      'KR': 'South Korea',
      'JP': 'Japan',
      'VN': 'Vietnam',
      'TH': 'Thailand'
    };
    return names[code] || code;
  }

  formatError(message) {
    return {
      status: 'error',
      message,
      agent_version: this.version,
      timestamp: new Date().toISOString()
    };
  }
}

export default TariffResearchAgent;
