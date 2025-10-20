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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// In-memory cache for tariff rates (cost optimization)
const TARIFF_CACHE = new Map();

// ✅ DESTINATION-AWARE CACHE EXPIRATION (Smart Cost Optimization)
const CACHE_EXPIRATION = {
  'US': 24 * 60 * 60 * 1000,      // 24 hours - volatile Section 301 policies
  'CA': 90 * 24 * 60 * 60 * 1000, // 90 days - stable, predictable
  'MX': 60 * 24 * 60 * 60 * 1000, // 60 days - relatively stable
  'default': 24 * 60 * 60 * 1000  // 24 hours fallback
};

// Helper: Get cache expiration for destination
function getCacheExpiration(destination) {
  return CACHE_EXPIRATION[destination?.toUpperCase()] || CACHE_EXPIRATION['default'];
}

// ========== WEEK 1 ENHANCEMENT CONSTANTS (Performance Optimization) ==========

// Industry-specific thresholds (Week 1 Enhancement #2)
const INDUSTRY_THRESHOLDS = {
  'Automotive': { rvc: 75, labor: 22.5, article: 'Annex 4-B Art. 4.5', method: 'Net Cost', lvc_2025: 45 },
  'Electronics': { rvc: 65, labor: 17.5, article: 'Annex 4-B Art. 4.7', method: 'Transaction Value' },
  'Textiles/Apparel': { rvc: 55, labor: 27.5, article: 'Annex 4-B Art. 4.3', method: 'Yarn Forward' },
  'Chemicals': { rvc: 62.5, labor: 12.5, article: 'Article 4.2', method: 'Net Cost' },
  'Agriculture': { rvc: 60, labor: 17.5, article: 'Annex 4-B Art. 4.4', method: 'Transaction Value' },
  'default': { rvc: 62.5, labor: 15, article: 'Article 4.2', method: 'Net Cost or Transaction Value' }
};

