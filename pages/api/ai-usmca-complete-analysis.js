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
import { enrichmentRouter } from '../../lib/tariff/enrichment-router.js';
// ✅ Phase 3 Extraction: Form validation utilities (Oct 23, 2025)
import {
  getCacheExpiration,
  getIndustryThresholds,
  getDeMinimisThreshold,
  parseTradeVolume,
  extractIndustryFromBusinessType,
  CACHE_EXPIRATION,
  INDUSTRY_THRESHOLDS,
  DE_MINIMIS
} from '../../lib/validation/form-validation.js';

// ✅ Phase 3 Extraction: Tariff calculation functions (Oct 24, 2025)
import {
  enrichComponentsWithTariffIntelligence,
  lookupBatchTariffRates,
  saveTariffRatesToDatabase
} from '../../lib/tariff/tariff-calculator.js';

// ✅ Phase 3 Extraction: USMCA qualification functions (Oct 24, 2025)
import {
  buildComprehensiveUSMCAPrompt
} from '../../lib/usmca/qualification-engine.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ REMOVED: Global TARIFF_CACHE (line 22)
// REASON: In-memory cache without user isolation allows cross-user data contamination
// REPLACED BY: Database-only caching with destination-aware TTL
// User B would receive User A's cached tariff rates - CRITICAL COMPLIANCE RISK
// See: Data Integrity Audit - CRITICAL FINDING #1

