import { BaseAgent } from './base-agent.js';
import { createClient } from '@supabase/supabase-js';
import { logDevIssue, DevIssue } from '../utils/logDevIssue.js';

export class ClassificationAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Classification',
      model: 'anthropic/claude-haiku-4.5',  // Haiku 4.5 is perfect for simple HS code classification (fast + cheap + smarter)
      maxTokens: 2000  // ✅ FIX (Nov 8): Increased from 1200 - prompt is too long, was truncating JSON responses
    });

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async suggestHSCode(productDescription, componentOrigins = [], additionalContext = {}) {
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

    // ❌ TEMPORARILY DISABLED (Nov 8, 2025): Agent-level classification cache
    //
    // const cachedClassification = await this.checkClassificationCache(
    //   productDescription,
    //   componentOrigins[0].origin_country
    // );
    //
    // if (cachedClassification) {
    //   console.log(`✅ [CLASSIFICATION CACHE HIT] Reusing cached HS code for "${productDescription}": ${cachedClassification.hs_code} (used ${cachedClassification.times_used} times)`);
    //
    //   await this.incrementCacheUsage(cachedClassification.id);
    //
    //   return {
    //     success: true,
    //     data: {
    //       hs_code: cachedClassification.hs_code,
    //       description: cachedClassification.hs_description,
    //       confidence: cachedClassification.confidence_score * 100,
    //       classification_methodology: cachedClassification.classification_source,
    //       explanation: cachedClassification.ai_reasoning || 'Cached classification from previous analysis',
    //       usmcaQualification: 'possible',
    //       source: 'classification_cache',
    //       cache_hit: true,
    //       times_used: cachedClassification.times_used + 1
    //     }
    //   };
    // }

    console.log('⚠️ Classification cache disabled - making fresh AI classification call...');

    // Extract component data for analysis
    const componentData = componentOrigins.length > 0
      ? `Component: ${componentOrigins[0].description}
Origin Country: ${componentOrigins[0].origin_country}
Value Percentage: ${componentOrigins[0].value_percentage}%`
      : 'No component details provided';

    const usmcaCountries = ['US', 'MX', 'CA', 'USA', 'MEX', 'CAN'];
    const isUSMCAOrigin = componentOrigins.length > 0 &&
      usmcaCountries.includes(componentOrigins[0].origin_country?.toUpperCase());

    const prompt = `PRODUCT CONTEXT:
Final Product: ${additionalContext.overallProduct}
Industry: ${additionalContext.industryContext}${additionalContext.manufacturingProcess ? `\nManufacturing: ${additionalContext.manufacturingProcess}` : ''}${additionalContext.substantialTransformation ? '\nSubstantial transformation occurs after import' : ''}${additionalContext.previouslyClassifiedComponents && additionalContext.previouslyClassifiedComponents.length > 0 ? `\nOther components: ${additionalContext.previouslyClassifiedComponents.map(c => c.hs_code).join(', ')}` : ''}

COMPONENT TO CLASSIFY:
"${productDescription}"
Origin: ${componentOrigins[0].origin_country}${additionalContext.destinationCountry ? `
Destination: ${additionalContext.destinationCountry}` : ''}
Value: ${componentOrigins[0].value_percentage}%

CONTEXT: Business owners use this data to calculate tariff costs and USMCA qualification. Wrong HS code =
wrong tariff rate = wrong financial projections = business closes. These are real companies facing bankruptcy
from Trump tariffs. Accuracy is life-or-death.

========================================
YOUR TASK: ANALYZE → SEARCH → VALIDATE → RETURN
========================================

Read the component description carefully and reason about what you're classifying BEFORE searching.

STEP 1: ANALYZE THE COMPONENT (Think through this)
----------------------------------------------------
Ask yourself these questions:

• What is this component MADE OF? (material determines chapter)

  ❗ MULTI-MATERIAL COMPONENTS:
  If component has multiple materials, ask yourself:

  "Which material gives this component its ESSENTIAL CHARACTER?"
  → Is it the material with the most weight/mass? (usually the right answer)
  → OR is it the material that makes the component actually WORK? (function trumps weight)
  → If genuinely unclear which material dominates: Search for "composite" or "mixed material" codes
  → Mark confidence "medium" and explain material composition in justification

• What FORM is it in RIGHT NOW? (not what it will become)
  - Is it raw/unwrought material? (.01/.02 codes)
  - Is it waste/scrap/damaged? (.30 codes - ONLY if truly waste)
  - Is it a worked/semi-finished form? (.40-.80 codes)
  - Is it a finished article/manufactured part? (.90+ codes)

• How PROCESSED is it?
  - Words like "forged, machined, heat-treated, coated" = WORKED/FINISHED forms
  - Words like "cut to size, basic shaping" = SEMI-FINISHED forms
  - Words like "unwrought, as-extracted, as-produced" = RAW MATERIAL
  - Words like "scrap, off-cuts, turnings, waste" = WASTE/SCRAP

• What is its PRIMARY FUNCTION?
  - Functional parts (pumps, motors, electronics) often have specific machinery chapters
  - Structural parts are typically classified by their material

STEP 2: SEARCH STRATEGICALLY (Based on your analysis)
------------------------------------------------------
Now use search_database with keywords that match your analysis:

• If your analysis says "this is a worked form" → Search "worked articles [material]"
  AND avoid codes with "waste" or "scrap" in the description

• If your analysis says "this is a finished part" → Search "articles [material]" or search by function
  AND target .90+ subheadings

• If your analysis says "this is a semi-finished form" → Search "bars rods wire [material]"
  AND target .40-.80 subheadings

• If your analysis says "this is truly waste/scrap" → Search "waste scrap [material]"
  AND target .30 codes

The database has 12,118 codes. Search with clear, specific keywords based on what you analyzed.

STEP 3: VALIDATE YOUR RESULTS (Critical - don't skip)
------------------------------------------------------
After search_database returns results, use this DECISION TREE:

┌─────────────────────────────────────────────────────────────┐
│ VALIDATION DECISION TREE (check in order)                    │
└─────────────────────────────────────────────────────────────┘

1. MATERIAL CHECK
   ❓ Does the HTS description mention the PRIMARY MATERIAL you identified in Step 1?
      ✅ YES → Proceed to Form Check
      ❌ NO → REJECT, search using the material name you identified in Step 1

2. FORM CHECK
   ❓ Does the HTS description match the FORM you identified?

      Ask yourself: "Does the HTS description language match my Step 1 analysis?"

      If you analyzed "worked/machined form":
        → HTS MUST say "articles", "worked", "parts", "processed"
        → HTS must NOT say "scrap", "waste", "unwrought", "crude"

      If you analyzed "raw material":
        → HTS MUST say "unwrought", "ingots", "billets", "crude", "unprocessed"
        → HTS must NOT say "articles", "parts", "worked", "finished"

      If you analyzed "waste/scrap":
        → HTS MUST say "waste", "scrap", "turnings", "cuttings", "off-cuts"
        → HTS must NOT say "articles", "worked", "finished"

      ✅ MATCH → Proceed to Specificity Check
      ❌ MISMATCH → REJECT, search with different keywords combining form + material from your Step 1 analysis

3. SPECIFICITY CHECK
   ❓ If multiple codes seem valid, which is MOST SPECIFIC?

   Ask yourself:
   • Does one code say "other" or "not elsewhere specified" and the other has a precise description?
     → Choose the PRECISE one (avoid catch-all "other" categories)

   • Does one code describe the actual FUNCTION and the other is just a generic material/parts category?
     → Choose the FUNCTIONAL description (machinery chapters beat generic "articles of [material]")

   • Are both equally specific?
     → Choose the one with the more detailed HTS description that matches your Step 1 analysis

4. MULTIPLE VALID CODES?
   If 2+ codes seem equally valid:
   ❓ Is one code duty-free and the other has a tariff?
      → Lean toward the TARIFF-BEARING code (customs will challenge the convenient choice)
      → Mark confidence "medium" and list both alternatives in response

   ❓ Are both codes in same chapter with similar rates?
      → Choose the MORE SPECIFIC description
      → Mark confidence "high" if descriptions align closely

If validation fails ANY check: DON'T return that code. Search again with refined keywords from failed check.

STEP 4: BIAS CHECK (Critical for duty-free results)
----------------------------------------------------
If your chosen code shows 0.0% tariff rate (duty-free), ask yourself:

"Am I choosing this code because it's ACCURATE, or because it's CONVENIENT?"

Duty-free codes are perfectly valid - many products ARE genuinely 0.0%. But question yourself:
• Are there OTHER valid codes with higher tariffs that I'm overlooking?
• Is this the MOST SPECIFIC code, or am I settling for a broader category?
• Would customs challenge this classification as "too convenient"?

If you find alternative codes with higher rates that ALSO match:
• Compare specificity (more specific = better, even if higher tariff)
• Document why you rejected the higher-tariff alternative
• Lower your confidence score if the choice is ambiguous

This isn't about avoiding duty-free codes - it's about ensuring accuracy when convenient results appear.

STEP 5: RETURN YOUR CLASSIFICATION
------------------------------------
Return ONLY this JSON structure (example format with placeholders):

{
  "hs_code": "8108.90.60",
  "description": "Other articles of titanium",
  "confidence": 85,
  "primary_material": "titanium",
  "explanation": "Step 1: Analyzed as titanium (material) + worked/machined form (forged and machined means worked articles, not raw/scrap). Step 2: Searched 'titanium worked articles' and 'titanium forgings'. Step 3: Material check passed (titanium in Chapter 81), form check passed (description says 'articles' not 'scrap' or 'unwrought'), chose most specific subheading. Step 4: Considered alternatives in Chapter 73/76 but primary material is titanium so Chapter 81 correct. Confidence: 85% because forging could be classified under .30 or .90 subheadings depending on interpretation.",
  "validation_passed": true,
  "bias_check_notes": null,
  "alternative_codes": [
    {"code": "8108.30.00", "confidence": 70, "reason": "Could apply if considered 'other forms' but .90 is more specific for worked articles"}
  ]
}

Replace the example values with YOUR analysis for the actual component.

CONFIDENCE SCORING:
• 90-100%: Perfect match, validation passed, no ambiguous alternatives
• 80-89%: Good match, validation passed, considered alternatives, choice is defensible
• 70-79%: Reasonable match, validation passed, but alternatives exist with similar strength
• Below 70%: Uncertain, multiple valid interpretations, recommend expert review

Your explanation should show your complete reasoning chain using this structure:

"Step 1: I analyzed this component as [material + form + function analysis]
Step 2: I searched for [keywords based on analysis]
Step 3: I validated that [HTS description] matches my analysis because [material check passed, form check passed, specificity reasoning]
Step 4: [If duty-free: I checked alternative codes with tariffs and chose this because...] OR [If has tariff: This is the most specific match]
Confidence: [score]% because [reasoning for uncertainty if any]"

Remember: Accuracy over convenience. If a component legitimately fits multiple codes, choose the MOST SPECIFIC one - even if it has a higher tariff rate. Customs authorities expect this level of precision.`;

    const tools = [
      {
        type: 'function',
        function: {
          name: 'search_database',
          description: 'Search local database (12,118 codes)',
          parameters: {
            type: 'object',
            properties: {
              keywords: { type: 'string' },
              chapter: { type: 'string' },
              heading: { type: 'string' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'search_usitc_api',
          description: 'Search USITC official API if database has no results',
          parameters: {
            type: 'object',
            properties: {
              keywords: { type: 'string', description: 'Product keywords' }
            }
          }
        }
      }
    ];

    const toolHandler = async (name, args) => {
      if (name === 'search_database') {
        return await this.searchHTSDatabase(args);
      }
      if (name === 'search_usitc_api') {
        const usitcService = require('../services/usitc-api-service.js');
        return await usitcService.searchHTS(args.keywords);
      }
      throw new Error(`Unknown tool: ${name}`);
    };

    const result = await this.execute(prompt, {
      productDescription,
      componentOrigins,
      temperature: 0.3,
      tools,
      toolHandler
    });

    if (result.success && result.data.hs_code) {
      // Verify AI's code against database
      const verification = await this.searchHTSDatabase({ exact_code: result.data.hs_code });
      if (!verification.found) {
        console.warn(`⚠️ [CLASSIFICATION] Code ${result.data.hs_code} not in database - AI generated`);
        result.data.confidence = Math.min(result.data.confidence || 70, 70);
      }

      // ✅ Validate material-chapter consistency
      const validation = this.validateMaterialChapterMatch(
        result.data.hs_code,
        productDescription,
        result.data.primary_material,
        result.data.material_chapter_match
      );

      if (!validation.valid) {
        console.warn(`⚠️ [CLASSIFICATION] Material-chapter mismatch detected:`, validation);

        // Apply confidence penalty for material mismatch
        const originalConfidence = result.data.confidence || 50;
        result.data.confidence = Math.min(originalConfidence, 50); // Cap at 50%

        // Add warning to explanation
        result.data.explanation = `⚠️ MATERIAL MISMATCH WARNING: ${validation.warning}\n\n${result.data.explanation}`;
        result.data.audit_risk = 'high';
        result.data.material_validation = validation;
      } else {
        result.data.material_validation = { valid: true, message: 'Material and chapter match correctly' };
      }

      // ✅ NEW (Nov 6, 2025): Cache the classification result (permanent - no expiration)
      await this.saveClassificationToCache(
        productDescription,
        result.data,
        componentOrigins[0].origin_country,
        additionalContext
      );
    }

    this.logInteraction(prompt, result, result.success);

    return result;
  }

  /**
   * Check classification cache for existing HS code classification
   * @private
   */
  async checkClassificationCache(description, originCountry) {
    try {
      // Normalize description for matching
      const normalized = description.toLowerCase().trim().replace(/\s+/g, ' ');

      const { data, error } = await this.supabase
        .from('hs_classification_cache')
        .select('*')
        .eq('component_description_normalized', normalized)
        .eq('origin_country', originCountry)
        .single();

      if (error && error.code !== 'PGRST116') {  // PGRST116 = no rows
        console.error('[ClassificationAgent] Cache query error:', error.message);
        return null;
      }

      return data || null;

    } catch (error) {
      console.error('[ClassificationAgent] Failed to check classification cache:', error.message);
      return null; // Don't block on cache failure
    }
  }

  /**
   * Save classification to permanent cache
   * @private
   */
  async saveClassificationToCache(description, classificationData, originCountry, additionalContext) {
    try {
      const { error } = await this.supabase
        .from('hs_classification_cache')
        .insert({
          component_description: description,
          hs_code: classificationData.hs_code,
          hs_description: classificationData.description,
          confidence_score: (classificationData.confidence || 50) / 100, // Convert 85 → 0.85
          origin_country: originCountry,
          product_category: additionalContext.overallProduct || null,
          industry_sector: additionalContext.industryContext || null,
          classification_source: 'ai_classification',
          ai_model: this.model || 'anthropic/claude-haiku-4.5',
          ai_reasoning: classificationData.explanation || null,
          times_used: 1,
          classified_at: new Date().toISOString()
        });

      if (error) {
        console.error('[ClassificationAgent] Failed to cache classification:', error.message);
        // Don't throw - cache failure shouldn't block user workflow
      } else {
        console.log(`✓ [CLASSIFICATION CACHED] Saved "${description}" → ${classificationData.hs_code}`);
      }

    } catch (error) {
      console.error('[ClassificationAgent] Cache save error:', error.message);
      // Don't throw - cache failure shouldn't block user workflow
    }
  }

  /**
   * Increment usage counter for cached classification
   * @private
   */
  async incrementCacheUsage(cacheId) {
    try {
      const { error } = await this.supabase.rpc('increment_classification_usage', {
        p_id: cacheId
      });

      if (error) {
        console.error('[ClassificationAgent] Failed to increment cache usage:', error.message);
      }

    } catch (error) {
      console.error('[ClassificationAgent] Cache usage increment error:', error.message);
      // Silent fail - usage tracking is not critical
    }
  }

  /**
   * Search HTS database for AI tool use
   * @private
   */
  async searchHTSDatabase(args) {
    try {
      const { chapter, heading, keywords, exact_code } = args;

      // Search by exact code
      if (exact_code) {
        const normalized = exact_code.replace(/[.\s-]/g, '');
        const { data } = await this.supabase
          .from('tariff_intelligence_master')
          .select('hts8, brief_description')
          .eq('hts8', normalized)
          .limit(1);

        return {
          found: data && data.length > 0,
          codes: data || [],
          search_type: 'exact_code'
        };
      }

      // Search by heading (first 4 digits)
      if (heading) {
        const { data } = await this.supabase
          .from('tariff_intelligence_master')
          .select('hts8, brief_description')
          .like('hts8', `${heading}%`)
          .limit(10);

        return {
          found: data && data.length > 0,
          codes: data || [],
          search_type: 'heading'
        };
      }

      // Search by chapter (first 2 digits)
      if (chapter) {
        const { data } = await this.supabase
          .from('tariff_intelligence_master')
          .select('hts8, brief_description')
          .like('hts8', `${chapter}%`)
          .limit(20);

        return {
          found: data && data.length > 0,
          codes: data || [],
          search_type: 'chapter'
        };
      }

      // Search by keywords in description
      if (keywords) {
        const { data } = await this.supabase
          .from('tariff_intelligence_master')
          .select('hts8, brief_description')
          .ilike('brief_description', `%${keywords}%`)
          .limit(10);

        return {
          found: data && data.length > 0,
          codes: data || [],
          search_type: 'keywords'
        };
      }

      return { found: false, codes: [], search_type: 'no_criteria' };

    } catch (error) {
      console.error('[ClassificationAgent] Database search error:', error.message);
      return { found: false, codes: [], error: error.message };
    }
  }

  // REMOVED: verifyHSCodeExists() - AI now has database access via tools, no post-verification needed

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

  /**
   * Extract primary material from product description
   * @param {string} description - Product description
   * @returns {string|null} Primary material keyword or null
   */
  extractPrimaryMaterial(description) {
    if (!description) return null;

    const descLower = description.toLowerCase();

    // Material keyword mapping (order matters - more specific first)
    const materialMap = {
      'aluminum': ['aluminum', 'aluminium', 'al-alloy', 'die-cast aluminum'],
      'steel': ['steel', 'stainless steel', 'carbon steel', 'alloy steel'],
      'iron': ['iron', 'cast iron', 'wrought iron'],
      'plastic': ['plastic', 'polymer', 'polyethylene', 'polypropylene', 'pvc', 'abs', 'nylon'],
      'copper': ['copper', 'brass', 'bronze'],
      'rubber': ['rubber', 'elastomer', 'silicone rubber'],
      'textile': ['fabric', 'textile', 'cloth', 'woven', 'cotton', 'polyester', 'wool'],
      'glass': ['glass', 'tempered glass', 'laminated glass'],
      'ceramic': ['ceramic', 'porcelain'],
      'wood': ['wood', 'timber', 'plywood', 'mdf'],
      'electronic': ['semiconductor', 'microchip', 'ic', 'pcb', 'circuit board'],
      'composite': ['composite', 'carbon fiber', 'fiberglass']
    };

    // Check each material category
    for (const [material, keywords] of Object.entries(materialMap)) {
      for (const keyword of keywords) {
        if (descLower.includes(keyword)) {
          return material;
        }
      }
    }

    return null; // Material not identified
  }

  /**
   * Validate material-chapter consistency
   * @param {string} hsCode - Classified HS code
   * @param {string} description - Product description
   * @param {string} aiMaterial - Material identified by AI
   * @param {boolean} aiMatch - AI's self-assessment of match
   * @returns {Object} Validation result
   */
  validateMaterialChapterMatch(hsCode, description, aiMaterial, aiMatch) {
    if (!hsCode || hsCode.length < 2) {
      return { valid: true, message: 'HS code too short to validate' };
    }

    const chapter = hsCode.substring(0, 2);

    // ✅ SKIP validation for functional component chapters (electronics/machinery/instruments)
    const functionalChapters = ['84', '85', '90', '91'];
    if (functionalChapters.includes(chapter)) {
      return {
        valid: true,
        message: `Chapter ${chapter} is functional classification (electronics/machinery) - material validation skipped`,
        chapter: chapter,
        componentType: 'functional'
      };
    }

    const extractedMaterial = this.extractPrimaryMaterial(description);

    // Material-to-chapter mapping (for structural components only)
    const materialChapterMap = {
      'aluminum': ['76'],
      'steel': ['72', '73'],
      'iron': ['72', '73'],
      'plastic': ['39'],
      'copper': ['74'],
      'rubber': ['40'],
      'textile': ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63'],
      'glass': ['70'],
      'ceramic': ['69'],
      'wood': ['44']
    };

    // If AI provided material, use it; otherwise use extracted
    const primaryMaterial = aiMaterial || extractedMaterial;

    if (!primaryMaterial) {
      // No material detected - could be a finished good or complex assembly
      return { valid: true, message: 'Material not explicitly stated - likely finished good classification' };
    }

    const validChapters = materialChapterMap[primaryMaterial.toLowerCase()] || [];

    if (validChapters.length === 0) {
      return { valid: true, message: `Material "${primaryMaterial}" classification - no specific validation rule` };
    }

    if (!validChapters.includes(chapter)) {
      return {
        valid: false,
        warning: `Structural component with "${primaryMaterial}" material should use Chapter ${validChapters.join('/')}, but HS code ${hsCode} uses Chapter ${chapter}`,
        expectedChapters: validChapters,
        actualChapter: chapter,
        detectedMaterial: primaryMaterial,
        descriptionSnippet: description.substring(0, 100),
        componentType: 'structural'
      };
    }

    return {
      valid: true,
      message: `Material "${primaryMaterial}" correctly matches Chapter ${chapter}`,
      detectedMaterial: primaryMaterial,
      chapter: chapter,
      componentType: 'structural'
    };
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