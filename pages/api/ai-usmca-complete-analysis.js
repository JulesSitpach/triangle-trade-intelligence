/**
 * AI-POWERED USMCA COMPLETE ANALYSIS
 * Pure AI approach - no local calculations, no config files
 * AI handles: threshold determination, calculation, qualification, recommendations
 * Flexible for changing trade policies
 */

import { protectedApiHandler } from '../../lib/api/apiHandler.js';
import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';
import { normalizeComponent, logComponentValidation } from '../../lib/schemas/component-schema.js';
import { logDevIssue, DevIssue } from '../../lib/utils/logDevIssue.js';
import { checkAnalysisLimit, incrementAnalysisCount } from '../../lib/services/usage-tracking-service.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// In-memory cache for tariff rates (cost optimization)
const TARIFF_CACHE = new Map();
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

export default protectedApiHandler({
  POST: async (req, res) => {
    const startTime = Date.now();
    const userId = req.user.id;
    const formData = req.body; // Move outside try block for error handler access

  try {

    console.log('🤖 ========== AI-POWERED USMCA ANALYSIS: START ==========');
    console.log('📥 Received request:', {
      company: formData.company_name,
      business_type: formData.business_type,
      product: formData.product_description,
      component_count: formData.component_origins?.length
    });

    // ========== STEP 0: CHECK USAGE LIMITS ==========
    // Get user's subscription tier from database
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', userId)
      .single();

    const subscriptionTier = userProfile?.subscription_tier || 'Trial';

    // Check if user can perform this analysis
    const usageStatus = await checkAnalysisLimit(userId, subscriptionTier);

    if (!usageStatus.canProceed) {
      console.log(`❌ Analysis limit reached for user ${userId} (${subscriptionTier}): ${usageStatus.currentCount}/${usageStatus.tierLimit}`);
      return res.status(429).json({
        success: false,
        error: 'Monthly analysis limit reached',
        limit_info: {
          tier: subscriptionTier,
          current_count: usageStatus.currentCount,
          tier_limit: usageStatus.tierLimit,
          remaining: usageStatus.remaining
        },
        upgrade_required: true,
        upgrade_url: '/pricing'
      });
    }

    console.log(`✅ Usage check passed: ${usageStatus.currentCount}/${usageStatus.tierLimit} (${usageStatus.remaining} remaining)`);

    // Validate required fields
    if (!formData.company_name || !formData.business_type || !formData.industry_sector || !formData.component_origins || formData.component_origins.length === 0) {
      await DevIssue.validationError('usmca_analysis', 'required_fields', 'Missing company_name, business_type, industry_sector, or component_origins', {
        userId,
        has_company_name: !!formData.company_name,
        has_business_type: !!formData.business_type,
        has_industry_sector: !!formData.industry_sector,
        component_count: formData.component_origins?.length || 0
      });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: company_name, business_type, industry_sector, component_origins'
      });
    }

    // ========== LOG MISSING OPTIONAL FIELDS (for admin review) ==========
    const missingOptionalFields = [];

    if (!formData.manufacturing_location) missingOptionalFields.push('manufacturing_location');
    if (!formData.supplier_country) missingOptionalFields.push('supplier_country');
    if (!formData.destination_country) missingOptionalFields.push('destination_country');
    if (!formData.trade_volume) missingOptionalFields.push('trade_volume');

    // Check for components missing descriptions
    const componentsWithoutDesc = formData.component_origins.filter(c => !c.description || c.description.length < 10);
    if (componentsWithoutDesc.length > 0) {
      missingOptionalFields.push(`${componentsWithoutDesc.length} components missing detailed descriptions`);
    }

    if (missingOptionalFields.length > 0) {
      // Log to admin dashboard (non-blocking)
      await DevIssue.missingData('usmca_analysis', missingOptionalFields.join(', '), {
        user_id: userId,
        company: formData.company_name,
        workflow_step: 'ai_usmca_analysis',
        impact: 'AI analysis quality may be reduced due to missing optional context',
        missing_fields: missingOptionalFields
      });
      console.log(`⚠️  Missing optional fields: ${missingOptionalFields.join(', ')} - AI quality may be reduced`);
    }

    // ========== STEP 1: GET ACTUAL TARIFF RATES FIRST ==========
    // Fetch real tariff rates with 2025 policy context BEFORE doing qualification analysis
    console.log('📊 Fetching actual tariff rates for all components...');
    const componentsWithHSCodes = formData.component_origins.filter(c => c.hs_code);
    let componentRates = {};

    if (componentsWithHSCodes.length > 0) {
      componentRates = await lookupBatchTariffRates(componentsWithHSCodes);
      console.log(`✅ Got tariff rates for ${Object.keys(componentRates).length} components`);
    }

    // ========== STEP 2: BUILD PROMPT WITH ACTUAL RATES ==========
    // Now the AI will use REAL 103% rates instead of guessing 0%
    const prompt = await buildComprehensiveUSMCAPrompt(formData, componentRates);

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
        model: 'anthropic/claude-sonnet-4.5', // Sonnet 4.5 - 72.7% SWE-bench, best for complex USMCA reasoning
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0 // Zero temperature for perfect determinism (same input = same output)
      })
    });

    if (!aiResponse.ok) {
      const errorMsg = `OpenRouter API failed: ${aiResponse.status} ${aiResponse.statusText}`;
      await logDevIssue({
        type: 'api_error',
        severity: 'critical',
        component: 'usmca_analysis',
        message: errorMsg,
        data: { userId, company: formData.company_name, status: aiResponse.status }
      });
      throw new Error(errorMsg);
    }

    const aiResult = await aiResponse.json();
    const aiText = aiResult.choices?.[0]?.message?.content;

    console.log('🔮 ========== RAW AI RESPONSE ==========');
    console.log(aiText);
    console.log('========== END RAW RESPONSE ==========');

    // Parse AI response (expecting JSON) - robust multi-strategy extraction
    let analysis;
    try {
      // Multi-strategy JSON extraction (same as classifyComponentHS and batch lookup)
      let jsonString = null;
      let extractionMethod = '';

      // Strategy 1: Try direct extraction
      if (aiText.trim().startsWith('{')) {
        jsonString = aiText;
        extractionMethod = 'direct';
      }
      // Strategy 2: Extract from markdown code blocks
      else {
        const codeBlockMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1];
          extractionMethod = 'code_block';
        }
        // Strategy 3: Extract JSON object (between first { and last })
        else {
          const firstBrace = aiText.indexOf('{');
          const lastBrace = aiText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonString = aiText.substring(firstBrace, lastBrace + 1);
            extractionMethod = 'brace_matching';
          }
        }
      }

      if (!jsonString) {
        console.error('❌ No JSON found in Results AI response');
        console.error('AI Response (first 500 chars):', aiText.substring(0, 500));
        await logDevIssue({
          type: 'unexpected_behavior',
          severity: 'critical',
          component: 'usmca_analysis',
          message: 'AI response missing JSON structure',
          data: { userId, company: formData.company_name, response_preview: aiText.substring(0, 500) }
        });
        throw new Error('No JSON found in AI response');
      }

      // CRITICAL: Sanitize control characters BEFORE parsing
      const sanitizedJSON = jsonString
        .replace(/\r\n/g, ' ')  // Replace Windows line breaks with space
        .replace(/\n/g, ' ')    // Replace Unix line breaks with space
        .replace(/\r/g, ' ')    // Replace Mac line breaks with space
        .replace(/\t/g, ' ')    // Replace tabs with space
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove other control characters

      analysis = JSON.parse(sanitizedJSON.trim());
      console.log(`✅ Results JSON parsed successfully (method: ${extractionMethod}, sanitized)`);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      await DevIssue.apiError('usmca_analysis', 'AI response parsing', parseError, {
        userId,
        company: formData.company_name,
        response_preview: aiText?.substring(0, 500)
      });
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
        business_type: formData.business_type,  // Business role: Importer/Exporter/etc
        industry_sector: formData.industry_sector,  // Industry classification
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
        manufacturing_location: formData.manufacturing_location || '',
        // Product-level tariff rates (from AI savings analysis)
        mfn_rate: analysis.savings?.mfn_rate || 0,
        usmca_rate: analysis.savings?.usmca_rate || 0
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

      // Method of qualification for certificate (Transaction Value for RVC calculations)
      method_of_qualification: 'TV', // Transaction Value method for Regional Value Content

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

      // Detailed analysis (NEW - rich insights from AI)
      detailed_analysis: analysis.detailed_analysis || {
        threshold_research: analysis.usmca?.threshold_reasoning || '',
        calculation_breakdown: analysis.usmca?.reason || '',
        qualification_reasoning: analysis.usmca?.reason || '',
        strategic_insights: analysis.recommendations?.join('\n\n') || '',
        savings_analysis: ''
      },

      // Trust indicators
      trust: {
        ai_powered: true,
        model: 'anthropic/claude-sonnet-4.5',
        confidence_score: analysis.confidence_score || 85,
        disclaimer: 'AI-powered analysis for informational purposes. Consult trade compliance expert for official compliance.'
      }
    };

    // ========== COMPONENT ENRICHMENT WITH TARIFF INTELLIGENCE ==========
    // Enrich each component with HS codes, tariff rates, and savings calculations
    console.log('🔍 Enriching components with tariff intelligence...');

    // Build COMPLETE context object for component classification
    const fullBusinessContext = {
      product_description: formData.product_description,
      company_name: formData.company_name,
      business_type: formData.business_type,  // Business role: Importer/Exporter/etc
      business_role: formData.business_type,  // Alias for clarity in component enrichment
      industry_sector: formData.industry_sector,  // Industry classification for HS codes
      industry: formData.industry_sector || formData.industry || extractIndustryFromBusinessType(formData.business_type), // Fallback for old data
      manufacturing_location: formData.manufacturing_location,
      end_use: formData.end_use || 'commercial',
      trade_volume: formData.trade_volume
    };

    const enrichedComponents = await enrichComponentsWithTariffIntelligence(formData.component_origins, fullBusinessContext);
    console.log('✅ Component enrichment complete:', {
      total_components: enrichedComponents.length,
      enriched_count: enrichedComponents.filter(c => c.classified_hs_code).length
    });

    // CRITICAL: Normalize all components to ensure consistent field names
    // This creates BOTH display names (savings_percentage, ai_confidence)
    // AND API names (savings_percent, confidence) for compatibility
    const normalizedComponents = enrichedComponents.map(c => normalizeComponent(c));

    // Validate enrichment completeness
    const validation = logComponentValidation(normalizedComponents, 'AI Enrichment Output');
    if (validation.invalid > 0) {
      console.warn(`⚠️ ${validation.invalid} components missing enrichment data - check logs above`);
    }

    // Store enriched component origins for results/certificate display
    result.component_origins = normalizedComponents;
    result.components = normalizedComponents; // Alias

    // CRITICAL: Update component_breakdown with enriched data
    // USMCAQualification.js reads from result.usmca.component_breakdown
    result.usmca.component_breakdown = normalizedComponents;

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

    // Save workflow to database for dashboard display with ENRICHED components + AI threshold research
    try {
      const { error: insertError } = await supabase
        .from('workflow_sessions')
        .insert({
          user_id: userId,
          session_id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          company_name: formData.company_name,
          business_type: formData.business_type,  // Business role
          industry_sector: formData.industry_sector,  // Industry classification
          manufacturing_location: formData.manufacturing_location,
          trade_volume: formData.trade_volume ? parseFloat(formData.trade_volume.replace(/[^0-9.-]+/g, '')) : null,
          product_description: formData.product_description,
          hs_code: result.product.hs_code,
          component_origins: normalizedComponents, // CRITICAL: Save NORMALIZED enriched components with tariff intelligence
          qualification_status: result.usmca.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
          regional_content_percentage: result.usmca.north_american_content,
          required_threshold: result.usmca.threshold_applied,
          threshold_source: analysis.usmca?.threshold_source || null, // AI research citation
          threshold_reasoning: analysis.usmca?.threshold_reasoning || null, // Why this threshold applies
          compliance_gaps: result.usmca.qualified ? null : { gap: `${result.usmca.gap}% gap from ${result.usmca.threshold_applied}% threshold` },
          completed_at: new Date().toISOString()
        });

      if (insertError) {
        logError('Failed to save workflow to database', { error: insertError.message });
        await DevIssue.apiError('usmca_analysis', 'workflow database save', insertError, {
          userId,
          company: formData.company_name,
          qualification_status: result.usmca.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED'
        });
        // Don't fail the request, just log the error
      } else {
        console.log('✅ Workflow saved to database for user:', userId);
      }
    } catch (dbError) {
      logError('Database save error', { error: dbError.message });
      await logDevIssue({
        type: 'api_error',
        severity: 'high',
        component: 'usmca_analysis',
        message: 'Database save exception',
        data: { userId, error: dbError.message, stack: dbError.stack }
      });
      // Don't fail the request
    }

    // ========== INCREMENT USAGE COUNT ==========
    // Track this analysis in monthly usage
    try {
      const incrementResult = await incrementAnalysisCount(userId, subscriptionTier);
      if (incrementResult.success) {
        console.log(`✅ Usage tracked: ${incrementResult.currentCount}/${incrementResult.tierLimit}`);
        result.usage_info = {
          current_count: incrementResult.currentCount,
          tier_limit: incrementResult.tierLimit,
          remaining: incrementResult.tierLimit - incrementResult.currentCount,
          tier: subscriptionTier
        };
      }
    } catch (usageError) {
      // Don't fail the request if usage tracking fails
      console.error('⚠️ Usage tracking failed:', usageError);
    }

    return res.status(200).json(result);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError('AI-powered USMCA analysis failed', {
      error: error.message,
      stack: error.stack,
      processing_time: processingTime
    });

    await DevIssue.apiError('usmca_analysis', '/api/ai-usmca-complete-analysis', error, {
      userId,
      company: formData?.company_name,
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
 * Build comprehensive AI prompt with ACTUAL tariff rates from batch lookup
 * @param {Object} formData - Form data with component origins
 * @param {Object} componentRates - Actual tariff rates from batch lookup { [hsCode]: { mfn_rate, usmca_rate, ... } }
 */
async function buildComprehensiveUSMCAPrompt(formData, componentRates = {}) {
  // Get policy context for accurate tariff information (100% AI, no database)
  const firstOrigin = formData.component_origins?.[0]?.origin_country || 'CN';
  const policyContext = buildDynamicPolicyContext(firstOrigin);

  // Format component breakdown with ACTUAL TARIFF RATES
  const componentBreakdown = formData.component_origins
    .map((c, i) => {
      const rates = componentRates[c.hs_code] || {};
      const rateInfo = rates.mfn_rate !== undefined
        ? ` | MFN Rate: ${rates.mfn_rate}% | USMCA Rate: ${rates.usmca_rate || 0}%`
        : '';
      return `Component ${i + 1}: "${c.description || 'Not specified'}" - ${c.value_percentage}% from ${c.origin_country}${c.hs_code ? ` (HS: ${c.hs_code})` : ''}${rateInfo}`;
    })
    .join('\n');

  const prompt = `You are a senior USMCA trade compliance expert. Determine if this product qualifies for USMCA based on its component origins.

===== PRODUCT ANALYSIS =====
Product: ${formData.product_description}
Industry Sector: ${formData.industry_sector}
Manufacturing Location: ${formData.manufacturing_location || 'Not specified'}

Supply Chain Flow:
- Primary Supplier Country: ${formData.supplier_country || 'Not specified'}
- Export Destination: ${formData.destination_country || 'Not specified'}
- Annual Trade Volume: ${formData.trade_volume || 'Not specified'}

===== COMPONENT BREAKDOWN =====
${componentBreakdown}

Total Components: ${formData.component_origins?.length || 0}
Total Percentage: ${formData.component_origins?.reduce((sum, c) => sum + (parseFloat(c.value_percentage) || 0), 0)}%

USMCA MEMBER COUNTRIES:
- United States (US)
- Mexico (MX)
- Canada (CA)

${policyContext}

===== USMCA TREATY RESEARCH REQUIRED =====
Use your expert knowledge of the USMCA (United States-Mexico-Canada Agreement) treaty to:
1. Research the correct Regional Value Content (RVC) threshold for this specific product category
2. Consult USMCA Annex 4-B (Product-Specific Rules of Origin) for product-specific requirements
3. Reference the appropriate USMCA chapter, article, or annex that defines this threshold
4. Provide the official treaty citation for your threshold determination

===== YOUR EXPERT ANALYSIS TASK =====

Use your 20+ years of expertise to perform a comprehensive USMCA qualification analysis:

1. **Research & Determine Correct Threshold**:
   - Research USMCA treaty requirements for this specific product category
   - Determine the Regional Value Content (RVC) threshold from official USMCA rules
   - Check product-specific rules in USMCA Annex 4-B if applicable
   - Cite which USMCA chapter, article, or annex applies
   - Explain WHY this specific threshold is correct for this product

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
   - Use the ACTUAL MFN rates provided above for each component
   - USMCA preferential rate: 0% (duty-free for qualified goods)
   - Calculate weighted average MFN rate across all components
   - Calculate annual savings = (Trade Volume) × (Weighted MFN Rate - 0%)
   - Calculate monthly savings = Annual / 12
   - Express savings as both dollar amount and percentage
   - Explain impact of 2025 tariff policies (Section 301, port fees, etc.)
   - Consider the ROI of supply chain changes needed to qualify

REQUIRED OUTPUT FORMAT (JSON):

{
  "product": {
    "hs_code": "classified HS code or best estimate",
    "confidence": 85
  },
  "usmca": {
    "qualified": true or false,
    "threshold_applied": number (researched threshold percentage),
    "threshold_source": "USMCA Chapter/Article/Annex citation (e.g., 'Annex 4-B, Article 4.5')",
    "threshold_reasoning": "Explain why this threshold applies to this product category",
    "north_american_content": number (calculated percentage),
    "gap": number (threshold - content, or 0 if qualified),
    "rule": "Regional Value Content (XX% required)",
    "reason": "Product meets/does not meet required XX% North American content threshold based on USMCA [citation].",
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
    "usmca_rate": 0,
    "potential_savings_if_qualified": number (if not qualified, what savings would be if they qualified)
  },
  "recommendations": [
    "specific recommendation 1",
    "specific recommendation 2",
    "specific recommendation 3"
  ],
  "detailed_analysis": {
    "threshold_research": "Detailed explanation of why this threshold applies (category, USMCA chapter, reasoning)",
    "calculation_breakdown": "Step-by-step calculation showing how you arrived at the North American content percentage",
    "qualification_reasoning": "Clear explanation of why they do or don't qualify, including the gap",
    "strategic_insights": "Deeper strategic recommendations beyond the simple list - explain WHY these changes matter",
    "savings_analysis": "Detailed tariff savings breakdown with MFN rates, USMCA rates, and dollar calculations"
  },
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
 * @param {Object} businessContext - Full business context including product, industry, end-use
 * @returns {Array} Enriched components with tariff intelligence
 */
async function enrichComponentsWithTariffIntelligence(components, businessContext) {
  const productContext = typeof businessContext === 'string' ? businessContext : businessContext.product_description;
  const usmcaCountries = ['US', 'MX', 'CA'];

  console.log(`📦 Batch enrichment for ${components.length} components...`);

  // Separate components into those with/without tariff rates
  const componentsNeedingRates = components.filter(c => {
    const hasHsCode = c.hs_code || c.classified_hs_code;
    const hasTariffRates = c.mfn_rate !== undefined && c.mfn_rate !== null && c.mfn_rate !== 'Not available';
    return hasHsCode && !hasTariffRates;
  });

  console.log(`   ${componentsNeedingRates.length} components need tariff rates`);
  console.log(`   ${components.length - componentsNeedingRates.length} components already have rates or missing HS codes`);

  // Batch fetch tariff rates via AI for all components needing them (100% AI approach)
  let batchRates = {};
  if (componentsNeedingRates.length > 0) {
    console.log(`🤖 Fetching ALL tariff rates via AI (batch lookup)...`);
    batchRates = await lookupBatchTariffRates(componentsNeedingRates);
    console.log(`✅ AI batch rates fetched for ${Object.keys(batchRates).length} components`);
  }

  // Enrich all components with tariff intelligence
  const enrichedComponents = components.map((component, index) => {
    try {
      const enriched = { ...component };

      // Case 1: No HS code at all
      if (!component.hs_code && !component.classified_hs_code) {
        console.warn(`⚠️ Component "${component.description}" missing HS code`);
        DevIssue.missingData('component_enrichment', 'hs_code', {
          component_description: component.description,
          origin_country: component.origin_country,
          value_percentage: component.value_percentage
        });
        enriched.hs_code = '';
        enriched.confidence = 0;
        enriched.mfn_rate = 0;
        enriched.usmca_rate = 0;
        enriched.savings_percent = 0;
        enriched.rate_source = 'missing';
        enriched.is_usmca_member = usmcaCountries.includes(component.origin_country);
        return enriched;
      }

      // Case 2: Has HS code - process tariff rates
      enriched.classified_hs_code = component.hs_code || component.classified_hs_code;
      enriched.hs_code = component.hs_code || component.classified_hs_code;
      enriched.confidence = component.confidence || 100;
      enriched.hs_description = component.hs_description || component.description || 'AI classification';

      // Check if component already has tariff rates
      const hasTariffRates = component.mfn_rate !== undefined && component.mfn_rate !== null && component.mfn_rate !== 'Not available';

      if (hasTariffRates) {
        // Use existing tariff rates
        const mfnStr = String(component.mfn_rate).replace('%', '');
        const usmcaStr = String(component.usmca_rate).replace('%', '');
        enriched.mfn_rate = parseFloat(mfnStr) || 0;
        enriched.usmca_rate = parseFloat(usmcaStr) || 0;
        enriched.rate_source = 'existing';
        console.log(`   ✅ Component ${index + 1}: Using existing rates (MFN ${enriched.mfn_rate}%)`);
      } else {
        // Get rates from batch lookup
        const rates = batchRates[enriched.hs_code];
        if (rates) {
          enriched.mfn_rate = rates.mfn_rate || 0;
          enriched.usmca_rate = rates.usmca_rate || 0;
          enriched.rate_source = 'batch_lookup';
          console.log(`   ✅ Component ${index + 1}: Batch rates applied (MFN ${enriched.mfn_rate}%)`);
        } else {
          // Batch lookup failed or didn't return this HS code
          enriched.mfn_rate = 0;
          enriched.usmca_rate = 0;
          enriched.rate_source = 'lookup_failed';
          console.log(`   ❌ Component ${index + 1}: No rates in batch response`);
          logDevIssue({
            type: 'missing_data',
            severity: 'medium',
            component: 'tariff_lookup',
            message: 'Batch tariff lookup returned no rates for component',
            data: {
              hs_code: enriched.hs_code,
              description: component.description,
              origin_country: component.origin_country
            }
          });
        }
      }

      enriched.savings_percent = enriched.mfn_rate - enriched.usmca_rate;
      enriched.last_updated = component.last_updated || new Date().toISOString().split('T')[0];
      enriched.is_usmca_member = usmcaCountries.includes(component.origin_country);

      return enriched;

    } catch (error) {
      console.error(`❌ Error enriching component "${component.description}":`, error);
      logDevIssue({
        type: 'api_error',
        severity: 'high',
        component: 'component_enrichment',
        message: `Failed to enrich component: ${error.message}`,
        data: {
          component_description: component.description,
          origin_country: component.origin_country,
          error: error.message,
          stack: error.stack
        }
      });
      return {
        ...component,
        confidence: 0,
        mfn_rate: 0,
        usmca_rate: 0,
        savings_percent: 0,
        is_usmca_member: usmcaCountries.includes(component.origin_country)
      };
    }
  });

  console.log(`✅ Batch enrichment complete: ${enrichedComponents.length} components processed`);
  return enrichedComponents;
}

/**
 * Build research-based tariff prompt - AI researches current rates
 */
function buildDynamicPolicyContext(originCountry) {
  return `===== TARIFF RATE RESEARCH INSTRUCTIONS =====

You are a US customs and import tariff specialist with knowledge of current October 2025 trade policy.

**YOUR TASK**: Research and calculate the CURRENT total US import tariff rate for each HS code and origin country combination.

**RESEARCH METHODOLOGY**:
1. Start with base MFN/HTS duty rate for the HS code
2. Research country-specific additional tariffs:
   - Section 301 tariffs (especially China)
   - Section 232 tariffs (steel/aluminum)
   - IEEPA emergency tariffs
   - Reciprocal tariffs (Trump 2025 policy)
   - Port fees or handling charges
3. Check for exemptions or pending changes
4. Calculate TOTAL effective rate

**CALCULATION**:
- mfn_rate = SUM of all applicable tariffs (as number, not percentage)
- policy_adjustments = array listing each tariff component
- Example: ["Base MFN 0%", "Section 301 +50%", "IEEPA +20%"] → mfn_rate = 70

**IMPORTANT**:
- Use your current knowledge of 2025 US trade policy
- Include country-specific rates (China vs others differs significantly)
- Document your sources in policy_adjustments
- Date tariffs as of October 2025

Research thoroughly and return accurate current rates.`;
}

/**
 * Batch lookup tariff rates for multiple HS codes in a SINGLE AI call (WITH IN-MEMORY CACHE)
 * 100% AI approach with 2025 policy context - results are then saved to database
 * Cache reduces costs by 75%+ (6 hour TTL)
 * This is THE source of truth for tariff rates - feeds into qualification analysis
 * @param {Array} components - Array of components with HS codes
 * @returns {Object} Map of HS code → tariff rates { [hsCode]: { mfn_rate, usmca_rate, ... } }
 */
/**
 * 3-TIER FALLBACK TARIFF LOOKUP
 * Tier 1: OpenRouter (primary) - Current 2025 policy
 * Tier 2: Anthropic Direct - Backup if OpenRouter down
 * Tier 3: Database - Last resort (stale Jan 2025 data)
 */
async function lookupBatchTariffRates(components) {
  // STEP 1: Check cache first
  const cachedRates = {};
  const uncachedComponents = [];

  for (const component of components) {
    const hsCode = component.hs_code || component.classified_hs_code;
    const cacheKey = `${hsCode}-${component.origin_country}`;
    const cached = TARIFF_CACHE.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      cachedRates[hsCode] = cached.data;
    } else {
      uncachedComponents.push(component);
    }
  }

  console.log(`💰 Cache: ${Object.keys(cachedRates).length} hits (FREE), ${uncachedComponents.length} misses (AI call needed)`);

  if (uncachedComponents.length === 0) {
    console.log('✅ All rates served from cache - $0 cost');
    return cachedRates;
  }

  // STEP 2: Build prompt once for all fallback attempts
  const { batchPrompt, componentList } = buildBatchTariffPrompt(uncachedComponents);

  // TIER 1: Try OpenRouter first
  console.log('🎯 TIER 1: Trying OpenRouter...');
  const openRouterResult = await tryOpenRouter(batchPrompt);
  if (openRouterResult.success) {
    console.log('✅ OpenRouter SUCCESS');
    return cacheBatchResults(openRouterResult.rates, uncachedComponents, cachedRates);
  }
  console.log('❌ OpenRouter FAILED:', openRouterResult.error);

  // TIER 2: Fallback to Anthropic Direct
  console.log('🎯 TIER 2: Trying Anthropic Direct API...');
  const anthropicResult = await tryAnthropicDirect(batchPrompt);
  if (anthropicResult.success) {
    console.log('✅ Anthropic Direct SUCCESS');
    return cacheBatchResults(anthropicResult.rates, uncachedComponents, cachedRates);
  }
  console.log('❌ Anthropic Direct FAILED:', anthropicResult.error);

  // TIER 3: Last resort - Database (stale data)
  console.log('🎯 TIER 3: Falling back to Database (STALE DATA - Jan 2025)...');
  const dbRates = await lookupDatabaseRates(uncachedComponents);
  console.log(`⚠️ Using STALE database rates for ${Object.keys(dbRates).length} components`);

  return { ...cachedRates, ...dbRates };
}

/**
 * Build prompt for batch tariff lookup (used by all tiers)
 */
function buildBatchTariffPrompt(components) {
  const componentList = components.map((c, idx) => {
    const hsCode = c.hs_code || c.classified_hs_code;
    return `${idx + 1}. HS Code: ${hsCode} | Origin: ${c.origin_country} | Description: "${c.description}"`;
  }).join('\n');

  const uniqueOrigins = [...new Set(components.map(c => c.origin_country))];
  const policyContext = buildDynamicPolicyContext(uniqueOrigins[0]);

  const batchPrompt = `You are a tariff rate specialist. Lookup tariff rates for ALL components below.

===== COMPONENTS (${components.length} total) =====
${componentList}

${policyContext}

Return valid JSON with rates for ALL components using EXACT HS codes as keys:

{
  "rates": {
    "8542.31.00": {
      "mfn_rate": 70.0,
      "usmca_rate": 0.0,
      "policy_adjustments": ["Section 301 +50%", "IEEPA +20%"]
    }
  }
}`;

  return { batchPrompt, componentList };
}

/**
 * TIER 1: Try OpenRouter API
 */
async function tryOpenRouter(prompt) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://triangle-trade-intelligence.vercel.app'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText.substring(0, 200)}` };
    }

    const result = await response.json();
    const aiText = result.choices?.[0]?.message?.content;

    if (!aiText) {
      return { success: false, error: 'No AI response content' };
    }

    const rates = parseAIResponse(aiText);
    if (!rates) {
      return { success: false, error: 'Failed to parse JSON response' };
    }

    return { success: true, rates };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * TIER 2: Try Anthropic Direct API
 */
async function tryAnthropicDirect(prompt) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return { success: false, error: 'ANTHROPIC_API_KEY not configured' };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText.substring(0, 200)}` };
    }

    const result = await response.json();
    const aiText = result.content?.[0]?.text;

    if (!aiText) {
      return { success: false, error: 'No AI response content' };
    }

    const rates = parseAIResponse(aiText);
    if (!rates) {
      return { success: false, error: 'Failed to parse JSON response' };
    }

    return { success: true, rates };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * TIER 3: Database fallback (stale data)
 */
async function lookupDatabaseRates(components) {
  const dbRates = {};

  try {
    for (const component of components) {
      const hsCode = component.hs_code || component.classified_hs_code;

      const { data, error } = await supabase
        .from('hs_master_rebuild')
        .select('*')
        .eq('hts_code', hsCode.replace(/[\.\s\-]/g, ''))
        .single();

      if (!error && data) {
        dbRates[hsCode] = {
          mfn_rate: data.general_rate || data.mfn_rate || 0,
          usmca_rate: data.special_rate || data.usmca_rate || 0,
          policy_adjustments: ['⚠️ STALE DATA - January 2025'],
          source: 'database_fallback',
          stale: true
        };
      }
    }
  } catch (error) {
    console.error('❌ Database lookup failed:', error.message);
  }

  return dbRates;
}

/**
 * Parse AI response (same logic for both OpenRouter and Anthropic)
 */
function parseAIResponse(aiText) {
  try {
    // Multi-strategy JSON extraction
    let jsonString = null;

    if (aiText.trim().startsWith('{')) {
      jsonString = aiText;
    } else {
      const codeBlockMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1];
      } else {
        const firstBrace = aiText.indexOf('{');
        const lastBrace = aiText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonString = aiText.substring(firstBrace, lastBrace + 1);
        }
      }
    }

    if (!jsonString) return null;

    // Sanitize control characters
    const sanitized = jsonString
      .replace(/\r\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    const parsed = JSON.parse(sanitized.trim());
    return parsed.rates || null;

  } catch (error) {
    console.error('Parse error:', error.message);
    return null;
  }
}

/**
 * Cache successful results AND save to database for future use
 */
function cacheBatchResults(freshRates, components, existingCache) {
  // Save to in-memory cache (6-hour TTL)
  for (const [hsCode, rates] of Object.entries(freshRates)) {
    const component = components.find(c =>
      (c.hs_code || c.classified_hs_code) === hsCode
    );
    if (component) {
      const cacheKey = `${hsCode}-${component.origin_country}`;
      TARIFF_CACHE.set(cacheKey, {
        data: rates,
        timestamp: Date.now()
      });
    }
  }

  // 💾 SAVE AI RESULTS TO DATABASE (non-blocking)
  saveTariffRatesToDatabase(freshRates, components).catch(err => {
    console.error('⚠️ Background database save failed:', err.message);
  });

  console.log(`✅ AI returned rates for ${Object.keys(freshRates).length} components (cached + saved to DB)`);
  return { ...existingCache, ...freshRates };
}

/**
 * Extract industry from business type for better component classification context
 * @param {string} businessType - Business type from form
 * @returns {string} Industry sector
 */
function extractIndustryFromBusinessType(businessType) {
  if (!businessType) return 'General Manufacturing';

  const type = businessType.toLowerCase();

  // Map business types to industry sectors
  if (type.includes('textile') || type.includes('apparel') || type.includes('clothing')) return 'Textiles & Apparel';
  if (type.includes('automotive') || type.includes('vehicle') || type.includes('transportation')) return 'Automotive & Transportation';
  if (type.includes('electronic') || type.includes('technology') || type.includes('semiconductor')) return 'Electronics & Technology';
  if (type.includes('chemical') || type.includes('pharmaceutical') || type.includes('coating') || type.includes('resin')) return 'Chemicals & Materials';
  if (type.includes('food') || type.includes('agriculture') || type.includes('beverage')) return 'Food & Agriculture';
  if (type.includes('machinery') || type.includes('equipment') || type.includes('industrial')) return 'Machinery & Equipment';
  if (type.includes('metal') || type.includes('steel') || type.includes('aluminum')) return 'Metals & Mining';
  if (type.includes('plastic') || type.includes('polymer')) return 'Plastics & Polymers';

  return 'General Manufacturing';
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
    const { data, error } = await supabase
      .from('ai_classifications')
      .insert({
        hs_code: classificationResult.hs_code,
        component_description: component.description,
        base_mfn_rate: classificationResult.base_mfn_rate || classificationResult.mfn_rate,
        policy_adjusted_mfn_rate: classificationResult.policy_adjusted_mfn_rate || classificationResult.mfn_rate,
        mfn_rate: classificationResult.mfn_rate,
        usmca_rate: classificationResult.usmca_rate,
        policy_adjustments: classificationResult.policy_adjustments || [],
        confidence: classificationResult.confidence,
        reasoning: classificationResult.reasoning,
        origin_country: component.origin_country,
        value_percentage: component.value_percentage,
        verified: false, // AI-generated, not human-verified
        last_updated: classificationResult.last_updated || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });

    if (error) {
      // IMPROVED ERROR LOGGING: Log full error object to diagnose issue
      console.error(`⚠️ Failed to save AI data to database:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        full_error: JSON.stringify(error, null, 2)
      });
    } else {
      console.log(`💾 Saved AI classification to database: HS ${classificationResult.hs_code} (verified: false)`);
    }
  } catch (error) {
    // Catch any unexpected errors
    console.error(`⚠️ Database save exception:`, {
      message: error.message,
      stack: error.stack
    });
  }
}

