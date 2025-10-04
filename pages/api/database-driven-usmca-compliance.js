/**
 * DATABASE-DRIVEN USMCA COMPLIANCE API
 * NO HARDCODED VALUES - COMPLETE DATABASE INTEGRATION
 * 
 * Replaces simple-usmca-compliance.js with fully database-driven approach
 * Following Holistic Reconstruction Plan Phase 2 requirements
 */

import { performIntelligentClassification } from '../../lib/classification/database-driven-classifier.js';
import { databaseDrivenUSMCAEngine } from '../../lib/core/database-driven-usmca-engine.js';
import { SYSTEM_CONFIG, MESSAGES, VALIDATION_RULES } from '../../config/system-config.js';
import { logInfo, logError, logRequest, logPerformance } from '../../lib/utils/production-logger.js';
import { ClassificationAgent } from '../../lib/agents/classification-agent.js';

export default async function handler(req, res) {
  const startTime = Date.now();
  let operation = 'unknown';

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed_methods: ['POST']
    });
  }

  // Set timeout protection from configuration
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      logError('API timeout reached', { timeout: SYSTEM_CONFIG.api.timeout });
      res.status(408).json({
        success: false,
        error: MESSAGES.errors.timeoutError,
        timeout_ms: SYSTEM_CONFIG.api.timeout,
        fallback: MESSAGES.errors.professionalRequired
      });
    }
  }, SYSTEM_CONFIG.api.timeout);

  try {
    const { action, data } = req.body;
    operation = action || 'unknown_action';

    logInfo('USMCA API request received', { 
      action, 
      ip: req.ip,
      data_keys: Object.keys(data || {}),
      trade_volume: data?.trade_volume,
      trade_volume_type: typeof data?.trade_volume
    });

    // Validate request structure
    if (!action || !data) {
      clearTimeout(timeoutId);
      return res.status(400).json({
        success: false,
        error: 'Invalid request format',
        required_fields: ['action', 'data']
      });
    }

    // Initialize USMCA engine
    await databaseDrivenUSMCAEngine.initialize();

    let result;
    switch (action) {
      case 'complete_workflow':
        result = await handleCompleteWorkflow(data, req);
        break;
      
      case 'classify_product':
        result = await handleProductClassification(data);
        break;
      
      case 'check_qualification':
        result = await handleUSMCAQualification(data);
        break;
      
      case 'calculate_savings':
        result = await handleTariffSavings(data);
        break;
      
      case 'generate_certificate':
        result = await handleCertificateGeneration(data);
        break;

      case 'health_check':
        result = await handleHealthCheck();
        break;

      default:
        clearTimeout(timeoutId);
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
          supported_actions: [
            'complete_workflow',
            'classify_product', 
            'check_qualification',
            'calculate_savings',
            'generate_certificate',
            'health_check'
          ]
        });
    }

    clearTimeout(timeoutId);
    
    // Log successful request
    const responseTime = Date.now() - startTime;
    logRequest(req.method, req.url, 200, responseTime, { action, success: true });
    
    return res.status(200).json(result);

  } catch (error) {
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    logError('USMCA API error', { 
      error: error.message, 
      operation,
      responseTime,
      stack: error.stack 
    });
    
    logRequest(req.method, req.url, 500, responseTime, { operation, success: false });

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: MESSAGES.errors.professionalRequired,
        technical_error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        fallback: 'Contact licensed customs broker for manual processing',
        timestamp: new Date().toISOString()
      });
    }
  }
}

/**
 * Handle complete USMCA workflow
 * NO HARDCODED WORKFLOW LOGIC
 */
