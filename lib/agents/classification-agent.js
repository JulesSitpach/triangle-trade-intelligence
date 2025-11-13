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

    const prompt = `You are classifying HS codes for a small business owner who depends on accuracy for their survival. Wrong classification = bankruptcy from incorrect tariffs.

CRITICAL CONTEXT - THIS IS A COMPONENT, NOT THE FINAL PRODUCT:
Final Product Being Built: ${additionalContext.overallProduct}
Industry: ${additionalContext.industryContext}

COMPONENT YOU'RE CLASSIFYING (part of the above final product):
Description: "${productDescription}"
Function: Component that will be INCORPORATED INTO "${additionalContext.overallProduct}"
Processing: ${additionalContext.substantialTransformation ? 'Substantially transformed (forged/machined/processed)' : 'Standard manufacturing'}
Origin: ${componentOrigins[0].origin_country} → Destination: ${additionalContext.destinationCountry || 'Not specified'}

⚠️ IMPORTANT: You are classifying the COMPONENT itself, not the final assembled product.
Example: A "junction box for solar panels" is classified as electrical equipment (Chapter 85),
NOT as a solar panel (Chapter 85.41). The final product's industry helps you understand
the component's PURPOSE and intended use. Classify based on what the component IS,
considering how it will be incorporated into "${additionalContext.overallProduct}".

YOUR EXPERT PROCESS (Universal 2-question decision tree for ANY industry):

1. IDENTIFY WHAT THIS IS:
   Read: "${productDescription}"

   **QUESTION A: What is the BASE CATEGORY?**
   Look for key words that tell you WHAT this thing fundamentally is:
   - Fastener words: bolt, screw, nut, rivet, washer, pin
   - Chemical words: coating, paint, adhesive, compound, treatment, preparation
   - Machinery words: pump, motor, cylinder, engine, valve, gear
   - Electronic words: circuit board, chip, semiconductor, resistor, capacitor, sensor
   - Textile words: fabric, cloth, thread, yarn, woven, knitted
   - Food/Ag words: vegetable, fruit, grain, meat, dairy, sugar
   - Metal part words: forged, cast, machined, fabricated, worked (with metal name)

   **QUESTION B: What is the FORM/PROCESSING level?**
   This determines which chapter within the category:

   FOR MANUFACTURED GOODS (fasteners, machinery, electronics):
   - STANDARD PRODUCT (off-the-shelf, industry specs, commodity)?
     * Example: "M10x1.5 bolts" (standard metric size) → Function chapter (73)
     * Example: "2N2222 transistor" (standard part number) → Function chapter (85)
     * → Use FUNCTION chapter, material only refines

   - CUSTOM-MADE (designed for specific application, non-standard)?
     * Example: "Precision-machined titanium strut for regional aircraft" → Material chapter (81)
     * Example: "Custom forged aluminum housing with FAA certification" → Material chapter (76)
     * → Use MATERIAL chapter

   FOR FOOD/AGRICULTURAL:
   - RAW/FRESH (minimal processing, natural state)?
     * Example: "Fresh tomatoes" → Chapter 07 (Edible vegetables)
     * Example: "Raw cotton fibers" → Chapter 52 (Cotton)
     * → Use raw material chapter

   - TRANSFORMED (cooked, preserved, processed, prepared)?
     * Example: "Boiled tomatoes for salsa" → Chapter 20 (Preparations of vegetables)
     * Example: "Canned corn" → Chapter 20 (Preparations)
     * → Use preparations/processed chapter
     * Context: ${additionalContext.substantialTransformation ? 'User indicates substantial transformation' : 'Standard form'}

   FOR CHEMICALS:
   - COMMERCIAL PRODUCT (standard formulation, branded product)?
     * Example: "Alodine 1200S chromate coating" → Chapter 32/38 (Chemical preparations)
     * → Use chemical chapter

   - RAW CHEMICAL (element, basic compound)?
     * Example: "Chromic acid" → Chapter 28 (Inorganic chemicals)
     * → Use inorganic/organic chemical chapter

2. THEN identify the MATERIAL (for refinement):
   - Material REFINES the code within the chapter you chose in Step 1
   - Example: Standard bolts (Chapter 73) → Titanium bolts (7318.15) vs Steel bolts (7318.12)
   - Example: Fresh vegetables (Chapter 07) → Tomatoes (0702) vs Peppers (0709)

3. SYNTHESIZE your analysis:
   - Base category: [what you identified from keyword matching]
   - Form/Processing: [standard/custom/raw/transformed]
   - Chapter decision: [function chapter OR material chapter OR raw chapter OR preparations chapter]
   - Material: [for refinement within chapter]
   - Specifications: [any relevant specs like "M10x1.5", "Grade 5", "Alodine 1200S", etc.]

4. SEARCH for the correct code (using your Step 3 synthesis):
   - Build search keywords from your analysis:

     * Example 1: "Titanium bolts M10x1.5, Grade 5" →
       - Base: FASTENER (bolt, screw keywords)
       - Form: STANDARD (M10x1.5 = standard metric size)
       - Chapter: 73 (function chapter - fasteners)
       - Keywords: "bolts screws fasteners titanium threaded"
       - Expected result: 7318.15.xx (titanium screws/bolts)

     * Example 2: "Precision-machined titanium landing gear strut" →
       - Base: METAL PART (forged, machined keywords)
       - Form: CUSTOM (precision-machined for specific aircraft)
       - Chapter: 81 (material chapter - worked titanium)
       - Keywords: "titanium articles worked forged machined strut"
       - Expected result: 8108.90.60 (other worked titanium articles)

     * Example 3: "Chromate coating Alodine 1200S for aluminum" →
       - Base: CHEMICAL (coating, treatment keywords)
       - Form: COMMERCIAL PRODUCT (Alodine = branded product)
       - Chapter: 32/38 (chemical preparations)
       - Keywords: "chromate coating chemical conversion treatment"
       - Ignore: "aluminum" (that's what it's APPLIED TO, not the product itself)
       - Expected result: 3824.90.xx (chemical surface treatments)

     * Example 4: "Fresh tomatoes" vs "Boiled tomatoes for salsa" →
       - Fresh: Base=VEGETABLE, Form=RAW → Chapter 07, Keywords: "tomatoes fresh vegetables"
       - Boiled: Base=VEGETABLE, Form=TRANSFORMED → Chapter 20, Keywords: "tomatoes prepared preserved cooked"

   - **CRITICAL: Call BOTH search tools at the same time (parallel search):**
     1. search_database with your function-based keywords
     2. search_usitc_api with FULL analysis:
        * keywords: [function] + [material] + [form]
        * component_analysis: { material, function, form, processing, specifications }

   - After BOTH tools return results, compare them:
     * If database has exact match for your function/material → Use it
     * If database only has wrong material → Use USITC result
     * If USITC has more specific code → Use USITC result
     * Pick the code that best matches your Step 1-3 analysis

   - Return JSON immediately after comparing (NO additional searches)

5. VALIDATE your choice:
   - HTS description MUST match the FUNCTION you identified in Step 1
   - Material in HTS description MUST match material from Step 2
   - Form must match processing level from Step 3 (finished article vs raw vs scrap)
   - Choose the most SPECIFIC code (avoid generic "other" categories)
   - If code is duty-free (0%), double-check it's accurate (not just convenient)

6. RETURN your classification:
{
  "hs_code": "1234.56.78",
  "description": "Official HTS description",
  "confidence": 85,
  "primary_material": "identified material",
  "explanation": "FUNCTION: [category] (Chapter XX), MATERIAL: [material name], FORM: [processing level]. Searched: [keywords]. Confidence [X]% because [reasoning about function/material/form match].",
  "validation_passed": true,
  "bias_check_notes": null,
  "alternative_codes": [{"code": "alt.code", "confidence": 60, "reason": "why considered"}]
}

Example explanations:
- "FUNCTION: Fastener (Chapter 73), MATERIAL: Titanium Grade 5, FORM: Finished threaded articles. Searched: 'bolts fasteners titanium threaded'. Confidence 85% because HTS 7318.15.20 matches titanium screws/bolts."
- "FUNCTION: Chemical coating (Chapter 38), MATERIAL: Chromate compound (Alodine), FORM: Prepared chemical. Searched: 'chromate coating chemical treatment'. Confidence 78% because HTS 3824.90 matches chemical surface treatments."

CRITICAL RULES FOR ACCURACY:
- NEVER return text responses - ONLY valid JSON
- ALWAYS call BOTH search_database AND search_usitc_api together (parallel search)
- After BOTH tools return, compare results and pick best match
- IMMEDIATELY return JSON after comparing (NO "Let me search more" statements)
- NEVER make sequential tool calls - call both at once, then return JSON
- Material in HTS description MUST match component material
- Function in HTS description MUST match component function (Step 1)
- Lower confidence (<70%) when uncertain - business owner will get expert review
- If all searches fail: return best-guess based on function category with confidence 40-50%

This business owner is counting on you. Be thorough, be accurate, be honest about confidence levels.`;

    const tools = [
      {
        type: 'function',
        function: {
          name: 'search_database',
          description: 'Search local HTS database (12,118 codes). ALWAYS call this AND search_usitc_api together in parallel - do not call sequentially.',
          parameters: {
            type: 'object',
            properties: {
              keywords: {
                type: 'string',
                description: 'Product keywords from your Step 1 analysis (e.g., "titanium articles", "steel worked", "plastic molded")'
              },
              chapter: {
                type: 'string',
                description: 'First 2 digits of HTS chapter (e.g., "81" for titanium, "39" for plastics)'
              },
              heading: {
                type: 'string',
                description: 'First 4 digits of HTS heading (e.g., "8108" for titanium articles)'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'search_usitc_api',
          description: 'Search official USITC government database (17,000+ codes). ALWAYS call this AND search_database together in parallel to compare results. Include full component analysis.',
          parameters: {
            type: 'object',
            properties: {
              keywords: {
                type: 'string',
                description: 'Primary search keywords: [material] + [function/form] (e.g., "titanium bolts fasteners")'
              },
              component_analysis: {
                type: 'object',
                description: 'Full component analysis from Step 1 - helps USITC match the right code',
                properties: {
                  material: { type: 'string', description: 'Primary material (e.g., "titanium Grade 5")' },
                  function: { type: 'string', description: 'What component does (e.g., "threaded fasteners")' },
                  form: { type: 'string', description: 'Physical form (e.g., "finished articles", "raw material", "semi-finished")' },
                  processing: { type: 'string', description: 'Processing level (e.g., "machined, surface coated", "forged", "cast")' },
                  specifications: { type: 'string', description: 'Relevant specs (e.g., "M10x1.5, cadmium plated, mil-spec QQ-P-416")' }
                }
              }
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
        // Use new USITC DataWeb API (correct POST endpoint) with AI fallback
        const { verifyTariffRates } = await import('../services/tariff-verification-service.js');

        // Log full context being sent to USITC
        console.log('🔍 [USITC] AI synthesized component analysis:', {
          keywords: args.keywords,
          material: args.component_analysis?.material,
          function: args.component_analysis?.function,
          form: args.component_analysis?.form,
          processing: args.component_analysis?.processing,
          specs: args.component_analysis?.specifications
        });

        // For classification, we don't have HS code yet - just keywords
        // So we'll use the tariff verification service in "search mode"
        // It will try USITC search → AI fallback if USITC down
        try {
          // Build a synthetic HS code from keywords for USITC search
          // The verification service will handle USITC → AI fallback
          const description = `${args.component_analysis?.function || ''} ${args.component_analysis?.material || ''} ${args.keywords}`.trim();

          // Since we don't have HS code yet, we'll just return database search results
          // and let AI synthesize. USITC verification happens post-classification.
          console.log('⚠️ [USITC] Skipping USITC search during classification - will verify after HS code selected');

          return {
            success: true,
            results: [],
            message: 'USITC verification deferred until after HS code selection',
            component_context: args.component_analysis
          };
        } catch (error) {
          console.error('❌ [USITC] Error:', error.message);
          return {
            success: false,
            results: [],
            message: `USITC error: ${error.message}`,
            component_context: args.component_analysis
          };
        }
      }
      throw new Error(`Unknown tool: ${name}`);
    };

    const result = await this.execute(prompt, {
      productDescription,
      componentOrigins,
      temperature: 0.1,  // ✅ Lowered from 0.3 for maximum consistency (less randomness in classifications)
      tools,
      toolHandler
    });

    if (result.success && result.data.hs_code) {
      // Verify AI's code against database FIRST
      const dbVerification = await this.searchHTSDatabase({ exact_code: result.data.hs_code });

      if (!dbVerification.found) {
        console.warn(`⚠️ [CLASSIFICATION] Code ${result.data.hs_code} not in database - attempting USITC verification with AI fallback`);

        // Use USITC → AI fallback verification
        const { verifyTariffRates } = await import('../services/tariff-verification-service.js');

        try {
          const verification = await verifyTariffRates(
            result.data.hs_code,
            productDescription,
            componentOrigins[0]?.origin_country
          );

          if (verification) {
            console.log(`✅ [CLASSIFICATION] Verified ${result.data.hs_code} via ${verification.tier}: ${(verification.confidence * 100).toFixed(0)}% confidence`);

            // Use verified confidence if higher than AI's original
            const originalConfidence = result.data.confidence || 70;
            const verifiedConfidence = Math.round(verification.confidence * 100);

            if (verifiedConfidence > originalConfidence) {
              result.data.confidence = verifiedConfidence;
              result.data.explanation = result.data.explanation.replace(
                /Confidence \d+%/g,
                `Confidence ${verifiedConfidence}%`
              );
              result.data.explanation += ` (Confidence increased to ${verifiedConfidence}% via ${verification.data_source} verification)`;
            }

            // Add verification metadata
            result.data.verification_source = verification.data_source;
            result.data.verification_tier = verification.tier;
            result.data.verified_hs_code = verification.hts8;
          } else {
            // Verification failed - cap confidence
            const originalConfidence = result.data.confidence || 70;
            result.data.confidence = Math.min(originalConfidence, 70);

            if (result.data.explanation && originalConfidence > 70) {
              result.data.explanation = result.data.explanation.replace(
                /Confidence \d+%/g,
                `Confidence ${result.data.confidence}%`
              );
              result.data.explanation += ` (Note: Confidence capped at 70% - HS code not in database and USITC/AI verification unavailable)`;
            }
          }
        } catch (error) {
          console.error(`❌ [CLASSIFICATION] Verification failed:`, error.message);
          // On verification error, cap confidence
          const originalConfidence = result.data.confidence || 70;
          result.data.confidence = Math.min(originalConfidence, 70);
        }
      } else {
        console.log(`✅ [CLASSIFICATION] Code ${result.data.hs_code} found in database`);
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
      console.log('🔍 [Classification] search_database called with:', args);
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