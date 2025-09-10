/**
 * Simple USMCA Compliance API
 * Direct, focused approach - handles all core USMCA functions
 * Enhanced with accurate HS code normalization
 */

import { usmcaClassifier } from '../../lib/core/simple-usmca-classifier.js';
import { normalizeHSCode, validateHSCodeFormat } from '../../lib/utils/hs-code-normalizer.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cache for dynamic HS code examples
let hsCodeExamples = null;

/**
 * Get dynamic HS code examples from database
 * @returns {Promise<Array>} Array of HS code examples
 */
async function getHSCodeExamples() {
  if (hsCodeExamples) {
    return hsCodeExamples;
  }
  
  try {
    // Get sample HS codes from the database
    const { data, error } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description')
      .not('hs_code', 'is', null)
      .not('description', 'is', null)
      .limit(10);
    
    if (error || !data || data.length === 0) {
      // Fallback examples if database query fails
      hsCodeExamples = [
        { hs_code: '8544.42.90', description: 'Electric conductors' },
        { hs_code: '8517.62.00', description: 'Communication equipment' },
        { hs_code: '8703.23.00', description: 'Motor vehicles' }
      ];
    } else {
      // Format HS codes with dots for user examples
      hsCodeExamples = data.slice(0, 3).map(item => ({
        hs_code: formatHSCodeWithDots(item.hs_code),
        description: item.description
      }));
    }
    
    return hsCodeExamples;
  } catch (error) {
    console.error('Failed to load HS code examples:', error);
    // Emergency fallback
    hsCodeExamples = [
      { hs_code: '8544.42.90', description: 'Electric conductors' },
      { hs_code: '8517.62.00', description: 'Communication equipment' }
    ];
    return hsCodeExamples;
  }
}

/**
 * Format HS code with dots for user display
 * @param {string} hsCode - Raw HS code
 * @returns {string} Formatted HS code with dots
 */
function formatHSCodeWithDots(hsCode) {
  if (!hsCode || hsCode.length < 6) return hsCode;
  
  // Format as XX.XX.XX.XX for 8+ digit codes
  if (hsCode.length >= 8) {
    return `${hsCode.substring(0, 4)}.${hsCode.substring(4, 6)}.${hsCode.substring(6, 8)}.${hsCode.substring(8)}`;
  }
  
  // Format as XX.XX.XX for 6-digit codes
  return `${hsCode.substring(0, 4)}.${hsCode.substring(4, 6)}`;
}

/**
 * Generate dynamic HS code suggestion text
 * @returns {Promise<string>} Suggestion text with real examples
 */
