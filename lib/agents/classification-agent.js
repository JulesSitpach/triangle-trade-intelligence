import { BaseAgent } from './base-agent.js';
import { createClient } from '@supabase/supabase-js';

export class ClassificationAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Classification',
      model: 'anthropic/claude-3-haiku',  // OpenRouter format
      maxTokens: 4000  // Increased for complete JSON responses
    });

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async suggestHSCode(productDescription, componentOrigins = [], additionalContext = {}) {
    // 100% AI classification - NO database lookups for classification
    const prompt = `Classify this product and suggest the correct HS code for USMCA compliance.

Product Description: ${productDescription}

Component Origins: ${JSON.stringify(componentOrigins, null, 2)}

Additional Context: ${JSON.stringify(additionalContext, null, 2)}

Task: Determine the most accurate HS code based on:
1. Product description and technical specifications
2. Harmonized Tariff Schedule classification rules
3. Component origins for USMCA qualification
4. Your knowledge of the HS classification system

IMPORTANT: Also provide estimated tariff rates based on your knowledge.

Return JSON:
{
  "hsCode": "8-10 digit HS code",
  "confidence": 0-100,
  "explanation": "detailed reasoning for this classification",
  "usmcaQualification": "likely|possible|unlikely",
  "mfnRate": "MFN tariff rate as decimal (e.g., 0.068 for 6.8%)",
  "usmcaRate": "USMCA preferential rate as decimal (e.g., 0 for duty-free)",
  "alternativeCodes": [
    {
      "code": "alternative code",
      "confidence": 0-100,
      "reason": "when to use this instead"
    }
  ],
  "requiredDocumentation": ["doc1", "doc2"]
}`;

    const result = await this.execute(prompt, {
      productDescription,
      componentOrigins
    });

    if (result.success && result.data.hsCode) {
      // Enrich AI result with database information
      const dbValidation = await this.validateAgainstDatabase(result.data.hsCode);
      result.data.databaseMatch = dbValidation;

      // Get tariff rates from database to enrich AI response
      const tariffRates = await this.getTariffRates(result.data.hsCode);
      if (tariffRates) {
        result.data.mfnRate = tariffRates.mfnRate;
        result.data.usmcaRate = tariffRates.usmcaRate;
        result.data.specialRate = tariffRates.specialRate;
        result.data.tariffSource = tariffRates.source;
      }

      // Save EVERYTHING (AI + database enrichment) for learning
      await this.saveClassificationToDatabase(productDescription, result.data, componentOrigins, additionalContext);
    }

    this.logInteraction(prompt, result, result.success);

    return result;
  }

  // NO DATABASE LOOKUPS - 100% AI classification via OpenRouter

  async validateAgainstDatabase(hsCode) {
    try {
      const normalized = hsCode.replace(/[\.\s\-]/g, '');

      const { data, error } = await this.supabase
        .from('hs_master_rebuild')
        .select('*')
        .eq('hts_code', normalized)
        .single();

      if (error || !data) {
        const partialMatch = await this.findPartialMatch(normalized);
        return {
          exactMatch: false,
          partialMatch: partialMatch !== null,
          matchedCode: partialMatch,
          confidence: partialMatch ? 60 : 0
        };
      }

      return {
        exactMatch: true,
        data: data,
        description: data.description,
        tariffRate: data.general_rate || data.special_rate,
        confidence: 95
      };
    } catch (error) {
      console.error('[Classification] Database validation error:', error);
      return { exactMatch: false, error: error.message };
    }
  }

  async findPartialMatch(hsCode) {
    try {
      const patterns = [
        hsCode.substring(0, 8),
        hsCode.substring(0, 6),
        hsCode.substring(0, 4)
      ];

      for (const pattern of patterns) {
        const { data } = await this.supabase
          .from('hs_master_rebuild')
          .select('*')
          .like('hts_code', `${pattern}%`)
          .limit(1);

        if (data && data.length > 0) {
          return data[0];
        }
      }

      return null;
    } catch (error) {
      console.error('[Classification] Partial match error:', error);
      return null;
    }
  }

  // REMOVED: validateHSCode - We trust AI classification on first pass (100% AI approach)

  async suggestWithConfidenceBreakdown(productDescription, componentOrigins) {
    const result = await this.suggestHSCode(productDescription, componentOrigins);

    if (!result.success) return result;

    const confidenceFactors = {
      productClarity: await this.assessProductClarity(productDescription),
      databaseMatch: result.data.databaseMatch?.confidence || 0,
      componentConsistency: await this.assessComponentConsistency(componentOrigins),
      aiConfidence: result.data.confidence || 50
    };

    const adjustedConfidence = (
      confidenceFactors.productClarity * 0.3 +
      confidenceFactors.databaseMatch * 0.3 +
      confidenceFactors.componentConsistency * 0.2 +
      confidenceFactors.aiConfidence * 0.2
    );

    result.data.confidenceBreakdown = confidenceFactors;
    result.data.adjustedConfidence = Math.round(adjustedConfidence);

    const escalation = this.shouldEscalateToExpert(
      result.data.adjustedConfidence,
      productDescription.length < 50 ? 'high' : 'medium'
    );

    result.data.expertRecommendation = escalation;

    return result;
  }

  async assessProductClarity(description) {
    let score = 50;

    if (description.length > 100) score += 20;
    if (description.length > 200) score += 10;

    const { getTechnicalTerms } = await import('../../config/classification-scoring.js');
    const technicalTerms = getTechnicalTerms();
    const foundTerms = technicalTerms.filter(term => description.toLowerCase().includes(term));
    score += foundTerms.length * 5;

    return Math.min(score, 100);
  }

  async assessComponentConsistency(componentOrigins) {
    if (!componentOrigins || componentOrigins.length === 0) {
      return 30;
    }

    const { getUSMCACountries } = await import('../../config/classification-scoring.js');
    const usmcaCountries = getUSMCACountries();
    const usmcaComponents = componentOrigins.filter(comp =>
      usmcaCountries.some(country =>
        comp.origin?.toUpperCase().includes(country.toUpperCase())
      )
    );

    const usmcaPercentage = (usmcaComponents.length / componentOrigins.length) * 100;

    return usmcaPercentage > 60 ? 90 : usmcaPercentage > 40 ? 70 : 50;
  }

  // REMOVED: getAlternativeClassifications - AI provides alternativeCodes in main classification (100% AI approach)

  async getTariffRates(hsCode) {
    try {
      const normalized = hsCode.replace(/[\.\s\-]/g, '');

      // Priority 1: hs_master_rebuild (PRIMARY - 34,476 codes with real tariff rates)
      const { data: primaryData, error: primaryError } = await this.supabase
        .from('hs_master_rebuild')
        .select('*')
        .eq('hts_code', normalized)
        .single();

      if (!primaryError && primaryData) {
        return {
          mfnRate: primaryData.general_rate || primaryData.mfn_rate || 0,
          usmcaRate: primaryData.special_rate || primaryData.usmca_rate || 0,
          specialRate: primaryData.special_rate || 0,
          source: 'hs_master_rebuild',
          description: primaryData.description,
          confidence: 95
        };
      }

      // Priority 2: usmca_tariff_rates (SECONDARY - Limited but high-quality data)
      const { data: usmcaData, error: usmcaError } = await this.supabase
        .from('usmca_tariff_rates')
        .select('*')
        .eq('hs_code', normalized)
        .single();

      if (!usmcaError && usmcaData) {
        return {
          mfnRate: usmcaData.mfn_rate || 0,
          usmcaRate: usmcaData.usmca_rate || 0,
          specialRate: usmcaData.special_rate || 0,
          source: 'usmca_tariff_rates',
          description: usmcaData.description,
          confidence: 90
        };
      }

      // Priority 3: tariff_rates (FALLBACK - Many 0% rates, use as last resort)
      const { data: fallbackData, error: fallbackError } = await this.supabase
        .from('tariff_rates')
        .select('*')
        .eq('hs_code', normalized)
        .single();

      if (!fallbackError && fallbackData && (fallbackData.mfn_rate > 0 || fallbackData.usmca_rate > 0)) {
        return {
          mfnRate: fallbackData.mfn_rate || 0,
          usmcaRate: fallbackData.usmca_rate || 0,
          specialRate: fallbackData.special_rate || 0,
          source: 'tariff_rates',
          description: fallbackData.description,
          confidence: 70
        };
      }

      // Try partial matches for shorter HS codes
      const partialTariff = await this.findPartialTariffMatch(normalized);
      if (partialTariff) {
        return {
          ...partialTariff,
          confidence: 60
        };
      }

      // Special fallback for common products
      const productKeywordSearch = await this.searchByProductKeywords(hsCode, normalized);
      if (productKeywordSearch) {
        console.log(`[Classification] Found tariff via product keywords for ${hsCode}:`, productKeywordSearch.source);
        return {
          ...productKeywordSearch,
          confidence: 50,
          note: 'Found via product keyword search'
        };
      }

      console.log(`[Classification] No tariff rates found for HS code: ${hsCode}`);
      return null;

    } catch (error) {
      console.error('[Classification] Tariff rate lookup error:', error);
      return null;
    }
  }

  async findPartialTariffMatch(hsCode) {
    try {
      const patterns = [
        hsCode.substring(0, 8),
        hsCode.substring(0, 6),
        hsCode.substring(0, 4)
      ];

      // Try hs_master_rebuild first for partial matches
      for (const pattern of patterns) {
        const { data } = await this.supabase
          .from('hs_master_rebuild')
          .select('*')
          .like('hts_code', `${pattern}%`)
          .not('general_rate', 'is', null)
          .limit(1);

        if (data && data.length > 0) {
          const match = data[0];
          return {
            mfnRate: match.general_rate || match.mfn_rate || 0,
            usmcaRate: match.special_rate || match.usmca_rate || 0,
            specialRate: match.special_rate || 0,
            source: `hs_master_rebuild_partial_${pattern.length}`,
            description: match.description,
            matchType: 'partial'
          };
        }
      }

      return null;
    } catch (error) {
      console.error('[Classification] Partial tariff match error:', error);
      return null;
    }
  }

  async searchByProductKeywords(originalHSCode, normalizedHSCode) {
    try {
      console.log(`[Classification] Keyword search for ${originalHSCode} (normalized: ${normalizedHSCode})`);

      // Extract chapter and heading patterns
      const chapter = normalizedHSCode.substring(0, 2);
      const heading = normalizedHSCode.substring(0, 4);
      const subheading = normalizedHSCode.substring(0, 6);

      // Multi-tier search strategy
      const searchTiers = [
        // Tier 1: Exact subheading match (most specific)
        {
          pattern: `${subheading}%`,
          name: 'subheading',
          priority: 100
        },
        // Tier 2: Heading match
        {
          pattern: `${heading}%`,
          name: 'heading',
          priority: 80
        },
        // Tier 3: Chapter match
        {
          pattern: `${chapter}%`,
          name: 'chapter',
          priority: 60
        }
      ];

      let bestMatches = [];

      for (const tier of searchTiers) {
        const { data: tierResults, error } = await this.supabase
          .from('hs_master_rebuild')
          .select('*')
          .like('hts_code', tier.pattern)
          .not('general_rate', 'is', null)
          .order('general_rate', { ascending: false }) // Prefer higher tariff items (more detailed classifications)
          .limit(10);

        if (!error && tierResults && tierResults.length > 0) {
          const scoredResults = await Promise.all(tierResults.map(async (product) => ({
            ...product,
            searchTier: tier.name,
            priority: tier.priority,
            descriptionScore: await this.scoreDescriptionSimilarity(originalHSCode, product.description),
            tariffScore: this.scoreTariffQuality(product)
          })));

          bestMatches.push(...scoredResults);
        }
      }

      if (bestMatches.length === 0) {
        console.log(`[Classification] No keyword matches found for ${originalHSCode}`);
        return null;
      }

      // Sort by combined score
      bestMatches.sort((a, b) => {
        const scoreA = a.priority + a.descriptionScore + a.tariffScore;
        const scoreB = b.priority + b.descriptionScore + b.tariffScore;
        return scoreB - scoreA;
      });

      const bestMatch = bestMatches[0];

      console.log(`[Classification] Best keyword match for ${originalHSCode}:`, {
        foundCode: bestMatch.hts_code,
        description: bestMatch.description?.substring(0, 80) + '...',
        tier: bestMatch.searchTier,
        totalScore: bestMatch.priority + bestMatch.descriptionScore + bestMatch.tariffScore
      });

      return {
        mfnRate: bestMatch.general_rate || bestMatch.mfn_rate || 0,
        usmcaRate: bestMatch.special_rate || bestMatch.usmca_rate || 0,
        specialRate: bestMatch.special_rate || 0,
        source: `${bestMatch.searchTier}_search_${bestMatch.hts_code}`,
        description: bestMatch.description,
        actualCode: bestMatch.hts_code,
        matchType: 'keyword',
        searchTier: bestMatch.searchTier,
        confidenceNote: `Found via ${bestMatch.searchTier} match in HS classification system`
      };

    } catch (error) {
      console.error('[Classification] Product keyword search error:', error);
      return null;
    }
  }

  async scoreDescriptionSimilarity(originalCode, description) {
    if (!description) return 0;

    const descLower = description.toLowerCase();
    let score = 0;

    // Load product terms from config
    const { getProductCategoryTerms } = await import('../../config/classification-scoring.js');
    const productTerms = getProductCategoryTerms();

    // Score based on relevant terms
    for (const [category, terms] of Object.entries(productTerms)) {
      const matches = terms.filter(term => descLower.includes(term)).length;
      if (matches > 0) {
        score += matches * 10; // 10 points per matching term
        break; // Only count the first matching category
      }
    }

    // Bonus for longer, more detailed descriptions
    if (description.length > 50) score += 5;
    if (description.length > 100) score += 5;

    return score;
  }

  scoreTariffQuality(product) {
    let score = 0;

    // Prefer non-zero tariff rates (more realistic)
    if (product.general_rate && product.general_rate > 0) score += 15;
    if (product.special_rate !== null && product.special_rate >= 0) score += 10;

    // Prefer rates that show clear preferential benefit
    if (product.general_rate && product.special_rate !== null) {
      const savings = product.general_rate - product.special_rate;
      if (savings > 0) score += Math.min(savings * 2, 20); // Up to 20 bonus points for savings
    }

    return score;
  }

  async saveClassificationToDatabase(productDescription, classificationData, componentOrigins, additionalContext) {
    try {
      const { error } = await this.supabase
        .from('ai_classifications')
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
          additional_context: additionalContext,
          database_match: classificationData.databaseMatch?.exactMatch || false,
          tariff_source: classificationData.tariffSource,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'product_description'
        });

      if (error) {
        console.error('[Classification] Failed to save to database:', {
          error: error.message || error,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      } else {
        console.log(`[Classification] Saved AI classification for "${productDescription}" (${classificationData.hsCode})`);
      }
    } catch (error) {
      console.error('[Classification] Database save error:', {
        message: error.message,
        stack: error.stack
      });
    }
  }
}

export default ClassificationAgent;