import { BaseAgent } from './base-agent.js';
import { createClient } from '@supabase/supabase-js';

export class ClassificationAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Classification',
      model: 'anthropic/claude-3-haiku',  // Haiku is perfect for simple HS code classification (fast + cheap)
      maxTokens: 4000  // Increased for complete JSON responses
    });

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async suggestHSCode(productDescription, componentOrigins = [], additionalContext = {}) {
    // 100% AI classification - NO database lookups for classification

    console.log('🔍 Classification AI received additionalContext:', {
      overallProduct: additionalContext.overallProduct,
      industryContext: additionalContext.industryContext,
      hasContext: Object.keys(additionalContext).length > 0
    });

    // Extract component data for analysis
    const componentData = componentOrigins.length > 0
      ? `Component: ${componentOrigins[0].description}
Origin Country: ${componentOrigins[0].origin_country}
Value Percentage: ${componentOrigins[0].value_percentage}%`
      : 'No component details provided';

    const usmcaCountries = ['US', 'MX', 'CA', 'USA', 'MEX', 'CAN'];
    const isUSMCAOrigin = componentOrigins.length > 0 &&
      usmcaCountries.includes(componentOrigins[0].origin_country?.toUpperCase());

    const prompt = `Classify this component and provide the REAL OFFICIAL HS code description from the Harmonized Tariff Schedule.

=== PRODUCT CONTEXT ===
Overall Product: ${additionalContext.overallProduct || 'Not provided'}
Industry Sector: ${additionalContext.industryContext || 'Not provided'}

=== COMPONENT BEING CLASSIFIED ===
Component Description: ${productDescription}
${componentData}

USMCA Context:
- This component originates from: ${componentOrigins[0]?.origin_country || 'Unknown'}
- Is USMCA country (US/MX/CA)? ${isUSMCAOrigin ? 'YES' : 'NO'}
- Component represents ${componentOrigins[0]?.value_percentage || 0}% of product value
${additionalContext.previouslyClassified && additionalContext.previouslyClassified.length > 0 ? `
=== PREVIOUSLY CLASSIFIED COMPONENTS (ALREADY ASSIGNED HS CODES) ===
${additionalContext.previouslyClassified.map(c => `  - ${c.description}: ${c.origin_country} (${c.value_percentage}%) → HS CODE: ${c.hs_code}`).join('\n')}

CRITICAL: You MUST classify "${productDescription}" with a DIFFERENT HS code than the ones above.
Different components have different HS codes based on their specific construction and function.
DO NOT reuse ${additionalContext.previouslyClassified.map(c => c.hs_code).join(', ')} for this component.
` : ''}

${additionalContext.allComponents && additionalContext.allComponents.length > 0 ? `
=== OTHER COMPONENTS IN THIS PRODUCT (Not yet classified) ===
${additionalContext.allComponents.map(c => `  - ${c.description}: ${c.origin} (${c.percentage}%)`).join('\n')}
` : ''}

Task: Determine the most accurate HS code based on:
1. **Overall product context** - This component is part of: "${additionalContext.overallProduct}"
2. **Component's function** - How does "${productDescription}" fit into the overall product?
3. **Industry sector** - ${additionalContext.industryContext || 'General Manufacturing'}
4. **Harmonized Tariff Schedule classification rules**
5. **Component origin for USMCA qualification assessment**

IMPORTANT CLASSIFICATION GUIDANCE:
- Use the MOST SPECIFIC HS code available - avoid general "parts" categories when more specific codes exist
- Consider how this component relates to the OVERALL PRODUCT: "${additionalContext.overallProduct}"
- Different components of the same product often have DIFFERENT HS codes based on their specific function and construction
- Example: For "High-pressure hydraulic pumps":
  * "Cast steel pump housing" → 8413.70.20 (specific pump assembly parts) NOT generic 8413.91.90
  * "Precision machined internal components" → 8487.90.00 (machinery parts NES) if they're multi-purpose precision parts
  * "Hydraulic seals" → 4016.93.00 (rubber gaskets) NOT pump parts
- Example: For "Electronic control system":
  * "Circuit board" → 8537.10.90 (electronic control panels)
  * "Wiring harness" → 8544.42.90 (electric conductors)
- Each component should be classified based on its SPECIFIC construction and function, not just its role in the overall product

CRITICAL: The "description" field MUST be the EXACT OFFICIAL description from the Harmonized Tariff Schedule for this HS code.
DO NOT make up a description. DO NOT paraphrase. Give me the REAL HTS description.

Examples of REAL descriptions:
- HS 8413.91.90: "Parts of pumps for liquids"
- HS 8544.42.90: "Electric conductors, for a voltage not exceeding 1,000 V, fitted with connectors"
- HS 7326.90.85: "Other articles of iron or steel"

Return JSON:
{
  "hsCode": "8-10 digit HS code",
  "description": "EXACT OFFICIAL HTS description - NOT a paraphrase",
  "confidence": 0-100,
  "explanation": "detailed reasoning for this classification, including USMCA origin consideration if applicable",
  "usmcaQualification": "likely|possible|unlikely - assess based on component origin provided",
  "alternativeCodes": [
    {
      "code": "alternative code",
      "confidence": 0-100,
      "reason": "when to use this instead"
    }
  ],
  "requiredDocumentation": ["doc1", "doc2"]
}

IMPORTANT:
- Focus ONLY on accurate HS code classification
- Tariff rates will be looked up separately
- usmcaQualification should reflect whether this component would count toward USMCA regional content`;

    const result = await this.execute(prompt, {
      productDescription,
      componentOrigins
    });

    if (result.success && result.data.hsCode) {
      // 100% AI - NO database lookups at all
      // const dbValidation = await this.validateAgainstDatabase(result.data.hsCode);
      // result.data.databaseMatch = dbValidation;

      // const tariffRates = await this.getTariffRates(result.data.hsCode);
      // if (tariffRates) {
      //   result.data.mfnRate = tariffRates.mfnRate;
      //   result.data.usmcaRate = tariffRates.usmcaRate;
      //   result.data.specialRate = tariffRates.specialRate;
      //   result.data.tariffSource = tariffRates.source;
      // }

      // await this.saveClassificationToDatabase(productDescription, result.data, componentOrigins, additionalContext);
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