/**
 * AI-POWERED USMCA COMPLETE ANALYSIS
 * Pure AI approach - no local calculations, no config files
 * AI handles: threshold determination, calculation, qualification, recommendations
 * Flexible for changing trade policies
 */

import { protectedApiHandler } from '../../lib/api/apiHandler.js';
import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  POST: async (req, res) => {
    const startTime = Date.now();
    const userId = req.user.id;

  try {
    const formData = req.body;

    console.log('🤖 ========== AI-POWERED USMCA ANALYSIS: START ==========');
    console.log('📥 Received request:', {
      company: formData.company_name,
      business_type: formData.business_type,
      product: formData.product_description,
      component_count: formData.component_origins?.length
    });

    // Validate required fields
    if (!formData.company_name || !formData.business_type || !formData.component_origins || formData.component_origins.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: company_name, business_type, component_origins'
      });
    }

    // Build comprehensive AI prompt with all context
    const prompt = buildComprehensiveUSMCAPrompt(formData);

    console.log('🎯 ========== SENDING TO OPENROUTER ==========');
    console.log('Prompt length:', prompt.length, 'characters');

    // Call OpenRouter API
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet', // Use more powerful model for complex analysis
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.1 // Low temperature for consistent, factual responses
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenRouter API failed: ${aiResponse.status} ${aiResponse.statusText}`);
    }

    const aiResult = await aiResponse.json();
    const aiText = aiResult.choices?.[0]?.message?.content;

    console.log('🔮 ========== RAW AI RESPONSE ==========');
    console.log(aiText);
    console.log('========== END RAW RESPONSE ==========');

    // Parse AI response (expecting JSON)
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiText.match(/```json\s*([\s\S]*?)\s*```/) || aiText.match(/```\s*([\s\S]*?)\s*```/);
      let jsonText = jsonMatch ? jsonMatch[1] : aiText;

      // If parsing fails, try to extract just the JSON object (between first { and last })
      if (!jsonMatch) {
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonText = jsonText.substring(firstBrace, lastBrace + 1);                                     
        }
      }

      analysis = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      throw new Error(`AI response parsing failed: ${parseError.message}`);
    }

    console.log('✅ Parsed analysis:', {
      qualified: analysis.usmca?.qualified,
      threshold: analysis.usmca?.threshold_applied,
      content: analysis.usmca?.north_american_content,
      recommendation_count: analysis.recommendations?.length
    });

    // Format response for UI
    const result = {
      success: true,
      workflow_completed: true,
      processing_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      method: 'ai_powered',

      // Company information (pass through ALL fields for certificate)
      company: {
        name: formData.company_name,
        company_name: formData.company_name, // Alias for compatibility
        business_type: formData.business_type,
        trade_volume: formData.trade_volume,
        supplier_country: formData.supplier_country,
        destination_country: formData.destination_country,

        // Company details for certificate
        company_address: formData.company_address || '',
        address: formData.company_address || '',
        tax_id: formData.tax_id || '',
        contact_person: formData.contact_person || '',
        contact_email: formData.contact_email || '',
        contact_phone: formData.contact_phone || '',
        country: formData.destination_country || 'US',
        exporter_country: formData.destination_country || 'US'
      },

      // Product classification
      product: {
        success: true,
        hs_code: analysis.product?.hs_code || 'AI-classified',
        description: formData.product_description,
        product_description: formData.product_description,
        confidence: analysis.product?.confidence || 85,
        classification_method: 'ai_analysis',
        manufacturing_location: formData.manufacturing_location || ''
      },

      // USMCA qualification (from AI)
      usmca: {
        qualified: analysis.usmca?.qualified || false,
        north_american_content: analysis.usmca?.north_american_content || 0,
        regional_content: analysis.usmca?.north_american_content || 0, // Alias for certificate
        threshold_applied: analysis.usmca?.threshold_applied || 0,
        rule: analysis.usmca?.rule || 'Regional Value Content',
        reason: analysis.usmca?.reason || 'AI analysis complete',
        component_breakdown: analysis.usmca?.component_breakdown || formData.component_origins,
        qualification_level: analysis.usmca?.qualified ? 'qualified' : 'not_qualified',
        qualification_status: analysis.usmca?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
        preference_criterion: analysis.usmca?.qualified ? 'B' : null,
        manufacturing_location: formData.manufacturing_location || '',
        documentation_required: analysis.usmca?.documentation_required || [
          'Manufacturing records',
          'Bill of materials',
          'Supplier declarations'
        ]
      },

      // Tariff savings (only if qualified for USMCA)
      savings: {
        annual_savings: analysis.usmca?.qualified ? (analysis.savings?.annual_savings || 0) : 0,
        monthly_savings: analysis.usmca?.qualified ? (analysis.savings?.monthly_savings || 0) : 0,
        savings_percentage: analysis.usmca?.qualified ? (analysis.savings?.savings_percentage || 0) : 0,
        mfn_rate: analysis.savings?.mfn_rate || 0,
        usmca_rate: analysis.savings?.usmca_rate || 0
      },

      // Certificate (if qualified)
      certificate: analysis.usmca?.qualified ? {
        qualified: true,
        preference_criterion: 'B',
        blanket_start: new Date().toISOString().split('T')[0],
        blanket_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      } : null,

      // AI-generated recommendations
      recommendations: analysis.recommendations || [],

      // Trust indicators
      trust: {
        ai_powered: true,
        model: 'claude-3.5-sonnet',
        confidence_score: analysis.confidence_score || 85,
        disclaimer: 'AI-powered analysis for informational purposes. Consult licensed customs broker for official compliance.'
      }
    };

    // ========== COMPONENT ENRICHMENT WITH TARIFF INTELLIGENCE ==========
    // Enrich each component with HS codes, tariff rates, and savings calculations
    console.log('🔍 Enriching components with tariff intelligence...');
    const enrichedComponents = await enrichComponentsWithTariffIntelligence(formData.component_origins, formData.product_description);
    console.log('✅ Component enrichment complete:', {
      total_components: enrichedComponents.length,
      enriched_count: enrichedComponents.filter(c => c.classified_hs_code).length
    });

    // Store enriched component origins for results/certificate display
    result.component_origins = enrichedComponents;
    result.components = enrichedComponents; // Alias

    // CRITICAL: Update component_breakdown with enriched data
    // USMCAQualification.js reads from result.usmca.component_breakdown
    result.usmca.component_breakdown = enrichedComponents;

    result.manufacturing_location = formData.manufacturing_location;
    result.workflow_data = {
      company_name: formData.company_name,
      business_type: formData.business_type,
      product_description: formData.product_description,
      manufacturing_location: formData.manufacturing_location
    };

    logInfo('AI-powered USMCA analysis completed', {
      company: formData.company_name,
      qualified: result.usmca.qualified,
      processing_time: result.processing_time_ms
    });

    // Save workflow to database for dashboard display with ENRICHED components
    try {
      const { error: insertError } = await supabase
        .from('workflow_sessions')
        .insert({
          user_id: userId,
          session_id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          company_name: formData.company_name,
          business_type: formData.business_type,
          manufacturing_location: formData.manufacturing_location,
          trade_volume: formData.trade_volume ? parseFloat(formData.trade_volume.replace(/[^0-9.-]+/g, '')) : null,
          product_description: formData.product_description,
          hs_code: result.product.hs_code,
          component_origins: enrichedComponents, // CRITICAL: Save enriched components with tariff intelligence
          qualification_status: result.usmca.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
          regional_content_percentage: result.usmca.north_american_content,
          required_threshold: result.usmca.threshold_applied,
          compliance_gaps: result.usmca.qualified ? null : { gap: `${result.usmca.gap}% gap from ${result.usmca.threshold_applied}% threshold` },
          completed_at: new Date().toISOString()
        });

      if (insertError) {
        logError('Failed to save workflow to database', { error: insertError.message });
        // Don't fail the request, just log the error
      } else {
        console.log('✅ Workflow saved to database for user:', userId);
      }
    } catch (dbError) {
      logError('Database save error', { error: dbError.message });
      // Don't fail the request
    }

    return res.status(200).json(result);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError('AI-powered USMCA analysis failed', {
      error: error.message,
      stack: error.stack,
      processing_time: processingTime
    });

    return res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
  }
});

/**
 * Build comprehensive AI prompt with all USMCA rules and context
 */
function buildComprehensiveUSMCAPrompt(formData) {
  // Format component breakdown with full details
  const componentBreakdown = formData.component_origins
    .map((c, i) => `Component ${i + 1}: "${c.description || 'Not specified'}" - ${c.value_percentage}% from ${c.origin_country}${c.hs_code ? ` (HS: ${c.hs_code})` : ''}`)
    .join('\n');

  const prompt = `You are a senior USMCA trade compliance expert with 20+ years of experience in North American trade, customs regulations, and supply chain optimization. You have deep expertise in USMCA treaty requirements, HTS classification, and tariff analysis.