/**
 * Save tariff rates from AI lookups to database (builds database over time)
 * Called after TIER 1 (OpenRouter) or TIER 2 (Anthropic) success
 * @param {Object} freshRates - AI-generated tariff rates { [hsCode]: { mfn_rate, usmca_rate, ... } }
 * @param {Array} components - Component data with descriptions and origins
 */
async function saveTariffRatesToDatabase(freshRates, components) {
  console.log(`💾 Saving ${Object.keys(freshRates).length} AI tariff rates to database...`);

  try {
    const savePromises = [];

    for (const [hsCode, rates] of Object.entries(freshRates)) {
      const component = components.find(c =>
        (c.hs_code || c.classified_hs_code) === hsCode
      );

      if (!component) continue;

      // Save each rate to ai_classifications table
      savePromises.push(
        supabase
          .from('ai_classifications')
          .insert({
            hs_code: hsCode,
            component_description: component.description || 'AI tariff lookup',
            mfn_rate: rates.mfn_rate || 0,
            base_mfn_rate: rates.base_mfn_rate || rates.mfn_rate || 0,
            policy_adjusted_mfn_rate: rates.mfn_rate || 0,
            usmca_rate: rates.usmca_rate || 0,
            policy_adjustments: rates.policy_adjustments || [],
            origin_country: component.origin_country,
            confidence: 95, // AI tariff lookup is high confidence
            verified: false, // AI-generated, not human-verified
            last_updated: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
          })
          .then(({ error }) => {
            if (error && error.code !== '23505') { // Ignore duplicate errors
              console.error(`⚠️ Failed to save ${hsCode}:`, error.message);
            }
          })
      );
    }

    await Promise.all(savePromises);
    console.log(`✅ Successfully saved ${savePromises.length} AI tariff rates to database`);

  } catch (error) {
    // Non-blocking - don't fail the request if DB save fails
    console.error('⚠️ Database save error:', error.message);
  }
}