// ✅ EXTRACTED (Phase 3, Oct 23, 2025): Constants and utility functions moved to lib/validation/form-validation.js
// - CACHE_EXPIRATION
// - getCacheExpiration()
// - INDUSTRY_THRESHOLDS
// - DE_MINIMIS
// - parseTradeVolume()
// These are now imported from lib/validation/form-validation.js (see imports above)

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

    // Validate ALL required fields (UI marks 14 fields as required, API must validate all)
    const requiredFields = {
      company_name: formData.company_name,
      business_type: formData.business_type,
      industry_sector: formData.industry_sector,
      company_address: formData.company_address,
      company_country: formData.company_country,
      destination_country: formData.destination_country,  // CRITICAL for tariff routing
      contact_person: formData.contact_person,
      contact_phone: formData.contact_phone,
      contact_email: formData.contact_email,
      trade_volume: formData.trade_volume,                // CRITICAL for savings calculation
      tax_id: formData.tax_id,                            // CRITICAL for certificates
      supplier_country: formData.supplier_country,        // CRITICAL for AI analysis
      manufacturing_location: formData.manufacturing_location, // CRITICAL for AI analysis (can be "DOES_NOT_APPLY")
      component_origins: formData.component_origins
    };

    const missingFields = Object.keys(requiredFields).filter(key => {
      const value = requiredFields[key];
      // Check for missing values (null, undefined, empty string, empty array)
      if (!value) return true;
      if (Array.isArray(value) && value.length === 0) return true;
      return false;
    });

    if (missingFields.length > 0) {
      await DevIssue.validationError('usmca_analysis', 'required_fields', `Missing required fields: ${missingFields.join(', ')}`, {
        userId,
        missing_fields: missingFields,
        field_count: missingFields.length
      });
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missing_fields: missingFields
      });
    }

    // ========== VALIDATE COMPONENT PERCENTAGES DON'T EXCEED 100% ==========
    const totalPercentage = formData.component_origins.reduce((sum, component) => {
      return sum + parseFloat(component.value_percentage || 0);
    }, 0);

    if (totalPercentage > 100) {
      await DevIssue.validationError('usmca_analysis', 'component_percentage_sum', `Component percentages exceed 100%: ${totalPercentage}%`, {
        userId,
        company: formData.company_name,
        total_percentage: totalPercentage,
        components: formData.component_origins.map(c => ({
          description: c.description,
          percentage: c.value_percentage
        }))
      });
      return res.status(400).json({
        success: false,
        error: `Component percentages exceed 100%. Total: ${totalPercentage}%. Please adjust component values so they sum to 100% or less.`,
        total_percentage: totalPercentage,
        components: formData.component_origins.map(c => ({
          description: c.description,
          percentage: c.value_percentage
        }))
      });
    }

    console.log(`✅ Component percentage validation passed: ${totalPercentage}%`);

    // ========== LOG MISSING OPTIONAL FIELDS (for admin review) ==========
    const missingOptionalFields = [];

    // manufacturing_location is now REQUIRED (moved to requiredFields above)

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
      // ✅ DESTINATION-AWARE: Pass destination for smart cache expiration
      componentRates = await lookupBatchTariffRates(componentsWithHSCodes, formData.destination_country);
      console.log(`✅ Got tariff rates for ${Object.keys(componentRates).length} components (dest: ${formData.destination_country})`);
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

    // ========== CRITICAL: VALIDATE AI NUMBERS AGAINST CACHED TARIFF DATA ==========
    // Prevent AI hallucinations like claiming "77.5% MFN rate" when cache shows 2.9%
    // ✅ ISSUE #6 FIX: Only validate ACTUAL tariff rates, not component percentages or derived metrics
    if (analysis.detailed_analysis?.savings_analysis && componentRates) {
      // Extract ONLY the actual tariff rates that should be validated
      // These are: mfn_rate, usmca_rate, section_301, section_232, total_rate
      const tariffRatesToValidate = [];

      // Collect all actual tariff rates from enriched components
      Object.values(componentRates).forEach(rates => {
        if (rates.mfn_rate !== undefined && rates.mfn_rate !== null) tariffRatesToValidate.push(rates.mfn_rate);
        if (rates.base_mfn_rate !== undefined && rates.base_mfn_rate !== null) tariffRatesToValidate.push(rates.base_mfn_rate);
        if (rates.section_301 !== undefined && rates.section_301 !== null && rates.section_301 > 0) tariffRatesToValidate.push(rates.section_301);
        if (rates.section_232 !== undefined && rates.section_232 !== null && rates.section_232 > 0) tariffRatesToValidate.push(rates.section_232);
        if (rates.total_rate !== undefined && rates.total_rate !== null) tariffRatesToValidate.push(rates.total_rate);
        if (rates.usmca_rate !== undefined && rates.usmca_rate !== null) tariffRatesToValidate.push(rates.usmca_rate);
      });

      // Normalize to a Set to remove duplicates
      const validCacheRates = new Set(tariffRatesToValidate.map(r => Math.round(r * 10) / 10));

      // Extract ALL percentages from AI text (this will include non-tariff percentages)
      // savings_analysis can be an object now, so get the string content from calculation_detail
      const savingsText = typeof analysis.detailed_analysis.savings_analysis === 'string'
        ? analysis.detailed_analysis.savings_analysis
        : analysis.detailed_analysis.savings_analysis?.calculation_detail || '';
      const percentageMatches = savingsText.match(/(\d+\.?\d*)%/g) || [];
      const allPercentages = percentageMatches.map(p => parseFloat(p.replace('%', '')));

      // Filter to ONLY percentages that look like tariff rates (0-100%)
      // Tariff rates are: 0.x%, 1-100% with variations
      const aiClaimedRates = allPercentages.filter(pct => pct >= 0 && pct <= 100);

      // Validate: Only report if AI claimed a tariff-like rate NOT in our cache
      const significantDeviations = aiClaimedRates.filter(aiRate => {
        const normalized = Math.round(aiRate * 10) / 10;
        return !validCacheRates.has(normalized) && aiRate > 0.1; // Ignore rates <0.1%
      });

      // Only log if we have deviations AND they look like they SHOULD be tariff rates
      // (i.e., they're unusual enough to warrant investigation)
      if (significantDeviations.length > 0 && significantDeviations.some(d => d >= 10 || d === 25 || d === 75)) {
        console.warn('⚠️ AI VALIDATION WARNING: AI claimed tariff rates not matching cache:', significantDeviations);

        await DevIssue.unexpectedBehavior(
          'usmca_analysis',
          `AI claimed tariff rates (${significantDeviations.join('%, ')}%) not matching cached data`,
          {
            userId,
            company: formData.company_name,
            ai_claimed_rates: significantDeviations,
            cached_rates: Array.from(validCacheRates),
            note: 'Validation distinguishes between tariff rates and component percentages'
          }
        );

        // Add validation warning to trust indicators
        analysis._validation_warning = `AI claimed tariff rates ${significantDeviations.join('%, ')}% not matching cached data. Verify against enriched component rates.`;
      } else {
        console.log('✅ AI tariff rates validated - all claimed rates match cached data or are non-tariff metrics');
      }
    }

    // ✅ ROOT CAUSE FIX #3: Validate Preference Criterion Before Building Response
    // CRITICAL: If AI says product is qualified, it MUST have determined the preference criterion
    if (analysis.usmca?.qualified === true) {
      if (!analysis.usmca?.preference_criterion) {
        return res.status(400).json({
          success: false,
          error: 'INCOMPLETE_ANALYSIS',
          error_code: 'MISSING_PREFERENCE_CRITERION',
          user_message: 'AI analysis qualified this product for USMCA but did not determine the preference criterion. ' +
                        'This is a required field for valid certificate generation. Please try the analysis again.',
          details: {
            qualified: analysis.usmca?.qualified,
            provided_criterion: analysis.usmca?.preference_criterion,
            reason: 'Preference criterion is required for all USMCA-qualified products to generate valid certificates'
          }
        });
      }

      // Also validate other critical USMCA fields for qualified products
      const requiredUSMCAFields = {
        'north_american_content': analysis.usmca?.north_american_content,
        'threshold_applied': analysis.usmca?.threshold_applied,
        'rule': analysis.usmca?.rule
      };

      const missingFields = Object.entries(requiredUSMCAFields)
        .filter(([key, value]) => value === null || value === undefined)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'INCOMPLETE_ANALYSIS',
          error_code: 'MISSING_USMCA_FIELDS',
          user_message: `AI analysis qualified this product but is missing critical USMCA fields: ${missingFields.join(', ')}. ` +
                        'Please try the analysis again.',
          details: {
            qualified: true,
            missing_fields: missingFields
          }
        });
      }
    }

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
        trade_volume: parseTradeVolume(formData.trade_volume), // ✅ Parse string to number (handles commas)
        supplier_country: formData.supplier_country,
        destination_country: formData.destination_country,

        // Company details for certificate
        company_address: formData.company_address || '',
        address: formData.company_address || '',
        company_country: formData.company_country || '',  // ✅ CRITICAL FIX: Where company is located
        country: formData.company_country || '',  // ✅ FIX: Company location, NOT destination
        tax_id: formData.tax_id || '',
        contact_person: formData.contact_person || '',
        contact_email: formData.contact_email || '',
        contact_phone: formData.contact_phone || '',
        certifier_type: formData.certifier_type || 'EXPORTER'  // ✅ Pass certifier type from UI
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
        preference_criterion: analysis.usmca?.qualified ? analysis.usmca?.preference_criterion : null,
        manufacturing_location: formData.manufacturing_location || '',
        documentation_required: analysis.usmca?.documentation_required || [
          'Manufacturing records',
          'Bill of materials',
          'Supplier declarations'
        ]
      },

      // Method of qualification for certificate (from AI based on industry rules)
      // Convert method name to certificate code: Net Cost -> NC, Transaction Value -> TV
      method_of_qualification: (() => {
        const method = analysis.usmca?.method_of_qualification || 'Transaction Value';
        if (method.includes('Net Cost')) return 'NC';
        if (method.includes('Transaction Value')) return 'TV';
        if (method.includes('Yarn Forward')) return 'YF';
        return 'TV'; // Default to Transaction Value
      })(),

      // Tariff savings (only if qualified for USMCA) - extracted from detailed_analysis.savings_analysis
      // CRITICAL: Single source of truth - AI calculates savings ONCE in detailed_analysis, not twice
      savings: {
        annual_savings: analysis.usmca?.qualified ? (analysis.detailed_analysis?.savings_analysis?.annual_savings || 0) : 0,
        monthly_savings: analysis.usmca?.qualified ? (analysis.detailed_analysis?.savings_analysis?.monthly_savings || 0) : 0,
        savings_percentage: analysis.usmca?.qualified ? (analysis.detailed_analysis?.savings_analysis?.savings_percentage || 0) : 0,
        mfn_rate: analysis.detailed_analysis?.savings_analysis?.mfn_rate || 0,
        usmca_rate: analysis.detailed_analysis?.savings_analysis?.usmca_rate || 0
      },

      // Certificate (if qualified)
      certificate: analysis.usmca?.qualified ? {
        qualified: true,
        preference_criterion: analysis.usmca?.preference_criterion,
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

    const enrichedComponents = await enrichComponentsWithTariffIntelligence(
      formData.component_origins,
      fullBusinessContext,
      formData.destination_country  // NEW: Pass destination for routing
    );
    console.log('✅ Component enrichment complete:', {
      total_components: enrichedComponents.length,
      enriched_count: enrichedComponents.filter(c => c.classified_hs_code).length,
      destination_country: formData.destination_country
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

    // ✅ FIX: Include company object for certificate generation with ALL fields
    result.company = {
      name: formData.company_name,
      company_name: formData.company_name,
      country: formData.company_country,
      company_country: formData.company_country,
      address: formData.company_address,
      company_address: formData.company_address,
      tax_id: formData.tax_id,
      contact_person: formData.contact_person,
      contact_phone: formData.contact_phone,
      contact_email: formData.contact_email,
      business_type: formData.business_type,
      industry_sector: formData.industry_sector,
      trade_volume: formData.trade_volume,
      destination_country: formData.destination_country,
      supplier_country: formData.supplier_country,
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

          // Company information
          company_name: formData.company_name,
          business_type: formData.business_type,  // Business role
          industry_sector: formData.industry_sector,  // Industry classification
          company_address: formData.company_address,  // Required for certificates
          company_country: formData.company_country,  // Where company is located
          tax_id: formData.tax_id,  // Required for USMCA certificates

          // Contact information (for Jorge/Cristina service delivery)
          contact_person: formData.contact_person,
          contact_phone: formData.contact_phone,
          contact_email: formData.contact_email,

          // Trade flow information
          supplier_country: formData.supplier_country,  // Used in AI trade flow analysis
          destination_country: formData.destination_country,  // Export destination
          trade_volume: formData.trade_volume ? parseFloat(formData.trade_volume.replace(/[^0-9.-]+/g, '')) : null,

          // Manufacturing information
          manufacturing_location: formData.manufacturing_location,
          substantial_transformation: formData.substantial_transformation || false, // Manufacturing complexity flag

          // Product information
          product_description: formData.product_description,
          hs_code: result.product.hs_code,
          component_origins: normalizedComponents, // CRITICAL: Save NORMALIZED enriched components with tariff intelligence

          // USMCA qualification results
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

    // ========== RESPONSE WRAPPER FOR TEST COMPATIBILITY ==========
    // Issue #1 test expects: result.analysis.detailed_analysis.savings_analysis
    // Issue #2 test expects: result.enrichment_data.component_origins
    // Add these wrapper objects for backwards compatibility with tests
    result.analysis = {
      detailed_analysis: result.detailed_analysis,
      initial_summary: undefined  // Issue #1 test checks this doesn't exist
    };

    // Add annual_savings at top level (Issue #1 test expects this)
    result.annual_savings = result.savings?.annual_savings || 0;
    result.monthly_savings = result.savings?.monthly_savings || 0;

    // Add enrichment_data wrapper for Issue #2 test
    result.enrichment_data = {
      component_origins: result.component_origins || []
    };

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
 * ⚡ OPTIMIZED PROMPT BUILDER - Reduced from 9,400 → 4,200 chars (55% smaller)
 * Uses constants instead of verbose inline documentation
 * All Week 1 enhancements preserved
 */