async function generateHSCodeSuggestion() {
  try {
    const examples = await getHSCodeExamples();
    const firstExample = examples[0];
    const secondExample = examples[1];
    
    if (firstExample && secondExample) {
      return `Provide HS code (e.g., "${firstExample.hs_code}" for ${firstExample.description} or "${secondExample.hs_code}" for ${secondExample.description})`;
    } else if (firstExample) {
      return `Provide HS code (e.g., "${firstExample.hs_code}" for ${firstExample.description})`;
    } else {
      return 'Provide valid HS code for your product';
    }
  } catch (error) {
    console.error('Failed to generate HS code suggestion:', error);
    return 'Provide valid HS code for your product';
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Support both action/data format and direct format for backward compatibility
    let action, data;
    
    if (req.body.action) {
      // New format: { action, data }
      action = req.body.action;
      data = req.body.data || {};
    } else {
      // Direct format: determine action from data content
      if (req.body.hs_code && req.body.action === 'check_qualification') {
        action = 'check_qualification';
        data = req.body;
      } else if (req.body.hs_code && req.body.action === 'calculate_savings') {
        action = 'calculate_savings';
        data = req.body;
      } else if (req.body.product_description) {
        action = 'classify_product';
        data = req.body;
      } else {
        return res.status(400).json({ error: 'Unable to determine action from request' });
      }
    }

    // Store data in req.body.data for handlers
    req.body.data = data;

    switch (action) {
      case 'classify_product':
        return await handleProductClassification(req, res);
      
      case 'check_qualification':
        return await handleUSMCAQualification(req, res);
      
      case 'calculate_savings':
        return await handleSavingsCalculation(req, res);
      
      case 'generate_certificate':
        return await handleCertificateGeneration(req, res);
      
      case 'complete_workflow':
        return await handleCompleteWorkflow(req, res);
      
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

  } catch (error) {
    console.error('USMCA API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

async function handleProductClassification(req, res) {
  const { product_description } = req.body.data;
  
  if (!product_description) {
    return res.status(400).json({ error: 'Product description required' });
  }

  const result = await usmcaClassifier.classifyProduct(product_description);
  
  return res.json({
    success: true,
    classification: result,
    next_step: result.success ? 'check_qualification' : 'revise_description'
  });
}

async function handleUSMCAQualification(req, res) {
  const { hs_code, component_origins, manufacturing_location } = req.body.data;
  
  // Validate and normalize HS code
  if (!hs_code) {
    return res.status(400).json({ 
      error: 'HS code is required for USMCA qualification check',
      suggestion: await generateHSCodeSuggestion()
    });
  }
  
  const validation = validateHSCodeFormat(hs_code);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Invalid HS code format',
      details: validation.error,
      suggestion: validation.suggestion,
      originalInput: hs_code
    });
  }
  
  const normalizedHSCode = validation.normalized;
  
  const result = await usmcaClassifier.checkUSMCAQualification(
    normalizedHSCode, 
    component_origins, 
    manufacturing_location
  );
  
  return res.json({
    success: true,
    qualification: result,
    hsCode: {
      original: hs_code,
      normalized: normalizedHSCode,
      validation: validation
    },
    next_step: result.qualified ? 'calculate_savings' : 'review_requirements'
  });
}

async function handleSavingsCalculation(req, res) {
  const { hs_code, annual_import_value, supplier_country } = req.body.data;
  
  // Validate and normalize HS code for accurate tariff calculation
  if (!hs_code) {
    return res.status(400).json({ 
      error: 'HS code is required for accurate savings calculation',
      suggestion: 'Provide specific HS code for your product'
    });
  }
  
  const normalizedHSCode = normalizeHSCode(hs_code);
  if (!normalizedHSCode) {
    return res.status(400).json({
      error: 'Invalid HS code format',
      originalInput: hs_code,
      suggestion: await generateHSCodeSuggestion()
    });
  }
  
  const result = await usmcaClassifier.calculateSavings(
    normalizedHSCode, 
    annual_import_value, 
    supplier_country
  );
  
  return res.json({
    success: true,
    savings: result,
    hsCode: {
      original: hs_code,
      normalized: normalizedHSCode,
      note: 'Calculations based on normalized HS code for accuracy'
    },
    next_step: result.success && result.annual_savings > 0 ? 'generate_certificate' : 'review_options'
  });
}

async function handleCertificateGeneration(req, res) {
  const submissionData = req.body.data;
  
  const result = await usmcaClassifier.generateCertificateData(submissionData);
  
  return res.json({
    success: true,
    certificate: result,
    next_step: 'download_certificate'
  });
}

async function handleCompleteWorkflow(req, res) {
  const {
    company_name,
    business_type,
    supplier_country,
    trade_volume,
    product_description,
    component_origins,
    manufacturing_location
  } = req.body.data;

  try {
    // Step 1: Classify product using working classification API
    console.log('🔍 Step 1: Classifying product...');
    const classificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai-classification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_description,
        business_type: 'Manufacturing'
      })
    });
    
    if (!classificationResponse.ok) {
      return res.json({
        success: false,
        error: 'Classification API failed',
        step: 'classification'
      });
    }
    
    const classificationResult = await classificationResponse.json();
    
    if (!classificationResult.success || !classificationResult.results || classificationResult.results.length === 0) {
      return res.json({
        success: false,
        error: 'Could not classify product',
        step: 'classification'
      });
    }

    const bestMatch = classificationResult.results[0];
    const hsCode = bestMatch.hs_code;
    console.log(`✅ Product classified as: ${hsCode} (confidence: ${bestMatch.confidence})`);

    // Step 2: Check USMCA qualification
    console.log('🌎 Step 2: Checking USMCA qualification...');
    const qualification = await usmcaClassifier.checkUSMCAQualification(
      hsCode,
      component_origins,
      manufacturing_location
    );

    // Step 3: Calculate savings (even if not qualified, show potential)
    console.log('💰 Step 3: Calculating tariff savings...');
    const savings = await usmcaClassifier.calculateSavings(
      hsCode,
      trade_volume,
      supplier_country
    );

    // Step 4: Generate certificate data if qualified
    let certificate = null;
    if (qualification.qualified) {
      console.log('📜 Step 4: Generating certificate data...');
      certificate = await usmcaClassifier.generateCertificateData({
        companyName: company_name,
        hsCode,
        productDescription: product_description,
        manufacturingLocation: manufacturing_location,
        componentOrigins: component_origins,
        qualified: true
      });
    }

    // Complete workflow result
    const result = {
      success: true,
      workflow_complete: true,
      results: {
        company: {
          name: company_name,
          business_type,
          supplier_country,
          trade_volume
        },
        product: {
          description: product_description,
          product_description: product_description,
          hs_code: hsCode,
          classified_hs_code: hsCode,
          confidence: bestMatch.confidence,
          classification_confidence: bestMatch.confidence,
          classification_method: 'ai_enhanced',
          tariff_rates: {
            mfn_rate: bestMatch.mfn_rate || bestMatch.mfn_tariff_rate,
            usmca_rate: bestMatch.usmca_rate || bestMatch.usmca_tariff_rate,
            savings_percent: bestMatch.savings_percent
          }
        },
        usmca: {
          qualified: qualification.qualified,
          rule: qualification.rule_applied,
          reason: qualification.reason,
          documentation_required: qualification.documentation_required
        },
        savings: savings.success ? {
          annual_savings: savings.annual_savings,
          monthly_savings: savings.monthly_savings,
          savings_percentage: savings.savings_percentage,
          mfn_rate: savings.mfn_rate,
          usmca_rate: savings.usmca_rate
        } : null,
        certificate: certificate?.success ? certificate.certificate_data : null
      }
    };

    // Store in workflow_sessions for tracking
    // (This would use existing table structure)

    return res.json(result);

  } catch (error) {
    console.error('Complete workflow error:', error);
    return res.status(500).json({
      success: false,
      error: 'Workflow processing failed',
      details: error.message
    });
  }
}