===== COMPLETE COMPANY INTELLIGENCE =====
Company Name: ${formData.company_name}
Business Type: ${formData.business_type}
Annual Trade Volume: ${formData.trade_volume || 'Not specified'}

Supply Chain Details:
- Primary Supplier Country: ${formData.primary_supplier_country || formData.supplier_country || 'Not specified'}
- Manufacturing/Assembly Location: ${formData.manufacturing_location || 'Not specified'}
- Export Destination: ${formData.export_destination || formData.destination_country || 'United States'}

${formData.company_address ? `Company Location: ${formData.company_address}` : ''}
${formData.tax_id ? `Tax ID: ${formData.tax_id}` : ''}

Business Context:
- This analysis is for ${formData.business_type} operations
- Trade volume indicates ${formData.trade_volume ? 'established' : 'new/growing'} import/export activity
- ${['US', 'MX', 'CA'].includes(formData.manufacturing_location) ? 'Manufacturing is already in USMCA region' : 'Manufacturing is outside USMCA region'}

===== PRODUCT DETAILS =====
Product: ${formData.product_description}

===== COMPONENT BREAKDOWN =====
${componentBreakdown}

Total Components: ${formData.component_origins?.length || 0}
Total Percentage: ${formData.component_origins?.reduce((sum, c) => sum + (parseFloat(c.value_percentage) || 0), 0)}%

