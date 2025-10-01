import { BaseAgent } from './base-agent.js';
import { createClient } from '@supabase/supabase-js';

export class ClassificationAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Classification',
      model: 'claude-3-haiku-20240307',
      maxTokens: 2000
    });

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async suggestHSCode(productDescription, componentOrigins = [], additionalContext = {}) {
    const similarCodes = await this.searchSimilarHSCodes(productDescription);

    const prompt = `Classify this product and suggest the correct HS code for USMCA compliance.

Product Description: ${productDescription}

Component Origins: ${JSON.stringify(componentOrigins, null, 2)}

Additional Context: ${JSON.stringify(additionalContext, null, 2)}

Similar HS codes from database (for reference):
${JSON.stringify(similarCodes.slice(0, 5), null, 2)}

Task: Determine the most accurate HS code based on:
1. Product description and technical specifications
2. Harmonized Tariff Schedule classification rules
3. Component origins for USMCA qualification
4. Similar products in our database (34,476 codes)

Return JSON:
{
  "hsCode": "8-10 digit HS code",
  "confidence": 0-100,
  "explanation": "detailed reasoning for this classification",
  "usmcaQualification": "likely|possible|unlikely",
  "alternativeCodes": [
    {
      "code": "alternative code",
      "confidence": 0-100,
      "reason": "when to use this instead"
    }
  ],
  "requiredDocumentation": ["doc1", "doc2"],
  "tariffRate": "estimated rate if known"
}`;

    const result = await this.execute(prompt, {
      productDescription,
      componentOrigins,
      similarCodesFound: similarCodes.length
    });

    if (result.success && result.data.hsCode) {
      const dbValidation = await this.validateAgainstDatabase(result.data.hsCode);
      result.data.databaseMatch = dbValidation;

      // Add tariff rates for USMCA calculations
      const tariffRates = await this.getTariffRates(result.data.hsCode);
      if (tariffRates) {
        result.data.mfnRate = tariffRates.mfnRate;
        result.data.usmcaRate = tariffRates.usmcaRate;
        result.data.specialRate = tariffRates.specialRate;
        result.data.tariffSource = tariffRates.source;
      }

      // Save AI classification to database for future reference
      await this.saveClassificationToDatabase(productDescription, result.data, componentOrigins, additionalContext);
    }

    this.logInteraction(prompt, result, result.success);

    return result;
  }

  async searchSimilarHSCodes(productDescription) {
    try {
      const keywords = this.extractKeywords(productDescription);
      console.log(`[Classification] Searching with keywords: ${keywords.join(', ')} for "${productDescription}"`);

      // Multi-strategy search for better matches
      const searchStrategies = [
        // Strategy 1: Exact keyword matches
        {
          query: this.supabase
            .from('hs_master_rebuild')
            .select('*')
            .or(keywords.map(kw => `description.ilike.%${kw}%`).join(',')),
          weight: 3
        },

        // Strategy 2: Product-specific searches
        {
          query: this.getProductSpecificSearch(productDescription),
          weight: 5
        }
      ];

      let allResults = [];

      for (const strategy of searchStrategies) {
        if (strategy.query) {
          const { data, error } = await strategy.query.limit(15);

          if (!error && data) {
            // Add weight to results
            const weightedResults = data.map(item => ({
              ...item,
              searchWeight: strategy.weight,
              matchedKeywords: this.countMatchingKeywords(item.description, keywords)
            }));
            allResults.push(...weightedResults);
          }
        }
      }

      // Remove duplicates and sort by relevance
      const uniqueResults = this.deduplicateAndRank(allResults, keywords, productDescription);

      console.log(`[Classification] Found ${uniqueResults.length} similar codes, top matches:`,
                  uniqueResults.slice(0, 3).map(r => ({ code: r.hts_code, desc: r.description?.substring(0, 60) + '...', weight: r.relevanceScore })));

      return uniqueResults.slice(0, 10); // Return top 10
    } catch (error) {
      console.error('[Classification] Search error:', error);
      return [];
    }
  }

  async getProductSpecificSearch(productDescription) {
    const desc = productDescription.toLowerCase();

    // Fruit-specific searches
    if (desc.includes('mango')) {
      return this.supabase
        .from('hs_master_rebuild')
        .select('*')
        .or('hts_code.like.0804%,description.ilike.%mango%,description.ilike.%fruit%')
        .not('general_rate', 'is', null);
    }

    // Electronics
    if (desc.includes('electronic') || desc.includes('circuit') || desc.includes('wire')) {
      return this.supabase
        .from('hs_master_rebuild')
        .select('*')
        .or('hts_code.like.85%,description.ilike.%electronic%,description.ilike.%circuit%')
        .not('general_rate', 'is', null);
    }

    // Textiles
    if (desc.includes('cotton') || desc.includes('shirt') || desc.includes('fabric')) {
      return this.supabase
        .from('hs_master_rebuild')
        .select('*')
        .or('hts_code.like.61%,hts_code.like.62%,description.ilike.%cotton%,description.ilike.%shirt%')
        .not('general_rate', 'is', null);
    }

    // Food packaging
    if (desc.includes('packaging') || desc.includes('container')) {
      return this.supabase
        .from('hs_master_rebuild')
        .select('*')
        .or('hts_code.like.39%,description.ilike.%packaging%,description.ilike.%container%')
        .not('general_rate', 'is', null);
    }

    // Generic fallback
    return null;
  }

  countMatchingKeywords(description, keywords) {
    if (!description) return 0;
    const descLower = description.toLowerCase();
    return keywords.filter(kw => descLower.includes(kw.toLowerCase())).length;
  }

  deduplicateAndRank(results, keywords, productDescription) {
    // Remove duplicates by hts_code
    const uniqueMap = new Map();

    results.forEach(item => {
      const existing = uniqueMap.get(item.hts_code);
      if (!existing || item.searchWeight > existing.searchWeight) {
        uniqueMap.set(item.hts_code, item);
      }
    });

    // Calculate relevance score and rank
    return Array.from(uniqueMap.values())
      .map(item => ({
        ...item,
        relevanceScore: this.calculateRelevanceScore(item, keywords, productDescription)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  calculateRelevanceScore(item, keywords, productDescription) {
    let score = 0;

    // Base search weight
    score += (item.searchWeight || 1) * 10;

    // Keyword matches in description
    score += (item.matchedKeywords || 0) * 15;

    // Has tariff rates (prefer items with actual rates)
    if (item.general_rate && item.general_rate > 0) score += 20;
    if (item.special_rate !== null) score += 15;

    // Length of description (more detailed = better)
    if (item.description) {
      score += Math.min(item.description.length / 10, 10);
    }

    // Product-specific bonuses
    const desc = productDescription.toLowerCase();
    const itemDesc = item.description?.toLowerCase() || '';

    if (desc.includes('mango') && itemDesc.includes('mango')) score += 50;
    if (desc.includes('fresh') && itemDesc.includes('fresh')) score += 30;
    if (desc.includes('frozen') && itemDesc.includes('frozen')) score += 30;

    return Math.round(score);
  }

  extractKeywords(description) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];

    const words = description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));

    return [...new Set(words)].slice(0, 5);
  }

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

  async validateHSCode(hsCode, productDescription) {
    const prompt = `Validate if HS code ${hsCode} is correct for this product.

Product Description: ${productDescription}

Task: Check if this HS code assignment is accurate based on:
1. Product characteristics vs HS code definition
2. Harmonized Tariff Schedule rules
3. Common classification errors
4. Industry best practices

Return JSON:
{
  "valid": true|false,
  "confidence": 0-100,
  "issues": [
    {
      "severity": "error|warning|info",
      "message": "description of issue"
    }
  ],
  "recommendation": "keep code|suggest alternative|need expert review",
  "alternativeCode": "suggested code if applicable"
}`;

    const result = await this.execute(prompt, {
      hsCode,
      productDescription
    });

    const dbCheck = await this.validateAgainstDatabase(hsCode);
    if (result.success) {
      result.data.databaseValidation = dbCheck;
    }

    return result;
  }

  async suggestWithConfidenceBreakdown(productDescription, componentOrigins) {
    const result = await this.suggestHSCode(productDescription, componentOrigins);

    if (!result.success) return result;

    const confidenceFactors = {
      productClarity: this.assessProductClarity(productDescription),
      databaseMatch: result.data.databaseMatch?.confidence || 0,
      componentConsistency: this.assessComponentConsistency(componentOrigins),
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

  assessProductClarity(description) {
    let score = 50;

    if (description.length > 100) score += 20;
    if (description.length > 200) score += 10;

    const technicalTerms = ['voltage', 'material', 'dimensions', 'weight', 'capacity', 'specification'];
    const foundTerms = technicalTerms.filter(term => description.toLowerCase().includes(term));
    score += foundTerms.length * 5;

    return Math.min(score, 100);
  }

  assessComponentConsistency(componentOrigins) {
    if (!componentOrigins || componentOrigins.length === 0) {
      return 30;
    }

    const usmcaCountries = ['US', 'CA', 'MX', 'United States', 'Canada', 'Mexico'];
    const usmcaComponents = componentOrigins.filter(comp =>
      usmcaCountries.some(country =>
        comp.origin?.toUpperCase().includes(country.toUpperCase())
      )
    );

    const usmcaPercentage = (usmcaComponents.length / componentOrigins.length) * 100;

    return usmcaPercentage > 60 ? 90 : usmcaPercentage > 40 ? 70 : 50;
  }

  async getAlternativeClassifications(productDescription, primaryHSCode) {
    const prompt = `The primary HS code suggestion for this product is ${primaryHSCode}.

Product: ${productDescription}

Task: Provide 2-3 alternative HS code classifications that might also be valid.
Consider:
1. Different interpretation angles
2. Edge cases and special circumstances
3. Regional classification variations
4. Common industry alternatives

Return JSON:
{
  "alternatives": [
    {
      "code": "HS code",
      "confidence": 0-100,
      "useCase": "when to use this instead of primary",
      "tradeoffs": "advantages and disadvantages"
    }
  ]
}`;

    const result = await this.execute(prompt, { productDescription, primaryHSCode });
    return result;
  }

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
          const scoredResults = tierResults.map(product => ({
            ...product,
            searchTier: tier.name,
            priority: tier.priority,
            descriptionScore: this.scoreDescriptionSimilarity(originalHSCode, product.description),
            tariffScore: this.scoreTariffQuality(product)
          }));

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

  scoreDescriptionSimilarity(originalCode, description) {
    if (!description) return 0;

    const descLower = description.toLowerCase();
    let score = 0;

    // Common product indicators
    const productTerms = {
      // Food & Agriculture (Chapter 08)
      food: ['fresh', 'fruit', 'mango', 'apple', 'banana', 'citrus', 'frozen', 'dried', 'canned'],
      // Electronics (Chapter 85)
      electronics: ['electronic', 'circuit', 'board', 'component', 'wire', 'cable', 'connector'],
      // Textiles (Chapters 61-62)
      textiles: ['cotton', 'shirt', 'clothing', 'apparel', 'fabric', 'textile', 'garment'],
      // Plastics (Chapter 39)
      plastics: ['plastic', 'polymer', 'packaging', 'container', 'film', 'sheet'],
      // Machinery (Chapter 84)
      machinery: ['machine', 'engine', 'pump', 'bearing', 'gear', 'motor'],
      // Automotive (Chapter 87)
      automotive: ['vehicle', 'car', 'automotive', 'truck', 'engine', 'part']
    };

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
        console.error('[Classification] Failed to save to database:', error);
      } else {
        console.log(`[Classification] Saved AI classification for "${productDescription}" (${classificationData.hsCode})`);
      }
    } catch (error) {
      console.error('[Classification] Database save error:', error);
    }
  }
}

export default ClassificationAgent;