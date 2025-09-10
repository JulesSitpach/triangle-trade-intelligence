/**
 * INTEGRATED USMCA CLASSIFICATION API
 * Implements the proper integration specified in SYSTEM-INTEGRATION-SPECIFICATION.md
 * 
 * Combines: AI Classification → USMCA Qualification → Accurate Tariff Display
 * Fixes the critical UX flaw where static rates were shown regardless of component origins
 */

import { workflowService } from '../../lib/services/workflow-service.js';
import { OptimizedUSMCAEngine } from '../../lib/core/optimized-usmca-engine.js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  
  try {
    const {
      component,
      allComponents,
      businessContext,
      calculationMode = 'qualification_aware'
    } = req.body;

    // Validate required fields according to specification
    if (!component?.description || component.description.length < 3) {
      return res.status(400).json({
        error: 'Component description required (minimum 3 characters)'
      });
    }

    if (!component.origin_country) {
      return res.status(400).json({
        error: 'Component origin country required for USMCA qualification',
        suggestion: 'Please select component origin country'
      });
    }

    if (!component.value_percentage || component.value_percentage <= 0) {
      return res.status(400).json({
        error: 'Component value percentage required for USMCA qualification',
        suggestion: 'Please specify component value percentage (0-100)'
      });
    }

    if (!allComponents || !Array.isArray(allComponents)) {
      return res.status(400).json({
        error: 'Complete component array required for qualification context'
      });
    }

    logInfo('Starting integrated USMCA classification', {
      component_description: component.description?.substring(0, 50),
      origin_country: component.origin_country,
      value_percentage: component.value_percentage,
      total_components: allComponents?.length || 0,
      business_type: businessContext?.type,
      calculation_mode: calculationMode
    });

    // STEP 1: AI-Enhanced Classification (get base HS code and tariff rates)
    console.log('🔍 Step 1: AI Classification...');
    
    // Use the AI classification system you built (not the basic search)
    // Fix: Use localhost:3001 to match the dev server port
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    const classificationResponse = await fetch(`${baseURL}/api/ai-classification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productDescription: component.description,
        businessContext: {
          companyType: businessContext?.type?.toLowerCase() || 'electronics',
          primarySupplier: component.origin_country,
          tradeVolume: businessContext?.trade_volume
        },
        userProfile: {
          companyRole: 'compliance manager', // Default role for USMCA analysis
          businessType: businessContext?.type?.toLowerCase() || 'electronics'
        }
      })
    });

    if (!classificationResponse.ok) {
      logError('Classification API failed', { 
        status: classificationResponse.status,
        description: component.description 
      });
      return res.status(400).json({
        success: false,
        error: 'Product classification failed',
        suggestion: 'Try a more specific product description'
      });
    }

    const classificationResult = await classificationResponse.json();

    // Debug logging to see what we actually received
    console.log('🔍 AI Classification Response:', {
      success: classificationResult?.success,
      resultsCount: classificationResult?.results?.length,
      hasResults: !!classificationResult?.results,
      firstResultHsCode: classificationResult?.results?.[0]?.hsCode,
      resultKeys: classificationResult ? Object.keys(classificationResult) : 'no result'
    });

    if (!classificationResult?.success || !classificationResult.results || classificationResult.results.length === 0) {
      logError('Classification failed', { 
        description: component.description,
        business_type: businessContext?.type,
        received_response: classificationResult
      });
      
      return res.status(400).json({
        success: false,
        error: 'Product classification failed',
        suggestion: 'Try a more specific product description'
      });
    }

    // Get the best match from classification results
    const classification = classificationResult.results[0];
    const alternatives = classificationResult.results.slice(1);
    console.log(`✅ Classification: ${classification.hsCode} (confidence: ${classification.confidence})`);

    // STEP 2: USMCA Qualification with Complete Component Data
    console.log('🌎 Step 2: USMCA Qualification...');
    
    // Initialize USMCA engine
    const usmcaEngine = new OptimizedUSMCAEngine();
    await usmcaEngine.initialize();

    // Filter to complete components only for qualification calculation
    const completeComponents = allComponents.filter(comp => 
      comp.origin_country && comp.value_percentage > 0
    );

    if (completeComponents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No complete component data available for qualification',
        suggestion: 'Complete origin country and value percentage for all components'
      });
    }

    // Calculate actual USMCA qualification using sophisticated backend logic
    console.log('About to call checkUSMCAQualification with:', {
      hsCode: classification.hsCode,
      components: completeComponents,
      manufacturingLocation: businessContext?.manufacturing_location || 'MX',
      businessType: businessContext?.type || 'Manufacturing'
    });
    
    const qualificationResult = await usmcaEngine.checkUSMCAQualification(
      classification.hsCode, // Use hsCode not hs_code
      completeComponents,
      businessContext?.manufacturing_location || 'MX',
      businessContext?.type || 'Manufacturing'
    );

    console.log(`✅ Qualification: ${qualificationResult.qualified ? 'QUALIFIED' : 'NOT QUALIFIED'} (${qualificationResult.north_american_content?.toFixed(1)}% North American)`);

    // STEP 3: Apply Qualification Results to Tariff Rates
    console.log('💰 Step 3: Applying qualification to tariff rates...');
    
    const baseMfnRate = parseFloat(classification.mfnRate || 0);
    const baseUsmcaRate = parseFloat(classification.usmcaRate || 0);
    
    // CRITICAL: Only apply USMCA rate if actually qualified
    const actualUsmcaRate = qualificationResult.qualified ? baseUsmcaRate : baseMfnRate;
    const actualSavings = qualificationResult.qualified ? (baseMfnRate - baseUsmcaRate) : 0;
    
    // Calculate annual savings if trade volume provided
    let annualSavings = 0;
    if (businessContext?.trade_volume && actualSavings > 0) {
      // Convert trade volume to numeric value for calculation
      const tradeVolumeNumeric = convertTradeVolumeToNumber(businessContext.trade_volume);
      annualSavings = (actualSavings / 100) * tradeVolumeNumeric;
    }

    // STEP 4: Build comprehensive response according to specification
    const response = {
      success: true,
      processing_time_ms: Date.now() - startTime,
      
      component: {
        hs_code: classification.hsCode,
        description: classification.description,
        classification_confidence: classification.confidence
      },
      
      qualification: {
        qualified: qualificationResult.qualified,
        north_american_content: qualificationResult.north_american_content,
        threshold_required: qualificationResult.rules_applied?.regional_content_threshold || 62.5,
        rule_applied: qualificationResult.rule,
        reason: qualificationResult.reason,
        documentation_required: qualificationResult.documentation_required
      },
      
      tariff_impact: {
        mfn_rate: baseMfnRate,
        usmca_rate: actualUsmcaRate,
        annual_savings: annualSavings,
        qualification_dependent: true,
        savings_percentage: actualSavings
      },
      
      alternatives: alternatives || [],
      
      calculation_metadata: {
        mode: calculationMode,
        components_analyzed: completeComponents.length,
        usmca_countries_found: completeComponents.filter(c => 
          ['US', 'CA', 'MX'].includes(c.origin_country)
        ).length,
        business_context: businessContext?.type
      }
    };

    logInfo('Integrated classification completed', {
      hs_code: classification.hsCode,
      qualified: qualificationResult.qualified,
      north_american_content: qualificationResult.north_american_content,
      processing_time: Date.now() - startTime,
      annual_savings: annualSavings
    });

    return res.json(response);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logError('Integrated USMCA classification failed', {
      error: error.message,
      processing_time: processingTime,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Integrated classification processing failed',
      details: error.message,
      processing_time_ms: processingTime
    });
  }
}

/**
 * Convert trade volume string to numeric value for calculations
 */
function convertTradeVolumeToNumber(tradeVolume) {
  if (typeof tradeVolume === 'number') return tradeVolume;
  
  const volumeMap = {
    'Under $500K': 250000,
    '$500K - $1M': 750000,
    '$1M - $5M': 3000000,
    '$5M+': 10000000
  };
  
  return volumeMap[tradeVolume] || 1000000; // Default to $1M
}