async function handleCompleteWorkflow(formData) {
  const startTime = Date.now();

  console.log('🔥 ========== API ENDPOINT: RECEIVED REQUEST ==========');
  console.log('📥 Received formData:', {
    company_name: formData.company_name,
    business_type: formData.business_type,
    trade_volume: formData.trade_volume,
    product_description: formData.product_description,
    manufacturing_location: formData.manufacturing_location,
    supplier_country: formData.supplier_country,
    destination_country: formData.destination_country,
    component_origins_count: formData.component_origins?.length,
    component_origins_details: formData.component_origins?.map((c, i) => ({
      index: i + 1,
      description: c.description,
      origin_country: c.origin_country,
      value_percentage: c.value_percentage,
      hs_code: c.hs_code
    }))
  });

  try {
    // Validate required fields using configuration
    validateWorkflowData(formData);

    // Step 1: Product classification or bypass
    const productResults = await handleProductClassificationStep(formData);
    
    // Step 2: USMCA qualification check
    const usmcaResults = await handleUSMCAQualificationStep(
      productResults.hs_code,
      formData.component_origins,
      formData.manufacturing_location,
      formData.business_type
    );
    
    // Step 3: Tariff savings calculation
    const tradeVolume = formData.trade_volume || SYSTEM_CONFIG.business.defaultTradeVolume;
    const destinationCountry = formData.destination_country || 'US'; // Default to US if not specified
    const savingsResults = await handleTariffSavingsStep(
      productResults.hs_code,
      tradeVolume,
      formData.supplier_country,
      destinationCountry
    );
    
    // Step 4: Certificate generation (if qualified)
    const certificateResults = usmcaResults.qualified 
      ? await handleCertificateGenerationStep(productResults, usmcaResults, formData)
      : null;

    // Compile complete results
    const completeResults = {
      success: true,
      workflow_completed: true,
      processing_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      
      // Company information
      company: {
        name: formData.company_name,
        business_type: formData.business_type,
        trade_volume: formData.trade_volume,
        supplier_country: formData.supplier_country
      },
      
      // Classification results
      product: productResults,
      
      // USMCA qualification results
      usmca: usmcaResults,
      
      // Tariff savings results
      savings: savingsResults,
      
      // Certificate results (if applicable)
      certificate: certificateResults,
      
      // Overall recommendations (AI-powered, context-aware)
      recommendations: await generateWorkflowRecommendations(
        productResults,
        usmcaResults,
        savingsResults,
        formData  // Pass full context for AI analysis
      ),
      
      // Disclaimers from configuration
      disclaimers: [
        MESSAGES.disclaimers.general,
        MESSAGES.disclaimers.tariffRates,
        MESSAGES.disclaimers.classification,
        'Complete workflow results require professional verification'
      ]
    };

    logPerformance('Complete USMCA workflow', startTime, {
      classified: productResults.success,
      qualified: usmcaResults.qualified,
      potential_savings: savingsResults.annual_savings,
      certificate_generated: !!certificateResults
    });

    return completeResults;

  } catch (error) {
    logError('Complete workflow failed', { error: error.message });
    
    return {
      success: false,
      workflow_completed: false,
      error: error.message,
      processing_time_ms: Date.now() - startTime,
      fallback: MESSAGES.errors.professionalRequired,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Validate workflow data using configuration rules
 * Trade volume is optional - will use default if not provided
 */
function validateWorkflowData(data) {
  const required = ['company_name', 'business_type', 'product_description'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  // Parse and set trade volume with support for range strings
  const originalTradeVolume = data.trade_volume;
  let usingDefaultVolume = false;
  
  if (!data.trade_volume || data.trade_volume === 0 || data.trade_volume === '' || data.trade_volume === '0') {
    data.trade_volume = SYSTEM_CONFIG.business.defaultTradeVolume;
    usingDefaultVolume = true;
    logInfo('Using default trade volume', { 
      default_volume: data.trade_volume,
      original_value: originalTradeVolume,
      reason: 'Empty, zero, or missing trade volume'
    });
  } else {
    // Parse trade volume ranges like "$5M - $25M" to numeric values
    const parsedVolume = parseTradeVolumeRange(data.trade_volume);
    if (parsedVolume !== null) {
      data.trade_volume = parsedVolume;
      logInfo('Parsed trade volume range', { 
        original_value: originalTradeVolume,
        parsed_value: parsedVolume
      });
    }
  }

  // Validate trade volume only if user provided a specific value (not using default)
  if (!usingDefaultVolume && data.trade_volume !== undefined && data.trade_volume !== null && data.trade_volume !== '') {
    let volume;
    
    // Handle different trade volume input formats
    if (typeof data.trade_volume === 'number') {
      volume = data.trade_volume;
    } else if (typeof data.trade_volume === 'string') {
      // Clean string input - remove commas, currency symbols, etc.
      const cleanString = data.trade_volume.toString().replace(/[$,\s]/g, '');
      volume = parseFloat(cleanString);
    } else {
      logError('Invalid trade volume format', { 
        trade_volume: data.trade_volume, 
        type: typeof data.trade_volume 
      });
      throw new Error('Trade volume must be a number or numeric string');
    }
    
    // Check if parsing was successful
    if (isNaN(volume) || volume < 0) {
      throw new Error('Trade volume must be a positive number');
    }
    
    // Apply more reasonable validation limits
    const minValue = VALIDATION_RULES.tradeVolume.minValue;
    const maxValue = VALIDATION_RULES.tradeVolume.maxValue;
    
    if (volume < minValue || volume > maxValue) {
      logError('Trade volume validation failed', { 
        volume, 
        minValue, 
        maxValue,
        originalInput: data.trade_volume
      });
      throw new Error(`Trade volume must be between $${minValue.toLocaleString()} and $${maxValue.toLocaleString()}`);
    }
    
    logInfo('Trade volume validation passed', { volume, originalInput: data.trade_volume });
  }

  // Validate component origins if provided
  if (data.component_origins && Array.isArray(data.component_origins)) {
    const totalPercentage = data.component_origins.reduce((sum, comp) => sum + comp.value_percentage, 0);
    if (Math.abs(totalPercentage - 100) > 5) { // Allow 5% tolerance
      logError('Component origins do not sum to 100%', { total: totalPercentage });
    }
  }
}

/**
 * Handle product classification step
 */
async function handleProductClassificationStep(formData) {
  try {
    // Check for HS code bypass (professional trader input)
    if (formData.bypass_classification && formData.hs_code_override) {
      return await handleHSCodeBypass(formData);
    }

    // IMPORTANT: Component HS codes should NOT be used as final product classification
    // Only use component HS codes if the product IS the component (single-component products)
    if (formData.component_origins && formData.component_origins.length > 0) {
      const componentWithHSCode = formData.component_origins.find(comp => comp.hs_code && comp.hs_code.length >= 4);

      // Only use component HS code if:
      // 1. There's only ONE component (single-ingredient product)
      // 2. The component description matches the product description (same thing)
      if (componentWithHSCode && formData.component_origins.length === 1) {
        const productDesc = formData.product_description?.toLowerCase() || '';
        const componentDesc = componentWithHSCode.description?.toLowerCase() || '';

        // Check if product and component descriptions are similar (same item)
        const isSameItem = productDesc.includes(componentDesc) || componentDesc.includes(productDesc);

        if (isSameItem) {
          const originalHSCode = componentWithHSCode.hs_code;
          const normalizedHSCode = originalHSCode.replace(/[.\s-]/g, '');

          logInfo('Using single-component HS code (product IS the component)', {
            original_hs_code: originalHSCode,
            normalized_hs_code: normalizedHSCode,
            component: componentWithHSCode.description,
            product: formData.product_description
          });

          return {
            success: true,
            hs_code: normalizedHSCode,
            original_hs_code: originalHSCode,
            description: formData.product_description,
            confidence: 95,
            method: 'single_component_match',
            bypass_used: false,
            classification_details: {
              source: 'user_manual_entry',
              single_component: true,
              component_description: componentWithHSCode.description,
              user_confidence: 'high'
            }
          };
        } else {
          logInfo('Component HS code found but product differs - will classify final product instead', {
            product: formData.product_description,
            component: componentWithHSCode.description,
            component_hs: componentWithHSCode.hs_code
          });
        }
      }
    }

    // Check if we already have a classified HS code from frontend (legacy)
    if (formData.classified_hs_code && formData.hs_code_confidence > 0) {
      logInfo('Using pre-classified HS code from frontend', { 
        hs_code: formData.classified_hs_code, 
        confidence: formData.hs_code_confidence 
      });
      
      return {
        success: true,
        hs_code: formData.classified_hs_code,
        description: formData.hs_code_description || formData.product_description,
        confidence: formData.hs_code_confidence,
        method: formData.classification_method || 'frontend_classification',
        bypass_used: false,
        classification_details: {
          source: 'frontend_guided_input',
          pre_classified: true,
          avoided_reclassification: true
        }
      };
    }

    // Use AI-powered classification with full business context
    const agent = new ClassificationAgent();

    const additionalContext = {
      business_type: formData.business_type,
      origin_country: formData.supplier_country || 'MX',
      destination_country: formData.destination_market || 'US',
      trade_volume: formData.trade_volume,
      company_name: formData.company_name,
      manufacturing_location: formData.manufacturing_location
    };

    const result = await agent.suggestHSCode(
      formData.product_description,
      formData.component_origins || [],
      additionalContext
    );

    if (result.success && result.data.hsCode) {
      return {
        success: true,
        hs_code: result.data.hsCode,
        description: result.data.description || formData.product_description,
        confidence: result.data.confidence,
        method: 'ai_classification_agent',
        bypass_used: false,
        classification_details: {
          ai_explanation: result.data.explanation,
          usmca_qualification: result.data.usmcaQualification,
          alternative_codes: result.data.alternativeCodes,
          database_match: result.data.databaseMatch,
          mfn_rate: result.data.mfnRate,
          usmca_rate: result.data.usmcaRate
        }
      };
    }

    // Classification failed - require professional help
    return {
      success: false,
      hs_code: null,
      description: formData.product_description,
      confidence: 0,
      method: 'PROFESSIONAL_CLASSIFICATION_REQUIRED',
      bypass_used: false,
      error: result.error || 'Classification failed',
      fallback: MESSAGES.errors.professionalRequired
    };

  } catch (error) {
    logError('Product classification step failed', { error: error.message });
    throw error;
  }
}

/**
 * Handle HS code bypass for professional traders
 */
async function handleHSCodeBypass(formData) {
  try {
    const hsCode = formData.hs_code_override;
    
    // Validate HS code format using configuration rules
    const hsPattern = new RegExp(VALIDATION_RULES.hsCode.pattern);
    if (!hsPattern.test(hsCode)) {
      throw new Error(`Invalid HS code format. Expected pattern: ${VALIDATION_RULES.hsCode.pattern}`);
    }

    // Verify HS code exists in database
    const hsReference = await databaseDrivenUSMCAEngine.dbService.getHSCodeReference(hsCode);
    
    if (hsReference) {
      return {
        success: true,
        hs_code: hsCode,
        description: hsReference.product_description,
        confidence: 95, // High confidence for validated bypass
        method: 'HS_CODE_BYPASS_VALIDATED',
        bypass_used: true,
        verification_details: {
          database_verified: true,
          usmca_eligible: hsReference.usmca_eligible,
          product_category: hsReference.product_category
        }
      };
    }

    // HS code not found in database but format is valid
    logError('HS code bypass - code not found in database', { hsCode });
    return {
      success: true,
      hs_code: hsCode,
      description: formData.product_description,
      confidence: 70, // Lower confidence for unvalidated bypass
      method: 'HS_CODE_BYPASS_UNVALIDATED',
      bypass_used: true,
      verification_details: {
        database_verified: false,
        warning: 'HS code not found in database - verify with customs broker'
      }
    };

  } catch (error) {
    logError('HS code bypass failed', { error: error.message, hsCode: formData.hs_code_override });
    throw error;
  }
}

/**
 * Handle USMCA qualification step
 */
async function handleUSMCAQualificationStep(hsCode, componentOrigins, manufacturingLocation, businessType) {
  try {
    console.log('✅ ========== USMCA QUALIFICATION STEP ==========');
    console.log('Input to USMCA engine:', {
      hsCode,
      businessType,
      manufacturingLocation,
      componentOrigins_count: componentOrigins?.length,
      componentOrigins: componentOrigins?.map((c, i) => ({
        index: i + 1,
        description: c.description,
        origin_country: c.origin_country,
        value_percentage: c.value_percentage
      }))
    });

    if (!hsCode) {
      throw new Error('HS code is required for USMCA qualification check');
    }

    const result = await databaseDrivenUSMCAEngine.checkUSMCAQualification(
      hsCode,
      componentOrigins || [],
      manufacturingLocation,
      businessType
    );

    console.log('📊 USMCA Qualification Result:', {
      qualified: result.qualified,
      threshold_applied: result.threshold_applied,
      north_american_content: result.north_american_content,
      rule: result.rule,
      reason: result.reason
    });
    console.log('========== END USMCA QUALIFICATION ==========');

    return result;

  } catch (error) {
    logError('USMCA qualification step failed', { error: error.message, hsCode });
    // NO FALLBACK - Fail loudly to expose real issues
    throw error;
  }
}

/**
 * Handle tariff savings calculation step
 */
async function handleTariffSavingsStep(hsCode, tradeVolume, supplierCountry, destinationCountry = 'US') {
  try {
    if (!hsCode) {
      throw new Error('HS code is required for tariff savings calculation');
    }

    return await databaseDrivenUSMCAEngine.calculateTariffSavings(
      hsCode,
      tradeVolume || SYSTEM_CONFIG.business.defaultTradeVolume,
      supplierCountry,
      destinationCountry  // Now passing destination country explicitly
    );

  } catch (error) {
    logError('Tariff savings calculation step failed', { error: error.message, hsCode });
    // NO FALLBACK - Fail loudly to expose real issues
    throw error;
  }
}

/**
 * Handle certificate generation step
 */
async function handleCertificateGenerationStep(product, usmcaQualification, formData) {
  try {
    if (!usmcaQualification.qualified) {
      return null;
    }

    return await databaseDrivenUSMCAEngine.generateCertificateData(
      product,
      usmcaQualification,
      formData
    );

  } catch (error) {
    logError('Certificate generation step failed', { error: error.message });
    // NO FALLBACK - Fail loudly to expose real issues
    throw error;
  }
}

/**
 * Handle individual product classification request
 */
async function handleProductClassification(data) {
  try {
    const classificationResult = await performIntelligentClassification({
      productDescription: data.product_description,
      businessType: data.business_type,
      sourceCountry: data.supplier_country
    });

    // CRITICAL FIX: Convert to expected format for frontend hooks
    // Frontend expects { success: true, results: [...] } format
    if (classificationResult.success && classificationResult.classification?.results) {
      return {
        success: true,
        results: classificationResult.classification.results,
        processingTimeMs: classificationResult.processingTimeMs,
        totalMatches: classificationResult.classification.results.length,
        method: classificationResult.classification.method,
        searchStrategy: classificationResult.searchStrategy
      };
    }
    
    // Return original format if structure doesn't match expectations
    return classificationResult;
  } catch (error) {
    logError('Product classification failed', { error: error.message });
    throw error;
  }
}

/**
 * Handle individual USMCA qualification request
 */
async function handleUSMCAQualification(data) {
  try {
    return await databaseDrivenUSMCAEngine.checkUSMCAQualification(
      data.hs_code,
      data.component_origins,
      data.manufacturing_location,
      data.business_type
    );
  } catch (error) {
    logError('USMCA qualification failed', { error: error.message });
    throw error;
  }
}

/**
 * Handle individual tariff savings request
 */
async function handleTariffSavings(data) {
  try {
    return await databaseDrivenUSMCAEngine.calculateTariffSavings(
      data.hs_code,
      data.trade_volume,
      data.supplier_country,
      data.destination_country || 'US'  // Default to US if not provided
    );
  } catch (error) {
    logError('Tariff savings calculation failed', { error: error.message });
    throw error;
  }
}

/**
 * Handle individual certificate generation request
 */
async function handleCertificateGeneration(data) {
  try {
    return await databaseDrivenUSMCAEngine.generateCertificateData(
      data.product,
      data.usmca_qualification,
      data.company_data
    );
  } catch (error) {
    logError('Certificate generation failed', { error: error.message });
    throw error;
  }
}

/**
 * Handle system health check
 */
async function handleHealthCheck() {
  try {
    const engineHealth = await databaseDrivenUSMCAEngine.healthCheck();
    
    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        api: 'healthy',
        engine: engineHealth.engine,
        database: engineHealth.database,
        cache: `${engineHealth.cacheSize} items`
      },
      configuration: {
        api_timeout: SYSTEM_CONFIG.api.timeout,
        cache_ttl: SYSTEM_CONFIG.cache.defaultTtl,
        min_confidence: SYSTEM_CONFIG.classification.minConfidenceThreshold
      }
    };
  } catch (error) {
    logError('Health check failed', { error: error.message });
    return {
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Generate AI-powered, product-specific workflow recommendations (HYBRID APPROACH)
 * Uses OpenRouter API for contextual analysis
 */
async function generateWorkflowRecommendations(product, usmca, savings, formData) {
  const recommendations = [];

  console.log('🤖 ========== AI RECOMMENDATIONS: STARTING ==========');
  console.log('Input data for AI:', {
    qualified: usmca.qualified,
    north_american_content: usmca.north_american_content,
    threshold_applied: usmca.threshold_applied,
    business_type: formData?.business_type,
    product_description: formData?.product_description,
    component_origins_count: formData?.component_origins?.length
  });

  // If not qualified, use AI to generate product-specific remediation advice
  if (!usmca.qualified && formData) {
    try {
      // Build detailed context for AI
      const componentBreakdown = formData.component_origins
        ?.map(c => `- ${c.value_percentage}% from ${c.origin_country}${c.description ? ` (${c.description})` : ''}`)
        .join('\n') || 'No component data';

      console.log('📝 Component breakdown for AI:', componentBreakdown);

      const prompt = `You are a USMCA compliance expert. Generate 3-4 specific, actionable recommendations for this company to achieve USMCA qualification.

COMPANY CONTEXT:
- Business Type: ${formData.business_type || 'Unknown'}
- Product: ${formData.product_description || 'Unknown product'}
- HS Code: ${product.hs_code || 'Not classified'}
- Manufacturing Location: ${formData.manufacturing_location || 'Unknown'}

CURRENT STATUS:
- USMCA Qualified: NO
- North American Content: ${usmca.north_american_content?.toFixed(1) || 0}%
- Required Threshold: ${usmca.threshold_applied || 0}%
- Gap: ${(usmca.threshold_applied - usmca.north_american_content)?.toFixed(1) || 0}% short

COMPONENT BREAKDOWN:
${componentBreakdown}

INSTRUCTIONS:
- Be specific to this product type (don't give generic advice)
- Identify which specific non-USMCA components to replace
- Suggest specific USMCA countries or regions for sourcing
- If textiles: mention yarn-forward rule and fabric sourcing
- If electronics: mention specific component manufacturers in Mexico/US
- If automotive: mention specific automotive supplier hubs
- Keep each recommendation under 15 words
- Return ONLY the recommendations as a JSON array of strings, no other text

Example output format:
["Replace India fabric supplier with Mexico textile mills", "Source cotton from US or Canadian suppliers", "Consider yarn-forward rule compliance for textiles"]`;

      console.log('🎯 ========== EXACT AI PROMPT SENT TO OPENROUTER ==========');
      console.log(prompt);
      console.log('========== END AI PROMPT ==========');

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
            content: prompt
          }]
        })
      });

      if (response.ok) {
        const aiResult = await response.json();
        const aiText = aiResult.choices?.[0]?.message?.content || '[]';

        console.log('🔮 ========== RAW AI RESPONSE FROM OPENROUTER ==========');
        console.log('Raw response text:', aiText);
        console.log('========== END RAW AI RESPONSE ==========');

        // Parse AI response (expecting JSON array)
        try {
          const aiRecommendations = JSON.parse(aiText.trim());
          console.log('✅ Parsed AI recommendations:', aiRecommendations);
          if (Array.isArray(aiRecommendations) && aiRecommendations.length > 0) {
            recommendations.push(...aiRecommendations);
            logInfo('AI-generated product-specific recommendations', {
              businessType: formData.business_type,
              recommendationCount: aiRecommendations.length
            });
          }
        } catch (parseError) {
          logError('Failed to parse AI recommendations', { aiText, error: parseError.message });
          // Fall through to static recommendations
        }
      }
    } catch (error) {
      logError('AI recommendation generation failed', { error: error.message });
      // Fall through to static recommendations
    }
  }

  // Fallback to static recommendations if AI fails or product is qualified
  if (recommendations.length === 0) {
    // Classification recommendations
    if (product.success && product.confidence < SYSTEM_CONFIG.classification.professionalReferralThreshold) {
      recommendations.push('Consider professional HS code verification');
    }

    // USMCA recommendations
    if (usmca.qualified) {
      recommendations.push('Product qualifies for USMCA preferential treatment');
      if (usmca.qualification_level === 'highly_qualified') {
        recommendations.push('Strong USMCA qualification - excellent savings opportunity');
      }
    } else {
      recommendations.push('Increase North American content to meet USMCA threshold');
      recommendations.push('Explore Mexico-based suppliers for key components');
    }

    // Savings recommendations
    if (savings.annual_savings > 10000) {
      recommendations.push('Significant tariff savings available - prioritize USMCA implementation');
    }

    // General recommendations
    recommendations.push('Maintain detailed supply chain documentation');
  }

  return recommendations;
}