// De minimis thresholds (Week 1 Enhancement #4 - October 2025 Accurate)
const DE_MINIMIS = {
  'US': {
    standard: 0,
    note: '⚠️ USA eliminated de minimis for ALL countries (Aug 2025)'
  },
  'CA': {
    standard: 20,      // CAD $20 from non-USMCA
    usmca_duty: 150,   // CAD $150 duty-free from US/MX
    usmca_tax: 40,     // CAD $40 tax-free from US/MX
    note: origin => (origin === 'US' || origin === 'MX')
      ? 'USMCA: CAD $150 duty-free, $40 tax-free'
      : 'CAD $20 - very low threshold'
  },
  'MX': {
    standard: 0,       // Abolished Dec 2024
    usmca: 117,        // USD $117 from US/CA (VAT >$50)
    note: origin => (origin === 'US' || origin === 'CA')
      ? 'USD $117 duty-free under USMCA (VAT applies >$50)'
      : 'No de minimis - 19% global tax rate (Dec 2024)'
  }
};

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
    if (analysis.detailed_analysis?.savings_analysis && componentRates) {
      const savingsText = analysis.detailed_analysis.savings_analysis;

      // Extract percentage claims from AI text (e.g., "77.5%", "102.5%")
      const percentageMatches = savingsText.match(/(\d+\.?\d*)%/g) || [];
      const aiPercentages = percentageMatches.map(p => parseFloat(p.replace('%', '')));

      // Get actual cached rates for comparison
      const cachedRates = Object.values(componentRates).map(r => ({
        baseMFN: r.mfn_rate || 0,
        section301: r.section_301 || 0,
        totalRate: r.total_rate || r.mfn_rate || 0,
        usmcaRate: r.usmca_rate || 0
      }));

      // Check if AI claimed any rates significantly different from cache (>10% deviation)
      const significantDeviations = aiPercentages.filter(aiRate => {
        const matchesAnyCache = cachedRates.some(cached =>
          Math.abs(aiRate - cached.baseMFN) < 1 ||  // Matches base MFN
          Math.abs(aiRate - cached.section301) < 1 || // Matches Section 301
          Math.abs(aiRate - cached.totalRate) < 1 ||  // Matches total rate
          Math.abs(aiRate - cached.usmcaRate) < 1     // Matches USMCA rate
        );

        return !matchesAnyCache && aiRate > 10; // AI claimed a rate >10% that doesn't match cache
      });

      if (significantDeviations.length > 0) {
        console.warn('⚠️ AI VALIDATION WARNING: AI claimed tariff rates not found in cache:', significantDeviations);

        await DevIssue.unexpectedBehavior(
          'usmca_analysis',
          `AI claimed tariff rates (${significantDeviations.join('%, ')}%) not matching cached data`,
          {
            userId,
            company: formData.company_name,
            ai_percentages: aiPercentages,
            cached_rates: cachedRates,
            deviations: significantDeviations,
            savings_analysis_preview: savingsText.substring(0, 300)
          }
        );

        // Add validation warning to trust indicators
        analysis._validation_warning = `AI claimed rates ${significantDeviations.join('%, ')}% not found in tariff cache. Use actual enriched component data instead.`;
      } else {
        console.log('✅ AI tariff numbers validated against cache - no significant deviations');
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
        trade_volume: formData.trade_volume,
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
async function buildComprehensiveUSMCAPrompt(formData, componentRates = {}) {
  // Get industry threshold from constants (Week 1 Enhancement #2)
  const industry = formData.industry_sector;
  const threshold = INDUSTRY_THRESHOLDS[industry] || INDUSTRY_THRESHOLDS['default'];

  // Calculate manufacturing labor (Week 1 Enhancement #3)
  const manufacturingLocation = formData.manufacturing_location;
  const isUSMCAManufacturing = ['US', 'MX', 'CA'].includes(manufacturingLocation);
  const substantialTransformation = formData.substantial_transformation || false;
  const laborValueAdded = isUSMCAManufacturing ? threshold.labor : 0;

  // Format components with rates (concise) - NOW WITH SECTION 301 VALIDATION
  const componentBreakdown = formData.component_origins
    .map((c, i) => {
      const rates = componentRates[c.hs_code] || {};

      // CRITICAL FIX: Show TOTAL rate with Section 301 breakdown to prevent AI hallucinations
      let rateStr = '';
      if (rates.mfn_rate !== undefined) {
        const baseMFN = rates.mfn_rate;
        const section301 = rates.section_301 || 0;
        const totalRate = rates.total_rate || baseMFN;
        const usmcaRate = rates.usmca_rate || 0;

        // Show breakdown: Base MFN + Section 301 = Total Rate
        if (section301 > 0) {
          rateStr = ` | Base MFN: ${baseMFN}% + Section 301: ${section301}% = Total: ${totalRate}% | USMCA: ${usmcaRate}% | Savings: ${baseMFN}% (Section 301 remains)`;
        } else {
          rateStr = ` | MFN: ${baseMFN}% | USMCA: ${usmcaRate}% | Savings: ${baseMFN - usmcaRate}%`;
        }
      }

      return `${i+1}. ${c.description} - ${c.value_percentage}% from ${c.origin_country}${c.hs_code ? ` (HS: ${c.hs_code})` : ''}${rateStr}`;
    }).join('\n');

  // De minimis note (Week 1 Enhancement #4)
  const destination = formData.destination_country;
  const origin = formData.supplier_country;
  const deMinimisInfo = DE_MINIMIS[destination];
  const deMinimisNote = deMinimisInfo
    ? typeof deMinimisInfo.note === 'function'
      ? deMinimisInfo.note(origin)
      : deMinimisInfo.note
    : '';

  // Week 1 Enhancement #1: Section 301 detection
  const hasChineseComponents = formData.component_origins.some(c =>
    c.origin_country === 'CN' || c.origin_country === 'China'
  );
  const destinationUS = formData.destination_country === 'US';
  const section301Applicable = hasChineseComponents && destinationUS;

  // Calculate USMCA component total for reference (AI will verify)
  const usmcaCountries = ['US', 'MX', 'CA'];
  const usmcaComponentTotal = formData.component_origins
    .filter(c => usmcaCountries.includes(c.origin_country))
    .reduce((sum, c) => sum + parseFloat(c.value_percentage || 0), 0);

  // Calculate total North American content (components + labor)
  const totalNAContent = usmcaComponentTotal + laborValueAdded;

  const prompt = `You are a USMCA trade compliance expert analyzing qualification for ${formData.product_description}.

Analyze whether this product qualifies for USMCA preferential treatment and provide educational explanations for an SMB owner juggling their business.

PRODUCT & BUSINESS CONTEXT:
- Industry: ${industry} (Threshold: ${threshold.rvc}% RVC per ${threshold.article})
- Manufacturing: ${manufacturingLocation} (Labor credit: ${laborValueAdded}%)
- Trade Flow: ${origin}→${destination}${formData.trade_volume ? ` | Annual Volume: $${formData.trade_volume}` : ''}

AUTHORITATIVE TARIFF DATA SOURCES (2025 Policy - Use in Priority Order):
🚀 Tier 1 (Speed): Trump 2.0 Tracker - https://www.piie.com/trump-trade-tracker
   Use this for immediate answers on current tariff rates, Section 301 status, and recent policy changes.
   This tracker is updated weekly and provides human-readable summaries of tariff actions.

📜 Tier 2 (Verification): Federal Register - Official Government Source
   Confirm rates are official and cite specific Federal Register documents when available.
   - Tariff notices: https://www.federalregister.gov/api/v1/documents.rss?conditions[search_type_id]=3&conditions[term]=tariff
   - Section 301: https://www.federalregister.gov/api/v1/documents.rss?conditions[search_type_id]=3&conditions[term]=Section+301
   - Duties: https://www.federalregister.gov/api/v1/documents.rss?conditions[search_type_id]=3&conditions[term]=duties

🏭 Industry-Specific: RVIA Tariff Developments - https://www.rvia.org/news-insights/latest-tariff-developments
   For automotive, RV, and vehicle-related components.

CRITICAL: Always cite your source when stating tariff rates. If using Trump Tracker data, mention it was verified against Federal Register when possible.

COMPONENTS:
${componentBreakdown}

MANUFACTURING CONTEXT (Explain to client):
The ${laborValueAdded}% manufacturing value-added represents labor, overhead, and assembly performed in ${manufacturingLocation}.
USMCA Article ${threshold.article} allows this ${threshold.labor}% labor credit because final assembly occurs in USMCA territory.

Manufacturing Complexity: ${substantialTransformation ? '✓ SUBSTANTIAL TRANSFORMATION - Complex manufacturing confirmed (welding, forming, heat treatment, etc.). This strengthens qualification and reduces audit risk. Advise client to document these processes.' : '⚠️ SIMPLE ASSEMBLY - Standard assembly operations. May face higher audit scrutiny. Recommend documenting value-added activities to strengthen qualification.'}

Regional Content Calculation (Show your work for transparency):
- USMCA Components: ${usmcaComponentTotal}%
- Manufacturing Labor Credit: ${laborValueAdded}%
- Total North American Content: ${totalNAContent}%${section301Applicable ? `

CURRENT POLICY ALERT (2025): Chinese components remain subject to Section 301 tariffs (~25%) even with USMCA qualification. Base MFN duties are eliminated, but Section 301 remains.` : ''}${deMinimisNote ? `

${deMinimisNote}` : ''}

TARIFF SAVINGS ANALYSIS (Show calculations for client education):${formData.trade_volume ? `
- Annual Trade Volume: $${formData.trade_volume}
- Calculate per component: Volume × Component % × Tariff Savings Rate
- Show your work for each component using actual percentages and rates from component data above${section301Applicable ? `
- For Chinese components: Only base MFN eliminated (Section 301 remains)` : ''}` : `
- No trade volume provided - explain savings as percentage impact per component`}

PREFERENCE CRITERION: Determine which USMCA criterion applies (A/B/C/D) based on the product's qualification method (${threshold.method}) and whether it has non-USMCA components.

RESPONSE FORMAT (educational and transparent):

{
  product: {
    hs_code: "string",
    confidence: number
  },
  usmca: {
    qualified: boolean,  // YOUR determination based on analysis
    threshold_applied: ${threshold.rvc},
    threshold_source: "${threshold.article}",
    threshold_reasoning: "Explain why this threshold applies",
    north_american_content: number,  // YOUR calculated total
    gap: number,  // Difference from threshold
    rule: "RVC ${threshold.rvc}%",
    reason: "Your detailed reasoning for qualification decision",
    component_breakdown: array,
    documentation_required: ["string"],
    method_of_qualification: "${threshold.method}",
    preference_criterion: "A/B/C/D"  // Choose based on your analysis
  },
  savings: {
    annual_savings: number,
    monthly_savings: number,
    savings_percentage: number,
    mfn_rate: number,
    usmca_rate: 0
  },
  recommendations: ["Actionable recommendations"],
  detailed_analysis: {
    threshold_research: "Why this specific threshold applies",
    calculation_breakdown: "Step-by-step calculation with your reasoning",
    qualification_reasoning: "Why you determined this qualification status",
    strategic_insights: "Business optimization opportunities",
    savings_analysis: "Detailed tariff savings breakdown"
  },
  confidence_score: number
}`;

  return prompt;
}

/**
 * Enrich components with HS code classification, tariff rates, and savings calculations
 * Uses destination-aware EnrichmentRouter with 3-tier cache strategy
 * @param {Array} components - Array of component objects with basic data
 * @param {Object} businessContext - Full business context including product, industry, end-use
 * @param {String} destination_country - Export destination (MX/CA/US) for tariff routing
 * @returns {Array} Enriched components with tariff intelligence
 */
async function enrichComponentsWithTariffIntelligence(components, businessContext, destination_country = 'US') {
  const productContext = typeof businessContext === 'string' ? businessContext : businessContext.product_description;
  const usmcaCountries = ['US', 'MX', 'CA'];

  console.log(`📦 Destination-aware enrichment for ${components.length} components → ${destination_country}`);
  console.log(`   Strategy: ${destination_country === 'MX' ? 'Database (free)' : destination_country === 'CA' ? 'AI + 90-day cache' : 'AI + 24-hour cache'}`);

  // Process each component through EnrichmentRouter in parallel
  const enrichmentPromises = components.map(async (component, index) => {
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

      // Case 2: Has HS code - use EnrichmentRouter
      const hsCode = component.hs_code || component.classified_hs_code;
      console.log(`   Component ${index + 1}/${components.length}: Routing HS ${hsCode} from ${component.origin_country} → ${destination_country}`);

      // Call EnrichmentRouter with destination-aware routing
      const enrichedData = await enrichmentRouter.enrichComponent(
        {
          country: component.origin_country,
          component_type: component.description || component.component_type || 'Unknown',
          percentage: component.value_percentage
        },
        destination_country,
        productContext,
        hsCode
      );

      // Check if enrichment failed
      if (enrichedData.enrichment_error) {
        console.error(`   ❌ Enrichment failed for component ${index + 1}: ${enrichedData.error_message}`);
        return {
          ...component,
          hs_code: hsCode,
          confidence: 0,
          mfn_rate: 0,
          usmca_rate: 0,
          savings_percent: 0,
          rate_source: 'enrichment_error',
          error_message: enrichedData.error_message,
          is_usmca_member: usmcaCountries.includes(component.origin_country)
        };
      }

      // Success - merge enriched data with original component
      enriched.classified_hs_code = hsCode;
      enriched.hs_code = hsCode;
      enriched.confidence = enrichedData.ai_confidence || component.confidence || 100;
      enriched.hs_description = enrichedData.hs_description || component.hs_description || component.description;
      enriched.mfn_rate = enrichedData.mfn_rate || 0;
      enriched.usmca_rate = enrichedData.usmca_rate || 0;
      enriched.savings_percent = enrichedData.savings_percentage || 0;
      enriched.rate_source = enrichedData.data_source || 'enrichment_router';
      enriched.cache_age_days = enrichedData.cache_age_days;
      enriched.tariff_policy = enrichedData.tariff_policy;
      enriched.policy_adjustments = enrichedData.policy_adjustments;
      enriched.last_updated = enrichedData.last_updated || new Date().toISOString().split('T')[0];
      enriched.is_usmca_member = usmcaCountries.includes(component.origin_country);

      console.log(`   ✅ Component ${index + 1}: Enriched (MFN ${enriched.mfn_rate}%, Source: ${enriched.rate_source})`);
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

  // Wait for all enrichments to complete
  const enrichedComponents = await Promise.all(enrichmentPromises);

  console.log(`✅ Destination-aware enrichment complete: ${enrichedComponents.length} components processed for ${destination_country}`);
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
 * 4-TIER DESTINATION-AWARE TARIFF LOOKUP
 * Tier 0: Database cache (instant, free) - Check first with destination-aware expiration
 * Tier 1: In-memory cache (instant, free) - Session-level cache
 * Tier 2: OpenRouter (primary) - Current 2025 policy (~$0.02/request)
 * Tier 3: Anthropic Direct - Backup if OpenRouter down
 * Tier 4: Database fallback - Last resort (stale Jan 2025 data)
 */
async function lookupBatchTariffRates(components, destination_country = 'US') {
  // STEP 0: Check DATABASE cache first (persistent across restarts)
  const dbCachedRates = {};
  const uncachedAfterDB = [];

  const cacheExpiration = getCacheExpiration(destination_country);
  console.log(`🗄️ Checking database cache (${destination_country}: ${cacheExpiration / (24 * 60 * 60 * 1000)} days expiration)...`);

  for (const component of components) {
    const hsCode = component.hs_code || component.classified_hs_code;

    // Query database for cached rate
    const { data: cached, error } = await supabase
      .from('ai_classifications')
      .select('*')
      .eq('hs_code', hsCode)
      .eq('origin_country', component.origin_country)
      .eq('destination_country', destination_country)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cached && !error) {
      // Check if cache is still fresh based on destination
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();
      if (cacheAge < cacheExpiration) {
        // ✅ SAFETY: Normalize policy_adjustments (old data might have objects)
        const safePolicyAdjustments = (cached.policy_adjustments || []).map(adj =>
          typeof adj === 'string' ? adj : JSON.stringify(adj)
        );

        // ✅ FIX: Parse Section 301 from policy_adjustments array
        let section301Rate = 0;
        for (const adjustment of safePolicyAdjustments) {
          const match = adjustment.match(/Section 301.*?(\d+(?:\.\d+)?)%/i);
          if (match) {
            section301Rate = parseFloat(match[1]);
            break;
          }
        }

        // ✅ FIX: Calculate total_rate from policy_adjusted_mfn_rate or base + section301
        const totalRate = cached.policy_adjusted_mfn_rate ||
                         (cached.base_mfn_rate || cached.mfn_rate) + section301Rate;

        dbCachedRates[hsCode] = {
          mfn_rate: cached.mfn_rate,
          usmca_rate: cached.usmca_rate,
          policy_adjustments: safePolicyAdjustments,
          base_mfn_rate: cached.base_mfn_rate,
          policy_adjusted_mfn_rate: cached.policy_adjusted_mfn_rate,
          section_301: section301Rate,  // ✅ FIX: Parse from policy_adjustments
          total_rate: totalRate  // ✅ FIX: Calculate from policy_adjusted or base+301
        };
        console.log(`  ✅ DB Cache HIT: ${hsCode} from ${component.origin_country} → ${destination_country} (${Math.round(cacheAge / (60 * 60 * 1000))}h old)`);
      } else {
        console.log(`  ⏰ DB Cache EXPIRED: ${hsCode} (${Math.round(cacheAge / (24 * 60 * 60 * 1000))} days old, limit: ${cacheExpiration / (24 * 60 * 60 * 1000)} days)`);
        uncachedAfterDB.push(component);
      }
    } else {
      uncachedAfterDB.push(component);
    }
  }

  // STEP 1: Check IN-MEMORY cache (session-level, faster than DB)
  const cachedRates = { ...dbCachedRates };
  const uncachedComponents = [];

  for (const component of uncachedAfterDB) {
    const hsCode = component.hs_code || component.classified_hs_code;
    // ✅ FIX: Include destination in cache key
    const cacheKey = `${hsCode}-${component.origin_country}-${destination_country}`;
    const cached = TARIFF_CACHE.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cacheExpiration) {
      cachedRates[hsCode] = cached.data;
      console.log(`  ✅ Memory Cache HIT: ${hsCode}`);
    } else {
      uncachedComponents.push(component);
    }
  }

  console.log(`💰 Cache Summary: ${Object.keys(dbCachedRates).length} DB hits, ${Object.keys(cachedRates).length - Object.keys(dbCachedRates).length} memory hits, ${uncachedComponents.length} misses (AI call needed)`);

  if (uncachedComponents.length === 0) {
    console.log('✅ All rates served from cache - $0 cost');
    return cachedRates;
  }

  // STEP 2: Build prompt once for all fallback attempts
  const { batchPrompt, componentList } = buildBatchTariffPrompt(uncachedComponents);

  // TIER 2: Try OpenRouter first
  console.log('🎯 TIER 2 (OpenRouter): Making AI call...');
  const openRouterResult = await tryOpenRouter(batchPrompt);
  if (openRouterResult.success) {
    console.log('✅ OpenRouter SUCCESS');
    return cacheBatchResults(openRouterResult.rates, uncachedComponents, cachedRates, destination_country);
  }
  console.log('❌ OpenRouter FAILED:', openRouterResult.error);

  // TIER 3: Fallback to Anthropic Direct
  console.log('🎯 TIER 3 (Anthropic Direct): Making AI call...');
  const anthropicResult = await tryAnthropicDirect(batchPrompt);
  if (anthropicResult.success) {
    console.log('✅ Anthropic Direct SUCCESS');
    return cacheBatchResults(anthropicResult.rates, uncachedComponents, cachedRates, destination_country);
  }
  console.log('❌ Anthropic Direct FAILED:', anthropicResult.error);

  // TIER 4: Last resort - Database (stale data)
  console.log('🎯 TIER 4 (Database fallback): Using STALE DATA (Jan 2025)...');
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
 * ✅ DESTINATION-AWARE: Includes destination in cache key and database save
 */
function cacheBatchResults(freshRates, components, existingCache, destination_country = 'US') {
  // Save to in-memory cache with destination-aware key
  for (const [hsCode, rates] of Object.entries(freshRates)) {
    const component = components.find(c =>
      (c.hs_code || c.classified_hs_code) === hsCode
    );
    if (component) {
      // ✅ FIX: Include destination in cache key
      const cacheKey = `${hsCode}-${component.origin_country}-${destination_country}`;
      TARIFF_CACHE.set(cacheKey, {
        data: rates,
        timestamp: Date.now()
      });
    }
  }

  // 💾 SAVE AI RESULTS TO DATABASE with destination (non-blocking)
  saveTariffRatesToDatabase(freshRates, components, destination_country).catch(err => {
    console.error('⚠️ Background database save failed:', err.message);
  });

  console.log(`✅ AI returned rates for ${Object.keys(freshRates).length} components → ${destination_country} (cached + saved to DB)`);
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
 * Called after TIER 2 (OpenRouter) or TIER 3 (Anthropic) success
 * ✅ DESTINATION-AWARE: Includes destination for smart cache expiration
 * @param {Object} freshRates - AI-generated tariff rates { [hsCode]: { mfn_rate, usmca_rate, ... } }
 * @param {Array} components - Component data with descriptions and origins
 * @param {String} destination_country - Export destination (US/CA/MX)
 */
async function saveTariffRatesToDatabase(freshRates, components, destination_country = 'US') {
  console.log(`💾 Saving ${Object.keys(freshRates).length} AI tariff rates to database (dest: ${destination_country})...`);

  try {
    const savePromises = [];

    for (const [hsCode, rates] of Object.entries(freshRates)) {
      const component = components.find(c =>
        (c.hs_code || c.classified_hs_code) === hsCode
      );

      if (!component) continue;

      // ✅ SAFETY: Ensure policy_adjustments array contains only strings
      const safePolicyAdjustments = (rates.policy_adjustments || []).map(adj =>
        typeof adj === 'string' ? adj : JSON.stringify(adj)
      );

      // Save/update each rate using UPSERT (prevents stale duplicate records)
      savePromises.push(
        supabase
          .from('ai_classifications')
          .upsert({
            hs_code: hsCode,
            component_description: component.description || 'AI tariff lookup',
            mfn_rate: rates.mfn_rate || 0,
            base_mfn_rate: rates.base_mfn_rate || rates.mfn_rate || 0,
            policy_adjusted_mfn_rate: rates.mfn_rate || 0,
            usmca_rate: rates.usmca_rate || 0,
            policy_adjustments: safePolicyAdjustments,
            origin_country: component.origin_country,
            destination_country: destination_country,
            confidence: 95,
            verified: false,
            last_updated: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
          }, {
            onConflict: 'hs_code,origin_country,destination_country'  // Update if exists
          })
          .then(({ error }) => {
            if (error) {
              console.error(`⚠️ Failed to save ${hsCode}:`, error.message);
            }
          })
      );
    }

    await Promise.all(savePromises);
    console.log(`✅ Successfully saved ${savePromises.length} AI tariff rates to database → ${destination_country}`);

  } catch (error) {
    // Non-blocking - don't fail the request if DB save fails
    console.error('⚠️ Database save error:', error.message);
  }
}