USMCA THRESHOLD RULES (Official Treaty Standards):
1. **Textiles & Apparel**: 55% regional content threshold (yarn-forward rule applies)
2. **Automotive & Transportation**: 75% regional content threshold (strict requirements)
3. **Electronics & Technology**: 65% regional content threshold
4. **Machinery & Equipment**: 60% regional content threshold
5. **Chemicals & Pharmaceuticals**: 62.5% regional content threshold
6. **Food & Agriculture**: 60% regional content threshold (product-specific rules may apply)
7. **General Manufacturing**: 62.5% regional content threshold (default)

USMCA MEMBER COUNTRIES:
- United States (US)
- Mexico (MX)
- Canada (CA)

===== YOUR EXPERT ANALYSIS TASK =====

Use your 20+ years of expertise to perform a comprehensive USMCA qualification analysis:

1. **Industry Threshold Determination**:
   - Analyze the business type and product category
   - Apply the correct USMCA threshold (55%, 60%, 62.5%, 65%, or 75%)
   - Consider any product-specific rules or exceptions
   - Explain WHY this threshold applies

2. **Precise Regional Content Calculation**:
   - Calculate North American content: SUM(all components from US + MX + CA)
   - Verify the math: Total component percentages must equal 100%
   - Identify which specific components contribute to USMCA qualification
   - Show your calculation work clearly

3. **Qualification Determination**:
   - Compare North American Content % vs Required Threshold %
   - QUALIFIED if: North American Content >= Threshold
   - NOT QUALIFIED if: North American Content < Threshold
   - Calculate the exact gap if not qualified
   - Consider any special cases or product-specific rules

4. **Strategic Recommendations** (if NOT QUALIFIED):
   - Identify the HIGHEST-VALUE non-USMCA components to replace (prioritize by % and cost impact)
   - Provide SPECIFIC regional sourcing recommendations:
     * Textiles → Mexico textile mills, US fabric manufacturers
     * Electronics → Mexico maquiladoras, US component manufacturers
     * Automotive → Mexico automotive clusters (Guanajuato, Puebla), US tier-1 suppliers
     * Chemicals → Texas/Louisiana chemical corridor, Mexico petrochemical hubs
   - Calculate how much regional content each change would add
   - Provide 3-5 actionable, prioritized steps (most impactful first)

5. **Comprehensive Tariff Savings Analysis**:
   - Research typical MFN (Most Favored Nation) rates for this product category
   - USMCA preferential rate: 0% (duty-free)
   - Calculate annual savings = (Trade Volume) × (MFN Rate - 0%)
   - Calculate monthly savings = Annual / 12
   - Express savings as both dollar amount and percentage
   - Consider the ROI of supply chain changes needed to qualify

REQUIRED OUTPUT FORMAT (JSON):