/**
 * Parse trade volume ranges from frontend dropdown values
 * Converts strings like "$5M - $25M" to midpoint numeric values
 * Based on the hardcoded ranges in database-driven-dropdown-options.js
 */
function parseTradeVolumeRange(tradeVolumeInput) {
  if (typeof tradeVolumeInput === 'number') {
    return tradeVolumeInput;
  }
  
  if (typeof tradeVolumeInput !== 'string') {
    return null;
  }
  
  const input = tradeVolumeInput.trim();
  
  // Map of known range strings to their numeric midpoint values
  // Based on the dropdown options in database-driven-dropdown-options.js
  const rangeMap = {
    'Under $100K': 50000,
    '$100K - $500K': 300000,
    '$500K - $1M': 750000,
    '$1M - $5M': 3000000,
    '$5M - $25M': 15000000,
    '$25M - $100M': 62500000,
    'Over $100M': 500000000
  };
  
  // Direct lookup for known ranges
  if (rangeMap[input]) {
    return rangeMap[input];
  }
  
  // Parse ranges dynamically using regex
  // Handle formats like "$5M - $25M", "$5 - $25 Million", etc.
  const rangePattern = /^\$?(\d+(?:\.\d+)?)\s*([KMB]?)\s*-\s*\$?(\d+(?:\.\d+)?)\s*([KMB]?)$/i;
  const match = input.match(rangePattern);
  
  if (match) {
    const [, minNum, minUnit, maxNum, maxUnit] = match;
    const minValue = parseNumberWithUnit(parseFloat(minNum), minUnit);
    const maxValue = parseNumberWithUnit(parseFloat(maxNum), maxUnit);
    
    if (minValue !== null && maxValue !== null) {
      return Math.round((minValue + maxValue) / 2); // Return midpoint
    }
  }
  
  // Handle single values with units like "$5M", "$25M"
  const singlePattern = /^\$?(\d+(?:\.\d+)?)\s*([KMB]?)$/i;
  const singleMatch = input.match(singlePattern);
  
  if (singleMatch) {
    const [, num, unit] = singleMatch;
    return parseNumberWithUnit(parseFloat(num), unit);
  }
  
  // Try to parse as plain number (remove any non-numeric characters except decimal points)
  const numericOnly = input.replace(/[^\d.]/g, '');
  const plainNumber = parseFloat(numericOnly);
  
  if (!isNaN(plainNumber) && plainNumber > 0) {
    return plainNumber;
  }
  
  return null;
}

/**
 * Parse number with K/M/B suffixes
 */
function parseNumberWithUnit(number, unit) {
  if (isNaN(number)) return null;
  
  switch (unit.toUpperCase()) {
    case 'K':
      return number * 1000;
    case 'M':
      return number * 1000000;
    case 'B':
      return number * 1000000000;
    default:
      return number;
  }
}