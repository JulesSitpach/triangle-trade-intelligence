/**
 * SIMPLIFIED Classification Agent - Reasoning over Rules
 * Uses actual AI intelligence instead of mechanical checklists
 */

import { BaseAgent } from './base-agent.js';
import { getSupabaseServiceClient } from '../database/supabase-client.js';
import { DevIssue } from '../utils/logDevIssue.js';

export class ClassificationAgentV2 extends BaseAgent {
  constructor() {
    super({
      name: 'Classification',
      model: 'anthropic/claude-haiku-4.5',
      maxTokens: 2000
    });
    this.supabase = getSupabaseServiceClient();
  }

  async suggestHSCode(productDescription, componentOrigins = [], additionalContext = {}) {
    // Validate critical fields
    if (!productDescription) {
      throw new Error('Missing required field: productDescription');
    }
    if (!componentOrigins[0]?.origin_country) {
      throw new Error('Missing required field: componentOrigins[0].origin_country');
    }
    if (!additionalContext.overallProduct) {
      throw new Error('Missing required field: additionalContext.overallProduct');
    }

    const prompt = `You are classifying HS codes for customs/tariff purposes.

⚠️ CRITICAL: YOU ARE CLASSIFYING THIS COMPONENT ONLY:
"${productDescription}"

DO NOT classify: "${additionalContext.overallProduct}"
That is the FINAL PRODUCT. You are classifying a COMPONENT that goes INTO that product.

Example: If you're classifying "steel screws" that go into a "bicycle",
classify the SCREWS (Chapter 73), NOT the bicycle (Chapter 87).

CONTEXT:
- This component is PART OF: ${additionalContext.overallProduct}
- Industry: ${additionalContext.industryContext}
- Component Origin: ${componentOrigins[0].origin_country}
- Final Destination: ${additionalContext.destinationCountry || 'Not specified'}

YOUR TASK:
1. Read "${productDescription}" carefully - classify ONLY what this component IS
2. Search database for matching codes (call search_database with keywords from the component description)
3. Pick the code that matches THE COMPONENT, not the final product
4. **CRITICAL**: If the description says "NON-X" (non-asbestos, non-electric, synthetic, etc.),
   DO NOT pick a code that says "containing X" or "natural" or the opposite.
   That's a contradiction - instant disqualification.

THINK LIKE A HUMAN:
- You understand context (just like you understand typos in messages)
- You recognize contradictions (NON-asbestos ≠ containing asbestos)
- Classify what the component IS, not what it's used FOR
- You explain your reasoning clearly

DATABASE SEARCH:
- You have access to search_database tool with 17,545 HTS codes
- Call it with simple keywords: "brake friction ceramic" or "steel fasteners"
- The database will return matching codes
- Pick the one that doesn't contradict the description

IMPORTANT VALIDATION CHECKS:
1. **Duty-Free Bias**: If you find a 0% duty code, double-check it's accurate (not just convenient)
2. **Material-Chapter Match**:
   - Aluminum components → Chapter 76
   - Steel/Iron components → Chapters 72 or 73
   - Plastic components → Chapter 39
   - Copper components → Chapter 74
   - EXCEPT: Electronics/Machinery (Ch 84, 85, 90, 91) classify by FUNCTION, not material
3. **Transformation Level**: ${additionalContext.substantialTransformation ? 'Component is substantially transformed (use processed/prepared chapters)' : 'Standard form (use raw/finished chapters)'}

RETURN FORMAT:
{
  "hs_code": "1234.56.78",
  "description": "Official HTS description from database",
  "confidence": 85,
  "primary_material": "steel" or "aluminum" or "plastic",
  "explanation": "This is brake friction material (Chapter 68). Database returned two codes: 6813.20.00 (asbestos) and 6813.81.00 (non-asbestos). Chose 6813.81.00 because description says 'non-asbestos' - cannot use a code that contradicts the input."
}

Use reasoning, not checklists. If it doesn't make sense, don't return it.`;

    const tools = [
      {
        type: 'function',
        function: {
          name: 'search_database',
          description: 'Search HTS database with keywords. Returns matching codes.',
          parameters: {
            type: 'object',
            properties: {
              keywords: {
                type: 'string',
                description: 'Search keywords like "brake friction ceramic" or "steel fasteners"'
              },
              chapter: {
                type: 'string',
                description: 'Optional: HTS chapter (first 2 digits) to narrow search'
              }
            },
            required: ['keywords']
          }
        }
      }
    ];

    try {
      // Use BaseAgent's execute() method with tools context
      // BaseAgent returns { success, data: parsed } - no need to parse again
      const result = await this.execute(prompt, {
        tools: tools,
        toolHandler: async (toolName, args) => {
          if (toolName === 'search_database') {
            return await this.searchDatabase(args);
          }
          throw new Error(`Unknown tool: ${toolName}`);
        },
        temperature: 0.1  // Low temperature for consistent classifications
      });

      // BaseAgent already parsed the response - now validate it
      if (result.success && result.data) {
        const classificationData = result.data;

        // ✅ VALIDATION 1: Check material-chapter consistency (prevent audit flags)
        const validation = this.validateMaterialChapter(
          classificationData.hs_code,
          productDescription,
          classificationData.primary_material
        );

        let finalConfidence = classificationData.confidence || 70;
        let auditRisk = 'low';

        if (!validation.valid) {
          console.warn(`⚠️ [V2] Material-chapter mismatch:`, validation.warning);

          // Apply confidence penalty for material mismatch
          finalConfidence = Math.min(finalConfidence, 50); // Cap at 50%
          auditRisk = 'high';

          // Add warning to explanation
          classificationData.explanation = `⚠️ MATERIAL MISMATCH WARNING: ${validation.warning}\n\n${classificationData.explanation}`;
        }

        // ✅ VALIDATION 2: Flag duty-free codes for extra scrutiny
        if (classificationData.hs_code &&
            classificationData.description &&
            classificationData.description.toLowerCase().includes('free')) {
          console.log(`⚠️ [V2] Duty-free code detected (${classificationData.hs_code}) - flagging for review`);
          classificationData.explanation = `ℹ️ DUTY-FREE CODE: This classification shows duty-free. Please verify accuracy.\n\n${classificationData.explanation}`;
        }

        return {
          success: true,
          data: {
            hs_code: classificationData.hs_code,
            description: classificationData.description,
            confidence: finalConfidence,
            explanation: classificationData.explanation,
            primary_material: classificationData.primary_material || this.extractPrimaryMaterial(productDescription),
            audit_risk: auditRisk,
            material_validation: validation,
            source: 'classification_agent_v2'
          }
        };
      }

      // If execute() failed, return the error
      return result;

    } catch (error) {
      console.error('[Classification V2] Error:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async searchDatabase(args) {
    const { keywords, chapter } = args;

    console.log('🔍 [Classification] search_database called with:', args);

    try {
      let query = this.supabase
        .from('tariff_intelligence_master')
        .select('hts8, brief_description, mfn_ad_val_rate, usmca_ad_val_rate')
        .textSearch('brief_description', keywords, { type: 'websearch' })
        .limit(20);

      if (chapter) {
        query = query.like('hts8', `${chapter}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [Search] Database error:', error);
        return { found: false, codes: [], error: error.message };
      }

      if (!data || data.length === 0) {
        console.log('⚠️ [Search] No results found');
        return { found: false, codes: [], message: 'No matching codes found' };
      }

      const formattedCodes = data.map(row => ({
        hts8: row.hts8,
        brief_description: row.brief_description,
        mfn_rate: row.mfn_ad_val_rate,
        usmca_rate: row.usmca_ad_val_rate
      }));

      console.log(`✅ [Search] Found ${formattedCodes.length} codes`);

      return {
        found: true,
        codes: formattedCodes,
        total: formattedCodes.length
      };
    } catch (error) {
      console.error('❌ [Search] Exception:', error);
      return { found: false, codes: [], error: error.message };
    }
  }

  /**
   * Validate material-chapter consistency to prevent audit flags
   * @private
   */
  validateMaterialChapter(hsCode, description, aiMaterial) {
    if (!hsCode || hsCode.length < 2) {
      return { valid: true, message: 'HS code too short to validate' };
    }

    const chapter = hsCode.substring(0, 2);

    // ✅ SKIP validation for functional component chapters (electronics/machinery/instruments)
    const functionalChapters = ['84', '85', '90', '91'];
    if (functionalChapters.includes(chapter)) {
      return {
        valid: true,
        message: `Chapter ${chapter} is functional classification - material validation skipped`,
        chapter: chapter
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
      'rubber': ['40']
    };

    const primaryMaterial = aiMaterial?.toLowerCase() || extractedMaterial?.toLowerCase();

    // Check if material matches expected chapter
    for (const [material, validChapters] of Object.entries(materialChapterMap)) {
      if (primaryMaterial?.includes(material)) {
        if (!validChapters.includes(chapter)) {
          return {
            valid: false,
            warning: `Component with "${material}" should use Chapter ${validChapters.join('/')}, but code uses Chapter ${chapter}`,
            expectedChapters: validChapters,
            actualChapter: chapter,
            detectedMaterial: material
          };
        }
      }
    }

    return {
      valid: true,
      message: `Material-chapter match validated`,
      chapter: chapter
    };
  }

  /**
   * Extract primary material from description
   * @private
   */
  extractPrimaryMaterial(description) {
    const desc = description.toLowerCase();

    const materials = {
      'aluminum': /\baluminum\b|\baluminium\b/,
      'steel': /\bsteel\b/,
      'iron': /\biron\b/,
      'plastic': /\bplastic\b|\bpolymer\b|\bresin\b/,
      'copper': /\bcopper\b/,
      'rubber': /\brubber\b|\belastomer\b/,
      'ceramic': /\bceramic\b/,
      'glass': /\bglass\b/,
      'wood': /\bwood\b|\btimber\b/
    };

    for (const [material, regex] of Object.entries(materials)) {
      if (regex.test(desc)) {
        return material;
      }
    }

    return 'unknown';
  }
}
