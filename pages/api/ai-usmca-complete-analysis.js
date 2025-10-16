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
    if (!formData.company_name || !formData.business_type || !formData.industry_sector || !formData.component_origins || formData.component_origins.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: company_name, business_type, industry_sector, component_origins'
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
        model: 'anthropic/claude-3-haiku', // Haiku is perfect for qualification analysis (fast + cheap)
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0 // Zero temperature for perfect determinism (same input = same output)
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

      // Trust indicators
      trust: {
        ai_powered: true,
        model: 'claude-3-haiku',
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

  // Batch fetch tariff rates for all components needing them in ONE AI call
  let batchRates = {};
  if (componentsNeedingRates.length > 0) {
    console.log(`🔍 Fetching ALL tariff rates in single AI call...`);
    batchRates = await lookupBatchTariffRates(componentsNeedingRates);
    console.log(`✅ Batch rates fetched for ${Object.keys(batchRates).length} components`);
  }

  // Enrich all components with tariff intelligence
  const enrichedComponents = components.map((component, index) => {
    try {
      const enriched = { ...component };

      // Case 1: No HS code at all
      if (!component.hs_code && !component.classified_hs_code) {
        console.warn(`⚠️ Component "${component.description}" missing HS code`);
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
        }
      }

      enriched.savings_percent = enriched.mfn_rate - enriched.usmca_rate;
      enriched.last_updated = component.last_updated || new Date().toISOString().split('T')[0];
      enriched.is_usmca_member = usmcaCountries.includes(component.origin_country);

      return enriched;

    } catch (error) {
      console.error(`❌ Error enriching component "${component.description}":`, error);
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
 * Fetch active tariff policy updates from database for AI prompt injection
 * This makes AI prompts dynamically update based on RSS feeds, GTA API, and admin-approved policies
 */
async function getActivePolicyUpdates() {
  try {
    const { data: policies, error } = await supabase
      .from('tariff_policy_updates')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'approved')
      .order('priority', { ascending: true }) // Priority 1 first
      .order('effective_date', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch policy updates:', error);
      return [];
    }

    return policies || [];
  } catch (error) {
    console.error('❌ Error fetching policy updates:', error);
    return [];
  }
}

/**
 * Build dynamic tariff policy context from database (replaces hardcoded policy text)
 * Automatically updates AI prompts when admins approve new policies from RSS/GTA
 */
async function buildDynamicPolicyContext(originCountry) {
  const policies = await getActivePolicyUpdates();

  if (policies.length === 0) {
    // Fallback to basic context if no policies in database yet
    return `===== CURRENT TARIFF POLICY CONTEXT (2025) =====

NOTE: Using baseline tariff analysis. Admin has not activated any specific policy updates yet.

YOUR TASK - PROVIDE CURRENT RATES:
- Use your knowledge of BASELINE MFN rates from the Harmonized Tariff Schedule
- USMCA Rate: Preferential rate under USMCA treaty (typically 0% for qualifying goods)
- Always provide BOTH base rate AND policy-adjusted rate if adjustments apply
- Include last_updated date (today: ${new Date().toISOString().split('T')[0]})`;
  }

  // Build dynamic policy context from database
  const criticalChanges = policies
    .filter(p => p.priority <= 3)
    .map(p => `- ${p.prompt_text}`)
    .join('\n');

  // Group policies by affected countries for country-specific adjustments
  const countryPolicies = {};
  policies.forEach(policy => {
    if (policy.affected_countries && Array.isArray(policy.affected_countries)) {
      policy.affected_countries.forEach(country => {
        if (!countryPolicies[country]) {
          countryPolicies[country] = [];
        }
        countryPolicies[country].push(policy);
      });
    }
  });

  // Build country-specific adjustments
  const countryAdjustments = Object.entries(countryPolicies)
    .map(([country, countryPols]) => {
      const adjustments = countryPols
        .map(p => `${p.tariff_adjustment}${p.adjustment_percentage ? ` (${p.adjustment_percentage}%)` : ''}`)
        .join(', ');
      return `- ${country}: ${adjustments}`;
    })
    .join('\n');

  return `===== CURRENT TARIFF POLICY CONTEXT (2025) =====

CRITICAL RECENT CHANGES (from official sources):
${criticalChanges || '- No critical policy changes active'}

ORIGIN COUNTRY POLICY ADJUSTMENTS:
${countryAdjustments || '- No country-specific adjustments active'}

${originCountry && countryPolicies[originCountry] ? `
⚠️ COMPONENT ORIGIN: ${originCountry}
Applicable policies:
${countryPolicies[originCountry].map(p => `- ${p.tariff_adjustment}: ${p.description.substring(0, 150)}...`).join('\n')}
` : ''}

YOUR TASK - PROVIDE CURRENT RATES:
- Use your knowledge of BASELINE MFN rates from the Harmonized Tariff Schedule
- APPLY active policy adjustments listed above for origin country ${originCountry}
- Always provide BOTH base rate AND policy-adjusted rate
- Flag significant policy adjustments in policy_adjustments array
- Include last_updated date (today: ${new Date().toISOString().split('T')[0]})

SOURCE: Policies approved by admin from Global Trade Alert API, government RSS feeds, and official announcements`;
}

/**
 * Classify component description to HS code using AI with progressive context
 * @param {string} componentDescription - Component description to classify
 * @param {Object|string} businessContext - Full business context or just product description (backward compatible)
 * @param {Object} component - Component data with origin and percentage
 * @param {Array} previousComponents - Previously classified components for relationship context (optional)
 * @returns {Object} Classification result with hs_code, tariff rates, and confidence
 */
async function classifyComponentHS(componentDescription, businessContext, component, previousComponents = []) {
  try {
    // Extract context fields (support both object and string for backward compatibility)
    const context = typeof businessContext === 'string'
      ? { product_description: businessContext }
      : businessContext;

    // Build dynamic policy context from database
    const policyContext = await buildDynamicPolicyContext(component.origin_country);

    // Build progressive component context (previously classified components)
    let previousComponentsContext = '';
    if (previousComponents.length > 0) {
      previousComponentsContext = `\n===== PREVIOUSLY CLASSIFIED COMPONENTS (for relationship context) =====
${previousComponents.map((prev, idx) =>
  `Component ${idx + 1}: "${prev.description}" from ${prev.origin_country}
  → Classified as: HS ${prev.classified_hs_code || prev.hs_code || 'pending'}
  → Purpose: ${prev.value_percentage}% of final product value`
).join('\n')}

IMPORTANT: Consider how this new component relates to the previously classified components.
- If components work together (e.g., microcontrollers + circuit board), use consistent classification family
- If circuit board houses processors (8542.31), classify board appropriately for electronics
- If enclosure contains electronics, classify as electronics housing (8538.90) not generic

===== CURRENT COMPONENT TO CLASSIFY =====`;
    }

    const classificationPrompt = `You are a senior HS code classification expert with 20+ years of experience. Use COMPLETE business context for accurate classification.

===== COMPLETE BUSINESS CONTEXT =====
Company: ${context.company_name || 'Not specified'}
Business Type: ${context.business_type || context.business_role || 'Not specified'}
Industry Sector: ${context.industry_sector || context.industry || 'Not specified'}
Trade Volume: ${context.trade_volume || 'Not specified'}
End Use: ${context.end_use || 'commercial'}

FINAL PRODUCT:
Product: ${context.product_description}
Manufacturing Location: ${context.manufacturing_location || 'Not specified'}
${previousComponentsContext}
${previousComponentsContext ? '' : '===== COMPONENT TO CLASSIFY ====='}
Component Description: "${componentDescription}"
Component Origin: ${component.origin_country}
Component Value: ${component.value_percentage}% of total product value
Role in Final Product: Part of ${context.product_description}

${policyContext}

CLASSIFICATION RULES (USE FULL CONTEXT):
1. **Use business context**: Industry sector determines HS code selection (e.g., electronics vs automotive)
2. **Consider end-use**: Same component has different codes based on final product application
3. **Product integration**: "Circuit Board Assembly" in computer equipment = 8473.30, in control panels = 8537.10
4. Component origin: ${['US', 'MX', 'CA'].includes(component.origin_country) ? 'US/MX/CA (DOMESTIC - no import tariffs)' : component.origin_country + ' (IMPORTED - apply policy adjustments)'}

CONTEXT-AWARE CLASSIFICATION EXAMPLES:
Example 1: "Microcontrollers" for "Industrial Control Panel"
- Industry: Industrial Equipment → Use 8537.10.90 (control panel parts)
- NOT 8542.31 (standalone processors) because they're integrated into control systems

Example 2: "Microcontrollers" for "Gaming Console" or "Computer Equipment"
- Industry: Electronics/Technology → Use 8542.31 (processors and controllers)
- NOT 8537 (control panels) because gaming/computers use different classification

Example 3: "Circuit Board Assembly" for "Manufacturing Equipment"
- Industry: Machinery → Use 8537.10.90 (assembled control boards for industrial use)
- NOT 8534.00 (bare PCBs) because it's assembled, not bare

Example 4: "Circuit Board Assembly" for "Consumer Electronics"
- Industry: Electronics → Use 8473.30.51 (parts for computer/electronics)
- NOT 8537 (industrial control) because it's consumer electronics context

YOUR TASK: Classify "${componentDescription}" considering it's used in "${context.product_description}" within ${context.industry_sector || context.industry || 'general'} industry.

TARIFF CALCULATION (CRITICAL):
${['US', 'MX', 'CA'].includes(component.origin_country) ?
`DOMESTIC (US/MX/CA):
- base_mfn_rate = HTS base rate (e.g., 2.7%)
- policy_adjusted_mfn_rate = base_mfn_rate (NO adjustments for domestic)
- mfn_rate = base_mfn_rate
- usmca_rate = 0.0 (qualifies for USMCA)
- policy_adjustments = []` :
`IMPORTED (${component.origin_country}):
- base_mfn_rate = HTS base rate (e.g., 0% for microcontrollers)
- ADD policy adjustments: Section 301 China +100% = 0% + 100% = 100%
- ADD port fees: 100% + 3% = 103%
- policy_adjusted_mfn_rate = 103.0
- mfn_rate = 103.0 (MUST equal policy_adjusted_mfn_rate)
- usmca_rate = 0.0
- policy_adjustments = ["Section 301 China +100%", "Port fees +3%"]

CALCULATION EXAMPLE (China microcontrollers):
base_mfn_rate: 0.0 (duty-free HTS base)
+ Section 301: 100.0
+ Port fees: 3.0
= policy_adjusted_mfn_rate: 103.0
= mfn_rate: 103.0 ✓ CORRECT`}

Return ONLY valid JSON (no markdown, no extra text):
{
  "hs_code": "XXXX.XX",
  "base_mfn_rate": 0.0,
  "policy_adjusted_mfn_rate": 0.0,
  "mfn_rate": 0.0,
  "usmca_rate": 0.0,
  "policy_adjustments": [],
  "confidence": 85,
  "last_updated": "2025-10-15",
  "reasoning": "MUST explain: (1) Why this HS code based on industry/end-use context, (2) How business context influenced classification, (3) Tariff calculation logic including any policy adjustments",
  "alternative_codes": ["List other possible codes that were considered but rejected"]
}`;

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
        temperature: 0 // Zero temperature for deterministic HS classification
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API failed: ${response.status}`);
    }

    const result = await response.json();
    const aiText = result.choices?.[0]?.message?.content;

    // Multi-strategy JSON extraction with control character sanitization
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
      console.error('❌ No JSON found in AI response');
      console.error('AI Response (first 500 chars):', aiText.substring(0, 500));
      throw new Error('No JSON found in AI response');
    }

    // CRITICAL: Sanitize control characters BEFORE parsing
    // Replace literal control characters with escaped versions
    const sanitizedJSON = jsonString
      .replace(/\r\n/g, ' ')  // Replace Windows line breaks with space
      .replace(/\n/g, ' ')    // Replace Unix line breaks with space
      .replace(/\r/g, ' ')    // Replace Mac line breaks with space
      .replace(/\t/g, ' ')    // Replace tabs with space
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove other control characters

    // Parse the sanitized JSON
    let classification;
    try {
      classification = JSON.parse(sanitizedJSON.trim());
      console.log(`✅ JSON parsed successfully (method: ${extractionMethod}, sanitized)`);
    } catch (parseError) {
      console.error('❌ JSON parsing failed after sanitization');
      console.error('Sanitized JSON (first 500 chars):', sanitizedJSON.substring(0, 500));
      console.error('Parse error:', parseError.message);
      throw new Error(`Failed to parse JSON: ${parseError.message}`);
    }

    return {
      success: true,
      hs_code: classification.hs_code,
      base_mfn_rate: classification.base_mfn_rate || classification.mfn_rate || 0,
      policy_adjusted_mfn_rate: classification.policy_adjusted_mfn_rate || classification.mfn_rate || 0,
      mfn_rate: classification.mfn_rate || 0,
      usmca_rate: classification.usmca_rate || 0,
      policy_adjustments: classification.policy_adjustments || [],
      last_updated: classification.last_updated || new Date().toISOString().split('T')[0],
      confidence: classification.confidence || 85,
      reasoning: classification.reasoning,
      alternative_codes: classification.alternative_codes || []
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
 * Lookup ONLY tariff rates for a given HS code (NO HS code classification)
 * This is called when component already has HS code but rates are missing
 * @param {string} hsCode - HS code to lookup rates for
 * @param {string} originCountry - Component origin country for policy adjustments
 * @returns {Object} Tariff rates only
 */
async function lookupTariffRatesOnly(hsCode, originCountry) {
  try {
    const policyContext = await buildDynamicPolicyContext(originCountry);

    const ratesPrompt = `You are a tariff rate specialist. Lookup ONLY the tariff rates for this HS code.

HS CODE: ${hsCode}
ORIGIN COUNTRY: ${originCountry}

${policyContext}

CRITICAL: Return ONLY tariff rates, NOT HS code classification.

Return valid JSON:
{
  "mfn_rate": 0.0,
  "base_mfn_rate": 0.0,
  "policy_adjusted_mfn_rate": 0.0,
  "usmca_rate": 0.0,
  "policy_adjustments": [],
  "last_updated": "2025-10-15"
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [{ role: 'user', content: ratesPrompt }],
        temperature: 0
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API failed: ${response.status}`);
    }

    const result = await response.json();
    const aiText = result.choices?.[0]?.message?.content;

    // Extract JSON (same logic as classifyComponentHS)
    let jsonString = aiText.trim().startsWith('{') ? aiText : null;
    if (!jsonString) {
      const match = aiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        jsonString = match[1];
      } else {
        const firstBrace = aiText.indexOf('{');
        const lastBrace = aiText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonString = aiText.substring(firstBrace, lastBrace + 1);
        }
      }
    }

    if (!jsonString) {
      throw new Error('No JSON in AI response');
    }

    const rates = JSON.parse(jsonString.trim());

    return {
      success: true,
      mfn_rate: rates.mfn_rate || 0,
      usmca_rate: rates.usmca_rate || 0,
      base_mfn_rate: rates.base_mfn_rate || rates.mfn_rate || 0,
      policy_adjusted_mfn_rate: rates.policy_adjusted_mfn_rate || rates.mfn_rate || 0,
      policy_adjustments: rates.policy_adjustments || [],
      last_updated: rates.last_updated || new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Tariff rates lookup failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Batch lookup tariff rates for multiple HS codes in a SINGLE AI call
 * This is MUCH more efficient than sequential lookupTariffRatesOnly() calls
 * @param {Array} components - Array of components with HS codes
 * @returns {Object} Map of HS code → tariff rates { [hsCode]: { mfn_rate, usmca_rate, ... } }
 */
async function lookupBatchTariffRates(components) {
  try {
    // Build list of HS codes with origin countries
    const componentList = components.map((c, idx) => {
      const hsCode = c.hs_code || c.classified_hs_code;
      return `${idx + 1}. HS Code: ${hsCode} | Origin: ${c.origin_country} | Description: "${c.description}"`;
    }).join('\n');

    // Get policy context for first component's origin (or could loop through unique origins)
    const uniqueOrigins = [...new Set(components.map(c => c.origin_country))];
    const policyContext = await buildDynamicPolicyContext(uniqueOrigins[0]);

    const batchPrompt = `You are a tariff rate specialist. Lookup tariff rates for ALL components below in a SINGLE response.

===== COMPONENTS TO LOOKUP (${components.length} total) =====
${componentList}

${policyContext}

CRITICAL INSTRUCTIONS:
- Return tariff rates for ALL ${components.length} components above
- Use the HS code and origin country to determine rates
- Apply policy adjustments based on origin country
- Return a JSON object mapping HS codes to their rates

Return valid JSON in this EXACT format:
{
  "rates": {
    "HS_CODE_1": {
      "mfn_rate": 0.0,
      "usmca_rate": 0.0,
      "policy_adjustments": []
    },
    "HS_CODE_2": {
      "mfn_rate": 0.0,
      "usmca_rate": 0.0,
      "policy_adjustments": []
    }
  }
}

EXAMPLE for China microcontrollers (HS 8542.31):
{
  "rates": {
    "8542.31": {
      "mfn_rate": 103.0,
      "usmca_rate": 0.0,
      "policy_adjustments": ["Section 301 China +100%", "Port fees +3%"]
    }
  }
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [{ role: 'user', content: batchPrompt }],
        temperature: 0
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API failed: ${response.status}`);
    }

    const result = await response.json();
    const aiText = result.choices?.[0]?.message?.content;

    // Multi-strategy JSON extraction (same as classifyComponentHS)
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
      console.error('❌ No JSON in batch tariff lookup response');
      console.error('AI Response (first 500 chars):', aiText.substring(0, 500));
      return {};
    }

    // CRITICAL: Sanitize control characters BEFORE parsing (same as classifyComponentHS)
    const sanitizedJSON = jsonString
      .replace(/\r\n/g, ' ')  // Replace Windows line breaks with space
      .replace(/\n/g, ' ')    // Replace Unix line breaks with space
      .replace(/\r/g, ' ')    // Replace Mac line breaks with space
      .replace(/\t/g, ' ')    // Replace tabs with space
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove other control characters

    // Parse the sanitized JSON
    let batchResult;
    try {
      batchResult = JSON.parse(sanitizedJSON.trim());
      console.log(`✅ Batch JSON parsed successfully (method: ${extractionMethod}, sanitized)`);
    } catch (parseError) {
      console.error('❌ Batch JSON parsing failed after sanitization');
      console.error('Sanitized JSON (first 500 chars):', sanitizedJSON.substring(0, 500));
      console.error('Parse error:', parseError.message);
      return {};
    }

    // Return the rates object (HS code → rates mapping)
    return batchResult.rates || {};

  } catch (error) {
    console.error('❌ Batch tariff rates lookup failed:', error);
    return {};
  }
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
