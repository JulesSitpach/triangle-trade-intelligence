/**
 * Simple USMCA Compliance API
 * Direct, focused approach - handles all core USMCA functions
 * No over-engineering, just the essentials
 */

import { usmcaClassifier } from '../../lib/core/simple-usmca-classifier.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;

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
        return res.status(400).json({ error: 'Unknown action' });
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
  
  const result = await usmcaClassifier.checkUSMCAQualification(
    hs_code, 
    component_origins, 
    manufacturing_location
  );
  
  return res.json({
    success: true,
    qualification: result,
    next_step: result.qualified ? 'calculate_savings' : 'review_requirements'
  });
}

async function handleSavingsCalculation(req, res) {
  const { hs_code, annual_import_value, supplier_country } = req.body.data;
  
  const result = await usmcaClassifier.calculateSavings(
    hs_code, 
    annual_import_value, 
    supplier_country
  );
  
  return res.json({
    success: true,
    savings: result,
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
    // Step 1: Classify product
    console.log('🔍 Step 1: Classifying product...');
    const classification = await usmcaClassifier.classifyProduct(product_description);
    
    if (!classification.success || !classification.recommended) {
      return res.json({
        success: false,
        error: 'Could not classify product',
        step: 'classification'
      });
    }

    const hsCode = classification.recommended.hs_code;
    console.log(`✅ Product classified as: ${hsCode}`);

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
          hs_code: hsCode,
          classification_confidence: classification.recommended.relevance_score
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