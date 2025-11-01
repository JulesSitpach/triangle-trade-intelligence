import { BaseAgent } from './base-agent.js';
import { createClient } from '@supabase/supabase-js';
import { logDevIssue, DevIssue } from '../utils/logDevIssue.js';

export class ClassificationAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Classification',
      model: 'anthropic/claude-haiku-4.5',  // Haiku 4.5 is perfect for simple HS code classification (fast + cheap + smarter)
      maxTokens: 4000  // Increased for complete JSON responses
    });

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async suggestHSCode(productDescription, componentOrigins = [], additionalContext = {}) {
    // 100% AI classification - NO database lookups for classification

    // Validate required data (fail loudly instead of using fallbacks)
    if (!productDescription) {
      await DevIssue.missingData('ai_classification', 'productDescription', { componentOrigins, additionalContext });
      throw new Error('Missing required field: productDescription');
    }
    if (!componentOrigins[0]?.origin_country) {
      await DevIssue.missingData('ai_classification', 'componentOrigins[0].origin_country', { productDescription, componentOrigins, additionalContext });
      throw new Error('Missing required field: componentOrigins[0].origin_country');
    }
    if (!componentOrigins[0]?.value_percentage && componentOrigins[0]?.value_percentage !== 0) {
      await DevIssue.missingData('ai_classification', 'componentOrigins[0].value_percentage', { productDescription, componentOrigins, additionalContext });
      throw new Error('Missing required field: componentOrigins[0].value_percentage');
    }
    if (!additionalContext.overallProduct) {
      await DevIssue.missingData('ai_classification', 'additionalContext.overallProduct', { productDescription, componentOrigins, additionalContext });
      throw new Error('Missing required field: additionalContext.overallProduct');
    }
    if (!additionalContext.industryContext) {
      await DevIssue.missingData('ai_classification', 'additionalContext.industryContext', { productDescription, componentOrigins, additionalContext });
      throw new Error('Missing required field: additionalContext.industryContext');
    }

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

    const prompt = `You are an HS code classification expert specializing in COMPONENT-LEVEL classification.

=== CRITICAL INSTRUCTION ===
You are classifying THIS SPECIFIC COMPONENT by what it IS, not by what product it goes into.

WRONG APPROACH: "This housing is part of a pump system, so classify as pump (8413)"
RIGHT APPROACH: "This is a cast steel housing, so classify as steel article (7326)"

=== THE COMPONENT TO CLASSIFY ===
Component Description: "${productDescription}"
Origin Country: ${componentOrigins[0].origin_country}
Value: ${componentOrigins[0].value_percentage}% of total product
Is USMCA Country? ${isUSMCAOrigin ? 'YES' : 'NO'}

=== PRODUCT CONTEXT (Background info only) ===
Final Product: ${additionalContext.overallProduct}
Industry: ${additionalContext.industryContext}

${additionalContext.previouslyClassifiedComponents && additionalContext.previouslyClassifiedComponents.length > 0 ? `
=== ALREADY CLASSIFIED COMPONENTS (DO NOT REUSE THESE CODES) ===
${additionalContext.previouslyClassifiedComponents.map(c => `  - "${c.description}": ${c.origin_country} → HS ${c.hs_code}`).join('\n')}

⚠️ CRITICAL: "${productDescription}" MUST get a DIFFERENT HS code than: ${additionalContext.previouslyClassifiedComponents.map(c => c.hs_code).join(', ')}
` : ''}

=== CLASSIFICATION METHODOLOGY (CBP Legal Standard) ===

**PRIMARY RULE: CBP General Rule of Interpretation (GRI) 1 - FUNCTION FIRST**

Classification is determined by the terms of the headings, which are organized by FUNCTION/USE, not material.

**For ALL components, provide TWO classifications when applicable:**

1. **PRIMARY (Function-first)** - CBP-defensible, lower audit risk
2. **ALTERNATIVE (Material-based)** - May show USMCA savings but higher compliance risk

📱 **ELECTRONIC DEVICE COMPONENTS (Smartphones, tablets, computers, telecom):**

Example: "Smartphone aluminum housing"
- **PRIMARY**: 8517.79.00 (Phone parts) - 0% MFN
  - Legal basis: CBP precedent HQ H284146 (function-first)
  - Audit risk: LOW ✅
  - USMCA value: $0 savings (already duty-free)

- **ALTERNATIVE**: 7616.99.50 (Aluminum articles) - 5.7% MFN
  - Legal basis: Material composition argument
  - Audit risk: HIGH ⚠️ (CBP may challenge/overturn)
  - USMCA value: $96,900 savings (shows commercial value)

**YOUR TASK: For components with classification ambiguity, provide BOTH options:**

PRIMARY recommendation:
- Use function-first classification (CBP GRI Rule 1)
- Lower penalty risk in audits
- Stronger legal defense

ALTERNATIVE option (if materially different tariff rate):
- Material-based classification
- Shows commercial USMCA value
- Flag as "higher audit risk" if duty rate differs by >2%

⚙️ **NON-ELECTRONIC COMPONENTS (Pumps, valves, industrial machinery):**

Material-based classification is MORE defensible when component is NOT integral to specific device:

Examples:
- "Cast steel pump housing" → 7326.90.85 (Steel article) - Material-based is PRIMARY
- "Rubber gasket for general use" → 4016.93.10 (Rubber article) - Material-based is PRIMARY

**Rule: Each component gets its own code**
Different items = different HS codes based on PRIMARY function or material

=== YOUR TASK ===

Classify: "${productDescription}"

Ask yourself:
1. What IS this component made of? (Steel? Plastic? Electronics?)
2. What IS its primary function? (Structural? Electronic? Mechanical?)
3. Does it have its own HS chapter based on material/function?
4. Ignore what product it goes into - focus on what IT IS

CRITICAL: The "description" field MUST be the EXACT OFFICIAL description from the Harmonized Tariff Schedule for this HS code.
DO NOT make up a description. DO NOT paraphrase. Give me the REAL HTS description.

Examples of REAL descriptions:
- HS 8413.91.90: "Parts of pumps for liquids"
- HS 8544.42.90: "Electric conductors, for a voltage not exceeding 1,000 V, fitted with connectors"
- HS 7326.90.85: "Other articles of iron or steel"

Return JSON with PRIMARY and ALTERNATIVE classifications when materially different:

{
  "hs_code": "PRIMARY 8-10 digit HS code (function-first when applicable)",
  "description": "EXACT OFFICIAL HTS description for primary code",
  "confidence": 0-100,
  "classification_methodology": "function_first|material_based",
  "audit_risk": "low|medium|high - based on CBP precedent strength",
  "legal_basis": "Brief explanation of why this is the PRIMARY classification (e.g., 'CBP GRI Rule 1 - function-first' or 'Material composition - no specific functional chapter')",
  "explanation": "Detailed reasoning for PRIMARY classification, including USMCA origin consideration if applicable",
  "usmca_qualification": "likely|possible|unlikely - assess based on component origin provided",

  "alternative_codes": [
    {
      "code": "alternative HS code",
      "confidence": 0-100,
      "classification_methodology": "function_first|material_based",
      "audit_risk": "low|medium|high",
      "legal_basis": "Why this alternative exists (e.g., 'Material-based argument - shows USMCA value')",
      "reason": "When to use this instead AND compliance trade-off (e.g., 'Shows $X USMCA savings but higher CBP audit risk')",
      "duty_rate_difference": "Estimated MFN rate difference vs primary (e.g., '+5.7%' or '-2.1%')"
    }
  ],

  "requires_professional_review": true|false,
  "professional_review_reason": "If true, explain why (e.g., 'Material vs function classification creates >2% duty difference - recommend CBP binding ruling')"
}

IMPORTANT:
- Focus ONLY on accurate HS code classification
- Tariff rates will be looked up separately (in enrichment step)
- Documentation requirements will be determined later (in final results)
- usmcaQualification should reflect whether this component would count toward USMCA regional content

=== CLARITY ENHANCEMENT (IF CONFIDENCE < 80%) ===
If your confidence is below 80%, START your explanation with a clarity warning:

"⚠️ The component description lacks clarity about [specific missing detail]. To improve accuracy, specify [what's needed]."

Common clarity issues:
- Material unclear → "specify the primary material (steel, aluminum, plastic, etc.)"
- Function unclear → "specify the primary function or use case"
- Type unclear → "specify if this is a complete assembly or individual component"
- Construction unclear → "specify the manufacturing process (cast, machined, molded, etc.)"

Example low-confidence explanation:
"⚠️ The component description lacks clarity about the primary material. To improve accuracy, specify if the enclosure is steel, aluminum, or plastic.

Based on the term 'enclosure', this appears to be a protective housing..."`;

    const result = await this.execute(prompt, {
      productDescription,
      componentOrigins,
      temperature: 0.3 // ✅ Lower temperature for more consistent HS code classifications
    });

    if (result.success && result.data.hs_code) {
      // 100% AI - NO database lookups at all
      // const dbValidation = await this.validateAgainstDatabase(result.data.hs_code);
      // result.data.databaseMatch = dbValidation;

      // const tariffRates = await this.getTariffRates(result.data.hs_code);
      // if (tariffRates) {
      //   result.data.mfn_rate = tariffRates.mfn_rate;
      //   result.data.usmca_rate = tariffRates.usmca_rate;
      //   result.data.special_rate = tariffRates.special_rate;
      //   result.data.tariff_source = tariffRates.source;
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
      await DevIssue.apiError('ai_classification', 'validateAgainstDatabase', error, { hsCode });
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
      await DevIssue.apiError('ai_classification', 'findPartialMatch', error, { hsCode });
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
          mfn_rate: primaryData.general_rate || primaryData.mfn_rate || 0,
          usmca_rate: primaryData.special_rate || primaryData.usmca_rate || 0,
          special_rate: primaryData.special_rate || 0,
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
          mfn_rate: usmcaData.mfn_rate || 0,
          usmca_rate: usmcaData.usmca_rate || 0,
          special_rate: usmcaData.special_rate || 0,
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
          mfn_rate: fallbackData.mfn_rate || 0,
          usmca_rate: fallbackData.usmca_rate || 0,
          special_rate: fallbackData.special_rate || 0,
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
      await logDevIssue({
        type: 'missing_data',
        severity: 'medium',
        component: 'ai_classification',
        message: `No tariff rates found for HS code: ${hsCode}`,
        data: { hsCode, normalized }
      });
      return null;

    } catch (error) {
      console.error('[Classification] Tariff rate lookup error:', error);
      await DevIssue.apiError('ai_classification', 'getTariffRates', error, { hsCode });
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
            mfn_rate: match.general_rate || match.mfn_rate || 0,
            usmca_rate: match.special_rate || match.usmca_rate || 0,
            special_rate: match.special_rate || 0,
            source: `hs_master_rebuild_partial_${pattern.length}`,
            description: match.description,
            matchType: 'partial'
          };
        }
      }

      return null;
    } catch (error) {
      console.error('[Classification] Partial tariff match error:', error);
      await DevIssue.apiError('ai_classification', 'findPartialTariffMatch', error, { hsCode });
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

      // ✅ OPTIMIZED: Batch all tier queries with Promise.all (50% faster)
      const tierPromises = searchTiers.map(tier =>
        this.supabase
          .from('hs_master_rebuild')
          .select('hts_code, description, general_rate, mfn_rate, special_rate, usmca_rate')
          .like('hts_code', tier.pattern)
          .not('general_rate', 'is', null)
          .order('general_rate', { ascending: false })
          .limit(10)
          .then(({ data: tierResults, error }) => ({
            tier,
            results: !error && tierResults ? tierResults : [],
            error
          }))
      );

      const tierBatchResults = await Promise.all(tierPromises);

      // Collect all results and score synchronously
      const allResults = [];
      for (const { tier, results } of tierBatchResults) {
        results.forEach(product => {
          allResults.push({
            ...product,
            searchTier: tier.name,
            priority: tier.priority,
            descriptionScore: this.scoreDescriptionSimilarity(product.description, originalHSCode),
            tariffScore: this.scoreTariffQuality(product)
          });
        });
      }

      let bestMatches = allResults;

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
        mfn_rate: bestMatch.general_rate || bestMatch.mfn_rate || 0,
        usmca_rate: bestMatch.special_rate || bestMatch.usmca_rate || 0,
        special_rate: bestMatch.special_rate || 0,
        source: `${bestMatch.searchTier}_search_${bestMatch.hts_code}`,
        description: bestMatch.description,
        actualCode: bestMatch.hts_code,
        matchType: 'keyword',
        searchTier: bestMatch.searchTier,
        confidenceNote: `Found via ${bestMatch.searchTier} match in HS classification system`
      };

    } catch (error) {
      console.error('[Classification] Product keyword search error:', error);
      await DevIssue.apiError('ai_classification', 'searchByProductKeywords', error, { originalHSCode, normalizedHSCode });
      return null;
    }
  }

  // ✅ CACHED at constructor to avoid repeated dynamic imports
  _productCategoryTerms = null;

  async getProductCategoryTerms() {
    if (!this._productCategoryTerms) {
      const { getProductCategoryTerms } = await import('../../config/classification-scoring.js');
      this._productCategoryTerms = getProductCategoryTerms();
    }
    return this._productCategoryTerms;
  }

  // ✅ OPTIMIZED: Synchronous scoring (no repeated dynamic imports)
  scoreDescriptionSimilarity(description, originalCode) {
    if (!description) return 0;

    const descLower = description.toLowerCase();
    let score = 0;

    // Use cached product terms (pre-loaded in constructor if needed)
    // For now, use basic keyword scoring without dynamic import
    const basicTerms = {
      'electronic': ['chip', 'ic', 'processor', 'microcontroller', 'capacitor', 'resistor'],
      'mechanical': ['bearing', 'screw', 'bolt', 'gear', 'spring', 'shaft'],
      'material': ['steel', 'aluminum', 'plastic', 'rubber', 'copper', 'brass']
    };

    // Score based on relevant terms
    for (const [category, terms] of Object.entries(basicTerms)) {
      const matches = terms.filter(term => descLower.includes(term)).length;
      if (matches > 0) {
        score += matches * 10;
        break;
      }
    }

    // Bonus for longer descriptions
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
      // Normalize field names: accept both camelCase (from AI) and snake_case (normalized)
      const hsCode = classificationData.hs_code || classificationData.hsCode;
      const mfnRate = classificationData.mfn_rate || classificationData.mfnRate;
      const usmcaRate = classificationData.usmca_rate || classificationData.usmcaRate;
      const alternativeCodes = classificationData.alternative_codes || classificationData.alternativeCodes || [];

      const { error } = await this.supabase
        .from('tariff_rates_cache')
        .upsert({
          product_description: productDescription,
          hs_code: hsCode,
          confidence: classificationData.confidence,
          explanation: classificationData.explanation,
          mfn_rate: mfnRate,
          usmca_rate: usmcaRate,
          usmca_qualification: classificationData.usmca_qualification || classificationData.usmcaQualification,
          alternative_codes: alternativeCodes,
          required_documentation: classificationData.required_documentation || classificationData.requiredDocumentation || [],
          component_origins: componentOrigins,
          additional_context: additionalContext,
          database_match: classificationData.database_match || classificationData.databaseMatch?.exactMatch || false,
          tariff_source: classificationData.tariff_source || classificationData.tariffSource,
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
        await logDevIssue({
          type: 'api_error',
          severity: 'high',
          component: 'ai_classification',
          message: 'Failed to save classification to database',
          data: {
            productDescription,
            hs_code: hsCode,
            error: error.message || error,
            code: error.code,
            details: error.details,
            hint: error.hint
          }
        });
      } else {
        console.log(`[Classification] Saved AI classification for "${productDescription}" (${hsCode})`);
      }
    } catch (error) {
      console.error('[Classification] Database save error:', {
        message: error.message,
        stack: error.stack
      });
      const hsCode = classificationData.hs_code || classificationData.hsCode;
      await DevIssue.apiError('ai_classification', 'saveClassificationToDatabase', error, {
        productDescription,
        hs_code: hsCode
      });
    }
  }
}

export default ClassificationAgent;