{
  "product": {
    "hs_code": "classified HS code or best estimate",
    "confidence": 85
  },
  "usmca": {
    "qualified": true or false,
    "threshold_applied": number (e.g., 55, 60, 62.5, 65, or 75),
    "north_american_content": number (calculated percentage),
    "gap": number (threshold - content, or 0 if qualified),
    "rule": "Regional Value Content (XX% required)",
    "reason": "Product meets/does not meet required XX% North American content threshold.",
    "component_breakdown": [
      {
        "description": "component description",
        "origin_country": "country code",
        "value_percentage": number,
        "is_usmca_member": true or false
      }
    ],
    "documentation_required": ["list of required documents"]
  },
  "savings": {
    "annual_savings": estimated number,
    "monthly_savings": estimated number,
    "savings_percentage": estimated percentage,
    "mfn_rate": estimated rate,
    "usmca_rate": 0
  },
  "recommendations": [
    "specific recommendation 1",
    "specific recommendation 2",
    "specific recommendation 3"
  ],
  "confidence_score": 85
}

CRITICAL RULES:
- Be mathematically precise in calculations
- Use exact threshold for business type (don't round or estimate)
- Show your work in the "reason" field
- Recommendations must reference SPECIFIC components by description
- If qualified, recommendations array can be empty or contain optimization tips
- Always return valid JSON

Perform the analysis now:`;

  return prompt;
}

/**
 * Enrich components with HS code classification, tariff rates, and savings calculations
 * @param {Array} components - Array of component objects with basic data
 * @param {string} productContext - Product description for AI context
 * @returns {Array} Enriched components with tariff intelligence
 */
async function enrichComponentsWithTariffIntelligence(components, productContext) {
  const enrichedComponents = [];

  for (const component of components) {
    try {
      const enriched = { ...component };

      // Step 1: AI Classification with Tariff Rates (100% AI-powered - NO database lookups)
      if (!component.hs_code && !component.classified_hs_code) {
        console.log(`📋 AI Classifying component: "${component.description}"`);

        const classificationResult = await classifyComponentHS(component.description, productContext, component);

        if (classificationResult.success) {
          // AI provides EVERYTHING: HS code + tariff rates + confidence
          enriched.classified_hs_code = classificationResult.hs_code;
          enriched.hs_code = classificationResult.hs_code;
          enriched.confidence = classificationResult.confidence;
          enriched.mfn_rate = classificationResult.mfn_rate;
          enriched.usmca_rate = classificationResult.usmca_rate;
          enriched.tariff_rates = {
            mfn_rate: classificationResult.mfn_rate,
            usmca_rate: classificationResult.usmca_rate
          };
          enriched.savings_percent = classificationResult.mfn_rate - classificationResult.usmca_rate;

          console.log(`✅ AI Classification: "${component.description}" → HS ${classificationResult.hs_code}`);
          console.log(`   💰 MFN: ${classificationResult.mfn_rate}% | USMCA: ${classificationResult.usmca_rate}% | Savings: ${enriched.savings_percent}%`);
          console.log(`   🎯 Confidence: ${classificationResult.confidence}%`);

          // Save AI-generated data to database to BUILD the database
          await saveAIDataToDatabase(classificationResult, component);
        } else {
          console.log(`⚠️ AI Classification failed for "${component.description}"`);
          enriched.confidence = 0;
          enriched.mfn_rate = 0;
          enriched.usmca_rate = 0;
          enriched.savings_percent = 0;
        }
      } else {
        // Use existing HS code (user-provided)
        enriched.classified_hs_code = component.hs_code || component.classified_hs_code;
        enriched.hs_code = component.hs_code || component.classified_hs_code;
        enriched.confidence = component.confidence || 100;
        enriched.mfn_rate = component.mfn_rate || 0;
        enriched.usmca_rate = component.usmca_rate || 0;
        enriched.savings_percent = (component.mfn_rate || 0) - (component.usmca_rate || 0);
      }

      // Step 2: Determine USMCA member status
      const usmcaCountries = ['US', 'MX', 'CA'];
      enriched.is_usmca_member = usmcaCountries.includes(component.origin_country);

      enrichedComponents.push(enriched);

    } catch (error) {
      console.error(`❌ Error enriching component "${component.description}":`, error);
      // Return component with basic data if enrichment fails
      enrichedComponents.push({
        ...component,
        confidence: 0,
        mfn_rate: 0,
        usmca_rate: 0,
        savings_percent: 0,
        is_usmca_member: ['US', 'MX', 'CA'].includes(component.origin_country)
      });
    }
  }

  return enrichedComponents;
}

/**
 * Classify component description to HS code using AI (100% AI-powered - NO database lookups)
 * @param {string} componentDescription - Component description to classify
 * @param {string} productContext - Product context for better classification
 * @returns {Object} Classification result with hs_code, tariff rates, and confidence
 */
async function classifyComponentHS(componentDescription, productContext, component) {
  try {
    const classificationPrompt = `You are a senior HS code classification expert with 20+ years of experience in international trade, USMCA compliance, and tariff analysis. You have deep knowledge of the Harmonized Tariff Schedule and trade agreements.

===== COMPLETE BUSINESS CONTEXT =====
OVERALL PRODUCT: ${productContext}
COMPONENT TO CLASSIFY: "${componentDescription}"
ORIGIN COUNTRY: ${component.origin_country}
VALUE PERCENTAGE: ${component.value_percentage}% of total product value
USMCA MEMBER: ${['US', 'MX', 'CA'].includes(component.origin_country) ? 'YES' : 'NO'}

===== YOUR EXPERT TASK =====
Provide the MOST ACCURATE classification for this component with complete tariff intelligence:

1. **HS Code Classification**:
   - Use your expertise to determine the precise 6-digit HS code
   - Consider the component's function within the overall product
   - Consider the material composition and manufacturing process
   - Use the most specific classification available (avoid generic "parts" categories when specific codes exist)

2. **Tariff Rate Analysis**:
   - MFN Rate: Standard Most Favored Nation tariff rate (percentage)
   - USMCA Rate: Preferential rate under USMCA treaty (typically 0% for qualifying goods from US/MX/CA)
   - Consider the actual tariff schedule for this specific product category

3. **Confidence Assessment**:
   - Rate your confidence based on description clarity and classification complexity
   - High confidence (90-100%): Clear, unambiguous classification
   - Medium confidence (75-89%): Some interpretation needed
   - Low confidence (50-74%): Multiple possible classifications

4. **Expert Reasoning**:
   - Explain WHY this HS code is correct
   - Note any alternative classifications considered
   - Mention relevant USMCA rules or special considerations

Return ONLY a JSON object in this exact format (no other text):
{
  "hs_code": "XXXX.XX",
  "mfn_rate": 5.0,
  "usmca_rate": 0.0,
  "confidence": 85,
  "reasoning": "Detailed expert reasoning explaining classification, tariff rates, and any special considerations for USMCA qualification"
}

CRITICAL: Be precise and accurate. This data will be used for compliance decisions and saved to build our database.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [{
          role: 'user',
          content: classificationPrompt
        }],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API failed: ${response.status}`);
    }

    const result = await response.json();
    const aiText = result.choices?.[0]?.message?.content;

    // Parse JSON response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const classification = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      hs_code: classification.hs_code,
      mfn_rate: classification.mfn_rate || 0,
      usmca_rate: classification.usmca_rate || 0,
      confidence: classification.confidence || 85,
      reasoning: classification.reasoning
    };

  } catch (error) {
    console.error('HS classification failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Save AI-generated classification data to database to BUILD the database
 * This is the CORRECT approach: AI generates data → Save to database to help build it
 * @param {Object} classificationResult - AI classification with HS code and tariff rates
 * @param {Object} component - Original component data
 */
async function saveAIDataToDatabase(classificationResult, component) {
  try {
    // Save to ai_classifications table to build our database over time
    const { error } = await supabase
      .from('ai_classifications')
      .insert({
        hs_code: classificationResult.hs_code,
        component_description: component.description,
        mfn_rate: classificationResult.mfn_rate,
        usmca_rate: classificationResult.usmca_rate,
        confidence: classificationResult.confidence,
        reasoning: classificationResult.reasoning,
        origin_country: component.origin_country,
        value_percentage: component.value_percentage,
        created_at: new Date().toISOString()
      });

    if (error) {
      // Don't fail the request - just log the error
      console.log(`⚠️ Failed to save AI data to database:`, error.message);
    } else {
      console.log(`💾 Saved AI classification to database: HS ${classificationResult.hs_code}`);
    }
  } catch (error) {
    // Don't fail the request - just log the error
    console.log(`⚠️ Database save error:`, error.message);
  }
}
